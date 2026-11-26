<p align="center">
  <img src="src-tauri/icons/icon.png" width="112" height="112" alt="Sageroom">
</p>

<h1 align="center">Sageroom</h1>

<p align="center">一个人，几个有性格的 AI，一个群聊。</p>

<p align="center">
  <a href="https://github.com/MonoKelvin/sageroom/releases"><img src="https://img.shields.io/github/v/release/MonoKelvin/sageroom?style=flat-square&color=3b82f6" alt="版本"></a>
  <img src="https://img.shields.io/badge/Windows-10%20%2F%2011-0078d4?style=flat-square" alt="Windows 10 / 11">
  <img src="https://img.shields.io/badge/Tauri-2-24c8db?style=flat-square" alt="Tauri 2">
  <img src="https://img.shields.io/badge/React-19-61dafb?style=flat-square" alt="React 19">
  <img src="https://img.shields.io/badge/Rust-1.90-dea584?style=flat-square" alt="Rust">
  <img src="https://img.shields.io/badge/license-MIT-2ea44f?style=flat-square" alt="MIT">
</p>

<p align="center"><b>简体中文</b> · <a href="README.md">English</a></p>

Sageroom 是一个桌面聊天应用。打开它，里面有一个群聊，群里坐着几个 AI。你像在普通群里那样说话：发消息、@ 人、引用某一句、丢一张图进去。他们看着群里的动静，自己决定要不要接话——有时候回，有时候不出声，有时候两个 AI 自己聊起来了。

每个 AI 都是独立的：有自己的性格、自己的模型、自己记住的事。同一个群里，两个 AI 可能会互相不同意。

数据都在你自己电脑上。聊天记录、设置和图片存在本地数据库，密钥存在系统凭据库里。除了你主动发给模型服务的内容，其余都不会离开这台机器。

## 用起来是什么感觉

- **不需要你一句一句地推。** AI 看到新消息，自己判断这是不是该它说话的时候，也可以完全不说。你不需要维护一条队列。
- **你走了他们还在聊。** 两个 AI 可以在你去做别的事的时候接着聊下去。
- **这是个聊天，不是仪表盘。** 短句、一条一个意思，不会在对话中间给你列个清单。

## 能做什么

**聊天**

- 消息本地保存，重开还在，能一直往上翻
- 输入 `@` 弹出带头像的成员列表，选中后变成彩色胶囊嵌在正文里
- 引用某条消息；点引用可以直接跳回原消息
- 发图片和文件，也能把截图直接粘进输入框
- 自己发的消息三分钟内可以撤回
- <kbd>Ctrl</kbd> + <kbd>F</kbd> 搜聊天记录，点结果直接跳过去
- 消息免打扰、未读角标、一键跳到第一条未读

**AI 成员**

- 内置 Sage，也可以自己加成员
- 每个成员单独设置模型、人格（八个维度）、语言风格和头像
- 「经历」——每个 AI 记住的短句事实，按重要度和时间衰减排序，越新越重要越容易想起来
- 每日请求上限、暂停与恢复、实时状态（思考中 / 准备发送）

**应用本身**

- 无边框半透明窗口，自绘窗口按钮，系统托盘，关闭即隐藏，开机自启，单实例
- 浅色 / 深色主题跟随系统
- 数据目录可以迁移，设置页里能看清每样东西存在哪

**可选的联网新闻**

- 聊天需要的时候，AI 可以自己查一下。默认走免费公开来源，也可以填自己的 Tavily / Serper 密钥
- 缓存时长、条数、代理都由你设置；密钥只进凭据库，不写配置文件

## 下载

到 **[Releases](https://github.com/MonoKelvin/sageroom/releases)** 下载最新版本。

| 文件 | 说明 |
| --- | --- |
| `Sageroom-<版本>-setup.exe` | 安装版，约 8 MB。装到当前用户目录，不弹 UAC，带开始菜单快捷方式和卸载程序。 |
| `Sageroom-<版本>-portable.exe` | 免安装版，约 8 MB。双击即用，不写注册表、不建快捷方式、没有卸载程序。 |

**系统要求**：Windows 10 1809 及以上 / Windows 11，64 位。需要 Microsoft Edge WebView2 运行时——Windows 11 自带，Windows 10 如果缺失，安装程序会提示并打开下载页。

> 免安装版的数据同样存在 `%LOCALAPPDATA%\app.sageroom.desktop`，和安装版共用一份。它是「不用安装」，不是「能揣在 U 盘里走」。

目前只提供 Windows 安装包。

## 数据存在哪

- 聊天记录、设置、附件：`%LOCALAPPDATA%\app.sageroom.desktop`
- 如果你迁移过数据目录，覆盖配置在：`%APPDATA%\app.sageroom.desktop\data-root.json`
- API 密钥：Windows 凭据管理器

没有任何埋点。另外提醒一句：即使某个 AI 最后决定不说话，它也可能已经调用过模型并产生费用；取消本地任务不一定能取消远端请求。

## 还没做到的

- 只有 Windows
- 一个程序一个群，暂时没有多会话、消息导出、移动端
- AI 偶尔还是会有机械感，这块一直在调

## 从源码跑起来

需要 Node.js 24、pnpm 11、Rust 1.90+，以及 Windows 上的 [Tauri 2 环境](https://tauri.app/start/prerequisites/)（WebView2 和 MSVC 构建工具）。

```bash
pnpm install
pnpm tauri dev        # 启动桌面应用
pnpm check            # lint、类型检查、测试、合同校验
pnpm package:win      # 生成安装版和免安装版
```

`pnpm dev` 只启动前端页面，适合调样式——普通浏览器里没有 SQLite、没有 IPC，也没有原生窗口。

打包产物在 `build/windows/`。`pnpm package:win --skip-build` 会跳过 Rust 编译直接重新打包，几秒出结果。

## 许可

[MIT](LICENSE) © 2026 MonoKelvin
