#!/usr/bin/env node
/**
 * Windows 打包：编译 release 版本，再用 Inno Setup 生成
 *   1) Sageroom-<版本>-setup.exe    安装版
 *   2) Sageroom-<版本>-portable.exe 便携版
 *
 * 用法：
 *   node scripts/package-windows.mjs              # 完整构建
 *   node scripts/package-windows.mjs --skip-build # 复用已有的 release exe，只重新打包
 *   node scripts/package-windows.mjs --skip-build --only=portable
 */
import { spawnSync } from "node:child_process"
import { copyFileSync, existsSync, mkdirSync, readFileSync, readdirSync, statSync, unlinkSync } from "node:fs"
import path from "node:path"
import { fileURLToPath } from "node:url"

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..")
const pkg = JSON.parse(readFileSync(path.join(root, "package.json"), "utf8"))
const version = pkg.version
const productName = pkg.productName ?? "Sageroom"
const appName = "Sageroom"

const args = process.argv.slice(2)
const skipBuild = args.includes("--skip-build")
const only = args.find((value) => value.startsWith("--only="))?.split("=")[1]

const releaseExe = path.join(root, "src-tauri", "target", "release", "sageroom.exe")
const stageDir = path.join(root, "build", "windows", "stage")
const outputDir = path.join(root, "build", "windows")
const installerDir = path.join(root, "installer", "windows")

function fail(message) {
  console.error(`\n✗ ${message}`)
  process.exit(1)
}

function run(command, commandArgs, options = {}) {
  const result = spawnSync(command, commandArgs, { cwd: root, stdio: "inherit", shell: false, ...options })
  if (result.error) fail(`${command} 启动失败：${result.error.message}`)
  if (result.status !== 0) fail(`${command} 退出码 ${result.status}`)
}

/**
 * Node 24 起 shell:false 不能直接 spawn .cmd（会 EINVAL），pnpm 在 Windows 上正是 .cmd。
 * 统一走 cmd /c 执行命令行；iscc 是真正的 exe，仍然直接 spawn。
 */
function runCommandLine(commandLine) {
  const [command, commandArgs] = process.platform === "win32"
    ? [process.env.ComSpec ?? "cmd.exe", ["/d", "/s", "/c", commandLine]]
    : ["/bin/sh", ["-c", commandLine]]
  run(command, commandArgs)
}

/** 只删文件、不递归删目录：清掉上一次的产物即可，不需要动整棵目录树。 */
function clearFiles(directory, matches = () => true) {
  if (!existsSync(directory)) return
  for (const entry of readdirSync(directory, { withFileTypes: true })) {
    if (!entry.isFile() || !matches(entry.name)) continue
    try {
      unlinkSync(path.join(directory, entry.name))
    } catch {
      // 文件被占用时跳过，后面覆盖写会失败并明确报错，不必在这里静默吞掉原因。
    }
  }
}

function formatBytes(bytes) {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`
  return `${(bytes / 1024 / 1024).toFixed(2)} MB`
}

/** ISCC 常见位置兜底：PATH 找不到时按安装目录猜。 */
function findIscc() {
  const candidates = [
    process.env.ISCC,
    "iscc",
    "C:\\Program Files (x86)\\Inno Setup 6\\ISCC.exe",
    "C:\\Program Files\\Inno Setup 6\\ISCC.exe",
  ]
  for (const drive of ["C", "D", "E"]) {
    for (const folder of ["Inno Setup 7", "Inno Setup 6"]) {
      for (const base of [`${drive}:\\Program Files (x86)`, `${drive}:\\Program Files`, `${drive}:\\Software`]) {
        candidates.push(`${base}\\${folder}\\ISCC.exe`)
      }
    }
  }
  for (const candidate of candidates) {
    if (!candidate) continue
    const probe = spawnSync(candidate, ["/?"], { stdio: "ignore", shell: false })
    if (!probe.error && (probe.status === 0 || probe.status === 1)) return candidate
  }
  return null
}

// ---- 1. 编译 release ----
if (skipBuild) {
  if (!existsSync(releaseExe)) fail(`找不到 ${releaseExe}，去掉 --skip-build 重新编译`)
  console.log(`· 跳过编译，复用 ${path.relative(root, releaseExe)}`)
} else {
  console.log(`· 编译 release（${productName} ${version}）…`)
  // tauri build 会先跑 beforeBuildCommand（pnpm build：同步元数据 + tsc + vite build）
  runCommandLine("pnpm tauri build --no-bundle")
  if (!existsSync(releaseExe)) fail("编译完成但没有找到 release exe")
}

// ---- 2. 暂存：压缩源里只放一个 exe ----
mkdirSync(stageDir, { recursive: true })
clearFiles(stageDir)
const stagedExe = path.join(stageDir, `${appName}.exe`)
copyFileSync(releaseExe, stagedExe)
const exeBytes = statSync(stagedExe).size
console.log(`· exe ${formatBytes(exeBytes)}`)

// ---- 3. Inno Setup 编译 ----
const iscc = findIscc()
if (!iscc) fail("找不到 Inno Setup 的 ISCC.exe，请安装 Inno Setup 6/7 或设置环境变量 ISCC")
console.log(`· Inno Setup: ${iscc}`)

mkdirSync(outputDir, { recursive: true })
// 先清掉上一次的安装包，避免体积汇报里混进旧版本。
clearFiles(outputDir, (name) => name.startsWith(`${appName}-`) && name.endsWith(".exe"))
const scripts = [
  { name: "setup", file: "installer.iss" },
  { name: "portable", file: "portable.iss" },
].filter((item) => !only || only === item.name)
if (!scripts.length) fail(`--only=${only} 不是 setup 或 portable`)

for (const script of scripts) {
  console.log(`· 打包 ${script.name} …`)
  run(iscc, [`/DAppVersion=${version}`, "/Q", path.join(installerDir, script.file)])
}

// ---- 4. 汇报体积 ----
console.log("\n打包结果：")
for (const file of readdirSync(outputDir).filter((name) => name.endsWith(".exe")).sort()) {
  const bytes = statSync(path.join(outputDir, file)).size
  const ratio = ((bytes / exeBytes) * 100).toFixed(0)
  console.log(`  ${file.padEnd(34)} ${formatBytes(bytes).padStart(9)}  （exe 的 ${ratio}%）`)
}
