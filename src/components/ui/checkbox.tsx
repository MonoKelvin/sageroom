import { useId, type ComponentProps } from "react"
import * as CheckboxPrimitive from "@radix-ui/react-checkbox"
import { IconCheck } from "@tabler/icons-react"
import { cn } from "@/lib/utils"
import { useControlAction } from "./use-control-action"
import "./settings-controls.css"

export type CheckboxProps = Omit<ComponentProps<typeof CheckboxPrimitive.Root>, "checked" | "defaultChecked" | "onCheckedChange" | "children"> & {
  checked: boolean
  onCheckedChange: (checked: boolean) => void | Promise<void>
  label?: string
}

export function Checkbox({ checked, onCheckedChange, label, id, className,
  "aria-label": ariaLabel, "aria-describedby": describedBy, ...props }: CheckboxProps) {
  const generatedId = useId()
  const errorId = `${generatedId}-error`
  const action = useControlAction(onCheckedChange)
  return (
    <div className="settings-toggle-field">
      <CheckboxPrimitive.Root
        {...props}
        id={id ?? generatedId}
        checked={checked}
        onCheckedChange={(next) => { void action.run(next === true) }}
        className={cn("settings-checkbox", className)}
        aria-label={ariaLabel ?? label}
        aria-describedby={[describedBy, action.error ? errorId : null].filter(Boolean).join(" ") || undefined}
        aria-busy={action.pending > 0 || undefined}
        aria-invalid={action.error ? true : props["aria-invalid"]}
      >
        <CheckboxPrimitive.Indicator className="settings-checkbox-indicator"><IconCheck size={15} strokeWidth={2.5} aria-hidden="true" /></CheckboxPrimitive.Indicator>
      </CheckboxPrimitive.Root>
      {action.error && <p className="settings-control-error" id={errorId} role="alert">{action.error}</p>}
    </div>
  )
}
