/**
 * FORMULÁRIOS E AÇÕES REUTILIZADOS POR VÁRIAS TELAS
 * -------------------------------------------------
 * Ex.: "registrar pagamento" aparece em Pagamentos, Mensalidades, Dashboard
 * e no detalhe do cliente. Definir UMA vez evita código duplicado.
 */
import { api } from './api.js';
import { ENUMS, confirmAction, openForm, options, todayInput, toast } from './ui.js';

// Listas usadas nos <select> (carregadas da API quando o formulário abre).
export const loadClientOptions = async () =>
  (await api.get('/clients')).map((client) => ({ value: client.id, label: client.name }));
export const loadServiceOptions = async () =>
  (await api.get('/services', { status: 'ATIVO' })).map((service) => ({ value: service.id, label: service.name }));

// ---------- Cliente ----------
export const clientFields = [
  { name: 'name', label: 'Nome', required: true, full: true },
  { name: 'company', label: 'Empresa' },
  { name: 'document', label: 'CPF/CNPJ' },
  { name: 'phone', label: 'Telefone' },
  { name: 'whatsapp', label: 'WhatsApp' },
  { name: 'email', label: 'E-mail', type: 'email' },
  { name: 'status', label: 'Status', type: 'select', options: options(...ENUMS.clientStatus), required: true },
  { name: 'address', label: 'Endereço', full: true },
  { name: 'notes', label: 'Observações', type: 'textarea' },
];

export function clientForm(client) {
  return openForm({
    title: client ? 'Editar cliente' : 'Novo cliente',
    fields: clientFields,
    values: client ?? { status: 'ATIVO' },
    onSubmit: (data) => (client ? api.put(`/clients/${client.id}`, data) : api.post('/clients', data)),
  });
}

// ---------- Contratação (cliente + serviço) ----------
export async function contractForm({ contract, clientId } = {}) {
  const editing = Boolean(contract);
  const fields = [
    ...(editing ? [] : [
      { name: 'clientId', label: 'Cliente', type: 'select', required: true, options: await loadClientOptions(), full: true },
      { name: 'serviceId', label: 'Serviço', type: 'select', required: true, options: await loadServiceOptions(), full: true },
    ]),
    { name: 'priceCents', label: 'Valor contratado (R$)', type: 'money', hint: editing ? '' : 'Vazio = preço do catálogo' },
    { name: 'billingType', label: 'Cobrança', type: 'select', options: options(...ENUMS.billingType), emptyLabel: editing ? '—' : 'Do catálogo' },
    { name: 'startDate', label: 'Início', type: 'date', required: true },
    { name: 'endDate', label: 'Término', type: 'date' },
    { name: 'dueDay', label: 'Dia de vencimento', type: 'number', hint: 'Para mensal/anual (1 a 31)' },
    { name: 'status', label: 'Status', type: 'select', options: options(...ENUMS.contractStatus), required: true },
    { name: 'notes', label: 'Observações', type: 'textarea' },
  ];
  return openForm({
    title: editing ? 'Editar contratação' : 'Nova contratação',
    fields,
    values: contract ?? { clientId, startDate: todayInput(), status: 'ATIVO' },
    onSubmit: (data) => (editing ? api.put(`/contracts/${contract.id}`, data) : api.post('/contracts', data)),
  });
}

// ---------- Pagamento ----------
export async function paymentForm({ payment, clientId } = {}) {
  const editing = Boolean(payment);
  const fields = [
    ...(editing ? [] : [{ name: 'clientId', label: 'Cliente', type: 'select', required: true, options: await loadClientOptions(), full: true }]),
    { name: 'description', label: 'Descrição', full: true, placeholder: 'Ex.: Ajuste extra no site' },
    { name: 'amountCents', label: 'Valor (R$)', type: 'money', required: true },
    { name: 'dueDate', label: 'Vencimento', type: 'date', required: true },
    { name: 'notes', label: 'Observações', type: 'textarea' },
  ];
  return openForm({
    title: editing ? 'Editar pagamento' : 'Novo pagamento avulso',
    fields,
    values: payment ?? { clientId, dueDate: todayInput() },
    onSubmit: (data) => (editing ? api.put(`/payments/${payment.id}`, data) : api.post('/payments', data)),
  });
}

