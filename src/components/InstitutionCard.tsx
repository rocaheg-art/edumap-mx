import React from 'react';
import { motion } from 'motion/react';
import { Institucion } from '../types';

interface InstitutionCardProps {
  institucion: Institucion;
  stats?: {
    campus: number;
    carreras: number;
    matricula: number;
    egresados: number;
    titulados: number;
    ici_promedio: number;
  };
  variant: 'A' | 'B';
}

const InstitutionCard: React.FC<InstitutionCardProps> = ({ institucion, variant }) => {
  const campus = Number(institucion.total_campus || 0);
  const carreras = Number(institucion.total_ofertas || institucion.total_carreras || 0);
  const matricula = Number(institucion.matricula_total || 0);
  const nuevoIngreso = Number(institucion.nuevo_ingreso_total || 0);
  const solicitudes = Number(institucion.solicitudes_total || 0);
  
  const egresados = Number(institucion.egresados_total || 0);
  const titulados = Number(institucion.titulados_total || 0);
  
  // Institutional IPD is the weighted average: (SUM(nuevo_ingreso) / SUM(solicitudes)) * 100
  const ipd = solicitudes > 0 ? (nuevoIngreso / solicitudes) * 100 : 0;
  const eficienciaPromedio = Number(institucion.eficiencia_promedio || 82);

  const getSelectivityLabel = (val: number) => {
    if (val < 20) return { label: 'Muy selectiva', color: 'text-red-600', bg: 'bg-red-50', bar: 'bg-red-500' };
    if (val < 40) return { label: 'Alta demanda', color: 'text-orange-600', bg: 'bg-orange-50', bar: 'bg-orange-500' };
    if (val < 70) return { label: 'Competencia media', color: 'text-amber-600', bg: 'bg-amber-50', bar: 'bg-amber-500' };
    return { label: 'Acceso abierto', color: 'text-emerald-600', bg: 'bg-emerald-50', bar: 'bg-emerald-500' };
  };

  const selectivity = getSelectivityLabel(ipd);

  if (variant === 'A') {
    return (
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        whileInView={{ opacity: 1, scale: 1 }}
        viewport={{ once: true }}
        className="relative bg-white border border-slate-200 rounded-[24px] overflow-hidden text-slate-900 shadow-sm hover:shadow-md transition-all group"
      >
        {/* Institutional Color Strip */}
        <div 
          className="h-1.5 w-full" 
          style={{ backgroundColor: institucion.color_hex || '#4F46E5' }}
        />
        
        <div className="p-6">
          <div className="flex items-center gap-4 mb-8">
            <div className="w-14 h-14 bg-white border border-slate-100 rounded-2xl flex items-center justify-center p-2 shadow-sm shrink-0">
              <img 
                src={institucion.logo_url || `https://picsum.photos/seed/${institucion.id_institucion}/200/200`} 
                alt={institucion.siglas}
                className="w-full h-full object-contain"
                referrerPolicy="no-referrer"
              />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-lg font-bold text-slate-900 group-hover:text-indigo-600 transition-colors leading-tight truncate">
                {institucion.nombre}
              </h3>
              <p className="text-slate-500 text-sm font-medium">
                {institucion.sostenimiento} • {institucion.subsistema || 'Nacional'}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3 mb-8">
            <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100">
              <div className="text-2xl font-black text-slate-900 mb-1">{campus}</div>
              <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Campus</div>
            </div>
            <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100">
              <div className="text-2xl font-black text-slate-900 mb-1">{carreras}</div>
              <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Carreras</div>
            </div>
            <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100">
              <div className="text-2xl font-black text-indigo-600 mb-1">{(matricula / 1000).toFixed(0)}K</div>
              <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Matrícula</div>
            </div>
          </div>

          <div className="mb-8">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">IPD promedio</span>
              <span className={`text-[10px] font-bold px-3 py-1 rounded-full ${selectivity.bg} ${selectivity.color} border border-current/20`}>
                {selectivity.label}
              </span>
            </div>
            <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden mb-2">
              <motion.div 
                initial={{ width: 0 }}
                whileInView={{ width: `${ipd}%` }}
                transition={{ duration: 1, ease: "easeOut" }}
                className={`h-full bg-indigo-500`}
              />
            </div>
            <div className="flex justify-between text-[10px] font-bold text-slate-500 uppercase tracking-widest">
              <span>0%</span>
              <span className={selectivity.color}>{ipd.toFixed(1)}% IPD Promedio</span>
              <span>100%</span>
            </div>
          </div>

          <div className="flex gap-2">
            {['Escolarizada', 'En línea', 'Posgrado'].map((tag) => (
              <div key={tag} className="bg-slate-50 px-3 py-1.5 rounded-xl text-[10px] font-bold text-slate-600 border border-slate-100">
                {tag}
              </div>
            ))}
          </div>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.95 }}
      whileInView={{ opacity: 1, scale: 1 }}
      viewport={{ once: true }}
      className="bg-white border border-slate-200 rounded-[24px] p-6 text-slate-900 shadow-sm hover:shadow-md transition-all group"
    >
      <div className="flex items-center gap-4 mb-8">
        <div className="w-14 h-14 bg-white border border-slate-100 rounded-2xl flex items-center justify-center p-2 shadow-sm shrink-0">
          <img 
            src={institucion.logo_url || `https://picsum.photos/seed/${institucion.id_institucion}/200/200`} 
            alt={institucion.siglas}
            className="w-full h-full object-contain"
            referrerPolicy="no-referrer"
          />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-lg font-bold text-slate-900 group-hover:text-emerald-600 transition-colors leading-tight truncate">
            {institucion.nombre}
          </h3>
          <div className="flex gap-2 mt-1">
            <span className="bg-slate-50 text-slate-600 text-[10px] font-bold px-2 py-0.5 rounded-md border border-slate-100">
              {institucion.sostenimiento}
            </span>
            <span className="bg-slate-50 text-slate-600 text-[10px] font-bold px-2 py-0.5 rounded-md border border-slate-100">
              {institucion.subsistema || 'Nacional'}
            </span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-4">
        <div className="bg-slate-50 rounded-2xl p-5 border border-slate-100">
          <div className="text-2xl font-black text-slate-900 mb-1">{campus}</div>
          <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Campus</div>
        </div>
        <div className="bg-slate-50 rounded-2xl p-5 border border-slate-100">
          <div className="text-2xl font-black text-slate-900 mb-1">{carreras}</div>
          <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Carreras</div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3 mb-8">
        <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100">
          <div className="text-xl font-black text-slate-900 mb-1">{(matricula / 1000).toFixed(1)}K</div>
          <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Matrícula</div>
        </div>
        <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100">
          <div className="text-xl font-black text-emerald-600 mb-1">{(egresados / 1000).toFixed(1)}K</div>
          <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Egresados</div>
        </div>
        <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100">
          <div className="text-xl font-black text-indigo-600 mb-1">{titulados}</div>
          <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Titulados</div>
        </div>
      </div>

      <div className="pt-6 border-t border-slate-100">
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Eficiencia terminal</span>
          <span className="text-xs font-black text-emerald-600">{eficienciaPromedio.toFixed(1)}%</span>
        </div>
        <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
          <motion.div 
            initial={{ width: 0 }}
            whileInView={{ width: `${eficienciaPromedio}%` }}
            transition={{ duration: 1, ease: "easeOut" }}
            className="h-full bg-emerald-500"
          />
        </div>
      </div>
    </motion.div>
  );
};

export default InstitutionCard;
