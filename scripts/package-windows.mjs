#!/usr/bin/env node
/**
 * Windows 打包：编译 release 版本，产出两个分发格式
 *   1) Sageroom-<版本>-setup.exe      安装版（Inno Setup）
 *   2) Sageroom-<版本>-portable.zip   免安装版（exe + LICENSE，解压双击即用）
 *
 * 免安装版不走任何安装流程：Tauri 把前端资源编译进 exe，没有外部依赖，
 * 所以它就是这个 zip 里的那个可执行文件，复制到哪里都能跑。
 *
 * 用法：
 *   node scripts/package-windows.mjs              # 完整构建
 *   node scripts/package-windows.mjs --skip-build # 复用已有的 release exe，只重新打包
 *   node scripts/package-windows.mjs --skip-build --only=portable
 */
import { spawnSync } from "node:child_process"
import { createHash } from "node:crypto"
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

/** 内容相同就返回 true。用于跳过对正在被运行中实例锁定的文件的改写。 */
function sameContent(left, right) {
  if (!existsSync(left) || !existsSync(right)) return false
  if (statSync(left).size !== statSync(right).size) return false
  const digest = (file) => createHash("sha256").update(readFileSync(file)).digest("hex")
  return digest(left) === digest(right)
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

/** Windows 10 1803+ 自带 bsdtar，能直接写出 zip；Git Bash 里的 GNU tar 不行。 */
function findTar() {
  const candidates = [
    path.join(process.env.SystemRoot ?? "C:\\Windows", "System32", "tar.exe"),
    "tar",
  ]
  for (const candidate of candidates) {
    const probe = spawnSync(candidate, ["--version"], { stdio: "ignore", shell: false })
    if (!probe.error && probe.status === 0) return candidate
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

// ---- 2. 暂存 ----
// 免安装版就是这些文件本身：Tauri 把前端资源编译进 exe，没有外部 DLL。
mkdirSync(stageDir, { recursive: true })
clearFiles(stageDir)
const stagedExe = path.join(stageDir, `${appName}.exe`)
// 暂存文件可能正被运行中的实例占用（用户一边用一边打包），内容一样就不去动它。
if (sameContent(releaseExe, stagedExe)) {
  console.log(`· 暂存 exe 与 release 一致，跳过复制`)
} else {
  try {
    copyFileSync(releaseExe, stagedExe)
  } catch (error) {
    fail(`写入 ${path.relative(root, stagedExe)} 失败（${error.code}）。Sageroom 正在运行时请先从托盘退出再打包。`)
  }
}
// MIT 要求随分发附带许可证，安装版和免安装版都带上。
copyFileSync(path.join(root, "LICENSE"), path.join(stageDir, "LICENSE"))
const exeBytes = statSync(stagedExe).size
console.log(`· exe ${formatBytes(exeBytes)}`)

mkdirSync(outputDir, { recursive: true })
// 先清掉上一次的产物，避免体积汇报里混进旧版本。
clearFiles(outputDir, (name) => name.startsWith(`${appName}-`) && (name.endsWith(".exe") || name.endsWith(".zip")))

const wanted = (name) => !only || only === name
const results = []

// ---- 3. 安装版：Inno Setup ----
if (wanted("setup")) {
  const iscc = findIscc()
  if (!iscc) fail("找不到 Inno Setup 的 ISCC.exe，请安装 Inno Setup 6/7 或设置环境变量 ISCC")
  console.log(`· Inno Setup: ${iscc}`)
  console.log("· 打包 setup …")
  run(iscc, [`/DAppVersion=${version}`, "/Q", path.join(installerDir, "installer.iss")])
  results.push(`${appName}-${version}-setup.exe`)
}

// ---- 4. 免安装版：直接把 exe 打包成 zip，不经过任何安装流程 ----
if (wanted("portable")) {
  const tar = findTar()
  if (!tar) fail("找不到可以创建 zip 的 tar.exe（Windows 10 1803 以上自带）")
  console.log("· 打包 portable（zip）…")
  run(tar, ["-a", "-c", "-f", path.join(outputDir, `${appName}-${version}-portable.zip`), `${appName}.exe`, "LICENSE"], { cwd: stageDir })
  results.push(`${appName}-${version}-portable.zip`)
}

// ---- 5. 汇报体积 ----
console.log("\n打包结果：")
for (const file of readdirSync(outputDir).filter((name) => results.includes(name)).sort()) {
  const bytes = statSync(path.join(outputDir, file)).size
  const ratio = ((bytes / exeBytes) * 100).toFixed(0)
  console.log(`  ${file.padEnd(34)} ${formatBytes(bytes).padStart(9)}  （exe 的 ${ratio}%）`)
}
