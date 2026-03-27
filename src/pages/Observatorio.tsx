import React, { useState, useEffect, useMemo, useRef } from 'react';
import { motion, AnimatePresence, useScroll, useTransform, useSpring } from 'motion/react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  ScatterChart, Scatter, ZAxis, Cell, PieChart, Pie, Legend,
  LineChart, Line, Area, AreaChart, ReferenceLine, ComposedChart,
  Treemap
} from 'recharts';
import { 
  Users, GraduationCap, School, Map as MapIcon, Globe, 
  TrendingUp, Activity, Award, Brain, 
  ChevronRight, ArrowRight, ArrowDown, Info, 
  MapPin, Clock, Filter, Layers, Target, BookOpen,
  MousePointer2
} from 'lucide-react';

import MapModule from '../components/Observatorio/MapModule';

// --- Types ---
interface StatsData {
  counters: {
    total_estudiantes: string;
    total_instituciones: number;
    total_programas: number;
    total_estados: number;
    pct_mujeres: string;
  };
  v1_densidad: any[];
  v2_genero: any[];
  v3_sostenimiento: any[];
  v4_dificultad: any[];
  v5_edad: any[];
  v6_flujo: {
    solicitudes: string | number;
    admitidos: string | number;
    matricula: string | number;
    egresados: string | number;
    titulados: string | number;
  };
  v7_inclusion: any[];
  map_heatmap: any[];
  map_gender: any[];
  map_institutions: any[];
  map_access: any[];
  map_inclusion: any[];
  map_efficiency: any[];
}

// --- Colors & Constants ---
const COLORS = {
  bg: '#ffffff', // Light background
  card: '#f9fafb', // Gray-50
  accent: '#7c3aed', // Morado
  secondary: '#0891b2', // Cyan-600
  warning: '#ea580c', // Orange-600
  error: '#dc2626', // Red-600
  success: '#16a34a', // Green-600
  text: '#111827', // Gray-900
  textMuted: '#4b5563', // Gray-600
  border: '#e5e7eb', // Gray-200
};

const CHART_COLORS = [COLORS.accent, COLORS.secondary, COLORS.warning, '#db2777', '#7c3aed', '#0d9488', '#e11d48'];

// --- Components ---

const AnimatedCounter = ({ value, label, icon: Icon, color }: any) => {
  const [count, setCount] = useState(0);
  const target = parseFloat(typeof value === 'string' ? value.replace(/,/g, '') : value);

  useEffect(() => {
    let startTime: number;
    const duration = 2000;
    
    const step = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / duration, 1);
      const easeOut = 1 - Math.pow(1 - progress, 3);
      setCount(easeOut * target);
      if (progress < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }, [target]);

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      className="flex flex-col items-center justify-center p-6 bg-gray-50 border border-gray-100 rounded-3xl"
    >
      <div className="p-4 rounded-2xl mb-4" style={{ backgroundColor: `${color}15`, color }}>
        <Icon size={24} />
      </div>
      <div className="text-3xl md:text-4xl font-black mb-1" style={{ color }}>
        {target > 1000 ? Math.floor(count).toLocaleString() : count.toFixed(1)}{target > 100 && target < 101 ? '%' : ''}
      </div>
      <div className="text-[10px] font-bold uppercase tracking-widest text-gray-400">{label}</div>
    </motion.div>
  );
};

const SectionHeader = ({ badge, title, highlight, description, color }: any) => (
  <div className="max-w-4xl mx-auto mb-16 text-center">
    <motion.span 
      initial={{ opacity: 0, scale: 0.8 }}
      whileInView={{ opacity: 1, scale: 1 }}
      className="inline-block px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-[0.2em] mb-6 border"
      style={{ borderColor: `${color}40`, color, backgroundColor: `${color}10` }}
    >
      {badge}
    </motion.span>
    <motion.h2 
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      className="text-5xl md:text-7xl font-black tracking-tighter mb-6 leading-[0.9] text-gray-900"
    >
      {title} <br />
      <span className="text-transparent bg-clip-text" style={{ backgroundImage: `linear-gradient(to right, ${color}, ${color}90)` }}>
        {highlight}
      </span>
    </motion.h2>
    <motion.p 
      initial={{ opacity: 0 }}
      whileInView={{ opacity: 1 }}
      className="text-lg text-gray-500 font-medium leading-relaxed max-w-2xl mx-auto"
    >
      {description}
    </motion.p>
  </div>
);

