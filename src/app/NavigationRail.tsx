import { useState } from "react"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import type { ApplicationPageDefinition, PageId } from "./navigation"

export function NavigationRail({ pages, current, onNavigate }: { pages: readonly ApplicationPageDefinition[]; current: PageId; onNavigate: (page: PageId) => void }) {
  const [hover, setHover] = useState({ index: 0, visible: false, sliding: false })
  const activeIndex = pages.findIndex((page) => page.id === current)

  return (
    <nav className="navigation-rail" aria-label="主导航">
      <div className="navigation-items" onPointerLeave={() => setHover((previous) => ({ ...previous, visible: false }))}>
        <span
          className="navigation-hover"
          aria-hidden="true"
          data-visible={hover.visible}
          data-sliding={hover.sliding}
          style={{ transform: `translateY(calc(${hover.index} * (var(--navigation-button-size) + var(--navigation-gap))))` }}
        />
        {/* 裁剪副本避免移动高亮时图标与背景同色。 */}
        <div
          className="navigation-active"
          aria-hidden="true"
          style={{ clipPath: `inset(calc(${activeIndex} * (var(--navigation-button-size) + var(--navigation-gap))) 0 calc(${pages.length - activeIndex - 1} * (var(--navigation-button-size) + var(--navigation-gap))) 0 round 14px)` }}
        >
          {pages.map((page) => {
            const Icon = page.filledIcon
            return <span key={page.id} className="navigation-active-icon"><Icon size={23} stroke={1.5} aria-hidden="true" /></span>
          })}
        </div>
        {pages.map((page, index) => {
          const selected = page.id === current
          const Icon = selected ? page.filledIcon : page.icon
          return (
            <Tooltip key={page.id} disableHoverableContent>
              <TooltipTrigger asChild>
                <button
                  type="button"
                  className="navigation-button"
                  data-active={selected}
                  aria-label={page.title}
                  aria-current={selected ? "page" : undefined}
                  onClick={() => onNavigate(page.id)}
                  onPointerEnter={(event) => {
                    if (event.pointerType !== "touch") setHover((previous) => ({ index, visible: true, sliding: previous.visible }))
                  }}
                >
                  <Icon size={23} stroke={1.5} aria-hidden="true" />
                </button>
              </TooltipTrigger>
              <TooltipContent side="right" className="navigation-tooltip">{page.title}</TooltipContent>
            </Tooltip>
          )
        })}
      </div>
    </nav>
  )
}
