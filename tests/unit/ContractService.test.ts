import { ConflictError, ValidationError } from '../../src/errors/AppError';
import { RecurringBillingPolicy } from '../../src/models/RecurringBillingPolicy';
import { AuditService } from '../../src/services/AuditService';
import { ContractService } from '../../src/services/ContractService';
import {
  InMemoryAuditLogRepository,
  InMemoryClientRepository,
  InMemoryContractRepository,
  InMemoryPaymentRepository,
  InMemoryServiceRepository,
} from '../fakes/InMemoryRepositories';
import { day } from '../helpers';

describe('ContractService (pagamento único x recorrente)', () => {
  let clients: InMemoryClientRepository;
  let services: InMemoryServiceRepository;
  let payments: InMemoryPaymentRepository;
  let contractService: ContractService;

  beforeEach(() => {
    clients = new InMemoryClientRepository();
    services = new InMemoryServiceRepository();
    const contracts = new InMemoryContractRepository(clients, services);
    payments = new InMemoryPaymentRepository(clients, contracts);
    contractService = new ContractService(
      contracts,
      clients,
      services,
      payments,
      new AuditService(new InMemoryAuditLogRepository()),
      new RecurringBillingPolicy(),
    );
  });

  it('pagamento ÚNICO gera exatamente uma cobrança pendente', async () => {
    const client = await clients.create({ name: 'Cliente A' });
    const site = await services.create({ name: 'Criação de site', priceCents: 70000, billingType: 'UNICA' });

    await contractService.create({ clientId: client.id, serviceId: site.id, startDate: day('2026-09-05') });

    expect(payments.items).toHaveLength(1);
    expect(payments.items[0].amountCents).toBe(70000);
    expect(payments.items[0].dueDate).toEqual(day('2026-09-05'));
  });

  it('MENSAL não gera cobrança na criação e herda o dia de vencimento do início', async () => {
    const client = await clients.create({ name: 'Cliente B' });
    const maintenance = await services.create({ name: 'Manutenção', priceCents: 5000, billingType: 'MENSAL' });

    const contract = await contractService.create({
      clientId: client.id,
      serviceId: maintenance.id,
      startDate: day('2026-09-12'),
    });

    expect(payments.items).toHaveLength(0);
    expect(contract.dueDay).toBe(12);
    expect(contract.priceCents).toBe(5000); // copiado do catálogo
  });

  it('permite negociar um valor diferente do catálogo', async () => {
    const client = await clients.create({ name: 'Cliente C' });
    const maintenance = await services.create({ name: 'Manutenção', priceCents: 7000, billingType: 'MENSAL' });
    const contract = await contractService.create({
      clientId: client.id,
      serviceId: maintenance.id,
      priceCents: 5000,
      startDate: day('2026-09-01'),
    });
    expect(contract.priceCents).toBe(5000);
  });

  it('recusa término antes do início e serviço inativo', async () => {
    const client = await clients.create({ name: 'Cliente D' });
    const active = await services.create({ name: 'Hospedagem', priceCents: 3000, billingType: 'MENSAL' });
    const inactive = await services.create({ name: 'Antigo', priceCents: 1000, billingType: 'MENSAL', status: 'INATIVO' });

    await expect(
      contractService.create({ clientId: client.id, serviceId: active.id, startDate: day('2026-09-10'), endDate: day('2026-09-01') }),
    ).rejects.toBeInstanceOf(ValidationError);
    await expect(
      contractService.create({ clientId: client.id, serviceId: inactive.id, startDate: day('2026-09-10') }),
    ).rejects.toBeInstanceOf(ConflictError);
  });
});
