import { memo, useCallback, useEffect, useLayoutEffect, useRef, useState } from "react"
import { Virtuoso, type StateSnapshot, type VirtuosoHandle } from "react-virtuoso"
import { IconArrowDown, IconCopy, IconQuote, IconTrash } from "@tabler/icons-react"
import type { ChatMessage, MessagePage, Participant } from "@/contracts/generated"
import { Button } from "@/components/ui/button"
import { ContextMenu, type ContextMenuItem } from "@/components/ui/context-menu"
import { useToast } from "@/components/ui/toast-context"
import { errorMessage } from "@/app/ipc"
import { Avatar } from "@/components/Avatar"
import { cn } from "@/lib/utils"
import type { ScrollAnchor } from "./useChatSession"
import { formatMessageTime, shouldInsertTimeTag } from "./message-time"
import { SystemMessageTag } from "./SystemMessageTag"

const RECALL_WINDOW_MS = 180_000

type ListContext = { loadingMore: boolean; hasMoreBefore: boolean }
type SavedScroll = { state: StateSnapshot; anchor: ScrollAnchor | null }

function ListHeader({ context }: { context: ListContext }) {
  return <div className="chat-list-notice">{context.loadingMore ? "正在读取历史…" : context.hasMoreBefore ? "向上浏览更早消息" : "已到最早的消息"}</div>
}

function ListFooter() {
  return <div className="chat-list-footer" />
}

const listComponents = { Header: ListHeader, Footer: ListFooter }

function messageText(message: ChatMessage): string {
  return message.parts.flatMap((part) => part.kind === "text" ? [part.text] : []).join("")
}

type MessageActions = {
  quotes?: ReadonlyMap<string, ChatMessage>
  onQuote?: (message: ChatMessage) => void
  onRecall?: (messageId: string, requestId: string) => Promise<unknown>
  onLocateQuote?: (seq: string, id: string) => Promise<void>
}

