# Roteiro de teste no Windows

O `.exe` nunca foi executado em Windows de verdade: tudo que está abaixo roda só
no CI (compilação e empacotamento). Este roteiro fecha essa lacuna — cerca de 20
minutos, sem precisar instalar nada além do pacote.

Anote o resultado de cada linha (`OK` / `FALHOU` / `NÃO TESTADO`) e, em caso de
falha, tire um print e salve o relatório de diagnóstico (passo 7).

## Antes de começar

| Item | Como conferir |
| --- | --- |
| Versão do Windows | `winver` (anote; 10 22H2 e 11 24H2 são os alvos) |
| WebView2 instalado | Configurações → Aplicativos → "Microsoft Edge WebView2 Runtime". **Se não estiver, é bom sinal**: o instalador deve baixá-lo sozinho |
| Nenhuma versão anterior do Nuvem | Configurações → Aplicativos; se houver, desinstale antes |
| Pacote | `Nuvem_1.1.0_x64-setup.exe` (23 MB) ou o zip portátil |

## 1. Instalação (NSIS)

1. Duplo clique no `Nuvem_1.1.0_x64-setup.exe`.
2. O SmartScreen aparece → **Mais informações** → **Executar assim mesmo**.
   *(Esperado: o `.exe` não é assinado. Se o Windows bloquear sem oferecer a
   opção, é falha.)*
3. Siga o assistente até o fim. **Falha** se: erro de download do WebView2, erro
   de permissão, ou o assistente travar.
4. Confira: atalho no Menu Iniciar, item "Nuvem" em Configurações → Aplicativos,
   e a pasta `%LOCALAPPDATA%\Nuvem` (ou `Programs\Nuvem`) com `Nuvem.exe` e
   `resources\rclone.exe`.

## 2. Primeira abertura

1. Abra pelo Menu Iniciar. *(Esperado: janela em ~1 s, tema seguindo o Windows.)*
2. Confira a barra lateral: **"rclone conectado v1.75.2"**.
   **Falha** se disser "Motor indisponível" — significa que o `rclone.exe`
   embutido não foi encontrado.
3. Abra **Ajustes** e confira "Nuvem 1.1.0" no cartão Sobre.

## 3. Bandeja do sistema

1. O ícone da nuvem aparece na área de notificação (pode estar no "^").
2. Passe o mouse: o tooltip mostra o estado ("Tudo em dia", "Sincronizando…").
3. Clique com o botão direito: menu com **Abrir** e **Sair**.
4. Troque o tema do Windows (claro ↔ escuro) com o app aberto: o ícone da bandeja
   deve trocar de cor (traço escuro no claro, branco no escuro).
   **Falha** se continuar com a cor errada ou virar quadrado branco.

## 4. Fechar e reabrir

1. Feche a janela pelo **X**. *(Esperado: some a janela, o app continua na
   bandeja — os ícones "Nuvem" e "rclone" seguem no Gerenciador de Tarefas.)*
2. Abra de novo pelo Menu Iniciar: a janela volta, **sem** um segundo processo
   `Nuvem.exe` no Gerenciador de Tarefas (instância única).
   **Falha** se aparecerem dois processos ou a janela não voltar.

## 5. Iniciar com o sistema

1. Ajustes → **Abrir com o sistema** → ligar.
2. `Win+R` → `regedit` → `HKEY_CURRENT_USER\Software\Microsoft\Windows\CurrentVersion\Run`
   → deve existir um valor apontando para `Nuvem.exe`.
3. Faça **logoff e login** (não basta fechar o app). *(Esperado: o app sobe
   minimizado na bandeja.)*
4. Volte em Ajustes e desligue a opção → o valor deve sumir do registro.

## 6. Contas e sincronização

1. **Conectar conta** → Google Drive → o navegador abre para autorizar.
   *(Esperado: nenhuma janela preta de console aparecendo — o daemon roda com
   `CREATE_NO_WINDOW`.)*
2. Autorize; volte ao app: a conta aparece como *conectada*.
3. Repita com **OneDrive** (o app escolhe o drive sozinho; se aparecer
   "unable to get drive_id and drive_type", é falha).
4. **Adicionar pasta** → escolha a conta, navegue nas pastas da nuvem, escolha a
   pasta local → **Sincronizar agora**.
   *(Esperado: progresso com velocidade, e o arquivo aparecendo no Drive/OneDrive
   web.)*
5. Crie um arquivo na pasta local **pelo Explorer** e espere: ele deve subir
   sozinho (reação a mudanças locais).

## 7. Conflito e diagnóstico

1. Edite o **mesmo** arquivo dos dois lados (local e na nuvem web) e sincronize.
   *(Esperado: a aba **Conflitos** mostra as duas versões com data e tamanho.)*
2. Resolva com **Manter a minha**; confira o resultado na pasta local e na nuvem.
3. Ajustes → Sobre → **Salvar** (Relatório de diagnóstico).
   *(Esperado: abre o Explorer com `diagnostico-AAAA-MM-DD-HHMMSS.txt`.)*
4. Abra o `.txt` e confirme que **não** há `client_secret`, `GOCSPX-` nem token;
   deve ter versão, Windows, rclone, contas, pastas e últimos erros.

## 8. Ajustes específicos do Windows

1. Ajustes → **Configuração → Abrir**: deve abrir o Explorer na pasta de estado
   (`%APPDATA%\app.nuvem.Nuvem`).
2. Em **Pastas**, o ícone de pasta de uma linha: abre o Explorer na pasta local.
3. Ajustes → Sobre → **Verificar** (atualização).
   *(Esperado: "Você está na versão mais nova" ou "A versão X está disponível"
   com botão **Baixar** que abre a página da release no navegador. Como o
   repositório está privado hoje, "mais nova" é a resposta esperada.)*

## 9. Desinstalação

1. Configurações → Aplicativos → Nuvem → **Desinstalar**.
2. Confira: pasta de instalação removida, atalhos removidos, item fora da lista.
3. Confirme que **os dados ficam**: `%APPDATA%\app.nuvem.Nuvem` (perfis,
   atividade, ajustes) e `%APPDATA%\rclone\rclone.conf` (tokens).
   *(É o comportamento desejado; reinstalar deve trazer contas e pastas de volta.)*
4. Se ligou o início automático, confira se o valor em `Run` sumiu; se não sumiu,
   é falha (anote).

## Como reportar

Para cada `FALHOU`, mande: número do passo, o que esperava, o que aconteceu, um
print da janela e o `diagnostico-*.txt` do passo 7. Sem isso o problema não é
reproduzível — os logs do CI não cobrem comportamento em tempo de execução no
Windows.
