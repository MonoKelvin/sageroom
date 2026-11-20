import assert from "node:assert/strict"
import { spawn, spawnSync } from "node:child_process"
import { createWriteStream, existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs"
import net from "node:net"
import os from "node:os"
import path from "node:path"
import { fileURLToPath } from "node:url"
import { randomUUID } from "node:crypto"
import { setTimeout as delay } from "node:timers/promises"
import { DatabaseSync } from "node:sqlite"
import { chromium, expect } from "@playwright/test"
import { createServer } from "vite"

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..")
const runId = randomUUID().replaceAll("-", "").slice(0, 12)
const identifier = `app.sageroom.desktop.e2e.r${runId}`
const productName = `Sageroom 测试 ${runId}`
const output = path.join(root, ".test-results", `desktop-${runId}`)
mkdirSync(output, { recursive: true })
const report = { platform: `${os.platform()} ${os.release()}`, app_version: "0.1.0", build: "debug", identifier, cpu: os.cpus()[0]?.model, memory_bytes: os.totalmem(), tests: [], screenshots: [], page_errors: [], console_errors: [], limitations: ["Windows 11 无设备，Blocked", "真实中文输入法需人工走查；自动化只验证组合输入事件", "安装态通知、release 性能、24h、完整备份恢复和独立智能体运行未验收"] }
const executable = path.join(root, "src-tauri/target/debug/sageroom.exe")
let server
let current
let builder
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
    if (Date.now() >= deadline) throw new Error("WebView2 CDP 初始化超时")
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
  await expect(page.getByRole("textbox", { name: "消息输入" })).toBeEnabled()
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
  await page.screenshot({ path: path.join(output, filename) })
  report.screenshots.push(filename)
}

