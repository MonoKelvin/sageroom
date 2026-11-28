use std::{collections::HashSet, fs::File, io::Read, path::Path, sync::LazyLock};

use regex::Regex;
use serde::{Deserialize, Serialize};
use unicode_segmentation::UnicodeSegmentation;

use super::decision::{Decision, Participation};
use crate::{domain::contracts::MessagePart, storage::runtime::RuntimeInput};

const MODEL_BYTE_LIMIT: u64 = 65_536;

static EMOJI: LazyLock<Regex> = LazyLock::new(|| {
    Regex::new(r"[\p{Emoji_Presentation}\u{FE0F}\u{20E3}☺☹❤♥]").expect("表情字符规则必须有效")
});

#[derive(Serialize)]
pub(super) struct Policy {
    pub mode: &'static str,
    pub preferred_chars: [u32; 2],
    pub max_message_chars: u32,
    pub max_total_chars: u32,
    pub max_messages: usize,
    pub emoji_limit: usize,
    #[serde(skip)]
    pub(super) addressed: bool,
}

impl Default for Policy {
    fn default() -> Self {
        Self {
            mode: "casual",
            preferred_chars: [6, 20],
            max_message_chars: 160,
            max_total_chars: 240,
            max_messages: 3,
            emoji_limit: 1,
            addressed: false,
        }
    }
}

#[derive(Serialize)]
pub(super) struct Assessment {
    pub message_chars: Vec<u32>,
    pub total_chars: u32,
    pub over_message_limit: bool,
    pub over_total_limit: bool,
    pub too_many_messages: bool,
}

#[derive(Deserialize)]
struct LengthChars {
    median: u32,
    p75: u32,
    p90: u32,
}

fn load_length_chars(path: &Path) -> Option<LengthChars> {
    #[derive(Deserialize)]
    struct Calibration {
        length_chars: LengthChars,
    }

    let mut bytes = Vec::new();
    File::open(path)
        .ok()?
        .take(MODEL_BYTE_LIMIT + 1)
        .read_to_end(&mut bytes)
        .ok()?;
    if bytes.len() as u64 > MODEL_BYTE_LIMIT {
        return None;
    }
    let Calibration { length_chars } = serde_json::from_slice(&bytes).ok()?;
    (length_chars.median >= 4
        && length_chars.median <= length_chars.p75
        && length_chars.p75 <= length_chars.p90
        && length_chars.p90 <= 256)
        .then_some(length_chars)
}

pub(super) fn for_input(input: &RuntimeInput, opportunity: &str, addressed: bool) -> Policy {
    let mut policy = Policy {
        addressed,
        ..Policy::default()
    };
    if opportunity == "idle_tick" {
        policy.mode = "idle";
        policy.preferred_chars = [10, 28];
        policy.max_message_chars = 48;
        policy.max_total_chars = 48;
        policy.max_messages = 1;
    } else if let Some(length_chars) = load_length_chars(
        &Path::new(&input.snapshot.data_directory).join("chat-style/v3/model.json"),
    ) {
        policy.preferred_chars = [
            (length_chars.median / 2).clamp(4, 10),
            length_chars.p75.clamp(policy.preferred_chars[1], 26),
        ];
    }
    policy
}

impl Policy {
    pub(super) fn assess(&self, decision: &Decision) -> Option<Assessment> {
        if decision.participation != Participation::Speak {
            return None;
        }
        let message_chars: Vec<_> = decision
            .messages
            .iter()
            .map(|message| body(&message.parts).chars().count() as u32)
            .collect();
        let total_chars = message_chars.iter().sum();
        let assessment = Assessment {
            over_message_limit: message_chars
                .iter()
                .any(|&length| length > self.max_message_chars),
            over_total_limit: total_chars > self.max_total_chars,
            too_many_messages: message_chars.len() > self.max_messages,
            message_chars,
            total_chars,
        };
        (assessment.over_message_limit
            || assessment.over_total_limit
            || assessment.too_many_messages)
            .then_some(assessment)
    }

