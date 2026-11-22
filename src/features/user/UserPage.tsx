import { useEffect, useRef, useState } from "react"
import { IconPhoto, IconUserCircle } from "@tabler/icons-react"
import type { ApplicationPageProps } from "@/app/navigation"
import { useAppliedResource, useConfiguration, useConfigurationRuntime } from "@/app/configurationContext"
import { errorMessage, ipc } from "@/app/ipc"
import { Avatar } from "@/components/Avatar"
import { WorkspaceList } from "@/components/WorkspaceList"
import { Button } from "@/components/ui/button"
import { EditableInput } from "@/components/ui/editable-input"
import { SettingSection } from "@/components/ui/setting-row"
import { userSections } from "./sections"
import { Field, ResourceFeedback } from "@/features/settings/ConfigurationFields"
import { validateText } from "@/features/settings/configurationDefaults"
import { usePageActivation } from "@/features/settings/useLocalEditor"
import "@/features/settings/configuration.css"

function UserEditor({ active, onNavigate }: ApplicationPageProps) {
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
    <WorkspaceList aria-label="用户资料导航">
      <div className="panel-heading"><h1 className="panel-title">用户</h1></div>
      <div className="list-entry" data-active="true"><IconUserCircle size={22} aria-hidden="true" /><span className="config-entry-text"><strong>{profile?.display_name || "我的资料"}</strong><span>本机用户</span></span></div>
      <p className="form-caption p-3">昵称和头像修改后，会同步更新所有历史消息。</p>
      <Button variant="ghost" size="sm" onClick={() => onNavigate("chat")}>返回聊天</Button>
    </WorkspaceList>
    <div className="workspace-detail"><section className="surface-card">
      <header className="panel-heading"><div><h2 className="panel-title">我的资料</h2><p className="panel-description">在这个聊天室中如何介绍自己。</p></div></header>
      <div className="panel-content panel-scroll">
        {!profile && <p className="form-caption">{state.loading ? "正在读取本地资料…" : "资料尚未就绪。"}</p>}
        {profile && <fieldset disabled={runtime.exiting} className="config-stack">
          <div className="config-avatar-row"><Avatar name={profile.display_name} avatarId={profile.avatar_id} generation={generation} size={72} retryable /><div className="config-stack"><div className="config-actions"><Button variant="secondary" size="sm" disabled={avatarPending} onClick={() => void importAvatar()}><IconPhoto size={16} aria-hidden="true" />{avatarPending ? "正在选择…" : "选择头像"}</Button>{profile.avatar_id && <Button variant="ghost" size="sm" onClick={() => setConfirmRemoveAvatar(true)}>移除头像</Button>}</div><p className="form-caption">选择 PNG 或 JPEG，成功后直接应用。</p></div></div>
          {confirmRemoveAvatar && <div className="config-notice"><p>移除当前头像？历史消息也会改用默认头像。</p><div className="config-actions"><Button size="sm" onClick={() => void removeAvatar()}>确认移除头像</Button><Button variant="ghost" size="sm" onClick={() => setConfirmRemoveAvatar(false)}>保留头像</Button></div></div>}
          <SettingSection title="基本资料" description="文本离开输入框或确认后应用，取消会还原本次编辑。">
            <Field label="昵称"><EditableInput label="昵称" active={active} maxLength={80} value={profile.display_name} normalize={(next) => next.trim()} validate={(next) => validateText(next, 80, true)} onApply={(display_name) => store.updateUser({ display_name })} /></Field>
          </SettingSection>
        </fieldset>}
        {avatarError && state.status !== "error" && <p role="alert">{avatarError}</p>}
        <ResourceFeedback resource={store.user} state={state} />
        {profile && userSections.map(({ id, component: Section }) => <Section key={id} profile={profile} generation={generation} active={active} />)}
      </div>
    </section></div>
  </div>
}

export function UserPage(props: ApplicationPageProps) {
  const initialized = usePageActivation(props.active, props.session.snapshot?.data_generation_id ?? null)
  if (!props.session.snapshot) return <section className="surface-card w-full"><div className="panel-heading"><h1 className="panel-title">用户</h1></div><div className="panel-content"><p>本地数据尚未就绪。</p><Button variant="ghost" size="sm" onClick={() => void props.session.reload()}>重试连接</Button></div></section>
  if (!initialized) return null
  return <UserEditor key={props.session.snapshot.data_generation_id} {...props} />
}
