import { act, fireEvent, render, screen, waitFor, within } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { beforeEach, describe, expect, it, vi } from "vitest"
import type { ExperienceEntry } from "@/contracts/generated"
import { IpcError } from "@/app/ipc"
import { ExperiencePanel } from "./ExperiencePanel"

const first: ExperienceEntry = { id: "one", recorded_at: "2026/11/22 10:00", content: "喜欢安静的交流", score: 80 }
const store = {
  listExperience: vi.fn(async () => [first]),
  addExperience: vi.fn(async () => first),
  updateExperience: vi.fn(async () => first),
  deleteExperience: vi.fn(async () => [] as ExperienceEntry[]),
  pruneExperience: vi.fn(async () => [first]),
}
const failure = () => new IpcError({ code: "IO_ERROR", message: "文件暂不可写", retryability: "after_user_action", field_path: null, trace_id: "test", may_have_been_charged: false })
function panel(active = true, agentId = "agent-one") { return <ExperiencePanel store={store} agentId={agentId} active={active} disabled={false} /> }
async function open() { await screen.findByText(first.content) }

beforeEach(() => {
  vi.clearAllMocks()
  store.listExperience.mockResolvedValue([first])
  store.addExperience.mockResolvedValue(first)
  store.updateExperience.mockResolvedValue(first)
  store.deleteExperience.mockResolvedValue([])
  store.pruneExperience.mockResolvedValue([first])
})

