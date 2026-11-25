import { useCallback, useEffect, useRef, useState } from "react"
import { IconUsers } from "@tabler/icons-react"
import type { AppSnapshot, InboxSummary } from "@/contracts/generated"
import { listen } from "@tauri-apps/api/event"
import { ipc, isDesktopEnvironment } from "@/app/ipc"
import { useAppearance } from "@/app/useAppearance"
import { formatConversationTime } from "@/features/chat/message-time"
import "./tray.css"

/**
 * 托盘悬浮面板：独立窗口，不启动聊天会话，只读取未读摘要。
 * 每次显示由 Rust 派发 `sageroom-tray-refresh`，因此始终是刚取到的数据。
 */
export function TrayPopup() {
  const [snapshot, setSnapshot] = useState<AppSnapshot | null>(null)
  const [summary, setSummary] = useState<InboxSummary | null>(null)
  const generation = useRef<string | null>(null)
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
      setSummary(inbox)
    } catch {
      // 面板保持上一次内容；错误不影响主窗口的聊天与提示。
    }
  }, [])

  useEffect(() => {
    queueMicrotask(() => { void refresh() })
    // Rust 在每次显示时直接推送汇总，绕过 IPC 时序；同时保留旧事件作为兜底。
    let unlisten: (() => void) | undefined
    void listen<InboxSummary>("sageroom-tray-summary", (event) => { setSummary(event.payload) }).then((fn) => { unlisten = fn })
    const handler = () => { void refresh() }
    window.addEventListener("sageroom-tray-refresh", handler)
    return () => { window.removeEventListener("sageroom-tray-refresh", handler); unlisten?.() }
  }, [refresh])

  async function open(conversationId: string, throughSeq: string) {
    const current = generation.current
    if (!current) return
    try {
      await ipc.trayOpenMain({ data_generation_id: current, conversation_id: conversationId, through_seq: throughSeq })
    } catch {
      // 主窗口会展示自己的错误；面板不额外弹出提示。
    }
  }

  // 与 Rust 侧的弹出条件保持一致：只列有未读的会话，空房间不进面板。
  const conversations = (summary?.conversations ?? []).filter((item) => item.unread_count > 0)
  return <div className="tray-panel">
    {!summary
      ? <p className="tray-panel-empty">正在读取…</p>
      : conversations.length === 0
      ? <p className="tray-panel-empty">暂无会话</p>
      : <ul className="tray-conversation-list">
        {conversations.map((item) => <li key={item.id}>
          <button type="button" className="tray-conversation" onClick={() => void open(item.id, item.latest_seq)}>
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
