const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}

function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('vetor_ai_token');
}

export function setToken(token: string) {
  localStorage.setItem('vetor_ai_token', token);
}

export function clearToken() {
  localStorage.removeItem('vetor_ai_token');
}

export async function apiFetch<T = any>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const token = getToken();

  const res = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  });

  if (res.status === 401) {
    clearToken();
    // Se a própria chamada de login falhou (senha errada, usuário não
    // existe etc.), NÃO force o redirect — deixa o erro real (vindo do
    // corpo da resposta) aparecer na tela de login, em vez de mascarar
    // tudo com "Sessão expirada" e recarregar a página antes de dar
    // tempo de ler.
    if (path === '/auth/login') {
      const body = await res.json().catch(() => ({}));
      throw new ApiError(401, body.message || 'Credenciais inválidas');
    }
    if (typeof window !== 'undefined') window.location.href = '/login';
    throw new ApiError(401, 'Sessão expirada');
  }

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new ApiError(res.status, body.message || 'Erro inesperado');
  }

  if (res.status === 204) return undefined as T;
  return res.json();
}

export const api = {
  get: <T = any>(path: string) => apiFetch<T>(path),
  post: <T = any>(path: string, data?: unknown) =>
    apiFetch<T>(path, { method: 'POST', body: JSON.stringify(data) }),
  put: <T = any>(path: string, data?: unknown) =>
    apiFetch<T>(path, { method: 'PUT', body: JSON.stringify(data) }),
  patch: <T = any>(path: string, data?: unknown) =>
    apiFetch<T>(path, { method: 'PATCH', body: JSON.stringify(data) }),
  delete: <T = any>(path: string) => apiFetch<T>(path, { method: 'DELETE' }),
};
