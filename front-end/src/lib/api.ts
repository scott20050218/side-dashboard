const STORAGE_KEY = 'dashboard_token';
const STORE_KEY = 'dashboard_store_id';

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

function clearAuthToken(): void {
  localStorage.removeItem(STORAGE_KEY);
  localStorage.removeItem(STORE_KEY);
}

export function getSelectedStoreId(): string | null {
  return localStorage.getItem(STORE_KEY);
}

export function setSelectedStoreId(id: string): void {
  localStorage.setItem(STORE_KEY, id);
}

/** 用登录用户身上的门店列表纠正/补全 localStorage 中的 storeId，避免刷新后会话有门店但未写入 STORE_KEY。 */
export function resolveStoreIdFromUser(
  user: { stores?: Array<{ id: string }> } | null | undefined,
): string | null {
  let sid = getSelectedStoreId();
  const stores = user?.stores ?? [];
  if (stores.length > 0) {
    const valid = Boolean(sid && stores.some((s) => s.id === sid));
    const next = valid ? sid! : stores[0].id;
    if (getSelectedStoreId() !== next) {
      setSelectedStoreId(next);
    }
    return next;
  }
  return sid && sid.length > 0 ? sid : null;
}

/** 发起门店相关请求时使用：优先入参，其次 localStorage；都没有则抛错，避免发出不带 storeId 的请求。 */
function resolveStoreIdForRequest(explicit?: string | null): string {
  const fromArg = typeof explicit === 'string' ? explicit.trim() : '';
  if (fromArg) return fromArg;
  const fromLs = getSelectedStoreId()?.trim() ?? '';
  if (fromLs) return fromLs;
  throw new ApiError('请先选择门店', 400);
}

function storeScopedPath(path: string, explicitStoreId?: string | null): string {
  const sid = resolveStoreIdForRequest(explicitStoreId);
  const sep = path.includes('?') ? '&' : '?';
  return `${path}${sep}storeId=${encodeURIComponent(sid)}`;
}

