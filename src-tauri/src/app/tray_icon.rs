//! 托盘图标的「隐身帧」。
//!
//! 提醒闪烁要求图标在原地忽隐忽现：位置必须保留，只是看不见。
//!
//! 两条看似可行的路都被 Windows 堵死了：
//!
//! 1. `tray-icon` 的 `set_visible(false)`（`NIS_HIDDEN`）不是「藏起来」，而是让任务栏把这条通知
//!    从占位里撤掉，相邻图标立刻挤进来 —— 闪烁时整排图标来回抖动，比不闪更难看。
//! 2. 喂一张全透明 RGBA 让 `tray-icon` 自己转 HICON 也不行：它把 1bpp 的 AND 掩码按「每像素 1 字节」
//!    填充（`icon.rs` 的 `wrapping_sub`），而 Windows 只读前 `w * h / 8` 字节、按 8 像素一位打包，
//!    结果绝大多数像素被标成不透明，XOR 数据又是纯黑 —— 任务栏上就是一块黑矩形。
//!
//! 所以这里自己造 HICON，并用 `NIM_MODIFY` 直接换掉这条通知的图标：颜色位图 32bpp 全 0
//! （逐像素 alpha = 0），掩码位图全 1（逐像素透明）。无论 Shell 走 AlphaBlend 还是 AND 掩码，
//! 两条绘制路径都得到真正的透明，而通知本身仍在原位注册着，图标位置不会被打乱。
//!
//! 透明 HICON 在隐藏帧之间复用，恢复可见时再销毁：每 700ms 造一次 GDI 位图没有必要。

use tauri::{Wry, image::Image, tray::TrayIcon};

/// 会在隐藏帧之间复用的透明图标；非 Windows 平台没有这段逻辑。
#[cfg(windows)]
mod win {
    use std::{ffi::c_void, ptr, sync::Mutex};

    use windows_sys::Win32::{
        Foundation::RECT,
        Graphics::Gdi::{
            BITMAPINFO, BITMAPV5HEADER, BI_BITFIELDS, CreateBitmap, CreateDIBSection,
            DIB_RGB_COLORS, DeleteObject, GetDC, HGDIOBJ, ReleaseDC,
        },
        UI::{
            Shell::{
                NIF_ICON, NIM_MODIFY, NOTIFYICONDATAW, NOTIFYICONIDENTIFIER, Shell_NotifyIconGetRect,
                Shell_NotifyIconW,
            },
            WindowsAndMessaging::{
                CreateIconIndirect, DestroyIcon, FindWindowW, GetWindowThreadProcessId, HICON,
                ICONINFO,
            },
        },
    };

    /// `tray-icon` 给通知窗口注册的窗口类名（见其 `platform_impl/windows/mod.rs`）。
    const TRAY_WINDOW_CLASS: &str = "tray_icon_app";
    /// `tray-icon` 的 internal id 从 1 开始自增，本应用只建了一个托盘图标。
    const FIRST_UID: u32 = 1;
    const MAX_PROBE: u32 = 8;

    #[derive(Default)]
    struct Cache {
        /// (窗口句柄, 通知 id)：解析成功后缓存，避免每帧找窗口。
        target: Option<(isize, u32)>,
        /// 正在使用的透明 HICON，恢复可见后销毁。
        hidden: Option<isize>,
    }

    static CACHE: Mutex<Cache> = Mutex::new(Cache {
        target: None,
        hidden: None,
    });

    fn wide(value: &str) -> Vec<u16> {
        value.encode_utf16().chain(std::iter::once(0)).collect()
    }

