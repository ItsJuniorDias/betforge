# BetForge API 🎯

Backend Node.js + TypeScript para a plataforma de apostas esportivas **BetForge**.

## Stack

| Camada        | Tecnologia                    |
|---------------|-------------------------------|
| Runtime       | Node.js 20+ com TypeScript    |
| Framework     | Express 4                     |
| Banco de dados| PostgreSQL 16 + Knex (query builder) |
| Cache / Auth  | Redis 7 (tokens JWT)          |
| Autenticação  | JWT (access + refresh tokens) |
| Validação     | Zod                           |
| Logs          | Winston + rotação diária      |
| Testes        | Vitest + Supertest            |
| Segurança     | Helmet, CORS, Rate Limiting   |

## Estrutura de pastas

```
src/
├── config/          # Env, banco de dados, Redis
├── controllers/     # Handlers HTTP (thin layer)
├── services/        # Regras de negócio
├── repositories/    # Acesso ao banco de dados
├── middlewares/     # Auth, validação, rate limit, erros
├── routes/          # Definição das rotas
├── validators/      # Schemas Zod
├── utils/           # Logger, erros, response helpers
├── types/           # Interfaces e tipos TypeScript
├── database/
│   ├── migrations/  # Schema do banco
│   └── seeds/       # Dados iniciais
├── app.ts           # Configuração do Express
└── server.ts        # Entry point
```

## Pré-requisitos

- Node.js 20+
- PostgreSQL 16+
- Redis 7+

## Setup rápido

### 1. Instalar dependências

```bash
npm install
```

### 2. Subir banco e Redis com Docker

```bash
docker-compose up -d postgres redis
```

### 3. Configurar variáveis de ambiente

```bash
cp .env.example .env
# Edite o .env com suas configurações
```

### 4. Rodar migrations e seed

```bash
npm run migrate
npm run seed
```

### 5. Iniciar em desenvolvimento

```bash
npm run dev
```

A API estará disponível em: `http://localhost:3333/api/v1`

## Endpoints

### Auth
| Método | Rota                     | Descrição               |
|--------|--------------------------|-------------------------|
| POST   | /auth/register           | Criar conta             |
| POST   | /auth/login              | Login                   |
| POST   | /auth/refresh            | Renovar tokens          |
| POST   | /auth/logout             | Logout (revoga token)   |
| GET    | /auth/me                 | Dados do usuário logado |

### Apostas
| Método | Rota                     | Descrição               |
|--------|--------------------------|-------------------------|
| POST   | /bets                    | Realizar aposta         |
| GET    | /bets                    | Histórico de apostas    |
| GET    | /bets/stats              | Estatísticas do usuário |
| GET    | /bets/:id                | Detalhes de uma aposta  |
| PATCH  | /bets/:id/settle         | Liquidar aposta (admin) |

### Financeiro
| Método | Rota                         | Descrição               |
|--------|------------------------------|-------------------------|
| GET    | /financial/balance           | Saldo atual             |
| GET    | /financial/transactions      | Extrato de transações   |
| POST   | /financial/deposit           | Realizar depósito       |
| POST   | /financial/withdraw          | Solicitar saque         |

### Usuários
| Método | Rota                     | Descrição               |
|--------|--------------------------|-------------------------|
| GET    | /users/profile           | Meu perfil              |
| PATCH  | /users/profile           | Atualizar perfil        |
| GET    | /users                   | Listar usuários (admin) |

## Exemplos de requisição

### Registrar
```json
POST /api/v1/auth/register
{
  "name": "João Silva",
  "email": "joao@email.com",
  "cpf": "123.456.789-01",
  "phone": "(11) 99999-9999",
  "birthdate": "1995-05-15",
  "password": "Senha@123"
}
```

### Realizar aposta
```json
POST /api/v1/bets
Authorization: Bearer <token>
{
  "type": "single",
  "stake": 50,
  "selections": [
    {
      "matchId": "uuid-da-partida",
      "marketId": "market-1x2",
      "pick": "home",
      "label": "Flamengo",
      "odd": 2.10,
      "matchLabel": "Flamengo vs Corinthians",
      "marketLabel": "Resultado Final"
    }
  ]
}
```

### Depositar
```json
POST /api/v1/financial/deposit
Authorization: Bearer <token>
{
  "amount": 200,
  "method": "pix"
}
```

## Testes

```bash
# Todos os testes
npm test

# Com cobertura
npm run test:coverage
```

## Credenciais de seed

| Tipo  | E-mail                  | Senha        |
|-------|-------------------------|--------------|
| Admin | admin@betforge.com      | Admin@123    |
| User  | joao@betforge.com       | User@12345   |

## Segurança

- Tokens JWT com refresh via Redis (invalidação real ao fazer logout)
- Rate limiting por IP: global (100 req/15min), auth (10/15min), apostas (30/min)
- Helmet para headers HTTP seguros
- CORS restrito por lista de origens
- Senhas com bcrypt (12 rounds)
- Validação de entrada em todos os endpoints via Zod
- Saque bloqueado para usuários sem KYC verificado