const MessageRow = memo(function MessageRow({ message, participant, participants, self, highlighted, entering, generation, quotes, onQuote, onRecall, onLocateQuote }: {
  message: ChatMessage; participant: Participant; participants: ReadonlyMap<string, Participant>; self: boolean; highlighted: boolean; entering: boolean; generation?: string
} & MessageActions) {
  const toast = useToast()
  const [pending, setPending] = useState(false)
  const [feedback, setFeedback] = useState<{ text: string; error: boolean } | null>(null)
  const recallRequest = useRef<string | null>(null)
  const quoted = useRef(false)
  const alive = useRef(false)
  const recallDeadline = message.created_at + RECALL_WINDOW_MS
  const [recallExpired, setRecallExpired] = useState(() => Date.now() >= recallDeadline)
  const canRecall = self && Boolean(onRecall) && message.state === "visible" && !recallExpired
  useEffect(() => { alive.current = true; return () => { alive.current = false } }, [])
  useEffect(() => {
    if (!self || !onRecall || message.state !== "visible") return
    let timer = setTimeout(refresh, Math.max(0, Math.min(RECALL_WINDOW_MS, recallDeadline - Date.now())))
    function refresh() {
      const remaining = recallDeadline - Date.now()
      setRecallExpired(remaining <= 0)
      clearTimeout(timer)
      if (remaining > 0) timer = setTimeout(refresh, Math.min(RECALL_WINDOW_MS, remaining))
    }
    window.addEventListener("focus", refresh)
    document.addEventListener("visibilitychange", refresh)
    return () => { clearTimeout(timer); window.removeEventListener("focus", refresh); document.removeEventListener("visibilitychange", refresh) }
  }, [self, onRecall, message.state, recallDeadline])
  const resolvedQuote = message.quote_message_id ? quotes?.get(message.quote_message_id) : null
  const original = resolvedQuote?.state === "visible" ? resolvedQuote : null
  const quoteName = original ? participants.get(original.sender_id)?.display_name : null

  async function copy() {
    setFeedback(null)
    try {
      await navigator.clipboard.writeText(messageText(message))
    } catch { if (alive.current) toast.error("复制失败，请重试。") }
  }

  async function recall() {
    if (!onRecall || pending || !canRecall) return
    if (Date.now() >= recallDeadline && !recallRequest.current) { setRecallExpired(true); return }
    recallRequest.current ??= crypto.randomUUID()
    setPending(true)
    setFeedback(null)
    try {
      await onRecall(message.id, recallRequest.current)
      recallRequest.current = null
    } catch { /* 失败时保留原消息与请求 ID，不向聊天插入错误提示。 */ }
    finally { if (alive.current) setPending(false) }
  }

  async function locateQuote() {
    if (!original || !onLocateQuote) return
    try { await onLocateQuote(original.seq, original.id) }
    catch (cause) { if (alive.current) setFeedback({ text: errorMessage(cause), error: true }) }
  }

  const menuItems: ContextMenuItem[] = message.state === "visible" ? [
    { key: "copy", icon: <IconCopy size={16} aria-hidden="true" />, label: "复制", onSelect: () => void copy() },
    ...(onQuote ? [{ key: "quote", icon: <IconQuote size={16} aria-hidden="true" />, label: "引用", onSelect: () => { quoted.current = true; setFeedback(null); onQuote(message) } }] : []),
    ...(canRecall ? [{ key: "recall", icon: <IconTrash size={16} aria-hidden="true" />, label: "撤回", variant: "destructive" as const, onSelect: () => void recall() }] : []),
  ] : []
  // 右键菜单只作用于消息气泡本身，条目整行的空白处不触发；菜单限制在聊天窗口内。
  const bubbleRef = useRef<HTMLDivElement | null>(null)
  const chatBoundary = useCallback(() => bubbleRef.current?.closest<HTMLElement>(".chat-card") ?? null, [])

  return (
    <article data-message-id={message.id} data-message-seq={message.seq} className={cn("chat-message", highlighted && "chat-message-highlight", entering && "chat-message-enter")} aria-label={`${participant.display_name}的消息`}>
      {message.state === "recalled" ? <SystemMessageTag kind="recall">{participant.display_name}撤回了一条消息</SystemMessageTag> : <div className="chat-message-row" data-self={self}>
        <div className="chat-message-avatar"><Avatar name={participant.display_name} avatarId={participant.avatar_id} colorId={participant.kind === "agent" ? participant.id : undefined} generation={generation} size={40} radius={10} /></div>
        <div className="chat-message-stack">
          {!self && <span className="chat-message-name">{participant.display_name}</span>}
          <ContextMenu
            items={menuItems}
            label={`消息操作 ${message.seq}`}
            disabled={pending}
            boundary={chatBoundary}
            onCloseAutoFocus={(event) => { if (quoted.current) { event.preventDefault(); quoted.current = false } }}
          >
            <div ref={bubbleRef} className={cn("chat-message-bubble", self ? "chat-message-bubble-self" : "chat-message-bubble-other")}>
              {message.state === "visible" && message.quote_message_id && <button type="button" className="chat-message-quote" disabled={!original || !onLocateQuote} aria-label={original ? `定位引用 ${quoteName ?? "成员"}的消息` : "原消息不可用"} onClick={() => void locateQuote()}><strong>{quoteName ?? "引用"}</strong><span>{original?.state === "visible" ? messageText(original).slice(0, 120) : "原消息不可用"}</span></button>}
              {message.state === "visible" ? messageText(message) : "消息已删除"}
              {message.state === "visible" && (message.mention_all || message.mention_ids.length > 0) && <div className="chat-message-mentions">{message.mention_all ? <span>@所有人</span> : message.mention_ids.map((id) => <span key={id}>@{participants.get(id)?.display_name ?? "已离开成员"}</span>)}</div>}
            </div>
          </ContextMenu>
          {feedback && <p className="chat-message-feedback" data-error={feedback.error} role={feedback.error ? "alert" : "status"}>{feedback.text}</p>}
        </div>
        <time className="chat-message-time" dateTime={new Date(message.created_at).toISOString()}>{formatMessageTime(message.created_at)}</time>
      </div>}
    </article>
  )
})

