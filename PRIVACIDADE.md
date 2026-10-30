# Política de privacidade do Nuvem

Última atualização: 30 de outubro de 2026.

O Nuvem é um aplicativo de desktop que mantém pastas deste computador em
sincronização bidirecional com o Google Drive e o OneDrive. **Não existe servidor
do Nuvem**: nada do seu conteúdo passa por máquinas nossas, porque não temos
nenhuma.

## Que dados o aplicativo acessa

| Dado | Para quê | Onde fica |
| --- | --- | --- |
| Arquivos e pastas da nuvem **que você escolhe sincronizar** | Copiar de/para a pasta local que você indicou (bisync) | No seu computador e no provedor que você conectou |
| Nome, e-mail e cota da sua conta Google/OneDrive | Mostrar o card da conta e o uso de armazenamento | No seu computador |
| Tokens de acesso (OAuth) | Falar com a API do provedor sem pedir sua senha a cada vez | `~/.config/rclone/rclone.conf` (`%APPDATA%\rclone`), permissão `0600` |
| Ajustes e histórico de atividade | Manter as preferências e mostrar o que foi sincronizado | `~/.config/app.nuvem.Nuvem` (`%APPDATA%\app.nuvem.Nuvem`) |

O aplicativo **não** lê arquivos fora das pastas que você adicionou, **não**
acessa Gmail, contatos, calendário ou fotos, e **não** guarda cópia do seu
conteúdo em lugar nenhum além do computador e da conta que você conectou.

## Escopo do Google Drive

O Nuvem pede o escopo `https://www.googleapis.com/auth/drive` porque a
sincronização precisa ler e gravar arquivos que **já existem** na sua conta —
é o caso de uma pasta de trabalho que você quer manter igual nos dois lados. O
escopo mais restrito (`drive.file`) só enxerga arquivos criados pelo próprio
aplicativo, o que impediria a sincronização de pastas existentes. O acesso é
usado exclusivamente para transferir os arquivos das pastas que você escolheu.

## O que sai do seu computador

- Requisições para as APIs do **Google** e da **Microsoft** (as mesmas que o
  seu navegador faria ao usar o Drive/OneDrive na web), autenticadas com o
  token da sua conta.
- Se você pedir "Verificar atualização" em Ajustes → Sobre: uma requisição para
  `https://api.github.com` perguntando a última versão publicada. Ela não leva
  identificador seu, arquivos, nomes de pastas nem token.

Não há telemetria, análise de uso, crash reporting remoto nem publicidade.

## Relatório de diagnóstico

O relatório (Ajustes → Sobre → Salvar) é gerado **localmente** e só é enviado
se você mesmo enviar. Ele contém versão do app, sistema, versão do rclone,
nomes das contas e das pastas, ajustes e os últimos erros — nunca senhas,
tokens ou o `client_secret` do OAuth.

## Como apagar seus dados

1. **Desconectar uma conta** (Visão geral → Contas): apaga as credenciais dela
   do `rclone.conf` e o estado do bisync daquelas pastas.
2. **Desinstalar** o aplicativo: os arquivos ficam em `~/.config/app.nuvem.Nuvem`
   e `~/.config/rclone` (Windows: `%APPDATA%`). Apague essas duas pastas para
   remover tudo. Seus arquivos na nuvem não são tocados.
3. **Revogar o acesso** direto no provedor:
   [myaccount.google.com/permissions](https://myaccount.google.com/permissions)
   (Google) ou [account.live.com/consent/Manage](https://account.live.com/consent/Manage)
   (Microsoft).

## Contato

Dúvidas sobre privacidade: abra uma issue em
<https://github.com/fabio-agreles/nuvem/issues>.
