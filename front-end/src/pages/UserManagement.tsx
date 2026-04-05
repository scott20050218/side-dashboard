import React, { useState, useEffect, useMemo } from 'react';
import { motion } from 'motion/react';
import { ChevronLeft, UserPlus, MoreVertical, Mail, Shield } from 'lucide-react';
import { View, User, Role } from '../types';
import { createUser, updateUser, fetchRoles, ApiError } from '../lib/api';
import { mapApiRole } from '../lib/mapApiToView';

const SUPER_ADMIN_ROLE_NAME = '超级管理员';

/** 角色接口按 id 排序时第一项常为「超级管理员」；超管创建门店员工时应默认选中非超管角色，才会出现「关联门店」表单。 */
function pickDefaultRoleId(roles: Role[], creatorIsSuperAdmin: boolean): string {
  if (roles.length === 0) return '';
  if (creatorIsSuperAdmin) {
    const nonSuper = roles.find((r) => r.name !== SUPER_ADMIN_ROLE_NAME);
    return String((nonSuper ?? roles[0]).id);
  }
  return String(roles[0]!.id);
}

interface UserManagementProps {
  setView: (view: View) => void;
  users: User[];
  roles: Role[];
  /** 超管在小店管理里维护的门店，用于把新员工挂到门店 */
  adminStores?: Array<{ id: string; name: string }>;
  /** 超级管理员创建用户时需绑定门店（新用户全局角色非超管时）；店长等创建账号时不要求门店 */
  creatorIsSuperAdmin?: boolean;
  /** 列表接口失败时由首页聚合的错误文案，便于在弹窗里提示 */
  listLoadError?: string;
  /** 当前登录用户 id：用于禁止把自己从超管降级 */
  currentUserId?: string;
  onRefresh?: () => void;
  onRolesFetched?: (roles: Role[]) => void;
  /** 加载失败时退出到登录页（不使用重试） */
  onRequireLogin?: () => void;
}

