import { ConflictError, NotFoundError } from '../errors/AppError';
import type { Service } from '../models/entities';
import type { ServiceInput, ServiceUpdateInput } from '../models/inputs';
import type { ServiceFilters, ServiceRepository } from '../repositories/interfaces';

/**
 * CatalogService — regras do catálogo de serviços que você vende.
 *
 * Por que "Catalog" e não "ServiceService"? Porque "Service" já é o nome da
 * camada (services/). "ServiceService" seria confuso. O nome do domínio é
 * "catálogo de serviços", então a classe se chama CatalogService.
 * Nomear bem é uma das partes mais importantes (e difíceis) da programação.
 */
export class CatalogService {
  constructor(private readonly services: ServiceRepository) {}

  async list(filters: ServiceFilters = {}): Promise<Service[]> {
    return this.services.findMany(filters);
  }

  async getById(id: number): Promise<Service> {
    const service = await this.services.findById(id);
    if (!service) throw new NotFoundError('Serviço');
    return service;
  }

  async create(input: ServiceInput): Promise<Service> {
    return this.services.create(input);
  }

  async update(id: number, input: ServiceUpdateInput): Promise<Service> {
    await this.getById(id);
    return this.services.update(id, input);
  }

  async delete(id: number): Promise<void> {
    await this.getById(id);
    const contracts = await this.services.countContracts(id);
    if (contracts > 0) {
      throw new ConflictError(
        `Este serviço está em ${contracts} contratação(ões). Marque-o como INATIVO em vez de excluir.`,
      );
    }
    await this.services.delete(id);
  }
}
