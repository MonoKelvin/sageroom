import { act, fireEvent, render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { beforeEach, describe, expect, it, vi } from "vitest"
import type { UserProfile } from "@/contracts/generated"
import { ipc, IpcError } from "@/app/ipc"
import { ConfigurationTestProvider, mockConfigurationIpc, pageProps } from "@/features/settings/configuration.test-fixtures"
import { UserPage } from "./UserPage"

beforeEach(() => { mockConfigurationIpc() })
function page(props = pageProps()) { return <ConfigurationTestProvider snapshot={props.session.snapshot}><UserPage {...props} /></ConfigurationTestProvider> }

describe("直接应用用户资料", () => {
  it("首次激活才读取，未确认文本跨导航保留，没有整页保存", async () => {
    const props = pageProps(false)
    const view = render(page(props))
    expect(ipc.getUserProfile).not.toHaveBeenCalled()
    view.rerender(page({ ...props, active: true }))
    const name = await screen.findByLabelText("昵称", { selector: "input" })
    fireEvent.change(name, { target: { value: "内部草稿" } })
    view.rerender(page({ ...props, active: false }))
    view.rerender(page({ ...props, active: true }))
    expect(name).toHaveValue("内部草稿")
    expect(ipc.getUserProfile).toHaveBeenCalledTimes(1)
    expect(ipc.saveUserProfile).not.toHaveBeenCalled()
    expect(screen.queryByRole("button", { name: /保存|重新读取|丢弃/ })).not.toBeInTheDocument()
  })
  it("昵称失焦直接应用且不触发 session 重新读取", async () => {
    const props = pageProps()
    render(page(props))
    const name = await screen.findByLabelText("昵称", { selector: "input" })
    fireEvent.change(name, { target: { value: "  新昵称  " } })
    fireEvent.blur(name)
    await waitFor(() => expect(ipc.saveUserProfile).toHaveBeenCalledTimes(1))
    expect(vi.mocked(ipc.saveUserProfile).mock.calls[0][0].display_name).toBe("新昵称")
    expect(props.session.reload).not.toHaveBeenCalled()
  })
  it("确认较晚返回不覆盖新的内部编辑", async () => {
    let finish!: (profile: UserProfile) => void
    vi.mocked(ipc.saveUserProfile).mockReturnValueOnce(new Promise((resolve) => { finish = resolve }))
    render(page())
    const name = await screen.findByLabelText("昵称", { selector: "input" })
    fireEvent.change(name, { target: { value: "已交出昵称" } })
    fireEvent.blur(name)
    fireEvent.change(name, { target: { value: "新的编辑" } })
    await act(async () => finish({ participant_id: "user-test", display_name: "已交出昵称", avatar_id: null, bio: "", revision: "2" }))
    expect(name).toHaveValue("新的编辑")
  })
  it("应用失败可局部重试，并保留 applied 昵称与同一请求 ID", async () => {
    vi.mocked(ipc.saveUserProfile).mockRejectedValueOnce(new IpcError({ code: "INTERNAL_ERROR", message: "本机暂时忙", retryability: "after_user_action", field_path: null, trace_id: "t", may_have_been_charged: false }))
    render(page())
    const name = await screen.findByLabelText("昵称", { selector: "input" })
    fireEvent.change(name, { target: { value: "保留昵称" } })
    fireEvent.blur(name)
    await screen.findByRole("button", { name: "重试应用" })
    expect(name).toHaveValue("保留昵称")
    await userEvent.click(screen.getByRole("button", { name: "重试应用" }))
    await waitFor(() => expect(ipc.saveUserProfile).toHaveBeenCalledTimes(2))
    expect(vi.mocked(ipc.saveUserProfile).mock.calls[0][0].client_request_id).toBe(vi.mocked(ipc.saveUserProfile).mock.calls[1][0].client_request_id)
  })
  it("例外撤销本次应用将失败文本恢复到 confirmed 值", async () => {
    vi.mocked(ipc.saveUserProfile).mockRejectedValueOnce(new Error("not confirmed"))
    render(page())
    const name = await screen.findByLabelText("昵称", { selector: "input" })
    fireEvent.change(name, { target: { value: "未落盘昵称" } })
    fireEvent.blur(name)
    await screen.findByRole("button", { name: "撤销本次应用" })
    await userEvent.click(screen.getByRole("button", { name: "撤销本次应用" }))
    await waitFor(() => expect(name).toHaveValue("我"))
  })
  it("点击头像展开菜单，更换成功立即应用，恢复默认需确认", async () => {
    render(page())
    await screen.findByLabelText("昵称", { selector: "input" })
    await userEvent.click(screen.getByRole("button", { name: "切换头像" }))
    await screen.findByRole("menuitem", { name: "更换头像" })
    await userEvent.keyboard("{Escape}")
    expect(ipc.saveUserProfile).not.toHaveBeenCalled()

    vi.mocked(ipc.importAvatar).mockResolvedValueOnce({ id: "avatar-local", mime_type: "image/png", width: 64, height: 64, byte_size: 3 })
    await userEvent.click(screen.getByRole("button", { name: "切换头像" }))
    await userEvent.click(await screen.findByRole("menuitem", { name: "更换头像" }))
    await waitFor(() => expect(ipc.saveUserProfile).toHaveBeenCalledTimes(1))
    expect(vi.mocked(ipc.saveUserProfile).mock.lastCall?.[0].avatar_id).toBe("avatar-local")

    await userEvent.click(screen.getByRole("button", { name: "切换头像" }))
    await userEvent.click(await screen.findByRole("menuitem", { name: "恢复默认头像" }))
    expect(ipc.saveUserProfile).toHaveBeenCalledTimes(1)
    await userEvent.click(screen.getByRole("button", { name: "确认恢复" }))
    await waitFor(() => expect(ipc.saveUserProfile).toHaveBeenCalledTimes(2))
    expect(vi.mocked(ipc.saveUserProfile).mock.lastCall?.[0].avatar_id).toBeNull()
  })
  it("世代改变忽略旧资料响应", async () => {
    const props = pageProps()
    let finish!: (profile: UserProfile) => void
    vi.mocked(ipc.getUserProfile).mockReturnValueOnce(new Promise((resolve) => { finish = resolve }))
    const view = render(page(props))
    view.rerender(page({ ...props, session: { ...props.session, snapshot: { ...props.session.snapshot!, data_generation_id: "new-generation" } } }))
    await screen.findByLabelText("昵称", { selector: "input" })
    await act(async () => finish({ participant_id: "old", display_name: "旧世代昵称", avatar_id: null, bio: "", revision: "1" }))
    expect(screen.getByLabelText("昵称", { selector: "input" })).toHaveValue("我")
  })
  it("侧栏只保留用户条目，不显示标题、说明文字与返回聊天", async () => {
    render(page())
    await screen.findByLabelText("昵称", { selector: "input" })
    expect(screen.queryByRole("heading", { name: "用户" })).not.toBeInTheDocument()
    expect(screen.queryByText("返回聊天")).not.toBeInTheDocument()
    expect(screen.queryByText("昵称和头像修改后，会同步更新所有历史消息。")).not.toBeInTheDocument()
    expect(document.querySelector(".avatar-default-logo")?.getAttribute("src")).toContain("appicon-logo")
  })
  it("简介失焦直接保存，默认可以留空", async () => {
    render(page())
    const bio = await screen.findByLabelText("简介", { selector: "textarea" })
    expect(bio).toHaveValue("")
    fireEvent.change(bio, { target: { value: "  喜欢安静的地方  " } })
    fireEvent.blur(bio)
    await waitFor(() => expect(ipc.saveUserProfile).toHaveBeenCalledTimes(1))
    expect(vi.mocked(ipc.saveUserProfile).mock.lastCall?.[0].bio).toBe("喜欢安静的地方")
  })
  it("昵称按中文 2、英文 1 计宽，九个中文不写入", async () => {
    render(page())
    const name = await screen.findByLabelText("昵称", { selector: "input" })
    fireEvent.change(name, { target: { value: "九个中文昵称啊哈哈" } })
    fireEvent.blur(name)
    expect(await screen.findByRole("alert")).toHaveTextContent("最多 8 个中文")
    expect(ipc.saveUserProfile).not.toHaveBeenCalled()

    fireEvent.change(name, { target: { value: "abcdefghijklmnop" } })
    fireEvent.blur(name)
    await waitFor(() => expect(ipc.saveUserProfile).toHaveBeenCalledTimes(1))
    expect(vi.mocked(ipc.saveUserProfile).mock.lastCall?.[0].display_name).toBe("abcdefghijklmnop")
  })
})
