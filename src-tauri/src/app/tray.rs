use std::{sync::Mutex, time::Duration};

use tauri::{
    AppHandle, Emitter, Manager, PhysicalPosition, Rect, WebviewUrl, WebviewWindow,
    WebviewWindowBuilder,
    image::Image,
    tray::{MouseButton, MouseButtonState, TrayIconEvent},
};

use crate::domain::contracts::{InboxGetRequest, TraySyncState};

pub const POPUP_LABEL: &str = "tray_popup";
pub const TRAY_ID: &str = "sageroom";
const POPUP_WIDTH: f64 = 260.0;
/// 与 tray.css 的尺寸一一对应：面板 padding 8 + 边框 1（每侧共 9），
/// 列表项固定 52，项间距 2。窗口高度必须精确匹配，否则会出现无谓滚动条或空白。
const PANEL_INSET: f64 = 9.0;
const ITEM_HEIGHT: f64 = 52.0;
const ITEM_GAP: f64 = 2.0;
/// 超过 3 条才让列表内部滚动；少于 3 条则按实际条数收缩窗口。
const MAX_VISIBLE_ITEMS: u32 = 3;
const MIN_POPUP_HEIGHT: f64 = PANEL_INSET * 2.0 + ITEM_HEIGHT;
/// 面板下沿与任务栏上沿的留白；面板固定在工作区底部，不跟随鼠标。
const TASKBAR_GAP: f64 = 8.0;
const FLASH_INTERVAL: Duration = Duration::from_millis(700);
const ANCHOR_RADIUS: f64 = 90.0;

#[derive(Default)]
struct Inner {
    flashing: bool,
    conversation_count: u32,
    anchor: Option<PhysicalPosition<f64>>,
    watching: bool,
}

/// 托盘提醒状态：主窗口只推送“是否闪烁”，闪烁节奏与窗口跟随由这里统一处理。
#[derive(Default)]
pub struct TrayState(Mutex<Inner>);

impl TrayState {
    pub fn flashing(&self) -> bool {
        self.0.lock().expect("托盘状态锁被污染").flashing
    }

    pub fn sync(&self, flashing: bool, conversation_count: u32) -> TraySyncState {
        let mut inner = self.0.lock().expect("托盘状态锁被污染");
        inner.flashing = flashing;
        inner.conversation_count = conversation_count;
        TraySyncState { flashing }
    }

    /// 没有会话时悬停不弹面板：空列表没有可点的东西，弹出来只是遮挡。
    fn has_conversations(&self) -> bool {
        self.0.lock().expect("托盘状态锁被污染").conversation_count > 0
    }

    fn conversation_count(&self) -> u32 {
        self.0.lock().expect("托盘状态锁被污染").conversation_count
    }

    fn set_anchor(&self, anchor: PhysicalPosition<f64>) {
        self.0.lock().expect("托盘状态锁被污染").anchor = Some(anchor);
    }

    fn anchor(&self) -> Option<PhysicalPosition<f64>> {
        self.0.lock().expect("托盘状态锁被污染").anchor
    }

    fn begin_watch(&self) -> bool {
        let mut inner = self.0.lock().expect("托盘状态锁被污染");
        if inner.watching {
            return false;
        }
        inner.watching = true;
        true
    }

    fn end_watch(&self) {
        self.0.lock().expect("托盘状态锁被污染").watching = false;
    }
}

/// 托盘图标两态：普通态与品牌色提醒点，提醒点用于闪烁时交替显示。
fn tray_icon(alert: bool) -> Option<Image<'static>> {
    let source = image::load_from_memory(include_bytes!("../../icons/icon.png")).ok()?;
    let mut canvas = image::imageops::resize(
        &source.to_rgba8(),
        32,
        32,
        image::imageops::FilterType::Lanczos3,
    );
    if alert {
        let (width, _) = canvas.dimensions();
        let radius = width as f32 * 0.19;
        let center_x = width as f32 - radius - 1.0;
        let center_y = radius + 1.0;
        for y in 0..canvas.height() {
            for x in 0..canvas.width() {
                let dx = x as f32 + 0.5 - center_x;
                let dy = y as f32 + 0.5 - center_y;
                if (dx * dx + dy * dy).sqrt() <= radius {
                    // 品牌色 #c94a4a，与浅色主题的 --semantic-accent 保持一致。
                    canvas.put_pixel(x, y, image::Rgba([201, 74, 74, 255]));
                }
            }
        }
    }
    Some(Image::new_owned(canvas.into_raw(), 32, 32))
}