    pub(super) fn enforce(&self, decision: &mut Decision) {
        if decision.participation != Participation::Speak {
            return;
        }
        let review = decision
            .wake_plan
            .as_mut()
            .filter(|plan| plan.reason_code == "self_review");
        let review_target = review.as_ref().and_then(|plan| plan.review_message_ordinal);
        let mut review_ordinal = None;
        let mut ordinal = 0;
        let mut total = 0;
        let mut kept = 0;
        let mut seen = HashSet::new();
        let mut remaining_emoji = self.emoji_limit;
        decision.messages.retain_mut(|message| {
            let original_ordinal = ordinal;
            ordinal += 1;
            if kept == self.max_messages {
                return false;
            }
            let original = body(&message.parts);
            let mut left = remaining_emoji;
            let text = limit_emoji(&original, &mut left);
            let length = text.chars().count() as u32;
            if text.trim().is_empty()
                || length > self.max_message_chars
                || total + length > self.max_total_chars
                || seen.contains(&original)
                || seen.contains(&text)
            {
                return false;
            }
            if text != original {
                seen.insert(text.clone());
                message.parts = vec![MessagePart::Text { text }];
            }
            seen.insert(original);
            if review_target == Some(original_ordinal) {
                review_ordinal = Some(kept as u32);
            }
            remaining_emoji = left;
            total += length;
            kept += 1;
            true
        });
        if decision.messages.is_empty() {
            decision.participation = Participation::Observe;
        }
        // 仅在原目标保留时回看，并使用过滤后的发信序号。
        if let Some(plan) = review {
            plan.review_message_ordinal = review_ordinal;
            if review_ordinal.is_none() {
                decision.wake_plan = None;
            }
        }
    }
}

fn limit_emoji(text: &str, remaining: &mut usize) -> String {
    if !EMOJI.is_match(text) {
        return text.to_owned();
    }
    let mut clean = String::new();
    for symbol in text.graphemes(true) {
        if !EMOJI.is_match(symbol) {
            clean.push_str(symbol);
        } else if *remaining > 0 {
            clean.push_str(symbol);
            *remaining -= 1;
        } else if symbol.ends_with('\u{20e3}') {
            clean.extend(symbol.chars().take(1));
        }
    }
    clean
}

