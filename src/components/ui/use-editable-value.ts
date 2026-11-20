import { useEffect, useReducer, useRef } from "react"
import { errorMessage } from "@/app/ipc"

export interface EditableValueProps {
  value: string
  onApply: (value: string) => Promise<void>
  label?: string
  active?: boolean
  validate?: (value: string) => string | null
  normalize?: (value: string) => string
  resetOnApply?: boolean
}

interface EditorState {
  draft: string
  applied: string
  cancelValue: string
  revision: number
  focused: boolean
  error: string | null
  pending: number
}

export function useEditableValue({
  value, onApply, validate, normalize, resetOnApply = false,
  disabled = false, readOnly = false, secret = false,
}: EditableValueProps & { disabled?: boolean; readOnly?: boolean; secret?: boolean }) {
  const initial = secret ? "" : value
  const [state, publish] = useReducer((_previous: EditorState, next: EditorState) => next, {
    draft: initial, applied: initial, cancelValue: initial, revision: 0,
    focused: false, error: null, pending: 0,
  })
  const session = useRef(state)
  const mounted = useRef(true)
  const lastAttempt = useRef<number | null>(null)
  const requestSequence = useRef(0)
  const acceptedSequence = useRef(0)
  const externalVersion = useRef(0)
  const baseline = useRef(initial)
  const canceledRevision = useRef<number | null>(null)
  const lastSubmission = useRef<{ value: string; revision: number } | null>(null)
  const submissions = useRef(new Map<number, { value: string; revision: number }>())
  const queuedExternal = useRef<{ value: string; revision: number; stale?: boolean } | null>(null)

  function patch(update: Partial<EditorState>) {
    session.current = { ...session.current, ...update }
    if (mounted.current) publish(session.current)
  }

  useEffect(() => {
    mounted.current = true
    return () => { mounted.current = false }
  }, [])

  useEffect(() => {
    const current = session.current
    const next = secret ? "" : value
    const supersededAcknowledgement = lastSubmission.current?.value !== next
      && [...submissions.current].some(([sequence, submission]) =>
        sequence < requestSequence.current && submission.value === next && submission.revision < current.revision)
    if (supersededAcknowledgement) {
      if (current.pending) {
        queuedExternal.current = { value: next, revision: current.revision, stale: true }
        return
      }
      if (current.focused || !current.error || current.revision !== lastAttempt.current) return
    }
    baseline.current = next
    externalVersion.current += 1
    if (current.pending) {
      queuedExternal.current = { value: next, revision: current.revision }
      return
    }
    const oldAcknowledgement = canceledRevision.current === current.revision
      && lastSubmission.current?.value === next
      && lastSubmission.current.revision < current.revision
    if (oldAcknowledgement) return
    const dirty = current.draft !== current.applied
    if (dirty && (current.focused || current.revision !== lastAttempt.current || !current.error)) return
    session.current = { ...current, draft: next, applied: next, cancelValue: next, error: null }
    publish(session.current)
  }, [value, secret])

  function change(draft: string) {
    const current = session.current
    if (draft === current.draft) return
    // 上次提交后的首个新改动，必须从当时父值取撤销快照。
    const newEdit = current.draft === current.applied || current.revision === lastAttempt.current
    patch({
      draft, revision: current.revision + 1, error: null,
      cancelValue: newEdit ? baseline.current : current.cancelValue,
    })
  }

  function focus() {
    patch({ focused: true })
  }

  function cancel() {
    const restored = secret ? "" : session.current.cancelValue
    canceledRevision.current = session.current.revision + 1
    patch({ draft: restored, applied: restored, revision: canceledRevision.current, error: null })
  }

  async function commit(nativeError?: string, retry = false) {
    const current = session.current
    if (disabled || readOnly || current.draft === current.applied) return
    if (lastAttempt.current === current.revision && !(retry && current.error && !current.pending)) return
    lastAttempt.current = current.revision
    let next: string
    try {
      next = normalize ? normalize(current.draft) : current.draft
      const problem = validate?.(next) || nativeError
      if (problem) {
        patch({ error: secret ? "输入不符合要求，请重新输入。" : problem })
        return
      }
    } catch (cause) {
      patch({ error: secret ? "输入不符合要求，请重新输入。" : errorMessage(cause) })
      return
    }
    if (next === current.applied) {
      patch({ draft: next, error: null })
      return
    }
    const revision = current.revision
    const previousSequence = requestSequence.current
    if (!current.pending) {
      submissions.current.clear()
      if (lastSubmission.current) submissions.current.set(previousSequence, lastSubmission.current)
    }
    const sequence = ++requestSequence.current
    const startingExternalVersion = externalVersion.current
    // 密码只能交给回调，不能留在组件快照或异常信息中。
    lastSubmission.current = secret ? null : { value: next, revision }
    if (lastSubmission.current) submissions.current.set(sequence, lastSubmission.current)
    patch({ pending: current.pending + 1, error: null,
      ...(secret ? { draft: "", applied: "", cancelValue: "" } : {}),
    })
    try {
      await onApply(next)
      if (!mounted.current) return
      const latest = session.current
      const newest = sequence > acceptedSequence.current
      if (newest) acceptedSequence.current = sequence
      const accepted = secret || resetOnApply ? ""
        : externalVersion.current > startingExternalVersion ? baseline.current : next
      if (newest && externalVersion.current === startingExternalVersion) baseline.current = accepted
      const acceptBaseline = newest && (latest.revision === revision || latest.draft !== latest.applied)
      patch({
        ...(acceptBaseline ? { applied: accepted } : {}),
        ...(latest.revision === revision && newest ? {
          draft: accepted, cancelValue: accepted, error: null,
        } : {}),
      })
    } catch (cause) {
      if (mounted.current && session.current.revision === revision) {
        patch({ error: secret ? "凭据未能应用，请重新输入后重试。" : errorMessage(cause) })
      }
    } finally {
      if (mounted.current) {
        patch({ pending: Math.max(0, session.current.pending - 1) })
        if (!session.current.pending) {
          const update = queuedExternal.current
          queuedExternal.current = null
          const latest = session.current
          // 晚到的外部更新只能协调原提交，不能撤掉之后的输入或叉号。
          const failed = Boolean(latest.error)
          const reconciles = failed ? update?.value !== lastSubmission.current?.value : !update?.stale
          if (update && update.revision === latest.revision && latest.revision === lastAttempt.current
            && !secret && !resetOnApply && !latest.focused && reconciles) {
            baseline.current = update.value
            patch({ draft: update.value, applied: update.value, cancelValue: update.value, error: null })
          }
        }
      }
    }
  }

  function leave(nativeError?: string) {
    patch({ focused: false })
    void commit(nativeError)
  }

  return { ...state, dirty: state.draft !== state.applied, change, focus, cancel, commit, leave }
}