try {
  if (os.platform() !== "win32") throw new Error("此脚本仅覆盖 Windows WebView2")
  const config = JSON.parse(readFileSync(path.join(root, "src-tauri/tauri.e2e.conf.json"), "utf8"))
  config.identifier = identifier
  config.productName = productName
  debugPort = await freePort()
  config.app.windows[0].additionalBrowserArgs = `--remote-debugging-port=${debugPort} --remote-debugging-address=127.0.0.1`
  const configFile = path.join(output, "tauri-test-config.json")
  writeFileSync(configFile, JSON.stringify(config))
  const buildLog = createWriteStream(path.join(output, "build.log"))
  builder = spawn(process.execPath, [path.join(root, "node_modules/@tauri-apps/cli/tauri.js"), "build", "--debug", "--no-bundle", "--config", configFile], { cwd: root, shell: false, env: { ...process.env, NODE_ENV: "production" } })
  builder.stdout.pipe(buildLog, { end: false })
  builder.stderr.pipe(buildLog, { end: false })
  await waitExit(builder, 600_000)
  buildLog.end()
  assert.equal(builder.exitCode, 0, "桌面构建失败，详见 build.log")
  assert.ok(readFileSync(executable).includes(Buffer.from(identifier)), "构建未包含隔离测试标识，不启动应用")
  passed("Tauri Windows debug 原生构建")
  server = await createServer({ configFile: path.join(root, "vite.config.ts"), root })
  await server.listen()
  assert.equal((await fetch("http://127.0.0.1:1420")).status, 200)
  passed("Vite 开发服务器启动")

  const session = await launch(1)
  const { page, snapshot } = session
  assert.equal(snapshot.latest_message_seq, "0")
  assert.equal(snapshot.participants.length, 2)
  assert.equal(snapshot.participants.find((member) => member.kind === "agent").status, "needs_configuration")
  await expect(page.getByText("这里还很安静", { exact: true })).toBeVisible()
  passed("无凭据首启与 Sage 未配置，无假聊天")
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
  await screenshot(page, "chat-light")
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
  await page.getByRole("button", { name: "添加预设", exact: true }).click()
  await expect.poll(async () => data(await invoke(page, "global_configuration_get", { data_generation_id: generation })).model_profiles.length).toBe(1)
  const incompleteModel = data(await invoke(page, "global_configuration_get", { data_generation_id: generation })).model_profiles[0]
  assert.equal(incompleteModel.base_url, "")
  assert.equal(incompleteModel.model_name, "")
  await expect(page.getByRole("button", { name: "测试连接", exact: true })).toBeDisabled()
  await page.getByRole("button", { name: "删除模型预设 新模型预设", exact: true }).click()
  await page.getByRole("button", { name: "确认删除预设", exact: true }).click()
  await expect.poll(async () => data(await invoke(page, "global_configuration_get", { data_generation_id: generation })).model_profiles.length).toBe(0)
  passed("未配置模型预设创建与删除立即持久化，无保存按钮")
  await page.getByRole("button", { name: "运行偏好", exact: true }).click()
  await page.getByRole("spinbutton", { name: "每日请求上限", exact: true }).fill("321")
  await page.getByRole("heading", { name: "全局配置", exact: true }).click()
  await expect.poll(async () => data(await invoke(page, "global_configuration_get", { data_generation_id: generation })).runtime_defaults.request_limit_daily).toBe(321)
  await expect(page.getByRole("button", { name: /保存|重新读取/ })).toHaveCount(0)
  const savedGlobal = data(await invoke(page, "global_configuration_get", { data_generation_id: generation }))
  assert.equal(savedGlobal.runtime_defaults.request_limit_daily, 321)
  await page.getByRole("button", { name: /^Sage/ }).click()
  const oldAgent = data(await invoke(page, "agent_list", { data_generation_id: generation }))[0]
  await page.getByRole("textbox", { name: "名称", exact: true }).fill("Sage · 本地配置")
  await page.getByRole("textbox", { name: "语言风格", exact: true }).fill("自然、克制，保留独立参数")
  await page.getByRole("button", { name: "应用语言风格", exact: true }).click()
  await expect.poll(async () => data(await invoke(page, "agent_list", { data_generation_id: generation }))[0].language_style).toBe("自然、克制，保留独立参数")
  const savedAgent = data(await invoke(page, "agent_list", { data_generation_id: generation }))[0]
  assert.equal(savedAgent.agent_id, oldAgent.agent_id)
  assert.equal(savedAgent.display_name, "Sage · 本地配置")
  assert.equal(savedAgent.language_style, "自然、克制，保留独立参数")
  await screenshot(page, "agent-editor")
  await page.getByRole("button", { name: "聊天", exact: true }).click()
  await expect(input).toHaveValue("导航切换后应保留的聊天草稿")
  await input.fill("")
  passed("四导航中的聊天草稿保活、全局配置与独立成员保存")

  await page.getByRole("button", { name: "用户", exact: true }).click()
  const nickname = page.getByRole("textbox", { name: "昵称", exact: true })
  await nickname.fill("本地测试者")
  assert.equal(data(await invoke(page, "user_profile_get", { data_generation_id: generation })).display_name, snapshot.local_user.display_name)
  await page.getByRole("textbox", { name: "简介", exact: true }).fill("取消这段编辑")
  await page.getByRole("button", { name: "撤销简介", exact: true }).click()
  await expect(page.getByRole("textbox", { name: "简介", exact: true })).toHaveValue("")
  await expect.poll(async () => data(await invoke(page, "user_profile_get", { data_generation_id: generation })).display_name).toBe("本地测试者")
  await page.getByRole("textbox", { name: "简介", exact: true }).fill("真实本地保存，历史资料不回写。")
  await page.getByRole("button", { name: "应用简介", exact: true }).click()
  await expect.poll(async () => data(await invoke(page, "user_profile_get", { data_generation_id: generation })).introduction).toBe("真实本地保存，历史资料不回写。")
  await screenshot(page, "textarea-apply-actions")
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
  assert.equal(originalHistory.items[0].sender_snapshot.display_name, snapshot.local_user.display_name)
  await screenshot(page, "user-profile")
  await page.getByRole("button", { name: "聊天", exact: true }).click()
  passed("用户昵称和简介保存、稳定身份与历史快照不回写")

  if (existsSync(path.join(root, ".env"))) {
    await page.getByRole("button", { name: "智能体", exact: true }).click()
    await page.getByRole("button", { name: "全局配置", exact: true }).click()
    await page.getByRole("button", { name: "模型配置", exact: true }).click()
    await page.getByText("开发环境导入", { exact: true }).click()
    await page.getByRole("button", { name: "从开发环境导入模型", exact: true }).click()
    await page.getByRole("button", { name: "确认导入", exact: true }).click()
    await expect(page.getByRole("textbox", { name: "模型预设名称", exact: true })).toHaveValue("开发模型")
    await expect(page.getByText("已配置系统密钥", { exact: false })).toBeVisible()
    const configuredGlobal = data(await invoke(page, "global_configuration_get", { data_generation_id: generation }))
    assert.equal(configuredGlobal.model_profiles.length, 1)
    assert.equal(configuredGlobal.model_profiles[0].credential_configured, true)
    assert.equal(await page.locator('input[type="password"][aria-label="API Key"]').inputValue(), "")
    assert.ok(!JSON.stringify(configuredGlobal).includes("api_key"))
    await page.getByRole("button", { name: "测试连接", exact: true }).click()
    await expect(page.getByText(/连接可用/)).toBeVisible({ timeout: 20_000 })
    await screenshot(page, "global-model-connected")
    passed("后端安全导入临时模型、系统凭据保存与真实三方连接测试", { protocol: configuredGlobal.model_profiles[0].protocol })
    await page.getByRole("button", { name: "人格预设", exact: true }).click()
    await screenshot(page, "global-persona")
    await page.getByRole("button", { name: "聊天", exact: true }).click()
  }

  await page.getByRole("button", { name: "群信息", exact: true }).click()
  await expect(page.getByRole("complementary", { name: "群信息" })).toBeVisible()
  await screenshot(page, "chat-group-information")
  await page.getByRole("button", { name: "关闭群信息" }).click()
  await page.getByRole("button", { name: "搜索聊天", exact: true }).click()
  await page.getByRole("searchbox", { name: "搜索聊天文本" }).fill("工作终于")
  await page.getByRole("button", { name: "开始搜索" }).click()
  const result = page.getByRole("list", { name: "搜索结果" }).getByRole("button")
  await expect(result).toHaveCount(1)
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
  await screenshot(page, "chat-dark")
  passed("外观实际保存、深色与减少动画")

  try {
    const scale = report.device_scale
    const outer = native(session, "status")
    const inner = await page.evaluate(() => ({ width: innerWidth, height: innerHeight }))
    const frameWidth = outer.width - Math.round(inner.width * scale)
    const frameHeight = outer.height - Math.round(inner.height * scale)
    native(session, "resize", ["-Width", String(Math.round(860 * scale) + frameWidth), "-Height", String(Math.round(620 * scale) + frameHeight)])
    await expect.poll(() => page.evaluate(() => ({ width: innerWidth, height: innerHeight }))).toEqual({ width: 860, height: 620 })
    await expect.poll(() => page.evaluate(() => document.body.scrollWidth <= innerWidth)).toBe(true)
    await screenshot(page, "chat-minimum")
    native(session, "resize", ["-Width", String(Math.round(1100 * scale) + frameWidth), "-Height", String(Math.round(780 * scale) + frameHeight)])
    await expect.poll(() => page.evaluate(() => innerWidth)).toBe(1100)
    assert.equal(native(session, "hit-test", ["-X", String(Math.round(8 * scale)), "-Y", String(Math.round(300 * scale))]).hit_test, -1)
    assert.equal(native(session, "hit-test", ["-X", String(Math.round(18 * scale)), "-Y", String(Math.round(300 * scale))]).hit_test, 10)
    passed("Win10 最小窗口、透明边缘与原生缩放命中")
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
    await expect.poll(() => page.evaluate(() => innerWidth)).toBe(550)
    await expect(page.getByRole("textbox", { name: "消息输入" })).toBeVisible()
    await expect.poll(() => page.evaluate(() => document.body.scrollWidth <= innerWidth)).toBe(true)
    await screenshot(page, "chat-zoom-200")
    const zoomNativeFilename = "chat-zoom-200-native.png"
    native(session, "capture", ["-ImageFile", path.join(output, zoomNativeFilename)])
    report.screenshots.push(zoomNativeFilename)
    assert.equal(native(session, "hit-test", ["-X", String(Math.round(8 * scale)), "-Y", String(Math.round(300 * scale))]).hit_test, -1)
    assert.equal(native(session, "hit-test", ["-X", String(Math.round(18 * scale)), "-Y", String(Math.round(300 * scale))]).hit_test, 10)
    await page.evaluate(() => window.__TAURI_INTERNALS__.invoke("plugin:webview|set_webview_zoom", { label: "main", value: 1 }))
    await expect.poll(() => page.evaluate(() => innerWidth)).toBe(1100)
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
  assert.equal(data(await invoke(reopened.page, "global_configuration_get", { data_generation_id: reopened.snapshot.data_generation_id })).runtime_defaults.request_limit_daily, 321)
  assert.equal(data(await invoke(reopened.page, "agent_list", { data_generation_id: reopened.snapshot.data_generation_id }))[0].display_name, "Sage · 本地配置")
  const afterRestart = data(await invoke(reopened.page, "chat_list", { data_generation_id: reopened.snapshot.data_generation_id, before_seq: null, after_seq: null, around_seq: null, limit: 50 }))
  assert.deepEqual(afterRestart.items.map((message) => message.id), beforeRestart.items.map((message) => message.id))
  assert.equal((await invoke(reopened.page, "chat_send", { ...request, data_generation_id: generation })).error.code, "DATA_GENERATION_CHANGED")
  await expect(reopened.page.getByText(firstText, { exact: true })).toBeVisible()
  await expect(reopened.page.getByText("重复请求只能出现一次", { exact: true })).toBeVisible()
  await screenshot(reopened.page, "chat-restarted")
  passed("重启历史、身份、外观持久化与旧世代拒绝")
  assert.deepEqual(report.page_errors, [])
  assert.deepEqual(report.console_errors, [])
  passed("WebView2 无页面异常或 CSP 错误")
  await stop(reopened)
} catch (error) {
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
  await server?.close()
  writeFileSync(path.join(output, "report.json"), JSON.stringify(report, null, 2))
  console.log(`桌面证据目录：${output}`)
}
