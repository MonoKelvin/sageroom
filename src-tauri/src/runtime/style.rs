use std::{fs::File, io::Read, path::Path};

use serde::{Deserialize, Serialize};

use super::decision::{Decision, Participation, PlannedMessage};
use crate::{
    domain::contracts::{MessagePart, MessageState},
    storage::runtime::RuntimeInput,
};

const MODEL_BYTE_LIMIT: u64 = 65_536;
const OPENINGS: [&str; 6] = ["诶", "啊", "唉", "嗯", "不是", "哈哈"];
const FILLERS: [&str; 6] = ["诶", "啊啊", "呀", "啦", "嘛", "哈哈"];
// 逻辑连接词与总结式说教：真人闲聊几乎不用，出现即视为书面回答。
const LECTURE_MARKERS: [&str; 12] = [
    "首先", "其次", "再次", "另外", "总的来说", "综上", "说到底",
    "换句话说", "值得注意的是", "不得不说", "一方面", "另一方面",
];
// 堆砌的文艺腔：单个可以是正常用词，成片出现或搭配长句就是 AI 味。
const LITERARY_MARKERS: [&str; 10] = [
    "仿佛", "宛如", "犹如", "像是", "不禁", "悄然", "治愈", "内心深处", "仪式感", "温柔以待",
];
const EVALUATIONS: [&str; 9] = [
    "有画面感", "这个比喻", "这个形容", "你这配置", "岁月静好", "体验感拉满", "属实是", "属于那种", "选手",
];
const EMPATHY: [&str; 8] = [
    "听起来", "我理解你的", "我能理解", "感受到你的", "很重要", "很有意义", "太好了", "照顾好自己",
];
const METAPHORS: [&str; 7] = ["仿佛", "宛如", "犹如", "就像", "简直是", "不只是", "更像是"];
// 点评式发言与无主观附和：真人闲聊里偶尔有，整轮都在评价对方措辞就是机器特征。
const COMMENTARY: [&str; 18] = ["绝了", "这个比喻", "这个形容", "你这配置", "有画面感", "体验感拉满", "说得对", "确实很", "挺合理", "属实是", "太文艺", "不愧是", "好家伙", "妙啊", "太浪漫", "好有意思", "有意思的", "含金量拉满"];
// 真实聊天里「算我一个」「给我留一罐」这类排队报名是零信息附和，
// 和老词表里的「确实/哈哈哈」一样会把对话拖成复读。
const HOLLOW: [&str; 20] = ["哈哈哈哈", "哈哈哈", "确实", "对啊", "对对", "真的假的", "是吗", "然后呢", "我超", "超好奇", "不是吧", "啊这", "哈哈", "算我一个", "我也来", "给我留", "留一罐", "留点呀", "先吃饭", "正等我"];

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
            // 真人在微信里通常一条 5-20 字。上限给到 40 字、三条一轮：
            // 太紧会被逼出一句「确实」「是这样」这种没信息量的应付话，
            // 而且一轮只够说一条，接不上话。
            preferred_chars: [6, 20],
            max_message_chars: 40,
            max_total_chars: 80,
            max_messages: 3,
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
    pub lecture_style: bool,
    pub literary_style: bool,
    pub paragraph_style: bool,
    pub formulaic_style: bool,
    pub local_style_score: Option<f64>,
}

#[derive(Deserialize)]
#[serde(deny_unknown_fields)]
struct Model {
    format_version: u32,
    feature_version: u32,
    training_samples: u64,
    means: [f64; 12],
    scales: [f64; 12],
    weights: [f64; 12],
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
            && self.feature_version == 2
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

