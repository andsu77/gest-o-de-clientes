/**
 * Testes do ClientService usando repositories EM MEMÓRIA.
 * Repare: o ClientService é exatamente o mesmo usado em produção.
 * Só trocamos as dependências injetadas no construtor.
 */
import { ConflictError, NotFoundError } from '../../src/errors/AppError';
import { AuditService } from '../../src/services/AuditService';
import { ClientService } from '../../src/services/ClientService';
import {
  InMemoryAuditLogRepository,
  InMemoryClientRepository,
  InMemoryPaymentRepository,
} from '../fakes/InMemoryRepositories';
import { day } from '../helpers';

describe('ClientService', () => {
  let clients: InMemoryClientRepository;
  let payments: InMemoryPaymentRepository;
  let auditLogs: InMemoryAuditLogRepository;
  let service: ClientService;

  // beforeEach roda antes de CADA teste: todo teste começa do zero.
  beforeEach(() => {
    clients = new InMemoryClientRepository();
    payments = new InMemoryPaymentRepository(clients);
    auditLogs = new InMemoryAuditLogRepository();
    service = new ClientService(clients, payments, new AuditService(auditLogs));
  });

  it('cria um cliente com status ATIVO por padrão e registra no histórico', async () => {
    const client = await service.create({ name: 'Padaria do João', email: 'joao@padaria.com' });

    expect(client.id).toBe(1);
    expect(client.status).toBe('ATIVO');
    expect(auditLogs.items).toHaveLength(1);
    expect(auditLogs.items[0].action).toBe('CREATED');
  });

  it('busca um cliente pelo id', async () => {
    const created = await service.create({ name: 'Maria' });
    const found = await service.getById(created.id);
    expect(found.name).toBe('Maria');
  });

  it('lança NotFoundError quando o cliente não existe', async () => {
    // "rejects" é usado com Promises: esperamos que a Promise seja REJEITADA.
    await expect(service.getById(999)).rejects.toBeInstanceOf(NotFoundError);
  });

  it('pesquisa por nome, e-mail ou telefone e filtra por status', async () => {
    await service.create({ name: 'Ana Souza', phone: '11999990000' });
    await service.create({ name: 'Bruno', email: 'bruno@loja.com', status: 'INADIMPLENTE' });

    expect(await service.list({ search: 'ana' })).toHaveLength(1);
    expect(await service.list({ search: 'loja.com' })).toHaveLength(1);
    expect(await service.list({ search: '99999' })).toHaveLength(1);
    expect(await service.list({ status: 'INADIMPLENTE' })).toHaveLength(1);
  });

  it('registra no histórico quando o status muda', async () => {
    const client = await service.create({ name: 'Carlos' });
    await service.update(client.id, { status: 'PAUSADO' });
    expect(auditLogs.items.map((log) => log.action)).toEqual(['CREATED', 'STATUS_CHANGED']);
  });

  it('não permite excluir cliente com pagamento recebido', async () => {
    const client = await service.create({ name: 'Cliente com histórico' });
    await payments.create({
      clientId: client.id,
      amountCents: 7000,
      dueDate: day('2026-09-10'),
      paidAt: day('2026-09-10'),
      status: 'PAGO',
    });

    await expect(service.delete(client.id)).rejects.toBeInstanceOf(ConflictError);
  });

  it('exclui cliente sem pagamentos recebidos', async () => {
    const client = await service.create({ name: 'Cliente teste' });
    await service.delete(client.id);
    expect(clients.items).toHaveLength(0);
  });
});
