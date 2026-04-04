import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ADS } from '../mockData';

export const AdBanner = () => {
  const [current, setCurrent] = useState(0);
  
  useEffect(() => {
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
