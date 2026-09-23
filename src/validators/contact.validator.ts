import { z } from 'zod';
import { ContactOutcome, enumValues } from '../models/enums';
import { nullableDate, optionalQuery, optionalText, requiredText } from './common';

/** Aceita true/false (JSON) e "true"/"false" (query string ou <select>). */
const booleanish = z.preprocess(
  (v) => (v === 'true' ? true : v === 'false' ? false : v),
  z.boolean(),
);

export const createContactSchema = z.object({
  name: requiredText(2, 120),
  phone: optionalText(30),
  email: z.preprocess(
    (v) => (typeof v === 'string' && v.trim() === '' ? null : v),
    z.string().trim().email('E-mail inválido.').max(160).nullable().optional(),
  ),
  contactDate: nullableDate,
  messaged: booleanish.optional(),
  outcome: z.enum(enumValues(ContactOutcome)).optional(),
  notes: optionalText(5000),
});

export const updateContactSchema = createContactSchema.partial();

export const contactFiltersSchema = z.object({
  search: optionalQuery(z.string().trim().max(100)),
  outcome: optionalQuery(z.enum(enumValues(ContactOutcome))),
  messaged: optionalQuery(booleanish),
});
