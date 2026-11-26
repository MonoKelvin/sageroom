import { useEffect, useReducer } from "react"
import { ipc } from "@/app/ipc"
import type { AttachmentObject } from "@/contracts/generated"

/** 附件字节只在内存里缓存一份：列表滚动、重挂都不会重复走 IPC。 */
const cache = new Map<string, string>()
const inflight = new Map<string, Promise<string>>()

export function cachedAttachmentSource(generation: string | null, id: string): string | null {
  return generation ? cache.get(`${generation}:${id}`) ?? null : null
}

/** 预取一批附件，减少滚动到位后才开始加载的空白帧。 */
export function prefetchAttachments(generation: string | null, ids: readonly string[]) {
  if (!generation) return
  for (const id of ids) void load(generation, id).catch(() => {})
}

export function formatAttachmentSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`
}

/** 交给系统默认程序打开。失败不打断聊天，也不往消息里插错误条。 */
export async function openAttachment(generation: string | null, attachment: AttachmentObject) {
  if (!generation) return
  try {
    await ipc.openAttachment({ data_generation_id: generation, attachment_id: attachment.id })
  } catch {
    // 系统层面会给出提示，这里只保证界面状态不被拖住。
  }
}

function load(generation: string, id: string): Promise<string> {
  const key = `${generation}:${id}`
  const ready = cache.get(key)
  if (ready) return Promise.resolve(ready)
  const running = inflight.get(key)
  if (running) return running
  const promise = ipc.readAttachment({ data_generation_id: generation, attachment_id: id })
    .then((data) => {
      const url = `data:${data.mime_type};base64,${data.data_base64}`
      cache.set(key, url)
      return url
    })
    .finally(() => inflight.delete(key))
  inflight.set(key, promise)
  return promise
}

/**
 * 图片附件的 data URL。
 * 缓存是外部存储，渲染时直接读；加载完成用一次强制刷新把结果带出来。
 */
export function useAttachmentSource(generation: string | null, id: string, enabled = true): string | null {
  const [, refresh] = useReducer((value: number) => value + 1, 0)
  const source = cachedAttachmentSource(generation, id)
  useEffect(() => {
    if (!generation || !enabled || source) return
    let cancelled = false
    void load(generation, id)
      .then(() => { if (!cancelled) refresh() })
      .catch(() => { if (!cancelled) refresh() })
    return () => { cancelled = true }
  }, [generation, id, enabled, source])
  return source
}
