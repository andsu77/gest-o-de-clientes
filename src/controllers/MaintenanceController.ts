import type { Request, Response } from 'express';
import type { MaintenanceService } from '../services/MaintenanceService';
import { parseId } from '../validators/common';
import {
  createMaintenanceSchema,
  maintenanceFiltersSchema,
  updateMaintenanceSchema,
} from '../validators/maintenance.validator';

export class MaintenanceController {
  constructor(private readonly maintenanceService: MaintenanceService) {}

  index = async (req: Request, res: Response): Promise<void> => {
    res.json(await this.maintenanceService.list(maintenanceFiltersSchema.parse(req.query)));
  };

  show = async (req: Request, res: Response): Promise<void> => {
    res.json(await this.maintenanceService.getById(parseId(req.params.id)));
  };

  store = async (req: Request, res: Response): Promise<void> => {
    res.status(201).json(await this.maintenanceService.create(createMaintenanceSchema.parse(req.body)));
  };

  update = async (req: Request, res: Response): Promise<void> => {
    res.json(await this.maintenanceService.update(parseId(req.params.id), updateMaintenanceSchema.parse(req.body)));
  };

  destroy = async (req: Request, res: Response): Promise<void> => {
    await this.maintenanceService.delete(parseId(req.params.id));
    res.status(204).send();
  };
}
