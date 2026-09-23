import { z } from 'zod';
import { SiteStatus, enumValues } from '../models/enums';
import { idSchema, nullableDate, optionalId, optionalQuery, optionalText, requiredText } from './common';

export const createSiteSchema = z.object({
  clientId: idSchema,
  projectName: requiredText(2, 120),
  domain: optionalText(160),
  url: z.preprocess(
    (v) => (typeof v === 'string' && v.trim() === '' ? null : v),
    z.string().trim().url('URL inválida (ex.: https://meusite.com.br).').max(255).nullable().optional(),
  ),
  hosting: optionalText(120),
  publishedAt: nullableDate,
  status: z.enum(enumValues(SiteStatus)).optional(),
  notes: optionalText(5000),
});

export const updateSiteSchema = createSiteSchema.omit({ clientId: true }).partial();

export const siteFiltersSchema = z.object({
  clientId: optionalId,
  status: optionalQuery(z.enum(enumValues(SiteStatus))),
});
