import React from 'react';
import { motion } from 'motion/react';
import { ChevronLeft, Plus, Shield, CheckCircle2, MoreHorizontal, Settings } from 'lucide-react';
import { View, Role } from '../types';

interface AuthManagementProps {
  setView: (view: View) => void;
  roles: Role[];
}

export const AuthManagement = ({ setView, roles }: AuthManagementProps) => {
  const allPermissions = [
    '查看报表',
    '录入收支',
    '事务审批',
    '用户管理',
    '权限设置',
    '系统配置'
  ];

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
        <h2 className="text-xl font-black tracking-tight text-[#1E293B]">授权管理</h2>
        <button 
          className="ml-auto w-12 h-12 rounded-2xl bg-primary text-white flex items-center justify-center shadow-lg"
        >
          <Plus size={24} />
        </button>
      </div>

      <div className="space-y-6">
        {roles.map((role) => (
          <div key={role.id} className="bg-white p-6 rounded-[40px] shadow-sm border border-gray-50">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center text-primary">
                  <Shield size={20} />
                </div>
                <div>
                  <h4 className="text-sm font-black tracking-tight">{role.name}</h4>
                  <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">{role.permissions.length} 项权限</p>
                </div>
              </div>
              <button className="text-gray-300 hover:text-primary transition-colors">
                <Settings size={20} />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-2">
              {allPermissions.map((perm) => {
                const hasPerm = role.permissions.includes(perm);
                return (
                  <div 
                    key={perm} 
                    className={`flex items-center gap-2 px-3 py-2 rounded-xl text-[10px] font-bold ${hasPerm ? 'bg-cyan-custom/10 text-cyan-custom' : 'bg-gray-50 text-gray-300'}`}
                  >
                    <CheckCircle2 size={12} className={hasPerm ? 'text-cyan-custom' : 'text-gray-200'} />
                    {perm}
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Security Info */}
      <div className="mt-10 p-6 bg-gray-900 rounded-[32px] text-white">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center">
            <Shield size={16} className="text-primary" />
          </div>
          <h5 className="text-xs font-black">安全审计</h5>
        </div>
        <p className="text-[10px] text-gray-400 leading-relaxed font-bold">
          所有权限变更将被记录在系统日志中。建议定期审查管理员权限，确保最小权限原则。
        </p>
      </div>
    </motion.div>
  );
};
