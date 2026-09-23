# Plano de estudo — gestao-clientes

Este sistema é o seu laboratório. A regra é: **leia, rode, modifique, quebre, conserte**. Cada fase tem leitura, uma pergunta para responder com suas palavras e exercícios que **alteram o sistema de verdade**.

**Não há respostas aqui de propósito.** Quando travar:
1. releia o comentário do arquivo; 2. procure um código parecido que já existe no projeto (quase sempre há); 3. rode os testes; 4. só então peça ajuda — e peça uma **dica**, não a solução.

Antes de começar: siga o `README.md` até o sistema abrir no navegador e `npm test` passar. Faça um commit a cada exercício concluído.

Ritmo sugerido: 1 fase a cada 2–4 dias. Mais importante que velocidade é conseguir **explicar** a fase para alguém.

---

## Fase 1 — Entender a estrutura do projeto
**Ler:** `README.md`, `docs/01-arquitetura.md`, `src/server.ts`, `src/app.ts`, `src/container.ts`.
**Pergunta:** o que acontece, em ordem, entre digitar `npm run dev` e aparecer "Servidor rodando"?
**Exercícios:**
1. Mude a porta para 4000 **só** pelo `.env`. Por que não foi preciso mexer em nenhum `.ts`?
2. Faça a rota `/api/health` devolver também a versão do projeto (lida do `package.json`).
3. Abra o Prisma Studio (`npm run db:studio`) e encontre, nas tabelas, os dados do cliente "Carlos" que aparecem na tela.

## Fase 2 — TypeScript
**Ler:** `docs/02-node-typescript.md`, `src/models/enums.ts`, `entities.ts`, `inputs.ts`, `src/utils/money.ts`.
**Pergunta:** qual a diferença entre `ClientStatus` usado como valor e usado como tipo?
**Exercícios:**
1. Adicione um novo status de cliente `PROSPECT` (lead ainda não fechado). Siga os erros do `npm run typecheck` até achar todos os lugares que precisam mudar (inclusive o schema do Prisma e o front).
2. Crie em `utils/money.ts` uma função tipada `percentOf(cents: number, percent: number): number` e use-a para mostrar no Dashboard quanto do valor pendente está atrasado.
3. Tente atribuir `'ATVO'` a um `ClientStatus` e leia a mensagem do compilador.

## Fase 3 — POO
**Ler:** `docs/03-poo.md`, `src/errors/AppError.ts`, `src/providers/`, `src/services/AuditService.ts`.
**Pergunta:** por que `NotFoundError` usa herança e `ClientOverviewService` usa composição?
**Exercícios:**
1. Crie `ForbiddenError` (403) e use-a em algum lugar que faça sentido.
2. Crie um provider `Clock` alternativo que leia a data de uma variável `FAKE_TODAY` do `.env` (para você "viajar no tempo" e ver mensalidades atrasarem). Troque-o no `container.ts` só quando a variável existir.
3. Liste todas as classes do projeto e escreva, para cada uma, "existe para / responsável por / usada por".

## Fase 4 — Express
**Ler:** `docs/05-express.md`, `src/app.ts`, `src/routes/`.
**Pergunta:** por que o `errorHandler` precisa ser o último `app.use()`?
**Exercícios:**
1. Crie um middleware de log: `GET /api/clients 200 - 12ms`.
2. Crie uma rota pública `GET /api/version`. Depois mova-a para depois do `authenticate` e observe a diferença.
3. Mude a ordem de `/clients/:id/overview` e `/clients` em `routes/index.ts`, teste, entenda o que quebrou e volte.

## Fase 5 — Rotas e Controllers
**Ler:** `docs/06-mvc.md`, `src/controllers/ClientController.ts`, `PaymentController.ts`.
**Pergunta:** por que os métodos dos controllers são arrow functions?
**Exercícios:**
1. Crie uma rota para buscar clientes por nome: `GET /api/clients/search/by-name?q=jo` (reaproveite o que já existe — precisa de service novo?).
2. Crie `GET /api/payments/overdue`.
3. Troque um método de controller por método comum (`async store(req, res) {}`), veja o erro de `this` e volte.

## Fase 6 — Services (regras de negócio)
**Ler:** `src/services/ClientService.ts`, `PaymentService.ts`, `ContractService.ts`.
**Pergunta:** o que aconteceria se a regra "não pagar duas vezes" estivesse só no front-end?
**Exercícios:**
1. Impedir nova contratação para cliente ENCERRADO.
2. Quando um cliente INADIMPLENTE quitar todos os atrasados, mudar o status dele para ATIVO automaticamente (e registrar no histórico).
3. Crie uma regra que impeça registrar pagamento com data de pagamento no futuro.

