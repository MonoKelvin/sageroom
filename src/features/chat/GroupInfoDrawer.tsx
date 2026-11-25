import { useLayoutEffect, useRef, useState } from "react"
import * as DialogPrimitive from "@radix-ui/react-dialog"
import { IconArrowUpRight, IconX } from "@tabler/icons-react"
import type { AppSnapshot, Room } from "@/contracts/generated"
import { ipc } from "@/app/ipc"
import { Avatar } from "@/components/Avatar"
import { Button } from "@/components/ui/button"
import { EditableInput } from "@/components/ui/editable-input"
import { Switch } from "@/components/ui/switch"
import { validateText } from "@/features/settings/configurationDefaults"

export function GroupInfoDrawer({ snapshot, container, open, onOpenChange, onRoomChange, onManageAgents, onReturnFocus, muted, onMutedChange }: {
  snapshot: AppSnapshot
  container: HTMLElement | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onRoomChange: (room: Room, generation: string) => void
  onManageAgents: () => void
  onReturnFocus: () => void
  muted: boolean
  onMutedChange: (muted: boolean) => void
}) {
  const close = useRef<HTMLButtonElement>(null)
  const drawer = useRef<HTMLDivElement>(null)
  const [presence, setPresence] = useState({ open, present: open })
  if (presence.open !== open) setPresence({ open, present: open || presence.present })

  useLayoutEffect(() => {
    if (open) return
    const animations = drawer.current?.getAnimations() ?? []
    let cancelled = false
    void Promise.allSettled(animations.map((animation) => animation.finished)).then(() => {
      if (!cancelled) setPresence({ open: false, present: false })
    })
    return () => { cancelled = true }
  }, [container, open])

  const owner = snapshot.participants.find((participant) => participant.id === snapshot.room.owner_participant_id)
  const canEdit = snapshot.local_user.id === snapshot.room.owner_participant_id

  async function rename(name: string) {
    const room = await ipc.saveRoom({ data_generation_id: snapshot.data_generation_id, client_request_id: crypto.randomUUID(), expected_version: snapshot.room.version, name })
    onRoomChange(room, snapshot.data_generation_id)
  }

  if (!container) return null
  return <DialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
    {(open || presence.present) && <DialogPrimitive.Portal container={container} forceMount>
      <DialogPrimitive.Overlay className="group-info-overlay" style={{ pointerEvents: open ? "auto" : "none" }} />
      <DialogPrimitive.Content
        ref={drawer}
        className="floating-surface group-info-drawer"
        aria-describedby={undefined}
        inert={!open}
        onOpenAutoFocus={(event) => { event.preventDefault(); close.current?.focus({ preventScroll: true }) }}
        onCloseAutoFocus={(event) => { event.preventDefault(); onReturnFocus() }}
      >
        <header className="group-info-heading">
          <DialogPrimitive.Title className="panel-title">群信息</DialogPrimitive.Title>
          <DialogPrimitive.Close asChild><button ref={close} type="button" className="icon-button" aria-label="关闭群信息"><IconX size={18} aria-hidden="true" /></button></DialogPrimitive.Close>
        </header>
        <div className="group-info-content">
          <ul className="group-member-grid" aria-label="群成员">
            {snapshot.participants.map((participant) => <li key={participant.id} className="group-member">
              <Avatar name={participant.display_name} avatarId={participant.avatar_id} colorId={participant.kind === "agent" ? participant.id : undefined} generation={snapshot.data_generation_id} size={48} />
              <span className="group-member-name" title={participant.display_name}>{participant.display_name}</span>
            </li>)}
          </ul>
          <hr className="group-info-divider" />
          <section className="group-info-details">
            <dl className="group-info-meta">
              <div>
                <dt><label htmlFor={canEdit ? "group-room-name" : undefined}>群名称</label></dt>
                <dd>
                  {canEdit
                    ? <EditableInput id="group-room-name" label="群名称" revealOnHover value={snapshot.room.name} active={open} maxLength={80} normalize={(value) => value.trim()} validate={(value) => validateText(value, 80, true)} onApply={rename} />
                    : <p className="group-room-name">{snapshot.room.name}</p>}
                </dd>
              </div>
              <div><dt>群主</dt><dd>{owner?.display_name}</dd></div>
              <div>
                <dt><label htmlFor="group-muted">消息免打扰</label></dt>
                <dd><Switch id="group-muted" label="消息免打扰" checked={muted} onCheckedChange={onMutedChange} /></dd>
              </div>
            </dl>
          </section>
        </div>
        <footer className="group-info-footer"><Button variant="secondary" size="sm" onClick={onManageAgents}>管理智能体<IconArrowUpRight size={16} aria-hidden="true" /></Button></footer>
      </DialogPrimitive.Content>
    </DialogPrimitive.Portal>}
  </DialogPrimitive.Root>
}
