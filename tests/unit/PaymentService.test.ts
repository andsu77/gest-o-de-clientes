import { ConflictError, NotFoundError, ValidationError } from '../../src/errors/AppError';
import { AuditService } from '../../src/services/AuditService';
import { PaymentService } from '../../src/services/PaymentService';
import {
  InMemoryAuditLogRepository,
  InMemoryClientRepository,
  InMemoryContractRepository,
  InMemoryPaymentRepository,
  InMemoryServiceRepository,
} from '../fakes/InMemoryRepositories';
import { FixedClock } from '../fakes/FakeProviders';
import { day } from '../helpers';

describe('PaymentService', () => {
  let clients: InMemoryClientRepository;
  let contracts: InMemoryContractRepository;
  let payments: InMemoryPaymentRepository;
  let clock: FixedClock;
  let service: PaymentService;
  let clientId: number;

  beforeEach(async () => {
    clients = new InMemoryClientRepository();
    contracts = new InMemoryContractRepository(clients, new InMemoryServiceRepository());
    payments = new InMemoryPaymentRepository(clients, contracts);
    clock = new FixedClock(day('2026-09-15')); // "hoje" = 15/09/2026 em todos os testes
    service = new PaymentService(payments, clients, contracts, new AuditService(new InMemoryAuditLogRepository()), clock);
    clientId = (await clients.create({ name: 'João' })).id;
  });

  describe('create', () => {
    it('cria pagamento PENDENTE quando o vencimento é futuro', async () => {
      const payment = await service.create({ clientId, amountCents: 5000, dueDate: day('2026-09-30') });
      expect(payment.status).toBe('PENDENTE');
      expect(payment.paidAt).toBeNull();
    });

    it('cria pagamento ATRASADO quando o vencimento já passou', async () => {
      const payment = await service.create({ clientId, amountCents: 5000, dueDate: day('2026-09-01') });
      expect(payment.status).toBe('ATRASADO');
    });

    it('lança NotFoundError para cliente inexistente', async () => {
      await expect(
        service.create({ clientId: 999, amountCents: 5000, dueDate: day('2026-09-30') }),
      ).rejects.toBeInstanceOf(NotFoundError);
    });

    it('recusa contratação de outro cliente', async () => {
      const other = await clients.create({ name: 'Outro' });
      const contract = await contracts.create({
        clientId: other.id,
        serviceId: 1,
        priceCents: 7000,
        billingType: 'MENSAL',
        startDate: day('2026-01-01'),
      });
      await expect(
        service.create({ clientId, contractId: contract.id, amountCents: 7000, dueDate: day('2026-09-30') }),
      ).rejects.toBeInstanceOf(ValidationError);
    });
  });

  describe('markAsPaid (registrar pagamento)', () => {
    it('marca como PAGO e grava a data real do pagamento (hoje, por padrão)', async () => {
      const payment = await service.create({ clientId, amountCents: 7000, dueDate: day('2026-09-10') });
      const paid = await service.markAsPaid(payment.id, { method: 'PIX' });

      expect(paid.status).toBe('PAGO');
      expect(paid.method).toBe('PIX');
      expect(paid.paidAt).toEqual(day('2026-09-15'));
    });

    it('aceita uma data de pagamento informada', async () => {
      const payment = await service.create({ clientId, amountCents: 7000, dueDate: day('2026-09-10') });
      const paid = await service.markAsPaid(payment.id, { method: 'DINHEIRO', paidAt: day('2026-09-09') });
      expect(paid.paidAt).toEqual(day('2026-09-09'));
    });

    it('não permite pagar duas vezes', async () => {
      const payment = await service.create({ clientId, amountCents: 7000, dueDate: day('2026-09-20') });
      await service.markAsPaid(payment.id, { method: 'PIX' });
      await expect(service.markAsPaid(payment.id, { method: 'PIX' })).rejects.toBeInstanceOf(ConflictError);
    });

    it('não permite receber um pagamento cancelado', async () => {
      const payment = await service.create({ clientId, amountCents: 7000, dueDate: day('2026-09-20') });
      await service.cancel(payment.id);
      await expect(service.markAsPaid(payment.id, { method: 'PIX' })).rejects.toBeInstanceOf(ConflictError);
    });
  });

  it('list() marca como ATRASADO o que venceu', async () => {
    await service.create({ clientId, amountCents: 7000, dueDate: day('2026-09-20') });
    clock.set(day('2026-09-25')); // o tempo passou...
    const list = await service.list();
    expect(list[0].status).toBe('ATRASADO');
  });
});
