use std::sync::OnceLock;

use serde::Deserialize;
use serde_json::{Value, json};

use crate::{
    domain::{
        RECALL_WINDOW,
        contracts::*,
        error::{AppResult, now_ms},
    },
    storage::{configuration::BASE_SKILL, runtime::RuntimeInput},
};

use super::style;

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

/// 内容过多时请求精简，而不是拆成更多消息。
pub(super) fn refinement_hint(assessment: &style::Assessment, policy: &style::Policy, attempt: usize) -> String {
    let mut reasons = Vec::new();
    if assessment.over_message_limit { reasons.push("有单条超出字数"); }
    if assessment.over_total_limit { reasons.push("总字数超限"); }
    if assessment.too_many_messages { reasons.push("消息条数过多"); }
    if assessment.repeated_opening { reasons.push("连续用同一个语气词开头"); }
    if assessment.lecture_style { reasons.push("有逻辑连接词或总结式说教"); }
    if assessment.literary_style { reasons.push("有堆砌的比喻或文艺腔"); }
    if assessment.paragraph_style { reasons.push("有换行或过长从句"); }
    if assessment.formulaic_style { reasons.push("整句在点评别人的措辞或只有附和、没有你自己的信息"); }
    let strict = if attempt >= 1 {
        "这次最多只写一条，只留一个信息点；宁可 observe，也不要写成段落。"
    } else {
        ""
    };
    let problems = if reasons.is_empty() { "超出本轮输出预算".to_string() } else { reasons.join("、") };
    format!(
        "{}\n本轮硬限制：每条不超过 {} 字，总共不超过 {} 字，最多 {} 条。上一版问题：{}。{}",
        hints().split,
        policy.max_message_chars,
        policy.max_total_chars,
        policy.max_messages,
        problems,
        strict,
    )
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
    // 以下字段模型经常省略，缺失时用安全默认值兜底，避免整轮决策作废。
    #[serde(default)]
    pub quote_message_id: Option<String>,
    #[serde(default)]
    pub mention_ids: Vec<String>,
    #[serde(default)]
    pub mention_all: bool,
    #[serde(default)]
    pub send_after_ms: u64,
}

#[derive(Debug, Deserialize)]
#[serde(deny_unknown_fields)]
pub struct WakePlan {
    pub after_seconds: u64,
    pub reason_code: String,
    #[serde(default)]
    pub review_message_ordinal: Option<u32>,
}

#[derive(Debug, Default, Deserialize)]
#[serde(deny_unknown_fields)]
pub struct ExtraData {
    #[serde(default)]
    pub message_annotations: Vec<Value>,
    #[serde(default)]
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
    #[serde(default)]
    pub messages: Vec<PlannedMessage>,
    #[serde(default)]
    pub recalls: Vec<String>,
    #[serde(default)]
    pub tool_requests: Vec<Value>,
    #[serde(default)]
    pub group_patch: Option<Value>,
    #[serde(default)]
    pub announcement: Option<Value>,
    #[serde(default)]
    pub profile_patch: Option<Value>,
    #[serde(default)]
    pub wake_plan: Option<WakePlan>,
    // 历史字段，当前未消费；保留兼容但不再要求模型输出。
    #[serde(default)]
    pub topic_hint: Option<String>,
    /// 模型自评的话题疲劳度（0–100）：越高表示当前话题越没新意，追加发言越可能是废话。
    #[serde(default)]
    pub topic_fatigue: Option<u8>,
    #[serde(default)]
    pub extra_data: ExtraData,
    #[serde(default)]
    pub experience: Option<DecisionExperience>,
}

fn invalid() -> AppError {
    // 用可重试的专用错误码：这是「本轮输出不合协议」，不是能力缺失，
    // 若复用 CapabilityUnsupported 会让智能体被判为待配置而永久停摆。
    AppError::new(
        ErrorCode::ModelOutputInvalid,
        "模型未返回合法的自主聊天决策，本轮跳过。",
    )
}

#[cfg(test)]
pub(super) fn needs_refinement(decision: &Decision, policy: &style::Policy) -> bool {
    policy.assess(decision).is_some()
}

pub(super) fn assessment(decision: &Decision, policy: &style::Policy) -> Option<style::Assessment> {
    policy.assess(decision)
}

pub(super) fn addressed_since(input: &RuntimeInput, observed: &DecimalString) -> bool {
    let agent_id = &input.agent.agent_id;
    input.messages.iter().any(|message| {
        message.state == MessageState::Visible
            && &message.sender_id != agent_id
            && super::sequence(&message.seq) > super::sequence(observed)
            && (message.mention_all || message.mention_ids.contains(agent_id)
                || message.quote_message_id.as_ref().is_some_and(|id| {
                    input.messages.iter().chain(&input.quoted_messages).any(|quote| {
                        &quote.id == id && &quote.sender_id == agent_id && quote.state == MessageState::Visible
                    })
                }))
    })
}

