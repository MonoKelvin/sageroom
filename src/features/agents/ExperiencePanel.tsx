import { useEffect, useRef, useState } from "react"
import { IconCheck, IconChevronDown, IconEdit, IconPlus, IconRefresh, IconScissors, IconStarFilled, IconTrash, IconX } from "@tabler/icons-react"
import type { AgentType, ExperienceEntry } from "@/contracts/generated"
import type { ConfigurationStore } from "@/app/configurationStore"
import { errorMessage } from "@/app/ipc"
import { AppDialog } from "@/components/ui/app-dialog"
import { Button } from "@/components/ui/button"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { SearchDatePicker } from "@/features/chat/SearchDatePicker"

type Props = {
  store: Pick<ConfigurationStore, "listExperience" | "addExperience" | "updateExperience" | "deleteExperience" | "pruneExperience">
  agentId: string
  agentType: AgentType
  active: boolean
  disabled: boolean
}

type Draft = { id: string; content: string; time: number; score: string }

const IMPORTANCE_HINT = "重要度：数值越高表示经历越重要，对话过程越会关注该经历"

const pad = (value: number) => String(value).padStart(2, "0")

/** `YYYY/MM/DD HH:mm` 与本地毫秒互转。 */
function stampToMs(stamp: string) {
  const match = /^(\d{4})\/(\d{2})\/(\d{2}) (\d{2}):(\d{2})$/.exec(stamp)
  if (!match) return Date.now()
  const [, year, month, day, hour, minute] = match.map(Number)
  return new Date(year, month - 1, day, hour, minute).getTime()
}
function msToStamp(value: number) {
  const date = new Date(value)
  return `${date.getFullYear()}/${pad(date.getMonth() + 1)}/${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}`
}

function IconAction({ label, hint, icon: Icon, onClick, disabled, danger }: {
  label: string; hint?: string; icon: typeof IconPlus; onClick: () => void; disabled?: boolean; danger?: boolean
}) {
  return <Tooltip disableHoverableContent><TooltipTrigger asChild>
    <Button variant="ghost" size="icon-sm" className={danger ? "danger-icon" : undefined} aria-label={label} disabled={disabled} onClick={onClick}><Icon size={16} aria-hidden="true" /></Button>
  </TooltipTrigger><TooltipContent>{hint ?? label}</TooltipContent></Tooltip>
}

