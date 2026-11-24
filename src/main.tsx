import React from "react"
import ReactDOM from "react-dom/client"
import { TooltipProvider } from "@/components/ui/tooltip"
import { ToastProvider } from "@/components/ui/toast"
import { AppShell } from "@/app/AppShell"
import { suppressNativeContextMenu } from "@/app/native-context-menu"
import { suppressFileDrop } from "@/app/file-drop-guard"
import "./index.css"
// 连续圆角代理层：全局作用于所有 border-radius，唯一开关为 --corner-curve
import "./styles/corner-curvature.css"

// 应用内不出现浏览器 / WebView2 自带的右键菜单。
suppressNativeContextMenu()
// 允许文本拖放的同时，阻止拖入文件导致 WebView2 导航离开应用。
suppressFileDrop()

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <ToastProvider>
      <TooltipProvider>
        <AppShell />
      </TooltipProvider>
    </ToastProvider>
  </React.StrictMode>,
)
