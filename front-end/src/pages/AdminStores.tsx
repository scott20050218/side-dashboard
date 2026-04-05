import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'motion/react';
import { ChevronLeft, Store, UserPlus } from 'lucide-react';
import { View, User } from '../types';
import { createAdminStore, fetchAdminStores, ApiError } from '../lib/api';

interface AdminStoreRow {
  id: string;
  name: string;
  ownerUserId: string | null;
  ownerName: string | null;
  createdAt: string;
}

interface AdminStoresProps {
  setView: (view: View) => void;
  users: User[];
  onRefreshLists?: () => void;
}

function formatCreatedAt(iso: string): string {
  if (!iso) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso.slice(0, 10);
  return d.toLocaleDateString('zh-CN', { year: 'numeric', month: '2-digit', day: '2-digit' });
}

/** 用户列表按创建时间排序时，超管常排第一；建店默认店主应为实际老板，勿默认成超管 */
function defaultOwnerUserIdForNewStore(users: User[]): string {
  const nonSuper = users.find((u) => u.role !== '超级管理员');
  if (nonSuper) return nonSuper.id;
  return users[0]?.id ?? '';
}

export const AdminStores = ({ setView, users, onRefreshLists }: AdminStoresProps) => {
  const [stores, setStores] = useState<AdminStoreRow[]>([]);
  const [loadError, setLoadError] = useState('');
  const [loadingList, setLoadingList] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState('');
  const [form, setForm] = useState({ name: '', ownerUserId: '' });

  const loadStores = useCallback(async () => {
    setLoadError('');
    setLoadingList(true);
    try {
      const rows = await fetchAdminStores();
      setStores(rows);
    } catch (e) {
      setLoadError(e instanceof ApiError ? e.message : '加载失败');
      setStores([]);
    } finally {
      setLoadingList(false);
    }
  }, []);

  useEffect(() => {
    void loadStores();
  }, [loadStores]);

  useEffect(() => {
    if (!showCreate || users.length === 0) return;
    setForm((f) => {
      if (f.ownerUserId && users.some((u) => u.id === f.ownerUserId)) return f;
      return { ...f, ownerUserId: defaultOwnerUserIdForNewStore(users) };
    });
  }, [showCreate, users]);

  const openCreate = () => {
    setFormError('');
    setForm({ name: '', ownerUserId: defaultOwnerUserIdForNewStore(users) });
    setShowCreate(true);
    if (users.length === 0) {
      onRefreshLists?.();
    }
  };

  const submitCreate = async () => {
    setFormError('');
    const name = form.name.trim();
    if (!name || !form.ownerUserId) {
      setFormError('请填写小店名称并选择门店店主');
      return;
    }
    const picked = users.find((u) => u.id === form.ownerUserId);
    if (picked?.role === '超级管理员') {
      setFormError('请选择实际店主（老板/店长等），超级管理员仅代建门店，不应作为登记店主');
      return;
    }
    setSubmitting(true);
    try {
      await createAdminStore({ name, ownerUserId: form.ownerUserId });
      setShowCreate(false);
      await loadStores();
      onRefreshLists?.();
    } catch (e) {
      setFormError(e instanceof ApiError ? e.message : '创建失败');
    } finally {
      setSubmitting(false);
    }
  };

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
        <h2 className="text-xl font-black tracking-tight text-[#1E293B]">小店管理</h2>
        <button
          type="button"
          onClick={() => openCreate()}
          className="ml-auto w-12 h-12 rounded-2xl bg-primary text-white flex items-center justify-center shadow-lg"
          aria-label="新增小店"
        >
          <UserPlus size={24} />
        </button>
      </div>

      {loadError ? (
        <p className="text-xs text-red-500 font-bold mb-4">{loadError}</p>
      ) : null}

      {loadingList ? (
        <p className="text-sm text-gray-400 font-bold text-center py-12">加载中…</p>
      ) : stores.length === 0 ? (
        <div className="bg-white rounded-[32px] border border-gray-50 p-10 text-center shadow-sm">
          <div className="w-16 h-16 mx-auto rounded-2xl bg-primary/10 flex items-center justify-center text-primary mb-4">
            <Store size={32} />
          </div>
          <p className="text-sm font-black text-[#1E293B] mb-2">暂无小店</p>
          <p className="text-xs text-gray-400 font-bold mb-6">点击下方按钮创建第一家门店</p>
          <button
            type="button"
            onClick={() => openCreate()}
            className="w-full py-4 rounded-2xl bg-primary text-white font-black text-sm"
          >
            新增小店
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {stores.map((s) => (
            <div
              key={s.id}
              className="bg-white p-5 rounded-[28px] shadow-sm border border-gray-50 flex items-start gap-4"
            >
              <div className="w-12 h-12 rounded-2xl bg-cyan-custom/10 flex items-center justify-center text-cyan-custom shrink-0">
                <Store size={22} />
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="text-sm font-black tracking-tight truncate">{s.name}</h4>
                <p className="text-[11px] text-gray-400 font-bold mt-1">
                  登记店主：{s.ownerName ?? '—'}
                </p>
                <p className="text-[10px] text-gray-300 font-bold mt-0.5 uppercase tracking-wider">
                  创建于 {formatCreatedAt(s.createdAt)}
                </p>
              </div>
            </div>
          ))}
          <button
            type="button"
            onClick={() => openCreate()}
            className="w-full py-4 rounded-[28px] border-2 border-dashed border-primary/30 text-primary font-black text-sm bg-primary/5"
          >
            + 新增小店
          </button>
        </div>
      )}

      {showCreate ? (
        <div className="fixed inset-0 z-[400] flex items-end justify-center bg-black/40 px-4 pb-10 max-w-md mx-auto">
          <div className="w-full bg-white rounded-[28px] p-6 shadow-2xl space-y-3 max-h-[85vh] overflow-y-auto">
            <h3 className="text-lg font-black">新增小店</h3>
            <p className="text-[11px] text-gray-400 font-bold leading-relaxed">
              所选用户会写入本店 store_members，角色为「老板」（role_id=5）；stores 表不存店主。created_by_admin_id 仅记录操作人。
            </p>
            {formError ? <p className="text-xs text-red-500 font-bold">{formError}</p> : null}
            <label className="block text-[10px] font-black text-gray-400 uppercase">小店名称</label>
            <input
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              placeholder="例如：滨江旗舰店"
              className="w-full rounded-xl border border-gray-100 py-2 px-3 text-sm font-bold"
            />
            <label className="block text-[10px] font-black text-gray-400 uppercase">门店店主</label>
            <select
              value={form.ownerUserId}
              onChange={(e) => setForm((f) => ({ ...f, ownerUserId: e.target.value }))}
              disabled={users.length === 0}
              className="w-full rounded-xl border border-gray-100 py-2 px-3 text-sm font-bold disabled:opacity-50"
            >
              {users.length === 0 ? (
                <option value="">暂无用户，请先在用户管理中添加</option>
              ) : (
                users.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.name} · {u.email}（{u.role}）
                  </option>
                ))
              )}
            </select>
            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowCreate(false)}
                className="flex-1 py-3 rounded-xl bg-gray-100 font-black text-sm"
              >
                取消
              </button>
              <button
                type="button"
                disabled={submitting || users.length === 0}
                onClick={() => void submitCreate()}
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
