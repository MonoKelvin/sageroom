import { StrictMode } from "react"
import { act, fireEvent, render, screen, waitFor } from "@testing-library/react"
import { beforeEach, describe, expect, it, vi } from "vitest"
import type { AppLifecycleEvent, UserProfile } from "@/contracts/generated"
import { snapshot } from "@/features/chat/chat.test-fixtures"
import { ConfigurationProvider } from "./ConfigurationProvider"
import { useAppliedResource, useConfiguration, useConfigurationRuntime } from "./configurationContext"
import { ipc, IpcError } from "./ipc"

vi.mock("./ipc", async (original) => {
  const actual = await original<typeof import("./ipc")>()
  return { ...actual, isDesktopEnvironment: () => true, ipc: { ...actual.ipc, getUserProfile: vi.fn(), saveUserProfile: vi.fn(), subscribeLifecycle: vi.fn(), completeExit: vi.fn(), exit: vi.fn() } }
})
let receive: (event: AppLifecycleEvent) => void
const initial: UserProfile = { participant_id: "user-test", display_name: "我", avatar_id: null, bio: "", revision: "1" }
beforeEach(() => {
  vi.clearAllMocks()
  vi.mocked(ipc.getUserProfile).mockResolvedValue(initial)
  vi.mocked(ipc.saveUserProfile).mockImplementation(async (request) => ({ ...initial, display_name: request.display_name, bio: request.bio, revision: String(BigInt(request.expected_revision) + 1n) }))
  vi.mocked(ipc.subscribeLifecycle).mockImplementation(async (callback) => { receive = callback; return vi.fn<() => void>() })
  vi.mocked(ipc.completeExit).mockResolvedValue({ shutting_down: true })
})
function Probe() {
  const store = useConfiguration()
  const value = useAppliedResource(store.user).value
  const runtime = useConfigurationRuntime()
  return <><p>{value?.display_name}</p><button onClick={() => void store.updateUser({ display_name: "已应用值" }).catch(() => {})}>应用值</button><p>{runtime.exiting ? "退出准备中" : "可继续编辑"}</p>{runtime.error && <p role="alert">{runtime.error}</p>}</>
}
function prepare(id = "exit-a"): AppLifecycleEvent { return { schema_version: "0.3", data_generation_id: "generation-test", payload: { kind: "exit_prepare", request_id: id } } }

