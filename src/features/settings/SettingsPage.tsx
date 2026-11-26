import { useEffect, useLayoutEffect, useRef, useState } from "react"
import { IconArrowUpRight, IconBrandGithub, IconBrush, IconDatabase, IconFolder, IconInfoCircle, IconLoader2, IconPointer } from "@tabler/icons-react"
import { APP_METADATA } from "@/app/metadata"
import type { UiPreferences } from "@/contracts/generated"
import { ipc, isDesktopEnvironment } from "@/app/ipc"
import { loadUiPreferences, saveUiPreferences } from "@/app/uiPreferences"
import type { ApplicationPageProps } from "@/app/navigation"
import { useAppliedResource, useConfiguration, useConfigurationRuntime } from "@/app/configurationContext"
import { AppDialog } from "@/components/ui/app-dialog"
import { Button } from "@/components/ui/button"
import { WorkspaceList } from "@/components/WorkspaceList"
import { SettingRow } from "@/components/ui/setting-row"
import { SettingsSelect } from "@/components/ui/settings-select"
import { Switch } from "@/components/ui/switch"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { Field, ResourceFeedback } from "./ConfigurationFields"
import { usePageActivation } from "./useLocalEditor"
import appLogo from "../../../src-tauri/icons/appicon-logo.png"
import privacyText from "../../../docs/PRIVACY.md?raw"
import "./configuration.css"

type Section = "appearance" | "operations" | "data" | "about"
const sections = [
  { id: "appearance" as const, title: "外观", icon: IconBrush },
  { id: "operations" as const, title: "操作", icon: IconPointer },
  { id: "data" as const, title: "数据", icon: IconDatabase },
  { id: "about" as const, title: "关于", icon: IconInfoCircle },
]

function formatBytes(value: string) {
  const bytes = BigInt(value)
  if (bytes < 1024n) return `${bytes} B`
  const units = [
    { size: 1024n, label: "KiB" },
    { size: 1024n * 1024n, label: "MiB" },
    { size: 1024n * 1024n * 1024n, label: "GiB" },
  ]
  const unit = [...units].reverse().find((item) => bytes >= item.size) ?? units[0]
  return `${bytes / unit.size}.${bytes % unit.size * 10n / unit.size} ${unit.label}`
}

/**
 * 中间省略：从文本中点逐字符删除并补上省略号，每次重新测量渲染宽度，
 * 直到宽度刚好不超过容器可用宽度。测量容器与实际文本分离，避免右侧留白。
 */
function useMiddleEllipsis(text: string) {
  const measuredRef = useRef<HTMLSpanElement>(null)
  const [display, setDisplay] = useState(text)
  const ellipsis = "..."

  useLayoutEffect(() => {
    const node = measuredRef.current
    if (!node) return

    const update = () => {
      const available = node.clientWidth
      if (!available) return
      const style = getComputedStyle(node)
      const probe = document.createElement("span")
      probe.style.font = style.font
      probe.style.letterSpacing = style.letterSpacing
      probe.style.position = "absolute"
      probe.style.visibility = "hidden"
      probe.style.whiteSpace = "nowrap"
      document.body.appendChild(probe)
      const widthOf = (value: string) => {
        probe.textContent = value
        return probe.getBoundingClientRect().width
      }

      let next = text
      if (widthOf(text) > available) {
        // head 保留开头，tail 保留结尾；每轮从当前保留串的中点删一个字符。
        let head = text.slice(0, Math.floor(text.length / 2))
        let tail = text.slice(Math.floor(text.length / 2))
        while (head.length + tail.length > 1) {
          // 从较长的一侧靠近中点处删一个字符，保持首尾大致均衡。
          if (head.length >= tail.length && head.length > 0) head = head.slice(0, -1)
          else if (tail.length > 0) tail = tail.slice(1)
          const candidate = head + ellipsis + tail
          next = candidate
          if (widthOf(candidate) <= available) break
        }
      }
      probe.remove()
      setDisplay(next)
    }

    update()
    const observer = new ResizeObserver(update)
    observer.observe(node)
    return () => observer.disconnect()
  }, [text])

  return { measuredRef, display }
}

