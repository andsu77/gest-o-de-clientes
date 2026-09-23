import type { PaymentDetails } from '../models/entities';
import { ClientStatus, PaymentStatus } from '../models/enums';
import type { RecurringBillingPolicy } from '../models/RecurringBillingPolicy';
import type { Clock } from '../providers/interfaces';
import type { ClientRepository, ContractRepository, PaymentRepository } from '../repositories/interfaces';
import { monthRange, toYearMonth } from '../utils/dates';
import { sumCents } from '../utils/money';
import type { BillingService } from './BillingService';

export interface DashboardSummary {
  clients: Record<ClientStatus, number> & { total: number };
  receivedThisMonthCents: number;
  monthlyRecurringRevenueCents: number;
  pendingCents: number;
  overdueCents: number;
  upcomingPayments: PaymentDetails[];
  overduePayments: PaymentDetails[];
}

/**
 * DashboardService — os números da tela inicial.
 * Não grava nada próprio: só CONSULTA e CALCULA a partir das outras partes.
 */
export class DashboardService {
  constructor(
    private readonly clients: ClientRepository,
    private readonly contracts: ContractRepository,
    private readonly payments: PaymentRepository,
    private readonly billing: BillingService,
    private readonly policy: RecurringBillingPolicy,
    private readonly clock: Clock,
  ) {}

  async getSummary(): Promise<DashboardSummary> {
    const today = this.clock.today();

    // 1º passo (precisa terminar ANTES dos cálculos): gerar as mensalidades do
    // mês e marcar atrasados. Por isso é um await separado, e não vai no Promise.all.
    await this.billing.sync(today);

    const { start, end } = monthRange(toYearMonth(today));

    // 2º passo: consultas independentes em paralelo.
    const [clientCounts, chargeable, receivedThisMonth, pending, overdue, upcoming, overdueList] =
      await Promise.all([
        this.clients.countByStatus(),
        this.contracts.findChargeable(),
        this.payments.sumAmount({ status: [PaymentStatus.PAGO], paidFrom: start, paidTo: end }),
        this.payments.sumAmount({ status: [PaymentStatus.PENDENTE] }),
        this.payments.sumAmount({ status: [PaymentStatus.ATRASADO] }),
        this.payments.findMany({ status: [PaymentStatus.PENDENTE], dueFrom: today }, { order: 'asc', limit: 8 }),
        this.payments.findMany({ status: [PaymentStatus.ATRASADO] }, { order: 'asc', limit: 8 }),
      ]);

    const total = sumCents(Object.values(clientCounts)); // soma de contagens (não é dinheiro, mas soma igual)

    return {
      clients: { ...clientCounts, total },
      receivedThisMonthCents: receivedThisMonth,
      monthlyRecurringRevenueCents: sumCents(chargeable.map((c) => this.policy.monthlyEquivalentCents(c))),
      pendingCents: pending,
      overdueCents: overdue,
      upcomingPayments: upcoming,
      overduePayments: overdueList,
    };
  }
}
