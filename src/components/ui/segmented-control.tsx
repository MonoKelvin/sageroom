import * as React from "react"
import { useState } from "react"
import { cn } from "@/lib/utils"
import "./segmented-control.css"

export type SegmentedItem<T extends string> = {
  value: T
  label: React.ReactNode
  icon?: React.ElementType
}

type Props<T extends string> = {
  items: SegmentedItem<T>[]
  value: T
  onChange: (value: T) => void
  label: string
  className?: string
}

/**
 * 分段切换：整块圆角背景内滑动一个高亮块，点击时平移到对应选项。
 * 交互与样式对齐 shadcn Tabs，但保持单层结构与既有 token，不引入额外依赖。
 */
export function SegmentedControl<T extends string>({ items, value, onChange, label, className }: Props<T>) {
  const index = Math.max(0, items.findIndex((item) => item.value === value))
  // 悬停索引独立维护：hover 层随指针所在选项平滑滑动，离开整组才淡出。
  const [hover, setHover] = useState(-1)
  return <div
    role="tablist"
    aria-label={label}
    className={cn("segmented-control", className)}
    onPointerLeave={() => setHover(-1)}
    style={{ "--segmented-count": items.length, "--segmented-index": index, "--segmented-hover-index": Math.max(0, hover) } as React.CSSProperties}
  >
    {/* hover 跟随层置于选中层之前，选中项上仍以选中背景为准 */}
    <span className="segmented-hover" data-visible={hover >= 0} aria-hidden="true" />
    <span className="segmented-thumb" aria-hidden="true" />
    {items.map((item, itemIndex) => {
      const Icon = item.icon
      const selected = item.value === value
      return <button
        key={item.value}
        type="button"
        role="tab"
        aria-selected={selected}
        tabIndex={selected ? 0 : -1}
        className="segmented-item"
        onPointerEnter={() => setHover(itemIndex)}
        onClick={() => onChange(item.value)}
      >
        {Icon && <Icon size={16} aria-hidden />}
        {item.label}
      </button>
    })}
  </div>
}
