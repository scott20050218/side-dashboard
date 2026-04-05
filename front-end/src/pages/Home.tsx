import React, { useMemo } from 'react';
import { motion } from 'motion/react';
import {
  Eye,
  ChevronRight,
  TrendingUp,
  ShoppingCart,
  Activity,
  LogOut,
} from 'lucide-react';
import { AdBanner } from '../components/AdBanner';
import { View } from '../types';
import { formatOverviewMonthCn } from '../lib/accountOverviewUtils';

interface HomeStoreOption {
  id: string;
  name: string;
}

interface HomeProps {
  setView: (view: View) => void;
  onLogout: () => void;
  stores: HomeStoreOption[];
  selectedStoreId: string;
  onStoreChange: (id: string) => void;
  overview: { incomeTotal: number; expenseTotal: number; month: string; net: number } | null;
  /** 经营概况 + 本月收支；收银员仅保留收支入口时为 false */
  showSummaryCards: boolean;
  showIncomeExpense: boolean;
  showManagement: boolean;
}

export const Home = ({
  setView,
  onLogout,
  stores,
  selectedStoreId,
  onStoreChange,
  overview,
  showSummaryCards,
  showIncomeExpense,
  showManagement,
}: HomeProps) => {
  const fmt = useMemo(
    () => (n: number) =>
      `¥ ${n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
    [],
  );

  const todayLabel = useMemo(() => {
    const d = new Date();
    return `${d.getFullYear()}年${d.getMonth() + 1}月${d.getDate()}日`;
  }, []);

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="px-6 pt-12 pb-36">
      <div className="flex items-center justify-between mb-6">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-black tracking-tighter text-[#1E293B] truncate">下午好,</h1>
            <button
              type="button"
              onClick={onLogout}
              className="p-2 text-gray-300 hover:text-red-500 transition-colors shrink-0"
              title="退出登录"
            >
              <LogOut size={18} />
            </button>
          </div>
          <p className="text-gray-400 font-bold uppercase tracking-widest text-[10px] mt-1">{todayLabel}</p>
          {stores.length > 0 ? (
            <label className="block mt-3">
              <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">当前门店</span>
              <select
                value={selectedStoreId}
                onChange={(e) => onStoreChange(e.target.value)}
                className="mt-1 w-full bg-white border border-gray-100 rounded-2xl py-3 px-4 text-sm font-bold text-[#1E293B]"
              >
                {stores.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </label>
          ) : null}
        </div>
        <div className="relative shrink-0 ml-2">
          <div className="w-14 h-14 rounded-[22px] bg-gradient-to-tr from-primary via-cyan-custom to-yellow-custom p-0.5 shadow-xl rotate-3">
            <div className="w-full h-full rounded-[20px] bg-white p-1">
              <img
                src="https://picsum.photos/seed/avatar/100/100"
                alt="Avatar"
                className="w-full h-full rounded-[18px] object-cover"
                referrerPolicy="no-referrer"
              />
            </div>
          </div>
        </div>
      </div>

      <AdBanner />

      {showSummaryCards ? (
        <div className="space-y-4 mb-8">
          <motion.button
            type="button"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setView('account_detail')}
            className="w-full text-left bg-white rounded-[32px] p-6 shadow-xl border border-gray-50"
          >
            <div className="flex items-center gap-2 mb-6">
              <h3 className="text-lg font-black text-[#1E293B]">经营概况</h3>
              <Eye size={18} className="text-gray-400" />
            </div>
            <div className="flex justify-between items-start mb-6">
              <div>
                <p className="text-xs text-gray-400 font-bold mb-2">
                  本月收入{overview ? ` (${overview.month})` : ''}
                </p>
                <div className="flex items-baseline gap-2">
                  <h4 className="text-2xl font-black text-[#1E293B]">
                    {overview ? fmt(overview.incomeTotal) : '—'}
                  </h4>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setView('report');
                    }}
                    className="text-[10px] text-primary font-bold hover:underline"
                  >
                    查看报表
                  </button>
                </div>
              </div>
              <div className="text-right">
                <p className="text-xs text-gray-400 font-bold mb-2">本月支出</p>
                <h4 className="text-xl font-black text-orange-custom">
                  {overview ? fmt(Math.abs(overview.expenseTotal)) : '—'}
                </h4>
              </div>
            </div>
            {overview ? (
              <p className="text-[10px] text-gray-500 font-bold mb-2">净额 {fmt(overview.net)}</p>
            ) : (
              <p className="text-[10px] text-gray-400 font-bold">暂无汇总数据</p>
            )}
            <div className="pt-4 border-t border-gray-50 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-orange-custom" />
                <p className="text-xs text-gray-500 font-bold">多店数据已按当前门店隔离</p>
              </div>
              <ChevronRight size={14} className="text-gray-300" />
            </div>
          </motion.button>

          <motion.button
            type="button"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setView('monthly_flow')}
            className="w-full text-left bg-white rounded-[32px] p-6 shadow-xl border border-gray-50"
          >
            <h3 className="text-lg font-black text-[#1E293B] mb-6">本月收支</h3>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary">
                  <TrendingUp size={24} />
                </div>
                <div>
                  <p className="text-xs text-gray-400 font-bold mb-1 uppercase tracking-wider">本月净额</p>
                  <h4 className="text-xl font-black text-[#1E293B]">
                    {overview ? fmt(overview.net) : '—'}
                  </h4>
                </div>
              </div>
              <ChevronRight size={20} className="text-gray-300" />
            </div>
          </motion.button>
        </div>
      ) : null}

      <div className={`grid grid-cols-1 gap-4 ${showSummaryCards ? '' : 'mt-6'}`}>
        {showIncomeExpense ? (
          <>
            <motion.button
              type="button"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setView('income')}
              className="flex items-center gap-6 p-6 bg-white rounded-[32px] shadow-lg border border-gray-50"
            >
              <div className="w-14 h-14 rounded-2xl bg-cyan-custom/10 flex items-center justify-center text-cyan-custom">
                <TrendingUp size={28} />
              </div>
              <div className="flex-1 text-left">
                <h4 className="text-lg font-black text-[#1E293B]">收入管理</h4>
                <p className="text-xs text-gray-400 font-bold">查看收入明细</p>
              </div>
              <ChevronRight size={20} className="text-gray-300" />
            </motion.button>

            <motion.button
              type="button"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setView('expense')}
              className="flex items-center gap-6 p-6 bg-white rounded-[32px] shadow-lg border border-gray-50"
            >
              <div className="w-14 h-14 rounded-2xl bg-orange-custom/10 flex items-center justify-center text-orange-custom">
                <ShoppingCart size={28} />
              </div>
              <div className="flex-1 text-left">
                <h4 className="text-lg font-black text-[#1E293B]">支出管理</h4>
                <p className="text-xs text-gray-400 font-bold">查看支出明细</p>
              </div>
              <ChevronRight size={20} className="text-gray-300" />
            </motion.button>
          </>
        ) : null}

        {showManagement ? (
          <motion.button
            type="button"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setView('management')}
            className="flex items-center gap-6 p-6 bg-white rounded-[32px] shadow-lg border border-gray-50"
          >
            <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center text-primary">
              <Activity size={28} />
            </div>
            <div className="flex-1 text-left">
              <h4 className="text-lg font-black text-[#1E293B]">事务管理</h4>
              <p className="text-xs text-gray-400 font-bold">通知与审批信息</p>
            </div>
            <ChevronRight size={20} className="text-gray-300" />
          </motion.button>
        ) : null}
      </div>
    </motion.div>
  );
};
