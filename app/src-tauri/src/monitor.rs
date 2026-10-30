use crate::{
    commands::snapshot,
    models::{now_ms, FileChange},
    state::AppState,
};
use serde_json::{json, Value};
use std::{
    sync::atomic::Ordering,
    time::Duration,
};
use tauri::{AppHandle, Emitter, Manager};

/// Observa os jobs do rclone e mantém perfis, atividade e a UI atualizados.
pub fn spawn(app: AppHandle) {
    tauri::async_runtime::spawn(async move {
        loop {
            tick(&app).await;
            tokio::time::sleep(Duration::from_secs(2)).await;
        }
    });
}

async fn tick(app: &AppHandle) {
    let state = app.state::<AppState>();
    if state.paused.load(Ordering::SeqCst) {
        set_tooltip(app, "pausado");
        return;
    }
    if !state.rclone.is_running().await {
        return;
    }

    // Nada em andamento: nenhuma chamada ao rclone, nenhum trabalho.
    let pending = state.pending_jobs().await;
    if pending.is_empty() {
        set_tooltip(app, "tudo em dia");
        return;
    }

    set_tooltip(app, "sincronizando");
    let (notify_enabled, auto_retry) = {
        let settings = state.settings.lock().await;
        (settings.notifications, settings.auto_retry)
    };

    for (job_id, record) in pending {
        let fetched = state
            .rclone
            .call("job/status", json!({ "jobid": job_id }), Duration::from_secs(5))
            .await
            .ok();

        let mut log_text = String::new();
        let (finished, success, error, moved) = match fetched {
            Some(status) => {
                // O bisync devolve o log da execução em `output.output`; é por ele
                // que sabemos se a verificação automática moveu algum arquivo.
                let log = status
                    .get("output")
                    .and_then(|output| output.get("output"))
                    .and_then(Value::as_str)
                    .unwrap_or_default();
                log_text = log.to_string();
                (
                    status
                        .get("finished")
                        .and_then(Value::as_bool)
                        .unwrap_or(true),
                    status
                        .get("success")
                        .and_then(Value::as_bool)
                        .unwrap_or(false),
                    status
                        .get("error")
                        .and_then(Value::as_str)
                        .unwrap_or("")
                        .to_string(),
                    moved_anything(log),
                )
            }
            None => {
                // O rclone pode descartar tarefas antigas; depois de algumas
                // tentativas seguidas desistimos em vez de ficar preso.
                if state.record_job_miss(job_id).await < 5 {
                    continue;
                }
                (
                    true,
                    false,
                    "não foi possível consultar o estado da tarefa".to_string(),
                    true,
                )
            }
        };

        if !finished {
            continue;
        }

        state.mark_job_done(job_id).await;

        let raw_error = clean_error(&error);
        let error = friendly_error(&raw_error);

        let mut caminhos = (String::new(), String::new());
        let mut conta = String::new();
        {
            let mut profiles = state.profiles.lock().await;
            if let Some(profile) = profiles.iter_mut().find(|item| item.id == record.profile_id) {
                caminhos = (profile.remote(), profile.local_path.clone());
                conta = profile.account.clone();
                if success {
                    profile.last_sync = Some(now_ms());
                    profile.last_error = None;
                    profile.resync_needed = false;
                } else {
                    profile.last_error = Some(if error.is_empty() {
                        "a sincronização falhou".to_string()
                    } else {
                        error.clone()
                    });
                    // Além do pedido explícito do usuário, o rclone avisa quando
                    // a lista anterior sumiu e a próxima execução precisa de um
                    // --resync; sem isso a pasta falharia para sempre.
                    if record.resync || needs_resync(&raw_error) {
                        profile.resync_needed = true;
                    }
                }
            }
            state.save_profiles(&profiles);
        }

        // Conta OneDrive conectada sem `drive_id`: completa a configuração e deixa
        // a próxima execução ressincronizar, em vez de falhar para sempre.
        if !success && !conta.is_empty() && precisa_reparar_onedrive(&raw_error) {
            match crate::commands::completar_onedrive(&state, &conta).await {
                Ok(()) => {
                    let mut profiles = state.profiles.lock().await;
                    if let Some(profile) =
                        profiles.iter_mut().find(|item| item.id == record.profile_id)
                    {
                        profile.resync_needed = true;
                    }
                    state.save_profiles(&profiles);
                    state
                        .push_activity(
                            "account",
                            "Conta OneDrive reconfigurada",
                            &format!("{}: o drive foi escolhido; a próxima execução ressincroniza", conta),
                            Some(&record.profile_id),
                        )
                        .await;
                    let _ = app.emit("sync://changed", ());
                }
                Err(error) => eprintln!("onedrive: reparo falhou: {error}"),
            }
        }

        let (kind, title) = if success {
            ("sync", "Sincronização concluída")
        } else {
            ("error", "Falha na sincronização")
        };
        let elapsed = now_ms().saturating_sub(record.started_at) / 1000;
        let detail = if success && elapsed >= 2 {
            format!("{} está em dia · {} s", record.profile_name, elapsed)
        } else if success {
            format!("{} está em dia", record.profile_name)
        } else if error.is_empty() {
            format!("{} não sincronizou", record.profile_name)
        } else {
            format!("{}: {}", record.profile_name, error)
        };

        // Verificação automática que não moveu nada não polui a atividade nem
        // dispara notificação — o cartão da pasta e “última verificação” já
        // mostram que o app está acordado.
        let silencioso = success && !record.manual && !moved;

        if !silencioso {
            // Só faz sentido listar arquivos de uma execução que terminou bem;
            // numa falha a lista mostraria intenção, não resultado.
            let files = if success {
                file_changes(&log_text, &caminhos.0, &caminhos.1)
            } else {
                Vec::new()
            };
            state
                .push_activity_with_files(kind, title, &detail, Some(&record.profile_id), files)
                .await;
        }

        if notify_enabled && !silencioso {
            use tauri_plugin_notification::NotificationExt;
            let heading = if success {
                "Nuvem — sincronização concluída"
            } else {
                "Nuvem — falha na sincronização"
            };
            let _ = app
                .notification()
                .builder()
                .title(heading)
                .body(&detail)
                .show();
        }

        let used = state.attempts_used(&record.profile_id).await;
        if success {
            state.reset_attempts(&record.profile_id).await;
        } else if let Some((attempt, wait)) =
            crate::retry::next_attempt(false, &error, auto_retry, used)
        {
            // Falha transitória: repete sozinho, com espera crescente, sem passar de
            // MAX_ATTEMPTS para não mascarar um problema real.
            state.bump_attempt(&record.profile_id).await;
            state
                .push_activity(
                        "sync",
                    "Nova tentativa agendada",
                    &format!(
                        "{} tenta de novo em {} s (tentativa {} de {})",
                        record.profile_name,
                        wait.as_secs(),
                        attempt,
                        crate::retry::MAX_ATTEMPTS
                    ),
                    Some(&record.profile_id),
                )
                .await;
            schedule_retry(app, record.profile_id.clone(), wait);
        }
    }

    state.prune_jobs(12).await;
    // O snapshot move o cabeçalho; `sync://changed` é o que faz a janela reler
    // perfis e atividade. Sem ele a lista continuava mostrando “Sincronização
    // iniciada” e a pasta seguia marcada com o erro anterior.
    let _ = app.emit("sync://changed", ());
    let _ = app.emit("sync://snapshot", snapshot(&state).await);
}

