import React from 'react';
import { motion } from 'framer-motion';
import { Users, Building2, ArrowRight, MapPin } from 'lucide-react';
import { Oferta } from '../types';
import { shortenCareerName } from '../utils/formatters';

interface CareerCardProps {
  oferta: Oferta;
}

const CareerCard: React.FC<CareerCardProps> = ({ oferta }) => {
  const solicitudes = Number(oferta.solicitudes_total || 0);
  const nuevoIngreso = Number(oferta.nuevo_ingreso_total || 0);

  // Probability calculation: (nuevo_ingreso_total / solicitudes_total) * 100
  const probabilidad = solicitudes > 0 ? (nuevoIngreso / solicitudes) * 100 : 0;

  const getSelectivityLabel = (val: number) => {
    if (val < 15) return { label: 'Muy selectiva', color: 'text-red-600', bg: 'bg-red-50', bar: 'bg-red-500' };
    if (val < 35) return { label: 'Alta demanda', color: 'text-orange-600', bg: 'bg-orange-50', bar: 'bg-orange-500' };
    if (val < 65) return { label: 'Competencia media', color: 'text-amber-600', bg: 'bg-amber-50', bar: 'bg-amber-500' };
    return { label: 'Acceso abierto', color: 'text-emerald-600', bg: 'bg-emerald-50', bar: 'bg-emerald-500' };
  };

  const selectivity = getSelectivityLabel(probabilidad);

  // Determine if public or private based on sostenimiento
  const sostenimiento = oferta.sostenimiento || '';
  const isPublica = sostenimiento.toLowerCase().includes('públic') || 
                    sostenimiento.toLowerCase().includes('public') ||
                    sostenimiento.toLowerCase().includes('federal') ||
                    sostenimiento.toLowerCase().includes('estatal');
  const tipoBadgeColor = isPublica
    ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
    : 'bg-violet-50 text-violet-700 border-violet-200';
  const tipoLabel = isPublica ? '● Pública' : '● Privada';

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      className="bg-white border border-slate-100 rounded-[24px] md:rounded-[32px] p-4 md:p-8 text-slate-900 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all group relative overflow-hidden"
    >
      {/* Background Accent */}
      <div className={`absolute top-0 right-0 w-24 md:w-32 h-24 md:h-32 ${selectivity.bg} rounded-full -mr-12 -mt-12 md:-mr-16 md:-mt-16 blur-2xl md:blur-3xl opacity-50 group-hover:scale-150 transition-transform duration-700`} />

      <div className="relative z-10">
        <div className="flex justify-between items-start mb-4 md:mb-6">
          <div className="space-y-1.5 md:space-y-2 flex-1 min-w-0">
            <div className="flex items-center gap-1.5 md:gap-2 flex-wrap">
              <span className="bg-indigo-50 text-indigo-600 text-[8px] md:text-[10px] font-black px-2 md:px-3 py-0.5 md:py-1 rounded-full uppercase tracking-widest border border-indigo-100">
                {oferta.nivel_nombre?.includes('TÉCNICO') ? 'TSU' : (oferta.nivel_nombre?.includes('NORMAL') ? 'NORMAL' : (oferta.nivel_nombre?.includes('LICENCIATURA') ? 'LICENCIATURA' : oferta.nivel_nombre))}
              </span>
              <span className={`text-[8px] md:text-[10px] font-black px-2 md:px-3 py-0.5 md:py-1 rounded-full uppercase tracking-widest border ${selectivity.bg} ${selectivity.color} border-current/20`}>
                {selectivity.label}
              </span>
              {/* Public / Private indicator */}
              {sostenimiento && (
                <span className={`text-[8px] md:text-[10px] font-black px-2 md:px-3 py-0.5 md:py-1 rounded-full border ${tipoBadgeColor}`}>
                  {tipoLabel}
                </span>
              )}
            </div>
            <h3 className="text-lg md:text-2xl font-black text-slate-900 group-hover:text-indigo-600 transition-colors leading-tight">
              {shortenCareerName(oferta.titulo_marketing || oferta.carrera_nombre)}
            </h3>
            {/* Institution + campus hierarchy */}
            <div className="space-y-0.5">
              <div className="flex items-center gap-1.5 md:gap-2 text-slate-600 font-bold text-xs md:text-sm">
                <Building2 size={13} md={15} className="text-indigo-400 shrink-0" />
                <span className="truncate">{oferta.inst_nombre}</span>
              </div>
              {oferta.escuela_nombre && oferta.escuela_nombre !== oferta.inst_nombre && (
                <div className="flex items-center gap-1.5 md:gap-2 text-slate-400 text-[10px] md:text-xs font-medium ml-0.5">
                  <MapPin size={10} md={12} className="text-slate-300 shrink-0" />
                  <span className="truncate">{oferta.escuela_nombre}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Marketing Stats */}
        <div className="grid grid-cols-2 gap-3 md:gap-4 mb-4 md:mb-8">
          <div className="bg-slate-50 rounded-2xl md:rounded-3xl p-3 md:p-5 border border-slate-100 group-hover:bg-white group-hover:border-indigo-100 transition-colors">
            <div className="text-xl md:text-3xl font-black text-slate-900 mb-0.5 md:mb-1">{probabilidad.toFixed(1)}%</div>
            <div className="text-[8px] md:text-[10px] font-black text-slate-400 uppercase tracking-widest">Probabilidad</div>
          </div>
          <div className="bg-slate-50 rounded-2xl md:rounded-3xl p-3 md:p-5 border border-slate-100 group-hover:bg-white group-hover:border-indigo-100 transition-colors">
            <div className="text-xl md:text-3xl font-black text-indigo-600 mb-0.5 md:mb-1">{nuevoIngreso}</div>
            <div className="text-[8px] md:text-[10px] font-black text-slate-400 uppercase tracking-widest">Ingresos</div>
          </div>
        </div>

        <div className="flex items-center justify-between pt-4 md:pt-6 border-t border-slate-50">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1.5 md:gap-2 text-slate-400">
              <Users size={12} md={14} />
              <span className="text-[10px] md:text-xs font-bold">{solicitudes} Solicitudes</span>
            </div>
          </div>
          <div className="flex items-center gap-1.5 md:gap-2 text-indigo-600 font-black text-[10px] md:text-xs uppercase tracking-widest group-hover:gap-3 transition-all">
            Detalles
            <ArrowRight size={14} md={16} />
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default CareerCard;
