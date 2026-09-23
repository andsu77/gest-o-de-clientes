import type { PrismaClient } from '@prisma/client';
import type { Site, SiteDetails } from '../../models/entities';
import type { SiteInput, SiteUpdateInput } from '../../models/inputs';
import type { SiteFilters, SiteRepository } from '../interfaces';

export class PrismaSiteRepository implements SiteRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async findMany(filters: SiteFilters): Promise<SiteDetails[]> {
    return this.prisma.site.findMany({
      where: { clientId: filters.clientId, status: filters.status },
      include: { client: { select: { id: true, name: true } } },
      orderBy: { projectName: 'asc' },
    });
  }

  async findById(id: number): Promise<Site | null> {
    return this.prisma.site.findUnique({ where: { id } });
  }

  async create(data: SiteInput): Promise<Site> {
    return this.prisma.site.create({ data });
  }

  async update(id: number, data: SiteUpdateInput): Promise<Site> {
    return this.prisma.site.update({ where: { id }, data });
  }

  async delete(id: number): Promise<void> {
    await this.prisma.site.delete({ where: { id } });
  }
}