/// Agenda uma nova tentativa do perfil. Revalida na hora de executar: o usuário
/// pode ter pausado o app, desativado ou removido a pasta durante a espera.
fn schedule_retry(app: &AppHandle, profile_id: String, wait: Duration) {
    let app = app.clone();
    tauri::async_runtime::spawn(async move {
        tokio::time::sleep(wait).await;
        let state = app.state::<AppState>();
        if state.paused.load(Ordering::SeqCst) {
            return;
        }
        let enabled = state
            .profiles
            .lock()
            .await
            .iter()
            .any(|profile| profile.id == profile_id && profile.enabled);
        if !enabled {
            return;
        }

        if let Err(error) = crate::commands::start_profile(&state, &profile_id, false).await {
            state
                .push_activity(
                    "error",
                    "Não foi possível repetir",
                    &error.to_string(),
                    Some(&profile_id),
                )
                .await;
            let _ = app.emit("sync://changed", ());
        }
    });
}

/// O rclone colore parte das mensagens com códigos ANSI; na interface isso
/// aparecia como lixo (\u{1b}[31m) no meio do texto.
fn clean_error(text: &str) -> String {
    let mut out = String::with_capacity(text.len());
    let mut chars = text.chars();
    while let Some(character) = chars.next() {
        if character == '\u{1b}' {
            for next in chars.by_ref() {
                if next.is_ascii_alphabetic() {
                    break;
                }
            }
        } else {
            out.push(character);
        }
    }
    out.trim().to_string()
}

