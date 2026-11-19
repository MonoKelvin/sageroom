import type { ChatMessage, MessagePage } from "@/contracts/generated"

export const PAGE_SIZE = 50
export const MAX_LOADED_MESSAGES = 500
export const INITIAL_ITEM_INDEX = 1_000_000_000

export function compareSequence(left: string, right: string): number {
  const a = BigInt(left)
  const b = BigInt(right)
  return a < b ? -1 : a > b ? 1 : 0
}

function latestSequence(left: string, right: string): string {
  return compareSequence(left, right) >= 0 ? left : right
}

function combineMessages(current: ChatMessage[], incoming: ChatMessage[]): ChatMessage[] {
  const byId = new Map(current.map((message) => [message.id, message]))
  for (const message of incoming) byId.set(message.id, message)
  return [...byId.values()].sort((a, b) => compareSequence(a.seq, b.seq))
}

export function mergePage(
  current: MessagePage,
  incoming: MessagePage,
  direction: "before" | "after",
  firstItemIndex: number,
): { page: MessagePage; firstItemIndex: number } {
  const combined = combineMessages(current.items, incoming.items)
  const extra = Math.max(0, combined.length - MAX_LOADED_MESSAGES)
  const items = direction === "before" ? combined.slice(0, MAX_LOADED_MESSAGES) : combined.slice(extra)
  const oldFirst = current.items[0]?.seq
  const addedBefore = oldFirst
    ? combined.filter((message) => compareSequence(message.seq, oldFirst) < 0).length
    : 0
  return {
    firstItemIndex: firstItemIndex - addedBefore + (direction === "after" ? extra : 0),
    page: {
      ...incoming,
      items,
      first_seq: items[0]?.seq ?? null,
      last_seq: items.at(-1)?.seq ?? null,
      has_more_before: direction === "before" ? incoming.has_more_before : current.has_more_before || extra > 0,
      has_more_after: direction === "after" ? incoming.has_more_after : current.has_more_after || extra > 0,
      latest_message_seq: latestSequence(current.latest_message_seq, incoming.latest_message_seq),
      latest_event_seq: latestSequence(current.latest_event_seq, incoming.latest_event_seq),
    },
  }
}
