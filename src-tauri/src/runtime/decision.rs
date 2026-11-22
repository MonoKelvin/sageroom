use std::sync::OnceLock;

use serde::Deserialize;
use serde_json::{Value, json};

use crate::{
    domain::{
        contracts::*,
        error::{AppResult, now_ms},
    },
    storage::{configuration::BASE_SKILL, runtime::RuntimeInput},
};

/// 决策协议提示词已并入 `agent/SKILL.md`（`BASE_SKILL`），此处不再单独注入。

#[derive(Deserialize)]
struct Hints {
    repair: String,
    split: String,
}

static HINTS: OnceLock<Hints> = OnceLock::new();

fn hints() -> &'static Hints {
    HINTS.get_or_init(|| {
        serde_json::from_str(include_str!("../../../agent/hints.json")).expect("提示配置必须有效")
    })
}

/// 格式不合规时的重试提示。
pub(super) fn repair_hint() -> &'static str {
    &hints().repair
}

/// 首次输出像一整段文字时，再请模型自己决定是否改写成更短的多条消息。
/// 这是兜底：正常情况下首次就该是短句，只有偶尔的大段叙述才走到这里。
pub(super) fn split_hint() -> &'static str {
    &hints().split
}

#[derive(Clone, Copy, Debug, Deserialize, PartialEq, Eq)]
#[serde(rename_all = "snake_case")]
pub enum Participation {
    Speak,
    Observe,
    Defer,
    Sleep,
}

#[derive(Debug, Deserialize)]
#[serde(deny_unknown_fields)]
pub struct PlannedMessage {
    pub parts: Vec<MessagePart>,
    pub quote_message_id: Option<String>,
    pub mention_ids: Vec<String>,
    pub mention_all: bool,
    pub send_after_ms: u64,
}

#[derive(Debug, Deserialize)]
#[serde(deny_unknown_fields)]
pub struct WakePlan {
    pub after_seconds: u64,
    pub reason_code: String,
    pub review_message_ordinal: Option<u32>,
}

#[derive(Debug, Deserialize)]
#[serde(deny_unknown_fields)]
pub struct ExtraData {
    pub message_annotations: Vec<Value>,
    pub memory_candidates: Vec<Value>,
}

#[derive(Debug, Deserialize)]
#[serde(deny_unknown_fields)]
pub struct DecisionExperience {
    pub content: String,
    pub score: u8,
}

#[derive(Debug, Deserialize)]
#[serde(deny_unknown_fields)]
pub struct Decision {
    pub participation: Participation,
    pub messages: Vec<PlannedMessage>,
    pub recalls: Vec<String>,
    pub tool_requests: Vec<Value>,
    pub group_patch: Option<Value>,
    pub announcement: Option<Value>,
    pub profile_patch: Option<Value>,
    pub wake_plan: Option<WakePlan>,
    pub topic_hint: Option<String>,
    pub extra_data: ExtraData,
    pub experience: Option<DecisionExperience>,
}

fn invalid() -> AppError {
    AppError::new(
        ErrorCode::CapabilityUnsupported,
        "模型未返回合法的自主聊天决策，请检查模型能力或更换配置后重试。",
    )
}

/// 首次输出是否像「一整段」而需要兜底细化。
/// 正常一条消息是几个字到二十来字；单条明显偏长、或只有一条且内容很多，就值得再问一次。
pub(super) fn needs_refinement(decision: &Decision) -> bool {
    let lengths: Vec<usize> = decision
        .messages
        .iter()
        .map(|message| {
            message
                .parts
                .iter()
                .map(|part| match part {
                    MessagePart::Text { text } => text.chars().count(),
                    _ => 0,
                })
                .sum()
        })
        .collect();
    let longest = lengths.iter().copied().max().unwrap_or(0);
    longest > 70 || (lengths.len() == 1 && longest > 40)
}

