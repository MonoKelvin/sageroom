# agent/ — 智能体共享资源

本目录存放**构建期**由所有智能体共用的资源，作为单一数据源被后端引用。修改后需要重新编译 Rust 主程序（`include_str!` 在编译期内嵌内容）。

| 文件 | 用途 | 消费方 |
| --- | --- | --- |
| `SKILL.md` | 社交成员的角色指令、聊天节奏和决策协议。 | `src-tauri/src/storage/configuration.rs`（`BASE_SKILL`） |
| `TOOL_SKILL.md` | 工具助手的委托、相关对话、答复和任务经历协议，不参与自主闲聊。 | `src-tauri/src/runtime/decision.rs`（`TOOL_SKILL`） |
| `hints.json` | 决策格式修复、社交改写和工具委托澄清提示。 | `src-tauri/src/runtime/decision.rs`（`hints()`） |
| `agents.json` | 两个内置默认智能体（小墨、云深不知处）的结构化人设：姓名、性别、语言风格（含完整人设描述）、八个人格维度。 | `src-tauri/src/storage/configuration.rs`（新建数据库时种子写入） |
| `experience.template.md` | 经历文件的格式、评分规则与示例模板。 | 文档；运行时由经历模块按此格式生成 |
| `chat_corpus_zh/`（本地目录，不入源码） | 用户自行下载的中文聊天语料，仅用于本地训练与评估；不随应用分发、不上传。 | `agent/train_chat_style.py`（手动运行） |

## 本地聊天风格校准

`agent/train_chat_style.py` 是独立编写的本地训练工具，不是生成式大模型。它从 `chat_corpus_zh/` 中流式抽样多个来源的人类回复：豆瓣多轮、贴吧回帖、微博回复、PTT 问答、青云语料；清洗隐私、广告与机器人文本后，用轻量逻辑回归学习“自然短回复”与“冗长、点评、模板共情、堆语气词、逻辑连接词”的边界，并输出长度/句式聚合画像。豆瓣按原文件分流，其余来源按稳定哈希分流，跨来源全局去重。

训练只使用标准库，不联网；产物 `chat-style/model.json` 只包含数值参数，`report.json` 含来源统计、评估指标与聚合画像，不含例句、词表、聊天记录或语料路径。

```bash
python -I agent/train_chat_style.py \
  --corpus agent/chat_corpus_zh \
  --output "<应用数据目录>/chat-style/v3/model.json" \
  --samples 20000 \
  --evaluate-db "<应用数据目录>/chat.sqlite3"
```

`--sources douban,tieba` 可只跑部分来源。单来源读取超过 400MB 或 50 万条去重正例时会截断，报告会标出。v3 加入长度相近的短负例与自然对照，区分空泛附和与真实简答；报告分别给出自然留出集误报率和独立手写短候选的检出率。`--evaluate-db` 只读评估可见的智能体消息，不参与训练，也不输出消息正文。

应用只读取 `chat-style/v3/model.json` 中的长度画像，用来推荐句长，不用词表给候选打分。语气、是否值得接话、是否重复话题由对话模型根据原始消息与角色说明判断。宿主保留消息条数、字数、发送节奏和调用次数限制。

冷场没有跳过概率，也不会因几次观察都没发言而累积延迟。活跃度影响首次尝试的时间，单房间的主动尝试串行，间隔至少 75 秒。一次冷场没有合适的开场时，可换切入角度尝试一次；找不到内容仍然可以不说话，不发程序预设的填充消息。

**为什么不做离线生成大模型：** 主回复仍由远端模型生成，这里的数值校准器只负责识别一部分句式问题，不判断事实、相关性或语义复读。重复需要与上下文对照，不应把语料例句放进提示词或把历史 AI 消息回灌为真人正例。

**“持续训练”的边界：** 这是可重复的离线重训流程，不是应用运行中自动吸收用户聊天或模型输出。不要把 AI 自己的文艺回复回灌为“真人样本”；重训后应以独立留出集和人工抽检确认没有把正常短句误判为 AI 味。

**语料与许可：** `chat_corpus_zh/` 来自 [chinese-chatbot-corpus](https://github.com/codemayq/chinese-chatbot-corpus)（Apache-2.0）的汇总，但其许可证不替代每条被爬取内容的授权；各来源（豆瓣、贴吧、微博、PTT、青云、字幕、合成数据）的许可与隐私风险不一致。本仓库不复制、不提交、不分发原始语料或训练样本，`agent/chat_corpus_zh/` 已被 `.gitignore` 排除；是否用于本地研究请自行确认来源条款。`chatterbot`（问答）、`xiaohuangji`（机器人）、`subtitle`（影视对白）、`sms`（隐私风险）、`synthesized`（合成数据）未用作人类正例。

**外部参考（仅研究思路，未复制源码）：** Imprint（人格校准层，把偏好转成纯文本注入系统提示词）、CPR / Conversational Pattern Restoration（用短句节奏、轻度幽默、简短确认等模式修复 RLHF 造成的平直腔）、[chinese-chatbot-corpus](https://github.com/codemayq/chinese-chatbot-corpus)。

工具助手可自行编写脚本。Windows 只读 SQL 使用应用内置的 SQLite，不依赖 Docker；确认「脚本执行权限」后，可查询本机设备名称、类别和固定磁盘容量。已有的容器权限不自动扩大。通用 Shell 或 Python 仍要求本机 Docker Engine（Windows 上用 Linux 容器模式）及 `python:3.12-alpine`，不联网也不挂载宿主目录。源码及 Windows 查询结果归档在该助手的工作区。

## 本机只读 MCP 工具

在当前助手的 `data/agents/<agent_id>/mcp-tools.json` 登记可信工具；这个文件在 `workspace/` 之外，模型不能修改。只连接已由用户启动、通过回环地址提供 `/mcp` 的 Streamable HTTP 服务，当前只接受 JSON 响应。目录中的端口、名称和参数需与实际服务一致，例如：

```json
{
  "port": 43123,
  "tools": [
    {
      "name": "inventory",
      "description": "按程序名查询本机程序路径",
      "arguments": { "program": { "type": "identifier" } }
    }
  ]
}
```

`inventory` 仅是示例，不随应用提供。参数支持标识符 `identifier`、布尔值 `boolean`、有上限的非负整数 `unsigned`（`max`）及配置内的固定选项 `choice`（`values`），不接受自由文本命令或脚本。服务也必须声明 `annotations.readOnlyHint: true` 和 `annotations.openWorldHint: false`。只登记自己信任并已审查的只读服务；只读声明不是操作系统沙箱。未登记时不连接，程序不启动任何外部进程。

## 与运行时目录的区别

- **本目录**：随应用源码分发、只读、全局共享。
- **运行时目录** `<应用数据目录>/data/agents/<agent_id>/`：**每个智能体一份**，可写，存放 `config.json`、`experience.md`、`cache/`。由后端经历模块创建与维护，不属于本仓库。

## 约束

1. 后端按成员类型使用内置 SKILL。社交成员只偶尔获得一组可提及的同伴：向社交成员问观点，向工具助手交代任务。工具答复与原委托绑定；脚本执行默认关闭，由本地用户逐个助手授权。已启用的新闻检索才可联网，容器脚本始终不能联网。
2. `agents.json` 只影响**新建数据库**。已有本地数据库不会重新种子化，避免覆盖用户数据。
3. 人设一旦确定，后续应持续维护一致性；如需调整，改本文件而非散落在代码里的字符串。
4. **提示词一律写在本目录**，不要硬编码进 Rust 源码。长文本用 `.md`，几条短提示用 `hints.json`。
