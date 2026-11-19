fn main() {
    tauri_build::try_build(tauri_build::Attributes::new().app_manifest(
        tauri_build::AppManifest::new().commands(&[
            "app_get_snapshot",
            "chat_send",
            "chat_list",
            "chat_search",
            "cancel_search",
            "appearance_save",
            "app_request_exit",
        ]),
    ))
    .expect("无法构建 Tauri 应用权限清单");
}
