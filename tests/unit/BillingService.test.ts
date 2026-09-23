import { BillingService } from '../../src/services/BillingService';
import { RecurringBillingPolicy } from '../../src/models/RecurringBillingPolicy';
import {
  InMemoryClientRepository,
  InMemoryContractRepository,
  InMemoryPaymentRepository,
  InMemoryServiceRepository,
} from '../fakes/InMemoryRepositories';
import { day } from '../helpers';

describe('BillingService (geração de mensalidades)', () => {
  let contracts: InMemoryContractRepository;
  let payments: InMemoryPaymentRepository;
  let billing: BillingService;

  beforeEach(async () => {
    const clients = new InMemoryClientRepository();
    const services = new InMemoryServiceRepository();
    contracts = new InMemoryContractRepository(clients, services);
    payments = new InMemoryPaymentRepository(clients, contracts);
    billing = new BillingService(contracts, payments, new RecurringBillingPolicy());

    const client = await clients.create({ name: 'João' });
    const maintenance = await services.create({ name: 'Manutenção', priceCents: 7000, billingType: 'MENSAL' });
    await contracts.create({
      clientId: client.id,
      serviceId: maintenance.id,
      priceCents: 7000,
      billingType: 'MENSAL',
      startDate: day('2026-08-01'),
      dueDay: 10,
    });
    await contracts.create({
      clientId: client.id,
      serviceId: maintenance.id,
      priceCents: 50000,
      billingType: 'UNICA',
      startDate: day('2026-08-01'),
    });
  });

  it('gera uma mensalidade PENDENTE com vencimento no dia combinado', async () => {
    const result = await billing.generateForMonth({ year: 2026, month: 9 });

    expect(result.created).toBe(1); // o pagamento único NÃO gera mensalidade
    expect(payments.items[0].referenceMonth).toBe('2026-09');
    expect(payments.items[0].dueDate).toEqual(day('2026-09-10'));
    expect(payments.items[0].status).toBe('PENDENTE');
  });

  it('é idempotente: rodar de novo no mesmo mês não duplica', async () => {
    await billing.generateForMonth({ year: 2026, month: 9 });
    const second = await billing.generateForMonth({ year: 2026, month: 9 });

    expect(second.created).toBe(0);
    expect(second.skipped).toBe(1);
    expect(payments.items).toHaveLength(1);
  });

  it('sync gera o mês atual e marca atrasados', async () => {
    const result = await billing.sync(day('2026-09-15'));
    expect(result.created).toBe(1);
    expect(result.markedOverdue).toBe(1); // venceu dia 10, hoje é 15
  });
});
