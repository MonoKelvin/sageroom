import { useState } from "react"
import { IconAdjustments, IconPlus, IconRobot, IconTrash } from "@tabler/icons-react"
import { useAppliedResource, useConfiguration, useConfigurationRuntime } from "@/app/configurationContext"
import { errorMessage } from "@/app/ipc"
import { Button } from "@/components/ui/button"
import { EditableInput } from "@/components/ui/editable-input"
import { EditableTextarea } from "@/components/ui/editable-textarea"
import { SettingSection } from "@/components/ui/setting-row"
import { normalizeTerms, validateTerms, validateText } from "@/features/settings/configurationDefaults"
import { DimensionsFields, Field, ModelFields, PreferencesFields, ResourceFeedback } from "@/features/settings/ConfigurationFields"
import { ModelCredentials } from "@/features/settings/ModelCredentials"

type Section = "models" | "personas" | "runtime"
const sections = [
  { id: "models" as const, title: "模型配置", icon: IconRobot },
  { id: "personas" as const, title: "人格预设", icon: IconAdjustments },
  { id: "runtime" as const, title: "运行偏好", icon: IconAdjustments },
]

export function GlobalConfiguration({ active }: { active: boolean }) {
  const store = useConfiguration()
  const runtime = useConfigurationRuntime()
  const state = useAppliedResource(store.global, active)
  const config = state.value
  const [section, setSection] = useState<Section>("models")
  const [deleteTarget, setDeleteTarget] = useState<{ kind: "model" | "persona"; id: string } | null>(null)
  const [confirmImport, setConfirmImport] = useState(false)
  const [importing, setImporting] = useState(false)
  const [operationError, setOperationError] = useState<string | null>(null)

  async function run(operation: () => Promise<unknown>) {
    setOperationError(null)
    try { await operation() } catch (cause) { if (store.global.getSnapshot().status !== "error") setOperationError(errorMessage(cause)) }
  }
  function remove() {
    if (!deleteTarget) return
    const { kind, id } = deleteTarget
    setDeleteTarget(null)
    void run(() => store.global.change((current) => kind === "model"
      ? { ...current, model_profiles: current.model_profiles.filter((item) => item.id !== id) }
      : { ...current, persona_presets: current.persona_presets.filter((item) => item.id !== id) }))
  }
  async function importDevelopmentModel() {
    setConfirmImport(false)
    setImporting(true)
    await run(() => store.importDevelopmentModel())
    setImporting(false)
  }

  return <section className="surface-card">
    <header className="panel-heading"><div><h2 className="panel-title">全局配置</h2><p className="panel-description">预设采用后独立编辑；设置直接应用，不会启动智能体。</p></div></header>
    <div className="panel-content panel-scroll">
      <nav className="config-actions mb-4" aria-label="全局配置分类">{sections.map(({ id, title, icon: Icon }) => <Button key={id} variant={section === id ? "secondary" : "ghost"} size="sm" aria-pressed={section === id} onClick={() => setSection(id)}><Icon size={17} aria-hidden="true" />{title}</Button>)}</nav>
      {!config && <p className="form-caption">{state.loading ? "正在读取本地配置…" : "配置尚未就绪。"}</p>}
      {config && <fieldset disabled={runtime.exiting || importing}>
        <div hidden={section !== "models"} inert={section !== "models"}>
          <SettingSection title="模型配置" description="预设可先留空，完整配置后再采用或测试。">
            <div className="config-actions"><Button size="sm" onClick={() => void run(() => store.createModel())}><IconPlus size={16} aria-hidden="true" />添加预设</Button></div>
            {!config.model_profiles.length && <p className="form-caption">还没有模型预设。添加后填写服务地址与模型标识。</p>}
            {config.model_profiles.map((model) => <section key={model.id} className="config-item" aria-label={`模型预设 ${model.name}`}>
              <div className="config-item-heading"><strong>{model.name}</strong><div className="config-actions"><Button variant="ghost" size="sm" onClick={() => void run(() => store.createModel(model))}>复制</Button><Button variant="ghost" size="icon-sm" aria-label={`删除模型预设 ${model.name}`} onClick={() => setDeleteTarget({ kind: "model", id: model.id })}><IconTrash size={17} aria-hidden="true" /></Button></div></div>
              <ModelFields value={model} active={active && section === "models"} onChange={(patch) => store.updateModel(model.id, patch)} onParameterChange={(key, value) => store.updateModelParameter(model.id, key, value)} />
              <ModelCredentials profile={model} active={active && section === "models"} disabled={runtime.exiting || importing || state.status === "error"} />
            </section>)}
            {store.snapshot.development_tools_available && <details className="config-disclosure"><summary>开发环境导入</summary><p className="form-caption">仅调试版：后端导入开发环境模型与密钥，密钥不会返回页面。</p><Button variant="ghost" size="sm" disabled={state.status === "error"} onClick={() => setConfirmImport(true)}>从开发环境导入模型</Button>{confirmImport && <div className="config-notice"><p>导入开发环境模型？同名导入预设的配置可能被替换。</p><div className="config-actions"><Button size="sm" onClick={() => void importDevelopmentModel()}>确认导入</Button><Button variant="ghost" size="sm" onClick={() => setConfirmImport(false)}>取消导入</Button></div></div>}</details>}
          </SettingSection>
        </div>
        <div hidden={section !== "personas"} inert={section !== "personas"}>
          <SettingSection title="人格预设" description="常用表达风格；修改不回写成员已采用的独立配置。">
            <div className="config-actions"><Button size="sm" onClick={() => void run(() => store.createPersona())}><IconPlus size={16} aria-hidden="true" />添加人格</Button></div>
            {!config.persona_presets.length && <p className="form-caption">还没有人格预设。</p>}
            {config.persona_presets.map((persona) => <section className="config-item" key={persona.id} aria-label={`人格预设 ${persona.name}`}>
              <div className="config-item-heading"><strong>{persona.name}</strong><div className="config-actions"><Button variant="ghost" size="sm" onClick={() => void run(() => store.createPersona(persona))}>复制</Button><Button variant="ghost" size="icon-sm" aria-label={`删除人格预设 ${persona.name}`} onClick={() => setDeleteTarget({ kind: "persona", id: persona.id })}><IconTrash size={17} aria-hidden="true" /></Button></div></div>
              <Field label="人格名称"><EditableInput label="人格名称" active={active && section === "personas"} value={persona.name} maxLength={80} normalize={(next) => next.trim()} validate={(next) => validateText(next, 80, true)} onApply={(name) => store.updatePersona(persona.id, { name })} /></Field>
              <Field label="语言风格"><EditableTextarea label="语言风格" active={active && section === "personas"} value={persona.language_style} maxLength={2000} rows={2} validate={(next) => validateText(next, 2000)} onApply={(language_style) => store.updatePersona(persona.id, { language_style })} /></Field>
              <Field label="称呼用语" caption="每行一个，最多 16 个称呼。"><EditableTextarea label="称呼用语" active={active && section === "personas"} value={persona.address_terms.join("\n")} rows={2} normalize={normalizeTerms} validate={validateTerms} onApply={(next) => store.updatePersona(persona.id, { address_terms: next ? next.split("\n") : [] })} /></Field>
              <Field label="角色指令（SKILL）"><EditableTextarea label="角色指令（SKILL）" className="settings-textarea-long" active={active && section === "personas"} value={persona.skill} rows={7} maxLength={4000} validate={(next) => validateText(next, 4000)} onApply={(skill) => store.updatePersona(persona.id, { skill })} /></Field>
              <details className="config-disclosure"><summary>八个人格维度（0–100）</summary><DimensionsFields value={persona.dimensions} onChange={(key, next) => store.global.change((current) => ({ ...current, persona_presets: current.persona_presets.map((item) => item.id === persona.id ? { ...item, dimensions: { ...item.dimensions, [key]: next } } : item) }))} /></details>
            </section>)}
          </SettingSection>
        </div>
        <div hidden={section !== "runtime"} inert={section !== "runtime"}>
          <SettingSection title="新智能体的默认偏好" description="更改不会回写已有智能体，也不触发唤醒或后台任务。"><PreferencesFields value={config.runtime_defaults} onChange={(patch) => store.global.change((current) => ({ ...current, runtime_defaults: { ...current.runtime_defaults, ...patch } }))} /></SettingSection>
        </div>
      </fieldset>}
      {deleteTarget && <div className="config-notice" role="alert"><p>{deleteTarget.kind === "model" ? "删除这份模型预设？使用中的预设需先解除或更换成员的模型配置，否则无法删除。" : "删除这份人格预设？成员已经复制的独立人格配置不受影响。"}</p><div className="config-actions"><Button size="sm" disabled={runtime.exiting || importing} onClick={remove}>确认删除预设</Button><Button variant="ghost" size="sm" onClick={() => setDeleteTarget(null)}>保留预设</Button></div></div>}
      {operationError && state.status !== "error" && <p role="alert">{operationError}</p>}
      <ResourceFeedback resource={store.global} state={state} />
    </div>
  </section>
}
