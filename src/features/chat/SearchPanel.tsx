import { useEffect, useEffectEvent, useRef, useState, type FormEvent } from "react"
import * as DialogPrimitive from "@radix-ui/react-dialog"
import { IconCornerDownRight, IconSearch, IconX } from "@tabler/icons-react"
import type { SearchPage } from "@/contracts/generated"
import { Avatar } from "@/components/Avatar"
import { Button } from "@/components/ui/button"
import { errorMessage, ipc } from "@/app/ipc"
import { ChatSearchInput } from "./ChatSearchInput"

const formatter = new Intl.DateTimeFormat("zh-CN", { month: "numeric", day: "numeric", hour: "2-digit", minute: "2-digit" })

function Highlight({ text, query }: { text: string; query: string }) {
  if (!query) return <>{text}</>
  const parts = []
  let from = 0
  let index = text.indexOf(query)
  while (index >= 0) {
    parts.push(text.slice(from, index), <mark key={index} className="chat-search-match">{text.slice(index, index + query.length)}</mark>)
    from = index + query.length
    index = text.indexOf(query, from)
  }
  parts.push(text.slice(from))
  return <>{parts}</>
}

type FormProps = {
  generation: string
  enabled: boolean
  onLocate: (seq: string, messageId: string) => Promise<void>
  onClose: () => void
}

function SearchForm({ generation, enabled, onLocate, onClose }: FormProps) {
  const [query, setQuery] = useState("")
  const [composing, setComposing] = useState(false)
  const [result, setResult] = useState<SearchPage | null>(null)
  const [pending, setPending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)
  const active = useRef<string | null>(null)
  const scheduled = useRef<ReturnType<typeof setTimeout> | null>(null)
  const operationRevision = useRef(0)
  const mounted = useRef(enabled)

  useEffect(() => {
    mounted.current = enabled
    return () => {
      mounted.current = false
      operationRevision.current += 1
      if (scheduled.current) clearTimeout(scheduled.current)
      scheduled.current = null
      const id = active.current
      active.current = null
      if (id) void ipc.cancelSearch({ data_generation_id: generation, search_id: id }).catch(() => {})
    }
  }, [generation, enabled])

  const runSearch = useEffectEvent(() => { void search() })
  useEffect(() => {
    if (!enabled || composing || !query.trim() || [...query].length > 256) return
    const timer = setTimeout(() => { scheduled.current = null; runSearch() }, 150)
    scheduled.current = timer
    return () => { clearTimeout(timer); if (scheduled.current === timer) scheduled.current = null }
  }, [query, enabled, composing, generation])

  function stopPrevious() {
    if (scheduled.current) clearTimeout(scheduled.current)
    scheduled.current = null
    operationRevision.current += 1
    const id = active.current
    active.current = null
    if (id) void ipc.cancelSearch({ data_generation_id: generation, search_id: id }).catch(() => {})
  }

  function changeQuery(value: string) {
    stopPrevious()
    setQuery(value)
    setResult(null)
    setError([...value].length > 256 ? "搜索内容不能超过 256 个字符。" : null)
    setNotice(null)
    setPending(!composing && Boolean(value.trim()) && [...value].length <= 256)
  }

  async function search(cursor: string | null = null) {
    if (!mounted.current) return
    const requestedQuery = cursor && result ? result.query : query
    stopPrevious()
    if (!requestedQuery.trim()) { setPending(false); setError("请输入要查找的文本。"); return }
    if ([...requestedQuery].length > 256) { setPending(false); setError("搜索内容不能超过 256 个字符。"); return }
    const searchId = crypto.randomUUID()
    active.current = searchId
    setPending(true)
    setError(null)
    setNotice(null)
    if (!cursor) setResult(null)
    try {
      const next = await ipc.search({ data_generation_id: generation, search_id: searchId, query: requestedQuery, cursor, limit: 50 })
      if (!mounted.current || active.current !== searchId || next.data_generation_id !== generation) return
      setResult((current) => cursor && current ? { ...next, items: [...current.items, ...next.items].slice(-200) } : next)
    } catch (cause) {
      if (mounted.current && active.current === searchId) setError(errorMessage(cause))
    } finally {
      if (mounted.current && active.current === searchId) { active.current = null; setPending(false) }
    }
  }

  async function cancel() {
    const id = active.current
    if (scheduled.current) clearTimeout(scheduled.current)
    scheduled.current = null
    active.current = null
    const revision = ++operationRevision.current
    setPending(false)
    setNotice("已停止等待检索，本次未完成范围不作为无结果。")
    if (!id) return
    try {
      const response = await ipc.cancelSearch({ data_generation_id: generation, search_id: id })
      if (mounted.current && operationRevision.current === revision && response.cancellation_requested) setNotice("检索已取消，本次未完成范围不作为无结果。")
    } catch (cause) {
      if (mounted.current && operationRevision.current === revision) setError(errorMessage(cause))
    }
  }

  async function locate(seq: string, id: string) {
    try {
      await onLocate(seq, id)
      if (mounted.current) onClose()
    } catch (cause) {
      if (mounted.current) setError(errorMessage(cause))
    }
  }

  function submit(event: FormEvent<HTMLFormElement>) { event.preventDefault(); if (!composing) void search() }

  return <>
    <ChatSearchInput value={query} pending={pending && enabled} onValueChange={changeQuery} onSubmit={submit} onCancel={() => void cancel()} onCompositionStart={() => { stopPrevious(); setComposing(true); setPending(false) }} onCompositionEnd={(value) => { setComposing(false); changeQuery(value) }} />
    <aside className="chat-search-results" aria-label="搜索结果面板">
      <div className="chat-search-summary" aria-live="polite">{pending ? "正在搜索全部历史…" : notice || (result ? `当前 ${result.items.length} 条匹配` : "搜索聊天")}</div>
      {!query.trim() && !pending && !error && !notice && <p className="chat-search-empty">输入文字即可搜索聊天记录。</p>}
      {error && <p role="alert" className="chat-search-feedback">{error}</p>}
      {result && !pending && !notice && result.items.length === 0 && <p className="chat-search-empty">没有匹配的消息。</p>}
      <ul aria-label="搜索结果" className="chat-search-list">
        {result?.items.map((hit) => <li key={hit.message_id}>
          <button type="button" className="chat-search-result" onClick={() => void locate(hit.seq, hit.message_id)} aria-label={`定位${hit.sender_display_name}的消息`}>
            <span className="chat-search-sender"><Avatar name={hit.sender_display_name} size={28} /><span className="chat-search-author">{hit.sender_display_name}</span><time dateTime={new Date(hit.created_at).toISOString()}>{formatter.format(hit.created_at)}</time></span>
            <span className="chat-search-snippet"><Highlight text={hit.snippet} query={result!.query} /></span>
            <IconCornerDownRight size={18} className="chat-search-locate" aria-hidden="true" />
          </button>
        </li>)}
      </ul>
      {result?.has_more && <Button className="chat-search-more" variant="ghost" size="sm" disabled={pending} onClick={() => void search(result.next_cursor)}>加载更早的匹配</Button>}
    </aside>
  </>
}

