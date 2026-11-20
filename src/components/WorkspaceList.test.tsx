import type {} from "@testing-library/jest-dom/vitest"
import { fireEvent, render, screen } from "@testing-library/react"
import { afterEach, describe, expect, it, vi } from "vitest"
import { WorkspaceList } from "./WorkspaceList"

afterEach(() => vi.restoreAllMocks())

function bounds(element: HTMLElement, x: number, y: number, width: number, height: number) {
  vi.spyOn(element, "getBoundingClientRect").mockReturnValue(new DOMRect(x, y, width, height))
}

describe("工作区列表跟踪背景", () => {
  it("共享背景跟随不同尺寸条目，滚动与缩放立即隐藏", () => {
    render(<div data-testid="workspace"><WorkspaceList aria-label="列表"><button className="list-entry">第一项</button><button className="list-entry">第二项</button></WorkspaceList></div>)
    const workspace = screen.getByTestId("workspace")
    const list = screen.getByRole("complementary", { name: "列表" })
    const first = screen.getByRole("button", { name: "第一项" })
    const second = screen.getByRole("button", { name: "第二项" })
    const hover = workspace.querySelector<HTMLElement>(".workspace-list-hover")!
    bounds(workspace, 0, 0, 400, 600)
    bounds(list, 0, 0, 160, 600)
    bounds(first, 10, 40, 140, 48)
    bounds(second, 10, 110, 140, 68)

    fireEvent.pointerMove(first, { pointerType: "mouse" })
    expect(hover).toHaveAttribute("data-visible", "true")
    expect(hover).toHaveAttribute("data-sliding", "false")
    expect(hover.style.clipPath).toBe("inset(40px 250px 512px 10px round 12px)")
    expect(hover.parentElement).toBe(workspace)

    fireEvent.pointerMove(second, { pointerType: "mouse" })
    expect(workspace.querySelector(".workspace-list-hover")).toBe(hover)
    expect(hover).toHaveAttribute("data-sliding", "true")
    expect(hover.style.clipPath).toBe("inset(110px 250px 422px 10px round 12px)")

    fireEvent.scroll(list)
    expect(hover).toHaveAttribute("data-visible", "false")
    expect(hover).toHaveAttribute("data-instant", "true")
    fireEvent.pointerMove(first, { pointerType: "mouse" })
    fireEvent(window, new Event("resize"))
    expect(hover).toHaveAttribute("data-visible", "false")
    expect(hover).toHaveAttribute("data-instant", "true")
  })

  it("跟踪区域限制在内部滚动容器的可见范围", () => {
    render(<div data-testid="workspace"><WorkspaceList aria-label="列表"><div data-testid="scroll" style={{ overflowY: "auto" }}><button className="list-entry">部分可见条目</button></div></WorkspaceList></div>)
    const workspace = screen.getByTestId("workspace")
    bounds(workspace, 0, 0, 400, 600)
    bounds(screen.getByRole("complementary", { name: "列表" }), 0, 0, 160, 600)
    bounds(screen.getByTestId("scroll"), 0, 50, 160, 60)
    bounds(screen.getByRole("button", { name: "部分可见条目" }), 10, 20, 140, 70)

    fireEvent.pointerMove(screen.getByRole("button", { name: "部分可见条目" }), { pointerType: "mouse" })
    expect(workspace.querySelector<HTMLElement>(".workspace-list-hover")!.style.clipPath).toBe("inset(50px 250px 510px 10px round 12px)")
  })

  it("触摸移动不产生悬停背景", () => {
    render(<div data-testid="workspace"><WorkspaceList aria-label="列表"><button className="list-entry">第一项</button></WorkspaceList></div>)
    fireEvent.pointerMove(screen.getByRole("button", { name: "第一项" }), { pointerType: "touch" })
    expect(screen.getByTestId("workspace").querySelector(".workspace-list-hover")).toHaveAttribute("data-visible", "false")
  })
})
