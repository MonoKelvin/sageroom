import type { AvatarData } from "@/contracts/generated"

const MAX_BASE64_LENGTH = Math.ceil(4 * 1024 * 1024 / 3) * 4
export function avatarSource(data: AvatarData, avatarId: string): string | null {
  if (data.avatar_id !== avatarId || !["image/png", "image/jpeg"].includes(data.mime_type)) return null
  if (!data.data_base64 || data.data_base64.length > MAX_BASE64_LENGTH || !/^[A-Za-z0-9+/]*={0,2}$/.test(data.data_base64)) return null
  return `data:${data.mime_type};base64,${data.data_base64}`
}
