import { useCallback, useEffect, useRef, useState, type FormEvent } from "react"
import { IconAdjustments, IconCopy, IconPhoto, IconPlus } from "@tabler/icons-react"
import type { ApplicationPageProps } from "@/app/navigation"
import type { AgentConfiguration, GlobalConfiguration } from "@/contracts/generated"
import { errorMessage, ipc } from "@/app/ipc"
import { Avatar } from "@/components/Avatar"
import { Button } from "@/components/ui/button"
import { defaultDimensions } from "@/features/settings/configurationDefaults"
import { DimensionsFields, EditorFeedback, Field, ModelFields, PreferencesFields } from "@/features/settings/ConfigurationFields"
import { useLocalEditor, usePageActivation } from "@/features/settings/useLocalEditor"
import { GlobalConfiguration as GlobalConfigurationPanel } from "./GlobalConfiguration"
import "@/features/settings/configuration.css"

function AgentEditor({ seed, global, generation, active, isNew, onSaved, onCopy, onOpenGlobal }: {
  seed: AgentConfiguration; global: GlobalConfiguration; generation: string; active: boolean; isNew: boolean
  onSaved: (agent: AgentConfiguration) => void; onCopy: (agent: AgentConfiguration) => void; onOpenGlobal: () => void
}) {
  const load = useCallback(async () => {
    const agents = await ipc.listAgents({ data_generation_id: generation })
    const agent = agents.find((item) => item.agent_id === seed.agent_id)
    if (!agent) throw new Error("这份智能体配置还未保存，请先保存或继续编辑。")
    return agent
  }, [generation, seed.agent_id])
  const editor = useLocalEditor({ active, load, initial: seed })
  const agent = editor.draft!
  const [avatarPending, setAvatarPending] = useState(false)
  const [avatarError, setAvatarError] = useState<string | null>(null)
  const [personaId, setPersonaId] = useState("")
  const [applyTarget, setApplyTarget] = useState<{ kind: "persona" | "model"; id: string } | null>(null)
  const avatarEpoch = useRef(0)
  const alive = useRef(false)
  useEffect(() => { alive.current = true; return () => { alive.current = false; avatarEpoch.current += 1 } }, [])

  function edit(patch: Partial<AgentConfiguration>) {
    avatarEpoch.current += 1
    editor.edit({ ...agent, ...patch })
  }
  function applyTemplate(kind: "persona" | "model", id: string) {
    if (kind === "persona") {
      const persona = global.persona_presets.find((item) => item.id === id)
      if (!persona) return
      setPersonaId(id)
      edit({ language_style: persona.language_style, address_terms: [...persona.address_terms], skill: persona.skill, dimensions: { ...persona.dimensions } })
    } else {
      const profile = global.model_profiles.find((item) => item.id === id)
      if (!profile) { edit({ model: null }); setApplyTarget(null); return }
      const { id: profileId, name, protocol, base_url, model_name, parameters, revision } = profile
      edit({ model: { source_profile_id: profileId, source_profile_revision: revision, profile: { id: profileId, name, protocol, base_url, model_name, parameters: { ...parameters } } } })
    }
    setApplyTarget(null)
  }
  async function importAvatar() {
    if (avatarPending || editor.loading) return
    const token = ++avatarEpoch.current
    setAvatarPending(true)
    setAvatarError(null)
    try {
      const result = await ipc.importAvatar({ data_generation_id: generation })
      if (alive.current && token === avatarEpoch.current && result) editor.edit({ ...agent, avatar_id: result.id })
    } catch (cause) { if (alive.current && token === avatarEpoch.current) setAvatarError(errorMessage(cause)) }
    finally { if (alive.current) setAvatarPending(false) }
  }
  async function save(event: FormEvent) {
    event.preventDefault()
    const result = await editor.save((draft, requestId, revision) => ipc.saveAgent({ data_generation_id: generation, client_request_id: requestId, expected_revision: isNew ? null : revision, configuration: { ...draft, display_name: draft.display_name.trim(), address_terms: draft.address_terms.map((term) => term.trim()).filter(Boolean) } }))
    if (result) onSaved(result)
  }
  function selectTemplate(kind: "persona" | "model", id: string) {
    if (kind === "persona" && !id) { setPersonaId(""); setApplyTarget(null); return }
    setApplyTarget({ kind, id })
  }

  return <section className="surface-card">
    <header className="panel-heading"><div><h2 className="panel-title">{agent.display_name || "未命名智能体"}</h2><p className="panel-description">{isNew ? "新配置尚未保存，也未启动。" : `${agent.model ? "模型参数已配置" : "模型尚未配置"}，智能体未启动。`}</p></div><Button variant="ghost" size="sm" onClick={() => onCopy(agent)}><IconCopy size={17} aria-hidden="true" />复制</Button></header>
    <div className="panel-content panel-scroll"><form onSubmit={(event) => void save(event)}>
      <fieldset disabled={editor.loading} className="config-stack">
        <div className="config-avatar-row"><Avatar name={agent.display_name} avatarId={agent.avatar_id} generation={generation} size={64} retryable /><div><div className="config-actions"><Button variant="secondary" size="sm" disabled={avatarPending} onClick={() => void importAvatar()}><IconPhoto size={16} aria-hidden="true" />{avatarPending ? "正在选择…" : "选择头像"}</Button>{agent.avatar_id && <Button variant="ghost" size="sm" onClick={() => edit({ avatar_id: null })}>移除头像</Button>}</div><p className="form-caption mt-2">选择本地 PNG 或 JPEG。</p></div></div>
        {avatarError && <div className="config-notice" role="alert"><p>{avatarError}</p><Button variant="ghost" size="sm" onClick={() => void importAvatar()}>重试选择头像</Button></div>}
        <section className="form-section"><h3 className="form-section-title">基本资料</h3><div className="form-grid"><Field label="名称"><input className="form-control" required maxLength={80} value={agent.display_name} onChange={(event) => edit({ display_name: event.target.value })} /></Field><Field label="智能体类型"><select className="form-control" value={agent.agent_type} onChange={(event) => edit({ agent_type: event.target.value as AgentConfiguration["agent_type"] })}><option value="social">社交成员</option><option value="tool">工具助手</option></select></Field></div><Field label="简介"><textarea className="form-control" rows={3} maxLength={2000} value={agent.introduction} onChange={(event) => edit({ introduction: event.target.value })} /></Field><details className="config-disclosure"><summary>性别描述与称呼</summary><div className="config-stack"><Field label="性别描述（可选）"><input className="form-control" maxLength={80} value={agent.gender_description ?? ""} onChange={(event) => edit({ gender_description: event.target.value || null })} /></Field><Field label="称呼用语" caption="每行一个称呼。"><textarea className="form-control" rows={2} value={agent.address_terms.join("\n")} onChange={(event) => edit({ address_terms: event.target.value.split("\n") })} /></Field></div></details></section>
        <section className="form-section"><h3 className="form-section-title">人格与表达</h3><Field label="采用人格预设" caption="复制普通参数；之后修改预设不会回写这份配置。"><select className="form-control" value={personaId} onChange={(event) => selectTemplate("persona", event.target.value)}><option value="">独立编辑</option>{global.persona_presets.map((persona) => <option key={persona.id} value={persona.id}>{persona.name}</option>)}</select></Field><Field label="语言风格"><textarea className="form-control" rows={2} maxLength={2000} value={agent.language_style} onChange={(event) => edit({ language_style: event.target.value })} /></Field><Field label="角色指令（SKILL）"><textarea className="form-control" rows={3} maxLength={4000} value={agent.skill} onChange={(event) => edit({ skill: event.target.value })} /></Field><details className="config-disclosure"><summary>七个人格维度（0–100）</summary><DimensionsFields value={agent.dimensions} onChange={(dimensions) => edit({ dimensions })} /></details></section>
        <section className="form-section"><h3 className="form-section-title">模型配置</h3><Field label="采用模型预设" caption="密钥不复制；来源预设 ID 和版本保留，普通参数独立保存。"><select className="form-control" value={agent.model?.source_profile_id ?? ""} onChange={(event) => selectTemplate("model", event.target.value)}><option value="">不配置模型</option>{global.model_profiles.map((profile) => <option key={profile.id} value={profile.id}>{profile.name}</option>)}</select></Field>{agent.model && <><p className="form-caption">来源版本 {agent.model.source_profile_revision}；当前参数属于这份智能体配置。</p><ModelFields value={agent.model.profile} sourceReadOnly onChange={(profile) => edit({ model: { ...agent.model!, profile } })} /></>}{!global.model_profiles.length && <p className="form-caption">请先在全局配置中添加并保存模型预设。</p>}<p className="form-caption">来源地址与协议只读。如需更换，先创建独立的全局模型预设，再采用该预设。</p><Button variant="ghost" size="sm" className="self-start" onClick={onOpenGlobal}>打开全局配置</Button></section>
        <section className="form-section"><h3 className="form-section-title">运行偏好</h3><PreferencesFields value={agent.preferences} onChange={(preferences) => edit({ preferences })} /></section>
      </fieldset>
      {applyTarget && <div className="config-notice" role="alert"><p>{applyTarget.kind === "model" ? "采用预设会替换当前独立模型参数；选择不配置模型会清除模型参数。" : "采用人格预设会替换当前语言风格、称呼、角色指令和人格维度。"}未保存的相关修改会被覆盖。</p><div className="config-actions"><Button size="sm" onClick={() => applyTemplate(applyTarget.kind, applyTarget.id)}>确认采用</Button><Button variant="ghost" size="sm" onClick={() => setApplyTarget(null)}>保留当前参数</Button></div></div>}
      <EditorFeedback editor={{ ...editor, pending: editor.pending || avatarPending }} /><div className="config-savebar"><span className="form-caption" role="status">{editor.saved ? "配置已保存，未启动" : editor.dirty || isNew ? "有未保存的修改" : `本地配置版本 ${agent.revision}`}</span><div className="config-actions"><Button variant="ghost" size="sm" disabled={editor.pending || editor.loading || avatarPending} onClick={editor.requestReload}>重新读取</Button><Button type="submit" disabled={editor.pending || editor.loading || avatarPending}>{editor.pending ? "保存中…" : editor.error ? "重试保存智能体" : "保存智能体"}</Button></div></div>
    </form></div>
  </section>
}

