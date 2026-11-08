# Roteiro simples do vídeo de verificação

Versão direta, para deixar do lado do gravador. O roteiro detalhado (com dicas de
cada tela) está em [`roteiro-gravacao-ptbr.md`](roteiro-gravacao-ptbr.md); a
narração em inglês, em [`narracao-video-en.md`](narracao-video-en.md).

**Ideia**: você toca um trecho de áudio, faz o que ele pede na tela, espera o
áudio acabar, e passa para o próximo. Dez trechos, ~1 min 50 de áudio, vídeo de
2 a 3 minutos.

---

## Antes de gravar (5 minutos)

- [ ] App **1.6.0** aberto na **Visão geral**, conta **desconectada**.
- [ ] Conta Google reserva pronta (a que vai conectar), em outra janela do
      navegador **já logada** — assim a tela de consentimento aparece direto.
- [ ] Pasta **Nuvem-demo** já existe no Drive dessa conta.
- [ ] `~/Downloads/nuvem-video/narracao/` aberta ao lado (para tocar os MP3).
- [ ] Gravação em **1280×720** ou maior, **um take só**.
- [ ] Nada de e-mail pessoal, notificação ou aba com dado sensível na tela.

> Regra de ouro: **um take, sem cortes, sem acelerar**. Se errar, apague e
> comece de novo. Emenda aparece na revisão.

---

## Os 10 passos

| # | Áudio | O que você faz na tela |
|---|---|---|
| 1 | `01.mp3` (9 s) | Visão geral parada. Não clique em nada. |
| 2 | `02.mp3` (5 s) | Passe o mouse pelas pastas/ajustes, devagar. Nada de clicar. |
| 3 | `03.mp3` (9 s) | **Contas → Adicionar** → escreva (ou deixe) o nome → **Conectar**. |
| 4 | `04.mp3` (15 s) | **O navegador abre.** Deixe a tela de consentimento parada e legível: nome **Nuvem Sync** e o escopo **Drive**. Role devagar se precisar. Clique em **Permitir**. |
| 5 | `05.mp3` (6 s) | Antes de trocar de janela, mostre a página final do navegador — **Nuvem Sync · Conta conectada** — por 1 segundo. Voltou ao app: a conta aparece **conectada**, com cota. Deixe ler. |
| 6 | `06.mp3` (14 s) | **Pastas → Adicionar pasta** → navegue pelo Drive e escolha **Nuvem-demo** → escolha a pasta local → **Adicionar**. |
| 7 | `07.mp3` (9 s) | Crie um arquivo **dentro da pasta local** (ex.: abra a pasta e salve um `teste.txt`). Espere aparecer na **Atividade** como enviado. |
| 8 | `08.mp3` (8 s) | **No navegador**: edite o mesmo arquivo no Drive. Volte ao app e espere a alteração descer sozinha. |
| 9 | `09.mp3` (13 s) | Mostre que o resto do Drive não muda. Depois **myaccount.google.com → Segurança → Aplicativos de terceiros** e mostre o Nuvem Sync na lista (ou revogue e mostre a sincronização parar). |
| 10 | `10.mp3` (9 s) | **Visão geral**, sem mexer. Espere o áudio acabar e pare a gravação. |

Os tempos de referência que o modelo usa (não precisa acertá-los: anote os seus
no fim): **0:02 · 0:18 · 0:33 · 0:52 · 1:18 · 1:33 · 1:52 · 2:12 · 2:32 · 2:47**.

---

## O que não pode faltar

1. **A tela de consentimento** (passo 4) — é o que o revisor procura. Nome do app
   igual ao do site e **um** escopo: Drive.
2. **As duas direções** de sincronização: subir (passo 7) e descer (passo 8) sem
   você mandar.
3. **Um take**, sem corte e sem acelerar a imagem.

Se faltar um desses, o vídeo volta reprovado e você reenvia — melhor conferir a
gravação antes de subir.

## Depois de gravar

1. Grave mudo se preferir; o áudio entra depois, da raiz do repositório:

   ```bash
   cp ~/Downloads/nuvem-video/tempos-exemplo.txt tempos.txt   # ajuste os instantes
   bash app/scripts/montar-audio-video.sh gravacao.mp4 tempos.txt
   ```

   O script **não** recodifica a imagem (`-c:v copy`) — é o que mantém o vídeo
   "sem cortes" aos olhos do revisor.
2. Confira o vídeo no próprio player: nome do app legível, escopo legível, as duas
   direções aparecendo.
3. Suba como **não listado** no YouTube e envie o link em
   `console.cloud.google.com/auth/verification`.
