import { memo, useCallback, useEffect, useLayoutEffect, useRef, useState } from "react"
import { Virtuoso, type StateSnapshot, type VirtuosoHandle } from "react-virtuoso"
import { IconArrowDown } from "@tabler/icons-react"
import type { ChatMessage, MessagePage, Participant } from "@/contracts/generated"
import { Button } from "@/components/ui/button"
import { Avatar } from "@/components/Avatar"
import { cn } from "@/lib/utils"
import type { ScrollAnchor } from "./useChatSession"
import { formatMessageTime, shouldInsertTimeTag } from "./message-time"

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

const MessageRow = memo(function MessageRow({ message, participant, self, highlighted, generation }: {
  message: ChatMessage; participant: Participant; self: boolean; highlighted: boolean; generation?: string
}) {
  return (
    <article data-message-id={message.id} data-message-seq={message.seq} className={cn("chat-message", highlighted && "chat-message-highlight")} aria-label={`${participant.display_name}的消息`}>
      <div className="chat-message-row" data-self={self}>
        <div className="chat-message-avatar"><Avatar name={participant.display_name} avatarId={participant.avatar_id} colorId={participant.kind === "agent" ? participant.id : undefined} generation={generation} size={40} radius={10} /></div>
        <div className="chat-message-stack">
          {!self && <span className="chat-message-name">{participant.display_name}</span>}
          <div className={cn("chat-message-bubble", self ? "chat-message-bubble-self" : "chat-message-bubble-other")}>
            {message.state === "visible" ? messageText(message) : message.state === "recalled" ? "消息已撤回" : "消息已删除"}
          </div>
        </div>
        <time className="chat-message-time" dateTime={new Date(message.created_at).toISOString()}>{formatMessageTime(message.created_at)}</time>
      </div>
    </article>
  )
})

type Props = {
  active?: boolean
  generation?: string
  page: MessagePage
  participants: ReadonlyMap<string, Participant>
  localUserId: string
  firstItemIndex: number
  targetMessageId: string | null
  restoreAnchor: ScrollAnchor | null
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
  generation, page, participants, localUserId, firstItemIndex, targetMessageId, restoreAnchor, followLatest,
  scrollToBottomSignal = 0, loadingMore, onLoadOlder, onLoadNewer, onAtBottomChange, onRenderedAnchorChange, initialSaved,
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
        {shouldInsertTimeTag(previous?.created_at, message.created_at) && <p className="chat-time-divider">{formatMessageTime(message.created_at)}</p>}
        <MessageRow message={message} participant={participants.get(message.sender_id)!} self={message.sender_id === localUserId} highlighted={message.id === targetMessageId} generation={generation} />
      </>
    }}
  />
}

export function MessageList(props: Props) {
  return <section aria-label="聊天记录" className="relative flex min-h-0 flex-1 flex-col">
    {props.page.items.length === 0 ? <div className="chat-empty-state">
      <div aria-hidden="true" className="chat-empty-mark">S</div>
      <p className="chat-empty-title">这里还很安静</p>
      <p className="chat-empty-description">先说点什么。消息保存在本机，智能体的运行任务尚未启用。</p>
    </div> : (props.active ?? true) && <MessageViewport {...props} initialSaved={null} />}
    {(props.hasNewMessages || props.page.has_more_after) && <div className="chat-latest-position">
      <Button size="sm" variant="secondary" className="chat-latest-button" onClick={() => void props.onGoToLatest()}>
        <IconArrowDown size={16} aria-hidden="true" />
        {props.hasNewMessages ? "有新消息" : "回到最新"}
      </Button>
    </div>}
  </section>
}
