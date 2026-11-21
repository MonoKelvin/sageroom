import { useCallback, useEffect, useRef, useState } from "react"
import { getCurrentWindow } from "@tauri-apps/api/window"
import { isDesktopEnvironment } from "./ipc"

export type WindowAction = "minimize" | "maximize" | "close" | "drag" | {
  resize: Parameters<ReturnType<typeof getCurrentWindow>["startResizeDragging"]>[0]
}

export function useWindowState() {
  const [maximized, setMaximized] = useState(false)
  const [nativeScale, setNativeScale] = useState(1)
  const [error, setError] = useState<string | null>(null)
  const mounted = useRef(false)
  const revision = useRef(0)

  const refresh = useCallback(async () => {
    const currentRevision = ++revision.current
    const current = getCurrentWindow()
    const [value, scale] = await Promise.all([current.isMaximized(), current.scaleFactor()])
    if (mounted.current && currentRevision === revision.current) {
      setMaximized(value)
      setNativeScale(scale)
    }
  }, [])

  useEffect(() => {
    mounted.current = true
    if (!isDesktopEnvironment()) return () => { mounted.current = false }
    let unsubscribe: (() => void) | undefined
    let disposed = false
    const update = () => {
      if (disposed) return
      void refresh().catch(() => {
        if (!disposed) setError("无法读取窗口状态，请重试窗口操作。")
      })
    }
    void getCurrentWindow().onResized(update).then((unlisten) => {
      if (disposed) unlisten()
      else unsubscribe = unlisten
    }).catch(() => {
      if (!disposed) setError("无法监听窗口变化，请重新打开应用。")
    })
    update()
    return () => {
      disposed = true
      mounted.current = false
      revision.current += 1
      unsubscribe?.()
    }
  }, [refresh])

  const perform = useCallback(async (action: WindowAction) => {
    if (!isDesktopEnvironment()) {
      setError("请在桌面应用中使用窗口控制。")
      return
    }
    setError(null)
    try {
      const current = getCurrentWindow()
      if (typeof action !== "string") await current.startResizeDragging(action.resize)
      else if (action === "minimize") await current.minimize()
      else if (action === "close") await current.close()
      else if (action === "drag") await current.startDragging()
      else {
        await current.toggleMaximize()
        await refresh()
      }
    } catch {
      if (mounted.current) setError("无法完成窗口操作，请重试。")
    }
  }, [refresh])

  const clearError = useCallback(() => setError(null), [])
  return { maximized, nativeScale, error, clearError, perform }
}
