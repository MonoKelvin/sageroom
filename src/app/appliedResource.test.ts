import { describe, expect, it, vi } from "vitest"
import { AppliedResource } from "./appliedResource"
import { IpcError } from "./ipc"

type Value = { revision: string; name: string; enabled: boolean }
const initial: Value = { revision: "1", name: "原值", enabled: false }
function deferred<T>() { let resolve!: (value: T) => void; const promise = new Promise<T>((done) => { resolve = done }); return { promise, resolve } }
function failure(code: "DB_BUSY" | "CONFIG_CONFLICT" | "IO_ERROR") { return new IpcError({ code, message: "测试未完成", retryability: "retry", field_path: null, trace_id: "test", may_have_been_charged: false }) }

function resource(write = vi.fn(async (value: Value, revision: string) => ({ ...value, revision: String(BigInt(revision) + 1n) })), load = vi.fn(async () => initial)) { return { state: new AppliedResource({ initial, load, write }), write, load } }

describe("设置已应用值的串行持久化", () => {
  it("没有更改不写入，已应用值立即呈现而确认值等待COMMIT", async () => {
    const pending = deferred<Value>()
    const { state, write } = resource(vi.fn(() => pending.promise))
    await state.change((value) => ({ ...value }))
    expect(write).not.toHaveBeenCalled()
    const applied = state.change((value) => ({ ...value, name: "新值" }))
    expect(state.getSnapshot().value?.name).toBe("新值")
    expect(state.getSnapshot().confirmed?.name).toBe("原值")
    expect(state.getSnapshot().status).toBe("pending")
    pending.resolve({ ...initial, revision: "2", name: "新值" })
    await applied
    expect(state.getSnapshot().confirmed?.name).toBe("新值")
  })

  it("迟到回执不覆盖后续字段，下一次写使用成功返回的revision", async () => {
    const pending = deferred<Value>()
    const write = vi.fn<(value: Value, revision: string, requestId: string) => Promise<Value>>().mockImplementationOnce(() => pending.promise).mockImplementation(async (value, revision) => ({ ...value, revision: String(BigInt(revision) + 1n) }))
    const state = new AppliedResource({ initial, load: async () => initial, write })
    const first = state.change((value) => ({ ...value, name: "第一字段" }))
    const second = state.change((value) => ({ ...value, enabled: true }))
    expect(write).toHaveBeenCalledTimes(1)
    pending.resolve({ ...initial, revision: "2", name: "第一字段" })
    await Promise.all([first, second])
    expect(write.mock.calls[1][1]).toBe("2")
    expect(write.mock.calls[1][0]).toMatchObject({ name: "第一字段", enabled: true })
    expect(state.getSnapshot().value?.enabled).toBe(true)
  })

  it("失败不当成功，同载荷重试复用请求ID，后续修改不丢", async () => {
    const write = vi.fn<(value: Value, revision: string, requestId: string) => Promise<Value>>().mockRejectedValueOnce(failure("DB_BUSY")).mockImplementation(async (value, revision) => ({ ...value, revision: String(BigInt(revision) + 1n) }))
    const state = new AppliedResource({ initial, load: async () => initial, write })
    await expect(state.change((value) => ({ ...value, name: "失败值" }))).rejects.toBeInstanceOf(IpcError)
    expect(state.getSnapshot().status).toBe("error")
    await expect(state.change((value) => ({ ...value, enabled: true }))).rejects.toBeInstanceOf(IpcError)
    await state.retry()
    expect(write.mock.calls[1][2]).toBe(write.mock.calls[0][2])
    expect(write.mock.calls[1][1]).toBe(write.mock.calls[0][1])
    expect(state.getSnapshot().confirmed).toMatchObject({ name: "失败值", enabled: true, revision: "3" })
  })

  it("冲突停队，只有显式重试才以当前版本应用用户修改", async () => {
    const write = vi.fn<(value: Value, revision: string, requestId: string) => Promise<Value>>().mockRejectedValueOnce(failure("CONFIG_CONFLICT")).mockImplementation(async (value, revision) => ({ ...value, revision: String(BigInt(revision) + 1n) }))
    const load = vi.fn(async () => ({ ...initial, revision: "9", enabled: true }))
    const state = new AppliedResource({ initial, load, write })
    await expect(state.change((value) => ({ ...value, name: "我的修改" }))).rejects.toBeInstanceOf(IpcError)
    expect(load).not.toHaveBeenCalled()
    expect(write).toHaveBeenCalledTimes(1)
    await state.retry()
    expect(write.mock.calls[1][1]).toBe("9")
    expect(write.mock.calls[1][0]).toMatchObject({ name: "我的修改", enabled: true })
  })

  it("密钥等barrier在普通写之后，后续写使用刷新后的全局版本", async () => {
    const firstWrite = deferred<Value>()
    const sideEffect = deferred<string>()
    const write = vi.fn<(value: Value, revision: string, requestId: string) => Promise<Value>>().mockImplementationOnce(() => firstWrite.promise).mockImplementation(async (value, revision) => ({ ...value, revision: String(BigInt(revision) + 1n) }))
    const load = vi.fn(async () => ({ ...initial, name: "地址已更新", revision: "3" }))
    const state = new AppliedResource({ initial, load, write })
    const first = state.change((value) => ({ ...value, name: "地址已更新" }))
    const run = vi.fn<(confirmed: Value) => Promise<string>>(() => sideEffect.promise)
    const key = state.exclusive(run)
    const next = state.change((value) => ({ ...value, enabled: true }))
    firstWrite.resolve({ ...initial, name: "地址已更新", revision: "2" })
    await first
    await vi.waitFor(() => expect(run).toHaveBeenCalledOnce())
    expect(run.mock.calls[0][0]).toMatchObject({ revision: "2" })
    sideEffect.resolve("密钥已写入")
    await expect(key).resolves.toBe("密钥已写入")
    await next
    expect(write.mock.calls[1][1]).toBe("3")
    expect(state.getSnapshot().confirmed?.revision).toBe("4")
  })

  it("非幂等barrier未知失败不会自动重做，普通写先刷新基线", async () => {
    const { state, load } = resource()
    const operation = vi.fn(async () => { throw failure("IO_ERROR") })
    await expect(state.exclusive(operation)).rejects.toBeInstanceOf(IpcError)
    await state.change((value) => ({ ...value, name: "继续普通设置" }))
    expect(operation).toHaveBeenCalledOnce()
    expect(load).toHaveBeenCalledOnce()
  })

  it("退出冻结拒绝新修改，但flush完成已经应用的请求", async () => {
    const pending = deferred<Value>()
    const { state } = resource(vi.fn(() => pending.promise))
    const first = state.change((value) => ({ ...value, enabled: true }))
    state.freeze(true)
    await expect(state.change((value) => ({ ...value, name: "太晚" }))).rejects.toMatchObject({ detail: { code: "SHUTTING_DOWN" } })
    const finish = state.flush()
    pending.resolve({ ...initial, enabled: true, revision: "2" })
    await Promise.all([first, finish])
    expect(state.getSnapshot().confirmed?.enabled).toBe(true)
  })

  it("读取期间观察到的新版本不会被迟到旧读取覆盖", async () => {
    const pending = deferred<Value>()
    const state = new AppliedResource({ load: () => pending.promise, write: async (value: Value) => value })
    const loaded = state.ensureLoaded()
    state.ingest({ ...initial, revision: "2", name: "新快照" })
    expect(state.getSnapshot().value).toBeNull()
    pending.resolve(initial)
    await loaded
    expect(state.getSnapshot().confirmed).toMatchObject({ revision: "2", name: "新快照" })
  })

  it("撤销时读取失败保留应用队列，flush不能假作完成", async () => {
    const write = vi.fn<(value: Value, revision: string, requestId: string) => Promise<Value>>().mockRejectedValueOnce(failure("DB_BUSY")).mockImplementation(async (value, revision) => ({ ...value, revision: String(BigInt(revision) + 1n) }))
    const readError = failure("IO_ERROR")
    const state = new AppliedResource({ initial, write, load: async () => { throw readError } })
    await expect(state.change((value) => ({ ...value, name: "未确认修改" }))).rejects.toBeInstanceOf(IpcError)
    await expect(state.discard()).rejects.toBe(readError)
    expect(state.getSnapshot().value?.name).toBe("未确认修改")
    expect(state.getSnapshot().status).toBe("error")
    await expect(state.flush()).rejects.toBe(readError)
    await state.retry()
    expect(write.mock.calls[1][2]).toBe(write.mock.calls[0][2])
    expect(state.getSnapshot().confirmed?.name).toBe("未确认修改")
  })

  it("撤销旧应用的迟到读取不删除期间的新应用", async () => {
    const pending = deferred<Value>()
    const write = vi.fn<(value: Value, revision: string, requestId: string) => Promise<Value>>().mockRejectedValueOnce(failure("DB_BUSY")).mockImplementation(async (value, revision) => ({ ...value, revision: String(BigInt(revision) + 1n) }))
    const state = new AppliedResource({ initial, write, load: () => pending.promise })
    await expect(state.change((value) => ({ ...value, name: "撤销这项" }))).rejects.toBeInstanceOf(IpcError)
    const discarded = state.discard()
    await Promise.resolve()
    await expect(state.change((value) => ({ ...value, enabled: true }))).rejects.toBeInstanceOf(IpcError)
    pending.resolve(initial)
    await discarded
    await state.flush()
    expect(state.getSnapshot().confirmed).toMatchObject({ name: "原值", enabled: true, revision: "2" })
    expect(write.mock.calls[1][0]).toMatchObject({ name: "原值", enabled: true })
  })

  it("数据世代失效后回执不更新旧状态，也不启动后续请求", async () => {
    const pending = deferred<Value>()
    const { state, write } = resource(vi.fn(() => pending.promise))
    const first = state.change((value) => ({ ...value, enabled: true }))
    const rejected = expect(first).rejects.toMatchObject({ detail: { code: "DATA_GENERATION_CHANGED" } })
    state.dispose()
    await rejected
    pending.resolve({ ...initial, enabled: true, revision: "2" })
    await Promise.resolve()
    expect(write).toHaveBeenCalledOnce()
    expect(state.getSnapshot().confirmed).toEqual(initial)
  })
})
