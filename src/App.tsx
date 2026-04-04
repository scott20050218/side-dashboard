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
  ChevronDown,
  MoreVertical,
  Info,
  Search,
  Bell,
  TrendingUp,
  Wallet,
  ArrowRight,
  Activity,
  Eye,
  ArrowDown
} from 'lucide-react';
import { 
  BarChart,
  Bar,
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { motion, AnimatePresence } from 'motion/react';

// --- Types ---
type View = 'home' | 'income' | 'expense' | 'management' | 'account_detail' | 'monthly_flow' | 'report';

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
  const [activeCard, setActiveCard] = useState<'assets' | 'repayment'>('assets');
  
  // Monthly Flow Filters
  const [selectedMonth, setSelectedMonth] = useState('2026.04');
  const [selectedAccount, setSelectedAccount] = useState('小店账户');
  const [selectedSort, setSelectedSort] = useState('按金额');
  const [openDropdown, setOpenDropdown] = useState<'month' | 'account' | 'sort' | null>(null);

  // Data Lists State
  const [incomeList, setIncomeList] = useState<Transaction[]>(MOCK_INCOME);
  const [expenseList, setExpenseList] = useState<Transaction[]>(MOCK_EXPENSE);
  const [managementList, setManagementList] = useState<ManagementItem[]>(MOCK_MANAGEMENT);

  // Add Record Modal State
  const [showAddModal, setShowAddModal] = useState<View | null>(null);
  const [newRecord, setNewRecord] = useState({ title: '', amount: '', subtitle: '' });

  const handleAddRecord = () => {
    if (!newRecord.title) return;

    if (showAddModal === 'income') {
      const item: Transaction = {
        id: Date.now().toString(),
        title: newRecord.title,
        subtitle: newRecord.subtitle || '新增收入',
        amount: parseFloat(newRecord.amount) || 0,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        icon: <TrendingUp size={20} />,
        isPositive: true,
        color: 'bg-green-100'
      };
      setIncomeList([item, ...incomeList]);
    } else if (showAddModal === 'expense') {
      const item: Transaction = {
        id: Date.now().toString(),
        title: newRecord.title,
        subtitle: newRecord.subtitle || '新增支出',
        amount: -(parseFloat(newRecord.amount) || 0),
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        icon: <ShoppingCart size={20} />,
        isPositive: false,
        color: 'bg-orange-100'
      };
      setExpenseList([item, ...expenseList]);
    } else if (showAddModal === 'management') {
      const item: ManagementItem = {
        id: Date.now().toString(),
        title: newRecord.title,
        status: '待处理',
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        type: 'notification'
      };
      setManagementList([item, ...managementList]);
    }

    setShowAddModal(null);
    setNewRecord({ title: '', amount: '', subtitle: '' });
  };

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
                        className="text-[10px] text-indigo-500 font-bold hover:underline"
                      >
                        查看报表
                      </button>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-gray-400 font-bold mb-2">经营支出</p>
                    <h4 className="text-xl font-black text-orange-500">28,450.00</h4>
                  </div>
                </div>
                <div className="pt-4 border-t border-gray-50 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-red-500" />
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
                <div className="flex justify-between items-end mb-4">
                  <div>
                    <p className="text-xs text-gray-400 font-bold mb-2">支出</p>
                    <h4 className="text-xl font-black text-[#1E293B]">¥ 28,450.00</h4>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-gray-400 font-bold mb-2">收入</p>
                    <h4 className="text-xl font-black text-[#1E293B]">¥ 45,890.00</h4>
                  </div>
                </div>
                {/* Progress Bar */}
                <div className="h-1 w-full flex gap-1 mb-6">
                  <div className="h-full bg-orange-400 rounded-full" style={{ width: '62%' }} />
                  <div className="h-full bg-indigo-400 rounded-full" style={{ width: '38%' }} />
                </div>
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-gradient-to-tr from-cyan-300 via-blue-400 to-purple-500 flex items-center justify-center relative overflow-hidden">
                      <div className="absolute top-1 left-1.5 w-1 h-1 bg-black/20 rounded-full" />
                      <div className="absolute top-1 right-1.5 w-1 h-1 bg-black/20 rounded-full" />
                    </div>
                    <p className="text-xs text-gray-500 font-bold">3月结余 ¥ 12,440.00</p>
                  </div>
                  <div className="text-xs text-indigo-500 font-black flex items-center gap-1">
                    查看 <ChevronRight size={14} />
                  </div>
                </div>
              </motion.button>
            </div>

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

      case 'monthly_flow':
        return (
          <motion.div 
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            className="min-h-screen bg-white"
          >
            {/* Header */}
            <div className="px-6 pt-12 pb-4 flex items-center justify-between sticky top-0 bg-white z-10">
              <button onClick={() => setView('home')}>
                <ChevronLeft size={24} />
              </button>
              <h2 className="text-lg font-bold">收支</h2>
              <div className="flex items-center gap-4">
                <Search size={24} />
                <MoreHorizontal size={24} />
              </div>
            </div>

            {/* Filter Bar */}
            <div className="px-6 py-2 flex items-center justify-between border-b border-gray-50 relative">
              <div className="flex items-center gap-4 text-sm font-medium">
                <button 
                  onClick={() => setOpenDropdown(openDropdown === 'month' ? null : 'month')}
                  className={`flex items-center gap-1 transition-colors ${openDropdown === 'month' ? 'text-indigo-500' : ''}`}
                >
                  <span>{selectedMonth}</span>
                  <ChevronDown size={14} className={`transition-transform duration-300 ${openDropdown === 'month' ? 'rotate-180' : ''}`} />
                </button>
                <button 
                  onClick={() => setOpenDropdown(openDropdown === 'account' ? null : 'account')}
                  className={`flex items-center gap-1 transition-colors ${openDropdown === 'account' ? 'text-indigo-500' : ''}`}
                >
                  <span>{selectedAccount}</span>
                  <ChevronDown size={14} className={`transition-transform duration-300 ${openDropdown === 'account' ? 'rotate-180' : ''}`} />
                </button>
                <button 
                  onClick={() => setOpenDropdown(openDropdown === 'sort' ? null : 'sort')}
                  className={`flex items-center gap-1 transition-colors ${openDropdown === 'sort' ? 'text-indigo-500' : ''}`}
                >
                  <span>{selectedSort}</span>
                  <ChevronDown size={14} className={`transition-transform duration-300 ${openDropdown === 'sort' ? 'rotate-180' : ''}`} />
                </button>
              </div>
              <button className="text-sm font-medium">筛选</button>

              {/* Dropdown Menu */}
              <AnimatePresence>
                {openDropdown && (
                  <>
                    <motion.div 
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      onClick={() => setOpenDropdown(null)}
                      className="fixed inset-0 z-20 bg-black/5"
                    />
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="absolute top-full left-6 right-6 z-30 mt-2 bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden"
                    >
                      <div className="p-2 space-y-1">
                        {openDropdown === 'month' && ['2026.04', '2026.03', '2026.02', '2026.01'].map((item) => (
                          <button
                            key={item}
                            onClick={() => { setSelectedMonth(item); setOpenDropdown(null); }}
                            className={`w-full text-left px-4 py-3 rounded-xl text-sm font-bold transition-colors ${selectedMonth === item ? 'bg-indigo-50 text-indigo-500' : 'hover:bg-gray-50'}`}
                          >
                            {item}
                          </button>
                        ))}
                        {openDropdown === 'account' && ['小店账户', '个人账户', '备用金'].map((item) => (
                          <button
                            key={item}
                            onClick={() => { setSelectedAccount(item); setOpenDropdown(null); }}
                            className={`w-full text-left px-4 py-3 rounded-xl text-sm font-bold transition-colors ${selectedAccount === item ? 'bg-indigo-50 text-indigo-500' : 'hover:bg-gray-50'}`}
                          >
                            {item}
                          </button>
                        ))}
                        {openDropdown === 'sort' && ['按金额', '按时间', '按类型'].map((item) => (
                          <button
                            key={item}
                            onClick={() => { setSelectedSort(item); setOpenDropdown(null); }}
                            className={`w-full text-left px-4 py-3 rounded-xl text-sm font-bold transition-colors ${selectedSort === item ? 'bg-indigo-50 text-indigo-500' : 'hover:bg-gray-50'}`}
                          >
                            {item}
                          </button>
                        ))}
                      </div>
                    </motion.div>
                  </>
                )}
              </AnimatePresence>
            </div>

            {/* Summary Section */}
            <div className="px-6 py-8">
              <div className="flex items-center justify-between mb-8">
                <h3 className="text-3xl font-black">4月</h3>
                <button className="bg-black text-white text-xs px-4 py-1.5 rounded-full font-bold">分析</button>
              </div>

              <div className="flex items-center justify-between mb-10">
                <div className="flex-1">
                  <div className="flex items-center gap-1 mb-1">
                    <h4 className="text-xl font-black">+17,440.00</h4>
                  </div>
                  <div className="flex items-center gap-1 text-xs text-gray-400 font-bold">
                    <span>结余</span>
                    <Info size={12} />
                  </div>
                </div>
                <div className="text-center px-4 text-xl font-bold text-gray-200">=</div>
                <div className="flex-1 text-center">
                  <h4 className="text-xl font-black">45,890.00</h4>
                  <p className="text-xs text-gray-400 font-bold">收入</p>
                </div>
                <div className="text-center px-4 text-xl font-bold text-gray-200">-</div>
                <div className="flex-1 text-right">
                  <h4 className="text-xl font-black">28,450.00</h4>
                  <p className="text-xs text-gray-400 font-bold">支出</p>
                </div>
              </div>

              {/* Report Banner */}
              <div className="bg-blue-50/50 p-4 rounded-2xl border border-blue-100/50">
                <p className="text-xs leading-relaxed">
                  2026年结余<span className="font-bold">17440.00</span>元，结余率<span className="font-bold">38%</span>，结余报告已更新。<span className="text-blue-500 font-bold">去看看</span>
                </p>
              </div>
            </div>

            {/* Transaction List */}
            <div className="px-6 pb-32">
              {/* Today */}
              <div className="mb-8">
                <h5 className="text-sm font-bold text-gray-400 mb-6">今天</h5>
                <div className="space-y-8">
                  <div className="flex justify-between items-start">
                    <div className="flex gap-3">
                      <div className="w-10 h-10 bg-orange-50 rounded-xl flex items-center justify-center">
                        <ShoppingCart size={20} className="text-orange-500" />
                      </div>
                      <div>
                        <p className="font-bold">食材采购 - 猪肉</p>
                        <p className="text-xs text-gray-400">小店账户 10:30</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-black">-¥ 1,476.99</p>
                      <p className="text-[10px] text-gray-300">余额: 15,963.01</p>
                    </div>
                  </div>

                  <div className="flex justify-between items-start">
                    <div className="flex gap-3">
                      <div className="w-10 h-10 bg-green-50 rounded-xl flex items-center justify-center">
                        <TrendingUp size={20} className="text-green-500" />
                      </div>
                      <div>
                        <p className="font-bold">堂食收入 - 微信支付</p>
                        <p className="text-xs text-gray-400">小店账户 12:20</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-black text-green-500">+¥ 840.45</p>
                      <p className="text-[10px] text-gray-300">余额: 16,803.46</p>
                    </div>
                  </div>

                  <div className="flex justify-between items-start">
                    <div className="flex gap-3">
                      <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center">
                        <Zap size={20} className="text-blue-500" />
                      </div>
                      <div>
                        <p className="font-bold">水电缴纳 - 4月</p>
                        <p className="text-xs text-gray-400">小店账户 09:15</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-black">-¥ 800.00</p>
                      <p className="text-[10px] text-gray-300">余额: 16,003.46</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* 4.1 */}
              <div>
                <h5 className="text-sm font-bold text-gray-400 mb-6">4.1</h5>
                <div className="space-y-8">
                  <div className="flex justify-between items-start">
                    <div className="flex gap-3">
                      <div className="w-10 h-10 bg-green-50 rounded-xl flex items-center justify-center">
                        <TrendingUp size={20} className="text-green-500" />
                      </div>
                      <div>
                        <p className="font-bold">外卖结算 - 美团</p>
                        <p className="text-xs text-gray-400">小店账户 09:14</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-black text-green-500">+¥ 440.45</p>
                      <p className="text-[10px] text-gray-300">余额: 16,443.91</p>
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
                className="w-14 h-14 bg-black text-white rounded-full flex items-center justify-center shadow-2xl"
              >
                <Plus size={28} />
              </motion.button>
            </div>
          </motion.div>
        );

      case 'report':
        const revenueData = [
          { name: '4.1', value: 1200 },
          { name: '4.2', value: 1500 },
          { name: '4.3', value: 1100 },
          { name: '4.4', value: 1800 },
          { name: '4.5', value: 2200 },
          { name: '4.6', value: 1900 },
          { name: '4.7', value: 2500 },
        ];

        const categoryData = [
          { name: '堂食', value: 18450, color: '#6366F1' },
          { name: '外卖', value: 15320, color: '#F59E0B' },
          { name: '团购', value: 4440, color: '#10B981' },
          { name: '其他', value: 7680, color: '#EC4899' },
        ];

        const topItemsData = [
          { name: '招牌奶茶', value: 450 },
          { name: '黄金炸鸡', value: 380 },
          { name: '香酥鸡排', value: 320 },
          { name: '章鱼小丸子', value: 280 },
          { name: '手抓饼', value: 210 },
        ];

        return (
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="min-h-screen bg-[#F8FAFC] text-[#1E293B] pb-24"
          >
            {/* Header */}
            <div className="px-6 pt-12 pb-6 flex items-center justify-between sticky top-0 bg-[#F8FAFC]/80 backdrop-blur-md z-10">
              <button onClick={() => setView('account_detail')} className="w-10 h-10 rounded-full bg-white shadow-sm border border-gray-100 flex items-center justify-center text-gray-600">
                <ChevronLeft size={24} />
              </button>
              <h2 className="text-lg font-bold">营收报表</h2>
              <button className="w-10 h-10 rounded-full bg-white shadow-sm border border-gray-100 flex items-center justify-center text-gray-600">
                <MoreHorizontal size={24} />
              </button>
            </div>

            <div className="px-6 space-y-6">
              {/* Summary Card */}
              <div className="bg-gradient-to-br from-indigo-600 to-purple-700 p-6 rounded-[32px] shadow-xl text-white">
                <p className="text-white/60 text-sm mb-1">本月总营收</p>
                <h3 className="text-3xl font-black mb-4">¥ 45,890.00</h3>
                <div className="flex items-center gap-2 text-xs">
                  <span className="bg-white/20 px-2 py-1 rounded-full">较上月 +12.5%</span>
                  <span className="bg-white/20 px-2 py-1 rounded-full">完成目标 92%</span>
                </div>
              </div>

              {/* Revenue Trend Chart */}
              <div className="bg-white p-6 rounded-[32px] shadow-sm border border-gray-100">
                <div className="flex items-center justify-between mb-6">
                  <h4 className="font-bold">营收趋势</h4>
                  <div className="flex gap-2">
                    <span className="text-[10px] bg-indigo-50 text-indigo-600 font-bold px-2 py-0.5 rounded-full">7天</span>
                    <span className="text-[10px] text-gray-400 px-2 py-0.5 rounded-full">30天</span>
                  </div>
                </div>
                <div className="h-48 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={revenueData}>
                      <defs>
                        <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#6366F1" stopOpacity={0.2}/>
                          <stop offset="95%" stopColor="#6366F1" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                      <XAxis 
                        dataKey="name" 
                        stroke="#94a3b8" 
                        fontSize={10} 
                        tickLine={false} 
                        axisLine={false}
                        dy={10}
                      />
                      <Tooltip 
                        contentStyle={{ backgroundColor: '#fff', border: 'none', borderRadius: '12px', fontSize: '12px', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }}
                        itemStyle={{ color: '#1E293B' }}
                      />
                      <Area 
                        type="monotone" 
                        dataKey="value" 
                        stroke="#6366F1" 
                        strokeWidth={3}
                        fillOpacity={1} 
                        fill="url(#colorValue)" 
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Category Distribution */}
              <div className="bg-white p-6 rounded-[32px] shadow-sm border border-gray-100">
                <h4 className="font-bold mb-6">收入构成</h4>
                <div className="flex items-center">
                  <div className="h-40 w-40">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={categoryData}
                          cx="50%"
                          cy="50%"
                          innerRadius={45}
                          outerRadius={60}
                          paddingAngle={8}
                          dataKey="value"
                        >
                          {categoryData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="flex-1 space-y-3 ml-4">
                    {categoryData.map((item) => (
                      <div key={item.name} className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full" style={{ backgroundColor: item.color }} />
                          <span className="text-xs text-gray-500">{item.name}</span>
                        </div>
                        <span className="text-xs font-bold">¥{item.value.toLocaleString()}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Comparison Stats */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-white p-5 rounded-[32px] shadow-sm border border-gray-100">
                  <p className="text-gray-400 text-[10px] mb-1">平均客单价</p>
                  <h5 className="text-lg font-black">¥ 42.50</h5>
                  <p className="text-[10px] text-green-500 font-bold mt-1">↑ 5.2%</p>
                </div>
                <div className="bg-white p-5 rounded-[32px] shadow-sm border border-gray-100">
                  <p className="text-gray-400 text-[10px] mb-1">订单总量</p>
                  <h5 className="text-lg font-black">1,080</h5>
                  <p className="text-[10px] text-green-500 font-bold mt-1">↑ 8.4%</p>
                </div>
              </div>

              {/* Top Items Bar Chart */}
              <div className="bg-white p-6 rounded-[32px] shadow-sm border border-gray-100">
                <h4 className="font-bold mb-6">热销单品 Top 5</h4>
                <div className="h-64 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={topItemsData} layout="vertical" margin={{ left: 20, right: 20 }}>
                      <XAxis type="number" hide />
                      <YAxis 
                        dataKey="name" 
                        type="category" 
                        stroke="#64748b" 
                        fontSize={10} 
                        width={80}
                        axisLine={false}
                        tickLine={false}
                      />
                      <Tooltip 
                        cursor={{ fill: 'transparent' }}
                        contentStyle={{ backgroundColor: '#fff', border: 'none', borderRadius: '12px', fontSize: '12px', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }}
                        itemStyle={{ color: '#1E293B' }}
                      />
                      <Bar 
                        dataKey="value" 
                        fill="#8B5CF6" 
                        radius={[0, 10, 10, 0]} 
                        barSize={20}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
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
              <button 
                onClick={() => setShowAddModal('income')}
                className="ml-auto w-12 h-12 rounded-2xl bg-indigo-500 text-white flex items-center justify-center shadow-lg glow-purple"
              >
                <Plus size={24} />
              </button>
            </div>
            
            <div className="space-y-4">
              {incomeList.map((item) => (
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
              <button 
                onClick={() => setShowAddModal('expense')}
                className="ml-auto w-12 h-12 rounded-2xl bg-orange-500 text-white flex items-center justify-center shadow-lg"
              >
                <Plus size={24} />
              </button>
            </div>
            
            <div className="space-y-4">
              {expenseList.map((item) => (
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
              <button 
                onClick={() => setShowAddModal('management')}
                className="ml-auto w-12 h-12 rounded-2xl bg-purple-500 text-white flex items-center justify-center shadow-lg"
              >
                <Plus size={24} />
              </button>
            </div>
            
            <div className="space-y-4">
              {managementList.map((item) => (
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

      case 'account_detail':
        return (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="min-h-screen bg-[#F8FAFC]"
          >
            {/* Dark Header Section */}
            <div className="bg-[#2D334D] text-white px-6 pt-12 pb-24 rounded-b-[40px]">
              <div className="flex items-center justify-between mb-8">
                <button onClick={() => setView('home')}>
                  <ChevronLeft size={24} />
                </button>
                <h2 className="text-lg font-bold">账户总览</h2>
                <button>
                  <MoreHorizontal size={24} />
                </button>
              </div>

              {/* Banner */}
              <div className="flex items-center gap-3 mb-8 text-sm opacity-90">
                <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-cyan-300 via-blue-400 to-purple-500 flex items-center justify-center relative overflow-hidden">
                  <div className="absolute top-1.5 left-2 w-0.5 h-0.5 bg-black/20 rounded-full" />
                  <div className="absolute top-1.5 right-2 w-0.5 h-0.5 bg-black/20 rounded-full" />
                </div>
                <p>您有 3 笔待审批的采购申请，请及时处理 &gt;</p>
              </div>

              {/* Asset Cards Row */}
              <div 
                onScroll={(e) => {
                  const scrollLeft = e.currentTarget.scrollLeft;
                  const cardWidth = 256; // approximate width including gap
                  if (scrollLeft > cardWidth / 2) {
                    setActiveCard('repayment');
                  } else {
                    setActiveCard('assets');
                  }
                }}
                className="flex gap-4 overflow-x-auto no-scrollbar pb-4 snap-x snap-mandatory px-6"
              >
                {/* Main Asset Card */}
                <motion.div 
                  onClick={() => setActiveCard('assets')}
                  animate={{ 
                    scale: activeCard === 'assets' ? 1 : 0.95,
                    opacity: activeCard === 'assets' ? 1 : 0.6
                  }}
                  className={`min-w-[240px] snap-center bg-white/10 backdrop-blur-md rounded-3xl p-6 border ${activeCard === 'assets' ? 'border-white/40 shadow-lg' : 'border-white/10'} cursor-pointer transition-all`}
                >
                  <p className="text-sm opacity-60 mb-2">本月营收</p>
                  <div className="flex items-baseline gap-1 mb-4">
                    <h3 className="text-2xl font-bold">45,890.00</h3>
                    <ChevronRight size={16} className="opacity-40" />
                  </div>
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      setView('report');
                    }}
                    className="text-xs bg-white/10 px-3 py-1.5 rounded-full border border-white/10 hover:bg-white/20 transition-colors"
                  >
                    查看报表
                  </button>
                </motion.div>

                {/* Secondary Card */}
                <motion.div 
                  onClick={() => setActiveCard('repayment')}
                  animate={{ 
                    scale: activeCard === 'repayment' ? 1 : 0.95,
                    opacity: activeCard === 'repayment' ? 1 : 0.6
                  }}
                  className={`min-w-[240px] snap-center bg-white/10 backdrop-blur-md rounded-3xl p-6 border ${activeCard === 'repayment' ? 'border-white/40 shadow-lg' : 'border-white/10'} cursor-pointer transition-all`}
                >
                  <p className="text-sm opacity-60 mb-2">经营支出</p>
                  <h3 className="text-xl font-bold">28,450.00</h3>
                </motion.div>
              </div>
            </div>

            {/* White Content Section */}
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
                      <div className="flex items-center justify-center gap-2 mb-8">
                        <span className="text-blue-500 font-bold">经营总览</span>
                        <span className="text-blue-500 font-bold">45,890.00</span>
                      </div>

                      {/* Section 1: 销售明细 */}
                      <div className="mb-10">
                        <div className="flex items-center justify-between mb-6">
                          <div className="flex items-center gap-1">
                            <h4 className="text-lg font-bold">销售明细</h4>
                            <ChevronDown size={18} className="text-gray-400" />
                          </div>
                          <div className="flex items-center gap-1">
                            <span className="text-lg font-bold">38,210.00</span>
                            <ChevronRight size={18} className="text-gray-400" />
                          </div>
                        </div>

                        <div className="space-y-6">
                          <div className="flex justify-between items-center">
                            <span className="text-gray-500">堂食销售</span>
                            <div className="flex items-center gap-2">
                              <span className="font-bold">18,450.00</span>
                              <MoreVertical size={16} className="text-gray-300" />
                            </div>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-gray-500">外卖平台</span>
                            <span className="font-bold">15,320.00</span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-gray-500">团购订单</span>
                            <div className="text-right">
                              <div className="flex items-center justify-end gap-1">
                                <span className="font-bold">4,440.00</span>
                                <ChevronRight size={16} className="text-gray-300" />
                              </div>
                              <p className="text-[10px] text-gray-400">昨日增长 +12%</p>
                            </div>
                          </div>
                        </div>
                        
                        <button className="w-full text-center text-blue-500 text-sm font-bold mt-8">查看更多销售数据</button>
                      </div>

                      {/* Section 2: 库存估值 */}
                      <div>
                        <div className="flex items-center justify-between mb-6">
                          <div className="flex items-center gap-1">
                            <h4 className="text-lg font-bold">库存估值</h4>
                            <ChevronDown size={18} className="text-gray-400" />
                          </div>
                          <span className="text-lg font-bold">7,680.00</span>
                        </div>

                        <div className="flex justify-between items-start">
                          <div>
                            <div className="flex items-center gap-1 mb-1">
                              <span className="text-gray-500">食材储备</span>
                              <ChevronRight size={16} className="text-gray-300" />
                            </div>
                            <div className="flex gap-2 text-[10px]">
                              <span className="text-gray-400">保质期预警 <span className="text-red-500 font-bold">3件</span></span>
                            </div>
                            <p className="text-[10px] text-gray-400 mt-1">主要品类: 肉类、蔬菜</p>
                          </div>
                          <div className="text-right">
                            <span className="text-lg font-bold">5,200.00</span>
                            <p className="text-[10px] text-gray-400 mt-1">估算价值</p>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  ) : (
                    <motion.div
                      key="repayment-detail"
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                    >
                      <div className="flex items-center justify-center gap-2 mb-8">
                        <span className="text-orange-500 font-bold">待支付账单</span>
                        <span className="text-orange-500 font-bold">28,450.00</span>
                      </div>

                      <div className="space-y-8">
                        <div className="flex justify-between items-center p-4 bg-orange-50 rounded-2xl">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-sm">
                              <User size={20} className="text-orange-500" />
                            </div>
                            <div>
                              <p className="font-bold">人工工资</p>
                              <p className="text-xs text-gray-400">发放日 04-15</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="font-bold">12,000.00</p>
                            <button className="text-[10px] text-blue-500 font-bold">确认发放</button>
                          </div>
                        </div>

                        <div className="flex justify-between items-center p-4 bg-orange-50 rounded-2xl">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-sm">
                              <Zap size={20} className="text-orange-500" />
                            </div>
                            <div>
                              <p className="font-bold">水电物业费</p>
                              <p className="text-xs text-gray-400">截止日 04-20</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="font-bold">3,450.00</p>
                            <button className="text-[10px] text-blue-500 font-bold">立即缴纳</button>
                          </div>
                        </div>

                        <div className="flex justify-between items-center p-4 bg-orange-50 rounded-2xl">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-sm">
                              <Home size={20} className="text-orange-500" />
                            </div>
                            <div>
                              <p className="font-bold">店面房租</p>
                              <p className="text-xs text-gray-400">截止日 04-05</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="font-bold">8,000.00</p>
                            <button className="text-[10px] text-blue-500 font-bold">立即缴纳</button>
                          </div>
                        </div>

                        <div className="flex justify-between items-center p-4 bg-orange-50 rounded-2xl">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-sm">
                              <ShoppingCart size={20} className="text-orange-500" />
                            </div>
                            <div>
                              <p className="font-bold">采购欠款</p>
                              <p className="text-xs text-gray-400">供应商: 恒丰食材</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="font-bold">5,000.00</p>
                            <button className="text-[10px] text-blue-500 font-bold">立即结算</button>
                          </div>
                        </div>
                      </div>

                      <div className="mt-12 p-6 bg-gray-50 rounded-3xl border border-dashed border-gray-200">
                        <div className="flex items-center gap-2 text-gray-400 mb-4">
                          <Info size={16} />
                          <p className="text-xs font-bold">经营建议</p>
                        </div>
                        <p className="text-xs text-gray-500 leading-relaxed">
                          本月水电费较上月增长 15%，建议检查厨房设备是否存在漏水或待机功耗过高的情况。
                        </p>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
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

      {/* Add Record Modal */}
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
                    className="w-full bg-gray-50 border-none rounded-2xl p-4 text-sm font-bold focus:ring-2 focus:ring-indigo-500 transition-all"
                  />
                </div>
                
                {showAddModal !== 'management' && (
                  <div>
                    <label className="text-xs font-black text-gray-400 uppercase tracking-widest mb-2 block">金额</label>
                    <input 
                      type="number" 
                      value={newRecord.amount}
                      onChange={(e) => setNewRecord({ ...newRecord, amount: e.target.value })}
                      placeholder="0.00"
                      className="w-full bg-gray-50 border-none rounded-2xl p-4 text-sm font-bold focus:ring-2 focus:ring-indigo-500 transition-all"
                    />
                  </div>
                )}

                <div>
                  <label className="text-xs font-black text-gray-400 uppercase tracking-widest mb-2 block">备注 / 详情</label>
                  <input 
                    type="text" 
                    value={newRecord.subtitle}
                    onChange={(e) => setNewRecord({ ...newRecord, subtitle: e.target.value })}
                    placeholder="可选备注信息"
                    className="w-full bg-gray-50 border-none rounded-2xl p-4 text-sm font-bold focus:ring-2 focus:ring-indigo-500 transition-all"
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
                  className="flex-1 py-4 bg-indigo-500 text-white rounded-2xl font-black shadow-lg glow-purple transition-all active:scale-95"
                >
                  确定添加
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
      
      {/* Futuristic Bottom Nav */}
      {view !== 'account_detail' && view !== 'monthly_flow' && view !== 'report' && (
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
      )}
    </div>
  );
}
