import React, { useState } from 'react';
import { Calendar } from 'lucide-react';

export type FilterType = 'day' | 'week' | 'month' | 'custom';

interface DateFilterProps {
  onFilterChange: (type: FilterType, startDate?: string, endDate?: string) => void;
}

export const DateFilter = ({ onFilterChange }: DateFilterProps) => {
  const [activeTab, setActiveTab] = useState<FilterType>('day');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const handleTabClick = (tab: FilterType) => {
    setActiveTab(tab);
    if (tab !== 'custom') {
      onFilterChange(tab);
    }
  };

  const handleCustomSubmit = () => {
    if (startDate && endDate) {
      onFilterChange('custom', startDate, endDate);
    }
  };

  return (
    <div className="mb-8">
      <div className="flex bg-white rounded-2xl p-1 shadow-sm border border-gray-50 mb-4">
        {(['day', 'week', 'month', 'custom'] as FilterType[]).map((tab) => (
          <button
            key={tab}
            onClick={() => handleTabClick(tab)}
            className={`flex-1 py-2 text-xs font-black rounded-xl transition-all ${
              activeTab === tab 
                ? 'bg-primary text-white shadow-lg' 
                : 'text-gray-400 hover:bg-gray-50'
            }`}
          >
            {tab === 'day' && '天'}
            {tab === 'week' && '周'}
            {tab === 'month' && '月'}
            {tab === 'custom' && '自定义'}
          </button>
        ))}
      </div>

      {activeTab === 'custom' && (
        <div className="bg-white p-4 rounded-[24px] shadow-sm border border-gray-50 flex flex-col gap-3">
          <div className="flex items-center gap-3">
            <div className="flex-1">
              <p className="text-[10px] text-gray-400 font-bold uppercase mb-1 ml-1">起始时间</p>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full bg-gray-50 border-none rounded-xl px-3 py-2 text-xs font-bold focus:ring-2 focus:ring-primary"
              />
            </div>
            <div className="flex-1">
              <p className="text-[10px] text-gray-400 font-bold uppercase mb-1 ml-1">结束时间</p>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full bg-gray-50 border-none rounded-xl px-3 py-2 text-xs font-bold focus:ring-2 focus:ring-primary"
              />
            </div>
          </div>
          <button
            onClick={handleCustomSubmit}
            className="w-full bg-primary/10 text-primary py-2 rounded-xl text-xs font-black hover:bg-primary/20 transition-all flex items-center justify-center gap-2"
          >
            <Calendar size={14} />
            应用筛选
          </button>
        </div>
      )}
    </div>
  );
};
