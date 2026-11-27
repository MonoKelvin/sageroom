import { act, fireEvent, render, screen, waitFor, within } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { IpcError, ipc } from "@/app/ipc"
import type { AgentRuntimeState, AgentRuntimeStatus, AgentType } from "@/contracts/generated"
import { ConfigurationTestProvider, mockConfigurationIpc, pageProps } from "@/features/settings/configuration.test-fixtures"
import { defaultDimensions } from "@/features/settings/configurationDefaults"
import { AgentsPage } from "./AgentsPage"

beforeEach(() => { mockConfigurationIpc() })
function page(props = pageProps()) { return <ConfigurationTestProvider snapshot={props.session.snapshot}><AgentsPage {...props} /></ConfigurationTestProvider> }
function sidebar() { return within(screen.getByLabelText("智能体列表")) }
async function openSage() { await userEvent.click(await sidebar().findByRole("button", { name: /Sage.*待配置/ })) }
function detail(name: string) { return within(screen.getByText(name, { selector: "h2" }).closest("section")!) }
async function section(name: "基本资料" | "人格表达" | "模型配置" | "工具", where: ReturnType<typeof detail> = screen) {
  await userEvent.click(where.getByRole("tab", { name }))
}
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
function configureModel(data: ReturnType<typeof mockConfigurationIpc>) {
  const { id, name, protocol, base_url, model_name, revision } = data.global.model_profiles[0]
  data.agents[0].model = { source_profile_id: id, source_profile_revision: revision, profile: { id, name, protocol, base_url, model_name } }
}
function configuredProps(runtime?: AgentRuntimeState, agentType: AgentType = "social") {
  const data = mockConfigurationIpc()
  configureModel(data)
  data.agents[0].agent_type = agentType
  data.global.model_profiles[0].credential_configured = runtime?.status !== "needs_configuration"
  return withRuntime(pageProps(), runtime)
}
const toolExpression = {
  agent_type: "tool",
  language_style: "结论优先，专业直接；必要时先追问。",
  dimensions: { professional: 100, direct: 100, formal: 65, casual: 10, humor: 0, empathy: 35, social_energy: 0, activity: 0 },
  skill: "",
}

