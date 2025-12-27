const API_BASE =
  import.meta.env.VITE_API_BASE_URL || (import.meta.env.PROD ? '' : '');

function getToken() {
  return localStorage.getItem('auth_token') || '';
}

export async function api(path, { method = 'GET', body, headers = {} } = {}) {
  const res = await fetch(`${API_BASE}${path}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(getToken() ? { Authorization: `Bearer ${getToken()}` } : {}),
      ...headers,
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await res.json().catch(() => ({}));
  if (res.status === 401) {
    window.location.href = '/login';
    const err = new Error(data?.error?.message || 'Unauthorized');
    err.status = 401;
    err.data = data;
    throw err;
  }
  // Legacy 402 license handling removed under subscription model
  if (!res.ok || data?.success === false) {
    const msg = data?.error?.message || data?.message || `HTTP ${res.status}`;
    const err = new Error(msg);
    err.status = res.status;
    err.data = data;
    throw err;
  }
  return data;
}

export const API = API_BASE;
