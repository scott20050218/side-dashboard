import React, { useState, useMemo } from 'react';
import { motion } from 'motion/react';
import { ChevronLeft, Plus, Bell, Activity, FileText } from 'lucide-react';
import { View, ManagementItem } from '../types';
import { DateFilter, FilterType } from '../components/DateFilter';
import { filterByDateFilter } from '../lib/transactionDateFilter';
import type { ApiAmendment } from '../lib/api';
import { formatAmendmentPayload, summarizeAmendmentProposed } from '../lib/amendmentDisplay';
import { isManagementItemPendingReview } from '../lib/managementItemReview';

interface ManagementAmendmentAuditProps {
  items: ApiAmendment[];
  loading: boolean;
  error: string;
  onApprove: (id: string) => Promise<void>;
  onReject: (id: string, rejectReason: string) => Promise<void>;
}

interface ManagementItemReviewProps {
  onApprove: (id: string) => Promise<void>;
  onReject: (id: string, rejectReason: string) => Promise<void>;
}

interface ManagementProps {
  setView: (view: View) => void;
  managementList: ManagementItem[];
  setShowAddModal: (view: View | null) => void;
  /** 本店老板/超管：在事务管理中审批收支修改 */
  amendmentAudit?: ManagementAmendmentAuditProps;
  /** 本店老板/超管：审批「通知与事务」明细 */
  managementItemReview?: ManagementItemReviewProps;
}

