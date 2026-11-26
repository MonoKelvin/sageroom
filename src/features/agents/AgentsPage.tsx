import { useEffect, useRef, useState } from "react"
import { IconAdjustments, IconCopy, IconId, IconLoader2, IconPlayerPause, IconPlayerPlay, IconPlus, IconRobot, IconSearch, IconTrash } from "@tabler/icons-react"
import type { ApplicationPageProps } from "@/app/navigation"
import type { AgentConfiguration, AgentRuntimeStatus, GlobalConfiguration, Participant } from "@/contracts/generated"
import type { AppliedResource } from "@/app/appliedResource"
import { modelIsComplete } from "@/app/configurationStore"
import { useAgentResources, useAppliedResource, useConfiguration, useConfigurationRuntime } from "@/app/configurationContext"
import { errorMessage, ipc } from "@/app/ipc"
import { Avatar } from "@/components/Avatar"
import { WorkspaceList } from "@/components/WorkspaceList"
import { AppDialog } from "@/components/ui/app-dialog"
import { Button } from "@/components/ui/button"
import { EditableInput } from "@/components/ui/editable-input"
import { EditableTextarea } from "@/components/ui/editable-textarea"
import { Disclosure } from "@/components/ui/disclosure"
import { SegmentedControl } from "@/components/ui/segmented-control"
import { SettingsSelect } from "@/components/ui/settings-select"
import { validateDisplayName, validateText } from "@/features/settings/configurationDefaults"
import { DimensionsFields, Field, ModelNamePicker, ResourceFeedback } from "@/features/settings/ConfigurationFields"
import { usePageActivation } from "@/features/settings/useLocalEditor"
import { GLOBAL_CONFIG_ICON, GlobalConfiguration as GlobalConfigurationPanel } from "./GlobalConfiguration"
import { ExperiencePanel } from "./ExperiencePanel"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import "@/features/settings/configuration.css"

const runtimeStatusLabels: Record<AgentRuntimeStatus, string> = {
  needs_configuration: "待配置",
  observing: "在线观察",
  deciding: "正在思考",
  waiting_to_send: "准备发送",
  sleeping: "休息中",
  paused: "已暂停",
  protected: "运行受限",
  offline: "离线",
}

function agentStatusLabel(agent: AgentConfiguration, participant?: Participant) {
  if (!agent.model) return "待配置"
  return participant?.runtime ? runtimeStatusLabels[participant.runtime.status] : "正在启动"
}