export function SearchPanel({ open, onOpenChange, generation, onLocate, onReturnFocus }: {
  open: boolean
  onOpenChange: (open: boolean) => void
  generation: string | null
  onLocate: (seq: string, messageId: string) => Promise<void>
  onReturnFocus?: () => void
}) {
  return <DialogPrimitive.Root open={open} onOpenChange={onOpenChange} modal={false}>
    <div className="chat-search" data-open={open}>
      <DialogPrimitive.Content
        className="chat-search-content"
        aria-describedby={undefined}
        inert={!open}
        onCloseAutoFocus={(event) => { if (onReturnFocus) { event.preventDefault(); onReturnFocus() } }}
      >
        <DialogPrimitive.Title className="sr-only">搜索聊天</DialogPrimitive.Title>
        {generation ? <SearchForm key={generation} generation={generation} enabled={open} onLocate={onLocate} onClose={() => onOpenChange(false)} /> : <p className="chat-search-feedback">本地聊天数据尚未就绪。</p>}
      </DialogPrimitive.Content>
      <DialogPrimitive.Trigger asChild><Button type="button" variant="ghost" size="icon" className="chat-search-toggle" aria-label={open ? "关闭搜索" : "搜索聊天"}>{open ? <IconX size={20} stroke={1.5} aria-hidden="true" /> : <IconSearch size={20} stroke={1.5} aria-hidden="true" />}</Button></DialogPrimitive.Trigger>
    </div>
  </DialogPrimitive.Root>
}