function AgentsWorkspace({ session, active }: ApplicationPageProps) {
  const generation = session.snapshot!.data_generation_id
  const load = useCallback(async () => {
    const [agents, global] = await Promise.all([ipc.listAgents({ data_generation_id: generation }), ipc.getGlobalConfiguration({ data_generation_id: generation })])
    return { revision: global.revision, agents, global }
  }, [generation])
  const workspace = useLocalEditor({ active, load })
  const data = workspace.draft
  const [selected, setSelected] = useState<string | null>(null)
  const [newIds, setNewIds] = useState<string[]>([])
  const alive = useRef(false)
  useEffect(() => { alive.current = true; return () => { alive.current = false } }, [])
  function updateGlobal(global: GlobalConfiguration) {
    if (!alive.current) return
    workspace.edit((current) => BigInt(global.revision) < BigInt(current.global.revision) ? current : { ...current, revision: global.revision, global })
  }
  function create(source?: AgentConfiguration) {
    if (!data) return
    const agent: AgentConfiguration = source ? { ...structuredClone(source), agent_id: crypto.randomUUID(), revision: "0", display_name: `${source.display_name} 副本`.slice(0, 80) } : {
      agent_id: crypto.randomUUID(), revision: "0", display_name: "新智能体", introduction: "", gender_description: null, address_terms: [], language_style: "自然、清晰", skill: "", dimensions: { ...defaultDimensions }, avatar_id: null, agent_type: "social", model: null, preferences: { ...data.global.runtime_defaults },
    }
    workspace.edit((current) => ({ ...current, agents: [...current.agents, agent] }))
    setNewIds((ids) => [...ids, agent.agent_id])
    setSelected(agent.agent_id)
  }
  function saved(agent: AgentConfiguration) {
    if (!data) return
    workspace.edit((current) => ({ ...current, agents: current.agents.map((item) => item.agent_id === agent.agent_id ? agent : item) }))
    setNewIds((ids) => ids.filter((id) => id !== agent.agent_id))
    void session.reload()
  }
  return <div className="workspace-layout config-page">
    <aside className="workspace-list" aria-label="智能体列表">
      <div className="panel-heading"><h1 className="panel-title">智能体</h1><button className="icon-button" type="button" disabled={!data} aria-label="新建智能体" onClick={() => create()}><IconPlus size={20} aria-hidden="true" /></button></div>
      <div className="config-list-scroll">
        <button type="button" className="list-entry" aria-label="全局配置" data-active={selected === null} aria-current={selected === null ? "page" : undefined} onClick={() => setSelected(null)}><IconAdjustments size={22} aria-hidden="true" /><span className="config-entry-text"><strong>全局配置</strong><span>模型、人格与运行偏好</span></span></button>
        {data?.agents.map((agent) => <button key={agent.agent_id} type="button" className="list-entry" data-active={selected === agent.agent_id} onClick={() => setSelected(agent.agent_id)}><Avatar name={agent.display_name} avatarId={agent.avatar_id} generation={generation} /><span className="config-entry-text"><strong>{agent.display_name}</strong><span>{newIds.includes(agent.agent_id) ? "未保存" : agent.model ? "已配置，未启动" : "待配置，未启动"}</span></span></button>)}
      </div>
      <p className="form-caption p-3">只管理本地配置。群主和普通成员聊天平等，不因身份获得话题优先权。</p>
    </aside>
    <div className="workspace-detail">
      {!data && <section className="surface-card"><div className="panel-heading"><h2 className="panel-title">全局配置</h2></div><div className="panel-content"><p className="form-caption">{workspace.loading ? "正在读取本地配置…" : "配置尚未读取。"}</p>{workspace.error && <p role="alert">{workspace.error}</p>}<Button variant="ghost" size="sm" disabled={workspace.loading} onClick={() => void workspace.reload()}>重试读取</Button></div></section>}
      {data && <div className="workspace-detail" hidden={selected !== null} inert={selected !== null}><GlobalConfigurationPanel generation={generation} active={active && selected === null} initial={data.global} onChanged={updateGlobal} developmentToolsAvailable={session.snapshot!.development_tools_available} /></div>}
      {data?.agents.map((agent) => <div key={agent.agent_id} className="workspace-detail" hidden={selected !== agent.agent_id} inert={selected !== agent.agent_id}><AgentEditor seed={agent} global={data.global} generation={generation} active={active && selected === agent.agent_id} isNew={newIds.includes(agent.agent_id)} onSaved={saved} onCopy={create} onOpenGlobal={() => setSelected(null)} /></div>)}
    </div>
  </div>
}

export function AgentsPage(props: ApplicationPageProps) {
  const initialized = usePageActivation(props.active, props.session.snapshot?.data_generation_id ?? null)
  if (!props.session.snapshot) return <section className="surface-card w-full"><div className="panel-heading"><h1 className="panel-title">智能体</h1></div><div className="panel-content"><p>本地数据尚未就绪。</p><Button variant="ghost" size="sm" onClick={() => void props.session.reload()}>重试连接</Button></div></section>
  if (!initialized) return null
  return <AgentsWorkspace key={props.session.snapshot.data_generation_id} {...props} />
}
