import { act, fireEvent, render, screen, waitFor, within } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { beforeEach, describe, expect, it, vi } from "vitest"
import type { AgentConfiguration } from "@/contracts/generated"
import { ipc } from "@/app/ipc"
import { agentConfiguration, globalConfiguration, pageProps } from "@/features/settings/configuration.test-fixtures"
import { AgentsPage } from "./AgentsPage"

vi.mock("@/app/ipc", () => ({
  errorMessage: (error: unknown) => error instanceof Error ? error.message : "失败",
  IpcError: class extends Error {},
  ipc: { listAgents: vi.fn(), getGlobalConfiguration: vi.fn(), saveAgent: vi.fn(), saveGlobalConfiguration: vi.fn(), importAvatar: vi.fn(), readAvatar: vi.fn(), setSecret: vi.fn(), deleteSecret: vi.fn(), secretStatus: vi.fn(), testModel: vi.fn(), importDevelopmentModel: vi.fn() },
}))
beforeEach(() => {
  vi.resetAllMocks()
  vi.mocked(ipc.listAgents).mockResolvedValue([agentConfiguration(), agentConfiguration("second", "第二位")])
  vi.mocked(ipc.getGlobalConfiguration).mockResolvedValue(globalConfiguration())
})
function visibleDetail() { return screen.getByRole("heading", { level: 2 }).closest("section")! }
async function openSage() {
  await userEvent.click(await screen.findByRole("button", { name: /Sage.*待配置/ }))
  await screen.findByRole("heading", { name: "Sage", level: 2 })
}

