# Autorização do OneDrive (Microsoft Entra)

Desde a 1.6.3 quem abre o navegador e recebe o retorno do OneDrive é o **próprio
Nuvem Sync** (`src-tauri/src/login_microsoft.rs`) — antes era o rclone, e a
última página dizia “Success! All done. Please go back to rclone.”. Agora ela é
a mesma do Google: **Nuvem Sync · Conta conectada**.

## O registro

| Item | Valor |
| --- | --- |
| Nome | Nuvem Sync |
| ID do aplicativo (cliente) | `207c9f4b-9217-4761-a960-f36e8c5b0023` |
| Tipos de conta | Contas em qualquer diretório organizacional **e** contas pessoais da Microsoft |
| Plataforma | Aplicativos móveis e para desktop (cliente público) |
| URI de redirecionamento | `http://localhost:53682/` |
| Permissões delegadas (Graph) | `Files.ReadWrite.All`, `User.Read` (o `offline_access` vem junto) |
| Segredo de cliente | **nenhum** — app nativo não usa |

O `client_id` é público por natureza e está no código como constante. Um
`client_secret` em binário distribuído não seria segredo — e ainda expira em dois
anos, quebrando o app de todo mundo de uma vez.

## Por que `localhost` e não `127.0.0.1`

A Microsoft compara o redirecionamento caractere por caractere. O valor
registrado é `http://localhost:53682/`, então:

- o endereço de autorização manda exatamente esse valor;
- o laço local escuta nas **duas famílias** (`127.0.0.1` e `::1`), porque o
  navegador pode resolver `localhost` para IPv6;
- a porta é fixa (não há plano B): se estiver ocupada, o app diz qual é o
  problema em vez de falhar em silêncio.

## Por que não há PKCE

O rclone também não usa, e o código de autorização sai de um laço que só escuta
em `localhost` e vale por poucos minutos — o mesmo desenho que o Google recomenda
para aplicativo instalado. Se um dia a Microsoft passar a exigir PKCE para
clientes públicos, o lugar de mudar é `endereco_de_autorizacao` e
`trocar_codigo_em` (acrescentar `code_challenge`/`code_verifier`).

## O que o fluxo faz

1. sorteia `state` (16 bytes em hexadecimal, via `getrandom`);
2. abre o navegador em
   `login.microsoftonline.com/common/oauth2/v2.0/authorize` com
   `response_mode=query`, `scope=offline_access Files.ReadWrite.All User.Read` e
   `prompt=consent` (é o que garante o `refresh_token`);
3. espera o retorno em `localhost:53682`, confere o `state` e responde com a
   página do Nuvem Sync;
4. troca o código pelo token em `.../oauth2/v2.0/token` (sem segredo) e grava no
   formato do rclone: `access_token`, `token_type`, `refresh_token`,
   `expiry` (RFC 3339, a partir do `expires_in`);
5. cria o remote com `config/create` + `config_refresh_token=false` +
   `opt.nonInteractive=true` e completa `drive_id`/`drive_type` como antes.

Prazo de 10 minutos, contador na janela e botão Cancelar que desiste de fato
(mesmo sinal de `login_google::cancelar`).

## Se a conexão falhar

| Mensagem | Causa provável |
| --- | --- |
| `AADSTS50011` / `redirect_uri` na página da Microsoft | o registro não tem `http://localhost:53682/` na plataforma “móveis e desktop” |
| `invalid_client` | `client_id` errado (ou app de outra conta) |
| `invalid_grant` | código vencido ou já usado — tente de novo |
| `a Microsoft recusou a autorização (access_denied)` | a pessoa clicou em Cancelar no consentimento |
| `não foi possível descobrir qual drive usar` | faltou `Files.ReadWrite.All` nas permissões delegadas |

Em conta corporativa, o `Files.ReadWrite.All` pode exigir aprovação do
administrador do tenant — mesmo comportamento que o rclone já tem.
