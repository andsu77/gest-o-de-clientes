import { ConflictError, NotFoundError } from '../errors/AppError';
import type { Client } from '../models/entities';
import { PaymentStatus } from '../models/enums';
import type { ClientInput, ClientUpdateInput } from '../models/inputs';
import type { ClientFilters, ClientRepository, PaymentRepository } from '../repositories/interfaces';
import type { AuditService } from './AuditService';

/**
 * ClientService — REGRAS DE NEGÓCIO de clientes.
 *
 * Camadas (leia de cima para baixo):
 *   Controller  -> "chegou uma requisição HTTP, o que ela pede?"
 *   Service     -> "isso é permitido? quais regras se aplicam?"   <- VOCÊ ESTÁ AQUI
 *   Repository  -> "como busco/gravo isso no banco?"
 *
 * Exemplos de regra que moram aqui (e não no controller nem no repository):
 *   - não existe cliente com esse id? -> NotFoundError
 *   - cliente com pagamentos recebidos não pode ser excluído (histórico financeiro!)
 *   - toda criação/alteração relevante gera um registro no histórico
 */
export class ClientService {
  constructor(
    private readonly clients: ClientRepository,
    private readonly payments: PaymentRepository,
    private readonly audit: AuditService,
  ) {}

  async list(filters: ClientFilters = {}): Promise<Client[]> {
    return this.clients.findMany(filters);
  }

  async getById(id: number): Promise<Client> {
    const client = await this.clients.findById(id);
    // findById devolve null quando não acha. Transformamos o "null" em um
    // erro com significado — quem chamou não precisa ficar checando null.
    if (!client) throw new NotFoundError('Cliente');
    return client;
  }

  async create(input: ClientInput): Promise<Client> {
    const client = await this.clients.create(input);
    await this.audit.record({
      clientId: client.id,
      entity: 'client',
      entityId: client.id,
      action: 'CREATED',
      description: `Cliente cadastrado com status ${client.status}.`,
    });
    return client;
  }

  async update(id: number, input: ClientUpdateInput): Promise<Client> {
    const current = await this.getById(id); // lança NotFoundError se não existir
    const updated = await this.clients.update(id, input);

    if (input.status && input.status !== current.status) {
      await this.audit.record({
        clientId: id,
        entity: 'client',
        entityId: id,
        action: 'STATUS_CHANGED',
        description: `Status alterado de ${current.status} para ${updated.status}.`,
      });
    }
    return updated;
  }

  async delete(id: number): Promise<void> {
    const client = await this.getById(id);

    // REGRA DE NEGÓCIO: dinheiro recebido é histórico financeiro.
    // Apagar o cliente apagaria esses registros, então bloqueamos.
    const paidPayments = await this.payments.count({ clientId: id, status: [PaymentStatus.PAGO] });
    if (paidPayments > 0) {
      throw new ConflictError(
        'Este cliente possui pagamentos recebidos e não pode ser excluído. ' +
          'Altere o status para ENCERRADO para preservar o histórico financeiro.',
      );
    }

    await this.clients.delete(id);
    await this.audit.record({
      clientId: null, // o cliente não existe mais
      entity: 'client',
      entityId: id,
      action: 'DELETED',
      description: `Cliente "${client.name}" excluído.`,
    });
  }
}
