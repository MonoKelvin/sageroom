import { describe, expect, it } from "vitest"
import { page } from "./chat.test-fixtures"
import { compareSequence, INITIAL_ITEM_INDEX, MAX_LOADED_MESSAGES, mergePage } from "./timeline"

describe("分页数据窗口", () => {
  it("十进制序号按数值排序，支持超 JS 安全整数", () => {
    expect(compareSequence("10", "9")).toBe(1)
    expect(compareSequence("9007199254740993", "9007199254740992")).toBe(1)
    const merged = mergePage(page(["9"]), page(["10", "9007199254740993"]), "after", INITIAL_ITEM_INDEX)
    expect(merged.page.items.map((message) => message.seq)).toEqual(["9", "10", "9007199254740993"])
  })

  it("前插消息减小虚拟下标，并按 ID 去重", () => {
    const merged = mergePage(page([3, 4]), page([1, 2, 3]), "before", INITIAL_ITEM_INDEX)
    expect(merged.page.items.map((message) => message.seq)).toEqual(["1", "2", "3", "4"])
    expect(merged.firstItemIndex).toBe(INITIAL_ITEM_INDEX - 2)
  })

  it("读更早历史时只保留有界窗口，并记得后方还有数据", () => {
    const current = page(Array.from({ length: MAX_LOADED_MESSAGES }, (_, index) => index + 101))
    const older = page(Array.from({ length: 50 }, (_, index) => index + 51), { has_more_before: true })
    const merged = mergePage(current, older, "before", INITIAL_ITEM_INDEX)
    expect(merged.page.items).toHaveLength(MAX_LOADED_MESSAGES)
    expect(merged.page.first_seq).toBe("51")
    expect(merged.page.last_seq).toBe("550")
    expect(merged.page.has_more_after).toBe(true)
    expect(merged.firstItemIndex).toBe(INITIAL_ITEM_INDEX - 50)
  })

  it("追加时淘汰最旧项并推进虚拟下标", () => {
    const current = page(Array.from({ length: MAX_LOADED_MESSAGES }, (_, index) => index + 1))
    const merged = mergePage(current, page([501, 502]), "after", INITIAL_ITEM_INDEX)
    expect(merged.page.items).toHaveLength(MAX_LOADED_MESSAGES)
    expect(merged.page.first_seq).toBe("3")
    expect(merged.page.last_seq).toBe("502")
    expect(merged.page.has_more_before).toBe(true)
    expect(merged.firstItemIndex).toBe(INITIAL_ITEM_INDEX + 2)
  })
})