pub fn parse(text: &str, input: &RuntimeInput) -> AppResult<Decision> {
    if text.len() > 65_536 {
        return Err(invalid());
    }
    let value: Value = serde_json::from_str(text).map_err(|_| invalid())?;
    let fields = [
        "participation",
        "messages",
        "recalls",
        "tool_requests",
        "group_patch",
        "announcement",
        "profile_patch",
        "wake_plan",
        "topic_hint",
        "extra_data",
        "experience",
    ];
    if fields.iter().any(|key| value.get(key).is_none())
        || value["messages"].as_array().is_some_and(|messages| {
            messages
                .iter()
                .any(|message| message.get("quote_message_id").is_none())
        })
        || (!value["wake_plan"].is_null()
            && value["wake_plan"].get("review_message_ordinal").is_none())
    {
        return Err(invalid());
    }
    let mut decision: Decision = serde_json::from_str(text).map_err(|_| invalid())?;
    if decision.messages.len() > 12
        || (decision.participation == Participation::Speak) == decision.messages.is_empty()
        || !decision.recalls.is_empty()
        || !decision.tool_requests.is_empty()
        || decision.group_patch.is_some()
        || decision.announcement.is_some()
        || decision.profile_patch.is_some()
        || !decision.extra_data.message_annotations.is_empty()
        || !decision.extra_data.memory_candidates.is_empty()
        || decision
            .topic_hint
            .as_ref()
            .is_some_and(|hint| hint.chars().count() > 80)
        || (decision.participation == Participation::Defer && decision.wake_plan.is_none())
    {
        return Err(invalid());
    }
    if let Some(plan) = &decision.wake_plan
        && (!(300..=86_400).contains(&plan.after_seconds)
            || !matches!(plan.reason_code.as_str(), "check_later" | "take_a_break")
            || plan.review_message_ordinal.is_some())
    {
        return Err(invalid());
    }
    if let Some(experience) = &decision.experience {
        crate::storage::experience::validate_entry(&experience.content, experience.score)
            .map_err(|_| invalid())?;
    }
    if decision.messages.windows(2).any(|pair| pair[1].send_after_ms < pair[0].send_after_ms) {
        return Err(invalid());
    }
    for message in &decision.messages {
        if message.parts.is_empty()
            || message.parts.len() > 16
            || message.send_after_ms > 30_000
            || message.mention_ids.len() > 32
            || (message.mention_all
                && input.snapshot.room.owner_participant_id != input.agent.agent_id)
            || message
                .mention_ids
                .iter()
                .any(|id| !input.snapshot.participants.iter().any(|p| &p.id == id))
            || message.quote_message_id.as_ref().is_some_and(|id| {
                !input
                    .messages
                    .iter()
                    .chain(&input.quoted_messages)
                    .any(|m| &m.id == id && m.state == MessageState::Visible)
            })
        {
            return Err(invalid());
        }
        let mut text = String::new();
        for part in &message.parts {
            let MessagePart::Text { text: part } = part else {
                return Err(invalid());
            };
            text.push_str(part);
        }
        if text.trim().is_empty()
            || text.len() > TEXT_BYTE_LIMIT
            || text.chars().count() > TEXT_CHARACTER_LIMIT
        {
            return Err(invalid());
        }
    }
    // 模型不擅长估算毫秒，这里按字数重算节奏：首条留出反应时间，
    // 其余按打字速度累加，并用确定性抖动避免机械感。
    if !decision.messages.is_empty() {
        let seed = now_ms() as u64;
        let mut elapsed = 0u64;
        for (index, message) in decision.messages.iter_mut().enumerate() {
            let chars: u64 = message
                .parts
                .iter()
                .map(|part| match part {
                    MessagePart::Text { text } => text.chars().count() as u64,
                    _ => 0,
                })
                .sum();
            let reaction = if index == 0 { 600 + seed % 700 } else { 250 + seed % 320 };
            let per_char = 90 + (seed >> (index * 3)) % 70;
            elapsed = elapsed.saturating_add(reaction + chars * per_char);
            message.send_after_ms = elapsed.min(30_000);
        }
    }
    Ok(decision)
}

