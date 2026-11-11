# Suplemento do vídeo — exclusão nos dois sentidos (40–60 s)

O vídeo principal (`https://youtu.be/eaBMDHnTEf4`) mostra consentimento, envio,
download e revogação, mas **não mostra exclusão**. O item *Source Account Impact*
do checklist do Google pede justamente isso quando o app tem permissão de apagar.
Este suplemento fecha a lacuna sem regravar o vídeo inteiro.

## Já está preparado (11/11)

| Item | Estado |
| --- | --- |
| Pasta local | `/home/agreles/Downloads/nuvem-suplemento` com `meeting-notes.txt` (126 B), `budget.csv` (64 B) e `example.md` (112 B) |
| Pasta na nuvem | `Nuvem-suplemento` no Drive da conta `fabioagrelespessoal@gmail.com`, com os mesmos três arquivos (conferido pela API do motor: 3 itens, mesmos tamanhos) |
| Conteúdo | fictício e explícito ("safe to delete in the demo", "Nothing here is real data") |

Três arquivos de propósito: o motor aborta a rodada se **100%** dos arquivos de um
lado mudarem. Apagando um de cada vez, a mudança fica em 33% e depois 50% — roda
normal, sem `Safety abort`.

## Preparar o app (2 min, antes de gravar)

1. Abra o Nuvem Sync (está rodando minimizado na bandeja).
2. **Settings → System → Language → English** — o revisor é anglófono e o vídeo
   principal já está em inglês.
3. Na lista de pastas, **pause a pasta `FolderTest`** (é o perfil que sincroniza a
   raiz inteira do Drive, criado em teste). Ela não deve aparecer na atividade
   durante a gravação.
4. **Folders → Add folder** → navegue no Drive e escolha **`Nuvem-suplemento`** →
   pasta local `/home/agreles/Downloads/nuvem-suplemento`.
5. Espere a primeira sincronização (o app faz uma linha de base na hora de
   adicionar). O cartão precisa ficar **“Up to date”** antes de gravar.
6. Abra no navegador, em outra aba, o Drive em **`Nuvem-suplemento`** — os três
   arquivos visíveis. É essa aba que o vídeo vai recarregar.

## Gravar (um take, sem cortes, com narração)

Resolução ≥ 1280×720, zoom do sistema em 110–125%, microfone ligado. Deixe na
tela apenas: a janela do Nuvem Sync (aba **Activity** visível) e a aba do Drive.

### 0:00–0:15 — contexto

> "This is Nuvem Sync, syncing this folder on my computer with a folder in my own
> Google Drive. Everything is up to date right now."

Mostre o cartão da pasta com “Up to date” e a aba do Drive com os três arquivos.

### 0:15–0:35 — exclusão feita no computador

Apague `meeting-notes.txt` na pasta local (gerenciador de arquivos). Volte ao app,
clique **Sync now** se a rodada não começar sozinha (o intervalo é de 5 min), e
mostre na atividade que o arquivo foi removido.

> "I just deleted this file on my computer. This is the app's activity log
> recording the deletion — and here it is gone from my Google Drive in the
> browser."

Recarregue a aba do Drive (F5) e mostre que sobraram dois arquivos.

### 0:35–0:55 — exclusão feita no Drive

Na aba do Drive, apague `budget.csv`. Volte ao app, **Sync now** se preciso, e
mostre a atividade.

> "Now the other direction: I delete this file in the Drive web interface, and the
> app removes it from my local folder."

Abra a pasta local e mostre que só resta `example.md`.

### 0:55–1:05 — limite

> "Only the folders I added to the app are touched. Nothing else in my Drive is
> affected, and access can be revoked at any time on my Google Account page."

## Gravação feita (11/11, 12:27) — 77,9 s, 1920×1080

O vídeo gravado cobre os dois sentidos e foi narrado por síntese de voz
(`edge-tts`, voz `en-US-AndrewNeural`, a mesma do vídeo principal), porque não
havia microfone disponível. A faixa original (sem fala) foi substituída pela
narração alinhada à linha do tempo real, sem editar a imagem:

