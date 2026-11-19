import { useCallback, useEffect, useRef, useState, type FormEvent } from "react"
import { IconAdjustments, IconPlus, IconRobot, IconTrash } from "@tabler/icons-react"
import type { GlobalConfiguration as GlobalConfigurationData, ModelProfile, PersonaPreset } from "@/contracts/generated"
import { errorMessage, ipc } from "@/app/ipc"
import { Button } from "@/components/ui/button"
import { defaultDimensions, defaultParameters } from "@/features/settings/configurationDefaults"
import { DimensionsFields, EditorFeedback, Field, ModelFields, PreferencesFields } from "@/features/settings/ConfigurationFields"
import { ModelCredentials } from "@/features/settings/ModelCredentials"
import { useLocalEditor } from "@/features/settings/useLocalEditor"

type Section = "models" | "personas" | "runtime"
const sections = [
  { id: "models" as const, title: "模型配置", icon: IconRobot },
  { id: "personas" as const, title: "人格预设", icon: IconAdjustments },
  { id: "runtime" as const, title: "运行偏好", icon: IconAdjustments },
]

function rebaseGlobal(draft: GlobalConfigurationData, saved: GlobalConfigurationData): GlobalConfigurationData {
  return { ...draft, revision: saved.revision,
    model_profiles: draft.model_profiles.map((profile) => { const next = saved.model_profiles.find((item) => item.id === profile.id); return next ? { ...profile, revision: next.revision, credential_configured: next.credential_configured } : profile }),
    persona_presets: draft.persona_presets.map((persona) => ({ ...persona, revision: saved.persona_presets.find((item) => item.id === persona.id)?.revision ?? persona.revision })),
  }
}

