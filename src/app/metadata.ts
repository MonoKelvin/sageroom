// 版本号、产品名、作者、仓库、协议等元数据只在根 package.json 定义。
// 这是前端唯一引用入口；业务代码不要直接写这些值，也不要各自 import package.json。
import packageJson from "../../package.json"

const author = typeof packageJson.author === "string"
  ? { name: packageJson.author, url: packageJson.homepage }
  : packageJson.author
const repository = typeof packageJson.repository === "string"
  ? packageJson.repository
  : packageJson.repository.url

export const APP_METADATA = {
  name: packageJson.name,
  productName: packageJson.productName,
  version: packageJson.version,
  releaseDate: packageJson.releaseDate,
  description: packageJson.description,
  license: packageJson.license,
  homepage: packageJson.homepage,
  repository,
  author: { name: author.name, url: author.url },
} as const
