import React from 'react';
import { motion } from 'motion/react';
import { ChevronLeft, Plus, UserPlus, MoreVertical, Mail, Shield } from 'lucide-react';
import { View, User } from '../types';

interface UserManagementProps {
  setView: (view: View) => void;
  users: User[];
}

export const UserManagement = ({ setView, users }: UserManagementProps) => {
  return (
    <motion.div 
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      className="px-6 pt-12 pb-36"
    >
      <div className="flex items-center gap-4 mb-10">
        <button onClick={() => setView('profile')} className="w-12 h-12 rounded-2xl bg-white flex items-center justify-center text-gray-400 border border-gray-100 shadow-sm">
          <ChevronLeft size={24} />
        </button>
        <h2 className="text-xl font-black tracking-tight text-[#1E293B]">用户管理</h2>
        <button 
          className="ml-auto w-12 h-12 rounded-2xl bg-primary text-white flex items-center justify-center shadow-lg"
        >
          <UserPlus size={24} />
        </button>
      </div>

      <div className="space-y-4">
        {users.map((user) => (
          <div key={user.id} className="bg-white p-5 rounded-[32px] shadow-sm border border-gray-50 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl overflow-hidden border-2 border-primary/10">
                <img 
                  src={user.avatar} 
                  alt={user.name} 
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                />
              </div>
              <div>
                <h4 className="text-sm font-black tracking-tight">{user.name}</h4>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-[9px] font-bold uppercase tracking-wider text-primary bg-primary/10 px-2 py-0.5 rounded-md">
                    {user.role}
                  </span>
                  <span className={`text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md ${user.status === 'active' ? 'text-cyan-custom bg-cyan-custom/10' : 'text-gray-400 bg-gray-50'}`}>
                    {user.status === 'active' ? '在线' : '离线'}
                  </span>
                </div>
              </div>
            </div>
            <button className="text-gray-300 hover:text-primary transition-colors">
              <MoreVertical size={20} />
            </button>
          </div>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="mt-10 grid grid-cols-2 gap-4">
        <div className="bg-primary/5 p-6 rounded-[32px] border border-primary/10">
          <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-primary mb-4 shadow-sm">
            <Mail size={20} />
          </div>
          <h5 className="text-xs font-black text-primary mb-1">邀请新成员</h5>
          <p className="text-[10px] text-primary/60 font-bold">通过邮箱发送邀请链接</p>
        </div>
        <div 
          onClick={() => setView('auth_management')}
          className="bg-cyan-custom/5 p-6 rounded-[32px] border border-cyan-custom/10 cursor-pointer"
        >
          <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-cyan-custom mb-4 shadow-sm">
            <Shield size={20} />
          </div>
          <h5 className="text-xs font-black text-cyan-custom mb-1">权限设置</h5>
          <p className="text-[10px] text-cyan-custom/60 font-bold">管理角色与访问权限</p>
        </div>
      </div>
    </motion.div>
  );
};
