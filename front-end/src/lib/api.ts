const STORAGE_KEY = 'dashboard_token';

function apiUrl(path: string): string {
  const base = (import.meta.env.VITE_API_BASE_URL as string | undefined)?.trim() ?? '';
  if (!base) return path;
  return `${base.replace(/\/$/, '')}${path.startsWith('/') ? path : `/${path}`}`;
}

export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

function getToken(): string | null {
  return localStorage.getItem(STORAGE_KEY);
}

export function clearAuthToken(): void {
  localStorage.removeItem(STORAGE_KEY);
}

export async function apiFetch<T>(
  path: string,
  init?: RequestInit & { json?: unknown },
): Promise<T> {
  const headers: Record<string, string> = {
    ...(init?.headers as Record<string, string> | undefined),
  };
  const token = getToken();
  if (token) headers['Authorization'] = `Bearer ${token}`;
  if (init?.json !== undefined) {
    headers['Content-Type'] = 'application/json';
  }
  const res = await fetch(apiUrl(path), {
    ...init,
    headers,
    body: init?.json !== undefined ? JSON.stringify(init.json) : init?.body,
  });
  if (res.status === 401) {
    clearAuthToken();
  }
  if (!res.ok) {
    let msg = res.statusText;
    try {
      const err = (await res.json()) as { error?: string };
      if (err.error) msg = err.error;
    } catch {
      /* ignore */
    }
    throw new ApiError(msg, res.status);
  }
  if (res.status === 204) return undefined as T;
  return res.json() as Promise<T>;
}

export interface LoginUser {
  id: string;
  name: string;
  username: string;
  email: string;
  role: string;
  status: string;
  avatar: string;
}

export async function login(username: string, password: string): Promise<LoginUser> {
  const data = await apiFetch<{ token: string; user: LoginUser }>('/api/auth/login', {
    method: 'POST',
    json: { username, password },
  });
  localStorage.setItem(STORAGE_KEY, data.token);
  return data.user;
}

export function logout(): void {
  clearAuthToken();
}

export interface ApiTransaction {
  id: string;
  kind: 'income' | 'expense';
  title: string;
  subtitle: string;
  amount: number;
  occurredAt: string;
  createdAt: string;
}

export interface ApiManagementItem {
  id: string;
  title: string;
  status: string;
  type: 'notification' | 'approval';
  occurredAt: string;
  createdAt: string;
}

export interface ApiUserRow {
  id: string;
  name: string;
  role: string;
  status: 'active' | 'inactive';
  email: string;
  avatar: string;
}

export interface ApiRoleRow {
  id: string;
  name: string;
  permissions: string[];
}

export function hasStoredToken(): boolean {
  return Boolean(getToken());
}

export async function fetchTransactions(kind: 'income' | 'expense'): Promise<ApiTransaction[]> {
  return apiFetch<ApiTransaction[]>(`/api/transactions?kind=${kind}`);
}

export async function fetchManagementItems(): Promise<ApiManagementItem[]> {
  return apiFetch<ApiManagementItem[]>('/api/management-items');
}

export async function fetchUsers(): Promise<ApiUserRow[]> {
  return apiFetch<ApiUserRow[]>('/api/users');
}

export async function fetchRoles(): Promise<ApiRoleRow[]> {
  return apiFetch<ApiRoleRow[]>('/api/roles');
}

export async function createTransaction(body: {
  kind: 'income' | 'expense';
  title: string;
  subtitle?: string;
  amount: number;
  date: string;
}): Promise<ApiTransaction> {
  return apiFetch<ApiTransaction>('/api/transactions', { method: 'POST', json: body });
}

export async function createManagementItem(body: {
  title: string;
  date: string;
  type?: 'notification' | 'approval';
}): Promise<ApiManagementItem> {
  return apiFetch<ApiManagementItem>('/api/management-items', { method: 'POST', json: body });
}
