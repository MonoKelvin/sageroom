import type {} from "@testing-library/jest-dom/vitest"
import { act, fireEvent, render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest"
import { ipc } from "@/app/ipc"
import { SearchPanel } from "./SearchPanel"
import { GENERATION, page, searchPage, snapshot } from "./chat.test-fixtures"

const participants = new Map(snapshot().participants.map((participant) => [participant.id, participant]))
const addedMethods: string[] = []
beforeAll(() => {
  for (const method of ["scrollIntoView", "hasPointerCapture", "setPointerCapture", "releasePointerCapture"]) if (!(method in HTMLElement.prototype)) {
    Object.defineProperty(HTMLElement.prototype, method, { configurable: true, value: method === "hasPointerCapture" ? () => false : () => {} })
    addedMethods.push(method)
  }
  if (!globalThis.ResizeObserver) vi.stubGlobal("ResizeObserver", class { observe() {} unobserve() {} disconnect() {} })
})
afterAll(() => { for (const method of addedMethods) Reflect.deleteProperty(HTMLElement.prototype, method); vi.unstubAllGlobals() })

vi.mock("@/app/ipc", () => ({
  errorMessage: (error: unknown) => error instanceof Error ? error.message : "测试失败",
  ipc: { search: vi.fn(), cancelSearch: vi.fn(), list: vi.fn() },
}))

const NOW = new Date(2026, 10, 23, 15, 30).getTime()
beforeEach(() => {
  vi.resetAllMocks()
  document.documentElement.dataset.reducedMotion = "true"
  vi.spyOn(Date, "now").mockReturnValue(NOW)
    vi.mocked(ipc.list).mockResolvedValue(page())
  vi.mocked(ipc.cancelSearch).mockResolvedValue({ search_id: "search-test", cancellation_requested: true })
})
afterEach(() => { vi.restoreAllMocks(); delete document.documentElement.dataset.reducedMotion })

async function chooseDate(label: string, day: number) {
  await userEvent.click(screen.getByRole("button", { name: label }))
  const calendar = screen.getByRole("dialog", { name: label })
  await userEvent.click(screen.getByRole("button", { name: `2026年11月${day}日` }))
  await userEvent.click(calendar.querySelector<HTMLButtonElement>(".search-calendar-actions button:last-child")!)
}


describe("聊天搜索", () => {
  it("成员与日期形成完整分页身份，结束日期覆盖当天", async () => {
    vi.mocked(ipc.search).mockResolvedValueOnce(searchPage("测试", { has_more: true, next_cursor: "filtered-cursor" })).mockResolvedValue(searchPage("测试", { items: [{ ...searchPage().items[0], message_id: "message-2", seq: "2" }] }))
    render(<SearchPanel open participants={participants} onOpenChange={vi.fn()} generation={GENERATION} onLocate={vi.fn()} />)
    await userEvent.click(screen.getByRole("combobox", { name: "搜索成员" }))
    await userEvent.click(await screen.findByRole("option", { name: "Sage" }))
    await chooseDate("搜索开始日期", 21)
    await chooseDate("搜索结束日期", 22)
    fireEvent.change(screen.getByRole("searchbox"), { target: { value: "测试" } })
    fireEvent.click(screen.getByRole("button", { name: "开始搜索" }))
    await screen.findByRole("button", { name: "定位我的消息" })
    fireEvent.click(screen.getByRole("button", { name: "加载更早的匹配" }))
    await waitFor(() => expect(ipc.search).toHaveBeenCalledTimes(2))
    expect(ipc.search).toHaveBeenLastCalledWith(expect.objectContaining({ sender_id: "sage-test", created_after: new Date(2026, 10, 21).getTime(), created_before: new Date(2026, 10, 23).getTime(), query: "测试", cursor: "filtered-cursor" }))
  })

  it("日历禁用倒置范围，不显示日期错误提示", async () => {
    render(<SearchPanel open participants={participants} onOpenChange={vi.fn()} generation={GENERATION} onLocate={vi.fn()} />)
    await chooseDate("搜索开始日期", 22)
    await userEvent.click(screen.getByRole("button", { name: "搜索结束日期" }))
    expect(screen.getByRole("button", { name: "2026年11月21日" })).toBeDisabled()
    expect(screen.getByRole("button", { name: "2026年11月22日" })).toBeEnabled()
    expect(screen.queryByRole("button", { name: "清空" })).not.toBeInTheDocument()
    expect(screen.queryByRole("alert")).not.toBeInTheDocument()
    expect(ipc.search).not.toHaveBeenCalled()
    expect(screen.getByRole("button", { name: "搜索开始日期" })).toHaveAttribute("data-value", String(new Date(2026, 10, 22).getTime()))
  })

  it("筛选变更取消旧请求，迟到的相同文字结果不能串入", async () => {
    let finishOld!: (value: ReturnType<typeof searchPage>) => void
    vi.mocked(ipc.search).mockReturnValueOnce(new Promise((resolve) => { finishOld = resolve })).mockResolvedValueOnce(searchPage("测试", { items: [] }))
    render(<SearchPanel open participants={participants} onOpenChange={vi.fn()} generation={GENERATION} onLocate={vi.fn()} />)
    fireEvent.change(screen.getByRole("searchbox"), { target: { value: "测试" } })
    fireEvent.click(screen.getByRole("button", { name: "开始搜索" }))
    await chooseDate("搜索开始日期", 22)
    fireEvent.click(screen.getAllByRole("button", { name: "开始搜索" }).at(-1)!)
    await screen.findByText("没有匹配的消息。")
    await act(async () => finishOld(searchPage("测试")))
    expect(screen.queryByRole("button", { name: "定位我的消息" })).not.toBeInTheDocument()
    expect(ipc.cancelSearch).toHaveBeenCalledWith(expect.objectContaining({ search_id: vi.mocked(ipc.search).mock.calls[0][0].search_id }))
  })

  it("正文 epoch 改变立即隐藏旧摘要，保留查询并重新搜索", async () => {
    vi.mocked(ipc.search).mockResolvedValueOnce(searchPage("测试")).mockResolvedValue(searchPage("测试", { items: [] }))
    const props = { participants, onOpenChange: vi.fn(), generation: GENERATION, onLocate: vi.fn() }
    const view = render(<SearchPanel open contentEpoch="0" {...props} />)
    fireEvent.change(screen.getByRole("searchbox"), { target: { value: "测试" } })
    fireEvent.click(screen.getByRole("button", { name: "开始搜索" }))
    await screen.findByRole("button", { name: "定位我的消息" })
    view.rerender(<SearchPanel open contentEpoch="1" {...props} />)
    expect(screen.queryByRole("button", { name: "定位我的消息" })).not.toBeInTheDocument()
    expect(screen.getByRole("searchbox")).toHaveValue("测试")
    await screen.findByText("没有匹配的消息。")
    expect(ipc.search).toHaveBeenCalledTimes(2)
  })

  it("打开就显示统一范围与结果面板，无筛选按钮，关闭后重新打开清空", () => {
    vi.mocked(ipc.search).mockResolvedValue(searchPage())
    const props = { participants, onOpenChange: vi.fn(), generation: GENERATION, onLocate: vi.fn().mockResolvedValue(undefined) }
    const { rerender } = render(<SearchPanel open {...props} />)
    expect(screen.getByRole("complementary", { name: "搜索结果面板" })).toBeInTheDocument()
    expect(screen.getByRole("combobox", { name: "搜索成员" })).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "搜索结束日期" })).toHaveTextContent("2026/11/23")
    expect(screen.queryByRole("button", { name: "筛选搜索" })).not.toBeInTheDocument()
    rerender(<SearchPanel open={false} {...props} />)
    expect(screen.queryByRole("complementary", { name: "搜索结果面板" })).not.toBeInTheDocument()
    rerender(<SearchPanel open {...props} />)
    expect(screen.getByRole("searchbox", { name: "搜索聊天文本" })).toHaveValue("")
  })

  it("默认读取最早消息，重置恢复最早到当前时间", async () => {
    const earliest = page([1])
    vi.mocked(ipc.list).mockResolvedValue(earliest)
    vi.mocked(ipc.search).mockResolvedValue(searchPage())
    render(<SearchPanel open participants={participants} onOpenChange={vi.fn()} generation={GENERATION} onLocate={vi.fn()} />)
    const start = screen.getByRole("button", { name: "搜索开始日期" })
    await waitFor(() => expect(start).toHaveAttribute("data-value", String(earliest.items[0].created_at)))
    expect(ipc.list).toHaveBeenCalledWith(expect.objectContaining({ after_seq: "0", limit: 1 }))
    await chooseDate("搜索开始日期", 21)
    await chooseDate("搜索结束日期", 22)
    await userEvent.click(screen.getByRole("button", { name: "重置" }))
    expect(start).toHaveAttribute("data-value", String(earliest.items[0].created_at))
    expect(screen.getByRole("button", { name: "搜索结束日期" })).toHaveTextContent("2026/11/23")
    fireEvent.change(screen.getByRole("searchbox"), { target: { value: "测试" } })
    fireEvent.click(screen.getByRole("button", { name: "开始搜索" }))
    await waitFor(() => expect(ipc.search).toHaveBeenCalledWith(expect.objectContaining({ created_after: earliest.items[0].created_at, created_before: NOW + 1 })))
  })

  it("最早时间读取失败仍可搜索，不限制起始且结束必有当前时间", async () => {
    vi.mocked(ipc.list).mockRejectedValue(new Error("无法读取"))
    vi.mocked(ipc.search).mockResolvedValue(searchPage())
    render(<SearchPanel open participants={participants} onOpenChange={vi.fn()} generation={GENERATION} onLocate={vi.fn()} />)
    fireEvent.change(screen.getByRole("searchbox"), { target: { value: "测试" } })
    fireEvent.click(screen.getByRole("button", { name: "开始搜索" }))
    await screen.findByRole("button", { name: "定位我的消息" })
    expect(ipc.search).toHaveBeenCalledWith(expect.objectContaining({ created_after: null, created_before: NOW + 1 }))
    expect(screen.queryByRole("alert")).not.toBeInTheDocument()
  })

  it("迟到的最早时间不会覆盖已选的不限起始", async () => {
    let finish!: (value: ReturnType<typeof page>) => void
    vi.mocked(ipc.list).mockReturnValue(new Promise((resolve) => { finish = resolve }))
    render(<SearchPanel open participants={participants} onOpenChange={vi.fn()} generation={GENERATION} onLocate={vi.fn()} />)
    await userEvent.click(screen.getByRole("button", { name: "搜索开始日期" }))
    await userEvent.click(screen.getByRole("button", { name: "清空" }))
    await act(async () => finish(page([1])))
    expect(screen.getByRole("button", { name: "搜索开始日期" })).toHaveTextContent("—")
    expect(screen.getByRole("button", { name: "搜索开始日期" })).toHaveAttribute("data-value", "")
  })

  it("当前时间在新查询中更新，分页使用相同的时间上限", async () => {
    vi.mocked(ipc.search).mockResolvedValue(searchPage("测试", { has_more: true, next_cursor: "cursor" }))
    render(<SearchPanel open participants={participants} onOpenChange={vi.fn()} generation={GENERATION} onLocate={vi.fn()} />)
    fireEvent.change(screen.getByRole("searchbox"), { target: { value: "测试" } })
    fireEvent.click(screen.getByRole("button", { name: "开始搜索" }))
    await screen.findByRole("button", { name: "加载更早的匹配" })
    vi.mocked(Date.now).mockReturnValue(NOW + 60_000)
    fireEvent.click(screen.getByRole("button", { name: "加载更早的匹配" }))
    await waitFor(() => expect(ipc.search).toHaveBeenCalledTimes(2))
    expect(ipc.search).toHaveBeenLastCalledWith(expect.objectContaining({ cursor: "cursor", created_before: NOW + 1 }))
    fireEvent.click(screen.getByRole("button", { name: "开始搜索" }))
    await waitFor(() => expect(ipc.search).toHaveBeenCalledTimes(3))
    expect(ipc.search).toHaveBeenLastCalledWith(expect.objectContaining({ cursor: null, created_before: NOW + 60_000 + 1 }))
  })

  it("起止日期相等时仍搜索当天完整范围", async () => {
    vi.mocked(ipc.search).mockResolvedValue(searchPage())
    render(<SearchPanel open participants={participants} onOpenChange={vi.fn()} generation={GENERATION} onLocate={vi.fn()} />)
    await chooseDate("搜索开始日期", 22)
    await chooseDate("搜索结束日期", 22)
    fireEvent.change(screen.getByRole("searchbox"), { target: { value: "测试" } })
    fireEvent.click(screen.getByRole("button", { name: "开始搜索" }))
    await screen.findByRole("button", { name: "定位我的消息" })
    expect(ipc.search).toHaveBeenCalledWith(expect.objectContaining({ created_after: new Date(2026, 10, 22).getTime(), created_before: new Date(2026, 10, 23).getTime() }))
  })

  it("提交 literal 查询并通过命中序号定位", async () => {
    const onLocate = vi.fn().mockResolvedValue(undefined)
    const onOpenChange = vi.fn()
    vi.mocked(ipc.search).mockResolvedValue(searchPage())
    render(<SearchPanel open participants={participants} onOpenChange={onOpenChange} generation={GENERATION} onLocate={onLocate} />)
    fireEvent.change(screen.getByRole("searchbox", { name: "搜索聊天文本" }), { target: { value: "测试" } })
    fireEvent.click(screen.getByRole("button", { name: "开始搜索" }))
    fireEvent.click(await screen.findByRole("button", { name: "定位我的消息" }))
    await waitFor(() => expect(onLocate).toHaveBeenCalledWith("1", "message-1"))
    expect(onOpenChange).toHaveBeenCalledWith(false)
    expect(ipc.search).toHaveBeenCalledWith(expect.objectContaining({ data_generation_id: GENERATION, query: "测试", cursor: null, limit: 50 }))
  })

  it("高亮所有字面匹配并展示发送者与时间", async () => {
    const result = searchPage("测试")
    result.items[0].snippet = "测试内容，再次测试 <img src=x>"
    vi.mocked(ipc.search).mockResolvedValue(result)
    render(<SearchPanel open participants={participants} onOpenChange={vi.fn()} generation={GENERATION} onLocate={vi.fn()} />)
    fireEvent.change(screen.getByRole("searchbox", { name: "搜索聊天文本" }), { target: { value: "测试" } })
    fireEvent.click(screen.getByRole("button", { name: "开始搜索" }))
    const hit = await screen.findByRole("button", { name: "定位我的消息" })
    expect(hit.querySelectorAll("mark")).toHaveLength(2)
    expect(hit.querySelector("time")).toHaveAttribute("dateTime", new Date(result.items[0].created_at).toISOString())
    expect(hit).toHaveTextContent("我")
    expect(hit.querySelector("img.avatar-default-logo")).toHaveAttribute("src", expect.stringContaining("appicon-logo"))
  })

  it("正则特殊字符按字面匹配", async () => {
    const result = searchPage(".*")
    result.items[0].snippet = "文字 .* 文字 .*"
    vi.mocked(ipc.search).mockResolvedValue(result)
    render(<SearchPanel open participants={participants} onOpenChange={vi.fn()} generation={GENERATION} onLocate={vi.fn()} />)
    fireEvent.change(screen.getByRole("searchbox", { name: "搜索聊天文本" }), { target: { value: ".*" } })
    fireEvent.click(screen.getByRole("button", { name: "开始搜索" }))
    expect((await screen.findByRole("button", { name: "定位我的消息" })).querySelectorAll("mark")).toHaveLength(2)
  })

  it("输入法组合期间不检索，组合结束后按最终文本检索", async () => {
    vi.useFakeTimers()
    try {
      vi.mocked(ipc.search).mockResolvedValue(searchPage("中文"))
      render(<SearchPanel open participants={participants} onOpenChange={vi.fn()} generation={GENERATION} onLocate={vi.fn()} />)
      const input = screen.getByRole("searchbox", { name: "搜索聊天文本" })
      fireEvent.compositionStart(input)
      fireEvent.change(input, { target: { value: "中" } })
      await act(async () => { await vi.advanceTimersByTimeAsync(300) })
      expect(ipc.search).not.toHaveBeenCalled()
      fireEvent.change(input, { target: { value: "中文" } })
      await act(async () => { await vi.advanceTimersByTimeAsync(300) })
      expect(ipc.search).not.toHaveBeenCalled()
      fireEvent.compositionEnd(input)
      await act(async () => { await vi.advanceTimersByTimeAsync(300) })
      expect(ipc.search).toHaveBeenCalledWith(expect.objectContaining({ query: "中文" }))
    } finally {
      vi.useRealTimers()
    }
  })

  it("组合未结束时不提交检索", async () => {
    vi.mocked(ipc.search).mockResolvedValue(searchPage("中文"))
    render(<SearchPanel open participants={participants} onOpenChange={vi.fn()} generation={GENERATION} onLocate={vi.fn()} />)
    const input = screen.getByRole("searchbox", { name: "搜索聊天文本" })
    fireEvent.compositionStart(input)
    fireEvent.change(input, { target: { value: "中文" } })
    fireEvent.click(screen.getByRole("button", { name: "开始搜索" }))
    expect(ipc.search).not.toHaveBeenCalled()
  })

  it("取消后忽略迟到结果，不把取消当无匹配", async () => {
    let complete!: (value: ReturnType<typeof searchPage>) => void
    vi.mocked(ipc.search).mockReturnValue(new Promise((resolve) => { complete = resolve }))
    render(<SearchPanel open participants={participants} onOpenChange={vi.fn()} generation={GENERATION} onLocate={vi.fn()} />)
    fireEvent.change(screen.getByRole("searchbox", { name: "搜索聊天文本" }), { target: { value: "测试" } })
    fireEvent.click(screen.getByRole("button", { name: "开始搜索" }))
    fireEvent.click(await screen.findByRole("button", { name: "取消检索" }))
    await waitFor(() => expect(ipc.cancelSearch).toHaveBeenCalledOnce())
    await act(async () => complete(searchPage()))
    expect(screen.queryByRole("button", { name: "定位我的消息" })).not.toBeInTheDocument()
    expect(screen.queryByText("没有匹配的消息。")).not.toBeInTheDocument()
    expect(screen.getByText(/未完成范围不作为无结果/)).toBeInTheDocument()
  })

  it("新检索取消旧检索，旧结果不能覆盖新查询", async () => {
    let finishOld!: (value: ReturnType<typeof searchPage>) => void
    vi.mocked(ipc.search).mockReturnValueOnce(new Promise((resolve) => { finishOld = resolve })).mockResolvedValueOnce(searchPage("新查询"))
    render(<SearchPanel open participants={participants} onOpenChange={vi.fn()} generation={GENERATION} onLocate={vi.fn()} />)
    const input = screen.getByRole("searchbox", { name: "搜索聊天文本" })
    fireEvent.change(input, { target: { value: "旧查询" } })
    fireEvent.click(screen.getByRole("button", { name: "开始搜索" }))
    fireEvent.change(input, { target: { value: "新查询" } })
    fireEvent.click(screen.getByRole("button", { name: "开始搜索" }))
    await screen.findByRole("button", { name: "定位我的消息" })
    await act(async () => finishOld(searchPage("旧查询", { items: [] })))
    expect(screen.getByRole("button", { name: "定位我的消息" })).toBeInTheDocument()
    expect(ipc.cancelSearch).toHaveBeenCalledWith(expect.objectContaining({ search_id: vi.mocked(ipc.search).mock.calls[0]?.[0].search_id }))
  })
})
