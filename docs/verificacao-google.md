# Verificação do projeto OAuth no Google — o que enviar

Só o dono do projeto consegue preencher isto (login no console). Este arquivo
guarda os textos e o roteiro do vídeo para não ter de reescrever na hora.

## 0. Situação medida em 31/10/2026

Capturado em **`console.cloud.google.com/auth/audience`**:

| Item | Valor |
| --- | --- |
| Status de publicação | **Em produção** (não está em teste — o refresh token não expira em 7 dias) |
| Tipo de usuário | Externo |
| Limite de usuários do OAuth | **3 de 100** usados (o limite é vitalício e não pode ser zerado) |
| Aviso no topo | "Seu aplicativo precisa ser verificado" → botão **Acessar o Centro de verificação** |

Consequência prática: faltam **97 autorizações novas** até a verificação passar.
Cada conta que autoriza o app consome uma vaga para sempre; depois de aprovado,
o limite deixa de ser aplicado. Não queime vagas com contas descartáveis.

## 1. Estado do público (30 segundos)

<https://console.cloud.google.com/auth/audience> → seção **Público**:

- **Teste** → clique **Publicar app**. Em *Teste* só contas cadastradas como
  testadoras autorizam e o refresh token expira em **7 dias**.
- **Em produção** → nada a fazer aqui; a tela "O Google não verificou este
  aplicativo" permanece até a verificação terminar, e o projeto tem teto de
  **100 usuários novos na vida** (não zera).

### Histórico de tentativas

**Tentativa 1 — 31/10/2026, reprovada.** Mensagem no console:

> O site do URL da sua página inicial "https://fabio-agreles.github.io/nuvem/"
> não está registrado para você. Verify ownership of your home page, then wait
> 24 hours before retrying to allow our systems to update.

