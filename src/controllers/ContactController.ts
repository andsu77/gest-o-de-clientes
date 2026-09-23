import type { Request, Response } from 'express';
import type { ContactService } from '../services/ContactService';
import { parseId } from '../validators/common';
import { contactFiltersSchema, createContactSchema, updateContactSchema } from '../validators/contact.validator';

export class ContactController {
  constructor(private readonly contactService: ContactService) {}

  index = async (req: Request, res: Response): Promise<void> => {
    res.json(await this.contactService.list(contactFiltersSchema.parse(req.query)));
  };

  show = async (req: Request, res: Response): Promise<void> => {
    res.json(await this.contactService.getById(parseId(req.params.id)));
  };

  store = async (req: Request, res: Response): Promise<void> => {
    res.status(201).json(await this.contactService.create(createContactSchema.parse(req.body)));
  };

  update = async (req: Request, res: Response): Promise<void> => {
    res.json(await this.contactService.update(parseId(req.params.id), updateContactSchema.parse(req.body)));
  };

  destroy = async (req: Request, res: Response): Promise<void> => {
    await this.contactService.delete(parseId(req.params.id));
    res.status(204).send();
  };
}
