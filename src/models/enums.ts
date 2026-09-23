/**
 * ENUMS DO DOMÍNIO
 * ----------------
 * Aqui definimos os valores permitidos para cada status/tipo usando
 * "const objects" + "union types".
 *
 * Por que não importar os enums gerados pelo Prisma?
 * Porque queremos que as regras de negócio (services, models) NÃO dependam
 * do ORM. Se amanhã você trocar Prisma por Sequelize, estas regras continuam
 * iguais. Isso se chama "desacoplamento". Como os valores são as mesmas
 * strings do schema.prisma, o TypeScript aceita um no lugar do outro.
 *
 * Padrão usado:
 *   export const ClientStatus = { ATIVO: 'ATIVO', ... } as const;
 *   export type ClientStatus = (typeof ClientStatus)[keyof typeof ClientStatus];
 *
 * - O objeto (valor) serve em tempo de execução: ClientStatus.ATIVO, listas, validação.
 * - O type (tipo) serve em tempo de compilação: status: ClientStatus.
 * - "as const" faz o TS entender 'ATIVO' como o literal 'ATIVO' e não string genérica.
 */

export const ClientStatus = {
  ATIVO: 'ATIVO',
  INADIMPLENTE: 'INADIMPLENTE',
  PAUSADO: 'PAUSADO',
  ENCERRADO: 'ENCERRADO',
} as const;
export type ClientStatus = (typeof ClientStatus)[keyof typeof ClientStatus];

export const BillingType = {
  UNICA: 'UNICA',
  MENSAL: 'MENSAL',
  ANUAL: 'ANUAL',
  PERSONALIZADA: 'PERSONALIZADA',
} as const;
export type BillingType = (typeof BillingType)[keyof typeof BillingType];

export const ServiceStatus = {
  ATIVO: 'ATIVO',
  INATIVO: 'INATIVO',
} as const;
export type ServiceStatus = (typeof ServiceStatus)[keyof typeof ServiceStatus];

export const ContractStatus = {
  ATIVO: 'ATIVO',
  PAUSADO: 'PAUSADO',
  ENCERRADO: 'ENCERRADO',
} as const;
export type ContractStatus = (typeof ContractStatus)[keyof typeof ContractStatus];

export const PaymentStatus = {
  PENDENTE: 'PENDENTE',
  PAGO: 'PAGO',
  ATRASADO: 'ATRASADO',
  CANCELADO: 'CANCELADO',
} as const;
export type PaymentStatus = (typeof PaymentStatus)[keyof typeof PaymentStatus];

export const PaymentMethod = {
  PIX: 'PIX',
  DINHEIRO: 'DINHEIRO',
  CARTAO: 'CARTAO',
  TRANSFERENCIA: 'TRANSFERENCIA',
  OUTRO: 'OUTRO',
} as const;
export type PaymentMethod = (typeof PaymentMethod)[keyof typeof PaymentMethod];

export const SiteStatus = {
  DESENVOLVIMENTO: 'DESENVOLVIMENTO',
  ONLINE: 'ONLINE',
  PAUSADO: 'PAUSADO',
  ENCERRADO: 'ENCERRADO',
} as const;
export type SiteStatus = (typeof SiteStatus)[keyof typeof SiteStatus];

export const MaintenanceStatus = {
  ABERTA: 'ABERTA',
  EM_ANDAMENTO: 'EM_ANDAMENTO',
  CONCLUIDA: 'CONCLUIDA',
} as const;
export type MaintenanceStatus = (typeof MaintenanceStatus)[keyof typeof MaintenanceStatus];

/**
 * Transforma o objeto em uma tupla não-vazia de valores — formato exigido
 * pelo Zod: z.enum(enumValues(ClientStatus))
 */
export function enumValues<T extends Record<string, string>>(
  enumObject: T,
): [T[keyof T], ...T[keyof T][]] {
  return Object.values(enumObject) as [T[keyof T], ...T[keyof T][]];
}

export const ContactOutcome = {
  AGUARDANDO: 'AGUARDANDO',
  DEU_CERTO: 'DEU_CERTO',
  NAO_DEU_CERTO: 'NAO_DEU_CERTO',
} as const;
export type ContactOutcome = (typeof ContactOutcome)[keyof typeof ContactOutcome];
