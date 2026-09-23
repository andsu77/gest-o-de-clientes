import type {
  AuditLog,
  Client,
  ContractDetails,
  MaintenanceDetails,
  PaymentDetails,
  SiteDetails,
} from '../models/entities';
import { PaymentStatus } from '../models/enums';
import type { Clock } from '../providers/interfaces';
import type {
  ContractRepository,
  MaintenanceRepository,
  PaymentRepository,
  SiteRepository,
} from '../repositories/interfaces';
import { sumCents } from '../utils/money';
import type { AuditService } from './AuditService';
import type { ClientService } from './ClientService';

export interface ClientOverview {
  client: Client;
  summary: {
    totalPaidCents: number;
    pendingCents: number;
    overdueCents: number;
    nextPayment: PaymentDetails | null;
  };
  contracts: ContractDetails[];
  sites: SiteDetails[];
  payments: PaymentDetails[]; // todos os pagamentos
  recurringPayments: PaymentDetails[]; // só as mensalidades/anuidades
  maintenances: MaintenanceDetails[];
  history: AuditLog[];
}

/**
 * ClientOverviewService — a "ficha completa" do cliente.
 *
 * Exemplo de COMPOSIÇÃO: em vez de herdar de algo, esta classe é MONTADA com
 * outras peças (ClientService, repositories, AuditService) e coordena todas.
 * Regra prática: prefira composição ("tem um") a herança ("é um").
 */
export class ClientOverviewService {
  constructor(
    private readonly clientService: ClientService,
    private readonly contracts: ContractRepository,
    private readonly payments: PaymentRepository,
    private readonly sites: SiteRepository,
    private readonly maintenances: MaintenanceRepository,
    private readonly audit: AuditService,
    private readonly clock: Clock,
  ) {}

  async getOverview(clientId: number): Promise<ClientOverview> {
    const client = await this.clientService.getById(clientId); // 404 se não existir
    await this.payments.markOverdue(this.clock.today());

    // PROMISE.ALL NA PRÁTICA:
    // As 5 consultas abaixo não dependem uma da outra. Com "await" uma a uma,
    // o tempo total seria a SOMA dos tempos. Com Promise.all, elas rodam em
    // paralelo e o tempo total é o da MAIS LENTA.
    // A desestruturação [a, b, c] recebe os resultados na MESMA ordem do array.
    const [contracts, payments, sites, maintenances, history] = await Promise.all([
      this.contracts.findMany({ clientId }),
      this.payments.findMany({ clientId }, { order: 'desc' }),
      this.sites.findMany({ clientId }),
      this.maintenances.findMany({ clientId }),
      this.audit.listByClient(clientId),
    ]);

    const amountsWithStatus = (status: PaymentStatus): number =>
      sumCents(payments.filter((payment) => payment.status === status).map((payment) => payment.amountCents));

    // Próximo vencimento = pendente/atrasado com a MENOR data.
    const openPayments = payments
      .filter((p) => p.status === PaymentStatus.PENDENTE || p.status === PaymentStatus.ATRASADO)
      .sort((a, b) => a.dueDate.getTime() - b.dueDate.getTime());

    return {
      client,
      summary: {
        totalPaidCents: amountsWithStatus(PaymentStatus.PAGO),
        pendingCents: amountsWithStatus(PaymentStatus.PENDENTE),
        overdueCents: amountsWithStatus(PaymentStatus.ATRASADO),
        nextPayment: openPayments[0] ?? null,
      },
      contracts,
      sites,
      payments,
      recurringPayments: payments.filter((payment) => payment.referenceMonth !== null),
      maintenances,
      history,
    };
  }
}
