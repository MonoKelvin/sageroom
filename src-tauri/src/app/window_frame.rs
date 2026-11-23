use tauri::WebviewWindow;

const SHADOW_GUTTER: f64 = 48.0;
const CORNER_RADIUS: f64 = 16.0;
const RESIZE_BORDER: f64 = 8.0;

#[derive(Clone, Copy, Debug, PartialEq, Eq)]
enum Hit {
    Native,
    Transparent,
    Left,
    Right,
    Top,
    Bottom,
    TopLeft,
    TopRight,
    BottomLeft,
    BottomRight,
}

fn hit_test(width: f64, height: f64, x: f64, y: f64, scale: f64, maximized: bool) -> Hit {
    if maximized || width <= 0.0 || height <= 0.0 || scale <= 0.0 {
        return Hit::Native;
    }
    let (width, height, x, y) = (width / scale, height / scale, x / scale, y / scale);
    let left = SHADOW_GUTTER;
    let top = SHADOW_GUTTER;
    let right = width - SHADOW_GUTTER;
    let bottom = height - SHADOW_GUTTER;
    if right <= left || bottom <= top {
        return Hit::Native;
    }
    if x < left || x >= right || y < top || y >= bottom {
        return Hit::Transparent;
    }
    let radius = CORNER_RADIUS
        .min((right - left) / 2.0)
        .min((bottom - top) / 2.0);
    let corner_x = if x < left + radius {
        Some(left + radius)
    } else if x > right - radius {
        Some(right - radius)
    } else {
        None
    };
    let corner_y = if y < top + radius {
        Some(top + radius)
    } else if y > bottom - radius {
        Some(bottom - radius)
    } else {
        None
    };
    if let (Some(center_x), Some(center_y)) = (corner_x, corner_y) {
        let distance_squared = (x - center_x).powi(2) + (y - center_y).powi(2);
        if distance_squared > radius.powi(2) {
            return Hit::Transparent;
        }
        if distance_squared >= (radius - RESIZE_BORDER).max(0.0).powi(2) {
            return match (center_x < width / 2.0, center_y < height / 2.0) {
                (true, true) => Hit::TopLeft,
                (false, true) => Hit::TopRight,
                (true, false) => Hit::BottomLeft,
                (false, false) => Hit::BottomRight,
            };
        }
    }
    if x < left + RESIZE_BORDER {
        Hit::Left
    } else if x >= right - RESIZE_BORDER {
        Hit::Right
    } else if y < top + RESIZE_BORDER {
        Hit::Top
    } else if y >= bottom - RESIZE_BORDER {
        Hit::Bottom
    } else {
        Hit::Native
    }
}

#[cfg(target_os = "windows")]
mod platform {
    use std::{
        io,
        mem::size_of_val,
        sync::atomic::{AtomicBool, AtomicUsize, Ordering},
    };

    use windows_sys::Win32::{
        Foundation::{HWND, LPARAM, LRESULT, POINT, RECT, WPARAM},
        Graphics::{
            Dwm::{DWMWA_WINDOW_CORNER_PREFERENCE, DWMWCP_DONOTROUND, DwmSetWindowAttribute},
            Gdi::ScreenToClient,
        },
        System::LibraryLoader::GetModuleHandleW,
        UI::{
            HiDpi::GetDpiForWindow,
            Input::KeyboardAndMouse::GetCapture,
            Shell::{DefSubclassProc, RemoveWindowSubclass, SetWindowSubclass},
            WindowsAndMessaging::{
                CallNextHookEx, GWL_EXSTYLE, GetClientRect, GetWindowLongPtrW, HC_ACTION, HHOOK,
                HTBOTTOM, HTBOTTOMLEFT, HTBOTTOMRIGHT, HTLEFT, HTRIGHT, HTTOP, HTTOPLEFT,
                HTTOPRIGHT, HTTRANSPARENT, IsChild, IsIconic, IsWindowVisible, IsZoomed,
                MSLLHOOKSTRUCT, SetWindowLongPtrW, SetWindowsHookExW, UnhookWindowsHookEx,
                WH_MOUSE_LL, WM_NCDESTROY, WM_NCHITTEST, WS_EX_LAYERED, WS_EX_TRANSPARENT,
            },
        },
    };

    use super::{Hit, WebviewWindow, hit_test};

    const SUBCLASS_ID: usize = 0x5346_524D;
    const E_INVALIDARG: i32 = 0x8007_0057u32 as i32;
    static FRAME_WINDOW: AtomicUsize = AtomicUsize::new(0);
    static MOUSE_HOOK: AtomicUsize = AtomicUsize::new(0);
    static ORIGINAL_LAYERED: AtomicBool = AtomicBool::new(false);