pub(super) fn body(parts: &[MessagePart]) -> String {
    parts
        .iter()
        .filter_map(|part| match part {
            MessagePart::Text { text } => Some(text.as_str()),
            _ => None,
        })
        .collect()
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::{domain::contracts::*, storage::database::Database};
    use serde_json::{Value, json};
    use tempfile::TempDir;

    fn decision(texts: &[&str]) -> Decision {
        serde_json::from_value(json!({
            "participation": "speak",
            "messages": texts.iter().map(|text| json!({"parts":[{"kind":"text","text":text}]})).collect::<Vec<_>>()
        })).unwrap()
    }

    fn input() -> (TempDir, RuntimeInput) {
        let directory = TempDir::new().unwrap();
        let mut database = Database::open(directory.path(), "style-tests".into()).unwrap();
        let snapshot = database
            .snapshot(AppSnapshotRequest {
                data_generation_id: None,
                last_event_seq: None,
            })
            .unwrap();
        let agent = database.list_agents("style-tests").unwrap().remove(0);
        (
            directory,
            RuntimeInput {
                agent,
                snapshot,
                credential_ref: String::new(),
                messages: vec![],
                quoted_messages: vec![],
                tool_turn: None,
                experiences: vec![],
                experience_revision: crate::storage::database::fingerprint(&[]),
            },
        )
    }

    #[test]
    fn normal_budget_does_not_depend_on_message_content() {
        let (_directory, mut input) = input();
        for text in ["好。", "请详细解释一下。", "请不要解释。"] {
            input.messages = vec![ChatMessage {
                id: "style-message".into(),
                seq: 1.into(),
                sender_id: input.snapshot.local_user.id.clone(),
                created_at: 0,
                state: MessageState::Visible,
                parts: vec![MessagePart::Text { text: text.into() }],
                quote_message_id: None,
                mention_ids: vec![],
                mention_all: false,
            }];
            for addressed in [false, true] {
                let policy = for_input(&input, "new_message", addressed);
                assert_eq!(policy.addressed, addressed);
                assert_eq!(policy.mode, "casual");
                assert_eq!(policy.preferred_chars, [6, 20]);
                assert!(
                    policy
                        .assess(&decision(&[&"甲".repeat(160), &"乙".repeat(80)]))
                        .is_none()
                );
            }
        }
    }

    #[test]
    fn assessment_only_reports_budget_overflows() {
        let policy = Policy::default();
        let text = "首先我看看。\n其次这确实有画面感。";
        let mut response = decision(&[text, "在吗？"]);
        assert!(policy.assess(&response).is_none());
        policy.enforce(&mut response);
        assert_eq!(body(&response.messages[0].parts), text);
        assert_eq!(body(&response.messages[1].parts), "在吗？");
        let observe: Decision = serde_json::from_value(json!({"participation":"observe"})).unwrap();
        assert!(policy.assess(&observe).is_none());

        let long = "甲".repeat(161);
        let other = "乙".repeat(80);
        let assessment = policy
            .assess(&decision(&[&long, &other, "丙", "丁"]))
            .unwrap();
        assert_eq!(
            serde_json::to_value(assessment).unwrap(),
            json!({
                "message_chars": [161, 80, 1, 1], "total_chars": 243,
                "over_message_limit": true, "over_total_limit": true, "too_many_messages": true,
            })
        );
    }

    #[test]
    fn idle_allows_one_short_message_without_judging_its_content() {
        let (_directory, input) = input();
        let policy = for_input(&input, "idle_tick", false);
        assert_eq!(policy.mode, "idle");
        let text = "在吗？";
        let mut response = decision(&[text, "我等会儿回来。"]);
        assert!(policy.assess(&response).unwrap().too_many_messages);
        policy.enforce(&mut response);
        assert_eq!(response.messages.len(), 1);
        assert_eq!(body(&response.messages[0].parts), text);
        assert!(policy.assess(&decision(&[&"甲".repeat(48)])).is_none());
        let mut long = decision(&[&"甲".repeat(49)]);
        assert!(policy.assess(&long).unwrap().over_message_limit);
        policy.enforce(&mut long);
        assert_eq!(long.participation, Participation::Observe);
        assert!(long.messages.is_empty());
    }

    #[test]
    fn enforcement_drops_whole_messages_and_keeps_distinct_punctuation() {
        let policy = Policy::default();
        let oversized = "丙".repeat(161);
        let first = "甲".repeat(157);
        let over_total = "乙".repeat(84);
        let mut response = decision(&[
            &oversized,
            &first,
            &over_total,
            "好。",
            "好。",
            "好！",
            "结束",
        ]);
        policy.enforce(&mut response);
        assert_eq!(response.participation, Participation::Speak);
        assert_eq!(
            response
                .messages
                .iter()
                .map(|item| body(&item.parts))
                .collect::<Vec<_>>(),
            [first.as_str(), "好。", "好！"]
        );
    }

    #[test]
    fn self_review_follows_only_the_original_message() {
        let policy = Policy::default();
        for (target, expected) in [(0, Some(0)), (1, None), (2, Some(1))] {
            let mut response = decision(&["收到。", "收到。", "我晚点到。"]);
            response.wake_plan = Some(serde_json::from_value(json!({
                "after_seconds": 30, "reason_code": "self_review", "review_message_ordinal": target,
            })).unwrap());
            policy.enforce(&mut response);
            assert_eq!(response.messages.len(), 2);
            assert_eq!(
                response
                    .wake_plan
                    .map(|plan| plan.review_message_ordinal.unwrap()),
                expected
            );
        }
    }

    #[test]
    fn emoji_budget_counts_graphemes_without_using_text_or_persona_meaning() {
        let policy = Policy::default();
        let first = "晚上九点见\u{1f44b}\u{1f3fb}。";
        let mut response = decision(&[
            first,
            first,
            "这也太离谱了\u{1f926}\u{200d}\u{2642}\u{fe0f}",
            "按 1\u{fe0f}\u{20e3} 确认，© 保留。",
        ]);
        policy.enforce(&mut response);
        assert_eq!(response.messages.len(), 3);
        assert_eq!(body(&response.messages[0].parts), first);
        assert_eq!(body(&response.messages[1].parts), "这也太离谱了");
        assert_eq!(body(&response.messages[2].parts), "按 1 确认，© 保留。");
    }

    #[test]
    fn local_model_calibrates_only_preferred_length() {
        let (directory, mut input) = input();
        input.snapshot.data_directory = directory.path().to_string_lossy().into_owned();
        let model_directory = directory.path().join("chat-style/v3");
        std::fs::create_dir_all(&model_directory).unwrap();
        let path = model_directory.join("model.json");
        assert!(load_length_chars(&path).is_none());
        let file = |length_chars: Value| {
            json!({
                "format_version": 1, "feature_version": 3, "training_samples": 500,
                "weights": [0.0], "threshold": 0.8, "length_chars": length_chars,
            })
        };
        let write =
            |value: Value| std::fs::write(&path, serde_json::to_vec(&value).unwrap()).unwrap();
        write(file(json!({"median":12,"p75":24,"p90":40})));
        let policy = for_input(&input, "new_message", false);
        assert_eq!(policy.preferred_chars, [6, 24]);
        assert_eq!(
            (policy.max_message_chars, policy.max_total_chars),
            (160, 240)
        );
        write(file(json!({"median":20,"p75":40,"p90":60})));
        assert_eq!(
            for_input(&input, "new_message", false).preferred_chars,
            [10, 26]
        );
        assert_eq!(
            for_input(&input, "idle_tick", false).preferred_chars,
            [10, 28]
        );
        for invalid in [
            json!({"median":3,"p75":12,"p90":48}),
            json!({"median":24,"p75":12,"p90":48}),
            json!({"median":12,"p75":24,"p90":23}),
            json!({"median":12,"p75":24,"p90":257}),
            json!({"median":12,"p75":24}),
        ] {
            write(file(invalid));
            assert_eq!(
                for_input(&input, "new_message", false).preferred_chars,
                [6, 20]
            );
        }
        std::fs::write(&path, vec![b' '; MODEL_BYTE_LIMIT as usize + 1]).unwrap();
        assert!(load_length_chars(&path).is_none());
    }
}
