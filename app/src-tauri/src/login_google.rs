//! Autorização do Google feita pelo próprio Nuvem Sync.
//!
//! Antes, quem abria o navegador e recebia o retorno era o `rclone authorize`:
//! o laço em `127.0.0.1:53682` é dele, e a última página dizia
//! “All done. Please go back to rclone.” — o nome de outro programa no meio da
//! autorização do Nuvem Sync.
//!
//! Aqui o laço é nosso: o app abre o navegador com `state` sorteado, escuta o
//! retorno em `127.0.0.1`, mostra uma página com a cara do Nuvem Sync e troca o
//! código pelo token. Com o token na mão, o remote é criado no rclone por
//! `config/create` (`nonInteractive`), sem passar pelo fluxo interativo dele.
//!
//! O laço em `127.0.0.1` é o recomendado pelo Google para aplicativo instalado
//! (a porta pode variar). O `client_secret` de app instalado não é segredo: o
//! próprio rclone publica o dele.

use crate::error::{AppError, AppResult};
use serde_json::{json, Value};
use std::time::{Duration, SystemTime, UNIX_EPOCH};
use tokio::io::{AsyncReadExt, AsyncWriteExt};
use tokio::net::TcpListener;

/// Escopo pedido: o mesmo `drive` que o rclone usa por padrão.
const ESCOPO: &str = "https://www.googleapis.com/auth/drive";

/// Porta que o Google já conhece do rclone. Se estiver ocupada (outra
/// autorização em andamento), o laço cai numa porta livre qualquer — para
/// aplicativo instalado o Google aceita qualquer porta em `127.0.0.1`.
const PORTA_PREFERIDA: u16 = 53682;

/// Quanto tempo esperamos a pessoa terminar no navegador.
const PRAZO_DO_NAVEGADOR: Duration = Duration::from_secs(600);

const URL_AUTORIZACAO: &str = "https://accounts.google.com/o/oauth2/auth";
const URL_TOKEN: &str = "https://oauth2.googleapis.com/token";

/// Autoriza uma conta Google e devolve o token no formato que o `rclone.conf`
/// guarda (o mesmo JSON que o `rclone authorize` produziria).
pub async fn autorizar(client_id: &str, client_secret: &str) -> AppResult<Value> {
    let estado = sorteio(16)?;
    let (ouvinte, porta) = abrir_porta().await?;
    let retorno = format!("http://127.0.0.1:{porta}/");
    let endereco = endereco_de_autorizacao(client_id, &retorno, &estado);

    // O navegador é aberto pelo app: é ele que recebe o retorno.
    crate::commands::abrir_no_sistema(&endereco).map_err(|erro| {
        AppError::new(format!(
            "não foi possível abrir o navegador para autorizar a conta: {erro}"
        ))
    })?;

    let codigo = esperar_codigo(ouvinte, &estado).await?;
    trocar_codigo_por_token(&codigo, client_id, client_secret, &retorno).await
}

/// Monta o endereço de consentimento do Google.
pub fn endereco_de_autorizacao(client_id: &str, retorno: &str, estado: &str) -> String {
    format!(
        "{URL_AUTORIZACAO}?client_id={}&redirect_uri={}&response_type=code&scope={}\
         &access_type=offline&prompt=consent&include_granted_scopes=true&state={}",
        codificar(client_id),
        codificar(retorno),
        codificar(ESCOPO),
        codificar(estado),
    )
}

/// Escuta no laço local. A porta preferida é a do rclone; se estiver ocupada,
/// qualquer porta livre serve.
async fn abrir_porta() -> AppResult<(TcpListener, u16)> {
    match TcpListener::bind(("127.0.0.1", PORTA_PREFERIDA)).await {
        Ok(ouvinte) => Ok((ouvinte, PORTA_PREFERIDA)),
        Err(_) => {
            let ouvinte = TcpListener::bind(("127.0.0.1", 0)).await.map_err(|erro| {
                AppError::new(format!(
                    "não foi possível abrir o retorno da autorização em 127.0.0.1: {erro}"
                ))
            })?;
            let porta = ouvinte
                .local_addr()
                .map(|endereco| endereco.port())
                .unwrap_or(0);
            Ok((ouvinte, porta))
        }
    }
}