/** 轻量 markdown 渲染：覆盖隐私协议实际使用的标题、段落、粗体、链接、列表、表格与分隔线。 */
function renderPrivacy(markdown: string) {
  const escapeHtml = (text: string) => text.replace(/[&<>]/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;" })[char] ?? char)
  const inline = (text: string) => escapeHtml(text)
    .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>")
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" data-external="true">$1</a>')

  const lines = markdown.split("\n")
  const output: string[] = []
  let paragraph: string[] = []
  let list: string[] = []
  let listTag: "ul" | "ol" | null = null
  let table: string[][] = []
  let tableHead = false

  const flushParagraph = () => {
    if (paragraph.length) { output.push(`<p>${inline(paragraph.join(" "))}</p>`); paragraph = [] }
  }
  const flushList = () => {
    if (listTag) { output.push(`<${listTag}>${list.join("")}</${listTag}>`); list = []; listTag = null }
  }
  const flushTable = () => {
    if (table.length) {
      const columns = Math.max(...table.map((row) => row.length))
      // 按每列最长单元格的字符数分配 fr，内容多的列更宽，避免生硬平分。
      const weights = Array.from({ length: columns }, (_, index) => {
        const longest = Math.max(...table.map((row) => (row[index] ?? "").length))
        return Math.max(1, Math.ceil(longest / 6))
      })
      const template = weights.map((weight) => `minmax(0,${weight}fr)`).join(" ")
      const style = `grid-template-columns:${template}`
      const renderRow = (cells: string[], head = false) =>
        `<div class="privacy-row${head ? " privacy-table-head" : ""}" style="${style}">${cells.map((cell) => `<span>${cell}</span>`).join("")}</div>`
      const head = tableHead ? renderRow(table[0], true) : ""
      const body = tableHead ? table.slice(1) : table
      output.push(`<div class="privacy-table">${head}${body.map((row) => renderRow(row)).join("")}</div>`)
      table = []
      tableHead = false
    }
  }
  const flushAll = () => { flushParagraph(); flushList(); flushTable() }

  for (const line of lines) {
    const trimmed = line.trim()
    if (!trimmed) { flushAll(); continue }

    if (trimmed === "---") { flushAll(); output.push('<hr class="privacy-divider" />'); continue }

    if (trimmed.startsWith("|")) {
      flushParagraph(); flushList()
      const cells = trimmed.split("|").slice(1, -1)
      // 分隔行 | --- | --- | 只用于标记表头，不输出
      if (cells.every((cell) => /^:?-{2,}:?$/.test(cell.trim()))) { tableHead = table.length > 0; continue }
      table.push(cells.map((cell) => inline(cell.trim())))
      continue
    }
    flushTable()

    const heading = /^(#{1,4})\s+(.*)$/.exec(trimmed)
    if (heading) {
      flushParagraph(); flushList()
      const level = Math.min(heading[1].length + 1, 4)
      output.push(`<h${level}>${inline(heading[2])}</h${level}>`)
      continue
    }

    const unordered = /^[-*]\s+(.*)$/.exec(trimmed)
    const ordered = /^\d+\.\s+(.*)$/.exec(trimmed)
    if (unordered || ordered) {
      flushParagraph()
      const tag = unordered ? "ul" : "ol"
      if (listTag && listTag !== tag) flushList()
      listTag = tag
      list.push(`<li>${inline((unordered ?? ordered)![1])}</li>`)
      continue
    }
    flushList()
    paragraph.push(trimmed)
  }
  flushAll()
  return output.join("")
}

function AppearanceCard({ active }: { active: boolean }) {
  const store = useConfiguration()
  const runtime = useConfigurationRuntime()
  const state = useAppliedResource(store.appearance, active)
  const appearance = state.value!
  return <div className="config-stack"><fieldset disabled={runtime.exiting}>
    <Field label="主题"><SettingsSelect label="主题" value={appearance.theme} options={[{ value: "system", label: "跟随系统" }, { value: "light", label: "浅色" }, { value: "dark", label: "深色" }]} onValueChange={(theme) => store.updateAppearance({ theme: theme as typeof appearance.theme })} /></Field>
    <Field label="减少动画" caption="减少非必要的界面动效。"><Switch label="减少动画" checked={appearance.reduce_motion} onCheckedChange={(reduce_motion) => store.updateAppearance({ reduce_motion })} /></Field>
  </fieldset><ResourceFeedback resource={store.appearance} state={state} /></div>
}

function AutostartField() {
  const [enabled, setEnabled] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const desktop = isDesktopEnvironment()
  useEffect(() => {
    if (!desktop) return
    let alive = true
    void ipc.autostartStatus({ data_generation_id: null }).then((state) => {
      if (!alive) return
      setEnabled(state.enabled)
      setError(null)
    }).catch((cause) => { if (alive) setError(String(cause)) })
    return () => { alive = false }
  }, [desktop])
  return <>
    <Field label="开机自启" caption="默认关闭；开启后登录系统时自动启动 Sageroom。">
      <Switch label="开机自启" checked={enabled} disabled={!desktop} onCheckedChange={async (next) => {
        const state = await ipc.autostartSet({ enabled: next })
        setEnabled(state.enabled)
        setError(null)
      }} />
    </Field>
    {error && <p role="alert" className="form-caption">读取自启状态失败：{error}</p>}
  </>
}

function UiPreferencesCard({ generation }: { generation: string }) {
  const [preferences, setPreferences] = useState<UiPreferences | null>(null)
  const [error, setError] = useState<string | null>(null)
  useEffect(() => {
    void loadUiPreferences(generation).then(setPreferences).catch((cause) => setError(String(cause)))
  }, [generation])

  function update(next: UiPreferences) {
    setPreferences(next)
    setError(null)
    void saveUiPreferences(generation, next).catch((cause) => setError(String(cause)))
  }

  return <div className="config-stack settings-tight">
    <Field label="关闭窗口" caption="关闭主窗口时直接退出，或隐藏到托盘继续接收消息。"><SettingsSelect label="关闭窗口" value={preferences?.close_action ?? "hide"} options={[{ value: "hide", label: "隐藏到托盘" }, { value: "exit", label: "退出应用" }]} onValueChange={(close_action) => { if (preferences) update({ ...preferences, close_action: close_action as UiPreferences["close_action"] }) }} /></Field>
    <Field label="发送消息" caption="选择输入框里用哪个组合键发送，另一个用于换行。"><SettingsSelect label="发送消息" value={preferences?.send_key ?? "enter"} options={[{ value: "enter", label: "Enter 发送，Shift+Enter 换行" }, { value: "ctrl_enter", label: "Ctrl+Enter 发送，Enter 换行" }]} onValueChange={(send_key) => { if (preferences) update({ ...preferences, send_key: send_key as UiPreferences["send_key"] }) }} /></Field>
    <AutostartField />
    {error && <p role="alert" className="form-caption">保存失败：{error}</p>}
  </div>
}

function DataDirectoryCard({ generation, current }: { generation: string; current: string }) {
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const { measuredRef: pathRef, display: pathDisplay } = useMiddleEllipsis(current)

  async function migrate() {
    if (busy) return
    setBusy(true)
    setError(null)
    setMessage(null)
    try {
      const target = await ipc.pickDataDirectory()
      if (!target) return
      await ipc.migrateDataDirectory({ data_generation_id: generation, target })
      setMessage("数据已复制到目标目录。重启应用后生效，旧目录可自行删除。")
    } catch (cause) {
      setError(String(cause))
    } finally {
      setBusy(false)
    }
  }

  return <div className="config-stack">
    <SettingRow title="数据目录" description="聊天、配置和智能体数据的存放目录。">
      <div className="config-actions data-directory-value">
        <Tooltip disableHoverableContent><TooltipTrigger asChild>
          <span className="data-directory-path-wrap"><span ref={pathRef} className="data-directory-path">{pathDisplay}</span></span>
        </TooltipTrigger><TooltipContent>{current}</TooltipContent></Tooltip>
        <Tooltip disableHoverableContent><TooltipTrigger asChild>
          <Button variant="ghost" size="icon-sm" aria-label="迁移数据目录" disabled={busy} onClick={() => void migrate()}>{busy ? <IconLoader2 size={16} className="spin" aria-hidden="true" /> : <IconFolder size={16} aria-hidden="true" />}</Button>
        </TooltipTrigger><TooltipContent>迁移到其他目录</TooltipContent></Tooltip>
      </div>
    </SettingRow>
    {message && <p className="form-caption" role="status">{message}</p>}
    {error && <p className="form-caption" role="alert">迁移失败：{error}</p>}
  </div>
}

function SettingsEditor({ session, active }: ApplicationPageProps) {
  const snapshot = session.snapshot!
  const [section, setSection] = useState<Section>("appearance")
  const [privacyOpen, setPrivacyOpen] = useState(false)
  const reload = session.reload
  useEffect(() => { if (active && section === "data") void reload() }, [active, section, reload])
  return <div className="workspace-layout config-page">
    <WorkspaceList aria-label="设置分类"><nav className="config-list-scroll">{sections.map(({ id, title: label, icon: Icon }) => <button key={id} type="button" className="list-entry" data-active={section === id} aria-current={section === id ? "page" : undefined} onClick={() => setSection(id)}><Icon size={21} aria-hidden="true" /><span>{label}</span></button>)}</nav></WorkspaceList>
    <div className="workspace-detail"><section className="surface-card"><div className="panel-content panel-scroll">
        <div hidden={section !== "appearance"} inert={section !== "appearance"}>
          <AppearanceCard active={active && section === "appearance"} />
        </div>
        <div hidden={section !== "operations"} inert={section !== "operations"}>
          <UiPreferencesCard generation={snapshot.data_generation_id} />
        </div>
        <div hidden={section !== "data"} inert={section !== "data"}>
          <DataDirectoryCard generation={snapshot.data_generation_id} current={snapshot.data_directory} />
          <div className="setting-row">
            <div className="setting-row-copy"><span className="setting-row-title">占用空间</span></div>
            <div className="setting-row-controls"><span>{formatBytes(snapshot.data_usage.database_bytes)}<span className="disk-total"> / {formatBytes(snapshot.data_usage.disk_total_bytes)}{snapshot.data_usage.disk_letter ? `（${snapshot.data_usage.disk_letter}）` : ""}</span></span></div>
          </div>
        </div>
        <div hidden={section !== "about"} inert={section !== "about"}>
          <div className="about-brand">
            <img src={appLogo} alt="" className="about-logo" />
            <div className="about-brand-copy"><strong>{APP_METADATA.productName}</strong><p>{APP_METADATA.description}</p></div>
          </div>
          <dl className="config-stats"><div><dt>版本</dt><dd>{snapshot.app_version}</dd></div><div><dt>发布时间</dt><dd>{APP_METADATA.releaseDate}</dd></div><div><dt>许可证</dt><dd>{APP_METADATA.license}</dd></div><div><dt>开源项目</dt><dd><a className="config-about-link" href={APP_METADATA.homepage} onClick={(event) => { event.preventDefault(); void ipc.openExternalLink(APP_METADATA.homepage) }}>{APP_METADATA.homepage.replace(/^https?:\/\//u, "")}<IconArrowUpRight size={15} stroke={1.8} aria-hidden="true" /></a></dd></div><div><dt>作者</dt><dd><a className="config-about-link" href={APP_METADATA.author.url} onClick={(event) => { event.preventDefault(); void ipc.openExternalLink(APP_METADATA.author.url) }}><IconBrandGithub size={16} stroke={1.8} aria-hidden="true" />{APP_METADATA.author.name}</a></dd></div><div><dt>隐私协议</dt><dd><Button variant="ghost" size="sm" onClick={() => setPrivacyOpen(true)}>查看协议</Button></dd></div></dl>
        </div>
      </div>
    </section></div>
    <AppDialog open={privacyOpen} onOpenChange={setPrivacyOpen} title="隐私协议" className="privacy-dialog" actions={[{ label: "我已了解" }]}>
      <div className="privacy-text" onClick={(event) => {
        const link = (event.target as HTMLElement).closest<HTMLAnchorElement>("a[data-external]")
        if (link) { event.preventDefault(); void ipc.openExternalLink(link.href) }
      }} dangerouslySetInnerHTML={{ __html: renderPrivacy(privacyText) }} />
    </AppDialog>
  </div>
}

function OfflineSettings({ session }: Pick<ApplicationPageProps, "session">) {
  return <section className="surface-card w-full"><div className="panel-heading"><h1 className="panel-title">设置</h1></div><div className="panel-content config-stack"><p>本地数据尚未就绪，设置暂不可用。</p><Button variant="ghost" size="sm" className="self-start" onClick={() => void session.reload()}>重试连接</Button></div></section>
}

export function SettingsPage(props: ApplicationPageProps) {
  const initialized = usePageActivation(props.active, props.session.snapshot?.data_generation_id ?? null)
  if (!props.session.snapshot) return <OfflineSettings session={props.session} />
  if (!initialized) return null
  return <SettingsEditor key={props.session.snapshot.data_generation_id} {...props} />
}
