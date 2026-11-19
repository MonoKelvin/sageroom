import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import type { ApplicationPageDefinition, PageId } from "./navigation"

export function NavigationRail({ pages, current, onNavigate }: { pages: readonly ApplicationPageDefinition[]; current: PageId; onNavigate: (page: PageId) => void }) {
  return (
    <nav className="navigation-rail" aria-label="主导航">
      {pages.map((page) => {
        const Icon = page.icon
        const selected = page.id === current
        return (
          <Tooltip key={page.id}>
            <TooltipTrigger asChild>
              <button type="button" className="navigation-button" data-active={selected} aria-label={page.title} aria-current={selected ? "page" : undefined} onClick={() => onNavigate(page.id)}>
                <Icon size={23} stroke={1.5} aria-hidden="true" />
              </button>
            </TooltipTrigger>
            <TooltipContent side="right" className="navigation-tooltip">{page.title}</TooltipContent>
          </Tooltip>
        )
      })}
    </nav>
  )
}
