import { act, fireEvent, render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { beforeEach, describe, expect, it, vi } from "vitest"
import type { GlobalConfiguration as GlobalConfigurationData } from "@/contracts/generated"
import { ipc, IpcError } from "@/app/ipc"
import { globalConfiguration } from "@/features/settings/configuration.test-fixtures"
import { GlobalConfiguration } from "./GlobalConfiguration"

vi.mock("@/app/ipc", () => ({
  errorMessage: (error: unknown) => error instanceof Error ? error.message : "失败",
  IpcError: class extends Error {
    detail: { code: string }
    constructor(detail: { message: string; code: string }) { super(detail.message); this.detail = detail }
  },
  ipc: { getGlobalConfiguration: vi.fn(), saveGlobalConfiguration: vi.fn(), setSecret: vi.fn(), deleteSecret: vi.fn(), secretStatus: vi.fn(), testModel: vi.fn(), importDevelopmentModel: vi.fn() },
}))
beforeEach(() => {
  vi.resetAllMocks()
  vi.mocked(ipc.getGlobalConfiguration).mockResolvedValue(globalConfiguration())
})
function props() { return { generation: "generation-test", active: true, initial: globalConfiguration(), onChanged: vi.fn(), developmentToolsAvailable: true } }

describe("智能体全局配置", () => {
  it("推理 off 不冒充关闭内置推理，并明确连接测试边界", async () => {
    render(<GlobalConfiguration {...props()} />)
    await userEvent.click(screen.getByText("生成参数与预算"))
    expect(screen.getByRole("option", { name: "不请求额外推理" })).toHaveValue("off")
    expect(screen.getByLabelText("推理模式")).toHaveValue("off")
    expect(screen.queryByRole("option", { name: "关闭" })).not.toBeInTheDocument()
    expect(screen.getByText("本轮连接测试不接受 enabled。普通连通不保证关闭模型自身推理。")).toBeInTheDocument()
  })
  it("模型删除提示先解除成员引用，人格删除说明独立副本不受影响", async () => {
    render(<GlobalConfiguration {...props()} />)
    await userEvent.click(screen.getByRole("button", { name: "删除模型预设 常用模型" }))
    expect(screen.getByRole("alert")).toHaveTextContent("使用中的预设需先解除或更换成员的模型配置，否则无法删除。")
    expect(ipc.saveGlobalConfiguration).not.toHaveBeenCalled()
    await userEvent.click(screen.getByRole("button", { name: "保留预设" }))
    await userEvent.click(screen.getByRole("button", { name: "人格预设" }))
    await userEvent.click(screen.getByRole("button", { name: "删除人格预设 自然交流" }))
    expect(screen.getByRole("alert")).toHaveTextContent("成员已经复制的独立人格配置不受影响。")
    expect(screen.getByRole("alert")).not.toHaveTextContent("需先解除")
    await userEvent.click(screen.getByRole("button", { name: "确认删除预设" }))
    expect(screen.queryByLabelText("人格名称")).not.toBeInTheDocument()
    expect(ipc.saveGlobalConfiguration).not.toHaveBeenCalled()
  })
  it("模型复制和人格/偏好草稿跨分类保留，保存剔除凭据元数据", async () => {
    const properties = props()
    vi.mocked(ipc.saveGlobalConfiguration).mockResolvedValue({ ...globalConfiguration(), revision: "2" })
    render(<GlobalConfiguration {...properties} />)
    await userEvent.click(screen.getByRole("button", { name: "复制" }))
    expect(screen.getAllByLabelText("模型预设名称")).toHaveLength(2)
    await userEvent.click(screen.getByRole("button", { name: "运行偏好" }))
    fireEvent.change(screen.getByLabelText("每日请求上限"), { target: { value: "321" } })
    await userEvent.click(screen.getByRole("button", { name: "人格预设" }))
    fireEvent.change(screen.getByLabelText("角色指令（SKILL）"), { target: { value: "先确认上下文再回应" } })
    await userEvent.click(screen.getByRole("button", { name: "模型配置" }))
    expect(screen.getAllByLabelText("模型预设名称")).toHaveLength(2)
    await userEvent.click(screen.getByRole("button", { name: "保存全局配置" }))
    await waitFor(() => expect(ipc.saveGlobalConfiguration).toHaveBeenCalledTimes(1))
    const request = vi.mocked(ipc.saveGlobalConfiguration).mock.calls[0][0]
    expect(request.model_profiles).toHaveLength(2)
    expect(request.runtime_defaults.request_limit_daily).toBe(321)
    expect(request.persona_presets[0].skill).toBe("先确认上下文再回应")
    expect(request.model_profiles[0]).not.toHaveProperty("credential_configured")
    expect(request.model_profiles[0]).not.toHaveProperty("revision")
    expect(properties.onChanged).toHaveBeenCalledWith({ ...globalConfiguration(), revision: "2" })
  })
  it("密码写入立即清空；刷新全局 revision 后才保存并通知成员预设", async () => {
    const properties = props()
    vi.mocked(ipc.setSecret).mockResolvedValue({ profile_id: "model-a", configured: true })
    vi.mocked(ipc.saveGlobalConfiguration).mockResolvedValue({ ...globalConfiguration(), revision: "3" })
    render(<GlobalConfiguration {...properties} />)
    const key = screen.getByLabelText("API Key")
    expect(key).toHaveAttribute("type", "password")
    fireEvent.change(key, { target: { value: "private-test-key" } })
    const refreshed = { ...globalConfiguration(), revision: "2", model_profiles: [{ ...globalConfiguration().model_profiles[0], credential_configured: true }] }
    vi.mocked(ipc.getGlobalConfiguration).mockResolvedValue(refreshed)
    await userEvent.click(screen.getByRole("button", { name: "写入密钥" }))
    await screen.findByText("密钥已写入系统凭据库，输入已清空。")
    expect(screen.getByLabelText("API Key")).toHaveValue("")
    expect(screen.queryByText("private-test-key")).not.toBeInTheDocument()
    expect(properties.onChanged).toHaveBeenCalledWith(refreshed)
    await userEvent.click(screen.getByRole("button", { name: "保存全局配置" }))
    await waitFor(() => expect(ipc.saveGlobalConfiguration).toHaveBeenCalledTimes(1))
    expect(vi.mocked(ipc.saveGlobalConfiguration).mock.calls[0][0].expected_revision).toBe("2")
  })
  it("失败重试保留请求 ID；冲突重新读取必须明确确认全部丢稿", async () => {
    vi.mocked(ipc.saveGlobalConfiguration).mockRejectedValue(new IpcError({ code: "CONFIG_CONFLICT", message: "版本冲突", retryability: "after_user_action", field_path: null, trace_id: "t", may_have_been_charged: false }))
    render(<GlobalConfiguration {...props()} />)
    fireEvent.change(screen.getByLabelText("模型标识"), { target: { value: "草稿模型" } })
    await userEvent.click(screen.getByRole("button", { name: "保存全局配置" }))
    await screen.findByText("版本冲突")
    await userEvent.click(screen.getByRole("button", { name: "重试保存全局配置" }))
    expect(vi.mocked(ipc.saveGlobalConfiguration).mock.calls[0][0].client_request_id).toBe(vi.mocked(ipc.saveGlobalConfiguration).mock.calls[1][0].client_request_id)
    await userEvent.click(screen.getAllByRole("button", { name: "重新读取" })[0])
    expect(screen.getByText(/重新读取会丢弃全部模型预设、人格预设和运行偏好/)).toBeInTheDocument()
    expect(ipc.getGlobalConfiguration).not.toHaveBeenCalled()
    await userEvent.click(screen.getByRole("button", { name: "保留修改" }))
    expect(screen.getByLabelText("模型标识")).toHaveValue("草稿模型")
  })
  it("晚保存通知真实保存结果，但不覆盖新编辑或跨导航草稿", async () => {
    let finish!: (configuration: GlobalConfigurationData) => void
    const properties = props()
    vi.mocked(ipc.saveGlobalConfiguration).mockReturnValue(new Promise((resolve) => { finish = resolve }))
    const view = render(<GlobalConfiguration {...properties} />)
    await userEvent.click(screen.getByRole("button", { name: "保存全局配置" }))
    fireEvent.change(screen.getByLabelText("模型标识"), { target: { value: "新的模型草稿" } })
    view.rerender(<GlobalConfiguration {...properties} active={false} />)
    await act(async () => finish({ ...globalConfiguration(), revision: "2" }))
    view.rerender(<GlobalConfiguration {...properties} active />)
    expect(screen.getByLabelText("模型标识")).toHaveValue("新的模型草稿")
    expect(properties.onChanged).toHaveBeenCalledWith({ ...globalConfiguration(), revision: "2" })
  })
})
