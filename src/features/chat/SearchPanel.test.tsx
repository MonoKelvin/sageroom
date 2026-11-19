import type {} from "@testing-library/jest-dom/vitest"
import { act, fireEvent, render, screen, waitFor } from "@testing-library/react"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { ipc } from "@/app/ipc"
import { SearchPanel } from "./SearchPanel"
import { GENERATION, searchPage } from "./chat.test-fixtures"

vi.mock("@/app/ipc", () => ({
  errorMessage: (error: unknown) => error instanceof Error ? error.message : "测试失败",
  ipc: { search: vi.fn(), cancelSearch: vi.fn() },
}))

beforeEach(() => {
  vi.resetAllMocks()
  vi.mocked(ipc.cancelSearch).mockResolvedValue({ search_id: "search-test", cancellation_requested: true })
})

describe("聊天搜索", () => {
  it("提交 literal 查询并通过命中序号定位", async () => {
    const onLocate = vi.fn().mockResolvedValue(undefined)
    const onOpenChange = vi.fn()
    vi.mocked(ipc.search).mockResolvedValue(searchPage())
    render(<SearchPanel open onOpenChange={onOpenChange} generation={GENERATION} onLocate={onLocate} />)
    fireEvent.change(screen.getByRole("searchbox", { name: "搜索聊天文本" }), { target: { value: "测试" } })
    fireEvent.click(screen.getByRole("button", { name: "开始搜索" }))
    fireEvent.click(await screen.findByRole("button", { name: "定位我的消息" }))
    await waitFor(() => expect(onLocate).toHaveBeenCalledWith("1", "message-1"))
    expect(onOpenChange).toHaveBeenCalledWith(false)
    expect(ipc.search).toHaveBeenCalledWith(expect.objectContaining({ data_generation_id: GENERATION, query: "测试", cursor: null, limit: 50 }))
  })

  it("取消后忽略迟到结果，不把取消当无匹配", async () => {
    let complete!: (value: ReturnType<typeof searchPage>) => void
    vi.mocked(ipc.search).mockReturnValue(new Promise((resolve) => { complete = resolve }))
    render(<SearchPanel open onOpenChange={vi.fn()} generation={GENERATION} onLocate={vi.fn()} />)
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
    render(<SearchPanel open onOpenChange={vi.fn()} generation={GENERATION} onLocate={vi.fn()} />)
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
