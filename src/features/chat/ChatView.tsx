import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react"
import { IconBellOff, IconMessageCircle, IconUsers } from "@tabler/icons-react"
import type { ChatMessage, Participant } from "@/contracts/generated"
import { errorMessage, ipc } from "@/app/ipc"
import type { SendOptions } from "./useChatSession"
import type { ApplicationPageProps } from "@/app/navigation"
import { WorkspaceList } from "@/components/WorkspaceList"
import { Button } from "@/components/ui/button"
import { ContextMenu } from "@/components/ui/context-menu"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { GroupInfoDrawer } from "./GroupInfoDrawer"
import { MessageComposer } from "./MessageComposer"
import { MessageList } from "./MessageList"
import { SearchPanel } from "./SearchPanel"
import { formatConversationTime } from "./message-time"
import { prefetchAttachments } from "./attachment-sources"
import { availableScenes, sceneAdapters } from "./scenes"
import "./chat.css"

export function ChatView({ session, inbox, active, onNavigate }: ApplicationPageProps) {
  const [panel, setPanel] = useState<"search" | "members" | null>(null)
  const [chatCard, setChatCard] = useState<HTMLElement | null>(null)
  const [scrollToBottomSignal, setScrollToBottomSignal] = useState(0)
  const [selectedQuote, setSelectedQuote] = useState<{ generation: string; epoch: string; message: ChatMessage } | null>(null)
  const [resolvedQuotes, setResolvedQuotes] = useState<{ identity: string; items: ChatMessage[]; error: string | null } | null>(null)
  const snapshot = session.snapshot
  const generation = snapshot?.data_generation_id ?? null
  const contentEpoch = snapshot?.room.content_epoch ?? "0"
  // 发送中的本地占位挂在窗口末尾，等回执落地后由会话层移除，用户点完立刻能看见气泡。
  const page = useMemo(() => {
    if (!session.page) return null
    const pending = session.pendingMessages
    return pending.length ? { ...session.page, items: [...session.page.items, ...pending] } : session.page
  }, [session.page, session.pendingMessages])
  // 图片字节按窗口批量预取，滚动到位时才不会先闪一格空白。
  useEffect(() => {
    if (!generation || !page) return
    const ids = page.items.flatMap((item) => item.parts.flatMap((part) => part.kind === "attachment" && part.attachment.kind === "image" ? [part.attachment.id] : []))
    prefetchAttachments(generation, ids.slice(0, 48))
  }, [generation, page])
  const quoteId = selectedQuote?.generation === generation ? selectedQuote.message.id : null
  const loadedMessages = useMemo(() => new Map(session.page?.items.filter((message) => message.state === "visible").map((message) => [message.id, message])), [session.page])
  const externalQuoteIds = useMemo(() => [...new Set([quoteId, ...(session.page?.items.filter((message) => message.state === "visible").map((message) => message.quote_message_id) ?? [])].filter((id): id is string => Boolean(id)))].filter((id) => !loadedMessages.has(id)).slice(0, 32), [quoteId, session.page, loadedMessages])
  const quotesIdentity = JSON.stringify([generation, contentEpoch, externalQuoteIds])
  useEffect(() => {
    if (!active || !generation || !externalQuoteIds.length) return
    let cancelled = false
    void ipc.resolveQuotes({ data_generation_id: generation, message_ids: externalQuoteIds }).then((items) => {
      if (!cancelled) setResolvedQuotes({ identity: quotesIdentity, items, error: null })
    }).catch((cause: unknown) => {
      if (!cancelled) setResolvedQuotes({ identity: quotesIdentity, items: [], error: errorMessage(cause) })
    })
    return () => { cancelled = true }
  }, [active, generation, externalQuoteIds, quotesIdentity])
  const quotes = useMemo(() => {
    const available = new Map(loadedMessages)
    if (resolvedQuotes?.identity === quotesIdentity) for (const message of resolvedQuotes.items) if (message.state === "visible") available.set(message.id, message)
    return available
  }, [loadedMessages, resolvedQuotes, quotesIdentity])
  const quote = quoteId ? quotes.get(quoteId) ?? (selectedQuote?.epoch === contentEpoch ? selectedQuote.message : null) : null
  const participants = useMemo(() => new Map(snapshot?.participants.map((participant) => [participant.id, participant])), [snapshot?.participants])
  const typingNames = useMemo(
    () => (snapshot?.participants ?? [])
      .filter((participant) => participant.kind === "agent" && participant.runtime?.status === "waiting_to_send")
      .map((participant) => participant.display_name),
    [snapshot?.participants],
  )
  const visible = useRef(active)
  const navigationEpoch = useRef(0)
  useLayoutEffect(() => { visible.current = active; navigationEpoch.current += 1 }, [active])
  const scenes = snapshot ? availableScenes(snapshot) : []
  const scene = scenes[0]
  const [focused, setFocused] = useState(() => document.hasFocus())
  const [unreadNotice, setUnreadNotice] = useState<{ count: number; seq: string; id: string } | null>(null)
  /** 第一条未读当前是否在视口里：滚到它就必须收起所有提示，而不是等定时器。 */
  const [firstUnreadVisible, setFirstUnreadVisible] = useState(false)
  const evaluatedUnread = useRef<string | null>(null)
  /** 本次进入关注的第一条未读；提示收起后仍要跟踪它，滚走时才能恢复底部提示。 */
  const unreadTargetId = useRef<string | null>(null)
  const returnTarget = useRef<HTMLElement | null>(null)
  const onlineCount = snapshot?.participants.filter((participant) => participant.status === "present").length ?? 0
  const restoreFocus = useCallback(() => {
    if (active && returnTarget.current?.isConnected) returnTarget.current.focus()
  }, [active])
  const openPanel = useCallback((next: "search" | "members") => {
    returnTarget.current = document.activeElement instanceof HTMLElement ? document.activeElement : null
    setPanel((current) => current === next ? null : next)
  }, [])
  const closePanel = useCallback(() => { setPanel(null); restoreFocus() }, [restoreFocus])

  // 窗口是否聚焦决定“进入聊天即已读”能否成立：后台累积的未读不能在用户没看时被清掉。
  useEffect(() => {
    const onFocus = () => setFocused(true)
    const onBlur = () => setFocused(false)
    window.addEventListener("focus", onFocus)
    window.addEventListener("blur", onBlur)
    return () => { window.removeEventListener("focus", onFocus); window.removeEventListener("blur", onBlur) }
  }, [])

  // 顶部「未读消息」只在进入会话时评估一次：第一条未读已在视口内就不提示，
  // 看不见才给跳转入口。停留期间的新消息交给底部「新消息」，两者互斥。
  const sceneId = scene?.id
  const inboxSummary = inbox.summary
  const { conversation: findConversation, markRead: markInboxRead } = inbox
  const isFirstUnreadVisible = useCallback((messageId: string) => {
    const scroller = chatCard?.querySelector<HTMLElement>(".chat-list-scroller")
    if (!scroller) return false
    // 虚拟列表只渲染窗口内的条目，找不到就等于不在视口里。
    const article = Array.from(scroller.querySelectorAll<HTMLElement>("[data-message-id]")).find((node) => node.dataset.messageId === messageId)
    if (!article) return false
    const box = article.getBoundingClientRect()
    const view = scroller.getBoundingClientRect()
    return box.bottom > view.top && box.top < view.bottom
  }, [chatCard])
  useEffect(() => {
    if (!active || !focused || !sceneId) {
      evaluatedUnread.current = null
      unreadTargetId.current = null
      queueMicrotask(() => { setUnreadNotice(null); setFirstUnreadVisible(false) })
      return
    }
    // 容器还没挂载时量不出位置，等它出现再评估，避免误判成“看不见”。
    if (!chatCard || evaluatedUnread.current === sceneId) return
    const info = findConversation(sceneId)
    if (!info || info.unread_count === 0 || !info.first_unread_id || !info.first_unread_seq) {
      evaluatedUnread.current = sceneId
      unreadTargetId.current = null
      queueMicrotask(() => { setUnreadNotice(null); setFirstUnreadVisible(false) })
      return
    }
    const count = info.unread_count
    const latestSeq = info.latest_seq
    const firstId = info.first_unread_id
    const firstSeq = info.first_unread_seq
    unreadTargetId.current = firstId
    // 等一帧再量位置：虚拟列表刚挂载时还没完成首次布局，此刻判断会把“其实看得见”误判成看不见。
    const frame = requestAnimationFrame(() => {
      evaluatedUnread.current = sceneId
      void markInboxRead(sceneId, latestSeq)
      const visibleNow = isFirstUnreadVisible(firstId)
      setFirstUnreadVisible(visibleNow)
      setUnreadNotice(visibleNow ? null : { count, seq: firstSeq, id: firstId })
    })
    return () => cancelAnimationFrame(frame)
  }, [active, focused, sceneId, inboxSummary, chatCard, findConversation, markInboxRead, isFirstUnreadVisible])

  // 用户滚到第一条未读即视为已看到：立即收起顶部提示，也顺带压制底部新消息提示。
  useEffect(() => {
    const targetId = unreadTargetId.current
    if (!active || !chatCard || !targetId) return
    const scroller = chatCard.querySelector<HTMLElement>(".chat-list-scroller")
    if (!scroller) return
    const check = () => {
      const visible = isFirstUnreadVisible(targetId)
      setFirstUnreadVisible(visible)
      // 滚到第一条未读就收起入口，不依赖定时器或另一个 effect。
      if (visible) setUnreadNotice(null)
    }
    const frame = requestAnimationFrame(check)
    scroller.addEventListener("scroll", check, { passive: true })
    window.addEventListener("resize", check)
    return () => {
      cancelAnimationFrame(frame)
      scroller.removeEventListener("scroll", check)
      window.removeEventListener("resize", check)
    }
  }, [active, chatCard, unreadNotice, inboxSummary, isFirstUnreadVisible])

  // 已经在底部就等于看到最新：把停留期间累积的未读收回，避免底部还在提示“新消息”。
  const unreadCount = inbox.conversation(sceneId ?? "")?.unread_count ?? 0
  useEffect(() => {
    if (!active || !focused || !sceneId || !session.atBottom || unreadCount === 0) return
    // 本次进入还没评估过就交给上面的提示逻辑，否则会把未读提前清零导致提示永远不出现。
    if (evaluatedUnread.current !== sceneId) return
    const info = findConversation(sceneId)
    if (info) void markInboxRead(sceneId, info.latest_seq)
  }, [active, focused, sceneId, session.atBottom, unreadCount, findConversation, markInboxRead])

  // 顶部未读入口优先；它存在或第一条未读已可见时，底部不再出现任何跳转胶囊。
  const hideLatestNotice = Boolean(unreadNotice) || firstUnreadVisible

  async function handleSend(text: string, requestId: string, options: SendOptions) {
    const adapter = sceneAdapters[scene?.kind ?? "group"]
    if (!adapter) throw new Error("当前聊天对象不可用。")
    const navigation = navigationEpoch.current
    const result = await adapter.send(session, text, requestId, options)
    if (!visible.current || navigation !== navigationEpoch.current) return result
    if (session.page?.has_more_after || !session.atBottom) await session.goToLatest()
    else session.updateAtBottom(true)
    if (!visible.current || navigation !== navigationEpoch.current) return result
    setScrollToBottomSignal((value) => value + 1)
    return result
  }

  // 回到最新：多数情况只是滚到底（会话层不会重建窗口），滚动信号统一在这里发。
  const goToLatest = useCallback(async () => {
    await session.goToLatest()
    if (visible.current) setScrollToBottomSignal((value) => value + 1)
  }, [session])

  const selectQuote = useCallback((message: ChatMessage) => {
    if (!generation) return
    setSelectedQuote({ generation, epoch: contentEpoch, message })
    requestAnimationFrame(() => { if (visible.current) chatCard?.querySelector<HTMLTextAreaElement>("textarea[aria-label='消息输入']")?.focus() })
  }, [generation, contentEpoch, chatCard])

  // 右键头像「@某人」：把请求交给输入框，它负责插到光标处并聚焦。
  const [mentionRequest, setMentionRequest] = useState<{ name: string; nonce: number } | null>(null)
  const mentionParticipant = useCallback((participant: Participant) => {
    setMentionRequest((current) => ({ name: participant.display_name, nonce: (current?.nonce ?? 0) + 1 }))
  }, [])
  const inspectParticipant = useCallback(() => { openPanel("members") }, [openPanel])

  useEffect(() => {
    if (!active) return
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.isComposing || event.defaultPrevented) return
      if (event.ctrlKey && !event.altKey && event.key.toLowerCase() === "f") {
        event.preventDefault()
        if (panel !== "search") openPanel("search")
      } else if (event.key === "Escape" && panel) {
        event.preventDefault()
        closePanel()
      }
    }
    window.addEventListener("keydown", onKeyDown)
    return () => window.removeEventListener("keydown", onKeyDown)
  }, [active, closePanel, openPanel, panel])

  return <div className="workspace-layout chat-workspace">
    <WorkspaceList className="chat-scene-list" aria-label="聊天对象">
      {scenes.map((item) => {
        const info = inbox.conversation(item.id)
        const unread = info?.unread_count ?? 0
        const muted = info?.muted ?? false
        const preview = info?.latest_preview ?? (session.loading ? "正在读取消息…" : "暂无消息")
        const title = info?.latest_sender ? `${info.latest_sender}：${preview}` : preview
        const time = info?.latest_at ? formatConversationTime(info.latest_at) : ""
        return <ContextMenu
          key={item.id}
          label={`${item.name} 会话操作`}
          items={[{ key: "mute", label: muted ? "取消消息免打扰" : "消息免打扰", icon: <IconBellOff size={16} stroke={1.5} aria-hidden="true" />, onSelect: () => void inbox.setMuted(item.id, !muted) }]}
        >
          <button type="button" className="list-entry chat-scene-entry" data-active={item.id === scene?.id} onClick={() => { closePanel(); if (info && unread > 0) void inbox.markRead(item.id, info.latest_seq) }}>
            <span className="chat-scene-avatar">
              <IconUsers size={23} stroke={1.5} aria-hidden="true" />
              {unread > 0 && <span className="unread-badge chat-unread-tag" data-muted={muted || undefined} aria-label={muted ? "有未读消息，已免打扰" : `${unread} 条未读`}>{muted ? null : unread > 99 ? "99+" : unread}</span>}
            </span>
            <span className="chat-scene-main">
              <span className="conversation-heading">
                <strong className="conversation-heading-name">{item.name}</strong>
                {time && <time className="conversation-heading-time" dateTime={new Date(info!.latest_at).toISOString()}>{time}</time>}
              </span>
              <span className="conversation-heading">
                <span className="conversation-preview">{title}</span>
                {muted && <IconBellOff className="chat-scene-muted" size={13} stroke={1.5} aria-label="消息免打扰" />}
              </span>
            </span>
          </button>
        </ContextMenu>
      })}
      {!snapshot && <p className="chat-scene-meta p-3">{session.loading ? "正在读取聊天对象…" : "本地数据尚未就绪。"}</p>}
    </WorkspaceList>
    <section ref={setChatCard} className="surface-card workspace-detail chat-card" aria-label="当前聊天">
      <header className="panel-heading chat-heading" data-search-open={panel === "search" && active} data-typing={typingNames.length > 0}>
        <div className="chat-heading-main">
          <h2 className="panel-title chat-room-title"><span className="chat-room-name" title={scene?.name ?? "Sageroom"}>{scene?.name ?? "Sageroom"}</span>{snapshot && <span className="chat-member-count"> ({snapshot.participants.length})</span>}</h2>
          <p className="panel-description">{snapshot ? `${onlineCount} 位成员在线` : session.loading ? "正在读取本地聊天" : "本地数据未就绪"}</p>
        </div>
        {typingNames.length > 0 && <div className="chat-typing" role="status" aria-live="polite">
          <span className="chat-typing-text"><span className="chat-typing-name">{typingNames[0]}</span><span>{typingNames.length > 1 ? `等${typingNames.length}人正在输入` : "正在输入"}</span></span>
          <span className="chat-typing-dots" aria-hidden="true"><i /><i /><i /></span>
        </div>}
        <div className="chat-heading-actions">
          <SearchPanel open={panel === "search" && active} onOpenChange={(open) => { if (open) openPanel("search"); else closePanel() }} generation={snapshot?.data_generation_id ?? null} contentEpoch={contentEpoch} participants={participants} onLocate={session.jumpTo} onReturnFocus={restoreFocus} />
          <Tooltip disableHoverableContent><TooltipTrigger asChild><Button variant="ghost" size="icon" aria-label="群信息" aria-expanded={panel === "members"} onClick={() => openPanel("members")}><IconUsers size={20} stroke={1.5} aria-hidden="true" /></Button></TooltipTrigger><TooltipContent>群信息</TooltipContent></Tooltip>
        </div>
      </header>
      {session.error && <div className="chat-error" role="alert"><p>{session.error}</p><Button size="sm" variant="ghost" onClick={() => void session.reload()}>重试连接</Button></div>}
      <div className="chat-body">
        <div className="chat-conversation">
          {unreadNotice && <div className="chat-unread-notice" role="status">
            <button type="button" className="chat-latest-button" onClick={() => { const target = unreadNotice; setUnreadNotice(null); void session.jumpTo(target.seq, target.id) }}>{unreadNotice.count} 条未读消息</button>
          </div>}
          {page && snapshot ? <MessageList key={session.windowRevision} active={active} page={page} participants={participants} restoreAnchor={session.restoreAnchor ?? session.liveAnchor()} enteringIds={session.enteringIds} localUserId={snapshot.local_user.id} generation={snapshot.data_generation_id} firstItemIndex={session.firstItemIndex} targetMessageId={session.targetMessageId} followLatest={session.atBottom && !page.has_more_after} hasNewMessages={session.hasNewMessages} newMessageCount={hideLatestNotice ? 0 : unreadCount} hideLatestNotice={hideLatestNotice} scrollToBottomSignal={scrollToBottomSignal} loadingMore={session.loadingMore} onLoadOlder={session.loadOlder} onLoadNewer={session.loadNewer} onAtBottomChange={session.updateAtBottom} onRenderedAnchorChange={session.updateRenderedAnchor} onGoToLatest={goToLatest} quotes={quotes} onQuote={selectQuote} onRecall={session.recall} onLocateQuote={session.jumpTo} onMentionParticipant={mentionParticipant} onInspectParticipant={inspectParticipant} /> : <div className="flex min-h-0 flex-1 flex-col items-center justify-center gap-3 p-6 text-center text-text-secondary" role="status"><IconMessageCircle size={32} stroke={1.3} aria-hidden="true" /><p>{session.loading ? "正在读取本地聊天…" : "聊天数据尚未就绪，原始数据不会被覆盖。"}</p></div>}
          {resolvedQuotes?.identity === quotesIdentity && resolvedQuotes.error && <p className="chat-quote-feedback" role="alert">{resolvedQuotes.error}</p>}
          <MessageComposer active={active} dataGenerationId={generation} disabled={!snapshot} participants={snapshot?.participants} localUserId={snapshot?.local_user.id ?? null} canMentionAll={snapshot?.room.owner_participant_id === snapshot?.local_user.id} mentionRequest={mentionRequest} quoteMessageId={quoteId} quote={quote} onRemoveQuote={() => setSelectedQuote(null)} onSend={handleSend} />
        </div>
      </div>
      {snapshot && <GroupInfoDrawer key={snapshot.data_generation_id} snapshot={snapshot} container={chatCard} open={panel === "members" && active} onOpenChange={(open) => { if (!open) closePanel() }} onRoomChange={session.applyRoom} onManageAgents={() => { closePanel(); onNavigate("agents") }} onReturnFocus={restoreFocus} muted={inbox.conversation(snapshot.room.id)?.muted ?? false} onMutedChange={(muted) => void inbox.setMuted(snapshot.room.id, muted)} />}
    </section>
  </div>
}
