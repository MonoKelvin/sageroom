import { useEffect, useEffectEvent, useId, useRef, type ComponentProps } from "react"
import { cn } from "@/lib/utils"
import { useEditableValue, type EditableValueProps } from "./use-editable-value"
import "./settings-controls.css"

export type EditableInputProps = EditableValueProps & Omit<
  ComponentProps<"input">, "value" | "defaultValue" | "onChange" | "children"
>

export function EditableInput({
  value, onApply, label, active = true, validate, normalize, resetOnApply,
  id, className, type = "text", disabled, readOnly, onBlur, onFocus, onKeyDown,
  "aria-describedby": describedBy, "aria-label": ariaLabel, ...props
}: EditableInputProps) {
  const generatedId = useId()
  const errorId = `${generatedId}-error`
  const input = useRef<HTMLInputElement>(null)
  const composing = useRef(false)
  const editor = useEditableValue({ value, onApply, validate, normalize, resetOnApply,
    disabled, readOnly, secret: type === "password" })
  const finish = useEffectEvent(() => {
    const node = input.current
    if (node && document.activeElement === node) {
      editor.leave(node.validity.valid ? undefined : node.validationMessage)
    }
  })
  useEffect(() => {
    window.addEventListener("blur", finish)
    return () => window.removeEventListener("blur", finish)
  }, [])
  useEffect(() => { if (!active) finish() }, [active])

  return (
    <div className="settings-editor" data-pending={editor.pending > 0 || undefined}>
      <input
        {...props}
        ref={input}
        id={id ?? generatedId}
        type={type}
        disabled={disabled}
        readOnly={readOnly}
        className={cn("settings-control settings-input", className)}
        value={editor.draft}
        aria-label={ariaLabel ?? label}
        aria-describedby={[describedBy, editor.error ? errorId : null].filter(Boolean).join(" ") || undefined}
        aria-invalid={editor.error ? true : props["aria-invalid"]}
        aria-busy={editor.pending > 0 || undefined}
        onChange={(event) => editor.change(event.target.value)}
        onFocus={(event) => { editor.focus(); onFocus?.(event) }}
        onBlur={(event) => {
          editor.leave(event.currentTarget.validity.valid ? undefined : event.currentTarget.validationMessage)
          onBlur?.(event)
        }}
        onCompositionStart={(event) => { composing.current = true; props.onCompositionStart?.(event) }}
        onCompositionEnd={(event) => { composing.current = false; props.onCompositionEnd?.(event) }}
        onKeyDown={(event) => {
          onKeyDown?.(event)
          if (event.defaultPrevented || composing.current || event.nativeEvent.isComposing || event.keyCode === 229) return
          if (event.key === "Escape") { event.preventDefault(); editor.cancel() }
          if (event.key === "Enter") {
            event.preventDefault()
            void editor.commit(event.currentTarget.validity.valid ? undefined : event.currentTarget.validationMessage, true)
          }
        }}
      />
      {editor.error && <p className="settings-control-error" id={errorId} role="alert">{editor.error}</p>}
    </div>
  )
}
