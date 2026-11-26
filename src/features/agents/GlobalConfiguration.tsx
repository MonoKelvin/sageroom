import { useEffect, useRef, useState } from "react"
import { IconAdjustments, IconAlertTriangle, IconChevronRight, IconCode, IconCopy, IconNews, IconPlus, IconRobot, IconTool, IconTrash } from "@tabler/icons-react"
import { useAppliedResource, useConfiguration, useConfigurationRuntime } from "@/app/configurationContext"
import { errorMessage, ipc } from "@/app/ipc"
import type { NewsPreviewResponse, NewsProvider, NewsProxyMode } from "@/contracts/generated"
import { AppDialog } from "@/components/ui/app-dialog"
import { Button } from "@/components/ui/button"
import { Disclosure } from "@/components/ui/disclosure"
import { EditableInput } from "@/components/ui/editable-input"
import { EditableTextarea } from "@/components/ui/editable-textarea"
import { NumberInput } from "@/components/ui/number-input"
import { SegmentedControl } from "@/components/ui/segmented-control"
import { SettingsSelect } from "@/components/ui/settings-select"
import { Switch } from "@/components/ui/switch"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { useToast } from "@/components/ui/toast-context"
import { validateText } from "@/features/settings/configurationDefaults"
import { DimensionsFields, Field, ModelFields, ResourceFeedback } from "@/features/settings/ConfigurationFields"
import { ModelCredentials } from "@/features/settings/ModelCredentials"

type Section = "models" | "personas" | "news"
/** 全局配置的统一标识：列表页入口按钮与右侧详情标题共用，避免两处图标漂移。 */
export const GLOBAL_CONFIG_ICON = IconTool

const sections = [
  { value: "models" as const, label: "模型配置", icon: IconRobot },
  { value: "personas" as const, label: "人格预设", icon: IconAdjustments },
  { value: "news" as const, label: "联网新闻", icon: IconNews },
]

const newsProviders: { value: NewsProvider; label: string; caption: string }[] = [
  { value: "auto", label: "自动（免费来源优先）", caption: "优先用免费来源，失败时自动换一个。" },
  { value: "ai_hot", label: "AIHOT 热点（近 7 天）", caption: "AI 行业新闻，免费。" },
  { value: "google_news_rss", label: "Google 新闻（中文搜索）", caption: "中文新闻搜索，免费。" },
  { value: "any_search", label: "AnySearch（免费匿名搜索）", caption: "免费搜索，部分结果没有日期。" },
  { value: "free_news_trending", label: "FreeNews 热点（全球）", caption: "全球热点，免费。" },
  { value: "bbc_technology", label: "BBC 科技（RSS）", caption: "英文科技新闻，免费。" },
  { value: "gdelt", label: "GDELT 全球新闻（易限流）", caption: "全球新闻搜索，免费但容易限流。" },
  { value: "tavily", label: "Tavily 新闻（匿名 / API Key）", caption: "不填密钥也能用，有每日限额。密钥在 app.tavily.com 申请。" },
  { value: "serper", label: "Serper 新闻（需 API Key）", caption: "需密钥，serper.dev 注册后有试用额度。" },
]

function newsLabel(provider: NewsProvider) { return newsProviders.find((item) => item.value === provider)?.label ?? provider }

