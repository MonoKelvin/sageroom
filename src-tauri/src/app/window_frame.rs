use tauri::WebviewWindow;

const SHADOW_GUTTER: f64 = 16.0;
const CORNER_RADIUS: f64 = 16.0;
const RESIZE_BORDER: f64 = 5.0;

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
    use std::{io, mem::size_of_val};

    use windows_sys::Win32::{
        Foundation::{HWND, LPARAM, LRESULT, POINT, RECT, WPARAM},
        Graphics::{
            Dwm::{DWMWA_WINDOW_CORNER_PREFERENCE, DWMWCP_DONOTROUND, DwmSetWindowAttribute},
            Gdi::ScreenToClient,
        },
        UI::{
            HiDpi::GetDpiForWindow,
            Shell::{DefSubclassProc, RemoveWindowSubclass, SetWindowSubclass},
            WindowsAndMessaging::{
                GetClientRect, HTBOTTOM, HTBOTTOMLEFT, HTBOTTOMRIGHT, HTLEFT, HTRIGHT, HTTOP,
                HTTOPLEFT, HTTOPRIGHT, HTTRANSPARENT, IsZoomed, WM_NCDESTROY, WM_NCHITTEST,
            },
        },
    };

    use super::{Hit, WebviewWindow, hit_test};

    const SUBCLASS_ID: usize = 0x5346_524D;
    const E_INVALIDARG: i32 = 0x8007_0057u32 as i32;

    unsafe extern "system" fn frame_proc(
        hwnd: HWND,
        message: u32,
        wparam: WPARAM,
        lparam: LPARAM,
        subclass_id: usize,
        _reference: usize,
    ) -> LRESULT {
        if message == WM_NCDESTROY {
            unsafe { RemoveWindowSubclass(hwnd, Some(frame_proc), subclass_id) };
        } else if message == WM_NCHITTEST {
            let mut point = POINT {
                x: (lparam as u32 & 0xffff) as i16 as i32,
                y: ((lparam as u32 >> 16) & 0xffff) as i16 as i32,
            };
            let mut rect = RECT::default();
            let dpi = unsafe { GetDpiForWindow(hwnd) };
            if dpi != 0
                && unsafe { ScreenToClient(hwnd, &mut point) } != 0
                && unsafe { GetClientRect(hwnd, &mut rect) } != 0
            {
                let hit = hit_test(
                    f64::from(rect.right - rect.left),
                    f64::from(rect.bottom - rect.top),
                    f64::from(point.x - rect.left),
                    f64::from(point.y - rect.top),
                    f64::from(dpi) / 96.0,
                    unsafe { IsZoomed(hwnd) } != 0,
                );
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
    use super::{Hit, hit_test};

    #[test]
    fn transparent_gutter_and_rounded_cutout_do_not_claim_client_input() {
        assert_eq!(
            hit_test(1100.0, 780.0, 8.0, 300.0, 1.0, false),
            Hit::Transparent
        );
        assert_eq!(
            hit_test(1100.0, 780.0, 1095.0, 500.0, 1.0, false),
            Hit::Transparent
        );
        assert_eq!(
            hit_test(1100.0, 780.0, 17.0, 17.0, 1.0, false),
            Hit::Transparent
        );
        assert_eq!(
            hit_test(1100.0, 780.0, 1082.0, 762.0, 1.0, false),
            Hit::Transparent
        );
    }

    #[test]
    fn client_content_uses_existing_window_procedure() {
        assert_eq!(
            hit_test(1100.0, 780.0, 500.0, 300.0, 1.0, false),
            Hit::Native
        );
        assert_eq!(hit_test(1100.0, 780.0, 90.0, 38.0, 1.0, false), Hit::Native);
        assert_eq!(
            hit_test(1100.0, 780.0, 1050.0, 38.0, 1.0, false),
            Hit::Native
        );
    }

    #[test]
    fn visible_edges_keep_native_resize_hits() {
        for (x, y, expected) in [
            (18.0, 300.0, Hit::Left),
            (1082.0, 300.0, Hit::Right),
            (500.0, 18.0, Hit::Top),
            (500.0, 762.0, Hit::Bottom),
            (23.0, 23.0, Hit::TopLeft),
            (1077.0, 23.0, Hit::TopRight),
            (23.0, 757.0, Hit::BottomLeft),
            (1077.0, 757.0, Hit::BottomRight),
        ] {
            assert_eq!(hit_test(1100.0, 780.0, x, y, 1.0, false), expected);
        }
    }

    #[test]
    fn geometry_uses_live_size_and_dpi_not_reference_window_fractions() {
        assert_eq!(hit_test(860.0, 620.0, 18.0, 300.0, 1.0, false), Hit::Left);
        assert_eq!(hit_test(1720.0, 1240.0, 36.0, 600.0, 2.0, false), Hit::Left);
        assert_eq!(hit_test(1375.0, 975.0, 22.5, 375.0, 1.25, false), Hit::Left);
        assert_eq!(
            hit_test(1720.0, 1240.0, 24.0, 600.0, 2.0, false),
            Hit::Transparent
        );
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
