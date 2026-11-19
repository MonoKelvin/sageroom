import { vi } from "vitest"
import type { AgentConfiguration, GlobalConfiguration, UserProfile } from "@/contracts/generated"
import type { ApplicationPageProps } from "@/app/navigation"
import { snapshot } from "@/features/chat/chat.test-fixtures"
import { defaultDimensions, defaultParameters, defaultPreferences } from "./configurationDefaults"

export function globalConfiguration(): GlobalConfiguration {
  return { revision: "1", model_profiles: [{ id: "model-a", name: "常用模型", protocol: "openai_chat_completions", base_url: "https://example.com/v1", model_name: "test-model", parameters: { ...defaultParameters }, revision: "1", credential_configured: false }], persona_presets: [{ id: "persona-a", name: "自然交流", language_style: "自然友善", address_terms: ["朋友"], skill: "整理资料", dimensions: { ...defaultDimensions }, revision: "1" }], runtime_defaults: { ...defaultPreferences } }
}
export function agentConfiguration(id = "sage-test", name = "Sage"): AgentConfiguration {
  return { agent_id: id, revision: "1", display_name: name, introduction: "群聊成员", gender_description: null, address_terms: [], language_style: "自然", skill: "", dimensions: { ...defaultDimensions }, avatar_id: null, agent_type: "social", model: null, preferences: { ...defaultPreferences } }
}
export function userProfile(): UserProfile {
  return { participant_id: "user-test", display_name: "我", introduction: "本地用户", avatar_id: null, revision: "1" }
}
export function pageProps(active = true): ApplicationPageProps {
  const base = snapshot()
  const pageSnapshot = { ...base, local_user: { ...base.local_user, avatar_id: null, profile_revision: "1" }, participants: base.participants.map((participant) => ({ ...participant, avatar_id: null, profile_revision: "1" })) }
  return { active, onNavigate: vi.fn(), session: {
    snapshot: pageSnapshot, page: null, loading: false, loadingMore: false, error: null, hasNewMessages: false, atBottom: true,
    firstItemIndex: 0, windowRevision: 0, targetMessageId: null, reload: vi.fn().mockResolvedValue(undefined), send: vi.fn(), goToLatest: vi.fn(), jumpTo: vi.fn(), updateAtBottom: vi.fn(), updateRenderedAnchor: vi.fn(), applyAppearance: vi.fn(), loadOlder: vi.fn(), loadNewer: vi.fn(),
  } }
}
