import { todayInTimeZone } from '../utils/dates';
import type { Clock } from './interfaces';

/**
 * Relógio real do sistema, respeitando o fuso configurado (APP_TIMEZONE).
 * "implements Clock" obriga a classe a ter todos os métodos da interface —
 * se faltar algum, o TypeScript não compila.
 */
export class SystemClock implements Clock {
  // "private readonly" no parâmetro do construtor é um atalho do TypeScript:
  // cria o atributo this.timeZone e já atribui o valor recebido.
  constructor(private readonly timeZone: string) {}

  today(): Date {
    return todayInTimeZone(this.timeZone);
  }
}