pub fn start_flasher(app: AppHandle) {
    tauri::async_runtime::spawn(async move {
        let normal = tray_icon(false);
        let alert = tray_icon(true);
        let mut phase = 0_u32;
        let mut last: Option<bool> = None;
        loop {
            tokio::time::sleep(FLASH_INTERVAL).await;
            let flashing = app.state::<TrayState>().flashing();
            let alert_now = flashing && phase % 2 == 1;
            phase = phase.wrapping_add(1);
            if last == Some(alert_now) {
                continue;
            }
            last = Some(alert_now);
            let Some(tray) = app.tray_by_id(TRAY_ID) else {
                continue;
            };
            let chosen = if alert_now {
                alert.as_ref().or(normal.as_ref())
            } else {
                normal.as_ref()
            };
            if let Some(chosen) = chosen {
                let _ = tray.set_icon(Some(chosen.clone()));
            }
        }
    });
}

/// 悬浮面板：透明无边框窗口，靠主窗口状态驱动，不抢焦点。
pub fn install_popup(app: &AppHandle) -> tauri::Result<()> {
    WebviewWindowBuilder::new(app, POPUP_LABEL, WebviewUrl::App("index.html".into()))
        .title("Sageroom")
        .inner_size(POPUP_WIDTH, MIN_POPUP_HEIGHT)
        .min_inner_size(POPUP_WIDTH, MIN_POPUP_HEIGHT)
        .decorations(false)
        .transparent(true)
        .shadow(false)
        .resizable(false)
        .always_on_top(true)
        .skip_taskbar(true)
        .focused(false)
        .visible(false)
        .build()?;
    Ok(())
}

fn cursor_inside(app: &AppHandle, window: &WebviewWindow) -> bool {
    let (Ok(cursor), Ok(position), Ok(size)) = (
        app.cursor_position(),
        window.outer_position(),
        window.outer_size(),
    ) else {
        return false;
    };
    let left = position.x as f64;
    let top = position.y as f64;
    cursor.x >= left
        && cursor.x <= left + size.width as f64
        && cursor.y >= top
        && cursor.y <= top + size.height as f64
}

fn cursor_near_anchor(app: &AppHandle, anchor: Option<PhysicalPosition<f64>>) -> bool {
    let (Some(anchor), Ok(cursor)) = (anchor, app.cursor_position()) else {
        return false;
    };
    let dx = cursor.x as f64 - anchor.x;
    let dy = cursor.y as f64 - anchor.y;
    (dx * dx + dy * dy).sqrt() <= ANCHOR_RADIUS
}

/// 列表窗口高度与 CSS 一一对应：1 项起、3 项封顶；超过 3 条由列表自身滚动。
fn popup_height(count: u32) -> f64 {
    let visible = count.clamp(1, MAX_VISIBLE_ITEMS);
    PANEL_INSET * 2.0 + visible as f64 * ITEM_HEIGHT + (visible - 1) as f64 * ITEM_GAP
}

/// 托盘图标的几何中心（物理像素）：面板水平对齐它，而不是在任务栏上方整体居中。
fn tray_icon_center(rect: &Rect, scale: f64) -> PhysicalPosition<f64> {
    let origin = rect.position.to_physical::<f64>(scale);
    let size = rect.size.to_physical::<f64>(scale);
    PhysicalPosition::new(origin.x + size.width / 2.0, origin.y + size.height / 2.0)
}

