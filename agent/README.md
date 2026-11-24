# agent/ — 智能体共享资源

本目录存放**构建期**由所有智能体共用的资源，作为单一数据源被后端引用。修改后需要重新编译 Rust 主程序（`include_str!` 在编译期内嵌内容）。

| 文件 | 用途 | 消费方 |
| --- | --- | --- |
| `SKILL.md` | 通用角色指令与决策协议：定位、聊天、语气节奏、@ 回应、JSON 输出字段、经历维护。**强制注入**每次模型请求的 system prompt 最前，不对外展示、不可编辑，优先级高于智能体自身 `skill`。 | `src-tauri/src/storage/configuration.rs`（`BASE_SKILL`） |
| `hints.json` | 少量短提示词：`repair`（格式不合规重试）、`split`（过长候选的精简提示）。 | `src-tauri/src/runtime/decision.rs`（`hints()`） |
| `agents.json` | 两个内置默认智能体（小墨、云深不知处）的结构化人设：姓名、性别、语言风格（含完整人设描述）、八个人格维度。 | `src-tauri/src/storage/configuration.rs`（新建数据库时种子写入） |
| `experience.template.md` | 经历文件的格式、评分规则与示例模板。 | 文档；运行时由经历模块按此格式生成 |
| `chat_corpus_zh/`（本地目录，不入源码） | 用户自行下载的中文聊天语料，仅用于本地训练与评估；不随应用分发、不上传。 | `scripts/train_chat_style.py`（手动运行） |

## 本地聊天风格校准

`scripts/train_chat_style.py` 是独立编写的本地训练工具，不是生成式大模型。它从 `chat_corpus_zh/raw_chat_corpus.zip` 中读取豆瓣多轮对话的**人类正例**，清洗隐私与低质文本后，用轻量逻辑回归学习“自然短回复”和“冗长、点评、模板共情、堆语气词”等负例的边界。训练只使用标准库，不联网；产物 `chat-style/model.json` 只包含数值参数，不含例句、词表、聊天记录或语料路径。

```bash
python -I scripts/train_chat_style.py \
  --corpus agent/chat_corpus_zh/raw_chat_corpus.zip \
  --output "<应用数据目录>/chat-style/model.json" \
  --samples 20000
```

应用在每次决策时读取 `<应用数据目录>/chat-style/model.json`；缺失或损坏时退回内置的安全长度与话术规则。模型只用于本地判断候选回复是否需要精简，不把语料原句或训练样本放进提示词，也不上传到模型服务。`--evaluate-db` 仅在你明确指定本地数据库时运行，使用只读连接，只输出统计，不打印 AI 或用户正文。

**“持续训练”的边界：** 这是可重复的离线重训流程，不是应用运行中自动吸收用户聊天或模型输出。不要把 AI 自己的文艺回复回灌为“真人样本”；重训后应以独立留出集和人工抽检确认没有把正常短句误判为 AI 味。

**语料与许可：** `chat_corpus_zh/` 来自外部公开汇总，汇总项目自身的许可证不能替代每条被爬取内容的授权。各来源（豆瓣、贴吧、字幕、合成数据等）的许可和隐私风险并不一致，本仓库不复制、不提交、不分发原始语料或训练样本；是否用于本地研究请自行确认来源条款。`synthesized（大学领域对话数据集）.jsonl` 未被用作人类正例。外部参考（仅研究思路，未复制源码）：[chinese-chatbot-corpus](https://github.com/codemayq/chinese-chatbot-corpus)。

## 与运行时目录的区别

- **本目录**：随应用源码分发、只读、全局共享。
- **运行时目录** `<应用数据目录>/data/agents/<agent_id>/`：**每个智能体一份**，可写，存放 `config.json`、`experience.md`、`cache/`。由后端经历模块创建与维护，不属于本仓库。

## 约束

1. 通用 SKILL 与智能体自身 `skill` 是两层：前者由后端强制注入且不可被覆盖，后者仅作为人格补充，不得包含与前者冲突的指令。
2. `agents.json` 只影响**新建数据库**。已有本地数据库不会重新种子化，避免覆盖用户数据。
3. 人设一旦确定，后续应持续维护一致性；如需调整，改本文件而非散落在代码里的字符串。
4. **提示词一律写在本目录**，不要硬编码进 Rust 源码。长文本用 `.md`，几条短提示用 `hints.json`。
