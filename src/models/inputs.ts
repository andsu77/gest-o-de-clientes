/**
 * TIPOS DE ENTRADA (dados para criar/atualizar)
 * ---------------------------------------------
 * Separamos "o que existe no banco" (entities.ts) de "o que eu preciso
 * informar para criar" (este arquivo). Na criação não enviamos id,
 * createdAt, updatedAt — o banco gera.
 *
 * Os validators (Zod) produzem objetos exatamente neste formato, e os
 * services recebem esses tipos. Assim o service não precisa conhecer o Zod.
 *
 * "Partial<T>" = todos os campos de T viram opcionais (útil para PUT/edição).
 * "Omit<T, 'campo'>" = T sem aquele campo.
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

export interface ClientInput {
  name: string;
  company?: string | null;
  document?: string | null;
  phone?: string | null;
  whatsapp?: string | null;
  email?: string | null;
  address?: string | null;
  notes?: string | null;
  status?: ClientStatus;
}
export type ClientUpdateInput = Partial<ClientInput>;

export interface ServiceInput {
  name: string;
  description?: string | null;
  priceCents: number;
  billingType: BillingType;
  status?: ServiceStatus;
}
export type ServiceUpdateInput = Partial<ServiceInput>;

/** Na contratação, valor e tipo de cobrança são opcionais: se não vierem, copiamos do serviço. */
export interface ContractInput {
  clientId: number;
  serviceId: number;
  priceCents?: number;
  billingType?: BillingType;
  startDate: Date;
  endDate?: Date | null;
  dueDay?: number | null;
  status?: ContractStatus;
  notes?: string | null;
}
export type ContractUpdateInput = Partial<Omit<ContractInput, 'clientId' | 'serviceId'>>;

/** Dados completos que o repository precisa para gravar uma contratação. */
export interface ContractCreateData {
  clientId: number;
  serviceId: number;
  priceCents: number;
  billingType: BillingType;
  startDate: Date;
  endDate?: Date | null;
  dueDay?: number | null;
  status?: ContractStatus;
  notes?: string | null;
}

export interface PaymentInput {
  clientId: number;
  contractId?: number | null;
  amountCents: number;
  dueDate: Date;
  paidAt?: Date | null;
  status?: PaymentStatus;
  method?: PaymentMethod | null;
  description?: string | null;
  notes?: string | null;
}
export type PaymentUpdateInput = Partial<Omit<PaymentInput, 'clientId'>>;

/** Dados completos que o repository precisa para gravar um pagamento. */
export interface PaymentCreateData extends PaymentInput {
  status: PaymentStatus;
  referenceMonth?: string | null;
}

export interface MarkAsPaidInput {
  paidAt?: Date;
  method: PaymentMethod;
  notes?: string | null;
}

export interface SiteInput {
  clientId: number;
  projectName: string;
  domain?: string | null;
  url?: string | null;
  hosting?: string | null;
  publishedAt?: Date | null;
  status?: SiteStatus;
  notes?: string | null;
}
export type SiteUpdateInput = Partial<Omit<SiteInput, 'clientId'>>;

export interface MaintenanceInput {
  clientId: number;
  siteId?: number | null;
  date: Date;
  type: string;
  description: string;
  status?: MaintenanceStatus;
  notes?: string | null;
  chargedCents?: number | null;
}
export type MaintenanceUpdateInput = Partial<Omit<MaintenanceInput, 'clientId'>>;

export interface AuditLogInput {
  clientId: number | null;
  entity: string;
  entityId: number;
  action: string;
  description: string;
}

export interface ContactInput {
  name: string;
  phone?: string | null;
  email?: string | null;
  contactDate?: Date | null;
  messaged?: boolean;
  outcome?: ContactOutcome;
  notes?: string | null;
}
export type ContactUpdateInput = Partial<ContactInput>;
