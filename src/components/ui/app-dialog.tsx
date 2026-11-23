import * as React from "react"
import * as DialogPrimitive from "@radix-ui/react-dialog"
import { IconX } from "@tabler/icons-react"
import { applicationLayerContainer } from "@/app/application-layers"
import { cn } from "@/lib/utils"
import { Button } from "./button"
import "./app-dialog.css"

export type AppDialogAction = {
  label: string
  onClick?: () => void
  variant?: React.ComponentProps<typeof Button>["variant"]
  disabled?: boolean
  /** 默认点击后关闭对话框；异步操作可设为 false 自行控制。 */
  closeOnClick?: boolean
}

/**
 * 通用对话框：标题 + 关闭 + 自定义内容区 + 底部功能按钮。
 * 默认不渲染任何暗色遮罩，背景保持原有亮度；modal 仅控制焦点与交互隔离。
 */
export function AppDialog({ open, onOpenChange, title, children, actions = [], modal = true, showClose = true, className }: {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  children?: React.ReactNode
  actions?: AppDialogAction[]
  modal?: boolean
  showClose?: boolean
  className?: string
}) {
  return <DialogPrimitive.Root open={open} onOpenChange={onOpenChange} modal={modal}>
    <DialogPrimitive.Portal container={applicationLayerContainer()}>
      <DialogPrimitive.Overlay className="app-dialog-overlay" />
      <DialogPrimitive.Content className={cn("floating-surface app-dialog-content", className)} aria-describedby={undefined}>
        <header className="app-dialog-heading">
          <DialogPrimitive.Title className="app-dialog-title">{title}</DialogPrimitive.Title>
          {showClose && <DialogPrimitive.Close asChild>
            <button type="button" className="icon-button" aria-label="关闭对话框"><IconX size={18} aria-hidden="true" /></button>
          </DialogPrimitive.Close>}
        </header>
        <div className="app-dialog-body">{children}</div>
        {actions.length > 0 && <footer className="app-dialog-footer">
          {actions.map((action, index) => <Button
            key={`${action.label}-${index}`}
            size="sm"
            variant={action.variant ?? (index === 0 ? "default" : "ghost")}
            disabled={action.disabled}
            onClick={() => {
              action.onClick?.()
              if (action.closeOnClick !== false) onOpenChange(false)
            }}
          >{action.label}</Button>)}
        </footer>}
      </DialogPrimitive.Content>
    </DialogPrimitive.Portal>
  </DialogPrimitive.Root>
}
