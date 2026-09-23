import jwt from 'jsonwebtoken';
import { UnauthorizedError } from '../errors/AppError';
import type { TokenPayload, TokenProvider } from './interfaces';

/**
 * JWT (JSON Web Token): um "crachá" assinado digitalmente.
 *
 * No login o servidor gera um token com { sub: id do usuário, email } e assina
 * com o JWT_SECRET. O navegador guarda e envia em toda requisição:
 *     Authorization: Bearer <token>
 * O servidor confere a assinatura: se alguém alterar o conteúdo, a assinatura
 * não bate e o token é rejeitado. Não precisamos guardar sessão no banco
 * (por isso se diz que JWT é "stateless").
 *
 * Atenção: o conteúdo do JWT é apenas codificado (base64), NÃO criptografado.
 * Nunca coloque senha ou dados sensíveis dentro dele.
 */
export class JwtTokenProvider implements TokenProvider {
  constructor(
    private readonly secret: string,
    private readonly expiresIn: string,
  ) {}

  generate(payload: TokenPayload): string {
    return jwt.sign({ email: payload.email }, this.secret, {
      subject: String(payload.userId), // "sub" = dono do token
      // O tipo oficial exige um formato como "8h" ou "30m"; o valor vem validado do .env.
      expiresIn: this.expiresIn as jwt.SignOptions['expiresIn'],
    });
  }

  verify(token: string): TokenPayload {
    try {
      const decoded = jwt.verify(token, this.secret);
      if (typeof decoded === 'string' || !decoded.sub || typeof decoded.email !== 'string') {
        throw new UnauthorizedError('Token inválido.');
      }
      return { userId: Number(decoded.sub), email: decoded.email };
    } catch (error) {
      // jwt.verify lança erros próprios (expirado, assinatura inválida...).
      // Traduzimos todos para o nosso UnauthorizedError.
      if (error instanceof UnauthorizedError) throw error;
      throw new UnauthorizedError('Sessão expirada ou token inválido. Faça login novamente.');
    }
  }
}
