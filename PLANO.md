# Nuvem — plano do app de sincronização

Código da fase 1: [`app/`](app/README.md) (Tauri + React + rclone).
Protótipo visual anterior: app **nuvem-sync** (Goose Apps).
Referência analisada: `/home/agreles/Downloads/insync_3.9.11.60043-resolute_amd64.deb`.

## Decisões (28/10)

1. Google Drive **e** OneDrive no MVP.
2. Sincronização **bidirecional (bisync)** desde o início.
3. Distribuição por **Flatpak** (manifesto em `app/flatpak/`).
4. Nome mantido: **Nuvem**.

Entregue nas fases 1 e 2: contas, pastas, bisync real, progresso, atividade,
resolução de conflitos (nuvem/local/ambas), quota por conta, notificações nativas,
ajustes, bandeja com status e autostart. Pendências e limitações estão na seção
"Limitações atuais" do [README do app](app/README.md).

Distribuição: **Flatpak construído e instalado** (`app.nuvem.Nuvem`, GNOME 50,
91,5 MB, com rclone e `libayatana-appindicator` embutidos, build **offline** com
dependências vendorizadas). Repositório local em
`flatpak-repo/`; instruções de build e pendências em
[`app/flatpak/README.md`](app/flatpak/README.md).

Também gerados e verificados: **`.deb` (30,9 MB)** e **AppImage (124,5 MB)** com
rclone v1.75.2 embutido (`src-tauri/resources/rclone`), em
`app/src-tauri/target/release/bundle/`. O `.deb` passa por
`app/scripts/fix-deb.sh` para trocar a dependência dura `libappindicator3-1`
(inexistente em Ubuntu 24.04+) por `Recommends`.

## O que o Insync é (por dentro)

| Item | Achado |
|---|---|
| Tamanho instalado | 414 MB, imagem de runtime própria em `/usr/lib/insync` |
| Backend | Python 3.9 embutido + PySide2/Qt 5 (bibliotecas Qt, WebEngine) |
| UI | SPA React/Vite em um único `ideskui/build/index.html` (2,6 MB inline) |
| Entrada | `/usr/bin/insync` → `/usr/lib/insync/insync`; `.desktop` chama `insync start` |
| Provedores | Google Drive, OneDrive, Dropbox (pessoal e business) |
| Recursos na UI | contas, seleção seletiva (nuvem e local), compartilhados, team drives, feed de atividade, conflitos, regras de ignore, banda/proxy, conversão de docs, symlinks, fila com progresso, quota/armazenamento |

Ou seja: o Insync já é “web UI + motor nativo”. Não precisamos reinventar o modelo, só executar melhor.

## Onde ganhar do Insync

1. **Onboarding de 1 clique** — conectar conta sem assistente de 7 telas.
2. **Estado sempre legível** — uma frase no topo (“Tudo em dia”, “3 arquivos enviando”), nunca um ícone ambíguo na bandeja.
3. **Seleção seletiva compreensível** — cada pasta mostra tamanho e consequência (“economize 54,7 GB”), com busca e aplicar único.
4. **Conflitos humanos** — comparação lado a lado com prévia e 3 escolhas claras, em vez de erro técnico.
5. **Paleta de comandos (Ctrl+K)** e atalhos — o app inteiro em 2 toques.
6. **Visual consistente** — tema claro/escuro, tipografia, estados vazios desenhados, microinterações.

## Stack recomendada

**Tauri 2 + React + TypeScript + rclone como motor de sync.**

Motivo: o ambiente já tem `rclone v1.75.2`, `cargo 1.99.1` e `webkit2gtk-4.1` (Tauri pronto). O rclone cobre Google Drive, OneDrive, Dropbox e mais ~40 provedores, com upload resumível, `bisync`, `vfs` e uma API de controle JSON (`rclone rc`).

```
┌─────────────────────────────┐
│ React + TS (UI)             │  telas, command palette, toasts
└─────────────┬───────────────┘
              │ IPC (Tauri commands + eventos)
┌─────────────▼───────────────┐
│ Núcleo Rust (Tauri)         │  perfis, fila, estado, watchdog
├─────────────────────────────┤
│ rclone rc (daemon local)    │  jobs, progresso, bisync, vfs
│ SQLite (histórico/estado)   │  atividade, conflitos, preferências
└─────────────────────────────┘
```

Alternativas descartadas por ora:
- **Electron**: mais simples de contratar dev, porém ~150 MB e consumo maior; o Insync já sofre disso.
- **Flutter**: ótimo visual, mas integração com rclone/processos e bandeja é mais artesanal no Linux.
- **Motor próprio (Google Drive API)**: só faz sentido se o diferencial for sync proprietário; multiplica o esforço por 5 e nos limita a um provedor.

