import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ChevronLeft, 
  ChevronDown, 
  Search, 
  Filter, 
  ArrowUp, 
  ArrowDown, 
  Plus,
  TrendingUp 
} from 'lucide-react';
import { View, Transaction } from '../types';

interface MonthlyFlowProps {
  setView: (view: View) => void;
  selectedMonth: string;
  setSelectedMonth: (month: string) => void;
  selectedAccount: string;
  setSelectedAccount: (account: string) => void;
  selectedSort: string;
  setSelectedSort: (sort: string) => void;
  openDropdown: 'month' | 'account' | 'sort' | null;
  setOpenDropdown: (dropdown: 'month' | 'account' | 'sort' | null) => void;
  incomeList: Transaction[];
  expenseList: Transaction[];
}

export const MonthlyFlow = ({
  setView,
  selectedMonth,
  setSelectedMonth,
  selectedAccount,
  setSelectedAccount,
  selectedSort,
  setSelectedSort,
  openDropdown,
  setOpenDropdown,
  incomeList,
  expenseList
}: MonthlyFlowProps) => {
  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="min-h-screen bg-[#F8FAFC]"
    >
      {/* Header */}
      <div className="bg-white px-6 pt-12 pb-6 sticky top-0 z-50 shadow-sm">
        <div className="flex items-center justify-between mb-6">
          <button onClick={() => setView('home')} className="w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center text-gray-400">
            <ChevronLeft size={24} />
          </button>
          <h2 className="text-lg font-bold">本月收支</h2>
          <button className="w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center text-gray-400">
            <Search size={20} />
          </button>
        </div>

        {/* Filter Bar */}
        <div className="flex gap-2 overflow-x-auto no-scrollbar pb-2">
          {/* Month Filter */}
          <div className="relative">
            <button 
              onClick={() => setOpenDropdown(openDropdown === 'month' ? null : 'month')}
              className="flex items-center gap-1.5 px-4 py-2 bg-gray-50 rounded-full text-xs font-bold text-gray-600 whitespace-nowrap"
            >
              {selectedMonth} <ChevronDown size={14} className={`transition-transform ${openDropdown === 'month' ? 'rotate-180' : ''}`} />
            </button>
            <AnimatePresence>
              {openDropdown === 'month' && (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  className="absolute top-full left-0 mt-2 w-32 bg-white rounded-2xl shadow-2xl border border-gray-100 p-2 z-[60]"
                >
                  {['2026.04', '2026.03', '2026.02'].map(m => (
                    <button 
                      key={m}
                      onClick={() => { setSelectedMonth(m); setOpenDropdown(null); }}
                      className={`w-full text-left px-3 py-2 rounded-xl text-xs font-bold ${selectedMonth === m ? 'bg-primary/10 text-primary' : 'text-gray-600'}`}
                    >
                      {m}
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Account Filter */}
          <div className="relative">
            <button 
              onClick={() => setOpenDropdown(openDropdown === 'account' ? null : 'account')}
              className="flex items-center gap-1.5 px-4 py-2 bg-gray-50 rounded-full text-xs font-bold text-gray-600 whitespace-nowrap"
            >
              {selectedAccount} <ChevronDown size={14} className={`transition-transform ${openDropdown === 'account' ? 'rotate-180' : ''}`} />
            </button>
            <AnimatePresence>
              {openDropdown === 'account' && (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  className="absolute top-full left-0 mt-2 w-40 bg-white rounded-2xl shadow-2xl border border-gray-100 p-2 z-[60]"
                >
                  {['小店账户', '个人账户', '备用金'].map(a => (
                    <button 
                      key={a}
                      onClick={() => { setSelectedAccount(a); setOpenDropdown(null); }}
                      className={`w-full text-left px-3 py-2 rounded-xl text-xs font-bold ${selectedAccount === a ? 'bg-primary/10 text-primary' : 'text-gray-600'}`}
                    >
                      {a}
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Sort Filter */}
          <div className="relative">
            <button 
              onClick={() => setOpenDropdown(openDropdown === 'sort' ? null : 'sort')}
              className="flex items-center gap-1.5 px-4 py-2 bg-gray-50 rounded-full text-xs font-bold text-gray-600 whitespace-nowrap"
            >
              {selectedSort} <Filter size={14} className={`transition-transform ${openDropdown === 'sort' ? 'rotate-180' : ''}`} />
            </button>
            <AnimatePresence>
              {openDropdown === 'sort' && (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  className="absolute top-full left-0 mt-2 w-32 bg-white rounded-2xl shadow-2xl border border-gray-100 p-2 z-[60]"
                >
                  {['按金额', '按时间', '按类型'].map(s => (
                    <button 
                      key={s}
                      onClick={() => { setSelectedSort(s); setOpenDropdown(null); }}
                      className={`w-full text-left px-3 py-2 rounded-xl text-xs font-bold ${selectedSort === s ? 'bg-primary/10 text-primary' : 'text-gray-600'}`}
                    >
                      {s}
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-6 space-y-8">
        {/* Summary Stats */}
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-white p-5 rounded-[32px] shadow-sm border border-gray-50">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-6 h-6 rounded-full bg-cyan-custom/10 flex items-center justify-center text-cyan-custom">
                <ArrowDown size={14} />
              </div>
              <p className="text-[10px] text-gray-400 font-bold uppercase">总收入</p>
            </div>
            <h3 className="text-lg font-black text-[#1E293B]">¥ 45,890.00</h3>
          </div>
          <div className="bg-white p-5 rounded-[32px] shadow-sm border border-gray-50">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-6 h-6 rounded-full bg-orange-custom/10 flex items-center justify-center text-orange-custom">
                <ArrowUp size={14} />
              </div>
              <p className="text-[10px] text-gray-400 font-bold uppercase">总支出</p>
            </div>
            <h3 className="text-lg font-black text-[#1E293B]">¥ 28,450.00</h3>
          </div>
        </div>

        {/* Transaction List */}
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="font-black text-[#1E293B]">收支明细</h3>
            <span className="text-[10px] text-gray-400 font-bold">共 24 笔</span>
          </div>

          <div className="space-y-4">
            {/* Group by Date */}
            <div className="space-y-3">
              <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest">今天 · 4月4日</p>
              {incomeList.map(item => (
                <div key={item.id} className="bg-white p-4 rounded-3xl shadow-sm border border-gray-50 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-xl ${item.color} flex items-center justify-center text-cyan-custom`}>
                      {item.icon}
                    </div>
                    <div>
                      <p className="text-sm font-black">{item.title}</p>
                      <p className="text-[10px] text-gray-400">{item.subtitle}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-black text-cyan-custom">+¥ {item.amount.toFixed(2)}</p>
                    <p className="text-[10px] text-gray-300">余额: 17,643.91</p>
                  </div>
                </div>
              ))}
              {expenseList.map(item => (
                <div key={item.id} className="bg-white p-4 rounded-3xl shadow-sm border border-gray-50 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-xl ${item.color} flex items-center justify-center text-orange-custom`}>
                      {item.icon}
                    </div>
                    <div>
                      <p className="text-sm font-black">{item.title}</p>
                      <p className="text-[10px] text-gray-400">{item.subtitle}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-black text-orange-custom">¥ {item.amount.toFixed(2)}</p>
                    <p className="text-[10px] text-gray-300">余额: 16,843.91</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="space-y-3">
              <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest">昨天 · 4月3日</p>
              <div className="bg-white p-4 rounded-3xl shadow-sm border border-gray-50 flex items-center justify-between opacity-60">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-cyan-custom/10 flex items-center justify-center text-cyan-custom">
                    <TrendingUp size={20} />
                  </div>
                  <div>
                    <p className="text-sm font-black">销售收入</p>
                    <p className="text-[10px] text-gray-400">线上订单</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-black text-cyan-custom">+¥ 440.45</p>
                  <p className="text-[10px] text-gray-300">余额: 16,443.91</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Action Button */}
      <div className="fixed bottom-10 right-6">
        <motion.button 
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          className="w-14 h-14 bg-primary text-white rounded-full flex items-center justify-center shadow-2xl"
        >
          <Plus size={28} />
        </motion.button>
      </div>
    </motion.div>
  );
};
