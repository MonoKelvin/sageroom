import { describe, expect, it } from "vitest"
import fixtures from "../../tests/fixtures/contracts.json"
import { validateAgentSaveRequest, validateAgentRuntimeControlRequest, validateAgentRuntimeControlResponse, validateAppSnapshotResponse, validateChatSendRequest, validateChatListRequest, validateChatSendResponse } from "./generated/validators.js"
import { snapshot } from "@/features/chat/chat.test-fixtures"
import { agentConfiguration } from "@/features/settings/configuration.test-fixtures"
import type { AgentRuntimeState } from "./generated"

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

const runtime: AgentRuntimeState = {
  agent_id: "sage-test", config_revision: "1", status: "observing",
  detail: null, next_wake_at: null, requests_today: 0,
}

const runtimeResponse = (data: unknown) => ({ schema_version: "0.3", data })

describe("智能体运行合同", () => {
  it("活跃度必须为 0–100 整数且不可缺失", () => {
    const request = { data_generation_id: "generation-test", client_request_id: "activity-test", expected_revision: "1", configuration: agentConfiguration() }
    for (const activity of [0, 50, 100]) expect(validateAgentSaveRequest({ ...request, configuration: { ...request.configuration, dimensions: { ...request.configuration.dimensions, activity } } })).toBe(true)
    for (const activity of [-1, 101, 1.5, "50", undefined]) expect(validateAgentSaveRequest({ ...request, configuration: { ...request.configuration, dimensions: { ...request.configuration.dimensions, activity } } })).toBe(false)
  })

  it("校验暂停与恢复请求，并拒绝错误类型及未知字段", () => {
    const request = { data_generation_id: "generation-test", agent_id: runtime.agent_id, paused: true }
    expect(validateAgentRuntimeControlRequest(request)).toBe(true)
    expect(validateAgentRuntimeControlRequest({ ...request, paused: false })).toBe(true)
    expect(validateAgentRuntimeControlRequest({ ...request, paused: "true" })).toBe(false)
    expect(validateAgentRuntimeControlRequest({ ...request, extra: true })).toBe(false)
  })

  it.each<AgentRuntimeState["status"]>([
    "needs_configuration", "observing", "deciding", "waiting_to_send",
    "sleeping", "paused", "protected", "offline",
  ])("接受 %s 运行状态", (status) => {
    expect(validateAgentRuntimeControlResponse(runtimeResponse({ ...runtime, status }))).toBe(true)
  })

  it("拒绝未知状态、无效请求计数及未知字段", () => {
    expect(validateAgentRuntimeControlResponse(runtimeResponse({ ...runtime, status: "unknown" }))).toBe(false)
    expect(validateAgentRuntimeControlResponse(runtimeResponse({ ...runtime, requests_today: -1 }))).toBe(false)
    expect(validateAgentRuntimeControlResponse(runtimeResponse({ ...runtime, requests_today: 0.5 }))).toBe(false)
    expect(validateAgentRuntimeControlResponse(runtimeResponse({ ...runtime, extra: true }))).toBe(false)
  })

  it("快照允许省略运行状态，也能校验携带运行状态的成员", () => {
    const data = snapshot()
    expect(validateAppSnapshotResponse(runtimeResponse(data))).toBe(true)
    data.participants[1].runtime = runtime
    expect(validateAppSnapshotResponse(runtimeResponse(data))).toBe(true)
    data.participants[1].runtime = { ...runtime, requests_today: -1 }
    expect(validateAppSnapshotResponse(runtimeResponse(data))).toBe(false)
  })
})
