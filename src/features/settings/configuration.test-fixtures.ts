import { createElement, type ReactNode } from "react"
import { afterAll, beforeAll, vi } from "vitest"
import type { AgentConfiguration, AppSnapshot, GlobalConfiguration, NewsConfigurationState, UserProfile } from "@/contracts/generated"
import { ConfigurationProvider } from "@/app/ConfigurationProvider"
import { ipc } from "@/app/ipc"
import * as ipcModule from "@/app/ipc"
import type { ApplicationPageProps } from "@/app/navigation"
import { inboxFixture, snapshot } from "@/features/chat/chat.test-fixtures"
import { defaultDimensions } from "./configurationDefaults"

export function globalConfiguration(): GlobalConfiguration {
  return { revision: "1", model_profiles: [{ id: "model-a", name: "常用模型", protocol: "openai_chat_completions", base_url: "https://example.com/v1", model_name: "test-model",revision: "1", credential_configured: false }], persona_presets: [{ id: "persona-a", name: "自然交流", language_style: "自然友善",skill: "整理资料", dimensions: { ...defaultDimensions }, revision: "1" }], }
}
export function newsConfiguration(): NewsConfigurationState {
  return { revision: "1", configuration: { enabled: true, provider: "google_news_rss", refresh_minutes: 30, max_items: 3, proxy_enabled: false, proxy_mode: "system", proxy_url: "" } }
}
export function agentConfiguration(id = "sage-test", name = "Sage"): AgentConfiguration {
  return { agent_id: id, revision: "1", display_name: name, gender_description: null,language_style: "自然", skill: "", dimensions: { ...defaultDimensions }, avatar_id: null, agent_type: "social", model: null, }
}
export function userProfile(): UserProfile {
  return { participant_id: "user-test", display_name: "我", avatar_id: null, revision: "1" }
}
export function pageProps(active = true): ApplicationPageProps {
  const base = snapshot()
  const pageSnapshot = { ...base, local_user: { ...base.local_user, avatar_id: null, profile_revision: "1" }, participants: base.participants.map((participant) => ({ ...participant, avatar_id: null, profile_revision: "1" })) }
  return { active, onNavigate: vi.fn(), inbox: inboxFixture(), session: {
    snapshot: pageSnapshot, page: null, loading: false, loadingMore: false, error: null, hasNewMessages: false, atBottom: true,
    firstItemIndex: 0, windowRevision: 0, targetMessageId: null, restoreAnchor: null, enteringIds: new Set<string>(), setChatActive: vi.fn(), reload: vi.fn().mockResolvedValue(undefined), send: vi.fn(), recall: vi.fn(), goToLatest: vi.fn(), jumpTo: vi.fn(), updateAtBottom: vi.fn(), updateRenderedAnchor: vi.fn(), applyRoom: vi.fn(), applyAppearance: vi.fn(), loadOlder: vi.fn(), loadNewer: vi.fn(),
  } }
}

export function ConfigurationTestProvider({ children, snapshot: value }: { children: ReactNode; snapshot: AppSnapshot | null }) {
  return createElement(ConfigurationProvider, { snapshot: value, children })
}

const missingMethods = ["scrollIntoView", "hasPointerCapture", "setPointerCapture", "releasePointerCapture"] as const
const addedMethods: string[] = []
beforeAll(() => {
  for (const method of missingMethods) if (!(method in HTMLElement.prototype)) {
    Object.defineProperty(HTMLElement.prototype, method, { configurable: true, value: method === "hasPointerCapture" ? () => false : () => {} })
    addedMethods.push(method)
  }
  if (!globalThis.ResizeObserver) vi.stubGlobal("ResizeObserver", class { observe() {} unobserve() {} disconnect() {} })
})
afterAll(() => {
  for (const method of addedMethods) Reflect.deleteProperty(HTMLElement.prototype, method)
  vi.unstubAllGlobals()
})

