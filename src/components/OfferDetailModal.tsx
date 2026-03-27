import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, 
  Map as MapIcon, 
  UserCheck, 
  GraduationCap, 
  Briefcase, 
  Star, 
  Users, 
  Heart, 
  DollarSign, 
  FileText,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Calendar
} from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  PieChart, 
  Pie, 
  Cell,
  Legend
} from 'recharts';
import { DetalleOferta, EstadisticasInclusion, EstadisticasEdad, Oferta } from '../types';
import { getOfertaDetails, getCareerAgeStats } from '../api';
import { shortenCareerName } from '../utils/formatters';

interface OfferDetailModalProps {
  oferta: Oferta;
  onClose: () => void;
}

const CHART_COLORS = {
  primary:   '#4f46e5',   // indigo-600
  secondary: '#818cf8',   // indigo-400
  muted:     '#e0e7ff',   // indigo-100
  success:   '#059669',   // emerald-600
  warning:   '#d97706',   // amber-600
  danger:    '#dc2626',   // red-600
  text:      '#1e293b',   // slate-800
  textMuted: '#94a3b8',   // slate-400
  border:    '#e2e8f0',   // slate-200
  bg:        '#f8fafc',   // slate-50
};

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-slate-200 rounded-xl p-3 shadow-lg text-xs font-bold ring-4 ring-slate-900/5">
      <p className="font-black text-slate-800 mb-2 uppercase tracking-widest">{label} años</p>
      {payload.map((p: any, i: number) => (
        <div key={i} className="flex items-center gap-2 text-slate-600 mb-1">
          <div className="w-2.5 h-2.5 rounded-full shadow-sm" style={{ background: p.fill }} />
          <span className="capitalize">{p.name}: <strong className="text-slate-900">{p.value.toLocaleString()}</strong></span>
        </div>
      ))}
    </div>
  );
};

