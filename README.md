# Sageroom

[简体中文](README.zh.md)

**Sageroom is a local-first desktop chatroom where a human and multiple AI agents share one room.** Version `0.1.0`, under active development: the desktop shell and the local text-chat slice are implemented, but the full P0/P1 product is **not** delivered yet.

The intended experience is a living group chat, not a dashboard that simply displays several model answers. Agents observe the room, decide whether to speak, stay silent, wait, or rest, and may talk to each other. Code enforces budgets, permissions, and consistency; whether a message is worth sending is meant to be decided by each agent's model.

## Product baseline

- One local human identity and one chatroom. No accounts, cloud sync, or online multiplayer.
- Desktop first; Windows 10 19045 and Windows 11 are the target platforms. Mobile is out of scope for V1.
- Built with Tauri 2, React, TypeScript, Tailwind, shadcn/ui, Tabler Icons, react-virtuoso, and Lenis for smooth in-app scrolling.
- Built-in Sage plus independently configurable members: model, persona/SKILL, language style, and avatar.
- Local history and user-controlled data; remote model calls are visible, bounded, and cancellable.
- An agent group owner has only four group-management powers: rename the group, change allowed group metadata, `@all`, and post announcements. Chatting status stays equal to other members.

"Local-first" does not mean fully offline. When a remote provider, search, or image service is used, the relevant content leaves the device.

## What works today

- **Native shell:** frameless translucent Tauri window with custom window controls, system tray, hide-on-close, explicit exit, and single-instance activation.
- **Chat:** persistent text messages, stable ordering, paginated history, virtualized list, IME-safe composer, basic literal Chinese search, and group-name editing.
- **Configuration:** four navigation areas (Chat, Agents, Settings, User); provider/model configuration and connection tests; local profile and avatar editing; settings apply immediately.
- **Data and safety:** SQLite with WAL and schema-version checks, typed IPC contracts generated from one source, CSP and capability restrictions, bounded inputs, and a desktop end-to-end harness that writes only to an isolated test data directory.

## What is not implemented yet

Autonomous agent actors and natural turn-taking, long-term memory and context compression, image/file/sticker exchange, tool agents and background tasks, full backup/restore and directory migration, notification policies, and final desktop acceptance are still work in progress. A successful model connection test does **not** mean these capabilities are complete.

Design documents describe targets and proposals. Items marked as suggestions or pending confirmation are not delivered features.

## Requirements

| Component | Version / prerequisite |
|---|---|
| Node.js | `>=24.14.1 <25` |
| pnpm | `>=11.9.0 <12` (`pnpm@11.9.0` in `packageManager`) |
| Rust | `1.90` or newer (`rust-version` in `src-tauri/Cargo.toml`) |
| Desktop | Tauri 2 prerequisites; on Windows, WebView2 and MSVC build tools |

Current validation covers Windows 10 with WebView2 at 100% DPI. Windows 11, other DPI settings, installed builds, and release performance remain unverified. Application bundles are not enabled (`bundle.active: false`).

## Getting started

```bash
pnpm install --frozen-lockfile
pnpm tauri dev
```

`pnpm tauri dev` starts the real desktop application. `pnpm dev` only starts the Vite frontend server; a plain browser cannot simulate SQLite, IPC, or the native window.

## Checks

```bash
pnpm typecheck
pnpm lint
pnpm test
pnpm contracts:check
cargo test --locked --manifest-path src-tauri/Cargo.toml --lib
```

`pnpm contracts:generate` regenerates the TypeScript types, JSON schema, and validators in `src/contracts/generated`. `pnpm test:desktop` builds an isolated desktop test instance and writes evidence under `.test-results/`; it does not use the normal chat data directory. `pnpm build` builds the frontend used by Tauri.

## Repository layout

| Path | Purpose |
|---|---|
| `src/` | React frontend: app shell, chat, agents, settings, user pages, generated contracts |
| `src-tauri/` | Rust host: Tauri commands, SQLite storage, secrets, models, attachments, app lifecycle |
| `src/contracts/generated/` | DTOs, JSON schema, and validators generated from the Rust-side contract source |
| `scripts/` | Contract generation, desktop end-to-end test, icon and Windows window helpers |
| `docs/` | Product requirements, architecture, design documents, test plan, and delivery roadmap |
| `tests/` / `vitest.*` | Frontend unit and component tests |

## Documentation

The design documents are currently written in Chinese:

- [00 · Navigation and confirmation checklist](docs/00-文档导航与确认清单.md) — status of decisions, open questions, and shared parameters.
- [02 · User requirements and product spec](docs/02-用户需求与产品规格.md) — product scope, user journeys, and requirement IDs.
- [03 · Architecture and module contracts](docs/03-总体架构与模块合同.md) — module boundaries, IPC, and events.
- [08 · UI and interaction design](docs/08-界面与交互详细设计.md) — information architecture and interaction details.
- [10 · Test and acceptance plan](docs/10-测试验收与性能评估.md) — scenarios, metrics, and current evidence.
- [11 · Delivery roadmap](docs/11-实施路线与开发任务分解.md) — work packages, dependencies, and verified scope.

Start with `00`, `02`, and `08` for product context; `03`, `05`, `07`, and `09` for architecture/data/security; `10` and `11` for implementation status.

## Privacy and cost

- Data is stored locally by default. There is no implicit telemetry design.
- API credentials are kept in the OS credential store, not in ordinary frontend configuration or backups.
- A model may be called even when it decides not to reply; connection tests and agent-to-agent messages can also incur costs. Pricing estimates and provider bills are separate.
- Cancelling a local task does not guarantee that a remote request or its charge is cancelled.
- Model outputs and web content are treated as untrusted input. V1 does not execute arbitrary code or open files/URLs automatically.

## License

[MIT](LICENSE) © 2026 MonoKelvin.
