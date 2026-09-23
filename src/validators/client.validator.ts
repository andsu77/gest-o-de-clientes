import { z } from 'zod';
import { ClientStatus, enumValues } from '../models/enums';
import { optionalQuery, optionalText, requiredText } from './common';

const clientStatus = z.enum(enumValues(ClientStatus));

export const createClientSchema = z.object({
  name: requiredText(2, 120),
  company: optionalText(120),
  document: z.preprocess(
    (v) => (typeof v === 'string' && v.trim() === '' ? null : v),
    z
      .string()
      .trim()
      .regex(/^[\d.\-/ ]{11,20}$/, 'CPF/CNPJ inválido (use só números e pontuação).')
      .nullable()
      .optional(),
  ),
  phone: optionalText(30),
  whatsapp: optionalText(30),
  email: z.preprocess(
    (v) => (typeof v === 'string' && v.trim() === '' ? null : v),
    z.string().trim().toLowerCase().email('E-mail inválido.').max(160).nullable().optional(),
  ),
  address: optionalText(255),
  notes: optionalText(5000),
  status: clientStatus.optional(),
});

/** .partial() = mesmo schema, mas com todos os campos opcionais (edição parcial). */
export const updateClientSchema = createClientSchema.partial();

export const clientFiltersSchema = z.object({
  search: optionalQuery(z.string().trim().max(100)),
  status: optionalQuery(clientStatus),
});

// z.infer gera o tipo TypeScript a partir do schema — uma única fonte da verdade.
export type CreateClientBody = z.infer<typeof createClientSchema>;
