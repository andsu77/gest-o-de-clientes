import { NotFoundError } from '../errors/AppError';
import type { Site, SiteDetails } from '../models/entities';
import type { SiteInput, SiteUpdateInput } from '../models/inputs';
import type { ClientRepository, SiteFilters, SiteRepository } from '../repositories/interfaces';

/** SiteService — controle administrativo dos sites de cada cliente. */
export class SiteService {
  constructor(
    private readonly sites: SiteRepository,
    private readonly clients: ClientRepository,
  ) {}

  async list(filters: SiteFilters = {}): Promise<SiteDetails[]> {
    return this.sites.findMany(filters);
  }

  async getById(id: number): Promise<Site> {
    const site = await this.sites.findById(id);
    if (!site) throw new NotFoundError('Site');
    return site;
  }

  async create(input: SiteInput): Promise<Site> {
    const client = await this.clients.findById(input.clientId);
    if (!client) throw new NotFoundError('Cliente');
    return this.sites.create(input);
  }

  async update(id: number, input: SiteUpdateInput): Promise<Site> {
    await this.getById(id);
    return this.sites.update(id, input);
  }

  async delete(id: number): Promise<void> {
    await this.getById(id);
    await this.sites.delete(id);
  }
}
