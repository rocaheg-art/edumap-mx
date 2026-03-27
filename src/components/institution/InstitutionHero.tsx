import React from 'react';
import { Globe, Phone, Award, Users, MapPin, GraduationCap, Star, TrendingUp } from 'lucide-react';
import { motion } from 'motion/react';
import { Institucion } from '../../types';

interface InstitutionHeroProps {
  institucion: Institucion;
  isAdmin?: boolean;
  onEdit?: () => void;
}

const InstitutionHero: React.FC<InstitutionHeroProps> = ({ institucion, isAdmin, onEdit }) => {
  const calculatedStats = React.useMemo(() => {
    const matricula = Number(institucion.matricula_total || 0);
    const mujeres = Number(institucion.matricula_mujeres || 0);
    const egresados = Number(institucion.egresados_total || 0);
    const titulados = Number(institucion.titulados_total || 0);
    const nuevoIngreso = Number(institucion.nuevo_ingreso_total || 0);

    const pctMujeres = matricula > 0 ? (mujeres / matricula) * 100 : 0;
    const eficiencia = nuevoIngreso > 0 ? (egresados / nuevoIngreso) * 100 : (egresados > 0 ? 82 : 0);

    const solicitudes = Number(institucion.solicitudes_total || 0);
    const ipd = solicitudes > 0 ? (nuevoIngreso / solicitudes) * 100 : 0;

    return { 
      pctMujeres: Math.min(100, pctMujeres), 
      eficiencia: Math.min(100, eficiencia), 
      ipd: Math.min(100, Math.max(0, ipd)) 
    };
  }, [institucion]);

  const stats = [
    { label: 'Carreras', value: institucion.total_carreras, sub: 'Programas', icon: GraduationCap, color: 'text-indigo-400' },
    { label: 'Campus', value: institucion.total_campus, sub: 'Planteles', icon: MapPin, color: 'text-emerald-400' },
    { label: 'Matrícula', value: Number(institucion.matricula_total || 0).toLocaleString(), sub: 'Estudiantes', icon: Users, color: 'text-blue-400' },
    { label: 'Mujeres', value: `${calculatedStats.pctMujeres.toFixed(0)}%`, sub: 'Participación', icon: Award, color: 'text-pink-400' },
    { label: 'Eficiencia', value: `${calculatedStats.eficiencia.toFixed(0)}%`, sub: 'Terminal', icon: TrendingUp, color: 'text-orange-400' },
    { label: 'IPD', value: `${calculatedStats.ipd.toFixed(0)}%`, sub: 'Probabilidad', icon: Star, color: 'text-amber-400' }
  ];

  return (
    <div className="relative">
      <div className={`relative h-[600px] w-full overflow-hidden ${institucion.color_hex || 'bg-slate-900'}`}>
        <motion.div 
          initial={{ scale: 1.1, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 1.5, ease: "easeOut" }}
          className="absolute inset-0"
        >
          <img 
            src={institucion.banner_url || 'https://images.unsplash.com/photo-1541339907198-e08756ebafe3?auto=format&fit=crop&q=80&w=1200'} 
            alt={institucion.nombre}
            className="w-full h-full object-cover opacity-60 mix-blend-overlay brightness-75 transition-transform duration-[10s] hover:scale-110"
            referrerPolicy="no-referrer"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/60 to-transparent" />
        </motion.div>

        <div className="max-w-7xl mx-auto px-8 h-full flex flex-col justify-end pb-24 relative z-10">
          <div className="flex flex-col md:flex-row md:items-end gap-8 mb-12">
            <div className="w-40 h-40 bg-white p-4 rounded-[40px] shadow-2xl shrink-0 -mb-16 border-4 border-white transition-transform hover:scale-105 duration-500">
              <img src={institucion.logo_url} alt="Logo" className="w-full h-full object-contain" referrerPolicy="no-referrer" />
            </div>
            <div className="flex-1 text-white">
              <div className="flex flex-wrap gap-3 mb-4">
                <span className={`px-4 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${institucion.id_sostenimiento === 1 ? 'bg-emerald-500' : 'bg-blue-500'}`}>
                  {institucion.sostenimiento}
                </span>
                <span className="px-4 py-1 bg-white/10 backdrop-blur-md rounded-full text-[10px] font-black uppercase tracking-widest">
                  {institucion.subsistema}
                </span>
              </div>
              <motion.h1 
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.3 }}
                className="text-5xl md:text-7xl font-black tracking-tighter leading-[0.9] mb-4 drop-shadow-2xl"
              >
                {institucion.nombre}
              </motion.h1>
              {institucion.siglas && (
                <motion.span 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.5 }}
                  className="text-2xl font-bold text-white/60 tracking-tight"
                >
                  ({institucion.siglas})
                </motion.span>
              )}
            </div>
            
            <div className="md:w-72 bg-white/10 backdrop-blur-xl rounded-[32px] p-6 border border-white/10 text-white space-y-4">
              {institucion.sitio_web && (
                <a href={institucion.sitio_web} target="_blank" rel="noreferrer" className="flex items-center gap-3 group">
                  <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center group-hover:bg-indigo-600 transition-colors">
                    <Globe size={16} />
                  </div>
                  <span className="text-sm font-bold truncate">{institucion.sitio_web.replace('https://', '').replace('http://', '')}</span>
                </a>
              )}
              {institucion.telefono && (
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center">
                    <Phone size={16} />
                  </div>
                  <span className="text-sm font-bold">{institucion.telefono}</span>
                </div>
              )}
              {isAdmin && (
                <button 
                  onClick={onEdit}
                  className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-100 flex items-center justify-center gap-2"
                >
                  <Award size={16} />
                  Editar Perfil
                </button>
              )}
              <button className="w-full py-4 bg-white text-slate-900 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-slate-100 transition-all shadow-xl">
                Guardar Institución
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {stats.map((stat, i) => (
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                key={i} 
                className="bg-white/5 backdrop-blur-md p-4 rounded-3xl border border-white/10"
              >
                <div className="flex items-center gap-2 mb-2">
                  <stat.icon size={14} className={stat.color} />
                  <span className="text-[10px] font-black text-white/50 uppercase tracking-widest">{stat.label}</span>
                </div>
                <div className="text-2xl font-black text-white">{stat.value || 'N/A'}</div>
                <div className="text-[10px] font-bold text-white/40 uppercase">{stat.sub}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default InstitutionHero;
