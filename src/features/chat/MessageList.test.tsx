import type {} from "@testing-library/jest-dom/vitest"
import { Fragment, type ComponentProps, type ReactNode } from "react"
import { act, cleanup, fireEvent, render, screen } from "@testing-library/react"
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest"
import type { ChatMessage } from "@/contracts/generated"
import { ToastProvider } from "@/components/ui/toast"
import { MessageList } from "./MessageList"
import { GENERATION, USER_ID, message, page, snapshot } from "./chat.test-fixtures"

vi.mock("react-virtuoso", () => ({
  Virtuoso: ({ data, firstItemIndex, itemContent }: { data: ChatMessage[]; firstItemIndex: number; itemContent: (index: number, message: ChatMessage) => ReactNode }) => <div>{data.map((item, index) => <Fragment key={item.id}>{itemContent(firstItemIndex + index, item)}</Fragment>)}</div>,
}))

const NOW = Date.UTC(2026, 10, 23, 10, 30)
const participants = new Map(snapshot().participants.map((participant) => [participant.id, participant]))
const addedMethods: string[] = []
const originalClipboard = Object.getOwnPropertyDescriptor(navigator, "clipboard")
beforeAll(() => {
  for (const method of ["scrollIntoView", "hasPointerCapture", "setPointerCapture", "releasePointerCapture"]) if (!(method in HTMLElement.prototype)) {
    Object.defineProperty(HTMLElement.prototype, method, { configurable: true, value: method === "hasPointerCapture" ? () => false : () => {} })
    addedMethods.push(method)
  }
  if (!globalThis.ResizeObserver) vi.stubGlobal("ResizeObserver", class { observe() {} unobserve() {} disconnect() {} })
})
afterAll(() => { for (const method of addedMethods) Reflect.deleteProperty(HTMLElement.prototype, method); vi.unstubAllGlobals() })
beforeEach(() => {
  vi.useFakeTimers(); vi.setSystemTime(NOW); document.documentElement.dataset.reducedMotion = "true"
  Object.defineProperty(navigator, "clipboard", { configurable: true, value: { writeText: vi.fn().mockResolvedValue(undefined) } })
})
afterEach(() => {
  cleanup(); vi.restoreAllMocks(); vi.useRealTimers(); delete document.documentElement.dataset.reducedMotion
  if (originalClipboard) Object.defineProperty(navigator, "clipboard", originalClipboard)
  else Reflect.deleteProperty(navigator, "clipboard")
})

function recent(seq = 1, age = 0): ChatMessage { return { ...message(seq, `消息正文 ${seq}`), created_at: NOW - age } }
function propsFor(items: ChatMessage[] = [recent()], overrides: Partial<ComponentProps<typeof MessageList>> = {}): ComponentProps<typeof MessageList> {
  return {
    generation: GENERATION, participants, page: page([], { items }), localUserId: USER_ID, firstItemIndex: 0,
    targetMessageId: null, restoreAnchor: null, followLatest: true, hasNewMessages: false, newMessageCount: 0, loadingMore: false,
    onLoadOlder: vi.fn(), onLoadNewer: vi.fn(), onAtBottomChange: vi.fn(), onRenderedAnchorChange: vi.fn(),
    onGoToLatest: vi.fn(), onQuote: vi.fn(), onRecall: vi.fn().mockResolvedValue(undefined), ...overrides,
  }
}
function mount(props = propsFor()) {
  const user = { click: async (element: HTMLElement) => {
    await act(async () => {
      if (element.getAttribute("aria-haspopup") === "menu") fireEvent.keyDown(element, { key: "Enter" })
      else fireEvent.click(element)
    })
  } }
  const view = render(<ToastProvider><MessageList {...props} /></ToastProvider>)
  return { user, ...view, update: (next: ComponentProps<typeof MessageList>) => view.rerender(<ToastProvider><MessageList {...next} /></ToastProvider>) }
}

async function openMessageMenu(container: HTMLElement, seq = "1") {
  const bubble = container.querySelector<HTMLElement>(`[data-message-id="message-${seq}"] .chat-message-bubble`)
  if (!bubble) throw new Error(`找不到消息气泡 message-${seq}`)
  await act(async () => { fireEvent.contextMenu(bubble, { clientX: 12, clientY: 12 }) })
}