    fn score(&self, features: [f64; 12]) -> f64 {
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
            (model.length_chars.median / 2).clamp(4, 10),
            model.length_chars.p75.clamp(12, 20),
        ];
        // 语料 p90 已包含长尾；再打七折，宁可短一点也不写成整段。
        policy.max_message_chars = (model.length_chars.p90 * 7 / 10).clamp(18, 32);
        policy.max_total_chars = (policy.max_message_chars + 8).min(44);
    }
    if opportunity == "idle_tick" {
        policy.mode = "idle";
        policy.preferred_chars = [5, 14];
        // 主动起话也至少说清一件事，否则就是一句「在干嘛」然后把天聊死。
        policy.max_message_chars = policy.max_message_chars.min(26);
        policy.max_total_chars = 40;
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
            lecture_style: false,
            literary_style: false,
            paragraph_style: false,
            formulaic_style: false,
            local_style_score: None,
        };
        if self.mode != "detail" {
            assessment.repeated_opening = self.repeated_opening.is_some_and(|marker| {
                texts.iter().any(|text| opening(text) == Some(marker))
            });
            assessment.lecture_style = texts.iter().any(|text| lecture_style(text));
            assessment.literary_style = texts.iter().any(|text| literary_style(text));
            assessment.paragraph_style = texts.iter().any(|text| paragraph_style(text));
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
            || assessment.repeated_opening || assessment.lecture_style || assessment.literary_style
            || assessment.paragraph_style || assessment.formulaic_style).then_some(assessment)
    }

    /// 改写重试后仍不合规时的确定性兜底：只保留明确合规的短消息；
    /// 全部被裁掉时尝试从首条里取出第一个短句，仍不成句就改为观察。
    pub(super) fn enforce(&self, decision: &mut Decision) {
        if decision.participation != Participation::Speak {
            return;
        }
        let detail = self.mode == "detail";
        let original = std::mem::take(&mut decision.messages);
        let mut kept = Vec::new();
        let mut total = 0u32;
        for message in &original {
            if kept.len() >= self.max_messages {
                break;
            }
            let text = body(&message.parts);
            let length = text.chars().count() as u32;
            if length == 0 || length > self.max_message_chars {
                continue;
            }
            if !detail && (
                self.repeated_opening.is_some_and(|marker| opening(&text) == Some(marker))
                    || lecture_style(&text) || literary_style(&text) || paragraph_style(&text)
                    || self.formulaic(&text)
            ) {
                continue;
            }
            if total + length > self.max_total_chars {
                continue;
            }
            total += length;
            kept.push(PlannedMessage {
                parts: message.parts.clone(),
                quote_message_id: message.quote_message_id.clone(),
                mention_ids: message.mention_ids.clone(),
                mention_all: message.mention_all,
                send_after_ms: message.send_after_ms,
            });
        }
        if kept.is_empty() {
            if let Some(first) = original.first() {
                if let Some(text) = salvage(&body(&first.parts), self.max_message_chars, self.repeated_opening) {
                    kept.push(PlannedMessage {
                        parts: vec![MessagePart::Text { text }],
                        quote_message_id: first.quote_message_id.clone(),
                        mention_ids: first.mention_ids.clone(),
                        mention_all: first.mention_all,
                        send_after_ms: first.send_after_ms,
                    });
                }
            }
        }
        if kept.is_empty() {
            decision.participation = Participation::Observe;
        }
        decision.messages = kept;
    }

    /// 与 assess 使用同一判定：有本地模型就用模型分数，否则用词表兜底。
    fn formulaic(&self, text: &str) -> bool {
        if let Some(model) = &self.model {
            model.score(features(text)) >= model.threshold
        } else {
            fallback_formulaic(text)
        }
    }
}

fn longest_clause(text: &str) -> usize {
    text.split(['。', '！', '？', '!', '?', '，', ',', '；', ';', '\n'])
        .filter(|clause| !clause.trim().is_empty())
        .map(|clause| clause.chars().count())
        .max()
        .unwrap_or(0)
}

