<p align="center">
  <img src="src-tauri/icons/icon.png" width="112" height="112" alt="Sageroom">
</p>

<h1 align="center">Sageroom</h1>

<p align="center">One person. A few AI agents. One group chat.</p>

<p align="center">
  <a href="https://github.com/MonoKelvin/sageroom/releases"><img src="https://img.shields.io/github/v/release/MonoKelvin/sageroom?style=flat-square&color=3b82f6" alt="Version"></a>
  <img src="https://img.shields.io/badge/Windows-10%20%2F%2011-0078d4?style=flat-square" alt="Windows 10 / 11">
  <img src="https://img.shields.io/badge/Tauri-2-24c8db?style=flat-square" alt="Tauri 2">
  <img src="https://img.shields.io/badge/React-19-61dafb?style=flat-square" alt="React 19">
  <img src="https://img.shields.io/badge/Rust-1.90-dea584?style=flat-square" alt="Rust">
  <img src="https://img.shields.io/badge/license-MIT-2ea44f?style=flat-square" alt="MIT">
</p>

<p align="center"><a href="README.zh.md">简体中文</a> · <b>English</b></p>

Sageroom is a desktop chat app. You open it and there's a group chat with a few AI agents in it. You talk to them the way you'd talk in any group: send a message, @ someone, quote a line, drop a picture in. They read the room and decide for themselves whether to speak — sometimes they answer, sometimes they stay quiet, sometimes they start talking to each other.

Each agent is its own thing: a personality, a model of its own, and a set of memories it keeps. Two agents in the same room can disagree.

Everything stays on your machine. Chats, settings and images live in a local database, and API keys live in the system credential store. Nothing leaves your computer except the messages you choose to send to your model provider.

## What it feels like

- **Nobody is waiting for a turn.** Agents see new messages, decide whether this is their moment, and can say nothing at all. You're not driving a queue of prompts.
- **They keep talking after you stop.** Two agents can pick up a thread between themselves while you go do something else.
- **It's a chat, not a dashboard.** Short lines, one thought per message, no bullet points in the middle of a conversation.

## What you can do

**Chat**

- Messages persist across restarts, with history you can scroll back through
- Type `@` to pick a member from a list with avatars; the mention turns into a colored pill inside your text
- Quote a message, and click a quote to jump to what it points at
- Send images and files, or paste a screenshot straight into the input box
- Recall your own message within three minutes
- Search the history with <kbd>Ctrl</kbd> + <kbd>F</kbd> and jump to any hit
- Mute a conversation, see unread counts, jump to the first unread message

**Agents**

- Built-in Sage, plus members you add yourself
- Per-agent model, persona (eight dimensions), language style and avatar
- "Experiences" — short facts an agent keeps. They're scored and decay over time, so recent and important things surface first
- Daily request budget, pause and resume, live status like *thinking* or *about to send*

**The app**

- Frameless translucent window with its own controls, system tray, hide-on-close, launch at login, single instance
- Light and dark themes that follow the system
- Data directory you can move; a settings page that actually explains what's stored where

**Optional web news**

- When a conversation calls for it, an agent can look something up. Free public sources by default; Tavily or Serper if you add your own key
- You set the cache window, item count and proxy. Keys go to the credential store, never to a config file

## Download

Grab the latest from **[Releases](https://github.com/MonoKelvin/sageroom/releases)**.

| File | What it is |
| --- | --- |
| `Sageroom-<version>-setup.exe` | Installer, about 8 MB. Installs for the current user (no UAC prompt), adds Start Menu shortcuts and an uninstaller. |
| `Sageroom-<version>-portable.zip` | Zip, about 8.5 MB. Unzip anywhere and double-click `Sageroom.exe` — nothing gets installed, no registry entries, no shortcuts. |

**Requirements:** Windows 10 1809 or newer / Windows 11, 64-bit. Sageroom needs the Microsoft Edge WebView2 runtime — Windows 11 ships with it, and on Windows 10 the installer will tell you and open the download page if it's missing.

> The portable build still keeps its data in `%LOCALAPPDATA%\app.sageroom.desktop`, shared with the installed build. It's "no install", not "runs off a USB stick".

Windows installers are the only builds published so far.

## Where your data lives

- Chats, settings and attachments: `%LOCALAPPDATA%\app.sageroom.desktop`
- Data directory override, if you've moved it: `%APPDATA%\app.sageroom.desktop\data-root.json`
- API keys: Windows Credential Manager

There's no telemetry. A model may be called even when an agent decides not to reply, and that call still costs money — cancelling a local task doesn't necessarily cancel the remote request.

## Not there yet

- Windows only for now
- One group chat per install; no multi-room, no export, no mobile
- Agents still sound mechanical now and then. Making them read like people is the main thing being worked on

## Building from source

You'll need Node.js 24, pnpm 11, Rust 1.90+, and the [Tauri 2 prerequisites](https://tauri.app/start/prerequisites/) for Windows (WebView2 and the MSVC build tools).

```bash
pnpm install
pnpm tauri dev        # run the desktop app
pnpm check            # lint, typecheck, tests, contract check
pnpm package:win      # build the installer and the portable exe
```

`pnpm dev` starts the Vite frontend alone, which is only useful for quick style work — a plain browser has no SQLite, no IPC and no native window.

Packaging output lands in `build/windows/`. `pnpm package:win --skip-build` repackages without recompiling Rust, which takes seconds instead of minutes.

## License

[MIT](LICENSE) © 2026 MonoKelvin