export function ExperiencePanel({ store, agentId, agentType, active, disabled }: Props) {
  const [open, setOpen] = useState(false)
  const [entries, setEntries] = useState<ExperienceEntry[]>([])
  const [content, setContent] = useState("")
  const [score, setScore] = useState("50")
  const [keep, setKeep] = useState("100")
  const [pending, setPending] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [target, setTarget] = useState<ExperienceEntry | "prune" | null>(null)
  const [draft, setDraft] = useState<Draft | null>(null)
  const originalTime = useRef(0)
  const [hover, setHover] = useState<string | null>(null)
  const listRef = useRef<HTMLUListElement>(null)
  const focusId = useRef<string | null>(null)
  const epoch = useRef(0)
  const busy = useRef(false)
  const alive = useRef(false)
  const mounted = useRef(false)
  const revision = useRef(0)

  useEffect(() => { mounted.current = true; return () => { mounted.current = false } }, [])

  const engaged = active && open
  useEffect(() => {
    alive.current = engaged
    const token = ++epoch.current
    if (engaged) {
      void store.listExperience(agentId).then((items) => {
        if (alive.current && token === epoch.current) { setEntries(items); setError(null) }
      }).catch((cause: unknown) => {
        if (alive.current && token === epoch.current) setError(errorMessage(cause))
      }).finally(() => {
        if (alive.current && token === epoch.current) setLoading(false)
      })
    }
    return () => { alive.current = false; epoch.current += 1 }
  }, [store, agentId, engaged])

  // 保存后按新时间重排，并滚动到编辑过的那条。
  useEffect(() => {
    if (!focusId.current || !entries.length) return
    const id = focusId.current
    focusId.current = null
    requestAnimationFrame(() => {
      const node = listRef.current?.querySelector<HTMLElement>(`[data-entry-id="${id}"]`)
      node?.scrollIntoView({ block: "center", behavior: "smooth" })
      setHover(id)
    })
  }, [entries])

  async function refresh() {
    if (busy.current || !active) return
    const token = ++epoch.current
    setLoading(true)
    setError(null)
    try {
      const items = await store.listExperience(agentId)
      if (alive.current && token === epoch.current) setEntries(items)
    } catch (cause) { if (alive.current && token === epoch.current) setError(errorMessage(cause)) }
    finally { if (alive.current && token === epoch.current) setLoading(false) }
  }

  function validDraft(value: Draft): string | null {
    const text = value.content.trim()
    if (!text || [...text].length > 10000 || /[\r\n\0]/.test(text)) return "经历需要一行文字，最多 10000 个字符。"
    if (!Number.isFinite(value.time)) return "请选择有效的日期与时间。"
    const importance = Number(value.score)
    if (!value.score.trim() || !Number.isInteger(importance) || importance < 0 || importance > 100) return "重要度必须是 0～100 的整数。"
    return null
  }

  async function add() {
    if (busy.current || loading || disabled || !active) return
    const text = content.trim()
    const importance = Number(score)
    if (!text || [...text].length > 10000 || /[\r\n\0]/.test(text)) { setError("经历需要一行文字，最多 10000 个字符。"); return }
    if (!score.trim() || !Number.isInteger(importance) || importance < 0 || importance > 100) { setError("重要度必须是 0～100 的整数。"); return }
    busy.current = true
    const token = ++epoch.current
    const draftRevision = revision.current
    setPending(true)
    setError(null)
    try {
      const created = await store.addExperience(agentId, text, importance)
      if (!mounted.current) return
      if (draftRevision === revision.current) { setContent(""); revision.current += 1 }
      if (!alive.current || token !== epoch.current) return
      const items = await store.listExperience(agentId)
      if (alive.current && token === epoch.current) { setEntries(items); focusId.current = created.id }
    } catch (cause) { if (alive.current && token === epoch.current) setError(errorMessage(cause)) }
    finally { busy.current = false; if (mounted.current) setPending(false) }
  }

  async function saveDraft() {
    if (!draft || busy.current || disabled || !active) return
    const invalid = validDraft(draft)
    if (invalid) { setError(invalid); return }
    busy.current = true
    const token = ++epoch.current
    setPending(true)
    setError(null)
    try {
      const updated = await store.updateExperience(agentId, draft.id, draft.content.trim(), msToStamp(draft.time), Number(draft.score))
      if (!alive.current || token !== epoch.current) return
      const items = await store.listExperience(agentId)
      if (alive.current && token === epoch.current) { setEntries(items); setDraft(null); focusId.current = updated.id }
    } catch (cause) { if (alive.current && token === epoch.current) setError(errorMessage(cause)) }
    finally { busy.current = false; setPending(false) }
  }

  async function remove() {
    if (!target || busy.current || disabled || !active) return
    const count = Number(keep)
    if (target === "prune" && (!keep.trim() || !Number.isInteger(count) || count < 0 || count > 1000)) { setError("保留条数必须是 0～1000 的整数。"); return }
    busy.current = true
    const token = ++epoch.current
    setPending(true)
    setError(null)
    try {
      const items = target === "prune" ? await store.pruneExperience(agentId, count) : await store.deleteExperience(agentId, target.id)
      if (alive.current && token === epoch.current) { setEntries(items); setTarget(null) }
    } catch (cause) { if (alive.current && token === epoch.current) setError(errorMessage(cause)) }
    finally { busy.current = false; setPending(false) }
  }

  return <section className="experience-panel">
    <button type="button" className="experience-disclosure" aria-expanded={open} onClick={() => setOpen((value) => !value)}>
      <span>经历<span className="experience-count">（{entries.length}条经历）</span></span>
      <IconChevronDown size={18} aria-hidden="true" />
    </button>
    <div className="experience-collapse" data-open={open} inert={!open}>
      <div className="experience-collapse-clip">
        <div className="experience-content">
          <form className="experience-form" onSubmit={(event) => { event.preventDefault(); void add() }}>
            <div className="experience-form-head">
              <div className="experience-score"><Tooltip disableHoverableContent><TooltipTrigger asChild><button type="button" className="experience-score-icon" aria-label="重要度说明"><IconStarFilled size={14} aria-hidden="true" /></button></TooltipTrigger><TooltipContent>{IMPORTANCE_HINT}</TooltipContent></Tooltip><input type="number" className="settings-control" aria-label="经历重要度" min={0} max={100} step={1} value={score} disabled={disabled || pending} onChange={(event) => setScore(event.target.value)} /></div>
              <div className="config-actions experience-form-actions">
                <IconAction label="刷新经历" icon={IconRefresh} onClick={() => void refresh()} disabled={pending || loading} />
                <IconAction label="裁剪经历" icon={IconScissors} onClick={() => setTarget("prune")} disabled={disabled || pending || loading || !entries.length} />
                <IconAction label="添加经历" icon={IconPlus} onClick={() => void add()} disabled={disabled || pending || loading || !content.trim()} />
              </div>
            </div>
            <textarea className="settings-control experience-input" aria-label="经历内容" placeholder={agentType === "tool" ? "记录重要事务、已验证的结论或解决方案……" : "记下值得保留的事……"} value={content} rows={2} maxLength={10000} disabled={disabled || pending} onChange={(event) => { revision.current += 1; setContent(event.target.value); setError(null) }} />
          </form>
          {error && <p role="alert" className="settings-control-error">{error}</p>}
          {/* 默认折叠时不渲染读取状态，避免隐藏区域留下多余的 role=status。 */}
          {loading && open ? <p role="status" className="form-caption">正在读取经历…</p> : <>
            {!entries.length && <p className="experience-empty">还没有经历</p>}
            <ul className="experience-list" aria-label="经历列表" ref={listRef}>
              {[...entries].reverse().map((entry) => {
                const editing = draft?.id === entry.id
                const activeHover = hover === entry.id && !editing
                return <li key={entry.id} data-entry-id={entry.id} className="experience-entry" data-active={activeHover || undefined}
                  onPointerEnter={() => setHover(entry.id)} onPointerLeave={() => setHover((current) => (current === entry.id ? null : current))}>
                  {editing ? <div className="experience-edit">
                    <textarea className="settings-control experience-input" aria-label="编辑经历内容" value={draft.content} rows={2} maxLength={10000} disabled={pending} onChange={(event) => { setDraft({ ...draft, content: event.target.value }); setError(null) }} />
                    <div className="experience-edit-actions">
                      <div className="experience-edit-meta">
                        <SearchDatePicker label="编辑经历时间" value={draft.time} time onValueChange={(time) => setDraft({ ...draft, time })} onCancel={() => setDraft((current) => (current ? { ...current, time: originalTime.current } : current))} />
                        <div className="experience-score"><Tooltip disableHoverableContent><TooltipTrigger asChild><button type="button" className="experience-score-icon" aria-label="重要度说明"><IconStarFilled size={14} aria-hidden="true" /></button></TooltipTrigger><TooltipContent>{IMPORTANCE_HINT}</TooltipContent></Tooltip><input type="number" className="settings-control" aria-label="编辑经历重要度" min={0} max={100} value={draft.score} disabled={pending} onChange={(event) => setDraft({ ...draft, score: event.target.value })} /></div>
                      </div>
                      <div className="config-actions experience-edit-confirm">
                        <IconAction label="保存经历" icon={IconCheck} onClick={() => void saveDraft()} disabled={pending} />
                        <IconAction label="取消编辑" icon={IconX} onClick={() => { setDraft(null); setError(null) }} disabled={pending} />
                      </div>
                    </div>
                  </div> : <>
                    <div className="experience-entry-body"><p>{entry.content}</p><span className="form-caption experience-entry-meta">{entry.recorded_at} · <Tooltip disableHoverableContent><TooltipTrigger asChild><span className="experience-entry-score-hint"><IconStarFilled size={12} aria-hidden="true" />{entry.score}</span></TooltipTrigger><TooltipContent>{IMPORTANCE_HINT}</TooltipContent></Tooltip></span></div>
                    <div className="config-actions experience-entry-actions" data-visible={activeHover || undefined}>
                      <IconAction label={`编辑经历 ${entry.content}`} hint="编辑" icon={IconEdit} onClick={() => { const time = stampToMs(entry.recorded_at); originalTime.current = time; setDraft({ id: entry.id, content: entry.content, time, score: String(entry.score) }); setError(null) }} disabled={disabled || pending} />
                      <IconAction label={`删除经历 ${entry.content}`} hint="删除" icon={IconTrash} danger onClick={() => setTarget(entry)} disabled={disabled || pending} />
                    </div>
                  </>}
                </li>
              })}
            </ul>
          </>}
          <AppDialog open={target !== null && active} onOpenChange={(open) => { if (!open && !pending) setTarget(null) }} title={target === "prune" ? "裁剪经历" : "删除经历"} showClose={!pending} actions={[
            { label: target === "prune" ? "确认裁剪" : "确认删除经历", variant: "destructive", disabled: disabled || pending, closeOnClick: false, onClick: () => void remove() },
            { label: "取消", variant: "ghost", disabled: pending },
          ]}>
            {target === "prune" ? <div className="config-stack"><p>按重要度保留指定条数，其余永久删除；同分先删除较早的记录。</p><label className="form-field">保留条数<input type="number" className="settings-control settings-input" aria-label="保留条数" min={0} max={1000} step={1} value={keep} disabled={pending} onChange={(event) => setKeep(event.target.value)} /></label></div> : <p>永久删除这条经历？{target?.content}</p>}
            {error && <p role="alert" className="settings-control-error">{error}</p>}
          </AppDialog>
        </div>
      </div>
    </div>
  </section>
}
