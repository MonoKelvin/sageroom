use std::{fs::File, io::Read, path::Path};

use serde::{Deserialize, Serialize};

use super::decision::{Decision, Participation};
use crate::{
    domain::contracts::{MessagePart, MessageState},
    storage::runtime::RuntimeInput,
};

const MODEL_BYTE_LIMIT: u64 = 65_536;
const OPENINGS: [&str; 4] = ["诶", "啊", "不是", "哈哈"];
const FILLERS: [&str; 6] = ["诶", "啊啊", "呀", "啦", "嘛", "哈哈"];
const EVALUATIONS: [&str; 9] = [
    "有画面感", "这个比喻", "这个形容", "你这配置", "岁月静好", "体验感拉满", "属实是", "属于那种", "选手",
];
const EMPATHY: [&str; 8] = [
    "听起来", "我理解你的", "我能理解", "感受到你的", "很重要", "很有意义", "太好了", "照顾好自己",
];
const METAPHORS: [&str; 7] = ["仿佛", "宛如", "犹如", "就像", "简直是", "不只是", "更像是"];

#[derive(Serialize)]
pub(super) struct Policy {
    pub mode: &'static str,
    pub preferred_chars: [u32; 2],
    pub max_message_chars: u32,
    pub max_total_chars: u32,
    pub max_messages: usize,
    #[serde(skip)]
    model: Option<Model>,
    #[serde(skip)]
    repeated_opening: Option<&'static str>,
}

