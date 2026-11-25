import type { UiPreferences } from "@/contracts/generated"
import { ipc } from "./ipc"

/** 发送键偏好在应用内高频读取，缓存一份避免每条消息都走 IPC。 */
let cached: UiPreferences | null = null

export function sendOnEnter() {
  return cached?.send_key !== "ctrl_enter"
}

export async function loadUiPreferences(generation: string) {
  cached = await ipc.getUiPreferences({ data_generation_id: generation })
  return cached
}

export async function saveUiPreferences(generation: string, preferences: UiPreferences) {
  await ipc.saveUiPreferences({ data_generation_id: generation, preferences })
  cached = preferences
}
