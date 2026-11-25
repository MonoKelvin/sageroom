import React from "react"
import ReactDOM from "react-dom/client"
import { isTauri } from "@tauri-apps/api/core"
import { getCurrentWindow } from "@tauri-apps/api/window"
import { TooltipProvider } from "@/components/ui/tooltip"
import { ToastProvider } from "@/components/ui/toast"
import { AppShell } from "@/app/AppShell"
import { TrayPopup } from "@/features/tray/TrayPopup"
import { suppressNativeContextMenu } from "@/app/native-context-menu"
import { suppressFileDrop } from "@/app/file-drop-guard"
import "./index.css"
// 连续圆角代理层：全局作用于所有 border-radius，唯一开关为 --corner-curve
import "./styles/corner-curvature.css"

// 托盘悬浮面板与主窗口共用同一份前端资源，用窗口 label 分流。
const trayPopup = (() => {
  try {
    return isTauri() && getCurrentWindow().label === "tray_popup"
  } catch {
    return false
  }
})()

if (trayPopup) document.documentElement.dataset.trayPopup = "true"

// 应用内不出现浏览器 / WebView2 自带的右键菜单。
suppressNativeContextMenu()
// 允许文本拖放的同时，阻止拖入文件导致 WebView2 导航离开应用。
suppressFileDrop()

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    {trayPopup ? <TrayPopup /> : <ToastProvider>
      <TooltipProvider>
        <AppShell />
      </TooltipProvider>
    </ToastProvider>}
  </React.StrictMode>,
)
