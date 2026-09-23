/**
 * REPOSITORIES EM MEMÓRIA (para testes)
 * -------------------------------------
 * Implementam as MESMAS interfaces dos repositories reais, mas guardam tudo
 * em arrays. Os services não percebem a diferença — esse é o poder de
 * programar para interfaces.
 *
 * Vantagens nos testes:
 *  - não precisa de MySQL rodando
 *  - cada teste começa com dados limpos
 *  - roda em milissegundos
 */
import type {
  AuditLog,
  Client,
  Contract,
  ContractDetails,
  Payment,
  PaymentDetails,
  Service,
  User,
} from '../../src/models/entities';
import { ClientStatus, ContractStatus, PaymentStatus, ServiceStatus } from '../../src/models/enums';
import type {
  AuditLogInput,
  ClientInput,
  ClientUpdateInput,
  ContractCreateData,
  ContractUpdateInput,
  PaymentCreateData,
  PaymentUpdateInput,
  ServiceInput,
  ServiceUpdateInput,
} from '../../src/models/inputs';
import type {
  AuditLogRepository,
  ClientFilters,
  ClientRepository,
  ContractFilters,
  ContractRepository,
  PaymentFilters,
  PaymentListOptions,
  PaymentRepository,
  ServiceFilters,
  ServiceRepository,
  UserRepository,
} from '../../src/repositories/interfaces';

const now = () => new Date('2026-09-15T12:00:00.000Z');

export class InMemoryClientRepository implements ClientRepository {
  public items: Client[] = [];
  private nextId = 1;

  async findMany(filters: ClientFilters): Promise<Client[]> {
    const search = filters.search?.toLowerCase();
    return this.items.filter((client) => {
      if (filters.status && client.status !== filters.status) return false;
      if (!search) return true;
      return [client.name, client.email, client.phone, client.whatsapp, client.company]
        .some((field) => field?.toLowerCase().includes(search));
    });
  }

  async findById(id: number): Promise<Client | null> {
    return this.items.find((client) => client.id === id) ?? null;
  }

  async create(data: ClientInput): Promise<Client> {
    const client: Client = {
      id: this.nextId++,
      name: data.name,
      company: data.company ?? null,
      document: data.document ?? null,
      phone: data.phone ?? null,
      whatsapp: data.whatsapp ?? null,
      email: data.email ?? null,
      address: data.address ?? null,
      notes: data.notes ?? null,
      status: data.status ?? ClientStatus.ATIVO,
      createdAt: now(),
      updatedAt: now(),
    };
    this.items.push(client);
    return client;
  }

  async update(id: number, data: ClientUpdateInput): Promise<Client> {
    const index = this.items.findIndex((client) => client.id === id);
    const updated = { ...this.items[index], ...stripUndefined(data), updatedAt: now() } as Client;
    this.items[index] = updated;
    return updated;
  }

  async delete(id: number): Promise<void> {
    this.items = this.items.filter((client) => client.id !== id);
  }

  async countByStatus(): Promise<Record<ClientStatus, number>> {
    const counts = { ATIVO: 0, INADIMPLENTE: 0, PAUSADO: 0, ENCERRADO: 0 };
    for (const client of this.items) counts[client.status]++;
    return counts;
  }
}

export class InMemoryServiceRepository implements ServiceRepository {
  public items: Service[] = [];
  public contractCounts = new Map<number, number>();
  private nextId = 1;

  async findMany(filters: ServiceFilters): Promise<Service[]> {
    return this.items.filter((s) => !filters.status || s.status === filters.status);
  }
  async findById(id: number): Promise<Service | null> {
    return this.items.find((s) => s.id === id) ?? null;
  }
  async create(data: ServiceInput): Promise<Service> {
    const service: Service = {
      id: this.nextId++,
      name: data.name,
      description: data.description ?? null,
      priceCents: data.priceCents,
      billingType: data.billingType,
      status: data.status ?? ServiceStatus.ATIVO,
      createdAt: now(),
      updatedAt: now(),
    };
    this.items.push(service);
    return service;
  }
  async update(id: number, data: ServiceUpdateInput): Promise<Service> {
    const index = this.items.findIndex((s) => s.id === id);
    this.items[index] = { ...this.items[index], ...stripUndefined(data) } as Service;
    return this.items[index];
  }
  async delete(id: number): Promise<void> {
    this.items = this.items.filter((s) => s.id !== id);
  }
  async countContracts(serviceId: number): Promise<number> {
    return this.contractCounts.get(serviceId) ?? 0;
  }
}

export class InMemoryContractRepository implements ContractRepository {
  public items: Contract[] = [];
  private nextId = 1;

  constructor(
    private readonly clients: InMemoryClientRepository,
    private readonly services: InMemoryServiceRepository,
  ) {}

  private withDetails(contract: Contract): ContractDetails {
    const client = this.clients.items.find((c) => c.id === contract.clientId);
    const service = this.services.items.find((s) => s.id === contract.serviceId);
    return {
      ...contract,
      client: { id: contract.clientId, name: client?.name ?? '?' },
      service: { id: contract.serviceId, name: service?.name ?? '?' },
    };
  }