impl Default for Policy {
    fn default() -> Self {
        Self {
            mode: "casual",
            preferred_chars: [8, 28],
            max_message_chars: 48,
            max_total_chars: 72,
            max_messages: 2,
            model: None,
            repeated_opening: None,
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
    pub repeated_opening: bool,
    pub formulaic_style: bool,
    pub local_style_score: Option<f64>,
}

#[derive(Deserialize)]
#[serde(deny_unknown_fields)]
struct Model {
    format_version: u32,
    feature_version: u32,
    training_samples: u64,
    means: [f64; 10],
    scales: [f64; 10],
    weights: [f64; 10],
    bias: f64,
    threshold: f64,
    length_chars: LengthChars,
}

#[derive(Deserialize)]
#[serde(deny_unknown_fields)]
struct LengthChars {
    median: u32,
    p75: u32,
    p90: u32,
}

impl Model {
    fn load(path: &Path) -> Option<Self> {
        let mut bytes = Vec::new();
        File::open(path)
            .ok()?
            .take(MODEL_BYTE_LIMIT + 1)
            .read_to_end(&mut bytes)
            .ok()?;
        if bytes.len() as u64 > MODEL_BYTE_LIMIT {
            return None;
        }
        let model: Self = serde_json::from_slice(&bytes).ok()?;
        model.valid().then_some(model)
    }

    fn valid(&self) -> bool {
        self.format_version == 1
            && self.feature_version == 1
            && self.training_samples >= 100
            && self.means.iter().chain(&self.scales).chain(&self.weights)
                .chain([&self.bias, &self.threshold])
                .all(|value| value.is_finite() && value.abs() <= 1000.0)
            && self.scales.iter().all(|scale| *scale > 1e-6)
            && (0.6..1.0).contains(&self.threshold)
            && (4..=256).contains(&self.length_chars.median)
            && self.length_chars.median <= self.length_chars.p75
            && self.length_chars.p75 <= self.length_chars.p90
            && self.length_chars.p90 <= 256
    }

    fn score(&self, features: [f64; 10]) -> f64 {
        let logit = self.bias + features.iter().enumerate().map(|(index, feature)| {
            ((feature - self.means[index]) / self.scales[index]).clamp(-8.0, 8.0)
                * self.weights[index]
        }).sum::<f64>();
        1.0 / (1.0 + (-logit.clamp(-60.0, 60.0)).exp())
    }
}

pub(super) fn for_input(input: &RuntimeInput, opportunity: &str) -> Policy {
    let mut policy = Policy::default();
    policy.model = Model::load(&Path::new(&input.snapshot.data_directory).join("chat-style/model.json"));
    if let Some(model) = &policy.model {
        policy.preferred_chars = [
            (model.length_chars.median / 2).clamp(6, 16),
            model.length_chars.p75.clamp(18, 32),
        ];
        policy.max_message_chars = model.length_chars.p90.clamp(32, 48);
        policy.max_total_chars = (policy.max_message_chars * 2).min(72);
    }
    if opportunity == "idle_tick" {
        policy.mode = "idle";
        policy.preferred_chars = [6, 18];
        policy.max_message_chars = policy.max_message_chars.min(32);
        policy.max_total_chars = 48;
        policy.max_messages = 1;
    } else if input.messages.iter().rev()
        .find(|message| message.state == MessageState::Visible && message.sender_id != input.agent.agent_id)
        .is_some_and(|message| requested_detail(&body(&message.parts)))
    {
        policy.mode = "detail";
        policy.preferred_chars = [32, 96];
        policy.max_message_chars = 160;
        policy.max_total_chars = 240;
    }
    let recent: Vec<_> = input.messages.iter().rev()
        .filter(|message| message.state == MessageState::Visible && message.sender_id == input.agent.agent_id)
        .take(3)
        .map(|message| opening(&body(&message.parts)))
        .collect();
    policy.repeated_opening = OPENINGS.iter().copied()
        .find(|marker| recent.iter().filter(|value| **value == Some(*marker)).count() >= 2);
    policy
}

impl Policy {
    pub(super) fn assess(&self, decision: &Decision) -> Option<Assessment> {
        if decision.participation != Participation::Speak {
            return None;
        }
        let texts: Vec<_> = decision.messages.iter().map(|message| body(&message.parts)).collect();
        let message_chars: Vec<_> = texts.iter().map(|text| text.chars().count() as u32).collect();
        let mut assessment = Assessment {
            total_chars: message_chars.iter().sum(),
            over_message_limit: message_chars.iter().any(|length| *length > self.max_message_chars),
            over_total_limit: message_chars.iter().sum::<u32>() > self.max_total_chars,
            too_many_messages: texts.len() > self.max_messages,
            message_chars,
            repeated_opening: false,
            formulaic_style: false,
            local_style_score: None,
        };
        if self.mode != "detail" {
            assessment.repeated_opening = self.repeated_opening.is_some_and(|marker| {
                texts.iter().any(|text| opening(text) == Some(marker))
            });
            if let Some(model) = &self.model {
                let score = texts.iter().map(|text| model.score(features(text)))
                    .fold(0.0_f64, f64::max);
                assessment.local_style_score = Some(score);
                assessment.formulaic_style = score >= model.threshold;
            } else {
                assessment.formulaic_style = texts.iter().any(|text| fallback_formulaic(text));
            }
        }
        (assessment.over_message_limit || assessment.over_total_limit || assessment.too_many_messages
            || assessment.repeated_opening || assessment.formulaic_style).then_some(assessment)
    }
}

fn body(parts: &[MessagePart]) -> String {
    parts.iter().filter_map(|part| match part {
        MessagePart::Text { text } => Some(text.as_str()),
        _ => None,
    }).collect()
}

fn opening(text: &str) -> Option<&'static str> {
    OPENINGS.iter().copied().find(|marker| text.trim_start().starts_with(marker))
}

fn requested_detail(text: &str) -> bool {
    ["详细", "展开", "解释", "写一首", "讲个故事", "列出", "分析"].iter().any(|keyword| {
        text.contains(keyword)
            && !["不要", "不用", "别"].iter().any(|negative| text.contains(&format!("{negative}{keyword}")))
    })
}

fn occurrences(text: &str, phrases: &[&str]) -> f64 {
    phrases.iter().map(|phrase| text.matches(phrase).count() as f64).sum()
}

fn features(text: &str) -> [f64; 10] {
    let clauses: Vec<_> = text.split(['。', '！', '？', '!', '?', '，', ',', '；', ';', '\n'])
        .filter(|clause| !clause.trim().is_empty()).collect();
    let mut previous = None;
    let mut run = 0u32;
    let mut maximum = 0u32;
    for character in text.chars() {
        run = if previous == Some(character) { run + 1 } else { 1 };
        previous = Some(character);
        maximum = maximum.max(run);
    }
    [
        (1.0 + text.chars().count() as f64).ln(),
        clauses.len() as f64,
        (1.0 + clauses.iter().map(|clause| clause.chars().count()).max().unwrap_or(0) as f64).ln(),
        occurrences(text, &FILLERS),
        text.matches('…').count() as f64 + text.matches("...").count() as f64
            + text.matches('~').count() as f64 + text.matches('～').count() as f64,
        occurrences(text, &EVALUATIONS),
        occurrences(text, &EMPATHY),
        occurrences(text, &METAPHORS),
        maximum.saturating_sub(2) as f64,
        (text.matches('\n').count() + 1) as f64,
    ]
}

fn fallback_formulaic(text: &str) -> bool {
    EVALUATIONS[..6].iter().any(|phrase| text.contains(phrase))
        || (text.chars().count() >= 20 && (
            occurrences(text, &EMPATHY) >= 2.0
            || ["我理解你的", "我能理解", "感受到你的", "照顾好自己"].iter().any(|phrase| text.contains(phrase))
        ))
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
        let snapshot = database.snapshot(AppSnapshotRequest { data_generation_id: None, last_event_seq: None }).unwrap();
        let agent = database.list_agents("style-tests").unwrap().remove(0);
        (directory, RuntimeInput {
            agent, snapshot, credential_ref: String::new(), messages: vec![], quoted_messages: vec![],
            experiences: vec![], experience_revision: crate::storage::database::fingerprint(&[]),
        })
    }

