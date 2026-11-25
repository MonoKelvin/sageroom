import { useCallback, useEffect, useRef, useState } from "react"
import { IconMessageCircle, IconUsers } from "@tabler/icons-react"
import type { AppSnapshot, InboxSummary } from "@/contracts/generated"
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
      const next = await ipc.snapshot({ data_generation_id: null, last_event_seq: null })
      const inbox = await ipc.getInbox({ data_generation_id: next.data_generation_id })
      generation.current = next.data_generation_id
      setSnapshot(next)
      setSummary(inbox)
    } catch {
      // 面板保持上一次内容；错误不影响主窗口的聊天与提示。
    }
  }, [])

  useEffect(() => {
    queueMicrotask(() => { void refresh() })
    const handler = () => { void refresh() }
    window.addEventListener("sageroom-tray-refresh", handler)
    return () => window.removeEventListener("sageroom-tray-refresh", handler)
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

  const conversations = summary?.conversations ?? []
  const total = summary?.unread_total ?? 0
  return <div className="tray-panel">
    <header className="tray-panel-heading">
      <span className="tray-panel-title">会话</span>
      {total > 0 && <span className="tray-panel-count">{total > 99 ? "99+" : total} 条未读</span>}
    </header>
    {conversations.length === 0
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
    <footer className="tray-panel-footer"><IconMessageCircle size={14} stroke={1.5} aria-hidden="true" /><span>点击会话打开 Sageroom</span></footer>
  </div>
}
