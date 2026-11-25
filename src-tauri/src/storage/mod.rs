pub mod backup;
pub mod chat;
pub mod configuration;
pub mod database;
pub mod experience;
pub mod runtime;
pub mod search;
pub mod worker;

#[cfg(test)]
mod configuration_tests;
#[cfg(test)]
mod tests;

#[cfg(test)]
mod experience_tests {
    use super::experience;
    use tempfile::TempDir;

    #[test]
    fn experience_add_list_delete_and_prune_by_score() {
        let dir = TempDir::new().unwrap();
        let root = dir.path();
        let agent = "01a200f4-8fdc-71c0-8776-19ed690c3559";
        assert!(experience::list(root, agent).unwrap().is_empty());
        let low = experience::add(root, agent, "今天天气不错", 10).unwrap();
        let high = experience::add(root, agent, "换了份新工作，地点在深圳南山科技园", 100).unwrap();
        assert_eq!(experience::list(root, agent).unwrap().len(), 2);
        assert_eq!(low.recorded_at.len(), 16);
        assert_eq!(low.recorded_at.chars().nth(4), Some('/'));
        let entries = experience::prune(root, agent, 1).unwrap();
        assert_eq!(entries.len(), 1);
        assert_eq!(entries[0].id, high.id);
        let remaining = experience::delete(root, agent, &high.id).unwrap();
        assert!(remaining.is_empty());
    }

    #[test]
    fn experience_update_preserves_changes_and_sorts_by_time() {
        use crate::domain::contracts::ExperienceUpdateRequest;

        let dir = TempDir::new().unwrap();
        let root = dir.path();
        let agent = "01a200f4-8fdc-71c0-8776-19ed690c3559";
        let original = experience::add(root, agent, "旧内容", 30).unwrap();
        let request = ExperienceUpdateRequest {
            data_generation_id: "generation".into(),
            agent_id: agent.into(),
            entry_id: original.id.clone(),
            content: "新内容".into(),
            recorded_at: "2020/01/02 03:04".into(),
            score: 80,
        };
        let updated = experience::update(root, agent, &request).unwrap();
        assert_eq!(updated.content, "新内容");
        assert_eq!(updated.score, 80);
        assert_eq!(updated.recorded_at, "2020/01/02 03:04");
        assert_ne!(updated.id, original.id, "编辑后 id 应随内容哈希变化");
        let entries = experience::list(root, agent).unwrap();
        assert_eq!(entries.len(), 1);
        assert_eq!(entries[0].content, "新内容");

        // 时间格式非法时拒绝，原文件不变
        let bad = ExperienceUpdateRequest { recorded_at: "2020-01-02 03:04".into(), ..request };
        assert!(experience::update(root, agent, &bad).is_err());
        assert_eq!(experience::list(root, agent).unwrap()[0].content, "新内容");
    }
}
