import { useEffect, useState } from "react"
import { IconBrush, IconInfoCircle, IconLogout } from "@tabler/icons-react"
import type { ApplicationPageProps } from "@/app/navigation"
import { useAppliedResource, useConfiguration, useConfigurationRuntime } from "@/app/configurationContext"
import { Button } from "@/components/ui/button"
import { WorkspaceList } from "@/components/WorkspaceList"
import { SettingSection } from "@/components/ui/setting-row"
import { SettingsSelect } from "@/components/ui/settings-select"
import { Switch } from "@/components/ui/switch"
import { Field, ResourceFeedback } from "./ConfigurationFields"
import { usePageActivation } from "./useLocalEditor"
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

function AppearanceCard({ active }: { active: boolean }) {
  const store = useConfiguration()
  const runtime = useConfigurationRuntime()
  const state = useAppliedResource(store.appearance, active)
  const appearance = state.value!
  return <div className="config-stack"><fieldset disabled={runtime.exiting}>
    <SettingSection title="外观设置" description="选择后直接应用到当前界面并保存在本机。">
      <Field label="主题"><SettingsSelect label="主题" value={appearance.theme} options={[{ value: "system", label: "跟随系统" }, { value: "light", label: "浅色" }, { value: "dark", label: "深色" }]} onValueChange={(theme) => store.updateAppearance({ theme: theme as typeof appearance.theme })} /></Field>
      <Field label="减少动画" caption="减少非必要的界面动效。"><Switch label="减少动画" checked={appearance.reduce_motion} onCheckedChange={(reduce_motion) => store.updateAppearance({ reduce_motion })} /></Field>
    </SettingSection>
  </fieldset><ResourceFeedback resource={store.appearance} state={state} /></div>
}

function ExitControl() {
  const runtime = useConfigurationRuntime()
  const [confirmExit, setConfirmExit] = useState(false)
  return <div className="config-stack"><Button variant="ghost" size="sm" className="self-start" disabled={runtime.exiting} onClick={() => { runtime.clearError(); setConfirmExit(true) }}><IconLogout size={16} aria-hidden="true" />退出应用</Button>
    {confirmExit && <div className="config-notice"><p>确定退出 Sageroom？已应用的修改会完成写入；仍在编辑的文本不会自动提交。</p><div className="config-actions"><Button size="sm" disabled={runtime.exiting} onClick={() => void runtime.requestExit()}>{runtime.exiting ? "退出中…" : "确认退出"}</Button><Button variant="ghost" size="sm" disabled={runtime.exiting} onClick={() => { setConfirmExit(false); runtime.clearError() }}>继续使用</Button></div></div>}
    {runtime.error && <p role="alert">{runtime.error}</p>}
  </div>
}

function SettingsEditor({ session, active, onNavigate }: ApplicationPageProps) {
  const snapshot = session.snapshot!
  const [section, setSection] = useState<Section>("appearance")
  const title = sections.find((item) => item.id === section)!.title
  const reload = session.reload
  useEffect(() => { if (active && section === "about") void reload() }, [active, section, reload])
  return <div className="workspace-layout config-page">
    <WorkspaceList aria-label="设置分类"><div className="panel-heading"><h1 className="panel-title">设置</h1></div><nav className="config-list-scroll">{sections.map(({ id, title: label, icon: Icon }) => <button key={id} type="button" className="list-entry" data-active={section === id} aria-current={section === id ? "page" : undefined} onClick={() => setSection(id)}><Icon size={21} aria-hidden="true" /><span>{label}</span></button>)}</nav><Button variant="ghost" size="sm" onClick={() => onNavigate("agents")}>管理智能体</Button></WorkspaceList>
    <div className="workspace-detail"><section className="surface-card"><header className="panel-heading"><div><h2 className="panel-title">{title}</h2><p className="panel-description">{section === "about" ? "版本、许可与本地数据。" : "选择后直接应用。"}</p></div></header>
      <div className="panel-content panel-scroll">
        <div hidden={section !== "appearance"} inert={section !== "appearance"}><AppearanceCard active={active && section === "appearance"} /></div>
        {section === "about" && <div className="config-stack config-about"><SettingSection title="Sageroom"><dl><div><dt>版本</dt><dd>{snapshot.app_version}</dd></div><div><dt>许可证</dt><dd>MIT</dd></div><div><dt>数据目录</dt><dd>{snapshot.data_directory}</dd></div><div><dt>数据库占用（含 WAL/SHM）</dt><dd>{formatBytes(snapshot.data_usage.database_bytes)}</dd></div><div><dt>头像占用</dt><dd>{formatBytes(snapshot.data_usage.avatar_bytes)}</dd></div><div><dt>开源项目</dt><dd><a href="https://github.com/MonoKelvin/sageroom" target="_blank" rel="noreferrer">github.com/MonoKelvin/sageroom</a></dd></div><div><dt>作者</dt><dd><a href="https://github.com/MonoKelvin" target="_blank" rel="noreferrer">MonoKelvin</a></dd></div></dl></SettingSection>
          <SettingSection title="本地数据"><p className="form-caption">聊天和配置保存在本机。模型密钥放在系统凭据库，头像按本地对象 ID 引用。只有显式连接测试才会访问你填写的模型服务。</p><p className="form-caption">当前未提供备份与恢复入口。</p></SettingSection>
          <SettingSection title="退出应用" description="关闭窗口会隐藏到托盘；退出会等待已应用配置落盘。"><ExitControl /></SettingSection>
        </div>}
      </div>
    </section></div>
  </div>
}

function OfflineSettings({ session }: Pick<ApplicationPageProps, "session">) {
  return <section className="surface-card w-full"><div className="panel-heading"><h1 className="panel-title">设置</h1></div><div className="panel-content config-stack"><p>本地数据尚未就绪，设置暂不可用。</p><Button variant="ghost" size="sm" className="self-start" onClick={() => void session.reload()}>重试连接</Button><ExitControl /></div></section>
}

export function SettingsPage(props: ApplicationPageProps) {
  const initialized = usePageActivation(props.active, props.session.snapshot?.data_generation_id ?? null)
  if (!props.session.snapshot) return <OfflineSettings session={props.session} />
  if (!initialized) return null
  return <SettingsEditor key={props.session.snapshot.data_generation_id} {...props} />
}
