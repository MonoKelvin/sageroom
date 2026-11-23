import { useEffect, useLayoutEffect, useRef, useState, type KeyboardEvent } from "react"
import * as PopoverPrimitive from "@radix-ui/react-popover"
import { IconCalendar, IconChevronLeft, IconChevronRight } from "@tabler/icons-react"
import { applicationBounds, applicationFrame, applicationLayerContainer } from "@/app/application-layers"
import { Button } from "@/components/ui/button"
import { SettingsSelect } from "@/components/ui/settings-select"
import "./search-date-picker.css"

const dateFormatter = new Intl.DateTimeFormat("zh-CN", { year: "numeric", month: "2-digit", day: "2-digit" })
const dayFormatter = new Intl.DateTimeFormat("zh-CN", { year: "numeric", month: "long", day: "numeric" })
const weekdays = ["一", "二", "三", "四", "五", "六", "日"]
const pad = (value: number) => String(value).padStart(2, "0")
const dayKey = (date: Date) => `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`
const monthStart = (date: Date) => new Date(date.getFullYear(), date.getMonth(), 1)

function instantMotion() {
  return document.documentElement.dataset.inputModality === "keyboard" || document.documentElement.dataset.reducedMotion === "true" || window.matchMedia?.("(prefers-reduced-motion: reduce)").matches
}

const bounded = (value: number, min?: number | null, max?: number | null) => Math.min(max ?? Infinity, Math.max(min ?? -Infinity, value))

type Props = {
  label: string
  value: number | null
  min?: number | null
  max?: number | null
  onValueChange: (value: number) => void
  onClear?: () => void
  onCurrent?: () => void
}

function Calendar({ initialValue, currentTime, min, max, onConfirm, onClear, onCurrent }: Omit<Props, "value" | "label" | "onValueChange"> & { initialValue: number; currentTime: number; onConfirm: (value: number) => void }) {
  const initial = bounded(initialValue, min, max)
  const [draft, setDraft] = useState(initial)
  const [month, setMonth] = useState(() => monthStart(new Date(initial)))
  const [focusedDay, setFocusedDay] = useState(() => dayKey(new Date(initial)))
  const grid = useRef<HTMLTableElement>(null)
  const focusRequested = useRef(false)
  const value = bounded(draft, min, max)
  const date = new Date(value)
  const first = new Date(month)
  first.setDate(1 - (first.getDay() + 6) % 7)
  const days = Array.from({ length: 42 }, (_, index) => { const day = new Date(first); day.setDate(first.getDate() + index); return day })
  const currentYear = new Date(initial).getFullYear()
  const firstYear = Math.min(new Date(currentTime).getFullYear() - 100, currentYear)
  const lastYear = Math.max(new Date(currentTime).getFullYear() + 10, currentYear)
  const years = Array.from({ length: lastYear - firstYear + 1 }, (_, index) => ({ value: String(firstYear + index), label: `${firstYear + index} 年` }))
  const months = Array.from({ length: 12 }, (_, index) => ({ value: String(index), label: `${index + 1} 月` }))
  const today = dayKey(new Date(currentTime))

  function outside(start: number, end: number) {
    return (min != null && end < min) || (max != null && start > max)
  }

  function disabled(day: Date) {
    const start = new Date(day); start.setHours(0, 0, 0, 0)
    const end = new Date(day); end.setHours(23, 59, 59, 999)
    return outside(start.getTime(), end.getTime())
  }

  function navigate(next: Date, focus = false) {
    setMonth(monthStart(next))
    setFocusedDay(dayKey(next))
    focusRequested.current = focus
  }

  useLayoutEffect(() => {
    if (!focusRequested.current) return
    focusRequested.current = false
    grid.current?.querySelector<HTMLButtonElement>(`[data-day="${focusedDay}"]`)?.focus()
  }, [focusedDay, month])

  function moveFocus(event: KeyboardEvent<HTMLButtonElement>, day: Date) {
    const next = new Date(day)
    if (event.key === "ArrowLeft") next.setDate(next.getDate() - 1)
    else if (event.key === "ArrowRight") next.setDate(next.getDate() + 1)
    else if (event.key === "ArrowUp") next.setDate(next.getDate() - 7)
    else if (event.key === "ArrowDown") next.setDate(next.getDate() + 7)
    else if (event.key === "Home") next.setDate(next.getDate() - (next.getDay() + 6) % 7)
    else if (event.key === "End") next.setDate(next.getDate() + 6 - (next.getDay() + 6) % 7)
    else if (event.key === "PageUp" || event.key === "PageDown") {
      const originalDay = next.getDate()
      next.setDate(1)
      next.setMonth(next.getMonth() + (event.key === "PageUp" ? -1 : 1) * (event.shiftKey ? 12 : 1))
      next.setDate(Math.min(originalDay, new Date(next.getFullYear(), next.getMonth() + 1, 0).getDate()))
    } else return
    event.preventDefault()
    if (!disabled(next)) navigate(next, true)
  }

  function selectDay(day: Date) {
    const next = new Date(value)
    next.setFullYear(day.getFullYear(), day.getMonth(), day.getDate())
    setDraft(bounded(next.getTime(), min, max))
    navigate(day)
  }

  return <>
    <div className="search-calendar-heading">
      <Button variant="ghost" size="icon-sm" aria-label="上个月" onClick={() => navigate(new Date(month.getFullYear(), month.getMonth() - 1, 1))}><IconChevronLeft size={17} aria-hidden="true" /></Button>
      <div className="search-calendar-month">
        <SettingsSelect label="选择年份" value={String(month.getFullYear())} options={years} onValueChange={(year) => navigate(new Date(Number(year), month.getMonth(), 1))} />
        <SettingsSelect label="选择月份" value={String(month.getMonth())} options={months} onValueChange={(value) => navigate(new Date(month.getFullYear(), Number(value), 1))} />
      </div>
      <Button variant="ghost" size="icon-sm" aria-label="下个月" onClick={() => navigate(new Date(month.getFullYear(), month.getMonth() + 1, 1))}><IconChevronRight size={17} aria-hidden="true" /></Button>
    </div>
    <table ref={grid} role="grid" className="search-calendar-grid" aria-label={`${month.getFullYear()} 年 ${month.getMonth() + 1} 月`}>
      <thead><tr>{weekdays.map((weekday) => <th key={weekday} scope="col">{weekday}</th>)}</tr></thead>
      <tbody>{Array.from({ length: 6 }, (_, week) => <tr key={week}>{days.slice(week * 7, week * 7 + 7).map((day) => {
        const key = dayKey(day)
        const selected = key === dayKey(date)
        return <td key={key} aria-selected={selected}><button type="button" className="search-calendar-day" data-day={key} data-focused={key === focusedDay} data-outside={day.getMonth() !== month.getMonth()} data-selected={selected} aria-label={dayFormatter.format(day)} aria-current={key === today ? "date" : undefined} disabled={disabled(day)} tabIndex={key === focusedDay && !disabled(day) ? 0 : -1} onFocus={() => setFocusedDay(key)} onKeyDown={(event) => moveFocus(event, day)} onClick={() => selectDay(day)}>{day.getDate()}</button></td>
      })}</tr>)}</tbody>
    </table>
    <div className="search-calendar-actions">
      {onClear && <Button variant="ghost" size="sm" onClick={onClear}>清空</Button>}
      {onCurrent && <Button variant="ghost" size="sm" disabled={min != null && min > currentTime} onClick={onCurrent}>今天</Button>}
      <Button size="sm" onClick={() => onConfirm(value)}>确定</Button>
    </div>
  </>
}

