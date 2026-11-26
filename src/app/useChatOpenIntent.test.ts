import { act, renderHook, waitFor } from "@testing-library/react"
import { listen } from "@tauri-apps/api/event"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { ipc } from "./ipc"
import { useChatOpenIntent } from "./useChatOpenIntent"

vi.mock("@/app/ipc", () => ({
  ipc: { consumeChatOpen: vi.fn() },
  isDesktopEnvironment: () => true,
}))
vi.mock("@tauri-apps/api/event", () => ({ listen: vi.fn(async () => () => {}) }))

describe("托盘打开聊天页意图", () => {
  let emit: () => void

  beforeEach(() => {
    vi.mocked(ipc.consumeChatOpen).mockReset()
    vi.mocked(listen).mockReset()
    vi.mocked(listen).mockImplementation(async (_event, handler) => {
      emit = () => handler({ event: "sageroom-open-chat", id: 0, payload: undefined })
      return () => {}
    })
  })

  it("挂载时领取待处理意图，不依赖注入的 DOM 事件", async () => {
    vi.mocked(ipc.consumeChatOpen).mockResolvedValue({ requested: true })
    const onOpen = vi.fn()

    renderHook(() => useChatOpenIntent(onOpen))

    await waitFor(() => expect(onOpen).toHaveBeenCalledTimes(1))
    expect(ipc.consumeChatOpen).toHaveBeenCalledWith({ data_generation_id: null })
  })

  it("原生事件到达后领取意图", async () => {
    vi.mocked(ipc.consumeChatOpen).mockResolvedValueOnce({ requested: false }).mockResolvedValueOnce({ requested: true })
    const onOpen = vi.fn()

    renderHook(() => useChatOpenIntent(onOpen))
    await waitFor(() => expect(ipc.consumeChatOpen).toHaveBeenCalledTimes(1))
    await act(async () => { emit() })

    await waitFor(() => expect(onOpen).toHaveBeenCalledTimes(1))
    expect(ipc.consumeChatOpen).toHaveBeenCalledTimes(2)
  })

  it("事件丢失时在窗口重新聚焦后补领", async () => {
    vi.mocked(ipc.consumeChatOpen).mockResolvedValueOnce({ requested: false }).mockResolvedValueOnce({ requested: true })
    const onOpen = vi.fn()

    renderHook(() => useChatOpenIntent(onOpen))
    await waitFor(() => expect(ipc.consumeChatOpen).toHaveBeenCalledTimes(1))
    await act(async () => { window.dispatchEvent(new Event("focus")) })

    await waitFor(() => expect(onOpen).toHaveBeenCalledTimes(1))
  })
})