fn lecture_style(text: &str) -> bool {
    let count = occurrences(text, &LECTURE_MARKERS);
    // 单个"另外/首先"可能只是正常口语；两个以上连接词、总结式收尾或以"首先/其次"开头才判定为说教。
    count >= 2.0
        || ["总的来说", "综上", "换句话说", "值得注意的是", "不得不说", "总而言之", "让我们一起", "希望对你有帮助", "整体来看"]
            .iter().any(|phrase| text.contains(phrase))
        || (count >= 1.0 && ["首先", "其次"].iter().any(|phrase| text.trim_start().starts_with(phrase)))
}

fn literary_style(text: &str) -> bool {
    let count = occurrences(text, &LITERARY_MARKERS);
    count >= 2.0 || (count >= 1.0 && text.chars().count() >= 28)
}

fn paragraph_style(text: &str) -> bool {
    text.contains('\n') || longest_clause(text) > 30
}

/// 取第一个短句作为兜底回复；不足 2 字视为无法成句。
fn salvage(text: &str, max_chars: u32, repeated: Option<&'static str>) -> Option<String> {
    let mut candidate = text.trim();
    if let Some(marker) = repeated {
        if let Some(rest) = candidate.strip_prefix(marker) {
            candidate = rest.trim_start_matches(['，', ',', ' ', '、']);
        }
    }
    let max = max_chars as usize;
    let mut segment = String::new();
    let mut terminated = false;
    for character in candidate.chars() {
        if matches!(character, '。' | '！' | '？' | '!' | '?' | '，' | ',' | '；' | ';' | '\n') {
            terminated = true;
            break;
        }
        // 没有标点又超过上限：宁可不说话，也不截出半句话。
        if segment.chars().count() >= max {
            return None;
        }
        segment.push(character);
    }
    if !terminated && segment.chars().count() >= max {
        return None;
    }
    let segment = segment.trim().trim_end_matches(['，', ',', '；', ';', '、']).trim();
    // 兜底短句本身也不能带说教/文艺/点评标记，否则等于把 AI 味截短后照发。
    if occurrences(segment, &LECTURE_MARKERS) >= 1.0
        || occurrences(segment, &LITERARY_MARKERS) >= 1.0
        || occurrences(segment, &COMMENTARY) >= 1.0
        || occurrences(segment, &HOLLOW) >= 1.0
    {
        return None;
    }
    let length = segment.chars().count();
    (2..=max).contains(&length).then(|| segment.to_string())
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

fn features(text: &str) -> [f64; 12] {
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
        occurrences(text, &COMMENTARY),
        occurrences(text, &HOLLOW),
    ]
}

