import React, { useState, useMemo } from 'react';
import { motion } from 'motion/react';
import { ChevronLeft, Plus } from 'lucide-react';
import { View, Transaction } from '../types';
import { DateFilter, FilterType } from '../components/DateFilter';
import { filterByDateFilter } from '../lib/transactionDateFilter';

interface IncomeDetailProps {
  setView: (view: View) => void;
  incomeList: Transaction[];
  setShowAddModal: (view: View | null) => void;
  canCreate?: boolean;
  onRequestAmend?: (item: Transaction) => void;
}

export const IncomeDetail = ({
  setView,
  incomeList,
  setShowAddModal,
  canCreate = true,
  onRequestAmend,
}: IncomeDetailProps) => {
  const [filter, setFilter] = useState<{ type: FilterType; start?: string; end?: string }>({ type: 'day' });

  const filteredList = useMemo(
    () => filterByDateFilter(incomeList, filter),
    [incomeList, filter],
  );

  const handleFilterChange = (type: FilterType, start?: string, end?: string) => {
    setFilter({ type, start, end });
  };

  return (
    <motion.div 
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      className="px-6 pt-12 pb-36"
    >
      <div className="flex items-center gap-4 mb-10">
        <button onClick={() => setView('home')} className="w-12 h-12 rounded-2xl bg-white flex items-center justify-center text-gray-400 border border-gray-100 shadow-sm">
          <ChevronLeft size={24} />
        </button>
        <h2 className="text-xl font-black tracking-tight text-[#1E293B]">收入管理</h2>
        {canCreate ? (
          <button
            type="button"
            onClick={() => setShowAddModal('income')}
            className="ml-auto w-12 h-12 rounded-2xl bg-primary text-white flex items-center justify-center shadow-lg glow-purple"
          >
            <Plus size={24} />
          </button>
        ) : null}
      </div>

      <DateFilter onFilterChange={handleFilterChange} />
      
      <div className="space-y-4">
        {filteredList.length > 0 ? (
          filteredList.map((item) => (
            <div key={item.id} className="list-item-glass">
              <div className="flex items-center gap-4">
                <div className={`w-12 h-12 rounded-2xl ${item.color} flex items-center justify-center text-cyan-custom`}>
                  {item.icon}
                </div>
                <div>
                  <h4 className="text-sm font-black tracking-tight">{item.title}</h4>
                  <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">{item.subtitle}</p>
                </div>
              </div>
              <div className="text-right flex flex-col items-end gap-1">
                <p className="text-sm font-black text-cyan-custom">+ {item.amount.toFixed(2)}</p>
                <div className="flex flex-col items-end">
                  <p className="text-[9px] text-gray-400 font-bold uppercase">{item.date}</p>
                  <p className="text-[9px] text-gray-400 font-bold uppercase">{item.time}</p>
                </div>
                {onRequestAmend ? (
                  <button
                    type="button"
                    onClick={() => onRequestAmend(item)}
                    className="text-[10px] font-black text-primary underline"
                  >
                    申请修改
                  </button>
                ) : null}
              </div>
            </div>
          ))
        ) : (
          <div className="text-center py-20">
            <p className="text-xs text-gray-400 font-black uppercase tracking-widest">暂无相关记录</p>
          </div>
        )}
      </div>
    </motion.div>
  );
};
