import { useEffect, useRef, useState, type FormEvent, type KeyboardEvent, type PointerEvent as ReactPointerEvent } from "react"
import { IconSendFilled } from "@tabler/icons-react"
import { Button } from "@/components/ui/button"
import { errorMessage } from "@/app/ipc"
import { textValidationError } from "./textValidation"

const MIN_COMPOSER_HEIGHT = 76
const MAX_COMPOSER_HEIGHT = 190

type Props = {
  active?: boolean
  dataGenerationId: string | null
  disabled: boolean
  onSend: (text: string, requestId: string) => Promise<unknown>
}

export function MessageComposer({ active = true, dataGenerationId, disabled, onSend }: Props) {
  const [draft, setDraft] = useState("")
  const [sending, setSending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [retryGeneration, setRetryGeneration] = useState<string | null>(null)
  const [manualHeight, setManualHeight] = useState<number | null>(null)
  const composing = useRef(false)
  const input = useRef<HTMLTextAreaElement>(null)
  const draftRevision = useRef(0)
  const inFlight = useRef(false)
  const resizeOrigin = useRef<{ y: number; height: number } | null>(null)
  const failedRequest = useRef<{
    requestId: string
    revision: number
    generation: string | null
  } | null>(null)
  const limitError = draft.trim().length > 0 ? textValidationError(draft) : null
  const visibleError = error ?? limitError
  const canSend = !disabled && !sending && draft.trim().length > 0 && !limitError
  const isRetry = retryGeneration !== null && retryGeneration === dataGenerationId

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
    if (!active || !canSend) return
    const revision = draftRevision.current
    const requestId = failedRequest.current?.revision === revision
      && failedRequest.current.generation === dataGenerationId
      ? failedRequest.current.requestId
      : crypto.randomUUID()
    const sentText = draft
    inFlight.current = true
    setSending(true)
    setRetryGeneration(null)
    setError(null)
    try {
      await onSend(sentText, requestId)
      failedRequest.current = null
      if (draftRevision.current === revision) {
        draftRevision.current += 1
        setDraft("")
      }
    } catch (cause) {
      if (draftRevision.current === revision) {
        failedRequest.current = { requestId, revision, generation: dataGenerationId }
        setRetryGeneration(dataGenerationId)
      } else {
        failedRequest.current = null
      }
      setError(errorMessage(cause))
    } finally {
      inFlight.current = false
      setSending(false)
    }
  }

  function handleKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key !== "Enter" || event.shiftKey) return
    if (composing.current || event.nativeEvent.isComposing || event.keyCode === 229) return
    event.preventDefault()
    void submit()
  }

  return (
    <form onSubmit={(event) => void submit(event)} className="message-composer">
      <div className="composer-field">
        <div
          className="composer-resize-handle"
          role="separator"
          aria-orientation="horizontal"
          aria-label="拖动上边界调整输入框高度"
          tabIndex={0}
          onDoubleClick={resetHeight}
          onPointerDown={startResize}
          onPointerMove={resize}
          onPointerUp={endResize}
          onPointerCancel={endResize}
          onKeyDown={(event) => {
            if (event.key === "Home") { event.preventDefault(); resetHeight(); return }
            if (event.key !== "ArrowUp" && event.key !== "ArrowDown") return
            event.preventDefault()
            const current = manualHeight ?? input.current?.getBoundingClientRect().height ?? MIN_COMPOSER_HEIGHT
            const delta = event.key === "ArrowUp" ? 12 : -12
            setManualHeight(Math.min(MAX_COMPOSER_HEIGHT, Math.max(MIN_COMPOSER_HEIGHT, current + delta)))
          }}
        />
        <textarea
          ref={input}
          aria-label="消息输入"
          placeholder="说点什么……"
          value={draft}
          rows={3}
          className="composer-input"
          onChange={(event) => {
            draftRevision.current += 1
            failedRequest.current = null
            setRetryGeneration(null)
            setDraft(event.target.value)
            setError(null)
          }}
          onCompositionStart={() => { composing.current = true }}
          onCompositionEnd={() => { composing.current = false }}
          onKeyDown={handleKeyDown}
          onDoubleClick={resetHeight}
          aria-invalid={Boolean(visibleError)}
          aria-describedby={visibleError ? "composer-error" : undefined}
          disabled={disabled}
        />
        <div className="composer-actions">
          <Button
            type="submit"
            size="icon"
            className="composer-send"
            disabled={!canSend}
            aria-label={isRetry ? "重试发送" : "发送消息"}
          >
            <IconSendFilled size={18} aria-hidden="true" />
          </Button>
        </div>
      </div>
      <p id="composer-error" role={visibleError ? "alert" : undefined} className="composer-error">
        {visibleError ?? ""}
      </p>
    </form>
  )
}
