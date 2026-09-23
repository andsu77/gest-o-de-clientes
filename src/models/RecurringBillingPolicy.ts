import { BillingType, ContractStatus } from './enums';
import type { Contract } from './entities';
import { calendarDate, daysInMonth, monthRange, type YearMonth } from '../utils/dates';

/**
 * REGRAS DE COBRANÇA RECORRENTE
 * -----------------------------
 * Por que esta classe existe?
 *   Para concentrar em UM lugar as regras "quando cobrar" e "quanto vale por mês".
 *   Sem ela, essas regras ficariam espalhadas no Dashboard, no Financeiro e na
 *   geração de mensalidades — e um dia ficariam diferentes entre si.
 *
 * Responsabilidade: responder perguntas de negócio sobre uma contratação.
 * Não acessa banco, não sabe de HTTP. Só regra pura => facílima de testar.
 *
 * Quem usa: BillingService (gera mensalidades) e DashboardService (receita recorrente).
 */

/** Só os campos de que a regra precisa. Pick<> "recorta" um tipo. */
export type BillableContract = Pick<
  Contract,
  'billingType' | 'status' | 'startDate' | 'endDate' | 'dueDay' | 'priceCents'
>;

export class RecurringBillingPolicy {
  /** Pagamento único e personalizado NÃO geram cobranças automáticas. */
  isRecurring(billingType: BillingType): boolean {
    return billingType === BillingType.MENSAL || billingType === BillingType.ANUAL;
  }

  /**
   * Esta contratação deve gerar cobrança no mês informado?
   * - precisa estar ATIVA e ser recorrente
   * - precisa ter começado até o fim do mês
   * - não pode ter terminado antes do início do mês
   * - ANUAL: só cobra no mês de "aniversário" da contratação
   */
  shouldChargeInMonth(contract: BillableContract, reference: YearMonth): boolean {
    if (contract.status !== ContractStatus.ATIVO) return false;
    if (!this.isRecurring(contract.billingType)) return false;

    const { start, end } = monthRange(reference);
    if (contract.startDate > end) return false;
    if (contract.endDate && contract.endDate < start) return false;

    if (contract.billingType === BillingType.ANUAL) {
      return contract.startDate.getUTCMonth() + 1 === reference.month;
    }
    return true;
  }

  /**
   * Data de vencimento no mês de referência.
   * - Usa o dueDay (ou o dia de início, se não houver dueDay).
   * - Se o mês não tem esse dia (ex.: 31 em fevereiro), usa o último dia do mês.
   * - Nunca vence antes do início da contratação.
   */
  dueDateFor(contract: BillableContract, reference: YearMonth): Date {
    const preferredDay = contract.dueDay ?? contract.startDate.getUTCDate();
    const day = Math.min(preferredDay, daysInMonth(reference.year, reference.month));
    const dueDate = calendarDate(reference.year, reference.month, day);
    return dueDate < contract.startDate ? contract.startDate : dueDate;
  }

  /**
   * Quanto esta contratação representa POR MÊS (receita recorrente mensal, a "MRR").
   * Anual é dividido por 12; único e personalizado não entram.
   */
  monthlyEquivalentCents(contract: BillableContract): number {
    if (contract.status !== ContractStatus.ATIVO) return 0;
    if (contract.billingType === BillingType.MENSAL) return contract.priceCents;
    if (contract.billingType === BillingType.ANUAL) return Math.round(contract.priceCents / 12);
    return 0;
  }
}
