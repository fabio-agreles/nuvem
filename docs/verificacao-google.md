# Verificação do projeto OAuth no Google — o que enviar

Só o dono do projeto consegue preencher isto (login no console). Este arquivo
guarda os textos e o roteiro do vídeo para não ter de reescrever na hora.

## 1. Estado do público (30 segundos)

<https://console.cloud.google.com/auth/audience> → seção **Público**:

- **Teste** → clique **Publicar app**. Em *Teste* só contas cadastradas como
  testadoras autorizam e o refresh token expira em **7 dias**.
- **Em produção** → nada a fazer aqui; a tela "O Google não verificou este
  aplicativo" permanece até a verificação terminar, e o projeto tem teto de
  **100 usuários novos na vida** (não zera).

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

## 5. Depois de enviar

- Acompanhe em *Verificação* → o status muda para "Em análise".
- A verificação de marca costuma levar **2–3 dias úteis**; a de escopo restrito,
  **semanas**.
- Re-verificação é anual. A avaliação de segurança (CASA) **não se aplica**
  enquanto não houver servidor.
- Se a verificação for negada, o motivo costuma ser: política de privacidade
  inacessível, domínio não verificado, vídeo que não mostra o consentimento ou
  justificativa genérica — nada disso depende de código.
