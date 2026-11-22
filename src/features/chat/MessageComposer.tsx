import { useEffect, useLayoutEffect, useRef, useState, type FormEvent, type KeyboardEvent, type PointerEvent as ReactPointerEvent } from "react"
import { IconAt, IconSendFilled, IconX } from "@tabler/icons-react"
import type { ChatMessage, Participant } from "@/contracts/generated"
import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuCheckboxItem, DropdownMenuContent, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { errorMessage } from "@/app/ipc"
import type { SendOptions } from "./useChatSession"
import { textValidationError } from "./textValidation"

const MIN_COMPOSER_HEIGHT = 76
const MAX_COMPOSER_HEIGHT = 190
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
  const [mentions, setMentions] = useState<{ generation: string | null; ids: string[]; all: boolean }>({ generation: dataGenerationId, ids: [], all: false })
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
  useLayoutEffect(() => {
    draftRevision.current += 1
    failedRequest.current = null
    currentGeneration.current = dataGenerationId
  }, [quoteMessageId, dataGenerationId])

  useEffect(() => {
    if (!active) return
    const textarea = input.current
    if (!textarea) return
    if (manualHeight !== null) {
      textarea.style.height = `${manualHeight}px`
      return
    }
    textarea.style.height = "auto"
    textarea.style.height = `${Math.min(MAX_COMPOSER_HEIGHT, Math.max(MIN_COMPOSER_HEIGHT, textarea.scrollHeight))}px`
  }, [active, draft, manualHeight])

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

  function resetHeight() { setManualHeight(MIN_COMPOSER_HEIGHT) }

  function startResize(event: ReactPointerEvent<HTMLDivElement>) {
    event.preventDefault()
    const height = input.current?.getBoundingClientRect().height ?? MIN_COMPOSER_HEIGHT
    resizeOrigin.current = { y: event.clientY, height }
    event.currentTarget.setPointerCapture(event.pointerId)
  }

  function resize(event: ReactPointerEvent<HTMLDivElement>) {
    const origin = resizeOrigin.current
    if (!origin) return
    const next = Math.min(MAX_COMPOSER_HEIGHT, Math.max(MIN_COMPOSER_HEIGHT, origin.height - (event.clientY - origin.y)))
    setManualHeight(next)
  }

  function endResize(event: ReactPointerEvent<HTMLDivElement>) {
    const origin = resizeOrigin.current
    if (!origin) return
    const next = Math.min(MAX_COMPOSER_HEIGHT, Math.max(MIN_COMPOSER_HEIGHT, origin.height - (event.clientY - origin.y)))
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
            setManualHeight(Math.min(MAX_COMPOSER_HEIGHT, Math.max(MIN_COMPOSER_HEIGHT, current + (event.key === "ArrowUp" ? 12 : -12))))
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
        <textarea ref={input} aria-label="消息输入" placeholder="说点什么……" value={draft} rows={3} className="composer-input"
          onChange={(event) => { editIntent(); setDraft(event.target.value) }}
          onCompositionStart={() => { composing.current = true }} onCompositionEnd={() => { composing.current = false }} onKeyDown={handleKeyDown} onDoubleClick={resetHeight}
          aria-invalid={Boolean(visibleError)} aria-describedby={visibleError ? "composer-error" : undefined} disabled={disabled} />
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
