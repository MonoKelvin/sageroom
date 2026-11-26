import { useCallback, useEffect, useRef, useState } from "react"
import { IconUsers } from "@tabler/icons-react"
import type { AppSnapshot, InboxSummary } from "@/contracts/generated"
import { emit, emitTo, listen } from "@tauri-apps/api/event"
import { ipc, isDesktopEnvironment } from "@/app/ipc"
import { useAppearance } from "@/app/useAppearance"
import { formatConversationTime } from "@/features/chat/message-time"
import "./tray.css"

declare global {
  interface Window {
    /** Rust 在每次显示面板时直接写入，避免首次 hover 的事件注册竞态。 */
    __TRAY_SUMMARY__?: InboxSummary
    /** 随汇总一起注入，点击会话时无需再靠 snapshot IPC 才能拿到generation。 */
    __TRAY_GENERATION__?: string
  }
}

/**
 * 托盘悬浮面板：独立窗口，不启动聊天会话，只读取未读摘要。
 * 数据优先取 Rust 直接注入的汇总，IPC 只作为窗口已就绪后的刷新手段。
 */
export function TrayPopup() {
  const [snapshot, setSnapshot] = useState<AppSnapshot | null>(null)
  const [summary, setSummary] = useState<InboxSummary | null>(() => window.__TRAY_SUMMARY__ ?? null)
  const [error, setError] = useState<string | null>(null)
  const generation = useRef<string | null>(null)
  // 面板是透明浮窗，指针按下后窗口可能立即失焦/隐藏，click 不一定能完成；
  // 用 pointerdown 立即发起，click 只兜底键盘激活，避免一次点击触发两次。
  const opening = useRef(false)
  useAppearance(snapshot?.appearance)

  const refresh = useCallback(async () => {
    if (!isDesktopEnvironment()) return
    try {
      // generation 只需取一次；托盘窗口每次显示都重新拉未读汇总。
      if (!generation.current) {
        const next = await ipc.snapshot({ data_generation_id: null, last_event_seq: null })
        generation.current = next.data_generation_id
        setSnapshot(next)
      }
      const inbox = await ipc.getInbox({ data_generation_id: generation.current })
      window.__TRAY_SUMMARY__ = inbox
      setSummary(inbox)
      setError(null)
    } catch (cause) {
      // 之前这里静默吞掉异常，任何一次 IPC 失败都会让面板永久停在“正在读取…”。
      setError(cause instanceof Error ? cause.message : String(cause))
    }
  }, [])

  useEffect(() => {
    queueMicrotask(() => { void refresh() })
    let unlisten: (() => void) | undefined
    const accept = (inbox: InboxSummary) => {
      if (!inbox) return
      window.__TRAY_SUMMARY__ = inbox
      setSummary(inbox)
      setError(null)
    }
    // Rust 在 show 时直接注入 DOM 事件与全局变量，不依赖 Tauri 监听是否已注册。
    const domHandler = (event: Event) => accept((event as CustomEvent<InboxSummary>).detail)
    window.addEventListener("sageroom-tray-summary-dom", domHandler)
    void listen<InboxSummary>("sageroom-tray-summary", (event) => accept(event.payload)).then((fn) => { unlisten = fn })
    return () => { window.removeEventListener("sageroom-tray-summary-dom", domHandler); unlisten?.() }
  }, [refresh])

  async function open(conversationId: string, throughSeq: string) {
    if (opening.current) return
    opening.current = true
    // 成功后面板会隐藏、组件不卸载；定时解除去抖，下一次悬停点击仍能打开。
    setTimeout(() => { opening.current = false }, 1000)
    // 不因 generation 缺失而放弃打开：Rust 侧会把标已读失败与唤回主窗口解耦。
    const current = generation.current ?? window.__TRAY_GENERATION__ ?? ""
    // 先直接向主窗口发导航信号：即便托盘窗口的 IPC 命令被 ACL 拒绝或响应丢失，
    // 主窗口仍能立刻切到聊天页；IPC 只负责唤回窗口与标已读。
    const detail = { conversation_id: conversationId, through_seq: throughSeq }
    void emitTo("main", "sageroom-open-chat", detail).catch(() => {})
    void emit("sageroom-open-chat", detail).catch(() => {})
    try {
      await ipc.trayOpenMain({ data_generation_id: current, conversation_id: conversationId, through_seq: throughSeq })
    } catch (cause) {
      // 打开失败时切到错误态并显示原因，避免点击后毫无反馈。
      opening.current = false
      setSummary(null)
      setError(cause instanceof Error ? cause.message : String(cause))
    }
  }

  // 与 Rust 侧的弹出条件保持一致：只列有未读的会话，空房间不进面板。
  const conversations = (summary?.conversations ?? []).filter((item) => item.unread_count > 0)
  return <div className="tray-panel">
    {!summary
      ? error
        ? <div className="tray-panel-error">
            <p>读取失败：{error.slice(0, 100)}</p>
            <button type="button" onClick={() => { setError(null); void refresh() }}>重试</button>
          </div>
        : <p className="tray-panel-empty">正在读取…</p>
      : conversations.length === 0
      ? <p className="tray-panel-empty">暂无会话</p>
      : <ul className="tray-conversation-list">
        {conversations.map((item) => <li key={item.id}>
          <button
            type="button"
            className="tray-conversation"
            onPointerDown={(event) => { if (event.button === 0) { event.preventDefault(); void open(item.id, item.latest_seq) } }}
            onClick={(event) => { if (event.detail === 0) void open(item.id, item.latest_seq) }}
          >
            <span className="tray-avatar">
              <IconUsers size={18} stroke={1.5} aria-hidden="true" />
              {item.unread_count > 0 && <span className="unread-badge tray-unread-tag" data-muted={item.muted || undefined} aria-hidden="true">{item.muted ? null : item.unread_count > 99 ? "99+" : item.unread_count}</span>}
            </span>
            <span className="tray-conversation-main">
              <span className="conversation-heading">
                <strong className="conversation-heading-name">{item.name}</strong>
                {item.latest_at > 0 && <time className="conversation-heading-time">{formatConversationTime(item.latest_at)}</time>}
              </span>
              {!item.muted && <span className="conversation-preview">{item.latest_sender ? `${item.latest_sender}：` : ""}{item.latest_preview}</span>}
            </span>
          </button>
        </li>)}
      </ul>}
  </div>
}