## Fases

**Fase 1 — Casca utilizável (1–2 semanas)**
- Tauri + React + design tokens; janela, bandeja, autostart, tema.
- Cadastro de contas via `rclone config` (OAuth no navegador) + lista de contas.
- Tela Visão geral com estado real do rclone (`core/stats`), pausar/retomar.
- Empacotamento `.deb` + AppImage.

**Fase 2 — Confiança (2–3 semanas)**
- Seleção seletiva de verdade (`--filter`/`--exclude` gerados por pasta e salvos como perfil).
- Feed de atividade a partir de `core/stats` + journal do app.
- Conflitos: detectar sufixos do bisync e oferecer as 3 resoluções.
- Notificações nativas e modo “não perturbe”.

**Fase 3 — Polimento (base concluída; falta histórico por arquivo)**
- ✅ Nova tentativa automática em falhas transitórias (rede/limite), com espera
  crescente e limite de 3 — testada em unidade (`cargo test`).
- ✅ Enviar/baixar arquivos avulsos na aba Arquivos (`operations/copyfile`).
- ✅ Tamanho e contagem da pasta aberta (`operations/size`).
- ✅ Sincronização real verificada com Google Drive (conta do usuário): ressincronização
  inicial em 3 s (`resyncNeeded` → `false`), arquivo local subindo, arquivo da nuvem
  descendo e exclusão bloqueada pela proteção do rclone com mensagem traduzida.
- ✅ Correção do bug que impedia o app de perceber o fim da sincronização: `job/list`
  do rclone inclui a própria chamada em `runningIds`, então o app nunca via a fila
  vazia (milhares de tarefas por minuto, pasta presa em “precisa ressincronizar”).
  Agora o estado vem das tarefas disparadas pelo app (`AppState.jobs` + `job/status`).
- ✅ Sincronização automática: `inotify` nas pastas locais (reação em ~4 s) e
  verificação periódica configurável (1–60 min), silenciosa quando nada mudou.
- ✅ `maxDelete: 50` explícito: pela API RC o bisync não herda o padrão do CLI e
  abortava **qualquer** exclusão com “too many deletes”.
- ✅ Trava por pasta: dois pedidos simultâneos (bandeja + janela) não abrem duas
  tarefas bisync concorrentes.
- ✅ Histórico por arquivo: o log do bisync lista as ações por arquivo
  (`Queue copy to Path1/Path2`, `Queue delete`); o app recorta os caminhos e mostra
  “enviados / baixados / apagados” em cada sincronização.
- ✅ Escolher a pasta na nuvem pela listagem (breadcrumb + entrar) e a conta da aba
  Arquivos guardada no App, para não voltar para a primeira conta ao trocar de aba.
- ✅ OneDrive: ao conectar, o app percorre a máquina de estados do `config/update`
  para escolher o drive (`drive_id`/`drive_type`); sem isso a conta ficava só com o
  token e toda listagem falhava com “unable to get drive_id and drive_type”. O
  reparo também roda sozinho quando a listagem ou uma sincronização dão esse erro.
- ✅ Desconectar conta: apaga o remote pelo `config/delete` e as listas do bisync
  daquela conta; recusa enquanto houver pasta usando ela (com o caminho na mensagem).
- ✅ Instância única (`tauri-plugin-single-instance`): abrir o app de novo só traz a
  janela existente, sem um segundo motor de sincronização.
- ✅ Iniciar com o sistema no Flatpak pelo portal `org.freedesktop.portal.Background`:
  o plugin do Tauri gravava em `~/.var/app/...`, que a sessão não lê; agora o portal
  escreve `~/.config/autostart/app.nuvem.Nuvem.desktop` com `X-Flatpak` e
  `flatpak run ... --minimized`, e o estado exibido vem do próprio arquivo.
- ✅ Limpar a atividade: comando `clear_activity` esvazia a memória e o
  `activity.json`; botão *Limpar* ao lado dos filtros, com confirmação.
- ✅ Ícone simbólico na bandeja: PNGs de traço embutidos no binário (preto/branco),
  trocados pelo tema do app via `set_tray_theme`; o arquivo vai para
  `~/.cache/nuvem/bandeja` porque o `$XDG_RUNTIME_DIR` do Flatpak é privado do
  sandbox e o painel não enxergava o ícone.
- ✅ Velocidade no Google Drive: `--tpslimit 10 --tpslimit-burst 20`,
  `--drive-upload-cutoff 16M`, `--drive-chunk-size 32M`, `--transfers 6`
  (64 MiB: 27 s → 9 s; 100 arquivos pequenos: 349 s → 242 s). O teto que sobra é a
  cota do `client_id` compartilhado do rclone.