  async findMany(filters: ContractFilters): Promise<ContractDetails[]> {
    return this.items
      .filter((c) => !filters.clientId || c.clientId === filters.clientId)
      .filter((c) => !filters.status || c.status === filters.status)
      .filter((c) => !filters.billingType || c.billingType === filters.billingType)
      .map((c) => this.withDetails(c));
  }
  async findById(id: number): Promise<ContractDetails | null> {
    const contract = this.items.find((c) => c.id === id);
    return contract ? this.withDetails(contract) : null;
  }
  async findChargeable(): Promise<ContractDetails[]> {
    return this.items
      .filter((c) => c.status === ContractStatus.ATIVO && (c.billingType === 'MENSAL' || c.billingType === 'ANUAL'))
      .map((c) => this.withDetails(c));
  }
  async create(data: ContractCreateData): Promise<Contract> {
    const contract: Contract = {
      id: this.nextId++,
      clientId: data.clientId,
      serviceId: data.serviceId,
      priceCents: data.priceCents,
      billingType: data.billingType,
      startDate: data.startDate,
      endDate: data.endDate ?? null,
      dueDay: data.dueDay ?? null,
      status: data.status ?? ContractStatus.ATIVO,
      notes: data.notes ?? null,
      createdAt: now(),
      updatedAt: now(),
    };
    this.items.push(contract);
    return contract;
  }
  async update(id: number, data: ContractUpdateInput): Promise<Contract> {
    const index = this.items.findIndex((c) => c.id === id);
    this.items[index] = { ...this.items[index], ...stripUndefined(data) } as Contract;
    return this.items[index];
  }
  async delete(id: number): Promise<void> {
    this.items = this.items.filter((c) => c.id !== id);
  }
}

export class InMemoryPaymentRepository implements PaymentRepository {
  public items: Payment[] = [];
  private nextId = 1;

  constructor(
    private readonly clients: InMemoryClientRepository,
    private readonly contracts?: InMemoryContractRepository,
  ) {}

  private withDetails(payment: Payment): PaymentDetails {
    const client = this.clients.items.find((c) => c.id === payment.clientId);
    const contract = this.contracts?.items.find((c) => c.id === payment.contractId);
    return {
      ...payment,
      client: { id: payment.clientId, name: client?.name ?? '?' },
      contract: contract
        ? { id: contract.id, billingType: contract.billingType, service: { id: contract.serviceId, name: '?' } }
        : null,
    };
  }

  private matches(payment: Payment, f: PaymentFilters): boolean {
    if (f.clientId && payment.clientId !== f.clientId) return false;
    if (f.contractId && payment.contractId !== f.contractId) return false;
    if (f.status && !f.status.includes(payment.status)) return false;
    if (f.dueFrom && payment.dueDate < f.dueFrom) return false;
    if (f.dueTo && payment.dueDate > f.dueTo) return false;
    if (f.paidFrom && (!payment.paidAt || payment.paidAt < f.paidFrom)) return false;
    if (f.paidTo && (!payment.paidAt || payment.paidAt > f.paidTo)) return false;
    if (f.recurringOnly && payment.referenceMonth === null) return false;
    return true;
  }

  async findMany(filters: PaymentFilters, options: PaymentListOptions = {}): Promise<PaymentDetails[]> {
    const direction = options.order === 'asc' ? 1 : -1;
    const result = this.items
      .filter((p) => this.matches(p, filters))
      .sort((a, b) => (a.dueDate.getTime() - b.dueDate.getTime()) * direction)
      .map((p) => this.withDetails(p));
    return options.limit ? result.slice(0, options.limit) : result;
  }
  async findById(id: number): Promise<PaymentDetails | null> {
    const payment = this.items.find((p) => p.id === id);
    return payment ? this.withDetails(payment) : null;
  }
  async create(data: PaymentCreateData): Promise<Payment> {
    const payment: Payment = {
      id: this.nextId++,
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
      createdAt: now(),
      updatedAt: now(),
    };
    this.items.push(payment);
    return payment;
  }
  async update(id: number, data: PaymentUpdateInput & { referenceMonth?: string | null }): Promise<Payment> {
    const index = this.items.findIndex((p) => p.id === id);
    this.items[index] = { ...this.items[index], ...stripUndefined(data) } as Payment;
    return this.items[index];
  }
  async count(filters: PaymentFilters): Promise<number> {
    return this.items.filter((p) => this.matches(p, filters)).length;
  }
  async sumAmount(filters: PaymentFilters): Promise<number> {
    return this.items.filter((p) => this.matches(p, filters)).reduce((total, p) => total + p.amountCents, 0);
  }
  async existsForContractMonth(contractId: number, referenceMonth: string): Promise<boolean> {
    return this.items.some((p) => p.contractId === contractId && p.referenceMonth === referenceMonth);
  }
  async markOverdue(today: Date): Promise<number> {
    let changed = 0;
    for (const payment of this.items) {
      if (payment.status === PaymentStatus.PENDENTE && payment.dueDate < today) {
        payment.status = PaymentStatus.ATRASADO;
        changed++;
      }
    }
    return changed;
  }
}

export class InMemoryAuditLogRepository implements AuditLogRepository {
  public items: AuditLog[] = [];
  async create(data: AuditLogInput): Promise<AuditLog> {
    const log: AuditLog = { id: this.items.length + 1, ...data, createdAt: now() };
    this.items.push(log);
    return log;
  }
  async findByClient(clientId: number): Promise<AuditLog[]> {
    return this.items.filter((log) => log.clientId === clientId);
  }
}

export class InMemoryUserRepository implements UserRepository {
  public items: User[] = [];
  async findByEmail(email: string): Promise<User | null> {
    return this.items.find((u) => u.email === email) ?? null;
  }
  async findById(id: number): Promise<User | null> {
    return this.items.find((u) => u.id === id) ?? null;
  }
  async updatePasswordHash(id: number, passwordHash: string): Promise<void> {
    const user = this.items.find((u) => u.id === id);
    if (user) user.passwordHash = passwordHash;
  }
}

/** Remove chaves com valor undefined (como o Prisma faz: undefined = "não alterar"). */
function stripUndefined<T extends object>(data: T): Partial<T> {
  return Object.fromEntries(Object.entries(data).filter(([, value]) => value !== undefined)) as Partial<T>;
}
