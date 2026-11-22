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
    await userEvent.click(screen.getByRole("button", { name: "提及成员" }))
    await userEvent.click(await screen.findByRole("menuitemcheckbox", { name: "Sage" }))
    await userEvent.keyboard("{Escape}")
    const input = screen.getByRole("textbox", { name: "消息输入" })
    expect(input).toHaveFocus()
    await userEvent.type(input, "回应")
    await userEvent.click(screen.getByRole("button", { name: "发送消息" }))
    await screen.findByText("数据库忙碌")
    expect(screen.getByRole("button", { name: "取消引用" })).toBeVisible()
    expect(screen.getByRole("button", { name: "移除提及 Sage" })).toBeVisible()
    expect(onSend.mock.calls[0]?.[2]).toEqual({ quote_message_id: "message-1", mention_ids: ["sage-test"], mention_all: false })
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
    fireEvent.click(screen.getByRole("button", { name: /发送/ }))
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

  it("只有显式群主权限提供所有人选项，昵称正文不推导结构化提及", async () => {
    const onSend = vi.fn().mockResolvedValue(undefined)
    render(<MessageComposer dataGenerationId="generation" disabled={false} participants={snapshot().participants} onSend={onSend} />)
    await userEvent.click(screen.getByRole("button", { name: "提及成员" }))
    expect(screen.queryByRole("menuitemcheckbox", { name: "所有人" })).not.toBeInTheDocument()
    await userEvent.keyboard("{Escape}")
    await userEvent.type(screen.getByRole("textbox", { name: "消息输入" }), "@所有人 @Sage")
    await userEvent.click(screen.getByRole("button", { name: "发送消息" }))
    expect(onSend.mock.calls[0]?.[2]).toEqual({ quote_message_id: null, mention_ids: [], mention_all: false })
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
})