- ✅ Credenciais OAuth próprias em **Ajustes → Avançado · Google Drive**:
  `client_id` + `client_secret` salvos em `settings.json` (validação do par e do
  sufixo `.apps.googleusercontent.com`), passados como `parameters` no
  `config/create`; as contas mostram *cota própria* ou *projeto do rclone* e o
  cartão avisa que contas antigas precisam ser reconectadas (o token pertence ao
  projeto que o emitiu). É a saída definitiva para a cota por minuto do Google.
- ✅ Layout responsivo: em ≤1240 px o dashboard empilha, em ≤900 px o painel vira
  ícone, o *hero* reorganiza botões/estatísticas em ≤820 px; textos com elipse e
  selos sem quebra para nada se sobrepor.
- ✅ Cota por conta com cache: falha de leitura repete uma vez e, se persistir,
  mantém o último valor com o selo *desatualizada* e o motivo no tooltip.
- ✅ Trava do bisync (`prior lock file found`) removida sozinha quando o app foi
  fechado no meio de uma sincronização — antes a pasta ficava em erro para sempre.
- ✅ AppImage reconstruído com tudo o que entrou depois (ícone simbólico, Limpar
  atividade, credenciais próprias, flags de velocidade): 124,7 MB, rclone em
  `usr/lib/Nuvem/rclone`. Testado nesta máquina (app + WebKit + daemon respondendo).
- ✅ P0 de distribuição: o painel RC do rclone deixou de subir com
  `--rc-no-auth` — cada execução sorteia usuário e senha (24 bytes do gerador do
  sistema) e o cliente HTTP manda HTTP Basic; `settings.json`/`profiles.json`/
  `activity.json` passam a ser gravados com `0600`, com backup `.bak` e recuperação
  de arquivo ilegível (aviso na atividade + cópia `.corrompido`). Licença MIT no
  `LICENSE`, `license` no `Cargo.toml`, repositório git inicializado com
  `.gitignore` para os binários de 82 MB e `scripts/fetch-rclone.sh` para baixá-los.
- ✅ Versão Windows x64 compilada **a partir do Linux** com `cargo-xwin` no alvo
  `x86_64-pc-windows-msvc`: `Nuvem.exe` (PE32+ GUI, 4,7 MB) + `rclone.exe` num
  `.zip` portátil de 30 MB (`scripts/build-windows.sh`). Ajustes de plataforma:
  nome `rclone.exe`, `CREATE_NO_WINDOW` no daemon, `explorer` no lugar de
  `xdg-open`, `autostart_outro.rs` (registro em vez de portal D-Bus) e `zbus` só
  no Unix. Falta o instalador NSIS, que exige `makensis.exe` (workflow de CI
  pronto) e o teste em máquina Windows.
- ✅ Vendorização para o Flathub: o build deixou de ter rede. Quatro fontes geradas
  em `app/flatpak/` — `cargo-sources.json` (963 crates de `Cargo.lock`),
  `node-sources.json` (128 tarballs npm do `package-lock.json`),
  `rclone-sources.json` (273 zips do `proxy.golang.org`) e `modules.txt` (1743
  linhas, do próprio `go mod vendor`). Manifesto com `GOFLAGS=-mod=vendor`,
  `CARGO_NET_OFFLINE`, `npm ci --offline` e `cargo --offline build`, sem
  `--share=network`. Commit `ed74456` instalado e verificado: app abre com as
  contas reais, `rclone v1.75.2` (84 MB) compilado do fonte e painel RC devolvendo
  `401` sem credencial / `200` com HTTP Basic. Armadilhas documentadas: JSON de
  fontes tem de ser **string** na lista `sources`, `modules.txt` do
  `flatpak-go-mod` sai incompleto e `go mod vendor` exige `CGO_ENABLED=0`.
- ✅ P1 de distribuição (Flathub) na parte que não depende de terceiros:
  metainfo AppStream completo (`<developer>`, `homepage`/`bugtracker`/`vcs-browser`,
  seis capturas 2480×1800, `<releases>` 1.0.0, `provides`, cores de marca e
  `recommends`), `.desktop` com uma categoria principal (`Network;FileTransfer;`,
  `desktop-file-validate` sem avisos) e `--filesystem=home` justificado por escrito
  para a revisão. `app/scripts/capture-previews.mjs` refaz as capturas em 2x (modo
  demonstração, sem expor contas) e `app/scripts/check-flatpak.sh` roda no CI o que
  o Flathub cobra. O repositório está em `github.com/fabio-agreles/nuvem` (hoje
  **privado**: as URLs e capturas do metainfo só resolvem quando ele voltar a ser
  público), com lint verde no CI; falta um build `aarch64` de verdade.