describe("消息撤回菜单与系统 Tag", () => {
  it("未满三分钟可撤回，菜单保持打开时到期只移除撤回", async () => {
    const { container } = mount(propsFor([recent(1, 179_999)]))
    await openMessageMenu(container)
    expect(screen.getByRole("menuitem", { name: "撤回" })).toBeInTheDocument()
    act(() => { vi.advanceTimersByTime(1) })
    expect(screen.queryByRole("menuitem", { name: "撤回" })).not.toBeInTheDocument()
    expect(screen.getByRole("menuitem", { name: "复制" })).toBeInTheDocument()
    expect(screen.getByRole("menuitem", { name: "引用" })).toBeInTheDocument()
    act(() => { vi.advanceTimersByTime(1) })
    expect(screen.queryByRole("alert")).not.toBeInTheDocument()
  })

  it.each([180_000, 180_001])("消息年龄 %ims 时不提供撤回入口", async (age) => {
    const { container } = mount(propsFor([recent(1, age)]))
    await openMessageMenu(container)
    expect(screen.queryByRole("menuitem", { name: "撤回" })).not.toBeInTheDocument()
    expect(screen.getByRole("menuitem", { name: "复制" })).toBeInTheDocument()
    expect(screen.getByRole("menuitem", { name: "引用" })).toBeInTheDocument()
    expect(screen.queryByRole("alert")).not.toBeInTheDocument()
  })

  it("窗口恢复时复核时间，避免暂停计时器留下过期入口", async () => {
    const { container } = mount()
    await openMessageMenu(container)
    vi.setSystemTime(NOW + 180_001)
    fireEvent.focus(window)
    expect(screen.queryByRole("menuitem", { name: "撤回" })).not.toBeInTheDocument()
    expect(screen.getByRole("menuitem", { name: "复制" })).toBeInTheDocument()
  })

  it("点击时再次检查期限，不向接口发送过期请求", async () => {
    const onRecall = vi.fn().mockResolvedValue(undefined)
    const { container } = mount(propsFor([recent()], { onRecall }))
    await openMessageMenu(container)
    const item = screen.getByRole("menuitem", { name: "撤回" })
    vi.setSystemTime(NOW + 180_000)
    fireEvent.click(item)
    expect(onRecall).not.toHaveBeenCalled()
    expect(screen.getByText("消息正文 1")).toBeInTheDocument()
    expect(screen.queryByRole("alert")).not.toBeInTheDocument()
  })

  it("其他成员的消息没有撤回入口", async () => {
    const { container } = mount(propsFor([{ ...recent(), sender_id: "sage-test" }]))
    await openMessageMenu(container)
    expect(screen.queryByRole("menuitem", { name: "撤回" })).not.toBeInTheDocument()
  })

  it("右键点击气泡以外的空白区域不弹出消息菜单，头像有自己的菜单", async () => {
    const { container } = mount(propsFor([recent(1), recent(2)]))
    const row = container.querySelector<HTMLElement>('[data-message-id="message-2"]')!
    const article = row.closest("article")!
    for (const target of [article, row]) {
      await act(async () => { fireEvent.contextMenu(target, { clientX: 12, clientY: 12 }) })
      expect(screen.queryByRole("menu")).not.toBeInTheDocument()
      expect(target).not.toHaveAttribute("aria-haspopup", "menu")
    }
    // 头像单独提供 @某人 / 查看信息，但不该顺带弹出消息菜单
    const avatar = row.querySelector(".chat-message-avatar")!
    await act(async () => { fireEvent.contextMenu(avatar, { clientX: 12, clientY: 12 }) })
    expect(screen.getByRole("menu")).toBeInTheDocument()
    expect(screen.getByRole("menuitem", { name: "查看信息" })).toBeInTheDocument()
    await act(async () => { fireEvent.keyDown(document, { key: "Escape" }) })
    // 气泡本身仍然可以弹出
    await openMessageMenu(container, "2")
    expect(screen.getByRole("menu")).toBeInTheDocument()
    expect(container.querySelector('[data-message-id="message-2"] .chat-message-bubble')).toHaveAttribute("aria-haspopup", "menu")
  })

  it("撤回失败保留消息与幂等 ID，不显示错误或成功 Tag", async () => {
    const onRecall = vi.fn().mockRejectedValueOnce(new Error("拒绝撤回")).mockResolvedValueOnce(undefined)
    const { user, container } = mount(propsFor([recent()], { onRecall }))
    await openMessageMenu(container)
    await user.click(screen.getByRole("menuitem", { name: "撤回" }))
    await act(async () => {})
    expect(screen.getByText("消息正文 1")).toBeInTheDocument()
    expect(screen.queryByRole("alert")).not.toBeInTheDocument()
    expect(container.querySelector('[data-kind="recall"]')).toBeNull()
    await openMessageMenu(container)
    await user.click(screen.getByRole("menuitem", { name: "撤回" }))
    expect(onRecall).toHaveBeenCalledTimes(2)
    expect(onRecall.mock.calls[0]).toEqual(onRecall.mock.calls[1])
    expect(onRecall.mock.calls[0][0]).toBe("message-1")
  })

  it("在原消息位置替换 Tag，保留 ID、seq、高亮与顺序，不显示原头像气泡", () => {
    const items = [recent(1), recent(2), recent(3)]
    const props = propsFor(items, { targetMessageId: "message-2" })
    const { container, update } = mount(props)
    const ids = () => [...container.querySelectorAll<HTMLElement>("[data-message-id]")].map((node) => node.dataset.messageId)
    const before = ids()
    update({ ...props, page: page([], { items: items.map((item) => item.id === "message-2" ? { ...item, state: "recalled", parts: [] } : item) }) })
    expect(ids()).toEqual(before)
    const row = container.querySelector('[data-message-id="message-2"]')!
    expect(row).toHaveAttribute("data-message-seq", "2")
    expect(row).toHaveClass("chat-message-highlight")
    expect(row.querySelector('.chat-system-tag[data-kind="recall"]')).toHaveTextContent("我撤回了一条消息")
    expect(row.querySelector(".chat-message-avatar, .chat-message-bubble")).toBeNull()
    expect(screen.queryByText("消息正文 2")).not.toBeInTheDocument()
    expect(screen.getByText("消息正文 1")).toBeInTheDocument()
    expect(screen.getByText("消息正文 3")).toBeInTheDocument()
  })

  it("时间与撤回共用系统 Tag，已删除消息保持原来的气泡表现", () => {
    const { container } = mount(propsFor([{ ...recent(1, 600_000), state: "recalled", parts: [] }, { ...recent(2), state: "deleted", parts: [] }]))
    expect(container.querySelectorAll('.chat-system-tag[data-kind="time"]')).toHaveLength(2)
    expect(container.querySelector('.chat-system-tag[data-kind="recall"]')).toBeInTheDocument()
    expect(container.querySelector('[data-message-id="message-2"] .chat-message-bubble')).toHaveTextContent("消息已删除")
    expect(container.querySelector('[data-message-id="message-2"] .chat-system-tag')).toBeNull()
  })
})

