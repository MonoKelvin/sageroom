import { useEffect, useEffectEvent, useId, useRef, type ComponentProps } from "react"
import { IconMinus, IconPlus } from "@tabler/icons-react"
import { cn } from "@/lib/utils"
import { Button } from "./button"
import { useEditableValue } from "./use-editable-value"
import "./settings-controls.css"

export type NumberInputProps = Omit<ComponentProps<"input">,
  "value" | "defaultValue" | "onChange" | "type" | "min" | "max" | "step" | "children"
> & {
  value: number
  min?: number
  max?: number
  step?: number
  onValueChange: (value: number) => void | Promise<void>
  label?: string
}

export function NumberInput({
  value, min, max, step = 1, onValueChange, label, id, disabled, readOnly, className,
  onFocus, onBlur, onKeyDown, "aria-label": ariaLabel, "aria-describedby": describedBy, ...props
}: NumberInputProps) {
  const generatedId = useId()
  const errorId = `${generatedId}-error`
  const input = useRef<HTMLInputElement>(null)
  const composing = useRef(false)
  const editor = useEditableValue({
    value: String(value), disabled, readOnly,
    onApply: async (next) => { await onValueChange(Number(next)) },
    normalize: (next) => next.trim() ? String(Number(next)) : "",
    validate: (next) => {
      if (!next.trim() || !Number.isFinite(Number(next))) return "请输入有效数字。"
      if (min !== undefined && Number(next) < min) return `不能小于 ${min}。`
      if (max !== undefined && Number(next) > max) return `不能大于 ${max}。`
      return null
    },
  })
  function increment(direction: number) {
    if (disabled || readOnly || !Number.isFinite(step) || step <= 0) return
    const draftNumber = editor.draft.trim() ? Number(editor.draft) : NaN
    const base = Number.isFinite(draftNumber) ? draftNumber : value
    const candidate = Number((base + direction * step).toPrecision(15))
    const next = Math.min(max ?? Infinity, Math.max(min ?? -Infinity, candidate))
    if (!Number.isFinite(next)) return
    editor.change(String(next))
    void editor.commit(undefined, true)
  }
  const finish = useEffectEvent(() => {
    if (input.current === document.activeElement) editor.leave()
  })
  useEffect(() => {
    window.addEventListener("blur", finish)
    return () => window.removeEventListener("blur", finish)
  }, [])
  const draftNumber = editor.draft.trim() ? Number(editor.draft) : NaN
  return (
    <div className="settings-editor settings-number-editor">
      <div className="settings-number-controls">
        <Button variant="ghost" size="icon-sm" aria-label={`减少${label ?? "数值"}`}
          disabled={disabled || readOnly || (Number.isFinite(draftNumber) && min !== undefined && draftNumber <= min)}
          onPointerDown={(event) => { if (event.button === 0) event.preventDefault() }}
          onClick={() => increment(-1)}><IconMinus size={16} aria-hidden="true" /></Button>
        <input
          {...props}
          ref={input}
          id={id ?? generatedId}
          type="text"
          inputMode="decimal"
          role="spinbutton"
          value={editor.draft}
          disabled={disabled}
          readOnly={readOnly}
          className={cn("settings-control settings-number-input", className)}
          aria-label={ariaLabel ?? label}
          aria-valuemin={min}
          aria-valuemax={max}
          aria-valuenow={Number.isFinite(draftNumber) ? draftNumber : undefined}
          aria-invalid={editor.error ? true : props["aria-invalid"]}
          aria-describedby={[describedBy, editor.error ? errorId : null].filter(Boolean).join(" ") || undefined}
          aria-busy={editor.pending > 0 || undefined}
          onChange={(event) => editor.change(event.target.value)}
          onFocus={(event) => { editor.focus(); onFocus?.(event) }}
          onBlur={(event) => { editor.leave(); onBlur?.(event) }}
          onCompositionStart={(event) => { composing.current = true; props.onCompositionStart?.(event) }}
          onCompositionEnd={(event) => { composing.current = false; props.onCompositionEnd?.(event) }}
          onKeyDown={(event) => {
            onKeyDown?.(event)
            if (event.defaultPrevented || composing.current || event.nativeEvent.isComposing || event.keyCode === 229) return
            if (event.key === "Escape") { event.preventDefault(); editor.cancel() }
            if (event.key === "Enter") { event.preventDefault(); void editor.commit(undefined, true) }
            if (event.key === "ArrowUp" || event.key === "ArrowDown") {
              event.preventDefault(); increment(event.key === "ArrowUp" ? 1 : -1)
            }
          }}
        />
        <Button variant="ghost" size="icon-sm" aria-label={`增加${label ?? "数值"}`}
          disabled={disabled || readOnly || (Number.isFinite(draftNumber) && max !== undefined && draftNumber >= max)}
          onPointerDown={(event) => { if (event.button === 0) event.preventDefault() }}
          onClick={() => increment(1)}><IconPlus size={16} aria-hidden="true" /></Button>
      </div>
      {editor.error && <p className="settings-control-error" id={errorId} role="alert">{editor.error}</p>}
    </div>
  )
}