function AgentEditor({ resource, global, active, session, onCopy, onDelete }: {
  resource: AppliedResource<AgentConfiguration>; global: GlobalConfiguration; active: boolean
  session: ApplicationPageProps["session"]
  onCopy: (agent: AgentConfiguration) => void; onDelete: (agent: AgentConfiguration) => void
}) {
  const store = useConfiguration()
  const runtime = useConfigurationRuntime()
  const state = useAppliedResource(resource, active)
  const agent = state.value!
  const generation = session.snapshot!.data_generation_id
  const participant = session.snapshot!.participants.find((member) => member.kind === "agent" && member.id === agent.agent_id)
  const agentRuntime = participant?.runtime
  const statusLabel = agentStatusLabel(agent, participant)
  const canPause = agentRuntime?.status === "observing" || agentRuntime?.status === "deciding" || agentRuntime?.status === "waiting_to_send"
  const runtimeAction = canPause ? "暂停运行" : !agentRuntime ? "开始运行" : agentRuntime.status === "paused" || agentRuntime.status === "sleeping" ? "恢复运行" : "重试启动"
  const [runtimePending, setRuntimePending] = useState(false)
  const [runtimeError, setRuntimeError] = useState<string | null>(null)
  const [avatarPending, setAvatarPending] = useState(false)
  const [confirmRemoveAvatar, setConfirmRemoveAvatar] = useState(false)
  const [operationError, setOperationError] = useState<string | null>(null)
  const [personaId, setPersonaId] = useState("")
  const [applyTarget, setApplyTarget] = useState<{ kind: "persona" | "model"; id: string } | null>(null)
  const [section, setSection] = useState<"basic" | "persona" | "model">("basic")
  const avatarEpoch = useRef(0)
  const alive = useRef(false)
  useEffect(() => { alive.current = true; return () => { alive.current = false; avatarEpoch.current += 1 } }, [])
  const update = (patch: Partial<AgentConfiguration>) => store.updateAgent(agent.agent_id, patch)

  async function controlRuntime() {
    if (runtimePending || runtime.exiting) return
    setRuntimePending(true)
    setRuntimeError(null)
    try {
      await ipc.controlAgentRuntime({ data_generation_id: generation, agent_id: agent.agent_id, paused: canPause })
    } catch (cause) { if (alive.current) setRuntimeError(errorMessage(cause)) }
    finally { if (alive.current) setRuntimePending(false) }
  }

  async function importAvatar() {
    if (avatarPending || runtime.exiting) return
    const token = ++avatarEpoch.current
    setAvatarPending(true)
    setOperationError(null)
    try {
      const result = await ipc.importAvatar({ data_generation_id: generation })
      if (alive.current && token === avatarEpoch.current && result) await update({ avatar_id: result.id })
    } catch (cause) { if (alive.current && token === avatarEpoch.current && resource.getSnapshot().status !== "error") setOperationError(errorMessage(cause)) }
    finally { if (alive.current) setAvatarPending(false) }
  }
  async function removeAvatar() {
    avatarEpoch.current += 1
    setConfirmRemoveAvatar(false)
    setOperationError(null)
    try { await update({ avatar_id: null }) } catch (cause) { if (alive.current && resource.getSnapshot().status !== "error") setOperationError(errorMessage(cause)) }
  }
  async function applyTemplate(kind: "persona" | "model", id: string) {
    setApplyTarget(null)
    setOperationError(null)
    try {
      if (kind === "model") await store.applyModel(agent.agent_id, id)
      else { await store.applyPersona(agent.agent_id, id); if (alive.current) setPersonaId(id) }
    } catch (cause) { if (alive.current && resource.getSnapshot().status !== "error") setOperationError(errorMessage(cause)) }
  }
  async function selectTemplate(kind: "persona" | "model", id: string) {
    if (kind === "persona" && !id) { setPersonaId(""); return }
    if (kind === "model" && !agent.model) await applyTemplate(kind, id)
    else setApplyTarget({ kind, id })
  }

  return <section className="surface-card">
    <header className="panel-heading"><div className="min-w-0 agent-title-group">
      <Tooltip disableHoverableContent><TooltipTrigger asChild>
        <button type="button" className="agent-avatar-button" aria-label={avatarPending ? "正在选择…" : "更换头像"} disabled={avatarPending || runtime.exiting} onClick={() => void importAvatar()}>
          <Avatar name={agent.display_name} avatarId={agent.avatar_id} colorId={agent.agent_id} generation={generation} size={48} retryable />
        </button>
      </TooltipTrigger><TooltipContent>点击更换头像</TooltipContent></Tooltip>
      <div className="min-w-0"><h2 className="panel-title truncate">{agent.display_name}</h2><p className="panel-description"><span role="status">{statusLabel}</span>{agentRuntime ? ` · 今日请求 ${agentRuntime.requests_today} 次` : ""}</p></div>
    </div><div className="config-actions">
      {agent.model && <Tooltip><TooltipTrigger asChild><Button variant="ghost" size="icon-sm" aria-label={runtimePending ? "正在处理…" : runtimeAction} disabled={runtime.exiting || runtimePending} onClick={() => void controlRuntime()}>{runtimePending ? <IconLoader2 size={18} className="spin" aria-hidden="true" /> : canPause ? <IconPlayerPause size={18} aria-hidden="true" /> : <IconPlayerPlay size={18} aria-hidden="true" />}</Button></TooltipTrigger><TooltipContent>{runtimeAction}</TooltipContent></Tooltip>}
      <Tooltip><TooltipTrigger asChild><Button variant="ghost" size="icon-sm" aria-label="复制智能体" disabled={runtime.exiting} onClick={() => onCopy(agent)}><IconCopy size={18} aria-hidden="true" /></Button></TooltipTrigger><TooltipContent>复制智能体</TooltipContent></Tooltip>
      <Tooltip><TooltipTrigger asChild><Button variant="ghost" size="icon-sm" className="danger-icon" aria-label="删除智能体" disabled={runtime.exiting} onClick={() => onDelete(agent)}><IconTrash size={18} aria-hidden="true" /></Button></TooltipTrigger><TooltipContent>删除智能体</TooltipContent></Tooltip>
    </div></header>
    <div className="panel-content panel-scroll">
      {(agentRuntime || agent.agent_type === "tool" || runtimeError) && <div className="config-stack">
        {agentRuntime?.detail && agentRuntime.detail !== "观察期间有新消息或配置变化，重新判断。" && <p className="form-caption">{agentRuntime.detail}</p>}
        {agentRuntime?.next_wake_at != null && <p className="form-caption">下次唤醒：{new Date(agentRuntime.next_wake_at).toLocaleString("zh-CN", { hour12: false })}</p>}
        {agent.agent_type === "tool" && <p className="form-caption">工具任务尚未启用，不参与闲聊。</p>}
        {runtimeError && <p role="alert">{runtimeError}</p>}
      </div>}
      <fieldset disabled={runtime.exiting} className="config-stack">
        {confirmRemoveAvatar && <div className="config-notice"><p>移除当前头像？历史消息也会改用默认头像。</p><div className="config-actions"><Button size="sm" onClick={() => void removeAvatar()}>确认移除头像</Button><Button variant="ghost" size="sm" onClick={() => setConfirmRemoveAvatar(false)}>保留头像</Button></div></div>}
        <SegmentedControl className="agent-sections" label="智能体配置分类" value={section} onChange={setSection} items={[
          { value: "basic", label: "基本资料", icon: IconId },
          { value: "persona", label: "人格表达", icon: IconAdjustments },
          { value: "model", label: "模型配置", icon: IconRobot },
        ]} />
        <div hidden={section !== "basic"} inert={section !== "basic"}>
          <Field label="名称"><EditableInput label="名称" active={active} maxLength={16} value={agent.display_name} normalize={(next) => next.trim()} validate={validateDisplayName} onApply={(display_name) => update({ display_name })} /></Field>
          <Field label="智能体类型"><SettingsSelect label="智能体类型" value={agent.agent_type} options={[{ value: "social", label: "社交成员" }, { value: "tool", label: "工具助手" }]} onValueChange={(agent_type) => update({ agent_type: agent_type as AgentConfiguration["agent_type"] })} /></Field>
          <ExperiencePanel store={store} agentId={agent.agent_id} active={active && section === "basic"} disabled={runtime.exiting || agent.revision === "0"} />
        </div>
        <div hidden={section !== "persona"} inert={section !== "persona"}>
          <Field label="人格预设" caption="复制普通参数，之后与全局预设独立。"><SettingsSelect label="人格预设" value={personaId} options={[{ value: "", label: "独立编辑" }, ...global.persona_presets.map((persona) => ({ value: persona.id, label: persona.name }))]} onValueChange={(id) => selectTemplate("persona", id)} /></Field>
          <Field label="个人介绍" caption="描述ta的性格、爱好、优缺点和讨厌的事。"><EditableTextarea label="个人介绍" active={active && section === "persona"} rows={2} maxLength={2000} value={agent.language_style} validate={(next) => validateText(next, 2000)} onApply={(language_style) => update({ language_style })} /></Field>
          <Disclosure title="八个人格维度（0–100）"><DimensionsFields value={agent.dimensions} onChange={(key, next) => resource.change((current) => ({ ...current, dimensions: { ...current.dimensions, [key]: next } }))} /></Disclosure>
        </div>
        <div hidden={section !== "model"} inert={section !== "model"}>
          <Field label="模型预设" caption="复用全局配置的预设模型，可单独调整模型名称。"><SettingsSelect label="模型预设" value={agent.model?.source_profile_id ?? ""} options={global.model_profiles.filter((profile) => modelIsComplete(profile)).map((profile) => ({ value: profile.id, label: profile.name }))} onValueChange={(id) => selectTemplate("model", id)} /></Field>
          {agent.model && <Field label="模型名称"><ModelNamePicker value={agent.model.profile.model_name} active={active && section === "model"} onChange={(model_name) => store.updateAgentModel(agent.agent_id, { model_name })} onListModels={() => store.listModelNames(agent.model!.source_profile_id).then((result) => result.models)} /></Field>}
          {!global.model_profiles.length && <p className="form-caption">请先在全局配置中添加模型预设。</p>}
        </div>
      </fieldset>
      {operationError && state.status !== "error" && <p role="alert">{operationError}</p>}
      <AppDialog open={applyTarget !== null} onOpenChange={(open) => { if (!open) setApplyTarget(null) }} title="采用预设" actions={[
        { label: "确认采用", disabled: runtime.exiting, closeOnClick: false, onClick: () => { if (applyTarget) void applyTemplate(applyTarget.kind, applyTarget.id) } },
        { label: "保留当前参数", variant: "ghost" },
      ]}><p>{applyTarget?.kind === "model" ? "采用其他模型预设会替换当前模型名称，其他参数仍复用全局配置。" : "采用人格预设会替换当前语言风格和人格维度。"}</p></AppDialog>
      <ResourceFeedback resource={resource} state={state} />
    </div>
  </section>
}

