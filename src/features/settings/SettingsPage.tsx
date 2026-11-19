import { useCallback, useState, type FormEvent } from "react"
import { IconBrush, IconInfoCircle, IconLogout, IconMoon, IconSun, IconDeviceDesktop } from "@tabler/icons-react"
import type { ApplicationPageProps } from "@/app/navigation"
import type { Appearance } from "@/contracts/generated"
import { errorMessage, ipc } from "@/app/ipc"
import { Button } from "@/components/ui/button"
import { EditorFeedback } from "./ConfigurationFields"
import { useLocalEditor, usePageActivation } from "./useLocalEditor"
import "./configuration.css"

type Section = "appearance" | "about"
const sections = [
  { id: "appearance" as const, title: "外观", icon: IconBrush },
  { id: "about" as const, title: "关于与数据", icon: IconInfoCircle },
]

function formatBytes(value: string) {
  const bytes = BigInt(value)
  if (bytes < 1024n) return `${bytes} B`
  const unit = bytes < 1048576n ? 1024n : 1048576n
  return `${bytes / unit}.${bytes % unit * 10n / unit} ${unit === 1024n ? "KiB" : "MiB"}`
}

function AppearanceCard({ session, active }: Pick<ApplicationPageProps, "session" | "active">) {
  const snapshot = session.snapshot!
  const generation = snapshot.data_generation_id
  const load = useCallback(async () => (await ipc.snapshot({ data_generation_id: generation, last_event_seq: null })).appearance, [generation])
  const editor = useLocalEditor<Appearance>({ active, load, initial: snapshot.appearance })
  const appearance = editor.draft!
  async function save(event: FormEvent) {
    event.preventDefault()
    const result = await editor.save((draft, requestId, revision) => ipc.saveAppearance({ data_generation_id: generation, client_request_id: requestId, expected_revision: revision, theme: draft.theme, reduce_motion: draft.reduce_motion }))
    if (result) session.applyAppearance(result, generation)
  }
  const themes = [{ id: "system" as const, title: "跟随系统", icon: IconDeviceDesktop }, { id: "light" as const, title: "浅色", icon: IconSun }, { id: "dark" as const, title: "深色", icon: IconMoon }]
  return <form onSubmit={(event) => void save(event)}>
    <fieldset disabled={editor.loading} className="form-section"><legend className="sr-only">外观设置</legend><h3 className="form-section-title">主题</h3><div className="config-theme">{themes.map(({ id, title, icon: Icon }) => <label key={id} className="config-theme-choice"><input className="sr-only" type="radio" name="appearance-theme" checked={appearance.theme === id} onChange={() => editor.edit({ ...appearance, theme: id })} /><Icon size={20} aria-hidden="true" /><span>{title}</span></label>)}</div><label className="config-check"><input type="checkbox" checked={appearance.reduce_motion} onChange={(event) => editor.edit({ ...appearance, reduce_motion: event.target.checked })} />减少动画</label></fieldset>
    <EditorFeedback editor={editor} /><div className="config-savebar"><span className="form-caption" role="status">{editor.saved ? "外观已保存" : editor.dirty ? "有未保存的修改" : "外观设置保存在本机"}</span><div className="config-actions"><Button variant="ghost" size="sm" disabled={editor.pending || editor.loading} onClick={editor.requestReload}>重新读取</Button><Button type="submit" disabled={editor.pending || editor.loading}>{editor.pending ? "保存中…" : editor.error ? "重试保存外观" : "保存外观"}</Button></div></div>
  </form>
}

