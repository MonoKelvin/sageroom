import type {} from "@testing-library/jest-dom/vitest"
import { fireEvent, render, screen, waitFor, within } from "@testing-library/react"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { ipc } from "@/app/ipc"
import { GroupInfoDrawer } from "./GroupInfoDrawer"
import { GENERATION, snapshot } from "./chat.test-fixtures"

vi.mock("@/app/ipc", () => ({ ipc: { saveRoom: vi.fn() }, errorMessage: (error: Error) => error.message }))
beforeEach(() => vi.resetAllMocks())
afterEach(() => document.querySelectorAll("[data-drawer-test]").forEach((node) => node.remove()))

function mount(value = snapshot()) {
  const container = document.createElement("div")
  container.dataset.drawerTest = "true"
  document.body.append(container)
  const onRoomChange = vi.fn()
  render(<GroupInfoDrawer snapshot={value} container={container} open onOpenChange={vi.fn()} onRoomChange={onRoomChange} onManageAgents={vi.fn()} onReturnFocus={vi.fn()} />)
  return { onRoomChange }
}

describe("群信息抽屉", () => {
  it("成员区域只展示头像和名称，群主可以应用群名", async () => {
    const value = snapshot()
    const next = { ...value.room, name: "新群名称", version: "2" }
    vi.mocked(ipc.saveRoom).mockResolvedValue(next)
    const { onRoomChange } = mount(value)
    const members = screen.getByRole("list", { name: "群成员" })
    expect(within(members).getAllByRole("listitem")).toHaveLength(2)
    expect(within(members).queryByText("群聊成员")).not.toBeInTheDocument()
    expect(screen.queryByRole("textbox", { name: "群名称" })).not.toBeInTheDocument()
    fireEvent.click(screen.getByRole("button", { name: "编辑群名称" }))
    const name = screen.getByRole("textbox", { name: "群名称" })
    fireEvent.change(name, { target: { value: " 新群名称 " } })
    fireEvent.keyDown(name, { key: "Enter" })
    await waitFor(() => expect(onRoomChange).toHaveBeenCalledWith(next, GENERATION))
    expect(ipc.saveRoom).toHaveBeenCalledWith(expect.objectContaining({ data_generation_id: GENERATION, expected_version: "1", name: "新群名称" }))
  })

  it("普通成员只读群名", () => {
    mount(snapshot({ room: { ...snapshot().room, owner_participant_id: "sage-test" } }))
    expect(screen.queryByRole("textbox", { name: "群名称" })).not.toBeInTheDocument()
    expect(screen.queryByRole("button", { name: "编辑群名称" })).not.toBeInTheDocument()
    expect(screen.getByText("Sageroom")).toBeInTheDocument()
    expect(ipc.saveRoom).not.toHaveBeenCalled()
  })

  it("保存失败保留编辑内容并显示错误", async () => {
    vi.mocked(ipc.saveRoom).mockRejectedValue(new Error("群资料已更新"))
    const { onRoomChange } = mount()
    fireEvent.click(screen.getByRole("button", { name: "编辑群名称" }))
    const name = screen.getByRole("textbox", { name: "群名称" })
    fireEvent.change(name, { target: { value: "保留草稿" } })
    fireEvent.keyDown(name, { key: "Enter" })
    expect(await screen.findByRole("alert")).toHaveTextContent("群资料已更新")
    expect(name).toHaveValue("保留草稿")
    expect(onRoomChange).not.toHaveBeenCalled()
  })
})
