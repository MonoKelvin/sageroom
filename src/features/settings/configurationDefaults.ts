import type { AgentPreferences, ModelParameters, PersonaDimensions } from "@/contracts/generated"

export const defaultDimensions: PersonaDimensions = { professional: 50, formal: 40, casual: 60, humor: 40, direct: 50, empathy: 60, social_energy: 50, activity: 50 }
export const defaultPreferences: AgentPreferences = { request_limit_daily: 100, persistent_memory: false, allow_autonomous_wake: false }
export const defaultParameters: ModelParameters = { temperature: 0.7, top_p: 1, max_output_tokens: 2048, input_budget: 16000, reasoning: "off" }

export function validateText(value: string, limit: number, required = false): string | null {
  return value.includes("\0") || Array.from(value).length > limit || (required && !value.trim()) ? "内容为空、超过长度上限或含无效字符。" : null
}

export function normalizeTerms(value: string) { return value.split("\n").map((term) => term.trim()).filter(Boolean).join("\n") }
export function validateTerms(value: string): string | null {
  const terms = value ? value.split("\n") : []
  return terms.length > 16 ? "称呼最多 16 项。" : terms.some((term) => validateText(term, 80, true)) ? "每个称呼最多 80 字，且不能含无效字符。" : null
}

export function validateModelUrl(value: string): string | null {
  if (!value) return null
  if (validateText(value, 2048) || Array.from(value).some((char) => char.charCodeAt(0) < 32 || (char.charCodeAt(0) >= 127 && char.charCodeAt(0) <= 159))) return "模型地址含无效字符或超过长度上限。"
  try {
    const url = new URL(value)
    const authority = value.split("://")[1]?.split(/[/?#]/u)[0]
    if (!['https:', 'http:'].includes(url.protocol) || !url.hostname || url.username || url.password || authority?.includes("@") || value.includes("?") || value.includes("#")) return "模型地址只接受不含凭据、查询或片段的 HTTP(S) 地址。"
    if (url.protocol === "http:" && !["localhost", "127.0.0.1", "[::1]"].includes(url.hostname)) return "非本机模型地址必须使用 HTTPS。"
    return null
  } catch { return "模型地址格式无效。" }
}
