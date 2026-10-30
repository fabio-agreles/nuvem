# Flatpak

Manifesto: `app.nuvem.Nuvem.json` — id `app.nuvem.Nuvem`, runtime **GNOME 50**
(base `freedesktop-sdk 25.08`), extensões de SDK `rust-stable`, `node22` e `golang`.

Construído e instalado localmente (Flatpak 1.18.2, x86_64), com build 100% offline.
Tamanho instalado: **91,5 MB** (90,7 MB de conteúdo no commit).

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

# 2) construir a partir da raiz do repositório (nuvem/)
flatpak run --user org.flatpak.Builder \
  --force-clean --user --install-deps-from=flathub \
  --repo=flatpak-repo builddir app/flatpak/app.nuvem.Nuvem.json

# 3) instalar o resultado no repositório local
flatpak remote-add --user --if-not-exists --no-gpg-verify \
  nuvem-origin "$PWD/flatpak-repo"
flatpak install --user --reinstall -y \
  nuvem-origin app.nuvem.Nuvem

# 4) rodar
flatpak run app.nuvem.Nuvem
```

Instalar por caminho (`flatpak install --user ./flatpak-repo app.nuvem.Nuvem`)
também funciona, mas o remoto `nuvem-origin` deixa `flatpak update` enxergar os
commits novos.

Rode o comando **da raiz do repositório**, não de `app/`: `--repo` e `--builddir`
são relativos ao diretório atual, e apontá-los para fora de `app/` faz o
flatpak-builder criar `flatpak-repo/` e `builddir/` no lugar errado (o app
instalado continua no commit antigo). Os dois já estão no `.gitignore` da raiz.

A fonte `type: dir` do módulo `nuvem` aponta para `..` (o diretório `app/`) e
ignora `node_modules`, `dist`, `src-tauri/target`, `src-tauri/gen`,
`src-tauri/resources`, `flatpak/repo`, `builddir` e `.flatpak-builder`.

## O que o manifesto faz

1. **`libayatana-appindicator`** (módulo compartilhado de
   `flathub/shared-modules`, copiado para `shared-modules/`) → compila
   `intltool`, `libdbusmenu`, `ayatana-ido`, `libayatana-indicator` e
   `libayatana-appindicator`. Sem isso a bandeja não funciona no sandbox: o
   `tray-icon` do Tauri carrega `libayatana-appindicator3.so.1` via `dlopen` em
   tempo de execução (o build passa, o ícone não aparece).
2. **rclone v1.75.2** a partir do tarball oficial (sha256 fixo), com as dependências
   Go vendorizadas (`rclone-sources.json` + `modules.txt`), `CGO_ENABLED=0`,
   `GOFLAGS=-mod=vendor`, instalado em `/app/bin/rclone`. O app o encontra por
   `NUVEM_RCLONE=/app/bin/rclone` (finish-arg).
3. **Nuvem**: `npm ci --offline` + `npm run build` (Vite) e
   `cargo --offline build --release --features custom-protocol`, com Node 22 e Rust
   stable das extensões de SDK e as dependências vendorizadas
   (`cargo-sources.json`, `node-sources.json`); instala binário, `.desktop`,
   metainfo, ícones e a licença em `/app`.
   **A feature `custom-protocol` é obrigatória**: sem ela o binário abre a `devUrl`
   (`localhost:1420`) e a janela mostra “Could not connect to localhost”. Bandeja e
   rclone continuam funcionando, o que esconde o problema.
4. **Permissões** (`finish-args`): rede, ipc, Wayland/X11, dri, `--filesystem=home`,
   notificações, `StatusNotifierWatcher` e `org.freedesktop.portal.Background`
   (para inicialização em segundo plano via portal).

## Build offline (vendorização)

O Flathub constrói **sem rede**: nenhuma etapa pode baixar crates, pacotes npm ou
módulos Go. As dependências viajam como fontes no manifesto, em quatro arquivos
gerados (versionados neste diretório, ~470 KB no total):

| Arquivo | Origem | Conteúdo |
| --- | --- | --- |
| `cargo-sources.json` (262 KB, 963 fontes) | `flatpak-cargo-generator.py src-tauri/Cargo.lock` | cada crate em `vendor/cargo/vendor/<crate>` com seu `.cargo-checksum.json` + config apontando `[source.vendored-sources]` |
| `node-sources.json` (75 KB, 128 fontes) | `flatpak-node-generator npm app/package-lock.json` | tarballs npm dentro de `flatpak-node/npm-cache/_cacache` (cache do npm) + cabeçalhos do Node do SDK |
| `rclone-sources.json` (75 KB, 274 fontes) | `flatpak-go-mod -json` (dentro do SDK golang) | `go.mod`-equivalente: `vendor/modules.txt` + 273 zips de `proxy.golang.org` extraídos no `vendor/` |
| `modules.txt` (65 KB, 1743 linhas) | `CGO_ENABLED=0 go mod vendor` no rclone 1.75.2 | o `vendor/modules.txt` completo |

No manifesto eles entram como **strings** na lista `sources` — o flatpak-builder
expande o JSON e mescla as fontes:

```json
"sources": [
  { "type": "archive", "url": "https://downloads.rclone.org/v1.75.2/rclone-v1.75.2.tar.gz", "sha256": "fa64…eb67" },
  "rclone-sources.json"
]
```

`{"type": "file", "path": "cargo-sources.json"}` **não** funciona: isso só copia o
JSON para dentro do build; as fontes de dentro dele nunca são aplicadas (e o
`cargo build` falha tentando acessar o crates.io).

As três variáveis que fecham a porta da rede:

```json
"rclone": { "GOFLAGS": "-mod=vendor", "CGO_ENABLED": "0" }
"nuvem":  { "CARGO_NET_OFFLINE": "true",
            "npm_config_cache": "/run/build/nuvem/flatpak-node/npm-cache",
            "npm_config_offline": "true" }
