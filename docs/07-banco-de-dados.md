# 07 — Banco de dados (MySQL + Prisma)

## Por que Prisma e não Sequelize?
Ambos são ORMs (traduzem objetos ⇄ tabelas). Escolhemos **Prisma** porque:
- O schema fica **num arquivo só e legível** (`prisma/schema.prisma`).
- Os tipos TypeScript são **gerados automaticamente** do schema: `prisma.client.findMany()` já sabe os campos. No Sequelize com TS você declara cada model duas vezes (classe + `init`), e é fácil os tipos ficarem diferentes do banco.
- Migrations geradas a partir do schema (`prisma migrate dev`).

Contra: o Prisma esconde mais o SQL. Por isso vale abrir a pasta `prisma/migrations/` depois de rodar a primeira migration e **ler o SQL gerado**. É o melhor material para aprender SQL a partir do seu próprio sistema.

## As tabelas

| Tabela | Model Prisma | O que guarda |
|---|---|---|
| `users` | `User` | administrador (senha só como hash bcrypt) |
| `clients` | `Client` | seus clientes |
| `services` | `Service` | catálogo: o que você vende e o preço padrão |
| `client_services` | `Contract` | **contratação**: cliente X contratou serviço Y por tal valor, cobrança, vencimento |
| `payments` | `Payment` | cada cobrança (única, avulsa ou mensalidade) |
| `sites` | `Site` | sites dos clientes |
| `maintenance` | `Maintenance` | manutenções executadas |
| `audit_logs` | `AuditLog` | histórico do cliente ("pagamento recebido", "status alterado") |

> Por que o model se chama `Contract` se a tabela é `client_services`? Porque já existe a classe `ClientService` (o service de clientes). Dois "ClientService" no mesmo projeto confundiriam. O `@@map("client_services")` mantém o nome pedido no banco.

## Relacionamentos
```
Client  1 ──── N  Contract (client_services)
Service 1 ──── N  Contract
Contract 1 ──── N Payment         (contractId é opcional: pagamento avulso não tem contrato)
Client  1 ──── N  Payment
Client  1 ──── N  Site
Client  1 ──── N  Maintenance
Site    1 ──── N  Maintenance     (opcional)
Client  1 ──── N  AuditLog
```

### Por que não um `servico_id` dentro de `clients`?
Porque um cliente tem **vários** serviços, e cada contratação tem dados **próprios** (valor negociado, dia de vencimento, início). Isso é um relacionamento **N:N com atributos** → vira uma tabela intermediária (`client_services`).

### O que acontece ao excluir (`onDelete`)
| Relação | Regra | Significado |
|---|---|---|
| Contract → Client | `Cascade` | apagou o cliente, apaga as contratações |
| Contract → Service | `Restrict` | o banco **recusa** apagar serviço já contratado |
| Payment → Contract | `SetNull` | o pagamento fica, só perde o vínculo |
| AuditLog → Client | `SetNull` | o histórico não some |

Mas atenção: o `ClientService.delete()` **não deixa** chegar ao cascade se houver pagamento PAGO — regra de negócio antes da regra do banco (dinheiro recebido não pode sumir do relatório).

## Regras garantidas pelo próprio banco
- `@@unique([contractId, referenceMonth])` em `payments`: impossível existir duas mensalidades do mesmo contrato no mesmo mês. Mesmo se o `BillingService` rodar duas vezes ao mesmo tempo, o MySQL recusa a segunda (erro `P2002`, tratado no `errorHandler`).
- `@@index(...)`: acelera buscas frequentes (`status`, `dueDate`).
- Campos `@db.Date`: data sem hora (vencimento).
- Dinheiro em `Int` (centavos). Nunca `Float` para dinheiro.

## Onde o SQL acontece
**Só** em `src/repositories/prisma/`. Exemplo de busca com `OR` (`PrismaClientRepository.findMany`): procura o texto em nome, e-mail, telefone, WhatsApp **ou** empresa. Nenhum service ou controller importa o Prisma.

Outro exemplo: `PrismaPaymentRepository.markOverdue()` faz um `updateMany` — um único `UPDATE ... WHERE status='PENDENTE' AND dueDate < hoje`, em vez de buscar e atualizar um por um.

## Migrations e seed
- `npx prisma migrate dev --name init` — lê o schema, gera o SQL em `prisma/migrations/` e aplica.
- `npm run db:seed` — roda `prisma/seed.ts`: apaga tudo e cria 5 clientes fictícios + admin. O seed **se recusa** a rodar com `NODE_ENV=production`.
- `npm run db:studio` — abre o Prisma Studio, uma interface para ver as tabelas no navegador. Ótimo para conferir o que a API gravou.
