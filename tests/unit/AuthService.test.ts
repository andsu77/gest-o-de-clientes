import { UnauthorizedError } from '../../src/errors/AppError';
import { AuthService } from '../../src/services/AuthService';
import { InMemoryUserRepository } from '../fakes/InMemoryRepositories';
import { FakePasswordHasher, FakeTokenProvider } from '../fakes/FakeProviders';

describe('AuthService', () => {
  let users: InMemoryUserRepository;
  let auth: AuthService;

  beforeEach(async () => {
    users = new InMemoryUserRepository();
    const hasher = new FakePasswordHasher();
    users.items.push({
      id: 1,
      name: 'Admin',
      email: 'admin@gestao.dev',
      passwordHash: await hasher.hash('admin123'),
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    auth = new AuthService(users, hasher, new FakeTokenProvider());
  });

  it('faz login com credenciais corretas e NÃO devolve o hash da senha', async () => {
    const result = await auth.login('admin@gestao.dev', 'admin123');
    expect(result.token).toBe('token-1');
    expect('passwordHash' in result.user).toBe(false);
  });

  it('recusa senha errada e e-mail inexistente com o mesmo erro', async () => {
    await expect(auth.login('admin@gestao.dev', 'errada')).rejects.toBeInstanceOf(UnauthorizedError);
    await expect(auth.login('ninguem@x.com', 'admin123')).rejects.toBeInstanceOf(UnauthorizedError);
  });
});
