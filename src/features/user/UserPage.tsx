import { useEffect, useRef, useState } from "react"
import type { ApplicationPageProps } from "@/app/navigation"
import { useAppliedResource, useConfiguration, useConfigurationRuntime } from "@/app/configurationContext"
import { errorMessage, ipc } from "@/app/ipc"
import { Avatar } from "@/components/Avatar"
import { WorkspaceList } from "@/components/WorkspaceList"
import { AppDialog } from "@/components/ui/app-dialog"
import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { EditableInput } from "@/components/ui/editable-input"
import { EditableTextarea } from "@/components/ui/editable-textarea"
import { SettingSection } from "@/components/ui/setting-row"
import { userSections } from "./sections"
import { Field, ResourceFeedback } from "@/features/settings/ConfigurationFields"
import { validateDisplayName, validateText } from "@/features/settings/configurationDefaults"
import { usePageActivation } from "@/features/settings/useLocalEditor"
import "@/features/settings/configuration.css"

function UserEditor({ active }: ApplicationPageProps) {
  const store = useConfiguration()
  const runtime = useConfigurationRuntime()
  const generation = store.snapshot.data_generation_id
  const state = useAppliedResource(store.user, active)
  const profile = state.value
  const [avatarPending, setAvatarPending] = useState(false)
  const [avatarError, setAvatarError] = useState<string | null>(null)
  const [confirmRemoveAvatar, setConfirmRemoveAvatar] = useState(false)
  const avatarEpoch = useRef(0)
  const alive = useRef(false)
  useEffect(() => { alive.current = true; return () => { alive.current = false; avatarEpoch.current += 1 } }, [])

  async function importAvatar() {
    if (!profile || avatarPending || runtime.exiting) return
    const token = ++avatarEpoch.current
    setAvatarPending(true)
    setAvatarError(null)
    try {
      const avatar = await ipc.importAvatar({ data_generation_id: generation })
      if (alive.current && token === avatarEpoch.current && avatar) await store.updateUser({ avatar_id: avatar.id })
    } catch (cause) { if (alive.current && token === avatarEpoch.current && store.user.getSnapshot().status !== "error") setAvatarError(errorMessage(cause)) }
    finally { if (alive.current) setAvatarPending(false) }
  }
  async function removeAvatar() {
    avatarEpoch.current += 1
    setConfirmRemoveAvatar(false)
    setAvatarError(null)
    try { await store.updateUser({ avatar_id: null }) }
    catch (cause) { if (alive.current && store.user.getSnapshot().status !== "error") setAvatarError(errorMessage(cause)) }
  }

  return <div className="workspace-layout config-page">
    <WorkspaceList aria-label="用户资料导航" className="agent-scene-list">
      <div className="config-list-scroll">
        <button type="button" className="list-entry" data-active="true" aria-current="page">
          <Avatar name={profile?.display_name ?? "我的资料"} avatarId={profile?.avatar_id} generation={generation} size={44} />
          <span className="config-entry-text"><strong>{profile?.display_name ?? "我的资料"}</strong><span>{profile ? "本机用户" : "正在读取…"}</span></span>
        </button>
      </div>
    </WorkspaceList>
    <div className="workspace-detail"><section className="surface-card">
      <header className="panel-heading"><div className="min-w-0 agent-title-group">
        {profile && <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button type="button" className="agent-avatar-button" aria-label={avatarPending ? "正在选择…" : "切换头像"} title="点击切换头像" disabled={avatarPending || runtime.exiting}>
              <Avatar name={profile.display_name} avatarId={profile.avatar_id} generation={generation} size={48} retryable />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start">
            <DropdownMenuItem onSelect={() => void importAvatar()}>更换头像</DropdownMenuItem>
            {profile.avatar_id && <DropdownMenuItem variant="destructive" onSelect={() => setConfirmRemoveAvatar(true)}>恢复默认头像</DropdownMenuItem>}
          </DropdownMenuContent>
        </DropdownMenu>}
        <div className="min-w-0"><h2 className="panel-title truncate">{profile?.display_name ?? "我的资料"}</h2><p className="panel-description">本机用户</p></div>
      </div></header>
      <div className="panel-content panel-scroll">
        {!profile && <p className="form-caption">{state.loading ? "正在读取本地资料…" : "资料尚未就绪。"}</p>}
        {profile && <fieldset disabled={runtime.exiting} className="config-stack">
          <SettingSection title="基本资料">
            <Field label="昵称"><EditableInput label="昵称" active={active} maxLength={16} value={profile.display_name} normalize={(next) => next.trim()} validate={validateDisplayName} onApply={(display_name) => store.updateUser({ display_name })} /></Field>
            <Field label="简介"><EditableTextarea label="简介" active={active} rows={3} maxLength={200} value={profile.bio ?? ""} normalize={(next) => next.trim()} validate={(next) => validateText(next, 200)} onApply={(bio) => store.updateUser({ bio })} /></Field>
          </SettingSection>
        </fieldset>}
        {avatarError && state.status !== "error" && <p role="alert">{avatarError}</p>}
        <ResourceFeedback resource={store.user} state={state} />
        {profile && userSections.map(({ id, component: Section }) => <Section key={id} profile={profile} generation={generation} active={active} />)}
      </div>
    </section></div>
    <AppDialog open={confirmRemoveAvatar} onOpenChange={(open) => { if (!open) setConfirmRemoveAvatar(false) }} title="恢复默认头像" actions={[
      { label: "确认恢复", closeOnClick: false, onClick: () => void removeAvatar() },
      { label: "保留当前头像", variant: "ghost" },
    ]}><p>恢复后将使用软件 logo 作为默认头像，历史消息也会同步更新。</p></AppDialog>
  </div>
}

export function UserPage(props: ApplicationPageProps) {
  const initialized = usePageActivation(props.active, props.session.snapshot?.data_generation_id ?? null)
  if (!props.session.snapshot) return <section className="surface-card w-full"><div className="panel-heading"><h1 className="panel-title">用户</h1></div><div className="panel-content"><p>本地数据尚未就绪。</p><Button variant="ghost" size="sm" onClick={() => void props.session.reload()}>重试连接</Button></div></section>
  if (!initialized) return null
  return <UserEditor key={props.session.snapshot.data_generation_id} {...props} />
}
