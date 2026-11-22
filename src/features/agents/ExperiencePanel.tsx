import { useEffect, useRef, useState, type FormEvent } from "react"
import { IconChevronDown, IconPlus, IconRefresh, IconScissors, IconTrash } from "@tabler/icons-react"
import type { ExperienceEntry } from "@/contracts/generated"
import type { ConfigurationStore } from "@/app/configurationStore"
import { errorMessage } from "@/app/ipc"
import { AppDialog } from "@/components/ui/app-dialog"
import { Button } from "@/components/ui/button"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"

type Props = {
  store: Pick<ConfigurationStore, "listExperience" | "addExperience" | "deleteExperience" | "pruneExperience">
  agentId: string
  active: boolean
  disabled: boolean
}

function ExperienceEditor({ store, agentId, active, disabled }: Props) {
  const [entries, setEntries] = useState<ExperienceEntry[]>([])
  const [content, setContent] = useState("")
  const [score, setScore] = useState("50")
  const [keep, setKeep] = useState("100")
  const [pending, setPending] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [target, setTarget] = useState<ExperienceEntry | "prune" | null>(null)
  const epoch = useRef(0)
  const busy = useRef(false)
  const alive = useRef(false)
  const revision = useRef(0)

  useEffect(() => {
    alive.current = active
    const token = ++epoch.current
    if (active) {
      void store.listExperience(agentId).then((items) => {
        if (alive.current && token === epoch.current) { setEntries(items); setError(null) }
      }).catch((cause: unknown) => {
        if (alive.current && token === epoch.current) setError(errorMessage(cause))
      }).finally(() => {
        if (alive.current && token === epoch.current) setLoading(false)
      })
    }
    return () => { alive.current = false; epoch.current += 1 }
  }, [store, agentId, active])

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

  async function add(event: FormEvent) {
    event.preventDefault()
    if (busy.current || disabled || !active) return
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
      await store.addExperience(agentId, text, importance)
      if (!alive.current || token !== epoch.current) return
      if (draftRevision === revision.current) { setContent(""); revision.current += 1 }
      const items = await store.listExperience(agentId)
      if (alive.current && token === epoch.current) setEntries(items)
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

  return <div className="experience-content">
    <div className="experience-toolbar">
      <p className="form-caption">重要度 0–100，高分优先保留。</p>
      <div className="config-actions">
        <Tooltip><TooltipTrigger asChild><Button variant="ghost" size="icon-sm" aria-label="刷新经历" disabled={pending || loading} onClick={() => void refresh()}><IconRefresh size={18} aria-hidden="true" /></Button></TooltipTrigger><TooltipContent>刷新经历</TooltipContent></Tooltip>
        <Tooltip><TooltipTrigger asChild><Button variant="ghost" size="icon-sm" aria-label="裁剪经历" disabled={disabled || pending || loading || !entries.length} onClick={() => setTarget("prune")}><IconScissors size={18} aria-hidden="true" /></Button></TooltipTrigger><TooltipContent>按重要度裁剪</TooltipContent></Tooltip>
      </div>
    </div>
    <form className="experience-form" onSubmit={(event) => void add(event)}>
      <textarea className="settings-control experience-input" aria-label="经历内容" placeholder="记下值得保留的事……" value={content} rows={2} maxLength={10000} disabled={disabled || pending} onChange={(event) => { revision.current += 1; setContent(event.target.value); setError(null) }} />
      <div className="experience-form-actions">
        <label className="experience-score">重要度<input type="number" className="settings-control" aria-label="经历重要度" min={0} max={100} step={1} value={score} disabled={disabled || pending} onChange={(event) => setScore(event.target.value)} /></label>
        <Tooltip><TooltipTrigger asChild><Button type="submit" size="icon-sm" aria-label="添加经历" disabled={disabled || pending || !content.trim()}><IconPlus size={18} aria-hidden="true" /></Button></TooltipTrigger><TooltipContent>添加经历</TooltipContent></Tooltip>
      </div>
    </form>
    {error && <p role="alert" className="settings-control-error">{error}</p>}
    {loading ? <p role="status" className="form-caption">正在读取经历…</p> : <>
      {!entries.length && <p className="experience-empty">还没有经历</p>}
      <ul className="experience-list" aria-label="经历列表">
        {[...entries].reverse().map((entry) => <li key={entry.id} className="experience-entry">
          <div className="experience-entry-body"><p>{entry.content}</p><span className="form-caption">{entry.recorded_at} · {entry.score}</span></div>
          <Tooltip><TooltipTrigger asChild><Button variant="ghost" size="icon-sm" aria-label={`删除经历 ${entry.content}`} disabled={disabled || pending} onClick={() => setTarget(entry)}><IconTrash size={17} aria-hidden="true" /></Button></TooltipTrigger><TooltipContent>删除经历</TooltipContent></Tooltip>
        </li>)}
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
}

export function ExperiencePanel(props: Props) {
  const [open, setOpen] = useState(false)
  const [initialized, setInitialized] = useState(false)
  return <section className="experience-panel">
    <button type="button" className="experience-disclosure" aria-expanded={open} onClick={() => { setInitialized(true); setOpen((value) => !value) }}><span>经历</span><IconChevronDown size={18} aria-hidden="true" /></button>
    {initialized && <div hidden={!open}><ExperienceEditor key={props.agentId} {...props} active={props.active && open} /></div>}
  </section>
}
