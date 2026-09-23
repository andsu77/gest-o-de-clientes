import type { Request, Response } from 'express';
import type { SiteService } from '../services/SiteService';
import { parseId } from '../validators/common';
import { createSiteSchema, siteFiltersSchema, updateSiteSchema } from '../validators/site.validator';

export class SiteController {
  constructor(private readonly siteService: SiteService) {}

  index = async (req: Request, res: Response): Promise<void> => {
    res.json(await this.siteService.list(siteFiltersSchema.parse(req.query)));
  };

  show = async (req: Request, res: Response): Promise<void> => {
    res.json(await this.siteService.getById(parseId(req.params.id)));
  };

  store = async (req: Request, res: Response): Promise<void> => {
    res.status(201).json(await this.siteService.create(createSiteSchema.parse(req.body)));
  };

  update = async (req: Request, res: Response): Promise<void> => {
    res.json(await this.siteService.update(parseId(req.params.id), updateSiteSchema.parse(req.body)));
  };

  destroy = async (req: Request, res: Response): Promise<void> => {
    await this.siteService.delete(parseId(req.params.id));
    res.status(204).send();
  };
}