    fn frame_hit(hwnd: HWND, mut point: POINT) -> Option<Hit> {
        let mut rect = RECT::default();
        let dpi = unsafe { GetDpiForWindow(hwnd) };
        if dpi == 0
            || unsafe { ScreenToClient(hwnd, &mut point) } == 0
            || unsafe { GetClientRect(hwnd, &mut rect) } == 0
        {
            return None;
        }
        Some(hit_test(
            f64::from(rect.right - rect.left),
            f64::from(rect.bottom - rect.top),
            f64::from(point.x - rect.left),
            f64::from(point.y - rect.top),
            f64::from(dpi) / 96.0,
            unsafe { IsZoomed(hwnd) } != 0,
        ))
    }

    unsafe extern "system" fn mouse_proc(code: i32, wparam: WPARAM, lparam: LPARAM) -> LRESULT {
        // 只检查当前指针是否在窗体内；不记录输入、不消费其他窗口的鼠标事件。
        let hwnd = FRAME_WINDOW.load(Ordering::Relaxed) as HWND;
        if code == HC_ACTION as i32
            && lparam != 0
            && !hwnd.is_null()
            && unsafe { IsWindowVisible(hwnd) } != 0
            && unsafe { IsIconic(hwnd) } == 0
        {
            let point = unsafe { (*(lparam as *const MSLLHOOKSTRUCT)).pt };
            if let Some(hit) = frame_hit(hwnd, point) {
                let capture = unsafe { GetCapture() };
                let captured = capture == hwnd
                    || (!capture.is_null() && unsafe { IsChild(hwnd, capture) } != 0);
                let ignore = hit == Hit::Transparent && !captured;
                let current = unsafe { GetWindowLongPtrW(hwnd, GWL_EXSTYLE) };
                let mut next = current;
                if ignore {
                    next |= (WS_EX_LAYERED | WS_EX_TRANSPARENT) as isize;
                } else {
                    next &= !(WS_EX_TRANSPARENT as isize);
                    if !ORIGINAL_LAYERED.load(Ordering::Relaxed) {
                        next &= !(WS_EX_LAYERED as isize);
                    }
                }
                // 不移动、不重设尺寸；仅在跨越窗体边界时切换命中状态。
                if next != current {
                    unsafe { SetWindowLongPtrW(hwnd, GWL_EXSTYLE, next) };
                }
            }
        }
        unsafe { CallNextHookEx(std::ptr::null_mut(), code, wparam, lparam) }
    }

    unsafe extern "system" fn frame_proc(
        hwnd: HWND,
        message: u32,
        wparam: WPARAM,
        lparam: LPARAM,
        subclass_id: usize,
        _reference: usize,
    ) -> LRESULT {
        if message == WM_NCDESTROY {
            FRAME_WINDOW.store(0, Ordering::Relaxed);
            let hook = MOUSE_HOOK.swap(0, Ordering::Relaxed) as HHOOK;
            if !hook.is_null() {
                unsafe { UnhookWindowsHookEx(hook) };
            }
            unsafe { RemoveWindowSubclass(hwnd, Some(frame_proc), subclass_id) };
        } else if message == WM_NCHITTEST {
            let point = POINT {
                x: (lparam as u32 & 0xffff) as i16 as i32,
                y: ((lparam as u32 >> 16) & 0xffff) as i16 as i32,
            };
            if let Some(hit) = frame_hit(hwnd, point) {
                // 命中判定在同一条消息内同步样式，当前点击不依赖鼠标钩子先执行。
                let current = unsafe { GetWindowLongPtrW(hwnd, GWL_EXSTYLE) };
                let mut next = current;
                if hit == Hit::Transparent {
                    next |= (WS_EX_LAYERED | WS_EX_TRANSPARENT) as isize;
                } else {
                    next &= !(WS_EX_TRANSPARENT as isize);
                    if !ORIGINAL_LAYERED.load(Ordering::Relaxed) { next &= !(WS_EX_LAYERED as isize); }
                }
                if next != current { unsafe { SetWindowLongPtrW(hwnd, GWL_EXSTYLE, next) }; }
                let result = match hit {
                    Hit::Native => None,
                    Hit::Transparent => Some(HTTRANSPARENT as LRESULT),
                    Hit::Left => Some(HTLEFT as LRESULT),
                    Hit::Right => Some(HTRIGHT as LRESULT),
                    Hit::Top => Some(HTTOP as LRESULT),
                    Hit::Bottom => Some(HTBOTTOM as LRESULT),
                    Hit::TopLeft => Some(HTTOPLEFT as LRESULT),
                    Hit::TopRight => Some(HTTOPRIGHT as LRESULT),
                    Hit::BottomLeft => Some(HTBOTTOMLEFT as LRESULT),
                    Hit::BottomRight => Some(HTBOTTOMRIGHT as LRESULT),
                };
                if let Some(result) = result {
                    return result;
                }
            }
        }
        unsafe { DefSubclassProc(hwnd, message, wparam, lparam) }
    }

