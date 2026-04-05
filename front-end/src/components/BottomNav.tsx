import React from 'react';
import { motion } from 'motion/react';
import { Home, BarChart2, Scan, FileCheck, User } from 'lucide-react';
import { View } from '../types';

interface BottomNavProps {
  view: View;
  setView: (view: View) => void;
  showAmendments?: boolean;
}

const hiddenOn: View[] = [
  'account_detail',
  'monthly_flow',
  'report',
  'user_management',
  'auth_management',
  'admin_stores',
  'store_team',
];

export const BottomNav = ({ view, setView, showAmendments }: BottomNavProps) => {
  if (hiddenOn.includes(view)) {
    return null;
  }

  return (
    <div className="fixed bottom-0 left-0 right-0 max-w-md mx-auto px-6 pb-10 pointer-events-none">
      <div className="nav-blur rounded-[32px] shadow-[0_25px_50px_-12px_rgba(0,0,0,0.1)] px-8 py-5 flex justify-between items-center pointer-events-auto">
        <button
          type="button"
          onClick={() => setView('home')}
          className={`flex flex-col items-center gap-1.5 transition-all duration-300 ${view === 'home' ? 'text-primary scale-110' : 'text-gray-400'}`}
        >
          <Home size={24} strokeWidth={view === 'home' ? 2.5 : 2} />
          {view === 'home' && <motion.div layoutId="nav-dot" className="w-1 h-1 rounded-full bg-primary" />}
        </button>
        <button
          type="button"
          onClick={() => setView('report')}
          className={`flex flex-col items-center gap-1.5 transition-all duration-300 ${view === 'report' ? 'text-primary scale-110' : 'text-gray-400'}`}
        >
          <BarChart2 size={24} strokeWidth={view === 'report' ? 2.5 : 2} />
          {view === 'report' && <motion.div layoutId="nav-dot" className="w-1 h-1 rounded-full bg-primary" />}
        </button>

        <div className="relative -mt-16">
          <motion.button
            type="button"
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            className="w-16 h-16 rounded-[24px] bg-gradient-to-br from-primary to-cyan-custom flex items-center justify-center text-white shadow-2xl shadow-primary/30 border border-white/20"
          >
            <Scan size={28} strokeWidth={3} />
          </motion.button>
        </div>

        {showAmendments ? (
          <button
            type="button"
            onClick={() => setView('amendments')}
            className={`flex flex-col items-center gap-1.5 transition-all duration-300 ${view === 'amendments' ? 'text-primary scale-110' : 'text-gray-400'}`}
          >
            <FileCheck size={24} strokeWidth={view === 'amendments' ? 2.5 : 2} />
            {view === 'amendments' && <motion.div layoutId="nav-dot" className="w-1 h-1 rounded-full bg-primary" />}
          </button>
        ) : (
          <span className="w-6" aria-hidden />
        )}

        <button
          type="button"
          onClick={() => setView('profile')}
          className={`flex flex-col items-center gap-1.5 transition-all duration-300 ${view === 'profile' ? 'text-primary scale-110' : 'text-gray-400'}`}
        >
          <User size={24} strokeWidth={view === 'profile' ? 2.5 : 2} />
          {view === 'profile' && <motion.div layoutId="nav-dot" className="w-1 h-1 rounded-full bg-primary" />}
        </button>
      </div>
    </div>
  );
};
