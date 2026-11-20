import { useEffect, useEffectEvent, useId, useRef, type ComponentProps } from "react"
import { IconCheck, IconX } from "@tabler/icons-react"
import { cn } from "@/lib/utils"
import { Button } from "./button"
import { useEditableValue, type EditableValueProps } from "./use-editable-value"
import "./settings-controls.css"

export type EditableTextareaProps = EditableValueProps & Omit<
  ComponentProps<"textarea">, "value" | "defaultValue" | "onChange" | "children"
>

export function EditableTextarea({
  value, onApply, label, active = true, validate, normalize, resetOnApply,
  id, className, disabled, readOnly, onBlur, onFocus, onKeyDown, rows = 4,
  "aria-describedby": describedBy, "aria-label": ariaLabel, ...props
}: EditableTextareaProps) {
  const generatedId = useId()
  const errorId = `${generatedId}-error`
  const container = useRef<HTMLDivElement>(null)
  const textarea = useRef<HTMLTextAreaElement>(null)
  const composing = useRef(false)
  const editor = useEditableValue({ value, onApply, validate, normalize, resetOnApply, disabled, readOnly })
  function nativeError() {
    const node = textarea.current
    return node && !node.validity.valid ? node.validationMessage : undefined
  }
  const finish = useEffectEvent(() => {
    if (container.current?.contains(document.activeElement)) editor.leave(nativeError())
  })
  useEffect(() => {
    window.addEventListener("blur", finish)
    return () => window.removeEventListener("blur", finish)
  }, [])
  useEffect(() => { if (!active) finish() }, [active])

  return (
    <div className="settings-editor" data-pending={editor.pending > 0 || undefined}>
      <div
        className="settings-textarea-container"
        ref={container}
        onFocusCapture={() => editor.focus()}
        onBlurCapture={(event) => {
          if (event.currentTarget.contains(event.relatedTarget)) return
          editor.leave(nativeError())
        }}
        onKeyDown={(event) => {
          if (event.key === "Escape" && !event.defaultPrevented && !composing.current && !event.nativeEvent.isComposing && event.keyCode !== 229) {
            event.preventDefault()
            editor.cancel()
            textarea.current?.focus()
          }
        }}
      >
        <textarea
          {...props}
          id={id ?? generatedId}
          ref={textarea}
          rows={rows}
          disabled={disabled}
          readOnly={readOnly}
          className={cn("settings-control settings-textarea", className)}
          value={editor.draft}
          aria-label={ariaLabel ?? label}
          aria-describedby={[describedBy, editor.error ? errorId : null].filter(Boolean).join(" ") || undefined}
          aria-invalid={editor.error ? true : props["aria-invalid"]}
          aria-busy={editor.pending > 0 || undefined}
          onChange={(event) => editor.change(event.target.value)}
          onFocus={onFocus}
          onBlur={onBlur}
          onKeyDown={onKeyDown}
          onCompositionStart={(event) => { composing.current = true; props.onCompositionStart?.(event) }}
          onCompositionEnd={(event) => { composing.current = false; props.onCompositionEnd?.(event) }}
        />
        {!disabled && !readOnly && (editor.focused || editor.dirty) && (
          <div className="settings-textarea-actions">
            <Button
              variant="ghost" size="icon-sm" aria-label={`应用${label ?? "编辑"}`}
              onClick={() => { void editor.commit(nativeError(), true) }}
              disabled={editor.pending > 0 && !editor.dirty}
            >
              <IconCheck size={17} aria-hidden="true" />
            </Button>
            <Button
              variant="ghost" size="icon-sm" aria-label={`撤销${label ?? "编辑"}`}
              // 失焦会提交，撤销必须抢在焦点转移之前。
              onPointerDown={(event) => { if (event.button === 0) { event.preventDefault(); editor.cancel() } }}
              onClick={() => { editor.cancel(); textarea.current?.focus() }}
            >
              <IconX size={17} aria-hidden="true" />
            </Button>
          </div>
        )}
      </div>
      {editor.error && <p className="settings-control-error" id={errorId} role="alert">{editor.error}</p>}
    </div>
  )
}
