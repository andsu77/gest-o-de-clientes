/**
 * SEED — DADOS INICIAIS
 * =====================
 * Rode com:  npm run db:seed   (ou automaticamente após "npx prisma migrate reset")
 *
 * ⚠️ ATENÇÃO: este script APAGA todos os dados antes de inserir os iniciais.
 *    Ele se recusa a rodar com NODE_ENV=production.
 *
 * Cria apenas:
 *  - o usuário administrador (SEED_ADMIN_EMAIL / SEED_ADMIN_PASSWORD do .env)
 *  - um catálogo básico de serviços
 * Nenhum cliente é criado: o sistema começa vazio, pronto para uso real.
 */
import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function resetDatabase(): Promise<void> {
  // Ordem importa: primeiro as tabelas "filhas", depois as "mães" (chaves estrangeiras).
  await prisma.auditLog.deleteMany();
  await prisma.contact.deleteMany();
  await prisma.maintenance.deleteMany();
  await prisma.payment.deleteMany();
  await prisma.site.deleteMany();
  await prisma.contract.deleteMany();
  await prisma.service.deleteMany();
  await prisma.client.deleteMany();
  await prisma.user.deleteMany();
}

async function main(): Promise<void> {
  if (process.env.NODE_ENV === 'production') {
    throw new Error('O seed apaga todos os dados e não pode rodar em produção.');
  }

  console.log('🧹 Limpando banco...');
  await resetDatabase();

  // ------------------------------------------------------------------ Admin
  const adminEmail = (process.env.SEED_ADMIN_EMAIL ?? 'admin@gestao.dev').toLowerCase();
  const adminPassword = process.env.SEED_ADMIN_PASSWORD ?? 'admin123';
  await prisma.user.create({
    data: {
      name: 'Administrador',
      email: adminEmail,
      passwordHash: await bcrypt.hash(adminPassword, 10), // nunca a senha pura!
    },
  });

  // ------------------------------------------------------------------ Catálogo
  await prisma.service.createMany({
    data: [
      { name: 'Criação de site', description: 'Site institucional de até 5 páginas com botão de WhatsApp.', priceCents: 70000, billingType: 'UNICA' },
      { name: 'Landing page', description: 'Página única de vendas/captação.', priceCents: 49700, billingType: 'UNICA' },
      { name: 'Manutenção de site', description: 'Alterações pequenas, atualizações e backup.', priceCents: 7000, billingType: 'MENSAL' },
      { name: 'Hospedagem', description: 'Hospedagem gerenciada.', priceCents: 3000, billingType: 'MENSAL' },
      { name: 'Domínio .com.br', description: 'Registro e renovação anual do domínio.', priceCents: 4000, billingType: 'ANUAL' },
      { name: 'Suporte técnico avulso', description: 'Atendimento sob demanda.', priceCents: 10000, billingType: 'PERSONALIZADA' },
    ],
  });

  console.log('✅ Seed concluído!');
  console.log(`   Login: ${adminEmail} / ${adminPassword}`);
}

main()
  .catch((error) => {
    console.error('❌ Erro no seed:', error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