## Fase 7 — Repositories
**Ler:** `src/repositories/interfaces.ts`, `repositories/prisma/PrismaPaymentRepository.ts`, `tests/fakes/InMemoryRepositories.ts`.
**Pergunta:** o que precisaria mudar se você trocasse Prisma por Sequelize? E o que **não** mudaria?
**Exercícios:**
1. Adicione ordenação configurável na listagem de clientes (`?orderBy=name|createdAt`), passando pela interface do repository.
2. Implemente paginação em `GET /api/payments` (`?page=1&pageSize=20`) — interface, Prisma e fake em memória.
3. Adicione um método `countByMonth` no repository de clientes (novos clientes por mês) e exiba no Financeiro.

## Fase 8 — Banco de dados
**Ler:** `docs/07-banco-de-dados.md`, `prisma/schema.prisma`, `prisma/seed.ts`, o SQL em `prisma/migrations/`.
**Pergunta:** por que `client_services` existe em vez de um `serviceId` dentro de `clients`?
**Exercícios:**
1. Adicione o campo CPF obrigatório para clientes **novos** (os antigos podem ficar sem). Pense: schema, validator, migration.
2. Adicione o campo `instagram` ao cliente — do schema até a tela.
3. Crie uma tabela `payment_attachments` (link do comprovante). Só crie se você conseguir justificar que ela é necessária — senão explique por que um campo bastaria.
4. Acrescente um sexto cliente ao seed com um cenário que ainda não existe.

## Fase 9 — Programação assíncrona
**Ler:** `docs/04-programacao-assincrona.md`, `DashboardService.ts`, `ClientOverviewService.ts`, `BillingService.ts`, `public/js/api.js`.
**Pergunta:** qual a diferença de tempo entre 5 `await` seguidos e um `Promise.all` com 5 Promises? Quando **não** usar `Promise.all`?
**Exercícios:**
1. Meça (`console.time`) o overview com `Promise.all` e com `await` sequencial.
2. Reescreva `BillingService.generateForMonth` com `Promise.all` e rode os testes. Algum problema? Qual versão você manteria e por quê?
3. Use `Promise.allSettled` num lugar onde faça sentido que uma falha não derrube o resto.
4. Crie uma função `sleep(ms)` que devolve uma Promise e use-a para simular um banco lento. Observe o front mostrando "Carregando…".

## Fase 10 — Autenticação
**Ler:** `docs/09-autenticacao.md`, `AuthService.ts`, `authenticate.ts`, `JwtTokenProvider.ts`.
**Pergunta:** por que a mensagem de login errado é igual para e-mail inexistente e senha errada?
**Exercícios:**
1. Registre no histórico (ou numa tabela nova) cada login bem-sucedido com data e hora.
2. Faça o token expirar em 1 minuto e melhore a experiência do front quando isso acontece.
3. (Desafio) Troque o `localStorage` por um cookie `httpOnly`. O que muda no middleware, no CORS e no front?

## Fase 11 — Testes
**Ler:** `docs/10-testes.md`, todos os arquivos em `tests/`.
**Pergunta:** por que os testes não precisam de MySQL?
**Exercícios:**
1. Escreva testes para as regras que você criou nas Fases 6 e 7.
2. Teste que um pagamento PAGO não pode ser cancelado (a regra existe, o teste não).
3. Instale `supertest` e crie um teste de rota: `POST /api/auth/login` com senha errada deve responder 401. (Dica de arquitetura: `createApp()` recebe o container… o que você injetaria?)
4. Rode `npm test -- --coverage` e escolha o arquivo menos coberto para melhorar.

## Fase 12 — Melhorias (escolha e justifique)
Agora você decide. Para cada uma, escreva antes **qual problema real ela resolve para o seu negócio**:
- Exportar o financeiro em CSV.
- Lembrete de vencimento (só gerar o texto pronto para copiar no WhatsApp — sem API).
- Gráfico simples de receita por mês.
- Dockerfile + docker-compose com MySQL.
- Deploy do sistema para você usar no celular.
- Filtro de período no Dashboard.

### Evoluções futuras (fora do escopo por enquanto)
Integração com Mercado Pago/Stripe, envio pelo WhatsApp API, emissão de nota fiscal, multiusuário com permissões (você + sócio), cobrança automática real, portal do cliente. Todas cabem na arquitetura atual: normalmente seriam um **provider** novo (atrás de uma interface) + um **service** que o usa.
