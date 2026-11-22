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
}
