import { useCallback, useEffect, useRef, useState } from "react"
import Lenis from "lenis"
import "lenis/dist/lenis.css"
import { Virtuoso, type VirtuosoHandle } from "react-virtuoso"
import { IconArrowDown } from "@tabler/icons-react"
import type { ChatMessage, MessagePage } from "@/contracts/generated"
import { Button } from "@/components/ui/button"
import { Avatar } from "@/components/Avatar"
import { cn } from "@/lib/utils"

type ListContext = { loadingMore: boolean; hasMoreBefore: boolean }

function ListHeader({ context }: { context: ListContext }) {
  return <div className="chat-list-notice">{context.loadingMore ? "正在读取历史…" : context.hasMoreBefore ? "向上浏览更早消息" : "已到最早的消息"}</div>
}

function ListFooter() {
  return <div className="chat-list-footer" />
}

const listComponents = { Header: ListHeader, Footer: ListFooter }

const timeFormatter = new Intl.DateTimeFormat("zh-CN", { hour: "2-digit", minute: "2-digit" })
const dateFormatter = new Intl.DateTimeFormat("zh-CN", { month: "long", day: "numeric" })

function messageText(message: ChatMessage): string {
  return message.parts.flatMap((part) => part.kind === "text" ? [part.text] : []).join("")
}

function MessageRow({ message, self, highlighted, generation }: { message: ChatMessage; self: boolean; highlighted: boolean; generation?: string }) {
  return (
    <article
      data-message-id={message.id}
      data-message-seq={message.seq}
      className={cn("chat-message", highlighted && "chat-message-highlight")}
      aria-label={`${message.sender_snapshot.display_name}的消息`}
    >
      <div className="chat-message-row" data-self={self}>
        <div className="chat-message-avatar"><Avatar name={message.sender_snapshot.display_name} avatarId={message.sender_snapshot.avatar_id} generation={generation} size={40} radius={10} /></div>
        <div className="chat-message-stack">
          {!self && <span className="chat-message-name">{message.sender_snapshot.display_name}</span>}
          <div className={cn("chat-message-bubble", self ? "chat-message-bubble-self" : "chat-message-bubble-other")}>
            {message.state === "visible" ? messageText(message) : message.state === "recalled" ? "消息已撤回" : "消息已删除"}
          </div>
        </div>
        <time className="chat-message-time" dateTime={new Date(message.created_at).toISOString()}>{timeFormatter.format(message.created_at)}</time>
      </div>
    </article>
  )
}

type Props = {
  active?: boolean
  generation?: string
  page: MessagePage
  localUserId: string
  firstItemIndex: number
  targetMessageId: string | null
  followLatest: boolean
  hasNewMessages: boolean
  scrollToBottomSignal?: number
  loadingMore: boolean
  onLoadOlder: () => Promise<void>
  onLoadNewer: () => Promise<void>
  onAtBottomChange: (value: boolean) => void
  onRenderedAnchorChange: (anchor: Pick<ChatMessage, "id" | "seq">) => void
  onGoToLatest: () => Promise<void>
}

export function MessageList({
  active = true, generation, page, localUserId, firstItemIndex, targetMessageId, followLatest, hasNewMessages,
  scrollToBottomSignal = 0, loadingMore, onLoadOlder, onLoadNewer, onAtBottomChange, onRenderedAnchorChange, onGoToLatest,
}: Props) {
  const list = useRef<VirtuosoHandle>(null)
  const userScrolling = useRef(false)
  const lenis = useRef<Lenis | null>(null)
  const [scrollElement, setScrollElement] = useState<HTMLElement | null>(null)
  const [initialIndex] = useState<number | "LAST">(() => targetMessageId
    ? Math.max(0, page.items.findIndex((message) => message.id === targetMessageId))
    : "LAST")

  const handleScrollerRef = useCallback((node: HTMLElement | null | Window) => {
    setScrollElement(node instanceof HTMLElement ? node : null)
  }, [])

  useEffect(() => {
    if (!scrollElement) return
    const content = scrollElement.firstElementChild
    if (!(content instanceof HTMLElement)) return
    const instance = new Lenis({
      wrapper: scrollElement,
      content,
      eventsTarget: scrollElement,
      smoothWheel: true,
      syncTouch: true,
      lerp: 0.085,
      wheelMultiplier: 1.1,
      overscroll: true,
      autoRaf: true,
      respectReducedMotion: true,
    })
    lenis.current = instance
    return () => {
      instance.destroy()
      lenis.current = null
    }
  }, [scrollElement])

  useEffect(() => {
    lenis.current?.resize()
  }, [page.items])

  useEffect(() => {
    if (!scrollToBottomSignal) return
    const frame = requestAnimationFrame(() => {
      userScrolling.current = false
      list.current?.scrollToIndex({ index: "LAST", align: "end", behavior: "auto" })
      const instance = lenis.current
      if (instance && scrollElement) instance.scrollTo(scrollElement.scrollHeight, { immediate: true, force: true })
    })
    return () => cancelAnimationFrame(frame)
  }, [scrollElement, scrollToBottomSignal])

  if (page.items.length === 0) {
    return (
      <div className="chat-empty-state">
        <div aria-hidden="true" className="chat-empty-mark">S</div>
        <p className="chat-empty-title">这里还很安静</p>
        <p className="chat-empty-description">先说点什么。消息保存在本机，智能体的运行任务尚未启用。</p>
      </div>
    )
  }

  return (
    <section aria-label="聊天记录" className="relative min-h-0 flex-1">
      <Virtuoso<ChatMessage, ListContext>
        ref={list}
        scrollerRef={handleScrollerRef}
        className="chat-list-scroller"
        context={{ loadingMore, hasMoreBefore: page.has_more_before }}
        style={{ height: "100%" }}
        data={page.items}
        firstItemIndex={firstItemIndex}
        initialTopMostItemIndex={{ index: initialIndex }}
        computeItemKey={(_, message) => message.id}
        defaultItemHeight={88}
        increaseViewportBy={{ top: 300, bottom: 300 }}
        minOverscanItemCount={{ top: 2, bottom: 2 }}
        atBottomThreshold={24}
        atBottomStateChange={(value) => { if (active) onAtBottomChange(value) }}
        isScrolling={(value) => { userScrolling.current = value }}
        rangeChanged={({ startIndex }) => {
          const anchor = page.items[startIndex - firstItemIndex]
          if (active && anchor) onRenderedAnchorChange({ id: anchor.id, seq: anchor.seq })
        }}
        followOutput={(atBottom) => !targetMessageId && followLatest && atBottom && !userScrolling.current ? "smooth" : false}
        startReached={() => { if (active && page.has_more_before) void onLoadOlder() }}
        endReached={() => { if (active && page.has_more_after) void onLoadNewer() }}
        components={listComponents}
        itemContent={(index, message) => {
          const dataIndex = index - firstItemIndex
          const previous = page.items[dataIndex - 1]
          const newDay = !previous || new Date(previous.created_at).toDateString() !== new Date(message.created_at).toDateString()
          return (
            <>
              {newDay && <p className="chat-day-divider">{dateFormatter.format(message.created_at)}</p>}
              <MessageRow message={message} self={message.sender_id === localUserId} highlighted={message.id === targetMessageId} generation={generation} />
            </>
          )
        }}
      />
      {(hasNewMessages || page.has_more_after) && (
        <Button size="sm" variant="secondary" className="chat-latest-button" onClick={() => void onGoToLatest()}>
          <IconArrowDown size={16} aria-hidden="true" />
          {hasNewMessages ? "有新消息" : "回到最新"}
        </Button>
      )}
    </section>
  )
}
