import { z } from 'zod';
import { PaymentStatus, enumValues } from '../models/enums';
import { optionalDate, optionalId, optionalQuery } from './common';

export const financeFiltersSchema = z.object({
  from: optionalDate,
  to: optionalDate,
  clientId: optionalId,
  status: optionalQuery(z.enum(enumValues(PaymentStatus))),
  year: optionalQuery(z.coerce.number().int().min(2000).max(2100)),
});