/// Espera o navegador bater no laço com o código (ou com a recusa).
async fn esperar_codigo(ouvinte: TcpListener, estado: &str) -> AppResult<String> {
    let espera = async {
        loop {
            let (mut fluxo, _) = ouvinte.accept().await.map_err(|erro| {
                AppError::new(format!("falha ao esperar o retorno da autorização: {erro}"))
            })?;

            let pedido = ler_pedido(&mut fluxo).await;
            let Some(consulta) = pedido
                .as_deref()
                .and_then(consulta_do_pedido)
                .map(|consulta| consulta.to_string())
            else {
                // favicon.ico e outros pedidos do navegador não interessam.
                responder(&mut fluxo, 404, &pagina_de_erro("Nada aqui.", "Nothing here.")).await;
                continue;
            };

            let campos = campos_da_consulta(&consulta);

            if let Some(erro) = campo(&campos, "error") {
                let recusou = erro == "access_denied";
                responder(
                    &mut fluxo,
                    200,
                    &pagina_de_erro(
                        if recusou {
                            "Autorização cancelada"
                        } else {
                            "O Google recusou a autorização"
                        },
                        if recusou {
                            "Authorization cancelled"
                        } else {
                            "Google refused the authorization"
                        },
                    ),
                )
                .await;
                return Err(AppError::new(if recusou {
                    "a autorização foi cancelada no navegador — nada foi alterado."
                        .to_string()
                } else {
                    format!("o Google recusou a autorização ({erro}).")
                }));
            }

            if campo(&campos, "state").as_deref() != Some(estado) {
                responder(
                    &mut fluxo,
                    400,
                    &pagina_de_erro("Tentativa antiga", "Outdated attempt"),
                )
                .await;
                return Err(AppError::new(
                    "a resposta do Google não confere com esta tentativa de conexão — tente de novo.",
                ));
            }

            let Some(codigo) = campo(&campos, "code") else {
                responder(
                    &mut fluxo,
                    400,
                    &pagina_de_erro("Faltou o código", "The code is missing"),
                )
                .await;
                return Err(AppError::new(
                    "o Google respondeu sem o código de autorização — tente de novo.",
                ));
            };

            responder(&mut fluxo, 200, &pagina_de_sucesso()).await;
            return Ok(codigo);
        }
    };

    match tokio::time::timeout(PRAZO_DO_NAVEGADOR, espera).await {
        Ok(resultado) => resultado,
        Err(_) => Err(AppError::new(
            "a autorização não terminou a tempo. Abra a conta de novo e conclua no navegador.",
        )),
    }
}

/// Troca o código pelo token e devolve o JSON que o rclone guarda.
async fn trocar_codigo_por_token(
    codigo: &str,
    client_id: &str,
    client_secret: &str,
    retorno: &str,
) -> AppResult<Value> {
    trocar_codigo_em(URL_TOKEN, codigo, client_id, client_secret, retorno).await
}

