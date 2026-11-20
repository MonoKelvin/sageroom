import { useEffect, useReducer, useRef } from "react"
import { errorMessage } from "@/app/ipc"

export function useControlAction<Value>(onChange: (value: Value) => void | Promise<void>) {
  const [state, patch] = useReducer(
    (current: { pending: number; error: string | null }, update: Partial<typeof current>) => ({ ...current, ...update }),
    { pending: 0, error: null },
  )
  const pending = useRef(0)
  const revision = useRef(0)
  const mounted = useRef(true)
  useEffect(() => {
    mounted.current = true
    return () => { mounted.current = false }
  }, [])
  async function run(value: Value) {
    const token = ++revision.current
    patch({ pending: ++pending.current, error: null })
    try { await onChange(value) }
    catch (cause) { if (mounted.current && token === revision.current) patch({ error: errorMessage(cause) }) }
    finally {
      pending.current -= 1
      if (mounted.current) patch({ pending: pending.current })
    }
  }
  return { ...state, run }
}
