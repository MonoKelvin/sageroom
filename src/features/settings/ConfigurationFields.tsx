import type { ReactNode } from "react"
import type { AgentPreferences, ModelParameters, ModelProfileInput, PersonaDimensions } from "@/contracts/generated"
import { Button } from "@/components/ui/button"

export function Field({ label, children, caption }: { label: string; children: ReactNode; caption?: string }) {
  return <div className="form-field"><label className="form-field"><span className="form-label">{label}</span>{children}</label>{caption && <p className="form-caption">{caption}</p>}</div>
}

export function DimensionsFields({ value, onChange }: { value: PersonaDimensions; onChange: (value: PersonaDimensions) => void }) {
  const labels: Record<keyof PersonaDimensions, string> = { professional: "专业", formal: "正式", casual: "随和", humor: "幽默", direct: "直接", empathy: "共情", social_energy: "社交活力" }
  return <div className="form-grid">{(Object.keys(labels) as (keyof PersonaDimensions)[]).map((key) => <Field key={key} label={labels[key]}>
    <input className="form-control" type="number" min={0} max={100} step={1} required value={value[key]} onChange={(event) => onChange({ ...value, [key]: event.target.valueAsNumber || 0 })} />
  </Field>)}</div>
}

export function PreferencesFields({ value, onChange }: { value: AgentPreferences; onChange: (value: AgentPreferences) => void }) {
  return <div className="config-stack">
    <Field label="每日请求上限" caption="仅保存运行偏好；当前页面不启动运行任务。"><input className="form-control" type="number" min={1} max={5000} step={1} required value={value.request_limit_daily} onChange={(event) => onChange({ ...value, request_limit_daily: event.target.valueAsNumber || 0 })} /></Field>
    <label className="config-check"><input type="checkbox" checked={value.persistent_memory} onChange={(event) => onChange({ ...value, persistent_memory: event.target.checked })} />允许持久记忆</label>
    <label className="config-check"><input type="checkbox" checked={value.allow_autonomous_wake} onChange={(event) => onChange({ ...value, allow_autonomous_wake: event.target.checked })} />允许自主唤醒</label>
  </div>
}

export function ModelFields({ value, onChange, sourceReadOnly = false }: {
  value: ModelProfileInput; onChange: (value: ModelProfileInput) => void; sourceReadOnly?: boolean
}) {
  const params = value.parameters
  function parameter(patch: Partial<ModelParameters>) { onChange({ ...value, parameters: { ...params, ...patch } }) }
  return <div className="config-stack">
    <div className="form-grid">
      <Field label="模型预设名称"><input className="form-control" maxLength={80} required readOnly={sourceReadOnly} value={value.name} onChange={(event) => { if (!sourceReadOnly) onChange({ ...value, name: event.target.value }) }} /></Field>
      <Field label="协议"><select className="form-control" value={value.protocol} disabled={sourceReadOnly} onChange={(event) => { if (!sourceReadOnly) onChange({ ...value, protocol: event.target.value as ModelProfileInput["protocol"] }) }}>
        <option value="openai_chat_completions">OpenAI Chat Completions</option><option value="anthropic_messages">Anthropic Messages</option><option value="openai_responses">OpenAI Responses</option>
      </select></Field>
    </div>
    <Field label="API 地址" caption={sourceReadOnly ? "来源预设地址只读，请在全局配置创建独立预设以更换服务。" : "仅填写服务地址，不要在地址中包含密钥。"}><input className="form-control" type="url" required maxLength={2048} readOnly={sourceReadOnly} value={value.base_url} placeholder="https://api.example.com/v1" onChange={(event) => { if (!sourceReadOnly) onChange({ ...value, base_url: event.target.value }) }} /></Field>
    <Field label="模型标识"><input className="form-control" required maxLength={200} value={value.model_name} placeholder="服务提供的模型名称" onChange={(event) => onChange({ ...value, model_name: event.target.value })} /></Field>
    <details className="config-disclosure"><summary>生成参数与预算</summary><div className="form-grid">
      <Field label="Temperature"><input className="form-control" type="number" min={0} max={2} step={0.1} required value={params.temperature} onChange={(event) => parameter({ temperature: event.target.valueAsNumber || 0 })} /></Field>
      <Field label="Top P"><input className="form-control" type="number" min={0.01} max={1} step={0.01} required value={params.top_p} onChange={(event) => parameter({ top_p: event.target.valueAsNumber || 0 })} /></Field>
      <Field label="最大输出 tokens"><input className="form-control" type="number" min={1} max={32768} step={1} required value={params.max_output_tokens} onChange={(event) => parameter({ max_output_tokens: event.target.valueAsNumber || 0 })} /></Field>
      <Field label="输入预算 tokens"><input className="form-control" type="number" min={256} max={128000} step={1} required value={params.input_budget} onChange={(event) => parameter({ input_budget: event.target.valueAsNumber || 0 })} /></Field>
      <Field label="推理模式" caption="本轮连接测试不接受 enabled。普通连通不保证关闭模型自身推理。"><select className="form-control" value={params.reasoning} onChange={(event) => parameter({ reasoning: event.target.value as ModelParameters["reasoning"] })}><option value="off">不请求额外推理</option><option value="enabled">启用</option></select></Field>
    </div></details>
  </div>
}

export function EditorFeedback({ editor, scope = "此卡片" }: { scope?: string; editor: {
  error: string | null; conflict: boolean; confirmReload: boolean; pending: boolean; loading: boolean
  requestReload: () => void; reload: () => Promise<void>; cancelReload: () => void
} }) {
  return <>
    {editor.error && <div className="config-notice" role="alert"><p>{editor.error}</p>{editor.conflict && <p>配置与当前本地数据冲突。请按提示处理，或重新读取后再保存；不会自动覆盖其他修改。</p>}<Button variant="ghost" size="sm" disabled={editor.pending || editor.loading} onClick={editor.requestReload}>重新读取</Button></div>}
    {editor.confirmReload && <div className="config-notice" role="alert"><p>重新读取会丢弃{scope}中未保存的修改。是否继续？</p><div className="config-actions"><Button size="sm" disabled={editor.pending || editor.loading} onClick={() => void editor.reload()}>丢弃修改并重新读取</Button><Button variant="ghost" size="sm" onClick={editor.cancelReload}>保留修改</Button></div></div>}
  </>
}
