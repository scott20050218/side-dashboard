import React, { useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ChevronLeft, MoreHorizontal, ChevronRight, ChevronDown, ShoppingCart, Info } from 'lucide-react';
import { View, Transaction } from '../types';
import {
  formatOverviewMonthCn,
  aggregateIncomeByTitleForMonth,
  aggregateExpenseByTitleForMonth,
} from '../lib/accountOverviewUtils';

interface AccountDetailProps {
  setView: (view: View) => void;
  activeCard: 'assets' | 'repayment';
  setActiveCard: (card: 'assets' | 'repayment') => void;
  overview: { incomeTotal: number; expenseTotal: number; month: string; net: number } | null;
  incomeList: Transaction[];
  expenseList: Transaction[];
}

export const AccountDetail = ({
  setView,
  activeCard,
  setActiveCard,
  overview,
  incomeList,
  expenseList,
}: AccountDetailProps) => {
  const fmt = useMemo(
    () => (n: number) =>
      n.toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
    [],
  );

  const monthPrefix = overview?.month ?? '';
  const monthLabel = monthPrefix ? formatOverviewMonthCn(monthPrefix) : '';

  const incomeByTitle = useMemo(
    () => (monthPrefix ? aggregateIncomeByTitleForMonth(incomeList, monthPrefix) : []),
    [incomeList, monthPrefix],
  );
  const expenseByTitle = useMemo(
    () => (monthPrefix ? aggregateExpenseByTitleForMonth(expenseList, monthPrefix) : []),
    [expenseList, monthPrefix],
  );

  const revenueDisplay = overview ? fmt(overview.incomeTotal) : '—';
  const spendDisplay = overview ? fmt(Math.abs(overview.expenseTotal)) : '—';
  const netDisplay = overview ? fmt(overview.net) : '—';

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="min-h-screen bg-[#F8FAFC]">
      <div className="bg-[#2D334D] text-white px-6 pt-12 pb-24 rounded-b-[40px]">
        <div className="flex items-center justify-between mb-8">
          <button type="button" onClick={() => setView('home')}>
            <ChevronLeft size={24} />
          </button>
          <h2 className="text-lg font-bold">账户总览</h2>
          <button type="button" className="opacity-50" aria-label="更多">
            <MoreHorizontal size={24} />
          </button>
        </div>

        {overview ? (
          <div className="flex items-center gap-3 mb-8 text-sm opacity-90">
            <p>
              {monthLabel} · 与首页经营概况同源数据
            </p>
          </div>
        ) : (
          <div className="mb-8 text-sm opacity-70">暂无经营汇总（无查看权限或未加载门店）</div>
        )}

        <div
          onScroll={(e) => {
            const scrollLeft = e.currentTarget.scrollLeft;
            const cardWidth = 256;
            if (scrollLeft > cardWidth / 2) {
              setActiveCard('repayment');
            } else {
              setActiveCard('assets');
            }
          }}
          className="flex gap-4 overflow-x-auto no-scrollbar pb-4 snap-x snap-mandatory px-6"
        >
          <motion.div
            role="button"
            tabIndex={0}
            onClick={() => setActiveCard('assets')}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') setActiveCard('assets');
            }}
            animate={{
              scale: activeCard === 'assets' ? 1 : 0.95,
              opacity: activeCard === 'assets' ? 1 : 0.6,
            }}
            className={`min-w-[240px] snap-center bg-white/10 backdrop-blur-md rounded-3xl p-6 border ${activeCard === 'assets' ? 'border-white/40 shadow-lg' : 'border-white/10'} cursor-pointer transition-all`}
          >
            <p className="text-sm opacity-60 mb-2">本月营收</p>
            <div className="flex items-baseline gap-1 mb-4">
              <h3 className="text-2xl font-bold">¥ {revenueDisplay}</h3>
              <ChevronRight size={16} className="opacity-40" />
            </div>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setView('report');
              }}
              className="text-xs bg-white/10 px-3 py-1.5 rounded-full border border-white/10 hover:bg-white/20 transition-colors"
            >
              查看报表
            </button>
          </motion.div>

          <motion.div
            role="button"
            tabIndex={0}
            onClick={() => setActiveCard('repayment')}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') setActiveCard('repayment');
            }}
            animate={{
              scale: activeCard === 'repayment' ? 1 : 0.95,
              opacity: activeCard === 'repayment' ? 1 : 0.6,
            }}
            className={`min-w-[240px] snap-center bg-white/10 backdrop-blur-md rounded-3xl p-6 border ${activeCard === 'repayment' ? 'border-white/40 shadow-lg' : 'border-white/10'} cursor-pointer transition-all`}
          >
            <p className="text-sm opacity-60 mb-2">经营支出</p>
            <h3 className="text-xl font-bold">¥ {spendDisplay}</h3>
          </motion.div>
        </div>
      </div>

      <div className="-mt-12">
        <div className="bg-white rounded-t-[40px] shadow-xl p-6 mb-24 min-h-screen">
          <AnimatePresence mode="wait">
            {activeCard === 'assets' ? (
              <motion.div
                key="assets-detail"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
              >
                <div className="flex flex-col items-center gap-1 mb-8">
                  <div className="flex items-center justify-center gap-2">
                    <span className="text-primary font-bold">经营总览</span>
                    <span className="text-primary font-bold">¥ {revenueDisplay}</span>
                  </div>
                  {overview ? (
                    <p className="text-[10px] text-gray-400 font-bold">净额 ¥ {netDisplay}</p>
                  ) : null}
                </div>

                <div className="mb-10">
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-1">
                      <h4 className="text-lg font-bold">收入按项目汇总</h4>
                      <ChevronDown size={18} className="text-gray-400" />
                    </div>
                    <button
                      type="button"
                      onClick={() => setView('income')}
                      className="flex items-center gap-1 text-xs text-gray-400"
                    >
                      去收入管理
                      <ChevronRight size={14} className="text-gray-300" />
                    </button>
                  </div>

                  {incomeByTitle.length === 0 ? (
                    <p className="text-sm text-gray-400 font-bold py-6 text-center">
                      {monthPrefix ? '本月暂无收入流水' : '暂无数据'}
                    </p>
                  ) : (
                    <div className="space-y-6">
                      {incomeByTitle.map((row, i) => (
                        <div key={row.title + i} className="flex justify-between items-center">
                          <div className="flex items-center gap-3 min-w-0">
                            <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center shrink-0">
                              <div className="w-5 h-5 bg-primary rounded-md" />
                            </div>
                            <div className="min-w-0">
                              <p className="font-bold truncate">{row.title}</p>
                              <p className="text-xs text-gray-400">笔数 {row.count}</p>
                            </div>
                          </div>
                          <p className="font-bold shrink-0 ml-2">¥ {fmt(row.total)}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div>
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-1">
                      <h4 className="text-lg font-bold">支出按项目汇总</h4>
                      <ChevronDown size={18} className="text-gray-400" />
                    </div>
                    <button
                      type="button"
                      onClick={() => setView('expense')}
                      className="flex items-center gap-1 text-xs text-gray-400"
                    >
                      去支出管理
                      <ChevronRight size={14} className="text-gray-300" />
                    </button>
                  </div>

                  {expenseByTitle.length === 0 ? (
                    <p className="text-sm text-gray-400 font-bold py-6 text-center">
                      {monthPrefix ? '本月暂无支出流水' : '暂无数据'}
                    </p>
                  ) : (
                    <div className="space-y-4">
                      {expenseByTitle.map((row, i) => (
                        <div
                          key={row.title + i}
                          className="flex justify-between items-center p-4 bg-gray-50 rounded-2xl"
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-sm shrink-0">
                              <ShoppingCart size={20} className="text-gray-400" />
                            </div>
                            <div className="min-w-0">
                              <p className="font-bold truncate">{row.title}</p>
                              <p className="text-xs text-gray-400">笔数 {row.count}</p>
                            </div>
                          </div>
                          <p className="font-bold text-orange-custom shrink-0 ml-2">¥ {fmt(row.total)}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="repayment-detail"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
              >
                <div className="flex flex-col items-center gap-1 mb-8">
                  <div className="flex items-center justify-center gap-2">
                    <span className="text-orange-custom font-bold">支出总览</span>
                    <span className="text-orange-custom font-bold">¥ {spendDisplay}</span>
                  </div>
                  {overview ? (
                    <p className="text-[10px] text-gray-400 font-bold">净额 ¥ {netDisplay}</p>
                  ) : null}
                </div>

                <div className="space-y-4">
                  {expenseByTitle.length === 0 ? (
                    <p className="text-sm text-gray-400 font-bold py-6 text-center">
                      {monthPrefix ? '本月暂无支出流水' : '暂无数据'}
                    </p>
                  ) : (
                    expenseByTitle.map((row, i) => (
                      <div
                        key={`exp-${row.title}-${i}`}
                        className="flex justify-between items-center p-4 bg-orange-custom/5 rounded-2xl"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-sm shrink-0">
                            <ShoppingCart size={20} className="text-orange-custom" />
                          </div>
                          <div className="min-w-0">
                            <p className="font-bold truncate">{row.title}</p>
                            <p className="text-xs text-gray-400">笔数 {row.count}</p>
                          </div>
                        </div>
                        <p className="font-bold shrink-0 ml-2">¥ {fmt(row.total)}</p>
                      </div>
                    ))
                  )}
                </div>

                <div className="mt-12 p-6 bg-gray-50 rounded-3xl border border-dashed border-gray-200">
                  <div className="flex items-center gap-2 text-gray-400 mb-4">
                    <Info size={16} />
                    <p className="text-xs font-bold">说明</p>
                  </div>
                  <p className="text-xs text-gray-500 leading-relaxed">
                    金额来自当前门店本月流水汇总；详细单据请在「支出管理」中查看。
                  </p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </motion.div>
  );
};