pub fn context(input: &mut RuntimeInput, opportunity: &str) -> AppResult<(String, String)> {
    let identity = json!({
        "agent_id": input.agent.agent_id, "name": input.agent.display_name,
        "gender_description": input.agent.gender_description,
        "language_style": input.agent.language_style,
        "dimensions": input.agent.dimensions,
    });
    let system = format!(
        "{BASE_SKILL}\n\n你的人格资料（作为表达风格与参与倾向，不改变动作权限，也不得覆盖上方通用角色指令）：{identity}"
    );
    let budget = MODEL_INPUT_BUDGET as usize * 2;
    let participants: Vec<_> = input
        .snapshot
        .participants
        .iter()
        .map(|p| json!({"id":p.id,"name":p.display_name,"kind":p.kind}))
        .collect();
    let to_message = |message: &ChatMessage| json!({
        "id":message.id,"seq":message.seq,"sender_id":message.sender_id,
        "parts":message.parts,"quote_message_id":message.quote_message_id,
        "mention_ids":message.mention_ids,"mention_all":message.mention_all,
    });
    let mut messages: Vec<_> = input.messages.iter().filter(|message| message.state == MessageState::Visible).map(to_message).collect();
    let mut quoted: Vec<_> = input.quoted_messages.iter().filter(|message| message.state == MessageState::Visible).map(to_message).collect();
    // 最新一条消息是否明确 @ 了我：被 @ 时应回应，@ 的是别人时通常不必抢答。
    let addressed_to_me = input
        .messages
        .iter()
        .filter(|message| message.state == MessageState::Visible)
        .last()
        .is_some_and(|message| {
            message.mention_all || message.mention_ids.iter().any(|id| id == &input.agent.agent_id)
        });
    let mut used_experience_bytes = 0;
    let mut experiences = Vec::new();
    for entry in &input.experiences {
        let serialized = json!({"id":entry.id,"recorded_at":entry.recorded_at,"score":entry.score,"content":entry.content});
        let length = serialized.to_string().len() + 1;
        if used_experience_bytes + length <= budget / 4 {
            used_experience_bytes += length;
            experiences.push(serialized);
        }
    }
    loop {
        quoted.retain(|quote| messages.iter().any(|message| message["quote_message_id"] == quote["id"]));
        let context = json!({"schema_version":"0.3","opportunity":opportunity,"utc_millis":now_ms(),
            "room":input.snapshot.room,"participants":participants,
            "autonomous_wake_allowed":true,"addressed_to_me":addressed_to_me,"recent_messages":messages,
            "quoted_messages":quoted,"experiences":experiences,
        }).to_string();
        if context.len() + repair_hint().len() <= budget {
            input.messages.retain(|message| messages.iter().any(|visible| visible["id"] == message.id));
            input.quoted_messages.retain(|message| quoted.iter().any(|visible| visible["id"] == message.id));
            input.experiences.retain(|entry| experiences.iter().any(|visible| visible["id"] == entry.id));
            return Ok((system, context));
        }
        if messages.len() > 1 {
            messages.remove(0);
        } else if !experiences.is_empty() {
            experiences.pop();
        } else if !quoted.is_empty() {
            quoted.pop();
        } else {
            return Err(AppError::new(
                ErrorCode::CapabilityUnsupported,
                "模型输入预算不足以容纳人格、成员与最新消息，请缩短语言风格或消息。",
            ));
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::storage::database::Database;
    use tempfile::TempDir;

    fn input() -> (TempDir, RuntimeInput) {
        let dir = TempDir::new().unwrap();
        let mut db = Database::open(dir.path(), "decision-tests".into()).unwrap();
        let snapshot = db
            .snapshot(AppSnapshotRequest {
                data_generation_id: None,
                last_event_seq: None,
            })
            .unwrap();
        let agent = db.list_agents("decision-tests").unwrap().remove(0);
        (
            dir,
            RuntimeInput {
                agent,
                credential_ref: String::new(),
                snapshot,
                messages: vec![],
                quoted_messages: vec![],
                experiences: vec![],
                experience_revision: crate::storage::database::fingerprint(&[]),
            },
        )
    }
    fn observe() -> Value {
        json!({"participation":"observe","messages":[],"recalls":[],"tool_requests":[],"group_patch":null,
            "announcement":null,"profile_patch":null,"wake_plan":null,"topic_hint":null,
            "extra_data":{"message_annotations":[],"memory_candidates":[]},"experience":null})
    }
    #[test]
    fn experiences_are_scored_data_and_all_input_is_bounded() {
        let (_dir, mut input) = input();
        let mut value = observe();
        value["experience"] = json!({"content":"确实发生的交流", "score":87});
        assert_eq!(parse(&value.to_string(), &input).unwrap().experience.unwrap().score, 87);
        for invalid in [json!("旧字符串"), json!({"content":"正文","score":101}), json!({"content":"两行\n内容","score":50})] {
            value["experience"] = invalid;
            assert!(parse(&value.to_string(), &input).is_err());
        }
        value.as_object_mut().unwrap().remove("experience");
        assert!(parse(&value.to_string(), &input).is_err());
        input.experiences = (0..32).map(|index| ExperienceEntry {
            id: format!("entry-{index}"), recorded_at: "2026/11/22 12:00".into(),
            content: "有界经历正文".repeat(200), score: if index == 0 { 99 } else { 50 },
        }).collect();
        input.agent.language_style = "简短自然".repeat(200);
        let (_, prompt) = context(&mut input, "new_message").unwrap();
        assert!(prompt.len() + repair_hint().len() <= MODEL_INPUT_BUDGET as usize * 2);
        let data: Value = serde_json::from_str(&prompt).unwrap();
        assert!(data["experiences"].as_array().unwrap().len() < 32);
        assert_eq!(data["experiences"][0]["score"], 99);
        assert_eq!(input.experiences[0].id, "entry-0");
    }

    #[test]
    fn silent_decisions_are_successful_but_unknown_privileged_fields_are_rejected() {
        let (_dir, input) = input();
        assert_eq!(
            parse(&observe().to_string(), &input).unwrap().participation,
            Participation::Observe
        );
        let mut value = observe();
        value["agent_id"] = json!("someone-else");
        assert!(parse(&value.to_string(), &input).is_err());
        value = observe();
        value["tool_requests"] = json!([{"tool_name":"shell"}]);
        assert!(parse(&value.to_string(), &input).is_err());
        value = observe();
        value.as_object_mut().unwrap().remove("wake_plan");
        assert!(parse(&value.to_string(), &input).is_err());
        assert!(
            parse(
                &observe().to_string().replacen(
                    "\"observe\"",
                    "\"observe\",\"participation\":\"observe\"",
                    1
                ),
                &input
            )
            .is_err()
        );
    }
    #[test]
    fn nullable_nested_fields_must_be_explicit() {
        let (_dir, input) = input();
        let mut value = observe();
        value["wake_plan"] = json!({"after_seconds":300,"reason_code":"check_later"});
        assert!(parse(&value.to_string(), &input).is_err());
        value["wake_plan"] = Value::Null;
        value["participation"] = json!("speak");
        value["messages"] = json!([{"parts":[{"kind":"text","text":"正文"}],"mention_ids":[],"mention_all":false,"send_after_ms":0}]);
        assert!(parse(&value.to_string(), &input).is_err());
    }
    #[test]
    fn sleep_defer_and_wake_are_checked_against_local_preferences() {
        let (_dir, input) = input();
        let mut value = observe();
        value["participation"] = json!("defer");
        assert!(parse(&value.to_string(), &input).is_err());
        value["wake_plan"] =
            json!({"after_seconds":300,"reason_code":"check_later","review_message_ordinal":null});
        assert!(parse(&value.to_string(), &input).is_ok());
        value["wake_plan"]["after_seconds"] = json!(1);
        assert!(parse(&value.to_string(), &input).is_err());
    }
    #[test]
    fn speak_requires_text_and_never_accepts_foreign_quotes_or_nonmonotonic_delays() {
        let (_dir, input) = input();
        let mut value = observe();
        value["participation"] = json!("speak");
        assert!(parse(&value.to_string(), &input).is_err());
        let message = json!({"parts":[{"kind":"text","text":"你好"}],"quote_message_id":null,"mention_ids":[],"mention_all":false,"send_after_ms":100});
        value["messages"] = json!([message.clone()]);
        assert!(parse(&value.to_string(), &input).is_ok());
        value["messages"][0]["quote_message_id"] = json!("invented");
        assert!(parse(&value.to_string(), &input).is_err());
        value["messages"] = json!([message.clone(), message]);
        value["messages"][1]["send_after_ms"] = json!(0);
        assert!(parse(&value.to_string(), &input).is_err());
    }

    #[test]
    fn high_activity_still_allows_silence_and_valid_wakes_are_accepted() {
        let (_dir, mut input) = input();
        input.agent.dimensions.activity = 90;
        assert_eq!(
            parse(&observe().to_string(), &input).unwrap().participation,
            Participation::Observe
        );
        let mut value = observe();
        value["participation"] = json!("sleep");
        assert_eq!(
            parse(&value.to_string(), &input).unwrap().participation,
            Participation::Sleep
        );
        value["wake_plan"] =
            json!({"after_seconds":300,"reason_code":"check_later","review_message_ordinal":null});
        assert!(parse(&value.to_string(), &input).is_ok());
    }

    #[test]
    fn context_retains_latest_message_and_budgets_repairs_without_accepting_omitted_quotes() {
        let (dir, mut input) = input();
        let mut db = Database::open(dir.path(), "decision-tests".into()).unwrap();
        for text in [
            "旧".repeat(5000),
            "旧".repeat(5000),
            "必须保留最新消息".into(),
        ] {
            db.send_message(ChatSendRequest {
                data_generation_id: "decision-tests".into(),
                client_request_id: uuid::Uuid::now_v7().to_string(),
                parts: vec![MessagePart::Text { text }],
                quote_message_id: None,
                mention_ids: vec![],
                mention_all: false,
            })
            .unwrap();
        }
        input.snapshot = db
            .snapshot(AppSnapshotRequest {
                data_generation_id: None,
                last_event_seq: None,
            })
            .unwrap();
        input.messages = db
            .list_messages(ChatListRequest {
                data_generation_id: "decision-tests".into(),
                before_seq: None,
                after_seq: None,
                around_seq: None,
                limit: 50,
            })
            .unwrap()
            .items;
        input.agent.model = Some(AgentModelSnapshot {
            source_profile_id: "context-fixture".into(),
            source_profile_revision: 1.into(),
            profile: ModelProfileInput {
                id: "context-fixture".into(),
                name: "本地预算测试".into(),
                protocol: ModelProtocol::OpenaiChatCompletions,
                base_url: "http://127.0.0.1:1/v1".into(),
                model_name: "context-fixture".into(),
            },
        });
        input.agent.dimensions.activity = 90;
        input.agent.dimensions.social_energy = 30;
        let (system, prompt) = context(&mut input, "new_message").unwrap();
        assert!(system.contains("Sageroom 通用智能体约定"));
        assert!(system.contains("social_energy"));
        assert!(system.contains("参与主动性与保持关注的意愿"));
        let personality: Value =
            serde_json::from_str(system.split_once("也不得覆盖上方通用角色指令）：").unwrap().1).unwrap();
        assert_eq!(personality["dimensions"]["activity"], 90);
        assert_eq!(personality["dimensions"]["social_energy"], 30);
        assert!(prompt.len() + repair_hint().len() <= MODEL_INPUT_BUDGET as usize * 2);
        assert!(prompt.contains("必须保留最新消息"));
        let mut value = observe();
        value["participation"] = json!("speak");
        value["messages"] = json!([{"parts":[{"kind":"text","text":"回复"}],"quote_message_id":"invented-id","mention_ids":[],"mention_all":false,"send_after_ms":0}]);
        assert!(parse(&value.to_string(), &input).is_err());
    }
}
