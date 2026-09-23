/**
 * INTERFACES DE "PROVEDORES" (Abstração + Injeção de Dependência)
 * ----------------------------------------------------------------
 * Um provider é algo "de fora" que o sistema usa: relógio, criptografia,
 * geração de tokens. Os services dependem destas INTERFACES, não das
 * bibliotecas (bcrypt, jsonwebtoken).
 *
 * Ganho prático: nos testes, trocamos a implementação real por uma falsa
 * (ex.: um relógio parado em 15/09/2026) sem mudar uma linha do service.
 * Isso é o "D" do SOLID: Dependency Inversion Principle.
 */

/** Informa "que dia é hoje". Nos testes, usamos um relógio fixo. */
export interface Clock {
  today(): Date;
}

/** Gera e confere hashes de senha. Implementação real: BcryptPasswordHasher. */
export interface PasswordHasher {
  hash(plainPassword: string): Promise<string>;
  compare(plainPassword: string, hash: string): Promise<boolean>;
}

/** Dados que vão dentro do token de autenticação. */
export interface TokenPayload {
  userId: number;
  email: string;
}

/** Gera e valida tokens. Implementação real: JwtTokenProvider. */
export interface TokenProvider {
  generate(payload: TokenPayload): string;
  /** Retorna o payload se o token for válido; lança UnauthorizedError se não for. */
  verify(token: string): TokenPayload;
}
