/**
 * CONEXÃO COM O BANCO
 * -------------------
 * Criamos UMA única instância do PrismaClient para a aplicação inteira.
 * Cada PrismaClient mantém um "pool" de conexões com o MySQL; criar vários
 * esgotaria as conexões do banco.
 *
 * Este objeto é entregue aos repositories pelo container (src/container.ts).
 * Nenhuma outra camada importa o prisma diretamente.
 */
import { PrismaClient } from '@prisma/client';
import { env } from '../config/env';

export const prisma = new PrismaClient({
  log: env.NODE_ENV === 'development' ? ['warn', 'error'] : ['error'],
});
