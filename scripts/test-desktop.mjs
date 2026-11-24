import assert from "node:assert/strict"
import { spawn, spawnSync } from "node:child_process"
import { createWriteStream, existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs"
import net from "node:net"
import { createServer as createHttpServer } from "node:http"
import os from "node:os"
import path from "node:path"
import { fileURLToPath } from "node:url"
import { randomUUID } from "node:crypto"
import { setTimeout as delay } from "node:timers/promises"
import { DatabaseSync } from "node:sqlite"
import { chromium, expect } from "@playwright/test"
import { createServer } from "vite"

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..")
const useRealModel = process.argv.includes("--real-model") && !process.argv.includes("--local-model-only")
const defaultAgents = JSON.parse(readFileSync(path.join(root, "agent/agents.json"), "utf8")).agents
const runId = randomUUID().replaceAll("-", "").slice(0, 12)
const identifier = `app.sageroom.desktop.e2e.r${runId}`
const productName = `Sageroom 测试 ${runId}`
const output = path.join(root, ".test-results", `desktop-${runId}`)
mkdirSync(output, { recursive: true })
const report = { platform: `${os.platform()} ${os.release()}`, app_version: "0.1.0", build: "debug", identifier, cpu: os.cpus()[0]?.model, memory_bytes: os.totalmem(), tests: [], screenshots: [], page_errors: [], console_errors: [], limitations: ["其他 Windows 版本未验收", "真实中文输入法需人工走查；自动化只验证组合输入事件", "安装态通知、release 性能、24h 和完整备份恢复未验收"] }
const desktopTarget = path.join(root, ".test-results", "desktop-target")
const executable = path.join(desktopTarget, "debug", "sageroom.exe")
let server
let current
let builder
let modelServer
let realProfile
let debugPort

function passed(name, detail) {
  report.tests.push({ name, status: "Passed", ...(detail ? { detail } : {}) })
  console.log(`通过：${name}`)
}

function blocked(name, detail) {
  report.tests.push({ name, status: "Blocked", detail })
  console.log(`待实机确认：${name}`)
}

async function freePort() {
  const socket = net.createServer()
  await new Promise((resolve, reject) => { socket.once("error", reject); socket.listen(0, "127.0.0.1", resolve) })
  const port = socket.address().port
  await new Promise((resolve) => socket.close(resolve))
  return port
}

async function invoke(page, command, request) {
  return page.evaluate(({ command, request }) => window.__TAURI_INTERNALS__.invoke(command, { request }), { command, request })
}

function data(response) {
  assert.equal(response.schema_version, "0.3")
  assert.ok(!response.error, response.error?.message)
  return response.data
}

async function waitExit(child, timeout = 10_000) {
  if (child.exitCode !== null || child.signalCode !== null) return
  await new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error("测试应用未在截止时间内退出")), timeout)
    child.once("exit", () => { clearTimeout(timer); resolve() })
  })
}

function terminateOwnedProcess(child) {
  if (!child || child.exitCode !== null || child.signalCode !== null) return
  const result = spawnSync("taskkill.exe", ["/PID", String(child.pid), "/T", "/F"], { encoding: "utf8", windowsHide: true, timeout: 10_000 })
  if (result.status !== 0) child.kill()
}

class NativeAutomationUnavailable extends Error {}

function native(session, action, extra = []) {
  const result = spawnSync("powershell.exe", ["-NoProfile", "-NonInteractive", "-File", path.join(root, "scripts/desktop-window.ps1"), "-ProcessId", String(session.child.pid), "-Action", action, "-Tooltip", `${productName} 本地聊天室`, ...extra], { cwd: root, encoding: "utf8", timeout: 15_000, windowsHide: true })
  if (result.status !== 0) throw new NativeAutomationUnavailable((result.stderr || result.error?.message || "原生自动化不可用").trim())
  return JSON.parse(result.stdout.trim())
}

async function launch(index) {
  const port = debugPort
  const userData = path.join(output, `webview-${index}`)
  mkdirSync(userData, { recursive: true })
  const child = spawn(executable, [], { cwd: root, shell: false, env: { ...process.env, WEBVIEW2_ADDITIONAL_BROWSER_ARGUMENTS: `--remote-debugging-port=${port}`, WEBVIEW2_USER_DATA_FOLDER: userData } })
  const log = createWriteStream(path.join(output, `app-${index}.log`))
  child.stdout.pipe(log, { end: false })
  child.stderr.pipe(log, { end: false })
  child.on("exit", () => log.end())
  current = { child, port, browser: null, page: null }
  const deadline = Date.now() + 45_000
  while (true) {
    if (child.exitCode !== null) throw new Error(`桌面应用提前退出：${child.exitCode}`)
    try {
      const response = await fetch(`http://127.0.0.1:${port}/json/version`)
      if (response.ok) break
    } catch { /* WebView2 初始化尚未完成。 */ }
    if (Date.now() >= deadline) {
      const diagnostics = { index, port, process_id: child.pid, exit_code: child.exitCode }
      try { diagnostics.window = native(current, "status") } catch (cause) { diagnostics.window_error = cause.message }
      writeFileSync(path.join(output, `launch-${index}-failure.json`), JSON.stringify(diagnostics, null, 2))
      throw new Error("WebView2 CDP 初始化超时")
    }
    await delay(100)
  }
  const browser = await chromium.connectOverCDP(`http://127.0.0.1:${port}`)
  const page = browser.contexts()[0].pages()[0]
  current.browser = browser
  current.page = page
  page.on("pageerror", (error) => report.page_errors.push(error.message))
  page.on("console", (message) => { if (message.type() === "error") report.console_errors.push(message.text()) })
  await page.waitForFunction(() => Boolean(window.__TAURI_INTERNALS__), { timeout: 30_000 })
  const snapshot = data(await invoke(page, "app_get_snapshot", { data_generation_id: null, last_event_seq: null }))
  assert.ok(snapshot.data_directory.toLowerCase().includes(identifier), "拒绝向非隔离数据目录写入测试消息")
  await expect(page.getByRole("textbox", { name: "消息输入" })).toBeEnabled({ timeout: 30_000 })
  report.user_agent = await page.evaluate(() => navigator.userAgent)
  report.page_url = page.url()
  report.device_scale = await page.evaluate(() => window.devicePixelRatio)
  return { ...current, snapshot }
}

async function stop(session) {
  if (session.child.exitCode === null) {
    try { await invoke(session.page, "app_request_exit", { data_generation_id: null }) } catch { /* 应用可能已正常关闭页面。 */ }
    await waitExit(session.child)
  }
  await session.browser?.close().catch(() => {})
  current = null
}

async function screenshot(page, name) {
  const filename = `${name}.png`
  await page.evaluate(async () => {
    const animations = document.getAnimations().filter((animation) => animation.effect?.getComputedTiming().iterations !== Infinity)
    await Promise.all(animations.map((animation) => animation.finished.catch(() => {})))
    await new Promise(requestAnimationFrame)
    await new Promise(requestAnimationFrame)
  })
  const surfaceSelector = { "chat-search-filtered": ".chat-search-results", "chat-group-information": ".group-info-drawer", "settings-select-open": ".settings-select-content" }[name]
  if (surfaceSelector) {
    const styles = await page.locator(surfaceSelector).evaluate((surface) => {
      const ancestors = []
      for (let node = surface; node; node = node.parentElement) {
        const style = getComputedStyle(node)
        ancestors.push({ tag: node.tagName, class: node.className, backdrop_filter: style.backdropFilter, background: style.backgroundColor, opacity: style.opacity, filter: style.filter, contain: style.contain, isolation: style.isolation, clip_path: style.clipPath, mask_image: style.maskImage, mix_blend_mode: style.mixBlendMode, will_change: style.willChange, transform: style.transform, animation: style.animationName })
      }
      return { supported: CSS.supports("backdrop-filter", "blur(30px)"), ancestors }
    })
    report.surface_styles ??= {}
    report.surface_styles[name] = styles
    assert.match(styles.ancestors[0].backdrop_filter, /\bblur\(30px\)/, "原生浮层应实际应用共享背景滤镜，不能只有透明背景")
  }
  await page.screenshot({ path: path.join(output, filename) })
  report.screenshots.push(filename)
}