function NewsCredentials({ provider, active, disabled }: { provider: NewsProvider; active: boolean; disabled: boolean }) {
  const store = useConfiguration()
  const [configured, setConfigured] = useState(false)
  const [pending, setPending] = useState(false)
  const [statusLoaded, setStatusLoaded] = useState(false)
  const credentialBusy = useRef(false)
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  useEffect(() => {
    if (!active) return
    let alive = true
    ipc.newsSecretStatus({ data_generation_id: store.snapshot.data_generation_id, provider })
      .then((result) => { if (alive && !credentialBusy.current) { setConfigured(result.configured); setError(null) } })
      .catch((cause) => { if (alive && !credentialBusy.current) setError(errorMessage(cause)) })
      .finally(() => { if (alive) setStatusLoaded(true) })
    return () => { alive = false }
  }, [active, provider, store])
  async function apply(api_key: string | null) {
    if (credentialBusy.current) return
    credentialBusy.current = true
    setPending(true)
    setError(null)
    setMessage(null)
    try {
      const result = await ipc.setNewsSecret({ data_generation_id: store.snapshot.data_generation_id, provider, api_key })
      setConfigured(result.configured)
      setMessage(api_key === null ? "新闻密钥已移除。" : "新闻密钥已存入系统凭据库，输入已清空。")
    } catch (cause) {
      setError(errorMessage(cause))
      throw cause
    } finally { credentialBusy.current = false; setPending(false) }
  }
  return <Field label="API密钥" caption="密钥保存在系统凭据库；用完免费额度后可能收费。">
    <div className="credential-input-row">
      <EditableInput label="API密钥" type="password" value="" active={active} resetOnApply autoComplete="new-password" spellCheck={false} placeholder={configured ? "已配置系统密钥" : "未配置系统密钥"} disabled={pending || disabled || !statusLoaded} onApply={(value) => apply(value)} />
      {configured && <Button variant="ghost" size="sm" disabled={pending || disabled || !statusLoaded} onClick={() => void apply(null).catch(() => {})}>移除密钥</Button>}
    </div>
    {message && <p className="form-caption" role="status">{message}</p>}
    {error && <p className="form-caption" role="alert">{error}</p>}
  </Field>
}

function IconAction({ label, icon: Icon, onClick, disabled, danger }: {
  label: string; icon: typeof IconPlus; onClick: () => void; disabled?: boolean; danger?: boolean
}) {
  return <Tooltip disableHoverableContent><TooltipTrigger asChild>
    <Button variant="ghost" size="icon-sm" className={danger ? "danger-icon" : undefined} aria-label={label} disabled={disabled} onClick={onClick}><Icon size={16} aria-hidden="true" /></Button>
  </TooltipTrigger><TooltipContent>{label}</TooltipContent></Tooltip>
}

