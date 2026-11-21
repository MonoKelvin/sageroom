import { describe, expect, it } from "vitest"
import { formatMessageTime, shouldInsertTimeTag } from "./message-time"

const local = (year: number, month: number, day: number, hour: number, minute: number) =>
  new Date(year, month - 1, day, hour, minute).getTime()

const now = local(2026, 11, 21, 22, 35)

describe("消息时间标记", () => {
  it("今天只显示时分", () => {
    expect(formatMessageTime(local(2026, 11, 21, 9, 5), now)).toBe("09:05")
  })

  it("同年非今天补月日", () => {
    expect(formatMessageTime(local(2026, 11, 20, 22, 35), now)).toBe("11月20日 22:35")
  })

  it("非今年补完整年月日", () => {
    expect(formatMessageTime(local(2025, 11, 10, 10, 22), now)).toBe("2025年11月10日 10:22")
  })

  it("首条消息插入时间标记", () => {
    expect(shouldInsertTimeTag(undefined, local(2026, 11, 21, 10, 0))).toBe(true)
  })

  it("间隔不足十分钟不插入", () => {
    const first = local(2026, 11, 21, 10, 0)
    expect(shouldInsertTimeTag(first, first + 9 * 60_000)).toBe(false)
  })

  it("间隔达到十分钟插入", () => {
    const first = local(2026, 11, 21, 10, 0)
    expect(shouldInsertTimeTag(first, first + 10 * 60_000)).toBe(true)
  })

  it("跨天即使间隔不足十分钟也插入", () => {
    expect(shouldInsertTimeTag(local(2026, 11, 20, 23, 58), local(2026, 11, 21, 0, 2))).toBe(true)
  })
})
