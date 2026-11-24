import { act, fireEvent, render, screen, waitFor, within } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { IpcError, ipc } from "@/app/ipc"
import type { AgentRuntimeState, AgentRuntimeStatus } from "@/contracts/generated"
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
function runtimeState(status: AgentRuntimeStatus, patch: Partial<AgentRuntimeState> = {}): AgentRuntimeState {
  return { agent_id: "sage-test", config_revision: "1", status, detail: null, next_wake_at: null, requests_today: 0, ...patch }
}
function withRuntime(props: ReturnType<typeof pageProps>, runtime: AgentRuntimeState | undefined) {
  return { ...props, session: { ...props.session, snapshot: { ...props.session.snapshot!, participants: props.session.snapshot!.participants.map((participant) => participant.id === "sage-test" ? { ...participant, runtime } : participant) } } }
}
function configuredProps(runtime?: AgentRuntimeState) {
  const data = mockConfigurationIpc()
  const { id, name, protocol, base_url, model_name, revision } = data.global.model_profiles[0]
  data.agents[0].model = { source_profile_id: id, source_profile_revision: revision, profile: { id, name, protocol, base_url, model_name } }
  return withRuntime(pageProps(), runtime)
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
    fireEvent.change(screen.getByLabelText("模型名称", { selector: "input" }), { target: { value: "全局局部草稿" } })
    await openSage()
    fireEvent.change(detail("Sage").getByLabelText("名称", { selector: "input" }), { target: { value: "成员局部草稿" } })
    await userEvent.click(sidebar().getByRole("button", { name: /第二位.*待配置/ }))
    await userEvent.click(sidebar().getByRole("button", { name: /Sage.*待配置/ }))
    expect(detail("Sage").getByLabelText("名称", { selector: "input" })).toHaveValue("成员局部草稿")
    await userEvent.click(sidebar().getByRole("button", { name: "全局配置" }))
    expect(screen.getByLabelText("模型名称", { selector: "input" })).toHaveValue("全局局部草稿")
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
    expect(detail("新智能体").getByRole("status")).toHaveTextContent("待配置")
    expect(detail("新智能体").getByText(/模型尚未配置/)).toBeInTheDocument()
    expect(detail("新智能体").queryByRole("button", { name: /暂停运行|恢复运行|重试启动/ })).not.toBeInTheDocument()
    expect(sidebar().getByRole("button", { name: /新智能体.*待配置/ })).toBeInTheDocument()
  })
  it("八个人格维度包含可持久化活跃度，非法值不写入，重开页面读回", async () => {
    const view = render(page())
    await openSage()
    await userEvent.click(detail("Sage").getByText("八个人格维度（0–100）"))
    const labels = ["专业", "正式", "随和", "幽默", "直接", "共情", "社交活力", "活跃度"]
    for (const label of labels) expect(detail("Sage").getByRole("spinbutton", { name: label })).toBeInTheDocument()
    const activity = detail("Sage").getByRole("spinbutton", { name: "活跃度" })
    for (const value of ["101", "-1", "1.5", ""]) {
      fireEvent.change(activity, { target: { value } })
      fireEvent.blur(activity)
      await detail("Sage").findByRole("alert")
      expect(ipc.saveAgent).not.toHaveBeenCalled()
    }
    for (const value of ["0", "100"]) {
      fireEvent.change(activity, { target: { value } })
      fireEvent.blur(activity)
      await waitFor(() => expect(vi.mocked(ipc.saveAgent).mock.lastCall?.[0].configuration.dimensions.activity).toBe(Number(value)))
    }
    expect(ipc.controlAgentRuntime).not.toHaveBeenCalled()
    view.unmount()
    render(page())
    await openSage()
    await userEvent.click(detail("Sage").getByText("八个人格维度（0–100）"))
    expect(detail("Sage").getByRole("spinbutton", { name: "活跃度" })).toHaveValue("100")
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
    expect(sage.getByLabelText("模型名称", { selector: "input" })).toHaveValue("test-model")
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
    const modelName = detail("全局配置").getByLabelText("模型名称", { selector: "input" })
    fireEvent.change(modelName, { target: { value: "新的全局模型" } })
    fireEvent.blur(modelName)
    await waitFor(() => expect(ipc.saveGlobalConfiguration).toHaveBeenCalledTimes(1))
    await userEvent.click(sidebar().getByRole("button", { name: /Sage.*已配置/ }))
    expect(detail("Sage").getByLabelText("模型名称", { selector: "input" })).toHaveValue("test-model")
    await userEvent.click(sidebar().getByRole("button", { name: /第二位.*待配置/ }))
    await select("采用模型预设", "常用模型")
    await waitFor(() => expect(detail("第二位").getByLabelText("模型名称", { selector: "input" })).toHaveValue("新的全局模型"))
    expect(detail("第二位").getByText(/来源版本 2/)).toBeInTheDocument()
  }, 10000)
  it("未配置模型 option 禁用，类型选择和头像成功即时应用", async () => {
    const data = mockConfigurationIpc()
    const send = vi.spyOn(ipc, "send").mockRejectedValue(new Error("工具成员不得发起闲聊"))
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
    expect(detail("Sage").getByText("工具任务尚未启用，不参与闲聊。")).toBeInTheDocument()
    expect(ipc.controlAgentRuntime).not.toHaveBeenCalled()
    expect(send).not.toHaveBeenCalled()
    expect(ipc.testModel).not.toHaveBeenCalled()
  })
})

