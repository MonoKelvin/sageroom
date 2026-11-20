fn main() {
    tauri_build::try_build(tauri_build::Attributes::new().app_manifest(
        tauri_build::AppManifest::new().commands(&[
            "app_get_snapshot",
            "chat_send",
            "chat_list",
            "chat_search",
            "cancel_search",
            "appearance_save",
            "global_configuration_get",
            "global_configuration_save",
            "agent_list",
            "agent_save",
            "user_profile_get",
            "user_profile_save",
            "secret_set",
            "secret_delete",
            "secret_status",
            "model_profile_test",
            "development_model_import",
            "avatar_import",
            "avatar_read",
            "app_request_exit",
            "app_exit_ready",
        ]),
    ))
    .expect("无法构建 Tauri 应用权限清单");
}