const OfferDetailModal: React.FC<OfferDetailModalProps> = ({ oferta, onClose }) => {
  const [details, setDetails] = useState<DetalleOferta | null>(null);
  const [stats, setStats] = useState<EstadisticasInclusion | null>(null);
  const [ageStats, setAgeStats] = useState<EstadisticasEdad[]>([]);
  const [careerAgeStats, setCareerAgeStats] = useState<EstadisticasEdad[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'info' | 'curriculum' | 'stats'>('info');
  const [zoom, setZoom] = useState(1);

  useEffect(() => {
    const fetchAll = async () => {
      setLoading(true);
      try {
        const res = await getOfertaDetails(oferta.id_oferta);
        setDetails(res.detalles);
        setStats(res.estadisticas);
        setAgeStats(res.estadisticasEdad);
        
        const cStats = await getCareerAgeStats(oferta.id_carrera);
        setCareerAgeStats(cStats);
      } catch (error) {
        console.error('Error fetching offer details:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchAll();
  }, [oferta.id_oferta, oferta.id_carrera]);

  const COLORS = [CHART_COLORS.primary, CHART_COLORS.secondary, CHART_COLORS.success, CHART_COLORS.warning, '#8b5cf6', '#ec4899'];

  const inclusionData = stats ? [
    { name: 'Discapacidad', value: (stats.matricula_disc_m || 0) + (stats.matricula_disc_h || 0) },
    { name: 'Lengua Indígena', value: (stats.matricula_li_m || 0) + (stats.matricula_li_h || 0) },
    { name: 'Becados', value: stats.becas_total || 0 }
  ].filter(d => d.value > 0) : [];

  const displayAgeStats = ageStats.length > 0 ? ageStats : careerAgeStats;
  
  const ageData = displayAgeStats.map(s => ({
    rango: s.rango_edad,
    mujeres: s.matricula_mujeres,
    hombres: s.matricula_hombres,
    total: s.matricula_mujeres + s.matricula_hombres
  }));

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[2000] flex items-center justify-center p-4 md:p-8 bg-slate-900/60 backdrop-blur-sm"
      onClick={onClose}
    >
      <motion.div 
        initial={{ scale: 0.9, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.9, y: 20 }}
        className="bg-white w-full max-w-6xl max-h-[90vh] rounded-[48px] shadow-2xl overflow-hidden flex flex-col border border-white/20"
        onClick={e => e.stopPropagation()}
      >
        <div className="p-8 border-b border-slate-100 flex items-center justify-between bg-white relative">
          <div className="flex items-center gap-6">
            <div className="w-16 h-16 bg-slate-900 text-white rounded-[24px] shadow-2xl flex items-center justify-center">
              <GraduationCap size={32} />
            </div>
            <div>
              <h2 className="text-3xl font-black text-slate-900 leading-none mb-2">{shortenCareerName(oferta.carrera_nombre)}</h2>
              <div className="flex items-center gap-3 flex-wrap">
                <span className="px-3 py-1 bg-slate-100 rounded-full text-[10px] font-black uppercase tracking-widest text-slate-500">{oferta.inst_nombre}</span>
                {oferta.escuela_nombre && oferta.escuela_nombre !== oferta.inst_nombre && (
                  <span className="px-3 py-1 bg-slate-50 rounded-full text-[10px] font-bold tracking-wide text-slate-400 border border-slate-200">
                    📍 {oferta.escuela_nombre}
                  </span>
                )}
                <span className="px-3 py-1 bg-indigo-50 rounded-full text-[10px] font-black uppercase tracking-widest text-indigo-600">{oferta.modalidad_nombre}</span>
                {oferta.sostenimiento && (
                  <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border ${
                    (oferta.sostenimiento.toLowerCase().includes('p\u00fablica') || oferta.sostenimiento.toLowerCase().includes('publica') || oferta.sostenimiento.toLowerCase().includes('federal') || oferta.sostenimiento.toLowerCase().includes('estatal'))
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                      : 'bg-violet-50 text-violet-700 border-violet-200'
                  }`}>
                    {(oferta.sostenimiento.toLowerCase().includes('p\u00fablica') || oferta.sostenimiento.toLowerCase().includes('publica') || oferta.sostenimiento.toLowerCase().includes('federal') || oferta.sostenimiento.toLowerCase().includes('estatal')) ? '● Pública' : '● Privada'}
                  </span>
                )}
              </div>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="w-12 h-12 flex items-center justify-center hover:bg-slate-100 rounded-full text-slate-400 hover:text-slate-900 transition-all"
          >
            <X size={24} />
          </button>
        </div>

        <div className="flex border-b border-slate-100 px-8 bg-white/80 backdrop-blur-md sticky top-0 z-10">
          {[
            { id: 'info', label: 'Información', icon: FileText },
            { id: 'curriculum', label: 'Plan de Estudios', icon: MapIcon },
            { id: 'stats', label: 'Cifras y Perfil', icon: Users },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-8 py-5 text-xs font-black uppercase tracking-wider transition-all border-b-4 ${
                activeTab === tab.id 
                  ? 'border-indigo-600 text-slate-900' 
                  : 'border-transparent text-slate-400 hover:text-slate-600'
              }`}
            >
              <tab.icon size={16} />
              {tab.label}
            </button>
          ))}
        </div>

        <div className="flex-1 overflow-y-auto p-12 custom-scrollbar space-y-12">
          {loading ? (
            <div className="flex flex-col items-center justify-center h-96 space-y-6">
              <div className="w-16 h-16 border-4 border-slate-900 border-t-transparent rounded-full animate-spin" />
              <p className="text-slate-400 font-black uppercase tracking-[0.2em] text-xs">Analizando Datos Profesionales...</p>
            </div>
          ) : (
            <AnimatePresence mode="wait">
              {activeTab === 'info' && (
                <motion.div 
                  key="info"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="grid grid-cols-1 lg:grid-cols-2 gap-12"
                >
                  <div className="space-y-12">
                    <section className="space-y-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center">
                          <UserCheck size={20} />
                        </div>
                        <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight">Capacidades de Ingreso</h3>
                      </div>
                      <div className="bg-slate-50 p-8 rounded-[40px] border border-slate-100 text-slate-600 leading-relaxed font-medium">
                        {details?.perfil_ingreso || "Preparación académica integral con vocación de servicio y pensamiento analítico para el éxito profesional."}
                      </div>
                    </section>

                    <section className="space-y-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center">
                          <GraduationCap size={20} />
                        </div>
                        <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight">Competencias de Egreso</h3>
                      </div>
                      <div className="bg-slate-50 p-8 rounded-[40px] border border-slate-100 text-slate-600 leading-relaxed font-medium">
                        {details?.perfil_egreso || "Gestión de proyectos complejos y liderazgo estratégico basado en evidencia científica y ética profesional."}
                      </div>
                    </section>
                  </div>

                  <div className="space-y-12">
                    <section className="space-y-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-amber-50 text-amber-600 rounded-xl flex items-center justify-center">
                          <Briefcase size={20} />
                        </div>
                        <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight">Inserción Laboral</h3>
                      </div>
                      <div className="bg-slate-50 p-8 rounded-[40px] border border-slate-100 text-slate-600 leading-relaxed font-medium">
                        {details?.campo_laboral || "Entornos corporativos de alto impacto, instituciones especializadas y oportunidades de emprendimiento global."}
                      </div>
                    </section>

                    <div className="grid grid-cols-2 gap-6">
                      <div className="p-8 bg-indigo-600 rounded-[40px] text-white shadow-2xl shadow-indigo-200 group">
                        <DollarSign className="mb-4 group-hover:scale-110 transition-transform" size={32} />
                        <div className="text-[10px] font-black text-indigo-200 uppercase tracking-widest mb-1">Inversión Estimada</div>
                        <div className="text-2xl font-black">{details?.costos_estimados || 'Variable'}</div>
                      </div>
                      <div className="p-8 bg-emerald-500 rounded-[40px] text-white shadow-2xl shadow-emerald-200 group">
                        <Star className="mb-4 group-hover:rotate-45 transition-transform" size={32} />
                        <div className="text-[10px] font-black text-emerald-100 uppercase tracking-widest mb-1">Duración Plan</div>
                        <div className="text-2xl font-black">{oferta.duracion || '4-5 años'}</div>
                      </div>
                    </div>

                  {/* Institution Link Card */}
                  <div className="col-span-2 p-8 bg-indigo-600 rounded-[40px] text-white flex items-center justify-between gap-6 group hover:bg-indigo-500 transition-colors cursor-pointer"
                    onClick={() => window.open(`/#/instituciones/${oferta.id_institucion}`, '_self')}
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center text-2xl shrink-0">🏫</div>
                      <div>
                        <p className="text-[10px] font-black uppercase tracking-widest text-indigo-200 mb-0.5">Conoce más sobre</p>
                        <p className="font-black text-lg leading-tight">{oferta.inst_nombre}</p>
                        <p className="text-indigo-200 text-xs font-bold mt-0.5">Perfil completo · Campus · Galería · Reviews</p>
                      </div>
                    </div>
                    <div className="shrink-0 w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center group-hover:translate-x-1 transition-transform">
                      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7"/></svg>
                    </div>
                  </div>
                  </div>
                </motion.div>
              )}

              {activeTab === 'curriculum' && (
                <motion.div 
                  key="curriculum"
                  initial={{ opacity: 0, scale: 0.98 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.98 }}
                  className="space-y-8"
                >
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <h3 className="text-2xl font-black text-slate-900 uppercase tracking-tight">Ruta Formativa</h3>
                      <p className="text-slate-400 text-xs font-bold uppercase tracking-widest">Organización semestral de materias</p>
                    </div>
                    <div className="flex gap-2 p-2 bg-slate-100 rounded-2xl">
                      <button onClick={() => setZoom(z => Math.max(0.5, z - 0.2))} className="p-3 hover:bg-white rounded-xl text-slate-600 transition-all"><ZoomOut size={20} /></button>
                      <button onClick={() => setZoom(1)} className="px-6 hover:bg-white rounded-xl text-slate-900 font-bold text-[10px] uppercase tracking-widest transition-all">100%</button>
                      <button onClick={() => setZoom(z => Math.min(3, z + 0.2))} className="p-3 hover:bg-white rounded-xl text-slate-600 transition-all"><ZoomIn size={20} /></button>
                    </div>
                  </div>
                  
                  <div className="relative overflow-auto bg-slate-50 rounded-[48px] border-4 border-slate-100 min-h-[600px] flex items-center justify-center p-12 custom-scrollbar shadow-inner">
                    <motion.div animate={{ scale: zoom }} className="origin-center shadow-2xl rounded-3xl overflow-hidden ring-8 ring-white">
                      {details?.mapa_curricular_url ? (
                        <img 
                          src={details.mapa_curricular_url} 
                          alt="Mapa Curricular" 
                          className="max-w-[1200px]"
                          referrerPolicy="no-referrer"
                        />
                      ) : (
                        <div className="bg-white p-24 text-center space-y-6">
                          <div className="w-24 h-24 bg-slate-100 rounded-full flex items-center justify-center mx-auto text-slate-300">
                            <MapIcon size={48} />
                          </div>
                          <div>
                            <p className="text-slate-900 font-black uppercase tracking-widest mb-1">Documento en Trámite</p>
                            <p className="text-slate-400 text-sm font-medium">El plan de estudios detallado estará disponible próximamente.</p>
                          </div>
                        </div>
                      )}
                    </motion.div>
                  </div>
                </motion.div>
              )}

              {activeTab === 'stats' && (
                <motion.div 
                  key="stats"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-12"
                >
                  {/* Age Chart - Professional Refinement */}
                  <div className="bg-white rounded-[40px] p-10 border border-slate-100 shadow-sm space-y-10 group">
                    <div className="flex justify-between items-end">
                      <div className="space-y-2">
                        <div className="flex items-center gap-3">
                           <div className="w-10 h-10 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center">
                             <Users size={20} />
                           </div>
                           <h4 className="text-2xl font-black text-slate-900 uppercase tracking-tight">Perfil Demográfico</h4>
                        </div>
                        <p className="text-slate-400 text-[10px] font-black uppercase tracking-[0.2em] ml-13">Distribución por rangos de edad y género</p>
                      </div>
                      <div className="flex gap-6 mb-2">
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 rounded-full bg-indigo-600" />
                          <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Hombres</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 rounded-full bg-indigo-400" />
                          <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Mujeres</span>
                        </div>
                      </div>
                    </div>

                    <div className="h-80 w-full">
                      {ageData.length > 0 ? (
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={ageData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={CHART_COLORS.border} />
                            <XAxis 
                              dataKey="rango" 
                              axisLine={false} 
                              tickLine={false} 
                              tick={{ fontSize: 11, fill: CHART_COLORS.textMuted, fontWeight: 700 }} 
                            />
                            <YAxis 
                              axisLine={false} 
                              tickLine={false} 
                              tick={{ fontSize: 11, fill: CHART_COLORS.textMuted, fontWeight: 700 }} 
                            />
                            <Tooltip content={<CustomTooltip />} />
                            <Bar dataKey="hombres" name="Hombres" fill={CHART_COLORS.primary} radius={[6, 6, 0, 0]} barSize={24} />
                            <Bar dataKey="mujeres" name="Mujeres" fill={CHART_COLORS.secondary} radius={[6, 6, 0, 0]} barSize={24} />
                          </BarChart>
                        </ResponsiveContainer>
                      ) : (
                        <div className="h-full flex flex-col items-center justify-center text-slate-300 space-y-4">
                          <Users size={64} className="opacity-10" />
                          <p className="font-black text-xs uppercase tracking-[0.3em]">Sin registros demográficos</p>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* Inclusion Chart */}
                    <div className="p-10 bg-white rounded-[40px] border border-slate-100 shadow-sm flex flex-col">
                      <div className="flex items-center gap-3 mb-8">
                         <div className="w-10 h-10 bg-rose-50 text-rose-600 rounded-xl flex items-center justify-center">
                           <Heart size={20} />
                         </div>
                         <h4 className="text-xl font-black text-slate-900 uppercase tracking-tight">Inclusión Global</h4>
                      </div>
                      
                      <div className="flex-1 flex items-center">
                        {inclusionData.length > 0 ? (
                          <div className="h-64 w-full">
                            <ResponsiveContainer width="100%" height="100%">
                              <PieChart>
                                <Pie
                                  data={inclusionData}
                                  innerRadius={70}
                                  outerRadius={90}
                                  paddingAngle={8}
                                  dataKey="value"
                                >
                                  {inclusionData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} cornerRadius={4} />
                                  ))}
                                </Pie>
                                <Tooltip content={<CustomTooltip />} />
                                <Legend verticalAlign="bottom" align="center" iconType="circle" wrapperStyle={{ fontSize: '10px', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.1em', paddingTop: '20px' }} />
                              </PieChart>
                            </ResponsiveContainer>
                          </div>
                        ) : (
                          <div className="h-64 w-full flex items-center justify-center text-slate-400 font-bold text-xs uppercase tracking-widest text-center px-12 italic">
                            Información de diversidad no disponible para este periodo
                          </div>
                        )}
                      </div>
                    </div>
                    
                    {/* Competition / Probability Card */}
                    <div className="p-10 bg-slate-900 rounded-[40px] text-white flex flex-col justify-between items-center text-center relative overflow-hidden group">
                       <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/20 to-emerald-500/20 opacity-0 group-hover:opacity-100 transition-opacity" />
                       <div className="p-5 bg-white/10 rounded-[20px] mb-6 relative z-10 transition-transform group-hover:scale-110">
                         <Star className="text-amber-400 fill-amber-400" size={40} />
                       </div>
                       <div className="space-y-4 relative z-10">
                         <div className="text-6xl font-black tracking-tighter shadow-indigo-500/50 drop-shadow-[0_0_15px_rgba(99,102,241,0.5)]">
                           {((Number(oferta.nuevo_ingreso_total || 0) / Math.max(1, Number(oferta.solicitudes_total || 0))) * 100).toFixed(0)}%
                         </div>
                         <div className="space-y-1">
                           <p className="text-indigo-400 text-xs font-black uppercase tracking-[0.2em]">Competitividad Académica</p>
                           <p className="text-white/60 text-[10px] font-bold uppercase tracking-widest">Probabilidad de Ingreso (IPD)</p>
                         </div>
                       </div>
                       <div className="mt-8 pt-8 border-t border-white/10 w-full relative z-10">
                         <p className="text-white font-black text-sm uppercase tracking-widest">{oferta.solicitudes_total?.toLocaleString() || '0'}</p>
                         <p className="text-white/40 text-[9px] font-bold uppercase tracking-[0.2em] mt-1">Solicitudes Totales</p>
                       </div>
                    </div>
                  </div>

                  {/* Core Stats Grid */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                    {[
                      { label: 'Matrícula', value: oferta.matricula_total?.toLocaleString(), color: 'text-indigo-600', sub: 'Total' },
                      { label: 'Ingresos', value: oferta.nuevo_ingreso_total?.toLocaleString(), color: 'text-emerald-600', sub: 'Actual' },
                      { label: 'Egresados', value: oferta.egresados_total?.toLocaleString(), color: 'text-amber-600', sub: 'Ciclo' },
                      { label: 'Titulados', value: oferta.titulados_total?.toLocaleString(), color: 'text-rose-600', sub: 'Exitosos' },
                    ].map((s) => (
                      <div key={s.label} className="p-8 bg-slate-50 rounded-[32px] border border-slate-100 hover:border-indigo-200 transition-all group">
                        <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 group-hover:text-indigo-400 transition-colors">{s.label}</div>
                        <div className={`text-3xl font-black ${s.color}`}>{s.value || '0'}</div>
                        <div className="text-[9px] font-bold text-slate-300 uppercase mt-1">{s.sub}</div>
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          )}
        </div>

        <div className="p-8 border-t border-slate-100 bg-slate-50/50 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-4 text-xs text-slate-400 font-bold uppercase tracking-widest">
            <Calendar size={14} className="text-indigo-400" />
            Fuente: ANUIES • Ciclo {oferta.anio_ciclo || '2023-2024'}
          </div>
          <div className="flex items-center gap-4 w-full md:w-auto">
            <button 
              onClick={onClose}
              className="px-8 py-4 text-slate-600 font-black text-[10px] uppercase tracking-widest hover:bg-slate-200 rounded-2xl transition-all"
            >
              Cerrar
            </button>
            <button className="flex-1 md:flex-none px-10 py-4 bg-indigo-600 text-white font-black text-[10px] uppercase tracking-widest rounded-2xl hover:bg-slate-900 transition-all shadow-2xl shadow-indigo-100">
              Postularme / Informes
            </button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default OfferDetailModal;
