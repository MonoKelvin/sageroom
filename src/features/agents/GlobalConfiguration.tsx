import { useState } from "react"
import { IconAdjustments, IconAlertTriangle, IconCode, IconCopy, IconPlus, IconRobot, IconTrash } from "@tabler/icons-react"
import { useAppliedResource, useConfiguration, useConfigurationRuntime } from "@/app/configurationContext"
import { errorMessage } from "@/app/ipc"
import { AppDialog } from "@/components/ui/app-dialog"
import { Button } from "@/components/ui/button"
import { EditableInput } from "@/components/ui/editable-input"
import { EditableTextarea } from "@/components/ui/editable-textarea"
import { SettingSection } from "@/components/ui/setting-row"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { useToast } from "@/components/ui/toast-context"
import { validateText } from "@/features/settings/configurationDefaults"
import { DimensionsFields, Field, ModelFields, ResourceFeedback } from "@/features/settings/ConfigurationFields"
import { ModelCredentials } from "@/features/settings/ModelCredentials"

type Section = "models" | "personas"
const sections = [
  { id: "models" as const, title: "模型配置", icon: IconRobot },
  { id: "personas" as const, title: "人格预设", icon: IconAdjustments },
]

function IconAction({ label, icon: Icon, onClick, disabled, danger }: {
  label: string; icon: typeof IconPlus; onClick: () => void; disabled?: boolean; danger?: boolean
}) {
  return <Tooltip disableHoverableContent><TooltipTrigger asChild>
    <Button variant="ghost" size="icon-sm" className={danger ? "danger-icon" : undefined} aria-label={label} disabled={disabled} onClick={onClick}><Icon size={16} aria-hidden="true" /></Button>
  </TooltipTrigger><TooltipContent>{label}</TooltipContent></Tooltip>
}

