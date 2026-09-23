/**
 * VARIÁVEIS DE AMBIENTE
 * ---------------------
 * "import 'dotenv/config'" lê o arquivo .env e coloca os valores em process.env.
 *
 * Problema: process.env é "tudo string | undefined". Se o JWT_SECRET estiver
 * faltando, o sistema subiria e só quebraria no primeiro login.
 *
 * Solução: validar TUDO na inicialização com Zod. Se algo estiver errado, o
 * servidor nem sobe e mostra exatamente o que corrigir ("fail fast").
 * O resultado (env) já vem tipado: env.PORT é number, não string.
 */
import 'dotenv/config';
import { z } from 'zod';

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.coerce.number().int().positive().default(3333),
  DATABASE_URL: z.string().min(1, 'DATABASE_URL é obrigatória (veja o .env.example).'),
  JWT_SECRET: z.string().min(32, 'JWT_SECRET precisa ter pelo menos 32 caracteres.'),
  JWT_EXPIRES_IN: z
    .string()
    .regex(/^\d+[smhd]$/, 'JWT_EXPIRES_IN deve ser algo como 30m, 8h ou 1d.')
    .default('8h'),
  CORS_ORIGIN: z.string().default('http://localhost:3333'),
  APP_TIMEZONE: z.string().default('America/Sao_Paulo'),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error('\n❌ Configuração inválida no arquivo .env:');
  for (const issue of parsed.error.issues) {
    console.error(`   - ${issue.path.join('.')}: ${issue.message}`);
  }
  console.error('\nDica: copie o .env.example para .env e preencha os valores.\n');
  process.exit(1);
}

export const env = parsed.data;
export type Env = typeof env;
