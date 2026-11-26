import type {} from "@testing-library/jest-dom/vitest"
import { act, render, screen, waitFor } from "@testing-library/react"
import { afterEach, describe, expect, it, vi } from "vitest"
import type { ApplicationPageProps } from "@/app/navigation"
import type { AgentRuntimeStatus } from "@/contracts/generated"
import { ChatView } from "./ChatView"
import { inboxConversation, inboxFixture, inboxSummary, page, snapshot } from "./chat.test-fixtures"

afterEach(() => vi.restoreAllMocks())

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
    const { container } = render(<ChatView inbox={inboxFixture()} session={sessionFor([{ name: "小夏", status: "waiting_to_send" }])} active onNavigate={vi.fn()} />)
    const status = screen.getByRole("status")
    expect(status).toHaveTextContent("小夏正在输入")
    expect(status.textContent).not.toMatch(/…|\.\.\./)
    expect(status.closest(".chat-heading")).not.toBeNull()
    expect(container.querySelector(".chat-conversation")?.contains(status)).toBe(false)
    expect(status.lastElementChild).toHaveClass("chat-typing-dots")
    expect(status.lastElementChild?.querySelectorAll("i")).toHaveLength(3)
  })

  it("多人只显示一个昵称与输入总人数，不展示其他昵称", () => {
    render(<ChatView inbox={inboxFixture()} session={sessionFor([{ name: "小夏", status: "waiting_to_send" }, { name: "小林", status: "waiting_to_send" }, { name: "小雨", status: "waiting_to_send" }])} active onNavigate={vi.fn()} />)
    const status = screen.getByRole("status")
    expect(status).toHaveTextContent("小夏等3人正在输入")
    expect(status).not.toHaveTextContent("小林")
    expect(status).not.toHaveTextContent("小雨")
  })

  it("模型观察与判断不显示正在输入，只计入确定要发送的成员", () => {
    const props = { active: true, onNavigate: vi.fn() }
    const view = render(<ChatView {...props} inbox={inboxFixture()} session={sessionFor([{ name: "小夏", status: "deciding" }])} />)
    expect(screen.queryByRole("status")).not.toBeInTheDocument()
    view.rerender(<ChatView {...props} inbox={inboxFixture()} session={sessionFor([{ name: "小夏", status: "deciding" }, { name: "小林", status: "waiting_to_send" }])} />)
    expect(screen.getByRole("status")).toHaveTextContent("小林正在输入")
    expect(screen.getByRole("status")).not.toHaveTextContent("小夏")
    view.rerender(<ChatView {...props} inbox={inboxFixture()} session={sessionFor([{ name: "小夏", status: "observing" }])} />)
    expect(screen.queryByRole("status")).not.toBeInTheDocument()
  })

  it("未处于输入状态的成员不计数，状态结束后移除提示", () => {
    const props = { active: true, onNavigate: vi.fn() }
    const view = render(<ChatView {...props} inbox={inboxFixture()} session={sessionFor([{ name: "小夏", status: "waiting_to_send" }, { name: "小林", status: "paused" }])} />)
    expect(screen.getByRole("status")).toHaveTextContent("小夏正在输入")
    view.rerender(<ChatView {...props} inbox={inboxFixture()} session={sessionFor([{ name: "小夏", status: "paused" }])} />)
    expect(screen.queryByRole("status")).not.toBeInTheDocument()
  })
})

