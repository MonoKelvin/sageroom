import { useEffect, useRef, useState } from "react"
import { Virtuoso, type VirtuosoHandle } from "react-virtuoso"
import { IconArrowDown } from "@tabler/icons-react"
import type { ChatMessage, MessagePage } from "@/contracts/generated"
import { Button } from "@/components/ui/button"
import { Avatar } from "@/components/Avatar"
import { cn } from "@/lib/utils"

type ListContext = { loadingMore: boolean; hasMoreBefore: boolean }

function ListHeader({ context }: { context: ListContext }) {
  return <div className="px-3 pb-2 pt-3 text-center text-xs text-text-secondary">{context.loadingMore ? "正在读取历史…" : context.hasMoreBefore ? "向上浏览更早消息" : "已到最早的消息"}</div>
}

function ListFooter() {
  return <div className="h-3" />
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
      className={cn("px-3 py-1.5 transition-colors duration-[var(--motion-duration)]", highlighted && "bg-primary/10")}
      aria-label={`${message.sender_snapshot.display_name}的消息`}
    >
      <div className={cn("flex min-w-0 items-start gap-2", self && "flex-row-reverse")}>
        <div className="mt-5"><Avatar name={message.sender_snapshot.display_name} avatarId={message.sender_snapshot.avatar_id} generation={generation} size={32} /></div>
        <div className={cn("flex min-w-0 max-w-[min(82%,640px)] flex-col", self ? "items-end" : "items-start")}>
          <div className={cn("mb-1 flex max-w-full items-center gap-2 text-xs text-text-secondary", self && "flex-row-reverse")}>
            <span className="truncate">{message.sender_snapshot.display_name}</span>
            <time className="shrink-0 text-[11px]" dateTime={new Date(message.created_at).toISOString()}>{timeFormatter.format(message.created_at)}</time>
          </div>
          <div className={cn("max-w-full rounded-lg px-3 py-2 text-sm leading-relaxed whitespace-pre-wrap [overflow-wrap:anywhere]", self ? "bg-self" : "bg-content")}>
            {message.state === "visible" ? messageText(message) : message.state === "recalled" ? "消息已撤回" : "消息已删除"}
          </div>
        </div>
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
  loadingMore: boolean
  onLoadOlder: () => Promise<void>
  onLoadNewer: () => Promise<void>
  onAtBottomChange: (value: boolean) => void
  onRenderedAnchorChange: (anchor: Pick<ChatMessage, "id" | "seq">) => void
  onGoToLatest: () => Promise<void>
}

export function MessageList({
  active = true, generation, page, localUserId, firstItemIndex, targetMessageId, followLatest, hasNewMessages,
  loadingMore, onLoadOlder, onLoadNewer, onAtBottomChange, onRenderedAnchorChange, onGoToLatest,
}: Props) {
  const list = useRef<VirtuosoHandle>(null)
  const [initialIndex] = useState<number | "LAST">(() => targetMessageId
    ? Math.max(0, page.items.findIndex((message) => message.id === targetMessageId))
    : "LAST")

  useEffect(() => {
    if (!active || !followLatest || targetMessageId || !page.last_seq) return
    // followOutput 在等长窗口替换时不触发，需显式保持底部。
    const frame = requestAnimationFrame(() => list.current?.scrollToIndex({ index: "LAST", behavior: "auto" }))
    return () => cancelAnimationFrame(frame)
  }, [active, followLatest, page.last_seq, targetMessageId])

  if (page.items.length === 0) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center px-8 pb-10 text-center">
        <div aria-hidden="true" className="mb-5 flex size-12 items-center justify-center rounded-2xl bg-primary/10 text-lg font-medium text-primary">S</div>
        <p className="font-medium">这里还很安静</p>
        <p className="mt-2 max-w-60 text-sm leading-relaxed text-text-secondary">先说点什么。消息保存在本机，智能体的运行任务尚未启用。</p>
      </div>
    )
  }

  return (
    <section aria-label="聊天记录" className="relative min-h-0 flex-1">
      <Virtuoso<ChatMessage, ListContext>
        ref={list}
        context={{ loadingMore, hasMoreBefore: page.has_more_before }}
        style={{ height: "100%" }}
        data={page.items}
        firstItemIndex={firstItemIndex}
        initialTopMostItemIndex={{ index: initialIndex }}
        computeItemKey={(_, message) => message.id}
        increaseViewportBy={{ top: 150, bottom: 150 }}
        atBottomThreshold={36}
        atBottomStateChange={(value) => { if (active) onAtBottomChange(value) }}
        rangeChanged={({ startIndex }) => {
          const anchor = page.items[startIndex - firstItemIndex]
          if (active && anchor) onRenderedAnchorChange({ id: anchor.id, seq: anchor.seq })
        }}
        followOutput={(atBottom) => !targetMessageId && followLatest && atBottom ? "auto" : false}
        startReached={() => { if (active && page.has_more_before) void onLoadOlder() }}
        endReached={() => { if (active && page.has_more_after) void onLoadNewer() }}
        components={listComponents}
        itemContent={(index, message) => {
          const dataIndex = index - firstItemIndex
          const previous = page.items[dataIndex - 1]
          const newDay = !previous || new Date(previous.created_at).toDateString() !== new Date(message.created_at).toDateString()
          return (
            <>
              {newDay && <p className="py-3 text-center text-xs text-text-secondary">{dateFormatter.format(message.created_at)}</p>}
              <MessageRow message={message} self={message.sender_id === localUserId} highlighted={message.id === targetMessageId} generation={generation} />
            </>
          )
        }}
      />
      {(hasNewMessages || page.has_more_after) && (
        <Button size="sm" variant="secondary" className="absolute right-3 bottom-3 shadow-sm" onClick={() => void onGoToLatest()}>
          <IconArrowDown size={16} aria-hidden="true" />
          {hasNewMessages ? "有新消息，回到最新" : "回到最新"}
        </Button>
      )}
    </section>
  )
}
