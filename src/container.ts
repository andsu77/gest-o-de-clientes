/**
 * CONTAINER (Composition Root)
 * ----------------------------
 * É AQUI que as peças são montadas. Toda a injeção de dependência do sistema
 * acontece neste arquivo, de baixo para cima:
 *
 *   PrismaClient -> Repositories -> Services -> Controllers
 *
 * Nenhuma classe cria as próprias dependências com "new" lá dentro; elas
 * recebem prontas pelo construtor. Resultado:
 *   - fica claro do que cada classe precisa (basta olhar o construtor)
 *   - nos testes, montamos as mesmas classes com peças falsas
 *
 * Em projetos maiores, bibliotecas (tsyringe, inversify) automatizam isso.
 * Aqui fazemos "na mão" de propósito, para você enxergar o mecanismo.
 */
import type { PrismaClient } from '@prisma/client';
import { env } from './config/env';
import { AuthController } from './controllers/AuthController';
import { CatalogController } from './controllers/CatalogController';
import { ClientController } from './controllers/ClientController';
import { ContractController } from './controllers/ContractController';
import { DashboardController } from './controllers/DashboardController';
import { MaintenanceController } from './controllers/MaintenanceController';
import { PaymentController } from './controllers/PaymentController';
import { ContactController } from './controllers/ContactController';
import { SiteController } from './controllers/SiteController';
import { RecurringBillingPolicy } from './models/RecurringBillingPolicy';
import { BcryptPasswordHasher } from './providers/BcryptPasswordHasher';
import { JwtTokenProvider } from './providers/JwtTokenProvider';
import { SystemClock } from './providers/SystemClock';
import { PrismaAuditLogRepository } from './repositories/prisma/PrismaAuditLogRepository';
import { PrismaClientRepository } from './repositories/prisma/PrismaClientRepository';
import { PrismaContractRepository } from './repositories/prisma/PrismaContractRepository';
import { PrismaMaintenanceRepository } from './repositories/prisma/PrismaMaintenanceRepository';
import { PrismaPaymentRepository } from './repositories/prisma/PrismaPaymentRepository';
import { PrismaServiceRepository } from './repositories/prisma/PrismaServiceRepository';
import { PrismaContactRepository } from './repositories/prisma/PrismaContactRepository';
import { PrismaSiteRepository } from './repositories/prisma/PrismaSiteRepository';
import { PrismaUserRepository } from './repositories/prisma/PrismaUserRepository';
import { AuditService } from './services/AuditService';
import { AuthService } from './services/AuthService';
import { BillingService } from './services/BillingService';
import { CatalogService } from './services/CatalogService';
import { ClientOverviewService } from './services/ClientOverviewService';
import { ClientService } from './services/ClientService';
import { ContractService } from './services/ContractService';
import { DashboardService } from './services/DashboardService';
import { FinanceService } from './services/FinanceService';
import { MaintenanceService } from './services/MaintenanceService';
import { PaymentService } from './services/PaymentService';
import { ContactService } from './services/ContactService';
import { SiteService } from './services/SiteService';

export function buildContainer(prisma: PrismaClient) {
  // 1) Providers e regras puras
  const clock = new SystemClock(env.APP_TIMEZONE);
  const passwordHasher = new BcryptPasswordHasher();
  const tokenProvider = new JwtTokenProvider(env.JWT_SECRET, env.JWT_EXPIRES_IN);
  const billingPolicy = new RecurringBillingPolicy();

  // 2) Repositories (única camada que conhece o Prisma)
  const repositories = {
    users: new PrismaUserRepository(prisma),
    clients: new PrismaClientRepository(prisma),
    services: new PrismaServiceRepository(prisma),
    contracts: new PrismaContractRepository(prisma),
    payments: new PrismaPaymentRepository(prisma),
    sites: new PrismaSiteRepository(prisma),
    maintenances: new PrismaMaintenanceRepository(prisma),
    auditLogs: new PrismaAuditLogRepository(prisma),
    contacts: new PrismaContactRepository(prisma),
  };
  const r = repositories;

  // 3) Services (regras de negócio)
  const audit = new AuditService(r.auditLogs);
  const authService = new AuthService(r.users, passwordHasher, tokenProvider);
  const clientService = new ClientService(r.clients, r.payments, audit);
  const catalogService = new CatalogService(r.services);
  const contractService = new ContractService(r.contracts, r.clients, r.services, r.payments, audit, billingPolicy);
  const paymentService = new PaymentService(r.payments, r.clients, r.contracts, audit, clock);
  const billingService = new BillingService(r.contracts, r.payments, billingPolicy);
  const siteService = new SiteService(r.sites, r.clients);
  const contactService = new ContactService(r.contacts);
  const maintenanceService = new MaintenanceService(r.maintenances, r.clients, r.sites);
  const overviewService = new ClientOverviewService(
    clientService, r.contracts, r.payments, r.sites, r.maintenances, audit, clock,
  );
  const dashboardService = new DashboardService(r.clients, r.contracts, r.payments, billingService, billingPolicy, clock);
  const financeService = new FinanceService(r.payments, r.contracts, billingPolicy, clock);

  // 4) Controllers (camada HTTP)
  const controllers = {
    auth: new AuthController(authService),
    clients: new ClientController(clientService, overviewService),
    catalog: new CatalogController(catalogService),
    contracts: new ContractController(contractService),
    payments: new PaymentController(paymentService, billingService, clock),
    sites: new SiteController(siteService),
    maintenance: new MaintenanceController(maintenanceService),
    contacts: new ContactController(contactService),
    dashboard: new DashboardController(dashboardService, financeService),
  };

  return { prisma, tokenProvider, controllers };
}

/** ReturnType extrai o tipo do retorno da função — não precisamos escrevê-lo à mão. */
export type Container = ReturnType<typeof buildContainer>;