/// Lê as linhas de fila do bisync para descobrir o que aconteceu com cada
/// arquivo. `Path1` é a nuvem e `Path2` a pasta local — é assim que
/// `start_profile` monta o bisync —, e cada linha diz para qual lado a ação foi
/// enfileirada:
///
/// ```text
/// - Path1     Queue copy to Path2        - /home/ana/Brisa/sub/tres.txt
/// - Path2     Queue delete               - /home/ana/Brisa/sub/dois.txt
/// ```
fn file_changes(log: &str, remote: &str, local: &str) -> Vec<FileChange> {
    /// Um log de sincronização de pasta enorme não deve virar um JSON gigante.
    const LIMITE: usize = 80;
    let mut changes: Vec<FileChange> = Vec::new();

    for raw in log.lines() {
        let line = clean_error(raw);
        let Some((_, resto)) = line.split_once(" - ") else {
            continue;
        };
        let Some((descricao, caminho)) = resto.rsplit_once(" - ") else {
            continue;
        };

        let (action, base) = if descricao.contains("Queue copy to Path2") {
            // veio da nuvem
            ("received", local)
        } else if descricao.contains("Queue copy to Path1") {
            // foi para a nuvem
            ("sent", remote)
        } else if descricao.contains("Queue delete") {
            // A exclusão é aplicada no lado que ainda tem o arquivo: se ela é
            // enfileirada no local, o arquivo sumiu da nuvem.
            if descricao.trim_start().starts_with("Path2") {
                ("deletedRemote", local)
            } else {
                ("deletedLocal", remote)
            }
        } else {
            // "Do queued copies to", diffs, validação: nada a registrar aqui.
            continue;
        };

        let name = relativo(caminho, base);
        if name.is_empty() {
            continue;
        }
        let change = FileChange {
            name,
            action: action.to_string(),
        };
        if changes.len() < LIMITE && !changes.contains(&change) {
            changes.push(change);
        }
    }
    changes
}

/// `/home/ana/Brisa/sub/tres.txt` + `/home/ana/Brisa` → `sub/tres.txt`
fn relativo(caminho: &str, base: &str) -> String {
    let caminho = caminho.trim();
    let base = base.trim_end_matches('/');
    if base.is_empty() {
        return caminho.to_string();
    }
    if let Some(resto) = caminho.strip_prefix(base) {
        // Caminho local: a base termina antes de uma barra. Remoto (`gdrive:x`):
        // o separador é o próprio `:`.
        if let Some(limpo) = resto.strip_prefix('/') {
            return limpo.to_string();
        }
        if base.ends_with(':') {
            return resto.to_string();
        }
    }
    // Rede de segurança: base sem o nome do remote (`Documentos` contra
    // `gdrive:Documentos/arquivo`).
    if !base.contains(':') {
        if let Some((_, depois)) = caminho.split_once(':') {
            let depois = depois.trim_start_matches('/');
            if let Some(resto) = depois.strip_prefix(base) {
                return resto.trim_start_matches('/').to_string();
            }
        }
    }
    caminho.to_string()
}

