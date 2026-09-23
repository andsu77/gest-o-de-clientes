# 03 — Programação Orientada a Objetos (de verdade)

Aqui a POO não é enfeite: cada classe existe porque resolve um problema. Para cada uma, responda sempre: **por que existe? qual responsabilidade? quem usa?**

## Classes principais

| Classe | Por que existe | Responsabilidade | Quem usa |
|---|---|---|---|
| `ClientService` (`src/services/`) | Centralizar as regras de clientes | criar, editar, excluir **com regras** (ex.: não excluir quem já pagou) | `ClientController` |
| `PaymentService` | Regras financeiras | registrar pagamento, impedir pagar cancelado | `PaymentController`, testes |
| `BillingService` | Gerar mensalidades | criar cobranças do mês sem duplicar | `PaymentController.generate`, `DashboardService` |
| `RecurringBillingPolicy` (`src/models/`) | Regra pura de recorrência | "esse contrato cobra neste mês? em que dia vence?" | `BillingService`, `DashboardService`, `FinanceService` |
| `PrismaClientRepository` | Isolar o banco | traduzir chamadas em consultas Prisma | `ClientService` (via interface) |
| `ClientController` | Camada HTTP | ler `req`, validar, chamar service, responder | `routes/index.ts` |
| `AppError` e filhas (`src/errors/`) | Erros com status HTTP | carregar mensagem + status | services, `errorHandler` |
| `BcryptPasswordHasher`, `JwtTokenProvider`, `SystemClock` | Adaptar bibliotecas externas | esconder bcrypt/JWT/relógio atrás de interfaces | `AuthService`, `container.ts` |

## Conceito por conceito, no código

### Classe, objeto, construtor
```ts
// src/services/ClientService.ts
export class ClientService {
  constructor(
    private readonly clients: ClientRepository,
    private readonly payments: PaymentRepository,
    private readonly audit: AuditService,
  ) {}
}
```
A **classe** é a planta; o **objeto** é criado em `src/container.ts` com `new ClientService(...)`. O **construtor** recebe tudo que o objeto precisa para funcionar.

`private readonly` no parâmetro é um atalho do TS: declara a propriedade, atribui e impede reatribuição.

### Encapsulamento
`private` impede que código de fora faça `clientService.clients.delete(...)` pulando as regras. A única porta de entrada é o método público `delete()`, que **antes** verifica se há pagamentos pagos.

### Interfaces e abstração
`src/repositories/interfaces.ts` define `ClientRepository` (o **quê**). `PrismaClientRepository` e `InMemoryClientRepository` (testes) são dois **comos** diferentes. O service só conhece a abstração.

Mesmo padrão em `src/providers/interfaces.ts`: `Clock`, `PasswordHasher`, `TokenProvider`.

### Herança (onde faz sentido)
`src/errors/AppError.ts`:
```ts
export class AppError extends Error { constructor(message, statusCode, code) }
export class NotFoundError extends AppError { /* status 404 */ }
export class ConflictError extends AppError { /* status 409 */ }
```
Faz sentido porque **todo** `NotFoundError` **é um** `AppError` e **é um** `Error`. O `errorHandler` usa `instanceof AppError` para tratar todos de uma vez.

> Por que não há herança nos services? Porque `ClientService` e `PaymentService` não "são" um tipo comum: eles **usam** coisas em comum. Isso é composição.

### Composição
`ClientService` **tem um** `AuditService`. Ele não herda nada — combina objetos menores. Regra prática: prefira composição; use herança só quando a frase "X **é um** Y" for verdadeira.

### Injeção de dependência (DI)
Nenhuma classe faz `new` das dependências dela. Quem monta é `src/container.ts`. Por quê?
- **Mais simples:** `const repo = new PrismaClientRepository()` dentro do service.
- **Problema:** aí o teste precisaria de MySQL real. Com DI, o teste injeta o fake:
```ts
// tests/unit/ClientService.test.ts
service = new ClientService(new InMemoryClientRepository(), payments, new AuditService(auditLogs));
```

### Métodos como arrow functions nos controllers
```ts
store = async (req, res) => { ... }
```
Por quê? O Express chama `controller.store` "solto", sem o objeto na frente, e um método comum perderia o `this`. Arrow functions capturam o `this` da instância. (Experimente trocar por método normal e veja o erro.)

## Onde ver tudo junto
Leia nesta ordem: `providers/interfaces.ts` → `providers/SystemClock.ts` → `services/AuthService.ts` → `container.ts` → `tests/unit/AuthService.test.ts`.
