import type { Clock, PasswordHasher, TokenPayload, TokenProvider } from '../../src/providers/interfaces';
import { UnauthorizedError } from '../../src/errors/AppError';

/** Relógio parado: "hoje" é sempre a data escolhida no teste. */
export class FixedClock implements Clock {
  constructor(private current: Date) {}
  today(): Date {
    return this.current;
  }
  set(date: Date): void {
    this.current = date;
  }
}

/** "Hash" falso e previsível — bcrypt de verdade deixaria os testes lentos. */
export class FakePasswordHasher implements PasswordHasher {
  async hash(plain: string): Promise<string> {
    return `hashed:${plain}`;
  }
  async compare(plain: string, hash: string): Promise<boolean> {
    return hash === `hashed:${plain}`;
  }
}

export class FakeTokenProvider implements TokenProvider {
  generate(payload: TokenPayload): string {
    return `token-${payload.userId}`;
  }
  verify(token: string): TokenPayload {
    const match = /^token-(\d+)$/.exec(token);
    if (!match) throw new UnauthorizedError();
    return { userId: Number(match[1]), email: 'fake@test.dev' };
  }
}
