import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ChevronLeft, ChevronRight, Sparkles, GraduationCap, Building2 } from 'lucide-react';
import { InfoCarrera, Oferta } from '../types';

interface ShowcaseCarouselProps {
  infoCarreras: InfoCarrera[];
  ofertas: Oferta[];
  onSelect: (palabraClave: string) => void;
}

const ShowcaseCarousel: React.FC<ShowcaseCarouselProps> = ({ infoCarreras, ofertas, onSelect }) => {
  const [activeIndex, setActiveIndex] = useState(0);

  const getLogosForCarrera = (palabraClave: string) => {
    const matchingOfertas = ofertas.filter(o => 
      o.carrera_nombre?.toLowerCase().includes(palabraClave.toLowerCase())
    );
    const logos = Array.from(new Set(matchingOfertas.map(o => o.institucion?.logoUrl).filter(Boolean)));
    return logos.slice(0, 5); // Show up to 5 logos
  };

  const next = useCallback(() => {
    setActiveIndex((prev) => (prev + 1) % infoCarreras.length);
  }, [infoCarreras.length]);

  const prev = useCallback(() => {
    setActiveIndex((prev) => (prev - 1 + infoCarreras.length) % infoCarreras.length);
  }, [infoCarreras.length]);

  useEffect(() => {
    const timer = setInterval(next, 10000);
    return () => clearInterval(timer);
  }, [next]);

  if (infoCarreras.length === 0) return null;

  return (
    <div className="relative w-full overflow-hidden py-10">
      <div className="flex items-center justify-between mb-8 px-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-indigo-600 text-white rounded-2xl shadow-lg shadow-indigo-200">
            <Sparkles size={20} />
          </div>
          <div>
            <h2 className="text-2xl font-black text-slate-900 tracking-tight">Showcase Académico</h2>
            <p className="text-slate-400 text-xs font-bold uppercase tracking-widest">Explora por áreas de interés</p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <button 
            onClick={prev}
            className="p-3 bg-white border border-slate-100 rounded-2xl text-slate-400 hover:text-indigo-600 hover:border-indigo-100 transition-all shadow-sm"
          >
            <ChevronLeft size={20} />
          </button>
          <button 
            onClick={next}
            className="p-3 bg-white border border-slate-100 rounded-2xl text-slate-400 hover:text-indigo-600 hover:border-indigo-100 transition-all shadow-sm"
          >
            <ChevronRight size={20} />
          </button>
        </div>
      </div>

      <div className="relative h-[500px] flex items-center justify-center">
        <AnimatePresence mode="popLayout">
          {infoCarreras.map((info, idx) => {
            if (idx !== activeIndex) return null;
            
            const logos = getLogosForCarrera(info.palabraClave);
            
            return (
              <motion.div
                key={info.id_info}
                initial={{ opacity: 0, x: 100, scale: 0.9, rotateY: 20 }}
                animate={{ opacity: 1, x: 0, scale: 1, rotateY: 0 }}
                exit={{ opacity: 0, x: -100, scale: 0.9, rotateY: -20 }}
                transition={{ type: "spring", stiffness: 260, damping: 20 }}
                className="absolute w-full max-w-5xl px-4"
              >
                <div className="relative h-[450px] bg-slate-900 rounded-[48px] overflow-hidden shadow-2xl group cursor-pointer" onClick={() => onSelect(info.palabraClave)}>
                  {/* Background Image */}
                  <div className="absolute inset-0">
                    <img 
                      src={info.imagenUrl || `https://picsum.photos/seed/${info.id_info}/1200/800`}
                      alt={info.tituloMarketing}
                      className="w-full h-full object-cover opacity-50 group-hover:scale-105 transition-transform duration-1000"
                      referrerPolicy="no-referrer"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-900/40 to-transparent" />
                  </div>

                  {/* Content */}
                  <div className="absolute inset-0 p-12 flex flex-col justify-end">
                    <div className="space-y-6 max-w-2xl">
                      <motion.div 
                        initial={{ y: 20, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ delay: 0.2 }}
                        className="flex items-center gap-3"
                      >
                        <span className="px-4 py-1.5 bg-indigo-600 text-white text-[10px] font-black uppercase tracking-widest rounded-full">
                          Área de Tendencia
                        </span>
                      </motion.div>

                      <motion.h3 
                        initial={{ y: 20, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ delay: 0.3 }}
                        className="text-4xl md:text-6xl font-black text-white tracking-tighter leading-none"
                      >
                        {info.tituloMarketing}
                      </motion.h3>

                      <motion.p 
                        initial={{ y: 20, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ delay: 0.4 }}
                        className="text-slate-300 text-lg font-bold line-clamp-2"
                      >
                        {info.descripcionBreve}
                      </motion.p>

                      <motion.div 
                        initial={{ y: 20, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ delay: 0.5 }}
                        className="flex flex-wrap items-center gap-4 pt-4"
                      >
                        <div className="flex -space-x-3">
                          {logos.map((logo, i) => (
                            <div key={i} className="w-10 h-10 rounded-full border-2 border-slate-900 bg-white p-1 overflow-hidden shadow-lg">
                              <img src={logo} alt="University" className="w-full h-full object-contain" referrerPolicy="no-referrer" />
                            </div>
                          ))}
                          {logos.length === 0 && (
                            <div className="w-10 h-10 rounded-full border-2 border-slate-900 bg-slate-800 flex items-center justify-center text-white">
                              <Building2 size={16} />
                            </div>
                          )}
                        </div>
                        <span className="text-xs font-black text-white uppercase tracking-widest bg-white/10 backdrop-blur-md px-4 py-2 rounded-xl border border-white/10">
                          {logos.length > 0 ? `+${logos.length} Instituciones` : 'Explorar Opciones'}
                        </span>
                      </motion.div>
                    </div>
                  </div>

                  {/* Decorative Elements */}
                  <div className="absolute top-12 right-12">
                    <div className="w-20 h-20 rounded-full border border-white/10 flex items-center justify-center backdrop-blur-md bg-white/5">
                      <GraduationCap className="text-white/40" size={32} />
                    </div>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      {/* Dots */}
      <div className="flex justify-center gap-2 mt-8">
        {infoCarreras.map((_, idx) => (
          <button
            key={idx}
            onClick={() => setActiveIndex(idx)}
            className={`h-1.5 rounded-full transition-all duration-500 ${
              idx === activeIndex ? 'w-12 bg-indigo-600' : 'w-2 bg-slate-200 hover:bg-slate-300'
            }`}
          />
        ))}
      </div>
    </div>
  );
};

export default ShowcaseCarousel;
