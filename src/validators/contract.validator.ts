import { z } from 'zod';
import { BillingType, ContractStatus, enumValues } from '../models/enums';
import { idSchema, nonNegativeCents, nullableDate, optionalId, optionalQuery, optionalText, requiredDate } from './common';

const dueDay = z.preprocess(
  (v) => (v === '' ? null : v),
  z.coerce.number().int().min(1).max(31).nullable().optional(),
);

export const createContractSchema = z.object({
  clientId: idSchema,
  serviceId: idSchema,
  priceCents: z.preprocess((v) => (v === '' || v === null ? undefined : v), nonNegativeCents.optional()),
  billingType: optionalQuery(z.enum(enumValues(BillingType))),
  startDate: requiredDate,
  endDate: nullableDate,
  dueDay,
  status: z.enum(enumValues(ContractStatus)).optional(),
  notes: optionalText(5000),
});

export const updateContractSchema = createContractSchema.omit({ clientId: true, serviceId: true }).partial();

export const contractFiltersSchema = z.object({
  clientId: optionalId,
  status: optionalQuery(z.enum(enumValues(ContractStatus))),
  billingType: optionalQuery(z.enum(enumValues(BillingType))),
});