describe("消息复制反馈", () => {
  it("仅复制到剪贴板，不显示已复制文字或成功 Toast", async () => {
    const { user, container } = mount()
    const write = vi.spyOn(navigator.clipboard, "writeText").mockResolvedValue(undefined)
    await openMessageMenu(container)
    await user.click(screen.getByRole("menuitem", { name: "复制" }))
    expect(write).toHaveBeenCalledWith("消息正文 1")
    expect(screen.queryByText("已复制")).not.toBeInTheDocument()
    expect(screen.queryByRole("status")).not.toBeInTheDocument()
  })

  it("复制失败只显示错误 Toast，不在消息下面插入提示", async () => {
    const { user, container } = mount()
    vi.spyOn(navigator.clipboard, "writeText").mockRejectedValue(new Error("剪贴板不可用"))
    await openMessageMenu(container)
    await user.click(screen.getByRole("menuitem", { name: "复制" }))
    await act(async () => {})
    expect(screen.getByRole("alert")).toHaveClass("toast-item")
    expect(screen.getByRole("alert")).toHaveTextContent("复制失败，请重试。")
    expect(container.querySelector(".chat-message-feedback")).toBeNull()
  })
})

describe("底部新消息提示", () => {
  it("停留期间收到新消息时显示具体条数", () => {
    mount(propsFor([recent()], { hasNewMessages: true, newMessageCount: 3 }))
    expect(screen.getByRole("button", { name: /3 条新消息/ })).toBeInTheDocument()
  })

  it("只有更多历史而没有新消息时保持回到最新", () => {
    mount(propsFor([recent()], { page: page([], { items: [recent()], has_more_after: true }) }))
    expect(screen.getByRole("button", { name: /回到最新/ })).toBeInTheDocument()
  })

  it("顶部未读入口或第一条未读已可见时，底部不再出现胶囊", () => {
    mount(propsFor([recent()], { hasNewMessages: true, newMessageCount: 3, hideLatestNotice: true }))
    expect(screen.queryByRole("button", { name: /3 条新消息/ })).not.toBeInTheDocument()
    expect(screen.queryByRole("button", { name: /回到最新/ })).not.toBeInTheDocument()
  })
})
