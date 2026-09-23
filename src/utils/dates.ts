/**
 * DATAS DE CALENDÁRIO
 * -------------------
 * Vencimentos e datas de pagamento são "dias do calendário" (10/09/2026),
 * não "instantes" (10/09/2026 às 14:32:07). Para não sofrer com fuso horário,
 * representamos todo dia como MEIA-NOITE UTC daquele dia:
 *     10/09/2026  ->  new Date('2026-09-10T00:00:00.000Z')
 *
 * É o mesmo formato que o MySQL devolve para colunas DATE via Prisma.
 * Por isso aqui usamos sempre os métodos getUTC... / Date.UTC(...).
 */
import { ValidationError } from '../errors/AppError';

/** Ano + mês (1 a 12). Ex.: { year: 2026, month: 9 } = setembro/2026 */
export interface YearMonth {
  year: number;
  month: number;
}

/** Cria a data (meia-noite UTC) de um dia do calendário. month = 1..12 */
export function calendarDate(year: number, month: number, day: number): Date {
  return new Date(Date.UTC(year, month - 1, day));
}

/**
 * "Que dia é hoje" em um fuso específico (ex.: America/Sao_Paulo).
 * Às 22h de 30/09 em São Paulo já é 01/10 em UTC — sem isso, cobranças
 * seriam marcadas como atrasadas um dia antes.
 */
export function todayInTimeZone(timeZone: string, now: Date = new Date()): Date {
  // O locale en-CA formata como AAAA-MM-DD, o que facilita montar a data.
  const isoDay = new Intl.DateTimeFormat('en-CA', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(now);
  return new Date(`${isoDay}T00:00:00.000Z`);
}

export function toYearMonth(date: Date): YearMonth {
  return { year: date.getUTCFullYear(), month: date.getUTCMonth() + 1 };
}

/** { year: 2026, month: 9 } -> "2026-09" */
export function formatYearMonth({ year, month }: YearMonth): string {
  return `${year}-${String(month).padStart(2, '0')}`;
}

/** "2026-09" -> { year: 2026, month: 9 } (lança ValidationError se inválido) */
export function parseYearMonth(value: string): YearMonth {
  const match = /^(\d{4})-(0[1-9]|1[0-2])$/.exec(value);
  if (!match) {
    throw new ValidationError('Mês de referência inválido. Use o formato AAAA-MM.');
  }
  return { year: Number(match[1]), month: Number(match[2]) };
}

/** Quantos dias tem o mês. Truque: o "dia 0" do mês seguinte é o último dia deste. */
export function daysInMonth(year: number, month: number): number {
  return new Date(Date.UTC(year, month, 0)).getUTCDate();
}

/** Primeiro e último dia (inclusive) de um mês. */
export function monthRange({ year, month }: YearMonth): { start: Date; end: Date } {
  return {
    start: calendarDate(year, month, 1),
    end: calendarDate(year, month, daysInMonth(year, month)),
  };
}

/** Soma (ou subtrai) meses: addMonths({2026, 12}, 1) -> {2027, 1} */
export function addMonths({ year, month }: YearMonth, amount: number): YearMonth {
  const zeroBased = year * 12 + (month - 1) + amount;
  return { year: Math.floor(zeroBased / 12), month: (zeroBased % 12) + 1 };
}
