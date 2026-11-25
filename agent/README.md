# agent/ — 智能体共享资源

本目录存放**构建期**由所有智能体共用的资源，作为单一数据源被后端引用。修改后需要重新编译 Rust 主程序（`include_str!` 在编译期内嵌内容）。

| 文件 | 用途 | 消费方 |
| --- | --- | --- |
| `SKILL.md` | 通用角色指令与决策协议：定位、聊天、语气节奏、@ 回应、JSON 输出字段、经历维护。**强制注入**每次模型请求的 system prompt 最前，不对外展示、不可编辑，优先级高于智能体自身 `skill`。 | `src-tauri/src/storage/configuration.rs`（`BASE_SKILL`） |
| `hints.json` | 少量短提示词：`repair`（格式不合规重试）、`split`（过长候选的精简提示）。 | `src-tauri/src/runtime/decision.rs`（`hints()`） |
| `agents.json` | 两个内置默认智能体（小墨、云深不知处）的结构化人设：姓名、性别、语言风格（含完整人设描述）、八个人格维度。 | `src-tauri/src/storage/configuration.rs`（新建数据库时种子写入） |
| `experience.template.md` | 经历文件的格式、评分规则与示例模板。 | 文档；运行时由经历模块按此格式生成 |
| `chat_corpus_zh/`（本地目录，不入源码） | 用户自行下载的中文聊天语料，仅用于本地训练与评估；不随应用分发、不上传。 | `agent/train_chat_style.py`（手动运行） |

## 本地聊天风格校准

`agent/train_chat_style.py` 是独立编写的本地训练工具，不是生成式大模型。它从 `chat_corpus_zh/` 中流式抽样多个来源的人类回复：豆瓣多轮、贴吧回帖、微博回复、PTT 问答、青云语料；清洗隐私、广告与机器人文本后，用轻量逻辑回归学习“自然短回复”与“冗长、点评、模板共情、堆语气词、逻辑连接词”的边界，并输出长度/句式聚合画像。豆瓣按原文件分流，其余来源按稳定哈希分流，跨来源全局去重。

训练只使用标准库，不联网；产物 `chat-style/model.json` 只包含数值参数，`report.json` 含来源统计、评估指标与聚合画像，不含例句、词表、聊天记录或语料路径。

```bash
python -I agent/train_chat_style.py \
  --corpus agent/chat_corpus_zh \
  --output "<应用数据目录>/chat-style/model.json" \
  --samples 20000 \
  --evaluate-db "<应用数据目录>/chat.sqlite3"
```

`--sources douban,tieba` 可只跑部分来源。单来源读取超过 400MB 或 50 万条去重正例时会停止并截断，`report.json` 的 `sources.<name>.truncated` 会标记为 true。应用每次决策读取 model.json：长度预算由语料分位数派生（每条上限约为 p90 的 70%，再夹在 18–32 字），缺失或损坏时退回内置 28 字/36 字上限。模型只用于本地判断候选是否需要精简，不把语料原句或训练样本放进提示词，也不上传到模型服务。

运行时是三层防线：提示词（`SKILL.md`）→ 本地判别（model.json + 套话/连接词/文艺腔/点评与附和/段落/重复开头规则）→ 两轮递增改写与确定性修剪（仍不合规则只保留合规短句，必要时改为 `observe`）。判别器 `feature_version: 2`，共 12 维；新增的两维统计「评价对方措辞」（绝了、这比喻、说得对）和「无主观附和」（确实、真的假的、哈哈哈）。`enforce` 也会用同一判定拦截这类输出，避免判别器只打分不拦截。

话题疲劳由模型在决策 JSON 里自评 `topic_fatigue`（0–100），代码按阈值收敛：≥80 且未被 @ 时改为 `observe`，≥60 时最多发一条；本地不做字符串相似度算法。空闲节奏同样由人格活跃度驱动，冷场目标不会再随一次长假一路拉长到 45 分钟。

**为什么不做离线生成大模型：** 主回复由远端模型生成，本地再训 0.5B–1.5B 模型，质量、硬件占用与多语言稳定性都不划算；真正的短板是“说太长、太像说明文”，用统计校准 + 硬约束 + 改写更直接。若未来要做，必须满足：只用授权清晰的语料、训练集不上传、只分发量化后的模型权重，并在 README 标注来源与许可证。

**“持续训练”的边界：** 这是可重复的离线重训流程，不是应用运行中自动吸收用户聊天或模型输出。不要把 AI 自己的文艺回复回灌为“真人样本”；重训后应以独立留出集和人工抽检确认没有把正常短句误判为 AI 味。

**语料与许可：** `chat_corpus_zh/` 来自 [chinese-chatbot-corpus](https://github.com/codemayq/chinese-chatbot-corpus)（Apache-2.0）的汇总，但其许可证不替代每条被爬取内容的授权；各来源（豆瓣、贴吧、微博、PTT、青云、字幕、合成数据）的许可与隐私风险不一致。本仓库不复制、不提交、不分发原始语料或训练样本，`agent/chat_corpus_zh/` 已被 `.gitignore` 排除；是否用于本地研究请自行确认来源条款。`chatterbot`（问答）、`xiaohuangji`（机器人）、`subtitle`（影视对白）、`sms`（隐私风险）、`synthesized`（合成数据）未用作人类正例。

**外部参考（仅研究思路，未复制源码）：** Imprint（人格校准层，把偏好转成纯文本注入系统提示词）、CPR / Conversational Pattern Restoration（用短句节奏、轻度幽默、简短确认等模式修复 RLHF 造成的平直腔）、[chinese-chatbot-corpus](https://github.com/codemayq/chinese-chatbot-corpus)。

## 与运行时目录的区别

- **本目录**：随应用源码分发、只读、全局共享。
- **运行时目录** `<应用数据目录>/data/agents/<agent_id>/`：**每个智能体一份**，可写，存放 `config.json`、`experience.md`、`cache/`。由后端经历模块创建与维护，不属于本仓库。

## 约束

1. 通用 SKILL 与智能体自身 `skill` 是两层：前者由后端强制注入且不可被覆盖，后者仅作为人格补充，不得包含与前者冲突的指令。
2. `agents.json` 只影响**新建数据库**。已有本地数据库不会重新种子化，避免覆盖用户数据。
3. 人设一旦确定，后续应持续维护一致性；如需调整，改本文件而非散落在代码里的字符串。
4. **提示词一律写在本目录**，不要硬编码进 Rust 源码。长文本用 `.md`，几条短提示用 `hints.json`。
