import type { Prisma, PrismaClient } from '@prisma/client';
import type { Payment, PaymentDetails } from '../../models/entities';
import { PaymentStatus } from '../../models/enums';
import type { PaymentCreateData, PaymentUpdateInput } from '../../models/inputs';
import type { PaymentFilters, PaymentListOptions, PaymentRepository } from '../interfaces';

const paymentInclude = {
  client: { select: { id: true, name: true } },
  contract: {
    select: {
      id: true,
      billingType: true,
      service: { select: { id: true, name: true } },
    },
  },
} satisfies Prisma.PaymentInclude;

export class PrismaPaymentRepository implements PaymentRepository {
  constructor(private readonly prisma: PrismaClient) {}

  /**
   * Traduz os filtros "do negócio" (PaymentFilters) para o formato do Prisma.
   * Centralizar isso evita repetir a mesma lógica em findMany, count e sumAmount.
   * Propriedades com valor undefined são ignoradas pelo Prisma (= sem filtro).
   */
  private buildWhere(filters: PaymentFilters): Prisma.PaymentWhereInput {
    return {
      clientId: filters.clientId,
      contractId: filters.contractId,
      status: filters.status ? { in: filters.status } : undefined,
      dueDate: filters.dueFrom || filters.dueTo ? { gte: filters.dueFrom, lte: filters.dueTo } : undefined,
      paidAt: filters.paidFrom || filters.paidTo ? { gte: filters.paidFrom, lte: filters.paidTo } : undefined,
      referenceMonth: filters.recurringOnly ? { not: null } : undefined,
    };
  }

  async findMany(filters: PaymentFilters, options: PaymentListOptions = {}): Promise<PaymentDetails[]> {
    return this.prisma.payment.findMany({
      where: this.buildWhere(filters),
      include: paymentInclude,
      orderBy: [{ dueDate: options.order ?? 'desc' }, { id: 'asc' }],
      take: options.limit,
    });
  }

  async findById(id: number): Promise<PaymentDetails | null> {
    return this.prisma.payment.findUnique({ where: { id }, include: paymentInclude });
  }

  async create(data: PaymentCreateData): Promise<Payment> {
    return this.prisma.payment.create({
      data: {
        clientId: data.clientId,
        contractId: data.contractId ?? null,
        amountCents: data.amountCents,
        dueDate: data.dueDate,
        paidAt: data.paidAt ?? null,
        status: data.status,
        method: data.method ?? null,
        referenceMonth: data.referenceMonth ?? null,
        description: data.description ?? null,
        notes: data.notes ?? null,
      },
    });
  }

  async update(id: number, data: PaymentUpdateInput & { referenceMonth?: string | null }): Promise<Payment> {
    return this.prisma.payment.update({ where: { id }, data });
  }

  async count(filters: PaymentFilters): Promise<number> {
    return this.prisma.payment.count({ where: this.buildWhere(filters) });
  }

  async sumAmount(filters: PaymentFilters): Promise<number> {
    // aggregate = SELECT SUM(amount_cents) FROM payments WHERE ...
    const result = await this.prisma.payment.aggregate({
      where: this.buildWhere(filters),
      _sum: { amountCents: true },
    });
    return result._sum.amountCents ?? 0; // SUM de nada é NULL no SQL
  }

  async existsForContractMonth(contractId: number, referenceMonth: string): Promise<boolean> {
    const found = await this.prisma.payment.findFirst({
      where: { contractId, referenceMonth },
      select: { id: true },
    });
    return found !== null;
  }

  async markOverdue(today: Date): Promise<number> {
    // updateMany = UPDATE payments SET status='ATRASADO' WHERE status='PENDENTE' AND due_date < hoje
    const result = await this.prisma.payment.updateMany({
      where: { status: PaymentStatus.PENDENTE, dueDate: { lt: today } },
      data: { status: PaymentStatus.ATRASADO },
    });
    return result.count;
  }
}
