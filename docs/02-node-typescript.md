# 02 — Node.js e TypeScript

## Node.js em uma frase
Node.js é o JavaScript rodando **fora do navegador** — aqui, como servidor web. Ele usa **um único thread** para o seu código e delega esperas (banco, rede, disco) ao sistema. Por isso tudo que "espera" é assíncrono (veja `04-programacao-assincrona.md`).

**Neste projeto:** `src/server.ts` é o primeiro arquivo executado. Ele conecta no banco, monta o app e chama `app.listen(3333)`.

## Como o código roda

| Comando | O que acontece |
|---|---|
| `npm run dev` | `tsx watch src/server.ts` — executa TypeScript direto, reinicia ao salvar |
| `npm run build` | `tsc` compila `src/` para JavaScript em `dist/` |
| `npm start` | `node dist/server.js` — roda o JavaScript compilado (produção) |
| `npm run typecheck` | só verifica tipos, não gera arquivos |

> O navegador e o Node **não entendem TypeScript**. O TS é removido antes de rodar: pelo `tsx` (desenvolvimento) ou pelo `tsc` (build). Os tipos só existem enquanto você programa.

## TypeScript: o que você vai ver aqui

### Tipos e interfaces
`src/models/entities.ts` descreve o formato dos dados:
```ts
export interface Client {
  id: number;
  company: string | null;   // union type: string OU null
  status: ClientStatus;     // só aceita os 4 status válidos
}
```

### Union types + `as const` no lugar de `enum`
`src/models/enums.ts`:
```ts
export const ClientStatus = { ATIVO: 'ATIVO', /* ... */ } as const;
export type ClientStatus = (typeof ClientStatus)[keyof typeof ClientStatus];
```
O mesmo nome é um **valor** (usado em runtime: `ClientStatus.ATIVO`) e um **tipo** (`status: ClientStatus`). Mais simples seria `status: string` — mas aí `'ATVO'` (erro de digitação) passaria sem aviso.

### Utility types
- `Omit<User, 'passwordHash'>` → `PublicUser` (em `entities.ts`): o tipo do usuário **sem** a senha. O TypeScript impede você de devolver o hash por engano.
- `Partial<T>` e `.partial()` do Zod: versões "tudo opcional" para edição (`updateClientSchema`).
- `z.infer<typeof schema>`: gera o tipo a partir do schema Zod (`client.validator.ts`).

### Tipos importados só como tipo
`import type { Clock } from '../providers/interfaces'` — some no JavaScript final. Útil para deixar claro "aqui só uso o tipo, não o valor".

### Estendendo tipos de bibliotecas
`src/types/express.d.ts` ensina ao TypeScript que `req.user` existe (o middleware `authenticate.ts` preenche). Isso se chama *declaration merging*.

### `strict: true`
Em `tsconfig.json`. Liga as verificações rígidas, principalmente `strictNullChecks`: se algo pode ser `null`, o TS obriga você a tratar. Ex.: `findById` devolve `Client | null`, e o `ClientService.getById` precisa lidar com o `null` (lança `NotFoundError`).

## Variáveis de ambiente
`src/config/env.ts` lê o `.env` (via `dotenv`) e **valida com Zod**. Se `DATABASE_URL` estiver faltando, o servidor para com uma mensagem clara em vez de falhar misteriosamente depois. Isso se chama *fail fast*.

## Onde estudar primeiro
1. `src/models/enums.ts` e `entities.ts` (tipos puros, sem nada de Node).
2. `src/utils/money.ts` e `dates.ts` (funções pequenas e tipadas).
3. `src/config/env.ts` (runtime + tipos juntos).