const SurprisingFact = ({ fact, color }: any) => (
  <motion.div 
    initial={{ opacity: 0, x: -50 }}
    whileInView={{ opacity: 1, x: 0 }}
    viewport={{ margin: "-100px" }}
    className="relative pl-12 mb-20 group"
  >
    <div className="absolute left-0 top-0 bottom-0 w-1.5 rounded-full overflow-hidden bg-gray-100">
      <motion.div 
        initial={{ height: 0 }}
        whileInView={{ height: '100%' }}
        transition={{ duration: 1.5, ease: "easeInOut" }}
        className="w-full"
        style={{ backgroundColor: color }}
      />
    </div>
    <div className="text-base font-black uppercase tracking-[0.3em] mb-4" style={{ color }}>
      Dato Sorprendente
    </div>
    <div className="text-4xl md:text-6xl font-black tracking-tighter leading-[1] text-gray-900">
      {fact}
    </div>
  </motion.div>
);

const ChartContainer = ({ children, height = 400 }: any) => (
  <motion.div 
    initial={{ opacity: 0, y: 40 }}
    whileInView={{ opacity: 1, y: 0 }}
    className="bg-gray-50 border border-gray-100 rounded-[48px] p-8 md:p-12 shadow-sm overflow-hidden relative"
  >
    <div className="h-full w-full" style={{ height }}>
      {children}
    </div>
  </motion.div>
);

// --- Custom Butterfly Chart ---
const ButterflyChart = ({ data, onSelect }: any) => {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart
        data={data}
        layout="vertical"
        stackOffset="sign"
        margin={{ top: 5, right: 30, left: 40, bottom: 5 }}
      >
        <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f3f4f6" />
        <XAxis type="number" hide />
        <YAxis 
          dataKey="campo_amplio" 
          type="category" 
          width={150} 
          tick={{ fill: '#6b7280', fontSize: 10, fontWeight: 700 }} 
          axisLine={false}
          tickLine={false}
        />
        <Tooltip 
          cursor={{ fill: '#f3f4f6' }}
          contentStyle={{ backgroundColor: '#fff', border: '1px solid #e5e7eb', borderRadius: '12px', fontSize: '10px', color: '#111827' }}
          itemStyle={{ color: '#111827' }}
          formatter={(value: any, name: string) => [Math.abs(value).toLocaleString(), name]}
        />
        <Bar dataKey="mujeres_neg" name="Mujeres" fill="#db2777" radius={[4, 0, 0, 4]} barSize={20} onClick={(d) => onSelect?.(d)} />
        <Bar dataKey="hombres" name="Hombres" fill="#0891b2" radius={[0, 4, 4, 0]} barSize={20} onClick={(d) => onSelect?.(d)} />
        <Legend />
      </BarChart>
    </ResponsiveContainer>
  );
};

