import React, { useState, useEffect, useMemo } from 'react';
import { 
  ArrowLeftRight, Search, Filter, X, Plus, 
  ChevronRight, Info, AlertTriangle, CheckCircle2, 
  Trash2, RotateCcw, Building2, BookOpen, GraduationCap, MapPin,
  TrendingUp, Users, Award
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { searchOfertas, getFilters } from '../api';
import { Oferta } from '../types';
import RadarChart from '../components/comparator/RadarChart';
import { calculateScores, ComparisonData, ComparisonScores } from '../utils/comparisonCalculations';
import { shortenCareerName } from '../utils/formatters';

// Fallback for environment variables
// Fallback for environment variables (relative path for production)
const API_BASE = (import.meta as any).env?.VITE_API_URL || '';

const COLORS = ["#378ADD", "#1D9E75", "#EF9F27", "#D4537E"];

type ViewState = 'selection' | 'comparison';
type Priority = 'acceso' | 'eficiencia' | 'titulacion' | 'genero' | 'escala';

const Comparator: React.FC = () => {
    const [view, setView] = useState<ViewState>('selection');
    const [selectedIds, setSelectedIds] = useState<number[]>([]);
    const [comparisonData, setComparisonData] = useState<ComparisonData[]>([]);
    const [loading, setLoading] = useState(false);
    const [activePriority, setActivePriority] = useState<Priority>('acceso');

    // Selection State
    const [searchTerm, setSearchTerm] = useState('');
    const [results, setResults] = useState<any[]>([]);
    const [searching, setSearching] = useState(false);
    const [filters, setFilters] = useState({
        estado: '',
        municipio: '',
        campo: '',
        niveles: [1, 5], // Licenciatura (1) + TSU (5) pre-selected
        sostenimiento: ''
    });
    const [catalogs, setCatalogs] = useState<any>({ estados: [], niveles: [], campos: [] });
    const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

    useEffect(() => {
        const handleResize = () => setIsMobile(window.innerWidth < 768);
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    useEffect(() => {
        const loadCatalogs = async () => {
            const data = await getFilters();
            if (data) setCatalogs(data);
        };
        loadCatalogs();
    }, []);

    const fetchResults = async () => {
        setSearching(true);
        try {
            const res = await searchOfertas({
                q: searchTerm,
                estado: filters.estado ? parseInt(filters.estado) : undefined,
                municipio: filters.municipio ? parseInt(filters.municipio) : undefined,
                nivel: filters.niveles.length > 0 ? filters.niveles.join(',') : undefined,
                sostenimiento: filters.sostenimiento ? parseInt(filters.sostenimiento) : undefined,
                limit: 20
            });
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            setResults((res as any).data || []);
        } catch (e) {
            console.error(e);
        } finally {
            setSearching(false);
        }
    };

    useEffect(() => {
        const timer = setTimeout(fetchResults, 400);
        return () => clearTimeout(timer);
    }, [searchTerm, filters]);

    const handleToggleSelection = (id: number) => {
        if (selectedIds.includes(id)) {
            setSelectedIds(prev => prev.filter(i => i !== id));
        } else if (selectedIds.length < 4) {
            setSelectedIds(prev => [...prev, id]);
        }
    };

    const startComparison = async () => {
        if (selectedIds.length < 2) return;
        setLoading(true);
        try {
            const response = await fetch(`${API_BASE}/api/comparar/carreras?ids=${selectedIds.join(',')}`);
            const data = await response.json();
            setComparisonData(data);
            setView('comparison');
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    const reset = () => {
        setView('selection');
        setSelectedIds([]);
        setComparisonData([]);
    };

    // --- RENDER HELPERS ---

    if (view === 'comparison') {
        const scores = comparisonData.map(d => ({
            id: d.id,
            data: d,
            scores: calculateScores(d)
        }));

        const bestGlobal = [...scores].sort((a, b) => b.scores.global - a.scores.global)[0];
        const worstGlobal = [...scores].sort((a, b) => a.scores.global - b.scores.global)[0];
        const bestInPriority = [...scores].sort((a, b) => b.scores[activePriority] - a.scores[activePriority])[0];

        const alerts = comparisonData.reduce((acc: string[], d) => {
            if (d.ipd > 5) acc.push(`${d.nombre_institucion} tiene IPD mayor a 5x — probabilidad de admisión menor al 14%. Considera tenerla como segunda opción.`);
            const ef = (d.egresados / (d.nuevo_ingreso || 1)) * 100;
            if (ef < 55 && d.egresados > 0) acc.push(`Eficiencia terminal baja en ${d.nombre_institucion} — más de la mitad de quienes ingresan no concluyen.`);
            if (d.egresados === 0 || d.titulados === 0) acc.push(`Nota: ${d.nombre_institucion} no reporta egresados/titulados aún — esto suele deberse a que el programa es de reciente creación.`);
            return acc;
        }, []);

        return (
            <div className="space-y-10 animate-fade-in pb-20">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                    <div>
                        <button onClick={() => setView('selection')} className="flex items-center gap-2 text-indigo-600 font-bold text-sm mb-4 hover:gap-3 transition-all">
                            <ArrowLeftRight size={16} /> VOLVER A SELECCIÓN
                        </button>
                        <h1 className="text-4xl font-black text-slate-900 tracking-tight">Análisis Comparativo</h1>
                    </div>
                    <button onClick={reset} className="flex items-center gap-2 px-6 py-3 bg-slate-100 text-slate-600 font-bold rounded-2xl hover:bg-slate-200 transition-all text-sm">
                        <RotateCcw size={18} /> NUEVA COMPARACIÓN
                    </button>
                </div>

                {/* Priority Selection */}
                <div className="bg-white p-6 rounded-[32px] border border-slate-100 shadow-sm">
                    <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Priorizar por:</div>
                    <div className="flex flex-wrap gap-2">
                        {[
                            { id: 'acceso', label: 'Facilidad de acceso' },
                            { id: 'eficiencia', label: 'Eficiencia terminal' },
                            { id: 'titulacion', label: 'Tasa de titulación' },
                            { id: 'genero', label: 'Equidad de género' },
                            { id: 'escala', label: 'Escala institucional' },
                        ].map(p => (
                            <button
                                key={p.id}
                                onClick={() => setActivePriority(p.id as Priority)}
                                className={`px-5 py-2.5 rounded-xl text-xs font-bold transition-all ${
                                    activePriority === p.id 
                                    ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-100' 
                                    : 'bg-slate-50 text-slate-500 hover:bg-slate-100'
                                }`}
                            >
                                {p.label}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Cards Grid */}
                <div className={`grid gap-6 ${comparisonData.length === 3 ? 'grid-cols-1 md:grid-cols-3' : 'grid-cols-1 md:grid-cols-2'}`}>
                    {scores.map((s, i) => {
                        const isBest = s.id === bestGlobal.id;
                        const isWorst = s.id === worstGlobal.id && scores.length > 2;
                        const efPct = Math.round((s.data.egresados / (s.data.nuevo_ingreso || 1)) * 100);
                        const titPct = Math.round((s.data.titulados / (s.data.matricula_total || 1)) * 100);
                        
                        return (
                            <motion.div 
                                key={s.id}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: i * 0.1 }}
                                className={`relative p-8 bg-white rounded-[40px] border-2 transition-all ${
                                    isBest ? 'border-emerald-500 shadow-2xl shadow-emerald-50' : 'border-slate-100'
                                } ${isWorst ? 'opacity-70 grayscale-[0.2]' : ''}`}
                            >
                                {isBest && (
                                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1.5 bg-emerald-500 text-white text-[10px] font-black rounded-full shadow-lg uppercase tracking-widest">
                                        Mejor balance
                                    </div>
                                )}
                                
                                <div className="flex justify-between items-start mb-8">
                                    <div className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest ${
                                        s.data.sector === 'pub' ? 'bg-indigo-600 text-white shadow-lg' : 'bg-amber-500 text-white shadow-lg'
                                    }`}>
                                        {s.data.sector === 'pub' ? 'Institución Pública' : 'Institución Particular'}
                                    </div>
                                    <div className="flex flex-col items-end">
                                        <div className="text-4xl font-black text-slate-900">{s.scores.global}</div>
                                        <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">Score</div>
                                    </div>
                                </div>

                                <h3 className="text-xl font-black text-slate-900 mb-2 leading-tight min-h-[56px] line-clamp-2">{shortenCareerName(s.data.nombre_programa)}</h3>
                                <div className="space-y-1 mb-8 border-l-2 border-indigo-100 pl-4">
                                    <p className="text-xs font-black text-slate-900 uppercase tracking-tight">{s.data.nombre_institucion}</p>
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide flex items-center gap-1">
                                        <MapPin size={10} /> {s.data.nombre_escuela || 'Sede Principal'}
                                    </p>
                                </div>

                                {/* IPD Visual Bar */}
                                <div className={`space-y-2 mb-8 p-4 rounded-3xl transition-all ${activePriority === 'acceso' ? 'bg-indigo-50 ring-2 ring-indigo-200' : ''}`}>
                                    <div className="flex justify-between items-end">
                                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Selectividad (IPD)</span>
                                        <span className="text-sm font-black text-slate-900">{Number(s.data.ipd).toFixed(2)}x</span>
                                    </div>
                                    <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                                        <motion.div 
                                            initial={{ width: 0 }}
                                            animate={{ width: `${Math.min(100, (s.data.ipd / 5) * 100)}%` }}
                                            className={`h-full rounded-full ${
                                                s.data.ipd < 1.5 ? 'bg-emerald-500' : s.data.ipd < 3 ? 'bg-amber-500' : 'bg-red-500'
                                            }`}
                                        />
                                    </div>
                                </div>

                                {/* Metrics Rows */}
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="p-4 bg-slate-50 rounded-2xl">
                                        <div className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">Solicitudes</div>
                                        <div className="text-sm font-black text-slate-900">{s.data.solicitudes.toLocaleString()}</div>
                                    </div>
                                    <div className="p-4 bg-slate-50 rounded-2xl">
                                        <div className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">Nuevo Ingl.</div>
                                        <div className="text-sm font-black text-slate-900">{s.data.nuevo_ingreso.toLocaleString()}</div>
                                    </div>
                                    <div className={`p-4 rounded-2xl transition-all ${activePriority === 'eficiencia' ? 'bg-indigo-100 ring-2 ring-indigo-300' : 'bg-slate-50'}`}>
                                        <div className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">Eficiencia</div>
                                        <div className={`text-sm font-black ${
                                            efPct >= 80 ? 'text-emerald-500' : efPct < 55 ? 'text-red-500' : 'text-slate-900'
                                        }`}>{efPct}%</div>
                                    </div>
                                    <div className={`p-4 rounded-2xl transition-all ${activePriority === 'titulacion' ? 'bg-indigo-100 ring-2 ring-indigo-300' : 'bg-slate-50'}`}>
                                        <div className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">Titulados</div>
                                        <div className="text-sm font-black text-slate-900">{titPct}%</div>
                                    </div>
                                </div>
                            </motion.div>
                        );
                    })}
                </div>

                {/* Radar & Table Section */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 pt-10">
                    {/* Radar Chart */}
                    <div className="bg-white p-10 rounded-[48px] border border-slate-100 shadow-xl overflow-hidden flex flex-col justify-center">
                        <h3 className="text-center text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-10">Gráfica de Desempeño Multidimensional</h3>
                        <div className="h-[400px]">
                            <RadarChart data={scores.map((s, i) => ({
                                label: `${shortenCareerName(s.data.nombre_programa)} (${s.data.nombre_institucion})`,
                                scores: s.scores,
                                color: COLORS[i]
                            }))} />
                        </div>
                        <div className="flex flex-wrap justify-center gap-6 mt-10">
                            {scores.map((s, i) => (
                                <div key={s.id} className="flex items-center gap-3">
                                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[i] }} />
                                    <span className="text-[10px] font-black text-slate-900 uppercase tracking-widest">{shortenCareerName(s.data.nombre_programa)}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Detailed Comparison Table */}
                    <div className="bg-white rounded-[48px] border border-slate-100 shadow-xl overflow-hidden flex flex-col">
                        <div className="p-8 border-b border-slate-50 bg-slate-50/50">
                            <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Tabla Detallada</h3>
                        </div>
                        <div className="overflow-x-auto flex-1">
                            <table className="w-full text-left">
                                <tbody className="divide-y divide-slate-100">
                                    {[
                                        { label: 'Facilidad de acceso', key: 'ipd', format: (v: any) => `${Number(v).toFixed(2)}x IPD`, invert: true },
                                        { label: 'Eficiencia terminal', key: 'eficiencia', format: (v: any) => `${v}%` },
                                        { label: 'Tasa de titulación', key: 'titulacion', format: (v: any) => `${v}%` },
                                        { label: 'Equidad de género', key: 'genero', format: (v: any) => `${v}%` },
                                        { label: 'Escala institucional', key: 'matricula_total', format: (v: any) => `${v.toLocaleString()} alum.` },
                                    ].map(row => {
                                        const values = scores.map(s => {
                                            if (row.key === 'eficiencia') return Math.round((s.data.egresados / (s.data.nuevo_ingreso || 1)) * 100);
                                            if (row.key === 'titulacion') return Math.round((s.data.titulados / (s.data.matricula_total || 1)) * 100);
                                            if (row.key === 'genero') return s.data.pct_mujeres;
                                            return s.data[row.key as keyof ComparisonData];
                                        });
                                        const best = row.invert ? Math.min(...values as number[]) : Math.max(...values as number[]);
                                        const worst = row.invert ? Math.max(...values as number[]) : Math.min(...values as number[]);

                                        return (
                                            <tr key={row.label} className="group">
                                                <td className="p-6 bg-slate-50/50 border-r border-slate-50 w-48 text-[11px] font-black text-slate-900 uppercase tracking-tighter">
                                                    {row.label}
                                                </td>
                                                {scores.map((s, i) => {
                                                    const val = row.key === 'eficiencia' ? Math.round((s.data.egresados / (s.data.nuevo_ingreso || 1)) * 100) :
                                                                row.key === 'titulacion' ? Math.round((s.data.titulados / (s.data.matricula_total || 1)) * 100) :
                                                                row.key === 'genero' ? s.data.pct_mujeres :
                                                                s.data[row.key as keyof ComparisonData];
                                                    
                                                    const isBest = val === best && values.length > 1;
                                                    const isWorst = val === worst && values.length > 1;

                                                    return (
                                                        <td key={s.id} className={`p-6 text-center text-xs font-bold leading-none ${
                                                            isBest ? 'bg-emerald-50 text-emerald-600' : isWorst ? 'bg-red-50 text-red-600' : 'text-slate-600'
                                                        }`}>
                                                            {row.format(val)}
                                                        </td>
                                                    );
                                                })}
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>

                {/* Alerts */}
                {alerts.length > 0 && (
                    <div className="p-8 bg-amber-50 border-2 border-amber-200 rounded-[32px] space-y-4 shadow-lg shadow-amber-50">
                        <div className="flex items-center gap-3 text-amber-600 font-black uppercase tracking-widest text-xs">
                            <AlertTriangle size={20} /> Consideraciones Importantes
                        </div>
                        <div className="space-y-2">
                            {alerts.map((a, i) => (
                                <div key={i} className="flex gap-3 text-amber-800 text-sm font-medium">
                                    <span className="text-amber-400">•</span>
                                    {a}
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Smart Verdict */}
                <div className="p-10 bg-indigo-600 rounded-[48px] text-white shadow-2xl shadow-indigo-200 relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-10 opacity-10 scale-150 rotate-12 transition-transform group-hover:rotate-45 duration-700">
                        <Award size={200} />
                    </div>
                    <div className="relative z-10 max-w-4xl">
                        <h2 className="text-xs font-black uppercase tracking-[0.4em] mb-4 text-indigo-200">
                            Recomendación — prioridad: {
                                activePriority === 'acceso' ? 'Facilidad de acceso' :
                                activePriority === 'eficiencia' ? 'Eficiencia terminal' :
                                activePriority === 'titulacion' ? 'Tasa de titulación' :
                                activePriority === 'genero' ? 'Equidad de género' : 'Escala institucional'
                            }
                        </h2>
                        <div className="space-y-4 text-lg md:text-xl font-bold leading-relaxed">
                            <p>
                                <span className="text-indigo-200">Balance Global:</span> {bestGlobal.data.nombre_institucion} presenta el mejor equilibrio estadístico con un puntaje de {bestGlobal.scores.global} puntos sobre 100.
                            </p>
                            <p>
                                <span className="text-indigo-200">Enfoque Proyectado:</span> Si tu prioridad es la <span className="underline decoration-indigo-400 underline-offset-4">{activePriority}</span>, la mejor opción es <span className="text-emerald-300">{bestInPriority.data.nombre_institucion}</span> destacando con un valor de {bestInPriority.scores[activePriority]}.
                            </p>
                            {(comparisonData.some(d => d.sector === 'pub') && comparisonData.some(d => d.sector === 'priv')) && (
                                <p className="text-sm md:text-base font-medium text-indigo-100 pt-4 border-t border-indigo-400/30">
                                    Las opciones públicas concentran mayor demanda histórica pero ofrecen mayor reconocimiento institucional; las privadas presentan acceso más inmediato con consideraciones de costo a evaluar.
                                </p>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    // --- SELECTION VIEW ---
    return (
        <div className="space-y-10 animate-fade-in pb-20">
            <div className="max-w-3xl">
                <h1 className="text-5xl font-black text-slate-900 tracking-tight mb-4">Comparador de Carreras</h1>
                <p className="text-slate-500 text-lg font-medium">Encuentra, selecciona y compara el desempeño estadístico de tus opciones académicas.</p>
            </div>

            {/* Selection Tray */}
            <div className="flex flex-col md:flex-row gap-6">
                <div className="flex-1 bg-white p-6 rounded-[32px] border border-slate-100 shadow-xl flex flex-wrap gap-3 items-center min-h-[100px]">
                    <AnimatePresence>
                        {selectedIds.length === 0 && (
                            <motion.div 
                                initial={{ opacity: 0 }} 
                                animate={{ opacity: 1 }} 
                                className="text-slate-400 text-sm font-bold flex items-center gap-3 w-full"
                            >
                                <div className="w-10 h-10 rounded-2xl bg-slate-50 flex items-center justify-center text-slate-300">
                                    <ArrowLeftRight size={20} />
                                </div>
                                Selecciona de 2 a 4 carreras para comenzar
                            </motion.div>
                        )}
                        {selectedIds.map((id, index) => {
                            const item = results.find(r => r.id_oferta === id) || { carrera_nombre: 'Seleccionada', inst_nombre: 'Cargando...' };
                            return (
                                <motion.div 
                                    key={id}
                                    initial={{ scale: 0.8, opacity: 0 }}
                                    animate={{ scale: 1, opacity: 1 }}
                                    exit={{ scale: 0.8, opacity: 0 }}
                                    className="flex items-center gap-3 pl-4 pr-2 py-2 bg-indigo-50 border border-indigo-100 rounded-2xl group shadow-sm"
                                >
                                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS[index] }} />
                                    <div className="flex flex-col">
                                        <span className="text-[10px] font-black text-slate-900 leading-none truncate max-w-[150px]">{shortenCareerName(item.carrera_nombre)}</span>
                                        <span className="text-[8px] font-bold text-indigo-400 uppercase tracking-tight truncate max-w-[150px]">{item.inst_nombre || '...'}</span>
                                    </div>
                                    <button onClick={() => handleToggleSelection(id)} className="p-1.5 hover:bg-white rounded-lg transition-colors text-indigo-400 hover:text-red-500">
                                        <X size={14} />
                                    </button>
                                </motion.div>
                            );
                        })}
                    </AnimatePresence>
                </div>
                <button 
                    disabled={selectedIds.length < 2 || loading}
                    onClick={startComparison}
                    className={`px-10 py-6 rounded-[32px] font-black text-sm tracking-widest transition-all shadow-xl shadow-indigo-100 flex items-center gap-4 ${
                        selectedIds.length < 2 || loading
                        ? 'bg-slate-100 text-slate-300 cursor-not-allowed grayscale'
                        : 'bg-indigo-600 text-white hover:bg-indigo-700 hover:-translate-y-1'
                    }`}
                >
                    {loading ? <RotateCcw className="animate-spin" size={20} /> : <TrendingUp size={20} />}
                    {loading ? 'CARGANDO...' : 'COMPARAR AHORA'}
                </button>
            </div>

            {/* Search and Filters */}
            <div className="flex flex-col gap-6">
                <div className="flex flex-col gap-4">
                    <div className="relative group">
                        <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-600 transition-colors" size={isMobile ? 18 : 22} />
                        <input 
                            type="text"
                            placeholder="Buscar por programa o universidad..."
                            className="w-full pl-16 pr-8 py-4 md:py-5 bg-white border border-slate-100 rounded-[20px] md:rounded-[24px] shadow-sm outline-none focus:ring-4 focus:ring-indigo-50 transition-all font-bold text-slate-900 placeholder:text-slate-400 text-sm md:text-base"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    
                    <div className="flex flex-wrap md:flex-nowrap gap-2 md:gap-3">
                        <select 
                            value={filters.estado}
                            onChange={(e) => setFilters(prev => ({ ...prev, estado: e.target.value, municipio: '' }))}
                            className="flex-1 min-w-[140px] bg-white border border-slate-100 rounded-[16px] md:rounded-[20px] px-4 md:px-6 py-3 md:py-4 text-[10px] md:text-xs font-black text-slate-900 outline-none focus:ring-4 focus:ring-indigo-50 shadow-sm transition-all appearance-none cursor-pointer"
                        >
                            <option value="">Estado</option>
                            {catalogs.estados?.map((e: any) => <option key={e.id_entidad} value={e.id_entidad}>{e.nombre}</option>)}
                        </select>

                        <select 
                            value={filters.municipio}
                            onChange={(e) => setFilters(prev => ({ ...prev, municipio: e.target.value }))}
                            disabled={!filters.estado}
                            className="flex-1 min-w-[140px] bg-white border border-slate-100 rounded-[16px] md:rounded-[20px] px-4 md:px-6 py-3 md:py-4 text-[10px] md:text-xs font-black text-slate-900 outline-none focus:ring-4 focus:ring-indigo-50 shadow-sm transition-all appearance-none cursor-pointer disabled:opacity-50"
                        >
                            <option value="">Municipio</option>
                            {catalogs.municipios?.filter((m: any) => m.id_entidad === parseInt(filters.estado)).map((m: any) => (
                                <option key={m.id_municipio} value={m.id_municipio}>{m.nombre}</option>
                            ))}
                        </select>

                        <select 
                            value={filters.sostenimiento}
                            onChange={(e) => setFilters(prev => ({ ...prev, sostenimiento: e.target.value }))}
                            className="flex-1 min-w-[140px] bg-white border border-slate-100 rounded-[16px] md:rounded-[20px] px-4 md:px-6 py-3 md:py-4 text-[10px] md:text-xs font-black text-slate-900 outline-none focus:ring-4 focus:ring-indigo-50 shadow-sm transition-all appearance-none cursor-pointer"
                        >
                            <option value="">Sector</option>
                            <option value="2">Pública</option>
                            <option value="1">Particular</option>
                        </select>
                    </div>
                </div>

                {/* Level Multi-Selector */}
                <div className="bg-white p-6 rounded-[32px] border border-slate-100 shadow-sm">
                    <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Nivel Académico (Selección múltiple):</div>
                    <div className="flex flex-wrap gap-2">
                        {catalogs.niveles?.map((n: any) => {
                            const isSelected = filters.niveles.includes(n.id_nivel);
                            return (
                                <button
                                    key={n.id_nivel}
                                    onClick={() => {
                                        setFilters(prev => ({
                                            ...prev,
                                            niveles: isSelected 
                                                ? prev.niveles.filter(id => id !== n.id_nivel)
                                                : [...prev.niveles, n.id_nivel]
                                        }));
                                    }}
                                    className={`px-4 py-2 rounded-xl text-[10px] font-bold transition-all ${
                                        isSelected 
                                        ? 'bg-indigo-600 text-white border-transparent' 
                                        : 'bg-slate-50 text-slate-500 border border-slate-100 hovr:border-indigo-200'
                                    }`}
                                >
                                    {n.nombre.includes('TÉCNICO') ? 'TSU' : (n.nombre.includes('NORMAL') ? 'NORMAL' : (n.nombre.includes('LICENCIATURA') ? 'LICENCIATURA' : n.nombre))}
                                </button>
                            );
                        })}
                        <button 
                            onClick={() => setFilters(prev => ({ ...prev, niveles: [1, 5, 6] }))}
                            className="ml-auto px-4 py-2 text-[9px] font-black text-indigo-600 uppercase tracking-widest hover:underline"
                        >
                            Reset a Grado Superior (Lyc + TSU)
                        </button>
                    </div>
                </div>

                {/* Results Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {searching ? (
                        [...Array(8)].map((_, i) => (
                            <div key={i} className="h-64 bg-slate-50 animate-pulse rounded-[32px] border border-slate-100" />
                        ))
                    ) : (
                        results.map((o) => {
                            const isSelected = selectedIds.includes(o.id_oferta);
                            const canSelect = selectedIds.length < 4 || isSelected;
                            const ipd = o.nuevo_ingreso_total > 0 ? (o.solicitudes_total / o.nuevo_ingreso_total).toFixed(2) : '1.00';

                            return (
                                <motion.div 
                                    key={o.id_oferta}
                                    layout
                                    className={`relative p-6 bg-white rounded-[32px] border-2 transition-all group ${
                                        isSelected ? 'border-indigo-600 shadow-xl shadow-indigo-50' : 'border-slate-50 hover:border-slate-100 hover:shadow-lg'
                                    }`}
                                >
                                    <div className="flex justify-between items-start mb-6">
                                        <div className={`px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest ${
                                            o.sostenimiento === 'PÚBLICO' ? 'bg-indigo-600 text-white' : 'bg-amber-500 text-white'
                                        }`}>
                                            {o.sostenimiento === 'PÚBLICO' ? 'PÚBLICA' : 'PARTICULAR'}
                                        </div>
                                        <button 
                                            onClick={() => handleToggleSelection(o.id_oferta)}
                                            disabled={!canSelect}
                                            className={`p-2 rounded-xl transition-all ${
                                                isSelected 
                                                ? 'bg-red-50 text-red-500 hover:bg-red-500 hover:text-white' 
                                                : 'bg-slate-50 text-slate-400 hover:bg-indigo-600 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed'
                                            }`}
                                        >
                                            {isSelected ? <Trash2 size={16} /> : <Plus size={16} />}
                                        </button>
                                    </div>

                                    <h4 className="font-black text-slate-900 text-sm mb-1 leading-tight line-clamp-2 min-h-[40px]">{shortenCareerName(o.carrera_nombre)}</h4>
                                    <div className="space-y-0.5 mb-6">
                                        <p className="text-[10px] font-black text-slate-900 uppercase tracking-tight truncate">{o.inst_nombre}</p>
                                        <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wide truncate flex items-center gap-1 opacity-80">
                                            <MapPin size={8} /> {o.escuela_nombre || 'Sede Principal'}
                                        </p>
                                    </div>

                                    <div className="flex items-center justify-between pt-4 border-t border-slate-50">
                                        <div>
                                            <div className="text-[8px] font-black text-slate-300 uppercase tracking-widest mb-0.5">Selectividad</div>
                                            <div className="text-sm font-black text-slate-900">{ipd}x IPD</div>
                                        </div>
                                        <div className="p-2.5 bg-slate-50 rounded-xl text-slate-400 group-hover:text-indigo-600 transition-colors">
                                            <Info size={18} />
                                        </div>
                                    </div>
                                </motion.div>
                            );
                        })
                    )}
                </div>
            </div>
        </div>
    );
};

export default Comparator;
