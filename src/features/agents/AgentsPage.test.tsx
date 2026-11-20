import { act, fireEvent, render, screen, waitFor, within } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { ipc } from "@/app/ipc"
import { ConfigurationTestProvider, mockConfigurationIpc, pageProps } from "@/features/settings/configuration.test-fixtures"
import { AgentsPage } from "./AgentsPage"

beforeEach(() => { mockConfigurationIpc() })
function page(props = pageProps()) { return <ConfigurationTestProvider snapshot={props.session.snapshot}><AgentsPage {...props} /></ConfigurationTestProvider> }
function sidebar() { return within(screen.getByLabelText("智能体列表")) }
async function openSage() { await userEvent.click(await sidebar().findByRole("button", { name: /Sage.*待配置/ })) }
function detail(name: string) { return within(screen.getByText(name, { selector: "h2" }).closest("section")!) }
async function select(label: string, option: string) {
  await userEvent.click(screen.getByRole("combobox", { name: label }))
  await userEvent.click(await screen.findByRole("option", { name: option }))
}

describe("持久资源智能体页面", () => {
  it("默认全局配置置顶，首次激活读取且导航不会丢局部 draft", async () => {
    const props = pageProps(false)
    const view = render(page(props))
    expect(ipc.listAgents).not.toHaveBeenCalled()
    view.rerender(page({ ...props, active: true }))
    await screen.findByLabelText("模型预设名称", { selector: "input" })
    const aside = screen.getByRole("complementary", { name: "智能体列表" })
    expect(aside.querySelectorAll(".list-entry")[0]).toHaveAccessibleName("全局配置")
    expect(aside.querySelectorAll(".list-entry")[0]).toHaveAttribute("data-active", "true")
    fireEvent.change(screen.getByLabelText("模型标识", { selector: "input" }), { target: { value: "全局局部草稿" } })
    await openSage()
    fireEvent.change(detail("Sage").getByLabelText("名称", { selector: "input" }), { target: { value: "成员局部草稿" } })
    await userEvent.click(sidebar().getByRole("button", { name: /第二位.*待配置/ }))
    await userEvent.click(sidebar().getByRole("button", { name: /Sage.*待配置/ }))
    expect(detail("Sage").getByLabelText("名称", { selector: "input" })).toHaveValue("成员局部草稿")
    await userEvent.click(sidebar().getByRole("button", { name: "全局配置" }))
    expect(screen.getByLabelText("模型标识", { selector: "input" })).toHaveValue("全局局部草稿")
    expect(ipc.listAgents).toHaveBeenCalledTimes(1)
    expect(ipc.getGlobalConfiguration).toHaveBeenCalledTimes(1)
    expect(ipc.saveAgent).not.toHaveBeenCalled()
    expect(Array.from(document.querySelectorAll("button")).filter((button) => /保存|重新读取|丢弃/.test(button.textContent ?? ""))).toHaveLength(0)
  }, 10000)
  it("新建即排队写入合法默认配置，稳定 ID 与 null revision，不宣称已启动", async () => {
    render(page())
    await screen.findByLabelText("模型预设名称", { selector: "input" })
    await userEvent.click(sidebar().getByRole("button", { name: "新建智能体" }))
    await screen.findByRole("heading", { name: "新智能体", level: 2 })
    await waitFor(() => expect(ipc.saveAgent).toHaveBeenCalledTimes(1))
    const request = vi.mocked(ipc.saveAgent).mock.calls[0][0]
    expect(request.expected_revision).toBeNull()
    expect(request.configuration).toMatchObject({ display_name: "新智能体", model: null, language_style: "自然、清晰" })
    expect(detail("新智能体").getByText("模型尚未配置，智能体未启动。")).toBeInTheDocument()
    expect(sidebar().getByRole("button", { name: /新智能体.*待配置/ })).toBeInTheDocument()
  })
  it("晚创建结果不会切换当前选择，后续文本失焦独立应用并更新列表名称", async () => {
    let finish!: () => void
    vi.mocked(ipc.saveAgent).mockImplementationOnce((request) => new Promise((resolve) => { finish = () => resolve({ ...request.configuration, revision: "1" }) }))
    render(page())
    await screen.findByLabelText("模型预设名称", { selector: "input" })
    await userEvent.click(sidebar().getByRole("button", { name: "新建智能体" }))
    await screen.findByRole("heading", { name: "新智能体", level: 2 })
    await userEvent.click(sidebar().getByRole("button", { name: /第二位.*待配置/ }))
    await act(async () => finish())
    expect(screen.getByRole("heading", { name: "第二位", level: 2 })).toBeInTheDocument()
    const name = detail("第二位").getByLabelText("名称", { selector: "input" })
    fireEvent.change(name, { target: { value: "已应用名称" } })
    expect(ipc.saveAgent).toHaveBeenCalledTimes(1)
    fireEvent.blur(name)
    await waitFor(() => expect(ipc.saveAgent).toHaveBeenCalledTimes(2))
    expect(sidebar().getByRole("button", { name: /已应用名称.*待配置/ })).toBeInTheDocument()
  })
  it("采用模型直接应用普通参数和 confirmed 版本，覆盖需确认且没有密钥", async () => {
    render(page())
    await openSage()
    await select("采用模型预设", "常用模型")
    await waitFor(() => expect(ipc.saveAgent).toHaveBeenCalledTimes(1))
    const sage = detail("Sage")
    expect(sage.getByLabelText("模型标识", { selector: "input" })).toHaveValue("test-model")
    expect(sage.getByText(/来源版本 1/)).toBeInTheDocument()
    expect(sage.queryByLabelText("API Key", { selector: "input" })).not.toBeInTheDocument()
    expect(sage.getByLabelText("API 地址", { selector: "input" })).toHaveAttribute("readonly")
    expect(sage.getByRole("combobox", { name: "协议" })).toBeDisabled()
    await select("采用模型预设", "不配置模型")
    expect(ipc.saveAgent).toHaveBeenCalledTimes(1)
    await userEvent.click(detail("Sage").getByRole("button", { name: "确认采用" }))
    await waitFor(() => expect(ipc.saveAgent).toHaveBeenCalledTimes(2))
    expect(vi.mocked(ipc.saveAgent).mock.lastCall?.[0].configuration.model).toBeNull()
  })
  it("全局修改不回写采用后的模型与人格，新采用会读取已确认版本", async () => {
    render(page())
    await openSage()
    await select("采用模型预设", "常用模型")
    await select("采用人格预设", "自然交流")
    expect(screen.getByRole("alert")).toHaveTextContent("替换当前语言风格")
    await userEvent.click(detail("Sage").getByRole("button", { name: "确认采用" }))
    await waitFor(() => expect(ipc.saveAgent).toHaveBeenCalledTimes(2))
    expect(detail("Sage").getByLabelText("语言风格", { selector: "textarea" })).toHaveValue("自然友善")
    await userEvent.click(sidebar().getByRole("button", { name: "全局配置" }))
    const modelName = detail("全局配置").getByLabelText("模型标识", { selector: "input" })
    fireEvent.change(modelName, { target: { value: "新的全局模型" } })
    fireEvent.blur(modelName)
    await waitFor(() => expect(ipc.saveGlobalConfiguration).toHaveBeenCalledTimes(1))
    await userEvent.click(sidebar().getByRole("button", { name: /Sage.*已配置/ }))
    expect(detail("Sage").getByLabelText("模型标识", { selector: "input" })).toHaveValue("test-model")
    await userEvent.click(sidebar().getByRole("button", { name: /第二位.*待配置/ }))
    await select("采用模型预设", "常用模型")
    await waitFor(() => expect(detail("第二位").getByLabelText("模型标识", { selector: "input" })).toHaveValue("新的全局模型"))
    expect(detail("第二位").getByText(/来源版本 2/)).toBeInTheDocument()
  }, 10000)
  it("未配置模型 option 禁用，类型选择和头像成功即时应用", async () => {
    const data = mockConfigurationIpc()
    data.global.model_profiles[0].base_url = ""
    vi.mocked(ipc.importAvatar).mockResolvedValue({ id: "avatar-local", mime_type: "image/png", width: 64, height: 64, byte_size: 3 })
    render(page())
    await openSage()
    await userEvent.click(screen.getByRole("combobox", { name: "采用模型预设" }))
    expect(await screen.findByRole("option", { name: "常用模型（未配置）" })).toHaveAttribute("aria-disabled", "true")
    await userEvent.keyboard("{Escape}")
    await select("智能体类型", "工具助手")
    await userEvent.click(detail("Sage").getByRole("button", { name: "选择头像" }))
    await waitFor(() => expect(vi.mocked(ipc.saveAgent).mock.lastCall?.[0].configuration).toMatchObject({ agent_type: "tool", avatar_id: "avatar-local" }))
    expect(ipc.testModel).not.toHaveBeenCalled()
  })
})
