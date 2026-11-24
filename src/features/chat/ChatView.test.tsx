import type {} from "@testing-library/jest-dom/vitest"
import { render, screen } from "@testing-library/react"
import { describe, expect, it, vi } from "vitest"
import type { ApplicationPageProps } from "@/app/navigation"
import type { AgentRuntimeStatus } from "@/contracts/generated"
import { ChatView } from "./ChatView"
import { page, snapshot } from "./chat.test-fixtures"

function sessionFor(agents: { name: string; status: AgentRuntimeStatus }[] = []): ApplicationPageProps["session"] {
  const value = snapshot()
  value.participants = [value.local_user, ...agents.map(({ name, status }, index) => ({
    ...value.participants[1], id: `agent-${index}`, display_name: name,
    runtime: { agent_id: `agent-${index}`, config_revision: "1", status, detail: null, next_wake_at: null, requests_today: 0 },
  }))]
  return {
    snapshot: value, page: page(), loading: false, loadingMore: false, error: null,
    hasNewMessages: false, atBottom: true, firstItemIndex: 0, windowRevision: 0,
    targetMessageId: null, restoreAnchor: null, enteringIds: new Set<string>(), reload: vi.fn(), send: vi.fn(), recall: vi.fn(),
    goToLatest: vi.fn(), jumpTo: vi.fn(), updateAtBottom: vi.fn(), updateRenderedAnchor: vi.fn(),
    setChatActive: vi.fn(), applyRoom: vi.fn(), applyAppearance: vi.fn(), loadOlder: vi.fn(), loadNewer: vi.fn(),
  }
}

describe("群聊输入提示", () => {
  it("单人提示位于群聊天信息标题栏，动画点在最后且不包含省略号字符", () => {
    const { container } = render(<ChatView session={sessionFor([{ name: "小夏", status: "waiting_to_send" }])} active onNavigate={vi.fn()} />)
    const status = screen.getByRole("status")
    expect(status).toHaveTextContent("小夏正在输入")
    expect(status.textContent).not.toMatch(/…|\.\.\./)
    expect(status.closest(".chat-heading")).not.toBeNull()
    expect(container.querySelector(".chat-conversation")?.contains(status)).toBe(false)
    expect(status.lastElementChild).toHaveClass("chat-typing-dots")
    expect(status.lastElementChild?.querySelectorAll("i")).toHaveLength(3)
  })

  it("多人只显示一个昵称与输入总人数，不展示其他昵称", () => {
    render(<ChatView session={sessionFor([{ name: "小夏", status: "waiting_to_send" }, { name: "小林", status: "waiting_to_send" }, { name: "小雨", status: "waiting_to_send" }])} active onNavigate={vi.fn()} />)
    const status = screen.getByRole("status")
    expect(status).toHaveTextContent("小夏等3人正在输入")
    expect(status).not.toHaveTextContent("小林")
    expect(status).not.toHaveTextContent("小雨")
  })

  it("模型观察与判断不显示正在输入，只计入确定要发送的成员", () => {
    const props = { active: true, onNavigate: vi.fn() }
    const view = render(<ChatView {...props} session={sessionFor([{ name: "小夏", status: "deciding" }])} />)
    expect(screen.queryByRole("status")).not.toBeInTheDocument()
    view.rerender(<ChatView {...props} session={sessionFor([{ name: "小夏", status: "deciding" }, { name: "小林", status: "waiting_to_send" }])} />)
    expect(screen.getByRole("status")).toHaveTextContent("小林正在输入")
    expect(screen.getByRole("status")).not.toHaveTextContent("小夏")
    view.rerender(<ChatView {...props} session={sessionFor([{ name: "小夏", status: "observing" }])} />)
    expect(screen.queryByRole("status")).not.toBeInTheDocument()
  })

  it("未处于输入状态的成员不计数，状态结束后移除提示", () => {
    const props = { active: true, onNavigate: vi.fn() }
    const view = render(<ChatView {...props} session={sessionFor([{ name: "小夏", status: "waiting_to_send" }, { name: "小林", status: "paused" }])} />)
    expect(screen.getByRole("status")).toHaveTextContent("小夏正在输入")
    view.rerender(<ChatView {...props} session={sessionFor([{ name: "小夏", status: "paused" }])} />)
    expect(screen.queryByRole("status")).not.toBeInTheDocument()
  })
})