    fn message(seq: i64, sender: &str, text: &str) -> ChatMessage {
        ChatMessage {
            id: format!("style-message-{seq}"), seq: seq.into(), sender_id: sender.into(), created_at: 0,
            state: MessageState::Visible, parts: vec![MessagePart::Text { text: text.into() }],
            quote_message_id: None, mention_ids: vec![], mention_all: false,
        }
    }

    fn model_json() -> Value {
        json!({
            "format_version":1,"feature_version":1,"training_samples":500,
            "means":vec![0.0;10],"scales":vec![1.0;10],"weights":vec![0.0;10],
            "bias":0.0,"threshold":0.8,"length_chars":{"median":12,"p75":24,"p90":40}
        })
    }

    #[test]
    fn plain_short_replies_and_normal_punctuation_do_not_need_revision() {
        let policy = Policy::default();
        for text in ["还没吃饭", "可以，等我一下。", "不是，已经吃过了。", "哈哈，好吧。", "我是参赛选手。"] {
            assert!(policy.assess(&decision(&[text])).is_none(), "{text}");
        }
        let observe: Decision = serde_json::from_value(json!({"participation":"observe"})).unwrap();
        assert!(policy.assess(&observe).is_none());
    }

    #[test]
    fn long_casual_content_and_obvious_commentary_need_revision() {
        let policy = Policy::default();
        assert!(policy.assess(&decision(&[&"长".repeat(49)])).unwrap().over_message_limit);
        assert!(policy.assess(&decision(&["一", "二", "三"])).unwrap().too_many_messages);
        assert!(policy.assess(&decision(&["这个比喻很有画面感，体验感拉满。"])).unwrap().formulaic_style);
    }

    #[test]
    fn explicit_details_allow_length_but_idle_and_simple_questions_remain_short() {
        let (_directory, mut input) = input();
        input.messages.push(message(1, "other", "请详细解释一下。"));
        let policy = for_input(&input, "new_message");
        assert_eq!(policy.mode, "detail");
        assert!(policy.assess(&decision(&[&"说明".repeat(60)])).is_none());
        assert!(policy.assess(&decision(&[&"说明".repeat(81)])).unwrap().over_message_limit);
        assert_eq!(for_input(&input, "idle_tick").mode, "idle");
        for text in ["为什么？", "不要解释，直接告诉我。"] {
            input.messages[0] = message(1, "other", text);
            assert_eq!(for_input(&input, "new_message").mode, "casual");
        }
    }

