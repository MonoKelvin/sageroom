import { createContext, useContext, useEffect, useSyncExternalStore } from "react"
import type { Appearance } from "@/contracts/generated"
import type { AppliedResource, ApplicationState, Versioned } from "./appliedResource"
import type { ConfigurationStore } from "./configurationStore"

export type ConfigurationRuntime = { store: ConfigurationStore | null; exiting: boolean; error: string | null; requestExit: () => Promise<void>; clearError: () => void }
export const ConfigurationContext = createContext<ConfigurationRuntime | null>(null)
const emptyAppearance: ApplicationState<Appearance> = { value: null, confirmed: null, loading: false, status: "idle", error: null }
const silentSubscribe = () => () => {}
const emptyAppearanceSnapshot = () => emptyAppearance

export function useConfigurationRuntime() {
  const runtime = useContext(ConfigurationContext)
  if (!runtime) throw new Error("设置生命周期不在应用外壳中。")
  return runtime
}

export function useConfiguration() {
  const store = useConfigurationRuntime().store
  if (!store) throw new Error("本地设置尚未就绪。")
  return store
}

export function useAppliedResource<T extends Versioned>(resource: AppliedResource<T>, active = true) {
  const state = useSyncExternalStore(resource.subscribe, resource.getSnapshot)
  useEffect(() => { if (active) void resource.ensureLoaded() }, [resource, active])
  return state
}

export function useConfigurationAppearance() {
  const resource = useConfigurationRuntime().store?.appearance
  return useSyncExternalStore(resource?.subscribe ?? silentSubscribe, resource?.getSnapshot ?? emptyAppearanceSnapshot).value ?? undefined
}

export function useAgentResources(active: boolean) {
  const store = useConfiguration()
  const state = useSyncExternalStore(store.subscribeAgents, store.getAgentSnapshot)
  useEffect(() => { if (active) { void store.loadAgents(); void store.global.ensureLoaded() } }, [store, active])
  return state
}