| Tempo | Tela | Narração |
| --- | --- | --- |
| 0:00 | Overview “All up to date”, 1 pasta, conta `fabioagrelespessoal@gmail.com` | “This is Nuvem Sync, syncing a folder on my computer with a folder in my own Google Drive. Everything is up to date: three demo files, in both places.” |
| 0:16 | Drive web: `Nuvem-suplemento` com os 3 arquivos | “Here is the Drive folder in the browser, with the same three files.” |
| 0:22 | gerenciador de arquivos: `FolderTest/Nuvem-suplemento` com os 3 | “And here they are in the synced folder on my computer.” |
| 0:30 | apaga `meeting-notes.txt` no computador | “I delete one of the three files on the computer.” |
| 0:36 | atividade: “1 removed” + notificação do sistema | “The activity log records it: one file removed. And here is the Drive folder, reloaded — that file is gone from Google Drive as well.” |
| 0:44 | Drive recarregado: 2 arquivos, `budget.csv` selecionado | (mesma frase) |
| 0:49 | apaga `budget.csv` no Drive web | “Now the other direction. I delete this file in the Drive web interface.” |
| 0:59 | atividade: “1 removed” de novo | “The app syncs again and removes it from the folder on my computer. One file removed again.” |
| 1:04 | pasta local: só `example.md` | “Only one demo file is left, on the computer and in the Drive.” |
| 1:08 | Drive: só `example.md` | (mesma frase) |
| 1:10 | volta ao Overview, em dia | “Only the folders I added to the app are affected, and access can be revoked at any time on my Google Account page.” |

Arquivos em `~/Vídeos/`:

- `Nuvem Sync — delete propagation (verification supplement).mp4` — gravação crua, 4,4 MB
- `Nuvem Sync — delete propagation (verification supplement) — narrado.mp4` — **o que vai para o YouTube**, 5,2 MB

Notas da sessão, para não confundir depois:

- a gravação usou o perfil existente (raiz do Drive ↔ `/home/agreles/FolderTest`),
  então a pasta de demonstração aparece como `FolderTest/Nuvem-suplemento`; funciona
  igual para o revisor (é a pasta sincronizada de verdade);
- durante os testes de perfil, os arquivos fictícios de `Nuvem-demo` (e o
  `.directory` de 35 B) saíram do Drive — nada real, só o material de demonstração;
- ficou uma pasta `~/Downloads/nuvem-suplemento/Nuvem-suplemento/` (cópia criada
  por um perfil adicionado e removido); pode apagar.

## Não mostrar

`client_secret`, tokens, o arquivo `rclone.conf`, outras abas do navegador (e-mail,
banco, WhatsApp Web), a raiz do Drive com arquivos pessoais, o painel de
diagnóstico, o terminal.

## Publicar

1. YouTube → **Create → Upload video** → visibilidade **Unlisted**.
2. Título: `Nuvem Sync — delete propagation (verification supplement)`.
3. Descrição (colar):

```
Supplementary clip for the Google OAuth verification of Nuvem Sync.
Deletion propagating in both directions between the local folder and Google Drive:

0:00  Folder up to date: 3 files on the computer and in Google Drive
0:15  A file deleted on the computer disappears from Google Drive
0:35  A file deleted in the Drive web UI disappears from the computer
0:55  Only the folders added to the app are touched; access can be revoked anytime

Scope under review: https://www.googleapis.com/auth/drive
Home page:      https://nuvem-sync.app.br/
Privacy policy: https://nuvem-sync.app.br/privacidade.html
Source code:    https://github.com/fabio-agreles/nuvem (MIT)
```

4. Copie o link `https://youtu.be/…` e cole em
   [`resposta-google-verificacao.md`](resposta-google-verificacao.md), na linha
   `Supplementary clip on deletion:` (o resto da resposta já está pronto).

## Depois de gravar

- Restaure o idioma do app se quiser (Settings → Language → Português) e reative a
  pasta `FolderTest`.
- **Não apague** `Nuvem-suplemento` do Drive nem a pasta local por 4–6 semanas: se
  o revisor pedir outro detalhe, é o ambiente já pronto.
- Se o app barrar a exclusão com “nada foi apagado” ou pedir ressincronização,
  clique no erro do cartão → **Resync**: com os dois lados não vazios, o resync só
  acerta o estado, não apaga nada.
