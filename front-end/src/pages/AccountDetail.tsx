import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ChevronLeft, 
  MoreHorizontal, 
  ChevronRight, 
  ChevronDown, 
  User, 
  Zap, 
  Home, 
  ShoppingCart, 
  Info 
} from 'lucide-react';
import { View } from '../types';

interface AccountDetailProps {
  setView: (view: View) => void;
  activeCard: 'assets' | 'repayment';
  setActiveCard: (card: 'assets' | 'repayment') => void;
}

export const AccountDetail = ({ setView, activeCard, setActiveCard }: AccountDetailProps) => {
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
                  <span className="text-primary font-bold">经营总览</span>
                  <span className="text-primary font-bold">45,890.00</span>
                </div>

                {/* Section 1: 销售明细 */}
                <div className="mb-10">
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-1">
                      <h4 className="text-lg font-bold">销售明细</h4>
                      <ChevronDown size={18} className="text-gray-400" />
                    </div>
                    <div className="flex items-center gap-1">
                      <span className="text-xs text-gray-400">全部</span>
                      <ChevronRight size={14} className="text-gray-300" />
                    </div>
                  </div>

                  <div className="space-y-6">
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center">
                          <div className="w-5 h-5 bg-primary rounded-md" />
                        </div>
                        <div>
                          <p className="font-bold">堂食收入</p>
                          <p className="text-xs text-gray-400">订单数 420</p>
                        </div>
                      </div>
                      <p className="font-bold">18,450.00</p>
                    </div>

                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-orange-custom/10 rounded-xl flex items-center justify-center">
                          <div className="w-5 h-5 bg-orange-custom rounded-md" />
                        </div>
                        <div>
                          <p className="font-bold">外卖收入</p>
                          <p className="text-xs text-gray-400">订单数 380</p>
                        </div>
                      </div>
                      <p className="font-bold">15,320.00</p>
                    </div>

                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-cyan-custom/10 rounded-xl flex items-center justify-center">
                          <div className="w-5 h-5 bg-cyan-custom rounded-md" />
                        </div>
                        <div>
                          <p className="font-bold">团购收入</p>
                          <p className="text-xs text-gray-400">订单数 120</p>
                        </div>
                      </div>
                      <p className="font-bold">4,440.00</p>
                    </div>
                  </div>
                </div>

                {/* Section 2: 采购明细 */}
                <div>
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-1">
                      <h4 className="text-lg font-bold">采购支出</h4>
                      <ChevronDown size={18} className="text-gray-400" />
                    </div>
                    <div className="flex items-center gap-1">
                      <span className="text-xs text-gray-400">本周</span>
                      <ChevronRight size={14} className="text-gray-300" />
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="flex justify-between items-center p-4 bg-gray-50 rounded-2xl">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-sm">
                          <ShoppingCart size={20} className="text-gray-400" />
                        </div>
                        <div>
                          <p className="font-bold">原材料采购</p>
                          <p className="text-xs text-gray-400">04-03 11:00</p>
                        </div>
                      </div>
                      <p className="font-bold text-orange-custom">-800.00</p>
                    </div>
                    <div className="flex justify-between items-center p-4 bg-gray-50 rounded-2xl">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-sm">
                          <ShoppingCart size={20} className="text-gray-400" />
                        </div>
                        <div>
                          <p className="font-bold">包装耗材</p>
                          <p className="text-xs text-gray-400">04-02 15:30</p>
                        </div>
                      </div>
                      <p className="font-bold text-orange-custom">-320.00</p>
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
                  <span className="text-orange-custom font-bold">支出总览</span>
                  <span className="text-orange-custom font-bold">28,450.00</span>
                </div>

                <div className="space-y-6">
                  <div className="space-y-4">
                    <div className="flex justify-between items-center p-4 bg-orange-custom/5 rounded-2xl">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-sm">
                          <User size={20} className="text-orange-custom" />
                        </div>
                        <div>
                          <p className="font-bold">人工工资</p>
                          <p className="text-xs text-gray-400">发放日 04-15</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-bold">12,000.00</p>
                        <button className="text-[10px] text-primary font-bold">确认发放</button>
                      </div>
                    </div>

                    <div className="flex justify-between items-center p-4 bg-orange-custom/5 rounded-2xl">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-sm">
                          <Zap size={20} className="text-orange-custom" />
                        </div>
                        <div>
                          <p className="font-bold">水电物业费</p>
                          <p className="text-xs text-gray-400">截止日 04-20</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-bold">3,450.00</p>
                        <button className="text-[10px] text-primary font-bold">立即缴纳</button>
                      </div>
                    </div>

                    <div className="flex justify-between items-center p-4 bg-orange-custom/5 rounded-2xl">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-sm">
                          <Home size={20} className="text-orange-custom" />
                        </div>
                        <div>
                          <p className="font-bold">店面房租</p>
                          <p className="text-xs text-gray-400">截止日 04-05</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-bold">8,000.00</p>
                        <button className="text-[10px] text-primary font-bold">立即缴纳</button>
                      </div>
                    </div>

                    <div className="flex justify-between items-center p-4 bg-orange-custom/5 rounded-2xl">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-sm">
                          <ShoppingCart size={20} className="text-orange-custom" />
                        </div>
                        <div>
                          <p className="font-bold">采购欠款</p>
                          <p className="text-xs text-gray-400">供应商: 恒丰食材</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-bold">5,000.00</p>
                        <button className="text-[10px] text-primary font-bold">立即结算</button>
                      </div>
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
};
