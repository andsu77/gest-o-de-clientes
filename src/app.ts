/**
 * APP EXPRESS
 * -----------
 * Monta a aplicação: middlewares globais, arquivos estáticos, rotas e
 * tratamento de erros. Separado do server.ts para que o app possa ser
 * importado em testes de integração sem abrir uma porta de rede.
 *
 * A ORDEM dos app.use() é a ordem em que a requisição passa por eles:
 *   helmet -> cors -> json -> (estáticos) -> rotas /api -> 404 -> errorHandler
 */
import cors from 'cors';
import express, { type Express } from 'express';
import helmet from 'helmet';
import path from 'node:path';
import { env } from './config/env';
import type { Container } from './container';
import { errorHandler } from './middlewares/errorHandler';
import { apiNotFound } from './middlewares/notFound';
import { createApiRoutes } from './routes';

export function createApp(container: Container): Express {
  const app = express();

  // Helmet: adiciona cabeçalhos HTTP de segurança (bloqueia iframes de outros
  // sites, scripts inline não autorizados etc.). Por isso o front não usa
  // onclick="..." no HTML: todo JS fica em arquivos .js (política CSP).
  app.use(
    helmet({
      contentSecurityPolicy: {
        directives: {
          // Em desenvolvimento (http://localhost) não forçamos HTTPS.
          upgradeInsecureRequests: env.NODE_ENV === 'production' ? [] : null,
        },
      },
    }),
  );

  // CORS: define quais ORIGENS (sites) podem chamar esta API pelo navegador.
  app.use(cors({ origin: env.CORS_ORIGIN }));

  // Lê corpos JSON (req.body). O limite evita requisições gigantes.
  app.use(express.json({ limit: '100kb' }));

  // Front-end: arquivos da pasta public/ (index.html, css, js).
  // path.resolve(__dirname, '..', 'public') funciona tanto em src/ (dev) quanto em dist/ (build).
  app.use(express.static(path.resolve(__dirname, '..', 'public')));

  // Health check: confirma que a API e o banco estão respondendo.
  app.get('/api/health', async (_req, res) => {
    try {
      await container.prisma.$queryRaw`SELECT 1`;
      res.json({ status: 'ok', database: 'up' });
    } catch {
      res.status(503).json({ status: 'degraded', database: 'down' });
    }
  });

  app.use('/api', createApiRoutes(container));
  app.use('/api', apiNotFound);

  // SEMPRE por último: captura qualquer erro lançado acima.
  app.use(errorHandler);

  return app;
}
