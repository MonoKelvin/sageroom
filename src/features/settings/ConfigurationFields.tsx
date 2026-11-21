import { cloneElement, isValidElement, useId, useState, type ReactNode } from "react"
import type { AgentPreferences, ModelParameters, ModelProfileInput, PersonaDimensions } from "@/contracts/generated"
import type { AppliedResource, ApplicationState, Versioned } from "@/app/appliedResource"
import { useConfigurationRuntime } from "@/app/configurationContext"
import { errorMessage, IpcError } from "@/app/ipc"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { EditableInput } from "@/components/ui/editable-input"
import { NumberInput } from "@/components/ui/number-input"
import { SettingRow } from "@/components/ui/setting-row"
import { SettingsSelect } from "@/components/ui/settings-select"
import { Switch } from "@/components/ui/switch"
import { validateModelUrl, validateText } from "./configurationDefaults"

export function Field({ label, children, caption, htmlFor }: { label: string; children: ReactNode; caption?: string; htmlFor?: string }) {
  const generatedId = useId()
  const id = htmlFor ?? generatedId
  return <SettingRow title={label} description={caption} htmlFor={id}>{isValidElement<{ id?: string }>(children) ? cloneElement(children, { id }) : children}</SettingRow>
}

async function applyInteger(value: number, apply: (value: number) => Promise<void>) {
  if (!Number.isInteger(value)) throw new IpcError({ code: "INVALID_INPUT", message: "请输入整数。", retryability: "after_user_action", field_path: null, trace_id: crypto.randomUUID(), may_have_been_charged: false })
  await apply(value)
}

export function DimensionsFields({ value, onChange }: { value: PersonaDimensions; onChange: (key: keyof PersonaDimensions, value: number) => Promise<void> }) {
  const labels: Record<keyof PersonaDimensions, string> = { professional: "专业", formal: "正式", casual: "随和", humor: "幽默", direct: "直接", empathy: "共情", social_energy: "社交活力", activity: "活跃度" }
  return <div className="config-stack">{(Object.keys(labels) as (keyof PersonaDimensions)[]).map((key) => <Field key={key} label={labels[key]} caption={key === "activity" ? "越高越愿意参与话题、主动接话；不会强制回复或突破请求上限。" : key === "social_energy" ? "影响交流时的热情与表达能量，不代表发言频率。" : undefined}>
    <NumberInput label={labels[key]} value={value[key]} min={0} max={100} step={1} onValueChange={(next) => applyInteger(next, (value) => onChange(key, value))} />
  </Field>)}</div>
}

export function PreferencesFields({ value, onChange }: { value: AgentPreferences; onChange: (patch: Partial<AgentPreferences>) => Promise<void> }) {
  return <div className="config-stack">
    <Field label="每日请求上限" caption="失败与格式修复也计数；全局最多 500 次/UTC 日。"><NumberInput label="每日请求上限" min={1} max={5000} step={1} value={value.request_limit_daily} onValueChange={(next) => applyInteger(next, (request_limit_daily) => onChange({ request_limit_daily }))} /></Field>
    <Field label="允许持久记忆" caption="作为偏好保存在本机。"><Checkbox label="允许持久记忆" checked={value.persistent_memory} onCheckedChange={(persistent_memory) => onChange({ persistent_memory })} /></Field>
    <Field label="允许自主唤醒" caption="允许成员提出稍后检查计划，不使用固定轮询。"><Switch label="允许自主唤醒" checked={value.allow_autonomous_wake} onCheckedChange={(allow_autonomous_wake) => onChange({ allow_autonomous_wake })} /></Field>
  </div>
}

