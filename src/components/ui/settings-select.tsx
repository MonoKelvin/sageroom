import { useId, type CSSProperties, type ComponentProps } from "react"
import * as SelectPrimitive from "@radix-ui/react-select"
import { IconCheck, IconChevronDown, IconChevronUp } from "@tabler/icons-react"
import { applicationFrame, applicationLayerContainer } from "@/app/application-layers"
import { cn } from "@/lib/utils"
import { useControlAction } from "./use-control-action"
import "./settings-controls.css"

export interface SettingsSelectOption { value: string; label: string; disabled?: boolean }
export type SettingsSelectProps = Omit<ComponentProps<typeof SelectPrimitive.Trigger>, "value" | "onChange" | "children" | "defaultValue"> & {
  value: string
  options: SettingsSelectOption[]
  onValueChange: (value: string) => void | Promise<void>
  label?: string
  placeholder?: string
}

export function SettingsSelect({
  value, options, onValueChange, label, placeholder = "请选择", id, className, disabled,
  "aria-label": ariaLabel, "aria-describedby": describedBy, ...props
}: SettingsSelectProps) {
  const generatedId = useId()
  const errorId = `${generatedId}-error`
  const action = useControlAction(onValueChange)
  const selectedIndex = options.findIndex((option) => option.value === value)
  // 业务空值不能交给 Radix Item，所有值统一走索引以免碰撞。
  const internalValue = selectedIndex < 0 ? "" : String(selectedIndex)
  // 宽度按最长选项估算：中文按 1ch、ASCII 按 0.55ch，再加图标与左右内边距。
  // 用 ch 而非固定宽度，切换选项时触发器宽度不跳动，最长项也能完整显示。
  const widest = options.reduce((longest, option) => {
    const units = [...option.label].reduce((sum, char) => sum + (char.charCodeAt(0) > 255 ? 1 : 0.55), 0)
    return Math.max(longest, units)
  }, placeholder.length)
  const widthStyle = { "--select-label-width": `${Math.ceil(widest)}ch` } as CSSProperties
  return (
    <div className="settings-editor" style={widthStyle}>
      <SelectPrimitive.Root
        value={internalValue}
        disabled={disabled}
        onValueChange={(index) => {
          const option = options[Number(index)]
          if (option && !option.disabled && option.value !== value) void action.run(option.value)
        }}
      >
        <SelectPrimitive.Trigger
          {...props}
          id={id ?? generatedId}
          className={cn("settings-control settings-select-trigger", className)}
          aria-label={ariaLabel ?? label}
          aria-describedby={[describedBy, action.error ? errorId : null].filter(Boolean).join(" ") || undefined}
          aria-invalid={action.error ? true : props["aria-invalid"]}
          aria-busy={action.pending > 0 || undefined}
        >
          <SelectPrimitive.Value placeholder={selectedIndex < 0 && value ? value : placeholder} />
          <SelectPrimitive.Icon><IconChevronDown size={17} aria-hidden="true" /></SelectPrimitive.Icon>
        </SelectPrimitive.Trigger>
        <SelectPrimitive.Portal container={applicationLayerContainer()}>
          <SelectPrimitive.Content className="settings-select-content settings-glass-popover" position="popper" sideOffset={6} collisionPadding={10} collisionBoundary={applicationFrame()}>
            <SelectPrimitive.ScrollUpButton className="settings-select-scroll"><IconChevronUp size={16} aria-hidden="true" /></SelectPrimitive.ScrollUpButton>
            <SelectPrimitive.Viewport className="settings-select-viewport">
              {options.map((option, index) => (
                <SelectPrimitive.Item key={option.value} value={String(index)} disabled={option.disabled} className="settings-select-item">
                  <SelectPrimitive.ItemText>{option.label}</SelectPrimitive.ItemText>
                  <SelectPrimitive.ItemIndicator className="settings-select-check"><IconCheck size={16} aria-hidden="true" /></SelectPrimitive.ItemIndicator>
                </SelectPrimitive.Item>
              ))}
            </SelectPrimitive.Viewport>
            <SelectPrimitive.ScrollDownButton className="settings-select-scroll"><IconChevronDown size={16} aria-hidden="true" /></SelectPrimitive.ScrollDownButton>
          </SelectPrimitive.Content>
        </SelectPrimitive.Portal>
      </SelectPrimitive.Root>
      {action.error && <p className="settings-control-error" id={errorId} role="alert">{action.error}</p>}
    </div>
  )
}
