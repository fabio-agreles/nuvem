# Roteiro de gravação do vídeo — em português, passo a passo

O que clicar, em que ordem, o que deve aparecer na tela e o que fazer se algo
sair diferente. A narração em inglês já está pronta em áudio
(`~/Downloads/nuvem-video/narracao/`) — aqui você só segue a tela e toca o
trecho da vez. Tempo total: **~2 min 45 s**.

Contexto: verificação do escopo restrito `drive` no Google
([`verificacao-google.md`](verificacao-google.md) §4). A marca já está verificada
e publicada; falta só este vídeo.

---

## 1. Antes de gravar — checklist

Marque tudo antes de apertar o "gravar". Cada item perdido aqui é uma regravação
de 3 minutos.

- [ ] **Conta Google reserva** logada no navegador, e **ainda não conectada** no
      Nuvem Sync. Se ela já estiver conectada, a tela de consentimento **não
      aparece** e o vídeo inteiro não serve.
- [ ] Pasta **`Nuvem-demo`** criada no Drive dessa conta, com os três arquivos de
      `~/Downloads/nuvem-demo-video/` (`nota.txt`, `planilha-demo.csv`,
      `exemplo.md`) — confira abrindo o Drive na web.
- [ ] Nuvem Sync **1.6.0** aberto na tela **Visão geral**, sem conta conectada.
- [ ] Gerenciador de arquivos aberto em `~/Downloads/nuvem-demo-video`.
- [ ] Pasta `~/Downloads/nuvem-video/narracao/` aberta (vai tocar os MP3).
- [ ] Drive web aberto **noutra aba**, já na conta reserva, mostrando a pasta
      `Nuvem-demo`.
- [ ] Um editor de texto aberto (Gedit/Kate) para editar `nota.txt` no fim.
- [ ] Aba com `myaccount.google.com/permissions` (para o trecho da revogação).
- [ ] **Não perturbe** ligado; abas de e-mail, banco e WhatsApp fechadas; barra de
      favoritos escondida (`Ctrl+Shift+B`).
- [ ] Zoom do sistema em 110–125% (o revisor precisa ler a tela no YouTube).
- [ ] Gravador de tela: **tela inteira + áudio do sistema**, `1080p` ou `720p`.

> Regra de ouro: **um take, sem cortes, sem edição**. Se errar, pare, apague e
> comece de novo — emendar aparece na revisão.

---

## 2. Gravação, passo a passo

Cada passo tem: o que fazer, o que deve aparecer, e qual áudio tocar.

### 0:00 — Abertura · toque `01.mp3`

| | |
| --- | --- |
| **Ação** | Nada. Deixe a **Visão geral** parada, cursor fora do caminho. |
| **Na tela** | Sidebar com `Nuvem Sync / sincronização simples`, cartão de contas vazio, cartões de pastas. |
| **Se algo estiver diferente** | Se houver conta conectada, pare: veja o plano B (item 4) antes de continuar. |

### 0:15 — O app · toque `02.mp3`

| | |
| --- | --- |
| **Ação** | Passe o mouse pelos cartões da Visão geral; opcionalmente clique em **Pastas** e volte para **Visão geral**. |
| **Na tela** | As telas do app, sem modais. |
| **Dica** | Movimento lento. Nada de sacudir o mouse enquanto a narração fala de "no server". |

### 0:30 — Iniciar a autorização · toque `03.mp3`

| | |
| --- | --- |
| **Ação** | Visão geral → cartão **Contas** → link **Adicionar**. |
| **Na tela** | Abre o modal **Conectar conta** com dois botões: **Google Drive** (já selecionado) e **OneDrive**, o campo *Nome da conta (opcional)* e o aviso "A autorização acontece no navegador. O Nuvem Sync nunca vê sua senha." |
| **Ação 2** | Deixe o nome vazio e clique em **Conectar**. |
| **Na tela** | O botão muda para **Aguardando autorização…** e o navegador abre sozinho. |
| **Se o navegador não abrir** | O modal fica parado; abra manualmente pela mensagem de erro. Se acontecer, pare a gravação e teste antes. |

### 0:50 — A tela de consentimento · toque `04.mp3` · **o trecho que decide**

| | |
| --- | --- |
| **Ação** | No navegador, **pare** e deixe a tela de consentimento visível. Aponte/realce, um de cada vez: (1) o nome **Nuvem Sync**, (2) a linha do escopo do Drive ("Ver, editar, criar e excluir…"), (3) o aviso de app não verificado. |
| **Ritmo** | 2–3 segundos em cada item. É o trecho que o revisor procura; pressa aqui é reprovação. |
| **Ação 2** | Clique em **Continuar** (se aparecer a tela de seleção) e depois em **Permitir / Allow**. |
| **Se aparecer "O Google não verificou este app"** | É o esperado. Clique em **Avançado → Acessar Nuvem Sync (não seguro)**. Deixe a tela visível alguns segundos antes de clicar. |

