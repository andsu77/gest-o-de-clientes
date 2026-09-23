import { NotFoundError, UnauthorizedError, ValidationError } from '../errors/AppError';
import type { PublicUser, User } from '../models/entities';
import type { PasswordHasher, TokenProvider } from '../providers/interfaces';
import type { UserRepository } from '../repositories/interfaces';

export interface LoginResult {
  token: string;
  user: PublicUser;
}

/**
 * AuthService — regras de autenticação.
 *
 * Repare nas dependências do construtor: um repository e DUAS interfaces
 * (PasswordHasher e TokenProvider). O AuthService não sabe se é bcrypt,
 * argon2, JWT ou outra coisa. Ele só sabe "preciso de alguém que compare
 * senhas e gere tokens". Isso é INJEÇÃO DE DEPENDÊNCIA: quem monta as peças
 * é o container (src/container.ts), não o próprio service.
 */
export class AuthService {
  constructor(
    private readonly users: UserRepository,
    private readonly passwordHasher: PasswordHasher,
    private readonly tokenProvider: TokenProvider,
  ) {}

  /**
   * "async" faz a função SEMPRE retornar uma Promise.
   * Dentro dela, "await" pausa ESTA função até a Promise terminar —
   * mas o Node continua atendendo outras requisições enquanto isso.
   */
  async login(email: string, password: string): Promise<LoginResult> {
    const user = await this.users.findByEmail(email);

    // Mesma mensagem para "e-mail não existe" e "senha errada": assim um
    // atacante não descobre quais e-mails estão cadastrados.
    const invalidCredentials = new UnauthorizedError('E-mail ou senha inválidos.');
    if (!user) throw invalidCredentials;

    const passwordMatches = await this.passwordHasher.compare(password, user.passwordHash);
    if (!passwordMatches) throw invalidCredentials;

    const token = this.tokenProvider.generate({ userId: user.id, email: user.email });
    return { token, user: this.toPublicUser(user) };
  }

  async getProfile(userId: number): Promise<PublicUser> {
    const user = await this.users.findById(userId);
    if (!user) throw new NotFoundError('Usuário');
    return this.toPublicUser(user);
  }

  async changePassword(userId: number, currentPassword: string, newPassword: string): Promise<void> {
    const user = await this.users.findById(userId);
    if (!user) throw new NotFoundError('Usuário');

    const matches = await this.passwordHasher.compare(currentPassword, user.passwordHash);
    if (!matches) throw new ValidationError('Senha atual incorreta.');
    if (currentPassword === newPassword) {
      throw new ValidationError('A nova senha precisa ser diferente da atual.');
    }

    const newHash = await this.passwordHasher.hash(newPassword);
    await this.users.updatePasswordHash(user.id, newHash);
  }

  /** "private": só esta classe usa. Garante que o hash nunca sai na resposta. */
  private toPublicUser(user: User): PublicUser {
    return {
      id: user.id,
      name: user.name,
      email: user.email,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  }
}
