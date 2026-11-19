import { describe, expect, it } from "vitest"
import fixtures from "../../tests/fixtures/contracts.json"
import { validateChatSendRequest, validateChatListRequest, validateChatSendResponse } from "./generated/validators.js"

const validators: Record<string, (value: unknown) => boolean> = {
  ChatSendRequest: validateChatSendRequest,
  ChatListRequest: validateChatListRequest,
  ChatSendResponse: validateChatSendResponse,
}

describe("Rust 与前端共享合同夹具", () => {
  for (const fixture of fixtures) {
    it(fixture.name, () => {
      expect(validators[fixture.contract](fixture.payload)).toBe(fixture.valid)
    })
  }
})
