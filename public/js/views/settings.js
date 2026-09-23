/** CONFIGURAÇÕES — perfil do administrador e troca de senha. */
import { api } from '../api.js';
import { html, setView, toast } from '../ui.js';

export async function render(container) {
  const user = await api.get('/auth/me');
  setView(container, html`
    <div class="page-head"><div><h1>Configurações</h1></div></div>
    <section class="card"><div class="card-head"><h3>Conta</h3></div>
      <dl class="details"><div><dt>Nome</dt><dd>${user.name}</dd></div><div><dt>E-mail</dt><dd>${user.email}</dd></div></dl>
    </section>
    <section class="card"><div class="card-head"><h3>Trocar senha</h3></div>
      <form id="password-form" class="form-grid" novalidate>
        <label class="full">Senha atual<input type="password" name="currentPassword" autocomplete="current-password" /></label>
        <label>Nova senha<input type="password" name="newPassword" autocomplete="new-password" /></label>
        <label>Repita a nova senha<input type="password" name="confirm" autocomplete="new-password" /></label>
        <p id="password-error" class="form-error full" hidden></p>
        <div class="full"><button class="btn primary" type="submit">Salvar nova senha</button></div>
      </form>
    </section>
  `);

  const form = container.querySelector('#password-form');
  const errorBox = container.querySelector('#password-error');
  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    errorBox.hidden = true;
    const { currentPassword, newPassword, confirm } = Object.fromEntries(new FormData(form));
    try {
      if (newPassword !== confirm) throw new Error('As senhas novas não conferem.');
      await api.put('/auth/password', { currentPassword, newPassword });
      form.reset();
      toast('Senha alterada.');
    } catch (error) {
      errorBox.textContent = error.details?.map((d) => d.message).join('\n') ?? error.message;
      errorBox.hidden = false;
    }
  });
}
