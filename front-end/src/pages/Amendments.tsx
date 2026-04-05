import React, { useCallback, useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { ChevronLeft } from 'lucide-react';
import { View } from '../types';
import { ApiAmendment, ApiError, fetchAmendments, reviewAmendment } from '../lib/api';
import { formatAmendmentPayload } from '../lib/amendmentDisplay';

interface AmendmentsProps {
  setView: (view: View) => void;
  storeId: string;
}

export const Amendments = ({ setView, storeId }: AmendmentsProps) => {
  const [list, setList] = useState<ApiAmendment[]>([]);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState<string | null>(null);

  const load = useCallback(async () => {
    setError('');
    if (!storeId.trim()) {
      setError('未选择门店');
      return;
    }
    try {
      const rows = await fetchAmendments(undefined, storeId);
      setList(rows);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : '加载失败');
    }
  }, [storeId]);

  useEffect(() => {
    void load();
  }, [load]);

  const act = async (id: string, action: 'approve' | 'reject') => {
    setBusy(id);
    setError('');
    try {
      await reviewAmendment(id, { action }, storeId);
      await load();
    } catch (e) {
      setError(e instanceof ApiError ? e.message : '操作失败');
    } finally {
      setBusy(null);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      className="px-6 pt-12 pb-36 min-h-screen bg-[#F8FAFC]"
    >
      <div className="flex items-center gap-4 mb-8">
        <button
          type="button"
          onClick={() => setView('home')}
          className="w-12 h-12 rounded-2xl bg-white flex items-center justify-center text-gray-400 border border-gray-100 shadow-sm"
        >
          <ChevronLeft size={24} />
        </button>
        <h2 className="text-xl font-black text-[#1E293B]">修改审批</h2>
      </div>

      {error ? <p className="text-red-500 text-xs font-bold mb-4">{error}</p> : null}

      <div className="space-y-4">
        {list.length === 0 ? (
          <p className="text-center text-gray-400 text-xs font-bold py-16">暂无审批单</p>
        ) : (
          list.map((a) => {
            const { reason, proposedJson } = formatAmendmentPayload(a.payload);
            return (
            <div key={a.id} className="bg-white rounded-[24px] p-5 border border-gray-100 shadow-sm">
              <div className="flex justify-between items-start gap-2 mb-2">
                <span className="text-[10px] font-black uppercase text-gray-400">{a.status}</span>
                <span className="text-[10px] text-gray-400 font-bold">{a.createdAt?.slice(0, 16)}</span>
              </div>
              <p className="text-xs font-bold text-gray-600 mb-1">
                单据 {a.transactionId.slice(0, 8)}…
              </p>
              {a.requestedByName ? (
                <p className="text-[10px] text-gray-400 mb-2">申请人：{a.requestedByName}</p>
              ) : null}
              {reason ? (
                <div className="rounded-xl bg-amber-50 border border-amber-100 px-3 py-2 mb-2">
                  <p className="text-[9px] font-black text-amber-800 uppercase mb-0.5">申请原因</p>
                  <p className="text-xs font-bold text-amber-950 whitespace-pre-wrap">{reason}</p>
                </div>
              ) : null}
              <p className="text-[9px] font-black text-gray-400 uppercase mb-1">拟修改内容</p>
              <pre className="text-[10px] bg-gray-50 rounded-xl p-3 overflow-x-auto mb-3 whitespace-pre-wrap">
                {proposedJson}
              </pre>
              {a.status === 'pending' ? (
                <div className="flex gap-2">
                  <button
                    type="button"
                    disabled={busy === a.id}
                    onClick={() => void act(a.id, 'approve')}
                    className="flex-1 py-3 rounded-xl bg-primary text-white text-xs font-black disabled:opacity-50"
                  >
                    同意
                  </button>
                  <button
                    type="button"
                    disabled={busy === a.id}
                    onClick={() => void act(a.id, 'reject')}
                    className="flex-1 py-3 rounded-xl bg-gray-100 text-gray-700 text-xs font-black disabled:opacity-50"
                  >
                    拒绝
                  </button>
                </div>
              ) : (
                <div className="text-[10px] font-bold space-y-1">
                  {a.status === 'approved' ? (
                    <p className="text-primary">
                      已由 {a.reviewedByName ?? '审批人'} 于 {a.reviewedAt?.slice(0, 16) ?? '—'}{' '}
                      同意修改，流水已更新
                    </p>
                  ) : (
                    <p className="text-gray-600">
                      已由 {a.reviewedByName ?? '审批人'} 于 {a.reviewedAt?.slice(0, 16) ?? '—'} 拒绝
                    </p>
                  )}
                  {a.rejectReason ? (
                    <p className="text-red-500 font-bold">拒绝说明：{a.rejectReason}</p>
                  ) : null}
                </div>
              )}
            </div>
            );
          })
        )}
      </div>
    </motion.div>
  );
};
