import React from 'react';
import { motion } from 'motion/react';
import { 
  ChevronLeft, 
  MoreHorizontal 
} from 'lucide-react';
import { 
  BarChart,
  Bar,
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
import { View } from '../types';

interface ReportProps {
  setView: (view: View) => void;
}

export const Report = ({ setView }: ReportProps) => {
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
    { name: '堂食', value: 18450, color: '#6462cc' },
    { name: '外卖', value: 15320, color: '#f27d51' },
    { name: '团购', value: 4440, color: '#5ec9db' },
    { name: '其他', value: 7680, color: '#fdc765' },
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
        <div className="bg-primary p-6 rounded-[32px] shadow-xl text-white">
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
              <span className="text-[10px] bg-primary/10 text-primary font-bold px-2 py-0.5 rounded-full">7天</span>
              <span className="text-[10px] text-gray-400 px-2 py-0.5 rounded-full">30天</span>
            </div>
          </div>
          <div className="h-48 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={revenueData}>
                <defs>
                  <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6462cc" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="#6462cc" stopOpacity={0}/>
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
                  stroke="#6462cc" 
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
            <p className="text-[10px] text-cyan-custom font-bold mt-1">↑ 5.2%</p>
          </div>
          <div className="bg-white p-5 rounded-[32px] shadow-sm border border-gray-100">
            <p className="text-gray-400 text-[10px] mb-1">订单总量</p>
            <h5 className="text-lg font-black">1,080</h5>
            <p className="text-[10px] text-cyan-custom font-bold mt-1">↑ 8.4%</p>
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
                  fill="#6462cc" 
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
};
