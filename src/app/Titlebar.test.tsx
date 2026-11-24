import type {} from "@testing-library/jest-dom/vitest"
import { fireEvent, render, screen } from "@testing-library/react"
import { describe, expect, it, vi } from "vitest"
import { Titlebar } from "./Titlebar"

describe("应用标题栏", () => {
  it("只提供最小化、最大化和关闭三个原生动作", () => {
    const onAction = vi.fn().mockResolvedValue(undefined)
    render(<Titlebar maximized={false} onAction={onAction} />)
    expect(screen.getAllByRole("button")).toHaveLength(3)
    fireEvent.click(screen.getByRole("button", { name: "最小化窗口" }))
    fireEvent.click(screen.getByRole("button", { name: "最大化窗口" }))
    fireEvent.click(screen.getByRole("button", { name: "关闭到托盘" }))
    expect(onAction.mock.calls.map(([action]) => action)).toEqual(["minimize", "maximize", "close"])
  })

  it("最大化后显示还原操作，点击按钮中的图标不拖动窗口", () => {
    const onAction = vi.fn().mockResolvedValue(undefined)
    render(<Titlebar maximized onAction={onAction} />)
    const button = screen.getByRole("button", { name: "还原窗口" })
    const icon = button.querySelector("svg")!
    fireEvent.mouseDown(icon, { button: 0, detail: 1 })
    fireEvent.doubleClick(icon)
    expect(onAction).not.toHaveBeenCalled()
    fireEvent.click(button)
    expect(onAction).toHaveBeenCalledWith("maximize")
  })

  it("空白标题区域可拖动和双击，右键不触发拖动", () => {
    const onAction = vi.fn().mockResolvedValue(undefined)
    render(<Titlebar maximized={false} onAction={onAction} />)
    const identity = document.querySelector(".titlebar-identity") as HTMLElement
    fireEvent.mouseDown(identity, { button: 2, detail: 1 })
    expect(onAction).not.toHaveBeenCalled()
    fireEvent.mouseDown(identity, { button: 0, detail: 1 })
    fireEvent.doubleClick(identity)
    expect(onAction.mock.calls.map(([action]) => action)).toEqual(["drag", "maximize"])
  })
})
