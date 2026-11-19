import { describe, expect, it } from "vitest"
import { textValidationError } from "./textValidation"

const astralCharacter = String.fromCodePoint(0x1f642)

describe("文本输入边界", () => {
  it("拒绝纯空白，但保留正常文本首尾空格", () => {
    expect(textValidationError(" \n\t")).not.toBeNull()
    expect(textValidationError("  你好  ")).toBeNull()
  })

  it("按 Unicode 字符而不是 UTF-16 长度计数", () => {
    expect(textValidationError(astralCharacter.repeat(8192))).toBeNull()
    expect(textValidationError("中".repeat(10_000))).toBeNull()
    expect(textValidationError("a".repeat(10_001))).toContain("10000")
  })

  it("独立执行 UTF-8 字节上限", () => {
    expect(textValidationError(astralCharacter.repeat(8193))).toContain("32KiB")
  })
})
