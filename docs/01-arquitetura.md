# 01 — Arquitetura

> Objetivo: entender **onde cada coisa mora** e **por que** o código foi dividido assim.

## A ideia central: cada camada tem UM trabalho

```
Navegador (public/)
   │  HTTP + JSON
   ▼
routes/        → "qual URL chama qual método?"
middlewares/   → coisas que rodam ANTES (login) ou DEPOIS (erros) do controller
controllers/   → traduz HTTP ⇄ chamada de método (lê req, valida, responde res)
validators/    → confere se os dados recebidos fazem sentido (Zod)
services/      → REGRAS DE NEGÓCIO (o coração do sistema)
models/        → tipos, enums e regras puras do domínio (sem banco, sem HTTP)
repositories/  → ÚNICO lugar que conversa com o banco (Prisma)
database/      → a conexão com o MySQL
```

Pense num restaurante: a **rota** é o cardápio, o **controller** é o garçom (anota o pedido, entrega o prato), o **service** é o cozinheiro (sabe as receitas = regras), o **repository** é o estoquista (busca e guarda ingredientes = dados). O garçom não cozinha e o cozinheiro não vai até a mesa.

## Por que cada pasta existe

| Pasta | Responsabilidade | Exemplo neste projeto |
|---|---|---|
| `src/config/` | Ler e **validar** variáveis de ambiente na inicialização | `env.ts` — se faltar `JWT_SECRET`, o servidor nem sobe |
| `src/database/` | Criar a conexão com o banco (uma só para o app inteiro) | `prisma.ts` |
| `src/models/` | Tipos do domínio + regras puras | `enums.ts`, `entities.ts`, `RecurringBillingPolicy.ts` |
| `src/repositories/` | Acesso a dados. `interfaces.ts` define **o que** dá para fazer; `prisma/` define **como** | `PrismaClientRepository.ts` |
| `src/services/` | Regras de negócio | `PaymentService.markAsPaid()` impede pagar duas vezes |
| `src/controllers/` | Camada HTTP | `ClientController.store` |
| `src/routes/` | Mapa URL → controller | `routes/index.ts` |
| `src/middlewares/` | Autenticação, erros, 404 | `authenticate.ts`, `errorHandler.ts` |
| `src/validators/` | Schemas Zod | `payment.validator.ts` recusa valor negativo |
| `src/providers/` | "Adaptadores" para coisas externas: relógio, bcrypt, JWT | `BcryptPasswordHasher.ts` |
| `src/errors/` | Erros próprios com status HTTP | `NotFoundError` → 404 |
| `src/utils/` | Funções pequenas e puras | `dates.ts`, `money.ts` |
| `src/types/` | Extensões de tipos de bibliotecas | `express.d.ts` adiciona `req.user` |
| `src/container.ts` | Monta todos os objetos e liga uns nos outros | "composition root" |
| `prisma/` | Schema do banco e seed | `schema.prisma`, `seed.ts` |
| `public/` | Front-end simples (HTML/CSS/JS) | `js/views/clientDetail.js` |
| `tests/` | Testes Jest | `tests/unit/PaymentService.test.ts` |

> Por que `providers/` e não estava na sugestão original? Porque bcrypt, JWT e "que dia é hoje" são **detalhes externos**. Colocá-los atrás de uma interface permite trocar nos testes (ex.: `FixedClock`, em `tests/fakes/FakeProviders.ts`, finge que "hoje" é uma data fixa). Veja `03-poo.md`.

## As duas decisões de arquitetura mais importantes

### 1. Services dependem de **interfaces**, não do Prisma

Abra `src/services/ClientService.ts`: ele recebe um `ClientRepository` (interface de `repositories/interfaces.ts`), **não** um `PrismaClientRepository`.

- **Implementação mais simples:** chamar `prisma.client.create()` direto dentro do service (ou até do controller).
- **Por que a atual é melhor num sistema real:** os testes usam `tests/fakes/InMemoryRepositories.ts` — repositórios em memória. Resultado: 40+ testes rodam em segundos **sem MySQL**. E se um dia você trocar Prisma por Sequelize, só `repositories/prisma/` muda.

### 2. Um único lugar monta tudo: `src/container.ts`

Nenhuma classe faz `new` das suas dependências. O `buildContainer()` cria os repositories, injeta nos services, injeta os services nos controllers. Isso é **injeção de dependência manual** — sem biblioteca mágica. Leia esse arquivo de cima para baixo: é o "mapa" de quem usa quem.

## Dinheiro e datas (decisões que evitam bugs)

- **Dinheiro em centavos inteiros** (`amountCents: 7000` = R$ 70,00). Motivo: `0.1 + 0.2 === 0.30000000000000004` em JavaScript. Com inteiros não existe esse problema. Veja `src/utils/money.ts`.
- **Datas de calendário** (vencimento, pagamento) são gravadas como `DATE` (sem hora). "Hoje" é calculado no fuso `APP_TIMEZONE` em `src/utils/dates.ts` → `todayInTimeZone()`.

## Para praticar
Veja `12-exercicios.md`, seção Arquitetura.
