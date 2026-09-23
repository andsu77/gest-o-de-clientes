# 04 — Programação assíncrona

> Este é o tema mais importante do projeto. Leia com calma e com o código aberto ao lado.

## O problema
Uma consulta ao MySQL pode levar 5 ms ou 500 ms. Se o Node **parasse** esperando, nenhuma outra requisição seria atendida nesse tempo. A solução: começar a operação, **seguir fazendo outras coisas**, e continuar quando o resultado chegar.

## Promise
Uma `Promise` é um "vale" para um valor que ainda vai existir. Estados: **pendente** → **resolvida** (deu certo, com valor) ou **rejeitada** (deu erro).

Todo método de repository devolve Promise:
```ts
// src/repositories/interfaces.ts
findById(id: number): Promise<Client | null>;
```

## async / await
```ts
// src/services/ClientService.ts
async getById(id: number): Promise<Client> {
  const client = await this.clients.findById(id);  // (1)
  if (!client) throw new NotFoundError('Cliente não encontrado.'); // (2)
  return client; // (3)
}
```
1. `await` **pausa esta função** até a Promise resolver. O Node não fica parado: atende outras requisições.
2. `throw` dentro de `async` vira uma **Promise rejeitada**.
3. `return` dentro de `async` vira uma **Promise resolvida**. Por isso o tipo é `Promise<Client>`, mesmo retornando `client`.

**Erro clássico:** esquecer o `await`. `const client = this.clients.findById(id)` guarda a *Promise*, não o cliente — e `if (!client)` nunca é verdadeiro. O TypeScript ajuda: `client.name` daria erro de tipo.

## A cadeia inteira de awaits
Quando você salva um cliente:
```
ClientController.store   await clientService.create(data)
  ClientService.create     await clients.create(input)
    PrismaClientRepository   await prisma.client.create(...)
      MySQL  ──── executa INSERT ────
    ← devolve o registro
  ← await audit.record(...)  (grava no histórico)
← res.status(201).json(client)
```
Cada nível espera o de baixo. Se o MySQL falhar, a rejeição **sobe** por todos os `await` até chegar ao Express.

## try/catch — e por que os controllers não têm
O Express 5 (usado aqui) percebe quando um handler `async` rejeita e envia o erro para o `errorHandler` automaticamente. Então:
- **Mais simples (Express 4):** `try { ... } catch (e) { next(e) }` em todo controller.
- **Aqui:** zero try/catch nos controllers; todo erro cai em `src/middlewares/errorHandler.ts`.

Onde usamos try/catch de propósito? Em `src/server.ts`, para mostrar uma mensagem amigável se o MySQL estiver desligado:
```ts
try { await prisma.$connect(); } catch (error) { console.error('Não foi possível conectar...'); process.exit(1); }
```
Regra: use try/catch **quando você sabe o que fazer com o erro**. Se não sabe, deixe subir.

## Sequencial × paralelo (`Promise.all`)
```ts
// src/services/ClientOverviewService.ts (simplificado)
const [contracts, payments, sites, maintenances, history] = await Promise.all([
  this.contracts.findMany({ clientId }),
  this.payments.findMany({ clientId }, { order: 'desc' }),
  this.sites.findMany({ clientId }),
  this.maintenances.findMany({ clientId }),
  this.audit.listByClient(clientId),
]);
```
As 5 consultas são **independentes**, então disparamos todas de uma vez e esperamos o conjunto. Com 5 `await` seguidos, o tempo seria a **soma**; com `Promise.all`, é o tempo da **mais lenta**. Mesma técnica em `DashboardService` e `FinanceService`.

Contra-exemplo consciente: `BillingService.generateForMonth` usa `for...of` com `await` — uma contratação por vez. É mais lento, mas mais simples de entender e não dispara dezenas de escritas simultâneas. O comentário no arquivo explica.

> Se uma das Promises do `Promise.all` rejeitar, o `Promise.all` inteiro rejeita. Existe `Promise.allSettled` para quando você quer o resultado de todas mesmo com falhas.

## No front-end também
`public/js/api.js` usa `await fetch(...)`. Mesmo conceito: o navegador não trava enquanto a API responde.

## Teste assíncrono
```ts
await expect(service.getById(999)).rejects.toThrow(NotFoundError);
```
(`tests/unit/ClientService.test.ts`) — `rejects` espera a Promise ser rejeitada.

## Exercício mental
Abra `DashboardService.getSummary()` e responda: quais `await` poderiam rodar em paralelo e quais **precisam** ser sequenciais? Depois confira sua resposta com os comentários do próprio arquivo.
