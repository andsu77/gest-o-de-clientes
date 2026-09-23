import type { PrismaClient } from '@prisma/client';
import type { Service } from '../../models/entities';
import type { ServiceInput, ServiceUpdateInput } from '../../models/inputs';
import type { ServiceFilters, ServiceRepository } from '../interfaces';

export class PrismaServiceRepository implements ServiceRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async findMany(filters: ServiceFilters): Promise<Service[]> {
    return this.prisma.service.findMany({
      where: { status: filters.status }, // undefined = sem filtro
      orderBy: { name: 'asc' },
    });
  }

  async findById(id: number): Promise<Service | null> {
    return this.prisma.service.findUnique({ where: { id } });
  }

  async create(data: ServiceInput): Promise<Service> {
    return this.prisma.service.create({ data });
  }

  async update(id: number, data: ServiceUpdateInput): Promise<Service> {
    return this.prisma.service.update({ where: { id }, data });
  }

  async delete(id: number): Promise<void> {
    await this.prisma.service.delete({ where: { id } });
  }

  async countContracts(serviceId: number): Promise<number> {
    return this.prisma.contract.count({ where: { serviceId } });
  }
}