### 1:15 — De volta ao app · toque `05.mp3`

| | |
| --- | --- |
| **Ação** | Volte para a janela do Nuvem Sync (o modal fecha sozinho). |
| **Na tela** | O cartão da conta com nome, e-mail e a barra de cota do Drive. |
| **Se der erro** | Anote a mensagem e pare — `invalid_scope` significa escopo fora de *Acesso a dados* (plano B, item 3). |

### 1:30 — Escolher a pasta · toque `06.mp3`

| | |
| --- | --- |
| **Ação** | Vá em **Pastas** → **Adicionar pasta**. |
| **Na tela** | Modal **Adicionar pasta**: campo **Conta**, o navegador de pastas da nuvem, e **Pasta local** com o botão **Escolher**. |
| **Ação 2** | No navegador de pastas, entre até ver **Nuvem-demo** e **clique no nome da pasta** (o chevron `>` só entra; o nome é que seleciona). |
| **Ação 3** | Em **Pasta local**, clique em **Escolher** e aponte `~/Downloads/nuvem-demo-video` (ou digite o caminho). |
| **Ação 4** | Clique em **Adicionar**. |
| **Na tela** | A linha da pasta aparece com o caminho `conta → /home/…/nuvem-demo-video`. |

### 1:50 — Arquivo sobe · toque `07.mp3`

| | |
| --- | --- |
| **Ação** | No gerenciador de arquivos, abra a pasta local e **crie `demonstracao.txt`** com uma frase qualquer. Salve. |
| **Ação 2** | Volte ao app → **Atividade**. |
| **Na tela** | Uma linha de envio do `demonstracao.txt`. |
| **Ação 3** | Troque para a aba do Drive web e atualize (`F5`) a pasta `Nuvem-demo`: o arquivo tem de estar lá. |
| **Se demorar** | Clique no ícone de **setas em círculo** ("Sincronizar agora") na linha da pasta e espere na tela — mostre o indicador girando, não corte. |

### 2:10 — Alteração desce · toque `08.mp3`

| | |
| --- | --- |
| **Ação** | No **Drive web**, abra `nota.txt`, troque `versao: 1` por `versao: 2` e salve. |
| **Ação 2** | Volte ao app → **Atividade**: linha de download. |
| **Ação 3** | Abra `nota.txt` local no editor e mostre `versao: 2`. |
| **Na tela** | A prova do sentido inverso — sem isso o vídeo não demonstra sincronização bidirecional. |

### 2:30 — Limites e revogação · toque `09.mp3`

| | |
| --- | --- |
| **Ação** | Volte em **Pastas** e mostre que existe **só** `Nuvem-demo`. |
| **Ação 2** | Alterne para a aba `myaccount.google.com/permissions` e mostre **Nuvem Sync** na lista. |
| **Ação 3** | Se quiser, clique em **Remover acesso** (é uma conta reserva, pode remover). |
| **Na tela** | O revisor vê que o acesso é revogável e que o app não toca no resto do Drive. |

### 2:45 — Fechamento · toque `10.mp3` e **pare a gravação**

| | |
| --- | --- |
| **Ação** | Deixe a Visão geral visível enquanto a narração cita o repositório. Só então pare de gravar. |
| **Cuidado** | Não pare o áudio antes do "Thank you" — corte seco no fim parece edição. |

---

## 3. Depois de gravar

1. **YouTube** → *Criar → Enviar vídeo* → visibilidade **Não listado**.
   Título e descrição: `~/Downloads/nuvem-video/descricao-youtube.txt`.
2. Copie o link `https://youtu.be/…`.
3. <https://console.cloud.google.com/auth/verification> → **Preparar para
   verificação**:
   - justificativa em inglês (`verificacao-google.md` §4),
   - link do vídeo,
   - escopo `https://www.googleapis.com/auth/drive`,
   - domínio `nuvem-sync.app.br`.
4. Enviar e acompanhar em *Centro de verificação* (escopo restrito: semanas).

---

## 4. Gravar mudo e colar o áudio depois (recomendado)

Grave a tela **sem narração**, no seu ritmo, e ponha os MP3 numa faixa de áudio
depois. Isso é permitido e é o caminho mais confortável — mas só funciona se
três regras forem respeitadas:

