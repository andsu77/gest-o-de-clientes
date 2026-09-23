import type { Request, Response } from 'express';
import { UnauthorizedError } from '../errors/AppError';
import type { AuthService } from '../services/AuthService';
import { changePasswordSchema, loginSchema } from '../validators/auth.validator';

/**
 * O CONTROLLER recebe a requisição HTTP.
 * Ele NÃO contém regra de negócio. O trabalho dele é:
 *   1. extrair e validar os dados da requisição (body, params, query)
 *   2. chamar o Service certo
 *   3. escolher o status HTTP e devolver a resposta
 *
 * Por que os métodos são "arrow functions" atribuídas (login = async () => {})?
 * Porque vamos passá-los soltos para o Express: router.post('/login', controller.login).
 * Um método comum perderia o "this" nesse momento (this viraria undefined e
 * this.authService quebraria). A arrow function "captura" o this da instância.
 */
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  login = async (req: Request, res: Response): Promise<void> => {
    const { email, password } = loginSchema.parse(req.body);
    const result = await this.authService.login(email, password);
    res.json(result);
  };

  /**
   * Com JWT o servidor não guarda sessão, então "logout" é o navegador
   * esquecer o token. Mantemos a rota para o front ter um ponto único de
   * saída (e para, no futuro, implementar uma lista de tokens revogados).
   */
  logout = async (_req: Request, res: Response): Promise<void> => {
    res.status(204).send();
  };

  me = async (req: Request, res: Response): Promise<void> => {
    const user = await this.authService.getProfile(this.currentUserId(req));
    res.json(user);
  };

  changePassword = async (req: Request, res: Response): Promise<void> => {
    const { currentPassword, newPassword } = changePasswordSchema.parse(req.body);
    await this.authService.changePassword(this.currentUserId(req), currentPassword, newPassword);
    res.status(204).send();
  };

  private currentUserId(req: Request): number {
    if (!req.user) throw new UnauthorizedError();
    return req.user.id;
  }
}