describe("本地智能体配置", () => {
  it("列表最上方是默认选中的全局配置，右侧直接显示模型配置", async () => {
    render(<AgentsPage {...pageProps()} />)
    await screen.findByLabelText("模型预设名称")
    const sidebar = screen.getByRole("complementary", { name: "智能体列表" })
    const entries = sidebar.querySelectorAll(".list-entry")
    expect(entries[0]).toHaveAccessibleName("全局配置")
    expect(entries[0]).toHaveAttribute("data-active", "true")
    expect(entries[1]).toHaveTextContent("Sage")
    expect(screen.getByRole("heading", { name: "全局配置", level: 2 })).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "模型配置" })).toHaveAttribute("aria-pressed", "true")
  })
  it("首次激活读取，切换选择保留成员与全局草稿", async () => {
    const props = pageProps(false)
    const view = render(<AgentsPage {...props} />)
    expect(ipc.listAgents).not.toHaveBeenCalled()
    view.rerender(<AgentsPage {...props} active />)
    await screen.findByLabelText("模型预设名称")
    fireEvent.change(within(visibleDetail()).getByLabelText("模型标识"), { target: { value: "全局草稿" } })
    await openSage()
    fireEvent.change(within(visibleDetail()).getByLabelText("名称"), { target: { value: "Sage 草稿" } })
    await userEvent.click(screen.getByRole("button", { name: /第二位.*待配置/ }))
    expect(screen.getByRole("heading", { level: 2 })).toHaveTextContent("第二位")
    await userEvent.click(screen.getByRole("button", { name: /Sage.*待配置/ }))
    expect(within(visibleDetail()).getByLabelText("名称")).toHaveValue("Sage 草稿")
    await userEvent.click(screen.getByRole("button", { name: "全局配置" }))
    expect(within(visibleDetail()).getByLabelText("模型标识")).toHaveValue("全局草稿")
    expect(ipc.listAgents).toHaveBeenCalledTimes(1)
    expect(ipc.getGlobalConfiguration).toHaveBeenCalledTimes(1)
  })
  it("新建并保存真实配置，expected_revision 为 null，状态不宣称启动", async () => {
    vi.mocked(ipc.saveAgent).mockImplementation(async (request) => ({ ...request.configuration, revision: "1" }))
    render(<AgentsPage {...pageProps()} />)
    await openSage()
    await userEvent.click(screen.getByRole("button", { name: "新建智能体" }))
    fireEvent.change(within(visibleDetail()).getByLabelText("名称"), { target: { value: "新成员" } })
    await userEvent.click(within(visibleDetail()).getByRole("button", { name: "保存智能体" }))
    await waitFor(() => expect(ipc.saveAgent).toHaveBeenCalledTimes(1))
    expect(vi.mocked(ipc.saveAgent).mock.calls[0][0].expected_revision).toBeNull()
    await screen.findByText("配置已保存，未启动")
  })
  it("晚保存不会改变新选择或删除保存期间新建的草稿", async () => {
    let finish!: (agent: AgentConfiguration) => void
    vi.mocked(ipc.saveAgent).mockReturnValue(new Promise((resolve) => { finish = resolve }))
    render(<AgentsPage {...pageProps()} />)
    await openSage()
    await userEvent.click(within(visibleDetail()).getByRole("button", { name: "保存智能体" }))
    await userEvent.click(screen.getByRole("button", { name: "新建智能体" }))
    fireEvent.change(within(visibleDetail()).getByLabelText("名称"), { target: { value: "新建草稿" } })
    await act(async () => finish({ ...agentConfiguration(), revision: "2" }))
    expect(screen.getByRole("heading", { level: 2 })).toHaveTextContent("新建草稿")
    expect(screen.getByRole("button", { name: /新智能体.*未保存/ })).toBeInTheDocument()
  })
  it("采用模型复制普通参数和来源版本，地址协议只读且没有密钥字段", async () => {
    render(<AgentsPage {...pageProps()} />)
    await openSage()
    fireEvent.change(within(visibleDetail()).getByLabelText("采用模型预设"), { target: { value: "model-a" } })
    await userEvent.click(within(visibleDetail()).getByRole("button", { name: "确认采用" }))
    const detail = within(visibleDetail())
    expect(detail.getByLabelText("模型标识")).toHaveValue("test-model")
    expect(detail.getByText(/来源版本 1/)).toBeInTheDocument()
    expect(detail.queryByLabelText("API Key")).not.toBeInTheDocument()
    expect(detail.getByLabelText("API 地址")).toHaveAttribute("readonly")
    expect(detail.getByLabelText("协议")).toBeDisabled()
    fireEvent.change(detail.getByLabelText("API 地址"), { target: { value: "https://wrong.example.com" } })
    expect(detail.getByLabelText("API 地址")).toHaveValue("https://example.com/v1")
    expect(detail.getByLabelText("性别描述（可选）")).toHaveAttribute("maxlength", "80")
    expect(detail.getByLabelText("角色指令（SKILL）")).toBeInTheDocument()
    await userEvent.click(detail.getByRole("button", { name: "打开全局配置" }))
    expect(screen.getByRole("heading", { level: 2 })).toHaveTextContent("全局配置")
  })
  it("全局保存更新可采用的预设，不覆盖成员已有草稿与独立参数", async () => {
    vi.mocked(ipc.saveGlobalConfiguration).mockImplementation(async (request) => ({ ...globalConfiguration(), revision: "2", model_profiles: request.model_profiles.map((profile) => ({ ...profile, revision: "2", credential_configured: false })) }))
    render(<AgentsPage {...pageProps()} />)
    await openSage()
    fireEvent.change(within(visibleDetail()).getByLabelText("名称"), { target: { value: "成员草稿" } })
    fireEvent.change(within(visibleDetail()).getByLabelText("采用模型预设"), { target: { value: "model-a" } })
    await userEvent.click(within(visibleDetail()).getByRole("button", { name: "确认采用" }))
    await userEvent.click(screen.getByRole("button", { name: "全局配置" }))
    fireEvent.change(within(visibleDetail()).getByLabelText("模型标识"), { target: { value: "新全局模型" } })
    await userEvent.click(within(visibleDetail()).getByRole("button", { name: "保存全局配置" }))
    await screen.findByText("全局配置已保存")
    await userEvent.click(screen.getByRole("button", { name: /Sage.*待配置/ }))
    expect(within(visibleDetail()).getByLabelText("名称")).toHaveValue("成员草稿")
    expect(within(visibleDetail()).getByLabelText("模型标识")).toHaveValue("test-model")
    await userEvent.click(screen.getByRole("button", { name: /第二位.*待配置/ }))
    fireEvent.change(within(visibleDetail()).getByLabelText("采用模型预设"), { target: { value: "model-a" } })
    await userEvent.click(within(visibleDetail()).getByRole("button", { name: "确认采用" }))
    expect(within(visibleDetail()).getByLabelText("模型标识")).toHaveValue("新全局模型")
    expect(within(visibleDetail()).getByText(/来源版本 2/)).toBeInTheDocument()
  })
})
