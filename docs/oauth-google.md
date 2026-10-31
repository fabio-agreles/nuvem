# Projeto OAuth do Google (para distribuir o Nuvem)

O Google cobra a cota de **requisições por minuto** no *projeto OAuth* usado na
autorização, não na conta. O projeto que o rclone compartilha entre todos os
usuários dele vive estourado — é o que faz a sincronização do Google Drive
arrastar mesmo com banda sobrando (medido: 3 arquivos pequenos levando 22 s com
12 eventos `Rate limited` no log).

A saída é o Nuvem ter o **seu próprio** projeto. O código já suporta três
origens, nesta ordem de precedência:

| Origem | Quem usa | Como entra |
| --- | --- | --- |
| **Suas credenciais** | quem colou o par em Ajustes → Avançado | `settings.json` |
| **Projeto do Nuvem** | o build publicado | variável de ambiente na compilação |
| **Projeto do rclone** | fallback | nada configurado |

Ajustes → Avançado mostra qual está em vigor ("seu projeto", "projeto do
Nuvem", "projeto do rclone") e o `client_id` em uso. O segredo nunca sai do
binário nem vai para o relatório de diagnóstico.

## 1. Criar o projeto (só você pode fazer)

Passo a passo guiado, com as URLs:

```bash
cd app && scripts/oauth-google.sh
```

Resumo: criar projeto → ativar **Drive API** → tela de consentimento (público
**Externo**) → escopo `.../auth/drive` → criar cliente **App para computador** →
**Publicar app** (Audience → Publish). Leva ~10 minutos.

Detalhes que importam:

- **Não precisa de URI de redirecionamento.** Aplicativo instalado usa o laço
  local `http://127.0.0.1:53682/`, que o rclone abre sozinho durante a
  autorização.
- **Publicar é obrigatório.** Em *Testing*, a autorização e o refresh token
  expiram em **7 dias** — a sincronização pararia toda semana. Em produção não
  expira; em troca, aparece a tela "O Google não verificou este aplicativo"
  até a verificação terminar, e o projeto tem um **teto de 100 usuários novos na
  vida** (não dá para zerar).
- **Escopo `drive` (restrito), não `drive.file`.** `drive.file` só enxerga
  arquivos criados pelo próprio app; não sincroniza uma pasta que já existe. O
  custo é que `drive` é escopo restrito e passa por revisão do Google.
- A tela de consentimento exige **URL de página inicial**, **URL de política de
  privacidade** e **domínio autorizado**. O site do projeto está no GitHub Pages
  (pasta `docs/`, publicada em 31/10/2026):
  - página inicial: <https://fabio-agreles.github.io/nuvem/>
  - política de privacidade: <https://fabio-agreles.github.io/nuvem/privacidade.html>
  - domínio autorizado: `fabio-agreles.github.io` — o Google exige verificar a
    propriedade do domínio no [Search Console](https://search.google.com/search-console)
    (propriedade do tipo *prefixo de URL*, com o arquivo HTML que o Google fornece
    colocado em `docs/`, ao lado do `index.html`). `github.io` está na lista de
    sufixos públicos, então o que se verifica é o subdomínio, não `github.io`.

## 2. Embutir no build

```bash
cd app
export NUVEM_GOOGLE_CLIENT_ID='000000000000-xxxxxxxx.apps.googleusercontent.com'
export NUVEM_GOOGLE_CLIENT_SECRET='GOCSPX-...'
scripts/oauth-google.sh --salvar    # grava .env.oauth (0600, fora do git)
scripts/oauth-google.sh --build     # valida e roda `tauri build`
```

No CI, o par vai por **segredos do repositório** (`NUVEM_GOOGLE_CLIENT_ID` e
`NUVEM_GOOGLE_CLIENT_SECRET`, em Settings → Secrets and variables → Actions):
o workflow `Pacotes` já os injeta no ambiente dos builds de Linux e Windows, e o
`option_env!` do Rust os embute no binário. Sem os segredos o build continua
funcionando, apenas no projeto do rclone.

Sem recompilar (útil para testar, e para o Flatpak):

```bash
NUVEM_GOOGLE_CLIENT_ID=... NUVEM_GOOGLE_CLIENT_SECRET=... ./nuvem
flatpak override --user --env=NUVEM_GOOGLE_CLIENT_ID=... \
                       --env=NUVEM_GOOGLE_CLIENT_SECRET=... app.nuvem.Nuvem
```

O `client_secret` de aplicativo instalado **não é segredo de verdade** (o
próprio rclone publica o dele no código). Mesmo assim ele entra pelo ambiente,
não pelo repositório: o binário carrega o par, o git não.

## 3. Verificar o app no Google (para o público em geral)

Ordem real do processo:

1. **Marca (brand verification)** — 2 a 3 dias úteis. Nome, logotipo, e-mails de
   suporte, domínio da política de privacidade.
2. **Verificação de escopo restrito** — semanas. Enviar em
   [Google Auth Platform → Verificação](https://console.cloud.google.com/auth/verification):
   justificativa de cada escopo, por que `drive.file` não serve, vídeo
   demonstrando o fluxo completo (conectar → escolher pasta → sincronizar →
   desconectar) e a política de privacidade pública.
3. **Avaliação de segurança (CASA)** — **não se aplica ao Nuvem** enquanto ele
   não tiver servidor: o Google exige a avaliação anual de apps que acessam
   dados restritos "a partir de ou através de um servidor de terceiros". Os
   tokens e o conteúdo ficam na máquina do usuário; não existe backend do Nuvem.
   Se algum dia houver um serviço intermediário, a avaliação passa a valer
   (custa de milhares de dólares por ano).
4. **Re-verificação anual** — o Google cobra a cada 12 meses.

Enquanto isso não termina, o caminho honesto é o que o app já faz: distribuir
com o projeto do Nuvem, avisar na documentação que a tela de app não verificado
aparece, e usar o override de Ajustes para quem preferir o próprio projeto (o
teto de 100 usuários é do projeto do app, mas cada usuário com projeto próprio
sai dessa conta).

## 4. O que já está pronto no código

- `src-tauri/src/oauth.rs` — resolve a origem (usuário > Nuvem > rclone),
  valida o formato do `client_id`, nunca expõe o segredo. 6 testes.
- `parametros_do_provedor` — manda o par efetivo no `config/create` do rclone na
  hora de conectar a conta Google.
- `oauth_info` — comando para a interface (origem + `client_id` em uso).
- Relatório de diagnóstico — diz a origem e o `client_id` (público), nunca o
  segredo.
- Selo por conta — "credenciais próprias" só quando a conta foi autorizada com o
  projeto do usuário, não com o do Nuvem.

## 5. Situação (30/10)

- [x] Projeto criado no Google Cloud (cliente "App para computador"), par salvo
      em `app/.env.oauth` (`0600`, fora do git) e app de release compilado com o
      par embutido — Ajustes → Avançado mostra **"projeto do Nuvem"** e o
      `client_id` `875036643376-…` em uso (conferido na tela, em X virtual).
      Prova automática: teste `ambiente_com_o_par_do_projeto_vira_fonte_nuvem`,
      que só roda quando as variáveis estão no ambiente.
- [x] Conta de teste autorizada contra o projeto novo (consentimento mostrando
      "Nuvem", sem `redirect_uri_mismatch`) e **medida**: 3 arquivos de 200 KiB
      subindo em 4,4 / 4,4 / 4,6 s com **zero** `Rate limited` e zero 403 —
      contra 22 s e 12 eventos `Rate limited` no projeto compartilhado. O remoto
      de teste e as pastas criadas no Drive foram removidos depois.

## 6. Pendências

- [x] Gravar o par nos segredos do repositório (feito em 31/10; a 1.2.1 saiu com
      o par embutido no `.deb`, no AppImage, no `.exe` e no Flatpak — conferido
      com `strings` em cada binário).
- [x] Tornar o repositório público (31/10/2026) e publicar o site com a política
      de privacidade: <https://fabio-agreles.github.io/nuvem/privacidade.html>.
- [x] Apontar o app instalado (Flatpak) para o projeto: o build já embute o par e
      a conta Google foi reconectada nele (`rclone config update`), sem perder
      pastas.
- [ ] Verificar em que estado está o *Público* do projeto (**Teste** x **Em
      produção**) em <https://console.cloud.google.com/auth/audience> e clicar
      **Publicar app** se ainda estiver em teste — em *Teste* o refresh token
      expira em 7 dias.
- [x] Propriedade de `fabio-agreles.github.io` verificada no Search Console
      (31/10/2026, via `docs/googlee37fbd119c4e6022.html`). Falta preencher a
      marca: página inicial, política de privacidade, domínio autorizado, logo
      120×120 e e-mail de suporte.
- [ ] Enviar a verificação do escopo restrito em
      <https://console.cloud.google.com/auth/verification>: justificativa do
      `drive`, motivo de `drive.file` não servir, vídeo do fluxo completo e
      política de privacidade pública.
- [ ] Enviar para verificação quando o app estiver estável para distribuição.
