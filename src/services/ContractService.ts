import { ConflictError, NotFoundError, ValidationError } from '../errors/AppError';
import type { Contract, ContractDetails } from '../models/entities';
import { BillingType, ContractStatus, PaymentStatus, ServiceStatus } from '../models/enums';
import type { ContractInput, ContractUpdateInput } from '../models/inputs';
import type { RecurringBillingPolicy } from '../models/RecurringBillingPolicy';
import type {
  ClientRepository,
  ContractFilters,
  ContractRepository,
  PaymentRepository,
  ServiceRepository,
} from '../repositories/interfaces';
import { formatCents } from '../utils/money';
import type { AuditService } from './AuditService';

/**
 * ContractService — contratações (cliente + serviço, a tabela client_services).
 *
 * Regras importantes:
 *  - valor e tipo de cobrança podem ser negociados: se não vierem, copiamos do catálogo
 *  - recorrentes (MENSAL/ANUAL) precisam de dia de vencimento (padrão: dia do início)
 *  - PAGAMENTO ÚNICO gera automaticamente UMA cobrança pendente
 *  - MENSAL/ANUAL NÃO geram cobrança aqui: quem gera é o BillingService, mês a mês
 */
export class ContractService {
  constructor(
    private readonly contracts: ContractRepository,
    private readonly clients: ClientRepository,
    private readonly services: ServiceRepository,
    private readonly payments: PaymentRepository,
    private readonly audit: AuditService,
    private readonly billingPolicy: RecurringBillingPolicy,
  ) {}

  async list(filters: ContractFilters = {}): Promise<ContractDetails[]> {
    return this.contracts.findMany(filters);
  }

  async getById(id: number): Promise<ContractDetails> {
    const contract = await this.contracts.findById(id);
    if (!contract) throw new NotFoundError('Contratação');
    return contract;
  }

  async create(input: ContractInput): Promise<Contract> {
    // Duas buscas independentes: Promise.all dispara as duas AO MESMO TEMPO
    // e espera ambas terminarem. Mais rápido do que um await depois do outro.
    const [client, service] = await Promise.all([
      this.clients.findById(input.clientId),
      this.services.findById(input.serviceId),
    ]);
    if (!client) throw new NotFoundError('Cliente');
    if (!service) throw new NotFoundError('Serviço');
    if (service.status === ServiceStatus.INATIVO) {
      throw new ConflictError('Este serviço está INATIVO e não pode ser contratado.');
    }

    // "??" (nullish coalescing): usa o da direita só se o da esquerda for null/undefined.
    const billingType = input.billingType ?? service.billingType;
    const priceCents = input.priceCents ?? service.priceCents;
    const dueDay = this.billingPolicy.isRecurring(billingType)
      ? (input.dueDay ?? input.startDate.getUTCDate())
      : (input.dueDay ?? null);

    this.ensureValidPeriod(input.startDate, input.endDate ?? null);

    const contract = await this.contracts.create({
      clientId: client.id,
      serviceId: service.id,
      priceCents,
      billingType,
      startDate: input.startDate,
      endDate: input.endDate ?? null,
      dueDay,
      status: input.status ?? ContractStatus.ATIVO,
      notes: input.notes ?? null,
    });

    // Pagamento único: a obrigação financeira nasce junto com a contratação.
    if (billingType === BillingType.UNICA) {
      await this.payments.create({
        clientId: client.id,
        contractId: contract.id,
        amountCents: priceCents,
        dueDate: input.startDate,
        status: PaymentStatus.PENDENTE,
        description: `${service.name} (pagamento único)`,
      });
    }

    await this.audit.record({
      clientId: client.id,
      entity: 'contract',
      entityId: contract.id,
      action: 'CREATED',
      description: `Contratou "${service.name}" — ${formatCents(priceCents)} (${billingType}).`,
    });

    return contract;
  }

  async update(id: number, input: ContractUpdateInput): Promise<Contract> {
    const current = await this.getById(id);

    const startDate = input.startDate ?? current.startDate;
    const endDate = input.endDate === undefined ? current.endDate : input.endDate;
    this.ensureValidPeriod(startDate, endDate);

    const updated = await this.contracts.update(id, input);

    if (input.status && input.status !== current.status) {
      await this.audit.record({
        clientId: current.clientId,
        entity: 'contract',
        entityId: id,
        action: 'STATUS_CHANGED',
        description: `Contratação "${current.service.name}": ${current.status} → ${input.status}.`,
      });
    }
    return updated;
  }

  async delete(id: number): Promise<void> {
    const contract = await this.getById(id);
    const payments = await this.payments.count({ contractId: id });
    if (payments > 0) {
      throw new ConflictError(
        'Esta contratação já possui cobranças. Altere o status para ENCERRADO em vez de excluir.',
      );
    }
    await this.contracts.delete(id);
    await this.audit.record({
      clientId: contract.clientId,
      entity: 'contract',
      entityId: id,
      action: 'DELETED',
      description: `Contratação "${contract.service.name}" excluída.`,
    });
  }

  private ensureValidPeriod(startDate: Date, endDate: Date | null): void {
    if (endDate && endDate < startDate) {
      throw new ValidationError('A data de término não pode ser anterior à data de início.');
    }
  }
}
