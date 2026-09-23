import bcrypt from 'bcryptjs';
import type { PasswordHasher } from './interfaces';

/**
 * Hash de senha com bcrypt.
 *
 * Usamos o pacote "bcryptjs": mesmo algoritmo do "bcrypt", mas escrito em
 * JavaScript puro — instala em qualquer máquina (inclusive Windows) sem
 * precisar compilar código C++.
 *
 * Por que hash e não criptografia? Hash é de mão única: não existe "descriptografar".
 * Para conferir a senha no login, geramos o hash do que foi digitado e comparamos.
 * O "salt" (embutido no hash) faz duas senhas iguais gerarem hashes diferentes.
 */
export class BcryptPasswordHasher implements PasswordHasher {
  // saltRounds: custo do cálculo. 10 é o padrão de mercado (lento para
  // atacantes testarem milhões de senhas, rápido o bastante para o login).
  constructor(private readonly saltRounds = 10) {}

  // bcrypt.hash devolve uma Promise: o cálculo é pesado e roda sem travar o Node.
  async hash(plainPassword: string): Promise<string> {
    return bcrypt.hash(plainPassword, this.saltRounds);
  }

  async compare(plainPassword: string, hash: string): Promise<boolean> {
    return bcrypt.compare(plainPassword, hash);
  }
}
