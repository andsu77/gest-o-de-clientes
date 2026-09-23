import type { PrismaClient } from '@prisma/client';
import type { Maintenance, MaintenanceDetails } from '../../models/entities';
import type { MaintenanceInput, MaintenanceUpdateInput } from '../../models/inputs';
import type { MaintenanceFilters, MaintenanceRepository } from '../interfaces';

export class PrismaMaintenanceRepository implements MaintenanceRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async findMany(filters: MaintenanceFilters): Promise<MaintenanceDetails[]> {
    return this.prisma.maintenance.findMany({
      where: { clientId: filters.clientId, status: filters.status },
      include: {
        client: { select: { id: true, name: true } },
        site: { select: { id: true, projectName: true } },
      },
      orderBy: { date: 'desc' },
    });
  }

  async findById(id: number): Promise<Maintenance | null> {
    return this.prisma.maintenance.findUnique({ where: { id } });
  }

  async create(data: MaintenanceInput): Promise<Maintenance> {
    return this.prisma.maintenance.create({ data });
  }

  async update(id: number, data: MaintenanceUpdateInput): Promise<Maintenance> {
    return this.prisma.maintenance.update({ where: { id }, data });
  }

  async delete(id: number): Promise<void> {
    await this.prisma.maintenance.delete({ where: { id } });
  }
}
