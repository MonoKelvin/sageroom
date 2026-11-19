import { act, fireEvent, render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { beforeEach, describe, expect, it, vi } from "vitest"
import type { ErrorCode, SecretStatus } from "@/contracts/generated"
import { ipc, IpcError } from "@/app/ipc"
import { globalConfiguration } from "./configuration.test-fixtures"
import { ModelCredentials } from "./ModelCredentials"

vi.mock("@/app/ipc", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/app/ipc")>()
  return { ...actual, ipc: { ...actual.ipc, setSecret: vi.fn(), deleteSecret: vi.fn(), secretStatus: vi.fn(), testModel: vi.fn() } }
})
beforeEach(() => vi.resetAllMocks())
const profile = globalConfiguration().model_profiles[0]

describe("安全凭据与真实模型测试", () => {
  it("调用写入后立即清空密码，不等待后端完成", async () => {
    let finish!: (status: SecretStatus) => void
    vi.mocked(ipc.setSecret).mockReturnValue(new Promise((resolve) => { finish = resolve }))
    const onChanged = vi.fn().mockResolvedValue(undefined)
    render(<ModelCredentials profile={profile} generation="g" disabled={false} onChanged={onChanged} onBusy={vi.fn()} />)
    fireEvent.change(screen.getByLabelText("API Key"), { target: { value: "sensitive-input" } })
    await userEvent.click(screen.getByRole("button", { name: "写入密钥" }))
    expect(screen.getByLabelText("API Key")).toHaveValue("")
    expect(ipc.setSecret).toHaveBeenCalledWith({ data_generation_id: "g", profile_id: profile.id, expected_revision: "1", api_key: "sensitive-input" })
    await act(async () => finish({ profile_id: profile.id, configured: true }))
    expect(onChanged).toHaveBeenCalledTimes(1)
  })
  it("失败也不回显密码或服务端潜在密钥错误文本", async () => {
    vi.mocked(ipc.setSecret).mockRejectedValue(new Error("sensitive-input appeared in unsafe server error"))
    render(<ModelCredentials profile={profile} generation="g" disabled={false} onChanged={vi.fn()} onBusy={vi.fn()} />)
    fireEvent.change(screen.getByLabelText("API Key"), { target: { value: "sensitive-input" } })
    await userEvent.click(screen.getByRole("button", { name: "写入密钥" }))
    await screen.findByRole("alert")
    expect(screen.getByLabelText("API Key")).toHaveValue("")
    expect(screen.getByRole("alert")).not.toHaveTextContent("sensitive-input")
    expect(screen.getByRole("alert")).toHaveTextContent("操作未完成，请重试。")
    expect(screen.getByRole("alert")).toHaveTextContent("密钥输入已清空。")
  })
  it.each([
    { name: "尚未配置密钥", message: "请先为模型配置 API Key。", code: "CAPABILITY_UNSUPPORTED", charged: false },
    { name: "版本冲突", message: "模型配置版本冲突，请重新读取。", code: "CONFIG_CONFLICT", charged: false },
    { name: "网络超时且可能计费", message: "模型请求超时，请重试。", code: "INTERNAL_ERROR", charged: true },
    { name: "拒绝额外推理", message: "连接测试不支持 enabled 推理模式。", code: "CAPABILITY_UNSUPPORTED", charged: false },
  ] satisfies { name: string; message: string; code: ErrorCode; charged: boolean }[])("显示安全业务错误：$name", async ({ message, code, charged }) => {
    vi.mocked(ipc.testModel).mockRejectedValue(new IpcError({ code, message, retryability: "after_user_action", field_path: null, trace_id: "trace", may_have_been_charged: charged }))
    render(<ModelCredentials profile={profile} generation="g" disabled={false} onChanged={vi.fn()} onBusy={vi.fn()} />)
    await userEvent.click(screen.getByRole("button", { name: "测试连接" }))
    const alert = await screen.findByRole("alert")
    expect(alert).toHaveTextContent(message)
    if (charged) expect(alert).toHaveTextContent("本次请求可能已计费，重试可能再次计费。")
    else expect(alert).not.toHaveTextContent("本次请求可能已计费")
  })
  it("安全密钥写入业务错误保留原因并说明输入清空", async () => {
    vi.mocked(ipc.setSecret).mockRejectedValue(new IpcError({ code: "CONFIG_CONFLICT", message: "模型版本已更新，请重新读取。", retryability: "after_user_action", field_path: null, trace_id: "trace", may_have_been_charged: false }))
    render(<ModelCredentials profile={profile} generation="g" disabled={false} onChanged={vi.fn()} onBusy={vi.fn()} />)
    fireEvent.change(screen.getByLabelText("API Key"), { target: { value: "sensitive-input" } })
    await userEvent.click(screen.getByRole("button", { name: "写入密钥" }))
    expect(await screen.findByRole("alert")).toHaveTextContent("模型版本已更新，请重新读取。 密钥输入已清空。")
    expect(screen.getByLabelText("API Key")).toHaveValue("")
  })
  it("非 IPC 网络异常不渲染任意消息且不猜测计费", async () => {
    vi.mocked(ipc.testModel).mockRejectedValue(new Error("unsafe-provider-text"))
    render(<ModelCredentials profile={profile} generation="g" disabled={false} onChanged={vi.fn()} onBusy={vi.fn()} />)
    await userEvent.click(screen.getByRole("button", { name: "测试连接" }))
    expect(await screen.findByRole("alert")).toHaveTextContent("操作未完成，请重试。")
    expect(screen.getByRole("alert")).not.toHaveTextContent("unsafe-provider-text")
    expect(screen.getByRole("alert")).not.toHaveTextContent("可能已计费")
  })
  it("连接测试携带已保存的版本，只显示实际结果", async () => {
    vi.mocked(ipc.testModel).mockResolvedValue({ profile_id: profile.id, revision: "1", protocol: "openai_chat_completions", available: true, usage_input_tokens: 12, usage_output_tokens: 1, elapsed_ms: 80 })
    render(<ModelCredentials profile={profile} generation="g" disabled={false} onChanged={vi.fn()} onBusy={vi.fn()} />)
    await userEvent.click(screen.getByRole("button", { name: "测试连接" }))
    await screen.findByText(/连接可用，耗时 80 ms；输入 12 tokens，输出 1 tokens/)
    expect(ipc.testModel).toHaveBeenCalledWith({ data_generation_id: "g", profile_id: profile.id, expected_revision: "1" })
  })
})
