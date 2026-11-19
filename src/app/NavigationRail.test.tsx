import type {} from "@testing-library/jest-dom/vitest"
import { fireEvent, render, screen } from "@testing-library/react"
import { IconMessageCircle } from "@tabler/icons-react"
import { describe, expect, it, vi } from "vitest"
import { TooltipProvider } from "@/components/ui/tooltip"
import type { ApplicationPageDefinition } from "./navigation"
import { NavigationRail } from "./NavigationRail"

const pages: readonly ApplicationPageDefinition[] = [
  { id: "chat", title: "聊天", icon: IconMessageCircle, component: () => null },
  { id: "agents", title: "智能体", icon: IconMessageCircle, component: () => null },
  { id: "settings", title: "设置", icon: IconMessageCircle, component: () => null },
  { id: "user", title: "用户", icon: IconMessageCircle, component: () => null },
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

  it("通过注册项 id 切换页面，不依赖显示文字", () => {
    const onNavigate = vi.fn()
    render(<TooltipProvider><NavigationRail pages={pages} current="chat" onNavigate={onNavigate} /></TooltipProvider>)
    fireEvent.click(screen.getByRole("button", { name: "智能体" }))
    fireEvent.click(screen.getByRole("button", { name: "用户" }))
    expect(onNavigate.mock.calls.map(([page]) => page)).toEqual(["agents", "user"])
  })
})
