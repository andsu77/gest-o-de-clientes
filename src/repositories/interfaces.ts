/**
 * CONTRATOS DOS REPOSITORIES (Repository Pattern)
 * -----------------------------------------------
 * Um Repository é a ÚNICA camada que conversa com o banco. Ele esconde
 * "como" os dados são buscados (Prisma, SQL puro, memória...) e expõe
 * métodos com nomes do negócio: findById, findMany, sumAmount...
 *
 * Aqui ficam só as INTERFACES. As implementações reais (com Prisma) estão em
 * repositories/prisma/. Os services dependem destas interfaces, então:
 *   - em produção recebem PrismaClientRepository (banco real)
 *   - nos testes recebem InMemoryClientRepository (um array em memória)
 * Isso é abstração + injeção de dependência na prática.
 *
 * Todos os métodos retornam Promise<...>: acessar banco é uma operação
 * de E/S (entrada/saída) e leva tempo. O Node não fica parado esperando;
 * ele devolve uma Promise e segue atendendo outras requisições.
 */
import type {
  AuditLog,
  Client,
  Contact,
  Contract,
  ContractDetails,
  Maintenance,
  MaintenanceDetails,
  Payment,
  PaymentDetails,
  Service,
  Site,
  SiteDetails,
  User,
} from '../models/entities';
import type {
  BillingType,
  ClientStatus,
  ContactOutcome,
  ContractStatus,
  MaintenanceStatus,
  PaymentStatus,
  ServiceStatus,
  SiteStatus,
} from '../models/enums';
import type {
  AuditLogInput,
  ClientInput,
  ClientUpdateInput,
  ContactInput,
  ContactUpdateInput,
  ContractCreateData,
  ContractUpdateInput,
  MaintenanceInput,
  MaintenanceUpdateInput,
  PaymentCreateData,
  PaymentUpdateInput,
  ServiceInput,
  ServiceUpdateInput,
  SiteInput,
  SiteUpdateInput,
} from '../models/inputs';

// ----------------------------------------------------------------- Users
export interface UserRepository {
  findByEmail(email: string): Promise<User | null>;
  findById(id: number): Promise<User | null>;
  updatePasswordHash(id: number, passwordHash: string): Promise<void>;
}

// ----------------------------------------------------------------- Clients
export interface ClientFilters {
  search?: string; // procura em nome, email, telefone, WhatsApp e empresa
  status?: ClientStatus;
}

export interface ClientRepository {
  findMany(filters: ClientFilters): Promise<Client[]>;
  findById(id: number): Promise<Client | null>;
  create(data: ClientInput): Promise<Client>;
  update(id: number, data: ClientUpdateInput): Promise<Client>;
  delete(id: number): Promise<void>;
  countByStatus(): Promise<Record<ClientStatus, number>>;
}

// ----------------------------------------------------------------- Services (catálogo)
export interface ServiceFilters {
  status?: ServiceStatus;
}

export interface ServiceRepository {
  findMany(filters: ServiceFilters): Promise<Service[]>;
  findById(id: number): Promise<Service | null>;
  create(data: ServiceInput): Promise<Service>;
  update(id: number, data: ServiceUpdateInput): Promise<Service>;
  delete(id: number): Promise<void>;
  countContracts(serviceId: number): Promise<number>;
}

// ----------------------------------------------------------------- Contracts (client_services)
export interface ContractFilters {
  clientId?: number;
  status?: ContractStatus;
  billingType?: BillingType;
}

export interface ContractRepository {
  findMany(filters: ContractFilters): Promise<ContractDetails[]>;
  findById(id: number): Promise<ContractDetails | null>;
  /** Contratações ATIVAS e recorrentes (MENSAL/ANUAL): as que podem gerar cobrança. */
  findChargeable(): Promise<ContractDetails[]>;
  create(data: ContractCreateData): Promise<Contract>;
  update(id: number, data: ContractUpdateInput): Promise<Contract>;
  delete(id: number): Promise<void>;
}

// ----------------------------------------------------------------- Payments
export interface PaymentFilters {
  clientId?: number;
  contractId?: number;
  status?: PaymentStatus[];
  dueFrom?: Date; // vencimento a partir de (inclusive)
  dueTo?: Date; // vencimento até (inclusive)
  paidFrom?: Date;
  paidTo?: Date;
  /** true = apenas mensalidades/anuidades (cobranças com mês de referência) */
  recurringOnly?: boolean;
}

export interface PaymentListOptions {
  order?: 'asc' | 'desc'; // ordenação por vencimento
  limit?: number;
}

export interface PaymentRepository {
  findMany(filters: PaymentFilters, options?: PaymentListOptions): Promise<PaymentDetails[]>;
  findById(id: number): Promise<PaymentDetails | null>;
  create(data: PaymentCreateData): Promise<Payment>;
  update(id: number, data: PaymentUpdateInput & { referenceMonth?: string | null }): Promise<Payment>;
  count(filters: PaymentFilters): Promise<number>;
  sumAmount(filters: PaymentFilters): Promise<number>;
  existsForContractMonth(contractId: number, referenceMonth: string): Promise<boolean>;
  /** PENDENTE com vencimento anterior a "today" vira ATRASADO. Retorna quantos mudaram. */
  markOverdue(today: Date): Promise<number>;
}

// ----------------------------------------------------------------- Sites
export interface SiteFilters {
  clientId?: number;
  status?: SiteStatus;
}

export interface SiteRepository {
  findMany(filters: SiteFilters): Promise<SiteDetails[]>;
  findById(id: number): Promise<Site | null>;
  create(data: SiteInput): Promise<Site>;
  update(id: number, data: SiteUpdateInput): Promise<Site>;
  delete(id: number): Promise<void>;
}

// ----------------------------------------------------------------- Maintenance
export interface MaintenanceFilters {
  clientId?: number;
  status?: MaintenanceStatus;
}

export interface MaintenanceRepository {
  findMany(filters: MaintenanceFilters): Promise<MaintenanceDetails[]>;
  findById(id: number): Promise<Maintenance | null>;
  create(data: MaintenanceInput): Promise<Maintenance>;
  update(id: number, data: MaintenanceUpdateInput): Promise<Maintenance>;
  delete(id: number): Promise<void>;
}

// ----------------------------------------------------------------- Audit log
export interface AuditLogRepository {
  create(data: AuditLogInput): Promise<AuditLog>;
  findByClient(clientId: number, limit?: number): Promise<AuditLog[]>;
}

// ----------------------------------------------------------------- Contacts
export interface ContactFilters {
  search?: string;
  outcome?: ContactOutcome;
  messaged?: boolean;
}

export interface ContactRepository {
  findMany(filters: ContactFilters): Promise<Contact[]>;
  findById(id: number): Promise<Contact | null>;
  create(data: ContactInput): Promise<Contact>;
  update(id: number, data: ContactUpdateInput): Promise<Contact>;
  delete(id: number): Promise<void>;
}
