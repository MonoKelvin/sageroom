import { useEffect, useRef, useState, type FormEvent } from "react"
import { IconSearch, IconX } from "@tabler/icons-react"
import type { SearchPage } from "@/contracts/generated"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { errorMessage, ipc } from "@/app/ipc"

const formatter = new Intl.DateTimeFormat("zh-CN", { month: "numeric", day: "numeric", hour: "2-digit", minute: "2-digit" })

function Highlight({ text, query }: { text: string; query: string }) {
  const index = text.indexOf(query)
  if (index < 0) return <>{text}</>
  return <>{text.slice(0, index)}<mark className="rounded-sm bg-primary/15 text-text-primary">{text.slice(index, index + query.length)}</mark>{text.slice(index + query.length)}</>
}

type FormProps = {
  generation: string
  onLocate: (seq: string, messageId: string) => Promise<void>
  onClose: () => void
}

function SearchForm({ generation, onLocate, onClose }: FormProps) {
  const [query, setQuery] = useState("")
  const [result, setResult] = useState<SearchPage | null>(null)
  const [pending, setPending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)
  const active = useRef<string | null>(null)
  const operationRevision = useRef(0)
  const mounted = useRef(true)

  useEffect(() => {
    mounted.current = true
    return () => {
      mounted.current = false
      const id = active.current
      active.current = null
      if (id) void ipc.cancelSearch({ data_generation_id: generation, search_id: id }).catch(() => {})
    }
  }, [generation])

  async function search(cursor: string | null = null) {
    const requestedQuery = cursor && result ? result.query : query
    if (!requestedQuery.trim()) {
      setError("请输入要查找的文本。")
      return
    }
    if ([...requestedQuery].length > 256) {
      setError("搜索内容不能超过 256 个字符。")
      return
    }
    const previous = active.current
    operationRevision.current += 1
    const searchId = crypto.randomUUID()
    active.current = searchId
    if (previous) void ipc.cancelSearch({ data_generation_id: generation, search_id: previous }).catch(() => {})
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
      if (mounted.current && active.current === searchId) {
        active.current = null
        setPending(false)
      }
    }
  }

  async function cancel() {
    const id = active.current
    if (!id) return
    active.current = null
    const revision = ++operationRevision.current
    setPending(false)
    setNotice("已停止等待检索，本次未完成范围不作为无结果。")
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

  function submit(event: FormEvent) {
    event.preventDefault()
    void search()
  }

  return (
    <div className="min-w-0">
      <form className="flex gap-2" onSubmit={submit}>
        <input autoFocus aria-label="搜索聊天文本" type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="查找原文中的字词" className="h-9 min-w-0 flex-1 rounded-md border border-input bg-transparent px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring" />
        <Button type="submit" size="icon" aria-label="开始搜索"><IconSearch size={18} aria-hidden="true" /></Button>
        {pending && <Button size="icon" variant="ghost" aria-label="取消检索" onClick={() => void cancel()}><IconX size={18} aria-hidden="true" /></Button>}
      </form>
      <div className="mt-3 min-h-5 text-xs text-text-secondary" aria-live="polite">
        {pending ? "正在搜索全部历史…" : notice || (result ? `当前显示 ${result.items.length} 条匹配` : "支持中文短词，区分大小写与全半角。")}
      </div>
      {error && <p role="alert" className="mt-2 text-sm text-destructive">{error}</p>}
      {result && !pending && !notice && result.items.length === 0 && <p className="py-8 text-center text-sm text-text-secondary">没有匹配的消息。</p>}
      <ul aria-label="搜索结果" className="mt-2 max-h-[min(360px,50dvh)] space-y-1 overflow-y-auto">
        {result?.items.map((hit) => (
          <li key={hit.message_id}>
            <button className="w-full rounded-md p-2.5 text-left outline-none hover:bg-accent focus-visible:ring-2 focus-visible:ring-ring" onClick={() => void locate(hit.seq, hit.message_id)} aria-label={`定位${hit.sender_display_name}的消息`}>
              <span className="flex min-w-0 items-center justify-between gap-2 text-xs text-text-secondary"><span className="truncate">{hit.sender_display_name}</span><time className="shrink-0" dateTime={new Date(hit.created_at).toISOString()}>{formatter.format(hit.created_at)}</time></span>
              <span className="mt-1 block text-sm leading-relaxed whitespace-pre-wrap [overflow-wrap:anywhere]"><Highlight text={hit.snippet} query={result.query} /></span>
            </button>
          </li>
        ))}
      </ul>
      {result?.has_more && <Button className="mt-3 w-full" variant="ghost" disabled={pending} onClick={() => void search(result.next_cursor)}>加载更早的匹配</Button>}
    </div>
  )
}

export function SearchPanel({ open, onOpenChange, generation, onLocate, onReturnFocus }: {
  open: boolean
  onOpenChange: (open: boolean) => void
  generation: string | null
  onLocate: (seq: string, messageId: string) => Promise<void>
  onReturnFocus?: () => void
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent onCloseAutoFocus={(event) => { if (onReturnFocus) { event.preventDefault(); onReturnFocus() } }}>
        <DialogHeader><DialogTitle>搜索聊天</DialogTitle><DialogDescription>按原文子串查找，不使用语义推测或搜索表达式。</DialogDescription></DialogHeader>
        {generation ? <SearchForm key={generation} generation={generation} onLocate={onLocate} onClose={() => onOpenChange(false)} /> : <p className="text-sm text-text-secondary">本地聊天数据尚未就绪。</p>}
      </DialogContent>
    </Dialog>
  )
}
