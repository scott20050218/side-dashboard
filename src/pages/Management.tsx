import React, { useState, useMemo } from 'react';
import { motion } from 'motion/react';
import { ChevronLeft, Plus, Bell, Activity } from 'lucide-react';
import { View, ManagementItem } from '../types';
import { DateFilter, FilterType } from '../components/DateFilter';

interface ManagementProps {
  setView: (view: View) => void;
  managementList: ManagementItem[];
  setShowAddModal: (view: View | null) => void;
}

export const Management = ({ setView, managementList, setShowAddModal }: ManagementProps) => {
  const [filter, setFilter] = useState<{ type: FilterType; start?: string; end?: string }>({ type: 'day' });

  const filteredList = useMemo(() => {
    const today = new Date('2026-04-04');
    
    return managementList.filter(item => {
      const itemDate = new Date(item.date);
      
      if (filter.type === 'day') {
        return item.date === '2026-04-04';
      } else if (filter.type === 'week') {
        const diffTime = Math.abs(today.getTime() - itemDate.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return diffDays <= 7;
      } else if (filter.type === 'month') {
        return itemDate.getMonth() === today.getMonth() && itemDate.getFullYear() === today.getFullYear();
      } else if (filter.type === 'custom' && filter.start && filter.end) {
        const start = new Date(filter.start);
        const end = new Date(filter.end);
        return itemDate >= start && itemDate <= end;
      }
      return true;
    });
  }, [managementList, filter]);

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
        <h2 className="text-xl font-black tracking-tight text-[#1E293B]">事务管理</h2>
        <button 
          onClick={() => setShowAddModal('management')}
          className="ml-auto w-12 h-12 rounded-2xl bg-primary text-white flex items-center justify-center shadow-lg"
        >
          <Plus size={24} />
        </button>
      </div>

      <DateFilter onFilterChange={handleFilterChange} />
      
      <div className="space-y-4">
        {filteredList.length > 0 ? (
          filteredList.map((item) => (
            <div key={item.id} className="list-item-glass">
              <div className="flex items-center gap-4">
                <div className={`w-12 h-12 rounded-2xl ${item.type === 'approval' ? 'bg-primary/10 text-primary' : 'bg-cyan-custom/10 text-cyan-custom'} flex items-center justify-center`}>
                  {item.type === 'approval' ? <Bell size={20} /> : <Activity size={20} />}
                </div>
                <div>
                  <h4 className="text-sm font-black tracking-tight">{item.title}</h4>
                  <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">{item.type === 'approval' ? '待审批' : '系统通知'}</p>
                </div>
              </div>
              <div className="text-right">
                <span className={`text-[10px] font-black px-2 py-1 rounded-lg ${item.status === '待处理' ? 'bg-orange-custom/10 text-orange-custom' : 'bg-primary/10 text-primary'}`}>
                  {item.status}
                </span>
                <div className="flex flex-col items-end mt-1">
                  <p className="text-[9px] text-gray-400 font-bold uppercase">{item.date}</p>
                  <p className="text-[9px] text-gray-400 font-bold uppercase">{item.time}</p>
                </div>
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
