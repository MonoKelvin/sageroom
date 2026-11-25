import { useCallback, useEffect, useRef, useState } from "react"
import type { InboxConversation, InboxSummary } from "@/contracts/generated"
import { errorMessage, ipc } from "@/app/ipc"

/** 会话未读与免打扰状态；导航角标、列表与托盘共用同一份数据。 */
export type InboxApi = {
  summary: InboxSummary | null
  loading: boolean
  error: string | null
  conversation: (id: string) => InboxConversation | undefined
  markRead: (conversationId: string, throughSeq: string) => Promise<void>
  setMuted: (conversationId: string, muted: boolean) => Promise<void>
  refresh: () => Promise<void>
}

function unreadTotal(conversations: InboxConversation[]): number {
  return conversations.reduce((sum, item) => (item.muted ? sum : sum + item.unread_count), 0)
}

export function useInbox(generation: string | null, latestSeq: string | null): InboxApi {
  const [summary, setSummary] = useState<InboxSummary | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const requestToken = useRef(0)
  const summaryRef = useRef<InboxSummary | null>(null)

  const assign = useCallback((next: InboxSummary | null) => {
    summaryRef.current = next
    setSummary(next)
  }, [])

  const refresh = useCallback(async () => {
    if (!generation) return
    const token = ++requestToken.current
    setLoading(true)
    try {
      const next = await ipc.getInbox({ data_generation_id: generation })
      if (token !== requestToken.current) return
      assign(next)
      setError(null)
    } catch (cause) {
      if (token === requestToken.current) setError(errorMessage(cause))
    } finally {
      if (token === requestToken.current) setLoading(false)
    }
  }, [assign, generation])

  useEffect(() => {
    // 放到微任务里，避免在渲染提交阶段同步 setState 触发级联渲染。
    queueMicrotask(() => {
      if (!generation) { assign(null); return }
      void refresh()
    })
  }, [assign, generation, latestSeq, refresh])

  useEffect(() => {
    const onFocus = () => { void refresh() }
    window.addEventListener("focus", onFocus)
    return () => window.removeEventListener("focus", onFocus)
  }, [refresh])

  const markRead = useCallback(async (conversationId: string, throughSeq: string) => {
    if (!generation) return
    const current = summaryRef.current
    const target = current?.conversations.find((item) => item.id === conversationId)
    if (!current || !target || target.unread_count === 0) return
    // 进入会话即视为看到最新一条；序号比较交给服务端用整数处理。
    const reached = BigInt(target.latest_seq) > BigInt(throughSeq) ? target.latest_seq : throughSeq
    const optimistic: InboxSummary = {
      ...current,
      conversations: current.conversations.map((item) => item.id === conversationId
        ? { ...item, unread_count: 0, first_unread_id: null, first_unread_seq: null, last_read_seq: reached }
        : item),
      unread_total: unreadTotal(current.conversations.map((item) => item.id === conversationId ? { ...item, unread_count: 0 } : item)),
    }
    assign(optimistic)
    try {
      const next = await ipc.markInboxRead({ data_generation_id: generation, client_request_id: crypto.randomUUID(), conversation_id: conversationId, through_seq: reached })
      if (summaryRef.current === optimistic) assign(next)
      setError(null)
    } catch (cause) {
      if (summaryRef.current === optimistic) assign(current)
      setError(errorMessage(cause))
    }
  }, [assign, generation])

  const setMuted = useCallback(async (conversationId: string, muted: boolean) => {
    if (!generation) return
    const current = summaryRef.current
    const target = current?.conversations.find((item) => item.id === conversationId)
    if (!current || !target || target.muted === muted) return
    const conversations = current.conversations.map((item) => item.id === conversationId ? { ...item, muted } : item)
    const optimistic: InboxSummary = { ...current, conversations, unread_total: unreadTotal(conversations) }
    assign(optimistic)
    try {
      const next = await ipc.setInboxMuted({ data_generation_id: generation, client_request_id: crypto.randomUUID(), conversation_id: conversationId, muted })
      if (summaryRef.current === optimistic) assign(next)
      setError(null)
    } catch (cause) {
      if (summaryRef.current === optimistic) assign(current)
      setError(errorMessage(cause))
    }
  }, [assign, generation])

  const conversation = useCallback(
    (id: string) => summaryRef.current?.conversations.find((item) => item.id === id),
    [],
  )

  return { summary, loading, error, conversation, markRead, setMuted, refresh }
}
