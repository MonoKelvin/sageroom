import { describe, expect, it } from "vitest"
import { avatarSource } from "./avatarSource"

describe("有限本地头像数据", () => {
  it("仅接受绑定当前对象 ID 的 PNG/JPEG", () => {
    expect(avatarSource({ avatar_id: "a", mime_type: "image/png", data_base64: "YWJj" }, "a")).toBe("data:image/png;base64,YWJj")
    expect(avatarSource({ avatar_id: "b", mime_type: "image/png", data_base64: "YWJj" }, "a")).toBeNull()
    expect(avatarSource({ avatar_id: "a", mime_type: "image/svg+xml", data_base64: "YWJj" }, "a")).toBeNull()
  })
  it("拒绝不合法、空或无限长度的 data URL 数据", () => {
    expect(avatarSource({ avatar_id: "a", mime_type: "image/png", data_base64: "data:image/png;base64,YWJj" }, "a")).toBeNull()
    expect(avatarSource({ avatar_id: "a", mime_type: "image/png", data_base64: "" }, "a")).toBeNull()
    expect(avatarSource({ avatar_id: "a", mime_type: "image/png", data_base64: "a".repeat(6 * 1024 * 1024) }, "a")).toBeNull()
  })
})
