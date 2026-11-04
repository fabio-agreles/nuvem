# Doações via Pix

O Nuvem Sync é gratuito e de código aberto. Quem quiser ajudar a manter o
projeto encontra um cartão em **Ajustes → Ajude a manter o projeto**, antes de
"Sobre", com um QR code do Pix e o botão **Copiar código Pix**.

A contribuição é **voluntária** e não muda nada no app: nenhuma tela, cota ou
recurso fica atrás de pagamento, e não existe cobrança, assinatura nem coleta de
dados de quem doa.

## Como funciona por dentro

O Pix não aceita um QR qualquer: o código precisa ser um **BR Code** (padrão
EMV do Banco Central), com os campos na ordem certa e um CRC16 no fim. Por isso
o projeto não guarda um PNG "solto" do QR — ele é **gerado** a partir da chave:

| Arquivo | O que é |
| --- | --- |
| `app/scripts/gerar-pix.sh` | monta o BR Code, desenha o QR e escreve os dois arquivos abaixo |
| `app/src/assets/pix-qr.svg` | o QR (fundo branco, 2 módulos de silêncio) usado no diálogo |
| `app/src/lib/pix.ts` | `CHAVE_PIX` e `PIX_COPIA_E_COLA` — gerado, não editar à mão |
| `app/src/lib/doacoes.ts` | título e parágrafos do texto (este é escrito à mão) |
| `app/src/components/Doacoes.tsx` | cartão em Ajustes + diálogo com o QR |

Como o QR e o texto copiado saem do **mesmo payload**, quem aponta a câmera e
quem usa "Pix copia e cola" cai na mesma chave — não existe a chance de o QR de
um lado apontar para uma chave e o botão copiar outra.

## Trocar a chave (ou o recebedor)

1. Edite as três variáveis no topo de `app/scripts/gerar-pix.sh`:
   ```bash
   CHAVE="e4bf0532-8016-42bf-bf2a-fd81326b6621"  # chave aleatória do projeto
   RECEBEDOR="Fábio Agreles Bezerra"            # até 25 caracteres
   CIDADE="SAO PAULO"                           # até 15 caracteres
   ```
   Ou passe por fora, sem editar o arquivo:
   ```bash
   PIX_CHAVE=... PIX_RECEBEDOR=... PIX_CIDADE=... bash app/scripts/gerar-pix.sh
   ```
2. Rode o script (precisa do `qrencode`: `sudo apt install qrencode`):
   ```bash
   cd app && bash scripts/gerar-pix.sh
   ```
3. Confira o QR de verdade, com o celular ou com o `zbarimg`:
   ```bash
   zbarimg --quiet --raw src/assets/pix-qr.svg
   ```
   A saída tem de ser **exatamente** o `PIX_COPIA_E_COLA` de `src/lib/pix.ts`.
4. `npx tsc --noEmit && npx vite build` e pronto.

O nome e a cidade não são decorativos: o app do banco mostra os dois na hora de
confirmar a transferência. Sem eles o BR Code é recusado.

## Limites (de propósito)

- **Sem valor embutido.** O BR Code é estático (txid `***`), então quem doa
  digita o valor. Um QR com valor fixo exigiria gerar um código por doação e um
  servidor para conferir o pagamento — nada disso combina com um app que não
  fala com servidor próprio.
- **Sem confirmação de pagamento.** O app não sabe (e não pergunta) se a doação
  aconteceu: o comprovante fica no app do banco.
- **Nada de rede.** O QR é um arquivo local e o "copiar" usa a área de
  transferência do sistema; nenhuma requisição sai do app por causa da doação.
