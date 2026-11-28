use std::collections::HashSet;

use serde::Serialize;

use super::decision::Decision;
use crate::{
    domain::contracts::{
        AgentConfiguration, AgentRuntimeStatus, AgentType, DAILY_REQUEST_LIMIT, MessageState,
        ParticipantKind, ParticipantStatus,
    },
    storage::runtime::RuntimeInput,
};

const CHANCE_PERCENT: u64 = 8;
const FRESH_MESSAGE_MS: i64 = 60_000;
const ROOM_COOLDOWN_MS: i64 = 45_000;
const MEMBER_COOLDOWN_MS: i64 = 5 * 60_000;

#[derive(Debug, PartialEq, Eq, Serialize)]
pub(super) struct Peer {
    pub(super) id: String,
    pub(super) name: String,
    pub(super) agent_type: AgentType,
}

/// 只提供机会，不要求发言；与话题是否相关由普通智能体判断。
pub(super) fn eligible(
    input: &RuntimeInput,
    agents: &[AgentConfiguration],
    addressed: bool,
    now: i64,
    seed: u64,
) -> Vec<Peer> {
    if addressed || input.agent.agent_type != AgentType::Social || seed % 100 >= CHANCE_PERCENT {
        return vec![];
    }
    let own_id = input.agent.agent_id.as_str();
    let latest = input
        .messages
        .iter()
        .rfind(|message| message.state == MessageState::Visible);
    if !latest.is_some_and(|message| {
        message.sender_id != own_id
            && (0..FRESH_MESSAGE_MS).contains(&now.saturating_sub(message.created_at))
            && !message.mention_all
            && message.mention_ids.is_empty()
            && message.quote_message_id.is_none()
    }) {
        return vec![];
    }

    let participants = &input.snapshot.participants;
    let agent_ids: HashSet<_> = participants
        .iter()
        .filter(|participant| participant.kind == ParticipantKind::Agent)
        .map(|participant| participant.id.as_str())
        .collect();
    let mut cooling = HashSet::new();
    for message in &input.messages {
        let age = now.saturating_sub(message.created_at);
        if message.state != MessageState::Visible
            || message.mention_all
            || age >= MEMBER_COOLDOWN_MS
        {
            continue;
        }
        for target in message.mention_ids.iter().map(String::as_str) {
            if target == message.sender_id || !agent_ids.contains(target) {
                continue;
            }
            if age < ROOM_COOLDOWN_MS {
                return vec![];
            }
            // 发起者和被点到的成员都冷却，防止转手或回点。
            cooling.insert(message.sender_id.as_str());
            cooling.insert(target);
        }
    }
    if cooling.contains(own_id) {
        return vec![];
    }

    participants
        .iter()
        .filter_map(|participant| {
            let id = participant.id.as_str();
            if id == own_id
                || id == input.snapshot.local_user.id
                || participant.kind != ParticipantKind::Agent
                || participant.status != ParticipantStatus::Present
                || cooling.contains(id)
            {
                return None;
            }
            let runtime = participant.runtime.as_ref()?;
            let config = agents.iter().find(|agent| agent.agent_id == id)?;
            // 睡眠中的社交成员仍能接收明确点名，其他不可用状态不列出。
            if runtime.config_revision != config.revision
                || config.model.is_none()
                || runtime.requests_today >= DAILY_REQUEST_LIMIT
                || !matches!(
                    runtime.status,
                    AgentRuntimeStatus::Observing
                        | AgentRuntimeStatus::Deciding
                        | AgentRuntimeStatus::WaitingToSend
                        | AgentRuntimeStatus::Sleeping
                )
            {
                return None;
            }
            Some(Peer {
                id: id.into(),
                name: participant.display_name.clone(),
                agent_type: config.agent_type.clone(),
            })
        })
        .collect()
}

