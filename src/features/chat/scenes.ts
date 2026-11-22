import type { AppSnapshot, ChatSendResult } from "@/contracts/generated"
import type { SendOptions, useChatSession } from "./useChatSession"

type Session = ReturnType<typeof useChatSession>

export type ChatScene =
  | { kind: "group"; id: string; name: string; roomId: string }
  | { kind: "direct"; id: string; name: string; participantId: string }

export type SceneAdapter = {
  kind: ChatScene["kind"]
  scenes: (snapshot: AppSnapshot) => ChatScene[]
  send: (session: Session, text: string, requestId: string, options: SendOptions) => Promise<ChatSendResult>
}

export const sceneAdapters: Partial<Record<ChatScene["kind"], SceneAdapter>> = {
  group: {
    kind: "group",
    scenes: (snapshot) => [{ kind: "group", id: snapshot.room.id, roomId: snapshot.room.id, name: snapshot.room.name }],
    send: (session, text, requestId, options) => session.send(text, requestId, options),
  },
}

export function availableScenes(snapshot: AppSnapshot): ChatScene[] {
  return Object.values(sceneAdapters).flatMap((adapter) => adapter.scenes(snapshot))
}
