import type { PrismaClient } from '@prisma/client';
import type { User } from '../../models/entities';
import type { UserRepository } from '../interfaces';

/**
 * Implementação REAL do UserRepository usando Prisma.
 * O PrismaClient é recebido no construtor (injeção de dependência) em vez de
 * importado direto — assim fica explícito do que esta classe depende.
 */
export class PrismaUserRepository implements UserRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async findByEmail(email: string): Promise<User | null> {
    return this.prisma.user.findUnique({ where: { email: email.toLowerCase() } });
  }

  async findById(id: number): Promise<User | null> {
    return this.prisma.user.findUnique({ where: { id } });
  }

  async updatePasswordHash(id: number, passwordHash: string): Promise<void> {
    await this.prisma.user.update({ where: { id }, data: { passwordHash } });
  }
}
