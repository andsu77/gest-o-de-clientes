/**
 * Testes da REGRA DE MENSALIDADE.
 * Como a RecurringBillingPolicy é lógica pura (sem banco), o teste é direto:
 * monta um objeto, chama o método, confere o resultado.
 *
 * Estrutura de todo teste: Arrange (preparar) -> Act (executar) -> Assert (conferir).
 */
import { RecurringBillingPolicy, type BillableContract } from '../../src/models/RecurringBillingPolicy';
import { day } from '../helpers';

const policy = new RecurringBillingPolicy();

// Função "fábrica": cria um contrato padrão e deixa sobrescrever só o que importa em cada teste.
function contract(overrides: Partial<BillableContract> = {}): BillableContract {
  return {
    billingType: 'MENSAL',
    status: 'ATIVO',
    startDate: day('2026-03-10'),
    endDate: null,
    dueDay: 10,
    priceCents: 7000,
    ...overrides,
  };
}

describe('RecurringBillingPolicy', () => {
  describe('shouldChargeInMonth', () => {
    it('cobra mensalidade ativa em um mês após o início', () => {
      expect(policy.shouldChargeInMonth(contract(), { year: 2026, month: 9 })).toBe(true);
    });

    it('não cobra antes da contratação começar', () => {
      expect(policy.shouldChargeInMonth(contract(), { year: 2026, month: 2 })).toBe(false);
    });

    it('não cobra depois do término', () => {
      const ended = contract({ endDate: day('2026-06-30') });
      expect(policy.shouldChargeInMonth(ended, { year: 2026, month: 7 })).toBe(false);
      expect(policy.shouldChargeInMonth(ended, { year: 2026, month: 6 })).toBe(true);
    });

    it('não cobra pagamento único nem contratação pausada', () => {
      expect(policy.shouldChargeInMonth(contract({ billingType: 'UNICA' }), { year: 2026, month: 9 })).toBe(false);
      expect(policy.shouldChargeInMonth(contract({ status: 'PAUSADO' }), { year: 2026, month: 9 })).toBe(false);
    });

    it('anual só cobra no mês de aniversário', () => {
      const annual = contract({ billingType: 'ANUAL' });
      expect(policy.shouldChargeInMonth(annual, { year: 2027, month: 3 })).toBe(true);
      expect(policy.shouldChargeInMonth(annual, { year: 2027, month: 4 })).toBe(false);
    });
  });

  describe('dueDateFor', () => {
    it('usa o dia de vencimento combinado', () => {
      expect(policy.dueDateFor(contract(), { year: 2026, month: 9 })).toEqual(day('2026-09-10'));
    });

    it('usa o último dia quando o mês é mais curto (31 -> fevereiro)', () => {
      const due31 = contract({ dueDay: 31, startDate: day('2026-01-31') });
      expect(policy.dueDateFor(due31, { year: 2026, month: 2 })).toEqual(day('2026-02-28'));
    });

    it('nunca vence antes do início da contratação', () => {
      const lateStart = contract({ startDate: day('2026-09-20'), dueDay: 10 });
      expect(policy.dueDateFor(lateStart, { year: 2026, month: 9 })).toEqual(day('2026-09-20'));
    });
  });

  describe('monthlyEquivalentCents', () => {
    it('mensal conta inteiro, anual conta 1/12 e único não conta', () => {
      expect(policy.monthlyEquivalentCents(contract())).toBe(7000);
      expect(policy.monthlyEquivalentCents(contract({ billingType: 'ANUAL', priceCents: 12000 }))).toBe(1000);
      expect(policy.monthlyEquivalentCents(contract({ billingType: 'UNICA' }))).toBe(0);
    });
  });
});
