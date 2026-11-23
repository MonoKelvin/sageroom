import type { ComponentProps } from "react"
import { cn } from "@/lib/utils"
import "./system-message-tag.css"

type Props = ComponentProps<"p"> & { kind: "time" | "recall" }

export function SystemMessageTag({ kind, className, ...props }: Props) {
  return <p {...props} data-kind={kind} className={cn("chat-system-tag", className)} />
}
