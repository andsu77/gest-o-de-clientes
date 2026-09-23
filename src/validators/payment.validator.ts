import { z } from 'zod';
import { PaymentMethod, PaymentStatus, enumValues } from '../models/enums';
import {
  idSchema,
  nullableDate,
  nullableId,
  optionalDate,
  optionalId,
  optionalQuery,
  optionalText,
  positiveCents,
  requiredDate,
} from './common';

const paymentStatus = z.enum(enumValues(PaymentStatus));
const paymentMethod = z.enum(enumValues(PaymentMethod));

export const createPaymentSchema = z.object({
  clientId: idSchema,
  contractId: nullableId,
  amountCents: positiveCents, // impede valor: -100 ou 0
  dueDate: requiredDate,
  paidAt: nullableDate,
  status: paymentStatus.optional(),
  method: z.preprocess((v) => (v === '' ? null : v), paymentMethod.nullable().optional()),
  description: optionalText(160),
  notes: optionalText(5000),
});

export const updatePaymentSchema = createPaymentSchema.omit({ clientId: true }).partial();

export const markAsPaidSchema = z.object({
  paidAt: optionalDate, // se não vier, o service usa "hoje"
  method: paymentMethod,
  notes: optionalText(5000),
});

export const paymentFiltersSchema = z.object({
  clientId: optionalId,
  status: optionalQuery(paymentStatus),
  from: optionalDate,
  to: optionalDate,
  recurring: optionalQuery(z.enum(['true', 'false'])),
});

export const generateChargesSchema = z.object({
  month: optionalQuery(z.string().regex(/^\d{4}-(0[1-9]|1[0-2])$/, 'Use o formato AAAA-MM.')),
});
