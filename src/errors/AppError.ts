/**
 * HIERARQUIA DE ERROS DA APLICAÇÃO (Herança usada de verdade)
 * ------------------------------------------------------------
 * Problema: o Service precisa dizer "cliente não encontrado", mas o Service
 * NÃO conhece HTTP (não sabe o que é status 404). Quem conhece é o Express.
 *
 * Solução: o Service lança um erro "de negócio" com significado
 * (NotFoundError). O middleware global de erros (middlewares/errorHandler.ts)
 * captura e traduz para HTTP.
 *
 * Por que HERANÇA aqui faz sentido?
 * Todos esses erros "SÃO UM" AppError (relação "é um"). Eles compartilham
 * a mesma estrutura (message + statusCode + code) e o errorHandler consegue
 * tratá-los de forma única com: if (error instanceof AppError).
 */
export class AppError extends Error {
  // "readonly" = pode ser lido de fora, mas nunca alterado depois de criado.
  public readonly statusCode: number;
  public readonly code: string;
  public readonly details?: unknown;

  constructor(message: string, statusCode = 400, code = 'APP_ERROR', details?: unknown) {
    // super() chama o construtor da classe pai (Error), que guarda a message.
    super(message);
    this.name = new.target.name; // nome real da subclasse (ex.: "NotFoundError")
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
  }
}

/** 404 — recurso não existe. Ex.: new NotFoundError('Cliente') */
export class NotFoundError extends AppError {
  constructor(resource: string) {
    super(`${resource} não encontrado(a).`, 404, 'NOT_FOUND');
  }
}

/** 400 — dado inválido que passou pelo validator mas quebra uma regra. */
export class ValidationError extends AppError {
  constructor(message: string, details?: unknown) {
    super(message, 400, 'VALIDATION_ERROR', details);
  }
}

/** 401 — não autenticado (sem token, token inválido, senha errada). */
export class UnauthorizedError extends AppError {
  constructor(message = 'Não autenticado.') {
    super(message, 401, 'UNAUTHORIZED');
  }
}

/** 409 — conflito com o estado atual (ex.: pagar algo já pago). */
export class ConflictError extends AppError {
  constructor(message: string) {
    super(message, 409, 'CONFLICT');
  }
}
