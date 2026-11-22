import { createContext, useContext } from "react"

export type ToastKind = "info" | "success" | "warning" | "error"

export type ToastItem = { id: string; kind: ToastKind; message: string }

export type ToastApi = {
  show: (message: string, kind?: ToastKind, duration?: number) => void
  info: (message: string, duration?: number) => void
  success: (message: string, duration?: number) => void
  warning: (message: string, duration?: number) => void
  error: (message: string, duration?: number) => void
}

export const ToastContext = createContext<ToastApi | null>(null)

const noop: ToastApi = {
  show: () => {}, info: () => {}, success: () => {}, warning: () => {}, error: () => {},
}

/** 未挂载 Provider 时退化为无操作，便于组件在测试环境中独立渲染。 */
export function useToast(): ToastApi {
  return useContext(ToastContext) ?? noop
}