/// Mesma troca, com o endereço do serviço de token explícito (os testes usam um
/// Google de mentira em `127.0.0.1`).
async fn trocar_codigo_em(
    endereco: &str,
    codigo: &str,
    client_id: &str,
    client_secret: &str,
    retorno: &str,
) -> AppResult<Value> {
    let resposta = reqwest::Client::new()
        .post(endereco)
        .form(&[
            ("code", codigo),
            ("client_id", client_id),
            ("client_secret", client_secret),
            ("redirect_uri", retorno),
            ("grant_type", "authorization_code"),
        ])
        .timeout(Duration::from_secs(45))
        .send()
        .await
        .map_err(|erro| {
            AppError::new(format!(
                "não foi possível falar com o Google para concluir a autorização: {erro}"
            ))
        })?;

    let situacao = resposta.status();
    let corpo: Value = resposta.json().await.map_err(|erro| {
        AppError::new(format!("o Google respondeu algo inesperado: {erro}"))
    })?;

    if !situacao.is_success() || corpo.get("access_token").is_none() {
        let erro = corpo
            .get("error")
            .and_then(Value::as_str)
            .unwrap_or("erro desconhecido");
        let detalhe = corpo
            .get("error_description")
            .and_then(Value::as_str)
            .unwrap_or_default();
        let explicacao = match erro {
            "invalid_client" | "unauthorized_client" => {
                "o Google não aceitou as credenciais do projeto OAuth — confira o client_id e o client_secret em Ajustes → Avançado."
            }
            "invalid_grant" => {
                "o Google não aceitou o código devolvido (ele vale uma vez só e por poucos minutos) — tente de novo."
            }
            "redirect_uri_mismatch" => {
                "o endereço de retorno não foi aceito pelo projeto OAuth — ele precisa ser do tipo “App para computador”."
            }
            _ => "não foi possível concluir a autorização com o Google.",
        };
        return Err(AppError::new(if detalhe.is_empty() {
            format!("{explicacao} ({erro})")
        } else {
            format!("{explicacao} ({erro}: {detalhe})")
        }));
    }

    let access_token = corpo
        .get("access_token")
        .and_then(Value::as_str)
        .unwrap_or_default()
        .to_string();
    let token_type = corpo
        .get("token_type")
        .and_then(Value::as_str)
        .unwrap_or("Bearer")
        .to_string();
    let refresh_token = corpo.get("refresh_token").and_then(Value::as_str);
    let Some(refresh_token) = refresh_token else {
        // Sem refresh token a conta para de sincronizar em uma hora. Só acontece
        // se o Google já tinha dado o acesso a este app (ou se o pedido não pediu
        // acesso offline), e a saída é revogar o acesso e tentar de novo.
        return Err(AppError::new(
            "o Google devolveu um acesso válido por uma hora só. Remova o acesso do Nuvem Sync em myaccount.google.com/permissions e conecte a conta de novo.",
        ));
    };

    let expira_em = corpo
        .get("expires_in")
        .and_then(Value::as_u64)
        .unwrap_or(3600);
    let validade = agora_em_segundos().saturating_add(expira_em);

    Ok(json!({
        "access_token": access_token,
        "token_type": token_type,
        "refresh_token": refresh_token,
        "expiry": rfc3339(validade),
    }))
}

/// Lê o pedido HTTP até a linha em branco (o bastante para a primeira linha).
async fn ler_pedido(fluxo: &mut tokio::net::TcpStream) -> Option<String> {
    let mut buffer = Vec::with_capacity(1024);
    let mut pedaco = [0u8; 1024];
    loop {
        let lido = fluxo.read(&mut pedaco).await.ok()?;
        if lido == 0 {
            break;
        }
        buffer.extend_from_slice(&pedaco[..lido]);
        if buffer.windows(4).any(|janela| janela == b"\r\n\r\n") || buffer.len() > 8192 {
            break;
        }
    }
    Some(String::from_utf8_lossy(&buffer).to_string())
}

/// Devolve a consulta (`?code=…&state=…`) da primeira linha do pedido.
fn consulta_do_pedido(pedido: &str) -> Option<&str> {
    let primeira = pedido.lines().next()?;
    let mut partes = primeira.split_whitespace();
    let metodo = partes.next()?;
    if metodo != "GET" {
        return None;
    }
    let alvo = partes.next()?;
    alvo.split_once('?').map(|(_, consulta)| consulta)
}

