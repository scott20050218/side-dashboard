import React from 'react';
import { motion } from 'motion/react';
import { Home, BarChart2, Scan, CreditCard, User } from 'lucide-react';
import { View } from '../types';

interface BottomNavProps {
  view: View;
  setView: (view: View) => void;
}

export const BottomNav = ({ view, setView }: BottomNavProps) => {
  if (view === 'account_detail' || view === 'monthly_flow' || view === 'report' || view === 'user_management' || view === 'auth_management') {
    return null;
  }

  return (
    <div className="fixed bottom-0 left-0 right-0 max-w-md mx-auto px-6 pb-10 pointer-events-none">
      <div className="nav-blur rounded-[32px] shadow-[0_25px_50px_-12px_rgba(0,0,0,0.1)] px-8 py-5 flex justify-between items-center pointer-events-auto">
        <button onClick={() => setView('home')} className={`flex flex-col items-center gap-1.5 transition-all duration-300 ${view === 'home' ? 'text-primary scale-110' : 'text-gray-400'}`}>
          <Home size={24} strokeWidth={view === 'home' ? 2.5 : 2} />
          {view === 'home' && <motion.div layoutId="nav-dot" className="w-1 h-1 rounded-full bg-primary" />}
        </button>
        <button onClick={() => setView('stats')} className={`flex flex-col items-center gap-1.5 transition-all duration-300 ${view === 'stats' ? 'text-primary scale-110' : 'text-gray-400'}`}>
          <BarChart2 size={24} strokeWidth={view === 'stats' ? 2.5 : 2} />
          {view === 'stats' && <motion.div layoutId="nav-dot" className="w-1 h-1 rounded-full bg-primary" />}
        </button>
        
        {/* Central Scan FAB */}
        <div className="relative -mt-16">
          <motion.button 
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            className="w-16 h-16 rounded-[24px] bg-gradient-to-br from-primary to-cyan-custom flex items-center justify-center text-white shadow-2xl shadow-primary/30 border border-white/20"
          >
            <Scan size={28} strokeWidth={3} />
          </motion.button>
        </div>

        <button className="flex flex-col items-center gap-1.5 text-gray-400">
          <CreditCard size={24} />
        </button>
        <button onClick={() => setView('profile')} className={`flex flex-col items-center gap-1.5 transition-all duration-300 ${view === 'profile' ? 'text-primary scale-110' : 'text-gray-400'}`}>
          <User size={24} strokeWidth={view === 'profile' ? 2.5 : 2} />
          {view === 'profile' && <motion.div layoutId="nav-dot" className="w-1 h-1 rounded-full bg-primary" />}
        </button>
      </div>
    </div>
  );
};
