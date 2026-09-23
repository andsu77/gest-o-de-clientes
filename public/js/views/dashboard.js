/**
 * INÍCIO — uma única chamada GET /api/dashboard.
 * No back-end, o DashboardService usa Promise.all para buscar tudo em paralelo.
 */
import { api } from '../api.js';
import { payAction } from '../forms.js';
import { actionButton, formatCents, formatDate, html, onAction, pill, setView, table } from '../ui.js';

export async function render(container) {
  const data = await api.get('/dashboard');
  const c = data.clients;

  const columns = [
    { title: 'Cliente', render: (p) => html`<a href="#/clientes/${p.client.id}">${p.client.name}</a>` },
    { title: 'Referente a', render: (p) => p.contract?.service.name ?? p.description ?? 'Avulso' },
    { title: 'Vencimento', render: (p) => formatDate(p.dueDate) },
    { title: 'Valor', className: 'num', render: (p) => formatCents(p.amountCents) },
    { title: 'Status', render: (p) => pill(p.status) },
    { title: '', className: 'actions', render: (p) => actionButton('pay', p.id, 'Receber') },
  ];
  // Atrasados primeiro, depois os próximos vencimentos.
  const toReceive = [...data.overduePayments, ...data.upcomingPayments];

  setView(container, html`
    <div class="page-head">
      <div><h1>Início</h1><p class="muted">Resumo do seu negócio hoje.</p></div>
      <a class="btn primary" href="#/clientes">Ver clientes</a>
    </div>

    <div class="stats">
      <div class="stat ok"><div class="label">Clientes ativos</div><div class="value">${c.ATIVO}</div></div>
      <div class="stat"><div class="label">Recebido este mês</div><div class="value">${formatCents(data.receivedThisMonthCents)}</div></div>
      <div class="stat warn"><div class="label">A receber</div><div class="value">${formatCents(data.pendingCents)}</div></div>
      <div class="stat danger"><div class="label">Atrasado</div><div class="value">${formatCents(data.overdueCents)}</div></div>
    </div>

    <section class="card">
      <div class="card-head"><h3>Próximos recebimentos</h3><a href="#/pagamentos">Ver todas as cobranças</a></div>
      ${table(columns, toReceive, c.total ? 'Nada a receber nos próximos dias. 🎉' : 'Cadastre seu primeiro cliente em Clientes para começar.')}
    </section>
  `);

  onAction(container, {
    pay: async (id) => (await payAction(id)) && render(container),
  });
}
