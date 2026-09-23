/**
 * PONTO DE ENTRADA DO FRONT-END
 * -----------------------------
 * Roteamento por "hash": a URL muda para #/clientes, #/clientes/3 etc.
 * O navegador NÃO recarrega a página; nós escutamos o evento "hashchange"
 * e desenhamos a tela certa. Simples, sem framework.
 */
import { api, auth } from './api.js';
import { toast } from './ui.js';
import * as dashboard from './views/dashboard.js';
import * as clients from './views/clients.js';
import * as clientDetail from './views/clientDetail.js';
import * as contacts from './views/contacts.js';
import * as services from './views/services.js';
import * as payments from './views/payments.js';
import * as finance from './views/finance.js';
import * as settings from './views/settings.js';

const routes = {
  dashboard, clientes: clients, contatos: contacts, servicos: services, pagamentos: payments,
  financeiro: finance, configuracoes: settings,
};

const loginScreen = document.getElementById('login-screen');
const shell = document.getElementById('app-shell');
let currentUser = null;

function showLogin() {
  shell.hidden = true;
  loginScreen.hidden = false;
  document.querySelector('#login-form input[name=email]').focus();
}

async function showApp(user) {
  currentUser = user;
  document.getElementById('user-name').textContent = user.name;
  document.getElementById('user-initial').textContent = user.name.trim().charAt(0).toUpperCase();
  loginScreen.hidden = true;
  shell.hidden = false;
  if (!location.hash) location.hash = '#/dashboard';
  else await renderRoute();
}

/** Lê "#/clientes/3" -> { name: 'clientes', id: '3' } e renderiza a view. */
async function renderRoute() {
  if (!auth.getToken()) return showLogin();
  const [, name = 'dashboard', id] = location.hash.split('/');
  const view = name === 'clientes' && id ? clientDetail : routes[name] ?? dashboard;

  document.querySelectorAll('.sidebar a[data-route]').forEach((link) => link.classList.toggle('active', link.dataset.route === name));
  document.querySelector('.sidebar').classList.remove('open');

  // Cada view recebe um container NOVO: assim os listeners da tela anterior somem junto.
  const old = document.getElementById('view');
  const container = old.cloneNode(false);
  old.replaceWith(container);
  container.innerHTML = '<p class="muted">Carregando…</p>';
  try {
    await view.render(container, { id: id ? Number(id) : undefined, user: currentUser });
  } catch (error) {
    container.innerHTML = '';
    const p = document.createElement('p');
    p.className = 'form-error';
    p.textContent = error.message;
    container.append(p);
  }
}

document.getElementById('login-form').addEventListener('submit', async (event) => {
  event.preventDefault();
  const form = event.currentTarget;
  const errorBox = document.getElementById('login-error');
  errorBox.hidden = true;
  try {
    const { token, user } = await api.post('/auth/login', {
      email: form.email.value,
      password: form.password.value,
    });
    auth.setToken(token);
    form.password.value = '';
    await showApp(user);
  } catch (error) {
    errorBox.textContent = error.message;
    errorBox.hidden = false;
  }
});

document.getElementById('logout-btn').addEventListener('click', async () => {
  // JWT é "stateless": o servidor não guarda sessão. Sair = o navegador descartar o token.
  await api.post('/auth/logout').catch(() => {});
  auth.clear();
  location.hash = '';
  showLogin();
});

document.getElementById('menu-toggle').addEventListener('click', () => {
  document.querySelector('.sidebar').classList.toggle('open');
});
document.getElementById('backdrop').addEventListener('click', () => {
  document.querySelector('.sidebar').classList.remove('open');
});

window.addEventListener('hashchange', renderRoute);
window.addEventListener('auth:expired', () => {
  toast('Sua sessão expirou. Entre novamente.', 'error');
  showLogin();
});

// Início: se já existe token, confirma com a API se ele ainda vale.
(async function start() {
  if (!auth.getToken()) return showLogin();
  try {
    await showApp(await api.get('/auth/me'));
  } catch {
    auth.clear();
    showLogin();
  }
})();