describe("设置持久化与退出准备握手", () => {
  it("StrictMode重订阅不会永久销毁当前世代资源", async () => {
    render(<StrictMode><ConfigurationProvider snapshot={snapshot()}><Probe /></ConfigurationProvider></StrictMode>)
    await screen.findByText("我")
    fireEvent.click(screen.getByRole("button", { name: "应用值" }))
    await screen.findByText("已应用值")
    await waitFor(() => expect(ipc.saveUserProfile).toHaveBeenCalledOnce())
  })

  it("已应用修改写入完成后才ready，重复准备事件不重复确认", async () => {
    let complete!: (profile: UserProfile) => void
    vi.mocked(ipc.saveUserProfile).mockReturnValue(new Promise((resolve) => { complete = resolve }))
    render(<ConfigurationProvider snapshot={snapshot()}><Probe /></ConfigurationProvider>)
    await screen.findByText("我")
    fireEvent.click(screen.getByRole("button", { name: "应用值" }))
    await waitFor(() => expect(ipc.saveUserProfile).toHaveBeenCalledOnce())
    act(() => { receive(prepare()); receive(prepare()) })
    expect(ipc.completeExit).not.toHaveBeenCalled()
    expect(screen.getByText("退出准备中")).toBeInTheDocument()
    await act(async () => complete({ ...initial, display_name: "已应用值", revision: "2" }))
    await waitFor(() => expect(ipc.completeExit).toHaveBeenCalledOnce())
    expect(ipc.completeExit).toHaveBeenCalledWith({ data_generation_id: "generation-test", request_id: "exit-a", ready: true })
  })

  it("失败的未落盘修改拒绝退出并恢复编辑，而不是假成功", async () => {
    const error = new IpcError({ code: "DB_BUSY", message: "数据库暂时忙碌", retryability: "retry", field_path: null, trace_id: "test", may_have_been_charged: false })
    vi.mocked(ipc.saveUserProfile).mockRejectedValue(error)
    render(<ConfigurationProvider snapshot={snapshot()}><Probe /></ConfigurationProvider>)
    await screen.findByText("我")
    fireEvent.click(screen.getByRole("button", { name: "应用值" }))
    await waitFor(() => expect(ipc.saveUserProfile).toHaveBeenCalledOnce())
    await act(async () => { receive(prepare()) })
    await waitFor(() => expect(ipc.completeExit).toHaveBeenCalledWith({ data_generation_id: "generation-test", request_id: "exit-a", ready: false }))
    expect(screen.getByText("可继续编辑")).toBeInTheDocument()
    expect(screen.getByRole("alert")).toHaveTextContent("数据库暂时忙碌")
  })

  it("资料初次读取期间收到的新快照不会被旧读取结果覆盖", async () => {
    let complete!: (profile: UserProfile) => void
    vi.mocked(ipc.getUserProfile).mockReturnValue(new Promise((resolve) => { complete = resolve }))
    const base = snapshot()
    const view = render(<ConfigurationProvider snapshot={base}><Probe /></ConfigurationProvider>)
    await waitFor(() => expect(ipc.getUserProfile).toHaveBeenCalledOnce())
    view.rerender(<ConfigurationProvider snapshot={{ ...base, local_user: { ...base.local_user, display_name: "新快照资料", profile_revision: "2" } }}><Probe /></ConfigurationProvider>)
    await act(async () => complete(initial))
    expect(screen.getByText("新快照资料")).toBeInTheDocument()
    expect(screen.queryByText("我")).not.toBeInTheDocument()
  })

  it("退出等待写入时换世代，新资源不继承旧退出状态", async () => {
    let complete!: (profile: UserProfile) => void
    vi.mocked(ipc.saveUserProfile).mockReturnValue(new Promise((resolve) => { complete = resolve }))
    const base = snapshot()
    const view = render(<ConfigurationProvider snapshot={base}><Probe /></ConfigurationProvider>)
    await screen.findByText("我")
    fireEvent.click(screen.getByRole("button", { name: "应用值" }))
    await waitFor(() => expect(ipc.saveUserProfile).toHaveBeenCalledOnce())
    act(() => receive(prepare()))
    expect(screen.getByText("退出准备中")).toBeInTheDocument()
    vi.mocked(ipc.getUserProfile).mockResolvedValue({ ...initial, display_name: "新世代资料" })
    view.rerender(<ConfigurationProvider snapshot={{ ...base, data_generation_id: "new-generation" }}><Probe /></ConfigurationProvider>)
    await screen.findByText("新世代资料")
    expect(screen.getByText("可继续编辑")).toBeInTheDocument()
    await act(async () => complete({ ...initial, display_name: "已应用值", revision: "2" }))
    expect(ipc.completeExit).not.toHaveBeenCalled()
    expect(screen.getByText("新世代资料")).toBeInTheDocument()
  })

  it("取消退出使资源解冻，旧数据世代的prepare不能关闭新页面", async () => {
    render(<ConfigurationProvider snapshot={snapshot()}><Probe /></ConfigurationProvider>)
    await screen.findByText("我")
    act(() => receive({ ...prepare(), data_generation_id: "old-generation" }))
    expect(ipc.completeExit).not.toHaveBeenCalled()
    act(() => receive({ schema_version: "0.3", data_generation_id: "generation-test", payload: { kind: "exit_cancelled", request_id: "exit-a", error: { code: "IO_ERROR", message: "准备已取消", retryability: "after_user_action", field_path: null, trace_id: "test", may_have_been_charged: false } } }))
    fireEvent.click(screen.getByRole("button", { name: "应用值" }))
    await waitFor(() => expect(ipc.saveUserProfile).toHaveBeenCalledOnce())
  })
})
