# Rascunho do PR no Flathub

Texto pronto para `flathub/flathub`, submissão pelo formulário
<https://github.com/flathub/flathub/issues/new?template=new-pr.yml> (o novo
processo é uma issue com o link do repositório de manifestos).

Pré-requisitos que ainda faltam (ver `docs/oauth-google.md` e `flatpak/README.md`):

- [x] Repositório público (`github.com/fabio-agreles/nuvem`) desde 31/10/2026;
      capturas do metainfo e política de privacidade respondendo 200.
- [ ] Repositório de manifestos seguindo o padrão do Flathub
      (`flathub/app.nuvem.Nuvem`), com o manifesto e os `*-sources.json`.
- [ ] Build `aarch64` validado (o Flathub publica x86_64 **e** aarch64).
- [ ] Decidir onde o par OAuth do projeto fica no manifesto (ver nota no fim).

---

## Título

`Add app.nuvem.Nuvem — sincronização bidirecional de pastas com Google Drive e OneDrive`

## Descrição (para o PR)

**Nuvem** é um aplicativo de desktop (Tauri + rclone) que mantém pastas locais em
sincronização bidirecional contínua com o Google Drive e o OneDrive, com foco em
interface simples: visão geral do estado, conflitos lado a lado e atividade por
arquivo. É a alternativa em pt-BR ao Insync — escolha de pastas pela lista da
nuvem, cota por conta, bandeja, início automático e relatório de diagnóstico.

- Site/código: <https://github.com/fabio-agreles/nuvem>
- Licença: MIT (`LICENSE` na raiz; instalada em `/app/share/licenses/app.nuvem.Nuvem/`)
- Motor: rclone 1.75.2 compilado do fonte no próprio build (versão fixada em
  `ldflags`), Go vendorizado, crates e npm vendorizados — **build offline**, sem
  `--share=network` na construção.
- Interface: React 19 + Vite, embutida no binário (Tauri `custom-protocol`).

### Manifesto

- Runtime `org.gnome.Platform` 50, SDK `org.gnome.Sdk` 50, com as extensões
  `rust-stable`, `node22` e `golang` do freedesktop-sdk 25.08.
- Fontes: `cargo-sources.json` (963 crates), `node-sources.json` (128 pacotes) e
  `rclone-sources.json` (273 módulos Go + `vendor/modules.txt`). Nada é baixado
  durante o build (`CARGO_NET_OFFLINE=true`, `npm ci --offline`,
  `go build -mod=vendor`).
- `appstreamcli validate` e `desktop-file-validate` passam sem erros; seis
  capturas em 2480×1800, `<releases>` e `<branding>` preenchidos.

### Permissões (`finish-args`)

| Permissão | Motivo |
| --- | --- |
| `--share=network` | falar com as APIs do Google/Microsoft; não há backend do Nuvem |
| `--socket=wayland`, `--socket=fallback-x11`, `--share=ipc`, `--device=dri` | janela e aceleração gráfica |
| `--filesystem=home` | **funcionalidade principal**: o app sincroniza pastas que o usuário escolhe, onde elas estiverem. Sem isso, só funcionaria dentro de uma pasta fixa |
| `--talk-name=org.freedesktop.Notifications` | avisos de conflito e falha de sincronização |
| `--talk-name=org.kde.StatusNotifierWatcher`, `org.freedesktop.StatusNotifierWatcher` | ícone na bandeja (GNOME precisa da extensão AppIndicator) |
| `--talk-name=org.freedesktop.portal.Background` | "iniciar com o sistema" pelo portal, já que `~/.config/autostart` do sandbox não é lido pela sessão |
| `--env=NUVEM_RCLONE=/app/bin/rclone` | o app usa o rclone embutido, não o do sistema |

`--filesystem=home` é a única permissão ampla. Alternativas avaliadas:

- `xdg-documents` etc.: quebraria o caso de uso (pastas de trabalho ficam em
  qualquer lugar, inclusive sincronizadas por outros apps);
- portal `FileChooser` com `document-portal`: o rclone é um processo separado e
  precisa de caminho POSIX estável para cada pasta; com o document-portal cada
  pasta teria de ser concedida e revalidada a cada execução, e o bisync precisa
  comparar os dois lados por caminho. Não é viável no escopo atual.
- Unidades removíveis ficam de fora nesta versão (documentado no README).

### Verificação

```bash
flatpak run --user org.flatpak.Builder \
  --force-clean --user --install-deps-from=flathub \
  --repo=repo builddir app.nuvem.Nuvem.json
flatpak build-bundle repo app.nuvem.Nuvem.flatpak app.nuvem.Nuvem master
```

Testado localmente com Flatpak 1.18.2 (x86_64): abre, mostra "rclone conectado
v1.75.2", sincroniza com conta Google real (ida e volta), ícone simbólico na
bandeja nos dois temas e início automático pelo portal. `aarch64`: ainda não
validado — pendência assumida na submissão.

## Nota sobre o projeto OAuth no manifesto

O Google cobra a cota de requisições por minuto no *projeto OAuth* usado na
autorização, não na conta. O projeto compartilhado do rclone vive estourado; o
Nuvem embute no binário um projeto próprio (`client_id`/`client_secret` de
aplicativo instalado) por variável de ambiente na compilação. Como
`flatpak-builder` não tem `--env`, o Flathub receberia o par via
`build-options.env` do manifesto.

`client_secret` de aplicativo instalado **não é segredo** segundo o próprio
Google (o rclone publica o dele no código-fonte); ainda assim, se os
mantenedores preferirem, a alternativa é distribuir com o projeto do rclone e
deixar cada usuário colar o próprio par em **Ajustes → Avançado** — o app aceita
as duas coisas, com precedência para o par do usuário.
