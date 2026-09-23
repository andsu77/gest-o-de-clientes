import { Router, type RequestHandler } from 'express';
import rateLimit from 'express-rate-limit';
import type { AuthController } from '../controllers/AuthController';

/**
 * Rotas de autenticação.
 * O rate limit impede "força bruta": no máximo 10 tentativas de login
 * a cada 15 minutos por IP.
 */
export function authRoutes(controller: AuthController, authenticate: RequestHandler): Router {
  const router = Router();

  const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 10,
    standardHeaders: 'draft-7',
    legacyHeaders: false,
    message: { error: { code: 'TOO_MANY_ATTEMPTS', message: 'Muitas tentativas de login. Aguarde 15 minutos.' } },
  });

  router.post('/login', loginLimiter, controller.login);
  router.post('/logout', authenticate, controller.logout);
  router.get('/me', authenticate, controller.me);
  router.put('/password', authenticate, controller.changePassword);

  return router;
}
