# 05 — Express

Express é a biblioteca que recebe requisições HTTP e decide o que fazer com elas. Tudo em Express é **middleware**: uma função `(req, res, next)` que faz algo e passa adiante (`next()`) ou responde (`res.json()`).

## Neste projeto: `src/app.ts`
A ordem dos `app.use()` é a ordem em que cada requisição passa:

1. `helmet()` — adiciona cabeçalhos de segurança (bloqueia scripts inline, clickjacking etc.).
2. `cors()` — define quais sites podem chamar a API (`CORS_ORIGIN` no `.env`).
3. `express.json({ limit: '100kb' })` — transforma o corpo JSON em `req.body`.
4. `express.static('public')` — entrega o front-end (`index.html`, CSS, JS).
5. `GET /api/health` — rota pública que testa o banco com `SELECT 1`.
6. `/api` → `createApiRoutes(container)` (todas as rotas da API).
7. `apiNotFound` — qualquer `/api/...` que ninguém atendeu → 404 em JSON.
8. `errorHandler` — **por último**: pega qualquer erro lançado antes.

> Por que o `errorHandler` tem 4 parâmetros `(error, req, res, next)`? É assim que o Express reconhece um middleware de erro. Com 3, ele seria tratado como middleware comum.

## `createApp()` separado de `server.ts`
`app.ts` **monta** o app; `server.ts` **liga** o servidor. Assim dá para criar o app em testes (ex.: com `supertest`) sem abrir porta. Isso é um dos exercícios da Fase 11.

## Rotas
`src/routes/index.ts`:
```ts
router.use('/auth', authRoutes(...));   // públicas (login)
router.use(authenticate);                // ← daqui para baixo, exige token
router.get('/dashboard', controllers.dashboard.dashboard);
router.use('/clients', crudRoutes(controllers.clients));
```
`crudRoutes()` (em `crud.routes.ts`) gera as 5 rotas padrão para qualquer controller que implemente a interface `CrudController`. Evita repetir o mesmo bloco 5 vezes.

**Cuidado com a ordem:** `GET /clients/:id/overview` é registrada **antes** de `/clients`, senão o CRUD tentaria tratá-la.

## `req` e `res`
- `req.params.id` — parte da URL (`/clients/3` → `"3"`, sempre string! Por isso `parseId()`).
- `req.query` — `?search=joao&status=ATIVO`.
- `req.body` — JSON enviado no POST/PUT.
- `req.user` — preenchido pelo `authenticate`.
- `res.status(201).json(obj)` — responde com status e JSON.
- `res.status(204).send()` — "deu certo, nada a devolver" (usado no DELETE).

## Rate limit
`src/routes/auth.routes.ts` limita o login a 10 tentativas por 15 minutos por IP (`express-rate-limit`), dificultando adivinhar senhas.
