/** 输入框里的 @ 提及：解析、光标查询与胶囊分段。全部是纯函数，便于单测。 */

export type MentionTarget = { id: string; name: string }

export type MentionSegment =
  | { kind: "text"; text: string }
  | { kind: "mention"; text: string; id: string }

/** `@` 必须在行首或空白之后，避免把 a@b.com 当成提及。 */
function startsMention(text: string, index: number) {
  if (text[index] !== "@") return false
  const before = index > 0 ? text[index - 1] : "\n"
  return /\s/.test(before)
}

/**
 * 光标前正在输入的 @ 查询。
 * 只在 `@` 与光标之间没有空白、且长度合理时成立；否则用户已经在说别的事了。
 */
export function activeMentionQuery(text: string, caret: number): { start: number; query: string } | null {
  if (caret <= 0 || caret > text.length) return null
  let index = caret - 1
  while (index >= 0) {
    const char = text[index]
    if (char === "@") {
      if (!startsMention(text, index)) return null
      return { start: index, query: text.slice(index + 1, caret) }
    }
    if (/\s/.test(char)) return null
    if (caret - index > 24) return null
    index -= 1
  }
  return null
}

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
}

/** 名字后面必须是非字母/数字，否则 `@小夏夏` 会被误判成提及「小夏」。 */
function mentionPattern(names: string[]) {
  const sorted = [...names].sort((left, right) => right.length - left.length).map(escapeRegExp)
  if (!sorted.length) return null
  return new RegExp(`@(?:${sorted.join("|")})(?![\\p{L}\\p{N}])`, "gu")
}

/** 把正文切成「普通文本 / 提及胶囊」的分段，供高亮层渲染。 */
export function splitMentions(text: string, targets: readonly MentionTarget[]): MentionSegment[] {
  if (!text) return []
  const pattern = mentionPattern(targets.map((target) => target.name))
  if (!pattern) return [{ kind: "text", text }]
  const byName = new Map(targets.map((target) => [target.name, target.id]))
  const segments: MentionSegment[] = []
  let cursor = 0
  for (const match of text.matchAll(pattern)) {
    const start = match.index ?? 0
    if (start > cursor) segments.push({ kind: "text", text: text.slice(cursor, start) })
    const name = match[0].slice(1)
    segments.push({ kind: "mention", text: match[0], id: byName.get(name) ?? name })
    cursor = start + match[0].length
  }
  if (cursor < text.length) segments.push({ kind: "text", text: text.slice(cursor) })
  return segments
}

/**
 * 提取结构化提及 ID。
 * 只认界面上能匹配到的成员名：手打的 `@张三` 只要张三在群里，同样算提及。
 */
export function collectMentionIds(text: string, targets: readonly MentionTarget[]): string[] {
  const pattern = mentionPattern(targets.map((target) => target.name))
  if (!pattern) return []
  const byName = new Map(targets.map((target) => [target.name, target.id]))
  const ids: string[] = []
  for (const match of text.matchAll(pattern)) {
    const id = byName.get(match[0].slice(1))
    if (id && !ids.includes(id)) ids.push(id)
  }
  return ids
}

/** 选中成员后，把光标处的 `@query` 换成 `@名字 `。 */
export function applyMention(text: string, start: number, caret: number, name: string) {
  const next = `${text.slice(0, start)}@${name} ${text.slice(caret)}`
  return { text: next, caret: start + name.length + 2 }
}
