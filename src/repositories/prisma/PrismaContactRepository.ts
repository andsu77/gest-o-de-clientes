import type { Prisma, PrismaClient } from '@prisma/client';
import type { Contact } from '../../models/entities';
import type { ContactInput, ContactUpdateInput } from '../../models/inputs';
import type { ContactFilters, ContactRepository } from '../interfaces';

export class PrismaContactRepository implements ContactRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async findMany(filters: ContactFilters): Promise<Contact[]> {
    const where: Prisma.ContactWhereInput = { outcome: filters.outcome, messaged: filters.messaged };
    if (filters.search) {
      const search = filters.search;
      where.OR = [
        { name: { contains: search } },
        { phone: { contains: search } },
        { email: { contains: search } },
      ];
    }
    return this.prisma.contact.findMany({
      where,
      // Quem ainda não recebeu mensagem aparece primeiro; depois por data prevista.
      orderBy: [{ messaged: 'asc' }, { contactDate: 'asc' }, { createdAt: 'desc' }],
    });
  }

  async findById(id: number): Promise<Contact | null> {
    return this.prisma.contact.findUnique({ where: { id } });
  }

  async create(data: ContactInput): Promise<Contact> {
    return this.prisma.contact.create({ data });
  }

  async update(id: number, data: ContactUpdateInput): Promise<Contact> {
    return this.prisma.contact.update({ where: { id }, data });
  }

  async delete(id: number): Promise<void> {
    await this.prisma.contact.delete({ where: { id } });
  }
}
