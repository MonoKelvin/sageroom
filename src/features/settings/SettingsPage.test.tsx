import { fireEvent, render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { ipc } from "@/app/ipc"
import { pageProps } from "./configuration.test-fixtures"
import { SettingsPage } from "./SettingsPage"

vi.mock("@/app/ipc", () => ({
  errorMessage: (error: unknown) => error instanceof Error ? error.message : "失败",
  IpcError: class extends Error {},
  ipc: { getGlobalConfiguration: vi.fn(), saveAppearance: vi.fn(), snapshot: vi.fn(), exit: vi.fn() },
}))
beforeEach(() => vi.resetAllMocks())

describe("真实本地软件设置", () => {
  it("首次激活才展示外观，真实保存后通过共享 session 应用", async () => {
    const props = pageProps(false)
    vi.mocked(ipc.saveAppearance).mockResolvedValue({ theme: "dark", reduce_motion: false, revision: "2" })
    const view = render(<SettingsPage {...props} />)
    expect(screen.queryByRole("radio")).not.toBeInTheDocument()
    view.rerender(<SettingsPage {...props} active />)
    await userEvent.click(screen.getByRole("radio", { name: "深色" }))
    await userEvent.click(screen.getByRole("button", { name: "保存外观" }))
    await screen.findByText("外观已保存")
    expect(props.session.applyAppearance).toHaveBeenCalledWith({ theme: "dark", reduce_motion: false, revision: "2" }, "generation-test")
    expect(ipc.getGlobalConfiguration).not.toHaveBeenCalled()
  })
  it("外观草稿跨分类保留，失败重试保留请求 ID", async () => {
    vi.mocked(ipc.saveAppearance).mockRejectedValue(new Error("保存失败"))
    render(<SettingsPage {...pageProps()} />)
    fireEvent.click(screen.getByRole("radio", { name: "深色" }))
    await userEvent.click(screen.getByRole("button", { name: "关于与数据" }))
    await userEvent.click(screen.getByRole("button", { name: "外观" }))
    expect(screen.getByRole("radio", { name: "深色" })).toBeChecked()
    await userEvent.click(screen.getByRole("button", { name: "保存外观" }))
    await screen.findByText("保存失败")
    await userEvent.click(screen.getByRole("button", { name: "重试保存外观" }))
    expect(vi.mocked(ipc.saveAppearance).mock.calls[0][0].client_request_id).toBe(vi.mocked(ipc.saveAppearance).mock.calls[1][0].client_request_id)
  })
  it("仅有软件外观/关于与数据，不重复承载模型和人格入口", () => {
    render(<SettingsPage {...pageProps()} />)
    expect(screen.getByRole("button", { name: "外观" })).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "关于与数据" })).toBeInTheDocument()
    expect(screen.queryByRole("button", { name: /模型配置|模型预设|人格预设|运行偏好/ })).not.toBeInTheDocument()
  })
  it("关于展示真实目录/许可/作者，无假备份恢复入口", async () => {
    render(<SettingsPage {...pageProps()} />)
    await userEvent.click(screen.getByRole("button", { name: "关于与数据" }))
    expect(screen.getByText("C:/Sageroom-test/data")).toBeInTheDocument()
    expect(screen.getByText("MIT")).toBeInTheDocument()
    expect(screen.getByRole("link", { name: "MonoKelvin" })).toHaveAttribute("href", "https://github.com/MonoKelvin")
    expect(screen.queryByRole("button", { name: /备份|恢复/ })).not.toBeInTheDocument()
    expect(screen.queryByText(/无效按钮/)).not.toBeInTheDocument()
  })
})