/// Separa `a=1&b=2` em pares já decodificados.
fn campos_da_consulta(consulta: &str) -> Vec<(String, String)> {
    consulta
        .split('&')
        .filter(|par| !par.is_empty())
        .map(|par| match par.split_once('=') {
            Some((nome, valor)) => (decodificar(nome), decodificar(valor)),
            None => (decodificar(par), String::new()),
        })
        .collect()
}

fn campo(campos: &[(String, String)], nome: &str) -> Option<String> {
    campos
        .iter()
        .find(|(chave, _)| chave == nome)
        .map(|(_, valor)| valor.clone())
        .filter(|valor| !valor.is_empty())
}

async fn responder(fluxo: &mut tokio::net::TcpStream, codigo: u16, corpo: &str) {
    let motivo = match codigo {
        200 => "OK",
        400 => "Bad Request",
        _ => "Not Found",
    };
    let resposta = format!(
        "HTTP/1.1 {codigo} {motivo}\r\nContent-Type: text/html; charset=utf-8\r\n\
         Content-Length: {}\r\nCache-Control: no-store\r\nConnection: close\r\n\r\n{corpo}",
        corpo.len()
    );
    let _ = fluxo.write_all(resposta.as_bytes()).await;
    let _ = fluxo.flush().await;
}

/// Página final: é a última coisa que a pessoa vê da autorização, então fala do
/// Nuvem Sync — não do motor que faz a sincronização por baixo.
pub fn pagina_de_sucesso() -> String {
    let titulo = crate::idioma::texto("Conta conectada", "Account connected");
    let texto = crate::idioma::texto(
        "Pode fechar esta aba e voltar ao Nuvem Sync.",
        "You can close this tab and go back to Nuvem Sync.",
    );
    pagina(titulo, texto, "#1f9d55")
}

fn pagina_de_erro(titulo_pt: &str, titulo_en: &str) -> String {
    let titulo = crate::idioma::escolhe(titulo_pt.to_string(), titulo_en.to_string());
    let texto = crate::idioma::texto(
        "Volte ao Nuvem Sync e tente de novo.",
        "Go back to Nuvem Sync and try again.",
    );
    pagina(&titulo, texto, "#c2410c")
}

