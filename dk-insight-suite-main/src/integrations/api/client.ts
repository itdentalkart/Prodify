const API_URL = import.meta.env.VITE_API_URL || 'http://192.168.11.90:3000';

export const getToken = (): string | null => localStorage.getItem('dk_token');
export const setToken = (t: string) => localStorage.setItem('dk_token', t);
export const clearToken = () => localStorage.removeItem('dk_token');

async function apiFetch(path: string, options: RequestInit = {}) {
  const token = getToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  const res = await fetch(`${API_URL}${path}`, { ...options, headers });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`);
  return data;
}

export const authApi = {
  login: (email: string, password: string) =>
    apiFetch('/api/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) }),
  register: (email: string, password: string, displayName?: string, companyName?: string) =>
    apiFetch('/api/auth/register', { method: 'POST', body: JSON.stringify({ email, password, displayName, companyName }) }),
  me: () => apiFetch('/api/auth/me'),
  changePassword: (currentPassword: string, newPassword: string) =>
    apiFetch('/api/auth/change-password', { method: 'POST', body: JSON.stringify({ currentPassword, newPassword }) }),
};

export const devicesApi = {
  list: () => apiFetch('/api/devices'),
  get: (id: string) => apiFetch(`/api/devices/${id}`),
  update: (id: string, data: any) => apiFetch(`/api/devices/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
  delete: (id: string) => apiFetch(`/api/devices/${id}`, { method: 'DELETE' }),
};

export const screenshotsApi = {
  list: (params: { deviceId?: string; from?: string; to?: string; limit?: number } = {}) => {
    const q = new URLSearchParams(params as any).toString();
    return apiFetch(`/api/screenshots${q ? '?' + q : ''}`);
  },
};

export const sessionsApi = {
  list: (params: { deviceId?: string; limit?: number } = {}) => {
    const q = new URLSearchParams(params as any).toString();
    return apiFetch(`/api/sessions${q ? '?' + q : ''}`);
  },
};

export const telemetryApi = {
  list: (params: { deviceId?: string; eventType?: string; limit?: number } = {}) => {
    const q = new URLSearchParams(params as any).toString();
    return apiFetch(`/api/telemetry${q ? '?' + q : ''}`);
  },
};

export const enrollmentApi = {
  list: () => apiFetch('/api/enrollment'),
  create: (label?: string, expiresInHours?: number) =>
    apiFetch('/api/enrollment', { method: 'POST', body: JSON.stringify({ label, expiresInHours }) }),
  delete: (id: string) => apiFetch(`/api/enrollment/${id}`, { method: 'DELETE' }),
};

export const usersApi = {
  list: () => apiFetch('/api/users'),
  create: (data: any) => apiFetch('/api/users', { method: 'POST', body: JSON.stringify(data) }),
  update: (id: string, data: any) => apiFetch(`/api/users/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
  delete: (id: string) => apiFetch(`/api/users/${id}`, { method: 'DELETE' }),
};

export const orgsApi = {
  list: () => apiFetch('/api/organizations'),
  update: (id: string, data: any) => apiFetch(`/api/organizations/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
};

export const dashboardApi = { get: () => apiFetch('/api/dashboard') };

export const licensesApi = {
  list: () => apiFetch('/api/licenses'),
  update: (orgId: string, data: any) => apiFetch(`/api/licenses/${orgId}`, { method: 'PATCH', body: JSON.stringify(data) }),
};

export const auditApi = { list: () => apiFetch('/api/audit-logs') };
