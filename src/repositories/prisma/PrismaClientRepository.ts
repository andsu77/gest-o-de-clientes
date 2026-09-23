import type { Prisma, PrismaClient } from '@prisma/client';
import type { Client } from '../../models/entities';
import { ClientStatus } from '../../models/enums';
import type { ClientInput, ClientUpdateInput } from '../../models/inputs';
import type { ClientFilters, ClientRepository } from '../interfaces';

/**
 * Repository de clientes com Prisma.
 *
 * Repare que o SQL nunca aparece: o Prisma gera o SQL a partir destes objetos.
 * Por exemplo, findMany({ where: { status: 'ATIVO' } }) vira:
 *     SELECT * FROM clients WHERE status = 'ATIVO' ORDER BY name ASC;
 * Rode o servidor com NODE_ENV=development e ative log: ['query'] em
 * database/prisma.ts se quiser VER o SQL gerado.
 */
export class PrismaClientRepository implements ClientRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async findMany(filters: ClientFilters): Promise<Client[]> {
    const where: Prisma.ClientWhereInput = {};
    if (filters.status) where.status = filters.status;

    if (filters.search) {
      // No MySQL, "contains" já ignora maiúsculas/minúsculas (collation padrão).
      const search = filters.search;
      where.OR = [
        { name: { contains: search } },
        { email: { contains: search } },
        { phone: { contains: search } },
        { whatsapp: { contains: search } },
        { company: { contains: search } },
      ];
    }

    return this.prisma.client.findMany({ where, orderBy: { name: 'asc' } });
  }

  async findById(id: number): Promise<Client | null> {
    return this.prisma.client.findUnique({ where: { id } });
  }

  async create(data: ClientInput): Promise<Client> {
    return this.prisma.client.create({ data });
  }

  async update(id: number, data: ClientUpdateInput): Promise<Client> {
    return this.prisma.client.update({ where: { id }, data });
  }

  async delete(id: number): Promise<void> {
    await this.prisma.client.delete({ where: { id } });
  }

  async countByStatus(): Promise<Record<ClientStatus, number>> {
    // groupBy = SELECT status, COUNT(*) FROM clients GROUP BY status
    const rows = await this.prisma.client.groupBy({ by: ['status'], _count: { _all: true } });

    // Começa tudo com 0 (status sem clientes não aparecem no GROUP BY).
    const counts: Record<ClientStatus, number> = {
      ATIVO: 0,
      INADIMPLENTE: 0,
      PAUSADO: 0,
      ENCERRADO: 0,
    };
    for (const row of rows) counts[row.status] = row._count._all;
    return counts;
  }
}
