import type { AppSnapshot, ChatMessage, DomainEvent, MessagePage, SearchPage } from "@/contracts/generated"

export const GENERATION = "generation-test"
export const USER_ID = "user-test"

export function message(seq: string | number, text = `测试消息 ${seq}`): ChatMessage {
  return {
    id: `message-${seq}`,
    seq: String(seq),
    sender_id: USER_ID,
    sender_snapshot: { display_name: "我", kind: "user" },
    created_at: Date.UTC(2026, 10, 19, 10, 30),
    state: "visible",
    parts: [{ kind: "text", text }],
    quote_message_id: null,
    mention_ids: [],
    mention_all: false,
  }
}

export function snapshot(overrides: Partial<AppSnapshot> = {}): AppSnapshot {
  const user: AppSnapshot["local_user"] = { id: USER_ID, kind: "user", display_name: "我", introduction: "本地用户", status: "present", is_builtin: false }
  return {
    data_generation_id: GENERATION,
    room: { id: "room-test", name: "Sageroom", owner_participant_id: USER_ID, version: "1", content_epoch: "0" },
    local_user: user,
    participants: [user, { id: "sage-test", kind: "agent", display_name: "Sage", introduction: "群聊成员", status: "needs_configuration", is_builtin: true }],
    appearance: { theme: "system", reduce_motion: false, revision: "1" },
    latest_message_seq: "0",
    latest_event_seq: "0",
    events: [],
    requires_full_reload: true,
    data_directory: "C:/Sageroom-test/data",
    app_version: "0.1.0",
    ...overrides,
  }
}

export function page(sequences: (string | number)[] = [], overrides: Partial<MessagePage> = {}): MessagePage {
  const items = sequences.map((seq) => message(seq))
  return {
    data_generation_id: GENERATION,
    items,
    first_seq: items[0]?.seq ?? null,
    last_seq: items.at(-1)?.seq ?? null,
    has_more_before: false,
    has_more_after: false,
    latest_message_seq: items.at(-1)?.seq ?? "0",
    latest_event_seq: items.at(-1)?.seq ?? "0",
    ...overrides,
  }
}

export function event(seq: string | number): DomainEvent {
  return {
    schema_version: "0.3",
    data_generation_id: GENERATION,
    event_seq: String(seq),
    event_id: `event-${seq}`,
    occurred_at: Date.UTC(2026, 10, 19, 10, 30),
    payload: { kind: "message_committed", message_id: `message-${seq}`, message_seq: String(seq), sender_id: USER_ID },
  }
}

export function searchPage(query = "测试", overrides: Partial<SearchPage> = {}): SearchPage {
  return {
    data_generation_id: GENERATION,
    search_id: "search-test",
    query,
    semantics: "literal_unicode_substring",
    items: [{ message_id: "message-1", seq: "1", sender_display_name: "我", snippet: "这是一条测试消息", created_at: Date.UTC(2026, 10, 19, 10, 30) }],
    has_more: false,
    next_cursor: null,
    ...overrides,
  }
}
