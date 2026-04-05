import React, { useMemo, useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ChevronLeft, ChevronDown, Search, ArrowUp, ArrowDown, X } from 'lucide-react';
import { View, Transaction } from '../types';
import {
  monthDotToDatePrefix,
  recentMonthDots,
  buildFlowRows,
  sortMonthlyFlowRowsByAmount,
  formatMonthDay,
  sumIncomeTotal,
  sumExpenseTotal,
  matchesFlowSearch,
  type FlowRow,
} from '../lib/monthlyFlowUtils';

interface MonthlyFlowProps {
  setView: (view: View) => void;
  selectedMonth: string;
  setSelectedMonth: (month: string) => void;
  openDropdown: 'month' | null;
  setOpenDropdown: (dropdown: 'month' | null) => void;
  incomeList: Transaction[];
  expenseList: Transaction[];
  /** 当前门店名称，替代原「账户」写死选项 */
  storeName?: string;
}

function fmtMoney(n: number): string {
  return n.toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export const MonthlyFlow = ({
  setView,
  selectedMonth,
  setSelectedMonth,
  openDropdown,
  setOpenDropdown,
  incomeList,
  expenseList,
  storeName,
}: MonthlyFlowProps) => {
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  /** 按金额：降序 = 绝对值大到小，升序 = 绝对值小到大 */
  const [amountSortDir, setAmountSortDir] = useState<'desc' | 'asc'>('desc');
  const searchInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (searchOpen) {
      searchInputRef.current?.focus();
    }
  }, [searchOpen]);

  const monthOptions = useMemo(() => {
    const base = recentMonthDots(12);
    return base.includes(selectedMonth) ? base : [selectedMonth, ...base];
  }, [selectedMonth]);

  const { monthPrefix, flowRows, incomeSum, expenseSum } = useMemo(() => {
    const prefix = monthDotToDatePrefix(selectedMonth);
    if (!prefix) {
      return {
        monthPrefix: null as string | null,
        flowRows: [] as FlowRow[],
        incomeSum: 0,
        expenseSum: 0,
      };
    }
    const raw = buildFlowRows(incomeList, expenseList, prefix);
    const sorted = sortMonthlyFlowRowsByAmount(raw, amountSortDir);
    return {
      monthPrefix: prefix,
      flowRows: sorted,
      incomeSum: sumIncomeTotal(raw),
      expenseSum: sumExpenseTotal(raw),
    };
  }, [selectedMonth, incomeList, expenseList, amountSortDir]);

  const searchQ = searchQuery.trim();
  const visibleRows = useMemo(() => {
    if (!searchQ) return flowRows;
    const filtered = flowRows.filter((r) => matchesFlowSearch(r, searchQ));
    return sortMonthlyFlowRowsByAmount(filtered, amountSortDir);
  }, [flowRows, searchQ, amountSortDir]);

  const displayIncomeSum = monthPrefix ? (searchQ ? sumIncomeTotal(visibleRows) : incomeSum) : 0;
  const displayExpenseSum = monthPrefix ? (searchQ ? sumExpenseTotal(visibleRows) : expenseSum) : 0;

  const storeLabel = storeName?.trim() || '当前门店';

  const closeSearch = () => {
    setSearchOpen(false);
    setSearchQuery('');
  };

  const handleBack = () => {
    if (searchOpen) {
      closeSearch();
      return;
    }
    setView('home');
  };

  const openSearch = () => {
    setOpenDropdown(null);
    setSearchOpen(true);
  };

  const renderFlowCard = (item: FlowRow) => {
    const isInc = item.flowKind === 'income';
    const amtClass = isInc ? 'text-cyan-custom' : 'text-orange-custom';
    const amtText = isInc
      ? `+¥ ${fmtMoney(Math.max(0, item.amount))}`
      : `-¥ ${fmtMoney(Math.abs(item.amount))}`;
    const subLine = [formatMonthDay(item.date), item.subtitle?.trim()].filter(Boolean).join(' · ');
    return (
      <div
        key={`${item.flowKind}-${item.id}`}
        className="bg-white p-4 rounded-3xl shadow-sm border border-gray-50 flex items-center justify-between"
      >
        <div className="flex items-center gap-3 min-w-0">
          <div
            className={`w-10 h-10 rounded-xl shrink-0 ${item.color} flex items-center justify-center ${isInc ? 'text-cyan-custom' : 'text-orange-custom'}`}
          >
            {item.icon}
          </div>
          <div className="min-w-0">
            <p className="text-sm font-black truncate">{item.title}</p>
            <p className="text-[10px] text-gray-400 truncate">{subLine}</p>
          </div>
        </div>
        <div className="text-right shrink-0 ml-2">
          <p className={`font-black ${amtClass}`}>{amtText}</p>
          <p className="text-[10px] text-gray-300">{item.time}</p>
        </div>
      </div>
    );
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="min-h-screen bg-[#F8FAFC]">
      <div className="bg-white px-6 pt-12 pb-6 sticky top-0 z-50 shadow-sm">
        <div className="flex items-center justify-between mb-6 gap-3">
          <button
            type="button"
            onClick={handleBack}
            className="w-10 h-10 shrink-0 rounded-full bg-gray-50 flex items-center justify-center text-gray-400"
          >
            <ChevronLeft size={24} />
          </button>
          {searchOpen ? (
            <div className="flex-1 flex items-center gap-2 min-w-0 rounded-2xl bg-gray-50 border border-gray-100 px-3 py-2">
              <Search size={18} className="text-gray-400 shrink-0" />
              <input
                ref={searchInputRef}
                type="search"
                enterKeyHint="search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="按名称搜索收入、支出…"
                className="flex-1 min-w-0 bg-transparent text-sm font-bold text-[#1E293B] placeholder:text-gray-400 outline-none"
              />
              {searchQuery ? (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="p-1 rounded-lg text-gray-400 hover:bg-gray-200/60 shrink-0"
                  aria-label="清空"
                >
                  <X size={16} />
                </button>
              ) : null}
            </div>
          ) : (
            <h2 className="text-lg font-bold flex-1 text-center">本月收支</h2>
          )}
          <button
            type="button"
            onClick={searchOpen ? closeSearch : openSearch}
            className={`w-10 h-10 shrink-0 rounded-full flex items-center justify-center ${
              searchOpen ? 'bg-primary/10 text-primary' : 'bg-gray-50 text-gray-400'
            }`}
            aria-label={searchOpen ? '关闭搜索' : '搜索'}
          >
            {searchOpen ? <X size={22} /> : <Search size={20} />}
          </button>
        </div>

        <div className="flex gap-2 overflow-x-auto no-scrollbar pb-2">
          <div className="relative">
            <button
              type="button"
              onClick={() => setOpenDropdown(openDropdown === 'month' ? null : 'month')}
              className="flex items-center gap-1.5 px-4 py-2 bg-gray-50 rounded-full text-xs font-bold text-gray-600 whitespace-nowrap"
            >
              {selectedMonth}{' '}
              <ChevronDown size={14} className={`transition-transform ${openDropdown === 'month' ? 'rotate-180' : ''}`} />
            </button>
            <AnimatePresence>
              {openDropdown === 'month' && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  className="absolute top-full left-0 mt-2 w-36 max-h-64 overflow-y-auto bg-white rounded-2xl shadow-2xl border border-gray-100 p-2 z-60"
                >
                  {monthOptions.map((m) => (
                    <button
                      key={m}
                      type="button"
                      onClick={() => {
                        setSelectedMonth(m);
                        setOpenDropdown(null);
                      }}
                      className={`w-full text-left px-3 py-2 rounded-xl text-xs font-bold ${selectedMonth === m ? 'bg-primary/10 text-primary' : 'text-gray-600'}`}
                    >
                      {m}
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <span className="flex items-center px-4 py-2 bg-gray-50 rounded-full text-xs font-bold text-gray-500 whitespace-nowrap">
            门店 · {storeLabel}
          </span>

          <button
            type="button"
            aria-label={amountSortDir === 'desc' ? '按金额降序，点击切换升序' : '按金额升序，点击切换降序'}
            onClick={() => {
              setOpenDropdown(null);
              setAmountSortDir((d) => (d === 'desc' ? 'asc' : 'desc'));
            }}
            className="flex items-center gap-1.5 px-4 py-2 bg-primary/10 rounded-full text-xs font-black text-primary whitespace-nowrap border border-primary/20 active:scale-[0.98] transition-transform"
          >
            {amountSortDir === 'desc' ? (
              <ArrowDown size={14} strokeWidth={2.5} aria-hidden />
            ) : (
              <ArrowUp size={14} strokeWidth={2.5} aria-hidden />
            )}
            按金额 · {amountSortDir === 'desc' ? '降序' : '升序'}
          </button>
        </div>
      </div>

      <div className="p-6 space-y-8 pb-28">
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-white p-5 rounded-[32px] shadow-sm border border-gray-50">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-6 h-6 rounded-full bg-cyan-custom/10 flex items-center justify-center text-cyan-custom">
                <ArrowDown size={14} />
              </div>
              <p className="text-[10px] text-gray-400 font-bold uppercase">总收入</p>
            </div>
            <h3 className="text-lg font-black text-[#1E293B]">
              {monthPrefix ? `¥ ${fmtMoney(displayIncomeSum)}` : '—'}
            </h3>
          </div>
          <div className="bg-white p-5 rounded-[32px] shadow-sm border border-gray-50">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-6 h-6 rounded-full bg-orange-custom/10 flex items-center justify-center text-orange-custom">
                <ArrowUp size={14} />
              </div>
              <p className="text-[10px] text-gray-400 font-bold uppercase">总支出</p>
            </div>
            <h3 className="text-lg font-black text-[#1E293B]">
              {monthPrefix ? `¥ ${fmtMoney(displayExpenseSum)}` : '—'}
            </h3>
          </div>
        </div>
        {searchQ ? (
          <p className="text-[10px] text-center text-gray-400 font-bold">总收入/总支出为当前搜索结果汇总</p>
        ) : null}

        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="font-black text-[#1E293B]">收支明细</h3>
            <span className="text-[10px] text-gray-400 font-bold">
              共 {visibleRows.length} 笔
              {searchQ && flowRows.length !== visibleRows.length ? ` / 当月 ${flowRows.length} 笔` : ''}
            </span>
          </div>

          {!monthPrefix ? (
            <p className="text-center text-xs text-gray-400 font-bold py-12">月份格式无效</p>
          ) : visibleRows.length === 0 ? (
            <p className="text-center text-xs text-gray-400 font-bold py-12">
              {searchQ ? '未找到名称匹配的收支记录' : '该月暂无收支记录'}
            </p>
          ) : (
            <div className="space-y-3">
              <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest">
                {amountSortDir === 'desc'
                  ? '绝对值从大到小（点击上方可切换升序）'
                  : '绝对值从小到大（点击上方可切换降序）'}
              </p>
              {visibleRows.map((item) => renderFlowCard(item))}
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
};