/// 通知只看结构化 ID，不改动正文；群主的 mention_all 仍由既有权限检查负责。
pub(super) fn enforce(decision: &mut Decision, peers: &[Peer], user_id: Option<&str>) {
    let mut peer_used = false;
    for message in &mut decision.messages {
        let mut user_used = false;
        message.mention_ids.retain(|id| {
            if user_id == Some(id.as_str()) {
                return !std::mem::replace(&mut user_used, true);
            }
            if !peer_used && !message.mention_all && peers.iter().any(|peer| peer.id == *id) {
                peer_used = true;
                return true;
            }
            false
        });
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::domain::contracts::*;
    use serde_json::json;

    const NOW: i64 = 1_000_000;

    fn configuration(id: &str, name: &str, agent_type: AgentType) -> AgentConfiguration {
        serde_json::from_value(json!({
            "agent_id":id,"revision":"1","display_name":name,"language_style":"", "skill":"",
            "dimensions":{"professional":50,"formal":50,"casual":50,"humor":50,
                "direct":50,"empathy":50,"social_energy":50,"activity":50},
            "agent_type":agent_type,"model":{"source_profile_id":"profile","source_profile_revision":"1",
                "profile":{"id":"profile","name":"test","protocol":"openai_chat_completions",
                    "base_url":"https://example.invalid","model_name":"test"}},
        })).unwrap()
    }

    fn member(config: &AgentConfiguration, status: AgentRuntimeStatus) -> Participant {
        Participant {
            id: config.agent_id.clone(),
            kind: ParticipantKind::Agent,
            display_name: config.display_name.clone(),
            status: ParticipantStatus::Present,
            is_builtin: false,
            avatar_id: None,
            profile_revision: 1.into(),
            runtime: Some(AgentRuntimeState {
                agent_id: config.agent_id.clone(),
                config_revision: config.revision.clone(),
                status,
                detail: None,
                next_wake_at: None,
                requests_today: 0,
            }),
        }
    }

    fn message(sender: &str, age: i64, targets: &[&str]) -> ChatMessage {
        ChatMessage {
            id: format!("message-{age}"),
            seq: (NOW - age).into(),
            sender_id: sender.into(),
            created_at: NOW - age,
            state: MessageState::Visible,
            parts: vec![MessagePart::Text {
                text: "我更喜欢小场景的科幻片。".into(),
            }],
            quote_message_id: None,
            mention_ids: targets.iter().map(|id| (*id).into()).collect(),
            mention_all: false,
        }
    }

    fn fixture() -> (RuntimeInput, Vec<AgentConfiguration>) {
        let agents = vec![
            configuration("self", "自己", AgentType::Social),
            configuration("social", "小周", AgentType::Social),
            configuration("tool", "换算器", AgentType::Tool),
        ];
        let mut local_user = member(
            &configuration("human", "本地用户", AgentType::Social),
            AgentRuntimeStatus::Observing,
        );
        local_user.kind = ParticipantKind::User;
        local_user.runtime = None;
        let mut participants: Vec<_> = agents
            .iter()
            .map(|config| member(config, AgentRuntimeStatus::Observing))
            .collect();
        participants.push(local_user.clone());
        let input = RuntimeInput {
            agent: agents[0].clone(),
            credential_ref: String::new(),
            snapshot: AppSnapshot {
                data_generation_id: "generation".into(),
                room: Room {
                    id: "room".into(),
                    name: "群聊".into(),
                    owner_participant_id: "human".into(),
                    version: 1.into(),
                    content_epoch: 1.into(),
                },
                local_user,
                participants,
                appearance: Appearance {
                    theme: Theme::Light,
                    reduce_motion: false,
                    revision: 1.into(),
                },
                latest_message_seq: 1.into(),
                latest_event_seq: 1.into(),
                events: vec![],
                requires_full_reload: false,
                data_directory: String::new(),
                data_usage: DataUsage {
                    database_bytes: 0.into(),
                    avatar_bytes: 0.into(),
                    disk_total_bytes: 0.into(),
                    disk_letter: String::new(),
                },
                app_version: String::new(),
                development_tools_available: false,
            },
            messages: vec![message("human", 1_000, &[])],
            quoted_messages: vec![],
            tool_turn: None,
            experiences: vec![],
            experience_revision: String::new(),
        };
        (input, agents)
    }

    #[test]
    fn candidates_are_rare_and_never_used_to_fill_silence_or_interrupt() {
        let (mut input, agents) = fixture();
        assert_eq!(
            (0..1000)
                .filter(|&seed| !eligible(&input, &agents, false, NOW, seed).is_empty())
                .count(),
            80
        );
        assert!(eligible(&input, &agents, true, NOW, 0).is_empty());
        input.messages[0].mention_ids = vec!["human".into()];
        assert!(eligible(&input, &agents, false, NOW, 0).is_empty());
        input.messages[0].mention_ids.clear();
        input.messages[0].quote_message_id = Some("earlier".into());
        assert!(eligible(&input, &agents, false, NOW, 0).is_empty());
        input.messages = vec![message("human", FRESH_MESSAGE_MS, &[])];
        assert!(eligible(&input, &agents, false, NOW, 0).is_empty());
        input.messages.clear();
        assert!(eligible(&input, &agents, false, NOW, 0).is_empty());
        input.messages.push(message("human", 1_000, &[]));
        input.agent.agent_type = AgentType::Tool;
        assert!(eligible(&input, &agents, false, NOW, 0).is_empty());
    }

    #[test]
    fn only_current_available_configured_members_are_candidates() {
        let (mut input, mut agents) = fixture();
        for (index, status) in [
            AgentRuntimeStatus::Paused,
            AgentRuntimeStatus::Offline,
            AgentRuntimeStatus::NeedsConfiguration,
            AgentRuntimeStatus::Protected,
        ]
        .into_iter()
        .enumerate()
        {
            let config =
                configuration(&format!("unavailable-{index}"), "不可用", AgentType::Social);
            input.snapshot.participants.push(member(&config, status));
            agents.push(config);
        }
        for id in [
            "stale",
            "unconfigured",
            "quota",
            "missing-config",
            "not-present",
            "missing-runtime",
            "human",
        ] {
            let mut config = configuration(id, "不可用", AgentType::Tool);
            let mut participant = member(&config, AgentRuntimeStatus::Observing);
            match id {
                "stale" => config.revision = 2.into(),
                "unconfigured" => config.model = None,
                "quota" => {
                    participant.runtime.as_mut().unwrap().requests_today = DAILY_REQUEST_LIMIT
                }
                "not-present" => participant.status = ParticipantStatus::NeedsConfiguration,
                "missing-runtime" => participant.runtime = None,
                _ => {}
            }
            input.snapshot.participants.push(participant);
            if id != "missing-config" {
                agents.push(config);
            }
        }
        input.snapshot.participants[1]
            .runtime
            .as_mut()
            .unwrap()
            .status = AgentRuntimeStatus::Sleeping;
        agents.push(configuration("not-in-room", "不在群里", AgentType::Tool));
        assert_eq!(
            serde_json::to_value(eligible(&input, &agents, false, NOW, 0)).unwrap(),
            json!([
                {"id":"social","name":"小周","agent_type":"social"},
                {"id":"tool","name":"换算器","agent_type":"tool"},
            ])
        );
    }

    #[test]
    fn cooling_suppresses_room_pings_and_member_ping_pong() {
        let (mut input, agents) = fixture();
        input
            .messages
            .insert(0, message("social", ROOM_COOLDOWN_MS - 1, &["tool"]));
        assert!(eligible(&input, &agents, false, NOW, 0).is_empty());
        input.messages[0].mention_all = true;
        assert_eq!(eligible(&input, &agents, false, NOW, 0).len(), 2);
        input.messages[0].mention_all = false;
        input.messages[0].state = MessageState::Recalled;
        assert_eq!(eligible(&input, &agents, false, NOW, 0).len(), 2);
        input.messages[0] = message("human", ROOM_COOLDOWN_MS, &["tool"]);
        let peers = eligible(&input, &agents, false, NOW, 0);
        assert_eq!(peers.len(), 1);
        assert_eq!(peers[0].id, "social");
        input.messages[0] = message("social", ROOM_COOLDOWN_MS, &["self"]);
        assert!(eligible(&input, &agents, false, NOW, 0).is_empty());
        input.messages[0] = message("self", MEMBER_COOLDOWN_MS - 1, &["social"]);
        assert!(eligible(&input, &agents, false, NOW, 0).is_empty());
        input.messages[0] = message("self", MEMBER_COOLDOWN_MS, &["social"]);
        assert_eq!(eligible(&input, &agents, false, NOW, 0).len(), 2);
    }

    #[test]
    fn only_one_approved_structured_peer_mention_survives_across_messages() {
        let (input, agents) = fixture();
        let peers = eligible(&input, &agents, false, NOW, 0);
        let output = json!({"participation":"speak","messages":[
            {"parts":[{"kind":"text","text":"@所有人 请看这里。"}],"mention_all":true,"mention_ids":["tool"]},
            {"parts":[{"kind":"text","text":"@小周，你怎么看？请找＠陌生人补个图，邮箱 a@example.com。"}],
                "mention_ids":["unknown","human","self","social","social","tool","human"]},
            {"parts":[{"kind":"text","text":"@"},{"kind":"text","text":"换算器 看这个数，@所有人也能看看。"}],"mention_ids":["tool","social"]},
        ]});
        let mut decision: Decision = serde_json::from_value(output.clone()).unwrap();
        enforce(&mut decision, &peers, Some("human"));
        assert!(decision.messages[0].mention_all);
        assert!(decision.messages[0].mention_ids.is_empty());
        assert_eq!(decision.messages[1].mention_ids, ["human", "social"]);
        assert!(decision.messages[2].mention_ids.is_empty());
        for (index, message) in decision.messages.iter().enumerate() {
            assert_eq!(
                serde_json::to_value(&message.parts).unwrap(),
                output["messages"][index]["parts"]
            );
        }
    }

    #[test]
    fn literal_mentions_and_unapproved_ids_do_not_notify() {
        let (input, agents) = fixture();
        let peers = eligible(&input, &agents, false, NOW, 0);
        let output = json!({"participation":"speak","messages":[
            {"parts":[{"kind":"text","text":"@小周 我更喜欢前一种。"}]},
            {"parts":[{"kind":"text","text":"只是想补充这个细节。"}],"mention_ids":["tool","human"]},
        ]});
        let mut decision: Decision = serde_json::from_value(output.clone()).unwrap();
        enforce(&mut decision, &peers, Some("human"));
        assert!(decision.messages[0].mention_ids.is_empty());
        assert!(!decision.messages[0].mention_all);
        assert_eq!(
            serde_json::to_value(&decision.messages[0].parts).unwrap(),
            output["messages"][0]["parts"]
        );
        assert_eq!(decision.messages[1].mention_ids, ["tool", "human"]);
        let mut decision: Decision = serde_json::from_value(output).unwrap();
        enforce(&mut decision, &[], Some("human"));
        assert_eq!(decision.messages[1].mention_ids, ["human"]);
        assert!(!decision.messages[1].mention_all);
    }
}
