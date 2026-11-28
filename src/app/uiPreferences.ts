import { useSyncExternalStore } from "react"
import type { UiPreferences } from "@/contracts/generated"
import { ipc } from "./ipc"

/** 发送键偏好在应用内高频读取，缓存一份避免每条消息都走 IPC。 */
let cached: UiPreferences | null = null
const listeners = new Set<() => void>()

function subscribe(listener: () => void) {
  listeners.add(listener)
  return () => { listeners.delete(listener) }
}

function updateCache(preferences: UiPreferences) {
  cached = preferences
  listeners.forEach((listener) => listener())
}

export function useTrayFlashOnMessage() {
  return useSyncExternalStore(subscribe, () => cached?.tray_flash_on_message === true)
}

export function sendOnEnter() {
  return cached?.send_key !== "ctrl_enter"
}

export async function loadUiPreferences(generation: string) {
  const preferences = await ipc.getUiPreferences({ data_generation_id: generation })
  updateCache(preferences)
  return preferences
}

export async function saveUiPreferences(generation: string, preferences: UiPreferences) {
  await ipc.saveUiPreferences({ data_generation_id: generation, preferences })
  updateCache(preferences)
}
