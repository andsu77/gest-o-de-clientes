# 08 — API REST

REST é um jeito de organizar a API em torno de **recursos** (clientes, pagamentos…) e usar os **verbos HTTP** com significado.

| Verbo | Significado | Exemplo | Resposta |
|---|---|---|---|
| GET | ler | `GET /api/clients/3` | 200 + JSON |
| POST | criar / executar ação | `POST /api/clients` | 201 + objeto criado |
| PUT | atualizar | `PUT /api/clients/3` | 200 + objeto atualizado |
| DELETE | apagar | `DELETE /api/clients/3` | 204 sem corpo |

## Todas as rotas

Públicas:
```
GET  /api/health                  status do servidor e do banco
POST /api/auth/login              { email, password } → { token, user }
```
Exigem `Authorization: Bearer <token>`:
```
POST /api/auth/logout
GET  /api/auth/me
PUT  /api/auth/password           { currentPassword, newPassword }

GET  /api/dashboard
GET  /api/finance?from=&to=&clientId=&status=&year=

GET|POST        /api/clients      ?search=&status=
GET|PUT|DELETE  /api/clients/:id
GET             /api/clients/:id/overview   (histórico completo)

GET|POST        /api/services     ?status=
GET|PUT|DELETE  /api/services/:id

GET|POST        /api/contracts    ?clientId=&status=&billingType=
GET|PUT|DELETE  /api/contracts/:id

GET|POST        /api/payments     ?clientId=&status=&from=&to=&recurring=true
GET|PUT         /api/payments/:id
POST            /api/payments/:id/pay      { method, paidAt?, notes? }
POST            /api/payments/:id/cancel
POST            /api/billing/generate      { month?: "AAAA-MM" }

GET|POST        /api/sites        ?clientId=&status=
GET|PUT|DELETE  /api/sites/:id

GET|POST        /api/maintenance  ?clientId=&status=
GET|PUT|DELETE  /api/maintenance/:id
```

## Decisões que valem estudar
- **Ações como sub-recurso:** registrar pagamento é `POST /payments/:id/pay`, e não um `PUT` mudando `status: 'PAGO'`. Motivo: pagar tem regras (grava a data real, o método, registra no histórico, recusa se cancelado). Uma rota própria deixa isso explícito.
- **Pagamentos não têm DELETE:** dinheiro não some do histórico — cancela-se.
- **Valores em centavos:** `{ "amountCents": 7000 }`. O front converte "70,00".
- **Datas:** `"2026-09-10"` na entrada; ISO (`"2026-09-10T00:00:00.000Z"`) na saída.

## Formato de erro (sempre o mesmo)
```json
{ "error": { "code": "VALIDATION_ERROR", "message": "Dados inválidos.",
  "details": [{ "field": "email", "message": "E-mail inválido." }] } }
```
Status usados: 400 (dados inválidos), 401 (sem login), 404 (não encontrado), 409 (conflito com regra, ex.: pagar duas vezes), 429 (muitas tentativas de login), 503 (banco fora), 500 (erro inesperado). Veja `src/middlewares/errorHandler.ts`.

## Testando a API sem o front-end
Com o servidor rodando (terminal Git Bash / Linux / macOS):
```bash
TOKEN=$(curl -s -X POST localhost:3333/api/auth/login -H 'Content-Type: application/json' \
  -d '{"email":"admin@gestao.dev","password":"admin123"}' | node -pe 'JSON.parse(require("fs").readFileSync(0)).token')

curl -s localhost:3333/api/clients -H "Authorization: Bearer $TOKEN"
curl -s -X POST localhost:3333/api/clients -H "Authorization: Bearer $TOKEN" \
  -H 'Content-Type: application/json' -d '{"name":"","email":"abc"}'   # veja o 400
```
No VS Code, a extensão **REST Client** ou **Thunder Client** faz o mesmo com interface.
