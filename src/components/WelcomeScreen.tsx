import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { GraduationCap, ChevronRight, Sparkles } from 'lucide-react';
import AnimatedCanvas from './AnimatedCanvas';
import MexicoMapVisual from './MexicoMapVisual';

interface WelcomeScreenProps {
  onStart: () => void;
}

const WelcomeScreen: React.FC<WelcomeScreenProps> = ({ onStart }) => {
  const [isExiting, setIsExiting] = useState(false);
  const [stats, setStats] = useState({ institutions: 0, students: 0, states: 0 });

  useEffect(() => {
    const timer = setTimeout(() => {
      setStats({
        institutions: 3865,
        students: 5225100,
        states: 32
      });
    }, 500);
    return () => clearTimeout(timer);
  }, []);

  const handleStart = () => {
    setIsExiting(true);
    setTimeout(onStart, 800);
  };

  return (
    <AnimatePresence>
      {!isExiting && (
        <motion.div
          initial={{ opacity: 1 }}
          exit={{ opacity: 0, y: -100 }}
          transition={{ duration: 0.8, ease: "easeInOut" }}
          className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-white overflow-hidden"
        >
          {/* Background Animation */}
          <div className="absolute inset-0 z-0 opacity-40">
            <AnimatedCanvas />
          </div>

          <div className="relative z-10 max-w-4xl w-full px-6 text-center">
            {/* Logo & Branding */}
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="mb-8 inline-flex items-center justify-center p-4 rounded-3xl bg-indigo-600 text-white shadow-2xl shadow-indigo-200"
            >
              <GraduationCap size={48} strokeWidth={1.5} />
            </motion.div>

            <motion.h1
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.4 }}
              className="text-5xl md:text-7xl font-bold text-slate-900 mb-6 tracking-tight"
            >
              EduMap <span className="text-indigo-600 italic">México</span>
            </motion.h1>

            <motion.p
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.5 }}
              className="text-xl text-slate-600 mb-12 max-w-2xl mx-auto leading-relaxed"
            >
              Tu brújula educativa para encontrar el futuro ideal. Explora, compara y decide con datos reales de todo el país.
            </motion.p>

            {/* Interactive Map Visual */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 1, delay: 0.6 }}
              className="relative h-64 md:h-80 mb-12 flex items-center justify-center overflow-visible"
            >
              <MexicoMapVisual />
            </motion.div>

            {/* Stats Grid */}
            <div className="grid grid-cols-3 gap-4 mb-12">
              <div className="p-4 rounded-2xl bg-slate-50/80 backdrop-blur-sm border border-slate-100">
                <div className="text-2xl font-bold text-indigo-600">{stats.institutions.toLocaleString()}</div>
                <div className="text-xs text-slate-500 uppercase tracking-wider font-semibold">Instituciones</div>
              </div>
              <div className="p-4 rounded-2xl bg-slate-50/80 backdrop-blur-sm border border-slate-100">
                <div className="text-2xl font-bold text-indigo-600">+{stats.states}</div>
                <div className="text-xs text-slate-500 uppercase tracking-wider font-semibold">Estados</div>
              </div>
              <div className="p-4 rounded-2xl bg-slate-50/80 backdrop-blur-sm border border-slate-100">
                <div className="text-2xl font-bold text-indigo-600">14,243</div>
                <div className="text-xs text-slate-500 uppercase tracking-wider font-semibold">Programas</div>
              </div>
            </div>

            {/* CTA Button */}
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleStart}
              className="group relative inline-flex items-center gap-3 px-10 py-5 bg-indigo-600 text-white rounded-2xl font-bold text-lg shadow-xl shadow-indigo-200 transition-all hover:bg-indigo-700"
            >
              <Sparkles className="animate-pulse" size={20} />
              Comenzar Exploración
              <ChevronRight className="group-hover:translate-x-1 transition-transform" />
            </motion.button>
          </div>

          {/* Footer Label */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.5 }}
            transition={{ delay: 1.5 }}
            className="absolute bottom-8 text-xs text-slate-400 uppercase tracking-[0.3em] font-medium"
          >
            Secretaría de Educación Pública • 2024
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default WelcomeScreen;
