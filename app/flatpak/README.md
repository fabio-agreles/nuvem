# Flatpak

Manifesto: `app.nuvem.Nuvem.json` — id `app.nuvem.Nuvem`, runtime **GNOME 50**
(base `freedesktop-sdk 25.08`), extensões de SDK `rust-stable`, `node22` e `golang`.

Construído e instalado localmente (Flatpak 1.18.2, x86_64). Tamanho instalado: **90,5 MB**.

## Construir e instalar

`flatpak-builder` não acompanha o Flatpak no Ubuntu/Debian; o caminho oficial é o
app `org.flatpak.Builder`.

```bash
# 1) builder + runtime/SDK/extensões (uma vez)
flatpak install --user -y flathub org.flatpak.Builder \
  org.gnome.Platform//50 org.gnome.Sdk//50 \
  org.freedesktop.Sdk.Extension.rust-stable//25.08 \
  org.freedesktop.Sdk.Extension.node22//25.08 \
  org.freedesktop.Sdk.Extension.golang//25.08

# 2) construir a partir de nuvem/app
flatpak run --user org.flatpak.Builder \
  --force-clean --user --install-deps-from=flathub \
  --repo=../flatpak-repo ../builddir flatpak/app.nuvem.Nuvem.json

# 3) instalar o resultado no repositório local
flatpak install --user --reinstall -y \
  "$PWD/../flatpak-repo" app.nuvem.Nuvem

# 4) rodar
flatpak run app.nuvem.Nuvem
```

O `--repo=../flatpak-repo` (fora da pasta do manifesto) evita que o repositório e o
`builddir` entrem na fonte `type: dir` do módulo `nuvem`. A fonte também ignora
`src-tauri/resources` (o rclone pré-compilado usado no `.deb`/AppImage): aqui ele é
compilado do código-fonte.

## O que o manifesto faz

1. **`libayatana-appindicator`** (módulo compartilhado de
   `flathub/shared-modules`, copiado para `shared-modules/`) → compila
   `intltool`, `libdbusmenu`, `ayatana-ido`, `libayatana-indicator` e
   `libayatana-appindicator`. Sem isso a bandeja não funciona no sandbox: o
   `tray-icon` do Tauri carrega `libayatana-appindicator3.so.1` via `dlopen` em
   tempo de execução (o build passa, o ícone não aparece).
2. **rclone v1.75.2** a partir do tarball oficial (sha256 fixo), `CGO_ENABLED=0`,
   `GOFLAGS=-modcacherw`, instalado em `/app/bin/rclone`. O app o encontra por
   `NUVEM_RCLONE=/app/bin/rclone` (finish-arg).
3. **Nuvem**: `npm ci` + `npm run build` (Vite) e
   `cargo build --release --features custom-protocol`, com Node 22 e Rust stable das
   extensões de SDK; instala binário, `.desktop`, metainfo e ícones em `/app`.
   **A feature `custom-protocol` é obrigatória**: sem ela o binário abre a `devUrl`
   (`localhost:1420`) e a janela mostra “Could not connect to localhost”. Bandeja e
   rclone continuam funcionando, o que esconde o problema.
4. **Permissões** (`finish-args`): rede, ipc, Wayland/X11, dri, `--filesystem=home`,
   notificações, `StatusNotifierWatcher` e `org.freedesktop.portal.Background`
   (para inicialização em segundo plano via portal).

## Detalhes que custaram tempo (e ficam documentados)

- **`GOFLAGS=-modcacherw`** é obrigatório: o cache de módulos do Go nasce com
  diretórios `0555`, e a limpeza do flatpak-builder falha com
  `unlinkat(...): Permissão negada` no fim do módulo do rclone. Se um build antigo
  cair nisso, resolva com `chmod -R u+w .flatpak-builder && rm -rf .flatpak-builder`.
- **Não use `NODE_ENV=production`** no módulo: o `npm ci` passa a omitir
  `devDependencies` e o `vite`/`tsc` somem (`tsc: command not found`).
- **Build interrompido deixa `rofiles-fuse` pendurado** → o próximo build falha com
  `opendir(rofiles-xxxx): Ponto final de transporte não está conectado`. Solução:
  `fusermount3 -u .flatpak-builder/rofiles/rofiles-xxxx`.
- **GNOME 48 está EOL** (março/2026). O manifesto usa GNOME 50 + extensões `25.08`.
- **`src-tauri/resources/rclone`** (usado pelo `.deb`/AppImage) é ignorado na fonte
  e o manifesto cria um arquivo vazio no lugar: o `tauri-build` valida a existência
  do recurso em tempo de compilação, mas aqui o rclone vem do código-fonte.

## Verificado neste ambiente