describe("成员经历管理", () => {
  it("按需读取，添加后回读，保留用户提供的重要度", async () => {
    render(panel())
    await open()
    fireEvent.change(screen.getByRole("textbox", { name: "经历内容" }), { target: { value: "已经确认的重要经历" } })
    fireEvent.change(screen.getByRole("spinbutton", { name: "经历重要度" }), { target: { value: "95" } })
    await userEvent.click(screen.getByRole("button", { name: "添加经历" }))
    await waitFor(() => expect(store.addExperience).toHaveBeenCalledExactlyOnceWith("agent-one", "已经确认的重要经历", 95))
    expect(screen.getByRole("textbox", { name: "经历内容" })).toHaveValue("")
    expect(store.listExperience).toHaveBeenCalledTimes(2)
  })
  it("写入失败保留文字和重要度，重试才再次提交", async () => {
    store.addExperience.mockRejectedValueOnce(failure())
    render(panel())
    await open()
    const input = screen.getByRole("textbox", { name: "经历内容" })
    fireEvent.change(input, { target: { value: "不应丢失的经历" } })
    fireEvent.change(screen.getByRole("spinbutton", { name: "经历重要度" }), { target: { value: "70" } })
    await userEvent.click(screen.getByRole("button", { name: "添加经历" }))
    await screen.findByText("文件暂不可写")
    expect(input).toHaveValue("不应丢失的经历")
    expect(screen.getByRole("spinbutton", { name: "经历重要度" })).toHaveValue(70)
    expect(store.listExperience).toHaveBeenCalledTimes(1)
    await userEvent.click(screen.getByRole("button", { name: "添加经历" }))
    await waitFor(() => expect(input).toHaveValue(""))
    expect(store.addExperience).toHaveBeenCalledTimes(2)
  })
  it("多行内容与非法重要度不写入", async () => {
    render(panel())
    await open()
    const input = screen.getByRole("textbox", { name: "经历内容" })
    fireEvent.change(input, { target: { value: "第一行\n第二行" } })
    await userEvent.click(screen.getByRole("button", { name: "添加经历" }))
    expect(await screen.findByRole("alert")).toHaveTextContent("一行文字")
    fireEvent.change(input, { target: { value: "合法单行" } })
    fireEvent.change(screen.getByRole("spinbutton", { name: "经历重要度" }), { target: { value: "-1" } })
    fireEvent.submit(input.closest("form")!)
    expect(await screen.findByRole("alert")).toHaveTextContent("0～100")
    expect(store.addExperience).not.toHaveBeenCalled()
  })
  it("删除须确认，失败保持弹窗与原条目，取消不写入", async () => {
    store.deleteExperience.mockRejectedValueOnce(failure())
    render(panel())
    await open()
    await userEvent.click(screen.getByRole("button", { name: `删除经历 ${first.content}` }))
    expect(store.deleteExperience).not.toHaveBeenCalled()
    const dialog = within(screen.getByRole("dialog", { name: "删除经历" }))
    await userEvent.click(dialog.getByRole("button", { name: "确认删除经历" }))
    await dialog.findByText("文件暂不可写")
    expect(document.querySelector(".experience-list")).toHaveTextContent(first.content)
    await userEvent.click(dialog.getByRole("button", { name: "取消" }))
    expect(store.deleteExperience).toHaveBeenCalledExactlyOnceWith("agent-one", "one")
  })
  it("按条数裁剪须确认且结果覆盖已读列表", async () => {
    render(panel())
    await open()
    await userEvent.click(screen.getByRole("button", { name: "裁剪经历" }))
    const dialog = within(screen.getByRole("dialog", { name: "裁剪经历" }))
    fireEvent.change(dialog.getByRole("spinbutton", { name: "保留条数" }), { target: { value: "1" } })
    expect(store.pruneExperience).not.toHaveBeenCalled()
    await userEvent.click(dialog.getByRole("button", { name: "确认裁剪" }))
    await waitFor(() => expect(store.pruneExperience).toHaveBeenCalledExactlyOnceWith("agent-one", 1))
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument()
  })
  it("成员切换时丢弃旧读取结果，重新激活不使用迟到数据", async () => {
    let resolve!: (entries: ExperienceEntry[]) => void
    store.listExperience.mockImplementationOnce(() => new Promise((done) => { resolve = done }))
    const view = render(panel())
    view.rerender(panel(true, "agent-two"))
    await screen.findByText(first.content)
    await act(async () => resolve([{ ...first, content: "来自上个成员的迟到经历" }]))
    expect(screen.queryByText("来自上个成员的迟到经历")).not.toBeInTheDocument()
    expect(store.listExperience).toHaveBeenLastCalledWith("agent-two")
  })
  it("提交后折叠，成功回执仍清除同一成员的已提交草稿", async () => {
    let resolve!: (entry: ExperienceEntry) => void
    store.addExperience.mockImplementationOnce(() => new Promise((done) => { resolve = done }))
    render(panel())
    await open()
    fireEvent.change(screen.getByRole("textbox", { name: "经历内容" }), { target: { value: "隐藏期间完成的经历" } })
    await userEvent.click(screen.getByRole("button", { name: "添加经历" }))
    await userEvent.click(screen.getByRole("button", { name: /经历（\d+条经历）/ }))
    await act(async () => resolve(first))
    await userEvent.click(screen.getByRole("button", { name: /经历（\d+条经历）/ }))
    expect(screen.getByRole("textbox", { name: "经历内容" })).toHaveValue("")
    expect(store.addExperience).toHaveBeenCalledTimes(1)
  })
  it("读取未完成时不提交，避免写入使读取状态永久失效", async () => {
    let resolve!: (entries: ExperienceEntry[]) => void
    store.listExperience.mockImplementationOnce(() => new Promise((done) => { resolve = done }))
    render(panel())
    const input = screen.getByRole("textbox", { name: "经历内容" })
    fireEvent.change(input, { target: { value: "等待回读" } })
    expect(screen.getByRole("button", { name: "添加经历" })).toBeDisabled()
    fireEvent.submit(input.closest("form")!)
    expect(store.addExperience).not.toHaveBeenCalled()
    await act(async () => resolve([first]))
    expect(screen.queryByText("正在读取经历…")).not.toBeInTheDocument()
    expect(screen.getByRole("button", { name: "添加经历" })).toBeEnabled()
  })
  it("折叠与重新展开保留未提交草稿，但重新读取文件", async () => {
    render(panel())
    await open()
    fireEvent.change(screen.getByRole("textbox", { name: "经历内容" }), { target: { value: "仍在编辑" } })
    await userEvent.click(screen.getByRole("button", { name: /经历（\d+条经历）/ }))
    await waitFor(() => expect(screen.getByRole("button", { name: /经历（\d+条经历）/ })).toHaveAttribute("aria-expanded", "false"))
    await userEvent.click(screen.getByRole("button", { name: /经历（\d+条经历）/ }))
    await waitFor(() => expect(store.listExperience).toHaveBeenCalledTimes(2))
    expect(screen.getByRole("textbox", { name: "经历内容" })).toHaveValue("仍在编辑")
  })
})