type Props = MessageActions & {
  active?: boolean
  generation?: string
  page: MessagePage
  participants: ReadonlyMap<string, Participant>
  localUserId: string
  firstItemIndex: number
  targetMessageId: string | null
  restoreAnchor: ScrollAnchor | null
  enteringIds?: ReadonlySet<string>
  followLatest: boolean
  hasNewMessages: boolean
  scrollToBottomSignal?: number
  loadingMore: boolean
  onLoadOlder: () => Promise<void>
  onLoadNewer: () => Promise<void>
  onAtBottomChange: (value: boolean) => void
  onRenderedAnchorChange: (anchor: ScrollAnchor) => void
  onGoToLatest: () => Promise<void>
}

type ViewportProps = Props & {
  initialSaved: SavedScroll | null
}

function MessageViewport({
  generation, page, participants, localUserId, firstItemIndex, targetMessageId, restoreAnchor, enteringIds, followLatest,
  scrollToBottomSignal = 0, loadingMore, onLoadOlder, onLoadNewer, onAtBottomChange, onRenderedAnchorChange, initialSaved,
  quotes, onQuote, onRecall, onLocateQuote,
}: ViewportProps) {
  // 滚动恢复状态由本组件独占；卸载后由 restoreAnchor/targetMessageId 重新定位。
  const saved = useRef<SavedScroll | null>(initialSaved)
  const consumedSignal = useRef(scrollToBottomSignal)
  const list = useRef<VirtuosoHandle>(null)
  const userScrolling = useRef(false)
  const ready = useRef(false)
  const captureFrame = useRef(0)
  const captureStateOnFrame = useRef(false)
  const [scrollElement, setScrollElement] = useState<HTMLElement | null>(null)
  const [settled, setSettled] = useState(false)
  const [initialState] = useState(initialSaved)
  const [initialLocation] = useState(() => {
    const id = restoreAnchor?.id ?? targetMessageId
    return id ? { index: Math.max(0, page.items.findIndex((message) => message.id === id)), align: "start" as const } : { index: "LAST" as const, align: "end" as const }
  })

  const capture = useCallback((saveState = false) => {
    if (!ready.current || !scrollElement || scrollElement.clientHeight === 0) return
    const viewportTop = scrollElement.getBoundingClientRect().top
    let anchor: ScrollAnchor | null = null
    for (const article of scrollElement.querySelectorAll<HTMLElement>("[data-message-id]")) {
      const rect = article.getBoundingClientRect()
      if (rect.bottom <= viewportTop) continue
      anchor = { id: article.dataset.messageId!, seq: article.dataset.messageSeq!, offset: rect.top - viewportTop }
      break
    }
    if (anchor) onRenderedAnchorChange(anchor)
    const scrollTop = scrollElement.scrollTop
    if (saveState) {
      list.current?.getState((state) => { saved.current = { state: { ...state, scrollTop }, anchor } })
    } else if (saved.current) {
      saved.current = { state: { ...saved.current.state, scrollTop }, anchor }
    }
  }, [onRenderedAnchorChange, saved, scrollElement])

  const scheduleCapture = useCallback(() => {
    if (!ready.current || captureFrame.current) return
    captureFrame.current = requestAnimationFrame(() => {
      captureFrame.current = 0
      const saveState = captureStateOnFrame.current
      captureStateOnFrame.current = false
      capture(saveState)
    })
  }, [capture])

  const scheduleStateCapture = useCallback(() => {
    if (!ready.current) return
    captureStateOnFrame.current = true
    scheduleCapture()
  }, [scheduleCapture])

  const handleScrollerRef = useCallback((node: HTMLElement | null | Window) => {
    setScrollElement(node instanceof HTMLElement ? node : null)
  }, [])

  useLayoutEffect(() => {
    if (!scrollElement) return
    ready.current = false
    scrollElement.addEventListener("scroll", scheduleCapture, { passive: true })
    let secondFrame = 0
    const firstFrame = requestAnimationFrame(() => {
      secondFrame = requestAnimationFrame(() => {
        const anchor = initialState?.anchor ?? restoreAnchor
        if (anchor) {
          const article = Array.from(scrollElement.querySelectorAll<HTMLElement>("[data-message-id]")).find((node) => node.dataset.messageId === anchor.id)
          if (article) {
            const adjustment = article.getBoundingClientRect().top - scrollElement.getBoundingClientRect().top - anchor.offset
            scrollElement.scrollTop += adjustment
          }
        }
        ready.current = true
        setSettled(true)
        capture(true)
      })
    })
    return () => {
      capture(true)
      ready.current = false
      cancelAnimationFrame(firstFrame)
      cancelAnimationFrame(secondFrame)
      cancelAnimationFrame(captureFrame.current)
      captureFrame.current = 0
      captureStateOnFrame.current = false
      scrollElement.removeEventListener("scroll", scheduleCapture)
    }
  }, [capture, initialState, restoreAnchor, scheduleCapture, scrollElement])

  useEffect(() => {
    if (!settled || !scrollElement || scrollToBottomSignal <= consumedSignal.current) return
    const frame = requestAnimationFrame(() => {
      consumedSignal.current = scrollToBottomSignal
      userScrolling.current = false
      list.current?.scrollToIndex({ index: "LAST", align: "end", behavior: "auto" })
    })
    return () => cancelAnimationFrame(frame)
  }, [consumedSignal, scrollElement, scrollToBottomSignal, settled])

  return <Virtuoso<ChatMessage, ListContext>
    ref={list}
    scrollerRef={handleScrollerRef}
    className="chat-list-scroller"
    context={{ loadingMore, hasMoreBefore: page.has_more_before }}
    style={{ height: "100%" }}
    data={page.items}
    firstItemIndex={firstItemIndex}
    restoreStateFrom={initialState?.state}
    initialTopMostItemIndex={initialState ? undefined : initialLocation}
    computeItemKey={(_, message) => message.id}
    defaultItemHeight={88}
    increaseViewportBy={{ top: 300, bottom: 300 }}
    overscan={{ main: 160, reverse: 80 }}
    minOverscanItemCount={{ top: 2, bottom: 2 }}
    atBottomThreshold={24}
    atBottomStateChange={(value) => { if (ready.current) onAtBottomChange(value) }}
    isScrolling={(value) => { userScrolling.current = value; if (!value) capture(true) }}
    rangeChanged={scheduleStateCapture}
    totalListHeightChanged={scheduleStateCapture}
    onWheel={(event) => {
      if (!ready.current || !scrollElement) return
      if (event.deltaY < 0 && scrollElement.scrollTop <= 24 && page.has_more_before) void onLoadOlder()
      if (event.deltaY > 0 && scrollElement.scrollHeight - scrollElement.clientHeight - scrollElement.scrollTop <= 24 && page.has_more_after) void onLoadNewer()
    }}
    followOutput={(atBottom) => {
      if (!ready.current || targetMessageId || !followLatest || !atBottom || userScrolling.current) return false
      return document.documentElement.dataset.reducedMotion === "true" || window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth"
    }}
    startReached={() => { if (ready.current && page.has_more_before) void onLoadOlder() }}
    endReached={() => { if (ready.current && page.has_more_after) void onLoadNewer() }}
    components={listComponents}
    itemContent={(index, message) => {
      const previous = page.items[index - firstItemIndex - 1]
      return <>
        {shouldInsertTimeTag(previous?.created_at, message.created_at) && <SystemMessageTag kind="time">{formatMessageTime(message.created_at)}</SystemMessageTag>}
        <MessageRow message={message} participant={participants.get(message.sender_id)!} participants={participants} self={message.sender_id === localUserId} highlighted={message.id === targetMessageId} entering={enteringIds?.has(message.id) ?? false} generation={generation} quotes={quotes} onQuote={onQuote} onRecall={onRecall} onLocateQuote={onLocateQuote} />
      </>
    }}
  />
}

export function MessageList(props: Props) {
  return <section aria-label="聊天记录" className="relative flex min-h-0 flex-1 flex-col">
    {props.page.items.length > 0 && (props.active ?? true) && <MessageViewport {...props} initialSaved={null} />}
    {(props.hasNewMessages || props.page.has_more_after) && <div className="chat-latest-position">
      <Button size="sm" variant="secondary" className="chat-latest-button" onClick={() => void props.onGoToLatest()}>
        <IconArrowDown size={16} aria-hidden="true" />
        {props.hasNewMessages ? "有新消息" : "回到最新"}
      </Button>
    </div>}
  </section>
}
