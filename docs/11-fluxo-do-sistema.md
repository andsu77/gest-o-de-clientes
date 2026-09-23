# 11 — Fluxo completo de uma requisição

Vamos seguir **"registrar o pagamento da mensalidade do João via PIX"** do clique até o banco e de volta.

```
[Navegador] clique em "Receber" → formulário → "Confirmar pagamento"
   │  public/js/forms.js → payAction(id)
   │  public/js/api.js   → await fetch('POST /api/payments/12/pay', { method:'PIX', paidAt:'2026-09-12' })
   ▼
[Express] src/app.ts
   helmet → cors → express.json (req.body vira objeto)
   ▼
[Route] src/routes/index.ts
   router.use(authenticate)                       ← middleware
   router.post('/payments/:id/pay', controllers.payments.pay)
   ▼
[Middleware] src/middlewares/authenticate.ts
   lê "Authorization: Bearer ..." → verifica JWT → req.user = { id, email } → next()
   (token inválido? lança UnauthorizedError → pula direto para o errorHandler → 401)
   ▼
[Controller] src/controllers/PaymentController.ts → pay
   parseId(req.params.id)              "12" → 12  (ou 400)
   markAsPaidSchema.parse(req.body)    valida método e data (ou ZodError → 400)
   await paymentService.markAsPaid(12, dados)
   ▼
[Service] src/services/PaymentService.ts → markAsPaid
   await this.getById(12)              → não existe? NotFoundError (404)
   já PAGO? CANCELADO?                 → ConflictError (409)
   await this.payments.update(12, { status:'PAGO', paidAt, method })
   await this.audit.record(...)        → histórico do cliente
   ▼
[Repository] src/repositories/prisma/PrismaPaymentRepository.ts → update
   await prisma.payment.update({ where:{ id:12 }, data })
   ▼
[Database] MySQL: UPDATE payments SET status='PAGO', paidAt='2026-09-12', ... WHERE id=12
   ▲
[Repository] converte o registro do Prisma para a entidade Payment do domínio
   ▲
[Service] devolve o Payment atualizado
   ▲
[Controller] res.json(payment)  → 200
   ▲
[Navegador] toast "Pagamento registrado." e recarrega a tela
```

## E se der erro em qualquer ponto?
Qualquer `throw` (ou Promise rejeitada) em middleware, controller, service ou repository **sobe** pelos `await` até o Express, que chama `src/middlewares/errorHandler.ts`:

| Erro | Vira |
|---|---|
| `AppError` e filhas (`NotFoundError`, `ConflictError`…) | o status que o erro carrega |
| `ZodError` | 400 com a lista de campos |
| Prisma `P2002` (valor único repetido) | 409 |
| Prisma `P2025` (registro não existe) | 404 |
| Prisma `P1001` / falha de conexão | 503 "banco indisponível" |
| JSON malformado no corpo | 400 |
| Qualquer outra coisa | 500 genérico (detalhe só no console do servidor) |

## Fluxo de "mensalidades automáticas"
1. Você cria uma contratação MENSAL (ex.: manutenção R$ 70, vence dia 10).
2. Ao abrir o **Dashboard**, `DashboardService` chama `BillingService.sync(hoje)`:
   - `generateForMonth(mês atual)`: para cada contratação cobrável, pergunta à `RecurringBillingPolicy` se cobra neste mês; se ainda não existe cobrança desse mês, cria uma PENDENTE.
   - `markOverdue(hoje)`: toda PENDENTE com vencimento no passado vira ATRASADO.
3. Também dá para gerar um mês específico em **Mensalidades → Gerar cobranças do mês**.

Nada é cobrado de verdade: o sistema só **registra a obrigação**. Você recebe por fora (PIX etc.) e clica em "Receber".

## Fluxo de inicialização (`npm run dev`)
`server.ts` → importa `config/env.ts` (valida `.env`) → `await prisma.$connect()` → `buildContainer(prisma)` (cria todos os objetos) → `createApp(container)` → `app.listen(3333)`.
