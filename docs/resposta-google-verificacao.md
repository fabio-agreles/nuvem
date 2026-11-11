# Resposta ao e-mail "[Action Needed] Your Google APIs Verification Request"

Recebido em **10/11/2026 20:13** (`api-oauth-dev-verification@google.com`), lido em
11/11. **Não é aprovação nem reprovação**: é o checklist padrão que todo pedido de
escopo sensível/restrito recebe, e o pedido só anda depois de uma resposta.

- Responder **para o endereço de resposta do e-mail**:
  `api-oauth-dev-verification-reply+3tfdcoalswzdj1d@google.com`
- Manter o assunto: `[Action Needed] Your Google APIs Verification Request`
- Projeto: **Nuvem Sync** — project id `nuvem-513223`, project number
  `875036643376`.

## Estado do vídeo (conferido quadro a quadro em 11/11)

Baixei o vídeo (`https://youtu.be/eaBMDHnTEf4`, 3 min 41 s, não listado) e
conferi o conteúdo nas marcações:

| Momento | O que aparece | Item do checklist |
| --- | --- | --- |
| 0:22–0:40 | consentimento com o nome **Nuvem Sync**, a conta `fabioagrelespessoal@gmail.com` e o escopo legível: "See, edit, create, and delete all of your Google Drive files" | ✅ Consent Screen Visibility |
| 0:42 | página do app "Nuvem Sync · Account connected" | ✅ fluxo completo |
| 1:50–2:00 | atividade "Sync finished — 1 sent", pasta `Nuvem-demo` | ✅ Scope Functionality |
| 2:20 | o mesmo documento (`teste1`) editado no **Drive web** | ✅ Source Account Impact (escrita) |
| 2:40 | o arquivo editado aberto **localmente** (`teste1.docx` no LibreOffice) | ✅ sentido nuvem → computador |
| 3:06 | `myaccount.google.com` listando o **Nuvem Sync** com "Delete all connections" | ✅ revogação |

**Lacuna única:** não há nenhuma **exclusão** demonstrada. O item *Source Account
Impact* só exige a prova quando o app demonstra apagar, e o vídeo não demonstra —
mas o resumo do escopo na tela de consentimento diz "delete", então é o tipo de
coisa que um revisor pede depois, e cada ida e volta custa semanas. Um
**suplemento de 40 segundos** resolve e não invalida o vídeo principal:

1. na pasta local, apague `demonstracao.txt` → atividade mostra a remoção →
   recarregue o Drive web e mostre que o arquivo sumiu;
2. no Drive web, apague `planilha-demo.csv` → atividade mostra a remoção →
   mostre a pasta local sem ele;
3. feche com "Access revoked / listed in the Google Account page" já coberto pelo
   vídeo principal.

Narração (inglês, take único, sem edição):

> "Deletion propagates the same way. I just deleted this file on my computer —
> here it is in the app's activity log, and here it is gone from my Google Drive
> in the browser. Now the other direction: I delete this file in the Drive web
> interface, and the app removes it from my local folder. Nothing else in my
> Drive is touched — only the folders I added to the app."

Título do suplemento: `Nuvem Sync — delete propagation (verification supplement)`,
visibilidade **não listado**, e o link entra na resposta como *supplementary clip*.

---

## Texto da resposta (copiar e colar)

Subject: `[Action Needed] Your Google APIs Verification Request`

