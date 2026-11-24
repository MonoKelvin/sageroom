import { useEffect, useLayoutEffect, useRef, useState, type FormEvent, type KeyboardEvent, type PointerEvent as ReactPointerEvent } from "react"
import { IconAt, IconClipboard, IconCopy, IconCut, IconSelectAll, IconSendFilled, IconTrash, IconX } from "@tabler/icons-react"
import type { ChatMessage, Participant } from "@/contracts/generated"
import { Button } from "@/components/ui/button"
import { ContextMenu, type ContextMenuItem } from "@/components/ui/context-menu"
import { DropdownMenu, DropdownMenuCheckboxItem, DropdownMenuContent, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { errorMessage, ipc } from "@/app/ipc"
import type { SendOptions } from "./useChatSession"
import { textValidationError } from "./textValidation"

const MIN_COMPOSER_HEIGHT = 76
// 折叠/展开的过渡：与全局 motion token 一致，先快后慢
const HEIGHT_TRANSITION = "height var(--motion-duration-long) var(--motion-ease), min-height var(--motion-duration-long) var(--motion-ease)"
const NO_PARTICIPANTS: readonly Participant[] = []

type Props = {
  active?: boolean
  dataGenerationId: string | null
  disabled: boolean
  participants?: readonly Participant[]
  canMentionAll?: boolean
  quoteMessageId?: string | null
  quote?: ChatMessage | null
  onRemoveQuote?: () => void
  onSend: (text: string, requestId: string, options: SendOptions) => Promise<unknown>
}

export function MessageComposer({ active = true, dataGenerationId, disabled, participants = NO_PARTICIPANTS, canMentionAll = false, quoteMessageId = null, quote = null, onRemoveQuote, onSend }: Props) {
  const [draft, setDraft] = useState("")
  const [sending, setSending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [retry, setRetry] = useState<{ generation: string | null; quoteId: string | null } | null>(null)
  const [intentSource, setIntentSource] = useState({ generation: dataGenerationId, quoteId: quoteMessageId })
  if (intentSource.generation !== dataGenerationId || intentSource.quoteId !== quoteMessageId) {
    setIntentSource({ generation: dataGenerationId, quoteId: quoteMessageId })
    setRetry(null)
    setError(null)
  }
  const [manualHeight, setManualHeight] = useState<number | null>(null)
  // 最大高度 = 聊天区域的一半，随窗口尺寸变化；无法测量时回退 190px。
  const [maxHeight, setMaxHeight] = useState(190)
  // 高度变化是否走过渡：拖拽时即时跟手，双击/键盘调整时启用缓动。
  const [animateHeight, setAnimateHeight] = useState(false)
  const [mentions, setMentions] = useState<{ generation: string | null; ids: string[]; all: boolean }>({ generation: dataGenerationId, ids: [], all: false })
  // 右键菜单用：打开前记录选区快照，菜单项启用状态据此决定，避免打开后选区被菜单夺焦清掉。
  const [selection, setSelection] = useState<{ start: number; end: number } | null>(null)
  const composing = useRef(false)
  const input = useRef<HTMLTextAreaElement>(null)
  const draftRevision = useRef(0)
  const inFlight = useRef(false)
  const currentGeneration = useRef(dataGenerationId)
  const alive = useRef(false)
  const resizeOrigin = useRef<{ y: number; height: number } | null>(null)
  const failedRequest = useRef<{ requestId: string; revision: number; generation: string | null } | null>(null)
  const selectedIds = mentions.generation === dataGenerationId ? mentions.ids : []
  const mentionAll = mentions.generation === dataGenerationId && mentions.all && canMentionAll
  const limitError = draft.trim().length > 0 ? textValidationError(draft) : null
  const visibleError = error ?? limitError
  const canSend = !disabled && !sending && draft.trim().length > 0 && !limitError
  const isRetry = retry !== null && retry.generation === dataGenerationId && retry.quoteId === quoteMessageId

  useEffect(() => { alive.current = true; return () => { alive.current = false } }, [])

  // 输入框最大高度取聊天区域的一半：拖到该上限即止，窗口缩放时同步更新。
  useEffect(() => {
    const textarea = input.current
    const host = textarea?.closest(".chat-conversation") ?? textarea?.closest(".chat-card")
    if (!host) return
    const measure = () => {
      const size = host.getBoundingClientRect().height
      if (size <= 0) return
      const next = Math.max(MIN_COMPOSER_HEIGHT, Math.round(size / 2))
      setMaxHeight(next)
      // 上限变小时收回已展开的高度，避免超出聊天区一半。
      setManualHeight((current) => (current !== null && current > next ? next : current))
    }
    measure()
    // 环境不支持时只做首帧测量，不影响功能（如部分测试环境）
    if (typeof ResizeObserver === "undefined") return
    const observer = new ResizeObserver(measure)
    observer.observe(host)
    return () => observer.disconnect()
  }, [])

  useLayoutEffect(() => {
    draftRevision.current += 1
    failedRequest.current = null
    currentGeneration.current = dataGenerationId
  }, [quoteMessageId, dataGenerationId])

  useEffect(() => {
    if (!active) return
    const textarea = input.current
    if (!textarea) return
    // 只对双击/键盘这类离散调整启用过渡；拖拽跟手与文本自增高保持即时，避免滞后。
    textarea.style.transition = animateHeight ? HEIGHT_TRANSITION : "none"
    if (manualHeight !== null) {
      textarea.style.height = `${manualHeight}px`
      return
    }
    textarea.style.height = "auto"
    textarea.style.height = `${Math.min(maxHeight, Math.max(MIN_COMPOSER_HEIGHT, textarea.scrollHeight))}px`
  }, [active, draft, manualHeight, maxHeight, animateHeight])

  // 过渡结束后关闭动画标记，避免影响后续拖拽。
  useEffect(() => {
    if (!animateHeight) return
    const textarea = input.current
    if (!textarea) return
    const clear = () => setAnimateHeight(false)
    textarea.addEventListener("transitionend", clear, { once: true })
    return () => textarea.removeEventListener("transitionend", clear)
  }, [animateHeight])

  function editIntent() {
    draftRevision.current += 1
    failedRequest.current = null
    setRetry(null)
    setError(null)
  }

  function selectMention(id: string, checked: boolean) {
    editIntent()
    setMentions({ generation: dataGenerationId, ids: checked ? [...selectedIds, id] : selectedIds.filter((selected) => selected !== id), all: false })
  }

  /** 双击/Home：最小态展开到上限，其余折叠回最小，带动画。 */
  function resetHeight() {
    const current = input.current?.getBoundingClientRect().height ?? manualHeight ?? MIN_COMPOSER_HEIGHT
    setAnimateHeight(true)
    setManualHeight(current <= MIN_COMPOSER_HEIGHT + 1 ? maxHeight : MIN_COMPOSER_HEIGHT)
  }

  function startResize(event: ReactPointerEvent<HTMLDivElement>) {
    event.preventDefault()
    // 开始拖拽即关闭过渡，保证跟手。
    setAnimateHeight(false)
    const height = input.current?.getBoundingClientRect().height ?? MIN_COMPOSER_HEIGHT
    resizeOrigin.current = { y: event.clientY, height }
    event.currentTarget.setPointerCapture(event.pointerId)
  }

  function resize(event: ReactPointerEvent<HTMLDivElement>) {
    const origin = resizeOrigin.current
    if (!origin) return
    const next = Math.min(maxHeight, Math.max(MIN_COMPOSER_HEIGHT, origin.height - (event.clientY - origin.y)))
    setManualHeight(next)
  }

  function endResize(event: ReactPointerEvent<HTMLDivElement>) {
    const origin = resizeOrigin.current
    if (!origin) return
    const next = Math.min(maxHeight, Math.max(MIN_COMPOSER_HEIGHT, origin.height - (event.clientY - origin.y)))
    setManualHeight(next <= MIN_COMPOSER_HEIGHT ? MIN_COMPOSER_HEIGHT : next)
    resizeOrigin.current = null
    if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId)
  }

  async function submit(event?: FormEvent) {
    event?.preventDefault()
    if (!active || !canSend || inFlight.current) return
    const revision = draftRevision.current
    const requestId = failedRequest.current?.revision === revision && failedRequest.current.generation === dataGenerationId
      ? failedRequest.current.requestId : crypto.randomUUID()
    const sentText = draft
    const options: SendOptions = { quote_message_id: quoteMessageId, mention_ids: [...selectedIds], mention_all: mentionAll }
    inFlight.current = true
    setSending(true)
    setRetry(null)
    setError(null)
    try {
      await onSend(sentText, requestId, options)
      if (!alive.current) return
      failedRequest.current = null
      if (draftRevision.current === revision && currentGeneration.current === dataGenerationId) {
        draftRevision.current += 1
        setDraft("")
        setMentions({ generation: dataGenerationId, ids: [], all: false })
        onRemoveQuote?.()
      }
    } catch (cause) {
      if (!alive.current) return
      if (draftRevision.current === revision && currentGeneration.current === dataGenerationId) {
        failedRequest.current = { requestId, revision, generation: dataGenerationId }
        setRetry({ generation: dataGenerationId, quoteId: quoteMessageId })
      } else failedRequest.current = null
      setError(errorMessage(cause))
    } finally {
      inFlight.current = false
      if (alive.current) setSending(false)
    }
  }

  function handleKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key !== "Enter" || event.shiftKey) return
    if (composing.current || event.nativeEvent.isComposing || event.keyCode === 229) return
    event.preventDefault()
    void submit()
  }

  const quotedText = quote?.parts.flatMap((part) => part.kind === "text" ? [part.text] : []).join("")
  const quoteName = quote ? participants.find((participant) => participant.id === quote.sender_id)?.display_name : null

  // ---- 输入框右键菜单：常规文本编辑 ----
  const selectedText = selection && selection.end > selection.start ? draft.slice(selection.start, selection.end) : ""
  const canEdit = !disabled && !sending

  function focusInput(next?: { start: number; end: number }) {
    const textarea = input.current
    if (!textarea) return
    textarea.focus({ preventScroll: true })
    if (next) textarea.setSelectionRange(next.start, next.end)
  }

  async function copySelection() {
    if (!selectedText) return
    try {
      await navigator.clipboard.writeText(selectedText)
      focusInput(selection ?? undefined)
    } catch { setError("复制失败，请重试。") }
  }

  async function cutSelection() {
    if (!selection || !selectedText) return
    try { await navigator.clipboard.writeText(selectedText) } catch { setError("剪切失败，请重试。"); return }
    editIntent()
    const next = draft.slice(0, selection.start) + draft.slice(selection.end)
    setDraft(next)
    setSelection({ start: selection.start, end: selection.start })
    requestAnimationFrame(() => focusInput({ start: selection.start, end: selection.start }))
  }

  async function pasteAtSelection() {
    const target = selection ?? { start: draft.length, end: draft.length }
    // 优先原生剪贴板：WebView2 的 navigator.clipboard.readText 需要额外授权，常被拒绝
    let text: string
    try {
      text = await ipc.readClipboardText()
    } catch (nativeError) {
      try {
        text = await navigator.clipboard.readText()
      } catch {
        setError(nativeError instanceof Error ? nativeError.message : "无法读取剪贴板，请检查系统权限。")
        return
      }
    }
    if (!text) return
    editIntent()
    const next = draft.slice(0, target.start) + text + draft.slice(target.end)
    const caret = target.start + text.length
    setDraft(next)
    setSelection({ start: caret, end: caret })
    requestAnimationFrame(() => focusInput({ start: caret, end: caret }))
  }

  function selectAll() {
    const textarea = input.current
    if (!textarea) return
    textarea.focus({ preventScroll: true })
    // 显式设置范围，不依赖 select()（菜单项刚点击过，焦点与选区状态可能尚未同步）
    textarea.setSelectionRange(0, textarea.value.length)
    setSelection({ start: 0, end: textarea.value.length })
  }

  function deleteSelection() {
    if (!selection || !selectedText) return
    editIntent()
    const next = draft.slice(0, selection.start) + draft.slice(selection.end)
    setDraft(next)
    setSelection({ start: selection.start, end: selection.start })
    requestAnimationFrame(() => focusInput({ start: selection.start, end: selection.start }))
  }

  const editorMenuItems: ContextMenuItem[] = [
    { key: "copy", icon: <IconCopy size={16} aria-hidden="true" />, label: "复制", disabled: !selectedText, onSelect: () => void copySelection() },
    { key: "cut", icon: <IconCut size={16} aria-hidden="true" />, label: "剪切", disabled: !selectedText || !canEdit, onSelect: () => void cutSelection() },
    { key: "paste", icon: <IconClipboard size={16} aria-hidden="true" />, label: "粘贴", disabled: !canEdit, onSelect: () => void pasteAtSelection() },
    { key: "select-all", icon: <IconSelectAll size={16} aria-hidden="true" />, label: "全选", disabled: draft.length === 0, onSelect: selectAll },
    { key: "delete", icon: <IconTrash size={16} aria-hidden="true" />, label: "删除", variant: "destructive", disabled: !selectedText || !canEdit, onSelect: deleteSelection },
  ]

  function rememberSelection(event: React.MouseEvent<HTMLTextAreaElement>) {
    const textarea = event.currentTarget
    setSelection({ start: textarea.selectionStart, end: textarea.selectionEnd })
  }

  // 右键时若已有选区，阻止浏览器把光标移到点击处（那会清掉选区，让菜单操作失去目标）。
  function keepSelectionOnRightDown(event: React.MouseEvent<HTMLTextAreaElement>) {
    if (event.button !== 2) return
    const target = event.currentTarget
    if (target.selectionStart === target.selectionEnd) return
    event.preventDefault()
  }

  // 滚轮按「行」滚动：普通滚 1 行，按住 Ctrl 加速到 4 行。
  // 必须用原生监听且 passive: false —— React 的 onWheel 是 passive，
  // preventDefault 会被忽略，浏览器仍按默认约 3 行滚动。
  useEffect(() => {
    const textarea = input.current
    if (!textarea) return
    const onWheel = (event: WheelEvent) => {
      if (textarea.scrollHeight <= textarea.clientHeight) return
      const styles = getComputedStyle(textarea)
      const lineHeight = Number.parseFloat(styles.lineHeight) || Number.parseFloat(styles.fontSize) * 1.5 || 21
      const lines = event.ctrlKey ? 4 : 1
      event.preventDefault()
      textarea.scrollTop += Math.sign(event.deltaY) * lineHeight * lines
    }
    textarea.addEventListener("wheel", onWheel, { passive: false })
    return () => textarea.removeEventListener("wheel", onWheel)
  }, [])

  return (
    <form onSubmit={(event) => void submit(event)} className="message-composer">
      <div className="composer-field">
        <div className="composer-resize-handle" role="separator" aria-orientation="horizontal" aria-label="拖动上边界调整输入框高度" tabIndex={0}
          onDoubleClick={resetHeight} onPointerDown={startResize} onPointerMove={resize} onPointerUp={endResize} onPointerCancel={endResize}
          onKeyDown={(event) => {
            if (event.key === "Home") { event.preventDefault(); resetHeight(); return }
            if (event.key !== "ArrowUp" && event.key !== "ArrowDown") return
            event.preventDefault()
            const current = manualHeight ?? input.current?.getBoundingClientRect().height ?? MIN_COMPOSER_HEIGHT
            setAnimateHeight(true)
            setManualHeight(Math.min(maxHeight, Math.max(MIN_COMPOSER_HEIGHT, current + (event.key === "ArrowUp" ? 12 : -12))))
          }} />
        {(quoteMessageId || selectedIds.length > 0 || mentionAll) && <div className="composer-context">
          {quoteMessageId && <div className="composer-quote" aria-label="引用预览">
            <span><strong>{quoteName ?? "引用"}</strong><span>{quote?.state === "visible" ? quotedText?.slice(0, 120) : "原消息不可用"}</span></span>
            <Tooltip><TooltipTrigger asChild><Button type="button" variant="ghost" size="icon-sm" aria-label="取消引用" onClick={() => { editIntent(); onRemoveQuote?.(); input.current?.focus() }}><IconX size={16} aria-hidden="true" /></Button></TooltipTrigger><TooltipContent>取消引用</TooltipContent></Tooltip>
          </div>}
          <div className="composer-mentions">
            {mentionAll ? <button type="button" className="composer-mention-chip" aria-label="移除提及所有人" onClick={() => { editIntent(); setMentions({ generation: dataGenerationId, ids: [], all: false }) }}>@所有人<IconX size={13} aria-hidden="true" /></button> : selectedIds.map((id) => <button type="button" key={id} className="composer-mention-chip" aria-label={`移除提及 ${participants.find((participant) => participant.id === id)?.display_name ?? "已离开成员"}`} onClick={() => selectMention(id, false)}>@{participants.find((participant) => participant.id === id)?.display_name ?? "已离开成员"}<IconX size={13} aria-hidden="true" /></button>)}
          </div>
        </div>}
        <ContextMenu items={editorMenuItems} label="输入框编辑" preserveTriggerFocus
          // 只把焦点还给输入框，不重设范围：菜单操作已自行设好光标，用旧 state 会覆盖它
          onCloseAutoFocus={(event) => { event.preventDefault(); focusInput() }}>
          <textarea ref={input} aria-label="消息输入" placeholder="说点什么……" value={draft} rows={3} className="composer-input"
            onChange={(event) => { editIntent(); setDraft(event.target.value); setSelection({ start: event.target.selectionStart, end: event.target.selectionEnd }) }}
            onSelect={(event) => { const target = event.currentTarget; setSelection({ start: target.selectionStart, end: target.selectionEnd }) }}
            onContextMenu={rememberSelection}
            onMouseDown={keepSelectionOnRightDown}
            onCompositionStart={() => { composing.current = true }} onCompositionEnd={() => { composing.current = false }} onKeyDown={handleKeyDown}
            aria-invalid={Boolean(visibleError)} aria-describedby={visibleError ? "composer-error" : undefined} disabled={disabled} />
        </ContextMenu>
        <div className="composer-actions">
          {participants.length > 0 && <DropdownMenu modal={false}>
            <Tooltip><TooltipTrigger asChild><DropdownMenuTrigger asChild><Button type="button" variant="ghost" size="icon" className="composer-mention-toggle" aria-label="提及成员" disabled={disabled}><IconAt size={18} aria-hidden="true" /></Button></DropdownMenuTrigger></TooltipTrigger><TooltipContent>提及成员</TooltipContent></Tooltip>
            <DropdownMenuContent align="start" onCloseAutoFocus={(event) => { event.preventDefault(); input.current?.focus() }} aria-label="选择提及成员">
              {canMentionAll && <><DropdownMenuCheckboxItem checked={mentionAll} onSelect={(event) => event.preventDefault()} onCheckedChange={(checked) => { editIntent(); setMentions({ generation: dataGenerationId, ids: [], all: checked === true }) }}>所有人</DropdownMenuCheckboxItem><DropdownMenuSeparator /></>}
              {participants.map((participant) => <DropdownMenuCheckboxItem key={participant.id} checked={mentionAll || selectedIds.includes(participant.id)} disabled={!mentionAll && selectedIds.length >= 32 && !selectedIds.includes(participant.id)} onSelect={(event) => event.preventDefault()} onCheckedChange={(checked) => selectMention(participant.id, checked === true)}>{participant.display_name}</DropdownMenuCheckboxItem>)}
            </DropdownMenuContent>
          </DropdownMenu>}
          <Tooltip><TooltipTrigger asChild><Button type="submit" size="icon" className="composer-send" disabled={!canSend} aria-label={isRetry ? "重试发送" : "发送消息"}><IconSendFilled size={18} aria-hidden="true" /></Button></TooltipTrigger><TooltipContent>{isRetry ? "重试发送" : "发送"}</TooltipContent></Tooltip>
        </div>
      </div>
      <p id="composer-error" role={visibleError ? "alert" : undefined} className="composer-error">{visibleError ?? ""}</p>
    </form>
  )
}
