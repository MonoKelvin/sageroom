import { useCallback, useEffect, useState, type CSSProperties } from "react"
import { IconX } from "@tabler/icons-react"
import { useChatSession } from "@/features/chat/useChatSession"
import { useAppearance } from "./useAppearance"
import { applicationPages, type PageId } from "./navigation"
import { NavigationRail } from "./NavigationRail"
import { Titlebar } from "./Titlebar"
import { useWindowState } from "./useWindowState"
import { ConfigurationProvider } from "./ConfigurationProvider"
import { useConfigurationAppearance, useConfigurationRuntime } from "./configurationContext"

export type { ApplicationPageProps, PageId } from "./navigation"

export function AppShell() {
  const session = useChatSession()
  return <ConfigurationProvider snapshot={session.snapshot}><ApplicationShell session={session} /></ConfigurationProvider>
}

function ApplicationShell({ session }: { session: ReturnType<typeof useChatSession> }) {
  const runtime = useConfigurationRuntime()
  const previewAppearance = useConfigurationAppearance()
  const [currentPage, setCurrentPage] = useState<PageId>("chat")
  const windowState = useWindowState()
  const [pixelRatio, setPixelRatio] = useState(() => window.devicePixelRatio)
  useEffect(() => {
    const update = () => setPixelRatio(window.devicePixelRatio)
    window.addEventListener("resize", update)
    return () => window.removeEventListener("resize", update)
  }, [])
  // WebView 缩放改变 CSS px，窗口轮廓仍与原生 DIP 命中区域对齐。
  const zoom = pixelRatio / windowState.nativeScale
  const frameStyle = { "--window-gutter": `${16 / zoom}px`, "--window-radius": `${20 / zoom}px`, "--frame-shadow-y": `${5 / zoom}px`, "--frame-shadow-blur": `${16 / zoom}px` } as CSSProperties
  useAppearance(previewAppearance ?? session.snapshot?.appearance)
  const navigate = useCallback((page: PageId) => setCurrentPage(page), [])

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
          <NavigationRail pages={applicationPages} current={currentPage} onNavigate={navigate} />
          <main className="application-pages">
            {applicationPages.map(({ id, title, component: Page }) => {
              const active = id === currentPage
              return (
                <section key={id} className="application-page" aria-label={title} hidden={!active} inert={!active}>
                  <Page session={session} active={active} onNavigate={navigate} />
                </section>
              )
            })}
          </main>
        </div>
        <div id="application-layers" className="application-layers" />
      </div>
    </div>
  )
}