> Hello Third Party Data Safety Team,
>
> Thank you for the checklist. We audited Nuvem Sync (project **nuvem-513223**,
> project number **875036643376**) against every item and are replying with our
> confirmation and with the updates we made.
>
> **What the app is.** Nuvem Sync is an open-source (MIT) desktop application for
> Linux and Windows that keeps a folder on the user's computer in two-way sync
> with a folder of their own Google Drive, using the local `rclone bisync` engine
> bundled inside the package. There is **no server component**: the OAuth token
> and the file contents stay on the user's machine. The client is an installed-app
> (native) OAuth client, so the `client_id` is public by design and no
> `client_secret` is shipped.
>
> Homepage: https://nuvem-sync.app.br/
> Privacy policy: https://nuvem-sync.app.br/privacidade.html
> Terms: https://nuvem-sync.app.br/termos.html
> Source code: https://github.com/fabio-agreles/nuvem
> Downloads: https://github.com/fabio-agreles/nuvem/releases/latest
> Demo video: https://youtu.be/eaBMDHnTEf4
> Supplementary clip on deletion: https://youtu.be/gkH5EeXWsj4
>
> **Scope configuration & justification**
>
> - *Least privilege:* the app requests exactly **one** scope,
>   `https://www.googleapis.com/auth/drive`, and nothing else — no e-mail, no
>   profile, no Gmail, no Contacts, no Photos, no Cloud Storage. The console
>   configuration and the app request match exactly.
> - *Why the narrower scope is not viable:* the core feature is syncing folders
>   that **already exist** in the user's Drive, including files created in the
>   Drive web UI or by other tools. `drive.file` only grants access to files the
>   application itself created, so it cannot list, download or update existing
>   folders — the main feature would be impossible. `drive.metadata.readonly` or
>   any read-only variant cannot sync either, because two-way sync must write and
>   delete to propagate the user's own changes.
> - *Production-ready:* the single scope backs one production feature (two-way
>   folder sync), fully implemented and shipped; it is not used for any
>   experimental or unreleased capability.
>
> **Demo video**
>
> - *Accessible hosting:* unlisted YouTube link above (works without sign-in).
> - *Consent screen visibility:* the video shows the OAuth consent screen with the
>   app name **Nuvem Sync** and the single Drive permission displayed in full
>   ("See, edit, create, and delete all of your Google Drive files"), before
>   clicking Allow.
> - *Scope matching:* the demo shows exactly the scope configured in the console;
>   the app requests no other scope at any point.
> - *Scope functionality:* the video demonstrates the full cycle — an existing
>   Drive folder listed and selected inside the app, the first two-way sync, a file
>   changed on the computer appearing in the user's Drive in the browser (activity
>   log: "Sync finished — 1 sent"), a change made in the Drive web UI coming back
>   down to the computer (the same document opened locally), and access revocation
>   on the Google Account page. The supplementary clip shows deletion propagating
>   in both directions.
> - *Source account impact:* the write shown in the app is shown reflected in the
>   same Google account's Drive in the browser, and the change made in the browser
>   is shown reflected on the computer. Deletion — made on the computer and made in
>   the Drive web UI — is shown reflected on the other side in the supplementary
>   clip, with the app's activity log visible next to it.
> - *Live apps:* the publishing status remains **In Production** and the scope set
>   is unchanged — we added no new scopes while verification is pending. Because
>   this is a desktop app that users install themselves, there is no production
>   traffic we can route to a staging environment; the demo was recorded with a
>   dedicated spare Google account and a dedicated demo folder
>   (`Nuvem-demo`), not with other users' data. The project is at 3 of its 100
>   lifetime authorizations.
>
> **App access & testing environment**
>
> No credentials are needed and nothing blocks the review: the app is free and
> open source, there is no sign-up, no phone verification, no credit card and no
> waitlist. A reviewer can test in about three minutes:
>
> 1. Download a package from the releases page and install it:
>    `Nuvem.Sync_1.6.3_amd64.deb` (`sudo apt install ./…`) or
>    `Nuvem.Sync_1.6.3_amd64.AppImage` (`chmod +x` and run) for Linux, or
>    `Nuvem.Sync_1.6.3_x64-setup.exe` for Windows 10/11 (the SmartScreen warning
>    is expected — the executable is not code-signed; "More info" → "Run anyway").
> 2. Open **Nuvem Sync**. The interface is bilingual: **Settings → System →
>    Language → English** switches it to English immediately.
> 3. **Overview → Accounts → Connect account → Google Drive.** The default browser
>    opens the consent screen with the app name and the Drive scope; click Allow.
>    The browser ends on the app's own page ("Nuvem Sync · Account connected").
> 4. Back in the app the account card shows the account name, e-mail and Drive
>    quota.
> 5. **Folders → Add folder**, browse the Drive inside the app and pick any
>    existing folder (this step is the reason `drive` is required), then
>    **Sync now**.
> 6. Create or edit a file in the local folder and watch it appear in Drive; edit
>    the same file in the Drive web UI and watch it come back; delete a file on
>    either side and watch it disappear on the other.
> 7. **Settings → About → Diagnostics** (optional) shows what the app recorded
>    locally; nothing is sent to us.
>
> If you would prefer a dedicated Google account for testing, tell us and we will
> create one and reply with the credentials.
>
> **Privacy policy disclosures** (all at
> https://nuvem-sync.app.br/privacidade.html, updated 11 November 2026)
>
> - *Data access:* files and folders the user explicitly adds to the app; account
>   name, e-mail and storage quota. Nothing else is requested or read.
> - *Data use:* only to transfer the files of the selected folders between Drive
>   and the local folder, and to show the account name, e-mail and quota.
> - *Data transfer:* nothing is shared with third parties. There is no server of
>   ours; data is never sold or handed to data brokers, advertisers or any other
>   party.
> - *Data protection:* tokens are stored only on the user's machine
>   (`rclone.conf`, `0600`); all traffic to Google uses HTTPS with certificate
>   validation; there is no server-side database that could leak; the source is
>   open for inspection.
> - *Retention and deletion:* nothing is retained on our side. The token stays
>   until the user disconnects the account in the app; settings and history stay
>   until uninstall; synced files remain in the user's Drive and local folder.
>   Users can also revoke access at myaccount.google.com/permissions at any time.
>
> **Data handling: Limited Use restrictions**
>
> The policy now carries the affirmative statement: "Nuvem Sync's use and transfer
> to any other app of information received from Google APIs will adhere to the
> Google API Services User Data Policy, including the Limited Use requirements."
> Google user data is not used for advertising, is not sold or transferred to
> third parties, and is not used for any purpose other than providing the sync
> feature described above.
>
> **AI/ML model training restrictions**
>
> The application contains no AI or ML functionality. Google user data is not used
> to develop, improve or train any AI/ML model, and is not transferred to
> third-party AI/ML services. No AI/ML compliance statement is hosted because
> there is no AI/ML use to declare.
>
> **Prohibited use cases**
>
> Nuvem Sync is not a CDN, does not send e-mail of any kind, does not reward
> interactions and does not provide a data-portability service. It only mirrors
> folders the user selected between their own computer and their own Drive.
>
> **Data Portability APIs**
>
> Not applicable — the app does not use any Data Portability API.
>
> **Cloud Application Security Assessment (CASA)**
>
> The app requests a Restricted scope (`auth/drive`) but has **no server**: the
> token and the file contents are never stored on, or transmitted to, any
> infrastructure we operate, and no Google user data leaves the user's device
> except to the user's own Drive. We understand this fits the exemption for apps
> that do not store or transmit Restricted Scope data to a server. If your team
> determines that a CASA assessment is required nonetheless, please confirm and we
> will engage an authorized assessor.
>
> Please let us know if any item above needs more detail, a different format or an
> additional demo. We are happy to record a new video covering any specific flow
> your reviewers want to see.
>
> Best regards,
> Fabio Agreles
> Maintainer, Nuvem Sync
> https://github.com/fabio-agreles/nuvem

---

## O que mudou no projeto por causa deste e-mail

Feito em 11/11 no site (no ar em https://nuvem-sync.app.br/privacidade.html):

1. **Três seções novas** que o checklist pede nominalmente: "Como os dados são
   usados" (*Data Use*), "Com quem os dados são compartilhados" (*Data Transfer*)
   e "Como os dados são protegidos" (*Data Protection*).
2. **Retenção explícita**: "Como apagar seus dados" virou "Por quanto tempo os
   dados ficam e como apagá-los", com o parágrafo de retenção.
3. **Bloco de Uso Limitado** com a frase afirmativa que o Google pede, palavra por
   palavra, e a declaração de que não há uso de IA/ML.
4. O resumo em inglês ganhou as mesmas cinco seções (é a parte que o revisor lê).

## O que NÃO fazer

- Não reenviar a verificação pelo console antes de responder o e-mail; o pedido do
  e-mail é a resposta.
- Não mexer no status de publicação (Em produção), no tipo de usuário (Externo),
  no nome/logo, nos escopos nem no domínio durante a análise.
- Não trocar `drive` por `drive.file` para "simplificar": derruba a função
  principal e não é o que o checklist pede.