export function SearchDatePicker({ label, value, min, max, onValueChange, onClear, onCurrent }: Props) {
  const [open, setOpen] = useState(false)
  const [present, setPresent] = useState(false)
  const [reference, setReference] = useState(() => Date.now())
  const [currentTime, setCurrentTime] = useState(() => Date.now())
  const [revision, setRevision] = useState(0)
  const [motion, setMotion] = useState("animated")
  const [side, setSide] = useState<"bottom" | "left">("bottom")
  const content = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (open || !present) return
    let cancelled = false
    const transitions = content.current?.getAnimations() ?? []
    void Promise.all(transitions.map((transition) => transition.finished.catch(() => {}))).then(() => { if (!cancelled) setPresent(false) })
    return () => { cancelled = true }
  }, [open, present])

  function changeOpen(next: boolean) {
    const instant = instantMotion()
    setMotion(instant ? "instant" : "animated")
    setOpen(next)
    if (next) { const now = Date.now(); setSide(applicationBounds().height < 480 ? "left" : "bottom"); setCurrentTime(now); setReference(value ?? now); setRevision((value) => value + 1); setPresent(true) }
    else if (instant) setPresent(false)
  }

  function confirm(value: number) {
    const selected = new Date(value)
    if (onCurrent) { selected.setHours(0, 0, 0, 0); selected.setDate(selected.getDate() + 1); onValueChange(selected.getTime() - 1) }
    else { selected.setHours(0, 0, 0, 0); onValueChange(selected.getTime()) }
    changeOpen(false)
  }
  const empty = value == null
  const displayValue = value ?? reference

  return <PopoverPrimitive.Root open={open} onOpenChange={changeOpen}>
    <PopoverPrimitive.Trigger asChild>
      <button type="button" className="search-date-trigger" aria-label={label} data-value={value ?? ""}>
        <IconCalendar size={18} aria-hidden="true" />
        <span>{empty && !onCurrent ? "—" : dateFormatter.format(displayValue)}</span>
      </button>
    </PopoverPrimitive.Trigger>
    {present && <PopoverPrimitive.Portal forceMount container={applicationLayerContainer()}>
      <PopoverPrimitive.Content ref={content} forceMount className="floating-surface search-date-popover" aria-label={label} aria-describedby={undefined} side={side} align={side === "left" ? "center" : onCurrent ? "end" : "start"} sideOffset={8} collisionPadding={12} collisionBoundary={applicationFrame()} data-motion={motion} inert={!open} onOpenAutoFocus={(event) => { event.preventDefault(); content.current?.querySelector<HTMLButtonElement>('[data-focused="true"]:not(:disabled)')?.focus() }} onEscapeKeyDown={(event) => event.stopPropagation()}>
        <PopoverPrimitive.Title className="sr-only">{label}</PopoverPrimitive.Title>
        <Calendar key={revision} initialValue={reference} currentTime={currentTime} min={min} max={max ?? (onClear ? currentTime : undefined)} onConfirm={confirm} onClear={onClear ? () => { onClear(); changeOpen(false) } : undefined} onCurrent={onCurrent ? () => { onCurrent(); changeOpen(false) } : undefined} />
      </PopoverPrimitive.Content>
    </PopoverPrimitive.Portal>}
  </PopoverPrimitive.Root>
}