/// O log do bisync diz explicitamente quando nada mudou; qualquer outro caso
/// com resumo de mudanças conta como movimento. Log vazio (por exemplo de uma
/// versão anterior do app) não esconde nada: melhor avisar a mais.
fn moved_anything(log: &str) -> bool {
    if log.trim().is_empty() {
        return true;
    }
    if log.contains("No changes found") {
        return false;
    }
    log.contains(" changes:")
}

/// Erros que o usuário consegue resolver sozinho, explicados sem jargão.
fn friendly_error(error: &str) -> String {
    let lower = error.to_lowercase();
    if lower.contains("drive_id and drive_type") {
        return "a conta OneDrive foi conectada sem escolher o drive. O Nuvem tenta completar isso sozinho — se a mensagem voltar, remova a conta em Visão geral → Contas e conecte de novo.".to_string();
    }
    if lower.contains("too many deletes") {
        // Proteção do bisync: ele recusa apagar muita coisa de uma vez para não
        // mascarar uma listagem incompleta. Uma nova sincronização confirma.
        return "o rclone bloqueou muitas exclusões de uma vez. Toque em sincronizar de novo para confirmar as exclusões (ressincronização).".to_string();
    }
    if lower.contains("prior lock file found") || lower.contains("is locked by") {
        // Trava deixada por uma execução interrompida (app fechado no meio). O app
        // remove sozinho na próxima tentativa; a mensagem não deve mandar o usuário
        // “esperar” por algo que não vai destravar sozinho.
        return "uma execução anterior desta pasta não terminou (o Nuvem foi fechado no meio?). A trava é removida na próxima sincronização.".to_string();
    }
    error.to_string()
}

/// Mensagens em que o rclone pede uma ressincronização completa.
/// O erro clássico de conta OneDrive conectada pela metade.
fn precisa_reparar_onedrive(error: &str) -> bool {
    error.contains("drive_id and drive_type")
}

fn needs_resync(error: &str) -> bool {
    let lower = error.to_lowercase();
    [
        "resync",
        "prior listing",
        "cannot find prior",
        "listing not found",
        "previous listing",
        "too many deletes",
        // O rclone pede confirmação quando a lista anterior foi descartada.
        "empty prior",
    ]
    .iter()
    .any(|needle| lower.contains(needle))
}

fn set_tooltip(app: &AppHandle, status: &str) {
    if let Some(tray) = app.tray_by_id("main") {
        let _ = tray.set_tooltip(Some(format!("Nuvem — {status}")));
    }
}

#[cfg(test)]
mod tests {
    use super::{
        clean_error, file_changes, friendly_error, moved_anything, needs_resync,
        precisa_reparar_onedrive, relativo,
    };
    use crate::models::FileChange;


    fn mudanca(nome: &str, action: &str) -> FileChange {
        FileChange {
            name: nome.to_string(),
            action: action.to_string(),
        }
    }

    #[test]
    fn historico_por_arquivo_em_cada_direcao() {
        let log = "2026/10/29 22:29:45 INFO  : - Path1     Queue copy to Path2        - /home/ana/Brisa/sub/tres.txt
2026/10/29 22:29:45 INFO  : - Path2     Queue copy to Path1        - gdrive:Documentos/quatro.txt
2026/10/29 22:29:45 INFO  : - Path2     Queue delete               - /home/ana/Brisa/sub/dois.txt
2026/10/29 22:29:45 INFO  : - Path1     Queue delete               - gdrive:Documentos/velho.txt
2026/10/29 22:29:45 INFO  : - Path1     Do queued copies to Path2  - Path2
2026/10/29 22:29:45 INFO  : Path1 checking for diffs
";
        assert_eq!(
            file_changes(log, "gdrive:Documentos", "/home/ana/Brisa"),
            vec![
                mudanca("sub/tres.txt", "received"),
                mudanca("quatro.txt", "sent"),
                mudanca("sub/dois.txt", "deletedRemote"),
                mudanca("velho.txt", "deletedLocal"),
            ]
        );
    }

