import { memo, useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react"
import { Virtuoso } from "react-virtuoso"
import { IconArrowDown, IconAt, IconCopy, IconInfoCircle, IconQuote, IconTrash } from "@tabler/icons-react"
import type { ChatMessage, MessagePage, Participant } from "@/contracts/generated"
import { Button } from "@/components/ui/button"
import { ContextMenu, type ContextMenuItem } from "@/components/ui/context-menu"
import { useToast } from "@/components/ui/toast-context"
import { errorMessage } from "@/app/ipc"
import { Avatar } from "@/components/Avatar"
import { cn } from "@/lib/utils"
import { MessageAttachments } from "./MessageAttachments"
import type { TimelineMessage } from "./timeline"
import type { ScrollAnchor } from "./useChatSession"
import { isPendingMessage } from "./useChatSession"
import { formatMessageTime, shouldInsertTimeTag } from "./message-time"
import { SystemMessageTag } from "./SystemMessageTag"

const RECALL_WINDOW_MS = 180_000
const BOTTOM_THRESHOLD = 24

type ListContext = { loadingMore: boolean; hasMoreBefore: boolean }

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
  /** 右键头像：把 @他 塞进输入框。 */
  onMentionParticipant?: (participant: Participant) => void
  /** 右键头像：打开成员信息。 */
  onInspectParticipant?: (participantId: string) => void
}

