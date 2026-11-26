import { useCallback, useEffect, useRef, useState } from "react"
import type { AppSnapshot, Appearance, ChatMessage, ChatRecallResult, ChatSendRequest, ChatSendResult, DomainEvent, MessagePage, Room } from "@/contracts/generated"
import { errorMessage, ipc, IpcError } from "@/app/ipc"
import { compareSequence, INITIAL_ITEM_INDEX, mergePage, PAGE_SIZE } from "./timeline"

export type ScrollAnchor = { id: string; seq: string; offset: number }
export type SendOptions = Pick<ChatSendRequest, "quote_message_id" | "mention_ids" | "mention_all">
const EMPTY_SEND_OPTIONS: SendOptions = { quote_message_id: null, mention_ids: [], mention_all: false }

function generationError() {
  return new IpcError({
    code: "DATA_GENERATION_CHANGED",
    message: "聊天数据已变更，请确认当前聊天室后重新发送。",
    retryability: "after_user_action",
    field_path: null,
    trace_id: crypto.randomUUID(),
    may_have_been_charged: false,
  })
}

export function useChatSession() {
  const [snapshot, setSnapshot] = useState<AppSnapshot | null>(null)
  const [page, setPage] = useState<MessagePage | null>(null)
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [hasNewMessages, setHasNewMessages] = useState(false)
  const [atBottom, setAtBottom] = useState(true)
  const [firstItemIndex, setFirstItemIndex] = useState(INITIAL_ITEM_INDEX)
  const [windowRevision, setWindowRevision] = useState(0)
  const [targetMessageId, setTargetMessageId] = useState<string | null>(null)
  const [restoreAnchor, setRestoreAnchor] = useState<ScrollAnchor | null>(null)
  // 刚增量到达的消息，用于一次性冒出动画；不影响既有条目。
  const [enteringIds, setEnteringIds] = useState<ReadonlySet<string>>(() => new Set())
  const enteringTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const chatActive = useRef(true)
  const navigationEpoch = useRef(0)
  const snapshotRef = useRef<AppSnapshot | null>(null)
  const pageRef = useRef<MessagePage | null>(null)
  const renderedAnchor = useRef<ScrollAnchor | null>(null)
  const firstIndexRef = useRef(INITIAL_ITEM_INDEX)
  const atBottomRef = useRef(true)
  const eventCursor = useRef(0n)
  const lifecycle = useRef(0)
  const viewEpoch = useRef(0)
  const paginationBusy = useRef(false)
  const workQueue = useRef(Promise.resolve())
  const streamReady = useRef(false)
  const bufferedEvents = useRef<DomainEvent[]>([])
  const highlightTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const assignSnapshot = useCallback((next: AppSnapshot) => {
    snapshotRef.current = next
    setSnapshot(next)
  }, [])

  const assignPage = useCallback((next: MessagePage, index: number) => {
    pageRef.current = next
    firstIndexRef.current = index
    setPage(next)
    setFirstItemIndex(index)
  }, [])

  /** 标记增量到达的消息，短暂持有后释放，驱动一次性冒出动画。 */
  const markEntering = useCallback((incoming: ChatMessage[], knownSeq: string | null) => {
    const fresh = incoming
      .filter((item) => !knownSeq || compareSequence(item.seq, knownSeq) > 0)
      .map((item) => item.id)
    if (!fresh.length) return
    setEnteringIds((previous) => new Set([...previous, ...fresh]))
    if (enteringTimer.current) clearTimeout(enteringTimer.current)
    enteringTimer.current = setTimeout(() => setEnteringIds(new Set()), 600)
  }, [])

  const report = useCallback((cause: unknown) => {
    setError(errorMessage(cause))
  }, [])

  const enqueue = useCallback((operation: () => Promise<void>) => {
    const next = workQueue.current.then(operation)
    workQueue.current = next.catch(() => {})
    return next
  }, [])

  const setChatActive = useCallback((value: boolean) => {
    if (chatActive.current === value) return
    chatActive.current = value
    navigationEpoch.current += 1
  }, [])

  const replaceWindow = useCallback(async (aroundSeq?: string, targetId?: string, anchor?: ScrollAnchor, navigation?: { epoch: number; followLatest?: boolean }) => {
    const current = snapshotRef.current
    if (!current) return false
    const token = lifecycle.current
    const epoch = ++viewEpoch.current
    const next = await ipc.list({
      data_generation_id: current.data_generation_id,
      before_seq: null,
      after_seq: null,
      around_seq: aroundSeq ?? null,
      limit: PAGE_SIZE,
    })
    if (token !== lifecycle.current || epoch !== viewEpoch.current) return false
    if (next.data_generation_id !== snapshotRef.current?.data_generation_id) return false
    if (navigation && (!chatActive.current || navigation.epoch !== navigationEpoch.current || (navigation.followLatest && !atBottomRef.current))) return false
    renderedAnchor.current = anchor ?? null
    assignPage(next, INITIAL_ITEM_INDEX)
    setWindowRevision(epoch)
    setTargetMessageId(targetId ?? null)
    setRestoreAnchor(anchor ?? null)
    setHasNewMessages(false)
    atBottomRef.current = !aroundSeq
    setAtBottom(!aroundSeq)
    if (highlightTimer.current) clearTimeout(highlightTimer.current)
    if (targetId) {
      highlightTimer.current = setTimeout(() => {
        if (token === lifecycle.current) setTargetMessageId(null)
      }, 900)
    }
    return true
  }, [assignPage])

  const markNewMessages = useCallback(() => {
    setHasNewMessages(true)
    const current = pageRef.current
    if (current && !current.has_more_after) assignPage({ ...current, has_more_after: true }, firstIndexRef.current)
  }, [assignPage])

  /** 撤回只在当前窗口就地替换该条与 room，不重建窗口，避免整列表闪烁重载。 */
  const applyRecall = useCallback((messageId: string, room: Room) => {
    const snapshot = snapshotRef.current
    if (snapshot) assignSnapshot({ ...snapshot, room })
    const current = pageRef.current
    if (!current) return
    const index = current.items.findIndex((item) => item.id === messageId)
    if (index < 0 || current.items[index].state === "recalled") return
    const items = current.items.slice()
    const target = items[index]
    items[index] = { ...target, state: "recalled", parts: [], quote_message_id: null, mention_all: false, mention_ids: [] }
    assignPage({ ...current, items }, firstIndexRef.current)
  }, [assignPage, assignSnapshot])

  const synchronizeMessages = useCallback(async () => {
    const currentSnapshot = snapshotRef.current
    const currentPage = pageRef.current
    if (!currentSnapshot || !currentPage) return
    if (!chatActive.current || !atBottomRef.current || currentPage.has_more_after) {
      if (compareSequence(currentSnapshot.latest_message_seq, currentPage.last_seq ?? "0") > 0) markNewMessages()
      return
    }
    const token = lifecycle.current
    const epoch = viewEpoch.current
    const navigation = navigationEpoch.current
    const next = await ipc.list({
      data_generation_id: currentSnapshot.data_generation_id,
      before_seq: null,
      after_seq: currentPage.last_seq ?? "0",
      around_seq: null,
      limit: PAGE_SIZE,
    })
    if (token !== lifecycle.current || epoch !== viewEpoch.current) return
    if (next.data_generation_id !== snapshotRef.current?.data_generation_id) return
    if (!chatActive.current || navigation !== navigationEpoch.current || !atBottomRef.current) {
      if (next.items.length) markNewMessages()
      return
    }
    if (next.has_more_after) {
      const applied = await replaceWindow(undefined, undefined, undefined, { epoch: navigation, followLatest: true })
      const updated = snapshotRef.current
      if (!applied && token === lifecycle.current && updated && currentSnapshot.data_generation_id === updated.data_generation_id && compareSequence(updated.latest_message_seq, pageRef.current?.last_seq ?? "0") > 0) markNewMessages()
      return
    }
    const visible = pageRef.current
    if (!visible) return
    markEntering(next.items, visible.last_seq)
    const merged = mergePage(visible, next, "after", firstIndexRef.current)
    assignPage(merged.page, merged.firstItemIndex)
  }, [assignPage, markEntering, markNewMessages, replaceWindow])

  const synchronize = useCallback(async (reset = false) => {
    const token = lifecycle.current
    const previous = snapshotRef.current
    const next = await ipc.snapshot(reset || !previous ? { data_generation_id: null, last_event_seq: null } : {
      data_generation_id: previous.data_generation_id,
      last_event_seq: eventCursor.current.toString(),
    })
    if (token !== lifecycle.current) return
    assignSnapshot(next)
    eventCursor.current = BigInt(next.latest_event_seq)
    const currentPage = pageRef.current
    if (reset || !previous || previous.data_generation_id !== next.data_generation_id || !currentPage) {
      pageRef.current = null
      setPage(null)
      await replaceWindow()
    } else if (previous.room.content_epoch !== next.room.content_epoch) {
      const wasAtLatest = chatActive.current && atBottomRef.current && !currentPage.has_more_after
      const anchor = renderedAnchor.current ?? (currentPage.items[0] ? { id: currentPage.items[0].id, seq: currentPage.items[0].seq, offset: 0 } : null)
      pageRef.current = null
      setPage(null)
      if (wasAtLatest || !anchor) await replaceWindow()
      else await replaceWindow(anchor.seq, undefined, anchor)
    } else {
      await synchronizeMessages()
    }
    if (token === lifecycle.current) setError(null)
  }, [assignSnapshot, replaceWindow, synchronizeMessages])

  const processEvent = useCallback(async (event: DomainEvent) => {
    const current = snapshotRef.current
    if (!current) return
    if (event.data_generation_id !== current.data_generation_id) {
      await synchronize()
      return
    }
    const sequence = BigInt(event.event_seq)
    if (sequence <= eventCursor.current) return
    if (sequence !== eventCursor.current + 1n) {
      await synchronize()
      return
    }
    eventCursor.current = sequence
    const next: AppSnapshot = { ...current, latest_event_seq: event.event_seq }
    if (event.payload.kind === "room_changed") {
      next.room = event.payload.room
      assignSnapshot(next)
    } else if (event.payload.kind === "appearance_changed") {
      next.appearance = event.payload.appearance
      assignSnapshot(next)
    } else if (event.payload.kind === "participant_profile_changed") {
      const participant = event.payload.participant
      next.participants = current.participants.map((existing) => existing.id === participant.id ? participant : existing)
      if (current.local_user.id === participant.id) next.local_user = participant
      assignSnapshot(next)
    } else if (event.payload.kind === "agent_configuration_changed") {
      assignSnapshot(next)
      await synchronize()
    } else if (event.payload.kind === "message_changed") {
      // 撤回就地替换该条，content_epoch 的变化随 room 一起更新，不再重建整个窗口。
      applyRecall(event.payload.message_id, event.payload.room)
    } else if (event.payload.kind === "message_committed") {
      if (compareSequence(event.payload.message_seq, current.latest_message_seq) > 0) {
        next.latest_message_seq = event.payload.message_seq
      }
      assignSnapshot(next)
      await synchronizeMessages()
    } else {
      assignSnapshot(next)
    }
  }, [applyRecall, assignSnapshot, synchronize, synchronizeMessages])

  const activateEvents = useCallback((token: number) => {
    if (token !== lifecycle.current) return
    streamReady.current = true
    for (const event of bufferedEvents.current.splice(0)) {
      void enqueue(async () => {
        if (token === lifecycle.current) await processEvent(event)
      }).catch((cause: unknown) => { if (token === lifecycle.current) report(cause) })
    }
  }, [enqueue, processEvent, report])

  useEffect(() => {
    const token = ++lifecycle.current
    let unsubscribe: (() => void) | undefined
    streamReady.current = false
    bufferedEvents.current = []
    workQueue.current = Promise.resolve()
    const active = () => lifecycle.current === token
    async function initialize() {
      try {
        unsubscribe = await ipc.subscribe((event) => {
          if (!active()) return
          if (!streamReady.current) {
            bufferedEvents.current.push(event)
            if (bufferedEvents.current.length > 256) bufferedEvents.current.shift()
          } else {
            void enqueue(async () => {
              if (active()) await processEvent(event)
            }).catch((cause: unknown) => { if (active()) report(cause) })
          }
        }, (cause) => {
          if (!active()) return
          report(cause)
          void enqueue(() => synchronize()).catch((failure: unknown) => { if (active()) report(failure) })
        })
        if (!active()) {
          unsubscribe()
          return
        }
        await synchronize(true)
        if (!active()) return
        activateEvents(token)
      } catch (cause) {
        if (active()) report(cause)
      } finally {
        if (active()) setLoading(false)
      }
    }
    void initialize()
    const onFocus = () => {
      if (streamReady.current) void enqueue(() => synchronize()).catch((cause: unknown) => { if (active()) report(cause) })
    }
    window.addEventListener("focus", onFocus)
    return () => {
      lifecycle.current += 1
      streamReady.current = false
      bufferedEvents.current = []
      unsubscribe?.()
      window.removeEventListener("focus", onFocus)
      if (highlightTimer.current) clearTimeout(highlightTimer.current)
      if (enteringTimer.current) clearTimeout(enteringTimer.current)
    }
  }, [activateEvents, enqueue, processEvent, report, synchronize])

  const reload = useCallback(async () => {
    const token = lifecycle.current
    setLoading(true)
    try {
      await enqueue(async () => { if (token === lifecycle.current) await synchronize() })
      activateEvents(token)
    } catch (cause) {
      if (token === lifecycle.current) report(cause)
    } finally {
      if (token === lifecycle.current) setLoading(false)
    }
  }, [activateEvents, enqueue, report, synchronize])

  const loadPage = useCallback(async (direction: "before" | "after") => {
    const current = pageRef.current
    const currentSnapshot = snapshotRef.current
    if (!chatActive.current || !current || !currentSnapshot || paginationBusy.current) return
    if (direction === "before" ? !current.has_more_before : !current.has_more_after) return
    paginationBusy.current = true
    setLoadingMore(true)
    const token = lifecycle.current
    const epoch = viewEpoch.current
    const navigation = navigationEpoch.current
    try {
      const next = await ipc.list({
        data_generation_id: currentSnapshot.data_generation_id,
        before_seq: direction === "before" ? current.first_seq : null,
        after_seq: direction === "after" ? current.last_seq ?? "0" : null,
        around_seq: null,
        limit: PAGE_SIZE,
      })
      if (token !== lifecycle.current || epoch !== viewEpoch.current || next.data_generation_id !== snapshotRef.current?.data_generation_id) return
      if (!chatActive.current || navigation !== navigationEpoch.current) return
      const visible = pageRef.current
      if (!visible) return
      if (direction === "after") markEntering(next.items, visible.last_seq)
      const merged = mergePage(visible, next, direction, firstIndexRef.current)
      assignPage(merged.page, merged.firstItemIndex)
      if (!merged.page.has_more_after && atBottomRef.current) setHasNewMessages(false)
    } catch (cause) {
      if (token === lifecycle.current) report(cause)
    } finally {
      paginationBusy.current = false
      if (token === lifecycle.current) setLoadingMore(false)
    }
  }, [assignPage, markEntering, report])

  const send = useCallback(async (text: string, requestId: string, options: SendOptions = EMPTY_SEND_OPTIONS): Promise<ChatSendResult> => {
    const current = snapshotRef.current
    if (!current) throw generationError()
    const result = await ipc.send({
      data_generation_id: current.data_generation_id,
      client_request_id: requestId,
      parts: [{ kind: "text", text }],
      quote_message_id: options.quote_message_id,
      mention_ids: options.mention_ids,
      mention_all: options.mention_all,
    })
    if (result.data_generation_id !== snapshotRef.current?.data_generation_id) throw generationError()
    const updated = snapshotRef.current
    if (updated && compareSequence(result.message_seq, updated.latest_message_seq) > 0) {
      assignSnapshot({ ...updated, latest_message_seq: result.message_seq })
    }
    void enqueue(() => synchronizeMessages()).catch(report)
    return result
  }, [assignSnapshot, enqueue, report, synchronizeMessages])

  const recall = useCallback(async (messageId: string, requestId: string): Promise<ChatRecallResult> => {
    const current = snapshotRef.current
    if (!current) throw generationError()
    const result = await ipc.recall({ data_generation_id: current.data_generation_id, client_request_id: requestId, message_id: messageId })
    if (result.data_generation_id !== snapshotRef.current?.data_generation_id) throw generationError()
    // 就地更新，避免撤回时整个消息列表重新加载闪烁。
    applyRecall(messageId, result.room)
    return result
  }, [applyRecall])

  const applyRoom = useCallback((room: Room, generation: string) => {
    const current = snapshotRef.current
    if (current?.data_generation_id === generation && current.room.id === room.id && compareSequence(room.version, current.room.version) >= 0) {
      assignSnapshot({ ...current, room })
    }
  }, [assignSnapshot])

  const applyAppearance = useCallback((appearance: Appearance, generation: string) => {
    const current = snapshotRef.current
    if (current?.data_generation_id === generation && compareSequence(appearance.revision, current.appearance.revision) >= 0) {
      assignSnapshot({ ...current, appearance })
    }
  }, [assignSnapshot])

  const goToLatest = useCallback(async () => {
    if (!chatActive.current) return
    try {
      await replaceWindow(undefined, undefined, undefined, { epoch: navigationEpoch.current })
    } catch (cause) {
      report(cause)
    }
  }, [replaceWindow, report])

  const jumpTo = useCallback(async (seq: string, id: string) => {
    if (!chatActive.current) return
    try {
      await replaceWindow(seq, id, undefined, { epoch: navigationEpoch.current })
    } catch (cause) {
      report(cause)
      throw cause
    }
  }, [replaceWindow, report])

  const updateRenderedAnchor = useCallback((anchor: ScrollAnchor) => {
    renderedAnchor.current = anchor
  }, [])

  const updateAtBottom = useCallback((value: boolean) => {
    atBottomRef.current = value
    setAtBottom(value)
    // 回到底部就是看完了：无论分页窗口是否仍标记“后面有消息”，新消息提示都要清掉。
    // 自己发送消息后也会走这里，否则会误弹「有新消息」。
    if (value) setHasNewMessages(false)
  }, [])

  return {
    snapshot, page, loading, loadingMore, error, hasNewMessages, atBottom,
    firstItemIndex, windowRevision, targetMessageId, restoreAnchor, enteringIds,
    reload, send, recall, goToLatest, jumpTo, updateAtBottom, updateRenderedAnchor, setChatActive, applyRoom, applyAppearance,
    loadOlder: () => loadPage("before"),
    loadNewer: () => loadPage("after"),
  }
}
