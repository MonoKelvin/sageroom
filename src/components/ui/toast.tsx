import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from "react"
import { createPortal } from "react-dom"
import { IconAlertTriangle, IconCheck, IconInfoCircle, IconX, type TablerIcon } from "@tabler/icons-react"
import { ToastContext, type ToastApi, type ToastItem, type ToastKind } from "./toast-context"
import "./toast.css"

const icons: Record<ToastKind, TablerIcon> = {
  info: IconInfoCircle,
  success: IconCheck,
  warning: IconAlertTriangle,
  error: IconAlertTriangle,
}

function ToastCard({ item, onDismiss }: { item: ToastItem; onDismiss: () => void }) {
  const Icon = icons[item.kind]
  return <div className="floating-surface toast-item" data-kind={item.kind} role={item.kind === "error" ? "alert" : "status"}>
    <Icon size={18} stroke={1.6} className="toast-icon" aria-hidden="true" />
    <span className="toast-message">{item.message}</span>
    <button type="button" className="icon-button toast-close" aria-label="关闭通知" onClick={onDismiss}>
      <IconX size={16} stroke={1.6} aria-hidden="true" />
    </button>
  </div>
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<ToastItem[]>([])
  const timers = useRef(new Map<string, number>())

  const dismiss = useCallback((id: string) => {
    setItems((current) => current.filter((item) => item.id !== id))
    const timer = timers.current.get(id)
    if (timer !== undefined) {
      window.clearTimeout(timer)
      timers.current.delete(id)
    }
  }, [])

  const show = useCallback((message: string, kind: ToastKind = "info", duration = 4000) => {
    const id = crypto.randomUUID()
    setItems((current) => [...current.slice(-2), { id, kind, message }])
    timers.current.set(id, window.setTimeout(() => dismiss(id), duration))
  }, [dismiss])

  useEffect(() => () => {
    timers.current.forEach((timer) => window.clearTimeout(timer))
    timers.current.clear()
  }, [])

  const api = useMemo<ToastApi>(() => ({
    show,
    info: (message, duration) => show(message, "info", duration),
    success: (message, duration) => show(message, "success", duration),
    warning: (message, duration) => show(message, "warning", duration),
    error: (message, duration) => show(message, "error", duration),
  }), [show])

  return <ToastContext.Provider value={api}>
    {children}
    {createPortal(<div className="toast-viewport" aria-label="通知">
      {items.map((item) => <ToastCard key={item.id} item={item} onDismiss={() => dismiss(item.id)} />)}
    </div>, document.body)}
  </ToastContext.Provider>
}