export function GlobalConfiguration({ active }: { active: boolean }) {
  const store = useConfiguration()
  const runtime = useConfigurationRuntime()
  const state = useAppliedResource(store.global, active)
  const toast = useToast()
  const config = state.value
  const [section, setSection] = useState<Section>("models")
  const [deleteTarget, setDeleteTarget] = useState<{ kind: "model" | "persona"; id: string } | null>(null)
  const [importing, setImporting] = useState(false)
  const [operationError, setOperationError] = useState<string | null>(null)
  const [unavailable, setUnavailable] = useState<Record<string, boolean>>({})

  async function run(operation: () => Promise<unknown>) {
    setOperationError(null)
    try { await operation() } catch (cause) { if (store.global.getSnapshot().status !== "error") setOperationError(errorMessage(cause)) }
  }
  function remove() {
    if (!deleteTarget) return
    const { kind, id } = deleteTarget
    void run(() => store.global.change((current) => kind === "model"
      ? { ...current, model_profiles: current.model_profiles.filter((item) => item.id !== id) }
      : { ...current, persona_presets: current.persona_presets.filter((item) => item.id !== id) }))
  }
  async function importDevelopmentModel() {
    setImporting(true)
    try { await store.importDevelopmentModel() }
    catch (cause) { toast.error(`导入开发环境大模型失败：${errorMessage(cause)}`) }
    finally { setImporting(false) }
  }
  return <section className="surface-card">
    <header className="panel-heading"><div><h2 className="panel-title">全局配置</h2><p className="panel-description">预设采用后独立编辑；设置直接应用，不会启动智能体。</p></div></header>
    <div className="panel-content panel-scroll">
      <nav className="config-actions mb-4" aria-label="全局配置分类">{sections.map(({ id, title, icon: Icon }) => <Button key={id} variant={section === id ? "secondary" : "ghost"} size="sm" aria-pressed={section === id} onClick={() => setSection(id)}><Icon size={17} aria-hidden="true" />{title}</Button>)}</nav>
      {!config && <p className="form-caption">{state.loading ? "正在读取本地配置…" : "配置尚未就绪。"}</p>}
      {config && <fieldset disabled={runtime.exiting || importing}>
        <div hidden={section !== "models"} inert={section !== "models"}>
          <SettingSection title="模型配置" actions={<>
            <IconAction label="添加大模型" icon={IconPlus} onClick={() => void run(() => store.createModel())} />
            {store.snapshot.development_tools_available && <IconAction label="导入开发环境大模型" icon={IconCode} onClick={() => void importDevelopmentModel()} disabled={importing || state.status === "error"} />}
          </>}>
            {!config.model_profiles.length && <p className="config-empty-state">还没有模型预设，请点击右上角的添加导入。</p>}
            {config.model_profiles.map((model) => <section key={model.id} className="config-item" aria-label={`模型预设 ${model.name}`}>
              <div className="config-item-heading">
                <div className="config-item-title">
                  <strong>{model.name}</strong>
                  {unavailable[model.id] && <Tooltip disableHoverableContent><TooltipTrigger asChild>
                    <button type="button" className="model-unavailable-mark" aria-label="模型不可用"><IconAlertTriangle size={16} aria-hidden="true" /></button>
                  </TooltipTrigger><TooltipContent>模型不可用</TooltipContent></Tooltip>}
                </div>
                <div className="config-actions config-item-actions">
                  <IconAction label="复制大模型" icon={IconCopy} onClick={() => void run(() => store.createModel(model))} />
                  <IconAction label="删除大模型" icon={IconTrash} danger onClick={() => setDeleteTarget({ kind: "model", id: model.id })} />
                </div>
              </div>
              <ModelFields value={model} active={active && section === "models"} onChange={(patch) => store.updateModel(model.id, patch)} onListModels={() => store.listModelNames(model.id).then((result) => result.models)} />
              <ModelCredentials profile={model} active={active && section === "models"} disabled={runtime.exiting || importing || state.status === "error"} onTestResult={(available) => setUnavailable((current) => ({ ...current, [model.id]: !available }))} />
            </section>)}
          </SettingSection>
        </div>
        <div hidden={section !== "personas"} inert={section !== "personas"}>
          <SettingSection title="人格预设" description="常用表达风格；修改不回写成员已采用的独立配置。" actions={<IconAction label="添加人格" icon={IconPlus} onClick={() => void run(() => store.createPersona())} />}>
            {!config.persona_presets.length && <p className="form-caption">还没有人格预设。</p>}
            {config.persona_presets.map((persona) => <section className="config-item" key={persona.id} aria-label={`人格预设 ${persona.name}`}>
              <div className="config-item-heading">
                <strong>{persona.name}</strong>
                <div className="config-actions config-item-actions">
                  <IconAction label="复制人格预设" icon={IconCopy} onClick={() => void run(() => store.createPersona(persona))} />
                  <IconAction label="删除人格预设" icon={IconTrash} danger onClick={() => setDeleteTarget({ kind: "persona", id: persona.id })} />
                </div>
              </div>
              <Field label="人格名称"><EditableInput label="人格名称" active={active && section === "personas"} value={persona.name} maxLength={80} normalize={(next) => next.trim()} validate={(next) => validateText(next, 80, true)} onApply={(name) => store.updatePersona(persona.id, { name })} /></Field>
              <Field label="语言风格"><EditableTextarea label="语言风格" active={active && section === "personas"} value={persona.language_style} maxLength={2000} rows={2} validate={(next) => validateText(next, 2000)} onApply={(language_style) => store.updatePersona(persona.id, { language_style })} /></Field>
              <details className="config-disclosure"><summary>八个人格维度（0–100）</summary><DimensionsFields value={persona.dimensions} onChange={(key, next) => store.global.change((current) => ({ ...current, persona_presets: current.persona_presets.map((item) => item.id === persona.id ? { ...item, dimensions: { ...item.dimensions, [key]: next } } : item) }))} /></details>
            </section>)}
          </SettingSection>
        </div>
      </fieldset>}
      <AppDialog
        open={deleteTarget !== null}
        onOpenChange={(open) => { if (!open) setDeleteTarget(null) }}
        title="删除预设"
        actions={[
          { label: "确认删除", variant: "destructive", onClick: remove },
          { label: "取消", variant: "ghost" },
        ]}
      >
        <p>{deleteTarget?.kind === "model" ? "删除这份模型预设？使用中的预设需先解除或更换成员的模型配置，否则无法删除。" : "删除这份人格预设？成员已经复制的独立人格配置不受影响。"}</p>
      </AppDialog>
      {operationError && state.status !== "error" && <p role="alert">{operationError}</p>}
      <ResourceFeedback resource={store.global} state={state} />
    </div>
  </section>
}