const MessageRow = memo(function MessageRow({ message, participant, participants, self, highlighted, generation, resolvedQuote, onQuote, onRecall, onLocateQuote, onMentionParticipant, onInspectParticipant }: {
  message: ChatMessage; participant: Participant; participants: ReadonlyMap<string, Participant>; self: boolean; highlighted: boolean; generation?: string; resolvedQuote?: ChatMessage
} & Omit<MessageActions, "quotes">) {
  const toast = useToast()
  const [pending, setPending] = useState(false)
  const [feedback, setFeedback] = useState<{ text: string; error: boolean } | null>(null)
  const recallRequest = useRef<string | null>(null)
  const quoted = useRef(false)
  const alive = useRef(false)
  const recallDeadline = message.created_at + RECALL_WINDOW_MS
  const [recallExpired, setRecallExpired] = useState(() => Date.now() >= recallDeadline)
  // 本地占位消息还没拿到服务端回执，不能撤回，也不给右键菜单。
  const pendingMessage = isPendingMessage(message)
  const canRecall = self && Boolean(onRecall) && message.state === "visible" && !recallExpired && !pendingMessage
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
  const original = resolvedQuote?.state === "visible" ? resolvedQuote : null
  const quoteName = original ? participants.get(original.sender_id)?.display_name : null
  const text = message.state === "visible" ? messageText(message) : ""
  const attachments = message.state === "visible"
    ? message.parts.flatMap((part) => part.kind === "attachment" ? [part.attachment] : [])
    : []

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

  const menuItems: ContextMenuItem[] = pendingMessage ? [] : message.state === "visible" ? [
    { key: "copy", icon: <IconCopy size={16} aria-hidden="true" />, label: "复制", onSelect: () => void copy() },
    ...(onQuote ? [{ key: "quote", icon: <IconQuote size={16} aria-hidden="true" />, label: "引用", onSelect: () => { quoted.current = true; setFeedback(null); onQuote(message) } }] : []),
    ...(canRecall ? [{ key: "recall", icon: <IconTrash size={16} aria-hidden="true" />, label: "撤回", variant: "destructive" as const, onSelect: () => void recall() }] : []),
  ] : []
  // 右键菜单只作用于消息气泡本身，条目整行的空白处不触发；菜单限制在聊天窗口内。
  const bubbleRef = useRef<HTMLDivElement | null>(null)
  const chatBoundary = useCallback(() => bubbleRef.current?.closest<HTMLElement>(".chat-card") ?? null, [])

  return (
    <article data-message-id={message.id} data-message-seq={message.seq} data-pending={pendingMessage || undefined} className={cn("chat-message", highlighted && "chat-message-highlight")} aria-label={`${participant.display_name}的消息`}>
      {message.state === "recalled" ? <SystemMessageTag kind="recall">{participant.display_name}撤回了一条消息</SystemMessageTag> : <div className="chat-message-row" data-self={self}>
        <ContextMenu
          label={`${participant.display_name} 的头像操作`}
          items={[
            ...(self || !onMentionParticipant ? [] : [{ key: "mention", icon: <IconAt size={16} aria-hidden="true" />, label: `@${participant.display_name}`, onSelect: () => onMentionParticipant(participant) }]),
            { key: "inspect", icon: <IconInfoCircle size={16} aria-hidden="true" />, label: "查看信息", disabled: !onInspectParticipant, onSelect: () => onInspectParticipant?.(participant.id) },
          ]}
          boundary={chatBoundary}
        >
          <div className="chat-message-avatar"><Avatar name={participant.display_name} avatarId={participant.avatar_id} colorId={participant.kind === "agent" ? participant.id : undefined} generation={generation} size={40} radius={10} /></div>
        </ContextMenu>
        <div className="chat-message-stack">
          {!self && <span className="chat-message-name">{participant.display_name}</span>}
          <ContextMenu
            items={menuItems}
            label={`消息操作 ${message.seq}`}
            disabled={pending}
            boundary={chatBoundary}
            onCloseAutoFocus={(event) => { if (quoted.current) { event.preventDefault(); quoted.current = false } }}
          >
            <div ref={bubbleRef} className={cn("chat-message-bubble", self ? "chat-message-bubble-self" : "chat-message-bubble-other")} data-media={attachments.length > 0 && !text ? "" : undefined}>
              {message.state === "visible" && message.quote_message_id && <button type="button" className="chat-message-quote" disabled={!original || !onLocateQuote} aria-label={original ? `定位引用 ${quoteName ?? "成员"}的消息` : "原消息不可用"} onClick={() => void locateQuote()}><strong>{quoteName ?? "引用"}</strong><span>{original?.state === "visible" ? messageText(original).slice(0, 120) : "原消息不可用"}</span></button>}
              {attachments.length > 0 && <MessageAttachments generation={generation ?? null} attachments={attachments} />}
              {message.state === "visible" ? (text && <span className="chat-message-text">{text}</span>) : "消息已删除"}
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
  getRenderedAnchor?: () => ScrollAnchor | null
  followLatest: boolean
  hasNewMessages: boolean
  /** 停留期间新到达的条数，用于底部提示；为 0 时退化为通用文案。 */
  newMessageCount: number
  /** 顶部未读入口优先，或第一条未读已在视口内时，底部胶囊整体让位。 */
  hideLatestNotice?: boolean
  scrollToBottomSignal?: number
  loadingMore: boolean
  onLoadOlder: () => Promise<void>
  onLoadNewer: () => Promise<void>
  onAtBottomChange: (value: boolean) => void
  onRenderedAnchorChange: (anchor: ScrollAnchor) => void
  onGoToLatest: () => Promise<void>
}

type ViewportProps = Omit<Props, "active" | "hasNewMessages" | "newMessageCount" | "hideLatestNotice" | "onGoToLatest">

const messageKey = (_: number, message: TimelineMessage) => message.renderKey ?? message.id

const MessageViewport = memo(function MessageViewport({
  generation, page, participants, localUserId, firstItemIndex, targetMessageId, restoreAnchor, getRenderedAnchor, followLatest,
  scrollToBottomSignal = 0, loadingMore, onLoadOlder, onLoadNewer, onAtBottomChange, onRenderedAnchorChange,
  quotes, onQuote, onRecall, onLocateQuote, onMentionParticipant, onInspectParticipant,
}: ViewportProps) {
  const [scrollElement, setScrollElement] = useState<HTMLElement | null>(null)
  const consumedSignal = useRef(scrollToBottomSignal)
  const pinned = useRef(followLatest && !targetMessageId && !restoreAnchor)
  const hasMoreAfter = useRef(page.has_more_after)
  const bottomFrame = useRef(0)
  const [initialLocation] = useState(() => {
    const anchor = restoreAnchor ?? (!followLatest && !targetMessageId ? getRenderedAnchor?.() : null)
    const id = anchor?.id ?? targetMessageId
    return id
      ? { index: Math.max(0, page.items.findIndex((message) => message.id === id)), align: "start" as const, offset: -(anchor?.offset ?? 0) }
      : { index: "LAST" as const, align: "end" as const }
  })
  const context = useMemo(() => ({ loadingMore, hasMoreBefore: page.has_more_before }), [loadingMore, page.has_more_before])
  const capture = useCallback(() => {
    if (!scrollElement?.clientHeight) return
    const viewportTop = scrollElement.getBoundingClientRect().top
    for (const row of scrollElement.querySelectorAll<HTMLElement>("[data-item-index]")) {
      const rect = row.getBoundingClientRect()
      if (rect.bottom <= viewportTop) continue
      const article = row.querySelector<HTMLElement>("[data-message-id]:not([data-pending])")
      if (!article) continue
      onRenderedAnchorChange({ id: article.dataset.messageId!, seq: article.dataset.messageSeq!, offset: rect.top - viewportTop })
      break
    }
  }, [onRenderedAnchorChange, scrollElement])

  const keepBottom = useCallback(() => {
    if (!scrollElement || !pinned.current || hasMoreAfter.current || bottomFrame.current) return
    bottomFrame.current = requestAnimationFrame(() => {
      bottomFrame.current = 0
      if (!pinned.current || hasMoreAfter.current) return
      const bottom = scrollElement.scrollHeight - scrollElement.clientHeight
      if (bottom > scrollElement.scrollTop) scrollElement.scrollTop = bottom
    })
  }, [scrollElement])

  useLayoutEffect(() => {
    if (!scrollElement) return
    let lastTop = scrollElement.scrollTop
    const trackScroll = () => {
      const top = scrollElement.scrollTop
      const atEnd = scrollElement.scrollHeight - scrollElement.clientHeight - top <= BOTTOM_THRESHOLD
      // 尺寸变化会扩大尾部间距，但不会像主动向上滚那样降低 scrollTop。
      if ((atEnd || top < lastTop) && atEnd !== pinned.current) {
        pinned.current = atEnd
        onAtBottomChange(atEnd)
      }
      if (top > lastTop && atEnd && hasMoreAfter.current) void onLoadNewer()
      lastTop = top
    }
    scrollElement.addEventListener("scroll", trackScroll, { passive: true })
    const observer = typeof ResizeObserver === "undefined" ? null : new ResizeObserver(keepBottom)
    observer?.observe(scrollElement)
    return () => {
      scrollElement.removeEventListener("scroll", trackScroll)
      observer?.disconnect()
      cancelAnimationFrame(bottomFrame.current)
      bottomFrame.current = 0
      capture()
    }
  }, [capture, keepBottom, onAtBottomChange, onLoadNewer, scrollElement])

  useLayoutEffect(() => {
    if (!scrollElement) return
    hasMoreAfter.current = page.has_more_after
    if (consumedSignal.current !== scrollToBottomSignal) {
      consumedSignal.current = scrollToBottomSignal
      pinned.current = true
    }
    keepBottom()
  }, [keepBottom, page.has_more_after, page.items, scrollElement, scrollToBottomSignal])

  const handleScrollerRef = useCallback((node: HTMLElement | null | Window) => {
    setScrollElement(node instanceof HTMLElement ? node : null)
  }, [])
  const handleScrolling = useCallback((scrolling: boolean) => { if (!scrolling) capture() }, [capture])
  const itemContent = useCallback((index: number, message: TimelineMessage) => {
    const previous = page.items[index - firstItemIndex - 1]
    return <>
      {shouldInsertTimeTag(previous?.created_at, message.created_at) && <SystemMessageTag kind="time">{formatMessageTime(message.created_at)}</SystemMessageTag>}
      <MessageRow message={message} participant={participants.get(message.sender_id)!} participants={participants} self={message.sender_id === localUserId} highlighted={message.id === targetMessageId} generation={generation} resolvedQuote={message.quote_message_id ? quotes?.get(message.quote_message_id) : undefined} onQuote={onQuote} onRecall={onRecall} onLocateQuote={onLocateQuote} onMentionParticipant={onMentionParticipant} onInspectParticipant={onInspectParticipant} />
    </>
  }, [firstItemIndex, generation, localUserId, onInspectParticipant, onLocateQuote, onMentionParticipant, onQuote, onRecall, page.items, participants, quotes, targetMessageId])

  return <Virtuoso<TimelineMessage, ListContext>
    scrollerRef={handleScrollerRef}
    className="chat-list-scroller"
    context={context}
    data={page.items}
    firstItemIndex={firstItemIndex}
    initialTopMostItemIndex={initialLocation}
    computeItemKey={messageKey}
    defaultItemHeight={88}
    increaseViewportBy={{ top: 300, bottom: 300 }}
    overscan={{ main: 160, reverse: 80 }}
    minOverscanItemCount={{ top: 2, bottom: 2 }}
    isScrolling={handleScrolling}
    totalListHeightChanged={keepBottom}
    onWheel={(event) => {
      if (!scrollElement) return
      if (event.deltaY < 0 && scrollElement.scrollTop <= BOTTOM_THRESHOLD && page.has_more_before) void onLoadOlder()
      if (event.deltaY > 0 && scrollElement.scrollHeight - scrollElement.clientHeight - scrollElement.scrollTop <= BOTTOM_THRESHOLD && page.has_more_after) void onLoadNewer()
    }}
    startReached={() => { if (scrollElement && page.has_more_before && !pinned.current) void onLoadOlder() }}
    components={listComponents}
    itemContent={itemContent}
  />
})

export const MessageList = memo(function MessageList({ active = true, hasNewMessages, newMessageCount, hideLatestNotice, onGoToLatest, ...viewport }: Props) {
  return <section aria-label="聊天记录" className="relative flex min-h-0 flex-1 flex-col">
    {viewport.page.items.length > 0 && active && <MessageViewport {...viewport} />}
    {!hideLatestNotice && (hasNewMessages || viewport.page.has_more_after) && <div className="chat-latest-position">
      <Button size="sm" variant="secondary" className="chat-latest-button" onClick={() => void onGoToLatest()}>
        <IconArrowDown size={16} aria-hidden="true" />
        {hasNewMessages ? (newMessageCount > 0 ? `${newMessageCount} 条新消息` : "有新消息") : "回到最新"}
      </Button>
    </div>}
  </section>
})
