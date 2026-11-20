import { renderHook } from "@testing-library/react"
import { describe, expect, it } from "vitest"
import { usePageActivation } from "./useLocalEditor"

describe("页面保活", () => {
  it("首次激活后同世代保持挂载，换世代不复用旧页面", () => {
    const { result, rerender } = renderHook(({ active, generation }) => usePageActivation(active, generation), { initialProps: { active: false, generation: "first" as string | null } })
    expect(result.current).toBe(false)
    rerender({ active: true, generation: "first" })
    expect(result.current).toBe(true)
    rerender({ active: false, generation: "first" })
    expect(result.current).toBe(true)
    rerender({ active: false, generation: "second" })
    expect(result.current).toBe(false)
    rerender({ active: true, generation: "second" })
    expect(result.current).toBe(true)
    rerender({ active: true, generation: null })
    expect(result.current).toBe(false)
  })
})