/// Página única, sem nada externo: funciona offline, no escuro e no claro.
fn pagina(titulo: &str, texto: &str, cor: &str) -> String {
    let marca = crate::idioma::texto("Nuvem Sync", "Nuvem Sync");
    format!(
        r#"<!doctype html>
<html lang="{idioma}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>{titulo} · {marca}</title>
<style>
  :root {{ color-scheme: light dark; }}
  * {{ box-sizing: border-box; }}
  body {{
    margin: 0; min-height: 100vh; display: grid; place-items: center;
    background: #f4f5f7; color: #14181f; padding: 24px;
    font-family: system-ui, -apple-system, "Segoe UI", Roboto, sans-serif;
  }}
  .cartao {{
    width: 100%; max-width: 420px; background: #fff; border-radius: 18px;
    padding: 32px 28px; text-align: center;
    box-shadow: 0 18px 40px rgba(15, 23, 42, .12), 0 1px 2px rgba(15, 23, 42, .08);
  }}
  .marca {{ font-size: 12px; letter-spacing: .12em; text-transform: uppercase; color: #6b7280; }}
  .selo {{
    width: 56px; height: 56px; margin: 18px auto 14px; border-radius: 50%;
    display: grid; place-items: center; background: {cor}1a; color: {cor};
  }}
  h1 {{ font-size: 20px; margin: 0 0 8px; }}
  p {{ margin: 0; color: #4b5563; line-height: 1.55; }}
  @media (prefers-color-scheme: dark) {{
    body {{ background: #0f1218; color: #eef1f6; }}
    .cartao {{ background: #171c24; box-shadow: none; border: 1px solid #262d38; }}
    p {{ color: #a8b1bf; }}
    .marca {{ color: #8c96a6; }}
  }}
</style>
</head>
<body>
  <div class="cartao">
    <div class="marca">{marca}</div>
    <div class="selo">
      <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor"
           stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round">
        <path d="M20 6 9 17l-5-5"/>
      </svg>
    </div>
    <h1>{titulo}</h1>
    <p>{texto}</p>
  </div>
</body>
</html>
"#,
        idioma = if crate::idioma::ingles() { "en" } else { "pt-BR" },
        titulo = escapar(titulo),
        marca = escapar(marca),
        texto = escapar(texto),
        cor = cor,
    )
}

/// Sorteio hexadecimal do `state` (evita CSRF na resposta do laço).
fn sorteio(bytes: usize) -> AppResult<String> {
    let mut valores = vec![0u8; bytes];
    getrandom::fill(&mut valores).map_err(|erro| {
        AppError::new(format!(
            "não foi possível sortear o identificador da autorização: {erro}"
        ))
    })?;
    Ok(valores.iter().map(|byte| format!("{byte:02x}")).collect())
}

/// `%XX` e `+` de volta ao texto original.
pub fn decodificar(texto: &str) -> String {
    let bytes = texto.as_bytes();
    let mut saida = Vec::with_capacity(bytes.len());
    let mut indice = 0;
    while indice < bytes.len() {
        match bytes[indice] {
            b'+' => {
                saida.push(b' ');
                indice += 1;
            }
            b'%' if indice + 2 < bytes.len() => {
                let hex = std::str::from_utf8(&bytes[indice + 1..indice + 3]).ok();
                match hex.and_then(|hex| u8::from_str_radix(hex, 16).ok()) {
                    Some(byte) => {
                        saida.push(byte);
                        indice += 3;
                    }
                    None => {
                        saida.push(bytes[indice]);
                        indice += 1;
                    }
                }
            }
            byte => {
                saida.push(byte);
                indice += 1;
            }
        }
    }
    String::from_utf8_lossy(&saida).to_string()
}

/// Percent-encoding de tudo que não é seguro em consulta de URL.
pub fn codificar(texto: &str) -> String {
    let mut saida = String::with_capacity(texto.len());
    for byte in texto.bytes() {
        match byte {
            b'A'..=b'Z' | b'a'..=b'z' | b'0'..=b'9' | b'-' | b'_' | b'.' | b'~' => {
                saida.push(byte as char)
            }
            outro => saida.push_str(&format!("%{outro:02X}")),
        }
    }
    saida
}

fn agora_em_segundos() -> u64 {
    SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .map(|duracao| duracao.as_secs())
        .unwrap_or(0)
}

fn escapar(texto: &str) -> String {
    texto
        .replace('&', "&amp;")
        .replace('<', "&lt;")
        .replace('>', "&gt;")
        .replace('"', "&quot;")
}

/// `expiry` do rclone é RFC 3339 em UTC: `2026-11-08T20:00:00Z`.
pub fn rfc3339(segundos: u64) -> String {
    let dias = (segundos / 86_400) as i64;
    let resto = segundos % 86_400;
    let (ano, mes, dia) = data_civil(dias);
    format!(
        "{ano:04}-{mes:02}-{dia:02}T{:02}:{:02}:{:02}Z",
        resto / 3_600,
        (resto % 3_600) / 60,
        resto % 60
    )
}

/// Dias desde 1970 → (ano, mês, dia), no calendário gregoriano proléptico
/// (algoritmo `civil_from_days` de Howard Hinnant).
fn data_civil(dias: i64) -> (i64, u32, u32) {
    let z = dias + 719_468;
    let era = if z >= 0 { z } else { z - 146_096 } / 146_097;
    let dia_da_era = (z - era * 146_097) as u64; // [0, 146096]
    let ano_da_era =
        (dia_da_era - dia_da_era / 1_460 + dia_da_era / 36_524 - dia_da_era / 146_096) / 365;
    let ano = ano_da_era as i64 + era * 400;
    let dia_do_ano = dia_da_era - (365 * ano_da_era + ano_da_era / 4 - ano_da_era / 100);
    let mes_ajustado = (5 * dia_do_ano + 2) / 153; // [0, 11], março = 0
    let dia = (dia_do_ano - (153 * mes_ajustado + 2) / 5 + 1) as u32;
    let mes = if mes_ajustado < 10 {
        mes_ajustado + 3
    } else {
        mes_ajustado - 9
    } as u32;
    (if mes <= 2 { ano + 1 } else { ano }, mes, dia)
}

#[cfg(test)]
mod testes {
    use super::*;
    use std::sync::Mutex;

    /// O idioma é global no processo; estes testes mexem nele.
    static TRAVA: Mutex<()> = Mutex::new(());

    #[test]
    fn endereco_pede_acesso_offline_com_retorno_local() {
        let endereco = endereco_de_autorizacao(
            "123-abc.apps.googleusercontent.com",
            "http://127.0.0.1:53682/",
            "abc123",
        );
        assert!(endereco.starts_with("https://accounts.google.com/o/oauth2/auth?"));
        assert!(endereco.contains("client_id=123-abc.apps.googleusercontent.com"));
        assert!(endereco.contains("redirect_uri=http%3A%2F%2F127.0.0.1%3A53682%2F"));
        assert!(endereco.contains("scope=https%3A%2F%2Fwww.googleapis.com%2Fauth%2Fdrive"));
        assert!(endereco.contains("response_type=code"));
        // Sem `access_type=offline` o Google não manda refresh token.
        assert!(endereco.contains("access_type=offline"));
        assert!(endereco.contains("state=abc123"));
    }

    #[test]
    fn consulta_do_pedido_ignora_o_resto_da_linha() {
        let pedido = "GET /?state=x&code=4/0Ab HTTP/1.1\r\nHost: 127.0.0.1\r\n\r\n";
        assert_eq!(consulta_do_pedido(pedido), Some("state=x&code=4/0Ab"));
        assert_eq!(consulta_do_pedido("GET /favicon.ico HTTP/1.1\r\n\r\n"), None);
        assert_eq!(consulta_do_pedido("POST /?code=1 HTTP/1.1\r\n\r\n"), None);
        assert_eq!(consulta_do_pedido(""), None);
    }

    #[test]
    fn campos_sao_decodificados() {
        let campos = campos_da_consulta("code=4%2F0Ab%20x&state=abc&scope=drive+file&vazio=");
        assert_eq!(campo(&campos, "code").as_deref(), Some("4/0Ab x"));
        assert_eq!(campo(&campos, "state").as_deref(), Some("abc"));
        assert_eq!(campo(&campos, "scope").as_deref(), Some("drive file"));
        assert_eq!(campo(&campos, "vazio"), None);
        assert_eq!(campo(&campos, "naoexiste"), None);
    }

    #[test]
    fn codificar_e_decodificar_sao_inversos() {
        let original = "http://127.0.0.1:53682/ + /*ç*/ a&b=c";
        assert_eq!(decodificar(&codificar(original)), original);
        assert_eq!(codificar("a-b_c.d~e"), "a-b_c.d~e");
        assert_eq!(decodificar("%zz"), "%zz");
        assert_eq!(decodificar("%"), "%");
    }

    #[test]
    fn validade_vira_rfc3339() {
        assert_eq!(rfc3339(0), "1970-01-01T00:00:00Z");
        assert_eq!(rfc3339(1_000_000_000), "2001-09-09T01:46:40Z");
        // 29 de fevereiro existe em 2024 (ano bissexto).
        assert_eq!(rfc3339(1_709_164_800), "2024-02-29T00:00:00Z");
        assert_eq!(rfc3339(1_762_560_000), "2025-11-08T00:00:00Z");
    }

    #[test]
    fn pagina_fala_do_nuvem_sync_nos_dois_idiomas() {
        let _trava = TRAVA.lock().unwrap_or_else(|erro| erro.into_inner());

        crate::idioma::definir("pt");
        let portugues = pagina_de_sucesso();
        assert!(portugues.contains("Nuvem Sync"));
        assert!(portugues.contains("Conta conectada"));
        assert!(portugues.contains("voltar ao Nuvem Sync"));

        crate::idioma::definir("en");
        let ingles = pagina_de_sucesso();
        assert!(ingles.contains("Account connected"));
        assert!(ingles.contains("go back to Nuvem Sync"));
        assert!(!ingles.contains("Conta conectada"));
        assert!(ingles.contains(r#"lang="en""#));

        crate::idioma::definir("pt");
    }

    /// O laço de verdade, com um navegador de mentira: o pedido do favicon não
    /// atrapalha, o retorno com `state` certo vira código e a página é a do
    /// Nuvem Sync.
    #[tokio::test]
    async fn laco_local_entrega_o_codigo_e_a_pagina_do_nuvem() {
        let _trava = TRAVA.lock().unwrap_or_else(|erro| erro.into_inner());
        crate::idioma::definir("pt");

        let ouvinte = TcpListener::bind(("127.0.0.1", 0)).await.unwrap();
        let porta = ouvinte.local_addr().unwrap().port();
        let espera = tokio::spawn(async move { esperar_codigo(ouvinte, "estado-1").await });

        let mut favicon = tokio::net::TcpStream::connect(("127.0.0.1", porta))
            .await
            .unwrap();
        favicon
            .write_all(b"GET /favicon.ico HTTP/1.1\r\nHost: local\r\n\r\n")
            .await
            .unwrap();
        let mut resposta_favicon = Vec::new();
        favicon.read_to_end(&mut resposta_favicon).await.unwrap();
        assert!(String::from_utf8_lossy(&resposta_favicon).contains("404"));

        let mut navegador = tokio::net::TcpStream::connect(("127.0.0.1", porta))
            .await
            .unwrap();
        navegador
            .write_all(b"GET /?state=estado-1&code=4%2F0Ab%20x HTTP/1.1\r\nHost: local\r\n\r\n")
            .await
            .unwrap();
        let mut resposta = Vec::new();
        navegador.read_to_end(&mut resposta).await.unwrap();
        let resposta = String::from_utf8_lossy(&resposta);
        assert!(resposta.contains("200 OK"));
        assert!(resposta.contains("Conta conectada"));
        assert!(resposta.contains("voltar ao Nuvem Sync"));

        assert_eq!(espera.await.unwrap().unwrap(), "4/0Ab x");
    }

    #[tokio::test]
    async fn retorno_com_state_errado_e_recusado() {
        let _trava = TRAVA.lock().unwrap_or_else(|erro| erro.into_inner());
        let ouvinte = TcpListener::bind(("127.0.0.1", 0)).await.unwrap();
        let porta = ouvinte.local_addr().unwrap().port();
        let espera = tokio::spawn(async move { esperar_codigo(ouvinte, "estado-1").await });

        let mut navegador = tokio::net::TcpStream::connect(("127.0.0.1", porta))
            .await
            .unwrap();
        navegador
            .write_all(b"GET /?state=outro&code=abc HTTP/1.1\r\nHost: local\r\n\r\n")
            .await
            .unwrap();
        let mut resposta = Vec::new();
        navegador.read_to_end(&mut resposta).await.unwrap();
        assert!(String::from_utf8_lossy(&resposta).contains("400"));

        let erro = espera.await.unwrap().unwrap_err().to_string();
        assert!(erro.contains("não confere"));
    }

    /// Servidor de mentira no lugar do Google: responde ao POST do token com o
    /// corpo combinado, para exercitar o fluxo inteiro sem tocar na internet.
    async fn google_de_mentira(codigo_http: u16, corpo: &'static str) -> String {
        let ouvinte = TcpListener::bind(("127.0.0.1", 0)).await.unwrap();
        let porta = ouvinte.local_addr().unwrap().port();
        tokio::spawn(async move {
            let (mut fluxo, _) = ouvinte.accept().await.unwrap();
            let mut pedido = Vec::new();
            let mut pedaco = [0u8; 1024];
            loop {
                let lido = fluxo.read(&mut pedaco).await.unwrap();
                if lido == 0 {
                    break;
                }
                pedido.extend_from_slice(&pedaco[..lido]);
                if pedido.windows(4).any(|janela| janela == b"\r\n\r\n") {
                    break;
                }
            }
            let pedido = String::from_utf8_lossy(&pedido);
            assert!(pedido.starts_with("POST /token "));
            assert!(pedido.contains("grant_type=authorization_code"));
            assert!(pedido.contains("code=4%2F0Ab"));
            let resposta = format!(
                "HTTP/1.1 {codigo_http} OK\r\nContent-Type: application/json\r\nContent-Length: {}\r\nConnection: close\r\n\r\n{corpo}",
                corpo.len()
            );
            fluxo.write_all(resposta.as_bytes()).await.unwrap();
            fluxo.flush().await.unwrap();
        });
        format!("http://127.0.0.1:{porta}/token")
    }

    #[tokio::test]
    async fn troca_do_codigo_vira_token_no_formato_do_rclone() {
        let endereco = google_de_mentira(
            200,
            r#"{"access_token":"ya29.teste","expires_in":3599,"refresh_token":"1//refresh","scope":"https://www.googleapis.com/auth/drive","token_type":"Bearer"}"#,
        )
        .await;

        let token = trocar_codigo_em(
            &endereco,
            "4/0Ab",
            "123-abc.apps.googleusercontent.com",
            "GOCSPX-segredo",
            "http://127.0.0.1:53682/",
        )
        .await
        .unwrap();

        assert_eq!(token["access_token"], "ya29.teste");
        assert_eq!(token["refresh_token"], "1//refresh");
        assert_eq!(token["token_type"], "Bearer");
        // O rclone espera RFC 3339 em `expiry`.
        let validade = token["expiry"].as_str().unwrap();
        assert_eq!(validade.len(), 20, "{validade}");
        assert!(validade.ends_with('Z'));
        assert!(validade.starts_with("20"));
    }

    #[tokio::test]
    async fn token_sem_refresh_vira_erro_explicado() {
        let endereco = google_de_mentira(
            200,
            r#"{"access_token":"ya29.teste","expires_in":3599,"token_type":"Bearer"}"#,
        )
        .await;

        let erro = trocar_codigo_em(
            &endereco,
            "4/0Ab",
            "123-abc.apps.googleusercontent.com",
            "GOCSPX-segredo",
            "http://127.0.0.1:53682/",
        )
        .await
        .unwrap_err()
        .to_string();
        assert!(erro.contains("uma hora só"), "{erro}");
        assert!(erro.contains("myaccount.google.com/permissions"), "{erro}");
    }

    #[tokio::test]
    async fn credenciais_recusadas_pelo_google_explicam_o_que_conferir() {
        let endereco = google_de_mentira(
            400,
            r#"{"error":"invalid_client","error_description":"Unauthorized"}"#,
        )
        .await;

        let erro = trocar_codigo_em(
            &endereco,
            "4/0Ab",
            "123-abc.apps.googleusercontent.com",
            "GOCSPX-errado",
            "http://127.0.0.1:53682/",
        )
        .await
        .unwrap_err()
        .to_string();
        assert!(erro.contains("Ajustes → Avançado"), "{erro}");
        assert!(erro.contains("invalid_client"), "{erro}");
    }

    #[test]
    fn pagina_de_erro_nao_mostra_marca_de_outro_programa() {
        let _trava = TRAVA.lock().unwrap_or_else(|erro| erro.into_inner());
        crate::idioma::definir("pt");
        let pagina = pagina_de_erro("Autorização cancelada", "Authorization cancelled");
        assert!(pagina.contains("Autorização cancelada"));
        assert!(!pagina.contains("rclone"));
    }
}
