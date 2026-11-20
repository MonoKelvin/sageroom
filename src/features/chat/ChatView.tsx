import { useCallback, useEffect, useRef, useState } from "react"
import { IconMessageCircle, IconUsers } from "@tabler/icons-react"
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
  const snapshot = session.snapshot
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
        <span className="min-w-0"><strong className="block truncate font-medium">{item.name}</strong><span className="form-caption">{item.kind === "group" ? "群聊" : "私聊"}</span></span>
      </button>)}
      {!snapshot && <p className="form-caption p-3">{session.loading ? "正在读取聊天对象…" : "本地数据尚未就绪。"}</p>}
    </WorkspaceList>
    <section ref={setChatCard} className="surface-card workspace-detail chat-card" aria-label="当前聊天">
      <header className="panel-heading chat-heading" data-search-open={panel === "search" && active}>
        <div className="chat-heading-main">
          <h2 className="panel-title chat-room-title"><span className="chat-room-name" title={scene?.name ?? "Sageroom"}>{scene?.name ?? "Sageroom"}</span>{snapshot && <span className="chat-member-count"> ({snapshot.participants.length})</span>}</h2>
          <p className="panel-description">{snapshot ? `${onlineCount} 位成员在线` : session.loading ? "正在读取本地聊天" : "本地数据未就绪"}</p>
        </div>
        <div className="chat-heading-actions">
          <SearchPanel open={panel === "search" && active} onOpenChange={(open) => { if (open) openPanel("search"); else closePanel() }} generation={snapshot?.data_generation_id ?? null} onLocate={session.jumpTo} onReturnFocus={restoreFocus} />
          <Tooltip disableHoverableContent><TooltipTrigger asChild><Button variant="ghost" size="icon" aria-label="群信息" aria-expanded={panel === "members"} onClick={() => openPanel("members")}><IconUsers size={20} stroke={1.5} aria-hidden="true" /></Button></TooltipTrigger><TooltipContent>群信息</TooltipContent></Tooltip>
        </div>
      </header>
      {session.error && <div className="chat-error" role="alert"><p>{session.error}</p><Button size="sm" variant="ghost" onClick={() => void session.reload()}>重试连接</Button></div>}
      <div className="chat-body">
        <div className="chat-conversation">
          {session.page && snapshot ? <MessageList key={session.windowRevision} active={active} page={session.page} localUserId={snapshot.local_user.id} generation={snapshot.data_generation_id} firstItemIndex={session.firstItemIndex} targetMessageId={session.targetMessageId} followLatest={session.atBottom && !session.page.has_more_after} hasNewMessages={session.hasNewMessages} loadingMore={session.loadingMore} onLoadOlder={session.loadOlder} onLoadNewer={session.loadNewer} onAtBottomChange={session.updateAtBottom} onRenderedAnchorChange={session.updateRenderedAnchor} onGoToLatest={session.goToLatest} /> : <div className="flex min-h-0 flex-1 flex-col items-center justify-center gap-3 p-6 text-center text-text-secondary" role="status"><IconMessageCircle size={32} stroke={1.3} aria-hidden="true" /><p>{session.loading ? "正在读取本地聊天…" : "聊天数据尚未就绪，原始数据不会被覆盖。"}</p></div>}
          <MessageComposer active={active} dataGenerationId={snapshot?.data_generation_id ?? null} disabled={!snapshot} onSend={(text, requestId) => sceneAdapters[scene?.kind ?? "group"]!.send(session, text, requestId)} />
        </div>
      </div>
      {snapshot && <GroupInfoDrawer key={snapshot.data_generation_id} snapshot={snapshot} container={chatCard} open={panel === "members" && active} onOpenChange={(open) => { if (!open) closePanel() }} onRoomChange={session.applyRoom} onManageAgents={() => { closePanel(); onNavigate("agents") }} onReturnFocus={restoreFocus} />}
    </section>
  </div>
}
