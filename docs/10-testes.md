# 10 — Testes com Jest

## Rodando
```bash
npm test                 # todos
npm test -- --watch      # reexecuta ao salvar
npm test -- Payment      # só arquivos com "Payment" no nome
npm test -- --coverage   # relatório de cobertura em coverage/
```
Os testes **não precisam de MySQL**. Por quê? Veja abaixo.

## A ideia: testar a regra, não o banco
Os services recebem repositories por **injeção de dependência** (ver `03-poo.md`). Nos testes injetamos versões **em memória** (`tests/fakes/InMemoryRepositories.ts`), que guardam os dados num array. O service testado é **exatamente o mesmo** do sistema real.

Outros "dublês":
- `FixedClock` (`tests/fakes/FakeProviders.ts`): "hoje" é sempre a mesma data → testes de vencimento/atraso não quebram com o passar dos dias.
- `FakePasswordHasher` e `FakeTokenProvider`: rápidos e previsíveis.

## O que está testado

| Arquivo | Pedido do projeto | O que prova |
|---|---|---|
| `ClientService.test.ts` | criar / buscar cliente | cria com status padrão, busca por id, 404, pesquisa por texto + filtro, histórico ao mudar status, não exclui quem já pagou |
| `PaymentService.test.ts` | criar / registrar pagamento | cria PENDENTE ou ATRASADO conforme o vencimento, grava data real e método, não paga duas vezes, não paga cancelado, recusa contratação de outro cliente |
| `RecurringBillingPolicy.test.ts` | regra de mensalidade | cobra no mês certo, anual só no aniversário, dia 31 vira 30/28, MRR |
| `BillingService.test.ts` | regra de mensalidade | gera cobranças do mês **sem duplicar** ao rodar de novo |
| `ContractService.test.ts` | pagamento único | contratação ÚNICA cria 1 cobrança; MENSAL não; valor negociado; serviço inativo e datas inválidas recusados |
| `AuthService.test.ts` | segurança | login certo/errado, sem vazar hash |
| `validators.test.ts` | validação | recusa `nome: ""`, `email: "abc"`, `valor: -100` |

## Anatomia de um teste (padrão AAA)
(simplificado a partir de `PaymentService.test.ts`)
```ts
it('registra a data real do pagamento', async () => {
  // Arrange (preparar)
  const payment = await service.create({ clientId, amountCents: 7000, dueDate: day('2026-09-10') });
  // Act (agir)
  const paid = await service.markAsPaid(payment.id, { method: 'PIX', paidAt: day('2026-09-12') });
  // Assert (verificar)
  expect(paid.status).toBe('PAGO');
  expect(paid.paidAt).toEqual(day('2026-09-12'));
});
```
- `describe` agrupa, `it` é um caso, `beforeEach` recria tudo antes de cada teste (testes não podem depender uns dos outros).
- Para erros assíncronos: `await expect(promise).rejects.toThrow(ConflictError)`.

## O que NÃO está testado (e é exercício)
- Os repositories Prisma (precisariam de um banco de teste).
- As rotas HTTP ponta a ponta (com `supertest`). A Fase 11 do plano pede para você criar esses testes.

> Regra de ouro: quando achar um bug, **primeiro** escreva um teste que falha por causa dele, **depois** corrija. O teste garante que ele não volta.
