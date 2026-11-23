import React from "react"
import ReactDOM from "react-dom/client"
import { TooltipProvider } from "@/components/ui/tooltip"
import { ToastProvider } from "@/components/ui/toast"
import { AppShell } from "@/app/AppShell"
import { suppressNativeContextMenu } from "@/app/native-context-menu"
import "./index.css"

// 应用内不出现浏览器 / WebView2 自带的右键菜单。
suppressNativeContextMenu()

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <ToastProvider>
      <TooltipProvider>
        <AppShell />
      </TooltipProvider>
    </ToastProvider>
  </React.StrictMode>,
)
