import { useCallback, useEffect, useState, type CSSProperties } from "react"
import { IconX } from "@tabler/icons-react"
import { ipc } from "@/app/ipc"
import { useChatSession } from "@/features/chat/useChatSession"
import { useInbox } from "@/features/chat/useInbox"
import { useAppearance } from "./useAppearance"
import { applicationPages, type PageId } from "./navigation"
import { NavigationRail } from "./NavigationRail"
import { Titlebar } from "./Titlebar"
import { useWindowState } from "./useWindowState"
import { ConfigurationProvider } from "./ConfigurationProvider"
import { useConfigurationAppearance, useConfigurationRuntime } from "./configurationContext"

export type { ApplicationPageProps, PageId } from "./navigation"

const resizeDirections = ["North", "NorthEast", "East", "SouthEast", "South", "SouthWest", "West", "NorthWest"] as const

export function AppShell() {
  const session = useChatSession()
  return <ConfigurationProvider snapshot={session.snapshot}><ApplicationShell session={session} /></ConfigurationProvider>

}

function ApplicationShell({ session }: { session: ReturnType<typeof useChatSession> }) {
  const inbox = useInbox(session.snapshot?.data_generation_id ?? null, session.snapshot?.latest_message_seq ?? null)
  const runtime = useConfigurationRuntime()
  const previewAppearance = useConfigurationAppearance()
  const [currentPage, setCurrentPage] = useState<PageId>("chat")
  const [focused, setFocused] = useState(() => document.hasFocus())
  const windowState = useWindowState()
  const [pixelRatio, setPixelRatio] = useState(() => window.devicePixelRatio)
  useEffect(() => {
    const update = () => setPixelRatio(window.devicePixelRatio)
    window.addEventListener("resize", update)
    return () => window.removeEventListener("resize", update)
  }, [])
  // WebView 缩放改变 CSS px，窗口轮廓仍与原生 DIP 命中区域对齐。
  const zoom = pixelRatio / windowState.nativeScale
  const frameStyle = { "--window-zoom": zoom } as CSSProperties
  useAppearance(previewAppearance ?? session.snapshot?.appearance)
  const setChatActive = session.setChatActive
  const navigate = useCallback((page: PageId) => {
    setChatActive(page === "chat")
    setCurrentPage(page)
  }, [setChatActive])

  // 托盘只在窗口未激活、或激活但不在聊天页时闪动；免打扰未读不计入汇总。
  const generation = session.snapshot?.data_generation_id ?? null
  const unreadTotal = inbox.summary?.unread_total ?? 0
  const conversationCount = inbox.summary?.conversations.length ?? 0
  const trayFlashing = unreadTotal > 0 && (!focused || currentPage !== "chat")
  useEffect(() => {
    if (!generation) return
    void ipc.traySync({ data_generation_id: generation, flashing: trayFlashing, conversation_count: conversationCount }).catch(() => {})
  }, [generation, trayFlashing, conversationCount])

  // 托盘面板点击会话后由 Rust 派发事件，主窗口落到聊天页而不是停在别的页面。
  useEffect(() => {
    const handler = () => navigate("chat")
    window.addEventListener("sageroom-open-chat", handler)
    return () => window.removeEventListener("sageroom-open-chat", handler)
  }, [navigate])

  useEffect(() => {
    const onFocus = () => setFocused(true)
    const onBlur = () => setFocused(false)
    window.addEventListener("focus", onFocus)
    window.addEventListener("blur", onBlur)
    return () => { window.removeEventListener("focus", onFocus); window.removeEventListener("blur", onBlur) }
  }, [])

  useEffect(() => {
    const pointer = () => { document.documentElement.dataset.inputModality = "pointer" }
    const keyboard = () => { document.documentElement.dataset.inputModality = "keyboard" }
    window.addEventListener("pointerdown", pointer, true)
    window.addEventListener("keydown", keyboard, true)
    return () => { window.removeEventListener("pointerdown", pointer, true); window.removeEventListener("keydown", keyboard, true) }
  }, [])

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.ctrlKey && event.key === "," && !event.altKey && !event.isComposing) {
        event.preventDefault()
        navigate("settings")
      }
    }
    window.addEventListener("keydown", onKeyDown)
    return () => window.removeEventListener("keydown", onKeyDown)
  }, [navigate])

  return (
    <div className="stage" data-maximized={windowState.maximized} style={frameStyle}>
      <div className="canvas application-shell" data-maximized={windowState.maximized}>
        <Titlebar maximized={windowState.maximized} onAction={windowState.perform} />
        {(windowState.error || runtime.error) && (
          <div className="window-error" role="alert">
            <span>{windowState.error ?? runtime.error}</span>
            <button type="button" className="icon-button" aria-label="关闭窗口提示" onClick={() => { windowState.clearError(); runtime.clearError() }}><IconX size={16} stroke={1.5} aria-hidden="true" /></button>
          </div>
        )}
        {runtime.exiting && <div className="exit-progress" role="status">正在完成已应用修改并退出…</div>}
        <div className="application-body">
          <NavigationRail pages={applicationPages} current={currentPage} unreadTotal={unreadTotal} onNavigate={navigate} />
          <main className="application-pages">
            {applicationPages.map(({ id, title, component: Page }) => {
              const active = id === currentPage
              return (
                <section key={id} className="application-page" aria-label={title} hidden={!active} inert={!active}>
                  <Page session={session} inbox={inbox} active={active} onNavigate={navigate} />
                </section>
              )
            })}
          </main>
        </div>
        <div id="application-layers" className="application-layers" />
        {!windowState.maximized && resizeDirections.map((direction) => (
          <div
            key={direction}
            className="window-resize-handle"
            data-direction={direction}
            aria-hidden="true"
            onPointerDown={(event) => {
              if (event.button !== 0) return
              event.preventDefault()
              event.stopPropagation()
              void windowState.perform({ resize: direction })
            }}
          />
        ))}
      </div>
    </div>
  )
}
