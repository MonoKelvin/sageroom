import { useEffect, useMemo, useState } from "react"
import { ipc } from "@/app/ipc"
import { avatarSource } from "@/features/user/avatarSource"

type CachedAvatar = { promise: Promise<string | null>; bytes: number }
const avatarCache = new Map<string, CachedAvatar>()

function trimAvatarCache() {
  let bytes = Array.from(avatarCache.values()).reduce((sum, entry) => sum + entry.bytes, 0)
  for (const [key, entry] of avatarCache) {
    if (avatarCache.size <= 32 && bytes <= 16 * 1024 * 1024) break
    bytes -= entry.bytes
    avatarCache.delete(key)
  }
}

function readAvatar(generation: string, id: string) {
  const key = `${generation}:${id}`
  const cached = avatarCache.get(key)
  if (cached) {
    avatarCache.delete(key)
    avatarCache.set(key, cached)
    return cached.promise
  }
  const entry: CachedAvatar = {
    bytes: 0,
    promise: ipc.readAvatar({ data_generation_id: generation, avatar_id: id }).then((data) => {
      const src = avatarSource(data, id)
      if (avatarCache.get(key) === entry) {
        if (!src) avatarCache.delete(key)
        else { entry.bytes = src.length * 2; trimAvatarCache() }
      }
      return src
    }).catch((cause: unknown) => {
      if (avatarCache.get(key) === entry) avatarCache.delete(key)
      throw cause
    }),
  }
  avatarCache.set(key, entry)
  trimAvatarCache()
  return entry.promise
}

function defaultColors(id?: string) {
  if (!id) return { background: "var(--surface-canvas)", color: "var(--text-primary)" }
  let hash = 2166136261
  for (const character of id) hash = Math.imul(hash ^ character.charCodeAt(0), 16777619) >>> 0
  const hue = hash % 360
  const saturation = (50 + (hash >>> 9) % 31) / 100
  const lightness = (52 + (hash >>> 17) % 20) / 100
  const amplitude = saturation * Math.min(lightness, 1 - lightness)
  const channel = (n: number) => {
    const k = (n + hue / 30) % 12
    return Math.round(255 * (lightness - amplitude * Math.max(-1, Math.min(k - 3, 9 - k, 1))))
  }
  const rgb = [channel(0), channel(8), channel(4)]
  const linear = rgb.map((value) => {
    const normalized = value / 255
    return normalized <= 0.04045 ? normalized / 12.92 : ((normalized + 0.055) / 1.055) ** 2.4
  })
  const luminance = linear[0] * 0.2126 + linear[1] * 0.7152 + linear[2] * 0.0722
  const blackContrast = (luminance + 0.05) / 0.05
  const whiteContrast = 1.05 / (luminance + 0.05)
  return { background: `rgb(${rgb.join(" ")})`, color: blackContrast >= whiteContrast ? "var(--avatar-ink-dark)" : "var(--avatar-ink-light)" }
}

export function Avatar({ name, avatarId, colorId, generation, size = 40, radius, retryable = false }: {
  name: string; avatarId?: string | null; colorId?: string; generation?: string; size?: number; radius?: number; retryable?: boolean
}) {
  const [image, setImage] = useState<{ id: string; generation: string; src: string } | null>(null)
  const [retry, setRetry] = useState(0)
  const [failed, setFailed] = useState(false)
  const colors = useMemo(() => defaultColors(colorId), [colorId])
  useEffect(() => {
    if (!generation || !avatarId) return
    let ignore = false
    void readAvatar(generation, avatarId).then((src) => {
      if (!ignore) { setImage(src ? { id: avatarId, generation, src } : null); setFailed(!src) }
    }).catch(() => { if (!ignore) { setImage(null); setFailed(true) } })
    return () => { ignore = true }
  }, [avatarId, generation, retry])
  const src = image && image.id === avatarId && image.generation === generation ? image.src : null
  const style = { width: size, height: size, borderRadius: radius ?? Math.round(size * 0.3), ...colors, flexShrink: 0, display: "inline-grid", placeItems: "center", overflow: "hidden", fontSize: Math.round(size * 0.4), fontWeight: 500 } as const
  if (src) return <span style={style}><img src={src} alt={`${name}的头像`} width={size} height={size} style={{ width: "100%", height: "100%", objectFit: "cover" }} onError={() => { if (generation && avatarId) avatarCache.delete(`${generation}:${avatarId}`); setImage(null); setFailed(true) }} /></span>
  if (retryable && failed && avatarId && generation) return <button type="button" style={{ ...style, border: 0, cursor: "pointer" }} title="头像读取失败，点击重试" aria-label={`${name}的头像读取失败，重试`} onClick={() => { setFailed(false); setRetry((value) => value + 1) }}>{Array.from(name.trim())[0] || "?"}</button>
  return <span style={style} role="img" aria-label={`${name}的默认头像`}>{Array.from(name.trim())[0] || "?"}</span>
}
