import { useEffect, useRef, useState, type ReactNode } from "react"
import type { AppLifecycleEvent, AppSnapshot } from "@/contracts/generated"
import { ConfigurationStore } from "./configurationStore"
import { ConfigurationContext } from "./configurationContext"
import { errorMessage, ipc, isDesktopEnvironment } from "./ipc"

export function ConfigurationProvider({ snapshot, children }: { snapshot: AppSnapshot | null; children: ReactNode }) {
  const generation = snapshot?.data_generation_id
  const [session, setSession] = useState(() => ({ generation, store: snapshot ? new ConfigurationStore(snapshot) : null }))
  const [exiting, setExiting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  if (session.generation !== generation) {
    setSession({ generation, store: snapshot ? new ConfigurationStore(snapshot) : null })
    setExiting(false)
    setError(null)
  }
  const store = session.store
  const exitRequest = useRef<string | null>(null)
  const lifetimes = useRef(new Map<ConfigurationStore, number>())

  useEffect(() => {
    if (!store) return
    const lifetime = (lifetimes.current.get(store) ?? 0) + 1
    lifetimes.current.set(store, lifetime)
    const registry = lifetimes.current
    return () => { queueMicrotask(() => { if (registry.get(store) === lifetime) { store.dispose(); registry.delete(store) } }) }
  }, [store])

  useEffect(() => {
    if (!store || !snapshot) return
    store.appearance.ingest(snapshot.appearance)
    store.user.ingest({ participant_id: snapshot.local_user.id, display_name: snapshot.local_user.display_name, introduction: snapshot.local_user.introduction, avatar_id: snapshot.local_user.avatar_id, revision: snapshot.local_user.profile_revision })
  }, [store, snapshot])

  useEffect(() => {
    if (!isDesktopEnvironment()) return
    let disposed = false
    let unsubscribe: (() => void) | undefined
    async function prepare(event: AppLifecycleEvent) {
      if (disposed || event.payload.kind !== "exit_prepare") return
      const id = event.payload.request_id
      if (exitRequest.current === id) return
      if (store && event.data_generation_id !== store.snapshot.data_generation_id) return
      exitRequest.current = id
      store?.freeze(true)
      setExiting(true)
      setError(null)
      let acknowledged = false
      try {
        await store?.flush()
        if (disposed || exitRequest.current !== id) return
        acknowledged = true
        const result = await ipc.completeExit({ data_generation_id: event.data_generation_id, request_id: id, ready: true })
        if (!disposed && !result.shutting_down) {
          exitRequest.current = null
          store?.freeze(false)
          setExiting(false)
        }
      } catch (cause) {
        if (disposed) return
        if (!acknowledged) await ipc.completeExit({ data_generation_id: event.data_generation_id, request_id: id, ready: false }).catch(() => {})
        if (exitRequest.current === id) exitRequest.current = null
        store?.freeze(false)
        setExiting(false)
        setError(errorMessage(cause))
      }
    }
    void ipc.subscribeLifecycle((event) => {
      if (disposed) return
      if (event.payload.kind === "exit_cancelled") {
        if (exitRequest.current && event.payload.request_id !== exitRequest.current) return
        exitRequest.current = null
        store?.freeze(false)
        setExiting(false)
        setError(event.payload.error.message)
      } else void prepare(event)
    }, (cause) => { if (!disposed) setError(errorMessage(cause)) }).then((unlisten) => {
      if (disposed) unlisten()
      else unsubscribe = unlisten
    }).catch((cause: unknown) => { if (!disposed) setError(errorMessage(cause)) })
    return () => { disposed = true; exitRequest.current = null; unsubscribe?.(); store?.freeze(false) }
  }, [store])

  async function requestExit() {
    if (exiting) return
    setExiting(true)
    setError(null)
    try { await ipc.exit({ data_generation_id: generation ?? null }) }
    catch (cause) { setExiting(false); setError(errorMessage(cause)) }
  }

  return <ConfigurationContext value={{ store, exiting, error, requestExit, clearError: () => setError(null) }}>{children}</ConfigurationContext>
}
