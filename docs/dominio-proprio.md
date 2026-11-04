# Domínio próprio `nuvem-sync.app.br` — o que fazer, na ordem

O motivo está em [`verificacao-google.md`](verificacao-google.md) §04/11: a marca
do Google só é aprovada com um **domínio que você possui**, verificado por **DNS
TXT**. `fabio-agreles.github.io` é subdomínio de plataforma de terceiros e
reprovou 4 vezes.

Domínio escolhido: **`nuvem-sync.app.br`** — livre em 04/11/2026 (NXDOMAIN).
`.app.br` é extensão do Registro.br (`app.br` está na Public Suffix List, então
`nuvem-sync.app.br` é um domínio registrável de verdade, que é o que o Search
Console quer na propriedade de *Domínio*).

**Sem servidor.** O site continua sendo o `docs/` deste repositório, servido pelo
GitHub Pages. O domínio só aponta o DNS para o GitHub; o certificado TLS é emitido
pelo próprio GitHub (Let's Encrypt).

---

## Ordem importa

Se o `CNAME` entrar no repositório antes do DNS existir, o GitHub Pages passa a
redirecionar `fabio-agreles.github.io/nuvem/` para um domínio que não resolve — e
o site sai do ar, incluindo a política de privacidade que o Google está avaliando.
Por isso a branch `dominio-proprio` (com `docs/CNAME` e as URLs novas) só é
mesclada no passo 5.

| # | Passo | Quem | Tempo |
| --- | --- | --- | --- |
| 1 | Registrar o domínio | você | 5 min |
| 2 | Verificar o domínio no GitHub (anti-takeover) | você | 2 min |
| 3 | Apontar o DNS para o GitHub Pages | você | 10 min |
| 4 | Search Console: propriedade de domínio (TXT) | você | 5 min + propagação |
| 5 | Mesclar a branch `dominio-proprio` | eu | 1 min |
| 6 | GitHub Pages: custom domain + Enforce HTTPS | você | 5 min + certificado |
| 7 | Atualizar a marca no Google e reenviar | você | 5 min + 24 h |

---

## 1. Registrar (Registro.br)

1. <https://registro.br> → **Registrar domínio** → digite `nuvem-sync.app.br`.
2. **R$ 40,00/ano**, pago no cartão/Pix; pessoa física com CPF regular basta.
3. O Registro.br já vem com **DNS próprio gratuito** — não precisa contratar
   hospedagem nem mudar nameservers.

Alternativas livres que também servem: `nuvemsync.com`, `nuvem-sync.com`,
`nuvembisync.com`, `nuvembisync.com.br`. (`nuvem.app.br`, `nuvemsync.com.br` e
`nuvem.app` estão ocupados.)

## 2. Verificar o domínio no GitHub (antes do DNS)

Evita que outra pessoa aponte um subdomínio seu para o GitHub. Em
**Settings da sua conta** (não do repositório) → **Pages** → **Add a domain** →
`nuvem-sync.app.br` → **Add domain**. O GitHub mostra um TXT:

| Tipo | Nome | Valor |
| --- | --- | --- |
| TXT | `_github-pages-challenge-fabio-agreles` | `github-pages-challenge-…` (copie o valor exibido) |

Crie esse registro no Registro.br e volte ao GitHub → **Verify**. Guarde o valor:
ele vai junto com os outros do passo 3.

## 3. DNS no Registro.br

Painel: **Meus domínios → nuvem-sync.app.br → DNS → Editar zona → Nova entrada**.
Nome vazio (ou `@`) = o próprio domínio. CNAME no apex **não** é permitido — por
isso o apex usa `A`/`AAAA`.

| Tipo | Nome | Dados |
| --- | --- | --- |
| A | `@` | `185.199.108.153` |
| A | `@` | `185.199.109.153` |
| A | `@` | `185.199.110.153` |
| A | `@` | `185.199.111.153` |
| AAAA | `@` | `2606:50c0:8000::153` |
| AAAA | `@` | `2606:50c0:8001::153` |
| AAAA | `@` | `2606:50c0:8002::153` |
| AAAA | `@` | `2606:50c0:8003::153` |
| CNAME | `www` | `fabio-agreles.github.io` |
| TXT | `_github-pages-challenge-fabio-agreles` | *valor do passo 2* |
| TXT | `@` | *valor do passo 4* |

O `AAAA` é opcional (só acelera onde há IPv6), mas o `A` é obrigatório. Remova
qualquer registro `A`/`CNAME` padrão que o painel tenha criado (página
"estacionada") — se ficar, o domínio responde no lugar do GitHub.

Conferir a propagação (deve responder os 4 IPs `185.199.10x.153`):

```bash
dig +short A nuvem-sync.app.br
```

## 4. Search Console: propriedade de **domínio**

Esta é a verificação que o validador de marca reconhece — não é a de *prefixo do
URL*, e não é o arquivo HTML.

1. <https://search.google.com/search-console> com a conta **`fabioagreles@gmail.com`**
   (a mesma que é Owner do projeto no Cloud).
2. **Adicionar propriedade → Domínio** → `nuvem-sync.app.br` (sem `https://`).
3. O Google mostra um TXT `google-site-verification=…`. Crie-o no Registro.br com
   nome `@` (passo 3, última linha).
4. **Verificar** (costuma passar em minutos; pode levar horas).

## 5. Mesclar a branch

A branch `dominio-proprio` já tem `docs/CNAME`, os `<link rel="canonical">` e as
URLs da documentação apontando para o domínio novo. Mesclar só depois de o
`dig` do passo 3 responder os IPs do GitHub:

```bash
git checkout main && git merge --no-ff dominio-proprio && git push origin main
```

Na mesma leva, o repositório `fabio-agreles.github.io` (site da raiz do domínio)
passa a redirecionar para o endereço novo em vez de `/nuvem/` — são duas linhas
no `index.html` dele.

## 6. GitHub Pages

No repositório `nuvem`: **Settings → Pages → Custom domain** =
`nuvem-sync.app.br` → **Save** (o `docs/CNAME` já existe, então ele apenas
confirma). Espere o aviso *DNS check successful* e o certificado (minutos, às
vezes horas) e ligue **Enforce HTTPS**.

Conferir:

```bash
curl -sI https://nuvem-sync.app.br/ | head -3
curl -s -o /dev/null -w "%{http_code}\n" https://nuvem-sync.app.br/privacidade.html
```

A partir daí `https://fabio-agreles.github.io/nuvem/` passa a **301** para o
domínio novo (comportamento normal do GitHub Pages).

## 7. Marca no Google

<https://console.cloud.google.com/auth/branding> — trocar **hoje**, porque a URL
antiga agora redireciona para outro domínio e isso vira uma reprovação própria
("a página inicial redireciona para um domínio diferente do listado"):

| Campo | Valor |
| --- | --- |
| Nome do app | `Nuvem Sync` (ajustado no passo 1.5 de `verificacao-google.md`) |
| Página inicial | `https://nuvem-sync.app.br/` |
| Política de privacidade | `https://nuvem-sync.app.br/privacidade.html` |
| Termos de serviço | `https://nuvem-sync.app.br/termos.html` |
| Domínio autorizado | `nuvem-sync.app.br` |
| Logo | 120×120 (já publicado em `docs/nuvem.png`) |

Depois de 24 h: **Status da verificação → Ver problemas → Corrigi os problemas →
Continuar**. Se passar, seguir para a verificação do escopo `drive` com o vídeo
(roteiro em [`verificacao-google.md`](verificacao-google.md) §3).

## Se algo der errado (volta atrás em 2 minutos)

- **Pages → Custom domain** → apague o domínio → o site volta para
  `fabio-agreles.github.io/nuvem/` (o `docs/CNAME` também precisa sair do repo,
  senão ele reaparece).
- E, no console do Google, devolver a página inicial e a política para as URLs
  `github.io`.

O DNS pode ficar apontando para o GitHub sem problema: sem `custom domain`
configurado, o Pages simplesmente não responde por ele.
