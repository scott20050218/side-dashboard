import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'motion/react';
import { ChevronLeft, UserPlus, Users } from 'lucide-react';
import { View, Role } from '../types';
import {
  createStoreStaff,
  fetchStoreMembers,
  ApiError,
  type ApiStoreMemberRow,
} from '../lib/api';

interface StoreTeamProps {
  setView: (view: View) => void;
  storeId: string;
  storeName?: string;
  staffRoles: Role[];
  onRefreshSession?: () => void;
}

export const StoreTeam = ({
  setView,
  storeId,
  storeName,
  staffRoles,
  onRefreshSession,
}: StoreTeamProps) => {
  const [members, setMembers] = useState<ApiStoreMemberRow[]>([]);
  const [loadError, setLoadError] = useState('');
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState('');
  const [form, setForm] = useState({
    username: '',
    email: '',
    password: '',
    name: '',
    roleId: '',
    canRecord: true,
    canViewOverview: true,
    canViewTransactionLines: true,
  });

  const load = useCallback(async () => {
    setLoadError('');
    setLoading(true);
    try {
      const rows = await fetchStoreMembers(storeId);
      setMembers(rows);
    } catch (e) {
      setLoadError(e instanceof ApiError ? e.message : '加载失败');
      setMembers([]);
    } finally {
      setLoading(false);
    }
  }, [storeId]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    if (staffRoles.length === 0) return;
    setForm((f) => {
      if (f.roleId && staffRoles.some((r) => String(r.id) === f.roleId)) return f;
      return { ...f, roleId: String(staffRoles[0]!.id) };
    });
  }, [staffRoles]);

  const openAdd = () => {
    setFormError('');
    setForm((f) => ({
      ...f,
      username: '',
      email: '',
      password: '',
      name: '',
      canRecord: true,
      canViewOverview: true,
      canViewTransactionLines: true,
      roleId: staffRoles[0]?.id != null ? String(staffRoles[0].id) : '',
    }));
    setShowAdd(true);
  };

  const submit = async () => {
    setFormError('');
    if (!form.username || !form.email || !form.password || !form.name || !form.roleId) {
      setFormError('请填写完整');
      return;
    }
    setSubmitting(true);
    try {
      await createStoreStaff(storeId, {
        username: form.username,
        email: form.email,
        password: form.password,
        name: form.name,
        roleId: form.roleId,
        canRecord: form.canRecord,
        canViewOverview: form.canViewOverview,
        canViewTransactionLines: form.canViewTransactionLines,
      });
      setShowAdd(false);
      await load();
      onRefreshSession?.();
    } catch (e) {
      setFormError(e instanceof ApiError ? e.message : '创建失败');
    } finally {
      setSubmitting(false);
    }
  };

  const labelFor = (m: ApiStoreMemberRow) => m.storeRole || '—';

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      className="px-6 pt-12 pb-36"
    >
      <div className="flex items-center gap-4 mb-6">
        <button
          type="button"
          onClick={() => setView('profile')}
          className="w-12 h-12 rounded-2xl bg-white flex items-center justify-center text-gray-400 border border-gray-100 shadow-sm"
        >
          <ChevronLeft size={24} />
        </button>
        <div className="flex-1 min-w-0">
          <h2 className="text-xl font-black tracking-tight text-[#1E293B]">我的团队</h2>
          {storeName ? (
            <p className="text-[11px] text-gray-400 font-bold truncate">{storeName}</p>
          ) : null}
        </div>
        <button
          type="button"
          onClick={() => openAdd()}
          className="w-12 h-12 rounded-2xl bg-primary text-white flex items-center justify-center shadow-lg"
          aria-label="添加成员"
        >
          <UserPlus size={24} />
        </button>
      </div>

      <p className="text-[11px] text-gray-400 font-bold leading-relaxed mb-6">
        您是本店老板：可在此创建店长、收银员、股东账号，并分别授权「录入」「看概览」「看全店流水」。
      </p>

      {loadError ? <p className="text-xs text-red-500 font-bold mb-4">{loadError}</p> : null}

      {loading ? (
        <p className="text-sm text-gray-400 font-bold text-center py-12">加载中…</p>
      ) : (
        <div className="space-y-3">
          {members.map((m) => (
            <div
              key={m.userId}
              className="bg-white p-4 rounded-[24px] border border-gray-50 shadow-sm flex items-start gap-3"
            >
              <div className="w-10 h-10 rounded-xl bg-cyan-custom/10 flex items-center justify-center text-cyan-custom shrink-0">
                <Users size={18} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-black truncate">{m.name}</p>
                <p className="text-[10px] text-gray-400 font-bold truncate">
                  {m.username} · {m.email}
                </p>
                <div className="flex flex-wrap gap-1.5 mt-2">
                  <span className="text-[9px] font-bold px-2 py-0.5 rounded-md bg-primary/10 text-primary">
                    {labelFor(m)}
                  </span>
                  {m.storeRole !== '老板' ? (
                    <>
                      {Boolean(m.canRecord) ? (
                        <span className="text-[9px] font-bold px-2 py-0.5 rounded-md bg-gray-100 text-gray-500">
                          录入
                        </span>
                      ) : null}
                      {Boolean(m.canViewOverview) ? (
                        <span className="text-[9px] font-bold px-2 py-0.5 rounded-md bg-gray-100 text-gray-500">
                          概览
                        </span>
                      ) : null}
                      {Boolean(m.canViewTransactionLines) ? (
                        <span className="text-[9px] font-bold px-2 py-0.5 rounded-md bg-gray-100 text-gray-500">
                          流水
                        </span>
                      ) : null}
                    </>
                  ) : null}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {showAdd ? (
        <div className="fixed inset-0 z-[400] flex items-end justify-center bg-black/40 px-4 pb-10 max-w-md mx-auto">
          <div className="w-full bg-white rounded-[28px] p-6 shadow-2xl space-y-3 max-h-[88vh] overflow-y-auto">
            <h3 className="text-lg font-black">添加成员</h3>
            {formError ? <p className="text-xs text-red-500 font-bold">{formError}</p> : null}
            <label className="block text-[10px] font-black text-gray-400 uppercase">角色</label>
            <select
              value={form.roleId}
              onChange={(e) => setForm((f) => ({ ...f, roleId: e.target.value }))}
              className="w-full rounded-xl border border-gray-100 py-2 px-3 text-sm font-bold"
            >
              {staffRoles.map((r) => (
                <option key={r.id} value={String(r.id)}>
                  {r.name}
                </option>
              ))}
            </select>
            <label className="block text-[10px] font-black text-gray-400 uppercase">用户名</label>
            <input
              value={form.username}
              onChange={(e) => setForm((f) => ({ ...f, username: e.target.value }))}
              className="w-full rounded-xl border border-gray-100 py-2 px-3 text-sm font-bold"
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
                  onChange={(e) => setForm((f) => ({ ...f, canViewOverview: e.target.checked }))}
                />
                可看经营概览
              </label>
              <label className="flex items-center gap-2 text-xs font-bold text-gray-600">
                <input
                  type="checkbox"
                  checked={form.canViewTransactionLines}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, canViewTransactionLines: e.target.checked }))
                  }
                />
                可看全店收支流水
              </label>
            </div>
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
                disabled={submitting || staffRoles.length === 0}
                onClick={() => void submit()}
                className="flex-1 py-3 rounded-xl bg-primary text-white font-black text-sm disabled:opacity-50"
              >
                {submitting ? '创建中…' : '创建'}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </motion.div>
  );
};
