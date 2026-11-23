import type {} from "@testing-library/jest-dom/vitest"
import { fireEvent, render, screen, within } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest"
import { SearchDatePicker } from "./SearchDatePicker"

const timestamp = (day: number, hour = 10, minute = 30) => new Date(2026, 10, day, hour, minute).getTime()
const addedMethods: string[] = []
beforeAll(() => {
  document.documentElement.dataset.reducedMotion = "true"
  for (const method of ["scrollIntoView", "hasPointerCapture", "setPointerCapture", "releasePointerCapture"]) if (!(method in HTMLElement.prototype)) {
    Object.defineProperty(HTMLElement.prototype, method, { configurable: true, value: method === "hasPointerCapture" ? () => false : () => {} })
    addedMethods.push(method)
  }
  if (!globalThis.ResizeObserver) vi.stubGlobal("ResizeObserver", class { observe() {} unobserve() {} disconnect() {} })
})
afterAll(() => { for (const method of addedMethods) Reflect.deleteProperty(HTMLElement.prototype, method); vi.unstubAllGlobals(); delete document.documentElement.dataset.reducedMotion })

describe("搜索日历", () => {
  it("起始日历禁用结束后的日期，仅显示日期且无时分选择", async () => {
    const onChange = vi.fn()
    render(<SearchDatePicker label="开始" value={timestamp(22)} max={timestamp(22) + 123} onValueChange={onChange} onClear={vi.fn()} />)
    expect(screen.getByRole("button", { name: "开始" })).toHaveTextContent("2026/11/22")
    expect(screen.getByRole("button", { name: "开始" }).querySelector("small")).toBeNull()
    await userEvent.click(screen.getByRole("button", { name: "开始" }))
    expect(screen.getByRole("button", { name: "2026年11月23日" })).toBeDisabled()
    expect(screen.getByRole("button", { name: "2026年11月22日" })).toBeEnabled()
    expect(screen.queryByRole("combobox", { name: "选择小时" })).not.toBeInTheDocument()
    expect(screen.queryByRole("combobox", { name: "选择分钟" })).not.toBeInTheDocument()
    await userEvent.click(screen.getByRole("button", { name: "确定" }))
    expect(onChange).toHaveBeenCalledWith(new Date(2026, 10, 22).getTime())
    expect(screen.queryByRole("alert")).not.toBeInTheDocument()
  })

  it("结束日历禁用起始前的日期，同一天可选并包含整天，结束不能清空", async () => {
    const onChange = vi.fn()
    render(<SearchDatePicker label="结束" value={timestamp(23, 8)} min={timestamp(22) + 456} onValueChange={onChange} onCurrent={vi.fn()} />)
    await userEvent.click(screen.getByRole("button", { name: "结束" }))
    expect(screen.getByRole("button", { name: "2026年11月21日" })).toBeDisabled()
    await userEvent.click(screen.getByRole("button", { name: "2026年11月22日" }))
    await userEvent.click(screen.getByRole("button", { name: "确定" }))
    expect(onChange).toHaveBeenCalledWith(new Date(2026, 10, 23).getTime() - 1)
    expect(screen.queryByRole("button", { name: "清空" })).not.toBeInTheDocument()
  })

  it("方向键与跨月导航保留单一键盘焦点，Escape 不向外传播且不修改日期", async () => {
    const onChange = vi.fn()
    const outsideEscape = vi.fn()
    render(<div onKeyDown={outsideEscape}><SearchDatePicker label="开始" value={timestamp(30)} onValueChange={onChange} /></div>)
    const trigger = screen.getByRole("button", { name: "开始" })
    await userEvent.click(trigger)
    const selected = screen.getByRole("button", { name: "2026年11月30日" })
    expect(selected).toHaveFocus()
    fireEvent.keyDown(selected, { key: "ArrowRight" })
    expect(screen.getByRole("button", { name: "2026年12月1日" })).toHaveFocus()
    expect(within(screen.getByRole("grid")).getAllByRole("button").filter((button) => button.tabIndex === 0)).toHaveLength(1)
    outsideEscape.mockClear()
    await userEvent.keyboard("{Escape}")
    expect(outsideEscape).not.toHaveBeenCalled()
    expect(onChange).not.toHaveBeenCalled()
    expect(trigger).toHaveFocus()
  })
})
