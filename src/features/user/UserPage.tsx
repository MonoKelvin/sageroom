import { useCallback, useEffect, useRef, useState, type FormEvent } from "react"
import { IconPhoto, IconUserCircle } from "@tabler/icons-react"
import type { ApplicationPageProps } from "@/app/navigation"
import { errorMessage, ipc } from "@/app/ipc"
import { Avatar } from "@/components/Avatar"
import { Button } from "@/components/ui/button"
import { userSections } from "./sections"
import { EditorFeedback, Field } from "@/features/settings/ConfigurationFields"
import { useLocalEditor, usePageActivation } from "@/features/settings/useLocalEditor"
import "@/features/settings/configuration.css"

function UserEditor({ session, active, onNavigate }: ApplicationPageProps) {
  const generation = session.snapshot!.data_generation_id
  const load = useCallback(() => ipc.getUserProfile({ data_generation_id: generation }), [generation])
  const editor = useLocalEditor({ active, load })
  const [avatarPending, setAvatarPending] = useState(false)
  const [avatarError, setAvatarError] = useState<string | null>(null)
  const avatarEpoch = useRef(0)
  const alive = useRef(false)
  useEffect(() => { alive.current = true; return () => { alive.current = false; avatarEpoch.current += 1 } }, [])
  const profile = editor.draft

  function edit(patch: Partial<NonNullable<typeof profile>>) {
    if (!profile) return
    avatarEpoch.current += 1
    editor.edit({ ...profile, ...patch })
  }

  async function importAvatar() {
    if (!profile || avatarPending || editor.loading) return
    const token = ++avatarEpoch.current
    setAvatarPending(true)
    setAvatarError(null)
    try {
      const avatar = await ipc.importAvatar({ data_generation_id: generation })
      if (alive.current && token === avatarEpoch.current && avatar) editor.edit({ ...profile, avatar_id: avatar.id })
    } catch (cause) {
      if (alive.current && token === avatarEpoch.current) setAvatarError(errorMessage(cause))
    } finally { if (alive.current) setAvatarPending(false) }
  }

  async function save(event: FormEvent) {
    event.preventDefault()
    const result = await editor.save((draft, requestId, revision) => ipc.saveUserProfile({
      data_generation_id: generation, client_request_id: requestId, expected_revision: revision,
      display_name: draft.display_name.trim(), introduction: draft.introduction, avatar_id: draft.avatar_id,
    }))
    if (result) void session.reload()
  }

  return <div className="workspace-layout config-page">
    <aside className="workspace-list" aria-label="用户资料导航">
      <div className="panel-heading"><h1 className="panel-title">用户</h1></div>
      <div className="list-entry" data-active="true"><IconUserCircle size={22} aria-hidden="true" /><span className="config-entry-text"><strong>{profile?.display_name || "我的资料"}</strong><span>本机用户</span></span></div>
      <p className="form-caption p-3">昵称和头像用于之后发送的消息，历史消息保留发送时的资料。</p>
      <Button variant="ghost" size="sm" onClick={() => onNavigate("chat")}>返回聊天</Button>
    </aside>
    <div className="workspace-detail"><section className="surface-card">
      <header className="panel-heading"><div><h2 className="panel-title">我的资料</h2><p className="panel-description">在这个聊天室中如何介绍自己。</p></div></header>
      <div className="panel-content panel-scroll">
        {!profile && <div className="config-stack"><p className="form-caption">{editor.loading ? "正在读取本地资料…" : "资料尚未读取。"}</p>{editor.error && <p role="alert">{editor.error}</p>}<Button size="sm" variant="ghost" disabled={editor.loading} onClick={() => void editor.reload()}>重试读取</Button></div>}
        {profile && <form onSubmit={(event) => void save(event)}>
          <fieldset disabled={editor.loading} className="config-stack">
            <div className="config-avatar-row"><Avatar name={profile.display_name} avatarId={profile.avatar_id} generation={generation} size={72} retryable /><div className="config-stack"><div className="config-actions"><Button variant="secondary" size="sm" disabled={avatarPending} onClick={() => void importAvatar()}><IconPhoto size={16} aria-hidden="true" />{avatarPending ? "正在选择…" : "选择头像"}</Button>{profile.avatar_id && <Button variant="ghost" size="sm" onClick={() => edit({ avatar_id: null })}>移除头像</Button>}</div><p className="form-caption">选择 PNG 或 JPEG，头像作为本地对象保存。</p></div></div>
            {avatarError && <div className="config-notice" role="alert"><p>{avatarError}</p><Button variant="ghost" size="sm" onClick={() => void importAvatar()}>重试选择头像</Button></div>}
            <Field label="昵称"><input className="form-control" required maxLength={80} value={profile.display_name} onChange={(event) => edit({ display_name: event.target.value })} /></Field>
            <Field label="简介"><textarea className="form-control" rows={4} maxLength={2000} value={profile.introduction} placeholder="写下你愿意分享的介绍" onChange={(event) => edit({ introduction: event.target.value })} /></Field>
          </fieldset>
          <EditorFeedback editor={{ ...editor, pending: editor.pending || avatarPending }} />
          <div className="config-savebar"><span className="form-caption" role="status">{editor.saved ? "资料已保存" : editor.dirty ? "有未保存的修改" : "资料保存在本机"}</span><div className="config-actions"><Button variant="ghost" size="sm" disabled={editor.pending || editor.loading || avatarPending} onClick={editor.requestReload}>重新读取</Button><Button type="submit" disabled={editor.pending || editor.loading || avatarPending}>{editor.pending ? "保存中…" : editor.error ? "重试保存资料" : "保存资料"}</Button></div></div>
        </form>}
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
