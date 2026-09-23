/**
 * ENTIDADES DO DOMÍNIO
 * --------------------
 * "Interfaces" em TypeScript descrevem o FORMATO de um objeto.
 * Elas não existem em tempo de execução (somem ao compilar para JS):
 * servem para o compilador te avisar se você esquecer um campo ou
 * usar o tipo errado.
 *
 * Campos opcionais do banco são "string | null" (e não "?"), porque o
 * banco devolve null quando não há valor. Assim o tipo descreve a realidade.
 *
 * Dinheiro: sempre em CENTAVOS (number inteiro). Veja utils/money.ts.
 */
import type {
  BillingType,
  ClientStatus,
  ContactOutcome,
  ContractStatus,
  MaintenanceStatus,
  PaymentMethod,
  PaymentStatus,
  ServiceStatus,
  SiteStatus,
} from './enums';

export interface User {
  id: number;
  name: string;
  email: string;
  passwordHash: string;
  createdAt: Date;
  updatedAt: Date;
}

/** Usuário "seguro" para devolver na API: sem o hash da senha. */
export type PublicUser = Omit<User, 'passwordHash'>;

export interface Client {
  id: number;
  name: string;
  company: string | null;
  document: string | null;
  phone: string | null;
  whatsapp: string | null;
  email: string | null;
  address: string | null;
  notes: string | null;
  status: ClientStatus;
  createdAt: Date;
  updatedAt: Date;
}

/** Serviço do catálogo (o que você vende). */
export interface Service {
  id: number;
  name: string;
  description: string | null;
  priceCents: number;
  billingType: BillingType;
  status: ServiceStatus;
  createdAt: Date;
  updatedAt: Date;
}

/** Contratação: um cliente contratou um serviço, com condições próprias. */
export interface Contract {
  id: number;
  clientId: number;
  serviceId: number;
  priceCents: number;
  billingType: BillingType;
  startDate: Date;
  endDate: Date | null;
  dueDay: number | null;
  status: ContractStatus;
  notes: string | null;
  createdAt: Date;
  updatedAt: Date;
}

/** Contratação já com os nomes do cliente e do serviço (para exibir em telas). */
export interface ContractDetails extends Contract {
  client: { id: number; name: string };
  service: { id: number; name: string };
}

export interface Payment {
  id: number;
  clientId: number;
  contractId: number | null;
  amountCents: number;
  dueDate: Date;
  paidAt: Date | null;
  status: PaymentStatus;
  method: PaymentMethod | null;
  referenceMonth: string | null;
  description: string | null;
  notes: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface PaymentDetails extends Payment {
  client: { id: number; name: string };
  contract: { id: number; billingType: BillingType; service: { id: number; name: string } } | null;
}

export interface Site {
  id: number;
  clientId: number;
  projectName: string;
  domain: string | null;
  url: string | null;
  hosting: string | null;
  publishedAt: Date | null;
  status: SiteStatus;
  notes: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface SiteDetails extends Site {
  client: { id: number; name: string };
}

export interface Maintenance {
  id: number;
  clientId: number;
  siteId: number | null;
  date: Date;
  type: string;
  description: string;
  status: MaintenanceStatus;
  notes: string | null;
  chargedCents: number | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface MaintenanceDetails extends Maintenance {
  client: { id: number; name: string };
  site: { id: number; projectName: string } | null;
}

export interface AuditLog {
  id: number;
  clientId: number | null;
  entity: string;
  entityId: number;
  action: string;
  description: string;
  createdAt: Date;
}

/** Pessoa da lista de contatos (possível cliente futuro). */
export interface Contact {
  id: number;
  name: string;
  phone: string | null;
  email: string | null;
  contactDate: Date | null;
  messaged: boolean;
  outcome: ContactOutcome;
  notes: string | null;
  createdAt: Date;
  updatedAt: Date;
}