function AgentPane(props: Parameters<typeof AgentEditor>[0]) {
  const initialized = usePageActivation(props.active, props.resource.getSnapshot().value!.agent_id)
  return initialized ? <AgentEditor {...props} /> : null
}

function AgentsWorkspace({ active, session }: ApplicationPageProps) {
  const store = useConfiguration()
  const runtime = useConfigurationRuntime()
  const generation = session.snapshot!.data_generation_id
  const participants = session.snapshot!.participants
  const list = useAgentResources(active)
  const globalState = useAppliedResource(store.global, active)
  const [selected, setSelected] = useState<string | null>(null)
  const [query, setQuery] = useState("")
  const [creationError, setCreationError] = useState<string | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<AgentConfiguration | null>(null)
  const alive = useRef(false)
  useEffect(() => { alive.current = true; return () => { alive.current = false } }, [])
  // 仅过滤列表展示，不影响右侧已选中的智能体。
  const keyword = query.trim().toLowerCase()
  const visibleAgents = keyword
    ? list.resources.filter((resource) => resource.getSnapshot().value!.display_name.toLowerCase().includes(keyword))
    : list.resources
  async function create(source?: AgentConfiguration) {
    setCreationError(null)
    let createdId: string | null = null
    try {
      const { agent, applied } = await store.createAgent(source)
      createdId = agent.agent_id
      if (alive.current) { setSelected(agent.agent_id); setQuery("") }
      await applied
    } catch (cause) { if (alive.current && (!createdId || store.agent(createdId).getSnapshot().status !== "error")) setCreationError(errorMessage(cause)) }
  }
  async function removeAgent() {
    if (!deleteTarget || runtime.exiting) return
    const id = deleteTarget.agent_id
    setDeleteTarget(null)
    try {
      await store.deleteAgent(id)
      await store.loadAgents()
      if (selected === id) setSelected(null)
    } catch (cause) { if (alive.current) setCreationError(errorMessage(cause)) }
  }
  return <div className="workspace-layout config-page">
    <WorkspaceList aria-label="智能体列表" className="agent-scene-list">
      <div className="agent-list-toolbar">
        <label className="agent-search">
          <IconSearch size={15} aria-hidden="true" />
          <input type="text" className="agent-search-input" value={query} placeholder="搜索智能体" aria-label="搜索智能体" onChange={(event) => setQuery(event.target.value)} />
        </label>
        <Tooltip disableHoverableContent><TooltipTrigger asChild>
          <Button variant={selected === null ? "secondary" : "ghost"} size="icon-sm" className="global-config-toggle" aria-label="全局配置" aria-pressed={selected === null} onClick={() => setSelected(null)}><GLOBAL_CONFIG_ICON size={18} aria-hidden="true" /></Button>
        </TooltipTrigger><TooltipContent>全局配置</TooltipContent></Tooltip>
        <Tooltip disableHoverableContent><TooltipTrigger asChild>
          <Button variant="ghost" size="icon-sm" disabled={!globalState.value || runtime.exiting} aria-label="新建智能体" onClick={() => void create()}><IconPlus size={18} aria-hidden="true" /></Button>
        </TooltipTrigger><TooltipContent>新建智能体</TooltipContent></Tooltip>
      </div>
      <div className="config-list-scroll">
        {visibleAgents.length === 0 && keyword && <p className="agent-search-empty">没有匹配的智能体</p>}
        {visibleAgents.map((resource) => { const agent = resource.getSnapshot().value!; const participant = participants.find((member) => member.kind === "agent" && member.id === agent.agent_id); return <button key={agent.agent_id} type="button" className="list-entry" data-active={selected === agent.agent_id} aria-current={selected === agent.agent_id ? "page" : undefined} onClick={() => setSelected(agent.agent_id)}><Avatar name={agent.display_name} avatarId={agent.avatar_id} colorId={agent.agent_id} generation={generation} size={44} /><span className="config-entry-text"><strong>{agent.display_name}</strong><span>{agent.model ? `已配置，${agentStatusLabel(agent, participant)}` : "待配置"}</span></span></button> })}
      </div>
      {list.loading && <p className="form-caption p-3">正在读取智能体…</p>}
      {list.error && <div className="config-notice" role="alert"><p>{list.error}</p><Button variant="ghost" size="sm" onClick={() => void store.loadAgents()}>重试读取智能体</Button></div>}
      {creationError && <p className="form-caption p-3" role="alert">{creationError}</p>}
    </WorkspaceList>
    <div className="workspace-detail">
      <div className="workspace-detail" hidden={selected !== null} inert={selected !== null}><GlobalConfigurationPanel active={active && selected === null} /></div>
      {globalState.value && list.resources.map((resource) => { const id = resource.getSnapshot().value!.agent_id; return <div key={id} className="workspace-detail" hidden={selected !== id} inert={selected !== id}><AgentPane resource={resource} global={globalState.value!} active={active && selected === id} session={session} onCopy={(agent) => void create(agent)} onDelete={(agent) => setDeleteTarget(agent)} /></div> })}
    </div>
    <AppDialog open={deleteTarget !== null} onOpenChange={(open) => { if (!open) setDeleteTarget(null) }} title="删除智能体" actions={[
      { label: "确认删除", variant: "destructive", closeOnClick: false, onClick: () => void removeAgent() },
      { label: "取消", variant: "ghost" },
    ]}><p>永久删除「{deleteTarget?.display_name}」？该成员的配置与经历将一并移除，历史消息仍会保留。</p></AppDialog>
  </div>
}

export function AgentsPage(props: ApplicationPageProps) {
  const initialized = usePageActivation(props.active, props.session.snapshot?.data_generation_id ?? null)
  if (!props.session.snapshot) return <section className="surface-card w-full"><div className="panel-heading"><h1 className="panel-title">智能体</h1></div><div className="panel-content"><p>本地数据尚未就绪。</p><Button variant="ghost" size="sm" onClick={() => void props.session.reload()}>重试连接</Button></div></section>
  if (!initialized) return null
  return <AgentsWorkspace key={props.session.snapshot.data_generation_id} {...props} />
}