| Item | Resultado |
| --- | --- |
| Build + export para `flatpak-repo` | ✅ ~90 MB de conteúdo |
| Instalação local (`flatpak install --user`) | ✅ |
| App abre (GTK + WebKitGTK 2.54 no runtime) | ✅ interface renderizada (após o ajuste de `custom-protocol`) |
| `rclone` embutido | ✅ `rclone v1.75.2-DEV` em `/app/bin/rclone` |
| `rclone rcd` dentro do sandbox | ✅ `core/version` respondido na porta loopback |
| Bandeja (SNI) | ✅ registra `org/ayatana/NotificationItem/tray_icon_tray_app_main` |
| Ícone simbólico da bandeja | ✅ painel escuro mostra a nuvem em traço branco; PNG entregue em `~/.var/app/app.nuvem.Nuvem/cache/nuvem/bandeja/` |
| Bibliotecas de bandeja em `/app/lib` | ✅ `libayatana-appindicator3`, `libdbusmenu`, `libayatana-indicator` |
| Sincronização real com conta Google/OneDrive | ✅ verificada com conta real |
| Início automático (`org.freedesktop.portal.Background`) | ✅ escreve `~/.config/autostart` do sistema |
| Credenciais OAuth próprias (`Ajustes → Avançado · Google Drive`) | ✅ cartão presente no binário instalado (`client_id`/`client_secret` compilados); validação coberta por teste |
| Trava do bisync removida após fechar o app no meio | ✅ observado no app instalado (“Trava antiga do bisync removida — 1 arquivo(s)”) |

### Início automático

O `tauri-plugin-autostart` grava em `~/.var/app/app.nuvem.Nuvem/config/autostart`,
que a sessão gráfica não lê. Dentro do Flatpak o switch de **Ajustes** passa por
`org.freedesktop.portal.Background` (`RequestBackground`), e o portal escreve
`~/.config/autostart/app.nuvem.Nuvem.desktop`:

```ini
[Desktop Entry]
Type=Application
Name=Nuvem
X-XDP-Autostart=app.nuvem.Nuvem
Exec=flatpak run --command=/app/bin/nuvem app.nuvem.Nuvem --minimized
X-Flatpak=app.nuvem.Nuvem
Icon=app.nuvem.Nuvem
```

O `Icon=` é acrescentado pelo app — o portal não escreve essa linha, e sem ela o
item aparece sem ícone na lista de aplicativos de inicialização. Precisa do `--talk-name=org.freedesktop.portal.Desktop` (já no manifesto) e de um
backend de portal com `Background` — KDE e GNOME têm.

### Ícone da bandeja

O `tray-icon` grava o PNG em `$XDG_RUNTIME_DIR/tray-icon` por padrão. Dentro do
Flatpak esse diretório é um tmpfs privado do sandbox: o painel do lado de fora
recebe um `IconName` que não existe e cai no ícone do `.desktop` (o quadrado azul).
Por isso o app configura `TrayIconBuilder::temp_dir_path` para o cache
(`XDG_CACHE_HOME`, visível no sistema), e os dois PNGs simbólicos — preto e branco —
vão embutidos no binário (`include_bytes!`), trocados por `set_icon` quando o tema
muda.

### Credenciais OAuth próprias

O cartão **Ajustes → Avançado · Google Drive** grava `driveClientId` e
`driveClientSecret` no `settings.json` do sandbox
(`~/.var/app/app.nuvem.Nuvem/config/app.nuvem.Nuvem/settings.json`). Na conexão de
uma conta Drive esses valores viram `parameters` do `config/create`, então o token
nasce no projeto Google do usuário — fora do projeto compartilhado do rclone, que é
quem vive estourado em “Queries per minute”.

Como o token pertence ao projeto que o emitiu, contas criadas antes disso precisam
ser removidas e conectadas de novo; o cartão avisa e as contas aparecem com o selo
*cota própria* ou *projeto do rclone*. Nada precisa ser copiado para dentro do
sandbox: o `settings.json` e o `rclone.conf` ficam sob `~/.var/app`, que o app lê
normalmente.

## Pendências conhecidas

1. **Somente `$HOME`**: `--filesystem=home` cobre o caso normal (Insync-like), mas
   pastas em `/mnt`, `/media` ou unidades externas não aparecem no sandbox. Para
   esses casos, adicione `--filesystem=/media` / `/mnt` ou um portal de arquivos.
2. **Rede no build**: o módulo do rclone e o do app usam `--share=network` para
   baixar módulos Go e crates. Para publicar no Flathub é preciso `go mod vendor` +
   `cargo vendor` (ou fontes `type: archive` com sha256).
3. **x86_64 apenas**: o manifesto não declara `aarch64`; as fontes são
   independentes de arquitetura, então basta acrescentar o build/CI correspondente.
4. **Metainfo**: a `url` (`example.invalid/nuvem`) e os dados de licença/artista são
   provisórios; a AppStream valida hoje, mas o Flathub exige valores reais.
5. **Credenciais próprias**: o caminho é validado por teste unitário e o cartão está
   no binário, mas o fluxo completo (autorizar no navegador com um `client_id`
   próprio e sincronizar) ainda não foi exercitado — depende de criar o projeto no
   Google Cloud.

## Por que Flatpak

- Sandbox com permissões explícitas (`--filesystem=home`, rede).
- Runtime isolado da distro: o WebKitGTK vem do GNOME 50, não do sistema.
- Uma build só para todas as distros; atualização via Flathub quando publicada.
