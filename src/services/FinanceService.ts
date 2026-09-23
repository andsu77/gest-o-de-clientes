import type { PaymentDetails } from '../models/entities';
import { PaymentStatus } from '../models/enums';
import type { RecurringBillingPolicy } from '../models/RecurringBillingPolicy';
import type { Clock } from '../providers/interfaces';
import type { ContractRepository, PaymentRepository } from '../repositories/interfaces';
import { calendarDate, monthRange, toYearMonth } from '../utils/dates';
import { sumCents } from '../utils/money';

export interface FinanceFilters {
  from?: Date; // período (por vencimento na listagem / por data de pagamento no "recebido no período")
  to?: Date;
  clientId?: number;
  status?: PaymentStatus;
  year?: number; // ano da tabela "receita por mês"
}

export interface FinanceReport {
  totals: {
    totalReceivedCents: number;
    receivedInPeriodCents: number | null; // null quando não há período filtrado
    receivedThisMonthCents: number;
    monthlyRecurringRevenueCents: number;
    pendingCents: number;
    overdueCents: number;
  };
  monthlyRevenue: { year: number; months: { month: number; receivedCents: number }[] };
  payments: PaymentDetails[];
}

/** FinanceService — relatórios financeiros com filtros. */
export class FinanceService {
  constructor(
    private readonly payments: PaymentRepository,
    private readonly contracts: ContractRepository,
    private readonly policy: RecurringBillingPolicy,
    private readonly clock: Clock,
  ) {}

  async getReport(filters: FinanceFilters = {}): Promise<FinanceReport> {
    const today = this.clock.today();
    await this.payments.markOverdue(today);

    const year = filters.year ?? today.getUTCFullYear();
    const thisMonth = monthRange(toYearMonth(today));
    const { clientId } = filters;
    const hasPeriod = Boolean(filters.from || filters.to);

    const [totalReceived, receivedInPeriod, receivedThisMonth, pending, overdue, chargeable, paidInYear, list] =
      await Promise.all([
        this.payments.sumAmount({ clientId, status: [PaymentStatus.PAGO] }),
        hasPeriod
          ? this.payments.sumAmount({ clientId, status: [PaymentStatus.PAGO], paidFrom: filters.from, paidTo: filters.to })
          : Promise.resolve(null), // Promise que já nasce resolvida — mantém o formato do array
        this.payments.sumAmount({ clientId, status: [PaymentStatus.PAGO], paidFrom: thisMonth.start, paidTo: thisMonth.end }),
        this.payments.sumAmount({ clientId, status: [PaymentStatus.PENDENTE] }),
        this.payments.sumAmount({ clientId, status: [PaymentStatus.ATRASADO] }),
        this.contracts.findChargeable(),
        this.payments.findMany({
          clientId,
          status: [PaymentStatus.PAGO],
          paidFrom: calendarDate(year, 1, 1),
          paidTo: calendarDate(year, 12, 31),
        }),
        this.payments.findMany(
          {
            clientId,
            status: filters.status ? [filters.status] : undefined,
            dueFrom: filters.from,
            dueTo: filters.to,
          },
          { order: 'desc', limit: 500 },
        ),
      ]);

    const relevantContracts = clientId ? chargeable.filter((c) => c.clientId === clientId) : chargeable;

    return {
      totals: {
        totalReceivedCents: totalReceived,
        receivedInPeriodCents: receivedInPeriod,
        receivedThisMonthCents: receivedThisMonth,
        monthlyRecurringRevenueCents: sumCents(relevantContracts.map((c) => this.policy.monthlyEquivalentCents(c))),
        pendingCents: pending,
        overdueCents: overdue,
      },
      monthlyRevenue: { year, months: this.groupByMonth(paidInYear) },
      payments: list,
    };
  }

  /**
   * Agrupa os pagamentos recebidos por mês (1..12).
   * Array.from({ length: 12 }) cria 12 posições; reduce/forEach preenche.
   */
  private groupByMonth(paidPayments: PaymentDetails[]): { month: number; receivedCents: number }[] {
    const totals = Array.from({ length: 12 }, () => 0);
    for (const payment of paidPayments) {
      if (!payment.paidAt) continue;
      totals[payment.paidAt.getUTCMonth()] += payment.amountCents;
    }
    return totals.map((receivedCents, index) => ({ month: index + 1, receivedCents }));
  }
}
