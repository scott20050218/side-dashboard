import React, { useState } from 'react';
import { motion } from 'motion/react';
import { User, Lock, ArrowRight, ShieldCheck } from 'lucide-react';
import { View } from '../types';

interface LoginProps {
  onLogin: () => void;
}

export const Login = ({ onLogin }: LoginProps) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    // Simple mock authentication
    setTimeout(() => {
      if (username === 'admin' && password === '123456') {
        onLogin();
      } else {
        setError('用户名或密码错误 (提示: admin/123456)');
        setIsLoading(false);
      }
    }, 1000);
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="min-h-screen bg-[#F8FAFC] flex flex-col items-center justify-center px-6 pb-12"
    >
      <div className="w-full max-w-md">
        {/* Logo Section */}
        <div className="flex flex-col items-center mb-12">
          <motion.div 
            initial={{ scale: 0.5, rotate: -10 }}
            animate={{ scale: 1, rotate: 0 }}
            className="w-20 h-20 bg-primary rounded-[28px] flex items-center justify-center text-white shadow-2xl shadow-primary/30 mb-6"
          >
            <ShieldCheck size={40} strokeWidth={2.5} />
          </motion.div>
          <h1 className="text-3xl font-black tracking-tighter text-[#1E293B]">事业家看板</h1>
          <p className="text-gray-400 font-bold uppercase tracking-widest text-[10px] mt-2">
            Smart Management · Pro Version
          </p>
        </div>

        {/* Login Form */}
        <motion.div 
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="bg-white rounded-[40px] p-8 shadow-2xl border border-gray-50"
        >
          <h2 className="text-xl font-black mb-8 text-[#1E293B]">欢迎回来</h2>
          
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-4">用户名</label>
              <div className="relative">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
                  <User size={20} />
                </div>
                <input 
                  type="text" 
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="请输入用户名"
                  className="w-full bg-gray-50 border-none rounded-2xl py-4 pl-12 pr-4 text-sm font-bold focus:ring-2 focus:ring-primary transition-all outline-none"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-4">密码</label>
              <div className="relative">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
                  <Lock size={20} />
                </div>
                <input 
                  type="password" 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="请输入密码"
                  className="w-full bg-gray-50 border-none rounded-2xl py-4 pl-12 pr-4 text-sm font-bold focus:ring-2 focus:ring-primary transition-all outline-none"
                  required
                />
              </div>
            </div>

            {error && (
              <motion.p 
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                className="text-red-500 text-xs font-bold ml-4"
              >
                {error}
              </motion.p>
            )}

            <button 
              type="submit"
              disabled={isLoading}
              className="w-full bg-primary text-white rounded-2xl py-4 font-black shadow-lg glow-purple transition-all active:scale-95 flex items-center justify-center gap-2 disabled:opacity-70 disabled:active:scale-100"
            >
              {isLoading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  立即登录
                  <ArrowRight size={20} />
                </>
              )}
            </button>
          </form>
        </motion.div>

        <p className="text-center mt-10 text-gray-400 text-xs font-bold">
          忘记密码? 请联系系统管理员
        </p>
      </div>
    </motion.div>
  );
};
