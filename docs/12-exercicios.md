# 12 — Exercícios

Exercícios rápidos por tema, para fixar cada documento. (O `PLANO-DE-ESTUDO.md` tem a trilha completa, fase a fase.) **Sem respostas** — use o código, os comentários e os testes como guia. Dica: crie um branch Git para cada exercício (`git checkout -b ex-cpf`).

## Arquitetura (01)
1. Desenhe à mão o caminho de `DELETE /api/sites/5`, citando cada arquivo.
2. Para cada regra, diga em qual camada ela deve ficar: "telefone precisa ter 10+ dígitos"; "cliente ENCERRADO não pode receber nova contratação"; "listar sites ordenados por domínio".

## TypeScript (02)
3. Em `entities.ts`, crie um tipo `ClientSummary` com só `id`, `name` e `status` usando `Pick`.
4. Troque `strict` para `false` no `tsconfig.json`, rode `npm run typecheck`, depois volte para `true`. Anote quais erros o modo estrito pegaria.

## POO (03)
5. Crie uma classe `ConsoleAuditLogger` que implementa a mesma ideia de registro do `AuditService`, mas imprime no console. Onde você trocaria uma pela outra?
6. Crie `ForbiddenError` (status 403) herdando de `AppError`.

## Assíncrono (04)
7. Em `ClientOverviewService`, troque o `Promise.all` por 5 `await` seguidos. Meça o tempo com `console.time`. Depois volte.
8. Remova um `await` de propósito em `ClientService.getById` e descubra o que quebra (TS e testes).

## Express (05)
9. Crie `GET /api/stats/clients-by-status` que devolve só as contagens de clientes.
10. Adicione um middleware que registra no console `MÉTODO URL - duração ms` de cada requisição.

## MVC (06)
11. Encontre um lugar onde uma regra poderia ter "vazado" para o controller e explique por que não vazou.

## Banco (07)
12. Adicione `instagram` (opcional) em `Client`: schema → migration → entidade → validator → repository → front.
13. Leia o SQL gerado em `prisma/migrations/` e identifique onde está a restrição `UNIQUE(contractId, referenceMonth)`.

## API REST (08)
14. Crie `GET /api/payments/overdue` que lista só os atrasados. Você precisa de um service novo ou os existentes já resolvem?
15. Teste com curl um `POST /api/clients` inválido e explique cada item de `details`.

## Autenticação (09)
16. Faça o login retornar erro se o usuário tiver trocado a senha há menos de 1 minuto? (Pense se isso é uma boa regra — nem todo exercício é para implementar.)
17. Mude `JWT_EXPIRES_IN` para `1m` e observe o que acontece no painel depois de 1 minuto.

## Testes (10)
18. A regra "pagamento PAGO não pode ser cancelado" existe em `PaymentService.cancel`, mas ainda não tem teste. Escreva-o. Depois escreva outro provando que um PENDENTE pode ser cancelado.
19. Escreva um teste provando que o `BillingService` não gera cobrança para contratação ENCERRADA.

## Fluxo (11)
20. Coloque um `console.log` em cada camada (controller, service, repository) e acompanhe a ordem das mensagens ao registrar um pagamento.
