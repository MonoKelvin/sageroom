import { useCallback, useEffect, useRef, useState } from "react"
import type { AppSnapshot, Appearance, ChatMessage, ChatRecallResult, ChatSendRequest, ChatSendResult, DomainEvent, MessagePage, Room } from "@/contracts/generated"
import { errorMessage, ipc, IpcError } from "@/app/ipc"
import { compareSequence, INITIAL_ITEM_INDEX, mergePage, PAGE_SIZE, type TimelineMessage } from "./timeline"

export type ScrollAnchor = { id: string; seq: string; offset: number }
export type SendOptions = Pick<ChatSendRequest, "quote_message_id" | "mention_ids" | "mention_all"> & {
  /** 已经组装好的内容片段（含附件）；不传时按纯文本发送。 */
  parts?: ChatSendRequest["parts"]
}
const EMPTY_SEND_OPTIONS: SendOptions = { quote_message_id: null, mention_ids: [], mention_all: false }

/** 本地占位消息的 id 前缀。界面上据此显示「发送中」并禁用撤回。 */
const PENDING_PREFIX = "pending:"

export function isPendingMessage(message: Pick<ChatMessage, "id">): boolean {
  return message.id.startsWith(PENDING_PREFIX)
}

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
  const [scrollToBottomSignal, setScrollToBottomSignal] = useState(0)
  const [pending, setPending] = useState<readonly ChatMessage[]>([])
  const pendingRef = useRef<readonly ChatMessage[]>([])
  const resolvedPending = useRef(new Map<string, string>())
  const pendingRestore = useRef(false)
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
    let items: TimelineMessage[] = next.items
    if (resolvedPending.current.size) {
      const kept = pendingRef.current.filter((item) => {
        const realId = resolvedPending.current.get(item.id)
        if (!realId) return true
        const index = items.findIndex((message) => message.id === realId)
        if (index < 0) return true
        if (items === next.items) items = items.slice()
        items[index] = { ...items[index], renderKey: item.id }
        resolvedPending.current.delete(item.id)
        return false
      })
      if (kept.length !== pendingRef.current.length) {
        pendingRef.current = kept
        setPending(kept)
      }
    }
    const applied = items === next.items ? next : { ...next, items }
    pageRef.current = applied
    firstIndexRef.current = index
    setPage(applied)
    setFirstItemIndex(index)
  }, [])

  const moveToBottom = useCallback(() => {
    atBottomRef.current = true
    setAtBottom(true)
    setHasNewMessages(false)
    setScrollToBottomSignal((value) => value + 1)
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
    pendingRestore.current = Boolean(anchor)
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
    if (!currentSnapshot || !currentPage || compareSequence(currentSnapshot.latest_message_seq, currentPage.last_seq ?? "0") <= 0) return
    if (!chatActive.current || !atBottomRef.current || currentPage.has_more_after) {
      markNewMessages()
      return
    }
    // 提交事件可能先于发送回执到达；拿到正式 ID 后再合并，同一条消息才不会显示两次。
    const awaitingReceipt = () => pendingRef.current.some((item) => !resolvedPending.current.has(item.id))
    if (awaitingReceipt()) return
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
    if (next.data_generation_id !== snapshotRef.current?.data_generation_id || awaitingReceipt() || !next.items.length) return
    if (!chatActive.current || navigation !== navigationEpoch.current || !atBottomRef.current || pageRef.current?.has_more_after) {
      markNewMessages()
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
    const merged = mergePage(visible, next, "after", firstIndexRef.current)
    assignPage(merged.page, merged.firstItemIndex)
  }, [assignPage, markNewMessages, replaceWindow])

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
      // 只有真正换了数据根才清空；同一份数据的重载交给 replaceWindow 原子替换，
      // 否则中间那一帧会把消息列表整块抽空，看起来就是一次闪白。
      if (!currentPage || previous?.data_generation_id !== next.data_generation_id) {
        pageRef.current = null
        setPage(null)
        if (pendingRef.current.length) {
          pendingRef.current = []
          resolvedPending.current.clear()
          setPending(pendingRef.current)
        }
      }
      await replaceWindow()
    } else if (previous.room.content_epoch !== next.room.content_epoch) {
      const wasAtLatest = chatActive.current && atBottomRef.current && !currentPage.has_more_after
      const anchor = renderedAnchor.current ?? (currentPage.items[0] ? { id: currentPage.items[0].id, seq: currentPage.items[0].seq, offset: 0 } : null)
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
      const merged = mergePage(visible, next, direction, firstIndexRef.current)
      assignPage(merged.page, merged.firstItemIndex)
      if (!merged.page.has_more_after && atBottomRef.current) setHasNewMessages(false)
    } catch (cause) {
      if (token === lifecycle.current) report(cause)
    } finally {
      paginationBusy.current = false
      if (token === lifecycle.current) setLoadingMore(false)
    }
  }, [assignPage, report])

  const loadOlder = useCallback(() => loadPage("before"), [loadPage])
  const loadNewer = useCallback(() => loadPage("after"), [loadPage])

  const goToLatest = useCallback(async () => {
    if (!chatActive.current) return
    const visible = pageRef.current
    if (visible && !visible.has_more_after && compareSequence(snapshotRef.current?.latest_message_seq ?? "0", visible.last_seq ?? "0") <= 0) {
      moveToBottom()
      return
    }
    const token = lifecycle.current
    const navigation = navigationEpoch.current
    const epoch = viewEpoch.current
    const isCurrent = () => token === lifecycle.current && chatActive.current && navigation === navigationEpoch.current && epoch === viewEpoch.current
    try {
      await enqueue(async () => {
        if (!isCurrent()) return
        const current = pageRef.current
        const snapshot = snapshotRef.current
        if (!current || !snapshot) return
        const after = current.last_seq ?? "0"
        const latest = compareSequence(snapshot.latest_message_seq, current.latest_message_seq) >= 0 ? snapshot.latest_message_seq : current.latest_message_seq
        if (!current.has_more_after && compareSequence(latest, after) <= 0) {
          moveToBottom()
          return
        }
        if (BigInt(latest) - BigInt(after) <= BigInt(PAGE_SIZE)) {
          const next = await ipc.list({ data_generation_id: snapshot.data_generation_id, before_seq: null, after_seq: after, around_seq: null, limit: PAGE_SIZE })
          if (!isCurrent() || next.data_generation_id !== snapshotRef.current?.data_generation_id) return
          if (!next.has_more_after && pageRef.current) {
            const merged = mergePage(pageRef.current, next, "after", firstIndexRef.current)
            assignPage(merged.page, merged.firstItemIndex)
            moveToBottom()
            return
          }
        }
        await replaceWindow(undefined, undefined, undefined, { epoch: navigation })
      })
    } catch (cause) {
      if (token === lifecycle.current) report(cause)
    }
  }, [assignPage, enqueue, moveToBottom, replaceWindow, report])

  const send = useCallback(async (text: string, requestId: string, options: SendOptions = EMPTY_SEND_OPTIONS): Promise<ChatSendResult> => {
    const current = snapshotRef.current
    if (!current) throw generationError()
    const parts: ChatSendRequest["parts"] = options.parts ?? (text.trim() ? [{ kind: "text", text }] : [])
    const placeholderId = `${PENDING_PREFIX}${requestId}`
    const placeholder: ChatMessage = {
      id: placeholderId,
      seq: placeholderId,
      sender_id: current.local_user.id,
      created_at: Date.now(),
      state: "visible",
      parts,
      quote_message_id: options.quote_message_id,
      mention_ids: options.mention_ids,
      mention_all: options.mention_all,
    }
    const navigation = navigationEpoch.current
    const fromHistory = Boolean(pageRef.current?.has_more_after)
    pendingRef.current = [...pendingRef.current, placeholder]
    setPending(pendingRef.current)
    if (chatActive.current && !fromHistory) moveToBottom()
    try {
      const result = await ipc.send({
        data_generation_id: current.data_generation_id,
        client_request_id: requestId,
        parts,
        quote_message_id: options.quote_message_id,
        mention_ids: options.mention_ids,
        mention_all: options.mention_all,
      })
      if (result.data_generation_id !== snapshotRef.current?.data_generation_id) throw generationError()
      const updated = snapshotRef.current
      if (updated && compareSequence(result.message_seq, updated.latest_message_seq) > 0) {
        assignSnapshot({ ...updated, latest_message_seq: result.message_seq })
      }
      resolvedPending.current.set(placeholderId, result.message_id)
      // 兜底：万一列表换了窗口、回执不在视野里，占位也不会一直挂在底部。
      setTimeout(() => {
        if (!resolvedPending.current.has(placeholderId)) return
        resolvedPending.current.delete(placeholderId)
        const kept = pendingRef.current.filter((item) => item.id !== placeholderId)
        if (kept.length === pendingRef.current.length) return
        pendingRef.current = kept
        setPending(kept)
      }, 8000)
      if (fromHistory && navigation === navigationEpoch.current && chatActive.current) void goToLatest()
      else void enqueue(synchronizeMessages).catch(report)
      return result
    } catch (cause) {
      pendingRef.current = pendingRef.current.filter((item) => item.id !== placeholderId)
      resolvedPending.current.delete(placeholderId)
      setPending(pendingRef.current)
      void enqueue(synchronizeMessages).catch(report)
      throw cause
    }
  }, [assignSnapshot, enqueue, goToLatest, moveToBottom, report, synchronizeMessages])

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
    if (pendingRestore.current) {
      pendingRestore.current = false
      setRestoreAnchor(null)
    }
  }, [])

  /** 当前视口顶部锚点。切换页签导致列表重挂时用它恢复位置。 */
  const liveAnchor = useCallback(() => renderedAnchor.current, [])

  const updateAtBottom = useCallback((value: boolean) => {
    atBottomRef.current = value
    setAtBottom(value)
    // 回到底部就是看完了：无论分页窗口是否仍标记“后面有消息”，新消息提示都要清掉。
    // 自己发送消息后也会走这里，否则会误弹「有新消息」。
    if (value) setHasNewMessages(false)
  }, [])

  return {
    snapshot, page, loading, loadingMore, error, hasNewMessages, atBottom,
    firstItemIndex, windowRevision, targetMessageId, restoreAnchor, scrollToBottomSignal,
    pendingMessages: pending, liveAnchor,
    reload, send, recall, goToLatest, jumpTo, updateAtBottom, updateRenderedAnchor, setChatActive, applyRoom, applyAppearance,
    loadOlder, loadNewer,
  }
}
