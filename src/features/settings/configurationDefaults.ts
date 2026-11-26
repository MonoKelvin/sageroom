import type { PersonaDimensions } from "@/contracts/generated"

export const defaultDimensions: PersonaDimensions = { professional: 50, formal: 40, casual: 60, humor: 40, direct: 50, empathy: 60, social_energy: 50, activity: 50 }

export function validateText(value: string, limit: number, required = false): string | null {
  return value.includes("\0") || Array.from(value).length > limit || (required && !value.trim()) ? "内容为空、超过长度上限或含无效字符。" : null
}

/** 昵称宽度上限：中文/全角/emoji 算 2，英文与数字算 1；与后端 char_display_width 保持一致。 */
export const DISPLAY_NAME_WIDTH_LIMIT = 16

export function charDisplayWidth(character: string): number {
  const code = character.codePointAt(0) ?? 0
  const wide = (code >= 0x1100 && code <= 0x115f)
    || (code >= 0x2e80 && code <= 0xa4cf)
    || (code >= 0xac00 && code <= 0xd7a3)
    || (code >= 0xf900 && code <= 0xfaff)
    || (code >= 0xfe10 && code <= 0xfe19)
    || (code >= 0xfe30 && code <= 0xfe6f)
    || (code >= 0xff00 && code <= 0xff60)
    || (code >= 0xffe0 && code <= 0xffe6)
    || (code >= 0x1f300 && code <= 0x1faff)
    || (code >= 0x20000 && code <= 0x3fffd)
  return wide ? 2 : 1
}

export function displayWidth(value: string): number {
  return Array.from(value).reduce((total, character) => total + charDisplayWidth(character), 0)
}

export function validateDisplayName(value: string): string | null {
  return value.includes("\0") || !value.trim() || displayWidth(value) > DISPLAY_NAME_WIDTH_LIMIT
    ? "昵称不能为空或含无效字符，且最多 8 个中文或 16 个英文字符。"
    : null
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