describe("持久资源智能体页面", () => {
  it("默认全局配置置顶，首次激活读取且导航不会丢局部 draft", async () => {
    const props = pageProps(false)
    const view = render(page(props))
    expect(ipc.listAgents).not.toHaveBeenCalled()
    view.rerender(page({ ...props, active: true }))
    await screen.findByLabelText("配置名称", { selector: "input" })
    const aside = screen.getByRole("complementary", { name: "智能体列表" })
    // 全局配置已移出列表，改为顶部图标按钮承载当前视图
    expect(within(aside).getByRole("button", { name: "全局配置" })).toHaveAttribute("aria-pressed", "true")
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
  })
  it("新建即排队写入合法默认配置，稳定 ID 与 null revision，不宣称已启动", async () => {
    render(page())
    await screen.findByLabelText("配置名称", { selector: "input" })
    await userEvent.click(sidebar().getByRole("button", { name: "新建智能体" }))
    await screen.findByRole("heading", { name: "新智能体", level: 2 })
    await waitFor(() => expect(ipc.saveAgent).toHaveBeenCalledTimes(1))
    const request = vi.mocked(ipc.saveAgent).mock.calls[0][0]
    expect(request.expected_revision).toBeNull()
    expect(request.configuration).toMatchObject({ display_name: "新智能体", model: null, language_style: "自然、清晰" })
    expect(detail("新智能体").getByRole("status")).toHaveTextContent("待配置")
    expect(detail("新智能体").getByText(/正在启动|待配置|在线观察|离线/)).toBeInTheDocument()
    expect(detail("新智能体").queryByRole("button", { name: /暂停运行|恢复运行|重试启动/ })).not.toBeInTheDocument()
    expect(sidebar().getByRole("button", { name: /新智能体.*待配置/ })).toBeInTheDocument()
  })
  it("八个人格维度包含可持久化活跃度，非法值不写入，重开页面读回", async () => {
    const view = render(page())
    await openSage()
    await section("人格表达", detail("Sage"))
    await userEvent.click(detail("Sage").getByText("八个人格维度（0–100）"))
    const labels = ["专业", "正式", "随和", "幽默", "直接", "共情", "社交", "活跃度"]
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
    await section("人格表达", detail("Sage"))
    await userEvent.click(detail("Sage").getByText("八个人格维度（0–100）"))
    expect(detail("Sage").getByRole("spinbutton", { name: "活跃度" })).toHaveValue("100")
  })

  it("晚创建结果不会切换当前选择，后续文本失焦独立应用并更新列表名称", async () => {
    let finish!: () => void
    vi.mocked(ipc.saveAgent).mockImplementationOnce((request) => new Promise((resolve) => { finish = () => resolve({ ...request.configuration, revision: "1" }) }))
    render(page())
    await screen.findByLabelText("配置名称", { selector: "input" })
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
  it("智能体昵称按中文 2、英文 1 计宽，九个中文不写入", async () => {
    render(page())
    await openSage()
    const name = detail("Sage").getByLabelText("名称", { selector: "input" })
    fireEvent.change(name, { target: { value: "九个中文昵称啊哈哈" } })
    fireEvent.blur(name)
    expect(await detail("Sage").findByRole("alert")).toHaveTextContent("最多 8 个中文")
    expect(ipc.saveAgent).not.toHaveBeenCalled()
  })
  it("采用模型直接应用普通参数和 confirmed 版本，覆盖需确认且没有密钥", async () => {
    render(page())
    await openSage()
    await section("模型配置", detail("Sage"))
    await select("模型预设", "常用模型")
    await waitFor(() => expect(ipc.saveAgent).toHaveBeenCalledTimes(1))
    const sage = detail("Sage")
    expect(sage.getByLabelText("模型名称", { selector: "input" })).toHaveValue("test-model")
    // 全局参数不再暴露，仅保留模型名称与获取列表按钮
    expect(sage.queryByLabelText("API 地址", { selector: "input" })).not.toBeInTheDocument()
    expect(sage.queryByRole("combobox", { name: "协议类型" })).not.toBeInTheDocument()
    expect(sage.getByRole("button", { name: "获取模型列表" })).toBeInTheDocument()
  })
  it("全局修改不回写采用后的模型与人格，新采用会读取已确认版本", async () => {
    render(page())
    await openSage()
    await section("模型配置", detail("Sage"))
    await select("模型预设", "常用模型")
    await section("人格表达", detail("Sage"))
    await select("人格预设", "自然交流")
    expect(screen.getByText(/替换当前语言风格和人格维度/)).toBeInTheDocument()
    await userEvent.click(screen.getByRole("button", { name: "确认采用" }))
    await waitFor(() => expect(ipc.saveAgent).toHaveBeenCalledTimes(2))
    expect(detail("Sage").getByLabelText("个人介绍", { selector: "textarea" })).toHaveValue("自然友善")
    await userEvent.click(sidebar().getByRole("button", { name: "全局配置" }))
    const modelName = detail("全局配置").getByLabelText("模型名称", { selector: "input" })
    fireEvent.change(modelName, { target: { value: "新的全局模型" } })
    fireEvent.blur(modelName)
    await waitFor(() => expect(ipc.saveGlobalConfiguration).toHaveBeenCalledTimes(1))
    await userEvent.click(sidebar().getByRole("button", { name: /Sage.*已配置/ }))
    expect(detail("Sage").getByLabelText("模型名称", { selector: "input" })).toHaveValue("test-model")
    await userEvent.click(sidebar().getByRole("button", { name: /第二位.*待配置/ }))
    await section("模型配置", detail("第二位"))
    await select("模型预设", "常用模型")
    await waitFor(() => expect(detail("第二位").getByLabelText("模型名称", { selector: "input" })).toHaveValue("新的全局模型"))
    expect(detail("第二位").getByLabelText("模型名称", { selector: "input" })).toHaveValue("新的全局模型")
  })
  it("未配置模型 option 禁用，头像成功即时应用", async () => {
    const data = mockConfigurationIpc()
    data.global.model_profiles[0].base_url = ""
    vi.mocked(ipc.importAvatar).mockResolvedValue({ id: "avatar-local", mime_type: "image/png", width: 64, height: 64, byte_size: 3 })
    render(page())
    await openSage()
    await section("模型配置", detail("Sage"))
    await userEvent.click(screen.getByRole("combobox", { name: "模型预设" }))
    expect(screen.queryByRole("option", { name: /未配置/ })).not.toBeInTheDocument()
    await userEvent.keyboard("{Escape}")
    await section("基本资料", detail("Sage"))
    await userEvent.click(detail("Sage").getByRole("button", { name: "更换头像" }))
    await waitFor(() => expect(vi.mocked(ipc.saveAgent).mock.lastCall?.[0].configuration).toMatchObject({ agent_type: "social", avatar_id: "avatar-local" }))
    expect(ipc.controlAgentRuntime).not.toHaveBeenCalled()
    expect(ipc.testModel).not.toHaveBeenCalled()
  })

  it.each([
    ["social", "工具助手", toolExpression],
    ["tool", "社交成员", { agent_type: "social", language_style: "自然、清晰", dimensions: defaultDimensions, skill: "" }],
  ] satisfies [AgentType, string, typeof toolExpression][])("从 %s 切换类型须确认且类型与表达一起保存", async (from, to, expression) => {
    const data = mockConfigurationIpc()
    configureModel(data)
    Object.assign(data.agents[0], { agent_type: from, local_tools_enabled: from === "tool", language_style: "已有的个人介绍", skill: "继承的技能", avatar_id: "avatar-local" })
    const original = structuredClone(data.agents[0])
    const entry = { id: "experience-test", content: "已记录的事务", score: 85, recorded_at: "2026/11/22 10:00" }
    const listExperience = vi.spyOn(ipc, "experienceList").mockResolvedValue([entry])
    render(page())
    await userEvent.click(await sidebar().findByRole("button", { name: /Sage.*正在启动/ }))
    const sage = detail("Sage")
    if (from === "social") expect(sage.queryByRole("tab", { name: "工具" })).not.toBeInTheDocument()
    await userEvent.click(sage.getByRole("button", { name: /经历（\d+条经历）/ }))
    expect(await sage.findByText(entry.content)).toBeInTheDocument()
    await select("智能体类型", to)
    const getDialog = () => within(screen.getByRole("dialog", { name: `切换为${to}` }))
    expect(getDialog().getByText(/个人介绍（语言风格）和八个人格参数/)).toHaveTextContent("名称、头像、模型和经历不变")
    expect(ipc.saveAgent).not.toHaveBeenCalled()
    await userEvent.click(getDialog().getByRole("button", { name: "取消" }))
    expect(sage.getByRole("combobox", { name: "智能体类型" })).toHaveTextContent(from === "social" ? "社交成员" : "工具助手")
    expect(ipc.saveAgent).not.toHaveBeenCalled()
    expect(data.agents[0]).toEqual(original)
    await select("智能体类型", to)
    await userEvent.click(getDialog().getByRole("button", { name: "确认切换" }))
    await waitFor(() => expect(ipc.saveAgent).toHaveBeenCalledTimes(1))
    expect(vi.mocked(ipc.saveAgent).mock.lastCall?.[0].configuration).toEqual({ ...original, ...expression, local_tools_enabled: false })
    expect(sage.getByRole("combobox", { name: "智能体类型" })).toHaveTextContent(to)
    expect(sage.getByText(entry.content)).toBeInTheDocument()
    expect(listExperience).toHaveBeenCalledTimes(1)
    if (to === "工具助手") {
      expect(sage.getByRole("tab", { name: "工具" })).toBeInTheDocument()
      expect(sage.getByText(/只处理单独 @ 自己的任务/)).toBeInTheDocument()
      expect(sage.getByRole("textbox", { name: "经历内容" })).toHaveAttribute("placeholder", "记录重要事务、已验证的结论或解决方案……")
    } else {
      expect(sage.queryByRole("tab", { name: "工具" })).not.toBeInTheDocument()
    }
    await section("人格表达", sage)
    expect(sage.getByRole("textbox", { name: "个人介绍" })).toHaveValue(expression.language_style)
    expect(ipc.controlAgentRuntime).not.toHaveBeenCalled()
  })

  it("已有工具助手保留自定义表达，确认重置时保留本地工具授权", async () => {
    const data = mockConfigurationIpc()
    Object.assign(data.agents[0], { agent_type: "tool", local_tools_enabled: true, language_style: "已有工具风格", skill: "继承的技能" })
    render(page())
    await openSage()
    const sage = detail("Sage")
    await section("人格表达", sage)
    expect(sage.getByRole("textbox", { name: "个人介绍" })).toHaveValue("已有工具风格")
    const reset = () => userEvent.click(sage.getByRole("button", { name: "重置为工具助手默认表达" }))
    await reset()
    expect(ipc.saveAgent).not.toHaveBeenCalled()
    await userEvent.click(within(screen.getByRole("dialog")).getByRole("button", { name: "取消" }))
    expect(ipc.saveAgent).not.toHaveBeenCalled()
    expect(sage.getByRole("textbox", { name: "个人介绍" })).toHaveValue("已有工具风格")
    await reset()
    await userEvent.click(within(screen.getByRole("dialog")).getByRole("button", { name: "确认重置" }))
    await waitFor(() => expect(ipc.saveAgent).toHaveBeenCalledTimes(1))
    expect(vi.mocked(ipc.saveAgent).mock.lastCall?.[0].configuration).toMatchObject({ ...toolExpression, local_tools_enabled: true })
    expect(sage.getByRole("textbox", { name: "个人介绍" })).toHaveValue(toolExpression.language_style)
  })
})

describe("工具助手本地工具", () => {
  it("未授权时关闭，取消不写入，确认才启用，关闭无需确认", async () => {
    const data = mockConfigurationIpc()
    Object.assign(data.agents[0], { agent_type: "tool", local_tools_enabled: undefined })
    render(page())
    await openSage()
    const sage = detail("Sage")
    await section("工具", sage)
    const toggle = () => sage.getByRole("switch", { name: "本地工具" })
    const confirmation = () => within(screen.getByRole("dialog", { name: "启用本地工具？" }))
    expect(toggle()).not.toBeChecked()
    await userEvent.click(toggle())
    expect(confirmation().getByText(/无需逐次确认/)).toBeVisible()
    expect(confirmation().queryByText(/workspace/)).not.toBeInTheDocument()
    expect(ipc.saveAgent).not.toHaveBeenCalled()
    await userEvent.click(confirmation().getByRole("button", { name: "取消" }))
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument()
    expect(toggle()).not.toBeChecked()
    expect(ipc.saveAgent).not.toHaveBeenCalled()
    await userEvent.click(toggle())
    await userEvent.click(confirmation().getByRole("button", { name: "启用" }))
    await waitFor(() => expect(ipc.saveAgent).toHaveBeenCalledTimes(1))
    expect(vi.mocked(ipc.saveAgent).mock.lastCall?.[0].configuration).toMatchObject({ agent_id: "sage-test", local_tools_enabled: true })
    expect(toggle()).toBeChecked()
    await userEvent.click(toggle())
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument()
    await waitFor(() => expect(ipc.saveAgent).toHaveBeenCalledTimes(2))
    expect(vi.mocked(ipc.saveAgent).mock.lastCall?.[0].configuration).toMatchObject({ agent_id: "sage-test", local_tools_enabled: false })
    expect(toggle()).not.toBeChecked()
  })

  it.each([
    ["/mock/data", "/mock/data/agents/sage-test/workspace/"],
    ["", "<应用数据目录>/data/agents/sage-test/workspace/"],
  ])("数据目录为 %j 时显示工作区 %s", async (dataDirectory, workspace) => {
    const data = mockConfigurationIpc()
    data.agents[0].agent_type = "tool"
    const props = pageProps()
    props.session.snapshot!.data_directory = dataDirectory
    render(page(props))
    await openSage()
    const sage = detail("Sage")
    await section("工具", sage)
    expect(sage.getByText(workspace, { exact: false })).toBeVisible()
  })

  it("工作区按钮仅提交当前数据世代和工具助手标识", async () => {
    const data = mockConfigurationIpc()
    data.agents[0].agent_type = "tool"
    const openWorkspace = vi.spyOn(ipc, "openAgentWorkspace").mockResolvedValueOnce(undefined).mockRejectedValueOnce(new Error("无法打开工作区"))
    render(page())
    await openSage()
    const sage = detail("Sage")
    await section("工具", sage)
    const open = sage.getByRole("button", { name: "打开工作区" })
    await userEvent.click(open)
    expect(openWorkspace).toHaveBeenCalledExactlyOnceWith({ data_generation_id: "generation-test", agent_id: "sage-test" })
    await waitFor(() => expect(open).toBeEnabled())
    await userEvent.click(open)
    expect(await sage.findByRole("alert")).toHaveTextContent("操作未完成，请重试。")
  })

  it("复制工具助手不会继承原智能体的本地工具授权", async () => {
    const data = mockConfigurationIpc()
    Object.assign(data.agents[0], { agent_type: "tool", local_tools_enabled: true })
    render(page())
    await openSage()
    const sage = detail("Sage")
    await section("工具", sage)
    expect(sage.getByRole("switch", { name: "本地工具" })).toBeChecked()
    await userEvent.click(sage.getByRole("button", { name: "复制智能体" }))
    await screen.findByRole("heading", { name: "Sage 副本", level: 2 })
    await waitFor(() => expect(ipc.saveAgent).toHaveBeenCalledTimes(1))
    const request = vi.mocked(ipc.saveAgent).mock.calls[0][0]
    expect(request.expected_revision).toBeNull()
    expect(request.configuration.agent_id).not.toBe("sage-test")
    expect(request.configuration).toMatchObject({ agent_type: "tool", local_tools_enabled: false })
    const copy = detail("Sage 副本")
    await section("工具", copy)
    expect(copy.getByRole("switch", { name: "本地工具" })).not.toBeChecked()
  })
})

describe("智能体实时运行状态", () => {
  it.each([
    ["observing", "待命中"],
    ["deciding", "正在处理任务"],
    ["needs_configuration", "待配置"],
    ["paused", "已暂停"],
    ["protected", "运行受限"],
    [undefined, "正在启动"],
  ] satisfies [AgentRuntimeStatus | undefined, string][])("工具助手按实际运行状态 %s 显示 %s", async (status, label) => {
    render(page(configuredProps(status ? runtimeState(status) : undefined, "tool")))
    const row = await sidebar().findByRole("button", { name: new RegExp(`Sage.*${label}`) })
    expect(row).toHaveTextContent(status === "needs_configuration" ? `Sage${label}` : `Sage已配置，${label}`)
    await userEvent.click(row)
    expect(detail("Sage").getByRole("status")).toHaveTextContent(label)
    expect(ipc.controlAgentRuntime).not.toHaveBeenCalled()
  })

  it("未配模型的工具助手不把旧待命快照当成已就绪", async () => {
    const data = mockConfigurationIpc()
    data.agents[0].agent_type = "tool"
    render(page(withRuntime(pageProps(), runtimeState("observing"))))
    await openSage()
    expect(detail("Sage").getByRole("status")).toHaveTextContent("待配置")
    expect(detail("Sage").queryByRole("button", { name: "暂停运行" })).not.toBeInTheDocument()
  })
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
    const style = detail("Sage").getByLabelText("个人介绍", { selector: "textarea" })
    fireEvent.change(style, { target: { value: "尚未失焦的局部草稿" } })
    const updated = withRuntime(props, runtimeState("observing", { detail: "等待新消息", config_revision: "2", next_wake_at: nextWake, requests_today: 5 }))
    view.rerender(page({ ...updated, active: false }))
    view.rerender(page(updated))
    expect(sidebar().getByRole("button", { name: /Sage.*已配置.*在线观察/ })).toHaveAttribute("data-active", "true")
    expect(detail("Sage").getByRole("status")).toHaveTextContent("在线观察")
    expect(detail("Sage").queryByText("正在判断是否接话")).not.toBeInTheDocument()
    expect(detail("Sage").getByText("等待新消息")).toBeInTheDocument()
    expect(detail("Sage").getByText(/今日请求 5 次/)).toBeInTheDocument()
    expect(detail("Sage").getByText(`下次唤醒：${new Date(nextWake).toLocaleString("zh-CN", { hour12: false })}`)).toBeInTheDocument()
    expect(detail("Sage").getByLabelText("个人介绍", { selector: "textarea" })).toHaveValue("尚未失焦的局部草稿")
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
    expect(await detail("Sage").findByText("今日请求额度尚未恢复。")).toBeInTheDocument()
    expect(detail("Sage").getByRole("status")).toHaveTextContent("运行受限")
    expect(detail("Sage").getByRole("button", { name: "重试启动" })).toBeEnabled()
    expect(ipc.controlAgentRuntime).toHaveBeenCalledWith({ data_generation_id: "generation-test", agent_id: "sage-test", paused: false })
  })
})
