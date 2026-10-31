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
Console está tudo certo. Sobram duas hipóteses: (a) a conta logada no Search
Console não é a mesma *owner* do projeto no Cloud; (b) os sistemas de marca ainda
não sincronizaram (o Google pede 24 h). Verificar, nesta ordem: (a) a conta logada no Search Console é a
mesma *owner/editor* do projeto no Cloud (`fabioagreles@gmail.com`); (b) existe a
propriedade de **prefixo de URL** `https://fabio-agreles.github.io/nuvem/` como
verificada; (c) esperar 24 h para os sistemas de marca sincronizarem. Depois,
**Corrigi os problemas → Pedir nova verificação** (não usar "os problemas estão
incorretos", que apenas repete a análise).

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
| Nome do app | `Nuvem` |
| E-mail de suporte | o e-mail do mantenedor |
| Página inicial | `https://fabio-agreles.github.io/nuvem/` |
| Política de privacidade | `https://fabio-agreles.github.io/nuvem/privacidade.html` |
| Termos de serviço | (opcional; licença MIT em `LICENSE`) |
| Domínio autorizado | `fabio-agreles.github.io` |
| Logo | 120×120 — `app/src-tauri/icons/128x128@2x.png` reduzido |
| Tipo de app | Público / Externo |
| Categoria | "Utilitário" ou "Produtividade" |

**Domínio autorizado exige verificação de propriedade.** No
[Search Console](https://search.google.com/search-console), crie uma propriedade
do tipo *Prefixo de URL* com `https://fabio-agreles.github.io/nuvem/`, escolha
verificação por **arquivo HTML** e coloque o arquivo baixado em `docs/` (ele é
publicado junto com o site em alguns minutos). `github.io` é sufixo público, por
isso se verifica o subdomínio `fabio-agreles.github.io`, não `github.io`.

### Estado (31/10/2026)

- [x] Propriedade `https://fabio-agreles.github.io/nuvem/` verificada no Search
      Console pelo arquivo `docs/googlee37fbd119c4e6022.html` (publicado em
      <https://fabio-agreles.github.io/nuvem/googlee37fbd119c4e6022.html>).
      **Esse arquivo não pode ser apagado**: o Search Console revalida de tempos
      em tempos e, sem ele, a verificação do domínio cai.

## 3. Acesso a dados (Data Access)

<https://console.cloud.google.com/auth/scopes> → escopo já adicionado:

```
https://www.googleapis.com/auth/drive
```

## 4. Verificação de escopo restrito

<https://console.cloud.google.com/auth/verification>

### Justificativa (em inglês, como o formulário pede)

> Nuvem is an open-source desktop application (MIT) that keeps a folder on the
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

1. Abrir o Nuvem (mostrar o nome e a tela inicial).
2. Adicionar conta → escolher **Google Drive** → o navegador abre a tela de
   consentimento com o nome **Nuvem** e o escopo do Drive visível.
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