    #[test]
    fn recurring_own_openings_are_detected_without_serializing_history() {
        let (_directory, mut input) = input();
        let id = input.agent.agent_id.clone();
        input.messages = vec![message(1, &id, "诶，私人经历甲。"), message(2, &id, "诶，私人经历乙。"), message(3, "other", "说什么？")];
        let policy = for_input(&input, "new_message");
        assert!(policy.assess(&decision(&["诶，我还没想好。"])).unwrap().repeated_opening);
        assert!(policy.assess(&decision(&["我还没想好。"])).is_none());
        let serialized = serde_json::to_string(&policy).unwrap();
        for private in ["私人经历", "诶", "model", "weights", "training_samples", "chat-style", &input.snapshot.data_directory] {
            assert!(!serialized.contains(private));
        }
        let assessment = serde_json::to_value(policy.assess(&decision(&["诶，我还没想好。"])).unwrap()).unwrap();
        assert!(assessment.as_object().unwrap().values().all(|value| !value.is_string()));
    }

    #[test]
    fn fixed_feature_extraction_and_numeric_clipping_match_the_training_schema() {
        let vector = features("诶，哈哈哈哈…就像这个比喻。");
        let expected = [15.0_f64.ln(), 2.0, 12.0_f64.ln(), 3.0, 1.0, 1.0, 0.0, 1.0, 2.0, 1.0];
        for (actual, expected) in vector.into_iter().zip(expected) {
            assert!((actual - expected).abs() < 1e-12);
        }
        let mut model: Model = serde_json::from_value(model_json()).unwrap();
        assert_eq!(model.score([0.0; 10]), 0.5);
        model.weights[0] = 1.0;
        let mut large = [0.0; 10];
        large[0] = 1e6;
        assert!((model.score(large) - 1.0 / (1.0 + (-8.0_f64).exp())).abs() < 1e-12);
        model.bias = 1000.0;
        assert!(model.score(large) >= 0.999999999);
        model.bias = -1000.0;
        assert!(model.score(large) < 1e-20);
    }

    #[test]
    fn only_valid_bounded_numeric_models_are_loaded_and_retraining_is_visible() {
        let (_directory, mut input) = input();
        let root = TempDir::new().unwrap();
        input.snapshot.data_directory = root.path().to_string_lossy().into_owned();
        let model_directory = root.path().join("chat-style");
        std::fs::create_dir(&model_directory).unwrap();
        let path = model_directory.join("model.json");
        assert!(Model::load(&path).is_none());
        std::fs::write(&path, serde_json::to_vec(&model_json()).unwrap()).unwrap();
        assert!(Model::load(&path).is_some());
        assert_eq!(for_input(&input, "new_message").max_message_chars, 40);
        let mut updated = model_json();
        updated["length_chars"]["p90"] = json!(48);
        std::fs::write(&path, serde_json::to_vec(&updated).unwrap()).unwrap();
        assert_eq!(for_input(&input, "new_message").max_message_chars, 48);
        for (field, value) in [
            ("format_version", json!(2)), ("feature_version", json!(2)), ("training_samples", json!(99)),
            ("threshold", json!(0.5)), ("threshold", json!(1.0)), ("bias", json!(1e300)),
            ("scales", json!(vec![0.0; 10])), ("means", json!(vec![0.0; 9])),
            ("examples", json!(["原始语料不应进入模型文件"])),
            ("length_chars", json!({"median":24,"p75":12,"p90":48})),
        ] {
            let mut invalid = model_json();
            invalid[field] = value;
            std::fs::write(&path, serde_json::to_vec(&invalid).unwrap()).unwrap();
            assert!(Model::load(&path).is_none(), "{field}");
            assert_eq!(for_input(&input, "new_message").max_message_chars, 48);
        }
        std::fs::write(&path, vec![b' '; MODEL_BYTE_LIMIT as usize + 1]).unwrap();
        assert!(Model::load(&path).is_none());
    }
}