pub(super) fn participation_chance(input: &RuntimeInput, addressed: bool, now: i64) -> u64 {
    let agent_id = &input.agent.agent_id;
    let latest = input.messages.iter().rfind(|message| message.state == MessageState::Visible);
    let quote_sender = latest
        .and_then(|message| message.quote_message_id.as_ref())
        .and_then(|id| input.messages.iter().chain(&input.quoted_messages).find(|message| &message.id == id))
        .map(|message| &message.sender_id);
    let one_to_one = input.snapshot.participants.len() == 2
        && latest.is_some_and(|message| &message.sender_id != agent_id);
    if addressed || one_to_one || latest.is_some_and(|message| {
        message.mention_all || message.mention_ids.contains(agent_id)
    }) || quote_sender == Some(agent_id) {
        return 100;
    }
    // 之前基础值只有 20+activity*45/100（activity=70 时 51%），再被「刚说过话」
    // 连除两次，实际不到 15%，于是大量普通消息连让模型判断的机会都没有。
    let mut chance = 35 + u64::from(input.agent.dimensions.activity.min(100)) * 60 / 100;
    if latest.is_some_and(|message| !message.mention_ids.is_empty())
        || quote_sender.is_some_and(|sender| sender != agent_id)
    {
        chance /= 3;
    }
    if let Some(own) = input.messages.iter().rfind(|message| &message.sender_id == agent_id) {
        let age = now.saturating_sub(own.created_at);
        if age < 20_000 {
            chance /= 2;
        } else if age < 60_000 {
            chance = chance * 3 / 4;
        }
    }
    chance.min(95)
}

fn schedule_messages(messages: &mut [PlannedMessage], seed: u64) {
    let mut elapsed = 0u64;
    for (index, message) in messages.iter_mut().enumerate() {
        let body: String = message.parts.iter().filter_map(|part| match part {
            MessagePart::Text { text } => Some(text.as_str()),
            _ => None,
        }).collect();
        let mixed = seed.rotate_right((index as u32 * 7) % 64);
        let per_char = 180 + mixed % 141;
        let pauses = body.chars().filter(|c| matches!(c, '，' | ',' | '。' | '！' | '？' | '!' | '?' | '；' | ';')).count() as u64 * 180;
        let typing = (body.chars().count() as u64 * per_char + pauses).clamp(900, 90_000);
        let gap = if index == 0 { 800 + mixed % 1400 } else { 500 + mixed % 1800 };
        elapsed = elapsed.saturating_add(gap + typing);
        message.send_after_ms = elapsed;
    }
}

