import { useCallback, useEffect, useRef, useState } from "react"
import { IconMessageCircle, IconSearch, IconUsers, IconX } from "@tabler/icons-react"
import type { ApplicationPageProps } from "@/app/navigation"
import type { AppSnapshot } from "@/contracts/generated"
import { Avatar } from "@/components/Avatar"
import { Button } from "@/components/ui/button"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { MessageComposer } from "./MessageComposer"
import { MessageList } from "./MessageList"
import { SearchPanel } from "./SearchPanel"
import { availableScenes, sceneAdapters } from "./scenes"

function GroupInformation({ snapshot, onClose, onNavigate }: { snapshot: AppSnapshot; onClose: () => void; onNavigate: ApplicationPageProps["onNavigate"] }) {
  return <aside className="chat-side-panel" aria-label="群信息">
    <header className="chat-panel-heading"><h3 className="panel-title">群信息</h3><button type="button" className="icon-button" aria-label="关闭群信息" onClick={onClose}><IconX size={18} aria-hidden="true" /></button></header>
    <div className="chat-panel-content panel-scroll">
      <p className="font-medium [overflow-wrap:anywhere]">{snapshot.room.name}</p>
      <p className="form-caption mt-1">{snapshot.participants.length} 位成员 · 本地群聊</p>
      <ul className="mt-6 space-y-5">{snapshot.participants.map((participant) => <li key={participant.id} className="flex min-w-0 items-start gap-3">
        <Avatar name={participant.display_name} avatarId={participant.avatar_id} generation={snapshot.data_generation_id} />
        <div className="min-w-0"><p className="truncate font-medium" title={participant.display_name}>{participant.display_name}</p><p className="form-caption">{participant.kind === "user" ? "本地用户" : "智能体 · 尚未启动"}</p>{participant.introduction && <p className="form-caption mt-1 [overflow-wrap:anywhere]">{participant.introduction}</p>}</div>
      </li>)}</ul>
      <p className="form-caption mt-6">群主仅有群管理权限，在聊天中与其他成员平等。</p>
      <Button variant="secondary" size="sm" className="mt-4" onClick={() => onNavigate("agents")}>管理智能体</Button>
    </div>
  </aside>
}

export function ChatView({ session, active, onNavigate }: ApplicationPageProps) {
  const [panel, setPanel] = useState<"search" | "members" | null>(null)
  const snapshot = session.snapshot
  const scenes = snapshot ? availableScenes(snapshot) : []
  const scene = scenes[0]
  const returnTarget = useRef<HTMLElement | null>(null)

  const openPanel = useCallback((next: "search" | "members") => {
    returnTarget.current = document.activeElement instanceof HTMLElement ? document.activeElement : null
    setPanel((current) => current === next ? null : next)
  }, [])
  const closePanel = useCallback(() => {
    setPanel(null)
    if (active && returnTarget.current?.isConnected) returnTarget.current.focus()
  }, [active])

  useEffect(() => {
    if (!active) return
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.isComposing) return
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
    <aside className="workspace-list chat-scene-list" aria-label="聊天对象">
      <div className="panel-heading"><h1 className="panel-title">聊天</h1></div>
      {scenes.map((item) => <button type="button" key={item.id} className="list-entry" data-active={item.id === scene?.id} onClick={closePanel}>
        <span className="chat-scene-avatar" aria-hidden="true"><IconUsers size={23} stroke={1.5} /></span>
        <span className="min-w-0"><strong className="block truncate font-medium">{item.name}</strong><span className="form-caption">{item.kind === "group" ? "群聊" : "私聊"}</span></span>
      </button>)}
      {!snapshot && <p className="form-caption p-3">{session.loading ? "正在读取聊天对象…" : "本地数据尚未就绪。"}</p>}
    </aside>
    <section className="surface-card workspace-detail chat-card" aria-label="当前聊天">
      <header className="panel-heading chat-heading"><div className="min-w-0"><h2 className="panel-title truncate" title={scene?.name ?? "Sageroom"}>{scene?.name ?? "Sageroom"}</h2><p className="panel-description">{snapshot ? `${snapshot.participants.length} 位成员` : session.loading ? "正在读取本地聊天" : "本地数据未就绪"}</p></div><div className="flex shrink-0 gap-1">
        <Tooltip><TooltipTrigger asChild><Button variant="ghost" size="icon" aria-label="搜索聊天" aria-expanded={panel === "search"} onClick={() => openPanel("search")}><IconSearch size={20} stroke={1.5} aria-hidden="true" /></Button></TooltipTrigger><TooltipContent>搜索 Ctrl+F</TooltipContent></Tooltip>
        <Tooltip><TooltipTrigger asChild><Button variant="ghost" size="icon" aria-label="群信息" aria-expanded={panel === "members"} onClick={() => openPanel("members")}><IconUsers size={20} stroke={1.5} aria-hidden="true" /></Button></TooltipTrigger><TooltipContent>群信息</TooltipContent></Tooltip>
      </div></header>
      {session.error && <div className="chat-error" role="alert"><p>{session.error}</p><Button size="sm" variant="ghost" onClick={() => void session.reload()}>重新读取</Button></div>}
      <div className="chat-body">
        <div className="chat-conversation">
          {session.page && snapshot ? <MessageList key={session.windowRevision} active={active} page={session.page} localUserId={snapshot.local_user.id} generation={snapshot.data_generation_id} firstItemIndex={session.firstItemIndex} targetMessageId={session.targetMessageId} followLatest={session.atBottom && !session.page.has_more_after} hasNewMessages={session.hasNewMessages} loadingMore={session.loadingMore} onLoadOlder={session.loadOlder} onLoadNewer={session.loadNewer} onAtBottomChange={session.updateAtBottom} onRenderedAnchorChange={session.updateRenderedAnchor} onGoToLatest={session.goToLatest} /> : <div className="flex min-h-0 flex-1 flex-col items-center justify-center gap-3 p-6 text-center text-text-secondary" role="status"><IconMessageCircle size={32} stroke={1.3} aria-hidden="true" /><p>{session.loading ? "正在读取本地聊天…" : "聊天数据尚未就绪，原始数据不会被覆盖。"}</p></div>}
          <MessageComposer active={active} dataGenerationId={snapshot?.data_generation_id ?? null} disabled={!snapshot} onSend={(text, requestId) => sceneAdapters[scene?.kind ?? "group"]!.send(session, text, requestId)} />
        </div>
        <SearchPanel open={panel === "search" && active} onOpenChange={(open) => { if (!open) closePanel() }} generation={snapshot?.data_generation_id ?? null} onLocate={session.jumpTo} />
        {panel === "members" && snapshot && <GroupInformation snapshot={snapshot} onClose={closePanel} onNavigate={onNavigate} />}
      </div>
    </section>
  </div>
}
