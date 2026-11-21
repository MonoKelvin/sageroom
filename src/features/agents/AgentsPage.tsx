import { useEffect, useRef, useState } from "react"
import { IconAdjustments, IconCopy, IconPhoto, IconPlus } from "@tabler/icons-react"
import type { ApplicationPageProps } from "@/app/navigation"
import type { AgentConfiguration, AgentRuntimeStatus, GlobalConfiguration, Participant } from "@/contracts/generated"
import type { AppliedResource } from "@/app/appliedResource"
import { modelIsComplete } from "@/app/configurationStore"
import { useAgentResources, useAppliedResource, useConfiguration, useConfigurationRuntime } from "@/app/configurationContext"
import { errorMessage, ipc } from "@/app/ipc"
import { Avatar } from "@/components/Avatar"
import { WorkspaceList } from "@/components/WorkspaceList"
import { Button } from "@/components/ui/button"
import { EditableInput } from "@/components/ui/editable-input"
import { EditableTextarea } from "@/components/ui/editable-textarea"
import { SettingSection } from "@/components/ui/setting-row"
import { SettingsSelect } from "@/components/ui/settings-select"
import { normalizeTerms, validateTerms, validateText } from "@/features/settings/configurationDefaults"
import { DimensionsFields, Field, ModelFields, PreferencesFields, ResourceFeedback } from "@/features/settings/ConfigurationFields"
import { usePageActivation } from "@/features/settings/useLocalEditor"
import { GlobalConfiguration as GlobalConfigurationPanel } from "./GlobalConfiguration"
import "@/features/settings/configuration.css"

const runtimeStatusLabels: Record<AgentRuntimeStatus, string> = {
  needs_configuration: "待配置",
  observing: "在线观察",
  deciding: "正在思考",
  waiting_to_send: "准备发送",
  sleeping: "休息中",
  paused: "已暂停",
  protected: "达到保护上限",
  offline: "离线",
}

function agentStatusLabel(agent: AgentConfiguration, participant?: Participant) {
  if (!agent.model) return "待配置"
  return participant?.runtime ? runtimeStatusLabels[participant.runtime.status] : "正在启动"
}

