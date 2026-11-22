import React from "react"
import ReactDOM from "react-dom/client"
import { TooltipProvider } from "@/components/ui/tooltip"
import { ToastProvider } from "@/components/ui/toast"
import { AppShell } from "@/app/AppShell"
import "./index.css"

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <ToastProvider>
      <TooltipProvider>
        <AppShell />
      </TooltipProvider>
    </ToastProvider>
  </React.StrictMode>,
)