export function GlobalConfiguration({ generation, active, initial, onChanged, developmentToolsAvailable }: {
  generation: string; active: boolean; initial: GlobalConfigurationData; developmentToolsAvailable: boolean
  onChanged: (configuration: GlobalConfigurationData) => void
}) {
  const alive = useRef(false)
  useEffect(() => { alive.current = true; return () => { alive.current = false } }, [])
  const load = useCallback(async () => {
    const configuration = await ipc.getGlobalConfiguration({ data_generation_id: generation })
    if (alive.current) onChanged(configuration)
    return configuration
  }, [generation, onChanged])
  const editor = useLocalEditor({ active, load, initial, rebase: rebaseGlobal })
  const [section, setSection] = useState<Section>("models")
  const [credentialBusy, setCredentialBusy] = useState<string[]>([])
  const [credentialError, setCredentialError] = useState<string | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<{ kind: "model" | "persona"; id: string } | null>(null)
  const [confirmImport, setConfirmImport] = useState(false)
  const [importing, setImporting] = useState(false)
  const [importError, setImportError] = useState<string | null>(null)
  const config = editor.draft!

  function editModel(next: ModelProfile) {
    editor.edit({ ...config, model_profiles: config.model_profiles.map((item) => item.id === next.id ? next : item) })
  }
  function editPersona(next: PersonaPreset) {
    editor.edit({ ...config, persona_presets: config.persona_presets.map((item) => item.id === next.id ? next : item) })
  }
  function addModel(source?: ModelProfile) {
    const model: ModelProfile = source ? { ...structuredClone(source), id: crypto.randomUUID(), name: `${source.name} 副本`.slice(0, 80), revision: "0", credential_configured: false } : { id: crypto.randomUUID(), name: "新模型预设", protocol: "openai_chat_completions", base_url: "", model_name: "", parameters: { ...defaultParameters }, revision: "0", credential_configured: false }
    editor.edit({ ...config, model_profiles: [...config.model_profiles, model] })
  }
  function addPersona(source?: PersonaPreset) {
    const persona: PersonaPreset = source ? { ...structuredClone(source), id: crypto.randomUUID(), name: `${source.name} 副本`.slice(0, 80), revision: "0" } : { id: crypto.randomUUID(), name: "新人格预设", language_style: "自然、清晰", address_terms: [], skill: "", dimensions: { ...defaultDimensions }, revision: "0" }
    editor.edit({ ...config, persona_presets: [...config.persona_presets, persona] })
  }
  function remove() {
    if (!deleteTarget) return
    editor.edit(deleteTarget.kind === "model" ? { ...config, model_profiles: config.model_profiles.filter((item) => item.id !== deleteTarget.id) } : { ...config, persona_presets: config.persona_presets.filter((item) => item.id !== deleteTarget.id) })
    setDeleteTarget(null)
  }
  async function refreshCredentials() {
    try { editor.ingestServer(await load()); if (alive.current) setCredentialError(null) }
    catch (cause) { if (alive.current) setCredentialError("密钥可能已写入，但配置版本刷新失败。请重新读取配置后再保存全局配置。"); throw cause }
  }
  function markCredentialBusy(id: string, busy: boolean) {
    if (alive.current) setCredentialBusy((ids) => busy ? ids.includes(id) ? ids : [...ids, id] : ids.filter((item) => item !== id))
  }
  async function save(event: FormEvent) {
    event.preventDefault()
    if (credentialBusy.length || credentialError) return
    const result = await editor.save((draft, requestId, revision) => ipc.saveGlobalConfiguration({ data_generation_id: generation, client_request_id: requestId, expected_revision: revision,
      model_profiles: draft.model_profiles.map(({ id, name, protocol, base_url, model_name, parameters }) => ({ id, name: name.trim(), protocol, base_url: base_url.trim(), model_name: model_name.trim(), parameters })),
      persona_presets: draft.persona_presets.map((persona) => ({ ...persona, name: persona.name.trim(), address_terms: persona.address_terms.map((term) => term.trim()).filter(Boolean) })), runtime_defaults: draft.runtime_defaults,
    }))
    if (result) onChanged(result)
  }
  async function importDevelopmentModel() {
    if (importing || editor.pending || editor.loading || credentialBusy.length) return
    setImporting(true)
    setImportError(null)
    setConfirmImport(false)
    try {
      await ipc.importDevelopmentModel({ data_generation_id: generation })
      if (alive.current) await editor.reload()
    } catch (cause) { if (alive.current) setImportError(errorMessage(cause)) }
    finally { if (alive.current) setImporting(false) }
  }

  return <section className="surface-card">
    <header className="panel-heading"><div><h2 className="panel-title">全局配置</h2><p className="panel-description">预设复制到智能体后独立编辑；保存不会启动智能体。</p></div></header>
    <div className="panel-content panel-scroll">
      <nav className="config-actions mb-4" aria-label="全局配置分类">{sections.map(({ id, title, icon: Icon }) => <Button key={id} variant={section === id ? "default" : "ghost"} size="sm" aria-pressed={section === id} onClick={() => setSection(id)}><Icon size={17} aria-hidden="true" />{title}</Button>)}</nav>
      <form onSubmit={(event) => void save(event)}>
        <fieldset disabled={editor.loading || importing}>
          {section === "models" && <section className="form-section"><div className="config-item-heading"><h3 className="form-section-title">模型配置</h3><Button variant="secondary" size="sm" onClick={() => addModel()}><IconPlus size={16} aria-hidden="true" />添加预设</Button></div>
            {!config.model_profiles.length && <p className="form-caption">还没有模型预设。添加后填写服务地址与模型标识。</p>}
            <div>{config.model_profiles.map((model) => {
              const persisted = editor.server?.model_profiles.find((item) => item.id === model.id)
              const unchanged = Boolean(persisted && JSON.stringify(model) === JSON.stringify(persisted))
              return <section key={model.id} className="config-item"><div className="config-item-heading"><strong>{model.name || "未命名预设"}</strong><div className="config-actions"><Button variant="ghost" size="sm" onClick={() => addModel(model)}>复制</Button><button type="button" className="icon-button" aria-label={`删除模型预设 ${model.name}`} onClick={() => setDeleteTarget({ kind: "model", id: model.id })}><IconTrash size={17} aria-hidden="true" /></button></div></div><ModelFields value={model} onChange={(next) => editModel({ ...model, ...next })} />
                {persisted ? <ModelCredentials key={`${model.id}:${persisted.revision}`} profile={persisted} generation={generation} disabled={!unchanged || editor.pending || importing || credentialBusy.includes(model.id)} onChanged={refreshCredentials} onBusy={(busy) => markCredentialBusy(model.id, busy)} /> : <p className="form-caption">保存这份预设后即可写入密钥和测试连接。</p>}
              </section>
            })}</div>
            {developmentToolsAvailable && <details className="config-disclosure"><summary>开发环境导入</summary><p className="form-caption">仅调试版：后端从开发环境 .env 读取模型与密钥，密钥不会返回页面。导入会保存配置并重新读取。</p><Button variant="ghost" size="sm" disabled={editor.pending || editor.loading || importing || credentialBusy.length > 0} onClick={() => { if (editor.dirty) setConfirmImport(true); else void importDevelopmentModel() }}>{importing ? "导入中…" : "从开发环境导入模型"}</Button>{confirmImport && <div className="config-notice"><p>导入会丢弃所有未保存的模型、人格与运行偏好修改。是否继续？</p><div className="config-actions"><Button size="sm" onClick={() => void importDevelopmentModel()}>丢弃修改并导入</Button><Button variant="ghost" size="sm" onClick={() => setConfirmImport(false)}>保留修改</Button></div></div>}{importError && <p role="alert">{importError}</p>}</details>}
          </section>}
          {section === "personas" && <section className="form-section"><div className="config-item-heading"><h3 className="form-section-title">人格预设</h3><Button variant="secondary" size="sm" onClick={() => addPersona()}><IconPlus size={16} aria-hidden="true" />添加人格</Button></div>{!config.persona_presets.length && <p className="form-caption">还没有人格预设。添加一份常用表达风格。</p>}<div>{config.persona_presets.map((persona) => <section className="config-item" key={persona.id}><div className="config-item-heading"><strong>{persona.name || "未命名人格"}</strong><div className="config-actions"><Button variant="ghost" size="sm" onClick={() => addPersona(persona)}>复制</Button><button className="icon-button" type="button" aria-label={`删除人格预设 ${persona.name}`} onClick={() => setDeleteTarget({ kind: "persona", id: persona.id })}><IconTrash size={17} aria-hidden="true" /></button></div></div><Field label="人格名称"><input className="form-control" required maxLength={80} value={persona.name} onChange={(event) => editPersona({ ...persona, name: event.target.value })} /></Field><Field label="语言风格"><textarea className="form-control" maxLength={2000} rows={2} value={persona.language_style} onChange={(event) => editPersona({ ...persona, language_style: event.target.value })} /></Field><Field label="称呼用语" caption="每行一个称呼。"><textarea className="form-control" rows={2} value={persona.address_terms.join("\n")} onChange={(event) => editPersona({ ...persona, address_terms: event.target.value.split("\n") })} /></Field><Field label="角色指令（SKILL）"><textarea className="form-control" rows={2} maxLength={4000} value={persona.skill} onChange={(event) => editPersona({ ...persona, skill: event.target.value })} /></Field><details className="config-disclosure"><summary>七个人格维度（0–100）</summary><DimensionsFields value={persona.dimensions} onChange={(dimensions) => editPersona({ ...persona, dimensions })} /></details></section>)}</div></section>}
          {section === "runtime" && <section className="form-section"><h3 className="form-section-title">新智能体的默认偏好</h3><PreferencesFields value={config.runtime_defaults} onChange={(runtime_defaults) => editor.edit({ ...config, runtime_defaults })} /><p className="form-caption">更改不会回写已经建立的智能体；这里只保存偏好，不触发唤醒或后台任务。</p></section>}
        </fieldset>
        {deleteTarget && <div className="config-notice" role="alert"><p>{deleteTarget.kind === "model" ? "删除这份模型预设？使用中的预设需先解除或更换成员的模型配置，否则无法删除。" : "删除这份人格预设？成员已经复制的独立人格配置不受影响。"}保存全局配置后才会生效。</p><div className="config-actions"><Button size="sm" disabled={importing || editor.loading} onClick={remove}>确认删除预设</Button><Button variant="ghost" size="sm" onClick={() => setDeleteTarget(null)}>保留预设</Button></div></div>}
        {credentialError && <div className="config-notice" role="alert"><p>{credentialError}</p><Button variant="ghost" size="sm" onClick={() => void refreshCredentials().catch(() => {})}>重试刷新配置版本</Button></div>}
        <EditorFeedback editor={{ ...editor, pending: editor.pending || importing || credentialBusy.length > 0 }} scope="全部模型预设、人格预设和运行偏好" />
        <div className="config-savebar"><span className="form-caption" role="status">{editor.saved ? "全局配置已保存" : editor.dirty ? "有未保存的修改" : "预设与偏好保存在本机"}</span><div className="config-actions"><Button variant="ghost" size="sm" disabled={editor.pending || editor.loading || importing || credentialBusy.length > 0} onClick={editor.requestReload}>重新读取</Button><Button type="submit" disabled={editor.pending || editor.loading || importing || credentialBusy.length > 0 || Boolean(credentialError)}>{editor.pending ? "保存中…" : editor.error ? "重试保存全局配置" : "保存全局配置"}</Button></div></div>
      </form>
    </div>
  </section>
}
