import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { View } from '../types';

interface AddRecordModalProps {
  showAddModal: View | null;
  setShowAddModal: (view: View | null) => void;
  newRecord: { title: string; amount: string; subtitle: string; date: string };
  setNewRecord: (record: { title: string; amount: string; subtitle: string; date: string }) => void;
  handleAddRecord: () => void;
}

export const AddRecordModal = ({
  showAddModal,
  setShowAddModal,
  newRecord,
  setNewRecord,
  handleAddRecord
}: AddRecordModalProps) => {
  return (
    <AnimatePresence>
      {showAddModal && (
        <div className="fixed inset-0 z-[100] flex items-end justify-center sm:items-center p-4">
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowAddModal(null)}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          />
          <motion.div
            initial={{ opacity: 0, y: 100 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 100 }}
            className="relative w-full max-w-md bg-white rounded-[40px] p-8 shadow-2xl overflow-hidden"
          >
            <h3 className="text-2xl font-black mb-6 text-[#1E293B]">
              {showAddModal === 'income' ? '添加收入记录' : showAddModal === 'expense' ? '添加支出记录' : '添加事务记录'}
            </h3>
            
            <div className="space-y-4">
              <div>
                <label className="text-xs font-black text-gray-400 uppercase tracking-widest mb-2 block">项目名称</label>
                <input 
                  type="text" 
                  value={newRecord.title}
                  onChange={(e) => setNewRecord({ ...newRecord, title: e.target.value })}
                  placeholder="例如：销售收入、进货支出..."
                  className="w-full bg-gray-50 border-none rounded-2xl p-4 text-sm font-bold focus:ring-2 focus:ring-primary transition-all"
                />
              </div>
              
              <div className="flex gap-4">
                {showAddModal !== 'management' && (
                  <div className="flex-1">
                    <label className="text-xs font-black text-gray-400 uppercase tracking-widest mb-2 block">金额</label>
                    <input 
                      type="number" 
                      value={newRecord.amount}
                      onChange={(e) => setNewRecord({ ...newRecord, amount: e.target.value })}
                      placeholder="0.00"
                      className="w-full bg-gray-50 border-none rounded-2xl p-4 text-sm font-bold focus:ring-2 focus:ring-primary transition-all"
                    />
                  </div>
                )}
                <div className="flex-1">
                  <label className="text-xs font-black text-gray-400 uppercase tracking-widest mb-2 block">日期</label>
                  <input 
                    type="date" 
                    value={newRecord.date}
                    onChange={(e) => setNewRecord({ ...newRecord, date: e.target.value })}
                    className="w-full bg-gray-50 border-none rounded-2xl p-4 text-sm font-bold focus:ring-2 focus:ring-primary transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-black text-gray-400 uppercase tracking-widest mb-2 block">备注 / 详情</label>
                <input 
                  type="text" 
                  value={newRecord.subtitle}
                  onChange={(e) => setNewRecord({ ...newRecord, subtitle: e.target.value })}
                  placeholder="可选备注信息"
                  className="w-full bg-gray-50 border-none rounded-2xl p-4 text-sm font-bold focus:ring-2 focus:ring-primary transition-all"
                />
              </div>
            </div>

            <div className="mt-8 flex gap-4">
              <button 
                onClick={() => setShowAddModal(null)}
                className="flex-1 py-4 rounded-2xl font-black text-gray-400 hover:bg-gray-50 transition-all"
              >
                取消
              </button>
              <button 
                onClick={handleAddRecord}
                className="flex-1 py-4 bg-primary text-white rounded-2xl font-black shadow-lg glow-purple transition-all active:scale-95"
              >
                确定添加
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
