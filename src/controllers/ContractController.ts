import type { Request, Response } from 'express';
import type { ContractService } from '../services/ContractService';
import { parseId } from '../validators/common';
import { contractFiltersSchema, createContractSchema, updateContractSchema } from '../validators/contract.validator';

export class ContractController {
  constructor(private readonly contractService: ContractService) {}

  index = async (req: Request, res: Response): Promise<void> => {
    res.json(await this.contractService.list(contractFiltersSchema.parse(req.query)));
  };

  show = async (req: Request, res: Response): Promise<void> => {
    res.json(await this.contractService.getById(parseId(req.params.id)));
  };

  store = async (req: Request, res: Response): Promise<void> => {
    res.status(201).json(await this.contractService.create(createContractSchema.parse(req.body)));
  };

  update = async (req: Request, res: Response): Promise<void> => {
    res.json(await this.contractService.update(parseId(req.params.id), updateContractSchema.parse(req.body)));
  };

  destroy = async (req: Request, res: Response): Promise<void> => {
    await this.contractService.delete(parseId(req.params.id));
    res.status(204).send();
  };
}