- ✅ P2 de distribuição (versão **1.1.0**): relatório de diagnóstico em um clique
  (`save_diagnostics` → `diagnostico-AAAA-MM-DD-HHMMSS.txt`, escrita atômica com
  permissão 0600; o conteúdo é montado por uma função pura, `montar_relatorio`, com
  teste que garante a ausência de `client_secret` e de tokens) e aviso de nova versão
  (`check_update` consulta `api.github.com/.../releases/latest` e o botão "Baixar"
  abre a Release em `open_url`, que só aceita http/https). Fica em Ajustes → Sobre.
  Decisão: **não** usar `tauri-plugin-updater`, que exigiria assinar os pacotes.
  Roteiro de validação do `.exe` em Windows real em
  [`docs/roteiro-teste-windows.md`](docs/roteiro-teste-windows.md).
- ✅ Projeto OAuth do próprio Nuvem (código pronto, falta o par): `src-tauri/src/oauth.rs`
  resolve a origem com precedência **usuário > Nuvem > rclone**, valida o formato do
  `client_id` e nunca expõe o segredo; `oauth_info` alimenta o cartão Avançado, que
  mostra "seu projeto" / "projeto do Nuvem" / "projeto do rclone" e o `client_id` em
  uso. O par entra por `NUVEM_GOOGLE_CLIENT_ID`/`_SECRET` na compilação (segredos do
  repositório no CI) ou em tempo de execução (inclusive `flatpak override --env`).
  Guia do console, verificação do Google, análise da avaliação CASA (não se aplica:
  não há servidor) e política de privacidade em [`docs/oauth-google.md`](docs/oauth-google.md)
  e [`PRIVACIDADE.md`](PRIVACIDADE.md). Pendente: criar o projeto, colar o par nos
  segredos, publicar o app e medir de novo a velocidade do Drive.
  **Medido em 30/10 com o projeto próprio** (conta de teste, 3 arquivos de 200 KiB):
  22 s e 12 eventos `Rate limited` no projeto compartilhado → **4,4 / 4,4 / 4,6 s
  com zero `Rate limited` e zero 403**. O gargalo era mesmo a cota do projeto, não
  a banda. Falta apontar o app instalado para o projeto (override + reconectar a
  conta) e gravar o par nos segredos do repositório.
- ✅ **1.2.0 publicada** (tag `v1.2.0`, 30/10): os 5 pacotes saíram com o par
  embutido (conferido com `strings` no binário do `.deb`, no `nuvem.exe` de
  dentro do instalador NSIS, no portátil e no binário do Flatpak) e o pacote
  local está em `~/Downloads/nuvem-1.2.0/` (+ zip único). `scripts/build-flatpak.sh`
  gera o bundle com o par a partir do `.env.oauth`, sem deixá-lo no git — no
  Flathub, o par terá de ir no manifesto (que é público).
- ✅ Conta Google do app instalado reconectada no projeto novo sem perder pastas:
  `rclone config update <conta> client_id=… client_secret=…` já refaz o OAuth e
  emite um token do projeto do Nuvem (conferido: `rclone about` devolve a cota).
  O selo por conta passou a ter três estados (`rclone` / `nuvem` / `usuario`) em
  `oauth::fonte_da_conta`; a 1.2.0 ainda mostra "projeto do rclone" para essa
  conta, o que sai na próxima versão.
- Command palette completa, atalhos, onboarding animado, estados vazios.
- Regras de ignore com validação, limites de banda, proxy, conversão de docs Google.
- Diagnóstico (“doctor”) com explicação em linguagem simples.

## Decisões pendentes (resolvidas em 28/10)

1. ~~Provedor primeiro~~ → Google Drive **e** OneDrive desde o MVP.
2. ~~Sync real~~ → bidirecional contínuo com `sync/bisync`.
3. ~~Distribuição~~ → Flatpak (principal), `.deb` e AppImage.
4. ~~Nome~~ → “Nuvem” fica.

## Requisitos externos

- Credenciais OAuth próprias (Google Cloud Console / Azure / Dropbox App) por provedor; o rclone permite embutir `client_id` no build. O `client_id` compartilhado do rclone é o gargalo de velocidade hoje e será desativado durante 2026.
- Google Drive: escopos `drive` (ou `drive.file` para acesso restrito).
- Testes de sync com conta real e pasta descartável; limites de API e arquivos grandes.
- Assinatura/empacotamento e atualização automática (Tauri updater) na fase 3.
