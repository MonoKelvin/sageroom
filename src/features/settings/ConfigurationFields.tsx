import { cloneElement, isValidElement, useEffect, useId, useLayoutEffect, useRef, useState, type ReactNode } from "react"
import { applicationBounds, applicationLayerContainer } from "@/app/application-layers"
import { createPortal } from "react-dom"
import { IconList, IconLoader2, IconPhoto } from "@tabler/icons-react"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { useToast } from "@/components/ui/toast-context"
import type { ModelProfileInput, PersonaDimensions } from "@/contracts/generated"
import type { AppliedResource, ApplicationState, Versioned } from "@/app/appliedResource"
import { useConfigurationRuntime } from "@/app/configurationContext"
import { errorMessage, IpcError } from "@/app/ipc"
import { Button } from "@/components/ui/button"
import { EditableInput } from "@/components/ui/editable-input"
import { NumberInput } from "@/components/ui/number-input"
import { SettingRow } from "@/components/ui/setting-row"
import { SettingsSelect } from "@/components/ui/settings-select"
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

function ModelNameField({ value, onChange, active, readOnly, onListModels }: {
  value: string
  onChange: (next: string) => Promise<void>
  active: boolean
  readOnly?: boolean
  onListModels?: () => Promise<string[]>
}) {
  const [open, setOpen] = useState(false)
  const [models, setModels] = useState<string[]>([])
  const [loading, setLoading] = useState(false)
  const [position, setPosition] = useState({ top: 0, left: 0 })
  const box = useRef<HTMLDivElement>(null)
  const list = useRef<HTMLDivElement>(null)
  const toast = useToast()

  // 浮层挂到可见窗体的层容器，按窗体边界定位，不占用外部阴影留白。
  useLayoutEffect(() => {
    if (!open) return
    const place = () => {
      const anchor = box.current
      const panel = list.current
      if (!anchor || !panel) return
      const rect = anchor.getBoundingClientRect()
      const bounds = applicationBounds()
      const margin = 8
      const width = Math.min(Math.max(rect.width, panel.offsetWidth), bounds.width - margin * 2)
      const height = panel.offsetHeight
      const spaceBelow = bounds.bottom - rect.bottom - margin
      const spaceAbove = rect.top - bounds.top - margin
      const top = spaceBelow >= height || spaceBelow >= spaceAbove
        ? rect.bottom + 4
        : Math.max(bounds.top + margin, rect.top - height - 4)
      setPosition({
        top: Math.min(top, Math.max(bounds.top + margin, bounds.bottom - height - margin)) - bounds.top,
        left: Math.min(Math.max(bounds.left + margin, rect.left), bounds.right - width - margin) - bounds.left,
      })
    }
    place()
    window.addEventListener("resize", place)
    window.addEventListener("scroll", place, true)
    return () => {
      window.removeEventListener("resize", place)
      window.removeEventListener("scroll", place, true)
    }
  }, [open, models.length])

  useEffect(() => {
    if (!open) return
    const dismiss = (event: MouseEvent) => {
      const target = event.target as Node
      if (box.current?.contains(target) || list.current?.contains(target)) return
      setOpen(false)
    }
    document.addEventListener("mousedown", dismiss)
    return () => document.removeEventListener("mousedown", dismiss)
  }, [open])

  async function toggle() {
    if (open) { setOpen(false); return }
    setOpen(true)
    if (!onListModels) return
    setLoading(true)
    try {
      const result = await onListModels()
      setModels(result)
      if (!result.length) toast.warning("当前服务未返回可用模型。")
    } catch (cause) {
      toast.error(`获取模型列表失败：${errorMessage(cause)}`)
    } finally {
      setLoading(false)
    }
  }

  return <div className="model-name-field" ref={box}>
    <EditableInput label="模型名称" active={active} maxLength={200} value={value} readOnly={readOnly} placeholder="服务提供的模型名称" normalize={(next) => next.trim()} validate={(next) => validateText(next, 200, readOnly)} onApply={onChange} />
    {onListModels && <Button variant="ghost" size="icon" className="model-name-list" aria-label="获取模型列表" disabled={readOnly || !active || loading} onClick={() => void toggle()}>
      {loading ? <IconLoader2 size={16} className="spin" aria-hidden="true" /> : <IconList size={16} aria-hidden="true" />}
    </Button>}
    {open && models.length > 0 && createPortal(
      <div
        ref={list}
        className="floating-surface model-name-options"
        role="listbox"
        aria-label="可用模型"
        style={{ top: position.top, left: position.left }}
      >
        {models.map((model) => {
          const imageModel = /image|img|生图|绘图|画/i.test(model)
          const option = <button key={model} type="button" role="option" aria-selected={model === value} className="model-name-option" onClick={() => { void onChange(model); setOpen(false) }}>
            <span className="model-name-option-label">{model}</span>
            {imageModel && <span className="model-name-option-mark" aria-label="可能是生图模型"><IconPhoto size={15} aria-hidden="true" /></span>}
          </button>
          return imageModel ? <Tooltip key={model}>
            <TooltipTrigger asChild>{option}</TooltipTrigger>
            <TooltipContent>当前模型可能是生图大模型，可能无法进行对话</TooltipContent>
          </Tooltip> : option
        })}
      </div>,
      applicationLayerContainer() ?? document.body,
    )}
  </div>
}

export function ModelFields({ value, onChange, sourceReadOnly = false, active = true, onListModels }: {
  value: ModelProfileInput
  onChange: (patch: Partial<ModelProfileInput>) => Promise<void>
  sourceReadOnly?: boolean
  active?: boolean
  onListModels?: () => Promise<string[]>
}) {
  return <div className="config-stack">
    <Field label="模型预设名称"><EditableInput label="模型预设名称" active={active} maxLength={80} readOnly={sourceReadOnly} value={value.name} normalize={(next) => next.trim()} validate={(next) => validateText(next, 80, true)} onApply={(name) => onChange({ name })} /></Field>
    <Field label="协议"><SettingsSelect label="协议" value={value.protocol} disabled={sourceReadOnly} options={[
      { value: "openai_chat_completions", label: "OpenAI Chat Completions" }, { value: "anthropic_messages", label: "Anthropic Messages" }, { value: "openai_responses", label: "OpenAI Responses" },
    ]} onValueChange={(protocol) => onChange({ protocol: protocol as ModelProfileInput["protocol"] })} /></Field>
    <Field label="API 地址" caption={sourceReadOnly ? "来源地址只读；更换服务请创建独立全局预设。" : "可留空；地址中不能包含密钥。"}><EditableInput label="API 地址" active={active} maxLength={2048} readOnly={sourceReadOnly} value={value.base_url} placeholder="https://api.example.com/v1" normalize={(next) => next.trim()} validate={validateModelUrl} onApply={(base_url) => onChange({ base_url })} /></Field>
    <Field label="模型名称" caption={sourceReadOnly ? "智能体的模型名称不能为空。" : "可留空；未配置完整的预设不能采用或测试。"}><ModelNameField value={value.model_name} active={active} readOnly={sourceReadOnly} onChange={(model_name) => onChange({ model_name })} onListModels={onListModels} /></Field>
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
