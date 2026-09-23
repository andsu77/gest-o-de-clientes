# 06 — MVC (e as camadas extras)

## O MVC clássico
- **Model**: os dados e as regras.
- **View**: o que o usuário vê.
- **Controller**: recebe a ação do usuário, aciona o model, escolhe a view.

## Como isso aparece aqui

| MVC | Neste projeto |
|---|---|
| Model | `src/models/` (tipos + regras puras) **+** `src/services/` (regras que precisam de dados) **+** `src/repositories/` (acesso ao banco) |
| View | O **JSON** devolvido pela API + o front-end em `public/js/views/` que transforma esse JSON em tela |
| Controller | `src/controllers/` |

Numa aplicação que renderiza HTML no servidor (ex.: com EJS), a View seria um template. Aqui a API devolve JSON e o navegador desenha — isso é comum hoje e separa bem back-end de front-end.

## Por que "dividimos o M" em Model + Service + Repository?
- **Mais simples:** um "model" Prisma usado direto no controller: `await prisma.client.create(req.body)`.
- **Problemas num sistema real:**
  1. Regras (não excluir cliente com pagamento pago) ficariam espalhadas por controllers.
  2. Não dá para testar sem banco.
  3. O controller precisaria saber HTTP **e** SQL **e** regras.
- **Com camadas:** controller = HTTP, service = regra, repository = banco. Cada arquivo é pequeno e tem um motivo só para mudar.

## Um controller típico (`src/controllers/ClientController.ts`)
```ts
store = async (req: Request, res: Response): Promise<void> => {
  const data = createClientSchema.parse(req.body);   // 1. valida (400 se inválido)
  const client = await this.clientService.create(data); // 2. delega a regra
  res.status(201).json(client);                     // 3. responde
};
```
Três linhas, nenhuma regra de negócio. Se o controller começar a ter `if` de regra, esse código provavelmente pertence ao service.

## Teste rápido de responsabilidade
Pergunte "onde isso deveria ficar?":
- "Não pode pagar pagamento cancelado" → **service** (`PaymentService.markAsPaid`).
- "O e-mail precisa ter @" → **validator** (`client.validator.ts`).
- "Buscar clientes cujo nome contém 'jo'" → **repository** (`PrismaClientRepository.findMany`).
- "Responder 201" → **controller**.
- "Mensalidade anual só cobra no mês de aniversário" → **model** (`RecurringBillingPolicy.shouldChargeInMonth`) — regra pura, sem banco.
