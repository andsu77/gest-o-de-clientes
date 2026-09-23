import { PaymentStatus } from '../models/enums';
import type { RecurringBillingPolicy } from '../models/RecurringBillingPolicy';
import type { ContractRepository, PaymentRepository } from '../repositories/interfaces';
import { formatYearMonth, toYearMonth, type YearMonth } from '../utils/dates';

export interface GenerationResult {
  referenceMonth: string;
  created: number;
  skipped: number;
}

/**
 * BillingService — GERAÇÃO DAS MENSALIDADES.
 *
 * Não é cobrança automática real (não fala com banco/PIX). Ele apenas cria as
 * OBRIGAÇÕES financeiras do mês: "João deve R$ 70 com vencimento em 10/09".
 *
 * É IDEMPOTENTE: rodar 1 ou 50 vezes no mesmo mês dá o mesmo resultado,
 * porque antes de criar ele verifica se a mensalidade daquele mês já existe
 * (e o banco ainda tem uma UNIQUE(contract_id, reference_month) de garantia).
 * Por isso o Dashboard pode chamá-lo toda vez que abre, sem medo.
 */
export class BillingService {
  constructor(
    private readonly contracts: ContractRepository,
    private readonly payments: PaymentRepository,
    private readonly policy: RecurringBillingPolicy,
  ) {}

  async generateForMonth(reference: YearMonth): Promise<GenerationResult> {
    const referenceMonth = formatYearMonth(reference);
    const contracts = await this.contracts.findChargeable();

    let created = 0;
    let skipped = 0;

    // for...of + await processa UMA contratação por vez, em ordem.
    // Poderíamos usar Promise.all para fazer todas em paralelo, mas aqui a
    // ordem sequencial é mais simples de entender e evita disparar dezenas de
    // escritas simultâneas no banco. Para um painel pessoal, é mais que suficiente.
    for (const contract of contracts) {
      if (!this.policy.shouldChargeInMonth(contract, reference)) continue;

      const alreadyExists = await this.payments.existsForContractMonth(contract.id, referenceMonth);
      if (alreadyExists) {
        skipped++;
        continue;
      }

      await this.payments.create({
        clientId: contract.clientId,
        contractId: contract.id,
        amountCents: contract.priceCents,
        dueDate: this.policy.dueDateFor(contract, reference),
        status: PaymentStatus.PENDENTE,
        referenceMonth,
        description: `${contract.service.name} — ${referenceMonth}`,
      });
      created++;
    }

    return { referenceMonth, created, skipped };
  }

  /** Deixa o financeiro "em dia": gera o mês atual e marca atrasados. */
  async sync(today: Date): Promise<GenerationResult & { markedOverdue: number }> {
    const generation = await this.generateForMonth(toYearMonth(today));
    const markedOverdue = await this.payments.markOverdue(today);
    return { ...generation, markedOverdue };
  }
}
