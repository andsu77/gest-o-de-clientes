import type { Prisma, PrismaClient } from '@prisma/client';
import type { Contract, ContractDetails } from '../../models/entities';
import { BillingType, ContractStatus } from '../../models/enums';
import type { ContractCreateData, ContractUpdateInput } from '../../models/inputs';
import type { ContractFilters, ContractRepository } from '../interfaces';

/**
 * "include" traz dados de tabelas relacionadas na mesma consulta (JOIN).
 * Aqui trazemos só id e nome do cliente e do serviço — nada além do necessário.
 * "satisfies" confere o formato sem perder os tipos exatos para o Prisma.
 */
const contractInclude = {
  client: { select: { id: true, name: true } },
  service: { select: { id: true, name: true } },
} satisfies Prisma.ContractInclude;

export class PrismaContractRepository implements ContractRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async findMany(filters: ContractFilters): Promise<ContractDetails[]> {
    return this.prisma.contract.findMany({
      where: { clientId: filters.clientId, status: filters.status, billingType: filters.billingType },
      include: contractInclude,
      orderBy: [{ status: 'asc' }, { startDate: 'desc' }],
    });
  }

  async findById(id: number): Promise<ContractDetails | null> {
    return this.prisma.contract.findUnique({ where: { id }, include: contractInclude });
  }

  async findChargeable(): Promise<ContractDetails[]> {
    return this.prisma.contract.findMany({
      where: {
        status: ContractStatus.ATIVO,
        billingType: { in: [BillingType.MENSAL, BillingType.ANUAL] },
      },
      include: contractInclude,
    });
  }

  async create(data: ContractCreateData): Promise<Contract> {
    return this.prisma.contract.create({
      data: {
        clientId: data.clientId,
        serviceId: data.serviceId,
        priceCents: data.priceCents,
        billingType: data.billingType,
        startDate: data.startDate,
        endDate: data.endDate ?? null,
        dueDay: data.dueDay ?? null,
        status: data.status,
        notes: data.notes ?? null,
      },
    });
  }

  async update(id: number, data: ContractUpdateInput): Promise<Contract> {
    return this.prisma.contract.update({ where: { id }, data });
  }

  async delete(id: number): Promise<void> {
    await this.prisma.contract.delete({ where: { id } });
  }
}
