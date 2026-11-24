import { describe, expect, it } from "vitest"
import { suppressFileDrop } from "./file-drop-guard"

function dragEvent(type: string, types: string[]) {
  const event = new Event(type, { bubbles: true, cancelable: true }) as DragEvent
  Object.defineProperty(event, "dataTransfer", { value: { types } })
  return event
}

describe("suppressFileDrop", () => {
  it("阻止拖入文件的 dragover 与 drop，避免 WebView2 导航", () => {
    const dispose = suppressFileDrop(window)
    const over = dragEvent("dragover", ["Files"])
    const drop = dragEvent("drop", ["Files"])
    document.body.dispatchEvent(over)
    document.body.dispatchEvent(drop)
    expect(over.defaultPrevented).toBe(true)
    expect(drop.defaultPrevented).toBe(true)
    dispose()
  })

  it("文本拖拽不受影响，保留输入框内的移动与插入", () => {
    const dispose = suppressFileDrop(window)
    const over = dragEvent("dragover", ["text/plain"])
    const drop = dragEvent("drop", ["text/plain"])
    document.body.dispatchEvent(over)
    document.body.dispatchEvent(drop)
    expect(over.defaultPrevented).toBe(false)
    expect(drop.defaultPrevented).toBe(false)
    dispose()
  })

  it("移除监听后不再阻止文件拖放", () => {
    const dispose = suppressFileDrop(window)
    dispose()
    const drop = dragEvent("drop", ["Files"])
    document.body.dispatchEvent(drop)
    expect(drop.defaultPrevented).toBe(false)
  })
})