1. **Não corte o vídeo.** Nada de remover o trecho em que você hesitou, nem
   emendar. O Google pede vídeo contínuo; corte é o motivo nº 1 de reprovação.
2. **Não acelere nem desacelere o vídeo.** Se a narração não couber, ajuste o
   áudio (`RITMO=+8%`) ou regrave — nunca a imagem.
3. **O áudio é trilha separada.** Ele pode sobrepor a gravação; não pode
   substituir a demonstração (nada de tela parada com locução explicando o que
   deveria estar sendo feito).

### Caminho A — editor de vídeo

Serve qualquer um: **Kdenlive** (recomendado no KDE), Shotcut, OpenShot, DaVinci
Resolve.

1. Importe a gravação na **trilha de vídeo** — e não mexa nela.
2. Importe `01.mp3` … `10.mp3` na **trilha de áudio**, cada um começando no
   instante em que a ação correspondente começa na tela.
3. Deixe 0,5–1 s de silêncio antes e depois de cada trecho.
4. Exporte **MP4 H.264 + AAC**. No Kdenlive, em *Configurações do projeto*, use
   "copiar" o stream de vídeo quando a opção existir — assim o vídeo não é
   recodificado e você pode provar que não houve edição.

### Caminho B — script (sem abrir editor, sem reencodar)

```bash
bash app/scripts/montar-audio-video.sh gravacao.mp4 tempos.txt [saida.mp4]
```

`tempos.txt` tem uma linha por trecho (o modelo está em
`~/Downloads/nuvem-video/tempos-exemplo.txt`, já com os tempos do roteiro):

```
0:02   ~/Downloads/nuvem-video/narracao/01.mp3
0:33   ~/Downloads/nuvem-video/narracao/03.mp3
```

O script:

- **copia o vídeo** (`-c:v copy`): nada de reencode, corte ou mudança de
  velocidade — o arquivo de saída tem o mesmo stream de vídeo do original;
- atrasa cada trecho até o instante indicado e mistura as faixas;
- completa o resto com silêncio e corta no último quadro, então **a duração
  continua a da gravação**;
- avisa no fim a duração final e as dimensões, para conferência.

Testado com os dez trechos: o primeiro entra em 0:02 e o silêncio entre eles é
exatamente o que a lista manda.

### Conferência final (30 s)

1. Toque o resultado inteiro uma vez.
2. A narração cai no momento certo? Nenhum trecho em cima do outro?
3. A duração final é a mesma da gravação? (`ffprobe` mostra.)
4. O vídeo continua sem cortes do começo ao fim?

---

## 5. Planos B (o que costuma dar errado)

| Sintoma | Causa | O que fazer |
| --- | --- | --- |
| O navegador abre e **não** mostra a tela de consentimento | a conta já autorizou o app antes | revogue em `myaccount.google.com/permissions`, remova a conta no app e grave de novo — ou use **outra** conta reserva |
| A conta aparece conectada sozinha, sem passar pelo navegador | token antigo | idem acima; o consentimento só aparece em autorização nova |
| Erro **`invalid_scope`** | `drive` não está em *Acesso a dados* | console → **Acesso a dados** → adicionar `https://www.googleapis.com/auth/drive` → Salvar |
| Pasta criada mas nada sincroniza | primeira execução do bisync | clique em **Sincronizar agora** (setas em círculo) na linha da pasta e espere na tela |
| Badge **"precisa ressincronizar"** | base de comparação ausente | clique no badge (aceita o estado atual das duas pastas) e mostre o resultado |
| Badge vermelho **"a pasta na nuvem está vazia"** | trava de segurança | confira se os três arquivos estão no `Nuvem-demo` do Drive; se estiverem, clique no badge para ressincronizar |
| Áudio do sistema não entrou no vídeo | gravação sem áudio do sistema | regrave; ou grave mudo e case os MP3 numa segunda faixa (o vídeo continua sem cortes) |

---

## 6. Checklist final

- [ ] Tela de consentimento **apareceu** e o nome `Nuvem Sync` está legível
- [ ] O escopo do Drive aparece **visível** na tela de consentimento
- [ ] Arquivo **subiu** (visto na Atividade **e** no Drive web)
- [ ] Arquivo **desceu** (alteração no Drive web vista na pasta local)
- [ ] Ficou claro que o app só mexe na pasta adicionada
- [ ] Revogação mostrada
- [ ] Nenhum token, senha, dado pessoal ou aba pessoal apareceu
- [ ] Take único, sem edição, com áudio
- [ ] Vídeo **não listado** no YouTube, link copiado
