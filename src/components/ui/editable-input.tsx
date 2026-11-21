import { useEffect, useEffectEvent, useId, useRef, useState, type ComponentProps } from "react"
import { IconPencil } from "@tabler/icons-react"
import { cn } from "@/lib/utils"
import { useEditableValue, type EditableValueProps } from "./use-editable-value"
import "./settings-controls.css"

export type EditableInputProps = EditableValueProps & Omit<
  ComponentProps<"input">, "value" | "defaultValue" | "onChange" | "children"
> & {
  /** 悬停才显露编辑容器：默认与只读文本同构，点击后切换为输入框。 */
  revealOnHover?: boolean
}

export function EditableInput({
  value, onApply, label, active = true, validate, normalize, resetOnApply,
  id, className, type = "text", disabled, readOnly, onBlur, onFocus, onKeyDown,
  "aria-describedby": describedBy, "aria-label": ariaLabel,
  revealOnHover = false,
  ...props
}: EditableInputProps) {
  const generatedId = useId()
  const errorId = `${generatedId}-error`
  const input = useRef<HTMLInputElement>(null)
  const composing = useRef(false)
  const [editing, setEditing] = useState(false)
  const editor = useEditableValue({ value, onApply, validate, normalize, resetOnApply,
    disabled, readOnly, secret: type === "password" })
  const reveal = revealOnHover && !disabled && !readOnly && type !== "password"
  // 校验失败也要保留输入框，错误提示才能就地修正；焦点进入后锁定编辑态。
  const showInput = reveal && active && (editing || Boolean(editor.error))
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
  useEffect(() => { if (showInput) input.current?.focus({ preventScroll: true }) }, [showInput])

  return (
    <div className={cn("settings-editor", reveal && !showInput && "settings-editor-reveal")} data-pending={editor.pending > 0 || undefined}>
      {reveal && !showInput ? (
        <button
          type="button"
          id={id ?? generatedId}
          className="settings-editor-trigger"
          aria-label={ariaLabel ?? (label ? `编辑${label}` : "编辑")}
          onClick={() => setEditing(true)}
        >
          <IconPencil size={14} aria-hidden="true" />
          <span>{editor.draft}</span>
        </button>
      ) : (
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
          onFocus={(event) => { if (reveal) setEditing(true); editor.focus(); onFocus?.(event) }}
          onBlur={(event) => {
            editor.leave(event.currentTarget.validity.valid ? undefined : event.currentTarget.validationMessage)
            onBlur?.(event)
            if (reveal) setEditing(false)
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
      )}
      {editor.error && <p className="settings-control-error" id={errorId} role="alert">{editor.error}</p>}
    </div>
  )
}
