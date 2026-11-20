import { useId, type ComponentProps } from "react"
import * as SwitchPrimitive from "@radix-ui/react-switch"
import { cn } from "@/lib/utils"
import { useControlAction } from "./use-control-action"
import "./settings-controls.css"

export type SwitchProps = Omit<ComponentProps<typeof SwitchPrimitive.Root>, "checked" | "defaultChecked" | "onCheckedChange" | "children"> & {
  checked: boolean
  onCheckedChange: (checked: boolean) => void | Promise<void>
  label?: string
}

export function Switch({ checked, onCheckedChange, label, id, className,
  "aria-label": ariaLabel, "aria-describedby": describedBy, ...props }: SwitchProps) {
  const generatedId = useId()
  const errorId = `${generatedId}-error`
  const action = useControlAction(onCheckedChange)
  return (
    <div className="settings-toggle-field">
      <SwitchPrimitive.Root
        {...props}
        id={id ?? generatedId}
        checked={checked}
        onCheckedChange={(next) => { void action.run(next) }}
        className={cn("settings-switch", className)}
        aria-label={ariaLabel ?? label}
        aria-describedby={[describedBy, action.error ? errorId : null].filter(Boolean).join(" ") || undefined}
        aria-busy={action.pending > 0 || undefined}
        aria-invalid={action.error ? true : props["aria-invalid"]}
      >
        <SwitchPrimitive.Thumb className="settings-switch-thumb" />
      </SwitchPrimitive.Root>
      {action.error && <p className="settings-control-error" id={errorId} role="alert">{action.error}</p>}
    </div>
  )
}
