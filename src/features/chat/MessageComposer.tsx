import { useEffect, useRef, useState, type FormEvent, type KeyboardEvent } from "react"
import { IconSend2 } from "@tabler/icons-react"
import { Button } from "@/components/ui/button"
import { errorMessage } from "@/app/ipc"
import { textValidationError } from "./textValidation"

type Props = {
  dataGenerationId: string | null
  disabled: boolean
  onSend: (text: string, requestId: string) => Promise<unknown>
}

export function MessageComposer({ dataGenerationId, disabled, onSend }: Props) {
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
    const textarea = input.current
    if (!textarea) return
    textarea.style.height = "auto"
    textarea.style.height = `${Math.min(160, Math.max(72, textarea.scrollHeight))}px`
  }, [draft])

  async function submit(event?: FormEvent) {
    event?.preventDefault()
    if (disabled || inFlight.current || composing.current) return
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
    <form onSubmit={(event) => void submit(event)} className="shrink-0 border-t border-border/60 bg-chrome px-3 pb-3 pt-2.5">
      <div className="rounded-xl bg-content px-3 pt-2.5 ring-1 ring-input/70 focus-within:ring-2 focus-within:ring-ring">
        <textarea
          ref={input}
          aria-label="消息输入"
          placeholder="说点什么……"
          value={draft}
          rows={3}
          className="block max-h-40 min-h-18 w-full resize-none overflow-y-auto bg-transparent text-sm leading-relaxed outline-none placeholder:text-text-secondary"
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
      <p id="composer-error" role={error || validationError ? "alert" : undefined} className="mt-1.5 min-h-4 text-xs text-destructive">
        {error || validationError || ""}
      </p>
    </form>
  )
}
