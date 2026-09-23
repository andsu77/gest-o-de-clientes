/**
 * "Declaration merging": acrescentamos a propriedade "user" ao tipo Request
 * do Express. O middleware de autenticação preenche req.user, e os
 * controllers conseguem ler req.user.id com tipagem correta.
 */
export interface AuthenticatedUser {
  id: number;
  email: string;
}

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      user?: AuthenticatedUser;
    }
  }
}
