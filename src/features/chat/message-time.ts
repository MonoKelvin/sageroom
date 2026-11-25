const TIME_GAP_MS = 10 * 60 * 1000

const timeFormatter = new Intl.DateTimeFormat("zh-CN", { hour: "2-digit", minute: "2-digit", hour12: false })
const monthDayFormatter = new Intl.DateTimeFormat("zh-CN", { month: "long", day: "numeric" })
const yearMonthDayFormatter = new Intl.DateTimeFormat("zh-CN", { year: "numeric", month: "long", day: "numeric" })
const numericMonthDayFormatter = new Intl.DateTimeFormat("zh-CN", { month: "numeric", day: "numeric" })
const numericDateFormatter = new Intl.DateTimeFormat("zh-CN", { year: "numeric", month: "numeric", day: "numeric" })
const WEEK_MS = 7 * 24 * 60 * 60 * 1000

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

/**
 * 会话列表时间：今天只显示 15:12；7 天内显示 11/24 15:23；
 * 今年更早显示 10/25；跨年显示 2025/12/12。
 */
export function formatConversationTime(createdAt: number, now: number = Date.now()): string {
  const value = new Date(createdAt)
  const current = new Date(now)
  if (sameDay(value, current)) return timeFormatter.format(value)
  if (current.getTime() - value.getTime() < WEEK_MS) return `${numericMonthDayFormatter.format(value)} ${timeFormatter.format(value)}`
  if (value.getFullYear() === current.getFullYear()) return numericMonthDayFormatter.format(value)
  return numericDateFormatter.format(value)
}

/** 首条消息、间隔达到十分钟或跨天时插入时间标记。 */
export function shouldInsertTimeTag(previous: number | undefined, createdAt: number): boolean {
  if (previous === undefined) return true
  return createdAt - previous >= TIME_GAP_MS || !sameDay(new Date(previous), new Date(createdAt))
}
