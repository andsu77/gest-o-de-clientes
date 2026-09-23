import { Prisma } from '@prisma/client';
import type { NextFunction, Request, Response } from 'express';
import { ZodError } from 'zod';
import { AppError } from '../errors/AppError';

/**
 * MIDDLEWARE GLOBAL DE ERROS
 * --------------------------
 * Express reconhece um middleware de erro pelos 4 parâmetros (error, req, res, next).
 *
 * Como os erros chegam até aqui?
 *   Controller -> Service -> Repository... se QUALQUER um lançar um erro
 *   (throw) ou uma Promise for rejeitada, o erro "sobe" pela pilha de chamadas
 *   até o Express. No Express 5, erros de funções async são capturados
 *   automaticamente (no Express 4 era preciso um try/catch em cada controller).
 *
 * Vantagem: NENHUM controller precisa de try/catch. A tradução
 * "erro -> resposta HTTP" fica em um único lugar, sempre no mesmo formato:
 *   { "error": { "code": "NOT_FOUND", "message": "Cliente não encontrado(a)." } }
 */
export function errorHandler(error: unknown, _req: Request, res: Response, _next: NextFunction): void {
  // 1) Erros de negócio que NÓS lançamos (NotFoundError, ConflictError...)
  if (error instanceof AppError) {
    res.status(error.statusCode).json({
      error: { code: error.code, message: error.message, details: error.details },
    });
    return;
  }

  // 2) Erros de validação do Zod: lista cada campo com problema.
  if (error instanceof ZodError) {
    res.status(400).json({
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Dados inválidos. Verifique os campos informados.',
        details: error.issues.map((issue) => ({ field: issue.path.join('.'), message: issue.message })),
      },
    });
    return;
  }

  // 3) Erros conhecidos do banco (Prisma) — códigos em https://www.prisma.io/docs/orm/reference/error-reference
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    const known: Record<string, [number, string]> = {
      P2002: [409, 'Já existe um registro com esses dados (valor duplicado).'],
      P2003: [409, 'Operação bloqueada: existem registros relacionados.'],
      P2025: [404, 'Registro não encontrado.'],
      P1001: [503, 'Banco de dados indisponível. Verifique se o MySQL está rodando.'],
    };
    const mapped = known[error.code];
    if (mapped) {
      res.status(mapped[0]).json({ error: { code: `DB_${error.code}`, message: mapped[1] } });
      return;
    }
  }

  // 4) Não foi possível conectar no banco.
  if (error instanceof Prisma.PrismaClientInitializationError) {
    res.status(503).json({
      error: { code: 'DATABASE_UNAVAILABLE', message: 'Banco de dados indisponível. Verifique o MySQL e o DATABASE_URL.' },
    });
    return;
  }

  // 5) JSON malformado no corpo da requisição (erro do express.json()).
  if (typeof error === 'object' && error !== null && 'type' in error && error.type === 'entity.parse.failed') {
    res.status(400).json({ error: { code: 'INVALID_JSON', message: 'O corpo da requisição não é um JSON válido.' } });
    return;
  }

  // 6) Qualquer outra coisa é um bug: registra no console, mas NÃO expõe
  //    detalhes internos (stack trace, SQL) para quem fez a requisição.
  console.error('Erro inesperado:', error);
  res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: 'Erro interno no servidor.' } });
}
