import { act, renderHook, waitFor } from "@testing-library/react"
import { beforeEach, describe, expect, it, vi } from "vitest"
import type { AppError, DomainEvent } from "@/contracts/generated"
import { ipc } from "@/app/ipc"
import { event, GENERATION, page, snapshot } from "./chat.test-fixtures"
import { useChatSession } from "./useChatSession"

vi.mock("@/app/ipc", () => ({
  errorMessage: (error: unknown) => error instanceof Error ? error.message : "测试失败",
  IpcError: class extends Error {
    readonly detail: AppError
    constructor(detail: AppError) { super(detail.message); this.detail = detail }
  },
  ipc: { snapshot: vi.fn(), list: vi.fn(), send: vi.fn(), recall: vi.fn(), subscribe: vi.fn() },
}))

let receiveEvent: (event: DomainEvent) => void

beforeEach(() => {
  vi.resetAllMocks()
  vi.mocked(ipc.snapshot).mockResolvedValue(snapshot())
  vi.mocked(ipc.list).mockResolvedValue(page())
  vi.mocked(ipc.subscribe).mockImplementation(async (onEvent) => { receiveEvent = onEvent; return vi.fn<() => void>() })
})

describe("聊天室数据与事件", () => {
  it("发送贯穿引用与成员 ID，不从正文猜测提及", async () => {
    const { result } = renderHook(() => useChatSession())
    await waitFor(() => expect(result.current.page).not.toBeNull())
    vi.mocked(ipc.send).mockResolvedValue({ data_generation_id: GENERATION, message_id: "message-1", message_seq: "1", event_seq: "1" })
    await act(async () => { await result.current.send("@Sage 回应", "request-1", { quote_message_id: "message-0", mention_ids: ["sage-test"], mention_all: false }) })
    expect(ipc.send).toHaveBeenCalledWith({ data_generation_id: GENERATION, client_request_id: "request-1", parts: [{ kind: "text", text: "@Sage 回应" }], quote_message_id: "message-0", mention_ids: ["sage-test"], mention_all: false })
  })

  it("发送时先插入本地占位，回执落地后再与正式消息对齐", async () => {
    const { result } = renderHook(() => useChatSession())
    await waitFor(() => expect(result.current.page).not.toBeNull())
    let complete!: (value: { data_generation_id: string; message_id: string; message_seq: string; event_seq: string }) => void
    vi.mocked(ipc.send).mockReturnValueOnce(new Promise((resolve) => { complete = resolve }))
    let sending!: Promise<unknown>
    act(() => { sending = result.current.send("马上回来", "request-pending") })
    // ipc 还没返回，气泡已经在了
    expect(result.current.pendingMessages.map((item) => (item.parts[0] as { text: string }).text)).toEqual(["马上回来"])
    await act(async () => { complete({ data_generation_id: GENERATION, message_id: "message-9", message_seq: "9", event_seq: "9" }); await sending })
    // 正式消息还没进列表前，占位继续挂着，不会出现「气泡闪一下消失」
    expect(result.current.pendingMessages).toHaveLength(1)
  })

  it("发送失败时撤回本地占位", async () => {
    const { result } = renderHook(() => useChatSession())
    await waitFor(() => expect(result.current.page).not.toBeNull())
    vi.mocked(ipc.send).mockRejectedValueOnce(new Error("网络断了"))
    await act(async () => { await result.current.send("发不出去", "request-failed").catch(() => {}) })
    expect(result.current.pendingMessages).toHaveLength(0)
  })

  it("撤回事件就地替换该条，不清空窗口也不重建阅读锚点", async () => {
    const original = snapshot({ latest_message_seq: "2", latest_event_seq: "2" })
    vi.mocked(ipc.snapshot).mockResolvedValue(original)
    vi.mocked(ipc.list).mockResolvedValue(page([1, 2]))
    const { result } = renderHook(() => useChatSession())
    await waitFor(() => expect(result.current.page?.items).toHaveLength(2))
    act(() => { result.current.updateAtBottom(false); result.current.updateRenderedAnchor({ id: "message-1", seq: "1", offset: -9 }) })
    const listCallsBefore = vi.mocked(ipc.list).mock.calls.length
    const revisionBefore = result.current.windowRevision
    const room = { ...original.room, content_epoch: "1" }
    act(() => receiveEvent({ ...event(3), payload: { kind: "message_changed", message_id: "message-1", message_seq: "1", room } }))
    await waitFor(() => expect(result.current.page?.items[0].state).toBe("recalled"))
    // 就地替换：不再重新拉列表、不重建窗口、不改动阅读锚点
    expect(vi.mocked(ipc.list).mock.calls.length).toBe(listCallsBefore)
    expect(result.current.windowRevision).toBe(revisionBefore)
    expect(result.current.restoreAnchor).toBeNull()
    expect(result.current.page?.items[0].parts).toEqual([])
  })

  it("撤回响应同步正文 epoch，不提前应用 room 掩盖刷新", async () => {
    const original = snapshot({ latest_message_seq: "1", latest_event_seq: "1" })
    vi.mocked(ipc.snapshot).mockResolvedValue(original)
    vi.mocked(ipc.list).mockResolvedValue(page([1]))
    const { result } = renderHook(() => useChatSession())
    await waitFor(() => expect(result.current.page?.items).toHaveLength(1))
    const room = { ...original.room, content_epoch: "1" }
    vi.mocked(ipc.recall).mockResolvedValue({ data_generation_id: GENERATION, message_id: "message-1", event_seq: "2", room })
    vi.mocked(ipc.snapshot).mockResolvedValue({ ...original, room, latest_event_seq: "2" })
    const changed = page([1])
    changed.items[0] = { ...changed.items[0], state: "recalled", parts: [] }
    vi.mocked(ipc.list).mockResolvedValue(changed)
    await act(async () => { await result.current.recall("message-1", "recall-request") })
    expect(ipc.recall).toHaveBeenCalledWith({ data_generation_id: GENERATION, message_id: "message-1", client_request_id: "recall-request" })
    expect(result.current.page?.items[0].parts).toEqual([])
  })

  it("先建立监听，再取快照和消息页", async () => {
    const order: string[] = []
    vi.mocked(ipc.subscribe).mockImplementation(async (onEvent) => { receiveEvent = onEvent; order.push("subscribe"); return vi.fn<() => void>() })
    vi.mocked(ipc.snapshot).mockImplementation(async () => { order.push("snapshot"); return snapshot() })
    vi.mocked(ipc.list).mockImplementation(async () => { order.push("list"); return page() })
    const { result } = renderHook(() => useChatSession())
    await waitFor(() => expect(result.current.page).not.toBeNull())
    expect(order).toEqual(["subscribe", "snapshot", "list"])
  })

  it("群名事件更新资料但不重建聊天阅读窗口", async () => {
    const original = snapshot({ latest_message_seq: "2", latest_event_seq: "2" })
    vi.mocked(ipc.snapshot).mockResolvedValue(original)
    vi.mocked(ipc.list).mockResolvedValue(page([1, 2]))
    const { result } = renderHook(() => useChatSession())
    await waitFor(() => expect(result.current.page?.items).toHaveLength(2))
    act(() => result.current.updateAtBottom(false))
    const items = result.current.page?.items
    const windowRevision = result.current.windowRevision
    const listCalls = vi.mocked(ipc.list).mock.calls.length
    const changed = { ...original.room, name: "新的群名称", version: "2" }

    act(() => receiveEvent({ ...event(3), payload: { kind: "room_changed", room: changed } }))
    await waitFor(() => expect(result.current.snapshot?.room.name).toBe("新的群名称"))
    expect(result.current.snapshot?.room.version).toBe("2")
    expect(result.current.snapshot?.latest_event_seq).toBe("3")
    expect(result.current.page?.items).toBe(items)
    expect(result.current.windowRevision).toBe(windowRevision)
    expect(result.current.atBottom).toBe(false)
    expect(ipc.list).toHaveBeenCalledTimes(listCalls)
  })

  it("群名保存响应只应用当前世代与非过期版本", async () => {
    vi.mocked(ipc.list).mockResolvedValue(page([1, 2]))
    const { result } = renderHook(() => useChatSession())
    await waitFor(() => expect(result.current.page?.items).toHaveLength(2))
    const items = result.current.page?.items
    const listCalls = vi.mocked(ipc.list).mock.calls.length
    const room = snapshot().room
    act(() => result.current.applyRoom({ ...room, name: "已应用名称", version: "3" }, GENERATION))
    expect(result.current.snapshot?.room.name).toBe("已应用名称")
    act(() => result.current.applyRoom({ ...room, name: "旧响应", version: "2" }, GENERATION))
    act(() => result.current.applyRoom({ ...room, name: "旧世代", version: "4" }, "old-generation"))
    expect(result.current.snapshot?.room.name).toBe("已应用名称")
    expect(result.current.page?.items).toBe(items)
    expect(ipc.list).toHaveBeenCalledTimes(listCalls)
  })

  it("事件缺口查询高水位并恢复消息，迟到旧事件不重复处理", async () => {
    const { result } = renderHook(() => useChatSession())
    await waitFor(() => expect(result.current.page).not.toBeNull())
    vi.mocked(ipc.snapshot).mockResolvedValue(snapshot({ latest_message_seq: "3", latest_event_seq: "3", requires_full_reload: false, events: [event(1), event(2), event(3)] }))
    vi.mocked(ipc.list).mockResolvedValue(page([1, 2, 3]))
    act(() => receiveEvent(event(3)))
    await waitFor(() => expect(result.current.page?.items).toHaveLength(3))
    expect(ipc.snapshot).toHaveBeenLastCalledWith({ data_generation_id: GENERATION, last_event_seq: "0" })
    const queries = vi.mocked(ipc.list).mock.calls.length
    act(() => receiveEvent(event(2)))
    await act(async () => {})
    expect(ipc.list).toHaveBeenCalledTimes(queries)
    expect(result.current.snapshot?.latest_event_seq).toBe("3")
  })

  it("按 event_seq 去重，重复消息事件不重复拉取", async () => {
    const { result } = renderHook(() => useChatSession())
    await waitFor(() => expect(result.current.page).not.toBeNull())
    vi.mocked(ipc.list).mockResolvedValue(page([1]))
    act(() => receiveEvent(event(1)))
    await waitFor(() => expect(result.current.page?.items).toHaveLength(1))
    act(() => receiveEvent(event(1)))
    await act(async () => {})
    expect(ipc.list).toHaveBeenCalledTimes(2)
  })

  it("看历史时新消息不替换视图，回到最新只滚不重建", async () => {
    vi.mocked(ipc.snapshot).mockResolvedValue(snapshot({ latest_message_seq: "2", latest_event_seq: "2" }))
    vi.mocked(ipc.list).mockResolvedValue(page([1, 2]))
    const { result } = renderHook(() => useChatSession())
    await waitFor(() => expect(result.current.page?.items).toHaveLength(2))
    act(() => result.current.updateAtBottom(false))
    act(() => receiveEvent(event(3)))
    await waitFor(() => expect(result.current.hasNewMessages).toBe(true))
    expect(result.current.page?.items.map((item) => item.seq)).toEqual(["1", "2"])
    expect(ipc.list).toHaveBeenCalledOnce()
    vi.mocked(ipc.list).mockResolvedValue(page([3]))
    await act(async () => result.current.loadNewer())
    expect(result.current.hasNewMessages).toBe(true)
    vi.mocked(ipc.list).mockResolvedValue(page([2, 3]))
    const callsBefore = vi.mocked(ipc.list).mock.calls.length
    await act(async () => result.current.goToLatest())
    // 后面没有更多分页时只需要滚到底：重建窗口会让虚拟列表重新挂载，看起来就是闪一下。
    expect(vi.mocked(ipc.list).mock.calls.length).toBe(callsBefore)
    expect(result.current.page?.items.map((item) => item.seq)).toEqual(["1", "2", "3"])
    expect(result.current.hasNewMessages).toBe(false)
  })

  it("回到底部立即清除新消息提示，包括分页窗口仍标记后续消息的情况", async () => {
    vi.mocked(ipc.snapshot).mockResolvedValue(snapshot({ latest_message_seq: "2", latest_event_seq: "2" }))
    vi.mocked(ipc.list).mockResolvedValue(page([1, 2]))
    const { result } = renderHook(() => useChatSession())
    await waitFor(() => expect(result.current.page?.items).toHaveLength(2))
    act(() => result.current.updateAtBottom(false))
    act(() => receiveEvent(event(3)))
    await waitFor(() => expect(result.current.hasNewMessages).toBe(true))
    act(() => result.current.updateAtBottom(true))
    expect(result.current.hasNewMessages).toBe(false)
  })

  it("首次快照暂时失败后重新读取恢复事件消费", async () => {
    vi.mocked(ipc.snapshot).mockRejectedValueOnce(new Error("数据库忙碌")).mockResolvedValue(snapshot())
    const { result } = renderHook(() => useChatSession())
    await waitFor(() => expect(result.current.error).toBe("数据库忙碌"))
    await act(async () => result.current.reload())
    expect(result.current.page).not.toBeNull()
    vi.mocked(ipc.list).mockResolvedValue(page([1]))
    act(() => receiveEvent(event(1)))
    await waitFor(() => expect(result.current.page?.items).toHaveLength(1))
  })

  it("世代改变立即清掉旧页，旧请求的数据不会混入新根", async () => {
    vi.mocked(ipc.list).mockResolvedValue(page([1, 2]))
    const { result } = renderHook(() => useChatSession())
    await waitFor(() => expect(result.current.page?.items).toHaveLength(2))
    const nextGeneration = "generation-new"
    vi.mocked(ipc.snapshot).mockResolvedValue(snapshot({ data_generation_id: nextGeneration, latest_message_seq: "42", latest_event_seq: "42", requires_full_reload: true }))
    let complete!: (value: ReturnType<typeof page>) => void
    vi.mocked(ipc.list).mockReturnValue(new Promise((resolve) => { complete = resolve }))
    act(() => receiveEvent({ ...event(42), data_generation_id: nextGeneration }))
    await waitFor(() => expect(result.current.snapshot?.data_generation_id).toBe(nextGeneration))
    expect(result.current.page).toBeNull()
    await act(async () => complete(page([42], { data_generation_id: nextGeneration })))
    expect(result.current.page?.items.map((item) => item.seq)).toEqual(["42"])
    expect(ipc.list).toHaveBeenLastCalledWith(expect.objectContaining({ data_generation_id: nextGeneration }))
  })

  it("同世代同 epoch 的回放缺口不重建阅读窗口，并提示新消息", async () => {
    vi.mocked(ipc.snapshot).mockResolvedValue(snapshot({ latest_message_seq: "102", latest_event_seq: "102" }))
    vi.mocked(ipc.list).mockResolvedValueOnce(page([101, 102], { has_more_before: true }))
    const { result } = renderHook(() => useChatSession())
    await waitFor(() => expect(result.current.page?.items).toHaveLength(2))
    vi.mocked(ipc.list).mockResolvedValueOnce(page([99, 100], { has_more_before: true }))
    await act(async () => result.current.loadOlder())
    act(() => result.current.updateAtBottom(false))
    const items = result.current.page?.items
    const firstItemIndex = result.current.firstItemIndex
    const windowRevision = result.current.windowRevision
    const listCalls = vi.mocked(ipc.list).mock.calls.length
    vi.mocked(ipc.snapshot).mockResolvedValue(snapshot({ latest_message_seq: "200", latest_event_seq: "200", requires_full_reload: true }))
    act(() => receiveEvent(event(200)))
    await waitFor(() => expect(result.current.hasNewMessages).toBe(true))
    expect(result.current.page?.items).toBe(items)
    expect(result.current.firstItemIndex).toBe(firstItemIndex)
    expect(result.current.windowRevision).toBe(windowRevision)
    expect(result.current.atBottom).toBe(false)
    expect(result.current.page?.has_more_after).toBe(true)
    expect(result.current.snapshot?.latest_message_seq).toBe("200")
    expect(ipc.list).toHaveBeenCalledTimes(listCalls)
  })

  it("正文 epoch 变化时保留旧正文，围绕当前渲染锚点就地换窗口", async () => {
    const original = snapshot({ latest_message_seq: "20", latest_event_seq: "20" })
    vi.mocked(ipc.snapshot).mockResolvedValue(original)
    vi.mocked(ipc.list).mockResolvedValue(page([10, 11, 12], { has_more_before: true, has_more_after: true, latest_message_seq: "20", latest_event_seq: "20" }))
    const { result } = renderHook(() => useChatSession())
    await waitFor(() => expect(result.current.page?.items).toHaveLength(3))
    act(() => {
      result.current.updateAtBottom(false)
      result.current.updateRenderedAnchor({ id: "message-11", seq: "11", offset: -17 })
    })
    vi.mocked(ipc.snapshot).mockResolvedValue({ ...original, room: { ...original.room, content_epoch: "1" }, latest_event_seq: "23", requires_full_reload: true })
    let complete!: (value: ReturnType<typeof page>) => void
    vi.mocked(ipc.list).mockReturnValueOnce(new Promise((resolve) => { complete = resolve }))
    let refresh!: Promise<void>
    act(() => { refresh = result.current.reload() })
    await waitFor(() => expect(result.current.snapshot?.room.content_epoch).toBe("1"))
    // 新窗口还在路上时保留旧正文，不要先清空再等，否则中间会闪出一段空白。
    expect(result.current.page?.items.map((item) => item.seq)).toEqual(["10", "11", "12"])
    const corrected = page([10, 11, 12], { has_more_before: true, has_more_after: true, latest_message_seq: "20", latest_event_seq: "23" })
    corrected.items[1] = { ...corrected.items[1]!, state: "recalled", parts: [] }
    await act(async () => { complete(corrected); await refresh })
    expect(ipc.list).toHaveBeenLastCalledWith(expect.objectContaining({ around_seq: "11" }))
    expect(result.current.page?.items[1]?.parts).toEqual([])
    expect(result.current.targetMessageId).toBeNull()
    expect(result.current.restoreAnchor).toEqual({ id: "message-11", seq: "11", offset: -17 })
    expect(result.current.atBottom).toBe(false)
  })

  it("迟到的外观响应不会回退较新配置版本", async () => {
    vi.mocked(ipc.snapshot).mockResolvedValue(snapshot({ appearance: { theme: "dark", reduce_motion: false, revision: "10" } }))
    const { result } = renderHook(() => useChatSession())
    await waitFor(() => expect(result.current.snapshot).not.toBeNull())
    act(() => result.current.applyAppearance({ theme: "light", reduce_motion: false, revision: "9" }, GENERATION))
    expect(result.current.snapshot?.appearance.theme).toBe("dark")
  })
})