export const Management = ({
  setView,
  managementList,
  setShowAddModal,
  amendmentAudit,
  managementItemReview,
}: ManagementProps) => {
  const [filter, setFilter] = useState<{ type: FilterType; start?: string; end?: string }>({ type: 'day' });
  const [busyId, setBusyId] = useState<string | null>(null);
  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const [rejectNote, setRejectNote] = useState('');
  const [mgmtBusyId, setMgmtBusyId] = useState<string | null>(null);
  const [mgmtRejectingId, setMgmtRejectingId] = useState<string | null>(null);
  const [mgmtRejectNote, setMgmtRejectNote] = useState('');

  const filteredList = useMemo(
    () => filterByDateFilter(managementList, filter),
    [managementList, filter],
  );

  const { pendingAmendments, doneAmendments } = useMemo(() => {
    if (!amendmentAudit?.items?.length) {
      return { pendingAmendments: [] as ApiAmendment[], doneAmendments: [] as ApiAmendment[] };
    }
    const pending = amendmentAudit.items.filter((a) => a.status === 'pending');
    const done = amendmentAudit.items.filter((a) => a.status !== 'pending');
    return { pendingAmendments: pending, doneAmendments: done };
  }, [amendmentAudit?.items]);

  const handleFilterChange = (type: FilterType, start?: string, end?: string) => {
    setFilter({ type, start, end });
  };

  const runApprove = async (id: string) => {
    if (!amendmentAudit) return;
    setBusyId(id);
    try {
      await amendmentAudit.onApprove(id);
      setRejectingId(null);
      setRejectNote('');
    } finally {
      setBusyId(null);
    }
  };

  const runReject = async (id: string) => {
    if (!amendmentAudit) return;
    setBusyId(id);
    try {
      await amendmentAudit.onReject(id, rejectNote.trim());
      setRejectingId(null);
      setRejectNote('');
    } finally {
      setBusyId(null);
    }
  };

  const runMgmtApprove = async (id: string) => {
    if (!managementItemReview) return;
    setMgmtBusyId(id);
    try {
      await managementItemReview.onApprove(id);
      setMgmtRejectingId(null);
      setMgmtRejectNote('');
    } finally {
      setMgmtBusyId(null);
    }
  };

  const runMgmtReject = async (id: string) => {
    if (!managementItemReview) return;
    setMgmtBusyId(id);
    try {
      await managementItemReview.onReject(id, mgmtRejectNote.trim());
      setMgmtRejectingId(null);
      setMgmtRejectNote('');
    } finally {
      setMgmtBusyId(null);
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
          onClick={() => setView('home')}
          className="w-12 h-12 rounded-2xl bg-white flex items-center justify-center text-gray-400 border border-gray-100 shadow-sm"
        >
          <ChevronLeft size={24} />
        </button>
        <h2 className="text-xl font-black tracking-tight text-[#1E293B]">事务管理</h2>
        <button
          type="button"
          onClick={() => setShowAddModal('management')}
          className="ml-auto w-12 h-12 rounded-2xl bg-primary text-white flex items-center justify-center shadow-lg"
        >
          <Plus size={24} />
        </button>
      </div>

      {amendmentAudit ? (
        <div className="space-y-6 mb-10">
          <div>
            <h3 className="text-sm font-black text-[#1E293B] mb-2 flex items-center gap-2">
              <FileText size={16} className="text-primary" />
              收支修改待审批
            </h3>
            {amendmentAudit.error ? (
              <p className="text-xs text-red-500 font-bold mb-2">{amendmentAudit.error}</p>
            ) : null}
            {amendmentAudit.loading ? (
              <p className="text-xs text-gray-400 font-bold py-4">加载审批列表…</p>
            ) : pendingAmendments.length === 0 ? (
              <p className="text-xs text-gray-400 font-bold py-2">暂无待审批的收支修改</p>
            ) : (
              <div className="space-y-3">
                {pendingAmendments.map((a) => {
                  const { reason } = formatAmendmentPayload(a.payload);
                  const summary = summarizeAmendmentProposed(a.payload);
                  return (
                    <div
                      key={a.id}
                      className="bg-white rounded-[24px] p-4 border border-primary/15 shadow-sm space-y-2"
                    >
                      <div className="flex justify-between items-start gap-2">
                        <span className="text-[10px] font-black text-primary uppercase">待审批</span>
                        <span className="text-[10px] text-gray-400 font-bold">
                          {a.createdAt?.slice(0, 16)}
                        </span>
                      </div>
                      <p className="text-xs font-bold text-gray-800">{summary}</p>
                      <p className="text-[10px] text-gray-500 font-bold">
                        流水单号 {a.transactionId.slice(0, 8)}…
                      </p>
                      {a.requestedByName ? (
                        <p className="text-[10px] text-gray-400 font-bold">申请人：{a.requestedByName}</p>
                      ) : null}
                      {reason ? (
                        <div className="rounded-xl bg-amber-50 border border-amber-100 px-3 py-2">
                          <p className="text-[9px] font-black text-amber-800 uppercase mb-0.5">申请原因</p>
                          <p className="text-xs font-bold text-amber-950 whitespace-pre-wrap">{reason}</p>
                        </div>
                      ) : null}

                      {rejectingId === a.id ? (
                        <div className="space-y-2 pt-1">
                          <label className="block text-[10px] font-black text-gray-400 uppercase">
                            拒绝说明（可选）
                          </label>
                          <textarea
                            value={rejectNote}
                            onChange={(e) => setRejectNote(e.target.value)}
                            rows={2}
                            className="w-full rounded-xl border border-gray-100 py-2 px-3 text-xs font-bold resize-none"
                          />
                          <div className="flex gap-2">
                            <button
                              type="button"
                              disabled={busyId === a.id}
                              onClick={() => {
                                setRejectingId(null);
                                setRejectNote('');
                              }}
                              className="flex-1 py-2.5 rounded-xl bg-gray-100 text-xs font-black"
                            >
                              取消
                            </button>
                            <button
                              type="button"
                              disabled={busyId === a.id}
                              onClick={() => void runReject(a.id)}
                              className="flex-1 py-2.5 rounded-xl bg-gray-800 text-white text-xs font-black disabled:opacity-50"
                            >
                              确认拒绝
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="flex gap-2 pt-1">
                          <button
                            type="button"
                            disabled={busyId !== null}
                            onClick={() => void runApprove(a.id)}
                            className="flex-1 py-3 rounded-xl bg-primary text-white text-xs font-black disabled:opacity-50"
                          >
                            同意修改
                          </button>
                          <button
                            type="button"
                            disabled={busyId !== null}
                            onClick={() => {
                              setRejectingId(a.id);
                              setRejectNote('');
                            }}
                            className="flex-1 py-3 rounded-xl bg-gray-100 text-gray-800 text-xs font-black disabled:opacity-50"
                          >
                            拒绝
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {doneAmendments.length > 0 ? (
            <div>
              <h3 className="text-sm font-black text-[#1E293B] mb-2">审批记录</h3>
              <p className="text-[10px] text-gray-400 font-bold mb-3">
                记录审批人、时间及结果；同意后系统已更新对应收支流水。
              </p>
              <div className="space-y-2">
                {doneAmendments.map((a) => (
                  <div
                    key={a.id}
                    className="bg-white rounded-2xl p-3 border border-gray-100 text-[10px] font-bold"
                  >
                    <div className="flex justify-between gap-2 mb-1">
                      <span className={a.status === 'approved' ? 'text-primary' : 'text-gray-600'}>
                        {a.status === 'approved' ? '已同意' : '已拒绝'}
                      </span>
                      <span className="text-gray-400 shrink-0">{a.reviewedAt?.slice(0, 16) ?? '—'}</span>
                    </div>
                    <p className="text-gray-700 mb-1">{summarizeAmendmentProposed(a.payload)}</p>
                    <p className="text-gray-400">
                      审批人：{a.reviewedByName ?? '—'}
                      {a.requestedByName ? ` · 申请人：${a.requestedByName}` : ''}
                    </p>
                    {a.rejectReason ? (
                      <p className="text-red-500 mt-1">拒绝说明：{a.rejectReason}</p>
                    ) : null}
                  </div>
                ))}
              </div>
            </div>
          ) : null}
        </div>
      ) : null}

      <h3 className="text-sm font-black text-[#1E293B] mb-3">通知与事务</h3>
      <DateFilter onFilterChange={handleFilterChange} />

      <div className="space-y-4">
        {filteredList.length > 0 ? (
          filteredList.map((item) => {
            const pending = isManagementItemPendingReview(item.status);
            const rejected = item.status === '已拒绝';
            const badgeClass = pending
              ? 'bg-orange-custom/10 text-orange-custom'
              : rejected
                ? 'bg-red-500/10 text-red-600'
                : 'bg-primary/10 text-primary';
            const typeHint =
              item.type === 'approval'
                ? pending
                  ? '事务申请 · 待老板审批'
                  : '事务申请'
                : pending
                  ? '通知 · 待老板审批'
                  : '系统通知';
            const showBossActions = Boolean(managementItemReview && pending);
            return (
              <div key={item.id} className="list-item-glass flex-col items-stretch! gap-3">
                <div className="flex items-center gap-4 w-full">
                  <div
                    className={`w-12 h-12 rounded-2xl shrink-0 ${item.type === 'approval' ? 'bg-primary/10 text-primary' : 'bg-cyan-custom/10 text-cyan-custom'} flex items-center justify-center`}
                  >
                    {item.type === 'approval' ? <Bell size={20} /> : <Activity size={20} />}
                  </div>
                  <div className="min-w-0 flex-1">
                    <h4 className="text-sm font-black tracking-tight">{item.title}</h4>
                    <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">{typeHint}</p>
                    {item.note ? (
                      <div className="rounded-xl bg-slate-50 border border-slate-100 px-3 py-2 mt-2">
                        <p className="text-[9px] font-black text-slate-400 uppercase mb-0.5">备注</p>
                        <p className="text-xs font-bold text-slate-700 whitespace-pre-wrap leading-relaxed">
                          {item.note}
                        </p>
                      </div>
                    ) : null}
                    {item.createdByName ? (
                      <p className="text-[9px] text-gray-400 font-bold mt-0.5">提交人：{item.createdByName}</p>
                    ) : null}
                    {!pending && (item.reviewedByName || item.reviewedAt) ? (
                      <p className="text-[9px] text-gray-500 font-bold mt-1">
                        审批：{item.reviewedByName ?? '—'}
                        {item.reviewedAt ? ` · ${item.reviewedAt.slice(0, 16)}` : ''}
                      </p>
                    ) : null}
                    {!pending && item.rejectReason ? (
                      <p className="text-[9px] text-red-500 font-bold mt-0.5">说明：{item.rejectReason}</p>
                    ) : null}
                  </div>
                  <div className="text-right shrink-0">
                    <span className={`text-[10px] font-black px-2 py-1 rounded-lg ${badgeClass}`}>
                      {item.status}
                    </span>
                    <div className="flex flex-col items-end mt-1">
                      <p className="text-[9px] text-gray-400 font-bold uppercase">{item.date}</p>
                      <p className="text-[9px] text-gray-400 font-bold uppercase">{item.time}</p>
                    </div>
                  </div>
                </div>
                {showBossActions ? (
                  mgmtRejectingId === item.id ? (
                    <div className="space-y-2 pl-0 w-full border-t border-gray-100 pt-3">
                      <label className="block text-[10px] font-black text-gray-400 uppercase">
                        拒绝说明（可选）
                      </label>
                      <textarea
                        value={mgmtRejectNote}
                        onChange={(e) => setMgmtRejectNote(e.target.value)}
                        rows={2}
                        className="w-full rounded-xl border border-gray-100 py-2 px-3 text-xs font-bold resize-none"
                      />
                      <div className="flex gap-2">
                        <button
                          type="button"
                          disabled={mgmtBusyId === item.id}
                          onClick={() => {
                            setMgmtRejectingId(null);
                            setMgmtRejectNote('');
                          }}
                          className="flex-1 py-2.5 rounded-xl bg-gray-100 text-xs font-black"
                        >
                          取消
                        </button>
                        <button
                          type="button"
                          disabled={mgmtBusyId === item.id}
                          onClick={() => void runMgmtReject(item.id)}
                          className="flex-1 py-2.5 rounded-xl bg-gray-800 text-white text-xs font-black disabled:opacity-50"
                        >
                          确认拒绝
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex gap-2 w-full border-t border-gray-100 pt-3">
                      <button
                        type="button"
                        disabled={mgmtBusyId !== null}
                        onClick={() => void runMgmtApprove(item.id)}
                        className="flex-1 py-3 rounded-xl bg-primary text-white text-xs font-black disabled:opacity-50"
                      >
                        同意
                      </button>
                      <button
                        type="button"
                        disabled={mgmtBusyId !== null}
                        onClick={() => {
                          setMgmtRejectingId(item.id);
                          setMgmtRejectNote('');
                        }}
                        className="flex-1 py-3 rounded-xl bg-gray-100 text-gray-800 text-xs font-black disabled:opacity-50"
                      >
                        拒绝
                      </button>
                    </div>
                  )
                ) : null}
              </div>
            );
          })
        ) : (
          <div className="text-center py-20">
            <p className="text-xs text-gray-400 font-black uppercase tracking-widest">暂无相关记录</p>
          </div>
        )}
      </div>
    </motion.div>
  );
};
