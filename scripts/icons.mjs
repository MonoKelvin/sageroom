import { readFileSync, writeFileSync, copyFileSync } from "node:fs"
import { fileURLToPath } from "node:url"

const directory = new URL("../src-tauri/icons/", import.meta.url)
const image = readFileSync(new URL("256x256.png", directory))
const header = Buffer.alloc(22)
header.writeUInt16LE(1, 2)
header.writeUInt16LE(1, 4)
header.writeUInt16LE(1, 10)
header.writeUInt16LE(32, 12)
header.writeUInt32LE(image.length, 14)
header.writeUInt32LE(22, 18)
writeFileSync(new URL("icon.ico", directory), Buffer.concat([header, image]))
copyFileSync(fileURLToPath(new URL("32x32.png", directory)), fileURLToPath(new URL("icon.png", directory)))
