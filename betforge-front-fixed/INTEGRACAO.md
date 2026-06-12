# BetForge Frontend — Integração com Mercado Pago

## O que foi migrado (Pagar.me → Mercado Pago)

### Variável de ambiente
```
# Antes:
VITE_PAGARME_PUBLIC_KEY=pk_test_...

# Agora:
VITE_MP_PUBLIC_KEY=TEST-...
```

### Tokenização de cartão
O formulário de cartão usa o **MercadoPago.js v2** (CardForm). O SDK é carregado
dinamicamente via `<script>` a partir de `https://sdk.mercadopago.com/js/v2`.

Não é necessário instalar nenhum pacote npm — o SDK é injetado em runtime pelo componente
`CardForm` dentro de `Depositpage.tsx`.

### Campos da resposta PIX
| Campo (antes — Pagar.me) | Campo (agora — Mercado Pago) |
|--------------------------|------------------------------|
| `chargeId`               | `paymentId`                  |
| `qrCode`                 | `qrCode` (igual)             |
| `qrCodeUrl` (link)       | `qrCodeBase64` (PNG base64)  |
| —                        | `ticketUrl` (link fallback)  |
| `expiresAt`              | `expiresAt` (igual)          |

### Campos da resposta Boleto
| Campo (antes)  | Campo (agora)  |
|----------------|----------------|
| `chargeId`     | `paymentId`    |
| `boletoLine`   | `boletoLine`   |
| `boletoPdf`    | `boletoPdf`    |
| `dueAt`        | `dueAt`        |

### Campos da resposta Cartão
| Campo (antes)  | Campo (agora)        |
|----------------|----------------------|
| `chargeId`     | `paymentId`          |
| `brand`        | `paymentMethodId`    |
| `lastFour`     | `lastFour`           |
| `installments` | `installments`       |
| `approved`     | `approved`           |
| —              | `statusDetail`       |

## Arquivos alterados

| Arquivo                      | O que mudou                                         |
|------------------------------|-----------------------------------------------------|
| `src/types/api.ts`           | Interfaces `PixPaymentData`, `BoletoPaymentData`, `CreditCardPaymentData` atualizadas |
| `src/pages/Depositpage.tsx`  | CardForm migrado para MercadoPago.js v2; exibe QR como base64 |
| `.env.local`                 | `VITE_PAGARME_PUBLIC_KEY` → `VITE_MP_PUBLIC_KEY`   |
| `INTEGRACAO.md`              | Este arquivo                                        |

## Setup

```bash
npm install
# Edite .env.local e coloque sua chave pública do Mercado Pago
npm run dev
```

O backend precisa estar rodando em `http://localhost:3333`.

## Obtendo a chave pública

1. Acesse https://www.mercadopago.com.br/developers/panel/app
2. Crie ou selecione um aplicativo
3. Em **Credenciais** → copie a **Chave pública** de teste (`TEST-...`)
4. Cole em `VITE_MP_PUBLIC_KEY` no `.env.local`
