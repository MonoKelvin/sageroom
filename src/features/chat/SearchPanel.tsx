import { useCallback, useEffect, useEffectEvent, useRef, useState, type FormEvent } from "react"
import * as DialogPrimitive from "@radix-ui/react-dialog"
import { IconAdjustmentsHorizontal, IconCornerDownRight, IconSearch, IconX } from "@tabler/icons-react"
import type { Participant, SearchPage } from "@/contracts/generated"
import { Avatar } from "@/components/Avatar"
import { Button } from "@/components/ui/button"
import { SettingsSelect } from "@/components/ui/settings-select"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { errorMessage, ipc } from "@/app/ipc"
import { ChatSearchInput } from "./ChatSearchInput"

const formatter = new Intl.DateTimeFormat("zh-CN", { month: "numeric", day: "numeric", hour: "2-digit", minute: "2-digit" })
const SNIPPET_CONTEXT_LENGTH = 10

function Highlight({ text, query }: { text: string; query: string }) {
  const matchIndex = query ? text.indexOf(query) : -1
  if (matchIndex < 0) return <>{text}</>
  const before = [...text.slice(0, matchIndex)]
  const after = [...text.slice(matchIndex + query.length)]
  const snippet = before.slice(-SNIPPET_CONTEXT_LENGTH).join("") + query + after.slice(0, SNIPPET_CONTEXT_LENGTH).join("")
  const parts = []
  let from = 0
  let index = snippet.indexOf(query)
  while (index >= 0) {
    parts.push(snippet.slice(from, index), <mark key={index} className="chat-search-match">{snippet.slice(index, index + query.length)}</mark>)
    from = index + query.length
    index = snippet.indexOf(query, from)
  }
  parts.push(snippet.slice(from))
  return <>{before.length > SNIPPET_CONTEXT_LENGTH && "..."}{parts}{after.length > SNIPPET_CONTEXT_LENGTH && "..."}</>
}

type FormProps = {
  participants: ReadonlyMap<string, Participant>
  generation: string
  enabled: boolean
  contentEpoch: string
  onLocate: (seq: string, messageId: string) => Promise<void>
  onClose: () => void
}

