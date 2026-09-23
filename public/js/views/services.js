/** CATÁLOGO DE SERVIÇOS — o que você vende e o preço padrão. */
import { api } from '../api.js';
import { deleteAction } from '../forms.js';
import { ENUMS, actionButton, formatCents, html, label, onAction, openForm, options, pill, setView, table, toast } from '../ui.js';

const fields = [
  { name: 'name', label: 'Nome', required: true, full: true },
  { name: 'priceCents', label: 'Preço padrão (R$)', type: 'money', required: true },
  { name: 'billingType', label: 'Tipo de cobrança', type: 'select', required: true, options: options(...ENUMS.billingType) },
  { name: 'status', label: 'Status', type: 'select', required: true, options: options(...ENUMS.serviceStatus) },
  { name: 'description', label: 'Descrição', type: 'textarea' },
];

export async function render(container) {
  const services = await api.get('/services');
  setView(container, html`
    <div class="page-head">
      <div><h1>Serviços</h1><p class="muted">O preço aqui é o padrão; cada contratação pode ter um valor próprio.</p></div>
      <button class="btn primary" data-action="new" data-id="0" type="button">+ Novo serviço</button>
    </div>
    <section class="card">${table([
      { title: 'Serviço', render: (s) => html`${s.name}${s.description ? html`<div class="muted small">${s.description}</div>` : ''}` },
      { title: 'Cobrança', render: (s) => label(s.billingType) },
      { title: 'Preço', className: 'num', render: (s) => formatCents(s.priceCents) },
      { title: 'Status', render: (s) => pill(s.status) },
      { title: '', className: 'actions', render: (s) => html`${actionButton('edit', s.id, 'Editar')} ${actionButton('delete', s.id, 'Excluir', 'danger')}` },
    ], services, 'Nenhum serviço cadastrado.')}</section>
  `);

  const reload = () => render(container);
  const save = async (service) => {
    const saved = await openForm({
      title: service ? 'Editar serviço' : 'Novo serviço',
      fields,
      values: service ?? { billingType: 'UNICA', status: 'ATIVO' },
      onSubmit: (data) => (service ? api.put(`/services/${service.id}`, data) : api.post('/services', data)),
    });
    if (saved) { toast('Serviço salvo.'); await reload(); }
  };
  onAction(container, {
    new: () => save(null),
    edit: (id) => save(services.find((s) => s.id === id)),
    delete: async (id) => (await deleteAction(`/services/${id}`, 'Excluir este serviço? Se ele já foi contratado, marque como INATIVO.')) && reload(),
  });
}
