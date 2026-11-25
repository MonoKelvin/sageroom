use std::{sync::Mutex, time::Duration};

use tauri::{
    AppHandle, Emitter, Manager, PhysicalPosition, WebviewUrl, WebviewWindow, WebviewWindowBuilder,
    image::Image,
    tray::{MouseButton, MouseButtonState, TrayIconEvent},
};

use crate::domain::contracts::{InboxGetRequest, InboxSummary, TraySyncState};

pub const POPUP_LABEL: &str = "tray_popup";
pub const TRAY_ID: &str = "sageroom";
const POPUP_WIDTH: f64 = 320.0;
const POPUP_HEIGHT: f64 = 288.0;
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
        .inner_size(POPUP_WIDTH, POPUP_HEIGHT)
        .min_inner_size(260.0, 180.0)
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

pub fn show_popup(app: &AppHandle, position: PhysicalPosition<f64>) {
    let Some(window) = app.get_webview_window(POPUP_LABEL) else {
        return;
    };
    let state = app.state::<TrayState>();
    state.set_anchor(position);
    // 面板高度按未读会话数伸缩，避免少数会话时留大片空白、多会话时被固定高度裁切。
    let count = app.state::<TrayState>().conversation_count();
    let logical_height = (52.0 + count.min(5) as f64 * 56.0).max(108.0);
    let scale = window.scale_factor().unwrap_or(1.0);
    let _ = window.set_size(tauri::Size::Physical(tauri::PhysicalSize {
        width: (POPUP_WIDTH * scale) as u32,
        height: (logical_height * scale) as u32,
    }));
    let size = window
        .outer_size()
        .unwrap_or(tauri::PhysicalSize::new(POPUP_WIDTH as u32, POPUP_HEIGHT as u32));
    let monitor = window
        .current_monitor()
        .ok()
        .flatten()
        .or_else(|| app.primary_monitor().ok().flatten());
    let mut x = position.x - size.width as f64 / 2.0;
    let mut y = position.y - size.height as f64 - 12.0;
    if let Some(monitor) = monitor {
        let origin = monitor.position();
        let screen = monitor.size();
        let min_x = origin.x as f64 + 8.0;
        let max_x = origin.x as f64 + screen.width as f64 - size.width as f64 - 8.0;
        x = x.clamp(min_x, max_x.max(min_x));
        let min_y = origin.y as f64 + 8.0;
        if y < min_y {
            // 任务栏在顶部或图标过高时翻到图标下方。
            y = position.y + 20.0;
        }
        let max_y = origin.y as f64 + screen.height as f64 - size.height as f64 - 8.0;
        y = y.clamp(min_y, max_y.max(min_y));
    }
    let _ = window.set_position(PhysicalPosition::new(x, y));
    let _ = window.show();
    // 直接读取并推送汇总，避免面板自己两次 IPC 与事件监听的时序竞态。
    let push_app = app.clone();
    tauri::async_runtime::spawn(async move {
        let Some(state) = push_app.try_state::<crate::app::state::AppState>() else { return };
        let Ok(worker) = state.worker() else { return };
        let generation = state.generation.clone();
        if let Ok(summary) = worker.get_inbox(InboxGetRequest { data_generation_id: generation }).await {
            let _ = push_app.emit("sageroom-tray-summary", summary);
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
        TrayIconEvent::Enter { position, .. } => {
            if app.state::<TrayState>().has_conversations() {
                show_popup(app, *position);
            }
        }
        // 部分 Windows 环境只上报 Move 而不上报 Enter，这里按不可见状态兜底。
        TrayIconEvent::Move { position, .. } => {
            if !app.state::<TrayState>().has_conversations() {
                return;
            }
            if app
                .get_webview_window(POPUP_LABEL)
                .is_some_and(|window| !window.is_visible().unwrap_or(false))
            {
                show_popup(app, *position);
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
    fn flashing_flag_is_independent_of_conversation_count() {
        let state = TrayState::default();
        let synced = state.sync(true, 0);
        assert!(synced.flashing);
        assert!(state.flashing());
        assert!(!state.has_conversations());
    }
}