function AgentEditor({ resource, global, active, session, onCopy, onOpenGlobal }: {
  resource: AppliedResource<AgentConfiguration>; global: GlobalConfiguration; active: boolean
  session: ApplicationPageProps["session"]
  onCopy: (agent: AgentConfiguration) => void; onOpenGlobal: () => void
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
    <header className="panel-heading"><div><h2 className="panel-title">{agent.display_name}</h2><p className="panel-description"><span role="status">{statusLabel}</span> · {agent.model ? "模型参数已配置" : "模型尚未配置"}</p></div><Button variant="ghost" size="sm" disabled={runtime.exiting} onClick={() => onCopy(agent)}><IconCopy size={17} aria-hidden="true" />复制</Button></header>
    <div className="panel-content panel-scroll">
      <div className="config-stack">
        {agentRuntime?.detail && <p className="form-caption">{agentRuntime.detail}</p>}
        {agentRuntime && <p className="form-caption">今日请求：{agentRuntime.requests_today} 次 · 配置版本：{agentRuntime.config_revision}</p>}
        {agentRuntime?.next_wake_at != null && <p className="form-caption">下次唤醒：{new Date(agentRuntime.next_wake_at).toLocaleString("zh-CN", { hour12: false })}</p>}
        {agent.agent_type === "tool" && <p className="form-caption">工具任务尚未启用，不参与闲聊。</p>}
        {agent.model && <div className="config-actions"><Button variant="secondary" size="sm" disabled={runtime.exiting || runtimePending} onClick={() => void controlRuntime()}>{runtimePending ? "正在处理…" : runtimeAction}</Button></div>}
        {runtimeError && <p role="alert">{runtimeError}</p>}
      </div>
      <fieldset disabled={runtime.exiting} className="config-stack">
        <div className="config-avatar-row"><Avatar name={agent.display_name} avatarId={agent.avatar_id} colorId={agent.agent_id} generation={generation} size={64} retryable /><div><div className="config-actions"><Button variant="secondary" size="sm" disabled={avatarPending} onClick={() => void importAvatar()}><IconPhoto size={16} aria-hidden="true" />{avatarPending ? "正在选择…" : "选择头像"}</Button>{agent.avatar_id && <Button variant="ghost" size="sm" onClick={() => setConfirmRemoveAvatar(true)}>移除头像</Button>}</div><p className="form-caption mt-2">选择本地 PNG 或 JPEG，成功后直接应用。</p></div></div>
        {confirmRemoveAvatar && <div className="config-notice"><p>移除当前头像？历史消息也会改用默认头像。</p><div className="config-actions"><Button size="sm" onClick={() => void removeAvatar()}>确认移除头像</Button><Button variant="ghost" size="sm" onClick={() => setConfirmRemoveAvatar(false)}>保留头像</Button></div></div>}
        <SettingSection title="基本资料">
          <Field label="名称"><EditableInput label="名称" active={active} maxLength={80} value={agent.display_name} normalize={(next) => next.trim()} validate={(next) => validateText(next, 80, true)} onApply={(display_name) => update({ display_name })} /></Field>
          <Field label="智能体类型"><SettingsSelect label="智能体类型" value={agent.agent_type} options={[{ value: "social", label: "社交成员" }, { value: "tool", label: "工具助手" }]} onValueChange={(agent_type) => update({ agent_type: agent_type as AgentConfiguration["agent_type"] })} /></Field>
          <Field label="简介"><EditableTextarea label="简介" active={active} rows={3} maxLength={2000} value={agent.introduction} validate={(next) => validateText(next, 2000)} onApply={(introduction) => update({ introduction })} /></Field>
          <details className="config-disclosure"><summary>性别描述与称呼</summary><div className="config-stack">
            <Field label="性别描述（可选）"><EditableInput label="性别描述（可选）" active={active} maxLength={80} value={agent.gender_description ?? ""} validate={(next) => validateText(next, 80)} onApply={(next) => update({ gender_description: next || null })} /></Field>
            <Field label="称呼用语" caption="每行一个，最多 16 个称呼。"><EditableTextarea label="称呼用语" active={active} rows={2} value={agent.address_terms.join("\n")} normalize={normalizeTerms} validate={validateTerms} onApply={(next) => update({ address_terms: next ? next.split("\n") : [] })} /></Field>
          </div></details>
        </SettingSection>
        <SettingSection title="人格与表达">
          <Field label="采用人格预设" caption="复制普通参数，之后与全局预设独立。"><SettingsSelect label="采用人格预设" value={personaId} options={[{ value: "", label: "独立编辑" }, ...global.persona_presets.map((persona) => ({ value: persona.id, label: persona.name }))]} onValueChange={(id) => selectTemplate("persona", id)} /></Field>
          <Field label="语言风格"><EditableTextarea label="语言风格" active={active} rows={2} maxLength={2000} value={agent.language_style} validate={(next) => validateText(next, 2000)} onApply={(language_style) => update({ language_style })} /></Field>
          <Field label="角色指令（SKILL）"><EditableTextarea label="角色指令（SKILL）" className="settings-textarea-long" active={active} rows={7} maxLength={4000} value={agent.skill} validate={(next) => validateText(next, 4000)} onApply={(skill) => update({ skill })} /></Field>
          <details className="config-disclosure"><summary>八个人格维度（0–100）</summary><DimensionsFields value={agent.dimensions} onChange={(key, next) => resource.change((current) => ({ ...current, dimensions: { ...current.dimensions, [key]: next } }))} /></details>
        </SettingSection>
        <SettingSection title="模型配置">
          <Field label="采用模型预设" caption="密钥不复制，来源 ID 与版本保留；普通参数独立。"><SettingsSelect label="采用模型预设" value={agent.model?.source_profile_id ?? ""} options={[{ value: "", label: "不配置模型" }, ...global.model_profiles.map((profile) => ({ value: profile.id, label: `${profile.name}${modelIsComplete(profile) ? "" : "（未配置）"}`, disabled: !modelIsComplete(profile) }))]} onValueChange={(id) => selectTemplate("model", id)} /></Field>
          {agent.model && <><p className="form-caption">来源版本 {agent.model.source_profile_revision}；当前参数属于这份智能体配置。</p><ModelFields value={agent.model.profile} active={active} sourceReadOnly onChange={(patch) => store.updateAgentModel(agent.agent_id, patch)} onParameterChange={(key, next) => store.updateAgentModelParameter(agent.agent_id, key, next)} /></>}
          {!global.model_profiles.length && <p className="form-caption">请先在全局配置中添加模型预设。</p>}
          <Button variant="ghost" size="sm" className="self-start" onClick={onOpenGlobal}>打开全局配置</Button>
        </SettingSection>
        <SettingSection title="运行偏好"><PreferencesFields value={agent.preferences} onChange={(patch) => resource.change((current) => ({ ...current, preferences: { ...current.preferences, ...patch } }))} /></SettingSection>
      </fieldset>
      {applyTarget && <div className="config-notice" role="alert"><p>{applyTarget.kind === "model" ? "采用预设会替换当前独立模型参数；选择不配置模型会清除模型参数。" : "采用人格预设会替换当前语言风格、称呼、角色指令和人格维度。"}</p><div className="config-actions"><Button size="sm" disabled={runtime.exiting} onClick={() => void applyTemplate(applyTarget.kind, applyTarget.id)}>确认采用</Button><Button variant="ghost" size="sm" onClick={() => setApplyTarget(null)}>保留当前参数</Button></div></div>}
      {operationError && state.status !== "error" && <p role="alert">{operationError}</p>}
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
  const [creationError, setCreationError] = useState<string | null>(null)
  const alive = useRef(false)
  useEffect(() => { alive.current = true; return () => { alive.current = false } }, [])
  async function create(source?: AgentConfiguration) {
    setCreationError(null)
    let createdId: string | null = null
    try {
      const { agent, applied } = await store.createAgent(source)
      createdId = agent.agent_id
      if (alive.current) setSelected(agent.agent_id)
      await applied
    } catch (cause) { if (alive.current && (!createdId || store.agent(createdId).getSnapshot().status !== "error")) setCreationError(errorMessage(cause)) }
  }
  return <div className="workspace-layout config-page">
    <WorkspaceList aria-label="智能体列表">
      <div className="panel-heading"><h1 className="panel-title">智能体</h1><Button variant="ghost" size="icon-sm" disabled={!globalState.value || runtime.exiting} aria-label="新建智能体" onClick={() => void create()}><IconPlus size={20} aria-hidden="true" /></Button></div>
      <div className="config-list-scroll">
        <button type="button" className="list-entry" aria-label="全局配置" data-active={selected === null} aria-current={selected === null ? "page" : undefined} onClick={() => setSelected(null)}><IconAdjustments size={22} aria-hidden="true" /><span className="config-entry-text"><strong>全局配置</strong><span>模型、人格与运行偏好</span></span></button>
        {list.resources.map((resource) => { const agent = resource.getSnapshot().value!; const participant = participants.find((member) => member.kind === "agent" && member.id === agent.agent_id); return <button key={agent.agent_id} type="button" className="list-entry" data-active={selected === agent.agent_id} aria-current={selected === agent.agent_id ? "page" : undefined} onClick={() => setSelected(agent.agent_id)}><Avatar name={agent.display_name} avatarId={agent.avatar_id} colorId={agent.agent_id} generation={generation} /><span className="config-entry-text"><strong>{agent.display_name}</strong><span>{agent.model ? `已配置，${agentStatusLabel(agent, participant)}` : "待配置"}</span></span></button> })}
      </div>
      {list.loading && <p className="form-caption p-3">正在读取智能体…</p>}
      {list.error && <div className="config-notice" role="alert"><p>{list.error}</p><Button variant="ghost" size="sm" onClick={() => void store.loadAgents()}>重试读取智能体</Button></div>}
      {creationError && <p className="form-caption p-3" role="alert">{creationError}</p>}
      <p className="form-caption p-3">群主和普通成员聊天平等，不因身份获得话题优先权。</p>
    </WorkspaceList>
    <div className="workspace-detail">
      <div className="workspace-detail" hidden={selected !== null} inert={selected !== null}><GlobalConfigurationPanel active={active && selected === null} /></div>
      {globalState.value && list.resources.map((resource) => { const id = resource.getSnapshot().value!.agent_id; return <div key={id} className="workspace-detail" hidden={selected !== id} inert={selected !== id}><AgentPane resource={resource} global={globalState.value!} active={active && selected === id} session={session} onCopy={(agent) => void create(agent)} onOpenGlobal={() => setSelected(null)} /></div> })}
    </div>
  </div>
}

export function AgentsPage(props: ApplicationPageProps) {
  const initialized = usePageActivation(props.active, props.session.snapshot?.data_generation_id ?? null)
  if (!props.session.snapshot) return <section className="surface-card w-full"><div className="panel-heading"><h1 className="panel-title">智能体</h1></div><div className="panel-content"><p>本地数据尚未就绪。</p><Button variant="ghost" size="sm" onClick={() => void props.session.reload()}>重试连接</Button></div></section>
  if (!initialized) return null
  return <AgentsWorkspace key={props.session.snapshot.data_generation_id} {...props} />
}
