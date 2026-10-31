# Nuvem

Sincronização bidirecional entre pastas deste computador e **Google Drive** ou
**OneDrive** — com o visual cuidado e o uso simples, em vez de um painel cheio
de opções. Feito com [Tauri 2](https://tauri.app) (Rust + React) e o motor
[bisync do rclone](https://rclone.org/bisync/) embutido nos pacotes.

![Nuvem no tema escuro](app/docs/previews/preview-dark.png)

## O que ele faz

- **Bisync de verdade**: alterações locais e da nuvem descem e sobem sozinhas,
  sem sincronização em um sentido só.
- **Google Drive e OneDrive**, contas via OAuth com o projeto do próprio Nuvem
  (mais rápido que o projeto compartilhado do rclone) e possibilidade de usar as
  suas credenciais.
- **Enviar e baixar arquivos avulsos**, navegar pela nuvem, ver conflitos lado a
  lado e escolher qual versão fica.
- **Trava de segurança**: se um dos lados ficar vazio e o outro não, a
  sincronização é barrada em vez de apagar o lado cheio.
- Bandeja do sistema, iniciar com o sistema, notificações, limites de banda,
  regras de ignorar, tema claro/escuro, relatório de diagnóstico sem segredos.
- **pt-BR**, sem telemetria: nada sai do computador além do tráfego direto para
  Google/Microsoft.

## Instalar

Baixe em [Releases](https://github.com/fabio-agreles/nuvem/releases/latest):

| Pacote | Para |
| --- | --- |
| `Nuvem_x.y.z_amd64.deb` | Debian, Ubuntu, Mint — `sudo apt install ./Nuvem_*.deb` |
| `Nuvem_x.y.z_amd64.AppImage` | Qualquer Linux, sem instalar (usa o WebKitGTK do sistema) |
| `Nuvem-x.y.z-x86_64.flatpak` | Flatpak/Flathub-style, isolado |
| `Nuvem_x.y.z_x64-setup.exe` | Windows 10/11 (instalador NSIS, sem assinatura digital) |

O rclone vai dentro de todos os pacotes: não é preciso instalá-lo.

## Documentação

- [`app/README.md`](app/README.md) — arquitetura, como rodar do código, decisões
  de velocidade e limites conscientes.
- [`docs/roteiro-teste-windows.md`](docs/roteiro-teste-windows.md) — roteiro de
  teste no Windows, passo a passo.
- [`docs/oauth-google.md`](docs/oauth-google.md) — projeto OAuth próprio no
  Google Cloud (e por que ele importa para a cota).
- [`docs/flathub-pr.md`](docs/flathub-pr.md) — submissão ao Flathub.
- [`PRIVACIDADE.md`](PRIVACIDADE.md) — política de privacidade.
- [`PLANO.md`](PLANO.md) — o que já foi feito e o que falta.

## Estado

Funciona em Linux (Flatpak, `.deb`, AppImage) e Windows. Limitações conhecidas:
os pacotes não são assinados (o SmartScreen avisa no Windows), o AppImage não
embute o WebKitGTK, e o projeto OAuth do Google ainda está em verificação — o que
limita quantas contas novas podem autorizar o app por enquanto.

Licença: [MIT](LICENSE).
