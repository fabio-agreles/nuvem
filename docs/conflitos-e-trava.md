# Conflitos lado a lado e trava de segurança — como funcionam e como testar

Duas promessas do site, explicadas pelo que o código faz de verdade e com
roteiro de teste que pode ser repetido em qualquer máquina.

Tudo abaixo foi conferido contra o **rclone 1.75.2** (a versão que o app usa),
chamando `sync/bisync` pela API RC — o mesmo caminho que o app percorre.

---

## 1. Conflitos lado a lado

### O que acontece quando o mesmo arquivo muda dos dois lados

O bisync compara cada lado com a lista da rodada anterior. Quando um arquivo
mudou **dos dois lados** desde a última sincronização, ele não escolhe sozinho:
guarda as duas cópias com um sufixo e copia cada uma para o outro lado, para
que a decisão seja possível em qualquer uma das máquinas.

Ordinal fixo: **path1 é a nuvem, path2 é este computador** (é assim que o app
monta a chamada, `path1: <conta>:<pasta>`, `path2: <pasta local>`).

| Arquivo que aparece na pasta | De onde veio |
|---|---|
| `nota.txt..path1` | a versão que estava **na nuvem** |
| `nota.txt..path2` | a versão que estava **neste computador** |

O nome `..path1`/`..path2` não é sorte do rclone: o app pede exatamente isso
(`conflictLoser: "pathname"` + `conflictSuffix: ".path1,.path2"` em
`start_sync`). Sem esses dois campos, o padrão do rclone é
`--conflict-loser num`, que gera `nota.txt.conflict1` e `nota.txt.conflict2`
— e foi o que aconteceu até a 1.6.1: os arquivos ficavam na pasta e a aba
**Conflitos** mostrava "Nenhum conflito", porque o detector só conhecia
`..path1`/`..path2`. Desde a correção o detector entende os dois formatos,
então uma pasta que já tem `.conflict1`/`.conflict2` de antes também aparece
na aba.

Depois da rodada, o arquivo original (`nota.txt`) não existe mais: só as duas
cópias, iguais nos dois lados. É o que deixa o nome livre para a versão
escolhida voltar a ele.

### A aba Conflitos

`Ctrl+5` (ou **Conflitos** na barra lateral) varre as pastas sincronizadas —
até 6 níveis, ignorando `.git` e `node_modules` — e mostra um cartão por
arquivo, com as duas versões lado a lado: tamanho, quando mudou e o caminho
completo. Três botões:

| Botão | O que faz | Onde fica a versão que perdeu |
|---|---|---|
| **Manter da nuvem** | `nota.txt..path1` volta a se chamar `nota.txt` | a local vai para `conflitos-resolvidos/<carimbo>/` |
| **Manter a minha** | `nota.txt..path2` volta a se chamar `nota.txt` | a da nuvem vai para a mesma pasta |
| **Manter as duas** | viram `nota.txt (nuvem).txt` e `nota.txt (local).txt` | ninguém perde nada; a próxima rodada sobe as duas |

Nada é apagado em nenhum dos três casos: a versão descartada é **movida** para
`~/.config/app.nuvem.Nuvem/conflitos-resolvidos/<milissegundos>/`, que é a
"lixeira do Nuvem Sync". Se já existir um `nota.txt` na pasta, a resolução é
recusada com um aviso para renomear ou mover antes — o app nunca sobrescreve.

Cada resolução vira uma linha na aba **Atividade**: "Conflito resolvido ·
nota.txt · mantida a versão local".

### Como testar (roteiro A)

Pré-requisito: a pasta precisa de **pelo menos dois arquivos**. Com um arquivo
só, o rclone aborta antes, com "all files were changed on Both Paths" — ele
desconfia de listagem incompleta quando 100% dos arquivos mudaram.

1. Numa pasta sincronizada com dois ou três arquivos, feche o Nuvem Sync
   (para as duas edições não competirem com uma rodada automática).
2. Edite **o mesmo arquivo nos dois lados** com conteúdos diferentes. Na
   nuvem, espere o Drive registrar a alteração (alguns segundos).
3. Abra o app e sincronize. O esperado: `nota.txt..path1` e `nota.txt..path2`
   na pasta local e também na nuvem, e as duas cópias no cartão da aba
   **Conflitos**.
4. Toque em **Manter a minha**: o arquivo volta ao nome original com o
   conteúdo local, a versão da nuvem aparece em `conflitos-resolvidos/`, e o
   cartão some da lista.
5. Repita o passo 2 e teste **Manter as duas**: devem sobrar
   `nota.txt (nuvem).txt` e `nota.txt (local).txt`, sem conflito pendente.

Se a aba mostrar "Nenhum conflito" com `.conflict1`/`.conflict2` na pasta, a
versão instalada é a 1.6.1 (anterior à correção): é o sintoma descrito acima.

---

## 2. Trava de segurança

### Como a decisão é tomada

Antes de chamar o bisync, `start_sync` pergunta duas coisas:

