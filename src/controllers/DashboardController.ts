import type { Request, Response } from 'express';
import type { DashboardService } from '../services/DashboardService';
import type { FinanceService } from '../services/FinanceService';
import { financeFiltersSchema } from '../validators/finance.validator';

/** Relatórios: tela inicial (dashboard) e página financeira. Só leitura. */
export class DashboardController {
  constructor(
    private readonly dashboardService: DashboardService,
    private readonly financeService: FinanceService,
  ) {}

  dashboard = async (_req: Request, res: Response): Promise<void> => {
    res.json(await this.dashboardService.getSummary());
  };

  finance = async (req: Request, res: Response): Promise<void> => {
    res.json(await this.financeService.getReport(financeFiltersSchema.parse(req.query)));
  };
}