describe("智能体实时运行状态", () => {
  it("模型已配置但runtime未回报时只显示正在启动，不宣称在线", async () => {
    render(page(configuredProps()))
    await userEvent.click(await sidebar().findByRole("button", { name: /Sage.*已配置.*正在启动/ }))
    expect(detail("Sage").getByRole("status")).toHaveTextContent("正在启动")
    expect(detail("Sage").queryByText(/在线观察|今日请求|下次唤醒/)).not.toBeInTheDocument()
    await userEvent.click(detail("Sage").getByRole("button", { name: "开始运行" }))
    expect(ipc.controlAgentRuntime).toHaveBeenCalledExactlyOnceWith({ data_generation_id: "generation-test", agent_id: "sage-test", paused: false })
  })

  it("未配置模型时即使有旧runtime仍待配置，且没有虚假启动入口", async () => {
    render(page(withRuntime(pageProps(), runtimeState("observing"))))
    await openSage()
    expect(detail("Sage").getByRole("status")).toHaveTextContent("待配置")
    expect(detail("Sage").queryByRole("button", { name: /暂停运行|恢复运行|重试启动|开始/ })).not.toBeInTheDocument()
    expect(ipc.controlAgentRuntime).not.toHaveBeenCalled()
  })

  it("session快照从deciding切换observing时更新列表和detail，保留局部draft与激活状态", async () => {
    const nextWake = Date.UTC(2026, 10, 20, 10, 30)
    const props = configuredProps(runtimeState("deciding", { detail: "正在判断是否接话", requests_today: 4 }))
    const view = render(page(props))
    await userEvent.click(await sidebar().findByRole("button", { name: /Sage.*已配置.*正在思考/ }))
    expect(detail("Sage").getByRole("status")).toHaveTextContent("正在思考")
    expect(detail("Sage").getByText("正在判断是否接话")).toBeInTheDocument()
    const style = detail("Sage").getByLabelText("语言风格", { selector: "textarea" })
    fireEvent.change(style, { target: { value: "尚未失焦的局部草稿" } })
    const updated = withRuntime(props, runtimeState("observing", { detail: "等待新消息", config_revision: "2", next_wake_at: nextWake, requests_today: 5 }))
    view.rerender(page({ ...updated, active: false }))
    view.rerender(page(updated))
    expect(sidebar().getByRole("button", { name: /Sage.*已配置.*在线观察/ })).toHaveAttribute("data-active", "true")
    expect(detail("Sage").getByRole("status")).toHaveTextContent("在线观察")
    expect(detail("Sage").queryByText("正在判断是否接话")).not.toBeInTheDocument()
    expect(detail("Sage").getByText("等待新消息")).toBeInTheDocument()
    expect(detail("Sage").getByText("今日模型请求：5 次（含观察判断，非回复条数）")).toBeInTheDocument()
    expect(detail("Sage").getByText(`下次唤醒：${new Date(nextWake).toLocaleString("zh-CN", { hour12: false })}`)).toBeInTheDocument()
    expect(detail("Sage").getByLabelText("语言风格", { selector: "textarea" })).toHaveValue("尚未失焦的局部草稿")
    expect(ipc.listAgents).toHaveBeenCalledTimes(1)
    expect(ipc.saveAgent).not.toHaveBeenCalled()
  })

  it.each([
    ["needs_configuration", "待配置"], ["observing", "在线观察"], ["deciding", "正在思考"],
    ["waiting_to_send", "准备发送"], ["sleeping", "休息中"], ["paused", "已暂停"],
    ["protected", "运行受限"], ["offline", "离线"],
  ] satisfies [AgentRuntimeStatus, string][])("运行状态%s显示%s并保留已配置导航文案", async (status, label) => {
    render(page(configuredProps(runtimeState(status))))
    await userEvent.click(await sidebar().findByRole("button", { name: new RegExp(`Sage.*已配置.*${label}`) }))
    expect(detail("Sage").getByRole("status")).toHaveTextContent(label)
    const isActive = ["observing", "deciding", "waiting_to_send"].includes(status)
    const action = isActive ? "暂停运行" : ["sleeping", "paused"].includes(status) ? "恢复运行" : "重试启动"
    await userEvent.click(detail("Sage").getByRole("button", { name: action }))
    expect(ipc.controlAgentRuntime).toHaveBeenCalledExactlyOnceWith({ data_generation_id: "generation-test", agent_id: "sage-test", paused: isActive })
  })

  it.each([null, "模型暂不可用 <img src=x onerror=alert(1)>"])("离线detail=%s安全展示且可重试启动", async (message) => {
    render(page(configuredProps(runtimeState("offline", { detail: message }))))
    await userEvent.click(await sidebar().findByRole("button", { name: /Sage.*已配置.*离线/ }))
    const sage = detail("Sage")
    expect(sage.getByRole("status")).toHaveTextContent("离线")
    if (message) {
      const caption = sage.getByText(message)
      expect(caption).toBeInTheDocument()
      expect(caption.querySelector("img")).toBeNull()
    }
    expect(sage.queryByText(/下次唤醒/)).not.toBeInTheDocument()
    await userEvent.click(sage.getByRole("button", { name: "重试启动" }))
    expect(ipc.controlAgentRuntime).toHaveBeenCalledWith({ data_generation_id: "generation-test", agent_id: "sage-test", paused: false })
    expect(sage.getByRole("status")).toHaveTextContent("离线")
  })

  it("暂停传入generation和agentid，仅操作pending禁用，不用响应伪造快照", async () => {
    const props = configuredProps(runtimeState("observing"))
    let finish!: (value: AgentRuntimeState) => void
    vi.mocked(ipc.controlAgentRuntime).mockImplementationOnce(() => new Promise((resolve) => { finish = resolve }))
    const view = render(page(props))
    await userEvent.click(await sidebar().findByRole("button", { name: /Sage.*已配置.*在线观察/ }))
    await userEvent.click(detail("Sage").getByRole("button", { name: "暂停运行" }))
    expect(ipc.controlAgentRuntime).toHaveBeenCalledExactlyOnceWith({ data_generation_id: "generation-test", agent_id: "sage-test", paused: true })
    expect(detail("Sage").getByRole("button", { name: "正在处理…" })).toBeDisabled()
    await act(async () => finish(runtimeState("paused")))
    expect(detail("Sage").getByRole("status")).toHaveTextContent("在线观察")
    expect(detail("Sage").getByRole("button", { name: "暂停运行" })).toBeEnabled()
    expect(props.session.snapshot!.participants.find((participant) => participant.id === "sage-test")!.runtime?.status).toBe("observing")
    expect(props.session.reload).not.toHaveBeenCalled()
    expect(ipc.saveAgent).not.toHaveBeenCalled()
    view.rerender(page(withRuntime(props, runtimeState("paused"))))
    expect(detail("Sage").getByRole("status")).toHaveTextContent("已暂停")
    expect(detail("Sage").getByRole("button", { name: "恢复运行" })).toBeEnabled()
  })

  it("恢复运行传入paused=false，等待实时快照恢复观察", async () => {
    const props = configuredProps(runtimeState("paused"))
    const view = render(page(props))
    await userEvent.click(await sidebar().findByRole("button", { name: /Sage.*已配置.*已暂停/ }))
    await userEvent.click(detail("Sage").getByRole("button", { name: "恢复运行" }))
    expect(ipc.controlAgentRuntime).toHaveBeenCalledExactlyOnceWith({ data_generation_id: "generation-test", agent_id: "sage-test", paused: false })
    expect(detail("Sage").getByRole("status")).toHaveTextContent("已暂停")
    view.rerender(page(withRuntime(props, runtimeState("observing"))))
    expect(detail("Sage").getByRole("status")).toHaveTextContent("在线观察")
    expect(detail("Sage").getByRole("button", { name: "暂停运行" })).toBeEnabled()
    expect(ipc.saveAgent).not.toHaveBeenCalled()
  })

  it("保护上限可重试启动，失败显示errorMessage且不改变状态", async () => {
    const props = configuredProps(runtimeState("protected", { detail: "已达到今日请求上限", requests_today: 12 }))
    vi.mocked(ipc.controlAgentRuntime).mockRejectedValueOnce(new IpcError({ code: "INVALID_INPUT", message: "今日请求额度尚未恢复。", retryability: "after_user_action", field_path: null, trace_id: "runtime-test", may_have_been_charged: false }))
    render(page(props))
    await userEvent.click(await sidebar().findByRole("button", { name: /Sage.*已配置.*运行受限/ }))
    await userEvent.click(detail("Sage").getByRole("button", { name: "重试启动" }))
    expect(await detail("Sage").findByRole("alert")).toHaveTextContent("今日请求额度尚未恢复。")
    expect(detail("Sage").getByRole("status")).toHaveTextContent("运行受限")
    expect(detail("Sage").getByRole("button", { name: "重试启动" })).toBeEnabled()
    expect(ipc.controlAgentRuntime).toHaveBeenCalledWith({ data_generation_id: "generation-test", agent_id: "sage-test", paused: false })
  })
})
