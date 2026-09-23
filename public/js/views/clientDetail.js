/**
 * DETALHE DO CLIENTE:
 * Contato → Serviços contratados → Cobranças → Sites → Manutenções
 *
 * Uma chamada só: GET /api/clients/:id/overview
 * (o ClientOverviewService junta tudo com Promise.all no back-end).
 */
import { api } from '../api.js';
import {
  cancelPaymentAction, clientForm, contractForm, deleteAction, maintenanceForm, payAction, paymentForm, siteForm,
} from '../forms.js';
import {
  actionButton, formatCents, formatDate, html, label, onAction, pill, setView, table, toast,
} from '../ui.js';

export async function render(container, { id }) {
  const data = await api.get(`/clients/${id}/overview`);
  const { client, summary } = data;

  const paymentColumns = [
    { title: 'Referente a', render: (p) => html`${p.contract?.service.name ?? p.description ?? 'Avulso'}${p.referenceMonth ? html` <span class="muted small">(${p.referenceMonth})</span>` : ''}` },
    { title: 'Vencimento', render: (p) => formatDate(p.dueDate) },
    { title: 'Valor', className: 'num', render: (p) => formatCents(p.amountCents) },
    { title: 'Status', render: (p) => pill(p.status) },
    { title: 'Pago em', render: (p) => (p.paidAt ? html`${formatDate(p.paidAt)} · ${label(p.method)}` : '—') },
    { title: '', className: 'actions', render: (p) => (p.status === 'PENDENTE' || p.status === 'ATRASADO'
      ? html`${actionButton('pay', p.id, 'Receber')} ${actionButton('cancel-payment', p.id, 'Cancelar', 'danger')}` : '') },
  ];
  // Pagamentos avulsos/únicos e mensalidades numa lista só, do mais recente para o mais antigo.
  const byId = new Map([...data.payments, ...data.recurringPayments].map((p) => [p.id, p]));
  const allPayments = [...byId.values()]
    .sort((a, b) => String(b.dueDate).localeCompare(String(a.dueDate)));
  const info = [
    ['E-mail', client.email], ['Telefone', client.phone], ['WhatsApp', client.whatsapp],
    ['CPF/CNPJ', client.document], ['Endereço', client.address], ['Observações', client.notes],
  ].filter(([, value]) => value);

  setView(container, html`
    <div class="page-head">
      <div><a class="back" href="#/clientes">← Clientes</a>
        <h1>${client.name} ${pill(client.status)}</h1>
        <p class="muted">${client.company ? `${client.company} · ` : ''}cliente desde ${formatDate(client.createdAt)}</p></div>
      <div class="toolbar">
        <button class="btn" data-action="edit-client" data-id="${client.id}" type="button">Editar</button>
        <button class="btn danger" data-action="delete-client" data-id="${client.id}" type="button">Excluir</button>
      </div>
    </div>

    <div class="stats">
      <div class="stat ok"><div class="label">Total pago</div><div class="value">${formatCents(summary.totalPaidCents)}</div></div>
      <div class="stat warn"><div class="label">A receber</div><div class="value">${formatCents(summary.pendingCents)}</div></div>
      <div class="stat danger"><div class="label">Atrasado</div><div class="value">${formatCents(summary.overdueCents)}</div></div>
      <div class="stat"><div class="label">Próximo vencimento</div><div class="value small">${summary.nextPayment
        ? `${formatDate(summary.nextPayment.dueDate)} · ${formatCents(summary.nextPayment.amountCents)}` : '—'}</div></div>
    </div>

    ${info.length ? html`<section class="card"><div class="card-head"><h3>Contato</h3></div>
      <dl class="details">${info.map(([title, value]) => html`<div><dt>${title}</dt><dd>${value}</dd></div>`)}</dl>
    </section>` : ''}

    <section class="card">
      <div class="card-head"><h3>Serviços contratados</h3>${actionButton('new-contract', client.id, '+ Adicionar serviço', 'primary')}</div>
      ${table([
        { title: 'Serviço', render: (c) => c.service.name },
        { title: 'Cobrança', render: (c) => label(c.billingType) },
        { title: 'Valor', className: 'num', render: (c) => formatCents(c.priceCents) },
        { title: 'Vence dia', render: (c) => c.dueDay ?? '—' },
        { title: 'Status', render: (c) => pill(c.status) },
        { title: '', className: 'actions', render: (c) => html`${actionButton('edit-contract', c.id, 'Editar')} ${actionButton('delete-contract', c.id, 'Excluir', 'danger')}` },
      ], data.contracts, 'Nenhum serviço contratado ainda.')}
    </section>

    <section class="card">
      <div class="card-head"><h3>Cobranças</h3>${actionButton('new-payment', client.id, '+ Cobrança avulsa')}</div>
      ${table(paymentColumns, allPayments, 'Nenhuma cobrança.')}
    </section>

    <section class="card">
      <div class="card-head"><h3>Sites</h3>${actionButton('new-site', client.id, '+ Site')}</div>
      ${table([
        { title: 'Projeto', render: (s) => s.projectName },
        { title: 'Domínio', render: (s) => (s.url ? html`<a href="${s.url}" target="_blank" rel="noopener">${s.domain ?? s.url}</a>` : s.domain ?? '—') },
        { title: 'Status', render: (s) => pill(s.status) },
        { title: '', className: 'actions', render: (s) => actionButton('edit-site', s.id, 'Editar') },
      ], data.sites, 'Nenhum site cadastrado.')}
    </section>

    <section class="card">
      <div class="card-head"><h3>Manutenções</h3>${actionButton('new-maintenance', client.id, '+ Manutenção')}</div>
      ${table([
        { title: 'Data', render: (m) => formatDate(m.date) },
        { title: 'Descrição', render: (m) => m.description },
        { title: 'Valor', className: 'num', render: (m) => formatCents(m.chargedCents) },
        { title: 'Status', render: (m) => pill(m.status) },
        { title: '', className: 'actions', render: (m) => actionButton('edit-maintenance', m.id, 'Editar') },
      ], data.maintenances, 'Nenhuma manutenção registrada.')}
    </section>
  `);

  const reload = () => render(container, { id });
  const find = (list, itemId) => list.find((item) => item.id === itemId);
  const reloadIf = async (promise) => { if (await promise) await reload(); };

  onAction(container, {
    'edit-client': () => reloadIf(clientForm(client)),
    'delete-client': async () => {
      const deleted = await deleteAction(`/clients/${client.id}`,
        `Excluir ${client.name}? Isso apaga contratações, sites e manutenções dele. Se já houver pagamentos recebidos, a exclusão será recusada — use o status ENCERRADO.`);
      if (deleted) location.hash = '#/clientes';
    },
    'new-contract': () => reloadIf(contractForm({ clientId: client.id })),
    'edit-contract': (cid) => reloadIf(contractForm({ contract: find(data.contracts, cid) })),
    'delete-contract': (cid) => reloadIf(deleteAction(`/contracts/${cid}`, 'Excluir esta contratação?')),
    'new-site': () => reloadIf(siteForm({ clientId: client.id })),
    'edit-site': (sid) => reloadIf(siteForm({ site: find(data.sites, sid) })),
    'new-payment': async () => { if (await paymentForm({ clientId: client.id })) { toast('Pagamento criado.'); await reload(); } },
    pay: (pid) => reloadIf(payAction(pid)),
    'cancel-payment': (pid) => reloadIf(cancelPaymentAction(pid)),
    'new-maintenance': () => reloadIf(maintenanceForm({ clientId: client.id })),
    'edit-maintenance': (mid) => reloadIf(maintenanceForm({ maintenance: find(data.maintenances, mid) })),
  });
}
