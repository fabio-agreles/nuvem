use std::{
    path::PathBuf,
    sync::atomic::{AtomicU8, Ordering},
};
use tauri::{
    image::Image,
    menu::{Menu, MenuItem},
    tray::{MouseButton, TrayIconBuilder, TrayIconEvent},
    App, AppHandle, Emitter, Manager, Theme,
};

/// Ícones simbólicos embutidos no binário: nada para procurar em disco — e o
/// Flatpak não deixaria o app ler os ícones fora do sandbox.
///
/// São só traço, na cor do tema: preto nos painéis claros, branco nos escuros.
const SIMBOLICO_CLARO: &[u8] = include_bytes!("../icons/tray/tray-black.png");
const SIMBOLICO_ESCURO: &[u8] = include_bytes!("../icons/tray/tray-white.png");

/// Pasta onde o ícone é gravado para o painel ler.
///
/// O `tray-icon` grava por padrão em `$XDG_RUNTIME_DIR/tray-icon` — e dentro do
/// Flatpak esse caminho é um tmpfs privado do sandbox: o painel do KDE/GNOME, do
/// lado de fora, não enxerga o arquivo e cai no ícone do aplicativo. Usando o
/// cache (que é visível no sistema) o painel lê o PNG certo.
fn pasta_dos_icones() -> PathBuf {
    let base = std::env::var_os("XDG_CACHE_HOME")
        .map(PathBuf::from)
        .or_else(|| std::env::var_os("HOME").map(|home| PathBuf::from(home).join(".cache")))
        // Windows não tem XDG: `%LOCALAPPDATA%` é o equivalente de cache.
        .or_else(|| std::env::var_os("LOCALAPPDATA").map(PathBuf::from))
        .unwrap_or_else(std::env::temp_dir);
    let dir = base.join("nuvem").join("bandeja");
    let _ = std::fs::create_dir_all(&dir);
    dir
}

/// Última cor aplicada: 0 = preto, 1 = branco, 2 = ainda nenhuma.
static APLICADO: AtomicU8 = AtomicU8::new(2);

fn guardar_cor(escuro: bool) {
    APLICADO.store(u8::from(escuro), Ordering::Relaxed);
}

fn icone(escuro: bool) -> Option<Image<'static>> {
    let bytes = if escuro { SIMBOLICO_ESCURO } else { SIMBOLICO_CLARO };
    match Image::from_bytes(bytes) {
        Ok(icon) => Some(icon),
        Err(error) => {
            eprintln!("bandeja: ícone simbólico inválido: {error}");
            None
        }
    }
}

/// Troca o ícone da bandeja conforme o tema em uso.
///
/// O painel do KDE/GNOME não recolore ícones de bandeja, então a cor vem daqui:
/// preto para o tema claro, branco para o escuro.
pub fn apply_theme(app: &AppHandle, escuro: bool) {
    // O front-end avisa o tema ao montar; se for o mesmo já escolhido pelo
    // sistema, não vale reescrever o PNG (o painel pisca à toa).
    if APLICADO.swap(u8::from(escuro), Ordering::Relaxed) == u8::from(escuro) {
        return;
    }
    let Some(tray) = app.tray_by_id("main") else {
        return;
    };
    if let Some(icon) = icone(escuro) {
        if let Err(error) = tray.set_icon(Some(icon)) {
            eprintln!("bandeja: não foi possível trocar o ícone: {error}");
        }
    }
}

pub fn init(app: &mut App) -> tauri::Result<()> {
    let open = MenuItem::with_id(app, "open", "Abrir Nuvem", true, None::<&str>)?;
    let sync = MenuItem::with_id(app, "sync", "Sincronizar agora", true, None::<&str>)?;
    let quit = MenuItem::with_id(app, "quit", "Sair", true, None::<&str>)?;
    let menu = Menu::with_items(app, &[&open, &sync, &quit])?;

    // Antes de a janela carregar o tema, usa o do sistema. O front-end confirma
    // (ou corrige) assim que monta, pelo comando `set_tray_theme`.
    let escuro = app
        .get_webview_window("main")
        .and_then(|window| window.theme().ok())
        .map(|theme| theme == Theme::Dark)
        .unwrap_or(false);

    let mut builder = TrayIconBuilder::with_id("main")
        .temp_dir_path(pasta_dos_icones())
        .tooltip("Nuvem")
        .menu(&menu)
        .show_menu_on_left_click(false)
        .on_menu_event(|app, event| match event.id().as_ref() {
            "open" => {
                if let Some(window) = app.get_webview_window("main") {
                    let _ = window.show();
                    let _ = window.unminimize();
                    let _ = window.set_focus();
                }
            }
            "sync" => {
                if let Some(window) = app.get_webview_window("main") {
                    let _ = window.show();
                    let _ = window.set_focus();
                }
                let _ = app.emit("ui://sync-all", ());
            }
            "quit" => app.exit(0),
            _ => {}
        })
        .on_tray_icon_event(|tray, event| {
            if let TrayIconEvent::Click {
                button: MouseButton::Left,
                ..
            } = event
            {
                let app = tray.app_handle();
                if let Some(window) = app.get_webview_window("main") {
                    let _ = window.show();
                    let _ = window.unminimize();
                    let _ = window.set_focus();
                }
            }
        });

    if let Some(icon) = icone(escuro) {
        builder = builder.icon(icon);
    }
    guardar_cor(escuro);

    builder.build(app)?;
    Ok(())
}

#[cfg(test)]
mod tests {
    use super::icone;

    /// Os dois PNGs viajam embutidos: se um deles quebrar (ou sumir do
    /// repositório), o `cargo test` avisa antes de o app abrir sem ícone.
    #[test]
    fn icones_simbolicos_carregam() {
        for escuro in [false, true] {
            let icon = icone(escuro).expect("ícone simbólico embutido");
            assert_eq!(icon.width(), 64);
            assert_eq!(icon.height(), 64);
            // O Tauri só aceita o ícone se o buffer RGBA tiver o tamanho exato;
            // caso contrário descarta em silêncio e a bandeja usa o ícone do app.
            assert_eq!(icon.rgba().len(), 64 * 64 * 4);
        }
    }
}
