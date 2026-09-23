/**
 * FINANCEIRO — totais e receita por mês do ano escolhido.
 * GET /api/finance?year=2026
 */
import { api } from '../api.js';
import { formatCents, html, monthNames, setView, table } from '../ui.js';

export async function render(container) {
  const year = new Date().getFullYear();
  setView(container, html`
    <div class="page-head">
      <div><h1>Financeiro</h1><p class="muted">Quanto você recebeu e quanto tem a receber.</p></div>
      <div class="toolbar"><select id="year">${[year, year - 1, year - 2].map((y) => html`<option value="${y}">${y}</option>`)}</select></div>
    </div>
    <div id="report"></div>
  `);

  const yearSelect = container.querySelector('#year');
  const report = container.querySelector('#report');

  async function load() {
    const data = await api.get('/finance', { year: yearSelect.value });
    const t = data.totals;
    const yearTotal = data.monthlyRevenue.months.reduce((sum, m) => sum + m.receivedCents, 0);
    const best = Math.max(1, ...data.monthlyRevenue.months.map((m) => m.receivedCents));

    setView(report, html`
      <div class="stats">
        <div class="stat ok"><div class="label">Recebido este mês</div><div class="value">${formatCents(t.receivedThisMonthCents)}</div></div>
        <div class="stat"><div class="label">Receita recorrente mensal</div><div class="value">${formatCents(t.monthlyRecurringRevenueCents)}</div></div>
        <div class="stat warn"><div class="label">A receber</div><div class="value">${formatCents(t.pendingCents)}</div></div>
        <div class="stat danger"><div class="label">Atrasado</div><div class="value">${formatCents(t.overdueCents)}</div></div>
      </div>
      <section class="card">
        <div class="card-head"><h3>Receita por mês — ${data.monthlyRevenue.year}</h3><span class="muted">Total: <strong>${formatCents(yearTotal)}</strong></span></div>
        ${table([
          { title: 'Mês', render: (m) => monthNames[m.month - 1] },
          { title: '', render: (m) => html`<div class="bar"><span style="width:${Math.round((m.receivedCents / best) * 100)}%"></span></div>` },
          { title: 'Recebido', className: 'num', render: (m) => formatCents(m.receivedCents) },
        ], data.monthlyRevenue.months)}
      </section>
    `);
  }

  yearSelect.addEventListener('change', () => load().catch((e) => setView(report, html`<p class="form-error">${e.message}</p>`)));
  await load();
}
