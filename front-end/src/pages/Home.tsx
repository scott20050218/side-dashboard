import React from 'react';
import { motion } from 'motion/react';
import { 
  Eye, 
  ChevronRight, 
  TrendingUp, 
  ShoppingCart, 
  Activity,
  LogOut,
  Users,
  ShieldCheck 
} from 'lucide-react';
import { AdBanner } from '../components/AdBanner';
import { View } from '../types';

interface HomeProps {
  setView: (view: View) => void;
  onLogout: () => void;
}

export const Home = ({ setView, onLogout }: HomeProps) => {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="px-6 pt-12 pb-36"
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-10">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-3xl font-black tracking-tighter text-[#1E293B]">下午好,</h1>
            <button 
              onClick={onLogout}
              className="p-2 text-gray-300 hover:text-red-500 transition-colors"
              title="退出登录"
            >
              <LogOut size={18} />
            </button>
          </div>
          <p className="text-gray-400 font-bold uppercase tracking-widest text-[10px] mt-1">
            2026年4月4日 · 星期六
          </p>
        </div>
        <div className="relative">
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
          <motion.div 
            animate={{ scale: [1, 1.2, 1] }}
            transition={{ repeat: Infinity, duration: 2 }}
            className="absolute -top-2 -right-2 bg-gradient-to-r from-yellow-custom to-orange-custom text-[10px] font-black px-2 py-1 rounded-lg border-2 border-white shadow-lg"
          >
            专业版
          </motion.div>
        </div>
      </div>

      {/* Ad Banner */}
      <AdBanner />

      {/* Account Overview & Monthly Flow Cards */}
      <div className="space-y-4 mb-8">
        {/* Account Overview Card */}
        <motion.button 
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
              <p className="text-xs text-gray-400 font-bold mb-2">本月营收</p>
              <div className="flex items-baseline gap-2">
                <h4 className="text-2xl font-black text-[#1E293B]">¥ 45,890.00</h4>
                <button 
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
              <p className="text-xs text-gray-400 font-bold mb-2">经营支出</p>
              <h4 className="text-xl font-black text-orange-custom">28,450.00</h4>
            </div>
          </div>
          <div className="pt-4 border-t border-gray-50 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-orange-custom" />
              <p className="text-xs text-gray-500 font-bold">库存预警：猪肉库存不足</p>
            </div>
            <ChevronRight size={14} className="text-gray-300" />
          </div>
        </motion.button>

        {/* Monthly Flow Card */}
        <motion.button 
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
                <p className="text-xs text-gray-400 font-bold mb-1 uppercase tracking-wider">今日收入</p>
                <h4 className="text-xl font-black text-[#1E293B]">¥ 1,700.00</h4>
              </div>
            </div>
            <ChevronRight size={20} className="text-gray-300" />
          </div>
        </motion.button>
      </div>

      {/* Quick Actions Grid */}
      <div className="grid grid-cols-1 gap-4">
        <motion.button 
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
            <p className="text-xs text-gray-400 font-bold">查看今日收入明细</p>
          </div>
          <ChevronRight size={20} className="text-gray-300" />
        </motion.button>

        <motion.button 
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
            <p className="text-xs text-gray-400 font-bold">查看今日支出明细</p>
          </div>
          <ChevronRight size={20} className="text-gray-300" />
        </motion.button>

        <motion.button 
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
      </div>
    </motion.div>
  );
};
