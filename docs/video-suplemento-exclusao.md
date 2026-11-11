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