describe("会话未读", () => {
  it("列表项展示发送者摘要、未读角标，并在聚焦时清角标并提示未读", async () => {
    vi.spyOn(document, "hasFocus").mockReturnValue(true)
    const summary = inboxSummary([inboxConversation({
      unread_count: 5, latest_seq: "3", last_read_seq: "2",
      first_unread_seq: "3", first_unread_id: "message-3",
      latest_at: Date.now(), latest_sender: "小夏", latest_preview: "在吗",
    })])
    const inbox = inboxFixture(summary)
    render(<ChatView inbox={inbox} session={sessionFor()} active onNavigate={vi.fn()} />)
    expect(screen.getByText("小夏：在吗")).toBeInTheDocument()
    expect(screen.getByLabelText("5 条未读")).toHaveTextContent("5")
    // 未读提示在微任务里写入，等待一次异步查询。
    expect(await screen.findByRole("status")).toHaveTextContent("5 条未读消息")
    expect(inbox.markRead).toHaveBeenCalledWith("room-test", "3")
  })

  it("最早未读已在视口内时只清角标，不顶部提示", async () => {
    vi.spyOn(document, "hasFocus").mockReturnValue(true)
    // jsdom 没有布局，让消息与滚动视口矩形相交，模拟“进入时就已经看得到”。
    vi.spyOn(HTMLElement.prototype, "getBoundingClientRect").mockReturnValue({
      top: 100, bottom: 140, left: 0, right: 300, width: 300, height: 40, x: 0, y: 100,
      toJSON: () => ({}),
    } as DOMRect)
    const summary = inboxSummary([inboxConversation({
      unread_count: 1, latest_seq: "3", last_read_seq: "2",
      first_unread_seq: "3", first_unread_id: "message-3",
      latest_at: Date.now(), latest_sender: "小夏", latest_preview: "在吗",
    })])
    const inbox = inboxFixture(summary)
    const session = { ...sessionFor(), page: page(["3"]) }
    const { container } = render(<ChatView inbox={inbox} session={session} active onNavigate={vi.fn()} />)
    // 虚拟列表在 jsdom 里不渲染条目，手动放一条“已可见”的未读消息。
    const scroller = container.querySelector(".chat-list-scroller")
    const article = document.createElement("article")
    article.dataset.messageId = "message-3"
    scroller?.append(article)
    await waitFor(() => expect(inbox.markRead).toHaveBeenCalledWith("room-test", "3"))
    expect(screen.queryByRole("status")).not.toBeInTheDocument()
    expect(screen.queryByRole("status")).not.toBeInTheDocument()
  })

  it("滚动到第一条未读时立刻收起顶部提示", async () => {
    vi.spyOn(document, "hasFocus").mockReturnValue(true)
    const summary = inboxSummary([inboxConversation({
      unread_count: 5, latest_seq: "3", last_read_seq: "2",
      first_unread_seq: "3", first_unread_id: "message-3",
      latest_at: Date.now(), latest_sender: "小夏", latest_preview: "在吗",
    })])
    const session = { ...sessionFor(), page: page(["3"]) }
    const { container } = render(<ChatView inbox={inboxFixture(summary)} session={session} active onNavigate={vi.fn()} />)
    expect(await screen.findByRole("status")).toHaveTextContent("5 条未读消息")

    const scroller = container.querySelector<HTMLElement>(".chat-list-scroller")
    if (!scroller) throw new Error("没有找到聊天滚动容器")
    const article = document.createElement("article")
    article.dataset.messageId = "message-3"
    scroller.append(article)
    vi.spyOn(HTMLElement.prototype, "getBoundingClientRect").mockReturnValue({
      top: 100, bottom: 140, left: 0, right: 300, width: 300, height: 40, x: 0, y: 100,
      toJSON: () => ({}),
    } as DOMRect)
    act(() => { scroller.dispatchEvent(new Event("scroll")) })
    await waitFor(() => expect(screen.queryByRole("status")).not.toBeInTheDocument())
  })

  it("免打扰会话用浅色圆点代替数字，并显示铃铛", () => {
    vi.spyOn(document, "hasFocus").mockReturnValue(true)
    const summary = inboxSummary([inboxConversation({
      unread_count: 2, muted: true, latest_seq: "3", last_read_seq: "1",
      first_unread_seq: "2", first_unread_id: "message-2",
      latest_at: Date.now(), latest_sender: "小夏", latest_preview: "在吗",
    })])
    const inbox = inboxFixture(summary)
    render(<ChatView inbox={inbox} session={sessionFor()} active onNavigate={vi.fn()} />)
    expect(screen.getByLabelText("有未读消息，已免打扰")).not.toHaveTextContent("2")
    expect(screen.getByLabelText("消息免打扰")).toBeInTheDocument()
  })
})
