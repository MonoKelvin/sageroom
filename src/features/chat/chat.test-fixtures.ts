import { vi } from "vitest"
import { APP_METADATA } from "@/app/metadata"
import type { AppSnapshot, ChatMessage, DomainEvent, InboxConversation, InboxSummary, MessagePage, SearchPage } from "@/contracts/generated"
import type { InboxApi } from "./useInbox"

export const GENERATION = "generation-test"
export const USER_ID = "user-test"

export function inboxConversation(overrides: Partial<InboxConversation> = {}): InboxConversation {
  return {
    id: "room-test",
    name: "测试群",
    kind: "group",
    unread_count: 0,
    muted: false,
    last_read_seq: "0",
    latest_seq: "0",
    latest_at: 0,
    latest_sender: null,
    latest_preview: "暂无消息",
    first_unread_seq: null,
    first_unread_id: null,
    ...overrides,
  }
}

export function inboxSummary(conversations: InboxConversation[] = []): InboxSummary {
  return {
    revision: "1",
    conversations,
    unread_total: conversations.reduce((sum, item) => (item.muted ? sum : sum + item.unread_count), 0),
  }
}

/** 测试用 InboxApi；各方法默认无副作用，需要断言的用例可自行覆盖。 */
export function inboxFixture(summary: InboxSummary | null = null): InboxApi {
  return {
    summary,
    loading: false,
    error: null,
    conversation: (id: string) => summary?.conversations.find((item) => item.id === id),
    markRead: vi.fn(async () => {}),
    setMuted: vi.fn(async () => {}),
    refresh: vi.fn(async () => {}),
  }
}

export function message(seq: string | number, text = `测试消息 ${seq}`): ChatMessage {
  return {
    id: `message-${seq}`,
    seq: String(seq),
    sender_id: USER_ID,
    created_at: Date.UTC(2026, 10, 19, 10, 30),
    state: "visible",
    parts: [{ kind: "text", text }],
    quote_message_id: null,
    mention_ids: [],
    mention_all: false,
  }
}

export function snapshot(overrides: Partial<AppSnapshot> = {}): AppSnapshot {
  const user: AppSnapshot["local_user"] = { id: USER_ID, kind: "user", display_name: "我", status: "present", is_builtin: false, avatar_id: null, profile_revision: "1" }
  return {
    data_generation_id: GENERATION,
    room: { id: "room-test", name: "Sageroom", owner_participant_id: USER_ID, version: "1", content_epoch: "0" },
    local_user: user,
    participants: [user, { id: "sage-test", kind: "agent", display_name: "Sage", status: "needs_configuration", is_builtin: true, avatar_id: null, profile_revision: "1" }],
    appearance: { theme: "system", reduce_motion: false, revision: "1" },
    latest_message_seq: "0",
    latest_event_seq: "0",
    events: [],
    requires_full_reload: true,
    data_directory: "C:/Sageroom-test/data",
    data_usage: { database_bytes: "262144", avatar_bytes: "0", disk_total_bytes: "0", disk_letter: "" },
    app_version: APP_METADATA.version,
    development_tools_available: true,
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
    items: [{ message_id: "message-1", seq: "1", sender_id: USER_ID, snippet: "这是一条测试消息", created_at: Date.UTC(2026, 10, 19, 10, 30) }],
    has_more: false,
    next_cursor: null,
    ...overrides,
  }
}
