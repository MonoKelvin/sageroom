import type { FormEvent } from "react"
import { IconPlayerStop, IconSearch } from "@tabler/icons-react"
import { Button } from "@/components/ui/button"

export function ChatSearchInput({ value, pending, onValueChange, onSubmit, onCancel, onCompositionStart, onCompositionEnd }: {
  value: string
  pending: boolean
  onValueChange: (value: string) => void
  onSubmit: (event: FormEvent<HTMLFormElement>) => void
  onCancel: () => void
  onCompositionStart: () => void
  onCompositionEnd: (value: string) => void
}) {
  return <form className="chat-search-input" onSubmit={onSubmit} role="search" aria-label="搜索聊天">
    <input autoFocus type="search" className="chat-search-text" aria-label="搜索聊天文本" placeholder="搜索聊天" value={value} onChange={(event) => onValueChange(event.target.value)} onCompositionStart={onCompositionStart} onCompositionEnd={(event) => onCompositionEnd(event.currentTarget.value)} />
    <Button type="submit" variant="ghost" size="icon-sm" aria-label="开始搜索" title={pending ? "重新搜索" : undefined}><IconSearch size={16} aria-hidden="true" /></Button>
    {pending && <Button type="button" variant="ghost" size="icon-sm" aria-label="取消检索" onClick={onCancel}><IconPlayerStop size={16} aria-hidden="true" /></Button>}
  </form>
}
