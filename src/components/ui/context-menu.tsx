import * as React from "react"
import { createPortal } from "react-dom"
import { applicationBounds, applicationLayerContainer } from "@/app/application-layers"
import { cn } from "@/lib/utils"
import "./settings-controls.css"
import "./context-menu.css"

export type ContextMenuCloseEvent = {
  defaultPrevented: boolean
  preventDefault: () => void
}

export type ContextMenuItem = {
  key: string
  label: React.ReactNode
  icon?: React.ReactNode
  variant?: "default" | "destructive"
  disabled?: boolean
  onSelect?: () => void
}

type Props = {
  /** 右键时展示的菜单项；为空时不弹出。 */
  items: ContextMenuItem[]
  /** 菜单的无障碍名称，例如「消息操作 3」。 */
  label: string
  /** 为 true 时右键不弹出菜单（例如撤回请求进行中）。 */
  disabled?: boolean
  /** 限制菜单范围的边界元素；默认限制在应用窗口内，消息菜单传入聊天窗口容器。 */
  boundary?: () => HTMLElement | null
  /** 菜单关闭时是否把焦点交还给触发元素；preventDefault 可阻止。 */
  onCloseAutoFocus?: (event: ContextMenuCloseEvent) => void
  children: React.ReactElement<React.HTMLAttributes<HTMLElement>>
}

const COLLISION_PADDING = 12

/**
 * 右键菜单：在子元素上右键时，于指针位置弹出应用内菜单。
 * 与 DropdownMenu 共用同一套浮层与菜单项样式，但由 contextmenu 事件驱动。
 */