fn fallback_formulaic(text: &str) -> bool {
    EVALUATIONS[..6].iter().any(|phrase| text.contains(phrase))
        || occurrences(text, &COMMENTARY) >= 1.0
        || occurrences(text, &HOLLOW) >= 2.0
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
            "format_version":1,"feature_version":2,"training_samples":500,
            "means":vec![0.0;12],"scales":vec![1.0;12],"weights":vec![0.0;12],
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
        assert!(policy.assess(&decision(&[&"长".repeat(41)])).unwrap().over_message_limit);
        assert!(policy.assess(&decision(&["一", "二", "三", "四"])).unwrap().too_many_messages);
        assert!(policy.assess(&decision(&["这个比喻很有画面感，体验感拉满。"])).unwrap().formulaic_style);
        // 真实聊天里的感叹式点评与排队附和也要拦住。
        assert!(policy.assess(&decision(&["太空牵手也太浪漫了"])).unwrap().formulaic_style);
        assert!(policy.assess(&decision(&["算我一个", "给我留一罐", "我也来"])).unwrap().formulaic_style);
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
        let expected = [15.0_f64.ln(), 2.0, 12.0_f64.ln(), 3.0, 1.0, 1.0, 0.0, 1.0, 2.0, 1.0, 1.0, 4.0];
        for (actual, expected) in vector.into_iter().zip(expected) {
            assert!((actual - expected).abs() < 1e-12);
        }
        let mut model: Model = serde_json::from_value(model_json()).unwrap();
        assert_eq!(model.score([0.0; 12]), 0.5);
        model.weights[0] = 1.0;
        let mut large = [0.0; 12];
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
        assert_eq!(for_input(&input, "new_message").max_message_chars, 28);
        let mut updated = model_json();
        updated["length_chars"]["p90"] = json!(48);
        std::fs::write(&path, serde_json::to_vec(&updated).unwrap()).unwrap();
        assert_eq!(for_input(&input, "new_message").max_message_chars, 32);
        for (field, value) in [
            ("format_version", json!(2)), ("feature_version", json!(1)), ("training_samples", json!(99)),
            ("threshold", json!(0.5)), ("threshold", json!(1.0)), ("bias", json!(1e300)),
            ("scales", json!(vec![0.0; 12])), ("means", json!(vec![0.0; 11])),
            ("examples", json!(["原始语料不应进入模型文件"])),
            ("length_chars", json!({"median":24,"p75":12,"p90":48})),
        ] {
            let mut invalid = model_json();
            invalid[field] = value;
            std::fs::write(&path, serde_json::to_vec(&invalid).unwrap()).unwrap();
            assert!(Model::load(&path).is_none(), "{field}");
            assert_eq!(for_input(&input, "new_message").max_message_chars, 40);
        }
        std::fs::write(&path, vec![b' '; MODEL_BYTE_LIMIT as usize + 1]).unwrap();
        assert!(Model::load(&path).is_none());
    }

    #[test]
    fn lecture_literary_paragraph_and_repeated_openings_are_flagged() {
        let policy = Policy::default();
        for text in [
            "首先这件事要分开看，其次还得考虑整体情况。",
            "仿佛生活中的小小仪式，更像是内心深处的温柔回应。",
            "第一句\n第二句",
            "我今天一直在想要不要把这件事从头到尾完整地说一遍因为实在有点复杂",
        ] {
            assert!(policy.assess(&decision(&[text])).is_some(), "{text}");
        }
        let (_directory, mut input) = input();
        let id = input.agent.agent_id.clone();
        input.messages = vec![
            message(1, &id, "诶，刚回来。"),
            message(2, &id, "诶，还没吃。"),
            message(3, "other", "吃了吗"),
        ];
        let policy = for_input(&input, "new_message");
        assert!(policy.repeated_opening.is_some());
        assert!(policy.assess(&decision(&["诶，吃了。"])).unwrap().repeated_opening);
        assert!(policy.assess(&decision(&["吃了。"])).is_none());
    }

    #[test]
    fn enforcement_keeps_short_clean_messages_and_avoids_cutting_mid_sentence() {
        let policy = Policy::default();
        let mut clean = decision(&["还没吃", "等会儿再说"]);
        policy.enforce(&mut clean);
        assert_eq!(clean.participation, Participation::Speak);
        assert_eq!(clean.messages.len(), 2);

        let mut long = decision(&[&"长".repeat(41)]);
        policy.enforce(&mut long);
        assert_eq!(long.participation, Participation::Observe);

        let mut lecturing = decision(&["首先这件事要分开看，其次还得考虑整体情况。"]);
        policy.enforce(&mut lecturing);
        assert_eq!(lecturing.participation, Participation::Observe);

        let mut salvageable = decision(&["好累啊，今天从早到晚一直在开会，中间连口水都没顾上喝，脑子都木了，晚上估计还得接着弄。"]);
        policy.enforce(&mut salvageable);
        assert_eq!(salvageable.participation, Participation::Speak);
        assert_eq!(body(&salvageable.messages[0].parts), "好累啊");

        // 点评式/捧哏即使字数合规也不能发出去，兜底短句同样要干净。
        let mut commentary = decision(&["这个比喻绝了", "确实，说得对"]);
        policy.enforce(&mut commentary);
        assert_eq!(commentary.participation, Participation::Observe);
        assert!(commentary.messages.is_empty());

        let mut too_many = decision(&["一", "二", "三", "四"]);
        policy.enforce(&mut too_many);
        assert_eq!(too_many.messages.len(), 3);
    }
}
