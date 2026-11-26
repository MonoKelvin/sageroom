pub mod backup;
pub mod chat;
pub mod configuration;
pub mod data_root;
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
mod data_root_tests {
    use std::fs;

    use tempfile::TempDir;

    use super::data_root;

    #[test]
    fn migrate_copies_data_and_configures_root() {
        let dir = TempDir::new().unwrap();
        let current = dir.path().join("current");
        let target = dir.path().join("target");
        let config = dir.path().join("config");
        fs::create_dir_all(current.join("data")).unwrap();
        fs::write(current.join("data/marker.txt"), b"hello").unwrap();
        fs::create_dir_all(&target).unwrap();

        assert!(data_root::configured_root(&config).is_none());
        data_root::migrate(&current, &config, &target).unwrap();
        assert_eq!(fs::read_to_string(target.join("data/marker.txt")).unwrap(), "hello");
        assert_eq!(data_root::configured_root(&config), Some(target.clone()));

        data_root::reset(&config).unwrap();
        assert!(data_root::configured_root(&config).is_none());
    }

    #[test]
    fn second_migration_starts_from_configured_root() {
        let dir = TempDir::new().unwrap();
        let first = dir.path().join("first");
        let second = dir.path().join("second");
        let config = dir.path().join("config");
        fs::create_dir_all(&first).unwrap();
        fs::write(first.join("marker.txt"), b"moved").unwrap();
        fs::create_dir_all(&second).unwrap();

        data_root::migrate(&first, &config, &second).unwrap();
        // 模拟命令层逻辑：优先使用覆盖根目录。
        let current = data_root::configured_root(&config).unwrap();
        assert_eq!(current, second);

        let third = dir.path().join("third");
        fs::create_dir_all(&third).unwrap();
        data_root::migrate(&current, &config, &third).unwrap();
        assert_eq!(fs::read_to_string(third.join("marker.txt")).unwrap(), "moved");
        assert_eq!(data_root::configured_root(&config), Some(third));
    }

    #[test]
    fn migrate_rejects_non_empty_target() {
        let dir = TempDir::new().unwrap();
        let current = dir.path().join("current");
        let target = dir.path().join("target");
        let config = dir.path().join("config");
        fs::create_dir_all(&current).unwrap();
        fs::create_dir_all(&target).unwrap();
        fs::write(target.join("occupied"), b"x").unwrap();
        assert!(data_root::migrate(&current, &config, &target).is_err());
    }
}

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
