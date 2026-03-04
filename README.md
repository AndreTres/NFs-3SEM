# NF Control

Projeto full-stack para controle de notas fiscais.

## Stack

- **Backend:** Node.js + Express
- **Frontend:** React (Vite)
- **Banco de dados:** PostgreSQL (Neon)
- **ORM:** Prisma
- **Autenticação:** JWT
- **Validação:** Zod

## Monorepo

Este repositório é um **monorepo**: backend e frontend convivem no mesmo repositório, em pastas separadas (`backend/` e `frontend/`), com responsabilidades bem definidas e sem compartilhar código entre si. A comunicação entre as partes é feita exclusivamente via API HTTP.

## Backend

O backend do NF-Control é uma API REST desenvolvida em Node.js com TypeScript, seguindo arquitetura em camadas e boas práticas de segurança e validação.

### Stack tecnológica

- **Node.js**
- **Express**
- **TypeScript**
- **Prisma ORM**
- **PostgreSQL** (Neon)
- **Zod** (validação de dados)
- **JWT** (autenticação)

### Arquitetura

O backend segue uma arquitetura em camadas:

```
routes → controllers → services → prisma
```

- **routes:** definem os endpoints HTTP e aplicam middlewares (ex.: autenticação).
- **controllers:** tratam apenas da camada HTTP (request/response), validam a entrada e delegam a lógica aos services.
- **services:** concentram a lógica de negócio e o acesso aos dados via Prisma.
- **prisma:** camada de acesso ao banco de dados (PostgreSQL).

### Principais funcionalidades

- **Autenticação de usuários:** registro e login com JWT.
- **Proteção de rotas:** endpoints de invoices protegidos por `authMiddleware` (JWT).
- **CRUD completo de invoices:** criação, listagem, busca por id, atualização e exclusão.
- **Validação de dados:** entradas validadas com Zod (schemas para auth e invoices).
- **Regras de domínio:** validações como `dueDate ≥ issueDate` em invoices.
- **Isolamento por usuário:** todas as operações de invoices filtradas por `userId`.

### Endpoints principais

**AUTH**

| Método | Endpoint            | Descrição   |
|--------|---------------------|-------------|
| POST   | `/auth/register`    | Registrar usuário |
| POST   | `/auth/login`       | Login (retorna JWT) |

**INVOICES** (requerem `Authorization: Bearer <token>`)

| Método | Endpoint            | Descrição   |
|--------|---------------------|-------------|
| POST   | `/invoices`         | Criar invoice |
| GET    | `/invoices`         | Listar invoices (com paginação) |
| GET    | `/invoices/:id`     | Buscar invoice por id |
| PATCH  | `/invoices/:id`     | Atualizar invoice |
| DELETE | `/invoices/:id`     | Excluir invoice |

### Executando o backend localmente

1. Entre na pasta do backend:
   ```bash
   cd backend
   ```

2. Instale as dependências:
   ```bash
   npm install
   ```

3. Configure as variáveis de ambiente (copie `.env.example` para `.env` e preencha os valores):
   ```bash
   cp .env.example .env
   ```

4. Execute as migrations do Prisma:
   ```bash
   npx prisma migrate dev
   ```

5. Inicie o servidor em modo desenvolvimento:
   ```bash
   npm run dev
   ```

O servidor estará disponível em `http://localhost:3000` (ou na porta definida em `PORT` no `.env`).

## Setup do Backend

_(Instruções serão adicionadas na fase de configuração do backend.)_

## Setup do Frontend

_(Instruções serão adicionadas na fase de configuração do frontend.)_