const Observatorio: React.FC = () => {
  const [data, setData] = useState<StatsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [v2Selected, setV2Selected] = useState<any | null>(null);
  const [v3Type, setV3Type] = useState<'instituciones' | 'matricula'>('instituciones');
  const [v7Type, setV7Type] = useState<'lenguas_indigenas' | 'discapacidad'>('lenguas_indigenas');
  const [v4FilterCA, setV4FilterCA] = useState('todos');
  const [v4RankType, setV4RankType] = useState<'carrera' | 'area'>('carrera');
  const [v4Sostenimiento, setV4Sostenimiento] = useState<'PÚBLICO' | 'PARTICULAR'>('PÚBLICO');

  useEffect(() => {
    fetch('/observatorio_data.json')
      .then(r => r.json())
      .then(d => {
        setData(d);
        setLoading(false);
      });
  }, []);

  const v2Processed = useMemo(() => {
    if (!data) return [];
    return data.v2_genero.map(d => ({
      ...d,
      mujeres_neg: -Number(d.mujeres),
      hombres: Number(d.hombres),
      pct_mujeres: (Number(d.mujeres) / Number(d.total) * 100).toFixed(1)
    }));
  }, [data]);

  const v2DetailProcessed = useMemo(() => {
    if (!v2Selected) return [];
    return v2Selected.subs.map((s: any) => ({
      ...s,
      mujeres_neg: -Number(s.mujeres),
      hombres: Number(s.hombres),
      campo_amplio: s.campo_especifico // Reusing axis key
    }));
  }, [v2Selected]);

  const v3Processed = useMemo(() => {
    if (!data) return [];
    return [...data.v3_sostenimiento].sort((a, b) => b.pct_publico_inst - a.pct_publico_inst);
  }, [data]);

  const v4Processed = useMemo(() => {
    if (!data) return [];
    let filtered = data.v4_dificultad.filter(d => d.sostenimiento === v4Sostenimiento);
    if (v4FilterCA !== 'todos') {
      filtered = filtered.filter(d => d.campo_amplio === v4FilterCA);
    }
    return filtered.slice(0, 50).map(d => ({
        ...d,
        id: v4RankType === 'carrera' ? d.carrera : d.campo_amplio,
        size: Math.sqrt(d.matricula) * 2
    }));
  }, [data, v4FilterCA, v4RankType, v4Sostenimiento]);

  const v4RankedData = useMemo(() => {
    if (!data) return [];
    const base = data.v4_dificultad.filter(d => d.sostenimiento === v4Sostenimiento);
    if (v4RankType === 'carrera') {
      return [...base]
        .sort((a, b) => b.ratio - a.ratio)
        .slice(0, 10);
    } else {
      // Aggregate by Area
      const areas: Record<string, { name: string, totalRatio: number, count: number, entidad: string }> = {};
      base.forEach(d => {
        if (!areas[d.campo_amplio]) {
          areas[d.campo_amplio] = { name: d.campo_amplio, totalRatio: 0, count: 0, entidad: 'Nacional' };
        }
        areas[d.campo_amplio].totalRatio += d.ratio;
        areas[d.campo_amplio].count += 1;
      });
      return Object.values(areas)
        .map(a => ({ carrera: a.name, ratio: a.totalRatio / a.count, entidad: a.entidad }))
        .sort((a, b) => b.ratio - a.ratio)
        .slice(0, 10);
    }
  }, [data, v4RankType, v4Sostenimiento]);

  const v5Processed = useMemo(() => {
    if (!data) return [];
    // Just showing "ESCOLARIZADA" as representative for the pyramid
    const filtered = data.v5_edad.filter(d => d.modalidad === 'ESCOLARIZADA');
    return filtered.map(d => ({
        ...d,
        mujeres_neg: -Number(d.mujeres),
        hombres: Number(d.hombres)
    })).sort((a,b) => {
        const order = ['17 y menores','18','19','20','21','22','23','24','25','26-29','30-34','35-39','40+'];
        return order.indexOf(a.edad) - order.indexOf(b.edad);
    });
  }, [data]);

  const v7Processed = useMemo(() => {
    if (!data) return [];
    return data.v7_inclusion.map(r => ({
      name: r.entidad,
      value: v7Type === 'lenguas_indigenas' ? Number(r.lenguas_indigenas) : Number(r.discapacidad),
      pct: r.pct_inclusion
    }));
  }, [data, v7Type]);

  if (loading || !data) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <motion.div 
          animate={{ scale: [1, 1.2, 1], opacity: [0.3, 1, 0.3] }}
          transition={{ duration: 2, repeat: Infinity }}
          className="text-violet-600 font-black tracking-[0.5em] uppercase text-xs"
        >
          Sincronizando Universo Educativo...
        </motion.div>
      </div>
    );
  }

  const surprisingFacts = [
    `La CDMX concentra ${ (Number(data.v1_densidad.find(e => e.entidad === 'CIUDAD DE MÉXICO')?.matricula_total) / Number(data.v1_densidad.find(e => e.entidad === 'COLIMA')?.matricula_total)).toFixed(0) } veces más estudiantes que el estado de Colima.`,
    "Ingeniería y TIC siguen teniendo un predominio masculino de más del 70%.",
    `${v3Processed[0].entidad} es el estado con mayor cobertura de educación pública en el país.`,
    `En el sector público, carreras de Animación y Medicina presentan ratios de saturación superiores a 50 solicitantes por lugar.`,
    "La modalidad no escolarizada atrae a una población significativamente más madura (promedio +30 años).",
    `Solo el ${ ((Number(data.v6_flujo.titulados) / Number(data.v6_flujo.solicitudes)) * 100).toFixed(1) }% de los aspirantes iniciales logran obtener su título.`,
    "La representación de grupos vulnerables (indígenas/discapacidad) es menor al 2% nacional."
  ];

  return (
    <div className="min-h-screen bg-white text-gray-900 font-sans selection:bg-violet-100 overflow-x-hidden">
      
      {/* --- HERO SECTION --- */}
      <section className="relative h-screen flex flex-col items-center justify-center p-6 border-b border-gray-100 overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,#7c3aed08,transparent_70%)]" />
        <div className="absolute inset-0 opacity-40" style={{ backgroundImage: 'radial-gradient(#e5e7eb 1px, transparent 1px)', backgroundSize: '40px 40px' }} />
        
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative z-10 text-center"
        >
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex items-center justify-center gap-3 mb-10"
          >
            <Layers className="text-violet-600" size={24} />
            <span className="text-xs font-black uppercase tracking-[0.5em] text-gray-400">EduMap MX · Observatorio Estadístico</span>
          </motion.div>
          <h1 className="text-7xl md:text-9xl font-black tracking-tighter mb-8 leading-[0.85] text-gray-900">
            Radiografía <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-600 via-cyan-500 to-amber-500">
              Superior MX
            </span>
          </h1>
          <p className="text-xl text-gray-500 font-medium max-w-2xl mx-auto leading-relaxed px-4">
            Análisis profundo del ecosistema educativo mexicano a través de 7 dimensiones críticas. Ciclo 2024-2025.
          </p>
        </motion.div>
        
        <motion.div 
          animate={{ y: [0, 10, 0] }}
          transition={{ duration: 2, repeat: Infinity }}
          className="absolute bottom-12 flex flex-col items-center gap-3"
        >
          <span className="text-[10px] font-black uppercase tracking-[0.3em] text-violet-600">Inicia el recorrido</span>
          <ArrowDown size={20} className="text-violet-600" />
        </motion.div>
      </section>

      {/* --- KPI SECTION --- */}
      <section className="py-24 px-6 max-w-7xl mx-auto relative border-b border-gray-50">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <AnimatedCounter icon={Users} color={COLORS.accent} label="Matrícula Total" value={data.counters.total_estudiantes} />
          <AnimatedCounter icon={School} color={COLORS.secondary} label="IBS & Campus" value={data.counters.total_instituciones} />
          <AnimatedCounter icon={TrendingUp} color={COLORS.warning} label="Programas Activos" value={data.counters.total_programas} />
          <AnimatedCounter icon={Globe} color={COLORS.success} label="Entidades" value={data.counters.total_estados} />
          <AnimatedCounter icon={Brain} color="#db2777" label="Equidad Mujeres" value={data.counters.pct_mujeres} />
        </div>
      </section>

      {/* --- MAP MODULE SECTION --- */}
      <section className="py-24 px-6 max-w-[1400px] mx-auto border-t border-gray-100">
        <SectionHeader 
          badge="Invisibilidad & Desprecio Territorial"
          title="Módulo de"
          highlight="Mapas Dinámicos"
          description="Explora las 6 capas analíticas para entender la educación superior desde múltiples dimensiones geográficas. Sin límites, sin fronteras."
          color={COLORS.accent}
        />
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          className="mb-12"
        >
           <MapModule data={data} />
        </motion.div>
      </section>

      {/* --- V2: BRECHA DE GÉNERO --- */}
      <section className="py-40 px-6 max-w-7xl mx-auto border-t border-gray-100">
        <SectionHeader 
          badge="Equidad & Vocación"
          title="Brecha de"
          highlight="Género"
          description="Análisis divergente que revela las áreas donde persiste la segregación por género en las carreras."
          color="#db2777"
        />
        <SurprisingFact fact={surprisingFacts[1]} color="#db2777" />
        <div className="grid grid-cols-1 gap-12">
            <ChartContainer height={550}>
               <div className="mb-8 flex justify-between items-center">
                 <div className="text-xs font-bold uppercase text-gray-400">Matrícula por Campo Amplio</div>
                 <div className="px-3 py-1 bg-pink-50 border border-pink-100 rounded-lg text-[9px] font-black text-pink-600 animate-pulse">CLIC PARA DETALLES</div>
               </div>
               <ButterflyChart data={v2Processed} onSelect={(d: any) => d && setV2Selected(d.activePayload[0].payload)} />
            </ChartContainer>

            <AnimatePresence mode="wait">
              {v2Selected && (
                <motion.div 
                  key={v2Selected.campo_amplio}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                >
                  <ChartContainer height={550}>
                    <div className="flex justify-between items-start mb-10">
                      <div>
                        <div className="text-[10px] font-black uppercase text-pink-600 mb-2">Desglose Específico</div>
                        <div className="text-2xl font-black tracking-tighter leading-none text-gray-900">{v2Selected.campo_amplio}</div>
                      </div>
                      <button onClick={() => setV2Selected(null)} className="p-3 bg-white hover:bg-gray-50 rounded-2xl border border-gray-100 transition-all shadow-sm">
                        <ChevronRight className="rotate-180 text-gray-400" size={20} />
                      </button>
                    </div>
                    <ButterflyChart data={v2DetailProcessed} />
                  </ChartContainer>
                </motion.div>
              )}
            </AnimatePresence>
        </div>
      </section>

      {/* --- V3: PÚBLICO VS PRIVADO --- */}
      <section className="py-40 px-6 max-w-7xl mx-auto border-t border-gray-100">
        <SectionHeader 
          badge="Infraestructura"
          title="Soberanía &"
          highlight="Privatización"
          description="Diferencia regional entre el ecosistema público subsidiado y la oferta privada."
          color={COLORS.warning}
        />
        <SurprisingFact fact={surprisingFacts[2]} color={COLORS.warning} />
        <ChartContainer height={600}>
           <div className="flex flex-col md:flex-row justify-between items-center mb-12 gap-6">
              <div className="flex gap-2 p-1.5 bg-gray-100 border border-gray-100 rounded-2xl">
                <button 
                  onClick={() => setV3Type('instituciones')}
                  className={`px-6 py-2.5 rounded-xl text-[10px] font-black transition-all ${v3Type === 'instituciones' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-900'}`}
                >
                  CONTEO INSTITUCIONAL
                </button>
                <button 
                  onClick={() => setV3Type('matricula')}
                  className={`px-6 py-2.5 rounded-xl text-[10px] font-black transition-all ${v3Type === 'matricula' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-900'}`}
                >
                  ABSORCIÓN DE MATRÍCULA
                </button>
              </div>
              <div className="flex items-center gap-6">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-violet-600" />
                  <span className="text-[10px] font-bold text-gray-500 uppercase">Público</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-amber-500" />
                  <span className="text-[10px] font-bold text-gray-500 uppercase">Privado</span>
                </div>
              </div>
           </div>
           <ResponsiveContainer width="100%" height="80%">
              <BarChart data={v3Processed} margin={{ left: 0, bottom: 40 }}>
                <CartesianGrid strokeDasharray="4 4" vertical={false} stroke="#f3f4f6" />
                <XAxis dataKey="entidad" tick={{ fill: '#6b7280', fontSize: 9, fontWeight: 700 }} axisLine={false} tickLine={false} angle={-45} textAnchor="end" interval={0} />
                <YAxis tick={{ fill: '#6b7280', fontSize: 10 }} axisLine={false} tickLine={false} />
                <Tooltip 
                  cursor={{ fill: '#f9fafb' }}
                  contentStyle={{ backgroundColor: '#fff', border: '1px solid #e5e7eb', borderRadius: '16px', fontSize: '11px', boxShadow: '0 10px 25px rgba(0,0,0,0.05)', color: '#111827' }} 
                />
                <Bar 
                  dataKey={v3Type === 'instituciones' ? 'publico_inst' : 'publico_mat'} 
                  name="Público" 
                  fill={COLORS.accent} 
                  stackId="sost" 
                  radius={[0,0,0,0]} 
                />
                <Bar 
                  dataKey={v3Type === 'instituciones' ? 'privado_inst' : 'privado_mat'} 
                  name="Privado" 
                  fill={COLORS.warning} 
                  stackId="sost" 
                  radius={[6,6,0,0]} 
                />
              </BarChart>
           </ResponsiveContainer>
        </ChartContainer>
      </section>

      {/* --- V4: DIFICULTAD --- */}
      <section className="py-40 px-6 max-w-7xl mx-auto border-t border-gray-100">
        <SectionHeader 
          badge="Índice de Selectividad"
          title="Puertas de"
          highlight="Acceso"
          description="Cruzamos las solicitudes de ingreso con los lugares disponibles para medir la saturación académica."
          color={COLORS.error}
        />
        <SurprisingFact fact={surprisingFacts[3]} color={COLORS.error} />
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10 items-start">
            <div className="lg:col-span-2">
                <ChartContainer height={600}>
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-4">
                       <div className="flex flex-col gap-1">
                          <div className="text-xs font-bold uppercase text-gray-400">Correlación: Interés vs Selectividad</div>
                          <div className="flex gap-2 mt-2">
                             <button 
                               onClick={() => setV4Sostenimiento('PÚBLICO')}
                               className={`px-3 py-1 rounded-lg text-[9px] font-black tracking-widest transition-all ${v4Sostenimiento === 'PÚBLICO' ? 'bg-red-600 text-white shadow-md' : 'bg-gray-200 text-gray-500 hover:text-gray-900'}`}
                             >
                               PÚBLICAS
                             </button>
                             <button 
                               onClick={() => setV4Sostenimiento('PARTICULAR')}
                               className={`px-3 py-1 rounded-lg text-[9px] font-black tracking-widest transition-all ${v4Sostenimiento === 'PARTICULAR' ? 'bg-red-600 text-white shadow-md' : 'bg-gray-200 text-gray-500 hover:text-gray-900'}`}
                             >
                               PRIVADAS
                             </button>
                          </div>
                       </div>
                       <select 
                         onChange={(e) => setV4FilterCA(e.target.value)}
                         className="bg-white border border-gray-200 rounded-2xl px-5 py-3 text-[11px] font-black text-gray-900 outline-none focus:ring-2 focus:ring-red-500/50 appearance-none pr-10 cursor-pointer shadow-sm"
                         style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' fill=\'none\' viewBox=\'0 0 24 24\' stroke=\'%236b7280\'%3E%3Cpath stroke-linecap=\'round\' stroke-linejoin=\'round\' stroke-width=\'2\' d=\'M19 9l-7 7-7-7\'/%3E%3C/svg%3E")', backgroundRepeat: 'no-repeat', backgroundPosition: 'right 12px center', backgroundSize: '16px' }}
                       >
                          <option value="todos">Todos los Campos Amplios</option>
                          {Array.from(new Set(data.v4_dificultad.map(d => d.campo_amplio))).map(ca => (
                             <option key={ca} value={ca}>{ca}</option>
                          ))}
                       </select>
                    </div>
                   <ResponsiveContainer width="100%" height="80%">
                      <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                        <XAxis 
                          type="number" 
                          dataKey="ratio" 
                          name="Dificultad" 
                          label={{ value: 'Índice (Sol/Ing)', position: 'insideBottom', offset: -10, fill: '#6b7280', fontSize: 10, fontWeight: 700 }}
                          tick={{ fill: '#6b7280', fontSize: 10 }}
                          axisLine={false}
                        />
                        <YAxis 
                          type="number" 
                          dataKey="solicitudes" 
                          name="Solicitudes" 
                          label={{ value: 'Volumen de Solicitudes', angle: -90, position: 'insideLeft', offset: 10, fill: '#6b7280', fontSize: 10, fontWeight: 700 }}
                          tick={{ fill: '#6b7280', fontSize: 10 }}
                          axisLine={false}
                        />
                        <ZAxis type="number" dataKey="size" range={[60, 600]} />
                        <Tooltip 
                           content={({ active, payload }: any) => {
                             if (!active || !payload?.length) return null;
                             const d = payload[0].payload;
                             return (
                               <div className="bg-white border border-gray-100 p-5 rounded-2xl shadow-xl max-w-[240px]">
                                 <div className="text-[10px] font-black text-red-600 uppercase mb-3 tracking-widest">{d.campo_amplio}</div>
                                 <div className="text-sm font-black text-gray-900 mb-4 leading-tight">{d.carrera}</div>
                                 <div className="space-y-2 border-t border-gray-50 pt-3">
                                    <div className="text-[10px] flex justify-between">
                                      <span className="text-gray-500">Ratio Saturación:</span>
                                      <span className="text-gray-900 font-black">{d.ratio.toFixed(1)}x</span>
                                    </div>
                                    <div className="text-[10px] flex justify-between">
                                      <span className="text-gray-500">Solicitudes:</span>
                                      <span className="text-gray-900 font-black">{d.solicitudes.toLocaleString()}</span>
                                    </div>
                                    <div className="text-[10px] flex justify-between">
                                      <span className="text-gray-500">Estado:</span>
                                      <span className="text-gray-900 font-bold">{d.entidad}</span>
                                    </div>
                                 </div>
                               </div>
                             );
                           }}
                        />
                        <Scatter name="Programas" data={v4Processed}>
                           {v4Processed.map((entry, index) => (
                             <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} fillOpacity={0.6} strokeWidth={1} stroke="#fff" />
                           ))}
                         </Scatter>
                      </ScatterChart>
                   </ResponsiveContainer>
                </ChartContainer>
            </div>
            
            <div className="bg-gray-50 border border-gray-100 rounded-[48px] p-10 shadow-sm">
               <div className="mb-10">
                  <div className="flex items-center gap-4 mb-6">
                    <div className="p-3 bg-red-600/10 rounded-2xl">
                      <Target className="text-red-600" size={24} />
                    </div>
                    <div>
                      <div className="text-2xl font-black tracking-tighter uppercase text-gray-900 leading-none">Ranking Dificultad</div>
                      <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Top 10 Seleccionado</div>
                    </div>
                  </div>
                  
                  <div className="flex gap-1 p-1 bg-white border border-gray-100 rounded-xl">
                    <button 
                      onClick={() => setV4RankType('carrera')}
                      className={`flex-1 py-2 rounded-lg text-[9px] font-black transition-all ${v4RankType === 'carrera' ? 'bg-red-600 text-white shadow-md' : 'text-gray-400 hover:text-gray-900'}`}
                    >
                      CARRERA
                    </button>
                    <button 
                      onClick={() => setV4RankType('area')}
                      className={`flex-1 py-2 rounded-lg text-[9px] font-black transition-all ${v4RankType === 'area' ? 'bg-red-600 text-white shadow-md' : 'text-gray-400 hover:text-gray-900'}`}
                    >
                      ÁREA
                    </button>
                  </div>
               </div>

               <div className="space-y-8">
                  {v4RankedData.map((d, i) => (
                    <motion.div 
                      key={d.carrera} 
                      initial={{ opacity: 0, x: 20 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.1 }}
                      className="group"
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1 pr-4 min-w-0">
                           <div className="text-[10px] font-black uppercase text-gray-400 tracking-widest mb-1.5 truncate">{d.entidad}</div>
                           <div className="text-xs font-black group-hover:text-red-600 transition-all leading-snug text-gray-900">{d.carrera || d.campo_amplio}</div>
                        </div>
                        <div className="text-right shrink-0">
                           <div className="text-2xl font-black text-red-600 leading-none mb-1">{d.ratio.toFixed(1)}x</div>
                           <div className="text-[8px] font-bold text-gray-400 uppercase tracking-tighter">Índice</div>
                        </div>
                      </div>
                      <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
                        <motion.div 
                          initial={{ width: 0 }} 
                          whileInView={{ width: `${Math.min((d.ratio / 115) * 100, 100)}%` }} 
                          viewport={{ once: true }}
                          transition={{ duration: 1, delay: i * 0.1 }}
                          className="h-full bg-gradient-to-r from-red-600 to-red-400" 
                        />
                      </div>
                    </motion.div>
                  ))}
               </div>
            </div>
        </div>
      </section>

      {/* --- V5: PIRÁMIDE POBLACIONAL --- */}
      <section className="py-40 px-6 max-w-7xl mx-auto border-t border-gray-100">
        <SectionHeader 
          badge="Demografía"
          title="Reloj de"
          highlight="Académico"
          description="Observa cómo se distribuye la edad del estudiantado, revelando el momento vital en el que los mexicanos acceden al nivel superior."
          color={COLORS.secondary}
        />
        <SurprisingFact fact={surprisingFacts[4]} color={COLORS.secondary} />
        <ChartContainer height={550}>
           <div className="mb-12 text-center">
              <div className="text-lg font-black uppercase tracking-widest text-gray-400">Distribución de Matrícula: Pirámide Escolarizada</div>
           </div>
           <ResponsiveContainer width="100%" height="80%">
              <BarChart
                data={v5Processed}
                layout="vertical"
                stackOffset="sign"
                margin={{ top: 5, right: 30, left: 40, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f3f4f6" />
                <XAxis type="number" hide />
                <YAxis 
                  dataKey="edad" 
                  type="category" 
                  width={100} 
                  tick={{ fill: '#6b7280', fontSize: 11, fontStyle: 'italic', fontWeight: 700 }} 
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip 
                  cursor={{ fill: '#f9fafb' }}
                  contentStyle={{ backgroundColor: '#fff', border: '1px solid #e5e7eb', borderRadius: '16px', boxShadow: '0 10px 25px rgba(0,0,0,0.05)', color: '#111827' }}
                  formatter={(value: any) => [Math.abs(value).toLocaleString(), 'Estudiantes']}
                />
                <Bar dataKey="mujeres_neg" name="Mujeres" fill="#db2777" radius={[6, 0, 0, 6]} barSize={24} />
                <Bar dataKey="hombres" name="Hombres" fill="#0891b2" radius={[0, 6, 6, 0]} barSize={24} />
                <Legend iconType="circle" wrapperStyle={{ paddingTop: 30 }} />
              </BarChart>
            </ResponsiveContainer>
        </ChartContainer>
      </section>

      {/* --- V6: FLUJO DE RETENCIÓN --- */}
      <section className="py-40 px-6 max-w-7xl mx-auto border-t border-gray-100">
        <SectionHeader 
          badge="Eficacia Terminal"
          title="Embudo de"
          highlight="Resiliencia"
          description="Trayectoria del estudiante desde el primer contacto hasta la obtención del título profesional."
          color={COLORS.success}
        />
        <SurprisingFact fact={surprisingFacts[5]} color={COLORS.success} />
        <div className="flex flex-col items-center">
            <motion.div 
              className="w-full max-w-4xl bg-gray-50 border border-gray-100 rounded-[64px] p-20 shadow-sm overflow-hidden relative"
            >
               <div className="absolute top-0 right-0 p-10 opacity-5">
                 <MousePointer2 size={120} className="text-gray-900" />
               </div>
               <div className="space-y-4 relative z-10">
                  {[
                    { label: 'SOLICITUDES', val: data.v6_flujo.solicitudes, color: '#6366f1', pct: 100 },
                    { label: 'ADMITIDOS', val: data.v6_flujo.admitidos, color: '#8b5cf6', pct: (Number(data.v6_flujo.admitidos)/Number(data.v6_flujo.solicitudes)*100) },
                    { label: 'PAGO MATRÍCULA', val: data.v6_flujo.matricula, color: '#ec4899', pct: (Number(data.v6_flujo.matricula)/Number(data.v6_flujo.solicitudes)*100) },
                    { label: 'EGRESADOS', val: data.v6_flujo.egresados, color: '#f43f5e', pct: (Number(data.v6_flujo.egresados)/Number(data.v6_flujo.solicitudes)*100) },
                    { label: 'TITULADOS', val: data.v6_flujo.titulados, color: '#fbbf24', pct: (Number(data.v6_flujo.titulados)/Number(data.v6_flujo.solicitudes)*100) },
                  ].map((step, i) => (
                    <motion.div 
                      key={step.label}
                      initial={{ opacity: 0, scaleX: 0 }}
                      whileInView={{ opacity: 1, scaleX: 1 }}
                      transition={{ delay: i * 0.15, duration: 1 }}
                      style={{ originX: 0.5, width: `${Math.max(step.pct, 5)}%`, margin: '0 auto' }}
                      className="group cursor-default"
                    >
                      <div 
                        className="h-16 md:h-24 rounded-2xl flex items-center justify-between px-10 transition-all hover:brightness-110 shadow-lg relative overflow-hidden"
                        style={{ backgroundColor: step.color }}
                      >
                         <div className="absolute inset-0 bg-gradient-to-r from-white/10 to-transparent" />
                         <span className="text-[10px] md:text-sm font-black tracking-[0.2em] text-white relative z-10">{step.label}</span>
                         <span className="text-xl md:text-3xl font-black text-white relative z-10">{Number(step.val).toLocaleString()}</span>
                      </div>
                    </motion.div>
                  ))}
               </div>
               
               <div className="mt-20 text-center">
                  <div className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-50 text-emerald-600 rounded-full text-[10px] font-black uppercase tracking-widest mb-6">
                    <Target size={14} /> Eficiencia del Sistema: {((Number(data.v6_flujo.titulados)/Number(data.v6_flujo.solicitudes))*100).toFixed(1)}%
                  </div>
                  <div className="w-16 h-1.5 bg-emerald-500 mx-auto rounded-full mb-10" />
                  <p className="text-base font-medium text-gray-500 leading-relaxed max-w-sm mx-auto">
                    De cada 100 estudiantes que inician, {((Number(data.v6_flujo.titulados)/Number(data.v6_flujo.solicitudes))*100).toFixed(0)} logran cruzar la meta académica. Un índice que refleja el desafío de la permanencia.
                  </p>
               </div>
            </motion.div>
         </div>
      </section>

      {/* --- V7: INCLUSIÓN --- */}
      <section className="py-40 px-6 max-w-7xl mx-auto border-t border-gray-100">
        <SectionHeader 
          badge="Inclusión Radical"
          title="Fronteras de"
          highlight="Equidad"
          description="Representación de grupos históricamente excluidos en las 32 entidades del país."
          color="#8b5cf6"
        />
        <SurprisingFact fact={surprisingFacts[6]} color="#8b5cf6" />
        <ChartContainer height={650}>
            <div className="flex flex-col md:flex-row justify-between items-center mb-16 gap-8">
               <div className="flex gap-2 p-1.5 bg-gray-100 border border-gray-100 rounded-2xl shadow-sm">
                 <button 
                   onClick={() => setV7Type('lenguas_indigenas')}
                   className={`px-8 py-3 rounded-xl text-[11px] font-black transition-all ${v7Type === 'lenguas_indigenas' ? 'bg-white text-gray-900 shadow-md' : 'text-gray-500 hover:text-gray-900'}`}
                 >
                   HABLANTE DE LENGUA INDÍGENA
                 </button>
                 <button 
                   onClick={() => setV7Type('discapacidad')}
                   className={`px-8 py-3 rounded-xl text-[11px] font-black transition-all ${v7Type === 'discapacidad' ? 'bg-white text-gray-900 shadow-md' : 'text-gray-500 hover:text-gray-900'}`}
                 >
                   VIVE CON DISCAPACIDAD
                 </button>
               </div>
               <div className="text-[10px] font-bold text-violet-600 uppercase tracking-widest bg-violet-50 px-4 py-2 rounded-lg border border-violet-100">
                 Treemap por Entidad
               </div>
            </div>
            <ResponsiveContainer width="100%" height="80%">
              <Treemap
                data={v7Processed}
                dataKey="value"
                aspectRatio={4/3}
                stroke="#fff"
                fill={COLORS.accent}
                className="cursor-pointer"
              >
                <Tooltip 
                  contentStyle={{ backgroundColor: '#fff', border: '1px solid #e5e7eb', borderRadius: '16px', color: '#111827', boxShadow: '0 10px 25px rgba(0,0,0,0.05)' }}
                  formatter={(val: any, name: any, props: any) => [
                    `${val.toLocaleString()} Estudiantes (${props.payload.pct.toFixed(2)}% del Estado)`, 
                    v7Type === 'lenguas_indigenas' ? 'Lengua Indígena' : 'Discapacidad'
                  ]}
                />
              </Treemap>
            </ResponsiveContainer>
            <div className="mt-10 text-center text-[10px] font-bold text-gray-400 uppercase tracking-[0.4em]">
              El tamaño del bloque representa el volumen absoluto de estudiantes integrados
            </div>
        </ChartContainer>
      </section>

      {/* --- FOOTER --- */}
      <footer className="py-32 border-t border-gray-100 bg-white relative">
         <div className="absolute top-0 left-1/2 -translate-x-1/2 w-px h-24 bg-gradient-to-b from-violet-500/50 to-transparent" />
         <BookOpen size={40} className="mx-auto mb-10 text-violet-500/20" />
         <div className="text-center px-6">
            <h3 className="text-2xl font-black mb-4 tracking-tighter text-gray-900">EduMap MX Intelligence Unit</h3>
            <p className="text-xs font-bold uppercase tracking-[0.5em] text-gray-400 max-w-2xl mx-auto leading-[2]">
                Datos analizados desde el repositorio central de ANUIES<br />
                Procesamiento estadístico · Ciclo Escolar 2024 - 2025<br />
                Copyright © 2026 · Todos los derechos reservados.
            </p>
         </div>
      </footer>

    </div>
  );
};

export default Observatorio;
