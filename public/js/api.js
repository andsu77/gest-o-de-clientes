/**
 * CLIENTE HTTP DO FRONT-END
 * -------------------------
 * Todas as chamadas para a API passam por aqui. Assim, regras como
 * "mandar o token" e "se der 401, voltar para o login" ficam em UM lugar.
 *
 * fetch() devolve uma Promise. Com async/await, lemos o código de cima
 * para baixo, mesmo sendo assíncrono — o mesmo conceito do back-end.
 */
const TOKEN_KEY = 'gc_token';

export const auth = {
  getToken: () => localStorage.getItem(TOKEN_KEY),
  setToken: (token) => localStorage.setItem(TOKEN_KEY, token),
  clear: () => localStorage.removeItem(TOKEN_KEY),
};

/** Erro com a mensagem e os detalhes que a API devolveu ({ error: { message, details } }). */
export class ApiError extends Error {
  constructor(status, message, details) {
    super(message);
    this.status = status;
    this.details = details;
  }
}

/** Monta "?a=1&b=2" ignorando filtros vazios. */
function toQuery(params = {}) {
  const entries = Object.entries(params).filter(([, value]) => value !== undefined && value !== null && value !== '');
  return entries.length ? `?${new URLSearchParams(entries)}` : '';
}

async function request(method, path, { body, query } = {}) {
  const headers = { Accept: 'application/json' };
  const token = auth.getToken();
  // O token JWT vai no cabeçalho Authorization. O middleware authenticate.ts lê isto.
  if (token) headers.Authorization = `Bearer ${token}`;
  if (body !== undefined) headers['Content-Type'] = 'application/json';

  let response;
  try {
    response = await fetch(`/api${path}${toQuery(query)}`, {
      method,
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  } catch {
    throw new ApiError(0, 'Não foi possível falar com o servidor. Ele está rodando?');
  }

  if (response.status === 204) return null;
  const data = await response.json().catch(() => null);

  if (!response.ok) {
    // 401 em rota protegida = token ausente/expirado: volta para o login.
    if (response.status === 401 && path !== '/auth/login') {
      auth.clear();
      window.dispatchEvent(new Event('auth:expired'));
    }
    throw new ApiError(response.status, data?.error?.message ?? `Erro ${response.status}`, data?.error?.details);
  }
  return data;
}

export const api = {
  get: (path, query) => request('GET', path, { query }),
  post: (path, body) => request('POST', path, { body: body ?? {} }),
  put: (path, body) => request('PUT', path, { body }),
  del: (path) => request('DELETE', path),
};