export function ModelFields({ value, onChange, onParameterChange, sourceReadOnly = false, active = true }: {
  value: ModelProfileInput
  onChange: (patch: Partial<ModelProfileInput>) => Promise<void>
  onParameterChange: <K extends keyof ModelParameters>(key: K, value: ModelParameters[K]) => Promise<void>
  sourceReadOnly?: boolean
  active?: boolean
}) {
  const params = value.parameters
  return <div className="config-stack">
    <Field label="模型预设名称"><EditableInput label="模型预设名称" active={active} maxLength={80} readOnly={sourceReadOnly} value={value.name} normalize={(next) => next.trim()} validate={(next) => validateText(next, 80, true)} onApply={(name) => onChange({ name })} /></Field>
    <Field label="协议"><SettingsSelect label="协议" value={value.protocol} disabled={sourceReadOnly} options={[
      { value: "openai_chat_completions", label: "OpenAI Chat Completions" }, { value: "anthropic_messages", label: "Anthropic Messages" }, { value: "openai_responses", label: "OpenAI Responses" },
    ]} onValueChange={(protocol) => onChange({ protocol: protocol as ModelProfileInput["protocol"] })} /></Field>
    <Field label="API 地址" caption={sourceReadOnly ? "来源地址只读；更换服务请创建独立全局预设。" : "可留空；地址中不能包含密钥。"}><EditableInput label="API 地址" active={active} maxLength={2048} readOnly={sourceReadOnly} value={value.base_url} placeholder="https://api.example.com/v1" normalize={(next) => next.trim()} validate={validateModelUrl} onApply={(base_url) => onChange({ base_url })} /></Field>
    <Field label="模型标识" caption={sourceReadOnly ? "智能体的模型标识不能为空。" : "可留空；未配置完整的预设不能采用或测试。"}><EditableInput label="模型标识" active={active} maxLength={200} value={value.model_name} placeholder="服务提供的模型名称" normalize={(next) => next.trim()} validate={(next) => validateText(next, 200, sourceReadOnly)} onApply={(model_name) => onChange({ model_name })} /></Field>
    <details className="config-disclosure"><summary>生成参数与预算</summary><div className="config-stack">
      <Field label="Temperature"><NumberInput label="Temperature" min={0} max={2} step={0.1} value={params.temperature} onValueChange={(next) => onParameterChange("temperature", next)} /></Field>
      <Field label="Top P" caption="大于 0，且不超过 1。"><NumberInput label="Top P" min={Number.MIN_VALUE} max={1} step={0.01} value={params.top_p} onValueChange={(next) => onParameterChange("top_p", next)} /></Field>
      <Field label="最大输出 tokens"><NumberInput label="最大输出 tokens" min={1} max={32768} step={1} value={params.max_output_tokens} onValueChange={(next) => applyInteger(next, (value) => onParameterChange("max_output_tokens", value))} /></Field>
      <Field label="输入预算 tokens"><NumberInput label="输入预算 tokens" min={256} max={128000} step={1} value={params.input_budget} onValueChange={(next) => applyInteger(next, (value) => onParameterChange("input_budget", value))} /></Field>
      <Field label="推理模式" caption="聊天与连接测试均不支持 enabled；off 仅表示不请求额外推理。"><SettingsSelect label="推理模式" value={params.reasoning} options={[{ value: "off", label: "不请求额外推理" }, { value: "enabled", label: "启用" }]} onValueChange={(next) => onParameterChange("reasoning", next as ModelParameters["reasoning"])} /></Field>
    </div></details>
  </div>
}

export function ResourceFeedback<T extends Versioned>({ resource, state }: { resource: AppliedResource<T>; state: ApplicationState<T> }) {
  const { exiting } = useConfigurationRuntime()
  const [pending, setPending] = useState(false)
  const [recoveryError, setRecoveryError] = useState<string | null>(null)
  async function recover(kind: "retry" | "discard") {
    setPending(true)
    setRecoveryError(null)
    try { await resource[kind]() } catch (cause) { setRecoveryError(errorMessage(cause)) }
    finally { setPending(false) }
  }
  if (state.status !== "error" && !recoveryError) return state.status === "pending" ? <p className="form-caption" role="status">正在应用到本机…</p> : null
  return <div className="config-notice" role="alert"><p>{recoveryError ?? state.error}</p><p className="form-caption">{state.value ? "本次应用尚未确认写入，当前显示的修改仍保留。" : "本地配置未能读取，可重试应用。"}</p><div className="config-actions"><Button size="sm" disabled={pending || state.loading || exiting} onClick={() => void recover("retry")}>重试应用</Button>{state.value && <Button variant="ghost" size="sm" disabled={pending || state.loading || exiting} onClick={() => void recover("discard")}>撤销本次应用</Button>}</div></div>
}
