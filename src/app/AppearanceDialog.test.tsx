import { fireEvent, render, screen, waitFor } from "@testing-library/react"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { ipc } from "./ipc"
import { AppearanceDialog } from "./AppearanceDialog"
import { GENERATION, snapshot } from "@/features/chat/chat.test-fixtures"

vi.mock("./ipc", () => ({
  errorMessage: (error: unknown) => error instanceof Error ? error.message : "测试失败",
  ipc: { saveAppearance: vi.fn() },
}))

beforeEach(() => vi.resetAllMocks())

describe("外观设置", () => {
  it("通过 IPC 客户端方法保存主题、减少动画和乐观版本", async () => {
    const saved = { theme: "dark" as const, reduce_motion: true, revision: "2" }
    vi.mocked(ipc.saveAppearance).mockResolvedValue(saved)
    const onSaved = vi.fn()
    render(<AppearanceDialog open onOpenChange={vi.fn()} snapshot={snapshot()} onSaved={onSaved} onExit={vi.fn()} />)
    fireEvent.click(screen.getByRole("radio", { name: "深色" }))
    fireEvent.click(screen.getByRole("checkbox", { name: "减少动画" }))
    fireEvent.click(screen.getByRole("button", { name: "保存外观" }))
    await screen.findByText("外观已保存")
    expect(ipc.saveAppearance).toHaveBeenCalledWith(expect.objectContaining({ data_generation_id: GENERATION, expected_revision: "1", theme: "dark", reduce_motion: true }))
    expect(onSaved).toHaveBeenCalledWith(saved, GENERATION)
  })

  it("同一保存失败重试复用请求标识", async () => {
    vi.mocked(ipc.saveAppearance).mockRejectedValueOnce(new Error("临时读写失败")).mockResolvedValue({ theme: "system", reduce_motion: false, revision: "2" })
    render(<AppearanceDialog open onOpenChange={vi.fn()} snapshot={snapshot()} onSaved={vi.fn()} onExit={vi.fn()} />)
    fireEvent.click(screen.getByRole("button", { name: "保存外观" }))
    await screen.findByText("临时读写失败")
    fireEvent.click(screen.getByRole("button", { name: "保存外观" }))
    await waitFor(() => expect(ipc.saveAppearance).toHaveBeenCalledTimes(2))
    expect(vi.mocked(ipc.saveAppearance).mock.calls[1]?.[0].client_request_id).toBe(vi.mocked(ipc.saveAppearance).mock.calls[0]?.[0].client_request_id)
  })
})
