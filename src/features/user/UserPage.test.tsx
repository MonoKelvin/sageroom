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
    await act(async () => finish({ participant_id: "user-test", display_name: "已交出昵称", avatar_id: null, revision: "2" }))
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
  it("头像取消不更改资料；成功立即应用，移除确认后直接写入", async () => {
    render(page())
    await screen.findByLabelText("昵称", { selector: "input" })
    await userEvent.click(screen.getByRole("button", { name: "选择头像" }))
    expect(ipc.saveUserProfile).not.toHaveBeenCalled()
    vi.mocked(ipc.importAvatar).mockResolvedValueOnce({ id: "avatar-local", mime_type: "image/png", width: 64, height: 64, byte_size: 3 })
    await userEvent.click(screen.getByRole("button", { name: "选择头像" }))
    await waitFor(() => expect(ipc.saveUserProfile).toHaveBeenCalledTimes(1))
    expect(vi.mocked(ipc.saveUserProfile).mock.lastCall?.[0].avatar_id).toBe("avatar-local")
    await userEvent.click(screen.getByRole("button", { name: "移除头像" }))
    expect(ipc.saveUserProfile).toHaveBeenCalledTimes(1)
    await userEvent.click(screen.getByRole("button", { name: "确认移除头像" }))
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
    await act(async () => finish({ participant_id: "old", display_name: "旧世代昵称", avatar_id: null, revision: "1" }))
    expect(screen.getByLabelText("昵称", { selector: "input" })).toHaveValue("我")
  })
})