    /// 全透明图标：alpha 全 0 的颜色位图 + 全 1 的 AND 掩码。
    unsafe fn build_transparent(size: i32) -> Option<HICON> {
        let mut header: BITMAPV5HEADER = unsafe { std::mem::zeroed() };
        header.bV5Size = std::mem::size_of::<BITMAPV5HEADER>() as u32;
        header.bV5Width = size;
        // 负数高度 = top-down DIB，行序与图像一致，省掉一次翻转。
        header.bV5Height = -size;
        header.bV5Planes = 1;
        header.bV5BitCount = 32;
        header.bV5Compression = BI_BITFIELDS;
        header.bV5RedMask = 0x00FF_0000;
        header.bV5GreenMask = 0x0000_FF00;
        header.bV5BlueMask = 0x0000_00FF;
        header.bV5AlphaMask = 0xFF00_0000;

        let screen = unsafe { GetDC(ptr::null_mut()) };
        if screen.is_null() {
            return None;
        }
        let mut bits: *mut c_void = ptr::null_mut();
        let color = unsafe {
            CreateDIBSection(
                screen,
                &header as *const BITMAPV5HEADER as *const BITMAPINFO,
                DIB_RGB_COLORS,
                &mut bits,
                ptr::null_mut(),
                0,
            )
        };
        if color.is_null() || bits.is_null() {
            unsafe { ReleaseDC(ptr::null_mut(), screen) };
            if !color.is_null() {
                unsafe { DeleteObject(color as HGDIOBJ) };
            }
            return None;
        }
        // DIB 内容未初始化，显式清零：BGRA 全 0 才是真正的「看不见」。
        unsafe { ptr::write_bytes(bits, 0, (size * size * 4) as usize) };

        // 1bpp 掩码每行按 16 位对齐；全 0xFF 表示每个像素都让出背景（透明）。
        let stride = ((size as usize + 15) / 16) * 2;
        let mask_bits = vec![0xFF_u8; stride * size as usize];
        let mask = unsafe {
            CreateBitmap(
                size,
                size,
                1,
                1,
                mask_bits.as_ptr() as *const c_void,
            )
        };
        if mask.is_null() {
            unsafe {
                DeleteObject(color as HGDIOBJ);
                ReleaseDC(ptr::null_mut(), screen);
            }
            return None;
        }

        let info = ICONINFO {
            fIcon: 1,
            xHotspot: 0,
            yHotspot: 0,
            hbmMask: mask,
            hbmColor: color,
        };
        let hicon = unsafe { CreateIconIndirect(&info) };
        unsafe {
            // 图标已把两张位图的数据拷进自己的结构，这里可以立刻释放。
            DeleteObject(mask as HGDIOBJ);
            DeleteObject(color as HGDIOBJ);
            ReleaseDC(ptr::null_mut(), screen);
        }
        if hicon.is_null() { None } else { Some(hicon) }
    }

    /// 找到本进程的托盘通知窗口和它的通知 id。
    fn locate() -> Option<(isize, u32)> {
        let class = wide(TRAY_WINDOW_CLASS);
        let hwnd = unsafe { FindWindowW(class.as_ptr(), ptr::null()) };
        if hwnd.is_null() {
            return None;
        }
        let mut pid = 0_u32;
        unsafe { GetWindowThreadProcessId(hwnd, &mut pid) };
        if pid != std::process::id() {
            return None;
        }
        let guid = unsafe { std::mem::zeroed() };
        for uid in FIRST_UID..FIRST_UID + MAX_PROBE {
            let identifier = NOTIFYICONIDENTIFIER {
                cbSize: std::mem::size_of::<NOTIFYICONIDENTIFIER>() as u32,
                hWnd: hwnd,
                uID: uid,
                guidItem: guid,
            };
            let mut rect: RECT = unsafe { std::mem::zeroed() };
            // 能取到图标矩形，说明这条通知确实注册在这个 id 上。
            if unsafe { Shell_NotifyIconGetRect(&identifier, &mut rect) } == 0 {
                return Some((hwnd as isize, uid));
            }
        }
        None
    }

    unsafe fn apply(hwnd: isize, uid: u32, hicon: HICON) -> bool {
        let nid = NOTIFYICONDATAW {
            cbSize: std::mem::size_of::<NOTIFYICONDATAW>() as u32,
            hWnd: hwnd as *mut c_void,
            uID: uid,
            uFlags: NIF_ICON,
            hIcon: hicon,
            ..unsafe { std::mem::zeroed() }
        };
        unsafe { Shell_NotifyIconW(NIM_MODIFY, &nid) != 0 }
    }

    pub fn hide(size: u32) -> bool {
        let Ok(mut cache) = CACHE.lock() else { return false };
        if cache.hidden.is_some() {
            return true;
        }
        let target = cache.target.or_else(locate);
        let Some((hwnd, uid)) = target else { return false };
        cache.target = Some((hwnd, uid));
        let Some(hicon) = (unsafe { build_transparent(size as i32) }) else {
            return false;
        };
        if !unsafe { apply(hwnd, uid, hicon) } {
            unsafe { DestroyIcon(hicon) };
            return false;
        }
        cache.hidden = Some(hicon as isize);
        true
    }

    pub fn release() {
        let Ok(mut cache) = CACHE.lock() else { return };
        if let Some(hicon) = cache.hidden.take() {
            unsafe { DestroyIcon(hicon as HICON) };
        }
    }
}

/// 把托盘图标换成透明帧：通知仍在原位，只是画不出来。
pub fn hide(size: u32) -> bool {
    #[cfg(windows)]
    {
        win::hide(size)
    }
    #[cfg(not(windows))]
    {
        let _ = size;
        false
    }
}

/// 释放透明图标。调用方应先把正常图标设回去，再调用这里，避免 Shell 拿到已销毁的句柄。
pub fn release() {
    #[cfg(windows)]
    win::release()
}

/// 隐藏帧不可用时不做任何降级：宁可这一帧不闪，也不要把通知撤掉让相邻图标挤进来。
/// 恢复时只有图标真的换回去了才销毁透明 HICON —— 否则 Shell 可能还握着这个句柄。
pub fn show(tray: &TrayIcon<Wry>, normal: Option<Image<'static>>) -> bool {
    let Some(icon) = normal else { return false };
    if tray.set_icon(Some(icon)).is_err() {
        return false;
    }
    release();
    true
}