/** In-memory RPC boundary for UI tests; never invokes Tauri or model services. */
export function mockConfigurationIpc() {
  vi.restoreAllMocks()
  const data = { global: globalConfiguration(), news: newsConfiguration(), agents: [agentConfiguration(), agentConfiguration("second", "第二位")], user: userProfile(), appearance: pageProps().session.snapshot!.appearance }
  const nextRevision = (revision: string) => String(BigInt(revision) + 1n)
  vi.spyOn(ipcModule, "isDesktopEnvironment").mockReturnValue(false)
  vi.spyOn(ipc, "getGlobalConfiguration").mockImplementation(async () => structuredClone(data.global))
  vi.spyOn(ipc, "getNewsConfiguration").mockImplementation(async () => structuredClone(data.news))
  vi.spyOn(ipc, "saveNewsConfiguration").mockImplementation(async (request) => {
    data.news = { revision: nextRevision(request.expected_revision), configuration: request.configuration }
    return structuredClone(data.news)
  })
  vi.spyOn(ipc, "newsSecretStatus").mockImplementation(async (request) => ({ provider: request.provider, configured: false }))
  vi.spyOn(ipc, "setNewsSecret").mockImplementation(async (request) => ({ provider: request.provider, configured: request.api_key !== null }))
  vi.spyOn(ipc, "previewNews").mockImplementation(async () => ({
    provider: data.news.configuration.provider,
    fetched_at: "1795580000000", cached: false, stale: false, diagnostics: [],
    items: [{ title: "测试热点", url: "https://example.com/news", source: "测试源", published: "2026-11-25", summary: "测试摘要" }],
  }))
  vi.spyOn(ipc, "listAgents").mockImplementation(async () => structuredClone(data.agents))
  vi.spyOn(ipc, "getUserProfile").mockImplementation(async () => structuredClone(data.user))
  vi.spyOn(ipc, "snapshot").mockImplementation(async () => ({ ...pageProps().session.snapshot!, appearance: structuredClone(data.appearance) }))
  vi.spyOn(ipc, "saveGlobalConfiguration").mockImplementation(async (request) => {
    data.global = {
      revision: nextRevision(data.global.revision),
      model_profiles: request.model_profiles.map((profile) => ({ ...profile, revision: nextRevision(data.global.model_profiles.find((item) => item.id === profile.id)?.revision ?? "0"), credential_configured: data.global.model_profiles.find((item) => item.id === profile.id)?.credential_configured ?? false })),
      persona_presets: request.persona_presets.map((persona) => ({ ...persona, revision: nextRevision(data.global.persona_presets.find((item) => item.id === persona.id)?.revision ?? "0") })),
    }
    return structuredClone(data.global)
  })
  vi.spyOn(ipc, "saveAgent").mockImplementation(async (request) => {
    const agent = { ...request.configuration, revision: nextRevision(request.expected_revision ?? "0") }
    data.agents = [...data.agents.filter((item) => item.agent_id !== agent.agent_id), agent]
    return structuredClone(agent)
  })
  vi.spyOn(ipc, "controlAgentRuntime").mockImplementation(async (request) => ({
    agent_id: request.agent_id,
    config_revision: data.agents.find((agent) => agent.agent_id === request.agent_id)?.revision ?? "1",
    status: request.paused ? "paused" : "observing",
    detail: null,
    next_wake_at: null,
    requests_today: 0,
  }))
  vi.spyOn(ipc, "saveUserProfile").mockImplementation(async (request) => {
    data.user = { participant_id: data.user.participant_id, display_name: request.display_name, avatar_id: request.avatar_id, revision: nextRevision(request.expected_revision) }
    return structuredClone(data.user)
  })
  vi.spyOn(ipc, "saveAppearance").mockImplementation(async (request) => {
    data.appearance = { theme: request.theme, reduce_motion: request.reduce_motion, revision: nextRevision(request.expected_revision) }
    return structuredClone(data.appearance)
  })
  vi.spyOn(ipc, "importAvatar").mockResolvedValue(null)
  vi.spyOn(ipc, "readAvatar").mockImplementation(async (request) => ({ avatar_id: request.avatar_id, mime_type: "image/png", data_base64: "YWJj" }))
  vi.spyOn(ipc, "secretStatus").mockResolvedValue({ profile_id: "model-a", configured: false })
  vi.spyOn(ipc, "setSecret").mockImplementation(async (request) => {
    const profile = data.global.model_profiles.find((item) => item.id === request.profile_id)!
    profile.credential_configured = true
    profile.revision = nextRevision(profile.revision)
    data.global.revision = nextRevision(data.global.revision)
    return { profile_id: profile.id, configured: true }
  })
  vi.spyOn(ipc, "testModel").mockResolvedValue({ profile_id: "model-a", revision: "1", protocol: "openai_chat_completions", available: true, usage_input_tokens: 12, usage_output_tokens: 1, elapsed_ms: 80 })
  vi.spyOn(ipc, "importDevelopmentModel").mockImplementation(async () => structuredClone(data.global))
  vi.spyOn(ipc, "exit").mockResolvedValue({ shutting_down: true })
  return data
}
