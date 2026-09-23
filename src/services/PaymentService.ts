import { ConflictError, NotFoundError, ValidationError } from '../errors/AppError';
import type { Payment, PaymentDetails } from '../models/entities';
import { PaymentStatus } from '../models/enums';
import type { MarkAsPaidInput, PaymentInput, PaymentUpdateInput } from '../models/inputs';
import type { Clock } from '../providers/interfaces';
import type {
  ClientRepository,
  ContractRepository,
  PaymentFilters,
  PaymentListOptions,
  PaymentRepository,
} from '../repositories/interfaces';
import { formatCents } from '../utils/money';
import type { AuditService } from './AuditService';

/**
 * PaymentService — cobranças e recebimentos.
 *
 * Ciclo de vida de um pagamento:
 *
 *   PENDENTE --(venceu e não pagou)--> ATRASADO
 *      |                                  |
 *      +-------(markAsPaid)---------------+--> PAGO (grava a data real)
 *      |
 *      +--(cancel)--> CANCELADO
 *
 * O Clock é injetado: em produção é o relógio real, nos testes é um relógio fixo.
 */
export class PaymentService {
  constructor(
    private readonly payments: PaymentRepository,
    private readonly clients: ClientRepository,
    private readonly contracts: ContractRepository,
    private readonly audit: AuditService,
    private readonly clock: Clock,
  ) {}

  async list(filters: PaymentFilters = {}, options?: PaymentListOptions): Promise<PaymentDetails[]> {
    // Antes de listar, atualiza quem venceu e ficou para trás.
    await this.payments.markOverdue(this.clock.today());
    return this.payments.findMany(filters, options);
  }

  async getById(id: number): Promise<PaymentDetails> {
    const payment = await this.payments.findById(id);
    if (!payment) throw new NotFoundError('Pagamento');
    return payment;
  }

  async create(input: PaymentInput): Promise<Payment> {
    const client = await this.clients.findById(input.clientId);
    if (!client) throw new NotFoundError('Cliente');

    if (input.contractId) {
      const contract = await this.contracts.findById(input.contractId);
      if (!contract) throw new NotFoundError('Contratação');
      if (contract.clientId !== input.clientId) {
        throw new ValidationError('Esta contratação pertence a outro cliente.');
      }
    }

    const today = this.clock.today();
    const isPaid = input.status === PaymentStatus.PAGO || Boolean(input.paidAt);

    let status: PaymentStatus;
    if (isPaid) status = PaymentStatus.PAGO;
    else if (input.status) status = input.status;
    else status = input.dueDate < today ? PaymentStatus.ATRASADO : PaymentStatus.PENDENTE;

    return this.payments.create({
      ...input, // "spread": copia todas as propriedades de input
      status,
      paidAt: isPaid ? (input.paidAt ?? today) : null,
    });
  }

  async update(id: number, input: PaymentUpdateInput): Promise<Payment> {
    const current = await this.getById(id);
    const data: PaymentUpdateInput = { ...input };

    // Mantém status e data de pagamento coerentes entre si.
    if (input.status === PaymentStatus.PAGO && !input.paidAt && !current.paidAt) {
      data.paidAt = this.clock.today();
    }
    if (input.status && input.status !== PaymentStatus.PAGO) {
      data.paidAt = null;
    }
    return this.payments.update(id, data);
  }

  /** Registrar um recebimento. É aqui que a DATA REAL do pagamento é gravada. */
  async markAsPaid(id: number, input: MarkAsPaidInput): Promise<Payment> {
    const payment = await this.getById(id);

    if (payment.status === PaymentStatus.PAGO) {
      throw new ConflictError('Este pagamento já está registrado como pago.');
    }
    if (payment.status === PaymentStatus.CANCELADO) {
      throw new ConflictError('Não é possível receber um pagamento cancelado.');
    }

    const paidAt = input.paidAt ?? this.clock.today();
    const updated = await this.payments.update(id, {
      status: PaymentStatus.PAGO,
      paidAt,
      method: input.method,
      notes: input.notes ?? payment.notes,
    });

    await this.audit.record({
      clientId: payment.clientId,
      entity: 'payment',
      entityId: id,
      action: 'PAID',
      description: `Pagamento recebido: ${formatCents(payment.amountCents)} via ${input.method}.`,
    });
    return updated;
  }

  async cancel(id: number): Promise<Payment> {
    const payment = await this.getById(id);
    if (payment.status === PaymentStatus.PAGO) {
      throw new ConflictError('Pagamentos já recebidos não podem ser cancelados.');
    }
    const updated = await this.payments.update(id, { status: PaymentStatus.CANCELADO, paidAt: null });
    await this.audit.record({
      clientId: payment.clientId,
      entity: 'payment',
      entityId: id,
      action: 'CANCELED',
      description: `Cobrança de ${formatCents(payment.amountCents)} cancelada.`,
    });
    return updated;
  }
}
