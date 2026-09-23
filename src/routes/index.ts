import { Router } from 'express';
import type { Container } from '../container';
import { createAuthMiddleware } from '../middlewares/authenticate';
import { authRoutes } from './auth.routes';
import { crudRoutes } from './crud.routes';

/**
 * MAPA DE ROTAS DA API (tudo aqui fica sob o prefixo /api)
 * --------------------------------------------------------
 * A rota só decide "qual URL chama qual método do controller".
 * Nenhuma lógica aqui.
 *
 * A ORDEM importa: tudo que vem DEPOIS de router.use(authenticate) exige login.
 */
export function createApiRoutes(container: Container): Router {
  const { controllers } = container;
  const authenticate = createAuthMiddleware(container.tokenProvider);
  const router = Router();

  // ---------- Públicas
  router.use('/auth', authRoutes(controllers.auth, authenticate));

  // ---------- Daqui para baixo, apenas usuários autenticados
  router.use(authenticate);

  router.get('/dashboard', controllers.dashboard.dashboard);
  router.get('/finance', controllers.dashboard.finance);

  // Ficha completa do cliente (antes do CRUD para ficar explícito)
  router.get('/clients/:id/overview', controllers.clients.overview);
  router.use('/clients', crudRoutes(controllers.clients));
  router.use('/services', crudRoutes(controllers.catalog));
  router.use('/contracts', crudRoutes(controllers.contracts));
  router.use('/sites', crudRoutes(controllers.sites));
  router.use('/maintenance', crudRoutes(controllers.maintenance));
  router.use('/contacts', crudRoutes(controllers.contacts));

  // Pagamentos: sem DELETE (histórico financeiro não se apaga — se cancela).
  router.get('/payments', controllers.payments.index);
  router.post('/payments', controllers.payments.store);
  router.get('/payments/:id', controllers.payments.show);
  router.put('/payments/:id', controllers.payments.update);
  router.post('/payments/:id/pay', controllers.payments.pay);
  router.post('/payments/:id/cancel', controllers.payments.cancel);

  router.post('/billing/generate', controllers.payments.generate);

  return router;
}
