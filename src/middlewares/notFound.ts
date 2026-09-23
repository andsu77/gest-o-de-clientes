import type { Request, Response } from 'express';

/** Rotas /api/... que não existem respondem 404 em JSON (e não uma página HTML). */
export function apiNotFound(req: Request, res: Response): void {
  res.status(404).json({
    error: { code: 'ROUTE_NOT_FOUND', message: `Rota não encontrada: ${req.method} ${req.originalUrl}` },
  });
}
