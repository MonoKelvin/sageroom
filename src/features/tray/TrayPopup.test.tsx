import { act, render, screen } from "@testing-library/react"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { inboxConversation, inboxSummary } from "@/features/chat/chat.test-fixtures"
import { ipc } from "@/app/ipc"
import { TrayPopup } from "./TrayPopup"

vi.mock("@/app/ipc", () => ({
  ipc: { snapshot: vi.fn(), getInbox: vi.fn(), trayOpenMain: vi.fn() },
  isDesktopEnvironment: () => true,
}))
vi.mock("@/app/useAppearance", () => ({ useAppearance: () => {} }))
vi.mock("@tauri-apps/api/event", () => ({ listen: vi.fn(async () => () => {}), emit: vi.fn(async () => {}), emitTo: vi.fn(async () => {}) }))

describe("托盘面板数据加载", () => {
  beforeEach(() => {
    delete window.__TRAY_SUMMARY__
    delete window.__TRAY_GENERATION__
    vi.mocked(ipc.snapshot).mockReset()
    vi.mocked(ipc.getInbox).mockReset()
    vi.mocked(ipc.trayOpenMain).mockReset()
  })

  it("Rust 注入的汇总直接显示，IPC 失败也不卡在正在读取", async () => {
    vi.mocked(ipc.snapshot).mockRejectedValue(new Error("permission denied"))
    vi.mocked(ipc.getInbox).mockRejectedValue(new Error("permission denied"))
    render(<TrayPopup />)

    const summary = inboxSummary([inboxConversation({
      unread_count: 3,
      latest_sender: "墨",
      latest_preview: "今晚打游戏",
      latest_at: Date.now(),
    })])
    act(() => {
      window.dispatchEvent(new CustomEvent("sageroom-tray-summary-dom", { detail: summary }))
    })

    expect(await screen.findByText(/今晚打游戏/)).toBeInTheDocument()
    expect(screen.queryByText("正在读取…")).not.toBeInTheDocument()
  })

  it("已有全局变量时首帧即可显示，不再等待事件注册", async () => {
    vi.mocked(ipc.snapshot).mockRejectedValue(new Error("permission denied"))
    window.__TRAY_SUMMARY__ = inboxSummary([inboxConversation({
      unread_count: 1,
      latest_sender: "云",
      latest_preview: "新消息内容",
      latest_at: Date.now(),
    })])
    render(<TrayPopup />)
    expect(await screen.findByText(/新消息内容/)).toBeInTheDocument()
  })

  it("点击会话用 Rust 注入的 generation 唤回主窗口，不等 snapshot IPC", async () => {
    vi.mocked(ipc.snapshot).mockRejectedValue(new Error("permission denied"))
    window.__TRAY_GENERATION__ = "gen-from-rust"
    window.__TRAY_SUMMARY__ = inboxSummary([inboxConversation({
      id: "room-click",
      unread_count: 1,
      latest_seq: "7",
      latest_at: Date.now(),
    })])
    render(<TrayPopup />)
    await act(async () => { screen.getByRole("button").click() })
    expect(ipc.trayOpenMain).toHaveBeenCalledWith({
      data_generation_id: "gen-from-rust",
      conversation_id: "room-click",
      through_seq: "7",
    })
  })

  it("读取失败时显示原因与重试，不再永久停在正在读取", async () => {
    vi.mocked(ipc.snapshot).mockRejectedValue(new Error("permission denied"))
    render(<TrayPopup />)
    expect(await screen.findByText(/读取失败/)).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "重试" })).toBeInTheDocument()
  })
})