export function ContextMenu({ items, label, disabled = false, boundary, onCloseAutoFocus, children }: Props) {
  const [point, setPoint] = React.useState<{ x: number; y: number } | null>(null)
  const [activeIndex, setActiveIndex] = React.useState(-1)
  const menuRef = React.useRef<HTMLDivElement | null>(null)
  const itemRefs = React.useRef<Array<HTMLButtonElement | null>>([])
  const triggerRef = React.useRef<HTMLElement | null>(null)
  const onCloseAutoFocusRef = React.useRef(onCloseAutoFocus)
  React.useEffect(() => { onCloseAutoFocusRef.current = onCloseAutoFocus }, [onCloseAutoFocus])
  const boundaryRef = React.useRef(boundary)
  React.useEffect(() => { boundaryRef.current = boundary }, [boundary])

  const open = point !== null

  // 每次打开新菜单时重置高亮项（渲染期间调整状态）。
  const [lastPoint, setLastPoint] = React.useState(point)
  if (lastPoint !== point) {
    setLastPoint(point)
    setActiveIndex(-1)
  }

  const enabledIndexes = items.map((item, index) => (item.disabled ? -1 : index)).filter((index) => index >= 0)
  const highlighted = open && activeIndex >= 0 && items[activeIndex] && !items[activeIndex].disabled ? activeIndex : (enabledIndexes[0] ?? -1)

  const close = React.useCallback(() => {
    setPoint(null)
    const event: ContextMenuCloseEvent = { defaultPrevented: false, preventDefault: () => { event.defaultPrevented = true } }
    onCloseAutoFocusRef.current?.(event)
    if (!event.defaultPrevented) triggerRef.current?.focus({ preventScroll: true })
  }, [])

  // 弹出时跟随鼠标并按边界校正，避免菜单溢出（布局副作用直接改 DOM，绘制前完成）。
  // 菜单挂在 .application-layers 下，该容器 contain: paint 会成为 fixed 定位的参考盒，
  // 所以 left/top 要用「视口坐标 - 浮层容器原点」换算，而不能直接使用 clientX/clientY。
  React.useLayoutEffect(() => {
    const menu = menuRef.current
    if (!open || !menu || !point) return
    const layerRect = applicationLayerContainer()?.getBoundingClientRect()
    const baseX = layerRect?.left ?? 0
    const baseY = layerRect?.top ?? 0
    const rect = menu.getBoundingClientRect()
    const bounds = boundaryRef.current?.()?.getBoundingClientRect() ?? applicationBounds()
    let clientX = point.x
    let clientY = point.y
    if (clientX + rect.width > bounds.right - COLLISION_PADDING) clientX = Math.max(bounds.left + COLLISION_PADDING, bounds.right - COLLISION_PADDING - rect.width)
    if (clientY + rect.height > bounds.bottom - COLLISION_PADDING) clientY = Math.max(bounds.top + COLLISION_PADDING, bounds.bottom - COLLISION_PADDING - rect.height)
    menu.style.left = `${clientX - baseX}px`
    menu.style.top = `${clientY - baseY}px`
    menu.style.maxHeight = `${Math.max(0, bounds.height - COLLISION_PADDING * 2)}px`
  }, [open, point])

  // 打开时聚焦高亮项；高亮随鼠标悬停与键盘操作移动。
  React.useLayoutEffect(() => {
    if (!open || highlighted < 0) return
    itemRefs.current[highlighted]?.focus({ preventScroll: true })
  }, [open, highlighted])

  // 打开期间：点击菜单外、Esc、窗口失焦/缩放/滚动都关闭菜单。
  React.useEffect(() => {
    if (!open) return
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") { event.stopPropagation(); close() }
    }
    function onPointerDown(event: PointerEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) close()
    }
    document.addEventListener("keydown", onKeyDown, true)
    document.addEventListener("pointerdown", onPointerDown, true)
    window.addEventListener("blur", close)
    window.addEventListener("resize", close)
    window.addEventListener("scroll", close, true)
    return () => {
      document.removeEventListener("keydown", onKeyDown, true)
      document.removeEventListener("pointerdown", onPointerDown, true)
      window.removeEventListener("blur", close)
      window.removeEventListener("resize", close)
      window.removeEventListener("scroll", close, true)
    }
  }, [open, close])

  function select(item: ContextMenuItem) {
    if (item.disabled) return
    item.onSelect?.()
    close()
  }

  function onMenuKeyDown(event: React.KeyboardEvent) {
    if (enabledIndexes.length === 0) return
    const focusAt = (index: number) => {
      setActiveIndex(index)
      itemRefs.current[index]?.focus({ preventScroll: true })
    }
    if (event.key === "ArrowDown") {
      event.preventDefault()
      const current = enabledIndexes.indexOf(highlighted)
      focusAt(enabledIndexes[(current + 1 + enabledIndexes.length) % enabledIndexes.length])
    } else if (event.key === "ArrowUp") {
      event.preventDefault()
      const current = enabledIndexes.indexOf(highlighted)
      focusAt(enabledIndexes[(current - 1 + enabledIndexes.length) % enabledIndexes.length])
    } else if (event.key === "Home") {
      event.preventDefault()
      focusAt(enabledIndexes[0])
    } else if (event.key === "End") {
      event.preventDefault()
      focusAt(enabledIndexes[enabledIndexes.length - 1])
    }
  }

  const child = React.Children.only(children)
  const triggerProps: Partial<React.HTMLAttributes<HTMLElement>> & { "data-state"?: string; "data-app-context-menu"?: string } = {
    tabIndex: -1,
    "aria-haspopup": "menu",
    "aria-expanded": open,
    "data-state": open ? "open" : "closed",
    "data-app-context-menu": "true",
    onContextMenu: (event: React.MouseEvent<HTMLElement>) => {
      child.props.onContextMenu?.(event)
      if (event.defaultPrevented) return
      // 阻止浏览器原生右键菜单；应用内菜单由本组件接管。
      event.preventDefault()
      if (disabled || items.length === 0) return
      triggerRef.current = event.currentTarget
      setPoint({ x: event.clientX, y: event.clientY })
    },
  }
  const trigger = React.cloneElement(child, triggerProps)

  return <>
    {trigger}
    {open && point && createPortal(
      <div
        ref={menuRef}
        role="menu"
        aria-label={label}
        data-state="open"
        className={cn("settings-glass-popover ui-dropdown-content context-menu-content z-50 min-w-40 overflow-x-hidden overflow-y-auto rounded-xl p-1.5 outline-none")}
        style={{
          position: "fixed",
          left: point.x,
          top: point.y,
          maxHeight: `calc(100dvh - ${COLLISION_PADDING * 2}px)`,
        }}
        onKeyDown={onMenuKeyDown}
      >
        {items.map((item, index) => (
          <button
            key={item.key}
            ref={(element) => { itemRefs.current[index] = element }}
            type="button"
            role="menuitem"
            className="ui-dropdown-item relative flex min-h-8 w-full cursor-default items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm outline-none select-none data-[disabled]:pointer-events-none data-[disabled]:opacity-50 data-[variant=destructive]:text-destructive [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4.5"
            data-variant={item.variant}
            data-highlighted={index === highlighted ? "" : undefined}
            disabled={item.disabled}
            onMouseEnter={() => setActiveIndex(index)}
            onFocus={() => setActiveIndex(index)}
            onClick={() => select(item)}
          >
            {item.icon}
            {item.label}
          </button>
        ))}
      </div>,
      applicationLayerContainer() ?? document.body,
    )}
  </>
}
