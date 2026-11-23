import type {} from "@testing-library/jest-dom/vitest"
import { act, fireEvent, render, screen } from "@testing-library/react"
import { describe, expect, it, vi } from "vitest"
import { suppressNativeContextMenu } from "@/app/native-context-menu"
import { ContextMenu, type ContextMenuItem } from "./context-menu"

function mount(items: ContextMenuItem[], props: Partial<Parameters<typeof ContextMenu>[0]> = {}) {
  return render(
    <ContextMenu items={items} label="测试菜单" {...props}>
      <div data-testid="trigger">右键目标</div>
    </ContextMenu>,
  )
}

async function rightClick(element: HTMLElement, clientX = 20, clientY = 20) {
  await act(async () => { fireEvent.contextMenu(element, { clientX, clientY }) })
}

function fakeRect(left: number, top: number, right: number, bottom: number): DOMRect {
  return { left, top, right, bottom, width: right - left, height: bottom - top, x: left, y: top, toJSON: () => ({}) } as DOMRect
}

describe("ContextMenu", () => {
  it("右键触发元素时在指针位置弹出菜单，左键点击不弹出", async () => {
    mount([{ key: "copy", label: "复制" }])
    const trigger = screen.getByTestId("trigger")
    fireEvent.click(trigger)
    expect(screen.queryByRole("menu")).not.toBeInTheDocument()
    await rightClick(trigger)
    expect(screen.getByRole("menu", { name: "测试菜单" })).toBeInTheDocument()
    expect(screen.getByRole("menuitem", { name: "复制" })).toBeInTheDocument()
    expect(trigger).toHaveAttribute("aria-haspopup", "menu")
    expect(trigger).toHaveAttribute("aria-expanded", "true")
    const menu = screen.getByRole("menu")
    expect(menu.style.left).toBe("20px")
    expect(menu.style.top).toBe("20px")
  })

  it("菜单跟随指针并限制在传入的边界内，不会溢出边界", async () => {
    const rectSpy = vi.spyOn(HTMLElement.prototype, "getBoundingClientRect").mockImplementation(function (this: HTMLElement) {
      if (this.classList.contains("context-menu-content")) return fakeRect(0, 0, 220, 130)
      if (this.dataset.testid === "boundary") return fakeRect(0, 0, 300, 200)
      return fakeRect(0, 0, 0, 0)
    })
    try {
      render(
        <>
          <div data-testid="boundary" />
          <ContextMenu items={[{ key: "copy", label: "复制" }]} label="测试菜单" boundary={() => screen.getByTestId("boundary")}>
            <div data-testid="trigger">右键目标</div>
          </ContextMenu>
        </>,
      )
      // 指针靠近边界右下角，菜单需向左上回收以保证完整可见。
      await rightClick(screen.getByTestId("trigger"), 290, 190)
      const menu = screen.getByRole("menu")
      expect(menu.style.left).toBe("68px") // 300 - 12 - 220
      expect(menu.style.top).toBe("58px")  // 200 - 12 - 130
      expect(menu.style.maxHeight).toBe("176px") // 200 - 12 * 2
      // 指针远离边界时直接跟随指针。
      await act(async () => { fireEvent.keyDown(document, { key: "Escape" }) })
      await rightClick(screen.getByTestId("trigger"), 40, 30)
      const reopened = screen.getByRole("menu")
      expect(reopened.style.left).toBe("40px")
      expect(reopened.style.top).toBe("30px")
    } finally {
      rectSpy.mockRestore()
    }
  })

  it("菜单打开时阻止原生右键菜单的默认行为", async () => {
    mount([{ key: "copy", label: "复制" }])
    const event = new MouseEvent("contextmenu", { bubbles: true, cancelable: true })
    await act(async () => { screen.getByTestId("trigger").dispatchEvent(event) })
    expect(event.defaultPrevented).toBe(true)
  })

  it("点击菜单项执行 onSelect 并关闭菜单", async () => {
    const onSelect = vi.fn()
    mount([{ key: "copy", label: "复制", onSelect }])
    await rightClick(screen.getByTestId("trigger"))
    await act(async () => { fireEvent.click(screen.getByRole("menuitem", { name: "复制" })) })
    expect(onSelect).toHaveBeenCalledTimes(1)
    expect(screen.queryByRole("menu")).not.toBeInTheDocument()
  })

  it("Esc 与点击菜单外部分别关闭菜单", async () => {
    mount([{ key: "copy", label: "复制" }])
    await rightClick(screen.getByTestId("trigger"))
    await act(async () => { fireEvent.keyDown(document, { key: "Escape" }) })
    expect(screen.queryByRole("menu")).not.toBeInTheDocument()
    await rightClick(screen.getByTestId("trigger"))
    await act(async () => { fireEvent.pointerDown(document.body) })
    expect(screen.queryByRole("menu")).not.toBeInTheDocument()
  })

  it("禁用项不可选，键盘方向键在可用项之间循环", async () => {
    const onSelect = vi.fn()
    mount([
      { key: "copy", label: "复制", onSelect },
      { key: "recall", label: "撤回", disabled: true },
      { key: "quote", label: "引用" },
    ])
    await rightClick(screen.getByTestId("trigger"))
    const menu = screen.getByRole("menu")
    expect(screen.getByRole("menuitem", { name: "复制" })).toHaveFocus()
    fireEvent.keyDown(menu, { key: "ArrowDown" })
    expect(screen.getByRole("menuitem", { name: "引用" })).toHaveFocus()
    fireEvent.keyDown(menu, { key: "ArrowDown" })
    expect(screen.getByRole("menuitem", { name: "复制" })).toHaveFocus()
    fireEvent.click(screen.getByRole("menuitem", { name: "撤回" }))
    expect(onSelect).not.toHaveBeenCalled()
  })

  it("disabled 时右键不弹出菜单；items 为空也不弹出", async () => {
    const { rerender } = mount([{ key: "copy", label: "复制" }], { disabled: true })
    await rightClick(screen.getByTestId("trigger"))
    expect(screen.queryByRole("menu")).not.toBeInTheDocument()
    rerender(<ContextMenu items={[]} label="测试菜单"><div data-testid="trigger">右键目标</div></ContextMenu>)
    await rightClick(screen.getByTestId("trigger"))
    expect(screen.queryByRole("menu")).not.toBeInTheDocument()
  })

  it("关闭时默认把焦点交还触发元素，onCloseAutoFocus 可阻止", async () => {
    const onCloseAutoFocus = vi.fn((event: { preventDefault: () => void }) => { event.preventDefault() })
    const { rerender } = mount([{ key: "copy", label: "复制" }])
    await rightClick(screen.getByTestId("trigger"))
    await act(async () => { fireEvent.keyDown(document, { key: "Escape" }) })
    expect(screen.getByTestId("trigger")).toHaveFocus()
    rerender(
      <ContextMenu items={[{ key: "copy", label: "复制" }]} label="测试菜单" onCloseAutoFocus={onCloseAutoFocus}>
        <div data-testid="trigger">右键目标</div>
      </ContextMenu>,
    )
    await rightClick(screen.getByTestId("trigger"))
    await act(async () => { fireEvent.keyDown(document, { key: "Escape" }) })
    expect(onCloseAutoFocus).toHaveBeenCalledTimes(1)
    expect(screen.getByTestId("trigger")).not.toHaveFocus()
  })

  it("装上全局原生菜单抑制后，右键触发元素仍能弹出应用内菜单（回归：全局 capture 监听不能吃掉菜单）", async () => {
    const dispose = suppressNativeContextMenu(window)
    try {
      mount([{ key: "copy", label: "复制" }])
      const trigger = screen.getByTestId("trigger")
      const event = new MouseEvent("contextmenu", { bubbles: true, cancelable: true, clientX: 30, clientY: 30 })
      await act(async () => { trigger.dispatchEvent(event) })
      expect(screen.getByRole("menu", { name: "测试菜单" })).toBeInTheDocument()
      // 触发元素上的右键仍要阻止原生菜单（由 ContextMenu 自己 preventDefault）。
      expect(event.defaultPrevented).toBe(true)
      // 其余位置仍被全局抑制。
      const elsewhere = new MouseEvent("contextmenu", { bubbles: true, cancelable: true })
      await act(async () => { document.body.dispatchEvent(elsewhere) })
      expect(elsewhere.defaultPrevented).toBe(true)
    } finally {
      dispose()
    }
  })
})
