import { NotFoundError, ValidationError } from '../errors/AppError';
import type { Maintenance, MaintenanceDetails } from '../models/entities';
import type { MaintenanceInput, MaintenanceUpdateInput } from '../models/inputs';
import type {
  ClientRepository,
  MaintenanceFilters,
  MaintenanceRepository,
  SiteRepository,
} from '../repositories/interfaces';

/** MaintenanceService — registro das manutenções feitas para cada cliente/site. */
export class MaintenanceService {
  constructor(
    private readonly maintenances: MaintenanceRepository,
    private readonly clients: ClientRepository,
    private readonly sites: SiteRepository,
  ) {}

  async list(filters: MaintenanceFilters = {}): Promise<MaintenanceDetails[]> {
    return this.maintenances.findMany(filters);
  }

  async getById(id: number): Promise<Maintenance> {
    const maintenance = await this.maintenances.findById(id);
    if (!maintenance) throw new NotFoundError('Manutenção');
    return maintenance;
  }

  async create(input: MaintenanceInput): Promise<Maintenance> {
    const client = await this.clients.findById(input.clientId);
    if (!client) throw new NotFoundError('Cliente');
    await this.ensureSiteBelongsToClient(input.siteId, input.clientId);
    return this.maintenances.create(input);
  }

  async update(id: number, input: MaintenanceUpdateInput): Promise<Maintenance> {
    const current = await this.getById(id);
    await this.ensureSiteBelongsToClient(input.siteId, current.clientId);
    return this.maintenances.update(id, input);
  }

  async delete(id: number): Promise<void> {
    await this.getById(id);
    await this.maintenances.delete(id);
  }

  /** Impede associar a manutenção ao site de OUTRO cliente. */
  private async ensureSiteBelongsToClient(siteId: number | null | undefined, clientId: number): Promise<void> {
    if (!siteId) return;
    const site = await this.sites.findById(siteId);
    if (!site) throw new NotFoundError('Site');
    if (site.clientId !== clientId) {
      throw new ValidationError('Este site pertence a outro cliente.');
    }
  }
}
