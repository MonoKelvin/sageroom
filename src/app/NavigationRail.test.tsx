import type {} from "@testing-library/jest-dom/vitest"
import { fireEvent, render, screen } from "@testing-library/react"
import { IconMessageCircle, IconMessageCircleFilled } from "@tabler/icons-react"
import { describe, expect, it, vi } from "vitest"
import { TooltipProvider } from "@/components/ui/tooltip"
import type { ApplicationPageDefinition } from "./navigation"
import { NavigationRail } from "./NavigationRail"

const pages: readonly ApplicationPageDefinition[] = [
  { id: "chat", title: "聊天", icon: IconMessageCircle, filledIcon: IconMessageCircleFilled, component: () => null },
  { id: "agents", title: "智能体", icon: IconMessageCircle, filledIcon: IconMessageCircleFilled, component: () => null },
  { id: "settings", title: "设置", icon: IconMessageCircle, filledIcon: IconMessageCircleFilled, component: () => null },
  { id: "user", title: "用户", icon: IconMessageCircle, filledIcon: IconMessageCircleFilled, component: () => null },
]

describe("主导航", () => {
  it("四个图标入口都有名称，只标记当前页面", () => {
    render(<TooltipProvider><NavigationRail pages={pages} current="chat" onNavigate={vi.fn()} /></TooltipProvider>)
    expect(screen.getByRole("navigation", { name: "主导航" })).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "聊天" })).toHaveAttribute("aria-current", "page")
    expect(screen.getByRole("button", { name: "智能体" })).not.toHaveAttribute("aria-current")
    expect(screen.getByRole("button", { name: "设置" })).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "用户" })).toBeInTheDocument()
  })

  it("当前页面使用实心图标，切换后恢复线性图标", () => {
    const onNavigate = vi.fn()
    const view = render(<TooltipProvider><NavigationRail pages={pages} current="chat" onNavigate={onNavigate} /></TooltipProvider>)
    expect(screen.getByRole("button", { name: "聊天" }).querySelector("svg")).toHaveAttribute("fill", "currentColor")
    expect(screen.getByRole("button", { name: "智能体" }).querySelector("svg")).toHaveAttribute("fill", "none")

    view.rerender(<TooltipProvider><NavigationRail pages={pages} current="agents" onNavigate={onNavigate} /></TooltipProvider>)
    expect(screen.getByRole("button", { name: "聊天" }).querySelector("svg")).toHaveAttribute("fill", "none")
    expect(screen.getByRole("button", { name: "智能体" }).querySelector("svg")).toHaveAttribute("fill", "currentColor")
  })

  it("悬停高亮首次直接定位，随后跟随且离开后保留最后位置", () => {
    render(<TooltipProvider><NavigationRail pages={pages} current="chat" onNavigate={vi.fn()} /></TooltipProvider>)
    const nav = screen.getByRole("navigation", { name: "主导航" })
    const hover = nav.querySelector<HTMLElement>(".navigation-hover")!
    expect(hover).toHaveAttribute("data-visible", "false")

    fireEvent.pointerEnter(screen.getByRole("button", { name: "智能体" }), { pointerType: "mouse" })
    expect(hover).toHaveAttribute("data-visible", "true")
    expect(hover).toHaveAttribute("data-sliding", "false")
    expect(hover.style.transform).toContain("calc(1 *")

    fireEvent.pointerEnter(screen.getByRole("button", { name: "用户" }), { pointerType: "mouse" })
    expect(hover).toHaveAttribute("data-sliding", "true")
    expect(hover.style.transform).toContain("calc(3 *")

    fireEvent.pointerLeave(nav.querySelector(".navigation-items")!)
    expect(hover).toHaveAttribute("data-visible", "false")
    expect(hover.style.transform).toContain("calc(3 *")

    fireEvent.pointerEnter(screen.getByRole("button", { name: "智能体" }), { pointerType: "mouse" })
    expect(hover).toHaveAttribute("data-sliding", "false")
    expect(hover.style.transform).toContain("calc(1 *")
  })

  it("触摸进入不会触发悬停高亮", () => {
    render(<TooltipProvider><NavigationRail pages={pages} current="chat" onNavigate={vi.fn()} /></TooltipProvider>)
    fireEvent.pointerEnter(screen.getByRole("button", { name: "智能体" }), { pointerType: "touch" })
    expect(screen.getByRole("navigation", { name: "主导航" }).querySelector(".navigation-hover")).toHaveAttribute("data-visible", "false")
  })

  it("激活背景复用同一层并更新裁剪位置", () => {
    const onNavigate = vi.fn()
    const view = render(<TooltipProvider><NavigationRail pages={pages} current="chat" onNavigate={onNavigate} /></TooltipProvider>)
    const active = screen.getByRole("navigation", { name: "主导航" }).querySelector<HTMLElement>(".navigation-active")!
    expect(active.style.clipPath).toContain("calc(0 *")
    expect(active).toHaveAttribute("aria-hidden", "true")
    expect(screen.getAllByRole("button")).toHaveLength(4)

    view.rerender(<TooltipProvider><NavigationRail pages={pages} current="agents" onNavigate={onNavigate} /></TooltipProvider>)
    expect(screen.getByRole("navigation", { name: "主导航" }).querySelector(".navigation-active")).toBe(active)
    expect(active.style.clipPath).toContain("calc(1 *")
  })

  it("通过注册项 id 切换页面，不依赖显示文字", () => {
    const onNavigate = vi.fn()
    render(<TooltipProvider><NavigationRail pages={pages} current="chat" onNavigate={onNavigate} /></TooltipProvider>)
    fireEvent.click(screen.getByRole("button", { name: "智能体" }))
    fireEvent.click(screen.getByRole("button", { name: "用户" }))
    expect(onNavigate.mock.calls.map(([page]) => page)).toEqual(["agents", "user"])
  })
})
