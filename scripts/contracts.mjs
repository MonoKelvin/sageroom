import { spawnSync } from "node:child_process"
import { mkdirSync, mkdtempSync, readFileSync, readdirSync, writeFileSync, copyFileSync, rmSync, existsSync } from "node:fs"
import { tmpdir } from "node:os"
import path from "node:path"
import { createRequire } from "node:module"
import { fileURLToPath } from "node:url"
import { build } from "vite"
import Ajv2020 from "ajv/dist/2020.js"
import standaloneCode from "ajv/dist/standalone/index.js"

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..")
const destination = path.join(root, "src/contracts/generated")
const temporary = mkdtempSync(path.join(tmpdir(), "sageroom-contracts-"))
const checking = process.argv.includes("--check")

const responseTypes = {
  AppSnapshot: "AppSnapshot",
  ChatSend: "ChatSendResult",
  ChatList: "MessagePage",
  ChatSearch: "SearchPage",
  CancelSearch: "CancelSearchResult",
  RoomSave: "Room",
  AppearanceSave: "Appearance",
  Exit: "ExitResult",
  ExitReady: "ExitResult",
  GlobalConfigurationGet: "GlobalConfiguration",
  GlobalConfigurationSave: "GlobalConfiguration",
  AgentList: "AgentConfiguration[]",
  AgentSave: "AgentConfiguration",
  AgentRuntimeControl: "AgentRuntimeState",
  UserProfileGet: "UserProfile",
  UserProfileSave: "UserProfile",
  SecretSet: "SecretStatus",
  SecretDelete: "SecretStatus",
  SecretStatus: "SecretStatus",
  ModelProfileTest: "ModelTestResult",
  DevelopmentModelImport: "GlobalConfiguration",
  AvatarImport: "AvatarObject | null",
  AvatarRead: "AvatarData",
}

function files(directory, prefix = "") {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const relative = path.join(prefix, entry.name)
    return entry.isDirectory() ? files(path.join(directory, entry.name), relative) : [relative]
  }).sort()
}

try {
  const result = spawnSync("cargo", ["run", "--locked", "--quiet", "--manifest-path", path.join(root, "src-tauri/contracts/Cargo.toml"), "--target-dir", path.join(root, "src-tauri/target/contracts"), "--bin", "export_contracts", "--", temporary], { cwd: root, stdio: "inherit", shell: false })
  if (result.status !== 0) throw new Error("Rust 合同导出失败")
  const schemas = JSON.parse(readFileSync(path.join(temporary, "schemas.json"), "utf8"))
  const ajv = new Ajv2020({ strict: true, allErrors: false, code: { source: true, esm: true } })
  for (const format of ["int32", "int64", "uint8", "uint32", "uint64", "float", "double"]) ajv.addFormat(format, true)
  const exports = {}
  for (const [name, schema] of Object.entries(schemas)) {
    ajv.addSchema(schema, name)
    exports[`validate${name}`] = name
  }
  const standalone = path.join(temporary, "raw-validators")
  mkdirSync(standalone)
  const entries = {}
  for (const [name, schema] of Object.entries(exports)) {
    const entry = path.join(standalone, `${name}.js`)
    writeFileSync(entry, standaloneCode(ajv, { [name]: schema }))
    entries[name] = entry
  }
  const require = createRequire(import.meta.url)
  const bundled = await build({
    configFile: false,
    root,
    logLevel: "warn",
    resolve: { alias: { ajv: path.dirname(require.resolve("ajv/package.json")) } },
    build: {
      write: false, minify: false, target: "chrome111",
      lib: { entry: entries, formats: ["es"], fileName: (_format, name) => `validators/${name}.js` },
      rolldownOptions: { output: { chunkFileNames: "validators/[name].js" } },
    },
  })
  const output = Array.isArray(bundled) ? bundled[0] : bundled
  for (const entry of output.output) {
    if (entry.type !== "chunk") continue
    const target = path.join(temporary, entry.fileName)
    mkdirSync(path.dirname(target), { recursive: true })
    writeFileSync(target, entry.code.replaceAll(temporary.replaceAll("\\", "/"), "generated"))
  }
  writeFileSync(path.join(temporary, "validators.js"), Object.keys(exports).map((name) => `export { ${name} } from "./validators/${name}.js"`).join("\n") + "\n")
  rmSync(standalone, { recursive: true })
  const names = readdirSync(path.join(temporary, "types")).filter((file) => file.endsWith(".ts")).map((file) => file.slice(0, -3)).sort()
  writeFileSync(path.join(temporary, "index.ts"), names.map((name) => `export type { ${name} } from "./types/${name}"`).join("\n") + "\n")
  const declarations = [
    'import type { ValidateFunction } from "ajv"',
    `import type { ${names.join(", ")} } from "./index"`,
  ]
  for (const name of Object.keys(schemas)) {
    const response = name.endsWith("Response")
    const type = response ? `ApiResponse<${responseTypes[name.slice(0, -8)]}>` : name
    declarations.push(`export const validate${name}: ValidateFunction<${type}>`)
  }
  writeFileSync(path.join(temporary, "validators.d.ts"), declarations.join("\n") + "\n")
  const generated = files(temporary)
  if (checking) {
    if (!existsSync(destination) || JSON.stringify(files(destination)) !== JSON.stringify(generated)) throw new Error("生成合同的文件清单已漂移，请重新生成")
    for (const file of generated) {
      if (!readFileSync(path.join(destination, file)).equals(readFileSync(path.join(temporary, file)))) throw new Error(`生成合同已漂移：${file}`)
    }
  } else {
    for (const file of generated) {
      const target = path.join(destination, file)
      mkdirSync(path.dirname(target), { recursive: true })
      copyFileSync(path.join(temporary, file), target)
    }
  }
} finally {
  rmSync(temporary, { recursive: true })
}
