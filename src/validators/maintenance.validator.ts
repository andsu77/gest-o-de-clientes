import { z } from 'zod';
import { MaintenanceStatus, enumValues } from '../models/enums';
import {
  idSchema,
  nonNegativeCents,
  nullableId,
  optionalId,
  optionalQuery,
  optionalText,
  requiredDate,
  requiredText,
} from './common';

export const createMaintenanceSchema = z.object({
  clientId: idSchema,
  siteId: nullableId,
  date: requiredDate,
  type: requiredText(2, 80),
  description: requiredText(3, 5000),
  status: z.enum(enumValues(MaintenanceStatus)).optional(),
  notes: optionalText(5000),
  chargedCents: z.preprocess((v) => (v === '' ? null : v), nonNegativeCents.nullable().optional()),
});

export const updateMaintenanceSchema = createMaintenanceSchema.omit({ clientId: true }).partial();

export const maintenanceFiltersSchema = z.object({
  clientId: optionalId,
  status: optionalQuery(z.enum(enumValues(MaintenanceStatus))),
});
