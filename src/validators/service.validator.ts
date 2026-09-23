import { z } from 'zod';
import { BillingType, ServiceStatus, enumValues } from '../models/enums';
import { nonNegativeCents, optionalQuery, optionalText, requiredText } from './common';

export const createServiceSchema = z.object({
  name: requiredText(2, 120),
  description: optionalText(5000),
  priceCents: nonNegativeCents,
  billingType: z.enum(enumValues(BillingType)),
  status: z.enum(enumValues(ServiceStatus)).optional(),
});

export const updateServiceSchema = createServiceSchema.partial();

export const serviceFiltersSchema = z.object({
  status: optionalQuery(z.enum(enumValues(ServiceStatus))),
});
