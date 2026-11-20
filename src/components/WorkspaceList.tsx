import { useCallback, useEffect, useRef, useState, type ComponentPropsWithoutRef } from "react"
import { createPortal } from "react-dom"
import { cn } from "@/lib/utils"

export function WorkspaceList({ className, children, ...props }: ComponentPropsWithoutRef<"aside">) {
  const [host, setHost] = useState<HTMLElement | null>(null)
  const hovered = useRef<HTMLElement | null>(null)
  const [hover, setHover] = useState({ clipPath: "inset(0 0 100% 0 round 12px)", visible: false, sliding: false, instant: false })
  const bindRoot = useCallback((node: HTMLElement | null) => { if (node) setHost(node.parentElement) }, [])
  const hideHover = useCallback((instant = false) => {
    hovered.current = null
    setHover((previous) => !previous.visible && previous.instant === instant ? previous : { ...previous, visible: false, instant })
  }, [])

  useEffect(() => {
    const onResize = () => hideHover(true)
    window.addEventListener("resize", onResize)
    return () => window.removeEventListener("resize", onResize)
  }, [hideHover])

  return <>
    <aside
      {...props}
      ref={bindRoot}
      className={cn("workspace-list", className)}
      onPointerLeave={() => hideHover()}
      onScrollCapture={() => hideHover(true)}
      onPointerMove={(event) => {
        if (event.pointerType === "touch") return
        const target = event.target instanceof Element ? event.target.closest<HTMLElement>(".list-entry") : null
        if (!target || !event.currentTarget.contains(target)) { hideHover(); return }
        if (hovered.current === target) return
        hovered.current = target

        const container = event.currentTarget.parentElement!.getBoundingClientRect()
        const viewport = event.currentTarget.getBoundingClientRect()
        const bounds = target.getBoundingClientRect()
        let top = Math.max(bounds.top, viewport.top)
        let right = Math.min(bounds.right, viewport.right)
        let bottom = Math.min(bounds.bottom, viewport.bottom)
        let left = Math.max(bounds.left, viewport.left)
        let ancestor = target.parentElement
        while (ancestor && ancestor !== event.currentTarget) {
          const style = getComputedStyle(ancestor)
          if (["auto", "scroll", "hidden", "clip"].includes(style.overflowY) || ["auto", "scroll", "hidden", "clip"].includes(style.overflowX)) {
            const clip = ancestor.getBoundingClientRect()
            top = Math.max(top, clip.top)
            right = Math.min(right, clip.right)
            bottom = Math.min(bottom, clip.bottom)
            left = Math.max(left, clip.left)
          }
          ancestor = ancestor.parentElement
        }
        const clipPath = `inset(${top - container.top}px ${container.right - right}px ${container.bottom - bottom}px ${left - container.left}px round 12px)`
        setHover((previous) => ({ clipPath, visible: true, sliding: previous.visible, instant: false }))
      }}
    >{children}</aside>
    {/* 跟踪层放在非滚动容器中，避免随列表滚动产生位置偏移。 */}
    {host && createPortal(<span className="workspace-list-hover" aria-hidden="true" data-visible={hover.visible} data-sliding={hover.sliding} data-instant={hover.instant} style={{ clipPath: hover.clipPath }} />, host)}
  </>
}