```

e nos comandos: `go build -mod=vendor`, `npm ci --offline`, `cargo --offline
build`. Sem `--share=network` nas `build-options`.

### Como regenerar

Depois de mexer em `Cargo.lock` ou `package-lock.json`, rode a partir de `app/`:

```bash
# crates
python3 flatpak-builder-tools/cargo/flatpak-cargo-generator.py \
  src-tauri/Cargo.lock -o flatpak/cargo-sources.json

# npm
flatpak-node-generator npm ./package-lock.json -o flatpak/node-sources.json
```

Para o rclone só é preciso mexer quando a **versão** mudar:

```bash
# dentro do SDK golang
flatpak run --user --command=sh --devel org.gnome.Sdk//50
#  >>> instale flatpak-go-mod e rode sobre o rclone extraído
go install github.com/dennwc/flatpak-go-mod@main
cd rclone-v1.75.2 && CGO_ENABLED=0 go mod vendor
flatpak-go-mod -json -o rclone-sources.json .
cp vendor/modules.txt .
```

O `go mod vendor` **sem `CGO_ENABLED=0`** falha em módulos que dependem de cgo, e o
`modules.txt` gerado pelo `flatpak-go-mod` sai incompleto (800 linhas em vez de
1743): o `go build -mod=vendor` então para com
`github.com/pkg/errors@v0.9.1: is explicitly required in go.mod, but not marked as
explicit in vendor/modules.txt`. Use o `modules.txt` do próprio `go mod vendor`.

### Detalhes do rclone vendorizado

- `-ldflags '-s -w -X github.com/rclone/rclone/fs.Version=v1.75.2'` fixa a versão:
  sem isso o binário se apresenta como `v1.75.2-DEV` (é o que aparece no rodapé da
  barra lateral do app).
- `GOBIN`/`GOPATH` apontam para `/app/bin` e `/run/build/rclone/go`; o
  `modules.txt` também funciona como cache de build dentro do sandbox.
- O binário final fica em **84 MB** (`/app/bin/rclone`); é o preço de compilar o
  rclone com todos os backends. Compilar só `drive`/`onedrive` economizaria ~40 MB,
  mas exigiria manter uma lista de tags (`-tags "drive onedrive"`).

## Detalhes que custaram tempo (e ficam documentados)

- **Build vendorizado não cria cache de módulos Go**: a nota histórica de
  `GOFLAGS=-modcacherw` só vale para builds antigos com `--share=network`. Ainda
  assim, se um build interrompido deixar o cache em `0555`, resolva com
  `chmod -R u+w .flatpak-builder && rm -rf .flatpak-builder`.
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
| Build + export para `flatpak-repo` (offline) | ✅ commit `9932a13`, 90,7 MB de conteúdo |
| Instalação local (`flatpak install --user`) | ✅ 91,5 MB |
| App abre (GTK + WebKitGTK 2.54 no runtime) | ✅ interface renderizada (após o ajuste de `custom-protocol`) |
| `rclone` embutido | ✅ `rclone v1.75.2` em `/app/bin/rclone` (84 MB, compilado do fonte) |
| `rclone rcd` dentro do sandbox | ✅ `core/version` respondido na porta loopback |
| Painel RC autenticado | ✅ `POST /core/version` sem credencial → `401`; com HTTP Basic → `200` |
| Build sem rede nas etapas | ✅ `-mod=vendor`, `cargo --offline`, `npm ci --offline`; nenhum `--share=network` |
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
2. **Build offline**: ✅ resolvido — crates, npm e módulos Go vendorizados (seção
   *Build offline*). O que ainda baixa é só o *download de fontes* do flatpak-builder
   (tarball do rclone, zips do `proxy.golang.org`, repos do `shared-modules`), que é
   o comportamento normal no Flathub — a etapa de build em si não tem rede.
3. **x86_64 apenas**: o manifesto não declara `aarch64`; as fontes são
   independentes de arquitetura (os zips do `proxy.golang.org` e os crates são
   universais), então o Flathub gera o `aarch64` sozinho — falta testar num ARM.
4. **Metainfo**: a `url` (`example.invalid/nuvem`) e os dados de licença/artista são
   provisórios; a AppStream valida hoje, mas o Flathub exige valores reais, além de
   screenshots e um bloco `<releases>`.
5. **`.desktop`**: o `desktop-file-validate` reclama de categorias — o Flathub pede
   pelo menos três categorias principais além de `GTK`.
6. **Credenciais próprias**: o caminho é validado por teste unitário e o cartão está
   no binário, mas o fluxo completo (autorizar no navegador com um `client_id`
   próprio e sincronizar) ainda não foi exercitado — depende de criar o projeto no
   Google Cloud.

## Por que Flatpak

- Sandbox com permissões explícitas (`--filesystem=home`, rede).
- Runtime isolado da distro: o WebKitGTK vem do GNOME 50, não do sistema.
- Uma build só para todas as distros; atualização via Flathub quando publicada.