function SettingsEditor({ session, active, onNavigate }: ApplicationPageProps) {
  const snapshot = session.snapshot!
  const [section, setSection] = useState<Section>("appearance")
  const [exitPending, setExitPending] = useState(false)
  const [exitError, setExitError] = useState<string | null>(null)
  const [confirmExit, setConfirmExit] = useState(false)
  const title = sections.find((item) => item.id === section)!.title
  async function exit() {
    if (exitPending) return
    setExitPending(true)
    setExitError(null)
    try { await ipc.exit({ data_generation_id: snapshot.data_generation_id }) }
    catch (cause) { setExitError(errorMessage(cause)); setExitPending(false) }
  }

  return <div className="workspace-layout config-page">
    <aside className="workspace-list" aria-label="设置分类"><div className="panel-heading"><h1 className="panel-title">设置</h1></div><nav className="config-list-scroll">{sections.map(({ id, title: label, icon: Icon }) => <button key={id} className="list-entry" data-active={section === id} aria-current={section === id ? "page" : undefined} onClick={() => setSection(id)}><Icon size={21} aria-hidden="true" /><span>{label}</span></button>)}</nav><Button variant="ghost" size="sm" onClick={() => onNavigate("agents")}>管理智能体</Button></aside>
    <div className="workspace-detail"><section className="surface-card"><header className="panel-heading"><div><h2 className="panel-title">{title}</h2><p className="panel-description">{section === "about" ? "一个安静的本地聊天室。" : "黑白之间，保持安静。"}</p></div></header>
      <div className="panel-content panel-scroll">
        <div hidden={section !== "appearance"} inert={section !== "appearance"}><AppearanceCard session={session} active={active && section === "appearance"} /></div>
        {section === "about" && <div className="config-stack config-about"><section className="form-section"><h3 className="form-section-title">Sageroom</h3><dl><div><dt>版本</dt><dd>{snapshot.app_version}</dd></div><div><dt>许可证</dt><dd>MIT</dd></div><div><dt>数据目录</dt><dd>{snapshot.data_directory}</dd></div><div><dt>数据库占用（含 WAL/SHM）</dt><dd>{formatBytes(snapshot.data_usage.database_bytes)}</dd></div><div><dt>头像占用</dt><dd>{formatBytes(snapshot.data_usage.avatar_bytes)}</dd></div><div><dt>开源项目</dt><dd><a href="https://github.com/MonoKelvin/sageroom" target="_blank" rel="noreferrer">github.com/MonoKelvin/sageroom</a></dd></div><div><dt>作者</dt><dd><a href="https://github.com/MonoKelvin" target="_blank" rel="noreferrer">MonoKelvin</a></dd></div></dl></section><section className="form-section"><h3 className="form-section-title">本地数据</h3><p className="form-caption">聊天和配置保存在本机。模型密钥放在系统凭据库，头像按本地对象 ID 引用。连接测试会访问你填写的模型服务。</p><p className="form-caption">当前未提供备份与恢复入口。</p></section><section className="form-section"><h3 className="form-section-title">退出应用</h3><p className="form-caption">关闭窗口会隐藏到托盘；退出会结束本地任务。请先保存其他页面中的编辑。</p><Button variant="ghost" size="sm" className="self-start" disabled={exitPending} onClick={() => setConfirmExit(true)}><IconLogout size={16} aria-hidden="true" />退出应用</Button>{confirmExit && <div className="config-notice"><p>确定退出 Sageroom？未保存的编辑不会写入本机。</p><div className="config-actions"><Button size="sm" disabled={exitPending} onClick={() => void exit()}>{exitPending ? "退出中…" : "确认退出"}</Button><Button variant="ghost" size="sm" disabled={exitPending} onClick={() => setConfirmExit(false)}>继续使用</Button></div></div>}{exitError && <p role="alert">{exitError}</p>}</section></div>}
      </div>
    </section></div>
  </div>
}

function OfflineSettings({ session }: Pick<ApplicationPageProps, "session">) {
  const [confirmExit, setConfirmExit] = useState(false)
  const [pending, setPending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  async function exit() {
    if (pending) return
    setPending(true)
    setError(null)
    try { await ipc.exit({ data_generation_id: null }) }
    catch (cause) { setError(errorMessage(cause)); setPending(false) }
  }
  return <section className="surface-card w-full"><div className="panel-heading"><h1 className="panel-title">设置</h1></div><div className="panel-content"><p>本地数据尚未就绪，设置暂不可用。</p><div className="config-actions"><Button variant="ghost" size="sm" onClick={() => void session.reload()}>重试连接</Button><Button variant="ghost" size="sm" onClick={() => setConfirmExit(true)}>退出应用</Button></div>{confirmExit && <div className="config-notice"><p>确定退出 Sageroom？</p><div className="config-actions"><Button size="sm" disabled={pending} onClick={() => void exit()}>{pending ? "退出中…" : "确认退出"}</Button><Button variant="ghost" size="sm" disabled={pending} onClick={() => setConfirmExit(false)}>继续使用</Button></div></div>}{error && <p role="alert">{error}</p>}</div></section>
}

export function SettingsPage(props: ApplicationPageProps) {
  const initialized = usePageActivation(props.active, props.session.snapshot?.data_generation_id ?? null)
  if (!props.session.snapshot) return <OfflineSettings session={props.session} />
  if (!initialized) return null
  return <SettingsEditor key={props.session.snapshot.data_generation_id} {...props} />
}