pub fn parse(text: &str, input: &RuntimeInput) -> AppResult<Decision> {
    if text.len() > 65_536 {
        return Err(invalid());
    }
    let value: Value = serde_json::from_str(text).map_err(|_| invalid())?;
    // 只要求核心字段存在；其余由 serde 默认值兜底，避免轻量模型漏字段就整轮作废。
    if value.get("participation").is_none() {
        return Err(invalid());
    }
    let mut decision: Decision = serde_json::from_str(text).map_err(|_| invalid())?;
    if decision.messages.len() > 12
        || (decision.participation == Participation::Speak) == decision.messages.is_empty()
        || decision.recalls.len() > 4
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
        // 疲劳度越界说明输出不可信，整轮重试；缺失则视为 0，不给旧模型增加必填负担。
        || decision.topic_fatigue.is_some_and(|value| value > 100)
        || (decision.participation == Participation::Defer && decision.wake_plan.is_none())
    {
        return Err(invalid());
    }
    // 撤回只允许自己本次运行内发出、仍在三分钟窗口内的可见消息。
    let now = now_ms();
    for id in &decision.recalls {
        let eligible = input
            .messages
            .iter()
            .chain(&input.quoted_messages)
            .any(|message| {
                &message.id == id
                    && message.state == MessageState::Visible
                    && message.sender_id == input.agent.agent_id
                    && now.saturating_sub(message.created_at) < RECALL_WINDOW.as_millis() as i64
            });
        if !eligible {
            return Err(invalid());
        }
    }
    if let Some(plan) = &decision.wake_plan {
        let valid = match plan.reason_code.as_str() {
            "check_later" | "take_a_break" => {
                (300..=86_400).contains(&plan.after_seconds) && plan.review_message_ordinal.is_none()
            }
            // 一次性自我回看：绑定本次某条消息，不超出三分钟撤回窗口。
            "self_review" => {
                (1..=90).contains(&plan.after_seconds)
                    && plan
                        .review_message_ordinal
                        .is_some_and(|ordinal| (ordinal as usize) < decision.messages.len())
                    && decision.participation == Participation::Speak
            }
            _ => false,
        };
        if !valid {
            return Err(invalid());
        }
        // defer 必须安排普通的稍后检查，不能借用回看计划。
        if decision.participation == Participation::Defer
            && plan.reason_code == "self_review"
        {
            return Err(invalid());
        }
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
    schedule_messages(&mut decision.messages, uuid::Uuid::now_v7().as_u128() as u64);
    Ok(decision)
}

pub fn context(input: &mut RuntimeInput, opportunity: &str, observed: &DecimalString, policy: &style::Policy) -> AppResult<(String, String)> {
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
        "id":message.id,"seq":message.seq,"sender_id":message.sender_id,"created_at":message.created_at,
        "parts":message.parts,"quote_message_id":message.quote_message_id,
        "mention_ids":message.mention_ids,"mention_all":message.mention_all,
    });
    let mut messages: Vec<_> = input.messages.iter().filter(|message| message.state == MessageState::Visible).map(to_message).collect();
    let mut quoted: Vec<_> = input.quoted_messages.iter().filter(|message| message.state == MessageState::Visible).map(to_message).collect();
    let addressed_to_me = addressed_since(input, observed);
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
            "autonomous_wake_allowed":true,"addressed_to_me":addressed_to_me,"unread_after_seq":observed,"recent_messages":messages,
            "quoted_messages":quoted,"experiences":experiences,"response_style":policy,
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
    fn typing_time_scales_with_length_without_collapsing_later_messages() {
        let (_dir, input) = input();
        let output = |texts: Vec<String>| json!({"participation":"speak","messages":texts.into_iter().map(|text| json!({"parts":[{"kind":"text","text":text}]})).collect::<Vec<_>>()});
        let mut short = parse(&output(vec!["好".into()]).to_string(), &input).unwrap();
        let mut long = parse(&output(vec!["长".repeat(200), "再".repeat(200), "最后一句。".into()]).to_string(), &input).unwrap();
        schedule_messages(&mut short.messages, 0);
        schedule_messages(&mut long.messages, 0);
        assert!(short.messages[0].send_after_ms >= 1700);
        assert!(long.messages[0].send_after_ms > 30_000);
        assert!(long.messages.windows(2).all(|pair| pair[1].send_after_ms > pair[0].send_after_ms));
        assert!(long.messages[2].send_after_ms - long.messages[1].send_after_ms >= 1500);
    }

    #[test]
    fn refinement_targets_excess_content_not_normal_punctuation_or_sentence_length() {
        let (_dir, input) = input();
        let output = |texts: Vec<String>| json!({"participation":"speak","messages":texts.into_iter().map(|text| json!({"parts":[{"kind":"text","text":text}]})).collect::<Vec<_>>()});
        for texts in [vec!["有".repeat(20)], vec!["第一件事。".into(), "另一件事。".into()]] {
            assert!(!needs_refinement(&parse(&output(texts).to_string(), &input).unwrap(), &style::Policy::default()));
        }
        for texts in [vec!["多".repeat(101)], vec!["有".repeat(50); 3], vec!["一句。".into(); 4]] {
            assert!(needs_refinement(&parse(&output(texts).to_string(), &input).unwrap(), &style::Policy::default()));
        }
    }

    #[test]
    fn unsolicited_participation_is_lower_after_speaking_but_mentions_and_quotes_take_priority() {
        let (_dir, mut input) = input();
        let now = now_ms();
        input.agent.dimensions.activity = 100;
        assert_eq!(participation_chance(&input, false, now), 95);
        input.agent.dimensions.activity = 0;
        assert_eq!(participation_chance(&input, false, now), 35);
        input.messages.push(ChatMessage {
            id: "own".into(), seq: 1.into(), sender_id: input.agent.agent_id.clone(),
            created_at: now - 1000, state: MessageState::Visible,
            parts: vec![MessagePart::Text { text: "说过了。".into() }],
            quote_message_id: None, mention_ids: vec![], mention_all: false,
        });
        input.messages.push(ChatMessage {
            id: "other".into(), seq: 2.into(), sender_id: "other".into(),
            created_at: now, state: MessageState::Visible,
            parts: vec![MessagePart::Text { text: "知道了。".into() }],
            quote_message_id: None, mention_ids: vec![], mention_all: false,
        });
        assert_eq!(participation_chance(&input, false, now), 17);
        assert_eq!(participation_chance(&input, true, now), 100);
        input.messages[1].mention_ids = vec!["someone-else".into()];
        assert_eq!(participation_chance(&input, false, now), 5);
        input.messages[1].mention_ids.clear();
        input.messages[1].quote_message_id = Some("own".into());
        assert_eq!(participation_chance(&input, false, now), 100);
        input.messages[1].quote_message_id = None;
        input.snapshot.participants.retain(|participant| participant.kind == ParticipantKind::User || participant.id == input.agent.agent_id);
        assert_eq!(participation_chance(&input, false, now), 100);
    }

    #[test]
    fn topic_fatigue_must_be_a_percentage_and_defaults_to_zero() {
        let (_dir, input) = input();
        let mut value = observe();
        value["topic_fatigue"] = json!(101);
        assert!(parse(&value.to_string(), &input).is_err());
        value["topic_fatigue"] = json!(60);
        let parsed = parse(&value.to_string(), &input).unwrap();
        assert_eq!(parsed.topic_fatigue, Some(60));
        assert_eq!(parse(&observe().to_string(), &input).unwrap().topic_fatigue, None);
    }

    #[test]
    fn unread_mentions_and_quotes_survive_coalescing_even_when_the_latest_message_is_unaddressed() {
        let (_dir, mut input) = input();
        let agent_id = input.agent.agent_id.clone();
        let message = |seq: i64, sender_id: String| ChatMessage {
            id: format!("message-{seq}"), seq: seq.into(), sender_id, created_at: now_ms(),
            state: MessageState::Visible, parts: vec![MessagePart::Text { text: "一件事。".into() }],
            quote_message_id: None, mention_ids: vec![], mention_all: false,
        };
        input.messages = vec![message(1, agent_id.clone()), message(2, "other".into()), message(3, "other".into())];
        input.messages[1].mention_ids.push(agent_id.clone());
        assert!(addressed_since(&input, &1.into()));
        assert!(!addressed_since(&input, &2.into()));
        assert_eq!(participation_chance(&input, addressed_since(&input, &1.into()), now_ms()), 100);
        let (_, prompt) = context(&mut input, "new_message", &1.into(), &style::Policy::default()).unwrap();
        let context: Value = serde_json::from_str(&prompt).unwrap();
        assert_eq!(context["addressed_to_me"], true);
        assert_eq!(context["unread_after_seq"], "1");
        input.messages[1].mention_ids.clear();
        input.messages[1].quote_message_id = Some("message-1".into());
        assert!(addressed_since(&input, &1.into()));
        input.messages[1].state = MessageState::Recalled;
        assert!(!addressed_since(&input, &1.into()));
    }

    #[test]
    fn minimal_model_output_is_accepted() {
        // 轻量模型常见的省略写法：只给核心字段、消息只给 parts。
        // 这些都必须能通过，否则模型会一轮轮失败直到被判为「待配置」。
        let (_dir, input) = input();
        for text in [
            r#"{"participation":"observe"}"#,
            r#"{"participation":"speak","messages":[{"parts":[{"kind":"text","text":"在"}]}]}"#,
            r#"{"participation":"speak","messages":[{"parts":[{"kind":"text","text":"刚忙完"}],"send_after_ms":0}]}"#,
            r#"{"participation":"observe","messages":[],"wake_plan":{"after_seconds":300,"reason_code":"check_later"}}"#,
        ] {
            assert!(parse(text, &input).is_ok(), "应接受最小输出：{text}");
        }
        // 仍然拒绝越权字段：安全边界不能因为宽松而丢失
        assert!(parse(r#"{"participation":"observe","agent_id":"someone"}"#, &input).is_err());
        assert!(
            parse(
                r#"{"participation":"observe","tool_requests":[{"tool_name":"shell"}]}"#,
                &input
            )
            .is_err()
        );
        // speak 却没有消息、或 observe 却带消息，语义矛盾仍要拒绝
        assert!(parse(r#"{"participation":"speak"}"#, &input).is_err());
        assert!(
            parse(
                r#"{"participation":"observe","messages":[{"parts":[{"kind":"text","text":"x"}]}]}"#,
                &input
            )
            .is_err()
        );
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
        // 缺省即「没有经历」：轻量模型常省略字段，不应因此整轮作废
        assert!(parse(&value.to_string(), &input).unwrap().experience.is_none());
        input.experiences = (0..32).map(|index| ExperienceEntry {
            id: format!("entry-{index}"), recorded_at: "2026/11/22 12:00".into(),
            content: "有界经历正文".repeat(200), score: if index == 0 { 99 } else { 50 },
        }).collect();
        input.agent.language_style = "简短自然".repeat(200);
        let (_, prompt) = context(&mut input, "new_message", &0.into(), &style::Policy::default()).unwrap();
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
        // 缺省 wake_plan 视为不做计划；observe 不要求它
        assert!(parse(&value.to_string(), &input).is_ok());
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
        // review_message_ordinal 缺省不再要求显式 null，仅 self_review 才校验
        assert!(parse(&value.to_string(), &input).is_ok());
        value["wake_plan"] = Value::Null;
        value["participation"] = json!("speak");
        // 只写最小消息体（parts + 正文）也应被接受，其余字段由默认值兜底
        value["messages"] = json!([{"parts":[{"kind":"text","text":"正文"}]}]);
        assert!(parse(&value.to_string(), &input).is_ok());
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
        let (system, prompt) = context(&mut input, "new_message", &0.into(), &style::Policy::default()).unwrap();
        assert!(system.contains("Sageroom 通用智能体约定"));
        assert!(system.contains("social_energy"));
        assert!(system.contains("参与主动性与保持关注的意愿"));
        let personality: Value =
            serde_json::from_str(system.split_once("也不得覆盖上方通用角色指令）：").unwrap().1).unwrap();
        assert_eq!(personality["dimensions"]["activity"], 90);
        assert_eq!(personality["dimensions"]["social_energy"], 30);
        assert!(prompt.len() + repair_hint().len() <= MODEL_INPUT_BUDGET as usize * 2);
        assert!(prompt.contains("必须保留最新消息"));
        let style: Value = serde_json::from_str(&prompt).unwrap();
        assert_eq!(style["response_style"]["mode"], "casual");
        assert!(!prompt.contains("weights"));
        assert!(!prompt.contains("training_samples"));
        let mut value = observe();
        value["participation"] = json!("speak");
        value["messages"] = json!([{"parts":[{"kind":"text","text":"回复"}],"quote_message_id":"invented-id","mention_ids":[],"mention_all":false,"send_after_ms":0}]);
        assert!(parse(&value.to_string(), &input).is_err());
    }

#[test]
    fn recalls_only_accept_own_recent_visible_messages_and_self_review_binds_a_target() {
        let (_dir, mut input) = input();
        let agent_id = input.agent.agent_id.clone();
        input.messages.push(ChatMessage {
            id: "own-recent".into(),
            seq: 1_i64.into(),
            sender_id: agent_id.clone(),
            created_at: now_ms(),
            state: MessageState::Visible,
            parts: vec![MessagePart::Text { text: "说错话了".into() }],
            quote_message_id: None,
            mention_ids: vec![],
            mention_all: false,
        });
        let mut value = observe();
        // 撤回自己的近期消息：允许。
        value["recalls"] = json!(["own-recent"]);
        assert!(parse(&value.to_string(), &input).is_ok());
        // 两分钟之后、三分钟以内仍允许撤回。
        input.messages[0].created_at = now_ms() - 150_000;
        assert!(parse(&value.to_string(), &input).is_ok());
        // 达到三分钟或超过三分钟：拒绝。
        for age in [180_000, 180_001] {
            input.messages[0].created_at = now_ms() - age;
            assert!(parse(&value.to_string(), &input).is_err());
        }
        // 别人的消息：拒绝。
        input.messages[0].created_at = now_ms();
        input.messages[0].sender_id = "someone-else".into();
        assert!(parse(&value.to_string(), &input).is_err());

        // self_review 必须绑定本次发言的某条消息。
        let mut speak = observe();
        speak["participation"] = json!("speak");
        speak["messages"] = json!([{"parts":[{"kind":"text","text":"刚说错了"}],"quote_message_id":null,"mention_ids":[],"mention_all":false,"send_after_ms":0}]);
        speak["wake_plan"] = json!({"after_seconds":30,"reason_code":"self_review","review_message_ordinal":0});
        assert!(parse(&speak.to_string(), &input).is_ok());
        speak["wake_plan"]["review_message_ordinal"] = json!(3);
        assert!(parse(&speak.to_string(), &input).is_err());
        // 普通检查不能带 ordinal。
        speak["wake_plan"] = json!({"after_seconds":600,"reason_code":"check_later","review_message_ordinal":0});
        assert!(parse(&speak.to_string(), &input).is_err());
        // self_review 不能与 observe 并用。
        let mut observing = observe();
        observing["wake_plan"] = json!({"after_seconds":30,"reason_code":"self_review","review_message_ordinal":0});
        assert!(parse(&observing.to_string(), &input).is_err());
    }
}
