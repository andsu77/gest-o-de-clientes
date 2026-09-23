import { NotFoundError } from '../errors/AppError';
import type { Contact } from '../models/entities';
import { ContactOutcome } from '../models/enums';
import type { ContactInput, ContactUpdateInput } from '../models/inputs';
import type { ContactFilters, ContactRepository } from '../repositories/interfaces';

/** ContactService — lista de pessoas para entrar em contato no futuro. */
export class ContactService {
  constructor(private readonly contacts: ContactRepository) {}

  async list(filters: ContactFilters = {}): Promise<Contact[]> {
    return this.contacts.findMany(filters);
  }

  async getById(id: number): Promise<Contact> {
    const contact = await this.contacts.findById(id);
    if (!contact) throw new NotFoundError('Contato');
    return contact;
  }

  async create(input: ContactInput): Promise<Contact> {
    return this.contacts.create(withConsistentMessaged(input, input.outcome));
  }

  async update(id: number, input: ContactUpdateInput): Promise<Contact> {
    const current = await this.getById(id);
    return this.contacts.update(id, withConsistentMessaged(input, input.outcome ?? current.outcome));
  }

  async delete(id: number): Promise<void> {
    await this.getById(id);
    await this.contacts.delete(id);
  }
}

/** Se o contato já teve um resultado (deu certo ou não), a mensagem com certeza foi enviada. */
function withConsistentMessaged<T extends ContactUpdateInput>(input: T, outcome: ContactOutcome | undefined): T {
  if (outcome && outcome !== ContactOutcome.AGUARDANDO) return { ...input, messaged: true };
  return input;
}
