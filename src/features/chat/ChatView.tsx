import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react"
import { IconMessageCircle, IconUsers } from "@tabler/icons-react"
import type { ChatMessage } from "@/contracts/generated"
import { errorMessage, ipc } from "@/app/ipc"
import type { SendOptions } from "./useChatSession"
import type { ApplicationPageProps } from "@/app/navigation"
import { WorkspaceList } from "@/components/WorkspaceList"
import { Button } from "@/components/ui/button"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { GroupInfoDrawer } from "./GroupInfoDrawer"
import { MessageComposer } from "./MessageComposer"
import { MessageList } from "./MessageList"
import { SearchPanel } from "./SearchPanel"
import { availableScenes, sceneAdapters } from "./scenes"
import "./chat.css"

export function ChatView({ session, active, onNavigate }: ApplicationPageProps) {
  const [panel, setPanel] = useState<"search" | "members" | null>(null)
  const [chatCard, setChatCard] = useState<HTMLElement | null>(null)
  const [scrollToBottomSignal, setScrollToBottomSignal] = useState(0)
  const [selectedQuote, setSelectedQuote] = useState<{ generation: string; epoch: string; message: ChatMessage } | null>(null)
  const [resolvedQuotes, setResolvedQuotes] = useState<{ identity: string; items: ChatMessage[]; error: string | null } | null>(null)
  const snapshot = session.snapshot
  const generation = snapshot?.data_generation_id ?? null
  const contentEpoch = snapshot?.room.content_epoch ?? "0"
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
  const visible = useRef(active)
  const navigationEpoch = useRef(0)
  useLayoutEffect(() => { visible.current = active; navigationEpoch.current += 1 }, [active])
  const scenes = snapshot ? availableScenes(snapshot) : []
  const scene = scenes[0]
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

  const selectQuote = useCallback((message: ChatMessage) => {
    if (!generation) return
    setSelectedQuote({ generation, epoch: contentEpoch, message })
    requestAnimationFrame(() => { if (visible.current) chatCard?.querySelector<HTMLTextAreaElement>("textarea[aria-label='消息输入']")?.focus() })
  }, [generation, contentEpoch, chatCard])

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
      {scenes.map((item) => <button type="button" key={item.id} className="list-entry" data-active={item.id === scene?.id} onClick={closePanel}>
        <span className="chat-scene-avatar" aria-hidden="true"><IconUsers size={23} stroke={1.5} /></span>
        <span className="min-w-0"><strong className="block truncate font-medium">{item.name}</strong><span className="chat-scene-meta">{item.kind === "group" ? "群聊" : "私聊"}</span></span>
      </button>)}
      {!snapshot && <p className="chat-scene-meta p-3">{session.loading ? "正在读取聊天对象…" : "本地数据尚未就绪。"}</p>}
    </WorkspaceList>
    <section ref={setChatCard} className="surface-card workspace-detail chat-card" aria-label="当前聊天">
      <header className="panel-heading chat-heading" data-search-open={panel === "search" && active}>
        <div className="chat-heading-main">
          <h2 className="panel-title chat-room-title"><span className="chat-room-name" title={scene?.name ?? "Sageroom"}>{scene?.name ?? "Sageroom"}</span>{snapshot && <span className="chat-member-count"> ({snapshot.participants.length})</span>}</h2>
          <p className="panel-description">{snapshot ? `${onlineCount} 位成员在线` : session.loading ? "正在读取本地聊天" : "本地数据未就绪"}</p>
        </div>
        <div className="chat-heading-actions">
          <SearchPanel open={panel === "search" && active} onOpenChange={(open) => { if (open) openPanel("search"); else closePanel() }} generation={snapshot?.data_generation_id ?? null} contentEpoch={contentEpoch} participants={participants} onLocate={session.jumpTo} onReturnFocus={restoreFocus} />
          <Tooltip disableHoverableContent><TooltipTrigger asChild><Button variant="ghost" size="icon" aria-label="群信息" aria-expanded={panel === "members"} onClick={() => openPanel("members")}><IconUsers size={20} stroke={1.5} aria-hidden="true" /></Button></TooltipTrigger><TooltipContent>群信息</TooltipContent></Tooltip>
        </div>
      </header>
      {session.error && <div className="chat-error" role="alert"><p>{session.error}</p><Button size="sm" variant="ghost" onClick={() => void session.reload()}>重试连接</Button></div>}
      <div className="chat-body">
        <div className="chat-conversation">
          {session.page && snapshot ? <MessageList key={session.windowRevision} active={active} page={session.page} participants={participants} restoreAnchor={session.restoreAnchor} localUserId={snapshot.local_user.id} generation={snapshot.data_generation_id} firstItemIndex={session.firstItemIndex} targetMessageId={session.targetMessageId} followLatest={session.atBottom && !session.page.has_more_after} hasNewMessages={session.hasNewMessages} scrollToBottomSignal={scrollToBottomSignal} loadingMore={session.loadingMore} onLoadOlder={session.loadOlder} onLoadNewer={session.loadNewer} onAtBottomChange={session.updateAtBottom} onRenderedAnchorChange={session.updateRenderedAnchor} onGoToLatest={session.goToLatest} quotes={quotes} onQuote={selectQuote} onRecall={session.recall} onLocateQuote={session.jumpTo} /> : <div className="flex min-h-0 flex-1 flex-col items-center justify-center gap-3 p-6 text-center text-text-secondary" role="status"><IconMessageCircle size={32} stroke={1.3} aria-hidden="true" /><p>{session.loading ? "正在读取本地聊天…" : "聊天数据尚未就绪，原始数据不会被覆盖。"}</p></div>}
          {resolvedQuotes?.identity === quotesIdentity && resolvedQuotes.error && <p className="chat-quote-feedback" role="alert">{resolvedQuotes.error}</p>}
          <MessageComposer active={active} dataGenerationId={generation} disabled={!snapshot} participants={snapshot?.participants} canMentionAll={snapshot?.room.owner_participant_id === snapshot?.local_user.id} quoteMessageId={quoteId} quote={quote} onRemoveQuote={() => setSelectedQuote(null)} onSend={handleSend} />
        </div>
      </div>
      {snapshot && <GroupInfoDrawer key={snapshot.data_generation_id} snapshot={snapshot} container={chatCard} open={panel === "members" && active} onOpenChange={(open) => { if (!open) closePanel() }} onRoomChange={session.applyRoom} onManageAgents={() => { closePanel(); onNavigate("agents") }} onReturnFocus={restoreFocus} />}
    </section>
  </div>
}
