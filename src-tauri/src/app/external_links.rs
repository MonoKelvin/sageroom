use std::ffi::OsStr;

use url::Url;

/// 判断导航目标是否为需要交给系统浏览器打开的外部 http(s) 链接。
/// Tauri 内部页面用 tauri:// / http://tauri.localhost，不能被拦截。
pub fn is_external(url: &Url) -> bool {
    matches!(url.scheme(), "http" | "https")
        && url.host_str().is_some_and(|host| host != "tauri.localhost" && host != "localhost")
}

/// 用系统默认程序打开链接。跨平台实现，失败时静默忽略（不影响应用内操作）。
pub fn open_external(url: &Url) {
    let target = url.to_string();

    #[cfg(target_os = "windows")]
    {
        use std::os::windows::ffi::OsStrExt;
        use windows_sys::Win32::{
            UI::Shell::ShellExecuteW,
            UI::WindowsAndMessaging::SW_SHOWNORMAL,
        };

        let wide: Vec<u16> = OsStr::new(&target).encode_wide().chain(std::iter::once(0)).collect();
        let verb: Vec<u16> = "open".encode_utf16().chain(std::iter::once(0)).collect();
        unsafe {
            ShellExecuteW(
                std::ptr::null_mut(),
                verb.as_ptr(),
                wide.as_ptr(),
                std::ptr::null(),
                std::ptr::null(),
                SW_SHOWNORMAL,
            );
        }
    }

    #[cfg(target_os = "macos")]
    {
        let _ = std::process::Command::new("open").arg(&target).spawn();
    }

    #[cfg(not(any(target_os = "windows", target_os = "macos")))]
    {
        let _ = std::process::Command::new("xdg-open").arg(&target).spawn();
    }
}
