import { act, fireEvent, render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { beforeEach, describe, expect, it, vi } from "vitest"
import type { UserProfile } from "@/contracts/generated"
import { ipc } from "@/app/ipc"
import { pageProps, userProfile } from "@/features/settings/configuration.test-fixtures"
import { UserPage } from "./UserPage"

vi.mock("@/app/ipc", () => ({
  errorMessage: (error: unknown) => error instanceof Error ? error.message : "失败",
  IpcError: class extends Error {},
  ipc: { getUserProfile: vi.fn(), saveUserProfile: vi.fn(), importAvatar: vi.fn(), readAvatar: vi.fn() },
}))
beforeEach(() => {
  vi.resetAllMocks()
  vi.mocked(ipc.getUserProfile).mockResolvedValue(userProfile())
})
describe("真实本地用户资料", () => {
  it("首次激活读取，导航后仍保留编辑", async () => {
    const props = pageProps(false)
    const view = render(<UserPage {...props} />)
    expect(ipc.getUserProfile).not.toHaveBeenCalled()
    view.rerender(<UserPage {...props} active />)
    await screen.findByLabelText("昵称")
    fireEvent.change(screen.getByLabelText("昵称"), { target: { value: "未保存昵称" } })
    view.rerender(<UserPage {...props} active={false} />)
    view.rerender(<UserPage {...props} active />)
    expect(screen.getByLabelText("昵称")).toHaveValue("未保存昵称")
    expect(ipc.getUserProfile).toHaveBeenCalledTimes(1)
  })
  it("晚返回保留新编辑；保存成功刷新共享 session", async () => {
    const props = pageProps()
    let finish!: (profile: UserProfile) => void
    vi.mocked(ipc.saveUserProfile).mockReturnValue(new Promise((resolve) => { finish = resolve }))
    render(<UserPage {...props} />)
    await screen.findByLabelText("昵称")
    fireEvent.change(screen.getByLabelText("昵称"), { target: { value: "提交昵称" } })
    await userEvent.click(screen.getByRole("button", { name: "保存资料" }))
    fireEvent.change(screen.getByLabelText("昵称"), { target: { value: "新草稿" } })
    await act(async () => finish({ ...userProfile(), display_name: "提交昵称", revision: "2" }))
    expect(screen.getByLabelText("昵称")).toHaveValue("新草稿")
    expect(props.session.reload).toHaveBeenCalledTimes(1)
  })
  it("原样失败重试复用请求 ID，原生头像取消不会清掉资料", async () => {
    vi.mocked(ipc.saveUserProfile).mockRejectedValue(new Error("数据库忙"))
    vi.mocked(ipc.importAvatar).mockResolvedValue(null)
    render(<UserPage {...pageProps()} />)
    await screen.findByLabelText("昵称")
    fireEvent.change(screen.getByLabelText("昵称"), { target: { value: "草稿" } })
    await userEvent.click(screen.getByRole("button", { name: "保存资料" }))
    await screen.findByText("数据库忙")
    await userEvent.click(screen.getByRole("button", { name: "重试保存资料" }))
    await waitFor(() => expect(ipc.saveUserProfile).toHaveBeenCalledTimes(2))
    expect(vi.mocked(ipc.saveUserProfile).mock.calls[0][0].client_request_id).toBe(vi.mocked(ipc.saveUserProfile).mock.calls[1][0].client_request_id)
    await userEvent.click(screen.getByRole("button", { name: "选择头像" }))
    expect(ipc.importAvatar).toHaveBeenCalledWith({ data_generation_id: "generation-test" })
    expect(screen.getByLabelText("昵称")).toHaveValue("草稿")
  })
  it("数据世代改变清除旧资料和旧请求", async () => {
    const props = pageProps()
    let finish!: (profile: UserProfile) => void
    vi.mocked(ipc.getUserProfile).mockReturnValueOnce(new Promise((resolve) => { finish = resolve }))
    const view = render(<UserPage {...props} />)
    view.rerender(<UserPage {...props} session={{ ...props.session, snapshot: { ...props.session.snapshot!, data_generation_id: "new-generation" } }} />)
    await screen.findByLabelText("昵称")
    await act(async () => finish({ ...userProfile(), display_name: "旧世代昵称" }))
    expect(screen.getByLabelText("昵称")).toHaveValue("我")
  })
})
