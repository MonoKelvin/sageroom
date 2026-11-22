import { act, fireEvent, render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { beforeEach, describe, expect, it, vi } from "vitest"
import type { ErrorCode, SecretStatus } from "@/contracts/generated"
import { ipc, IpcError } from "@/app/ipc"
import { useAppliedResource, useConfiguration } from "@/app/configurationContext"
import { ConfigurationTestProvider, mockConfigurationIpc, pageProps } from "./configuration.test-fixtures"
import { ModelCredentials } from "./ModelCredentials"

beforeEach(() => { mockConfigurationIpc() })
function CredentialsView() {
  const store = useConfiguration()
  const state = useAppliedResource(store.global)
  return state.value ? <ModelCredentials profile={state.value.model_profiles[0]} /> : null
}
function panel() { return <ConfigurationTestProvider snapshot={pageProps().session.snapshot}><CredentialsView /></ConfigurationTestProvider> }

describe("安全即时凭据与显式连接测试", () => {
  it("password 失焦即交出并清空，不等待后端且没有写入/状态刷新按钮", async () => {
    let finish!: (status: SecretStatus) => void
    vi.mocked(ipc.setSecret).mockReturnValueOnce(new Promise((resolve) => { finish = resolve }))
    render(panel())
    const input = await screen.findByLabelText("API Key", { selector: "input" })
    fireEvent.change(input, { target: { value: "sensitive-input" } })
    expect(ipc.setSecret).not.toHaveBeenCalled()
    fireEvent.blur(input)
    expect(input).toHaveValue("")
    await waitFor(() => expect(ipc.setSecret).toHaveBeenCalledWith({ data_generation_id: "generation-test", profile_id: "model-a", expected_revision: "1", api_key: "sensitive-input" }))
    expect(screen.queryByRole("button", { name: /写入|保存|刷新密钥/ })).not.toBeInTheDocument()
    await act(async () => finish({ profile_id: "model-a", configured: true }))
    await screen.findByText("密钥已应用到系统凭据库，输入已清空。")
    expect(ipc.secretStatus).not.toHaveBeenCalled()
    expect(ipc.testModel).not.toHaveBeenCalled()
  })
  it("失败不恢复密码，也不回显任意服务端 Error 文本", async () => {
    vi.mocked(ipc.setSecret).mockRejectedValueOnce(new Error("sensitive-input appeared in unsafe server error"))
    render(panel())
    const input = await screen.findByLabelText("API Key", { selector: "input" })
    fireEvent.change(input, { target: { value: "sensitive-input" } })
    fireEvent.blur(input)
    await screen.findByText("操作未完成，请重试。 密钥输入已清空。")
    expect(input).toHaveValue("")
    expect(document.body).not.toHaveTextContent("sensitive-input")
    expect(document.body).not.toHaveTextContent("unsafe server error")
  })
  it.each([
    { name: "未配置密钥", message: "请先为模型配置 API Key。", code: "CAPABILITY_UNSUPPORTED", charged: false },
    { name: "版本冲突", message: "模型配置版本冲突。", code: "CONFIG_CONFLICT", charged: false },
    { name: "网络超时且可能计费", message: "模型请求超时。", code: "INTERNAL_ERROR", charged: true },
    { name: "拒绝额外推理", message: "连接测试不支持 enabled 推理模式。", code: "CAPABILITY_UNSUPPORTED", charged: false },
  ] satisfies { name: string; message: string; code: ErrorCode; charged: boolean }[])("安全业务错误：$name", async ({ message, code, charged }) => {
    vi.mocked(ipc.testModel).mockRejectedValueOnce(new IpcError({ code, message, retryability: "after_user_action", field_path: null, trace_id: "trace", may_have_been_charged: charged }))
    render(panel())
    await screen.findByLabelText("API Key", { selector: "input" })
    expect(ipc.testModel).not.toHaveBeenCalled()
    await userEvent.click(screen.getByRole("button", { name: "测试模型是否可用" }))
    const alert = await screen.findByRole("alert")
    expect(alert).toHaveTextContent(message)
    if (charged) expect(alert).toHaveTextContent("本次请求可能已计费，重试可能再次计费。")
    else expect(alert).not.toHaveTextContent("可能已计费")
  })
  it("只显示实际连接和 usage 结果，输入变化不会自动网络测试", async () => {
    render(panel())
    const input = await screen.findByLabelText("API Key", { selector: "input" })
    fireEvent.change(input, { target: { value: "draft-key" } })
    expect(ipc.testModel).not.toHaveBeenCalled()
    // Unconfirmed secret is canceled before the explicit network-test action.
    fireEvent.keyDown(input, { key: "Escape" })
    await userEvent.click(screen.getByRole("button", { name: "测试模型是否可用" }))
    await screen.findByText("连接可用 · 80 ms")
    expect(screen.getByText("输入 12 tokens · 输出 1 tokens")).toBeInTheDocument()
    expect(ipc.testModel).toHaveBeenCalledWith({ data_generation_id: "generation-test", profile_id: "model-a", expected_revision: "1" })
  })
  it("空输入不写入，重新输入即覆盖旧密钥且不再提供移除入口", async () => {
    const data = mockConfigurationIpc()
    data.global.model_profiles[0].credential_configured = true
    render(panel())
    const input = await screen.findByLabelText("API Key", { selector: "input" })
    fireEvent.change(input, { target: { value: "  " } })
    fireEvent.blur(input)
    expect(ipc.setSecret).not.toHaveBeenCalled()
    expect(screen.queryByRole("button", { name: "移除密钥" })).not.toBeInTheDocument()
    fireEvent.change(input, { target: { value: "new-key" } })
    fireEvent.blur(input)
    await waitFor(() => expect(ipc.setSecret).toHaveBeenCalledWith({ data_generation_id: "generation-test", profile_id: "model-a", expected_revision: "1", api_key: "new-key" }))
  })
  it("模型名称留空时不能测试，且不提供移除密钥入口", async () => {
    const data = mockConfigurationIpc()
    data.global.model_profiles[0].model_name = ""
    data.global.model_profiles[0].credential_configured = true
    render(panel())
    await screen.findByLabelText("API Key", { selector: "input" })
    expect(screen.getByRole("button", { name: "测试模型是否可用" })).toBeDisabled()
    expect(screen.queryByRole("button", { name: "移除密钥" })).not.toBeInTheDocument()
  })
  it("不完整模型不能绑定密钥或测试", async () => {
    const data = mockConfigurationIpc()
    data.global.model_profiles[0].base_url = ""
    render(panel())
    expect(await screen.findByLabelText("API Key", { selector: "input" })).toBeDisabled()
    expect(screen.getByRole("button", { name: "测试模型是否可用" })).toBeDisabled()
    expect(ipc.testModel).not.toHaveBeenCalled()
  })
})