try {
  report.model_mode = useRealModel ? "explicit-real-connection" : "local-only"
  if (!useRealModel) report.limitations.push("真实付费端点未调用；模型验收仅使用本地确定性服务器")
  if (os.platform() !== "win32") throw new Error("此脚本仅覆盖 Windows WebView2")
  const config = JSON.parse(readFileSync(path.join(root, "src-tauri/tauri.e2e.conf.json"), "utf8"))
  config.identifier = identifier
  config.productName = productName
  config.build = { ...config.build, beforeBuildCommand: "node node_modules/typescript/bin/tsc -b && node node_modules/vite/bin/vite.js build" }
  debugPort = await freePort()
  config.app.windows[0].additionalBrowserArgs = `--remote-debugging-address=127.0.0.1 --remote-debugging-port=${debugPort}`
  const configFile = path.join(output, "tauri-test-config.json")
  writeFileSync(configFile, JSON.stringify(config))
  const buildLog = createWriteStream(path.join(output, "build.log"))
  builder = spawn(process.execPath, [path.join(root, "node_modules/@tauri-apps/cli/tauri.js"), "build", "--debug", "--no-bundle", "--config", configFile], { cwd: root, shell: false, env: { ...process.env, NODE_ENV: "production", CARGO_TARGET_DIR: desktopTarget, CARGO_BUILD_JOBS: process.env.CARGO_BUILD_JOBS ?? "2" } })
  builder.stdout.pipe(buildLog, { end: false })
  builder.stderr.pipe(buildLog, { end: false })
  await waitExit(builder, 1_200_000)
  buildLog.end()
  assert.equal(builder.exitCode, 0, "桌面构建失败，详见 build.log")
  assert.ok(readFileSync(executable).includes(Buffer.from(identifier)), "构建未包含隔离测试标识，不启动应用")
  passed("Tauri Windows debug 原生构建")
  server = await createServer({ configFile: path.join(root, "vite.config.ts"), root, server: { port: await freePort() } })
  await server.listen()
  assert.equal((await fetch(`http://127.0.0.1:${server.config.server.port}`)).status, 200)
  passed("Vite 开发服务器启动")

  const session = await launch(1)
  const { page, snapshot } = session
  assert.equal(snapshot.latest_message_seq, "0")
  assert.equal(snapshot.participants.length, 3)
  assert.equal(snapshot.participants.filter((member) => member.kind === "user").length, 1)
  assert.deepEqual(snapshot.participants.filter((member) => member.kind === "agent").map((member) => member.display_name).sort(), defaultAgents.map((agent) => agent.display_name).sort())
  for (const member of snapshot.participants.filter((member) => member.kind === "agent")) assert.equal(member.status, "needs_configuration")
  await expect(page.getByRole("region", { name: "聊天记录", exact: true })).toBeVisible()
  await expect(page.locator("[data-message-id]")).toHaveCount(0)
  passed("无凭据首启与两位内置成员未配置，无假聊天")
  const input = page.getByRole("textbox", { name: "消息输入" })
  await expect(page.getByRole("button", { name: "发送消息", exact: true })).toBeDisabled()
  await input.fill("   \n")
  await expect(page.getByRole("button", { name: "发送消息", exact: true })).toBeDisabled()
  await input.fill("输入法组合状态测试")
  await page.evaluate(() => {
    const input = document.querySelector("textarea")
    input.dispatchEvent(new CompositionEvent("compositionstart", { bubbles: true }))
    input.dispatchEvent(new KeyboardEvent("keydown", { key: "Enter", isComposing: true, bubbles: true, cancelable: true }))
  })
  await expect(input).toHaveValue("输入法组合状态测试")
  assert.equal(data(await invoke(page, "app_get_snapshot", { data_generation_id: null, last_event_seq: null })).latest_message_seq, "0")
  await page.evaluate(() => document.querySelector("textarea").dispatchEvent(new CompositionEvent("compositionend", { bubbles: true })))
  passed("空白禁发与合成 IME Enter 防误发")
  const firstText = "今天工作终于忙完，真实 SQLite 会保留这条消息。"
  await input.fill(firstText)
  await input.press("Enter")
  await expect(input).toHaveValue("")
  await expect(page.getByText(firstText, { exact: true })).toBeVisible()
  passed("真实 IPC 文本提交并显示")
  const nativeMenuPrevented = await page.evaluate(() => {
    const event = new MouseEvent("contextmenu", { bubbles: true, cancelable: true })
    document.querySelector("textarea").dispatchEvent(event)
    return event.defaultPrevented
  })
  assert.equal(nativeMenuPrevented, true)
  passed("软件内任何位置都不弹出浏览器自带右键菜单")
  await screenshot(page, "chat-light")
  const actionSource = data(await invoke(page, "chat_send", { data_generation_id: snapshot.data_generation_id, client_request_id: randomUUID(), parts: [{ kind: "text", text: "这条原文供引用和撤回验收" }], quote_message_id: null, mention_ids: [], mention_all: false }))
  const sourceRow = page.locator(`[data-message-id="${actionSource.message_id}"]`)
  const sourceBubble = sourceRow.locator(".chat-message-bubble")
  // 条目整行的空白处不弹出菜单，只有消息气泡本身响应右键。
  await sourceRow.click({ button: "right", position: { x: 2, y: 2 } })
  await expect(page.getByRole("menu")).toHaveCount(0)
  await sourceBubble.click({ button: "right" })
  await expect(sourceBubble).toHaveAttribute("aria-expanded", "true")
  await page.getByRole("menuitem", { name: "复制", exact: true }).click()
  await expect(sourceRow.getByText("已复制", { exact: true })).toHaveCount(0)
  await expect(sourceBubble).toHaveAttribute("aria-expanded", "false")
  await expect(sourceBubble).toBeFocused()
  await sourceBubble.press("Shift+F10")
  await expect(page.getByRole("menuitem", { name: "引用", exact: true })).toBeVisible()
  await page.keyboard.press("Escape")
  await expect(sourceBubble).toHaveAttribute("aria-expanded", "false")
  await expect(sourceBubble).toBeFocused()
  await sourceBubble.click({ button: "right" })
  await expect(page.getByRole("menuitem", { name: "引用", exact: true })).toBeVisible()
  await screenshot(page, "chat-message-menu")
  await page.getByRole("menuitem", { name: "引用", exact: true }).click()
  await expect(page.getByLabel("引用预览")).toContainText("这条原文供引用和撤回验收")
  await page.getByRole("button", { name: "提及成员", exact: true }).click()
  await page.getByRole("menuitemcheckbox", { name: defaultAgents[0].display_name, exact: true }).click()
  await page.keyboard.press("Escape")
  await input.fill("带引用和成员提及的消息")
  await screenshot(page, "chat-composer-context")
  await input.press("Enter")
  await expect(input).toHaveValue("")
  await expect(page.getByLabel("引用预览")).toHaveCount(0)
  const interactionPage = data(await invoke(page, "chat_list", { data_generation_id: snapshot.data_generation_id, before_seq: null, after_seq: null, around_seq: null, limit: 50 }))
  const quotedMessage = interactionPage.items.find((message) => message.parts.some((part) => part.kind === "text" && part.text === "带引用和成员提及的消息"))
  assert.equal(quotedMessage.quote_message_id, actionSource.message_id)
  assert.deepEqual(quotedMessage.mention_ids, [snapshot.participants.find((member) => member.display_name === defaultAgents[0].display_name).id])
  const quotedRow = page.locator(`[data-message-id="${quotedMessage.id}"]`)
  await quotedRow.getByRole("button", { name: /定位引用/ }).click()
  await expect(sourceRow).toBeVisible()
  await sourceBubble.click({ button: "right" })
  await page.getByRole("menuitem", { name: "撤回", exact: true }).click()
  await expect(sourceRow.locator('.chat-system-tag[data-kind="recall"]')).toContainText("撤回了一条消息")
  await expect(sourceRow.locator(".chat-message-avatar, .chat-message-bubble")).toHaveCount(0)
  const afterRecall = data(await invoke(page, "chat_list", { data_generation_id: snapshot.data_generation_id, before_seq: null, after_seq: null, around_seq: null, limit: 50 }))
  assert.deepEqual(afterRecall.items.map((message) => [message.id, message.seq]), interactionPage.items.map((message) => [message.id, message.seq]))
  assert.equal(afterRecall.items.find((message) => message.id === actionSource.message_id).state, "recalled")
  await expect(quotedRow.getByRole("button", { name: "原消息不可用" })).toBeVisible()
  await screenshot(page, "chat-recalled-quote")
  passed("真实消息菜单复制、引用、ID提及、原文定位与撤回后的引用失效")
  await input.fill("Shift 换行")
  await input.press("Shift+Enter")
  await expect(input).toHaveValue("Shift 换行\n")
  await input.fill("a".repeat(10_001))
  await expect(page.getByRole("button", { name: "发送消息", exact: true })).toBeDisabled()
  await input.fill(String.fromCodePoint(0x1f33f).repeat(9000))
  await expect(page.getByRole("button", { name: "发送消息", exact: true })).toBeDisabled()
  passed("Shift+Enter、Unicode 字符与 UTF-8 字节上限")

  const databaseFile = path.join(snapshot.data_directory, "chat.sqlite3")
  assert.ok(existsSync(databaseFile))
  const lock = new DatabaseSync(databaseFile, { allowExtension: false })
  lock.exec("BEGIN IMMEDIATE")
  const failedText = "数据库忙时也要保留这份草稿"
  try {
    await input.fill(failedText)
    await page.getByRole("button", { name: "发送消息", exact: true }).click()
    await expect(page.getByRole("button", { name: "重试发送", exact: true })).toBeEnabled()
    await expect(input).toHaveValue(failedText)
    await screenshot(page, "send-failed-draft")
  } finally { lock.exec("ROLLBACK"); lock.close() }
  await page.getByRole("button", { name: "重试发送", exact: true }).click()
  await expect(input).toHaveValue("")
  await expect(page.getByText(failedText, { exact: true })).toBeVisible()
  passed("真实 DB_BUSY 保留草稿与同请求重试")

  const unsafeText = '<img src=x onerror="window.__sageroomInjected=true"> %_ Café ＡＢＣ'
  await input.fill(unsafeText)
  await input.press("Enter")
  await expect(input).toHaveValue("")
  assert.equal(await page.locator("article img").count(), 0)
  assert.equal(await page.evaluate(() => window.__sageroomInjected), undefined)
  passed("HTML/SQL 特殊文本安全渲染")
  const generation = snapshot.data_generation_id
  const request = { data_generation_id: generation, client_request_id: randomUUID(), parts: [{ kind: "text", text: "重复请求只能出现一次" }], quote_message_id: null, mention_ids: [], mention_all: false }
  const sent = data(await invoke(page, "chat_send", request))
  assert.deepEqual(data(await invoke(page, "chat_send", request)), sent)
  assert.equal((await invoke(page, "chat_send", { ...request, parts: [{ kind: "text", text: "不同内容" }] })).error.code, "IDEMPOTENCY_CONFLICT")
  assert.equal((await invoke(page, "chat_send", { ...request, client_request_id: randomUUID(), sender_id: "forged-agent" })).error.code, "INVALID_INPUT")
  await assert.rejects(invoke(page, "secret_get", {}))
  passed("幂等、身份伪造与未注册 command 拒绝")

  await input.fill("导航切换后应保留的聊天草稿")
  await page.getByRole("button", { name: "智能体", exact: true }).click()
  await expect(page.getByRole("heading", { name: "全局配置", exact: true })).toBeVisible()
  await expect(page.getByRole("button", { name: "全局配置", exact: true })).toHaveAttribute("data-active", "true")
  await screenshot(page, "global-empty")
  await page.getByRole("button", { name: "添加大模型", exact: true }).click()
  await expect.poll(async () => data(await invoke(page, "global_configuration_get", { data_generation_id: generation })).model_profiles.length).toBe(1)
  const incompleteModel = data(await invoke(page, "global_configuration_get", { data_generation_id: generation })).model_profiles[0]
  assert.equal(incompleteModel.base_url, "")
  assert.equal(incompleteModel.model_name, "")
  await expect(page.getByRole("button", { name: "测试模型是否可用", exact: true })).toBeDisabled()
  await page.getByRole("region", { name: `模型预设 ${incompleteModel.name}`, exact: true }).getByRole("button", { name: "删除大模型", exact: true }).click()
  await page.getByRole("button", { name: "确认删除", exact: true }).click()
  await expect.poll(async () => data(await invoke(page, "global_configuration_get", { data_generation_id: generation })).model_profiles.length).toBe(0)
  passed("未配置模型预设创建与删除立即持久化，无保存按钮")
  await expect(page.getByRole("button", { name: "运行偏好", exact: true })).toHaveCount(0)
  await page.getByRole("button", { name: "人格预设", exact: true }).click()
  const personaPanel = page.getByRole("region", { name: "人格预设 自然成员", exact: true })
  const personaStyle = personaPanel.getByRole("textbox", { name: "语言风格", exact: true })
  const originalPersona = data(await invoke(page, "global_configuration_get", { data_generation_id: generation })).persona_presets.find((persona) => persona.id === "natural-member")
  await personaStyle.fill("取消这段编辑")
  await personaPanel.getByRole("button", { name: "撤销语言风格", exact: true }).click()
  await expect(personaStyle).toHaveValue(originalPersona.language_style)
  await personaStyle.fill("自然、克制，独立的人格预设")
  await personaPanel.getByRole("button", { name: "应用语言风格", exact: true }).click()
  await expect.poll(async () => data(await invoke(page, "global_configuration_get", { data_generation_id: generation })).persona_presets.find((persona) => persona.id === "natural-member").language_style).toBe("自然、克制，独立的人格预设")
  await expect(page.getByRole("button", { name: /保存|重新读取/ })).toHaveCount(0)
  const savedGlobal = data(await invoke(page, "global_configuration_get", { data_generation_id: generation }))
  assert.deepEqual(Object.keys(savedGlobal).sort(), ["model_profiles", "persona_presets", "revision"])
  assert.equal((await invoke(page, "global_configuration_save", { data_generation_id: generation, client_request_id: randomUUID(), expected_revision: savedGlobal.revision, model_profiles: [], persona_presets: savedGlobal.persona_presets, runtime_defaults: {} })).error.code, "INVALID_INPUT")
  await screenshot(page, "global-persona")
  passed("人格预设应用、取消与持久化，废弃全局字段被合同拒绝")
  const initialAgents = data(await invoke(page, "agent_list", { data_generation_id: generation }))
  for (const spec of defaultAgents) {
    const agent = initialAgents.find((agent) => agent.display_name === spec.display_name)
    assert.ok(agent)
    assert.deepEqual(agent.dimensions, spec.dimensions)
    assert.equal(agent.agent_type, "social")
    assert.ok(!Object.hasOwn(agent, "preferences") && !Object.hasOwn(agent, "introduction"))
  }
  const defaultAgent = defaultAgents[0]
  await page.getByRole("button", { name: new RegExp(`^${defaultAgent.display_name}`) }).click()
  const oldAgent = initialAgents.find((agent) => agent.display_name === defaultAgent.display_name)
  const editedAgent = async (targetPage = page, targetGeneration = generation) => data(await invoke(targetPage, "agent_list", { data_generation_id: targetGeneration })).find((agent) => agent.agent_id === oldAgent.agent_id)
  const agentPersonality = page.getByRole("region", { name: "人格与表达", exact: true })
  await agentPersonality.getByText("八个人格维度（0–100）", { exact: true }).click()
  const activityInput = agentPersonality.getByRole("spinbutton", { name: "活跃度", exact: true })
  await expect(activityInput).toHaveValue(String(defaultAgent.dimensions.activity))
  await activityInput.fill("101")
  await activityInput.press("Enter")
  await expect(page.getByRole("alert")).toHaveText("不能大于 100。")
  assert.equal((await editedAgent()).dimensions.activity, defaultAgent.dimensions.activity)
  await activityInput.fill("88")
  await activityInput.press("Enter")
  await expect.poll(async () => (await editedAgent()).dimensions.activity).toBe(88)
  await agentPersonality.getByText("越高越愿意参与话题、主动接话；不会强制回复或突破请求上限。", { exact: true }).scrollIntoViewIfNeeded()
  await screenshot(page, "agent-eight-dimensions")
  passed("内置成员八维默认值、活跃度越界拒绝与即时保存")
  await page.getByRole("textbox", { name: "名称", exact: true }).fill("小墨 · 本地配置")
  await page.getByRole("textbox", { name: "语言风格", exact: true }).fill("自然、克制，保留独立参数")
  await page.getByRole("button", { name: "应用语言风格", exact: true }).click()
  await expect.poll(async () => (await editedAgent()).language_style).toBe("自然、克制，保留独立参数")
  const savedAgent = await editedAgent()
  assert.equal(savedAgent.agent_id, oldAgent.agent_id)
  assert.equal(savedAgent.display_name, "小墨 · 本地配置")
  assert.equal(savedAgent.language_style, "自然、克制，保留独立参数")
  assert.equal((await invoke(page, "agent_save", { data_generation_id: generation, client_request_id: randomUUID(), expected_revision: savedAgent.revision, configuration: { ...savedAgent, preferences: {} } })).error.code, "INVALID_INPUT")
  await screenshot(page, "agent-editor")
  await page.getByRole("button", { name: "经历", exact: true }).click()
  const experienceInput = page.getByRole("textbox", { name: "经历内容", exact: true })
  await experienceInput.fill("值得保留的本地验收经历")
  await page.getByRole("spinbutton", { name: "经历重要度", exact: true }).fill("90")
  await page.getByRole("button", { name: "添加经历", exact: true }).click()
  await expect(experienceInput).toHaveValue("")
  await expect(page.getByRole("list", { name: "经历列表", exact: true })).toContainText("值得保留的本地验收经历")
  await experienceInput.fill("低重要度的本地验收经历")
  await page.getByRole("spinbutton", { name: "经历重要度", exact: true }).fill("10")
  await page.getByRole("button", { name: "添加经历", exact: true }).click()
  await expect(experienceInput).toHaveValue("")
  await page.getByRole("button", { name: "裁剪经历", exact: true }).click()
  await page.getByRole("spinbutton", { name: "保留条数", exact: true }).fill("1")
  await page.getByRole("button", { name: "确认裁剪", exact: true }).click()
  await expect(page.locator('[role="dialog"]')).toHaveCount(0)
  const experienceEntries = data(await invoke(page, "experience_list", { data_generation_id: generation, agent_id: oldAgent.agent_id }))
  assert.equal(experienceEntries.length, 1)
  assert.equal(experienceEntries[0].score, 90)
  await screenshot(page, "agent-experience")
  await page.getByRole("button", { name: "删除经历 值得保留的本地验收经历", exact: true }).click()
  await page.getByRole("button", { name: "确认删除经历", exact: true }).click()
  await expect(page.getByRole("dialog", { name: "删除经历", exact: true })).toHaveCount(0)
  await expect.poll(async () => data(await invoke(page, "experience_list", { data_generation_id: generation, agent_id: oldAgent.agent_id })).length).toBe(0)
  passed("真实经历添加、文件回读、高分裁剪与确认删除")
  await page.getByRole("button", { name: "聊天", exact: true }).click()
  await expect(input).toHaveValue("导航切换后应保留的聊天草稿")
  await input.fill("")
  passed("四导航中的聊天草稿保活、全局配置与独立成员保存")

  await page.getByRole("button", { name: "用户", exact: true }).click()
  const nickname = page.getByRole("textbox", { name: "昵称", exact: true })
  await expect(page.getByRole("textbox", { name: "简介", exact: true })).toHaveCount(0)
  await nickname.fill("取消这段编辑")
  await nickname.press("Escape")
  await expect(nickname).toHaveValue(snapshot.local_user.display_name)
  assert.equal(data(await invoke(page, "user_profile_get", { data_generation_id: generation })).display_name, snapshot.local_user.display_name)
  await nickname.fill("本地测试者")
  await nickname.press("Tab")
  await expect.poll(async () => data(await invoke(page, "user_profile_get", { data_generation_id: generation })).display_name).toBe("本地测试者")
  await page.getByRole("button", { name: "选择头像", exact: true }).click()
  try {
    native(session, "avatar-choose", ["-FilePath", path.join(root, "src-tauri/icons/icon.png")])
    await expect(page.getByRole("button", { name: "移除头像", exact: true })).toBeVisible()
    passed("原生 PNG 选择、受限规范化与头像卡片渲染")
  } catch (error) {
    if (!(error instanceof NativeAutomationUnavailable)) throw error
    native(session, "avatar-cancel")
    await expect(page.getByRole("button", { name: "选择头像", exact: true })).toBeEnabled()
    blocked("原生头像选择器自动化", error.message)
  }
  await expect(page.getByRole("button", { name: /保存|重新读取/ })).toHaveCount(0)
  const savedUser = data(await invoke(page, "user_profile_get", { data_generation_id: generation }))
  assert.equal(savedUser.participant_id, snapshot.local_user.id)
  assert.equal(savedUser.display_name, "本地测试者")
  const originalHistory = data(await invoke(page, "chat_list", { data_generation_id: generation, before_seq: null, after_seq: null, around_seq: null, limit: 50 }))
  assert.equal(originalHistory.items[0].sender_id, savedUser.participant_id)
  const currentProfile = data(await invoke(page, "app_get_snapshot", { data_generation_id: generation, last_event_seq: null })).participants.find((participant) => participant.id === originalHistory.items[0].sender_id)
  assert.equal(currentProfile.display_name, savedUser.display_name)
  assert.equal(currentProfile.avatar_id, savedUser.avatar_id)
  await screenshot(page, "user-profile")
  await page.getByRole("button", { name: "聊天", exact: true }).click()
  assert.deepEqual(Object.keys(savedUser).sort(), ["avatar_id", "display_name", "participant_id", "revision"])
  assert.equal((await invoke(page, "user_profile_save", { data_generation_id: generation, client_request_id: randomUUID(), expected_revision: savedUser.revision, display_name: savedUser.display_name, avatar_id: savedUser.avatar_id, introduction: "废弃字段" })).error.code, "INVALID_INPUT")
  passed("用户昵称保存与 Esc 取消、稳定身份、历史资料同步和废弃字段拒绝")

  if (useRealModel && existsSync(path.join(root, ".env"))) {
    await page.getByRole("button", { name: "智能体", exact: true }).click()
    await page.getByRole("button", { name: "全局配置", exact: true }).click()
    await page.getByRole("button", { name: "模型配置", exact: true }).click()
    await page.getByRole("button", { name: "导入开发环境大模型", exact: true }).click()
    await expect(page.getByRole("textbox", { name: "模型预设名称", exact: true })).toHaveValue("开发模型")
    await expect(page.getByRole("textbox", { name: "API Key", exact: true })).toHaveAttribute("placeholder", "已配置系统密钥")
    const configuredGlobal = data(await invoke(page, "global_configuration_get", { data_generation_id: generation }))
    assert.equal(configuredGlobal.model_profiles.length, 1)
    assert.equal(configuredGlobal.model_profiles[0].credential_configured, true)
    assert.equal(await page.locator('input[type="password"][aria-label="API Key"]').inputValue(), "")
    assert.ok(!JSON.stringify(configuredGlobal).includes("api_key"))
    await page.getByRole("button", { name: "测试模型是否可用", exact: true }).click()
    await expect(page.getByText(/连接可用/)).toBeVisible({ timeout: 20_000 })
    await screenshot(page, "global-model-connected")
    passed("后端安全导入临时模型、系统凭据保存与真实三方连接测试", { protocol: configuredGlobal.model_profiles[0].protocol })
    realProfile = configuredGlobal.model_profiles[0]
    await page.getByRole("button", { name: "人格预设", exact: true }).click()
    await screenshot(page, "global-persona")
    await page.getByRole("button", { name: "聊天", exact: true }).click()
  }

  await page.getByRole("button", { name: "群信息", exact: true }).click()
  await expect(page.getByRole("dialog", { name: "群信息", exact: true })).toBeVisible()
  await screenshot(page, "chat-group-information")
  await page.getByRole("button", { name: "关闭群信息" }).click()
  await page.getByRole("button", { name: "搜索聊天", exact: true }).click()
  await page.getByRole("searchbox", { name: "搜索聊天文本" }).fill("工作终于")
  await page.getByRole("button", { name: "开始搜索" }).click()
  await page.getByRole("combobox", { name: "搜索成员", exact: true }).click()
  await page.getByRole("option", { name: "本地测试者", exact: true }).click()
  const today = new Date()
  const dayLabel = `${today.getFullYear()}年${today.getMonth() + 1}月${today.getDate()}日`
  const startDateDialog = page.getByRole("dialog", { name: "搜索开始日期" })
  await page.getByRole("button", { name: "搜索开始日期", exact: true }).click()
  await startDateDialog.getByRole("button", { name: dayLabel, exact: true }).click()
  await startDateDialog.getByRole("button", { name: "确定", exact: true }).click()
  const endDateDialog = page.getByRole("dialog", { name: "搜索结束日期" })
  await page.getByRole("button", { name: "搜索结束日期", exact: true }).click()
  await endDateDialog.getByRole("button", { name: dayLabel, exact: true }).click()
  await endDateDialog.getByRole("button", { name: "确定", exact: true }).click()
  blocked("搜索结束日期重复选择当前时间", "已确认现有问题：结束日期为当前时间(null)时再次点击今天，筛选值未变但清空结果并设置pending，自动搜索不重启；日期过滤验收改用明确结束日期，不将该问题视为通过。")
  const result = page.getByRole("list", { name: "搜索结果" }).getByRole("button")
  await expect(result).toHaveCount(1)
  await screenshot(page, "chat-search-filtered")
  const searchSurface = await page.getByRole("complementary", { name: "搜索结果面板", exact: true }).evaluate((panel) => {
    const bounds = panel.getBoundingClientRect()
    return [0.2, 0.5, 0.8].flatMap((y) => [0.2, 0.5, 0.8].map((x) => {
      const hit = document.elementFromPoint(bounds.left + bounds.width * x, bounds.top + bounds.height * y)
      return { x, y, covered: hit !== null && panel.contains(hit), top: hit?.className ?? null }
    }))
  })
  report.search_surface = searchSurface
  assert.ok(searchSurface.every((point) => point.covered), "搜索浮层应覆盖底层消息，不被消息行叠到上方")
  await result.click()
  await expect(page.getByRole("searchbox", { name: "搜索聊天文本" })).toHaveCount(0)
  await expect(page.getByText(firstText, { exact: true })).toBeVisible()
  passed("实际中文搜索、片段与 around 定位")
  await page.getByRole("button", { name: "设置", exact: true }).click()
  await page.getByRole("combobox", { name: "主题", exact: true }).click()
  await screenshot(page, "settings-select-open")
  await page.getByRole("option", { name: "深色", exact: true }).click()
  await expect(page.locator("html")).toHaveClass(/dark/)
  await expect.poll(async () => data(await invoke(page, "app_get_snapshot", { data_generation_id: null, last_event_seq: null })).appearance.theme).toBe("dark")
  await page.getByRole("switch", { name: "减少动画", exact: true }).click()
  await expect(page.getByRole("switch", { name: "减少动画", exact: true })).toHaveAttribute("aria-checked", "true")
  await expect(page.locator("html")).toHaveAttribute("data-reduced-motion", "true")
  await expect(page.getByRole("button", { name: /保存|重新读取/ })).toHaveCount(0)
  await screenshot(page, "settings-appearance")
  await page.getByRole("button", { name: "关于与数据", exact: true }).click()
  await expect(page.getByText("MIT", { exact: true })).toBeVisible()
  const currentUsage = data(await invoke(page, "app_get_snapshot", { data_generation_id: generation, last_event_seq: null })).data_usage
  const avatarBytes = BigInt(currentUsage.avatar_bytes)
  const avatarUnit = avatarBytes < 1048576n ? 1024n : 1048576n
  const avatarUsageLabel = avatarBytes < 1024n ? `${avatarBytes} B` : `${avatarBytes / avatarUnit}.${avatarBytes % avatarUnit * 10n / avatarUnit} ${avatarUnit === 1024n ? "KiB" : "MiB"}`
  await expect(page.getByText(avatarUsageLabel, { exact: true })).toBeVisible()
  assert.equal(await page.locator(".surface-card").filter({ visible: true }).first().evaluate((element) => getComputedStyle(element).boxShadow), "none")
  await screenshot(page, "settings-about")
  await page.getByRole("button", { name: "聊天", exact: true }).click()
  await expect(page.getByText("重复请求只能出现一次", { exact: true })).toBeVisible()
  await screenshot(page, "chat-dark")
  passed("外观实际保存、深色与减少动画")

  try {
    const scale = report.device_scale
    const outer = native(session, "status")
    const inner = await page.evaluate(() => ({ width: innerWidth, height: innerHeight }))
    const frameWidth = outer.width - Math.round(inner.width * scale)
    const frameHeight = outer.height - Math.round(inner.height * scale)
    native(session, "resize", ["-Width", String(Math.round(924 * scale) + frameWidth), "-Height", String(Math.round(684 * scale) + frameHeight)])
    await expect.poll(() => page.evaluate(() => ({ width: innerWidth, height: innerHeight }))).toEqual({ width: 924, height: 684 })
    await expect.poll(() => page.evaluate(() => document.body.scrollWidth <= innerWidth)).toBe(true)
    await screenshot(page, "chat-minimum")
    native(session, "resize", ["-Width", String(Math.round(1164 * scale) + frameWidth), "-Height", String(Math.round(844 * scale) + frameHeight)])
    await expect.poll(() => page.evaluate(() => innerWidth)).toBe(1164)
    assert.equal(native(session, "hit-test", ["-X", String(Math.round(8 * scale)), "-Y", String(Math.round(300 * scale))]).hit_test, -1)
    assert.equal(native(session, "hit-test", ["-X", String(Math.round(50 * scale)), "-Y", String(Math.round(300 * scale))]).hit_test, 10)
    passed("Windows 最小窗口、透明边缘与原生缩放命中")
    await page.getByRole("button", { name: "最大化窗口", exact: true }).click()
    await expect(page.locator(".stage")).toHaveAttribute("data-maximized", "true")
    await expect.poll(() => native(session, "status").maximized).toBe(true)
    assert.equal(await page.locator(".canvas").evaluate((element) => getComputedStyle(element).borderRadius), "0px")
    assert.equal(await page.locator(".stage").evaluate((element) => getComputedStyle(element).paddingTop), "0px")
    await screenshot(page, "chat-maximized")
    await page.getByRole("button", { name: "还原窗口", exact: true }).click()
    await expect(page.locator(".stage")).toHaveAttribute("data-maximized", "false")
    native(session, "maximize")
    await expect(page.locator(".stage")).toHaveAttribute("data-maximized", "true")
    native(session, "restore")
    await expect(page.locator(".stage")).toHaveAttribute("data-maximized", "false")
    await screenshot(page, "chat-restored")
    await page.locator(".titlebar-identity").dblclick()
    await expect(page.locator(".stage")).toHaveAttribute("data-maximized", "true")
    await page.locator(".titlebar-identity").dblclick()
    await expect(page.locator(".stage")).toHaveAttribute("data-maximized", "false")
    passed("按钮、标题栏双击与系统最大化/还原、无圆角铺满与恢复")
    await page.evaluate(() => window.__TAURI_INTERNALS__.invoke("plugin:webview|set_webview_zoom", { label: "main", value: 2 }))
    await expect.poll(() => page.evaluate(() => innerWidth)).toBe(582)
    await expect(page.getByRole("textbox", { name: "消息输入" })).toBeVisible()
    await expect.poll(() => page.evaluate(() => document.body.scrollWidth <= innerWidth)).toBe(true)
    await screenshot(page, "chat-zoom-200")
    const zoomNativeFilename = "chat-zoom-200-native.png"
    native(session, "capture", ["-ImageFile", path.join(output, zoomNativeFilename)])
    report.screenshots.push(zoomNativeFilename)
    assert.equal(native(session, "hit-test", ["-X", String(Math.round(8 * scale)), "-Y", String(Math.round(300 * scale))]).hit_test, -1)
    assert.equal(native(session, "hit-test", ["-X", String(Math.round(50 * scale)), "-Y", String(Math.round(300 * scale))]).hit_test, 10)
    await page.evaluate(() => window.__TAURI_INTERNALS__.invoke("plugin:webview|set_webview_zoom", { label: "main", value: 1 }))
    await expect.poll(() => page.evaluate(() => innerWidth)).toBe(1164)
    passed("真实 WebView2 200% 缩放、可访问输入与原生边缘一致")
    await page.getByRole("button", { name: "关闭到托盘" }).click()
    await expect.poll(() => native(session, "status").visible).toBe(false)
    assert.equal(session.child.exitCode, null)
    passed("原生关闭隐藏、进程与后台数据仍存活")
    const second = spawn(executable, [], { cwd: root, shell: false, env: { ...process.env, WEBVIEW2_USER_DATA_FOLDER: path.join(output, "second-instance") } })
    try {
      await waitExit(second)
      assert.equal(second.exitCode, 0)
    } finally {
      if (second.exitCode === null) terminateOwnedProcess(second)
    }
    await expect.poll(() => native(session, "status").visible).toBe(true)
    passed("第二实例退出并激活原窗口")
    await page.getByRole("button", { name: "关闭到托盘" }).click()
    native(session, "tray-open")
    await expect.poll(() => native(session, "status").visible).toBe(true)
    passed("真实托盘图标点击还原窗口")
  } catch (error) {
    if (!(error instanceof NativeAutomationUnavailable)) throw error
    blocked("部分原生窗口/托盘自动化", error.message)
    try { native(session, "show") } catch { /* 保留已完成 WebView2 证据。 */ }
  }

  const beforeRestart = data(await invoke(page, "chat_list", { data_generation_id: generation, before_seq: null, after_seq: null, around_seq: null, limit: 50 }))
  const globalBeforeRestart = data(await invoke(page, "global_configuration_get", { data_generation_id: generation }))
  await page.getByRole("button", { name: "用户", exact: true }).click()
  const exitLock = new DatabaseSync(databaseFile, { allowExtension: false })
  exitLock.exec("BEGIN IMMEDIATE")
  try {
    await page.getByRole("textbox", { name: "昵称", exact: true }).fill("本地测试者 · 退出前应用")
    await page.getByRole("textbox", { name: "昵称", exact: true }).press("Tab")
    const requestedExit = data(await invoke(page, "app_request_exit", { data_generation_id: generation }))
    assert.equal(requestedExit.shutting_down, false)
    await expect(page.getByText("正在完成已应用修改并退出…", { exact: true })).toBeVisible()
    assert.equal(session.child.exitCode, null)
  } finally { exitLock.exec("ROLLBACK"); exitLock.close() }
  await stop(session)
  passed("退出准备等待已应用写入完成，再关闭数据库工作线程")
  const reopened = await launch(2)
  assert.notEqual(reopened.snapshot.data_generation_id, generation)
  assert.equal(reopened.snapshot.local_user.id, snapshot.local_user.id)
  assert.equal(reopened.snapshot.appearance.theme, "dark")
  assert.equal(reopened.snapshot.local_user.display_name, "本地测试者 · 退出前应用")
  const reopenedGlobal = data(await invoke(reopened.page, "global_configuration_get", { data_generation_id: reopened.snapshot.data_generation_id }))
  assert.deepEqual(reopenedGlobal, globalBeforeRestart)
  const reopenedAgent = await editedAgent(reopened.page, reopened.snapshot.data_generation_id)
  assert.equal(reopenedAgent.display_name, "小墨 · 本地配置")
  assert.equal(reopenedAgent.dimensions.activity, 88)
  const afterRestart = data(await invoke(reopened.page, "chat_list", { data_generation_id: reopened.snapshot.data_generation_id, before_seq: null, after_seq: null, around_seq: null, limit: 50 }))
  assert.deepEqual(afterRestart.items.map((message) => message.id), beforeRestart.items.map((message) => message.id))
  assert.equal((await invoke(reopened.page, "chat_send", { ...request, data_generation_id: generation })).error.code, "DATA_GENERATION_CHANGED")
  await expect(reopened.page.getByText(firstText, { exact: true })).toBeVisible()
  await expect(reopened.page.getByText("重复请求只能出现一次", { exact: true })).toBeVisible()
  await screenshot(reopened.page, "chat-restarted")
  passed("重启历史、身份、外观持久化与旧世代拒绝")

  let running = reopened
  const hits = []
  const alphaId = randomUUID()
  const betaId = randomUUID()
  const syntheticKey = "synthetic-desktop-model-key-not-a-real-secret"
  const emptyDecision = () => ({ participation: "observe", messages: [], recalls: [], tool_requests: [], group_patch: null, announcement: null, profile_patch: null, wake_plan: null, topic_hint: null, extra_data: { message_annotations: [], memory_candidates: [] }, experience: null })
  const longReply = "这是一条用于验证实际中文打字时间的本地测试消息，模型会立即完成输出，但正文应当经过完整的打字等待后再发送，不能一看到新消息就显示正在输入，也不能在生成完之后瞬间刷出整段文字。"
  const waitingReply = "这是一条已完成生成但应在新消息出现时立即取消的旧候选消息。它保留足够长的正文，用来核对正在输入期间是否仍能及时接收新消息，而不是等待旧回复完整打完再处理。"
  let heldAlphaResponse
  function holdAlphaResponse(trigger) {
    let release
    const gate = new Promise((resolve) => { release = resolve })
    const held = { trigger, gate, release, received: false, respondedAt: null }
    heldAlphaResponse = held
    return held
  }
  function fixtureDecision(model, context) {
    const decision = emptyDecision()
    if (context.opportunity === "initialized") return decision
    const messages = context.recent_messages ?? []
    const userIds = new Set(context.participants.filter((member) => member.kind === "user").map((member) => member.id))
    const latestUser = messages.findLast((message) => userIds.has(message.sender_id))
    const text = (message) => message?.parts.filter((part) => part.kind === "text").map((part) => part.text).join("") ?? ""
    const ownId = model === "alpha" ? alphaId : betaId
    const alreadySent = (body, since) => messages.some((message) => message.sender_id === ownId && BigInt(message.seq) > BigInt(since.seq) && text(message) === body)
    let reply
    let sendAfter = 0
    if (model === "alpha" && context.opportunity === "new_message" && text(latestUser) === "运行器计划测试") decision.wake_plan = { after_seconds: 300, reason_code: "check_later", review_message_ordinal: null }
    if (model === "alpha" && text(latestUser) === "运行器输入状态测试" && !alreadySent(longReply, latestUser)) reply = longReply
    if (model === "alpha" && text(latestUser) === "运行器待发竞争测试") reply = waitingReply
    if (model === "alpha" && text(latestUser) === "运行器待发竞争新消息" && !alreadySent("待发竞争已恢复", latestUser)) reply = "待发竞争已恢复"
    if (model === "alpha" && text(latestUser) === "运行器过时竞争测试") reply = "旧候选不得发送"
    if (model === "alpha" && text(latestUser) === "运行器竞争新消息" && !alreadySent("新消息重新判断完成", latestUser)) reply = "新消息重新判断完成"
    if (model === "alpha" && text(latestUser) === "运行器互聊测试" && !alreadySent("本地成员甲收到了", latestUser)) reply = "本地成员甲收到了"
    if (model === "beta" && text(latestUser) === "运行器互聊测试") {
      const alphaReply = messages.findLast((message) => message.sender_id === alphaId && BigInt(message.seq) > BigInt(latestUser.seq) && text(message) === "本地成员甲收到了")
      if (alphaReply && !alreadySent("本地成员乙接上了", alphaReply)) reply = "本地成员乙接上了"
    }
    if (model === "alpha" && text(latestUser) === "运行器延迟暂停测试") { reply = "暂停后不得发送"; sendAfter = 2000 }
    if (model === "alpha" && text(latestUser) === "运行器后台测试" && !alreadySent("后台仍在处理", latestUser)) reply = "后台仍在处理"
    if (model === "alpha" && text(latestUser) === "运行器新消息恢复测试" && !alreadySent("临时故障后已恢复", latestUser)) reply = "临时故障后已恢复"
    if (model === "alpha" && context.opportunity === "planned_wake") reply = "持久计划到期回复"
    if (reply) {
      decision.participation = "speak"
      decision.messages = [{ parts: [{ kind: "text", text: reply }], quote_message_id: null, mention_ids: reply === "本地成员甲收到了" ? [betaId] : reply === "本地成员乙接上了" ? [alphaId] : [], mention_all: false, send_after_ms: sendAfter }]
    }
    return decision
  }
  let failNextAlpha = false
  let connectionTests = 0
  modelServer = createHttpServer(async (request, response) => {
    try {
      assert.equal(request.method, "POST")
      assert.equal(request.url, "/v1/chat/completions")
      assert.equal(request.headers.authorization === `Bearer ${syntheticKey}`, true)
      const chunks = []
      let bytes = 0
      for await (const chunk of request) {
        bytes += chunk.length
        assert.ok(bytes <= 128 * 1024, "本地模型请求超过测试上限")
        chunks.push(chunk)
      }
      const body = JSON.parse(Buffer.concat(chunks).toString("utf8"))
      assert.ok(["alpha", "beta"].includes(body.model))
      const prompt = body.messages.findLast((message) => message.role === "user").content
      if (!body.messages.some((message) => message.role === "system")) {
        connectionTests += 1
        response.writeHead(200, { "Content-Type": "application/json" })
        response.end(JSON.stringify({ model: body.model, choices: [{ message: { role: "assistant", content: "连接测试通过" }, finish_reason: "stop" }], usage: { prompt_tokens: 10, completion_tokens: 5, total_tokens: 15 } }))
        return
      }
      const context = JSON.parse(prompt.split("\n")[0])
      const latest = context.recent_messages?.at(-1)
      const latestText = latest?.parts.filter((part) => part.kind === "text").map((part) => part.text).join("") ?? ""
      const hit = { model: body.model, opportunity: context.opportunity, message_seq: latest?.seq, received_at: Date.now() }
      hits.push(hit)
      const held = body.model === "alpha" && heldAlphaResponse?.trigger === latestText ? heldAlphaResponse : null
      if (held) {
        held.received = true
        await held.gate
        held.respondedAt = Date.now()
        if (heldAlphaResponse === held) heldAlphaResponse = null
      }
      if (body.model === "alpha" && failNextAlpha) {
        failNextAlpha = false
        response.writeHead(503, { "Content-Type": "application/json" })
        response.end(JSON.stringify({ error: { message: "临时不可用" } }))
        return
      }
      const content = JSON.stringify(fixtureDecision(body.model, context))
      response.writeHead(200, { "Content-Type": "application/json" })
      response.end(JSON.stringify({ model: body.model, choices: [{ message: { role: "assistant", content }, finish_reason: "stop" }], usage: { prompt_tokens: 10, completion_tokens: 10, total_tokens: 20 } }))
    } catch {
      response.writeHead(500, { "Content-Type": "application/json" })
      response.end(JSON.stringify({ error: { message: "本地确定性模型请求格式不符合验收协议。" } }))
    }
  })
  await new Promise((resolve, reject) => { modelServer.once("error", reject); modelServer.listen(0, "127.0.0.1", resolve) })
  const runtimeGeneration = () => running.snapshot.data_generation_id
  const observedRuntimeStates = []
  async function runtimeSnapshot() {
    const snapshot = data(await invoke(running.page, "app_get_snapshot", { data_generation_id: runtimeGeneration(), last_event_seq: null }))
    observedRuntimeStates.push(...snapshot.participants.filter((member) => member.runtime).map((member) => ({ id: member.id, status: member.runtime.status })))
    return snapshot
  }
  async function runtimeMessages() { return data(await invoke(running.page, "chat_list", { data_generation_id: runtimeGeneration(), before_seq: null, after_seq: null, around_seq: null, limit: 200 })).items }
  async function runtimeControl(agentId, paused) { return data(await invoke(running.page, "agent_runtime_control", { data_generation_id: runtimeGeneration(), agent_id: agentId, paused })) }
  async function waitRuntime(agentId, status, timeout = 20_000) {
    let state
    try {
      await expect.poll(async () => {
        state = (await runtimeSnapshot()).participants.find((member) => member.id === agentId)?.runtime
        if (state?.status === "offline" && state.detail) throw new Error(state.detail)
        return state?.status
      }, { timeout }).toBe(status)
    } catch (error) {
      if (state?.detail) throw new Error(`智能体状态 ${state.status}：${state.detail}`, { cause: error })
      throw error
    }
  }
  async function waitReply(body, agentId, timeout = 20_000) {
    await expect.poll(async () => (await runtimeMessages()).filter((message) => message.sender_id === agentId && message.parts.some((part) => part.kind === "text" && part.text.includes(body))).length, { timeout }).toBe(1)
    const message = (await runtimeMessages()).find((message) => message.sender_id === agentId && message.parts.some((part) => part.kind === "text" && part.text.includes(body)))
    const participant = (await runtimeSnapshot()).participants.find((member) => member.id === message.sender_id)
    assert.equal(participant.kind, "agent")
    await expect(running.page.getByText(body, { exact: false }).first()).toBeVisible({ timeout })
  }
  const runtimeRequest = (text, mentionIds = [alphaId]) => ({ data_generation_id: runtimeGeneration(), client_request_id: randomUUID(), parts: [{ kind: "text", text }], quote_message_id: null, mention_ids: mentionIds, mention_all: false })
  const profileInput = ({ id, name, protocol, base_url, model_name }) => ({ id, name, protocol, base_url, model_name })
  const existingAgents = data(await invoke(running.page, "agent_list", { data_generation_id: runtimeGeneration() }))
  for (const agent of existingAgents) await runtimeControl(agent.agent_id, true)
  const beforeLocal = data(await invoke(running.page, "global_configuration_get", { data_generation_id: runtimeGeneration() }))
  const localId = randomUUID()
  const localProfile = { id: localId, name: "本地确定性验收模型", protocol: "openai_chat_completions", base_url: `http://127.0.0.1:${modelServer.address().port}/v1`, model_name: "alpha" }
  assert.equal((await invoke(running.page, "global_configuration_save", { data_generation_id: runtimeGeneration(), client_request_id: randomUUID(), expected_revision: beforeLocal.revision, model_profiles: [{ ...localProfile, parameters: {} }], persona_presets: beforeLocal.persona_presets })).error.code, "INVALID_INPUT")
  const withLocal = data(await invoke(running.page, "global_configuration_save", { data_generation_id: runtimeGeneration(), client_request_id: randomUUID(), expected_revision: beforeLocal.revision, model_profiles: [...beforeLocal.model_profiles.map(profileInput), localProfile], persona_presets: beforeLocal.persona_presets }))
  const savedLocal = withLocal.model_profiles.find((profile) => profile.id === localId)
  data(await invoke(running.page, "secret_set", { data_generation_id: runtimeGeneration(), profile_id: localId, expected_revision: savedLocal.revision, api_key: syntheticKey }))
  const configuredLocal = data(await invoke(running.page, "global_configuration_get", { data_generation_id: runtimeGeneration() })).model_profiles.find((profile) => profile.id === localId)
  await running.page.getByRole("button", { name: "智能体", exact: true }).click()
  await running.page.getByRole("button", { name: "全局配置", exact: true }).click()
  await running.page.getByRole("button", { name: "模型配置", exact: true }).click()
  const localModelPanel = running.page.getByRole("region", { name: "模型预设 本地确定性验收模型", exact: true })
  await localModelPanel.getByRole("button", { name: "测试模型是否可用", exact: true }).click()
  await expect(localModelPanel.getByText(/连接可用/)).toBeVisible({ timeout: 20_000 })
  assert.equal(connectionTests, 1)
  assert.equal(hits.length, 0)
  await screenshot(running.page, "local-model-connection")
  await running.page.getByRole("button", { name: "聊天", exact: true }).click()
  passed("本地模型测试连接成功，独立请求归属不要求智能体身份")
  async function createRuntimeAgent(id, name, profile, modelName) {
    return data(await invoke(running.page, "agent_save", { data_generation_id: runtimeGeneration(), client_request_id: randomUUID(), expected_revision: null, configuration: { ...existingAgents[0], agent_id: id, revision: "0", display_name: name, avatar_id: null, agent_type: "social", model: { source_profile_id: profile.id, source_profile_revision: profile.revision, profile: { ...profileInput(profile), model_name: modelName } } } }))
  }
  await createRuntimeAgent(alphaId, "本地成员甲", configuredLocal, "alpha")
  await createRuntimeAgent(betaId, "本地成员乙", configuredLocal, "beta")
  await running.page.reload()
  await expect(running.page.getByRole("textbox", { name: "消息输入" })).toBeEnabled({ timeout: 30_000 })
  await waitRuntime(alphaId, "observing")
  await waitRuntime(betaId, "observing")
  assert.equal(hits.filter((hit) => hit.opportunity === "initialized").length, 0, "已有历史时初始化不能重新回答旧消息或调用模型")
  await runtimeControl(betaId, true)
  await waitRuntime(betaId, "paused")
  const initialCalls = hits.length
  for (let index = 0; index < 3; index += 1) await runtimeSnapshot()
  assert.equal(hits.length, initialCalls, "状态事件和快照查询不能触发模型调用")
  passed("已有历史的社交成员初始化只恢复观察，不重播旧回复、不调用模型")
  data(await invoke(running.page, "chat_send", runtimeRequest("运行器计划测试")))
  await expect.poll(async () => (await runtimeSnapshot()).participants.find((member) => member.id === alphaId)?.runtime.next_wake_at, { timeout: 20_000 }).toBeGreaterThan(Date.now())
  await waitRuntime(alphaId, "observing")
  const startupCalls = hits.length
  assert.equal(hits.filter((hit) => hit.model === "alpha").length, 1)
  passed("明确提及触发一次观察判断，模型自主计划持久化，无状态事件调用循环")

  const startupWakeAt = (await runtimeSnapshot()).participants.find((member) => member.id === alphaId).runtime.next_wake_at
  const unrelatedGlobal = data(await invoke(running.page, "global_configuration_get", { data_generation_id: runtimeGeneration() }))
  const unrelatedPersonas = unrelatedGlobal.persona_presets.map((persona) => persona.id === "natural-member" ? { ...persona, name: "自然成员 · 本地预设" } : persona)
  const unrelatedSaved = data(await invoke(running.page, "global_configuration_save", { data_generation_id: runtimeGeneration(), client_request_id: randomUUID(), expected_revision: unrelatedGlobal.revision, model_profiles: unrelatedGlobal.model_profiles.map(profileInput), persona_presets: unrelatedPersonas }))
  assert.equal(unrelatedSaved.persona_presets.find((persona) => persona.id === "natural-member").name, "自然成员 · 本地预设")
  await delay(1500)
  assert.equal(hits.length, startupCalls, "无关人格预设保存不能重启成员或增加模型调用")
  assert.equal((await runtimeSnapshot()).participants.find((member) => member.id === alphaId).runtime.next_wake_at, startupWakeAt, "无关全局配置保存必须保留现有唤醒计划")
  passed("无关人格预设保存不增加调用且保留成员既有计划")

  const typingHold = holdAlphaResponse("运行器输入状态测试")
  data(await invoke(running.page, "chat_send", runtimeRequest("运行器输入状态测试")))
  await expect(running.page.locator(".chat-heading")).not.toContainText("正在输入")
  await expect.poll(() => typingHold.received, { timeout: 20_000 }).toBe(true)
  await waitRuntime(alphaId, "deciding")
  await expect(running.page.locator(".chat-heading")).not.toContainText("正在输入")
  await screenshot(running.page, "runtime-deciding-no-typing")
  typingHold.release()
  await waitRuntime(alphaId, "waiting_to_send")
  await expect(running.page.locator(".chat-heading")).toContainText("本地成员甲正在输入")
  assert.ok(!(await runtimeMessages()).some((message) => message.parts.some((part) => part.kind === "text" && part.text === longReply)))
  await screenshot(running.page, "runtime-typing-delay")
  await waitReply(longReply, alphaId, 45_000)
  await waitRuntime(alphaId, "observing")
  await expect(running.page.locator(".chat-heading")).not.toContainText("正在输入")
  const timedReply = (await runtimeMessages()).find((message) => message.sender_id === alphaId && message.parts.some((part) => part.kind === "text" && part.text === longReply))
  const typingElapsed = timedReply.created_at - typingHold.respondedAt
  assert.ok(typingElapsed >= [...longReply].length * 180, "长消息必须在模型完成后留出按中文长度计算的实际打字时间")
  passed("模型判断不显示输入，确定发言才显示输入，长消息经过实际打字等待", { characters: [...longReply].length, elapsed_ms: typingElapsed })

  const competitionHold = holdAlphaResponse("运行器过时竞争测试")
  const callsBeforeCompetition = hits.filter((hit) => hit.model === "alpha").length
  data(await invoke(running.page, "chat_send", runtimeRequest("运行器过时竞争测试")))
  await expect.poll(() => competitionHold.received, { timeout: 20_000 }).toBe(true)
  await waitRuntime(alphaId, "deciding")
  data(await invoke(running.page, "chat_send", runtimeRequest("运行器竞争新消息")))
  competitionHold.release()
  await waitReply("新消息重新判断完成", alphaId)
  await waitRuntime(alphaId, "observing")
  assert.ok(!(await runtimeMessages()).some((message) => message.sender_id === alphaId && message.parts.some((part) => part.kind === "text" && part.text === "旧候选不得发送")), "过时候选不能发送")
  assert.equal(hits.filter((hit) => hit.model === "alpha").length, callsBeforeCompetition + 2, "新消息竞争应合并机会，不进行额外连续重试")
  assert.ok(!observedRuntimeStates.some((state) => state.id === alphaId && state.status === "protected"), "观察竞争不能将成员标记为保护状态")
  await screenshot(running.page, "runtime-conflict-recovered")
  passed("生成期间收到新消息会丢弃旧候选并恢复观察，不误报保护、不重复发送")

  const callsBeforeWaitingCompetition = hits.filter((hit) => hit.model === "alpha").length
  data(await invoke(running.page, "chat_send", runtimeRequest("运行器待发竞争测试")))
  await waitRuntime(alphaId, "waiting_to_send")
  await expect(running.page.locator(".chat-heading")).toContainText("本地成员甲正在输入")
  const waitingCompetitionAt = Date.now()
  data(await invoke(running.page, "chat_send", runtimeRequest("运行器待发竞争新消息")))
  await waitReply("待发竞争已恢复", alphaId, 12_000)
  await waitRuntime(alphaId, "observing")
  const waitingRecovery = (await runtimeMessages()).find((message) => message.sender_id === alphaId && message.parts.some((part) => part.kind === "text" && part.text === "待发竞争已恢复"))
  assert.ok(waitingRecovery.created_at - waitingCompetitionAt < [...waitingReply].length * 180, "新消息应及时取消旧打字候选，不等待旧正文打完")
  assert.ok(!(await runtimeMessages()).some((message) => message.sender_id === alphaId && message.parts.some((part) => part.kind === "text" && part.text === waitingReply)))
  assert.equal(hits.filter((hit) => hit.model === "alpha").length, callsBeforeWaitingCompetition + 3, "长候选先经历一次本地风格精简，再在新消息到达时及时取消")
  assert.ok(!observedRuntimeStates.some((state) => state.id === alphaId && state.status === "protected"))
  await screenshot(running.page, "runtime-waiting-conflict-recovered")
  passed("正在输入时新消息及时取消旧长候选，不等待旧打字截止、不误报保护", { recovery_ms: waitingRecovery.created_at - waitingCompetitionAt })

  failNextAlpha = true
  data(await invoke(running.page, "chat_send", runtimeRequest("运行器临时故障测试")))
  await expect.poll(async () => (await runtimeSnapshot()).participants.find((member) => member.id === alphaId)?.runtime.status).toBe("offline")
  await running.page.getByRole("button", { name: "智能体", exact: true }).click()
  await running.page.getByRole("button", { name: /^本地成员甲/ }).click()
  await expect(running.page.getByRole("button", { name: "重试启动", exact: true })).toBeEnabled()
  await expect(running.page.getByRole("button", { name: "暂停运行", exact: true })).toHaveCount(0)
  const failedCalls = hits.filter((hit) => hit.model === "alpha").length
  for (let index = 0; index < 3; index += 1) await runtimeSnapshot()
  assert.equal(hits.filter((hit) => hit.model === "alpha").length, failedCalls)
  await screenshot(running.page, "runtime-transient-offline")
  await running.page.getByRole("button", { name: "聊天", exact: true }).click()
  data(await invoke(running.page, "chat_send", runtimeRequest("运行器新消息恢复测试")))
  await waitReply("临时故障后已恢复", alphaId, 45_000)
  await waitRuntime(alphaId, "observing")
  assert.equal(hits.filter((hit) => hit.model === "alpha").length, failedCalls + 1)
  assert.equal(hits.filter((hit) => hit.model === "alpha").at(-1).opportunity, "new_message")
  passed("临时模型故障显示重试而非暂停，新消息自动恢复且只新增一次请求")

  await runtimeControl(betaId, false)
  await waitRuntime(betaId, "observing")
  const alphaBeforeMutual = hits.filter((hit) => hit.model === "alpha").length
  const mutualRequest = runtimeRequest("运行器互聊测试")
  const mutualResult = data(await invoke(running.page, "chat_send", mutualRequest))
  await waitReply("本地成员甲收到了", alphaId)
  await waitReply("本地成员乙接上了", betaId)
  await expect.poll(() => hits.filter((hit) => hit.model === "alpha").length, { timeout: 20_000 }).toBe(alphaBeforeMutual + 2)
  await waitRuntime(alphaId, "observing")
  await waitRuntime(betaId, "observing")
  const mutualCalls = hits.length
  assert.deepEqual(data(await invoke(running.page, "chat_send", mutualRequest)), mutualResult)
  for (let index = 0; index < 3; index += 1) await runtimeSnapshot()
  await delay(2000)
  assert.equal(hits.length, mutualCalls, "幂等重放、自回复或状态事件不能增加模型调用")
  await screenshot(running.page, "runtime-mutual-replies")
  passed("双成员按真人消息与同伴回复自主接话，真实成员身份落库并显示，无自回复和幂等重复调用")

  const runtimeInput = running.page.getByRole("textbox", { name: "消息输入" })
  await running.page.getByRole("button", { name: "提及成员", exact: true }).click()
  await running.page.getByRole("menuitemcheckbox", { name: "本地成员甲", exact: true }).click()
  await running.page.keyboard.press("Escape")
  await runtimeInput.fill("运行器延迟暂停测试")
  await runtimeInput.press("Enter")
  await waitRuntime(alphaId, "waiting_to_send")
  await runtimeControl(alphaId, true)
  await waitRuntime(alphaId, "paused")
  await delay(2500)
  assert.ok(!(await runtimeMessages()).some((message) => message.parts.some((part) => part.kind === "text" && part.text === "暂停后不得发送")))
  const pausedAlphaCalls = hits.filter((hit) => hit.model === "alpha").length
  data(await invoke(running.page, "chat_send", runtimeRequest("暂停期间测试")))
  await waitRuntime(betaId, "observing")
  await delay(1500)
  assert.equal(hits.filter((hit) => hit.model === "alpha").length, pausedAlphaCalls)
  await runtimeControl(alphaId, false)
  await waitRuntime(alphaId, "observing")
  assert.equal(hits.filter((hit) => hit.model === "alpha").length, pausedAlphaCalls, "有历史时恢复只恢复观察，不重新初始化调用模型")
  passed("待发分条暂停即取消、暂停期间不调用模型，恢复不重播历史或追加模型请求")

  try {
    native(running, "status")
    await running.page.getByRole("button", { name: "关闭到托盘", exact: true }).click()
    await expect.poll(() => native(running, "status").visible).toBe(false)
    data(await invoke(running.page, "chat_send", runtimeRequest("运行器后台测试")))
    await expect.poll(async () => (await runtimeMessages()).some((message) => message.sender_id === alphaId && message.parts.some((part) => part.kind === "text" && part.text === "后台仍在处理")), { timeout: 20_000 }).toBe(true)
    assert.equal(native(running, "status").visible, false)
    native(running, "show")
    await waitReply("后台仍在处理", alphaId)
    passed("隐藏窗口时自主运行器继续处理真实 IPC 消息并提交成员回复")
  } catch (error) {
    if (!(error instanceof NativeAutomationUnavailable)) throw error
    blocked("自主运行器隐藏窗口验证", error.message)
    try { native(running, "show") } catch { /* WebView2 路径保留。 */ }
  }
  await runtimeControl(alphaId, true)
  await runtimeControl(betaId, true)
  await waitRuntime(alphaId, "paused")
  await waitRuntime(betaId, "paused")
  const pausedCalls = hits.length
  await stop(running)
  running = await launch(3)
  await waitRuntime(alphaId, "paused")
  await waitRuntime(betaId, "paused")
  await delay(1500)
  assert.equal(hits.length, pausedCalls, "暂停成员重启后不能调用模型")
  passed("暂停持久化，退出及重启不补发旧候选或额外调用模型")

  const alphaBeforeResume = hits.filter((hit) => hit.model === "alpha").length
  await runtimeControl(alphaId, false)
  await waitRuntime(alphaId, "observing")
  assert.equal(hits.filter((hit) => hit.model === "alpha").length, alphaBeforeResume, "恢复运行不能为旧历史追加请求")
  data(await invoke(running.page, "chat_send", runtimeRequest("运行器计划测试")))
  await expect.poll(async () => (await runtimeSnapshot()).participants.find((member) => member.id === alphaId)?.runtime.next_wake_at, { timeout: 20_000 }).toBeGreaterThan(Date.now())
  await waitRuntime(alphaId, "observing")
  assert.equal(hits.filter((hit) => hit.model === "alpha").length, alphaBeforeResume + 1)
  const savedWakeAt = (await runtimeSnapshot()).participants.find((member) => member.id === alphaId).runtime.next_wake_at
  assert.ok(savedWakeAt > Date.now())
  const betaBeforeResume = hits.filter((hit) => hit.model === "beta").length
  await runtimeControl(betaId, false)
  await waitRuntime(betaId, "observing")
  assert.equal(hits.filter((hit) => hit.model === "beta").length, betaBeforeResume, "无计划成员恢复时不能重新回答历史")
  assert.equal((await runtimeSnapshot()).participants.find((member) => member.id === betaId).runtime.next_wake_at, null)
  const idleBetaCalls = hits.filter((hit) => hit.model === "beta").length
  const plannedCalls = hits.length
  await stop(running)
  running = await launch(4)
  await expect.poll(async () => (await runtimeSnapshot()).participants.find((member) => member.id === alphaId)?.runtime.next_wake_at).toBe(savedWakeAt)
  await waitRuntime(betaId, "observing")
  assert.equal((await runtimeSnapshot()).participants.find((member) => member.id === betaId).runtime.next_wake_at, null)
  await delay(1500)
  assert.equal(hits.filter((hit) => hit.model === "beta").length, idleBetaCalls, "同配置修订的无计划 observing 成员重启必须恢复观察且不能重新初始化")
  assert.equal(hits.length, plannedCalls, "未到期的持久计划重启后不能增加初始化或轮询调用")
  passed("自主唤醒计划跨重启保留，未到期不调用模型")
  passed("无计划 observing 成员跨重启恢复观察且不增加模型调用")
  await runtimeControl(betaId, true)
  await waitRuntime(betaId, "paused")

  const wakeDatabaseFile = path.join(running.snapshot.data_directory, "chat.sqlite3")
  assert.ok(running.snapshot.data_directory.toLowerCase().includes(identifier), "拒绝修改非隔离数据目录的唤醒计划")
  assert.equal(path.resolve(wakeDatabaseFile), path.resolve(databaseFile))
  await stop(running)
  assert.ok(running.child.exitCode !== null || running.child.signalCode !== null, "必须等待测试应用完全退出后修改计划")
  const wakeDatabase = new DatabaseSync(wakeDatabaseFile, { allowExtension: false })
  try {
    wakeDatabase.exec("BEGIN IMMEDIATE")
    const due = Date.now() - 1000
    assert.equal(wakeDatabase.prepare("UPDATE runtime_plans SET next_wake_at = ? WHERE agent_id = ?").run(due, alphaId).changes, 1)
    assert.equal(wakeDatabase.prepare("UPDATE agent_runtime_states SET next_wake_at = ? WHERE agent_id = ?").run(due, alphaId).changes, 1)
    wakeDatabase.exec("COMMIT")
  } catch (error) {
    wakeDatabase.exec("ROLLBACK")
    throw error
  } finally { wakeDatabase.close() }
  running = await launch(5)
  await waitReply("持久计划到期回复", alphaId)
  await waitRuntime(alphaId, "observing")
  await expect.poll(async () => (await runtimeSnapshot()).participants.find((member) => member.id === alphaId)?.runtime.next_wake_at).toBeNull()
  await delay(1500)
  assert.equal(hits.filter((hit) => hit.model === "alpha" && hit.opportunity === "planned_wake").length, 1)
  assert.equal(hits.length, plannedCalls + 1, "到期计划只应触发一次 planned_wake，不能追加初始化或自回复调用")
  await screenshot(running.page, "runtime-planned-wake")
  await runtimeControl(alphaId, true)
  await waitRuntime(alphaId, "paused")
  passed("持久计划到期后重启触发一次 planned_wake，真实成员身份落库并显示，不生成新计划")

  if (realProfile) blocked("真实模型自主聊天验收", "当前宿主采用固定请求预算；此脚本只允许显式授权后的单次真实连接测试，不自动创建真实运行成员。")
  assert.deepEqual(report.page_errors, [])
  assert.deepEqual(report.console_errors, [])
  passed("WebView2 无页面异常或 CSP 错误")
  await stop(running)
} catch (error) {
  if (current?.page && !current.page.isClosed()) await screenshot(current.page, "desktop-failure").catch(() => {})
  report.tests.push({ name: "桌面主路径", status: "Failed", detail: error.message })
  process.exitCode = 1
  console.error(error.message)
} finally {
  if (builder?.exitCode === null) {
    terminateOwnedProcess(builder)
    report.tests.push({ name: "构建进程清理", status: "Failed", detail: "构建未正常结束，仅终止本脚本拥有的构建进程树" })
    process.exitCode = 1
  }
  if (current?.child.exitCode === null) {
    try { await stop(current) } catch {
      terminateOwnedProcess(current.child)
      report.tests.push({ name: "测试进程清理", status: "Failed", detail: "正常退出失败，仅终止本脚本的隔离测试子进程" })
      process.exitCode = 1
    }
  }
  if (modelServer) {
    await new Promise((resolve) => { modelServer.close(resolve); modelServer.closeAllConnections() })
  }
  await server?.close()
  writeFileSync(path.join(output, "report.json"), JSON.stringify(report, null, 2))
  console.log(`桌面证据目录：${output}`)
}
