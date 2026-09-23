import type { AuditLog } from '../models/entities';
import type { AuditLogInput } from '../models/inputs';
import type { AuditLogRepository } from '../repositories/interfaces';

/**
 * AuditService — registra eventos importantes para o "Histórico" do cliente.
 *
 * Por que existe? Vários services precisam registrar eventos (cliente criado,
 * pagamento recebido, contratação encerrada). Em vez de cada um falar com a
 * tabela audit_logs, todos RECEBEM este service no construtor (composição).
 * Se um dia o histórico mudar (ex.: também enviar para um arquivo de log),
 * mudamos só aqui.
 */
export class AuditService {
  constructor(private readonly auditLogs: AuditLogRepository) {}

  async record(entry: AuditLogInput): Promise<void> {
    await this.auditLogs.create(entry);
  }

  async listByClient(clientId: number, limit = 50): Promise<AuditLog[]> {
    return this.auditLogs.findByClient(clientId, limit);
  }
}