/** Registrar como pago: guarda a data REAL do pagamento e o método. */
export async function payAction(id) {
  const done = await openForm({
    title: 'Registrar pagamento',
    submitText: 'Confirmar pagamento',
    fields: [
      { name: 'method', label: 'Método', type: 'select', required: true, options: options(...ENUMS.paymentMethod) },
      { name: 'paidAt', label: 'Data do pagamento', type: 'date', required: true },
      { name: 'notes', label: 'Observações', type: 'textarea' },
    ],
    values: { method: 'PIX', paidAt: todayInput() },
    onSubmit: (data) => api.post(`/payments/${id}/pay`, data),
  });
  if (done) toast('Pagamento registrado.');
  return done;
}

export async function cancelPaymentAction(id) {
  if (!(await confirmAction('Cancelar esta cobrança? Ela continua no histórico como CANCELADO.'))) return null;
  const result = await api.post(`/payments/${id}/cancel`);
  toast('Cobrança cancelada.');
  return result;
}

// ---------- Site ----------
export async function siteForm({ site, clientId } = {}) {
  const editing = Boolean(site);
  const fields = [
    ...(editing ? [] : [{ name: 'clientId', label: 'Cliente', type: 'select', required: true, options: await loadClientOptions(), full: true }]),
    { name: 'projectName', label: 'Nome do projeto', required: true, full: true },
    { name: 'domain', label: 'Domínio', placeholder: 'padariadojoao.com.br' },
    { name: 'url', label: 'URL', type: 'url', placeholder: 'https://...' },
    { name: 'hosting', label: 'Hospedagem' },
    { name: 'publishedAt', label: 'Publicado em', type: 'date' },
    { name: 'status', label: 'Status', type: 'select', required: true, options: options(...ENUMS.siteStatus) },
    { name: 'notes', label: 'Observações', type: 'textarea' },
  ];
  return openForm({
    title: editing ? 'Editar site' : 'Novo site',
    fields,
    values: site ?? { clientId, status: 'DESENVOLVIMENTO' },
    onSubmit: (data) => (editing ? api.put(`/sites/${site.id}`, data) : api.post('/sites', data)),
  });
}

// ---------- Manutenção ----------
export async function maintenanceForm({ maintenance, clientId } = {}) {
  const editing = Boolean(maintenance);
  const ownerId = maintenance?.clientId ?? clientId;
  // Se já sabemos o cliente, mostramos só os sites dele.
  const sites = await api.get('/sites', ownerId ? { clientId: ownerId } : {});
  const siteOptions = sites.map((site) => ({ value: site.id, label: `${site.projectName} (${site.client.name})` }));
  const fields = [
    ...(editing ? [] : [{ name: 'clientId', label: 'Cliente', type: 'select', required: true, options: await loadClientOptions(), full: true }]),
    { name: 'siteId', label: 'Site', type: 'select', options: siteOptions, emptyLabel: 'Nenhum', full: true },
    { name: 'date', label: 'Data', type: 'date', required: true },
    { name: 'type', label: 'Tipo', required: true, placeholder: 'Ex.: Ajuste visual' },
    { name: 'description', label: 'Descrição', type: 'textarea', required: true },
    { name: 'status', label: 'Status', type: 'select', required: true, options: options(...ENUMS.maintenanceStatus) },
    { name: 'chargedCents', label: 'Valor cobrado (R$)', type: 'money', hint: 'Opcional' },
    { name: 'notes', label: 'Observações', type: 'textarea' },
  ];
  return openForm({
    title: editing ? 'Editar manutenção' : 'Nova manutenção',
    fields,
    values: maintenance ?? { clientId, date: todayInput(), status: 'ABERTA' },
    onSubmit: (data) => (editing ? api.put(`/maintenance/${maintenance.id}`, data) : api.post('/maintenance', data)),
  });
}

/** Excluir genérico com confirmação. */
export async function deleteAction(path, message) {
  if (!(await confirmAction(message))) return false;
  await api.del(path);
  toast('Excluído.');
  return true;
}
