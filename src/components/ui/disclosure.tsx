import { useState, type ReactNode } from "react"
import { IconChevronRight } from "@tabler/icons-react"

/**
 * 带动画的折叠分组：标题左侧 Chevron，展开/收起用 grid 行高过渡，
 * 速度曲线与全局配置卡片保持一致。
 */
export function Disclosure({ title, children }: { title: string; children: ReactNode }) {
  const [open, setOpen] = useState(false)
  return <div className="config-disclosure">
    <button type="button" className="config-disclosure-trigger" aria-expanded={open} onClick={() => setOpen((current) => !current)}>
      <IconChevronRight size={16} className="config-card-chevron" data-open={open} aria-hidden="true" />
      <span>{title}</span>
    </button>
    <div className="config-card-body-wrap" data-open={open} inert={!open}>
      <div className="config-card-body-clip">
        <div className="config-disclosure-body">{children}</div>
      </div>
    </div>
  </div>
}
