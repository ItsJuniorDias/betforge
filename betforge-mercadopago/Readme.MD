# BetForge API

Backend de uma plataforma de apostas esportivas com integração ao **Mercado Pago** para pagamentos e saques.

## Stack

- **Node.js** + **TypeScript** + **Express**
- **PostgreSQL** (banco de dados)
- **Redis** (cache e rate limit)
- **Knex** (query builder / migrations)
- **Mercado Pago** (pagamentos)

## Pré-requisitos

- Node.js 18+
- Docker e Docker Compose

## Instalação

```bash
# Clone e instale as dependências
npm install

# Copie o arquivo de variáveis de ambiente
cp .env.example .env
```

Edite o `.env` e preencha as variáveis obrigatórias (veja a seção abaixo).

## Variáveis de Ambiente

| Variável                                          | Descrição                                                      |
| ------------------------------------------------- | -------------------------------------------------------------- |
| `DB_HOST / DB_PORT / DB_USER / DB_PASS / DB_NAME` | Conexão com o PostgreSQL                                       |
| `REDIS_HOST / REDIS_PORT`                         | Conexão com o Redis                                            |
| `JWT_SECRET`                                      | Segredo do token JWT (mínimo 32 chars)                         |
| `JWT_REFRESH_SECRET`                              | Segredo do refresh token                                       |
| `MP_ACCESS_TOKEN`                                 | Access token do Mercado Pago (`TEST-...` para sandbox)         |
| `MP_WEBHOOK_URL`                                  | URL pública para receber notificações do MP (ex: ngrok em dev) |
| `MP_WEBHOOK_SECRET`                               | Chave secreta para validar assinatura dos webhooks             |
| `ODDS_API_KEY`                                    | Chave da API de odds esportivas (opcional)                     |

O token do Mercado Pago está disponível em: https://www.mercadopago.com.br/developers/panel/app

## Rodando em desenvolvimento

**1. Suba os serviços (PostgreSQL + Redis):**

```bash
docker compose up -d
```

**2. Execute as migrations:**

```bash
npm run migrate
```

**3. (Opcional) Popule o banco com dados iniciais:**

```bash
npm run seed:all
```

**4. Inicie o servidor:**

```bash
npm run dev
```

A API estará disponível em `http://localhost:3333`.

## Scripts disponíveis

| Comando             | Descrição                                     |
| ------------------- | --------------------------------------------- |
| `npm run dev`       | Servidor em modo desenvolvimento (hot reload) |
| `npm run build`     | Compila TypeScript para `dist/`               |
| `npm start`         | Inicia a versão compilada                     |
| `npm run migrate`   | Executa as migrations                         |
| `npm run seed`      | Seed de dados iniciais                        |
| `npm run seed:odds` | Sincroniza odds da API externa                |
| `npm test`          | Executa os testes com Vitest                  |

## Webhooks do Mercado Pago

Em desenvolvimento, use o [ngrok](https://ngrok.com/) para expor a API localmente:

```bash
ngrok http 3333
```

Defina a URL gerada no `.env`:

```
MP_WEBHOOK_URL=https://seu-ngrok.ngrok.io/api/v1/webhooks/mercadopago
```

Configure também a chave secreta do webhook no painel do Mercado Pago em **Suas integrações > Webhooks**.
