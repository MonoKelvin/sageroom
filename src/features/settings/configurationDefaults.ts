import type { AgentPreferences, ModelParameters, PersonaDimensions } from "@/contracts/generated"

export const defaultDimensions: PersonaDimensions = { professional: 50, formal: 40, casual: 60, humor: 40, direct: 50, empathy: 60, social_energy: 50 }
export const defaultPreferences: AgentPreferences = { request_limit_daily: 100, persistent_memory: false, allow_autonomous_wake: false }
export const defaultParameters: ModelParameters = { temperature: 0.7, top_p: 1, max_output_tokens: 2048, input_budget: 16000, reasoning: "off" }
