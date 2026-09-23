import type { Request, Response } from 'express';
import type { ClientOverviewService } from '../services/ClientOverviewService';
import type { ClientService } from '../services/ClientService';
import { clientFiltersSchema, createClientSchema, updateClientSchema } from '../validators/client.validator';
import { parseId } from '../validators/common';

/**
 * Convenção de nomes (inspirada em frameworks MVC como Laravel/Rails):
 *   index   -> GET    /clients       (listar)
 *   show    -> GET    /clients/:id   (detalhar)
 *   store   -> POST   /clients       (criar)
 *   update  -> PUT    /clients/:id   (editar)
 *   destroy -> DELETE /clients/:id   (excluir)
 */
export class ClientController {
  constructor(
    private readonly clientService: ClientService,
    private readonly overviewService: ClientOverviewService,
  ) {}

  index = async (req: Request, res: Response): Promise<void> => {
    const filters = clientFiltersSchema.parse(req.query);
    res.json(await this.clientService.list(filters));
  };

  show = async (req: Request, res: Response): Promise<void> => {
    res.json(await this.clientService.getById(parseId(req.params.id)));
  };

  /** Ficha completa: dados + contratações + sites + pagamentos + manutenções + histórico. */
  overview = async (req: Request, res: Response): Promise<void> => {
    res.json(await this.overviewService.getOverview(parseId(req.params.id)));
  };

  store = async (req: Request, res: Response): Promise<void> => {
    const data = createClientSchema.parse(req.body);
    const client = await this.clientService.create(data);
    res.status(201).json(client); // 201 Created: algo novo foi criado
  };

  update = async (req: Request, res: Response): Promise<void> => {
    const data = updateClientSchema.parse(req.body);
    res.json(await this.clientService.update(parseId(req.params.id), data));
  };

  destroy = async (req: Request, res: Response): Promise<void> => {
    await this.clientService.delete(parseId(req.params.id));
    res.status(204).send(); // 204 No Content: deu certo, sem corpo de resposta
  };
}
