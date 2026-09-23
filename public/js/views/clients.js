/**
 * LISTA DE CLIENTES com busca (nome, e-mail, telefone, empresa) e filtro de status.
 * A busca acontece no BACK-END: GET /api/clients?search=joao&status=ATIVO
 */
import { api } from '../api.js';
import { clientForm } from '../forms.js';
import { ENUMS, html, label, pill, setView, table, toast } from '../ui.js';

export async function render(container) {
  setView(container, html`
    <div class="page-head">
      <div><h1>Clientes</h1><p class="muted">Clique no nome para ver os detalhes.</p></div>
      <button class="btn primary" id="new-client" type="button">+ Novo cliente</button>
    </div>
    <div class="toolbar">
      <input id="search" type="search" placeholder="Buscar cliente…" />
      <select id="status-filter">
        <option value="">Todos</option>
        ${ENUMS.clientStatus.map((s) => html`<option value="${s}">${label(s)}</option>`)}
      </select>
    </div>
    <section class="card" id="list"></section>
  `);

  const list = container.querySelector('#list');
  const search = container.querySelector('#search');
  const status = container.querySelector('#status-filter');

  async function load() {
    const clients = await api.get('/clients', { search: search.value, status: status.value });
    setView(list, table([
      { title: 'Nome', render: (c) => html`<a href="#/clientes/${c.id}">${c.name}</a>` },
      { title: 'Empresa', render: (c) => c.company ?? '—' },
      { title: 'Contato', render: (c) => c.whatsapp ?? c.phone ?? c.email ?? '—' },
      { title: 'Status', render: (c) => pill(c.status) },
    ], clients, search.value || status.value ? 'Nenhum cliente encontrado.' : 'Nenhum cliente ainda. Clique em "+ Novo cliente" para cadastrar.'));
  }

  // "Debounce": espera o usuário parar de digitar 300ms antes de chamar a API,
  // em vez de fazer uma requisição a cada tecla.
  let timer;
  search.addEventListener('input', () => { clearTimeout(timer); timer = setTimeout(load, 300); });
  status.addEventListener('change', load);
  container.querySelector('#new-client').addEventListener('click', async () => {
    const created = await clientForm();
    if (created) { toast('Cliente criado.'); location.hash = `#/clientes/${created.id}`; }
  });

  await load();
}
