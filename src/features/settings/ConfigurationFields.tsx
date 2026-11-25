import { cloneElement, isValidElement, useEffect, useId, useLayoutEffect, useRef, useState, type ReactNode } from "react"
import { applicationBounds, applicationLayerContainer } from "@/app/application-layers"
import { createPortal } from "react-dom"
import { IconList, IconLoader2, IconPhoto, IconVideo, IconVolume } from "@tabler/icons-react"
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

const dimensionMeta: Record<keyof PersonaDimensions, { label: string; caption: string }> = {
  professional: { label: "专业", caption: "用词是否严谨准确，是否偏向方法与逻辑。" },
  formal: { label: "正式", caption: "表达是否完整克制，少用口语和梗。" },
  casual: { label: "随和", caption: "是否更口语化，句子更碎、更随意。" },
  humor: { label: "幽默", caption: "是否爱开玩笑、接梗与调侃。" },
  direct: { label: "直接", caption: "是否直说、不绕弯，敢表达不同意见。" },
  empathy: { label: "共情", caption: "是否先回应情绪，再讲事情本身。" },
  social_energy: { label: "社交", caption: "交流时的热情与表达能量，不代表发言频率。" },
  activity: { label: "活跃度", caption: "越高越愿意参与话题、主动接话；不会强制回复或突破请求上限。" },
}

export function DimensionsFields({ value, onChange }: { value: PersonaDimensions; onChange: (key: keyof PersonaDimensions, value: number) => Promise<void> }) {
  return <div className="config-stack">{(Object.keys(dimensionMeta) as (keyof PersonaDimensions)[]).map((key) => {
    const meta = dimensionMeta[key]
    return <Field key={key} label={meta.label} caption={meta.caption}>
      <NumberInput label={meta.label} value={value[key]} min={0} max={100} step={1} onValueChange={(next) => applyInteger(next, (value) => onChange(key, value))} />
    </Field>
  })}</div>
}

type ModelKind = "video" | "tts" | "image"

const modelKindMeta: Record<ModelKind, { icon: typeof IconPhoto; label: string; hint: string }> = {
  video: { icon: IconVideo, label: "可能是视频模型", hint: "当前可能是视频大模型，无法进行正常对话" },
  tts: { icon: IconVolume, label: "可能是文本转语音模型", hint: "当前可能是文本转语音大模型，无法进行正常对话" },
  image: { icon: IconPhoto, label: "可能是生图模型", hint: "当前模型可能是生图大模型，无法进行对话" },
}

// 按名称关键字判断「不是对话模型」。视频/语音排在生图前面，避免 video-flux 这类名字被标成生图。
const modelKindPatterns: [ModelKind, RegExp][] = [
  ["video", /video|sora|veo|kling|runway|pika|cogvideo|seedance/i],
  ["tts", /tts|text[-_ ]?to[-_ ]?speech|speech[-_ ]?synth/i],
  ["image", /image|img|生图|绘图|画/i],
]

function detectModelKind(model: string): ModelKind | null {
  for (const [kind, pattern] of modelKindPatterns) if (pattern.test(model)) return kind
  return null
}

export function ModelNamePicker({ value, onChange, active, readOnly, onListModels }: {
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
      // 浮层最小宽度与输入框整体（含右侧按钮）等宽，内容更长时再按 max-content 展开。
      const minWidth = Math.min(rect.width, bounds.width - margin * 2)
      panel.style.minWidth = `${minWidth}px`
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
    {onListModels && <Tooltip disableHoverableContent><TooltipTrigger asChild>
      <Button variant="ghost" size="icon" className="model-name-list control-trailing-icon" aria-label="获取模型列表" disabled={readOnly || !active || loading} onClick={() => void toggle()}>
        {loading ? <IconLoader2 size={16} className="spin" aria-hidden="true" /> : <IconList size={16} aria-hidden="true" />}
      </Button>
    </TooltipTrigger><TooltipContent>获取可用模型列表</TooltipContent></Tooltip>}
    {open && models.length > 0 && createPortal(
      <div
        ref={list}
        className="floating-surface model-name-options"
        role="listbox"
        aria-label="可用模型"
        style={{ top: position.top, left: position.left }}
      >
        {models.map((model) => {
          const kind = detectModelKind(model)
          const meta = kind ? modelKindMeta[kind] : null
          const mark = meta ? <span className="model-name-option-mark" aria-label={meta.label}><meta.icon size={15} aria-hidden="true" /></span> : null
          const option = <button key={model} type="button" role="option" aria-selected={model === value} className="model-name-option" onClick={() => { void onChange(model); setOpen(false) }}>
            <span className="model-name-option-label">{model}</span>
            {mark}
          </button>
          return meta ? <Tooltip key={model}>
            <TooltipTrigger asChild>{option}</TooltipTrigger>
            <TooltipContent>{meta.hint}</TooltipContent>
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
    <Field label="配置名称"><EditableInput label="配置名称" active={active} maxLength={80} readOnly={sourceReadOnly} value={value.name} normalize={(next) => next.trim()} validate={(next) => validateText(next, 80, true)} onApply={(name) => onChange({ name })} /></Field>
    <Field label="协议类型"><SettingsSelect label="协议类型" className="settings-select-wide" value={value.protocol} disabled={sourceReadOnly} options={[
      { value: "openai_chat_completions", label: "OpenAI Chat Completions" }, { value: "anthropic_messages", label: "Anthropic Messages" }, { value: "openai_responses", label: "OpenAI Responses" },
    ]} onValueChange={(protocol) => onChange({ protocol: protocol as ModelProfileInput["protocol"] })} /></Field>
    <Field label="API 地址" caption={sourceReadOnly ? "来源地址只读；更换服务请创建独立全局预设。" : undefined}><EditableInput label="API 地址" active={active} maxLength={2048} readOnly={sourceReadOnly} value={value.base_url} placeholder="https://api.example.com/v1" normalize={(next) => next.trim()} validate={validateModelUrl} onApply={(base_url) => onChange({ base_url })} /></Field>
    <Field label="模型名称" caption={sourceReadOnly ? "智能体的模型名称不能为空。" : undefined}><ModelNamePicker value={value.model_name} active={active} readOnly={sourceReadOnly} onChange={(model_name) => onChange({ model_name })} onListModels={onListModels} /></Field>
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
