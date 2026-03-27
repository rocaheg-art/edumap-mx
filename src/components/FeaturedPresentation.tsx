import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, Star, MapPin, BookOpen, GraduationCap } from 'lucide-react';
import { Institucion, Oferta } from '../types';

interface FeaturedPresentationProps {
  items: (Institucion | Oferta)[];
  type: 'institucion' | 'oferta';
  onSelect: (item: Institucion | Oferta) => void;
}

const FeaturedPresentation: React.FC<FeaturedPresentationProps> = ({ items, type, onSelect }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [direction, setDirection] = useState(0);

  const next = React.useCallback(() => {
    setDirection(1);
    setCurrentIndex((prev) => (prev + 1) % items.length);
  }, [items.length]);

  const prev = React.useCallback(() => {
    setDirection(-1);
    setCurrentIndex((prev) => (prev - 1 + items.length) % items.length);
  }, [items.length]);

  useEffect(() => {
    const timer = setInterval(() => {
      next();
    }, 8000);
    return () => clearInterval(timer);
  }, [next]);

  if (items.length === 0) return null;

  const currentItem = items[currentIndex];

  // Helper to get properties safely
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const getProp = (item: Institucion | Oferta, prop: string): any => {
    if (type === 'institucion') {
      return (item as Institucion)[prop as keyof Institucion];
    } else {
      const oferta = item as Oferta;
      if (prop === 'nombre') return oferta.carrera_nombre;
      if (prop === 'logo_url') return oferta.escuela?.logo_url;
      if (prop === 'municipio_nombre') return oferta.escuela?.municipio_nombre;
      if (prop === 'promedio_calificacion') return oferta.escuela?.promedio_calificacion;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return (oferta as any)[prop];
    }
  };

  const variants = {
    enter: (direction: number) => ({
      x: direction > 0 ? 500 : -500,
      opacity: 0,
      scale: 0.9,
      rotateY: direction > 0 ? 45 : -45,
    }),
    center: {
      zIndex: 1,
      x: 0,
      opacity: 1,
      scale: 1,
      rotateY: 0,
    },
    exit: (direction: number) => ({
      zIndex: 0,
      x: direction < 0 ? 500 : -500,
      opacity: 0,
      scale: 0.9,
      rotateY: direction < 0 ? 45 : -45,
    }),
  };

  return (
    <div className="relative w-full h-[500px] md:h-[600px] perspective-1000 overflow-hidden rounded-[48px] bg-slate-900 group">
      <AnimatePresence initial={false} custom={direction} mode="wait">
        <motion.div
          key={currentIndex}
          custom={direction}
          variants={variants}
          initial="enter"
          animate="center"
          exit="exit"
          transition={{
            x: { type: "spring", stiffness: 300, damping: 30 },
            opacity: { duration: 0.4 },
            scale: { duration: 0.4 },
            rotateY: { duration: 0.4 }
          }}
          className="absolute inset-0 w-full h-full cursor-pointer"
          onClick={() => onSelect(currentItem)}
        >
          {/* Background Image with Overlay */}
          <div className="absolute inset-0">
            <img
              src={getProp(currentItem, 'logo_url') || `https://picsum.photos/seed/${getProp(currentItem, 'id_institucion') || getProp(currentItem, 'id_oferta')}/1200/800`}
              alt="Featured"
              className="w-full h-full object-cover opacity-60 scale-105"
              referrerPolicy="no-referrer"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-900/40 to-transparent" />
          </div>

          {/* Content */}
          <div className="absolute inset-0 p-8 md:p-16 flex flex-col justify-end">
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="space-y-6 max-w-3xl"
            >
              <div className="flex items-center gap-3">
                <span className="px-4 py-1.5 bg-indigo-600 text-white text-xs font-black uppercase tracking-widest rounded-full shadow-lg shadow-indigo-500/30">
                  Destacado
                </span>
                <div className="flex items-center gap-1 text-amber-400 bg-black/20 backdrop-blur-md px-3 py-1 rounded-full border border-white/10">
                  <Star size={14} fill="currentColor" />
                  <span className="text-sm font-bold">
                    {Number(getProp(currentItem, 'promedio_calificacion') || 4.5).toFixed(1)}
                  </span>
                </div>
              </div>

              <h2 className="text-4xl md:text-6xl font-black text-white leading-tight tracking-tighter">
                {getProp(currentItem, 'nombre')}
              </h2>

              <div className="flex flex-wrap items-center gap-6 text-slate-200">
                <div className="flex items-center gap-2 bg-white/10 backdrop-blur-md px-4 py-2 rounded-2xl border border-white/10">
                  <MapPin size={18} className="text-indigo-400" />
                  <span className="text-sm font-bold">{getProp(currentItem, 'municipio_nombre') || 'México'}</span>
                </div>
                {type === 'oferta' && (
                  <div className="flex items-center gap-2 bg-white/10 backdrop-blur-md px-4 py-2 rounded-2xl border border-white/10">
                    <GraduationCap size={18} className="text-emerald-400" />
                    <span className="text-sm font-bold">{(currentItem as Oferta).nivel_nombre}</span>
                  </div>
                )}
                {type === 'institucion' && (
                  <div className="flex items-center gap-2 bg-white/10 backdrop-blur-md px-4 py-2 rounded-2xl border border-white/10">
                    <BookOpen size={18} className="text-sky-400" />
                    <span className="text-sm font-bold">{(currentItem as Institucion).total_carreras || 12} Programas</span>
                  </div>
                )}
              </div>

              <p className="text-slate-300 text-lg md:text-xl font-medium line-clamp-2 max-w-2xl">
                {getProp(currentItem, 'descripcion') || "Explora una de las mejores opciones educativas para tu futuro profesional con programas de alta calidad."}
              </p>

              <div className="pt-4">
                <button className="px-8 py-4 bg-white text-slate-950 rounded-2xl font-black text-sm uppercase tracking-widest hover:bg-indigo-50 transition-all shadow-xl shadow-white/10 flex items-center gap-3 group/btn">
                  Explorar Ahora
                  <ChevronRight size={18} className="group-hover/btn:translate-x-1 transition-transform" />
                </button>
              </div>
            </motion.div>
          </div>
        </motion.div>
      </AnimatePresence>

      {/* Navigation Arrows */}
      <div className="absolute bottom-8 right-8 flex items-center gap-3 z-10">
        <button
          onClick={(e) => { e.stopPropagation(); prev(); }}
          className="p-4 bg-white/10 backdrop-blur-xl border border-white/20 text-white rounded-2xl hover:bg-white hover:text-slate-950 transition-all shadow-xl"
        >
          <ChevronLeft size={24} />
        </button>
        <button
          onClick={(e) => { e.stopPropagation(); next(); }}
          className="p-4 bg-white/10 backdrop-blur-xl border border-white/20 text-white rounded-2xl hover:bg-white hover:text-slate-950 transition-all shadow-xl"
        >
          <ChevronRight size={24} />
        </button>
      </div>

      {/* Progress Indicators */}
      <div className="absolute bottom-8 left-8 flex items-center gap-2 z-10">
        {items.map((_, idx) => (
          <button
            key={idx}
            onClick={(e) => { e.stopPropagation(); setCurrentIndex(idx); }}
            className={`h-1.5 rounded-full transition-all duration-500 ${
              idx === currentIndex ? 'w-12 bg-white' : 'w-2 bg-white/30 hover:bg-white/50'
            }`}
          />
        ))}
      </div>
    </div>
  );
};

export default FeaturedPresentation;
