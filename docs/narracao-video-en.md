# Narração em inglês do vídeo de verificação

Texto para ler (ou para uma voz sintética ler) enquanto você executa o roteiro de
[`video-verificacao.md`](video-verificacao.md). Cada trecho corresponde a um
momento da tela e vira um arquivo de áudio separado:

```bash
bash scripts/narracao-video.sh          # gera os 10 trechos + a faixa contínua
```

Saída em `~/Downloads/nuvem-video/narracao/`: `01.mp3` … `10.mp3`,
`narracao-completa.mp3` (1 min 48 s, com 1,2 s entre os trechos) e `roteiro.txt`.

---

## Qual voz usar

| Opção | Como | Qualidade | Observação |
| --- | --- | --- | --- |
| **`en-US-AndrewNeural`** (Edge TTS) — *é a que usei* | `bash scripts/narracao-video.sh` | muito boa, neural, masculina calma | grátis, sem conta, sem chave; precisa de internet na hora de gerar |
| `en-US-AvaNeural`, `en-US-BrianMultilingualNeural`, `en-GB-RyanNeural` | `VOZ=en-US-AvaNeural bash scripts/narracao-video.sh` | mesma faixa | vozes da mesma família; `--list-voices` mostra todas |
| ElevenLabs (free) | site, cola o texto | a melhor | 10 min/mês grátis; pede conta; cuide do limite |
| Piper (offline) | binário + modelo `.onnx` | boa | roda sem internet, útil se a rede estiver instável |
| espeak-ng | já instalado aqui | robótica | **não use** em vídeo que vai para revisão |

A recomendação prática é a **primeira**: `en-US-AndrewNeural` via `edge-tts`,
que é o que o script já faz. É voz neural de verdade, com pausas naturais, e não
tem cara de "leitor de tela".

O Google **não exige voz humana** — exige que o vídeo mostre o app funcionando
de verdade, sem cortes que escondam etapa. Narração sintética é aceita; o que
reprova é vídeo editado, tela de consentimento ausente ou fluxo fake.

### Ritmo

Se os trechos ficarem lentos para o seu ritmo de execução, acelere de leve:

```bash
RITMO=+8% bash scripts/narracao-video.sh
```

---

## Como gravar com o áudio pronto

1. Abra a pasta `~/Downloads/nuvem-video/narracao/` ao lado do gravador de tela.
2. Comece a gravar a tela **com áudio do sistema** (o trecho tocado tem de entrar
   no vídeo) ou grave a tela muda e case o áudio depois — nesse caso o vídeo
   precisa continuar **sem cortes**.
3. Execute a ação da tela, toque o trecho correspondente, espere ele terminar.
4. Siga para o próximo. A sequência abaixo é a mesma do roteiro.

Não é preciso decorar nada: toque `01.mp3`, faça o que ele diz, toque `02.mp3`,
e assim por diante.

---

## Roteiro (o mesmo texto dos arquivos de áudio)

| # | Momento | Texto |
| --- | --- | --- |
| 01 | 0:00 tela inicial | This is Nuvem Sync, an open-source desktop application that keeps a folder on my computer in two-way sync with a folder in my own Google Drive. |
| 02 | 0:15 o app | There is no server component. The sync engine and the OAuth token stay on this computer. |
| 03 | 0:30 adicionar conta | I'm adding a Google Drive account. The authorization request is about to open in the browser, and it will show the app name and the single permission it needs. |
| 04 | 0:50 tela de consentimento | Here is the Google consent screen. The app name is Nuvem Sync, exactly as on the website. The only permission requested is access to Google Drive files, the drive scope. The app is not verified yet, and that is what I'm applying for. I'll allow it. |
| 05 | 1:15 conta conectada | Back in the app, the account is connected, with its name, e-mail address and Drive quota. |
| 06 | 1:30 escolher a pasta | Now I'm adding a folder. I browse my existing Google Drive and select Nuvem-demo. A narrower permission, drive dot file, could not see a folder the app did not create itself. That is the reason the full drive scope is required. |
| 07 | 1:50 subir arquivo | I'll create a file on the computer, inside the synced folder. The activity list shows it being uploaded, and here it is in the Drive web interface. |
| 08 | 2:10 descer alteração | Now the other direction. I edit the same file in the Drive web interface, and the app brings the change back down to the computer on its own. |
| 09 | 2:30 limites e revogação | Only the folders I add are touched. The rest of my Drive is untouched. And access can be revoked at any time: here is the app in my Google account permissions. Once revoked, syncing stops immediately. |
| 10 | 2:45 encerramento | That's Nuvem Sync. It is open source, MIT licensed, at github dot com slash fabio dash agreles slash nuvem. Thank you. |

---

## Ficha do vídeo no YouTube

**Título**

```
Nuvem Sync — Google OAuth verification demo (drive scope)
```

**Visibilidade:** Não listado. **Não** privado — o revisor precisa abrir o link.

**Descrição**

```
Demo for the Google OAuth verification of Nuvem Sync — restricted scope
https://www.googleapis.com/auth/drive

Nuvem Sync is an open-source (MIT) desktop application that keeps a folder on the
user's computer in two-way sync with a folder in the user's own Google Drive,
using the local rclone bisync engine. There is no server component: the OAuth
token and the file contents stay on the user's device.

What this video shows
0:00  App overview — local engine, no server
0:30  Adding a Google Drive account
0:50  The OAuth consent screen: app name "Nuvem Sync" and the single requested
      scope (drive)
1:30  Selecting a Drive folder that already exists
1:50  A file created on the computer is uploaded to Drive
2:10  A change made in the Drive web UI is downloaded to the computer
2:30  Only the folders added to the app are touched; access can be revoked

Why the drive scope is required: the core feature is syncing folders that already
exist in the user's Drive. The narrower drive.file scope only grants access to
files created by the application itself, so it cannot list, download or update
files the user created in the Drive web UI — it would make the main feature
impossible.

Home page:     https://nuvem-sync.app.br/
Privacy policy: https://nuvem-sync.app.br/privacidade.html
Source code:   https://github.com/fabio-agreles/nuvem
License:       MIT
```

**Tags**

```
google drive sync, two-way sync, open source, desktop app, rclone bisync,
oauth verification, drive scope, linux, windows
```

---

## Onde isso vai no formulário

<https://console.cloud.google.com/auth/verification> → **Preparar para
verificação**:

| Campo | O que colar |
| --- | --- |
| Justificativa | texto da §4 de [`verificacao-google.md`](verificacao-google.md) (em inglês) |
| Vídeo | link `https://youtu.be/…` do vídeo não listado |
| Escopos | `https://www.googleapis.com/auth/drive` |
| Domínio | `nuvem-sync.app.br` (já verificado) |

Prazo típico depois de enviar: **semanas** para escopo restrito (a marca levou
horas). Acompanhe em *Centro de verificação*.
