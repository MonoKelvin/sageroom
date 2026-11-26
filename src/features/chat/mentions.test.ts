import { describe, expect, it } from "vitest"
import { activeMentionQuery, applyMention, collectMentionIds, splitMentions } from "./mentions"

const targets = [
  { id: "sage", name: "Sage" },
  { id: "xiaoxia", name: "小夏" },
  { id: "xiaolin", name: "小林" },
  { id: "all", name: "所有人" },
]

describe("@ 提及解析", () => {
  it("只在行首或空白之后的 @ 触发查询", () => {
    expect(activeMentionQuery("@", 1)).toEqual({ start: 0, query: "" })
    expect(activeMentionQuery("你好 @小", 5)).toEqual({ start: 3, query: "小" })
    // 邮箱里的 @ 不算提及
    expect(activeMentionQuery("a@b", 3)).toBeNull()
    // 中间打了空格，说明已经在说别的事了
    expect(activeMentionQuery("@小 夏", 4)).toBeNull()
    expect(activeMentionQuery("", 0)).toBeNull()
  })

  it("识别成员名并切成胶囊分段，前缀相同的名字优先长匹配", () => {
    const segments = splitMentions("@小林 你看下 @小夏", targets)
    expect(segments.filter((segment) => segment.kind === "mention").map((segment) => segment.id)).toEqual(["xiaolin", "xiaoxia"])
    expect(segments.map((segment) => segment.text).join("")).toBe("@小林 你看下 @小夏")
  })

  it("紧贴汉字的 @ 不算提及，避免把普通叙述染成胶囊", () => {
    expect(splitMentions("@小夏夏 你来了", targets).every((segment) => segment.kind === "text")).toBe(true)
  })

  it("结构化 ID 按出现顺序去重", () => {
    expect(collectMentionIds("@Sage 和 @小夏 还有 @Sage", targets)).toEqual(["sage", "xiaoxia"])
    expect(collectMentionIds("没有提及", targets)).toEqual([])
  })

  it("选中成员后替换掉 @query 并把光标放到名字后面", () => {
    expect(applyMention("你好 @小", 3, 5, "小夏")).toEqual({ text: "你好 @小夏 ", caret: 7 })
  })
})