function SearchForm({ generation, participants, enabled, contentEpoch, onLocate, onClose }: FormProps) {
  const [query, setQuery] = useState("")
  const [composing, setComposing] = useState(false)
  const [filtersOpen, setFiltersOpen] = useState(false)
  const [senderId, setSenderId] = useState("")
  const [dateFrom, setDateFrom] = useState("")
  const [dateUntil, setDateUntil] = useState("")
  const [storedResult, setStoredResult] = useState<{ identity: string; page: SearchPage } | null>(null)
  const identity = JSON.stringify([query, senderId, dateFrom, dateUntil, contentEpoch])
  const result = storedResult?.identity === identity ? storedResult.page : null
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
  }, [generation, enabled, contentEpoch])

  const runSearch = useEffectEvent(() => { void search() })
  useEffect(() => {
    if (!enabled || composing || !query.trim() || [...query].length > 256) return
    const timer = setTimeout(() => { scheduled.current = null; runSearch() }, 150)
    scheduled.current = timer
    return () => { clearTimeout(timer); if (scheduled.current === timer) scheduled.current = null }
  }, [query, senderId, dateFrom, dateUntil, contentEpoch, enabled, composing, generation])

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
    setStoredResult(null)
    setError([...value].length > 256 ? "搜索内容不能超过 256 个字符。" : null)
    setNotice(null)
    setPending(!composing && Boolean(value.trim()) && [...value].length <= 256)
  }

  function changeFilter(apply: () => void) {
    stopPrevious()
    apply()
    setStoredResult(null)
    setError(null)
    setNotice(null)
    setPending(!composing && Boolean(query.trim()) && [...query].length <= 256)
  }

  async function search(cursor: string | null = null) {
    if (!mounted.current) return
    const requestedQuery = cursor && result ? result.query : query
    stopPrevious()
    if (!requestedQuery.trim()) { setPending(false); setError("请输入要查找的文本。"); return }
    if ([...requestedQuery].length > 256) { setPending(false); setError("搜索内容不能超过 256 个字符。"); return }
    const from = dateFrom ? new Date(`${dateFrom}T00:00:00`) : null
    const until = dateUntil ? new Date(`${dateUntil}T00:00:00`) : null
    if ((from && !Number.isFinite(from.getTime())) || (until && !Number.isFinite(until.getTime())) || (dateFrom && dateUntil && dateFrom > dateUntil)) {
      setPending(false)
      setError("请选择有效日期，结束日期不能早于开始日期。")
      return
    }
    if (until) until.setDate(until.getDate() + 1)
    const searchId = crypto.randomUUID()
    active.current = searchId
    setPending(true)
    setError(null)
    setNotice(null)
    if (!cursor) setStoredResult(null)
    try {
      const next = await ipc.search({ data_generation_id: generation, search_id: searchId, query: requestedQuery, sender_id: senderId || null, created_after: from?.getTime() ?? null, created_before: until?.getTime() ?? null, cursor, limit: 50 })
      if (!mounted.current || active.current !== searchId || next.data_generation_id !== generation) return
      setStoredResult((current) => ({ identity, page: cursor && current?.identity === identity ? { ...next, items: [...current.page.items, ...next.items].slice(-200) } : next }))
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

  const hasSearchContent = Boolean(filtersOpen || query.trim() || pending || error || notice || result)

  return <>
    <div className="chat-search-toolbar">
      <ChatSearchInput value={query} pending={pending && enabled} onValueChange={changeQuery} onSubmit={submit} onCancel={() => void cancel()} onCompositionStart={() => { stopPrevious(); setComposing(true); setPending(false) }} onCompositionEnd={(value) => { setComposing(false); changeQuery(value) }} />
      <Tooltip><TooltipTrigger asChild><Button type="button" variant="ghost" size="icon-sm" className="chat-search-filter-toggle" aria-label="筛选搜索" aria-expanded={filtersOpen} data-filtered={Boolean(senderId || dateFrom || dateUntil)} onClick={() => setFiltersOpen((value) => !value)}><IconAdjustmentsHorizontal size={18} aria-hidden="true" /></Button></TooltipTrigger><TooltipContent>筛选</TooltipContent></Tooltip>
    </div>
    {hasSearchContent && <aside className="floating-surface chat-search-results" aria-label="搜索结果面板">
      <div className="chat-search-results-scroll">
        {filtersOpen && <div className="chat-search-filters">
          <SettingsSelect label="搜索成员" value={senderId} options={[{ value: "", label: "所有成员" }, ...Array.from(participants.values()).map((participant) => ({ value: participant.id, label: participant.display_name }))]} onValueChange={(value) => changeFilter(() => setSenderId(value))} />
          <div className="chat-search-dates"><label><span>从</span><input className="settings-control" aria-label="搜索开始日期" type="date" value={dateFrom} onChange={(event) => changeFilter(() => setDateFrom(event.target.value))} /></label><label><span>至</span><input className="settings-control" aria-label="搜索结束日期" type="date" value={dateUntil} onChange={(event) => changeFilter(() => setDateUntil(event.target.value))} /></label></div>
          {(senderId || dateFrom || dateUntil) && <Button type="button" variant="ghost" size="sm" onClick={() => changeFilter(() => { setSenderId(""); setDateFrom(""); setDateUntil("") })}>清除筛选</Button>}
        </div>}
        <div className="chat-search-summary" aria-live="polite">{pending ? "正在搜索全部历史…" : notice || (result ? `当前 ${result.items.length} 条匹配` : "搜索聊天")}</div>
        {error && <p role="alert" className="chat-search-feedback">{error}</p>}
        {result && !pending && !notice && result.items.length === 0 && <p className="chat-search-empty">没有匹配的消息。</p>}
        <ul aria-label="搜索结果" className="chat-search-list">
          {result?.items.map((hit) => {
            const participant = participants.get(hit.sender_id)!
            return <li key={hit.message_id}>
              <button type="button" className="chat-search-result" onClick={() => void locate(hit.seq, hit.message_id)} aria-label={`定位${participant.display_name}的消息`}>
                <span className="chat-search-sender"><Avatar name={participant.display_name} avatarId={participant.avatar_id} colorId={participant.kind === "agent" ? participant.id : undefined} generation={generation} size={28} /><span className="chat-search-author">{participant.display_name}</span><time dateTime={new Date(hit.created_at).toISOString()}>{formatter.format(hit.created_at)}</time></span>
                <span className="chat-search-body">
                  <span className="chat-search-snippet"><Highlight text={hit.snippet} query={result!.query} /></span>
                  <span className="chat-search-locate" aria-hidden="true"><IconCornerDownRight size={18} /></span>
                </span>
              </button>
            </li>
          })}
        </ul>
        {result?.has_more && <Button className="chat-search-more" variant="ghost" size="sm" disabled={pending} onClick={() => void search(result.next_cursor)}>加载更早的匹配</Button>}
      </div>
    </aside>}
  </>
}

export function SearchPanel({ open, onOpenChange, generation, contentEpoch = "0", participants, onLocate, onReturnFocus }: {
  participants: ReadonlyMap<string, Participant>
  open: boolean
  onOpenChange: (open: boolean) => void
  generation: string | null
  contentEpoch?: string
  onLocate: (seq: string, messageId: string) => Promise<void>
  onReturnFocus?: () => void
}) {
  const initializeMotion = useCallback((node: HTMLDivElement | null) => {
    if (node) node.dataset.motion = document.documentElement.dataset.inputModality === "keyboard" ? "instant" : "animated"
  }, [])

  return <DialogPrimitive.Root open={open} onOpenChange={onOpenChange} modal={false}>
    <div className="chat-search" data-open={open}>
      <DialogPrimitive.Content
        ref={initializeMotion}
        className="chat-search-content"
        aria-describedby={undefined}
        inert={!open}
        onCloseAutoFocus={(event) => { if (onReturnFocus) { event.preventDefault(); onReturnFocus() } }}
      >
        <DialogPrimitive.Title className="sr-only">搜索聊天</DialogPrimitive.Title>
        {!generation ? <p className="chat-search-feedback">本地聊天数据尚未就绪。</p> : open && <SearchForm key={generation} generation={generation} contentEpoch={contentEpoch} participants={participants} enabled onLocate={onLocate} onClose={() => onOpenChange(false)} />}
      </DialogPrimitive.Content>
      <DialogPrimitive.Trigger asChild><Button type="button" variant="ghost" size="icon" className="chat-search-toggle" aria-label={open ? "关闭搜索" : "搜索聊天"}>{open ? <IconX size={20} stroke={1.5} aria-hidden="true" /> : <IconSearch size={20} stroke={1.5} aria-hidden="true" />}</Button></DialogPrimitive.Trigger>
    </div>
  </DialogPrimitive.Root>
}