O site responde corretamente (`/nuvem/` 200, `/nuvem` 301 → `/nuvem/`, arquivo de
verificação 200). Em 31/10 às 20:36 o Search Console confirmou
**"Você é um proprietário verificado"**, método *Arquivo HTML*, na propriedade
`https://fabio-agreles.github.io/nuvem/` — ou seja, do lado do site e do Search
Console está tudo certo. Em 31/10 às 20:43 o IAM do projeto "Nuvem Sync" confirmou
`fabioagreles@gmail.com` como **Owner** — a mesma conta do Search Console. As
duas hipóteses de vínculo estão descartadas; resta a sincronização das 24 h
(verificar às ~19h de 01/11 e reenviar). Verificar, nesta ordem: (a) a conta logada no Search Console é a
mesma *owner/editor* do projeto no Cloud (`fabioagreles@gmail.com`); (b) existe a
propriedade de **prefixo de URL** `https://fabio-agreles.github.io/nuvem/` como
verificada; (c) esperar 24 h para os sistemas de marca sincronizarem. Depois,
**Corrigi os problemas → Pedir nova verificação** (não usar "os problemas estão
incorretos", que apenas repete a análise).

### Tentativa 2 — 02/11/2026: mesmo erro depois de 46 h

Repetiu "O site do URL da sua página inicial ... não está registrado para você",
o que descarta a hipótese de sincronização. Interpretação mais provável: o Google
quer o **site do domínio** verificado, não só o prefixo da pasta. Preparado em
02/11:

- repositório `fabio-agreles.github.io` (site de raiz) publicado em
  <https://fabio-agreles.github.io/> — antes a raiz do domínio respondia 404, o
  que pode ser justamente o "site" que o Google procura;
- falta verificar no Search Console a propriedade de **prefixo de URL**
  `https://fabio-agreles.github.io/` (arquivo HTML novo, na raiz desse
  repositório).

**Resolvido em 02/11 às 18:58**: a propriedade de prefixo
`https://fabio-agreles.github.io/` passou a constar como verificada no Search
Console (mesmo arquivo de token, agora na raiz do domínio). Falta reenviar a
marca.

**Tentativa 3 — 02/11 às 18:59, reprovada na hora.** Reenvio imediato após
verificar a propriedade raiz: mesmo erro, como esperado (o validador ainda não
viu a propriedade nova). Plano: reenviar em 03/11 depois das 19h; se falhar outra
vez, contestar com "Acredito que os problemas encontrados estão incorretos".

Se depois disso o erro persistir, os caminhos são: contestar com
"Acredito que os problemas encontrados estão incorretos" (há prova nos dois
painéis do Google) ou registrar um domínio próprio e verificar por DNS TXT, que
é a única forma de ter uma propriedade de **domínio** de verdade.

### 04/11/2026 — causa encontrada: `github.io` não é aceito

Status em 04/11 às 13:43: exatamente a mesma tela ("Sua marca não está
aparecendo para os usuários"), sem mudança. **Não é mais questão de espera nem
de Search Console.** A regra está escrita na própria documentação do Google
([App Homepage](https://support.google.com/cloud/answer/13807376)):

> your app homepage must … be **hosted on a verified domain you own**
>
> Your homepage and privacy policy **should not be hosted on a third-party
> platform where you can't verify that you own your subdomain**. For example:
> Google Sites, Facebook, Instagram, Twitter.

`fabio-agreles.github.io` é justamente isso: um subdomínio de um sufixo público
(`github.io` está na Public Suffix List) dentro de uma plataforma de terceiros.
O Search Console aceita verificar esse prefixo por arquivo HTML — e foi o que
fizemos nas duas propriedades —, mas o validador de marca **não** trata isso como
"domínio registrado em seu nome". Todos os relatos com o mesmo texto são de
hospedagem gratuita (`vercel.app`, `github.io`, `pages.dev`), e a resposta
recorrente é a mesma: domínio próprio, verificado por **DNS**.

Consequência: **não reenviar mais com a URL `github.io`.** Cada reenvio repete a
mesma análise e gasta tempo. Ou se troca o domínio, ou se convive com o aviso.

#### Caminho A — domínio próprio (destrava marca + escopo restrito)

> **Escolhido em 04/11/2026: `nuvem-sync.app.br`** (R$ 40/ano no Registro.br,
> livre na conferência). O passo a passo completo, na ordem certa e com os
> registros DNS, está em [`dominio-proprio.md`](dominio-proprio.md).

Custo/tempo: ~R$ 40/ano (`.com.br` no Registro.br) ou ~US$ 12/ano (`.app`,
`.dev`, `.com`); 20 minutos de configuração, mais as 24 h de propagação e a
análise do Google.

Disponibilidade conferida por DNS em 04/11 (NXDOMAIN = livre):

| Livre | Já registrado |
| --- | --- |
| `getnuvem.app`, `nuvemsync.com`, `nuvem-sync.com`, `nuvembisync.com`, `nuvembisync.com.br` | `nuvem.app`, `getnuvem.com`, `nuvem.io`, `nuvemapp.com.br`, `nuvemsync.com.br` |

Depois de registrar (exemplo `getnuvem.app`):

1. **GitHub Pages com domínio próprio.** No repositório `nuvem`:
   *Settings → Pages → Custom domain* = `nuvem.getnuvem.app` (ou o apex
   `getnuvem.app`). O GitHub cria um arquivo `CNAME` em `docs/` — ele precisa ir
   para o git. Ligue **Enforce HTTPS** (o GitHub emite o certificado; `.app` e
   `.dev` só funcionam em HTTPS, então isso não é opcional).
2. **DNS no registrador.** Para subdomínio: `CNAME nuvem → fabio-agreles.github.io`.
   Para apex: quatro `A` para `185.199.108.153`, `185.199.109.153`,
   `185.199.110.153`, `185.199.111.153` (+ `AAAA` equivalente, opcional).
3. **Search Console — propriedade de DOMÍNIO.** *Adicionar propriedade → Domínio*
   = `getnuvem.app`, método **DNS TXT**: crie o registro `TXT` que o Google
   mostrar (`google-site-verification=…`) no registrador e clique em Verificar.
   É a verificação que o validador de marca reconhece.
4. **Atualizar a marca** em <https://console.cloud.google.com/auth/branding>:
   página inicial `https://nuvem.getnuvem.app/`, política de privacidade
   `https://nuvem.getnuvem.app/privacidade.html`, termos
   `https://nuvem.getnuvem.app/termos.html`, e o **domínio autorizado** trocado
   para `getnuvem.app` (o `github.io` pode sair).
5. **Esperar 24 h** e reenviar. Só então vale pedir a verificação do escopo
   `drive` com o vídeo.

Pendências do lado do código quando isso acontecer: o site fala em
`fabio-agreles.github.io/nuvem` em `docs/index.html`, `README.md`, no metainfo do
Flatpak, em `docs/oauth-google.md` e nas capturas — tudo isso passa a apontar
para o domínio novo, e o `docs/.nojekyll` + `CNAME` convivem sem problema.

#### Caminho B — ficar como está (custo zero)

O app **funciona** hoje assim: o projeto está "Em produção", com o par OAuth do
Nuvem Sync embutido, cota própria e sem expiração de 7 dias. O que se perde:

- a tela de consentimento mostra o aviso **"O Google não verificou este
  aplicativo"** e um link "avançado" para continuar — atrito real para quem não
  é técnico;
- o teto de **100 usuários na vida** (3 usados) continua valendo;
- o nome/logo do Nuvem Sync não aparecem como marca verificada.

Para uma ferramenta de código aberto com poucos usuários, é defensável. Para
publicar de verdade, o Caminho A é o único que passa.

#### O que não fazer

- Não reenviar a marca com `fabio-agreles.github.io` (reprovou 4 vezes).
- Não usar "Acredito que os problemas encontrados estão incorretos": com a
  documentação dizendo "domínio que você possui", a contestação não tem base.
- Não trocar o escopo `drive` por `drive.file` só para escapar da verificação: o
  `drive.file` só vê arquivos criados pelo próprio app, e o Nuvem Sync existe para
  sincronizar pastas que **já existem**.

### Passo a passo do Search Console (o que destrava a marca)

O erro "não está registrado para você" só desaparece quando a conta que abre o
console do Google Cloud é a **mesma** que verificou o site no Search Console.

1. **Conta certa.** Abra <https://search.google.com/search-console> e confira o
   avatar no canto superior direito: precisa ser `fabioagreles@gmail.com`. Para
   trocar de conta sem sair de tudo:
   <https://accounts.google.com/AccountChooser?continue=https://search.google.com/search-console>
2. **Lista de propriedades.** Você deve ver
   `https://fabio-agreles.github.io/nuvem/` com o selo de verificada. Se não
   existir, em **Adicionar propriedade** escolha **Prefixo do URL** e cole
   exatamente (com a barra no fim):
   `https://fabio-agreles.github.io/nuvem/`
3. **Método de verificação.** Escolha **Arquivo HTML**. O arquivo já está
   publicado (`docs/googlee37fbd119c4e6022.html`), então basta clicar em
   **Verificar**. Se a tela mostrar um nome de arquivo **diferente** desse,
   baixe-o, coloque em `docs/` e avise — sem o arquivo na raiz do site a
   verificação não passa.
4. **Confirme a permissão na propriedade.** Na propriedade, em
   *Configurações → Usuários e permissões*, a conta precisa estar como
   **Proprietário**.
5. **Confirme o dono do projeto no Cloud.** Em
   <https://console.cloud.google.com/iam-admin/iam>, a mesma conta precisa ter o
   papel **Proprietário** (Owner).
6. **Espere 24 h.** Mensagem do próprio Google: os sistemas de marca levam até um
   dia para registrar a verificação.
7. **Peça nova verificação.** Passadas as 24 h, em
   <https://console.cloud.google.com/auth/branding> abra **Status da verificação
   → Ver problemas**, marque **Corrigi os problemas** e clique **Continuar**.
   Não use "Acredito que os problemas encontrados estão incorretos": isso repete
   a análise com o mesmo estado e só gasta tempo de revisor.

## 2. Marca (Branding)

<https://console.cloud.google.com/auth/branding>

| Campo | Valor |
| --- | --- |
| Nome do app | `Nuvem Sync` (o nome no Cloud também: renomeie o **nome de exibição** do projeto; o *project id* não muda) |
| E-mail de suporte | o e-mail do mantenedor |
| Página inicial | `https://nuvem-sync.app.br/` |
| Política de privacidade | `https://nuvem-sync.app.br/privacidade.html` |
| Termos de serviço | (opcional; licença MIT em `LICENSE`) |
| Domínio autorizado | `nuvem-sync.app.br` |
| Logo | 120×120 — `app/src-tauri/icons/128x128@2x.png` reduzido |
| Tipo de app | Público / Externo |
| Categoria | "Utilitário" ou "Produtividade" |

**Domínio autorizado exige verificação de propriedade.** Com domínio próprio a
verificação é a propriedade de **Domínio** no
[Search Console](https://search.google.com/search-console), por registro **TXT**
(`google-site-verification=…`) na zona DNS — é a única que o validador de marca
reconhece. A tabela acima já reflete o domínio `nuvem-sync.app.br`; o histórico
das tentativas com `github.io` está na §04/11 e o passo a passo em
[`dominio-proprio.md`](dominio-proprio.md).

### Estado

- [x] Propriedade `https://fabio-agreles.github.io/nuvem/` verificada no Search
      Console (31/10/2026) pelo arquivo `docs/googlee37fbd119c4e6022.html`.
      **Esse arquivo não pode ser apagado**: o Search Console revalida de tempos
      em tempos e, sem ele, a verificação do domínio cai.
- [ ] Propriedade de **Domínio** `nuvem-sync.app.br` (TXT) — domínio em registro
      em 04/11/2026; é o que substitui a verificação acima para efeito de marca.

## 3. Acesso a dados (Data Access)

<https://console.cloud.google.com/auth/scopes> → escopo já adicionado:

```
https://www.googleapis.com/auth/drive
```

## 4. Verificação de escopo restrito

<https://console.cloud.google.com/auth/verification>

### Justificativa (em inglês, como o formulário pede)

> Nuvem Sync is an open-source desktop application (MIT) that keeps a folder on the
> user's computer in **two-way sync** with a folder of their own Google Drive,
> using the local `rclone bisync` engine. There is no server component: the OAuth
> token and the file contents stay on the user's machine.
>
> We request `https://www.googleapis.com/auth/drive` because the core feature is
> syncing folders that **already exist** in the user's Drive. The narrower
> `drive.file` scope only grants access to files created by the application
> itself, so it cannot list, download or update files the user created with the
> Drive web UI or other tools — it would make the app's main feature impossible.
>
> Data received from the Drive API is used exclusively to transfer files between
> the user's Drive and the folder they selected in the app. It is not stored on
> any server we operate (we operate none), not shared, and not used for
> advertising. Users can revoke access at any time from
> `myaccount.google.com/permissions` or by disconnecting the account in the app.
>
> The app requests a single scope, and the permission is explained in the
> interface before the browser opens.

### Roteiro do vídeo (2–3 min, sem cortes)

1. Abrir o Nuvem Sync (mostrar o nome e a tela inicial).
2. Adicionar conta → escolher **Google Drive** → o navegador abre a tela de
   consentimento com o nome **Nuvem Sync** e o escopo do Drive visível.
3. Aceitar. Voltar ao app: a conta aparece com nome, e-mail e cota.
4. Adicionar uma pasta: escolher uma pasta existente do Drive (mostrar a lista).
5. Criar um arquivo na pasta local → ele sobe (mostrar a linha de atividade).
6. Alterar o mesmo arquivo no Drive pela web → ele desce para a pasta local.
7. Mostrar que o app só mexe nas pastas adicionadas.
8. Desconectar a conta (ou `myaccount.google.com/permissions`) mostrando a
   revogação.

Formato: link público (YouTube não listado ou Google Drive com link). Fale em
voz alta o que está fazendo, em inglês ou português — o revisor precisa entender
o fluxo.

### Pasta de demonstração (para não gravar seus arquivos pessoais)

Criada em 31/10/2026:

- local: `~/Downloads/nuvem-demo` (`nota.txt`, `planilha-demo.csv`, `exemplo.md`)
- nuvem: `Nuvem-demo/` na conta Google, com os mesmos três arquivos

### Como a tela de consentimento aparece no vídeo

Ela só é exibida para uma autorização **nova**. Com a conta já autorizada, o
rclone reconecta sem mostrar nada. Duas saídas:

1. **Conta reserva (recomendado)**: conectar uma segunda conta Google que ainda
   não autorizou o app — custa 1 das 97 vagas, mas não mexe na configuração real.
2. **Revogar e reconectar a conta principal**: remover o acesso em
   <https://myaccount.google.com/permissions> e, no app, remover a conta e
   conectar de novo. Depois é preciso **adicionar a pasta outra vez** (o app
   apaga as credenciais e o estado do bisync ao desconectar) e ressincronizar.

## 5. Depois de enviar

- Acompanhe em *Verificação* → o status muda para "Em análise".
- A verificação de marca costuma levar **2–3 dias úteis**; a de escopo restrito,
  **semanas**.
- Re-verificação é anual. A avaliação de segurança (CASA) **não se aplica**
  enquanto não houver servidor.
- Se a verificação for negada, o motivo costuma ser: política de privacidade
  inacessível, domínio não verificado, vídeo que não mostra o consentimento ou
  justificativa genérica — nada disso depende de código.
