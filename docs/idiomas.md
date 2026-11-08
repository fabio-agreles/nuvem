# Idiomas (português e inglês)

O app nasceu em português. Agora tem também **inglês**, e a troca é feita em
**Ajustes → Sistema → Idioma**, sem reiniciar o app.

O português continua sendo o padrão: quem já usa o app não vê nada mudar até
escolher outro idioma.

## Como funciona

Em vez de chaves tipo `settings.title`, o dicionário usa **o próprio texto em
português** como chave:

```ts
const EN: Record<string, string> = {
  "Visão geral": "Overview",
  "Sincronizando {n} tarefas": "Syncing {n} jobs",
};
```

Assim:

- **se faltar tradução, aparece o português** — nada quebra, nenhuma tela mostra
  chave feia;
- quem lê o código vê o texto que o usuário lê;
- texto novo em português só precisa de uma linha no dicionário para virar
  inglês.

A contrapartida: **mudar o texto em português exige atualizar a chave** no
dicionário, senão aquela linha volta a aparecer em português no modo inglês.

`{nome}` entre chaves é trocado em tempo de execução: `t("há {n} min", { n: 12 })`.

## Arquivos

| Arquivo | O que faz |
| --- | --- |
| `app/src/lib/i18n.ts` | dicionário PT→EN, `t()`, `useT()`, `useIdioma()`, `definirIdioma()`, `locale()` |
| `app/src/lib/format.ts` | números, datas e "há 5 min" seguem o idioma escolhido |
| `app/scripts/checar-i18n.mjs` | lista o que está no código e ainda não tem tradução |
| `app/src-tauri/src/models.rs` | campo `language` em `Settings` (padrão `"pt"`) |
| `app/src/views/Settings.tsx` | os dois botões de idioma, em Sistema |

## No código

```tsx
// dentro de componente: re-renderiza ao trocar de idioma
const t = useT();
<h2>{t("Contas")}</h2>
<p>{t("Sincronizando {n} tarefas", { n: 3 })}</p>
```

```ts
// fora de componente (lib/, mensagens montadas em callback)
import { t } from "./lib/i18n";
notify(t("Sincronização iniciada."), "ok");
```

Datas e números:

```ts
import { locale } from "./lib/i18n";
new Date(ts).toLocaleDateString(locale()); // pt-BR ou en-US
```

## Conferir o que falta traduzir

```bash
cd app
npm run i18n            # lista o que falta
npm run i18n -- --falhar  # sai 1 se faltar (bom para CI)
```

Saída esperada hoje: `✓ nenhum texto sem tradução`. A lista seguinte ("traduções
sem uso") é normal: são rótulos que aparecem por variável (`t(item.label)`) e as
mensagens que o backend envia por texto exato.

## Adicionar outro idioma

1. Em `i18n.ts`, acrescente o código em `Lang`, em `IDIOMAS` e em
   `idiomaDoDocumento()` / `locale()`.
2. Crie `const ES: Record<string, string> = { … }` e faça `traduzir()` escolher
   o dicionário pelo idioma.
3. Ajuste o campo `language` em `Settings` (Rust e TypeScript) — ele é texto, não
   um enum, justamente para não precisar mexer no banco de configuração.

## O lado do Rust: bandeja, notificações e atividade

Três coisas aparecem sem passar pela interface e por isso não podiam depender do
dicionário do frontend: o **menu da bandeja**, as **notificações do sistema** e o
**registro de atividade**. Elas são montadas em `src-tauri/src/idioma.rs`, que
guarda o idioma escolhido num `AtomicU8` e oferece o par português/inglês:

```rust
.push_activity(
    "sync",
    crate::idioma::texto("Sincronização concluída", "Sync finished"),
    &crate::idioma::escolhe(
        format!("{nome} está em dia · {tempo} s"),
        format!("{nome} is up to date · {tempo} s"),
    ),
    Some(&profile.id),
)
```

- Na abertura, o idioma vem do `settings.json` **antes** de `tray::init` montar o
  menu;
- ao trocar em Ajustes, `save_settings` chama `idioma::definir` e
  `tray::aplicar_idioma`, que monta o menu de novo com os rótulos traduzidos;
- entrar num idioma novo é acrescentar o par de textos nas chamadas de
  `texto()`/`escolhe()` — não existe tabela de chaves deste lado, porque são
  poucas frases e cada uma aparece junto do formato.

## O que ainda está em português

- **Erros do rclone**: as mensagens vêm da ferramenta (em inglês, aliás) e são
  mostradas como vieram — traduzir texto de terceiro seria pior que deixar claro
  que é uma mensagem técnica.
- **Modo demonstração** (navegador): dados fictícios, incluindo nomes de pasta.
- Um registro de atividade antigo continua no idioma em que foi escrito; só os
  novos seguem a troca (o histórico é um registro do que aconteceu, não um texto
  vivo).
