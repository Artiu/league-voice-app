#![cfg_attr(
    all(not(debug_assertions), target_os = "windows"),
    windows_subsystem = "windows"
)]

mod league_client;

use tauri::{
    CustomMenuItem, Manager, SystemTray, SystemTrayEvent, SystemTrayMenu, SystemTrayMenuItem,
    Window,
};
use windows::{
    s,
    Win32::UI::WindowsAndMessaging::{
        FindWindowA, SetForegroundWindow, ShowWindow, SW_SHOWDEFAULT,
    },
};

#[tauri::command]
fn get_from_lol_client(path: String, port: i32, password: &str) -> Option<String> {
    league_client::get(path, port, password)
}

fn show_window(window: Window) {
    //Doubled events are there because if I'm changing window state by win32, windowState in tauri is not being updated
    window.hide().unwrap();
    window.show().unwrap();
    window.set_focus().unwrap();
}

fn main() {
    unsafe {
        let window = FindWindowA(None, s!("League Voice"));
        if window.0 != 0 {
            ShowWindow(window, SW_SHOWDEFAULT);
            SetForegroundWindow(window);
            return;
        }
    }
    let quit = CustomMenuItem::new("quit".to_string(), "Quit");
    let hide = CustomMenuItem::new("toggle_visibility".to_string(), "Show / Hide");
    let tray_menu = SystemTrayMenu::new()
        .add_item(hide)
        .add_native_item(SystemTrayMenuItem::Separator)
        .add_item(quit);
    let tray = SystemTray::new().with_menu(tray_menu);
    tauri::Builder::default()
        .on_window_event(|event| match event.event() {
            tauri::WindowEvent::CloseRequested { api, .. } => {
                api.prevent_close();
                event.window().show().unwrap();
                event.window().hide().unwrap();
            }
            _ => {}
        })
        .system_tray(tray)
        .on_system_tray_event(|app, event| match event {
            SystemTrayEvent::LeftClick { .. } => {
                let window = app.get_window("main").unwrap();
                show_window(window);
            }
            SystemTrayEvent::MenuItemClick { id, .. } => match id.as_str() {
                "quit" => {
                    app.exit(0);
                }
                "toggle_visibility" => {
                    let window = app.get_window("main").unwrap();
                    if window.is_visible().unwrap() {
                        window.show().unwrap();
                        window.hide().unwrap();
                        return;
                    }
                    show_window(window);
                }
                _ => {}
            },
            _ => {}
        })
        .invoke_handler(tauri::generate_handler![get_from_lol_client])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
