// 单一数据源：版本号、产品名、作者、协议只在根 package.json 定义。
// 本脚本把构建工具必需的静态字段同步到 Cargo.toml / tauri.conf.json；
// 业务代码请引用 src/app/metadata.ts，不要在这些文件里手写元数据。
import { readFileSync, writeFileSync } from "node:fs"
import path from "node:path"
import { fileURLToPath } from "node:url"

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..")
const metadata = JSON.parse(readFileSync(path.join(root, "package.json"), "utf8"))
const authorName = typeof metadata.author === "string" ? metadata.author : metadata.author?.name
if (!metadata.version || !metadata.productName || !authorName || !metadata.license) {
  throw new Error("package.json 缺少 version / productName / author / license，无法同步元数据")
}

function sync(relativePath, rules) {
  const file = path.join(root, relativePath)
  const before = readFileSync(file, "utf8")
  let after = before
  for (const [pattern, replacement] of rules) {
    if (!pattern.test(after)) throw new Error(`${relativePath} 中找不到待同步字段：${pattern}`)
    after = after.replace(pattern, replacement)
  }
  if (after !== before) writeFileSync(file, after)
  console.log(`${after === before ? "无需改动" : "已同步"} ${relativePath}`)
}

sync("src-tauri/Cargo.toml", [
  [/^version\s*=\s*"[^"]*"/m, `version = "${metadata.version}"`],
  [/^authors\s*=\s*\[[^\]]*\]/m, `authors = ["${authorName}"]`],
  [/^license\s*=\s*"[^"]*"/m, `license = "${metadata.license}"`],
])

sync("src-tauri/contracts/Cargo.toml", [
  [/^version\s*=\s*"[^"]*"/m, `version = "${metadata.version}"`],
  [/^license\s*=\s*"[^"]*"/m, `license = "${metadata.license}"`],
])

// 两个 lockfile 都带各自 crate 的版本号；漏同步会让 `cargo build --locked` 直接失败。
sync("src-tauri/contracts/Cargo.lock", [
  [/(name = "sageroom-contracts"\s*\nversion = ")[^"]*(")/, `$1${metadata.version}$2`],
])

sync("src-tauri/Cargo.lock", [
  [/(\nname = "sageroom"\s*\nversion = ")[^"]*(")/, `$1${metadata.version}$2`],
])

sync("src-tauri/tauri.conf.json", [
  [/("productName"\s*:\s*)"[^"]*"/, `$1"${metadata.productName}"`],
  [/("version"\s*:\s*)"[^"]*"/, `$1"${metadata.version}"`],
  [/("title"\s*:\s*)"[^"]*"/, `$1"${metadata.productName}"`],
])
