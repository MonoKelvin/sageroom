import type {} from "@testing-library/jest-dom/vitest"
import { act, fireEvent, render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest"
import { message, snapshot } from "./chat.test-fixtures"
import { MessageComposer } from "./MessageComposer"

vi.mock("@/app/ipc", () => ({ errorMessage: (error: unknown) => error instanceof Error ? error.message : "测试失败" }))

beforeEach(() => vi.clearAllMocks())
const addedMethods: string[] = []
beforeAll(() => {
  for (const method of ["scrollIntoView", "hasPointerCapture", "setPointerCapture", "releasePointerCapture"]) if (!(method in HTMLElement.prototype)) {
    Object.defineProperty(HTMLElement.prototype, method, { configurable: true, value: method === "hasPointerCapture" ? () => false : () => {} })
    addedMethods.push(method)
  }
  if (!globalThis.ResizeObserver) vi.stubGlobal("ResizeObserver", class { observe() {} unobserve() {} disconnect() {} })
})
afterAll(() => { for (const method of addedMethods) Reflect.deleteProperty(HTMLElement.prototype, method); vi.unstubAllGlobals() })

describe("消息输入", () => {
  it("引用和成员 ID 随草稿保留，失败重试完整复用提交", async () => {
    const onSend = vi.fn().mockRejectedValueOnce(new Error("数据库忙碌")).mockResolvedValue(undefined)
    const onRemoveQuote = vi.fn()
    render(<MessageComposer dataGenerationId="generation" disabled={false} participants={snapshot().participants} quoteMessageId="message-1" quote={message(1, "被引用正文")} onRemoveQuote={onRemoveQuote} onSend={onSend} />)
    const input = screen.getByRole("textbox", { name: "消息输入" })
    // 输入 @ 直接呼出成员列表，选中后成为正文里的胶囊，而不是独立一行
    await userEvent.type(input, "@")
    await userEvent.click(await screen.findByRole("option", { name: "Sage" }))
    await userEvent.type(input, "回应")
    expect(input).toHaveValue("@Sage 回应")
    await userEvent.click(screen.getByRole("button", { name: "发送消息" }))
    await screen.findByText("数据库忙碌")
    expect(screen.getByRole("button", { name: "取消引用" })).toBeVisible()
    expect(onSend.mock.calls[0]?.[2]).toEqual(expect.objectContaining({ quote_message_id: "message-1", mention_ids: ["sage-test"], mention_all: false }))
    await userEvent.click(screen.getByRole("button", { name: "重试发送" }))
    await waitFor(() => expect(input).toHaveValue(""))
    expect(onSend.mock.calls[1]).toEqual(onSend.mock.calls[0])
    expect(onRemoveQuote).toHaveBeenCalledOnce()
  })

  it("引用切换后不复用失败请求，即使最后又选回原消息", async () => {
    const onSend = vi.fn().mockRejectedValueOnce(new Error("失败")).mockResolvedValue(undefined)
    const props = { dataGenerationId: "generation", disabled: false, onSend }
    const view = render(<MessageComposer {...props} quoteMessageId="message-1" quote={message(1)} />)
    const input = screen.getByRole("textbox", { name: "消息输入" })
    fireEvent.change(input, { target: { value: "回应" } })
    fireEvent.click(screen.getByRole("button", { name: "发送消息" }))
    await screen.findByText("失败")
    view.rerender(<MessageComposer {...props} quoteMessageId="message-2" quote={message(2)} />)
    view.rerender(<MessageComposer {...props} quoteMessageId="message-1" quote={message(1)} />)
    fireEvent.click(screen.getByRole("button", { name: "发送消息" }))
    await waitFor(() => expect(onSend).toHaveBeenCalledTimes(2))
    expect(onSend.mock.calls[1]?.[1]).not.toBe(onSend.mock.calls[0]?.[1])
  })

  it("迟到成功不清空新选引用或其文字草稿", async () => {
    let complete!: () => void
    const onSend = vi.fn().mockReturnValue(new Promise<void>((resolve) => { complete = resolve }))
    const onRemoveQuote = vi.fn()
    const props = { dataGenerationId: "generation", disabled: false, onSend, onRemoveQuote }
    const view = render(<MessageComposer {...props} quoteMessageId="message-1" quote={message(1)} />)
    const input = screen.getByRole("textbox", { name: "消息输入" })
    fireEvent.change(input, { target: { value: "回应" } })
    fireEvent.click(screen.getByRole("button", { name: "发送消息" }))
    view.rerender(<MessageComposer {...props} quoteMessageId="message-2" quote={message(2, "新引用")} />)
    await act(async () => complete())
    expect(input).toHaveValue("回应")
    expect(screen.getByRole("generic", { name: "引用预览" })).toHaveTextContent("新引用")
    expect(onRemoveQuote).not.toHaveBeenCalled()
  })

  it("所有人只在群主权限下生效，正文里打出的成员名同样算结构化提及", async () => {
    const onSend = vi.fn().mockResolvedValue(undefined)
    const view = render(<MessageComposer dataGenerationId="generation" disabled={false} participants={snapshot().participants} onSend={onSend} />)
    const input = screen.getByRole("textbox", { name: "消息输入" })
    await userEvent.type(input, "@")
    expect(screen.queryByRole("option", { name: "所有人" })).not.toBeInTheDocument()
    fireEvent.change(input, { target: { value: "@所有人 @Sage" } })
    await userEvent.click(screen.getByRole("button", { name: "发送消息" }))
    await waitFor(() => expect(onSend).toHaveBeenCalledOnce())
    // 没有群主权限时 @所有人 只是普通文本，@Sage 仍然识别成结构化提及
    expect(onSend.mock.calls[0]?.[2]).toEqual(expect.objectContaining({ mention_ids: ["sage-test"], mention_all: false }))

    onSend.mockClear()
    view.rerender(<MessageComposer dataGenerationId="generation" disabled={false} participants={snapshot().participants} canMentionAll onSend={onSend} />)
    const owner = screen.getByRole("textbox", { name: "消息输入" })
    await userEvent.type(owner, "@")
    expect(await screen.findByRole("option", { name: "所有人" })).toBeInTheDocument()
    fireEvent.change(owner, { target: { value: "@所有人 看这里" } })
    await userEvent.click(screen.getByRole("button", { name: "发送消息" }))
    await waitFor(() => expect(onSend).toHaveBeenCalledOnce())
    expect(onSend.mock.calls[0]?.[2]).toEqual(expect.objectContaining({ mention_ids: [], mention_all: true }))
  })

  it("IME 组合态 Enter 和 Shift+Enter 都不发送", async () => {
    const onSend = vi.fn().mockResolvedValue(undefined)
    render(<MessageComposer dataGenerationId="generation" disabled={false} onSend={onSend} />)
    const input = screen.getByRole("textbox", { name: "消息输入" })
    fireEvent.change(input, { target: { value: "中文输入" } })
    fireEvent.compositionStart(input)
    fireEvent.keyDown(input, { key: "Enter", code: "Enter", keyCode: 13, isComposing: true })
    expect(onSend).not.toHaveBeenCalled()
    fireEvent.compositionEnd(input)
    fireEvent.keyDown(input, { key: "Enter", code: "Enter", shiftKey: true })
    expect(onSend).not.toHaveBeenCalled()
    fireEvent.keyDown(input, { key: "Enter", code: "Enter" })
    await waitFor(() => expect(onSend).toHaveBeenCalledOnce())
  })

  it("纯空白和超限文本不能提交，空白不产生提示文案", () => {
    const onSend = vi.fn()
    render(<MessageComposer dataGenerationId="generation" disabled={false} onSend={onSend} />)
    const input = screen.getByRole("textbox", { name: "消息输入" })
    expect(screen.queryByText("Shift+Enter 换行")).not.toBeInTheDocument()
    fireEvent.change(input, { target: { value: " \n" } })
    expect(screen.getByRole("button", { name: "发送消息" })).toBeDisabled()
    expect(screen.queryByRole("alert")).not.toBeInTheDocument()
    fireEvent.change(input, { target: { value: "x".repeat(10_001) } })
    expect(screen.getByRole("alert")).toHaveTextContent("10000")
    expect(screen.getByRole("button", { name: "发送消息" })).toBeDisabled()
    expect(onSend).not.toHaveBeenCalled()
  })

  it("迟到的成功不会清掉之后输入的新草稿", async () => {
    let complete!: () => void
    const onSend = vi.fn().mockReturnValue(new Promise<void>((resolve) => { complete = resolve }))
    render(<MessageComposer dataGenerationId="generation" disabled={false} onSend={onSend} />)
    const input = screen.getByRole("textbox", { name: "消息输入" })
    fireEvent.change(input, { target: { value: "第一条" } })
    fireEvent.click(screen.getByRole("button", { name: "发送消息" }))
    fireEvent.change(input, { target: { value: "新的草稿" } })
    await act(async () => complete())
    expect(input).toHaveValue("新的草稿")
    expect(onSend.mock.calls[0]?.[0]).toBe("第一条")
  })

  it("失败保留草稿，同一提交重试复用 request ID", async () => {
    const onSend = vi.fn().mockRejectedValueOnce(new Error("磁盘空间不足")).mockResolvedValue(undefined)
    render(<MessageComposer dataGenerationId="generation" disabled={false} onSend={onSend} />)
    const input = screen.getByRole("textbox", { name: "消息输入" })
    fireEvent.change(input, { target: { value: "保留这条" } })
    fireEvent.click(screen.getByRole("button", { name: "发送消息" }))
    await screen.findByText("磁盘空间不足")
    expect(input).toHaveValue("保留这条")
    fireEvent.click(screen.getByRole("button", { name: "重试发送" }))
    await waitFor(() => expect(input).toHaveValue(""))
    expect(onSend.mock.calls[1]?.[1]).toBe(onSend.mock.calls[0]?.[1])
  })

  it("编辑后的新提交不复用失败请求，即使正文又改回原值", async () => {
    const onSend = vi.fn().mockRejectedValueOnce(new Error("暂时失败")).mockResolvedValue(undefined)
    render(<MessageComposer dataGenerationId="generation" disabled={false} onSend={onSend} />)
    const input = screen.getByRole("textbox", { name: "消息输入" })
    fireEvent.change(input, { target: { value: "原值" } })
    fireEvent.click(screen.getByRole("button", { name: "发送消息" }))
    await screen.findByText("暂时失败")
    fireEvent.change(input, { target: { value: "另一份草稿" } })
    fireEvent.change(input, { target: { value: "原值" } })
    fireEvent.click(screen.getByRole("button", { name: "发送消息" }))
    await waitFor(() => expect(onSend).toHaveBeenCalledTimes(2))
    expect(onSend.mock.calls[1]?.[1]).not.toBe(onSend.mock.calls[0]?.[1])
  })

  it("世代改变时保留草稿但新建提交意图", async () => {
    const onSend = vi.fn().mockRejectedValueOnce(new Error("数据已变更")).mockResolvedValue(undefined)
    const { rerender } = render(<MessageComposer dataGenerationId="old" disabled={false} onSend={onSend} />)
    const input = screen.getByRole("textbox", { name: "消息输入" })
    fireEvent.change(input, { target: { value: "等待确认" } })
    fireEvent.click(screen.getByRole("button", { name: "发送消息" }))
    await screen.findByText("数据已变更")
    rerender(<MessageComposer dataGenerationId="new" disabled={false} onSend={onSend} />)
    expect(input).toHaveValue("等待确认")
    fireEvent.click(screen.getByRole("button", { name: "发送消息" }))
    await waitFor(() => expect(onSend).toHaveBeenCalledTimes(2))
    expect(onSend.mock.calls[1]?.[1]).not.toBe(onSend.mock.calls[0]?.[1])
  })

  it("右键菜单按选区启用操作，执行后保留光标位置", async () => {
    render(<MessageComposer dataGenerationId="generation" disabled={false} onSend={vi.fn()} />)
    const input = screen.getByRole("textbox", { name: "消息输入" }) as HTMLTextAreaElement
    fireEvent.change(input, { target: { value: "你好世界" } })

    // 无选区：复制/剪切/删除禁用，全选可用
    input.setSelectionRange(4, 4)
    fireEvent.select(input)
    fireEvent.contextMenu(input)
    await screen.findByRole("menu", { name: "输入框编辑" })
    // 菜单打开不能让输入框失焦，否则选区高亮会消失
    expect(input).toHaveFocus()
    const item = (name: string) => screen.getByRole("menuitem", { name })
    expect(item("复制")).toBeDisabled()
    expect(item("剪切")).toBeDisabled()
    expect(item("删除")).toBeDisabled()
    expect(item("全选")).toBeEnabled()

    // 全选后复制/剪切/删除应可用
    fireEvent.click(item("全选"))
    await waitFor(() => expect(input.selectionStart).toBe(0))
    expect(input.selectionEnd).toBe(4)

    fireEvent.contextMenu(input)
    expect(await screen.findByRole("menuitem", { name: "复制" })).toBeEnabled()
    expect(screen.getByRole("menuitem", { name: "剪切" })).toBeEnabled()
    expect(screen.getByRole("menuitem", { name: "删除" })).toBeEnabled()

    // 删除选区后内容与光标正确
    fireEvent.click(screen.getByRole("menuitem", { name: "删除" }))
    expect(input).toHaveValue("")
  })

  it("输入框禁用时右键菜单不可编辑操作", async () => {
    render(<MessageComposer dataGenerationId="generation" disabled onSend={vi.fn()} />)
    const input = screen.getByRole("textbox", { name: "消息输入" }) as HTMLTextAreaElement
    fireEvent.contextMenu(input)
    const menu = await screen.findByRole("menu", { name: "输入框编辑" })
    expect(menu).toBeInTheDocument()
    expect(screen.getByRole("menuitem", { name: "粘贴" })).toBeDisabled()
    expect(screen.getByRole("menuitem", { name: "全选" })).toBeDisabled()
  })

  it("滚轮按行滚动：普通一行，Ctrl 加速", () => {
    render(<MessageComposer dataGenerationId="generation" disabled={false} onSend={vi.fn()} />)
    const input = screen.getByRole("textbox", { name: "消息输入" }) as HTMLTextAreaElement
    // 伪造可滚动状态与行高（jsdom 不做真实布局）
    Object.defineProperty(input, "scrollHeight", { configurable: true, value: 400 })
    Object.defineProperty(input, "clientHeight", { configurable: true, value: 100 })
    vi.spyOn(window, "getComputedStyle").mockReturnValue({ lineHeight: "21px", fontSize: "14px" } as CSSStyleDeclaration)
    input.scrollTop = 60

    fireEvent.wheel(input, { deltaY: 100 })
    expect(input.scrollTop).toBe(81)
    fireEvent.wheel(input, { deltaY: 100, ctrlKey: true })
    expect(input.scrollTop).toBe(165)
    fireEvent.wheel(input, { deltaY: -100 })
    expect(input.scrollTop).toBe(144)
    vi.mocked(window.getComputedStyle).mockRestore()
  })

  it("双击手柄在最小与聊天区一半之间切换", () => {
    // 挂载时就会测量，需在渲染前拦截，让聊天区报告 600 高度
    vi.spyOn(HTMLElement.prototype, "getBoundingClientRect").mockImplementation(function (this: HTMLElement) {
      if (this.classList.contains("chat-conversation")) return { height: 600, width: 800, top: 0, left: 0, bottom: 600, right: 800, x: 0, y: 0, toJSON: () => ({}) } as DOMRect
      // textarea 高度跟随当前 style.height，模拟真实布局
      const height = this.tagName === "TEXTAREA" ? (Number.parseFloat((this as HTMLTextAreaElement).style.height) || 76) : 0
      return { height, width: 100, top: 0, left: 0, bottom: 0, right: 0, x: 0, y: 0, toJSON: () => ({}) } as DOMRect
    })
    try {
      render(
        <div className="chat-conversation">
          <MessageComposer dataGenerationId="generation" disabled={false} onSend={vi.fn()} />
        </div>,
      )
      const handle = screen.getByRole("separator", { name: "拖动上边界调整输入框高度" })
      const input = screen.getByRole("textbox", { name: "消息输入" }) as HTMLTextAreaElement

      // 最小态（76）双击 → 展开到一半（300）
      fireEvent.doubleClick(handle)
      expect(input.style.height).toBe("300px")

      // 已展开再双击 → 收回最小
      fireEvent.doubleClick(handle)
      expect(input.style.height).toBe("76px")
    } finally {
      // 必须在原型上还原，否则会影响后续用例
      vi.mocked(HTMLElement.prototype.getBoundingClientRect).mockRestore()
    }
  })
})