export const UserManagement = ({
  setView,
  users,
  roles,
  adminStores = [],
  creatorIsSuperAdmin = true,
  listLoadError = '',
  currentUserId = '',
  onRefresh,
  onRolesFetched,
  onRequireLogin,
}: UserManagementProps) => {
  const [showAdd, setShowAdd] = useState(false);
  const [menuUserId, setMenuUserId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<{
    id: string;
    username: string;
    name: string;
    email: string;
    roleId: string;
    status: 'active' | 'inactive';
    password: string;
    lockRole: boolean;
  } | null>(null);
  const [editError, setEditError] = useState('');
  const [submittingEdit, setSubmittingEdit] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [loadingRoles, setLoadingRoles] = useState(false);
  const [formError, setFormError] = useState('');
  const [form, setForm] = useState({
    username: '',
    email: '',
    password: '',
    name: '',
    roleId: '',
    storeId: '',
    canRecord: true,
    canViewOverview: true,
    canViewTransactionLines: true,
  });

  const selectedRoleIsSuperAdmin = useMemo(() => {
    const r = roles.find((x) => String(x.id) === form.roleId);
    return r?.name === SUPER_ADMIN_ROLE_NAME;
  }, [roles, form.roleId]);

  const needStoreBinding = creatorIsSuperAdmin && !selectedRoleIsSuperAdmin;

  /** roles 异步到达后，补全默认角色，避免 select 的 value 与 option 不一致显示为空。 */
  useEffect(() => {
    if (roles.length === 0) return;
    setForm((f) => {
      const ok = f.roleId && roles.some((r) => String(r.id) === String(f.roleId));
      if (ok) return f;
      return { ...f, roleId: pickDefaultRoleId(roles, creatorIsSuperAdmin) };
    });
  }, [roles, creatorIsSuperAdmin]);

  useEffect(() => {
    if (!needStoreBinding || adminStores.length === 0) return;
    setForm((f) => {
      if (f.storeId && adminStores.some((s) => s.id === f.storeId)) return f;
      return { ...f, storeId: adminStores[0]!.id };
    });
  }, [needStoreBinding, adminStores]);

  /** 弹窗打开且父级仍无角色时，单独请求 /api/roles（不依赖与用户列表 Promise.all 同成败）。 */
  useEffect(() => {
    if (!showAdd || roles.length > 0 || !onRolesFetched) return;
    let cancelled = false;
    setLoadingRoles(true);
    setFormError('');
    void (async () => {
      try {
        const rows = await fetchRoles();
        if (cancelled) return;
        onRolesFetched(rows.map(mapApiRole));
      } catch (e) {
        if (cancelled) return;
        if (onRequireLogin) {
          onRequireLogin();
          return;
        }
        setFormError(e instanceof ApiError ? e.message : '角色列表加载失败');
      } finally {
        if (!cancelled) setLoadingRoles(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [showAdd, roles.length, onRolesFetched, onRequireLogin]);

  const openAdd = () => {
    setFormError('');
    const firstId = pickDefaultRoleId(roles, creatorIsSuperAdmin);
    const firstStore = adminStores[0]?.id ?? '';
    setForm({
      username: '',
      email: '',
      password: '',
      name: '',
      roleId: firstId,
      storeId: firstStore,
      canRecord: true,
      canViewOverview: true,
      canViewTransactionLines: true,
    });
    setShowAdd(true);
    if (roles.length === 0) {
      onRefresh?.();
    }
  };

  const submitAdd = async () => {
    setFormError('');
    if (!form.username || !form.email || !form.password || !form.name || !form.roleId) {
      setFormError('请填写完整信息');
      return;
    }
    if (needStoreBinding) {
      if (adminStores.length === 0) {
        setFormError('请先在「我的 → 小店管理」创建门店，再添加门店员工');
        return;
      }
      if (!form.storeId.trim()) {
        setFormError('请选择门店');
        return;
      }
    }
    setSubmitting(true);
    try {
      const base = {
        username: form.username,
        email: form.email,
        password: form.password,
        name: form.name,
        roleId: form.roleId,
      };
      if (creatorIsSuperAdmin && !selectedRoleIsSuperAdmin) {
        await createUser({
          ...base,
          storeId: form.storeId.trim(),
          canRecord: form.canRecord,
          canViewOverview: form.canViewOverview,
          canViewTransactionLines: form.canViewTransactionLines,
        });
      } else {
        await createUser(base);
      }
      setShowAdd(false);
      onRefresh?.();
    } catch (e) {
      setFormError(e instanceof ApiError ? e.message : '创建失败');
    } finally {
      setSubmitting(false);
    }
  };

  const openUserMenu = (e: React.MouseEvent, userId: string) => {
    e.stopPropagation();
    setMenuUserId((prev) => (prev === userId ? null : userId));
  };

  const openEdit = (u: User) => {
    setMenuUserId(null);
    setEditError('');
    const roleId =
      u.roleId ||
      roles.find((r) => r.name === u.role)?.id?.toString() ||
      '';
    setEditForm({
      id: u.id,
      username: u.username,
      name: u.name,
      email: u.email,
      roleId,
      status: u.status,
      password: '',
      lockRole: Boolean(
        currentUserId && u.id === currentUserId && u.role === SUPER_ADMIN_ROLE_NAME,
      ),
    });
  };

  const submitEdit = async () => {
    if (!editForm) return;
    setEditError('');
    if (!editForm.username || !editForm.email || !editForm.name || !editForm.roleId) {
      setEditError('请填写完整信息');
      return;
    }
    setSubmittingEdit(true);
    try {
      await updateUser(editForm.id, {
        username: editForm.username,
        name: editForm.name,
        email: editForm.email,
        roleId: editForm.lockRole
          ? roles.find((r) => r.name === SUPER_ADMIN_ROLE_NAME)?.id ?? editForm.roleId
          : editForm.roleId,
        status: editForm.status,
        password: editForm.password.trim() || undefined,
      });
      setEditForm(null);
      onRefresh?.();
    } catch (e) {
      setEditError(e instanceof ApiError ? e.message : '保存失败');
    } finally {
      setSubmittingEdit(false);
    }
  };

  const menuUser = menuUserId ? users.find((x) => x.id === menuUserId) : undefined;

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      className="px-6 pt-12 pb-36"
    >
      <div className="flex items-center gap-4 mb-10">
        <button
          type="button"
          onClick={() => setView('profile')}
          className="w-12 h-12 rounded-2xl bg-white flex items-center justify-center text-gray-400 border border-gray-100 shadow-sm"
        >
          <ChevronLeft size={24} />
        </button>
        <h2 className="text-xl font-black tracking-tight text-[#1E293B]">用户管理</h2>
        <button
          type="button"
          onClick={openAdd}
          className="ml-auto w-12 h-12 rounded-2xl bg-primary text-white flex items-center justify-center shadow-lg relative z-10"
          aria-label="新增用户"
        >
          <UserPlus size={24} />
        </button>
      </div>

      <div className="space-y-4">
        {users.map((user) => (
          <div
            key={user.id}
            className="bg-white p-5 rounded-[32px] shadow-sm border border-gray-50 flex items-center justify-between"
          >
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl overflow-hidden border-2 border-primary/10 bg-gray-100">
                {user.avatar ? (
                  <img
                    src={user.avatar}
                    alt={user.name}
                    className="w-full h-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                ) : null}
              </div>
              <div>
                <h4 className="text-sm font-black tracking-tight">{user.name}</h4>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-[9px] font-bold uppercase tracking-wider text-primary bg-primary/10 px-2 py-0.5 rounded-md">
                    {user.role}
                  </span>
                  <span
                    className={`text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md ${user.status === 'active' ? 'text-cyan-custom bg-cyan-custom/10' : 'text-gray-400 bg-gray-50'}`}
                  >
                    {user.status === 'active' ? '在线' : '离线'}
                  </span>
                </div>
              </div>
            </div>
            <button
              type="button"
              aria-label="更多操作"
              aria-expanded={menuUserId === user.id}
              onClick={(e) => openUserMenu(e, user.id)}
              className="text-gray-300 hover:text-primary transition-colors p-2 -mr-2 rounded-xl"
            >
              <MoreVertical size={20} />
            </button>
          </div>
        ))}
      </div>

      {menuUser ? (
        <div
          role="presentation"
          className="fixed inset-0 z-[450] flex flex-col justify-end bg-black/40 max-w-md mx-auto"
          onClick={() => setMenuUserId(null)}
        >
          <div
            role="dialog"
            aria-label="用户操作"
            className="bg-white rounded-t-[28px] p-4 pb-8 shadow-2xl space-y-2"
            onClick={(e) => e.stopPropagation()}
          >
            <p className="text-[11px] text-gray-400 font-bold truncate px-1">{menuUser.name}</p>
            <button
              type="button"
              className="w-full py-3.5 rounded-2xl bg-primary/10 text-primary font-black text-sm"
              onClick={() => openEdit(menuUser)}
            >
              修改用户信息
            </button>
            <button
              type="button"
              className="w-full py-3.5 rounded-2xl bg-gray-100 text-gray-600 font-black text-sm"
              onClick={() => setMenuUserId(null)}
            >
              取消
            </button>
          </div>
        </div>
      ) : null}

      {editForm ? (
        <div className="fixed inset-0 z-[460] flex items-end justify-center bg-black/40 px-4 pb-10 max-w-md mx-auto">
          <div className="w-full bg-white rounded-[28px] p-6 shadow-2xl space-y-3 max-h-[88vh] overflow-y-auto">
            <h3 className="text-lg font-black">修改用户</h3>
            {editError ? <p className="text-xs text-red-500 font-bold">{editError}</p> : null}
            {editForm.lockRole ? (
              <p className="text-[11px] text-amber-700 font-bold bg-amber-50 rounded-xl px-3 py-2">
                您正在编辑自己的超管账号：不能更换全局角色；可修改名称、邮箱、用户名或密码。
              </p>
            ) : null}
            <label className="block text-[10px] font-black text-gray-400 uppercase">用户名</label>
            <input
              value={editForm.username}
              onChange={(e) => setEditForm((f) => (f ? { ...f, username: e.target.value } : f))}
              className="w-full rounded-xl border border-gray-100 py-2 px-3 text-sm font-bold"
              autoComplete="off"
            />
            <label className="block text-[10px] font-black text-gray-400 uppercase">邮箱</label>
            <input
              type="email"
              value={editForm.email}
              onChange={(e) => setEditForm((f) => (f ? { ...f, email: e.target.value } : f))}
              className="w-full rounded-xl border border-gray-100 py-2 px-3 text-sm font-bold"
            />
            <label className="block text-[10px] font-black text-gray-400 uppercase">显示名称</label>
            <input
              value={editForm.name}
              onChange={(e) => setEditForm((f) => (f ? { ...f, name: e.target.value } : f))}
              className="w-full rounded-xl border border-gray-100 py-2 px-3 text-sm font-bold"
            />
            <label className="block text-[10px] font-black text-gray-400 uppercase">新密码（可选）</label>
            <input
              type="password"
              value={editForm.password}
              onChange={(e) => setEditForm((f) => (f ? { ...f, password: e.target.value } : f))}
              placeholder="留空则不修改"
              className="w-full rounded-xl border border-gray-100 py-2 px-3 text-sm font-bold"
            />
            <label className="block text-[10px] font-black text-gray-400 uppercase">全局角色</label>
            <select
              value={editForm.roleId}
              onChange={(e) => setEditForm((f) => (f ? { ...f, roleId: e.target.value } : f))}
              disabled={roles.length === 0 || editForm.lockRole}
              className="w-full rounded-xl border border-gray-100 py-2 px-3 text-sm font-bold disabled:opacity-60"
            >
              {roles.length === 0 ? (
                <option value="">暂无角色</option>
              ) : (
                roles.map((r) => (
                  <option key={r.id} value={String(r.id)}>
                    {r.name}
                  </option>
                ))
              )}
            </select>
            <label className="block text-[10px] font-black text-gray-400 uppercase">状态</label>
            <select
              value={editForm.status}
              onChange={(e) =>
                setEditForm((f) =>
                  f
                    ? {
                        ...f,
                        status: e.target.value === 'inactive' ? 'inactive' : 'active',
                      }
                    : f,
                )
              }
              disabled={editForm.lockRole}
              className="w-full rounded-xl border border-gray-100 py-2 px-3 text-sm font-bold disabled:opacity-60"
            >
              <option value="active">在线（active）</option>
              <option value="inactive">离线（停用）</option>
            </select>
            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setEditForm(null)}
                className="flex-1 py-3 rounded-xl bg-gray-100 font-black text-sm"
              >
                取消
              </button>
              <button
                type="button"
                disabled={submittingEdit || roles.length === 0}
                onClick={() => void submitEdit()}
                className="flex-1 py-3 rounded-xl bg-primary text-white font-black text-sm disabled:opacity-50"
              >
                {submittingEdit ? '保存中…' : '保存'}
              </button>
            </div>
          </div>
        </div>
      ) : null}

      <div className="mt-10 grid grid-cols-2 gap-4">
        <button
          type="button"
          onClick={openAdd}
          className="text-left bg-primary/5 p-6 rounded-[32px] border border-primary/10"
        >
          <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-primary mb-4 shadow-sm">
            <Mail size={20} />
          </div>
          <h5 className="text-xs font-black text-primary mb-1">邀请新成员</h5>
          <p className="text-[10px] text-primary/60 font-bold">添加系统用户账号</p>
        </button>
        <button
          type="button"
          onClick={() => setView('auth_management')}
          className="text-left bg-cyan-custom/5 p-6 rounded-[32px] border border-cyan-custom/10 cursor-pointer"
        >
          <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-cyan-custom mb-4 shadow-sm">
            <Shield size={20} />
          </div>
          <h5 className="text-xs font-black text-cyan-custom mb-1">权限设置</h5>
          <p className="text-[10px] text-cyan-custom/60 font-bold">管理角色与访问权限</p>
        </button>
      </div>

      {showAdd ? (
        <div className="fixed inset-0 z-[400] flex items-end justify-center bg-black/40 px-4 pb-10 max-w-md mx-auto">
          <div className="w-full bg-white rounded-[28px] p-6 shadow-2xl space-y-3 max-h-[85vh] overflow-y-auto">
            <h3 className="text-lg font-black">新增用户</h3>
            {formError ? <p className="text-xs text-red-500 font-bold">{formError}</p> : null}
            <label className="block text-[10px] font-black text-gray-400 uppercase">用户名</label>
            <input
              value={form.username}
              onChange={(e) => setForm((f) => ({ ...f, username: e.target.value }))}
              className="w-full rounded-xl border border-gray-100 py-2 px-3 text-sm font-bold"
              autoComplete="off"
            />
            <label className="block text-[10px] font-black text-gray-400 uppercase">邮箱</label>
            <input
              type="email"
              value={form.email}
              onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
              className="w-full rounded-xl border border-gray-100 py-2 px-3 text-sm font-bold"
            />
            <label className="block text-[10px] font-black text-gray-400 uppercase">初始密码</label>
            <input
              type="password"
              value={form.password}
              onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
              className="w-full rounded-xl border border-gray-100 py-2 px-3 text-sm font-bold"
            />
            <label className="block text-[10px] font-black text-gray-400 uppercase">显示名称</label>
            <input
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              className="w-full rounded-xl border border-gray-100 py-2 px-3 text-sm font-bold"
            />
            <label className="block text-[10px] font-black text-gray-400 uppercase">全局角色</label>
            <select
              value={form.roleId}
              onChange={(e) => setForm((f) => ({ ...f, roleId: e.target.value }))}
              disabled={roles.length === 0 || loadingRoles}
              className="w-full rounded-xl border border-gray-100 py-2 px-3 text-sm font-bold disabled:opacity-60"
            >
              {roles.length === 0 ? (
                <option value="">{loadingRoles ? '正在加载角色…' : '暂无角色数据'}</option>
              ) : (
                roles.map((r) => (
                  <option key={r.id} value={String(r.id)}>
                    {r.name}
                  </option>
                ))
              )}
            </select>
            {roles.length === 0 && !loadingRoles && (formError || listLoadError) ? (
              <p className="text-xs text-red-500 font-bold">{formError || listLoadError}</p>
            ) : null}
            {roles.length === 0 && !loadingRoles && onRequireLogin ? (
              <button
                type="button"
                onClick={() => onRequireLogin()}
                className="w-full py-2 rounded-xl bg-gray-100 text-xs font-black text-gray-600"
              >
                前往登录
              </button>
            ) : null}

            {needStoreBinding ? (
              <>
                <label className="block text-[10px] font-black text-gray-400 uppercase">所属门店</label>
                <select
                  value={form.storeId}
                  onChange={(e) => setForm((f) => ({ ...f, storeId: e.target.value }))}
                  disabled={adminStores.length === 0}
                  className="w-full rounded-xl border border-gray-100 py-2 px-3 text-sm font-bold disabled:opacity-50"
                >
                  {adminStores.length === 0 ? (
                    <option value="">暂无门店，请先去小店管理创建</option>
                  ) : (
                    adminStores.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name}
                      </option>
                    ))
                  )}
                </select>
                <div className="space-y-2 rounded-xl border border-gray-50 bg-gray-50/80 p-3">
                  <p className="text-[10px] font-black text-gray-400 uppercase">在本店的权限</p>
                  <label className="flex items-center gap-2 text-xs font-bold text-gray-600">
                    <input
                      type="checkbox"
                      checked={form.canRecord}
                      onChange={(e) => setForm((f) => ({ ...f, canRecord: e.target.checked }))}
                    />
                    可录入收支、申请修改、发事务
                  </label>
                  <label className="flex items-center gap-2 text-xs font-bold text-gray-600">
                    <input
                      type="checkbox"
                      checked={form.canViewOverview}
                      onChange={(e) =>
                        setForm((f) => ({ ...f, canViewOverview: e.target.checked }))
                      }
                    />
                    可看经营概览与汇总
                  </label>
                  <label className="flex items-center gap-2 text-xs font-bold text-gray-600">
                    <input
                      type="checkbox"
                      checked={form.canViewTransactionLines}
                      onChange={(e) =>
                        setForm((f) => ({
                          ...f,
                          canViewTransactionLines: e.target.checked,
                        }))
                      }
                    />
                    可看全店收支流水（关闭则仅看自己录入）
                  </label>
                </div>
              </>
            ) : creatorIsSuperAdmin && selectedRoleIsSuperAdmin ? (
              <p className="text-[11px] text-gray-400 font-bold leading-relaxed">
                超级管理员账号不绑定具体门店；若需门店人员，请在上方选择老板/店长/收银员/股东并指定门店（全局角色与店内成员使用同一角色）。
              </p>
            ) : !creatorIsSuperAdmin ? (
              <p className="text-[11px] text-gray-400 font-bold leading-relaxed">
                将创建系统账号，不会自动加入任一门店；后续可由店长在门店成员里添加。
              </p>
            ) : null}

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowAdd(false)}
                className="flex-1 py-3 rounded-xl bg-gray-100 font-black text-sm"
              >
                取消
              </button>
              <button
                type="button"
                disabled={submitting}
                onClick={() => void submitAdd()}
                className="flex-1 py-3 rounded-xl bg-primary text-white font-black text-sm disabled:opacity-50"
              >
                {submitting ? '提交中…' : '创建'}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </motion.div>
  );
};
