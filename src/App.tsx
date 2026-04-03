/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { 
  Home, 
  BarChart2, 
  CreditCard, 
  User, 
  Plus, 
  ArrowDownLeft, 
  ArrowUpRight, 
  Repeat, 
  ChevronRight, 
  Apple, 
  ShoppingCart, 
  Coffee,
  Scan,
  Zap,
  MoreHorizontal,
  ChevronLeft,
  Search,
  Bell,
  TrendingUp,
  Wallet,
  ArrowRight,
  Activity
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

// --- Types ---
type View = 'home' | 'income' | 'expense' | 'management';

interface Transaction {
  id: string;
  title: string;
  subtitle: string;
  amount: number;
  time: string;
  icon: React.ReactNode;
  isPositive: boolean;
  color: string;
}

interface ManagementItem {
  id: string;
  title: string;
  status: string;
  time: string;
  type: 'notification' | 'approval';
}

// --- Mock Data ---
const MOCK_INCOME: Transaction[] = [
  { id: 'i1', title: '销售收入', subtitle: '线上订单', amount: 1200.00, time: '10:30 AM', icon: <TrendingUp size={20} />, isPositive: true, color: 'bg-green-100' },
  { id: 'i2', title: '服务费', subtitle: '咨询服务', amount: 500.00, time: '09:15 AM', icon: <Zap size={20} />, isPositive: true, color: 'bg-blue-100' },
];

const MOCK_EXPENSE: Transaction[] = [
  { id: 'e1', title: '进货支出', subtitle: '原材料采购', amount: -800.00, time: '11:00 AM', icon: <ShoppingCart size={20} />, isPositive: false, color: 'bg-orange-100' },
  { id: 'e2', title: '房租缴纳', subtitle: '4月房租', amount: -3000.00, time: '昨天', icon: <Home size={20} />, isPositive: false, color: 'bg-red-100' },
];

const MOCK_MANAGEMENT: ManagementItem[] = [
  { id: 'm1', title: '库存预警：原材料不足', status: '待处理', time: '10:00 AM', type: 'notification' },
  { id: 'm2', title: '采购申请：办公用品', status: '待审批', time: '09:00 AM', type: 'approval' },
];

const ADS = [
  { id: 1, title: '专业法律顾问', subtitle: '为您的事业保驾护航', color: 'from-blue-500 to-indigo-600' },
  { id: 2, title: '资深财务专家', subtitle: '精准理财，合规节税', color: 'from-purple-500 to-pink-600' },
];

// --- Components ---

const AdBanner = () => {
  const [current, setCurrent] = useState(0);
  
  React.useEffect(() => {
    const timer = setInterval(() => {
      setCurrent((prev) => (prev + 1) % ADS.length);
    }, 4000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="relative h-40 w-full overflow-hidden rounded-[32px] mb-8 shadow-xl float-slow">
      <AnimatePresence mode="wait">
        <motion.div
          key={ADS[current].id}
          initial={{ opacity: 0, x: 50 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -50 }}
          className={`absolute inset-0 bg-gradient-to-br ${ADS[current].color} p-8 flex flex-col justify-center text-white`}
        >
          <h3 className="text-xl font-black mb-2">{ADS[current].title}</h3>
          <p className="text-sm opacity-80 font-bold">{ADS[current].subtitle}</p>
          <button className="mt-4 px-4 py-1.5 bg-white/20 backdrop-blur-md rounded-full text-[10px] font-black uppercase tracking-widest w-fit border border-white/30">
            立即咨询
          </button>
        </motion.div>
      </AnimatePresence>
      <div className="absolute bottom-4 right-8 flex gap-1.5">
        {ADS.map((_, idx) => (
          <div key={idx} className={`w-1.5 h-1.5 rounded-full transition-all ${idx === current ? 'bg-white w-4' : 'bg-white/40'}`} />
        ))}
      </div>
    </div>
  );
};

export default function App() {
  const [view, setView] = useState<View>('home');

  const renderContent = () => {
    switch (view) {
      case 'home':
        return (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="px-6 pt-12 pb-36"
          >
            {/* Dynamic Header */}
            <div className="flex justify-between items-center mb-10">
              <div>
                <motion.p 
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="text-xs text-indigo-500 font-black uppercase tracking-widest mb-1"
                >
                  欢迎回来，
                </motion.p>
                <h1 className="text-2xl font-black text-[#1E293B] tracking-tight">李詹姆斯的店</h1>
              </div>
              <div className="relative group">
                <div className="w-14 h-14 rounded-2xl overflow-hidden border-2 border-white shadow-2xl glow-purple">
                  <img src="https://i.pravatar.cc/150?u=james" alt="profile" referrerPolicy="no-referrer" />
                </div>
                <motion.div 
                  animate={{ y: [0, -5, 0] }}
                  transition={{ repeat: Infinity, duration: 2 }}
                  className="absolute -top-2 -right-2 bg-gradient-to-r from-yellow-400 to-orange-500 text-[10px] font-black px-2 py-1 rounded-lg border-2 border-white shadow-lg"
                >
                  专业版
                </motion.div>
              </div>
            </div>

            {/* Ad Banner */}
            <AdBanner />

            {/* Main Action Buttons */}
            <div className="grid grid-cols-1 gap-5 mb-12">
              <motion.button 
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setView('income')}
                className="flex items-center justify-between p-6 bg-white rounded-[32px] shadow-xl border border-gray-50 group transition-all"
              >
                <div className="flex items-center gap-5">
                  <div className="w-16 h-16 rounded-3xl bg-green-50 flex items-center justify-center text-green-600 group-hover:bg-green-600 group-hover:text-white transition-all duration-300 shadow-inner">
                    <TrendingUp size={32} />
                  </div>
                  <div className="text-left">
                    <h3 className="text-xl font-black text-[#1E293B]">收入管理</h3>
                    <p className="text-sm text-gray-400 font-bold">查看今日收入明细</p>
                  </div>
                </div>
                <div className="w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center group-hover:bg-indigo-50 transition-colors">
                  <ChevronRight size={20} className="text-gray-300 group-hover:text-indigo-500" />
                </div>
              </motion.button>

              <motion.button 
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setView('expense')}
                className="flex items-center justify-between p-6 bg-white rounded-[32px] shadow-xl border border-gray-50 group transition-all"
              >
                <div className="flex items-center gap-5">
                  <div className="w-16 h-16 rounded-3xl bg-orange-50 flex items-center justify-center text-orange-600 group-hover:bg-orange-600 group-hover:text-white transition-all duration-300 shadow-inner">
                    <ArrowUpRight size={32} />
                  </div>
                  <div className="text-left">
                    <h3 className="text-xl font-black text-[#1E293B]">支出管理</h3>
                    <p className="text-sm text-gray-400 font-bold">查看今日支出明细</p>
                  </div>
                </div>
                <div className="w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center group-hover:bg-indigo-50 transition-colors">
                  <ChevronRight size={20} className="text-gray-300 group-hover:text-indigo-500" />
                </div>
              </motion.button>

              <motion.button 
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setView('management')}
                className="flex items-center justify-between p-6 bg-white rounded-[32px] shadow-xl border border-gray-50 group transition-all"
              >
                <div className="flex items-center gap-5">
                  <div className="w-16 h-16 rounded-3xl bg-purple-50 flex items-center justify-center text-purple-600 group-hover:bg-purple-600 group-hover:text-white transition-all duration-300 shadow-inner">
                    <Activity size={32} />
                  </div>
                  <div className="text-left">
                    <h3 className="text-xl font-black text-[#1E293B]">事务管理</h3>
                    <p className="text-sm text-gray-400 font-bold">通知与审批信息</p>
                  </div>
                </div>
                <div className="w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center group-hover:bg-indigo-50 transition-colors">
                  <ChevronRight size={20} className="text-gray-300 group-hover:text-indigo-500" />
                </div>
              </motion.button>
            </div>
          </motion.div>
        );

      case 'income':
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
              <h2 className="text-xl font-black tracking-tight text-[#1E293B]">今日收入明细</h2>
            </div>
            
            <div className="space-y-4">
              {MOCK_INCOME.map((item) => (
                <div key={item.id} className="list-item-glass">
                  <div className="flex items-center gap-4">
                    <div className={`w-12 h-12 rounded-2xl ${item.color} flex items-center justify-center text-green-600`}>
                      {item.icon}
                    </div>
                    <div>
                      <h4 className="text-sm font-black tracking-tight">{item.title}</h4>
                      <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">{item.subtitle}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-black text-green-500">+ {item.amount.toFixed(2)}</p>
                    <p className="text-[9px] text-gray-400 font-bold uppercase">{item.time}</p>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        );

      case 'expense':
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
              <h2 className="text-xl font-black tracking-tight text-[#1E293B]">今日支出明细</h2>
            </div>
            
            <div className="space-y-4">
              {MOCK_EXPENSE.map((item) => (
                <div key={item.id} className="list-item-glass">
                  <div className="flex items-center gap-4">
                    <div className={`w-12 h-12 rounded-2xl ${item.color} flex items-center justify-center text-orange-600`}>
                      {item.icon}
                    </div>
                    <div>
                      <h4 className="text-sm font-black tracking-tight">{item.title}</h4>
                      <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">{item.subtitle}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-black text-[#1E293B]">{item.amount.toFixed(2)}</p>
                    <p className="text-[9px] text-gray-400 font-bold uppercase">{item.time}</p>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        );

      case 'management':
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
              <h2 className="text-xl font-black tracking-tight text-[#1E293B]">日常事务管理</h2>
            </div>
            
            <div className="space-y-4">
              {MOCK_MANAGEMENT.map((item) => (
                <div key={item.id} className="list-item-glass">
                  <div className="flex items-center gap-4">
                    <div className={`w-12 h-12 rounded-2xl ${item.type === 'approval' ? 'bg-purple-100 text-purple-600' : 'bg-blue-100 text-blue-600'} flex items-center justify-center`}>
                      {item.type === 'approval' ? <Bell size={20} /> : <Activity size={20} />}
                    </div>
                    <div>
                      <h4 className="text-sm font-black tracking-tight">{item.title}</h4>
                      <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">{item.type === 'approval' ? '待审批' : '系统通知'}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className={`text-[10px] font-black px-2 py-1 rounded-lg ${item.status === '待处理' ? 'bg-orange-100 text-orange-600' : 'bg-indigo-100 text-indigo-600'}`}>
                      {item.status}
                    </span>
                    <p className="text-[9px] text-gray-400 font-bold uppercase mt-1">{item.time}</p>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        );

      default:
        return <div className="flex items-center justify-center min-h-screen text-gray-400 font-black uppercase tracking-widest">敬请期待</div>;
    }
  };

  return (
    <div className="max-w-md mx-auto min-h-screen bg-[#F8FAFC] font-sans text-[#1E293B] selection:bg-indigo-500/30">
      <AnimatePresence mode="wait">
        {renderContent()}
      </AnimatePresence>
      
      {/* Futuristic Bottom Nav */}
      <div className="fixed bottom-0 left-0 right-0 max-w-md mx-auto px-6 pb-10 pointer-events-none">
        <div className="nav-blur rounded-[32px] shadow-[0_25px_50px_-12px_rgba(0,0,0,0.1)] px-8 py-5 flex justify-between items-center pointer-events-auto">
          <button onClick={() => setView('home')} className={`flex flex-col items-center gap-1.5 transition-all duration-300 ${view === 'home' ? 'text-indigo-500 scale-110' : 'text-gray-400'}`}>
            <Home size={24} strokeWidth={view === 'home' ? 2.5 : 2} />
            {view === 'home' && <motion.div layoutId="nav-dot" className="w-1 h-1 rounded-full bg-indigo-500" />}
          </button>
          <button onClick={() => setView('stats')} className={`flex flex-col items-center gap-1.5 transition-all duration-300 ${view === 'stats' ? 'text-indigo-500 scale-110' : 'text-gray-400'}`}>
            <BarChart2 size={24} strokeWidth={view === 'stats' ? 2.5 : 2} />
            {view === 'stats' && <motion.div layoutId="nav-dot" className="w-1 h-1 rounded-full bg-indigo-500" />}
          </button>
          
          {/* Central Scan FAB */}
          <div className="relative -mt-16">
            <motion.button 
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              className="w-16 h-16 rounded-[24px] bg-gradient-to-br from-[#6366F1] to-[#8B5CF6] flex items-center justify-center text-white shadow-2xl shadow-indigo-500/30 border border-white/20"
            >
              <Scan size={28} strokeWidth={3} />
            </motion.button>
          </div>

          <button className="flex flex-col items-center gap-1.5 text-gray-400">
            <CreditCard size={24} />
          </button>
          <button className="flex flex-col items-center gap-1.5 text-gray-400">
            <User size={24} />
          </button>
        </div>
      </div>
    </div>
  );
}
