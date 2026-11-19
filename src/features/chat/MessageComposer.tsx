import { useEffect, useRef, useState, type FormEvent, type KeyboardEvent } from "react"
import { IconSend2 } from "@tabler/icons-react"
import { Button } from "@/components/ui/button"
import { errorMessage } from "@/app/ipc"
import { textValidationError } from "./textValidation"

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
  const composing = useRef(false)
  const input = useRef<HTMLTextAreaElement>(null)
  const draftRevision = useRef(0)
  const inFlight = useRef(false)
  const failedRequest = useRef<{
    requestId: string
    revision: number
    generation: string | null
  } | null>(null)
  const validationError = draft.length > 0 ? textValidationError(draft) : null
  const isRetry = retryGeneration !== null && retryGeneration === dataGenerationId

  useEffect(() => {
    if (!active) return
    const textarea = input.current
    if (!textarea) return
    textarea.style.height = "auto"
    textarea.style.height = `${Math.min(160, Math.max(72, textarea.scrollHeight))}px`
  }, [active, draft])

  async function submit(event?: FormEvent) {
    event?.preventDefault()
    if (!active || disabled || inFlight.current || composing.current) return
    const invalid = textValidationError(draft)
    if (invalid) {
      setError(invalid)
      return
    }
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
          aria-invalid={Boolean(error || validationError)}
          aria-describedby="composer-note composer-error"
          disabled={disabled}
        />
        <div className="flex items-center justify-between gap-2 pb-2 pt-1">
          <p id="composer-note" className="text-xs text-text-secondary">Shift+Enter 换行</p>
          <Button
            type="submit"
            size="sm"
            disabled={disabled || sending || draft.trim().length === 0 || Boolean(validationError)}
            aria-label={isRetry ? "重试发送" : "发送消息"}
          >
            <IconSend2 size={16} aria-hidden="true" />
            {sending ? "保存中" : isRetry ? "重试" : "发送"}
          </Button>
        </div>
      </div>
      <p id="composer-error" role={error || validationError ? "alert" : undefined} className="composer-error mt-1.5 text-xs text-destructive">
        {error || validationError || ""}
      </p>
    </form>
  )
}