    pub fn configure(window: &WebviewWindow) -> Result<(), Box<dyn std::error::Error>> {
        let hwnd = window.hwnd()?.0 as HWND;
        let corner = DWMWCP_DONOTROUND;
        let result = unsafe {
            DwmSetWindowAttribute(
                hwnd,
                DWMWA_WINDOW_CORNER_PREFERENCE as u32,
                std::ptr::from_ref(&corner).cast(),
                size_of_val(&corner) as u32,
            )
        };
        // Win10 不支持圆角偏好 API，CSS 仍负责一致的窗口形状。
        if result < 0 && result != E_INVALIDARG {
            return Err(
                io::Error::other(format!("设置窗口圆角偏好失败：0x{:08X}", result as u32)).into(),
            );
        }
        if unsafe { SetWindowSubclass(hwnd, Some(frame_proc), SUBCLASS_ID, 0) } == 0 {
            return Err(io::Error::other(format!(
                "安装原生窗口命中处理失败：{}",
                io::Error::last_os_error()
            ))
            .into());
        }
        ORIGINAL_LAYERED.store(
            unsafe { GetWindowLongPtrW(hwnd, GWL_EXSTYLE) } & WS_EX_LAYERED as isize != 0,
            Ordering::Relaxed,
        );
        FRAME_WINDOW.store(hwnd as usize, Ordering::Relaxed);
        // HTTRANSPARENT 只会在同线程窗口间继续命中；跨应用穿透需要扩展样式。
        // 低级鼠标回调先更新样式，再交还系统分发；不轮询，不调用 SetWindowPos。
        let hook = unsafe {
            SetWindowsHookExW(
                WH_MOUSE_LL,
                Some(mouse_proc),
                GetModuleHandleW(std::ptr::null()),
                0,
            )
        };
        if hook.is_null() {
            FRAME_WINDOW.store(0, Ordering::Relaxed);
            unsafe { RemoveWindowSubclass(hwnd, Some(frame_proc), SUBCLASS_ID) };
            return Err(io::Error::other(format!(
                "安装窗口外部穿透处理失败：{}",
                io::Error::last_os_error()
            ))
            .into());
        }
        MOUSE_HOOK.store(hook as usize, Ordering::Relaxed);
        Ok(())
    }
}

pub fn configure(window: &WebviewWindow) -> Result<(), Box<dyn std::error::Error>> {
    #[cfg(target_os = "windows")]
    {
        platform::configure(window)
    }
    #[cfg(not(target_os = "windows"))]
    {
        let _ = window;
        Ok(())
    }
}

#[cfg(test)]
mod tests {
    use super::{Hit, SHADOW_GUTTER, hit_test};

    #[test]
    fn transparent_gutter_and_rounded_cutout_do_not_claim_client_input() {
        for (x, y) in [
            (8.0, 300.0),
            (47.0, 300.0),
            (1095.0, 500.0),
            (500.0, 760.0),
            (49.0, 49.0),
            (1050.0, 730.0),
            (-1.0, 300.0),
            (1100.0, 300.0),
        ] {
            assert_eq!(hit_test(1100.0, 780.0, x, y, 1.0, false), Hit::Transparent);
        }
    }

    #[test]
    fn client_content_uses_existing_window_procedure() {
        for (x, y) in [(500.0, 300.0), (90.0, 70.0), (1020.0, 70.0)] {
            assert_eq!(hit_test(1100.0, 780.0, x, y, 1.0, false), Hit::Native);
        }
    }

    #[test]
    fn visible_edges_keep_native_resize_hits() {
        for (x, y, expected) in [
            (50.0, 300.0, Hit::Left),
            (1050.0, 300.0, Hit::Right),
            (500.0, 50.0, Hit::Top),
            (500.0, 730.0, Hit::Bottom),
            (55.0, 55.0, Hit::TopLeft),
            (1045.0, 55.0, Hit::TopRight),
            (55.0, 725.0, Hit::BottomLeft),
            (1045.0, 725.0, Hit::BottomRight),
        ] {
            assert_eq!(hit_test(1100.0, 780.0, x, y, 1.0, false), expected);
        }
    }

    #[test]
    fn geometry_uses_live_size_and_dpi_not_reference_window_fractions() {
        for scale in [1.0, 1.25, 1.5, 2.0] {
            assert_eq!(
                hit_test(
                    924.0 * scale,
                    684.0 * scale,
                    (SHADOW_GUTTER + 2.0) * scale,
                    300.0 * scale,
                    scale,
                    false
                ),
                Hit::Left
            );
            assert_eq!(
                hit_test(
                    924.0 * scale,
                    684.0 * scale,
                    (SHADOW_GUTTER - 1.0) * scale,
                    300.0 * scale,
                    scale,
                    false
                ),
                Hit::Transparent
            );
        }
    }

    #[test]
    fn maximized_frame_defers_all_hit_testing_without_gutter() {
        assert_eq!(hit_test(1920.0, 1080.0, 0.0, 0.0, 1.0, true), Hit::Native);
        assert_eq!(
            hit_test(1920.0, 1080.0, 1919.0, 1079.0, 1.0, true),
            Hit::Native
        );
        assert_eq!(hit_test(3840.0, 2160.0, 8.0, 600.0, 2.0, true), Hit::Native);
    }
}
