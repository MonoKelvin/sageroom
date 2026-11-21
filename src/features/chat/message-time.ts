const TIME_GAP_MS = 10 * 60 * 1000

const timeFormatter = new Intl.DateTimeFormat("zh-CN", { hour: "2-digit", minute: "2-digit", hour12: false })
const monthDayFormatter = new Intl.DateTimeFormat("zh-CN", { month: "long", day: "numeric" })
const yearMonthDayFormatter = new Intl.DateTimeFormat("zh-CN", { year: "numeric", month: "long", day: "numeric" })

function sameDay(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate()
}

/** 今天只显示时分；同年非今天补月日；跨年补完整年月日。 */
export function formatMessageTime(createdAt: number, now: number = Date.now()): string {
  const value = new Date(createdAt)
  const current = new Date(now)
  const time = timeFormatter.format(value)
  if (sameDay(value, current)) return time
  if (value.getFullYear() === current.getFullYear()) return `${monthDayFormatter.format(value)} ${time}`
  return `${yearMonthDayFormatter.format(value)} ${time}`
}

/** 首条消息、间隔达到十分钟或跨天时插入时间标记。 */
export function shouldInsertTimeTag(previous: number | undefined, createdAt: number): boolean {
  if (previous === undefined) return true
  return createdAt - previous >= TIME_GAP_MS || !sameDay(new Date(previous), new Date(createdAt))
}
