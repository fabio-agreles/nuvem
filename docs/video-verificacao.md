# Vídeo da verificação do escopo `drive` — roteiro de gravação

Documento operacional: o que abrir, em que ordem, o que dizer e o que **não**
mostrar. O texto da justificativa (em inglês, para colar no formulário) está em
[`verificacao-google.md`](verificacao-google.md) §4.

Estado em 04/11/2026: **marca verificada e publicada**; falta só a verificação do
escopo restrito `drive`. É o vídeo que falta.

---

> **Roteiro em português, clique por clique:** [`roteiro-gravacao-ptbr.md`](roteiro-gravacao-ptbr.md).
> Narração em inglês (texto e áudio): [`narracao-video-en.md`](narracao-video-en.md).

---

## Antes de gravar (15 min)

| Item | Por quê |
| --- | --- |
| **Conta Google reserva** | a tela de consentimento só aparece em autorização nova. Usar a principal obriga revogar e reconectar, e ainda apaga o estado do bisync. Cada conta reserva consome **1 das 97 autorizações** restantes — não faça testes extras. |
| `bash scripts/demo-video.sh` | cria `~/Downloads/nuvem-demo-video` com `nota.txt`, `planilha-demo.csv` e `exemplo.md` fictícios. |
| Pasta `Nuvem-demo` no Drive | crie pela web e envie os três arquivos para dentro. É a pasta que o vídeo vai sincronizar. |
| Nuvem Sync **1.5.0** instalado | a tela de consentimento tem de mostrar `Nuvem Sync`, igual à marca verificada. |
| Janela limpa | feche abas com e-mail, banco, WhatsApp Web. O revisor vê a tela inteira. |
| Resolução e fonte | 1280×720 no mínimo; zoom do sistema em 110–125% para o texto ser legível no YouTube. |
| Gravação | tela inteira + microfone, **um take só, sem cortes e sem edição**. |

Não mostre em momento nenhum: `client_secret`, tokens, arquivos pessoais,
e-mail de outras contas, outras abas do Drive.

---

## Roteiro (2–3 min)

Narre **em inglês**. O revisor é anglófono, e a narração conta tanto quanto a
tela.

### 0:00–0:15 — identificação

Tela inicial do Nuvem Sync, parada.

> "This is Nuvem Sync, an open-source desktop application that keeps a folder on
> my computer in two-way sync with a folder in my own Google Drive."

### 0:15–0:30 — o app e a conta

Visão geral → cartão de contas (mostre que está vazia ou só com a reserva).

> "There is no server: the sync engine and the OAuth token stay on this
> computer."

### 0:30–0:50 — iniciar a autorização

**Contas → Adicionar conta → Google Drive.** O navegador abre.

> "I'm adding a Google Drive account. The authorization request is about to
> show the app name and the single permission it needs."

### 0:50–1:15 — a tela de consentimento (o trecho que o revisor procura)

Aproxime (ou destaque) estes quatro pontos, um a um, lendo em voz alta:

1. o nome do app — **Nuvem Sync**;
2. o escopo — *"Ver, editar, criar e excluir todos os seus arquivos do Google
   Drive"* / `https://www.googleapis.com/auth/drive`;
3. a frase de que o app não foi verificado por enquanto (é o esperado);
4. clique em **Permitir / Allow**.

> "This is the single scope Google requires for two-way sync of existing
> folders. The app requests nothing else."

### 1:15–1:30 — de volta ao app

A conta aparece com nome, e-mail e cota do Drive.

### 1:30–1:50 — escolher a pasta

**Pastas → Adicionar pasta →** navegue pelo Drive **dentro do app** e escolha
`Nuvem-demo`. Isso mostra que o app lê a estrutura que já existe (é a razão do
escopo `drive` e não `drive.file`).

> "I'm selecting a folder that already exists in my Drive. A narrower scope
> could not see it."

### 1:50–2:10 — subir

No gerenciador de arquivos, crie um arquivo dentro da pasta local
(`demonstracao.txt` com qualquer texto). Volte ao app: a atividade mostra o
envio. Abra o Drive na web e mostre o arquivo lá.

> "A file created on the computer is uploaded to Drive without any extra step."

### 2:10–2:30 — descer

No **Drive web**, edite `nota.txt` (troque `versao: 1` por `versao: 2`) e salve.
Volte ao app, mostre a atividade de download e abra o arquivo local já alterado.

> "I changed the same file in the Drive web interface, and the app brought the
> change back down."

### 2:30–2:45 — limites e revogação

Mostre a lista de pastas (só `Nuvem-demo`) e desconecte a conta; ou abra
<https://myaccount.google.com/permissions> e mostre o app na lista com **Remover
acesso**.

> "Only the folders I add are touched. Access can be revoked at any time here,
> and the app stops working immediately."

Encerre dizendo o nome e o repositório:

> "That's Nuvem Sync, github.com/fabio-agreles/nuvem, MIT licensed."

---

## A página "All done. Please go back to rclone."

Depois de clicar em **Permitir**, o navegador mostra `Success! / All done. Please
go back to rclone.`. **Essa página não é do Google**: é do rclone, que roda um
servidor local em `127.0.0.1:53682` para receber a resposta da autorização e
devolve o token para o app. O texto é um template Go embutido no binário do
rclone (não há flag para trocá-lo):

```
{{ if eq .OK false }}…{{ else }}
All done. Please go back to rclone.
{{ end }}
```

Isso **não atrapalha a verificação**: o revisor julga a tela de consentimento
(nome do app + escopo) e o funcionamento. Se quiser o nome do app nessa página,
o caminho é o app fazer a autorização sozinho, com o próprio servidor de retorno
— está anotado no `PLANO.md` como melhoria para uma 1.6.0.

## Depois de gravar

1. **YouTube** → *Criar → Enviar vídeo* → visibilidade **Não listado** (não
   privado: o revisor precisa abrir o link). Título algo como
   `Nuvem Sync — OAuth verification demo (drive scope)`.
2. Copie o link (`https://youtu.be/…`).
3. <https://console.cloud.google.com/auth/verification> → **Preparar para
   verificação** → justificativa (cole o texto da §4) + link do vídeo +
   confirmar o escopo `drive` e o domínio `nuvem-sync.app.br`.
4. Enviar. O status passa para *Em análise*; escopo restrito costuma levar
   **semanas**.

## Se for reprovado

Os motivos que o Google costuma dar, e o que fazer em cada caso:

| Motivo | Correção |
| --- | --- |
| "não mostra a tela de consentimento" | o take precisa incluir o navegador abrindo a tela — não corte essa parte |
| "não mostra o uso efetivo dos dados" | faltou o arquivo subindo/descendo de verdade; refaça com a pasta demo |
| "justificativa genérica" | cite a limitação do `drive.file` (texto da §4 já faz isso) |
| "política de privacidade inacessível" | confira `https://nuvem-sync.app.br/privacidade.html` respondendo 200 |
| "vídeo editado" | grave de novo, take único |
