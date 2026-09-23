import type { NextFunction, Request, RequestHandler, Response } from 'express';
import { UnauthorizedError } from '../errors/AppError';
import type { TokenProvider } from '../providers/interfaces';

/**
 * MIDDLEWARE DE AUTENTICAÇÃO
 * --------------------------
 * Um middleware é uma função que roda ENTRE a chegada da requisição e o
 * controller. Ele pode:
 *   - deixar passar:        next()
 *   - barrar com um erro:   throw (ou next(erro))
 *   - enriquecer a req:     req.user = {...}
 *
 * Esta função é uma "fábrica": recebe o TokenProvider e DEVOLVE o middleware.
 * Assim ela não depende do JWT diretamente (injeção de dependência).
 *
 * Uso nas rotas:  router.use(authenticate)  -> protege todas as rotas abaixo.
 */
export function createAuthMiddleware(tokenProvider: TokenProvider): RequestHandler {
  return (req: Request, _res: Response, next: NextFunction): void => {
    const header = req.headers.authorization; // "Bearer eyJhbGciOi..."

    if (!header || !header.startsWith('Bearer ')) {
      throw new UnauthorizedError('Faça login para acessar esta área.');
    }

    const token = header.slice('Bearer '.length).trim();
    const payload = tokenProvider.verify(token); // lança UnauthorizedError se inválido/expirado

    req.user = { id: payload.userId, email: payload.email };
    next(); // tudo certo: segue para o próximo middleware/controller
  };
}
