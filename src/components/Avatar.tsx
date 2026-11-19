import { useEffect, useState } from "react"
import { ipc } from "@/app/ipc"
import { avatarSource } from "@/features/user/avatarSource"

export function Avatar({ name, avatarId, generation, size = 40, retryable = false }: {
  name: string; avatarId?: string | null; generation?: string; size?: number; retryable?: boolean
}) {
  const [image, setImage] = useState<{ id: string; generation: string; src: string } | null>(null)
  const [retry, setRetry] = useState(0)
  const [failed, setFailed] = useState(false)
  useEffect(() => {
    if (!generation || !avatarId) return
    let ignore = false
    void ipc.readAvatar({ data_generation_id: generation, avatar_id: avatarId }).then((data) => {
      if (!ignore) { const src = avatarSource(data, avatarId); setImage(src ? { id: avatarId, generation, src } : null); setFailed(!src) }
    }).catch(() => { if (!ignore) { setImage(null); setFailed(true) } })
    return () => { ignore = true }
  }, [avatarId, generation, retry])
  const src = image && image.id === avatarId && image.generation === generation ? image.src : null
  const style = { width: size, height: size, borderRadius: Math.round(size * 0.3), background: "var(--surface-canvas)", color: "var(--text-primary)", flexShrink: 0, display: "inline-grid", placeItems: "center", overflow: "hidden", fontSize: Math.round(size * 0.4), fontWeight: 500 } as const
  if (src) return <span style={style}><img src={src} alt={`${name}的头像`} width={size} height={size} style={{ width: "100%", height: "100%", objectFit: "cover" }} onError={() => { setImage(null); setFailed(true) }} /></span>
  if (retryable && failed && avatarId && generation) return <button type="button" style={{ ...style, border: 0, cursor: "pointer" }} title="头像读取失败，点击重试" aria-label={`${name}的头像读取失败，重试`} onClick={() => { setFailed(false); setRetry((value) => value + 1) }}>{Array.from(name.trim())[0] || "?"}</button>
  return <span style={style} role="img" aria-label={`${name}的默认头像`}>{Array.from(name.trim())[0] || "?"}</span>
}
