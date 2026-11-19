import { useCallback, useEffect, useRef, useState } from "react"
import { errorMessage, IpcError } from "@/app/ipc"

type Versioned = { revision: string }

export function usePageActivation(active: boolean, generation: string | null) {
  const [activatedGeneration, setActivatedGeneration] = useState(active ? generation : null)
  if (active && generation && activatedGeneration !== generation) setActivatedGeneration(generation)
  return Boolean(generation && activatedGeneration === generation)
}

export function useLocalEditor<T extends Versioned>({ active, load, initial, rebase }: {
  active: boolean
  load: () => Promise<T>
  initial?: T
  rebase?: (draft: T, saved: T) => T
}) {
  const [server, setServer] = useState<T | null>(initial ?? null)
  const [draft, setDraft] = useState<T | null>(initial ?? null)
  const [loading, setLoading] = useState(false)
  const [pending, setPending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [conflict, setConflict] = useState(false)
  const [saved, setSaved] = useState(false)
  const [confirmReload, setConfirmReload] = useState(false)
  const alive = useRef(false)
  const seeded = useRef(Boolean(initial))
  const started = useRef(Boolean(initial))
  const busy = useRef(false)
  const epoch = useRef(0)
  const edits = useRef(0)
  const currentDraft = useRef(draft)
  const currentServer = useRef(server)
  const retry = useRef<{ fingerprint: string; id: string } | null>(null)
  const dirty = Boolean(draft && JSON.stringify(draft) !== JSON.stringify(server))

  useEffect(() => {
    alive.current = true
    const initiallySeeded = seeded.current
    return () => { alive.current = false; epoch.current += 1; busy.current = false; started.current = initiallySeeded }
  }, [])

  const read = useCallback(async () => {
    if (!alive.current || busy.current) return
    const token = ++epoch.current
    busy.current = true
    setLoading(true)
    setError(null)
    setConfirmReload(false)
    try {
      const result = await load()
      if (!alive.current || token !== epoch.current) return
      currentDraft.current = result
      currentServer.current = result
      setServer(result)
      setDraft(result)
      edits.current += 1
      retry.current = null
      setConflict(false)
      setSaved(false)
    } catch (cause) {
      if (alive.current && token === epoch.current) setError(errorMessage(cause))
    } finally {
      if (alive.current && token === epoch.current) { busy.current = false; setLoading(false) }
    }
  }, [load])

  useEffect(() => {
    if (!active || started.current) return
    started.current = true
    void read()
  }, [active, read])

  function edit(value: T | ((previous: T) => T)) {
    const next = typeof value === "function" ? value(currentDraft.current!) : value
    currentDraft.current = next
    edits.current += 1
    retry.current = null
    setDraft(next)
    setSaved(false)
  }

  async function save(write: (draft: T, requestId: string, revision: string) => Promise<T>) {
    const submitted = currentDraft.current
    const base = currentServer.current
    if (!alive.current || !submitted || !base || busy.current) return
    const fingerprint = JSON.stringify({ submitted, revision: base.revision })
    const requestId = retry.current?.fingerprint === fingerprint ? retry.current.id : crypto.randomUUID()
    retry.current = { fingerprint, id: requestId }
    const token = ++epoch.current
    const editVersion = edits.current
    busy.current = true
    setPending(true)
    setError(null)
    setSaved(false)
    try {
      const result = await write(submitted, requestId, base.revision)
      if (!alive.current || token !== epoch.current) return
      currentServer.current = result
      setServer(result)
      const next = edits.current === editVersion ? result : rebase
        ? rebase(currentDraft.current!, result)
        : { ...currentDraft.current!, revision: result.revision }
      currentDraft.current = next
      setDraft(next)
      retry.current = null
      setConflict(false)
      setSaved(edits.current === editVersion)
      return result
    } catch (cause) {
      if (alive.current && token === epoch.current) {
        setError(errorMessage(cause))
        setConflict(cause instanceof IpcError && (cause.detail.code === "CONFIG_CONFLICT" || cause.detail.code === "DATA_GENERATION_CHANGED"))
      }
    } finally {
      if (alive.current && token === epoch.current) { busy.current = false; setPending(false) }
    }
  }

  function ingestServer(result: T) {
    if (!alive.current || (currentServer.current && BigInt(result.revision) < BigInt(currentServer.current.revision))) return
    const previous = currentDraft.current
    const hasEdits = previous && JSON.stringify(previous) !== JSON.stringify(currentServer.current)
    const next = hasEdits ? rebase ? rebase(previous, result) : { ...previous, revision: result.revision } : result
    currentServer.current = result
    currentDraft.current = next
    retry.current = null
    setServer(result)
    setDraft(next)
  }

  function requestReload() {
    if (dirty) setConfirmReload(true)
    else void read()
  }

  return { server, draft, edit, ingestServer, dirty, loading, pending, error, conflict, saved, save,
    requestReload, confirmReload, cancelReload: () => setConfirmReload(false), reload: read }
}
