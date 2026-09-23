/**
 * COBRANÇAS — todas as cobranças (únicas, avulsas e mensalidades).
 * Pagamentos não são excluídos: são CANCELADOS, para manter o histórico financeiro.
 */
import { api } from '../api.js';
import { cancelPaymentAction, loadClientOptions, payAction, paymentForm } from '../forms.js';
import { ENUMS, actionButton, formatCents, formatDate, html, label, onAction, pill, setView, table, toast } from '../ui.js';

export const paymentColumns = [
  { title: 'Cliente', render: (p) => html`<a href="#/clientes/${p.client.id}">${p.client.name}</a>` },
  { title: 'Referente a', render: (p) => html`${p.contract?.service.name ?? p.description ?? 'Avulso'}${p.referenceMonth ? html` <span class="muted small">(${p.referenceMonth})</span>` : ''}` },
  { title: 'Vencimento', render: (p) => formatDate(p.dueDate) },
  { title: 'Valor', className: 'num', render: (p) => formatCents(p.amountCents) },
  { title: 'Status', render: (p) => pill(p.status) },
  { title: 'Pago em', render: (p) => (p.paidAt ? html`${formatDate(p.paidAt)} · ${label(p.method)}` : '—') },
  { title: '', className: 'actions', render: (p) => (p.status === 'PENDENTE' || p.status === 'ATRASADO'
    ? html`${actionButton('pay', p.id, 'Receber')} ${actionButton('edit', p.id, 'Editar')} ${actionButton('cancel', p.id, 'Cancelar', 'danger')}` : '') },
];

export async function render(container) {
  const clients = await loadClientOptions();
  setView(container, html`
    <div class="page-head">
      <div><h1>Cobranças</h1><p class="muted">Pagamentos únicos, avulsos e mensalidades.</p></div>
      <button class="btn primary" data-action="new" data-id="0" type="button">+ Nova cobrança</button>
    </div>
    <div class="toolbar">
      <select id="status-filter"><option value="">Todos os status</option>
        ${ENUMS.paymentStatus.map((s) => html`<option value="${s}">${label(s)}</option>`)}</select>
      <select id="client-filter"><option value="">Todos os clientes</option>
        ${clients.map((c) => html`<option value="${c.value}">${c.label}</option>`)}</select>
    </div>
    <section class="card" id="list"></section>
  `);
  const list = container.querySelector('#list');
  const status = container.querySelector('#status-filter');
  const client = container.querySelector('#client-filter');
  let payments = [];

  async function load() {
    payments = await api.get('/payments', { status: status.value, clientId: client.value });
    const total = payments.filter((p) => p.status !== 'CANCELADO').reduce((sum, p) => sum + p.amountCents, 0);
    setView(list, html`${table(paymentColumns, payments, 'Nenhuma cobrança encontrada.')}
      ${payments.length ? html`<p class="muted small list-foot">${payments.length} cobrança(s) · total (sem canceladas): ${formatCents(total)}</p>` : ''}`);
  }
  status.addEventListener('change', load);
  client.addEventListener('change', load);
  onAction(container, {
    new: async () => { if (await paymentForm()) { toast('Cobrança criada.'); await load(); } },
    pay: async (id) => (await payAction(id)) && load(),
    edit: async (id) => (await paymentForm({ payment: payments.find((p) => p.id === id) })) && load(),
    cancel: async (id) => (await cancelPaymentAction(id)) && load(),
  });
  await load();
}
