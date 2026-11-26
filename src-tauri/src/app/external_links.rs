use std::path::Path;

use url::Url;

/// 判断导航目标是否为需要交给系统浏览器打开的外部 http(s) 链接。
/// Tauri 内部页面用 tauri:// / http://tauri.localhost，不能被拦截。
pub fn is_external(url: &Url) -> bool {
    matches!(url.scheme(), "http" | "https")
        && url.host_str().is_some_and(|host| host != "tauri.localhost" && host != "localhost")
}

/// 用系统默认程序打开链接。失败时静默忽略（不影响应用内操作）。
pub fn open_external(url: &Url) {
    launch(url.as_str());
}

/// 用系统默认程序打开本地文件（消息附件）。返回是否成功拉起。
pub fn open_path(path: &Path) -> bool {
    launch(&path.to_string_lossy())
}

#[cfg(target_os = "windows")]
fn launch(target: &str) -> bool {
    use std::ffi::OsStr;
    use std::os::windows::ffi::OsStrExt;
    use windows_sys::Win32::{
        UI::Shell::ShellExecuteW,
        UI::WindowsAndMessaging::SW_SHOWNORMAL,
    };

    let wide: Vec<u16> = OsStr::new(target)
        .encode_wide()
        .chain(std::iter::once(0))
        .collect();
    let verb: Vec<u16> = "open".encode_utf16().chain(std::iter::once(0)).collect();
    // ShellExecuteW 返回值大于 32 才算成功。
    (unsafe {
        ShellExecuteW(
            std::ptr::null_mut(),
            verb.as_ptr(),
            wide.as_ptr(),
            std::ptr::null(),
            std::ptr::null(),
            SW_SHOWNORMAL,
        )
    }) as isize
        > 32
}

#[cfg(target_os = "macos")]
fn launch(target: &str) -> bool {
    std::process::Command::new("open").arg(target).spawn().is_ok()
}

#[cfg(not(any(target_os = "windows", target_os = "macos")))]
fn launch(target: &str) -> bool {
    std::process::Command::new("xdg-open")
        .arg(target)
        .spawn()
        .is_ok()
}
