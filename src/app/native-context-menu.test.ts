import { describe, expect, it } from "vitest"
import { suppressNativeContextMenu } from "./native-context-menu"

describe("suppressNativeContextMenu", () => {
  it("任何位置的 contextmenu 事件都被阻止默认行为（不弹出原生右键菜单）", () => {
    const dispose = suppressNativeContextMenu(window)
    const event = new MouseEvent("contextmenu", { bubbles: true, cancelable: true })
    document.body.dispatchEvent(event)
    expect(event.defaultPrevented).toBe(true)
    dispose()
  })

  it("移除监听后不再阻止", () => {
    const dispose = suppressNativeContextMenu(window)
    dispose()
    const event = new MouseEvent("contextmenu", { bubbles: true, cancelable: true })
    document.body.dispatchEvent(event)
    expect(event.defaultPrevented).toBe(false)
  })

  it("应用内自定义菜单的触发元素（data-app-context-menu）不拦截，交给 ContextMenu 自己处理", () => {
    const dispose = suppressNativeContextMenu(window)
    const trigger = document.createElement("article")
    trigger.setAttribute("data-app-context-menu", "true")
    const inner = document.createElement("span")
    trigger.appendChild(inner)
    document.body.appendChild(trigger)
    const event = new MouseEvent("contextmenu", { bubbles: true, cancelable: true })
    inner.dispatchEvent(event)
    expect(event.defaultPrevented).toBe(false)
    trigger.remove()
    dispose()
  })
})