async function apiFetch<T>(
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

export interface LoginStore {
  id: string;
  name: string;
  /** 与 `roles.name` 一致：老板、店长、收银员、股东等 */
  storeRole: string;
  canViewOverview: boolean;
  canViewTransactionLines: boolean;
  /** 门店内是否可录入（收支、事务等），由门店老板授权 */
  canRecord?: boolean;
  /** 服务端 assertStoreOwnerOrAdmin（本店成员角色为「老板」或超管） */
  canManageStoreTeam?: boolean;
}

export interface LoginUser {
  id: string;
  name: string;
  username: string;
  email: string;
  role: string;
  /** 登录时由服务端 roles.permissions 解析，与「门店团队管理」等能力一致 */
  rolePermissions?: string[];
  status: string;
  avatar: string;
  isSuperAdmin?: boolean;
  stores?: LoginStore[];
}

export function normId(v: string | null | undefined): string {
  return (v ?? '').trim();
}

/** 全局角色名是否为「老板」（兼容首尾空白） */
export function isBossRoleName(role: string | null | undefined): boolean {
  return normId(role) === '老板';
}

/** 是否具备「门店团队管理」权限（与后端 roles.permissions 一致） */
export function userHasStoreTeamPermission(user: LoginUser | null | undefined): boolean {
  const p = user?.rolePermissions;
  return Array.isArray(p) && p.includes('门店团队管理');
}

/** 是否视为本店店主（可管理团队等）：本店成员角色为「老板」，或服务端下发的 canManageStoreTeam */
export function isUserBossOfStore(
  user: LoginUser | null | undefined,
  store: LoginStore | undefined,
): boolean {
  if (!normId(user?.id) || !store) return false;
  if (store.canManageStoreTeam === true) return true;
  return normId(store.storeRole) === '老板';
}

export async function login(username: string, password: string): Promise<LoginUser> {
  const data = await apiFetch<{ token: string; user: LoginUser }>('/api/auth/login', {
    method: 'POST',
    json: { username, password },
  });
  localStorage.setItem(STORAGE_KEY, data.token);
  resolveStoreIdFromUser(data.user);
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
  note?: string;
  status: string;
  type: 'notification' | 'approval';
  occurredAt: string;
  createdAt: string;
  createdByName?: string;
  reviewedBy?: string;
  reviewedByName?: string;
  reviewedAt?: string;
  rejectReason?: string;
}

export interface ApiUserRow {
  id: string;
  username?: string;
  name: string;
  role: string;
  roleId?: string;
  status: 'active' | 'inactive';
  email: string;
  avatar: string;
}

export interface ApiRoleRow {
  id: string;
  name: string;
  permissions: string[];
}

interface ApiSummary {
  from: string;
  to: string;
  incomeTotal: number;
  expenseTotal: number;
  net: number;
}

interface ApiOverview {
  store: { id: string; name: string };
  month: string;
  incomeTotal: number;
  expenseTotal: number;
  net: number;
}

export interface ApiAmendment {
  id: string;
  transactionId: string;
  requestedBy?: string;
  requestedByName?: string;
  payload: string;
  previousSnapshot?: string;
  status: 'pending' | 'approved' | 'rejected';
  reviewedBy?: string;
  /** 审批人姓名（老板/超管同意或拒绝时记录） */
  reviewedByName?: string;
  reviewedAt?: string;
  rejectReason?: string;
  createdAt: string;
}

export function hasStoredToken(): boolean {
  return Boolean(getToken());
}

export async function fetchMyStores(): Promise<LoginStore[]> {
  return apiFetch<LoginStore[]>('/api/stores/mine');
}

export async function fetchTransactions(
  kind: 'income' | 'expense',
  storeId?: string | null,
): Promise<ApiTransaction[]> {
  return apiFetch<ApiTransaction[]>(
    storeScopedPath(`/api/transactions?kind=${kind}`, storeId),
  );
}

export async function fetchManagementItems(storeId?: string | null): Promise<ApiManagementItem[]> {
  return apiFetch<ApiManagementItem[]>(storeScopedPath('/api/management-items', storeId));
}

export async function fetchUsers(): Promise<ApiUserRow[]> {
  return apiFetch<ApiUserRow[]>('/api/users');
}

export async function updateUser(
  id: string,
  body: {
    username: string;
    name: string;
    email: string;
    roleId: string;
    status: 'active' | 'inactive';
    /** 非空则重置密码 */
    password?: string;
  },
): Promise<ApiUserRow> {
  const payload: Record<string, unknown> = {
    username: body.username.trim(),
    name: body.name.trim(),
    email: body.email.trim(),
    roleId: body.roleId.trim(),
    status: body.status,
  };
  const pw = typeof body.password === 'string' ? body.password : '';
  if (pw.trim().length > 0) payload.password = pw;
  return apiFetch<ApiUserRow>(`/api/users/${encodeURIComponent(id)}`, { method: 'PATCH', json: payload });
}

export async function createUser(body: {
  username: string;
  email: string;
  password: string;
  name: string;
  roleId: string;
  /** 仅超级管理员创建非「超级管理员」角色时必填；成员行与 users.role_id 使用同一角色 */
  storeId?: string;
  canRecord?: boolean;
  canViewOverview?: boolean;
  canViewTransactionLines?: boolean;
}): Promise<ApiUserRow> {
  return apiFetch<ApiUserRow>('/api/users', { method: 'POST', json: body });
}

export async function fetchRoles(): Promise<ApiRoleRow[]> {
  return apiFetch<ApiRoleRow[]>('/api/roles');
}

export async function fetchSummary(
  from: string,
  to: string,
  storeId?: string | null,
): Promise<ApiSummary> {
  return apiFetch<ApiSummary>(
    storeScopedPath(`/api/summary?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}`, storeId),
  );
}

export async function fetchOverview(storeId?: string | null): Promise<ApiOverview> {
  return apiFetch<ApiOverview>(storeScopedPath('/api/summary/overview', storeId));
}

export async function fetchAmendments(
  status?: string,
  storeId?: string | null,
): Promise<ApiAmendment[]> {
  const path = status
    ? `/api/amendments?status=${encodeURIComponent(status)}`
    : '/api/amendments';
  return apiFetch<ApiAmendment[]>(storeScopedPath(path, storeId));
}

export async function reviewAmendment(
  id: string,
  body: { action: 'approve' | 'reject'; rejectReason?: string },
  storeId?: string | null,
): Promise<unknown> {
  const sid = resolveStoreIdForRequest(storeId);
  return apiFetch(`/api/amendments/${id}`, {
    method: 'PATCH',
    json: { ...body, storeId: sid },
  });
}

export async function requestTransactionAmendment(
  transactionId: string,
  proposed: {
    kind?: 'income' | 'expense';
    title?: string;
    subtitle?: string;
    amount?: number;
    date?: string;
    /** 必填，说明为何申请修改 */
    reason: string;
  },
  storeId?: string | null,
): Promise<unknown> {
  const sid = resolveStoreIdForRequest(storeId);
  return apiFetch(`/api/transactions/${transactionId}/amendments`, {
    method: 'POST',
    json: { storeId: sid, ...proposed },
  });
}

export async function createTransaction(
  body: {
    kind: 'income' | 'expense';
    title: string;
    subtitle?: string;
    amount: number;
    date: string;
  },
  storeId?: string | null,
): Promise<ApiTransaction> {
  const sid = resolveStoreIdForRequest(storeId);
  return apiFetch<ApiTransaction>('/api/transactions', {
    method: 'POST',
    json: { ...body, storeId: sid },
  });
}

export async function createManagementItem(
  body: {
    title: string;
    date: string;
    type?: 'notification' | 'approval';
    /** 备注 / 详情 */
    note?: string;
  },
  storeId?: string | null,
): Promise<ApiManagementItem> {
  const sid = resolveStoreIdForRequest(storeId);
  return apiFetch<ApiManagementItem>('/api/management-items', {
    method: 'POST',
    json: { ...body, storeId: sid },
  });
}

export async function reviewManagementItem(
  itemId: string,
  body: { action: 'approve' | 'reject'; rejectReason?: string },
  storeId?: string | null,
): Promise<ApiManagementItem> {
  const sid = resolveStoreIdForRequest(storeId);
  return apiFetch<ApiManagementItem>(`/api/management-items/${encodeURIComponent(itemId)}`, {
    method: 'PATCH',
    json: { ...body, storeId: sid },
  });
}

export async function createStoreStaff(
  storeId: string,
  body: {
    username: string;
    email: string;
    password: string;
    name: string;
    roleId: string;
    canRecord?: boolean;
    canViewOverview?: boolean;
    canViewTransactionLines?: boolean;
  },
): Promise<unknown> {
  return apiFetch(`/api/stores/${encodeURIComponent(storeId)}/staff`, { method: 'POST', json: body });
}

export interface ApiStoreMemberRow {
  userId: string;
  name: string;
  username: string;
  email: string;
  storeRole: string;
  canViewOverview: number;
  canViewTransactionLines: number;
  canRecord?: number;
}

export async function fetchStoreMembers(storeId: string): Promise<ApiStoreMemberRow[]> {
  return apiFetch<ApiStoreMemberRow[]>(`/api/stores/${encodeURIComponent(storeId)}/members`);
}

export async function createAdminStore(body: {
  name: string;
  ownerUserId: string;
}): Promise<{ id: string; name: string }> {
  return apiFetch('/api/admin/stores', { method: 'POST', json: body });
}

export async function fetchAdminStores(): Promise<
  Array<{ id: string; name: string; ownerUserId: string | null; ownerName: string | null; createdAt: string }>
> {
  return apiFetch('/api/admin/stores');
}
