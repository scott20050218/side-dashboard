import React from 'react';
import { motion } from 'motion/react';
import {
  Users,
  UserPlus,
  ShieldCheck,
  Store,
  ChevronRight,
  Settings,
  Bell,
  CreditCard,
  LogOut,
  HelpCircle,
} from 'lucide-react';
import { View } from '../types';

interface ProfileProps {
  setView: (view: View) => void;
  onLogout: () => void;
  userName?: string;
  roleLabel?: string;
  storeCount?: number;
  showAdminLinks?: boolean;
  /** 当前门店成员角色为「老板」时显示，用于管理本店成员与授权 */
  showStoreTeam?: boolean;
}

export const Profile = ({
  setView,
  onLogout,
  userName = '用户',
  roleLabel = '',
  storeCount = 0,
  showAdminLinks = false,
  showStoreTeam = false,
}: ProfileProps) => {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="px-6 pt-12 pb-36"
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-10">
        <h1 className="text-3xl font-black tracking-tighter text-[#1E293B]">我的</h1>
        <button className="w-12 h-12 rounded-2xl bg-white flex items-center justify-center text-gray-400 border border-gray-100 shadow-sm">
          <Settings size={24} />
        </button>
      </div>

      {/* Profile Card */}
      <div className="bg-white p-8 rounded-[40px] shadow-xl border border-gray-50 mb-10">
        <div className="flex flex-col items-center">
          <div className="w-24 h-24 rounded-[32px] bg-gradient-to-tr from-primary via-cyan-custom to-yellow-custom p-1 shadow-2xl mb-6">
            <div className="w-full h-full rounded-[28px] bg-white p-1">
              <img 
                src="https://picsum.photos/seed/avatar/200/200" 
                alt="Avatar" 
                className="w-full h-full rounded-[26px] object-cover"
                referrerPolicy="no-referrer"
              />
            </div>
          </div>
          <h2 className="text-2xl font-black text-[#1E293B] mb-1">{userName}</h2>
          <p className="text-xs text-gray-400 font-bold uppercase tracking-widest mb-6">
            {roleLabel || '门店成员'} · 专业版用户
          </p>
          
          <div className="flex gap-4 w-full">
            <div className="flex-1 bg-gray-50 rounded-3xl p-4 text-center">
              <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest mb-1">加入时间</p>
              <p className="text-sm font-black text-[#1E293B]">2024.01</p>
            </div>
            <div className="flex-1 bg-gray-50 rounded-3xl p-4 text-center">
              <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest mb-1">管理店面</p>
              <p className="text-sm font-black text-[#1E293B]">{storeCount} 家</p>
            </div>
          </div>
        </div>
      </div>

      {showStoreTeam ? (
        <div className="mb-10">
          <h3 className="text-[10px] text-gray-400 font-black uppercase tracking-widest mb-6 ml-4">
            本店经营
          </h3>
          <motion.button
            type="button"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setView('store_team')}
            className="w-full flex items-center gap-6 p-6 bg-white rounded-[32px] shadow-lg border border-gray-50"
          >
            <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 flex items-center justify-center text-emerald-600">
              <UserPlus size={28} />
            </div>
            <div className="flex-1 text-left">
              <h4 className="text-lg font-black text-[#1E293B]">我的团队</h4>
              <p className="text-xs text-gray-400 font-bold">
                创建店长、收银员、股东并授权录入与查看范围
              </p>
            </div>
            <ChevronRight size={20} className="text-gray-300" />
          </motion.button>
        </div>
      ) : null}

      {showAdminLinks ? (
        <div className="mb-10">
          <h3 className="text-[10px] text-gray-400 font-black uppercase tracking-widest mb-6 ml-4">管理与授权</h3>
          <div className="space-y-4">
            <motion.button
              type="button"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setView('user_management')}
              className="w-full flex items-center gap-6 p-6 bg-white rounded-[32px] shadow-lg border border-gray-50"
            >
              <div className="w-14 h-14 rounded-2xl bg-cyan-custom/10 flex items-center justify-center text-cyan-custom">
                <Users size={28} />
              </div>
              <div className="flex-1 text-left">
                <h4 className="text-lg font-black text-[#1E293B]">用户管理</h4>
                <p className="text-xs text-gray-400 font-bold">管理团队成员与状态</p>
              </div>
              <ChevronRight size={20} className="text-gray-300" />
            </motion.button>

            <motion.button
              type="button"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setView('admin_stores')}
              className="w-full flex items-center gap-6 p-6 bg-white rounded-[32px] shadow-lg border border-gray-50"
            >
              <div className="w-14 h-14 rounded-2xl bg-yellow-custom/15 flex items-center justify-center text-yellow-custom">
                <Store size={28} />
              </div>
              <div className="flex-1 text-left">
                <h4 className="text-lg font-black text-[#1E293B]">小店管理</h4>
                <p className="text-xs text-gray-400 font-bold">新增小店、查看全部门店与店长</p>
              </div>
              <ChevronRight size={20} className="text-gray-300" />
            </motion.button>

            <motion.button
              type="button"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setView('auth_management')}
              className="w-full flex items-center gap-6 p-6 bg-white rounded-[32px] shadow-lg border border-gray-50"
            >
              <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center text-primary">
                <ShieldCheck size={28} />
              </div>
              <div className="flex-1 text-left">
                <h4 className="text-lg font-black text-[#1E293B]">授权管理</h4>
                <p className="text-xs text-gray-400 font-bold">角色权限与安全审计</p>
              </div>
              <ChevronRight size={20} className="text-gray-300" />
            </motion.button>
          </div>
        </div>
      ) : null}

      {/* Other Options */}
      <div className="mb-10">
        <h3 className="text-[10px] text-gray-400 font-black uppercase tracking-widest mb-6 ml-4">系统设置</h3>
        <div className="bg-white rounded-[40px] shadow-lg border border-gray-50 overflow-hidden">
          <button className="w-full flex items-center justify-between p-6 hover:bg-gray-50 transition-colors border-b border-gray-50">
            <div className="flex items-center gap-4">
              <Bell size={20} className="text-gray-400" />
              <span className="text-sm font-bold">消息通知</span>
            </div>
            <ChevronRight size={16} className="text-gray-300" />
          </button>
          <button className="w-full flex items-center justify-between p-6 hover:bg-gray-50 transition-colors border-b border-gray-50">
            <div className="flex items-center gap-4">
              <CreditCard size={20} className="text-gray-400" />
              <span className="text-sm font-bold">支付设置</span>
            </div>
            <ChevronRight size={16} className="text-gray-300" />
          </button>
          <button className="w-full flex items-center justify-between p-6 hover:bg-gray-50 transition-colors">
            <div className="flex items-center gap-4">
              <HelpCircle size={20} className="text-gray-400" />
              <span className="text-sm font-bold">帮助中心</span>
            </div>
            <ChevronRight size={16} className="text-gray-300" />
          </button>
        </div>
      </div>

      {/* Logout Button */}
      <button 
        onClick={onLogout}
        className="w-full bg-red-50 text-red-500 rounded-[32px] py-6 font-black flex items-center justify-center gap-3 active:scale-95 transition-all mb-10"
      >
        <LogOut size={20} />
        退出登录
      </button>

      <p className="text-center text-gray-300 text-[10px] font-bold uppercase tracking-widest">
        事业家看板 v2.1.0 · Smart Management
      </p>
    </motion.div>
  );
};
