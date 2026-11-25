import { render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { ipc, IpcError } from "@/app/ipc"
import { useConfigurationAppearance } from "@/app/configurationContext"
import { APP_METADATA } from "@/app/metadata"
import { ConfigurationTestProvider, mockConfigurationIpc, pageProps } from "./configuration.test-fixtures"
import { SettingsPage } from "./SettingsPage"

beforeEach(() => { mockConfigurationIpc() })
function Preview() { const appearance = useConfigurationAppearance(); return <output data-testid="appearance-preview">{appearance?.theme}:{String(appearance?.reduce_motion)}</output> }
function page(props = pageProps()) { return <ConfigurationTestProvider snapshot={props.session.snapshot}><SettingsPage {...props} /><Preview /></ConfigurationTestProvider> }
async function theme(value: string) { await userEvent.click(screen.getByRole("combobox", { name: "主题" })); await userEvent.click(await screen.findByRole("option", { name: value })) }

describe("软件设置直接应用", () => {
  it("首次激活展示，主题选择和动画开关直接写入并更新共享外观资源", async () => {
    const props = pageProps(false)
    const view = render(page(props))
    expect(screen.queryByRole("combobox", { name: "主题" })).not.toBeInTheDocument()
    view.rerender(page({ ...props, active: true }))
    await theme("深色")
    await userEvent.click(screen.getByRole("switch", { name: "减少动画" }))
    await waitFor(() => expect(vi.mocked(ipc.saveAppearance).mock.lastCall?.[0]).toMatchObject({ theme: "dark", reduce_motion: true }))
    expect(screen.getByTestId("appearance-preview")).toHaveTextContent("dark:true")
    expect(props.session.applyAppearance).not.toHaveBeenCalled()
    expect(ipc.getGlobalConfiguration).not.toHaveBeenCalled()
    expect(screen.queryByRole("button", { name: /保存|重新读取|丢弃/ })).not.toBeInTheDocument()
  })
  it("持久化失败保留当前外观，分类切换仍可例外重试", async () => {
    vi.mocked(ipc.saveAppearance).mockRejectedValueOnce(new IpcError({ code: "INTERNAL_ERROR", message: "本机暂时忙", retryability: "after_user_action", field_path: null, trace_id: "t", may_have_been_charged: false }))
    render(page())
    await theme("深色")
    await screen.findByRole("button", { name: "重试应用" })
    expect(screen.getByTestId("appearance-preview")).toHaveTextContent("dark")
    await userEvent.click(screen.getByRole("button", { name: "关于与数据" }))
    await userEvent.click(screen.getByRole("button", { name: "外观" }))
    expect(screen.getByRole("combobox", { name: "主题" })).toHaveTextContent("深色")
    await userEvent.click(screen.getByRole("button", { name: "重试应用" }))
    await waitFor(() => expect(ipc.saveAppearance).toHaveBeenCalledTimes(2))
    expect(vi.mocked(ipc.saveAppearance).mock.calls[0][0].client_request_id).toBe(vi.mocked(ipc.saveAppearance).mock.calls[1][0].client_request_id)
  })
  it("失败后撤销本次应用恢复 confirmed 外观", async () => {
    vi.mocked(ipc.saveAppearance).mockRejectedValueOnce(new Error("not confirmed"))
    render(page())
    await theme("深色")
    await screen.findByRole("button", { name: "撤销本次应用" })
    await userEvent.click(screen.getByRole("button", { name: "撤销本次应用" }))
    await waitFor(() => expect(screen.getByRole("combobox", { name: "主题" })).toHaveTextContent("跟随系统"))
    expect(screen.getByTestId("appearance-preview")).toHaveTextContent("system")
  })
  it("关于展示真实数据、许可证与作者，不重复模型入口或假备份", async () => {
    const props = pageProps()
    render(page(props))
    expect(screen.queryByRole("button", { name: /模型配置|人格预设|运行偏好/ })).not.toBeInTheDocument()
    await userEvent.click(screen.getByRole("button", { name: "关于与数据" }))
    expect(props.session.reload).toHaveBeenCalledOnce()
    expect(screen.getByText("C:/Sageroom-test/data")).toBeInTheDocument()
    expect(screen.getByText(APP_METADATA.license)).toBeInTheDocument()
    expect(screen.getByRole("link", { name: APP_METADATA.author.name })).toHaveAttribute("href", APP_METADATA.author.url)
    expect(screen.queryByRole("button", { name: /备份|恢复/ })).not.toBeInTheDocument()
    await userEvent.click(screen.getByRole("button", { name: "退出应用" }))
    expect(ipc.exit).not.toHaveBeenCalled()
    await userEvent.click(screen.getByRole("button", { name: "确认退出" }))
    expect(ipc.exit).toHaveBeenCalledWith({ data_generation_id: "generation-test" })
  })
  it("未就绪分支通过 runtime 退出，不调用 useConfiguration", async () => {
    const props = pageProps()
    render(page({ ...props, session: { ...props.session, snapshot: null } }))
    expect(screen.getByText("本地数据尚未就绪，设置暂不可用。")).toBeInTheDocument()
    await userEvent.click(screen.getByRole("button", { name: "退出应用" }))
    await userEvent.click(screen.getByRole("button", { name: "确认退出" }))
    expect(ipc.exit).toHaveBeenCalledWith({ data_generation_id: null })
  })
})
