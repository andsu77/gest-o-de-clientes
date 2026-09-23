import type { Request, Response } from 'express';
import type { CatalogService } from '../services/CatalogService';
import { parseId } from '../validators/common';
import { createServiceSchema, serviceFiltersSchema, updateServiceSchema } from '../validators/service.validator';

export class CatalogController {
  constructor(private readonly catalogService: CatalogService) {}

  index = async (req: Request, res: Response): Promise<void> => {
    res.json(await this.catalogService.list(serviceFiltersSchema.parse(req.query)));
  };

  show = async (req: Request, res: Response): Promise<void> => {
    res.json(await this.catalogService.getById(parseId(req.params.id)));
  };

  store = async (req: Request, res: Response): Promise<void> => {
    res.status(201).json(await this.catalogService.create(createServiceSchema.parse(req.body)));
  };

  update = async (req: Request, res: Response): Promise<void> => {
    res.json(await this.catalogService.update(parseId(req.params.id), updateServiceSchema.parse(req.body)));
  };

  destroy = async (req: Request, res: Response): Promise<void> => {
    await this.catalogService.delete(parseId(req.params.id));
    res.status(204).send();
  };
}
