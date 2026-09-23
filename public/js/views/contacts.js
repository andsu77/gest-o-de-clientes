/**
 * CONTATOS — pessoas para entrar em contato no futuro (ainda não são clientes).
 * Em cada linha: marcar "mensagem enviada" e escolher o resultado do contato.
 * A lista é pequena, então buscamos tudo uma vez e filtramos no navegador.
 */
import { api } from '../api.js';
import { deleteAction } from '../forms.js';
import { ENUMS, actionButton, formatDate, html, label, onAction, openForm, options, raw, setView, table, toast } from '../ui.js';

const fields = [
  { name: 'name', label: 'Nome', required: true, full: true },
  { name: 'phone', label: 'Telefone / WhatsApp' },
  { name: 'email', label: 'E-mail', type: 'email' },
  { name: 'contactDate', label: 'Entrar em contato em', type: 'date', hint: 'Opcional' },
  { name: 'outcome', label: 'Resultado', type: 'select', required: true, options: options(...ENUMS.contactOutcome) },
  { name: 'notes', label: 'Observações', type: 'textarea', placeholder: 'Ex.: indicação do João, quer um site para a loja' },
];

const TABS = [
  { key: 'todos', title: 'Todos', match: () => true },
  { key: 'pendentes', title: 'A contatar', match: (c) => !c.messaged },
  { key: 'enviadas', title: 'Mensagem enviada', match: (c) => c.messaged && c.outcome === 'AGUARDANDO' },
  { key: 'certo', title: 'Deu certo', match: (c) => c.outcome === 'DEU_CERTO' },
  { key: 'nao', title: 'Não deu certo', match: (c) => c.outcome === 'NAO_DEU_CERTO' },
];

/** "(11) 98888-1010" -> link do WhatsApp com DDI 55 quando faltar. */
function whatsappLink(phone) {
  const digits = String(phone ?? '').replace(/\D/g, '');
  if (digits.length < 10) return null;
  return `https://wa.me/${digits.length <= 11 ? `55${digits}` : digits}`;
}

export async function render(container) {
  setView(container, html`
    <div class="page-head">
      <div><h1>Contatos</h1><p class="muted">Pessoas para entrar em contato no futuro.</p></div>
      <button class="btn primary" data-action="new" data-id="0" type="button">+ Novo contato</button>
    </div>
    <div class="tabs" id="tabs" role="tablist"></div>
    <div class="toolbar"><input id="search" type="search" placeholder="Buscar contato…" /></div>
    <section class="card" id="list"></section>
  `);

  const list = container.querySelector('#list');
  const tabsBox = container.querySelector('#tabs');
  const search = container.querySelector('#search');
  let contacts = [];
  let activeTab = 'todos';

  function draw() {
    tabsBox.innerHTML = TABS.map((tab) => html`<button type="button" role="tab" class="tab ${tab.key === activeTab ? 'active' : ''}" data-tab="${tab.key}">${tab.title}<span class="count">${contacts.filter(tab.match).length}</span></button>`.__html).join('');

    const term = search.value.trim().toLowerCase();
    const tab = TABS.find((t) => t.key === activeTab);
    const rows = contacts.filter(tab.match).filter((c) => !term
      || [c.name, c.phone, c.email, c.notes].some((value) => String(value ?? '').toLowerCase().includes(term)));

    setView(list, table([
      { title: 'Nome', className: 'title', render: (c) => html`<strong>${c.name}</strong>${c.notes ? html`<div class="muted small note">${c.notes}</div>` : ''}` },
      { title: 'Contato', render: (c) => {
        const wa = whatsappLink(c.phone);
        if (wa) return html`<a href="${wa}" target="_blank" rel="noopener">${c.phone}</a>`;
        return c.phone ?? c.email ?? '—';
      } },
      { title: 'Quando', render: (c) => formatDate(c.contactDate) },
      { title: 'Mensagem', render: (c) => html`<label class="check"><input type="checkbox" data-toggle="${c.id}" ${raw(c.messaged ? 'checked' : '')} /><span>${c.messaged ? 'Enviada' : 'Não'}</span></label>` },
      { title: 'Resultado', render: (c) => html`<select class="outcome ${c.outcome}" data-outcome="${c.id}">${ENUMS.contactOutcome.map((o) =>
        html`<option value="${o}" ${raw(o === c.outcome ? 'selected' : '')}>${label(o)}</option>`)}</select>` },
      { title: '', className: 'actions', render: (c) => html`${actionButton('edit', c.id, 'Editar')} ${actionButton('delete', c.id, 'Excluir', 'danger')}` },
    ], rows, contacts.length ? 'Nenhum contato neste filtro.' : 'Nenhum contato ainda. Clique em "+ Novo contato" para adicionar.'));
  }

  async function load() {
    contacts = await api.get('/contacts');
    draw();
  }

  async function save(id, patch, message) {
    try {
      const updated = await api.put(`/contacts/${id}`, patch);
      contacts = contacts.map((c) => (c.id === id ? updated : c));
      toast(message);
    } catch (error) {
      toast(error.message, 'error');
    }
    draw();
  }

  const edit = async (contact) => {
    const saved = await openForm({
      title: contact ? 'Editar contato' : 'Novo contato',
      fields,
      values: contact ?? { outcome: 'AGUARDANDO' },
      onSubmit: (data) => (contact ? api.put(`/contacts/${contact.id}`, data) : api.post('/contacts', data)),
    });
    if (saved) { toast('Contato salvo.'); await load(); }
  };

  tabsBox.addEventListener('click', (event) => {
    const button = event.target.closest('[data-tab]');
    if (!button) return;
    activeTab = button.dataset.tab;
    draw();
  });
  let timer;
  search.addEventListener('input', () => { clearTimeout(timer); timer = setTimeout(draw, 200); });

  // Checkbox e <select> da própria linha salvam na hora (sem abrir formulário).
  list.addEventListener('change', (event) => {
    const { toggle, outcome } = event.target.dataset;
    if (toggle) save(Number(toggle), { messaged: event.target.checked }, event.target.checked ? 'Marcado como enviada.' : 'Desmarcado.');
    if (outcome) save(Number(outcome), { outcome: event.target.value }, `Resultado: ${label(event.target.value)}.`);
  });

  onAction(container, {
    new: () => edit(null),
    edit: (id) => edit(contacts.find((c) => c.id === id)),
    delete: async (id) => (await deleteAction(`/contacts/${id}`, 'Excluir este contato?')) && load(),
  });

  await load();
}
