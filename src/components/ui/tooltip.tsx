import * as React from "react"
import * as TooltipPrimitive from "@radix-ui/react-tooltip"
import { applicationFrame, applicationLayerContainer } from "@/app/application-layers"
import { cn } from "@/lib/utils"
import "./settings-controls.css"

function TooltipProvider({
  delayDuration = 600,
  skipDelayDuration = 0,
  ...props
}: React.ComponentProps<typeof TooltipPrimitive.Provider>) {
  return <TooltipPrimitive.Provider delayDuration={delayDuration} skipDelayDuration={skipDelayDuration} {...props} />
}

/** 自带 Provider，保证在独立渲染（如单元测试）或脱离根 Provider 时也能工作。 */
function Tooltip(props: React.ComponentProps<typeof TooltipPrimitive.Root>) {
  return <TooltipPrimitive.Provider delayDuration={600} skipDelayDuration={0}>
    <TooltipPrimitive.Root {...props} />
  </TooltipPrimitive.Provider>
}

function TooltipTrigger(props: React.ComponentProps<typeof TooltipPrimitive.Trigger>) {
  return <TooltipPrimitive.Trigger data-slot="tooltip-trigger" {...props} />
}

function TooltipContent({
  className,
  sideOffset = 6,
  children,
  ...props
}: React.ComponentProps<typeof TooltipPrimitive.Content>) {
  return (
    <TooltipPrimitive.Portal container={applicationLayerContainer()}>
      <TooltipPrimitive.Content
        data-slot="tooltip-content"
        sideOffset={sideOffset}
        collisionBoundary={applicationFrame()}
        collisionPadding={12}
        className={cn(
          "ui-tooltip z-[100] max-w-72 rounded-lg px-3 py-2 text-xs leading-relaxed break-words",
          className,
        )}
        {...props}
      >
        {children}
        <TooltipPrimitive.Arrow className="ui-tooltip-arrow" />
      </TooltipPrimitive.Content>
    </TooltipPrimitive.Portal>
  )
}

export { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider }
