/**
 * UTILITÁRIOS DE INTERFACE: formatação, tabelas, modal de formulário e avisos.
 * As telas (views/*.js) só descrevem O QUE mostrar; o COMO fica aqui.
 */

// ---------- Segurança: escapar HTML ----------
// Nunca coloque texto digitado pelo usuário direto em innerHTML:
// um nome como <img src=x onerror=...> viraria código (ataque XSS).
// A função html`` abaixo escapa automaticamente tudo que é interpolado.
const ESCAPES = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
export const escapeHtml = (value) => String(value ?? '').replace(/[&<>"']/g, (char) => ESCAPES[char]);

/** Marca um trecho como HTML já seguro (não será escapado de novo). */
export const raw = (value) => ({ __html: String(value) });

/**
 * Tagged template: html`<td>${cliente.nome}</td>` escapa cliente.nome.
 * Arrays são juntados; valores marcados com raw() entram como estão.
 */
export function html(strings, ...values) {
  const render = (value) => {
    if (Array.isArray(value)) return value.map(render).join('');
    if (value && typeof value === 'object' && '__html' in value) return value.__html;
    return escapeHtml(value);
  };
  return raw(strings.reduce((out, str, i) => out + str + (i < values.length ? render(values[i]) : ''), ''));
}

// ---------- Dinheiro (a API trabalha em CENTAVOS) ----------
const brl = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });
export const formatCents = (cents) => (cents === null || cents === undefined ? '—' : brl.format(cents / 100));

/** "1.234,56" / "70" / "70.5" -> centavos inteiros (123456 / 7000 / 7050). */
export function reaisToCents(text) {
  const clean = String(text ?? '').trim();
  if (!clean) return null;
  const normalized = clean.includes(',') ? clean.replace(/\./g, '').replace(',', '.') : clean;
  const number = Number(normalized);
  return Number.isFinite(number) ? Math.round(number * 100) : NaN;
}
export const centsToReais = (cents) =>
  cents === null || cents === undefined ? '' : (cents / 100).toFixed(2).replace('.', ',');

// ---------- Datas ----------
// A API devolve datas de calendário como "2026-09-10T00:00:00.000Z" (meia-noite UTC).
// Formatamos em UTC para o dia não "voltar" para 09/09 no fuso de Brasília.
const dateFmt = new Intl.DateTimeFormat('pt-BR', { timeZone: 'UTC' });
const dateTimeFmt = new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short', timeStyle: 'short' });
export const formatDate = (iso) => (iso ? dateFmt.format(new Date(iso)) : '—');
export const formatDateTime = (iso) => (iso ? dateTimeFmt.format(new Date(iso)) : '—');
export const toInputDate = (iso) => (iso ? String(iso).slice(0, 10) : '');
export function todayInput() {
  const now = new Date();
  return new Date(now.getTime() - now.getTimezoneOffset() * 60000).toISOString().slice(0, 10);
}
export const monthNames = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];

// ---------- Rótulos dos enums (a API usa valores sem acento) ----------
export const LABELS = {
  ATIVO: 'Ativo', INADIMPLENTE: 'Inadimplente', PAUSADO: 'Pausado', ENCERRADO: 'Encerrado', INATIVO: 'Inativo',
  UNICA: 'Única', MENSAL: 'Mensal', ANUAL: 'Anual', PERSONALIZADA: 'Personalizada',
  PENDENTE: 'Pendente', PAGO: 'Pago', ATRASADO: 'Atrasado', CANCELADO: 'Cancelado',
  PIX: 'PIX', DINHEIRO: 'Dinheiro', CARTAO: 'Cartão', TRANSFERENCIA: 'Transferência', OUTRO: 'Outro',
  DESENVOLVIMENTO: 'Desenvolvimento', ONLINE: 'Online',
  ABERTA: 'Aberta', EM_ANDAMENTO: 'Em andamento', CONCLUIDA: 'Concluída',
  AGUARDANDO: 'Aguardando', DEU_CERTO: 'Deu certo', NAO_DEU_CERTO: 'Não deu certo',
};
export const label = (value) => LABELS[value] ?? value ?? '—';
export const options = (...values) => values.map((value) => ({ value, label: label(value) }));

export const ENUMS = {
  clientStatus: ['ATIVO', 'INADIMPLENTE', 'PAUSADO', 'ENCERRADO'],
  billingType: ['UNICA', 'MENSAL', 'ANUAL', 'PERSONALIZADA'],
  serviceStatus: ['ATIVO', 'INATIVO'],
  contractStatus: ['ATIVO', 'PAUSADO', 'ENCERRADO'],
  paymentStatus: ['PENDENTE', 'PAGO', 'ATRASADO', 'CANCELADO'],
  paymentMethod: ['PIX', 'DINHEIRO', 'CARTAO', 'TRANSFERENCIA', 'OUTRO'],
  siteStatus: ['DESENVOLVIMENTO', 'ONLINE', 'PAUSADO', 'ENCERRADO'],
  maintenanceStatus: ['ABERTA', 'EM_ANDAMENTO', 'CONCLUIDA'],
  contactOutcome: ['AGUARDANDO', 'DEU_CERTO', 'NAO_DEU_CERTO'],
};

const TONE = {
  ATIVO: 'ok', PAGO: 'ok', ONLINE: 'ok', CONCLUIDA: 'ok',
  PENDENTE: 'warn', PAUSADO: 'warn', DESENVOLVIMENTO: 'warn', ABERTA: 'warn', EM_ANDAMENTO: 'warn',
  INADIMPLENTE: 'danger', ATRASADO: 'danger',
};
export const pill = (status) => html`<span class="pill ${TONE[status] ?? ''}">${label(status)}</span>`;

// ---------- Tabela ----------
/**
 * columns: [{ title, render: (row) => html/texto, className? }]
 * Devolve o HTML de uma tabela, ou uma mensagem quando não há linhas.
 */
export function table(columns, rows, emptyText = 'Nada por aqui ainda.') {
  if (!rows.length) return html`<p class="empty">${emptyText}</p>`;
  return html`<div class="table-wrap"><table>
    <thead><tr>${columns.map((col) => html`<th class="${col.className ?? ''}">${col.title}</th>`)}</tr></thead>
    <tbody>${rows.map((row) => html`<tr>${columns.map((col) => html`<td class="${col.className ?? ''}" data-label="${col.title}">${col.render(row)}</td>`)}</tr>`)}</tbody>
  </table></div>`;
}

/** Botão que será tratado por delegação de eventos (ver onAction). */
export const actionButton = (action, id, text, extraClass = '') =>
  html`<button type="button" class="btn small ${extraClass}" data-action="${action}" data-id="${id}">${text}</button>`;

/**
 * DELEGAÇÃO DE EVENTOS: em vez de colocar um listener em cada botão
 * (que são recriados a cada renderização), colocamos UM listener no container
 * e descobrimos qual botão foi clicado pelo atributo data-action.
 */
export function onAction(container, handlers) {
  container.addEventListener('click', async (event) => {
    const button = event.target.closest('[data-action]');
    if (!button || !container.contains(button)) return;
    const handler = handlers[button.dataset.action];
    if (!handler) return;
    event.preventDefault();
    try {
      await handler(Number(button.dataset.id), button);
    } catch (error) {
      toast(error.message, 'error');
    }
  });
}

// ---------- Aviso rápido ----------
let toastTimer;
export function toast(message, type = 'ok') {
  const box = document.getElementById('toast');
  box.textContent = message;
  box.className = `toast ${type === 'error' ? 'error' : ''}`;
  box.hidden = false;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => (box.hidden = true), 3500);
}

// ---------- Modal de formulário genérico ----------
/**
 * fields: [{ name, label, type, options, required, full, hint, placeholder }]
 * type: text | email | url | textarea | select | date | number | money | month
 * "money" mostra reais (70,00) e entrega CENTAVOS (7000) para a API.
 *
 * Retorna uma Promise que só resolve quando onSubmit terminar com sucesso
 * (ou com null se o usuário cancelar). Se a API recusar (ex.: 400 do Zod),
 * o erro aparece dentro do modal e o usuário corrige sem perder o que digitou.
 */
export function openForm({ title, fields, values = {}, submitText = 'Salvar', onSubmit }) {
  const dialog = document.getElementById('modal');
  const form = document.getElementById('modal-form');
  const body = document.getElementById('modal-body');
  const errorBox = document.getElementById('modal-error');
  const submit = document.getElementById('modal-submit');

  document.getElementById('modal-title').textContent = title;
  submit.textContent = submitText;
  errorBox.hidden = true;
  body.innerHTML = fields.map((field) => renderField(field, values[field.name]).__html).join('');

  return new Promise((resolve) => {
    const close = (result) => {
      form.removeEventListener('submit', handleSubmit);
      cancel.removeEventListener('click', handleCancel);
      dialog.removeEventListener('cancel', handleCancel);
      dialog.close();
      resolve(result);
    };
    const handleCancel = (event) => { event.preventDefault(); close(null); };
    async function handleSubmit(event) {
      event.preventDefault();
      errorBox.hidden = true;
      submit.disabled = true;
      try {
        const result = await onSubmit(readForm(form, fields));
        close(result ?? true);
      } catch (error) {
        errorBox.textContent = formatError(error, fields);
        errorBox.hidden = false;
      } finally {
        submit.disabled = false;
      }
    }
    const cancel = document.getElementById('modal-cancel');
    form.addEventListener('submit', handleSubmit);
    cancel.addEventListener('click', handleCancel);
    dialog.addEventListener('cancel', handleCancel);
    dialog.showModal();
  });
}

function renderField(field, value) {
  const common = html`name="${field.name}" ${raw(field.required ? 'required' : '')} placeholder="${field.placeholder ?? (field.type === 'money' ? '0,00' : '')}"`;
  let input;
  if (field.type === 'textarea') {
    input = html`<textarea ${common}>${value ?? ''}</textarea>`;
  } else if (field.type === 'select') {
    const opts = [...(field.required ? [] : [{ value: '', label: field.emptyLabel ?? '—' }]), ...field.options];
    input = html`<select ${common}>${opts.map((opt) =>
      html`<option value="${opt.value}" ${raw(String(opt.value) === String(value ?? '') ? 'selected' : '')}>${opt.label}</option>`)}</select>`;
  } else if (field.type === 'money') {
    input = html`<input ${common} inputmode="decimal" value="${centsToReais(value)}" />`;
  } else {
    const type = field.type === 'date' ? 'date' : field.type === 'month' ? 'month' : field.type ?? 'text';
    const shown = field.type === 'date' ? toInputDate(value) : value ?? '';
    input = html`<input ${common} type="${type}" value="${shown}" />`;
  }
  return html`<label class="${field.full || field.type === 'textarea' ? 'full' : ''}">${field.label}${field.required ? ' *' : ''}
    ${input}${field.hint ? html`<span class="hint">${field.hint}</span>` : ''}</label>`;
}

function readForm(form, fields) {
  const data = {};
  for (const field of fields) {
    const raw = form.elements[field.name].value;
    if (field.type === 'money') data[field.name] = reaisToCents(raw);
    else if (field.type === 'number') data[field.name] = raw === '' ? null : Number(raw);
    else data[field.name] = raw; // "" é tratado pelos validators do back-end (vira null)
  }
  return data;
}

/** Transforma os "details" do Zod em linhas legíveis: "Nome: Deve ter pelo menos 2 caractere(s)." */
function formatError(error, fields = []) {
  if (!Array.isArray(error.details) || !error.details.length) return error.message;
  const names = Object.fromEntries(fields.map((field) => [field.name, field.label]));
  return error.details.map((detail) => `${names[detail.field] ?? detail.field ?? ''}: ${detail.message}`).join('\n');
}

export const confirmAction = (message) => Promise.resolve(window.confirm(message));

export function setView(container, content) {
  container.innerHTML = content.__html ?? content;
}
