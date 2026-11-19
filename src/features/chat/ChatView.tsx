import { useCallback, useEffect, useRef, useState, type MouseEvent } from "react"
import { getCurrentWindow } from "@tauri-apps/api/window"
import { IconMinus, IconSearch, IconSettings, IconUsers, IconX } from "@tabler/icons-react"
import { AppearanceDialog } from "@/app/AppearanceDialog"
import { ipc, isDesktopEnvironment } from "@/app/ipc"
import { useAppearance } from "@/app/useAppearance"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { MessageComposer } from "./MessageComposer"
import { MessageList } from "./MessageList"
import { SearchPanel } from "./SearchPanel"
import { useChatSession } from "./useChatSession"

export function ChatView() {
  const session = useChatSession()
  const [searchOpen, setSearchOpen] = useState(false)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [membersOpen, setMembersOpen] = useState(false)
  const [windowError, setWindowError] = useState<string | null>(null)
  const snapshot = session.snapshot
  const focusReturns = useRef<Record<"search" | "settings" | "members", HTMLElement | null>>({ search: null, settings: null, members: null })
  useAppearance(snapshot?.appearance)

  const openPanel = useCallback((panel: "search" | "settings" | "members") => {
    if ((panel === "search" && searchOpen) || (panel === "settings" && settingsOpen) || (panel === "members" && membersOpen)) return
    focusReturns.current[panel] = document.activeElement instanceof HTMLElement ? document.activeElement : null
    if (panel === "search") setSearchOpen(true)
    else if (panel === "settings") setSettingsOpen(true)
    else setMembersOpen(true)
  }, [membersOpen, searchOpen, settingsOpen])

  function returnFocus(panel: "search" | "settings" | "members") {
    const target = focusReturns.current[panel]
    if (target?.isConnected) target.focus()
  }

  useEffect(() => {
    const onKeyDown = (event: globalThis.KeyboardEvent) => {
      if (!event.ctrlKey || event.altKey || event.isComposing) return
      if (event.key.toLowerCase() === "f") {
        event.preventDefault()
        openPanel("search")
      } else if (event.key === ",") {
        event.preventDefault()
        openPanel("settings")
      }
    }
    window.addEventListener("keydown", onKeyDown)
    return () => window.removeEventListener("keydown", onKeyDown)
  }, [openPanel])

  async function windowAction(action: "minimize" | "close" | "drag" | "maximize") {
    if (!isDesktopEnvironment()) {
      setWindowError("请在桌面应用中使用窗口控制。")
      return
    }
    try {
      const current = getCurrentWindow()
      if (action === "minimize") await current.minimize()
      else if (action === "close") await current.close()
      else if (action === "maximize") await current.toggleMaximize()
      else await current.startDragging()
    } catch {
      setWindowError("无法完成窗口操作，请重试。")
    }
  }

  function drag(event: MouseEvent<HTMLElement>) {
    if (event.button !== 0 || (event.target instanceof Element && event.target.closest("button"))) return
    void windowAction("drag")
  }

  async function exit() {
    await ipc.exit({ data_generation_id: snapshot?.data_generation_id ?? null })
  }

  return (
    <main className="flex h-full min-h-0 flex-col bg-canvas text-text-primary">
      <header className="flex h-16 shrink-0 select-none items-center gap-1 border-b border-border/60 bg-chrome px-2.5" onMouseDown={drag} onDoubleClick={(event) => { if (!(event.target instanceof Element && event.target.closest("button"))) void windowAction("maximize") }}>
        <div className="min-w-0 flex-1 px-1.5">
          <h1 className="truncate text-sm font-semibold" title={snapshot?.room.name ?? "Sageroom"}>{snapshot?.room.name ?? "Sageroom"}</h1>
          <p className="mt-0.5 truncate text-[11px] text-text-secondary">{session.loading ? "正在读取本地聊天" : snapshot ? "本地聊天室" : "本地数据未就绪"}</p>
        </div>
        <Tooltip><TooltipTrigger asChild><Button variant="ghost" size="icon-sm" aria-label="查看成员" onClick={() => openPanel("members")}><IconUsers size={18} aria-hidden="true" /></Button></TooltipTrigger><TooltipContent>成员</TooltipContent></Tooltip>
        <Tooltip><TooltipTrigger asChild><Button variant="ghost" size="icon-sm" aria-label="搜索聊天" onClick={() => openPanel("search")}><IconSearch size={18} aria-hidden="true" /></Button></TooltipTrigger><TooltipContent>搜索 Ctrl+F</TooltipContent></Tooltip>
        <Tooltip><TooltipTrigger asChild><Button variant="ghost" size="icon-sm" aria-label="打开设置" onClick={() => openPanel("settings")}><IconSettings size={18} aria-hidden="true" /></Button></TooltipTrigger><TooltipContent>设置 Ctrl+,</TooltipContent></Tooltip>
        <div className="mx-0.5 h-4 w-px bg-border/70" aria-hidden="true" />
        <Button variant="ghost" size="icon-sm" aria-label="最小化窗口" onClick={() => void windowAction("minimize")}><IconMinus size={18} aria-hidden="true" /></Button>
        <Button variant="ghost" size="icon-sm" aria-label="关闭到托盘" onClick={() => void windowAction("close")}><IconX size={18} aria-hidden="true" /></Button>
      </header>

      {(session.error || windowError) && <div role="alert" className="flex shrink-0 items-start justify-between gap-2 border-b border-border/60 bg-content px-3 py-2 text-sm"><p className="min-w-0 leading-relaxed text-destructive">{session.error || windowError}</p><Button size="sm" variant="ghost" className="h-6 shrink-0 px-2 text-xs" onClick={() => { setWindowError(null); void session.reload() }}>重新读取</Button></div>}
      <div className="flex min-h-0 flex-1 flex-col mx-auto w-full max-w-3xl">
        {session.page && snapshot ? <MessageList
          key={session.windowRevision}
          page={session.page}
          localUserId={snapshot.local_user.id}
          firstItemIndex={session.firstItemIndex}
          targetMessageId={session.targetMessageId}
          followLatest={session.atBottom && !session.page.has_more_after}
          hasNewMessages={session.hasNewMessages}
          loadingMore={session.loadingMore}
          onLoadOlder={session.loadOlder}
          onLoadNewer={session.loadNewer}
          onAtBottomChange={session.updateAtBottom}
          onRenderedAnchorChange={session.updateRenderedAnchor}
          onGoToLatest={session.goToLatest}
        /> : <div className="flex flex-1 items-center justify-center px-6 text-center text-sm text-text-secondary" role="status">{session.loading ? "正在读取本地聊天…" : "聊天数据尚未就绪，原始数据不会被覆盖。"}</div>}
        <MessageComposer dataGenerationId={snapshot?.data_generation_id ?? null} disabled={!snapshot} onSend={session.send} />
      </div>

      <SearchPanel open={searchOpen} onOpenChange={setSearchOpen} generation={snapshot?.data_generation_id ?? null} onLocate={session.jumpTo} onReturnFocus={() => returnFocus("search")} />
      <AppearanceDialog open={settingsOpen} onOpenChange={setSettingsOpen} snapshot={snapshot} onSaved={session.applyAppearance} onExit={exit} onReturnFocus={() => returnFocus("settings")} />
      <Dialog open={membersOpen} onOpenChange={setMembersOpen}>
        <DialogContent onCloseAutoFocus={(event) => { event.preventDefault(); returnFocus("members") }}><DialogHeader><DialogTitle>群成员</DialogTitle><DialogDescription>社交成员与本地用户平等，不因群主身份拥有聊天优先权。</DialogDescription></DialogHeader>
          {snapshot ? <ul className="space-y-4">{snapshot.participants.map((participant) => <li key={participant.id} className="flex min-w-0 items-start gap-3"><span aria-hidden="true" className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 font-medium text-primary">{[...participant.display_name][0] ?? "?"}</span><div className="min-w-0"><p className="truncate text-sm font-medium">{participant.display_name}<span className="ml-2 text-xs font-normal text-text-secondary">{participant.kind === "user" ? "本地用户" : "智能体"}</span></p><p className="mt-1 text-xs leading-relaxed text-text-secondary">{participant.status === "needs_configuration" ? "需要配置模型，暂不参与聊天" : "在聊天室中"}</p><p className="mt-1 text-xs leading-relaxed text-text-secondary [overflow-wrap:anywhere]">{participant.introduction}</p></div></li>)}</ul> : <p className="text-sm text-text-secondary">成员资料尚未就绪。</p>}
        </DialogContent>
      </Dialog>
    </main>
  )
}
