import type { Request, Response } from 'express';
import type { Clock } from '../providers/interfaces';
import type { BillingService } from '../services/BillingService';
import type { PaymentService } from '../services/PaymentService';
import { parseYearMonth, toYearMonth } from '../utils/dates';
import { parseId } from '../validators/common';
import {
  createPaymentSchema,
  generateChargesSchema,
  markAsPaidSchema,
  paymentFiltersSchema,
  updatePaymentSchema,
} from '../validators/payment.validator';

export class PaymentController {
  constructor(
    private readonly paymentService: PaymentService,
    private readonly billingService: BillingService,
    private readonly clock: Clock,
  ) {}

  /** GET /api/payments?status=ATRASADO&clientId=3&from=2026-09-01&to=2026-09-30&recurring=true */
  index = async (req: Request, res: Response): Promise<void> => {
    const query = paymentFiltersSchema.parse(req.query);
    const payments = await this.paymentService.list({
      clientId: query.clientId,
      status: query.status ? [query.status] : undefined,
      dueFrom: query.from,
      dueTo: query.to,
      recurringOnly: query.recurring === 'true',
    });
    res.json(payments);
  };

  show = async (req: Request, res: Response): Promise<void> => {
    res.json(await this.paymentService.getById(parseId(req.params.id)));
  };

  store = async (req: Request, res: Response): Promise<void> => {
    res.status(201).json(await this.paymentService.create(createPaymentSchema.parse(req.body)));
  };

  update = async (req: Request, res: Response): Promise<void> => {
    res.json(await this.paymentService.update(parseId(req.params.id), updatePaymentSchema.parse(req.body)));
  };

  /** POST /api/payments/:id/pay  { "method": "PIX", "paidAt": "2026-09-10" } */
  pay = async (req: Request, res: Response): Promise<void> => {
    res.json(await this.paymentService.markAsPaid(parseId(req.params.id), markAsPaidSchema.parse(req.body)));
  };

  cancel = async (req: Request, res: Response): Promise<void> => {
    res.json(await this.paymentService.cancel(parseId(req.params.id)));
  };

  /** POST /api/billing/generate  { "month": "2026-10" }  (sem month = mês atual) */
  generate = async (req: Request, res: Response): Promise<void> => {
    const { month } = generateChargesSchema.parse(req.body ?? {});
    const reference = month ? parseYearMonth(month) : toYearMonth(this.clock.today());
    res.json(await this.billingService.generateForMonth(reference));
  };
}
