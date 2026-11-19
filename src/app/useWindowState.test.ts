import { act, renderHook, waitFor } from "@testing-library/react"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { useWindowState } from "./useWindowState"

const mocks = vi.hoisted(() => ({
  desktop: vi.fn(),
  isMaximized: vi.fn(),
  scaleFactor: vi.fn(),
  onResized: vi.fn(),
  minimize: vi.fn(),
  toggleMaximize: vi.fn(),
  close: vi.fn(),
  startDragging: vi.fn(),
  unlisten: vi.fn(),
}))

vi.mock("./ipc", () => ({ isDesktopEnvironment: mocks.desktop }))
vi.mock("@tauri-apps/api/window", () => ({ getCurrentWindow: () => mocks }))

beforeEach(() => {
  vi.resetAllMocks()
  mocks.desktop.mockReturnValue(true)
  mocks.isMaximized.mockResolvedValue(false)
  mocks.scaleFactor.mockResolvedValue(1)
  mocks.onResized.mockResolvedValue(mocks.unlisten)
  for (const action of [mocks.minimize, mocks.toggleMaximize, mocks.close, mocks.startDragging]) action.mockResolvedValue(undefined)
})

describe("原生窗口状态", () => {
  it("读取初始最大化状态，原生尺寸变化时刷新并清理监听", async () => {
    let onResize!: () => void
    mocks.isMaximized.mockResolvedValue(true)
    mocks.onResized.mockImplementation((callback: () => void) => {
      onResize = callback
      return Promise.resolve(mocks.unlisten)
    })
    const { result, unmount } = renderHook(useWindowState)
    await waitFor(() => expect(result.current.maximized).toBe(true))
    mocks.isMaximized.mockResolvedValue(false)
    await act(async () => onResize())
    expect(result.current.maximized).toBe(false)
    unmount()
    expect(mocks.unlisten).toHaveBeenCalledOnce()
  })

  it("最大化操作完成后再次查询，而非本地反转状态", async () => {
    const { result } = renderHook(useWindowState)
    await waitFor(() => expect(mocks.isMaximized).toHaveBeenCalledOnce())
    mocks.isMaximized.mockResolvedValue(true)
    await act(async () => result.current.perform("maximize"))
    expect(mocks.toggleMaximize).toHaveBeenCalledOnce()
    expect(result.current.maximized).toBe(true)
    await act(async () => result.current.perform("close"))
    expect(mocks.close).toHaveBeenCalledOnce()
  })

  it("同步原生 DPI 比例，供 CSS 轮廓抵消 WebView 缩放", async () => {
    mocks.scaleFactor.mockResolvedValue(2)
    const { result } = renderHook(useWindowState)
    await waitFor(() => expect(result.current.nativeScale).toBe(2))
  })

  it("浏览器环境不伪造原生操作成功", async () => {
    mocks.desktop.mockReturnValue(false)
    const { result } = renderHook(useWindowState)
    await act(async () => result.current.perform("minimize"))
    expect(mocks.minimize).not.toHaveBeenCalled()
    expect(mocks.onResized).not.toHaveBeenCalled()
    expect(result.current.error).toContain("桌面应用")
  })

  it("卸载后才注册成功的监听也会立即释放", async () => {
    let complete!: (unlisten: () => void) => void
    mocks.onResized.mockReturnValue(new Promise((resolve) => { complete = resolve }))
    const { unmount } = renderHook(useWindowState)
    unmount()
    await act(async () => complete(mocks.unlisten))
    expect(mocks.unlisten).toHaveBeenCalledOnce()
  })
})