export function GlobalConfiguration({ active }: { active: boolean }) {
  const store = useConfiguration()
  const runtime = useConfigurationRuntime()
  const state = useAppliedResource(store.global, active)
  const toast = useToast()
  const config = state.value
  const [section, setSection] = useState<Section>("models")
  const newsState = useAppliedResource(store.news, active && section === "news")
  const [deleteTarget, setDeleteTarget] = useState<{ kind: "model" | "persona"; id: string } | null>(null)
  const [importing, setImporting] = useState(false)
  const [operationError, setOperationError] = useState<string | null>(null)
  const [newsPreview, setNewsPreview] = useState<{ pending: boolean; result: NewsPreviewResponse | null; error: string | null; key: string | null }>({ pending: false, result: null, error: null, key: null })
  const newsTestBusy = useRef(false)
  const newsConfigKey = JSON.stringify(newsState.value?.configuration)
  const visibleNewsPreview = newsPreview.key === newsConfigKey ? newsPreview.result : null
  const [unavailable, setUnavailable] = useState<Record<string, boolean>>({})
  // 卡片折叠状态：默认全部展开，键为配置 id。
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({})
  const isCollapsed = (id: string) => collapsed[id] === true
  const toggleCollapsed = (id: string) => setCollapsed((current) => ({ ...current, [id]: !current[id] }))

  async function run(operation: () => Promise<unknown>) {
    setOperationError(null)
    try { await operation() } catch (cause) { if (store.global.getSnapshot().status !== "error") setOperationError(errorMessage(cause)) }
  }
  function remove() {
    if (!deleteTarget) return
    const { kind, id } = deleteTarget
    void run(() => store.global.change((current) => kind === "model"
      ? { ...current, model_profiles: current.model_profiles.filter((item) => item.id !== id) }
      : { ...current, persona_presets: current.persona_presets.filter((item) => item.id !== id) }))
  }
  async function importDevelopmentModel() {
    setImporting(true)
    try { await store.importDevelopmentModel() }
    catch (cause) { toast.error(`导入开发环境大模型失败：${errorMessage(cause)}`) }
    finally { setImporting(false) }
  }
  async function testNewsSource() {
    const current = newsState.value
    if (!current || newsTestBusy.current) return
    newsTestBusy.current = true
    const key = JSON.stringify(current.configuration)
    setNewsPreview({ pending: true, result: null, error: null, key })
    try {
      await store.news.flush()
      const configuration = store.news.getSnapshot().value?.configuration ?? current.configuration
      const result = await ipc.previewNews({ data_generation_id: store.snapshot.data_generation_id, configuration })
      setNewsPreview({ pending: false, result, error: null, key: JSON.stringify(configuration) })
    } catch (cause) {
      setNewsPreview({ pending: false, result: null, error: errorMessage(cause), key })
    } finally { newsTestBusy.current = false }
  }
  return <section className="surface-card">
    <header className="panel-heading"><h2 className="panel-title config-panel-title"><GLOBAL_CONFIG_ICON size={18} aria-hidden="true" />全局配置</h2></header>
    <div className="panel-content panel-scroll">
      <div className="config-sections">
      <SegmentedControl items={sections} value={section} onChange={setSection} label="全局配置分类" className="config-segmented" />
      {!config && <p className="form-caption">{state.loading ? "正在读取本地配置…" : "配置尚未就绪。"}</p>}
      {config && <fieldset disabled={runtime.exiting || importing}>
        <div hidden={section !== "models"} inert={section !== "models"}>
          <div className="config-card-list">
            {!config.model_profiles.length && <div className="config-empty-state"><p>还没有模型配置。</p><div className="config-actions config-empty-actions">
              <IconAction label="添加大模型" icon={IconPlus} onClick={() => void run(() => store.createModel())} />
              {store.snapshot.development_tools_available && <IconAction label="导入开发环境大模型" icon={IconCode} onClick={() => void importDevelopmentModel()} disabled={importing || state.status === "error"} />}
            </div></div>}
            {config.model_profiles.map((model) => {
              const open = !isCollapsed(model.id)
              return <section key={model.id} className="config-card" aria-label={`模型配置 ${model.name}`}>
                <div className="config-card-head">
                  <button type="button" className="config-card-toggle" aria-expanded={open} onClick={() => toggleCollapsed(model.id)}>
                    <IconChevronRight size={16} className="config-card-chevron" data-open={open} aria-hidden="true" />
                    <strong className="config-card-title">{model.name || "未命名配置"}</strong>
                    {!open && <span className="config-card-model">（{model.model_name.trim() && model.credential_configured ? model.model_name : "未配置"}）</span>}
                  </button>
                  <div className="config-actions config-item-actions">
                    <IconAction label="添加大模型" icon={IconPlus} onClick={() => void run(() => store.createModel())} />
                    <IconAction label="复制大模型" icon={IconCopy} onClick={() => void run(() => store.createModel(model))} />
                    {store.snapshot.development_tools_available && <IconAction label="导入开发环境大模型" icon={IconCode} onClick={() => void importDevelopmentModel()} disabled={importing || state.status === "error"} />}
                    {unavailable[model.id] && <Tooltip disableHoverableContent><TooltipTrigger asChild>
                      <button type="button" className="model-unavailable-mark" aria-label="模型不可用"><IconAlertTriangle size={16} aria-hidden="true" /></button>
                    </TooltipTrigger><TooltipContent>模型不可用</TooltipContent></Tooltip>}
                    <IconAction label="删除大模型" icon={IconTrash} danger onClick={() => setDeleteTarget({ kind: "model", id: model.id })} />
                  </div>
                </div>
                <div className="config-card-body-wrap" data-open={open} inert={!open}>
                  <div className="config-card-body-clip">
                    <div className="config-card-body">
                      <ModelFields value={model} active={active && section === "models" && open} onChange={(patch) => store.updateModel(model.id, patch)} onListModels={() => store.listModelNames(model.id).then((result) => result.models)} />
                      <ModelCredentials profile={model} active={active && section === "models" && open} disabled={runtime.exiting || importing || state.status === "error"} onTestResult={(available) => setUnavailable((current) => ({ ...current, [model.id]: !available }))} />
                    </div>
                  </div>
                </div>
              </section>
            })}
          </div>
        </div>
        <div hidden={section !== "personas"} inert={section !== "personas"}>
          <div className="config-card-list">
            {!config.persona_presets.length && <div className="config-empty-state"><p>还没有人格预设。</p><div className="config-actions config-empty-actions">
              <IconAction label="添加人格" icon={IconPlus} onClick={() => void run(() => store.createPersona())} />
            </div></div>}
            {config.persona_presets.map((persona) => {
              const open = !isCollapsed(persona.id)
              return <section className="config-card" key={persona.id} aria-label={`人格预设 ${persona.name}`}>
                <div className="config-card-head">
                  <button type="button" className="config-card-toggle" aria-expanded={open} onClick={() => toggleCollapsed(persona.id)}>
                    <IconChevronRight size={16} className="config-card-chevron" data-open={open} aria-hidden="true" />
                    <strong className="config-card-title">{persona.name || "未命名人格"}</strong>
                  </button>
                  <div className="config-actions config-item-actions">
                    <IconAction label="添加人格" icon={IconPlus} onClick={() => void run(() => store.createPersona())} />
                    <IconAction label="复制人格预设" icon={IconCopy} onClick={() => void run(() => store.createPersona(persona))} />
                    <IconAction label="删除人格预设" icon={IconTrash} danger onClick={() => setDeleteTarget({ kind: "persona", id: persona.id })} />
                  </div>
                </div>
                <div className="config-card-body-wrap" data-open={open} inert={!open}>
                  <div className="config-card-body-clip">
                    <div className="config-card-body">
                      <Field label="人格名称"><EditableInput label="人格名称" active={active && section === "personas" && open} value={persona.name} maxLength={80} normalize={(next) => next.trim()} validate={(next) => validateText(next, 80, true)} onApply={(name) => store.updatePersona(persona.id, { name })} /></Field>
                      <Field label="语言风格"><EditableTextarea label="语言风格" active={active && section === "personas" && open} value={persona.language_style} maxLength={2000} rows={2} validate={(next) => validateText(next, 2000)} onApply={(language_style) => store.updatePersona(persona.id, { language_style })} /></Field>
                      <Disclosure title="八个人格维度（0–100）"><DimensionsFields value={persona.dimensions} onChange={(key, next) => store.global.change((current) => ({ ...current, persona_presets: current.persona_presets.map((item) => item.id === persona.id ? { ...item, dimensions: { ...item.dimensions, [key]: next } } : item) }))} /></Disclosure>
                    </div>
                  </div>
                </div>
              </section>
            })}
          </div>
        </div>
        <div hidden={section !== "news"} inert={section !== "news"}>
          {!newsState.value && <div className="config-stack">
            <p className="form-caption">{newsState.loading ? "正在读取新闻配置…" : newsState.error ? `新闻配置读取失败：${newsState.error}` : "新闻配置尚未就绪。"}</p>
            <ResourceFeedback resource={store.news} state={newsState} />
          </div>}
          {newsState.value && <div className="config-stack">
            <div className="setting-section-body">
              <Field label="联网搜索" caption="开启后，智能体可在需要时自行联网查新闻。"><Switch label="联网搜索" checked={newsState.value.configuration.enabled} onCheckedChange={(enabled) => void run(() => store.news.change((current) => ({ ...current, configuration: { ...current.configuration, enabled } })))} /></Field>
              <Field label="搜索来源" caption={newsProviders.find((item) => item.value === newsState.value?.configuration.provider)?.caption}><SettingsSelect label="搜索来源" value={newsState.value.configuration.provider} options={newsProviders} onValueChange={(provider) => void run(() => store.news.change((current) => ({ ...current, configuration: { ...current.configuration, provider: provider as NewsProvider } })))} /></Field>
              {(["tavily", "serper"] as NewsProvider[]).includes(newsState.value.configuration.provider) && <NewsCredentials key={newsState.value.configuration.provider} provider={newsState.value.configuration.provider} active={active && section === "news"} disabled={runtime.exiting} />}
              <Field label="使用代理" caption="默认直连，需要时再开。"><Switch label="使用新闻代理" checked={newsState.value.configuration.proxy_enabled} onCheckedChange={(proxy_enabled) => void run(() => store.news.change((current) => ({ ...current, configuration: { ...current.configuration, proxy_enabled } })))} /></Field>
              {newsState.value.configuration.proxy_enabled && <Field label="代理模式" caption={newsState.value.configuration.proxy_mode === "system" ? "使用系统设置，不用填端口。" : newsState.value.configuration.proxy_mode === "direct" ? "不走代理。" : "使用下面填写的地址。"}>
                <SettingsSelect label="新闻代理模式" value={newsState.value.configuration.proxy_mode} options={[{ value: "system", label: "跟随系统代理" }, { value: "direct", label: "直连" }, { value: "manual", label: "手动代理" }]} onValueChange={(proxy_mode) => void run(() => store.news.change((current) => ({ ...current, configuration: { ...current.configuration, proxy_mode: proxy_mode as NewsProxyMode } })))} />
              </Field>}
              {newsState.value.configuration.proxy_enabled && newsState.value.configuration.proxy_mode === "manual" && <Field label="手动代理地址" caption="填写本机 HTTP 代理地址和端口。"><EditableInput label="新闻本地代理" active={active && section === "news"} value={newsState.value.configuration.proxy_url} maxLength={200} placeholder="http://127.0.0.1:端口" normalize={(next) => next.trim()} onApply={(proxy_url) => run(() => store.news.change((current) => ({ ...current, configuration: { ...current.configuration, proxy_url } })))} /></Field>}
              <Field label="缓存时间（分钟）" caption="同一批新闻的复用时长，避免反复请求来源。"><NumberInput label="缓存时间（分钟）" value={newsState.value.configuration.refresh_minutes} min={5} max={720} onValueChange={(refresh_minutes) => void run(() => store.news.change((current) => ({ ...current, configuration: { ...current.configuration, refresh_minutes } })))} /></Field>
              <Field label="每次最多读取" caption="单次查新闻写入上下文的条数上限，最多 8 条。"><NumberInput label="每次最多读取" value={newsState.value.configuration.max_items} min={1} max={8} onValueChange={(max_items) => void run(() => store.news.change((current) => ({ ...current, configuration: { ...current.configuration, max_items } })))} /></Field>
              <Field label="来源测试" caption="只测连接，不调用模型。密钥来源可能消耗额度。">
                <div className="config-actions">
                  <Button variant="outline" size="sm" disabled={newsPreview.pending || newsState.status === "error"} onClick={() => void testNewsSource()}>{newsPreview.pending ? "正在读取…" : "测试来源"}</Button>
                </div>
                {newsPreview.key === newsConfigKey && newsPreview.error && <p className="form-caption" role="alert">{newsPreview.error}</p>}
              </Field>
              {visibleNewsPreview && <div className="news-preview-result" aria-live="polite">
                <p className="form-caption" role="status">{visibleNewsPreview.items.length ? `${newsLabel(visibleNewsPreview.provider)} · ${visibleNewsPreview.items.length} 条新闻` : "暂未读到新闻，请查看诊断。"}</p>
                {visibleNewsPreview.fetched_at && <p className="form-caption">{new Date(Number(visibleNewsPreview.fetched_at)).toLocaleString()}{visibleNewsPreview.stale ? " · 上次缓存，非实时" : " · 本次读取"}</p>}
                {visibleNewsPreview.provider !== newsState.value.configuration.provider && newsState.value.configuration.provider !== "auto" && <p className="form-caption">已换用免费来源。</p>}
                {!!visibleNewsPreview.items.length && <ol className="news-preview-list" aria-label="新闻测试结果">{visibleNewsPreview.items.map((item, index) => <li className="news-preview-item" key={`${item.url}-${index}`}>
                  <span className="news-preview-number" aria-hidden="true">{index + 1}</span>
                  <div className="news-preview-text">
                    <strong>{item.title}</strong>
                    <p className="form-caption">{item.source}{item.published ? ` · ${item.published}` : " · 日期未知"}</p>
                    {item.summary && <p className="form-caption">{item.summary}</p>}
                  </div>
                </li>)}</ol>}
                {!!visibleNewsPreview.diagnostics.length && <Disclosure title="来源诊断">{visibleNewsPreview.diagnostics.map((item) => <p className="form-caption" key={item.provider}>{newsLabel(item.provider)}：{item.message}</p>)}</Disclosure>}
              </div>}
            </div>
            <ResourceFeedback resource={store.news} state={newsState} />
          </div>}
        </div>
      </fieldset>}
      </div>
      <AppDialog
        open={deleteTarget !== null}
        onOpenChange={(open) => { if (!open) setDeleteTarget(null) }}
        title="删除预设"
        actions={[
          { label: "确认删除", variant: "destructive", onClick: remove },
          { label: "取消", variant: "ghost" },
        ]}
      >
        <p>{deleteTarget?.kind === "model" ? "删除这份模型预设？使用中的预设需先解除或更换成员的模型配置，否则无法删除。" : "删除这份人格预设？成员已经复制的独立人格配置不受影响。"}</p>
      </AppDialog>
      {operationError && state.status !== "error" && <p role="alert">{operationError}</p>}
      <ResourceFeedback resource={store.global} state={state} />
    </div>
  </section>
}
