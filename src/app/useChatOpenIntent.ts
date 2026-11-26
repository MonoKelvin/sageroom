import { useCallback, useEffect, useRef } from "react"
import { listen } from "@tauri-apps/api/event"
import { ipc, isDesktopEnvironment } from "./ipc"

/**
 * 领取托盘点击留下的「打开聊天页」意图。
 * Rust 侧用原生事件通知，同时持久化一个待领取标记：
 * 事件早于 React 挂载丢失时，挂载、窗口重新可见或重新聚焦仍能补上导航。
 */
export function useChatOpenIntent(onOpen: () => void) {
  // 事件与 IPC 标记可能几乎同时到达，导航只执行一次。
  const lastOpenAt = useRef(0)
  const fire = useCallback(() => {
    const now = Date.now()
    if (now - lastOpenAt.current < 1000) return
    lastOpenAt.current = now
    onOpen()
  }, [onOpen])

  // 只领取、不导航：用于清掉可能重复的标记。
  const consume = useCallback(async () => {
    if (!isDesktopEnvironment()) return false
    try {
      const state = await ipc.consumeChatOpen({ data_generation_id: null })
      return state.requested
    } catch {
      // 领取失败不阻断当前界面；下次触发会重试。
      return false
    }
  }, [])

  const claim = useCallback(async () => {
    if (await consume()) fire()
  }, [consume, fire])

  useEffect(() => {
    void claim()
    let unlisten: (() => void) | undefined
    // 原生事件本身就是明确信号：即使标记被其他触发抢先消费，也先完成导航，
    // 再清掉标记，避免“事件到了但界面没动”。
    void listen("sageroom-open-chat", () => {
      fire()
      void consume()
    }).then((fn) => { unlisten = fn })
    const onFocus = () => { void claim() }
    const onVisibility = () => { if (document.visibilityState === "visible") void claim() }
    window.addEventListener("focus", onFocus)
    document.addEventListener("visibilitychange", onVisibility)
    window.addEventListener("pageshow", onFocus)
    return () => {
      window.removeEventListener("focus", onFocus)
      document.removeEventListener("visibilitychange", onVisibility)
      window.removeEventListener("pageshow", onFocus)
      unlisten?.()
    }
  }, [claim, consume, fire])
}