    #[test]
    fn historico_ignora_cor_do_terminal() {
        // Linha real do rclone: os códigos ANSI vêm no meio das palavras.
        let log = "2026/10/29 22:29:45 INFO  : - \u{1b}[34mPath2\u{1b}[0m    \u{1b}[35m\u{1b}[32mQueue copy to\u{1b}[0m Path1\u{1b}[0m       - \u{1b}[36m/tmp/bis-a/quatro.txt\u{1b}[0m";
        assert_eq!(
            file_changes(log, "/tmp/bis-a", "/tmp/bis-b"),
            vec![mudanca("quatro.txt", "sent")]
        );
    }

    #[test]
    fn caminho_fica_relativo_a_pasta() {
        assert_eq!(relativo("/home/ana/Brisa/sub/a.txt", "/home/ana/Brisa/"), "sub/a.txt");
        assert_eq!(relativo("gdrive:Documentos/a.txt", "gdrive:Documentos"), "a.txt");
        // Base sem o nome do remote: recorta pelo caminho do perfil.
        assert_eq!(relativo("gdrive:Documentos/a.txt", "Documentos"), "a.txt");
        // Fora da base (não deveria acontecer) mantém o caminho como veio.
        assert_eq!(relativo("/outro/a.txt", "/home/ana/Brisa"), "/outro/a.txt");
    }

    #[test]
    fn reconhece_conta_onedrive_incompleta() {
        let erro = "unable to get drive_id and drive_type - if you are upgrading from older versions of rclone, please run `rclone config` and re-configure this backend";
        assert!(precisa_reparar_onedrive(erro));
        assert!(!precisa_reparar_onedrive("too many deletes"));
        assert!(friendly_error(erro).contains("sem escolher o drive"));
    }

    #[test]
    fn remove_codigos_ansi_do_rclone() {
        let cru = "\u{1b}[31mprior lock file found\u{1b}[0m: \u{1b}[93m/home/x.lck\u{1b}[0m";
        assert_eq!(clean_error(cru), "prior lock file found: /home/x.lck");
    }

    #[test]
    fn texto_sem_ansi_fica_igual() {
        assert_eq!(clean_error(" too many deletes "), "too many deletes");
    }

    #[test]
    fn pede_resync_quando_a_lista_anterior_sumiu() {
        assert!(needs_resync("cannot find prior listing"));
        assert!(needs_resync("Bisync aborted. Try running with --resync"));
        assert!(needs_resync("too many deletes"));
        assert!(!needs_resync("no such host"));
    }

    #[test]
    fn reconhece_verificacao_sem_mudancas() {
        let parado = "INFO  : Path1 checking for diffs\nINFO  : No changes found\nINFO  : Updating listings\n";
        assert!(!moved_anything(parado));
    }

    #[test]
    fn reconhece_arquivo_novo() {
        let log = "INFO  : Path2:    1 changes:    1 new,    0 modified,    0 deleted\nINFO  : dois.txt: Copied (new)\n";
        assert!(moved_anything(log));
    }

    #[test]
    fn log_ausente_nao_esconde_aviso() {
        assert!(moved_anything(""));
        assert!(moved_anything("   \n"));
    }

    #[test]
    fn traducao_de_erros_conhecidos() {
        assert!(friendly_error("too many deletes").contains("exclusões"));
        assert!(friendly_error("prior lock file found: /tmp/x.lck").contains("trava"));
        assert_eq!(friendly_error("no such host"), "no such host");
    }
}
