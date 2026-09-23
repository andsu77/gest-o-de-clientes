import type { PrismaClient } from '@prisma/client';
import type { AuditLog } from '../../models/entities';
import type { AuditLogInput } from '../../models/inputs';
import type { AuditLogRepository } from '../interfaces';

export class PrismaAuditLogRepository implements AuditLogRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async create(data: AuditLogInput): Promise<AuditLog> {
    return this.prisma.auditLog.create({ data });
  }

  async findByClient(clientId: number, limit = 50): Promise<AuditLog[]> {
    return this.prisma.auditLog.findMany({
      where: { clientId },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
  }
}
