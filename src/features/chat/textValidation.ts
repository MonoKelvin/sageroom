const CHARACTER_LIMIT = 10_000
const BYTE_LIMIT = 32 * 1024

export function textValidationError(text: string): string | null {
  if (text.trim().length === 0) return "消息不能只有空白字符。"
  if ([...text].length > CHARACTER_LIMIT) return "消息超过 10000 个字符，请拆分后发送。"
  if (new TextEncoder().encode(text).byteLength > BYTE_LIMIT) return "消息超过 32KiB，请拆分后发送。"
  return null
}