pub fn show_popup(app: &AppHandle, rect: &Rect) {
    let Some(window) = app.get_webview_window(POPUP_LABEL) else {
        return;
    };
    let state = app.state::<TrayState>();
    let scale = window.scale_factor().unwrap_or(1.0);
    let anchor = tray_icon_center(rect, scale);
    state.set_anchor(anchor);
    let count = state.conversation_count();
    let logical_height = popup_height(count);
    let _ = window.set_size(tauri::Size::Physical(tauri::PhysicalSize {
        // 四舍五入而非截断：高 DPI 下少 1 个物理像素也会触发滚动条。
        width: (POPUP_WIDTH * scale).round() as u32,
        height: (logical_height * scale).round() as u32,
    }));
    let size = window.outer_size().unwrap_or(tauri::PhysicalSize::new(
        POPUP_WIDTH as u32,
        MIN_POPUP_HEIGHT as u32,
    ));
    let monitor = window
        .current_monitor()
        .ok()
        .flatten()
        .or_else(|| app.primary_monitor().ok().flatten());
    // 水平方向贴着托盘图标（并夹在屏幕内），垂直方向贴工作区下沿，也就是任务栏上方。
    let (x, y) = match monitor {
        Some(monitor) => {
            let work = monitor.work_area();
            let screen = monitor.size();
            let screen_origin = monitor.position();
            let min_x = screen_origin.x as f64 + TASKBAR_GAP;
            let max_x = (screen_origin.x as f64 + screen.width as f64
                - size.width as f64
                - TASKBAR_GAP)
                .max(min_x);
            let x = (anchor.x - size.width as f64 / 2.0).clamp(min_x, max_x);
            let y = work.position.y as f64 + work.size.height as f64
                - size.height as f64
                - TASKBAR_GAP;
            (x, y)
        }
        None => (
            anchor.x - size.width as f64 / 2.0,
            anchor.y - size.height as f64 - TASKBAR_GAP,
        ),
    };
    let _ = window.set_position(PhysicalPosition::new(x, y));
    let _ = window.show();
    // 汇总由 Rust 直接推送：Tauri 事件可能早于前端注册监听而丢失，
    // 因此同时把数据写进面板的全局变量并派发 DOM 事件，面板无需靠两次 IPC 才能显示内容。
    let push_app = app.clone();
    let popup = window.clone();
    tauri::async_runtime::spawn(async move {
        let Some(state) = push_app.try_state::<crate::app::state::AppState>() else { return };
        let Ok(worker) = state.worker() else { return };
        let generation = state.generation.clone();
        if let Ok(summary) = worker.get_inbox(InboxGetRequest { data_generation_id: generation.clone() }).await {
            let _ = push_app.emit("sageroom-tray-summary", &summary);
            if let Ok(json) = serde_json::to_string(&summary) {
                // generation 一并注入：点击会话时不再依赖可能失败的 snapshot IPC 才能拿到它。
                let generation_json = serde_json::to_string(&generation).unwrap_or_else(|_| "\"\"".into());
                let script = format!(
                    "window.__TRAY_GENERATION__ = {generation_json}; window.__TRAY_SUMMARY__ = {json}; window.dispatchEvent(new CustomEvent('sageroom-tray-summary-dom', {{ detail: {json} }}))"
                );
                let _ = popup.eval(&script);
            }
        }
    });
    watch_popup(app.clone());
}

fn watch_popup(app: AppHandle) {
    if !app.state::<TrayState>().begin_watch() {
        return;
    }
    tauri::async_runtime::spawn(async move {
        loop {
            tokio::time::sleep(Duration::from_millis(500)).await;
            let Some(window) = app.get_webview_window(POPUP_LABEL) else {
                app.state::<TrayState>().end_watch();
                return;
            };
            if !window.is_visible().unwrap_or(false) {
                app.state::<TrayState>().end_watch();
                return;
            }
            let anchor = app.state::<TrayState>().anchor();
            if !cursor_inside(&app, &window) && !cursor_near_anchor(&app, anchor) {
                let _ = window.hide();
                app.state::<TrayState>().end_watch();
                return;
            }
        }
    });
}

pub fn hide_popup(app: &AppHandle) {
    if let Some(window) = app.get_webview_window(POPUP_LABEL) {
        let _ = window.hide();
    }
}

pub fn on_icon_event(app: &AppHandle, event: &TrayIconEvent) {
    match event {
        TrayIconEvent::Enter { rect, .. } => {
            if app.state::<TrayState>().has_conversations() {
                show_popup(app, rect);
            }
        }
        // 部分 Windows 环境只上报 Move 而不上报 Enter，这里按不可见状态兜底。
        TrayIconEvent::Move { rect, .. } => {
            if !app.state::<TrayState>().has_conversations() {
                return;
            }
            if app
                .get_webview_window(POPUP_LABEL)
                .is_some_and(|window| !window.is_visible().unwrap_or(false))
            {
                show_popup(app, rect);
            }
        }
        TrayIconEvent::Click {
            button: MouseButton::Left,
            button_state: MouseButtonState::Up,
            ..
        } => {
            hide_popup(app);
            super::lifecycle::show_main(app);
        }
        _ => {}
    }
}

#[cfg(test)]
mod tests {
    use super::TrayState;

    #[test]
    fn popup_stays_hidden_until_a_conversation_exists() {
        let state = TrayState::default();
        // 默认没有会话：悬停不应弹出空面板。
        assert!(!state.has_conversations());
        state.sync(false, 1);
        assert!(state.has_conversations());
        // 会话被删空后立即回到不弹出。
        state.sync(false, 0);
        assert!(!state.has_conversations());
    }

    #[test]
    fn popup_height_matches_one_to_three_list_items() {
        // 面板 padding 8×2 + 边框 1×2 + 每项 52 + 项间距 2×(n-1)。
        assert_eq!(super::popup_height(0), 70.0);
        assert_eq!(super::popup_height(1), 70.0);
        assert_eq!(super::popup_height(2), 124.0);
        assert_eq!(super::popup_height(3), 178.0);
        // 超过 3 条窗口不再长高，滚动交给列表自身。
        assert_eq!(super::popup_height(9), 178.0);
    }

    #[test]
    fn flashing_flag_is_independent_of_conversation_count() {
        let state = TrayState::default();
        let synced = state.sync(true, 0);
        assert!(synced.flashing);
        assert!(state.flashing());
        assert!(!state.has_conversations());
    }
}
