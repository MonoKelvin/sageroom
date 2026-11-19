import { act, renderHook, waitFor } from "@testing-library/react"
import { StrictMode, type ReactNode } from "react"
import { describe, expect, it, vi } from "vitest"
import { IpcError } from "@/app/ipc"
import { useLocalEditor } from "./useLocalEditor"

type Value = { revision: string; name: string }
const initial = { revision: "1", name: "原名" }
const load = async (): Promise<Value> => initial

function deferred<T>() {
  let resolve!: (value: T) => void
  const promise = new Promise<T>((done) => { resolve = done })
  return { promise, resolve }
}

describe("本地资料编辑器", () => {
  it("首次激活才读取，导航保留草稿且不重复读取", async () => {
    const read = vi.fn(load)
    const { result, rerender } = renderHook(({ active }) => useLocalEditor({ active, load: read }), { initialProps: { active: false } })
    expect(read).not.toHaveBeenCalled()
    rerender({ active: true })
    await waitFor(() => expect(result.current.draft?.name).toBe("原名"))
    act(() => result.current.edit({ revision: "1", name: "草稿" }))
    rerender({ active: false }); rerender({ active: true })
    expect(read).toHaveBeenCalledTimes(1)
    expect(result.current.draft?.name).toBe("草稿")
  })
  it("失败保存保留草稿，原样重试复用请求 ID，编辑后使用新 ID", async () => {
    const write = vi.fn<(_draft: Value, _id: string, _revision: string) => Promise<Value>>().mockRejectedValue(new Error("失败"))
    const { result } = renderHook(() => useLocalEditor({ active: true, load, initial }))
    act(() => result.current.edit({ revision: "1", name: "草稿" }))
    await act(async () => { await result.current.save(write); await result.current.save(write) })
    expect(result.current.draft?.name).toBe("草稿")
    expect(write.mock.calls[0][1]).toBe(write.mock.calls[1][1])
    act(() => result.current.edit({ revision: "1", name: "新草稿" }))
    await act(async () => { await result.current.save(write) })
    expect(write.mock.calls[2][1]).not.toBe(write.mock.calls[1][1])
  })
  it("晚返回不覆盖新编辑，但更新下一次保存的版本", async () => {
    const pending = deferred<Value>()
    const write = vi.fn<(_draft: Value, _id: string, _revision: string) => Promise<Value>>().mockReturnValueOnce(pending.promise).mockResolvedValue({ revision: "3", name: "新编辑" })
    const { result } = renderHook(() => useLocalEditor({ active: true, load, initial }))
    let saving!: Promise<Value | undefined>
    act(() => { saving = result.current.save(write) })
    act(() => result.current.edit({ revision: "1", name: "新编辑" }))
    await act(async () => { pending.resolve({ revision: "2", name: "原名" }); await saving })
    expect(result.current.draft).toEqual({ revision: "2", name: "新编辑" })
    await act(async () => { await result.current.save(write) })
    expect(write.mock.calls[1][2]).toBe("2")
  })
  it("版本冲突保留编辑，重新读取必须内联确认丢稿", async () => {
    const write = vi.fn().mockRejectedValue(new IpcError({ code: "CONFIG_CONFLICT", message: "版本冲突", retryability: "after_user_action", field_path: null, trace_id: "trace", may_have_been_charged: false }))
    const read = vi.fn(load)
    const { result } = renderHook(() => useLocalEditor({ active: true, load: read, initial }))
    act(() => result.current.edit({ revision: "1", name: "草稿" }))
    await act(async () => { await result.current.save(write) })
    expect(result.current.conflict).toBe(true)
    act(() => result.current.requestReload())
    expect(result.current.confirmReload).toBe(true)
    expect(read).not.toHaveBeenCalled()
    await act(async () => { await result.current.reload() })
    expect(result.current.draft?.name).toBe("原名")
  })
  it("世代组件卸载后忽略晚返回", async () => {
    const pending = deferred<Value>()
    const { result, unmount } = renderHook(() => useLocalEditor({ active: true, load, initial }))
    let saving!: Promise<Value | undefined>
    act(() => { saving = result.current.save(() => pending.promise) })
    unmount()
    pending.resolve({ revision: "2", name: "旧世代" })
    expect(await saving).toBeUndefined()
  })
  it("StrictMode 生命周期重放不让读取永久卡住", async () => {
    const read = vi.fn(load)
    const wrapper = ({ children }: { children: ReactNode }) => <StrictMode>{children}</StrictMode>
    const { result } = renderHook(() => useLocalEditor({ active: true, load: read }), { wrapper })
    await waitFor(() => expect(result.current.draft?.name).toBe("原名"))
    expect(result.current.loading).toBe(false)
  })
  it("刷新凭据版本保留普通参数草稿，忽略较旧的刷新响应", () => {
    const { result } = renderHook(() => useLocalEditor({ active: true, load, initial }))
    act(() => result.current.edit({ revision: "1", name: "草稿" }))
    act(() => result.current.ingestServer({ revision: "3", name: "原名" }))
    act(() => result.current.ingestServer({ revision: "2", name: "旧资料" }))
    expect(result.current.draft).toEqual({ revision: "3", name: "草稿" })
  })
})
