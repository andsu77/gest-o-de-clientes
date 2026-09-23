# gestao-clientes

Painel administrativo para gerenciar **clientes, serviços, sites, pagamentos, mensalidades e manutenções** de um negócio de serviços digitais — e, ao mesmo tempo, um **laboratório de estudo** de Node.js, TypeScript, POO, programação assíncrona, MVC, banco de dados e APIs.

> Sistema real + laboratório: o código é comentado para ensinar conceitos, a pasta `docs/` explica cada tema apontando para os arquivos do próprio projeto, e o `PLANO-DE-ESTUDO.md` traz 12 fases de exercícios que modificam o sistema.

---

## Sumário
1. [Objetivo](#objetivo) · 2. [Tecnologias](#tecnologias) · 3. [Arquitetura](#arquitetura) · 4. [Estrutura de pastas](#estrutura-de-pastas) · 5. [Instalação passo a passo](#instalação-passo-a-passo) · 6. [Testes](#testes) · 7. [Acessando o sistema](#acessando-o-sistema) · 8. [Dados de exemplo (seed)](#dados-de-exemplo-seed) · 9. [Fluxo da aplicação](#fluxo-da-aplicação) · 10. [Regras de negócio](#regras-de-negócio) · 11. [Problemas comuns](#problemas-comuns) · 12. [Evoluções futuras](#evoluções-futuras)

---

## Objetivo
- **Uso real:** controlar quem são seus clientes, o que cada um contratou (pagamento único, mensal, anual ou personalizado), quanto você recebeu, o que está pendente/atrasado, os sites e as manutenções.
- **Estudo:** servir de projeto prático, crescendo em complexidade de forma gradual e explicada.

O que o sistema **não** faz (de propósito): cobrar de verdade, emitir nota, integrar com WhatsApp/gateways. Ele **registra** as obrigações financeiras; você recebe por fora e marca como pago.

## Tecnologias
| Tecnologia | Papel |
|---|---|
| **Node.js 20+** | executa o servidor |
| **TypeScript** | tipagem estática (modo `strict`) |
| **Express 5** | servidor HTTP e rotas (repassa erros de funções `async` sozinho) |
| **MySQL 8** | banco de dados |
| **Prisma 6** | ORM — escolhido no lugar do Sequelize pelos tipos gerados automaticamente e schema legível (detalhes em `docs/07-banco-de-dados.md`) |
| **Zod** | validação dos dados recebidos |
| **bcryptjs** | hash de senha (bcrypt em JS puro, sem compilação nativa) |
| **jsonwebtoken** | autenticação por token JWT |
| **helmet / cors / express-rate-limit** | segurança |
| **dotenv** | variáveis de ambiente |
| **Jest + ts-jest** | testes |
| **tsx** | roda TypeScript direto em desenvolvimento |
| HTML + CSS + JavaScript (módulos ES) | front-end simples, sem framework, servido pelo próprio Express |

## Arquitetura
MVC com camadas de **Service** e **Repository**, e injeção de dependência manual.

```
Request → Route → Middleware(auth) → Controller → Service → Repository → MySQL
Response ←──────────────────────── Controller ← Service ← Repository ←─┘
                    (erros em qualquer ponto → errorHandler)
```
- **Controller:** só HTTP (lê, valida com Zod, chama service, responde).
- **Service:** regras de negócio. Depende de **interfaces** de repository, nunca do Prisma.
- **Repository:** único lugar com acesso ao banco.
- **`container.ts`:** cria e conecta todos os objetos (composition root).

Explicação completa: `docs/01-arquitetura.md` e `docs/11-fluxo-do-sistema.md`.

## Estrutura de pastas
```
gestao-clientes/
├── prisma/
│   ├── schema.prisma        modelo do banco (tabelas, relações, enums)
│   └── seed.ts              dados fictícios + admin de desenvolvimento
├── src/
│   ├── config/env.ts        lê e valida o .env (falha cedo se algo faltar)
│   ├── database/prisma.ts   conexão única com o MySQL
│   ├── models/              enums, entidades, inputs e regra de recorrência
│   ├── errors/AppError.ts   erros com status HTTP (NotFound, Conflict…)
│   ├── providers/           relógio, bcrypt e JWT atrás de interfaces
│   ├── repositories/        interfaces.ts + implementações Prisma
│   ├── services/            regras de negócio
│   ├── validators/          schemas Zod
│   ├── controllers/         camada HTTP
│   ├── middlewares/         autenticação, 404, tratamento global de erros
│   ├── routes/              mapa de URLs
│   ├── types/express.d.ts   adiciona req.user ao tipo do Express
│   ├── utils/               dinheiro (centavos) e datas
│   ├── container.ts         injeção de dependência
│   ├── app.ts               monta o Express
│   └── server.ts            ponto de entrada
├── public/                  front-end (index.html, css/, js/, js/views/)
├── tests/                   Jest: unit/, fakes/ (repositórios em memória)
├── docs/                    material didático 01 a 12
├── PLANO-DE-ESTUDO.md
├── .env.example
└── package.json
```

---

## Instalação passo a passo

### 0. Pré-requisitos
- **Node.js 20 ou mais novo** → `node -v`
- **MySQL 8** rodando localmente (instalação normal, XAMPP/Laragon, ou Docker)
- VS Code (recomendado: extensões *Prisma* e *ESLint*)

> Sem MySQL instalado? Com Docker: `docker run --name mysql-gestao -e MYSQL_ROOT_PASSWORD=root -p 3306:3306 -d mysql:8` e use `root`/`root` no `DATABASE_URL`.

### 1. Instalar as dependências
```bash
cd gestao-clientes
npm install
```
O `postinstall` roda `prisma generate`, que gera o cliente tipado do Prisma a partir do schema.

### 2. Configurar o `.env`
```bash
cp .env.example .env        # Windows (PowerShell): copy .env.example .env
```
Edite o `.env`:
- `DATABASE_URL` → `mysql://USUARIO:SENHA@localhost:3306/gestao_clientes` (troque usuário e senha pelos seus).
- `JWT_SECRET` → um texto longo aleatório. Gere com:
  `node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"`

Todas as variáveis estão comentadas no `.env.example`. Se alguma estiver faltando ou errada, o servidor para e diz qual.

### 3. Criar o banco
No MySQL (Workbench, DBeaver, phpMyAdmin ou terminal `mysql -u root -p`):
```sql
CREATE DATABASE gestao_clientes CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```
(A migration do Prisma também cria o banco se o usuário tiver permissão, mas criar à mão deixa claro o que acontece.)

### 4. Executar as migrations (criar as tabelas)
```bash
npx prisma migrate dev --name init
```
Isso gera `prisma/migrations/<data>_init/migration.sql` (**leia esse arquivo** — é o SQL das suas tabelas) e aplica no banco.

> Erro de permissão para criar "shadow database"? O `migrate dev` usa um banco temporário para comparar. Use um usuário com permissão de criar bancos (ex.: `root`) ou, só para desenvolvimento, `npx prisma db push` (cria as tabelas sem gerar migrations).

Depois, sempre que alterar o `schema.prisma`: `npm run db:migrate -- --name descricao_da_mudanca`.

### 5. Popular com dados de exemplo (seed)
```bash
npm run db:seed
```
⚠️ O seed **apaga todos os dados** antes de criar os exemplos (e se recusa a rodar com `NODE_ENV=production`). Quando começar a usar com clientes reais, não rode mais.

Para recomeçar do zero (apaga tudo, recria tabelas e roda o seed): `npm run db:reset`.

### 6. Iniciar o servidor
```bash
npm run dev
```
Saída esperada:
```
✅ Conectado ao MySQL.
🚀 Servidor rodando em http://localhost:3333
```
`npm run dev` reinicia sozinho ao salvar arquivos. Para produção: `npm run build` e `npm start`.

### Resumo dos comandos
| Comando | O que faz |
|---|---|
| `npm run dev` | servidor em modo desenvolvimento |
| `npm test` | roda os testes |
| `npm run typecheck` | verifica erros de TypeScript |
| `npm run db:migrate` | cria/aplica migrations |
| `npm run db:seed` | recria os dados de exemplo |
| `npm run db:reset` | zera o banco e roda o seed |
| `npm run db:studio` | abre o Prisma Studio (ver tabelas no navegador) |
| `npm run build` / `npm start` | compila e roda a versão de produção |

---

## Testes
```bash
npm test
```
- **44 testes** em `tests/unit/`: criar e buscar cliente, criar e registrar pagamento, regras de mensalidade (mensal, anual, dia 31, idempotência), contratação de pagamento único, login, e validação (`nome: ""`, `email: "abc"`, `valor: -100`).
- **Não precisam de MySQL:** os services recebem repositórios em memória (`tests/fakes/`). Por que isso funciona está em `docs/10-testes.md`.
- Outros modos: `npm run test:watch`, `npm test -- --coverage`.

Teste também pelo navegador (roteiro rápido):
1. Entre com o admin → Dashboard mostra recebido no mês, pendentes e atrasados.
2. **Clientes → Carlos**: veja as mensalidades atrasadas → "Receber" em uma → o total atrasado diminui e o histórico registra.
3. **Clientes → Novo cliente** com nome vazio → mensagem de validação vinda da API.
4. **Clientes → Maria → Adicionar serviço** (Hospedagem, mensal) → **Mensalidades → Gerar cobranças do mês** → rode duas vezes e veja que não duplica.
5. **Financeiro**: filtre por cliente/status e veja a receita por mês.

E pela API (curl): exemplos em `docs/08-api-rest.md`. Saúde do sistema: `GET http://localhost:3333/api/health`.

## Acessando o sistema
Abra **http://localhost:3333**.

### Credenciais de desenvolvimento
| E-mail | Senha |
|---|---|
| `admin@gestao.dev` | `admin123` |

Definidas por `SEED_ADMIN_EMAIL` e `SEED_ADMIN_PASSWORD` no `.env`. **São só para desenvolvimento**: antes de usar com dados reais, troque a senha em **Configurações** e use um `JWT_SECRET` forte.

## Dados de exemplo (seed)
Datas são calculadas a partir do dia em que você roda o seed, então vencimentos e atrasos sempre fazem sentido.

**Serviços:** Criação de site (única, R$ 700), Landing page (única, R$ 497), Manutenção (mensal, R$ 70), Hospedagem (mensal, R$ 30), Domínio .com.br (anual, R$ 40), Suporte avulso (personalizada, R$ 100).

| Cliente | Status | Cenário |
|---|---|---|
| João (Padaria) | ATIVO | site pago (único) + manutenção e hospedagem mensais em dia, site ONLINE, manutenções registradas |
| Maria | ATIVO | landing page com pagamento **pendente**, manutenção mensal com valor negociado (R$ 50, dia 25), site em desenvolvimento |
| Carlos | INADIMPLENTE | mensalidades **atrasadas** |
| Ana | ENCERRADO | site pago, contratação **encerrada** |
| Pedro | PAUSADO | suporte avulso pago + domínio **anual** |

## Fluxo da aplicação
1. O navegador carrega `public/index.html`; `js/app.js` verifica se há token e mostra login ou painel.
2. Login → `POST /api/auth/login` → o token JWT fica no navegador e vai em toda requisição (`Authorization: Bearer ...`).
3. Cada tela (`public/js/views/*.js`) chama a API via `js/api.js` e desenha o resultado.
4. Na API: rota → `authenticate` → controller (valida com Zod) → service (regras) → repository (Prisma) → MySQL, e a resposta volta pelo mesmo caminho.
5. Erros em qualquer camada chegam ao `errorHandler`, que devolve sempre `{ error: { code, message, details } }` com o status HTTP correto.
6. Ao abrir o Dashboard, o sistema gera as mensalidades do mês que ainda não existem e marca como ATRASADO o que venceu.

O passo a passo detalhado de uma requisição real está em `docs/11-fluxo-do-sistema.md`.

## Regras de negócio
- Valores em **centavos inteiros** na API (`7000` = R$ 70,00); o front converte.
- Contratação **ÚNICA** gera 1 cobrança pendente na criação. **MENSAL** gera uma cobrança por mês; **ANUAL** uma vez por ano (no mês de aniversário); **PERSONALIZADA** é lançada manualmente.
- O vencimento usa o dia combinado; se o mês não tiver esse dia (31 em fevereiro), usa o último dia.
- A geração de mensalidades é **idempotente** (rodar de novo não duplica — garantido também por `UNIQUE` no banco).
- **Receita recorrente mensal (MRR)** = soma das mensais + anuais ÷ 12, só de contratações ativas.
- Registrar pagamento grava a **data real** e o método. Não é possível pagar duas vezes, pagar um cancelado nem cancelar um pago.
- Pagamentos não são excluídos, só cancelados (histórico financeiro preservado).
- Cliente com pagamento recebido não pode ser excluído (use ENCERRADO). Serviço já contratado não pode ser excluído (use INATIVO).
- Toda ação importante vai para o histórico do cliente (`audit_logs`).

## Problemas comuns
| Sintoma | Causa provável |
|---|---|
| `Configuração inválida no arquivo .env` ao iniciar | `.env` não criado ou campo faltando — compare com `.env.example` |
| `Não foi possível conectar ao MySQL` | MySQL desligado, senha errada no `DATABASE_URL` ou banco não criado |
| `The table ... does not exist` | faltou rodar a migration (passo 4) |
| `Cannot find module '.prisma/client'` | rode `npx prisma generate` |
| Login não funciona | faltou rodar o seed (passo 5) |
| "Muitas tentativas de login" | limite de 10 tentativas / 15 min — espere ou reinicie o servidor |
| Página em branco | abra o console do navegador (F12) e veja o erro |

## Evoluções futuras
Fora do escopo agora, mas a arquitetura já comporta (normalmente um **provider** novo atrás de uma interface + um **service**):
- Integração com Mercado Pago / Stripe (links de pagamento, baixa automática)
- Envio de lembretes via WhatsApp API ou e-mail
- Emissão de nota fiscal
- Multiusuário com papéis (ex.: você e um sócio)
- Cobrança automática real e agendamento (cron)
- Portal do cliente, exportação CSV/PDF, gráficos, Docker e deploy

## Por onde começar a estudar
1. Rode o sistema e use-o como usuário por 15 minutos.
2. Leia `docs/01-arquitetura.md` e `docs/11-fluxo-do-sistema.md`.
3. Siga o `PLANO-DE-ESTUDO.md` a partir da Fase 1.