- **a pasta na nuvem está vazia?** `operations/list` na raiz da pasta remota,
  com 30 s de prazo. Se a chamada falhar (sem rede, conta caída), a resposta é
  "não sei" e a trava **não opina** — o rclone segue o caminho normal;
- **a pasta local está vazia?** uma única leitura de diretório
  (`read_dir().next()`), que responde na hora mesmo com 100 mil arquivos.

Com as duas respostas, a tabela é:

| Nuvem | Local | Resultado |
|---|---|---|
| vazia | vazia | **passa** — pasta nova, nada a perder |
| vazia | com arquivos | **barra**: `LadoVazio::Nuvem` |
| com arquivos | vazia | **barra**: `LadoVazio::Local` |
| com arquivos | com arquivos | passa |
| — | — | **Ressincronizar** pedido pelo usuário ou já pendente: passa sempre |

Barrado, nada chega a ser executado: o app devolve o erro na própria pasta, e
a mensagem diz o que aconteceu, que nada foi apagado e o que fazer — conferir a
lixeira do Drive, ou clicar no erro e escolher **Ressincronizar** se o vazio
foi intencional.

### Por que a trava existe, se o rclone também reclama

O rclone tem uma rede parecida: com um dos lados vazio ele aborta com
`Empty current Path1 listing. Cannot sync to an empty directory` (conferido
nos dois sentidos). A diferença é o que fica depois:

- o rclone aborta **no meio da rodada**, com erro crítico, e a pasta passa a
  exigir `--resync` para voltar a funcionar — o app marca
  `resync_needed` e a próxima rodada vira ressincronização;
- a trava do app decide **antes de começar**, em linguagem simples, e deixa a
  pasta exatamente como estava.

E **Ressincronizar é seguro**: conferido com um lado vazio e o outro cheio, nos
dois sentidos, o resync **enche o lado vazio** (sobe o que está só no
computador, baixa o que está só na nuvem). Não é um "apaga o outro lado".

### Redes menores, na mesma direção

- `maxDelete: 50` — numa rodada normal, mais de 50 exclusões abortam com
  "too many deletes"; a mensagem pede uma nova tentativa, que confirma;
- travas `*.lck` de uma execução interrompida são removidas sozinhas quando o
  app abre e nada está rodando (só as com mais de 60 s, por precaução), com
  registro em Atividade.

### Como testar (roteiro B — nuvem esvaziada)

É o caso real que originou a trava: a pasta no Drive foi para a lixeira e a
cópia local estava intacta.

1. Crie uma pasta de teste no Drive (`teste-trava`) com dois arquivos e
   sincronize com uma pasta local vazia. A primeira sincronização é uma
   ressincronização, então os arquivos descem para o computador.
2. **Apague os dois arquivos na nuvem** (eles vão para a lixeira do Drive) e
   deixe a pasta local como está.
3. Toque em sincronizar. O esperado: erro na pasta — "a pasta na nuvem está
   vazia e a local tem arquivos: sincronizar agora apagaria tudo o que está no
   computador. Nada foi apagado…".
4. Confira a pasta local: os dois arquivos continuam lá, com o conteúdo
   original. Confira a lixeira do Drive: os dois estão recuperáveis.
5. Para destravar: restaure os arquivos da lixeira e sincronize (volta ao
   normal). Se o vazio fosse intencional, clique no erro → **Ressincronizar**.

### Como testar (roteiro C — pasta local esvaziada)

1. Mesma pasta de teste, tudo em dia.
2. Renomeie a pasta local (`Documentos` → `Documentos-velho`) ou apague tudo
   dentro dela.
3. Sincronize. O esperado: "a pasta local está vazia e a na nuvem tem
   arquivos: sincronizar agora apagaria tudo o que está na nuvem…".
4. Devolva a pasta ao nome antigo (ou restaure o conteúdo) e sincronize.

Observação: a trava olha só o **primeiro nível** da pasta remota. Se sobrar um
arquivo solto na raiz da pasta da nuvem e o resto tiver sido apagado, ela não
barra — quem segura nesse caso é o `maxDelete` do rclone.

### Limpeza depois dos testes

```bash
# versões descartadas nas resoluções de conflito
rm -rf ~/.config/app.nuvem.Nuvem/conflitos-resolvidos

# travas e listas do bisync (o app recria na próxima rodada; a próxima
# sincronização dessas pastas vira ressincronização)
rm -rf ~/.cache/rclone/bisync
```

Depois disso, apague o perfil de teste no app (Pastas → remover) e a pasta de
teste no Drive.

---

## 3. O que mudou no código (ainda não publicado)

`start_sync` passou a mandar `conflictLoser: "pathname"` e
`conflictSuffix: ".path1,.path2"`, e o detector passou a aceitar também os
sufixos antigos `.conflict1`/`.conflict2`. Dois testes novos cobrem os dois
formatos e um arquivo comum com nome parecido (`relatorio..path1.bak`) não
virar conflito. `cargo test --lib`: 69 testes. `cargo clippy --all-targets -D
warnings`: limpo.
