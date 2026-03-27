import React, { useState, useEffect, useCallback, useRef } from 'react';
import MapComponent from '../components/MapComponent';
import { 
  Search, 
  Compass, 
  BookOpen, 
  ChevronRight,
  Users,
  Filter,
  MapPin,
  GraduationCap,
  X,
  ArrowRight,
  Building2,
  BarChart2,
  Map as MapIcon
} from 'lucide-react';
import { useUI } from '../context/UIContext';
import { motion, AnimatePresence } from 'framer-motion';
import Logo from '../components/Logo';
import { 
  getEscuelasMap, 
  searchCarreras, 
  getSubsistemas, 
  getFilters, 
  getOfertasByInstitucion,
  searchInstitucionesSuggest
} from '../api';
import { Link, useNavigate } from 'react-router-dom';
import { shortenCareerName } from '../utils/formatters';
import { Escuela, Carrera, Municipio, Nivel, CampoFormacion, Oferta, Institucion } from '../types';

const Home: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [escuelas, setEscuelas] = useState<Escuela[]>([]);
  const [loading, setLoading] = useState(true);
  const [subsistemas, setSubsistemas] = useState<string[]>([]);
  const [selectedSubsistema, setSelectedSubsistema] = useState('Todos los Subsistemas');
  const [selectedEscuelaId, setSelectedEscuelaId] = useState<string | null>(null);
  // Search Suggestions
  const [suggestions, setSuggestions] = useState<Carrera[]>([]);
  const [instSuggestions, setInstSuggestions] = useState<Institucion[]>([]);
  const [selectedCarrera, setSelectedCarrera] = useState<Carrera | null>(null);
  const navigate = useNavigate();
  const { setSidebarHidden, hasSeenWelcome, markWelcomeAsSeen } = useUI();
  const [showWelcome, setShowWelcome] = useState(!hasSeenWelcome);
  const [highlight, setHighlight] = useState<string>('');

  // Offers of the selected school
  const [selectedEscuelaOfertas, setSelectedEscuelaOfertas] = useState<Oferta[]>([]);
  const [loadingOfertas, setLoadingOfertas] = useState(false);

  // Catalogs
  const [catalogs, setCatalogs] = useState<{
    estados: { id_entidad: number; nombre: string }[];
    municipios: Municipio[];
    niveles: Nivel[];
    campos: CampoFormacion[];
  }>({ estados: [], municipios: [], niveles: [], campos: [] });

  const mapSectionRef = useRef<HTMLDivElement>(null);
  // Filters
  const [filters, setFilters] = useState({
    estado: '',
    municipio: '',
    nivel: '',
    sostenimiento: '',
  });

  const [showFilters, setShowFilters] = useState(false);

  // Sync sidebar visibility
  useEffect(() => {
    if (showWelcome) {
      setSidebarHidden(true);
    } else {
      // Small delay when entering the app from welcome to avoid layout jumps
      const timer = setTimeout(() => setSidebarHidden(false), 300);
      return () => clearTimeout(timer);
    }
  }, [showWelcome, setSidebarHidden]);

  // Load Highlights
  useEffect(() => {
    if (showWelcome) {
      const fetchHighlights = async () => {
        try {
          const resp = await fetch('/observatorio_data.json');
          if (!resp.ok) return;
          const data = await resp.json();
          const facts = [];
          
          if (data.counters) {
            facts.push(`México cuenta con más de ${data.counters.total_programas.toLocaleString()} programas de educación superior.`);
            facts.push(`Actualmente se registran ${(data.counters.total_estudiantes / 1000000).toFixed(1)} millones de alumnos en el sistema.`);
          }
          if (data.v4_dificultad && data.v4_dificultad.length > 0) {
            facts.push(`¿Sabías que "${data.v4_dificultad[0].carrera}" es una de las carreras con mayor competencia por lugar?`);
          }
          if (data.v2_genero) {
            const topWomen = [...data.v2_genero].sort((a,b) => (b.mujeres/b.total) - (a.mujeres/a.total))[0];
            if (topWomen) facts.push(`El área de ${topWomen.campo_amplio} destaca por tener la mayor proporción de mujeres estudiantes.`);
          }
          
          if (facts.length > 0) {
            setHighlight(facts[Math.floor(Math.random() * facts.length)]);
          }
        } catch (e) {
          console.error(e);
        }
      };
      fetchHighlights();
    }
  }, [showWelcome]);

  const handleEnterApp = () => {
    setShowWelcome(false);
    markWelcomeAsSeen();
  };

  useEffect(() => {
    const loadCatalogs = async () => {
      const data = await getFilters();
      if (data) {
        setCatalogs({
          estados: data.estados,
          municipios: data.municipios,
          niveles: data.niveles,
          campos: data.campos
        });
      }
    };
    loadCatalogs();
  }, []);

  const fetchEscuelas = useCallback(async () => {
    setLoading(true);
    try {
      const apiFilters: {
        estado?: number;
        municipio?: number;
        nivel?: number;
        sostenimiento?: number;
        carrera?: number;
        q?: string;
      } = {
        estado: filters.estado ? Number(filters.estado) : undefined,
        municipio: filters.municipio ? Number(filters.municipio) : undefined,
        nivel: filters.nivel ? Number(filters.nivel) : undefined,
        sostenimiento: filters.sostenimiento ? Number(filters.sostenimiento) : undefined,
      };

      if (selectedCarrera) {
        apiFilters.carrera = selectedCarrera.id_carrera;
      } else if (searchTerm.trim() !== '') {
        apiFilters.q = searchTerm.trim();
      }

      const data = await getEscuelasMap(apiFilters);
      setEscuelas(data);
    } catch (error) {
      console.error('Error fetching escuelas:', error);
    } finally {
      setLoading(false);
    }
  }, [selectedCarrera, filters, searchTerm]);

  const initialFetchDone = useRef(false);
  useEffect(() => {
    if (!initialFetchDone.current) {
      fetchEscuelas();
      initialFetchDone.current = true;
    }
  }, [fetchEscuelas]);

  useEffect(() => {
    const loadSubsistemas = async () => {
      try {
        const data = await getSubsistemas();
        setSubsistemas(data);
      } catch (e) {
        console.error('Error loading subsistemas:', e);
      }
    };
    loadSubsistemas();
  }, []);

  useEffect(() => {
    if (searchTerm.length > 2 && !selectedCarrera) {
      const delayDebounceFn = setTimeout(async () => {
        try {
          const [careerResults, instResults] = await Promise.all([
            searchCarreras(searchTerm),
            searchInstitucionesSuggest(searchTerm)
          ]);
          setSuggestions(careerResults);
          setInstSuggestions(instResults);
        } catch (e) {
          console.error('Error searching suggestions:', e);
        }
      }, 300);
      return () => clearTimeout(delayDebounceFn);
    } else {
      setSuggestions([]);
      setInstSuggestions([]);
    }
  }, [searchTerm, selectedCarrera]);

  const handleSelectCarrera = (carrera: Carrera) => {
    setSelectedCarrera(carrera);
    setSearchTerm(carrera.nombre);
    setSuggestions([]);
  };

  const executeSearch = () => {
    fetchEscuelas();
    setSuggestions([]);
    
    // Scroll to map after a short delay to allow state updates
    setTimeout(() => {
      mapSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 100);
  };

  useEffect(() => {
    const fetchOfertas = async () => {
        if (!selectedEscuelaId) {
            setSelectedEscuelaOfertas([]);
            return;
        }
        
        const escuela = escuelas.find(e => String(e.id_escuela) === String(selectedEscuelaId));
        if (escuela) {
            setLoadingOfertas(true);
            try {
                const data = await getOfertasByInstitucion(escuela.id_institucion);
                
                // Sort by relevance if there is a search term or selected career
                let sortedData = data || [];
                if (searchTerm || selectedCarrera) {
                    const term = (selectedCarrera?.nombre || searchTerm).toLowerCase();
                    sortedData = [...sortedData].sort((a, b) => {
                        const aMatch = a.carrera_nombre.toLowerCase().includes(term);
                        const bMatch = b.carrera_nombre.toLowerCase().includes(term);
                        if (aMatch && !bMatch) return -1;
                        if (!aMatch && bMatch) return 1;
                        return 0;
                    });
                }
                
                setSelectedEscuelaOfertas(sortedData);
            } catch (e) {
                console.error('Error fetching ofertas:', e);
            } finally {
                setLoadingOfertas(false);
            }
        }
    };
    fetchOfertas();
  }, [selectedEscuelaId, escuelas, searchTerm, selectedCarrera]);

  const filteredEscuelas = escuelas.filter(e => {
    const matchesSubsistema = selectedSubsistema === 'Todos los Subsistemas' || e.subsistema === selectedSubsistema;
    return matchesSubsistema;
  });

  const selectedEscuela = escuelas.find(e => String(e.id_escuela) === String(selectedEscuelaId)) || null;

  const activeMunicipios = catalogs.municipios.filter(m => 
    !filters.estado || m.id_entidad === Number(filters.estado)
  );

  const resetFilters = () => {
    setFilters({ estado: '', municipio: '', nivel: '', sostenimiento: '' });
    setSearchTerm('');
    setSelectedCarrera(null);
  };

  const handleAreaClick = (areaName: string) => {
    setSearchTerm(areaName);
    setSelectedCarrera(null);
    setLoading(true);
    setTimeout(() => fetchEscuelas(), 100);
  };

  // Trigger fetch when filters change
  useEffect(() => {
    if (initialFetchDone.current) {
        fetchEscuelas();
    }
  }, [filters, selectedSubsistema]);

  return (
    <div className="relative min-h-screen">
      <AnimatePresence mode="wait">
        {showWelcome ? (
          <motion.section 
            key="welcome"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, y: -50 }}
            className="fixed inset-0 z-[2000] bg-white flex flex-col items-center justify-center p-8 overflow-hidden"
          >
            {/* Animated Background Elements */}
            <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-indigo-50 rounded-full blur-[120px] opacity-60 animate-pulse" />
            <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-emerald-50 rounded-full blur-[120px] opacity-60 animate-pulse" />

            <motion.div 
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.2, type: 'spring' }}
              className="relative z-10 flex flex-col items-center text-center"
            >
              <div className="w-28 h-28 bg-indigo-600 text-white rounded-[40px] flex items-center justify-center shadow-2xl shadow-indigo-200 mb-8 border-4 border-white p-5">
                <Logo size="100%" color="white" />
              </div>
              
              <h1 className="text-4xl md:text-7xl font-black text-slate-900 tracking-tighter mb-4 leading-none px-4">
                EduMap <span className="text-indigo-600">México</span>
              </h1>
              
              <p className="text-xl text-slate-500 font-medium max-w-xl mb-12 leading-relaxed">
                Explora el futuro de la educación superior en México con datos oficiales y herramientas inteligentes.
              </p>

              <div className="flex flex-col md:flex-row gap-4 md:gap-6 w-full max-w-md px-6">
                <button 
                  onClick={handleEnterApp}
                  className="group relative flex-1 flex flex-row md:flex-col items-center gap-4 p-5 md:p-8 bg-white border border-slate-100 rounded-[32px] md:rounded-[40px] shadow-xl hover:shadow-2xl hover:border-indigo-200 transition-all hover:-translate-y-2 active:scale-95 text-left md:text-center"
                >
                  <div className="w-12 h-12 md:w-16 md:h-16 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center group-hover:bg-indigo-600 group-hover:text-white transition-all shrink-0">
                    <Search size={24} md={32} strokeWidth={2.5} />
                  </div>
                  <div>
                    <span className="block font-black text-slate-900 text-base md:text-lg uppercase tracking-tight">Explorar</span>
                    <span className="block text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">Busca tu carrera</span>
                  </div>
                </button>

                <button 
                  onClick={() => navigate('/observatorio')}
                  className="group relative flex-1 flex flex-row md:flex-col items-center gap-4 p-5 md:p-8 bg-white border border-slate-100 rounded-[32px] md:rounded-[40px] shadow-xl hover:shadow-2xl hover:border-emerald-200 transition-all hover:-translate-y-2 active:scale-95 text-left md:text-center"
                >
                  <div className="w-12 h-12 md:w-16 md:h-16 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center group-hover:bg-emerald-600 group-hover:text-white transition-all shrink-0">
                    <BarChart2 size={24} md={32} strokeWidth={2.5} />
                  </div>
                  <div>
                    <span className="block font-black text-slate-900 text-base md:text-lg uppercase tracking-tight">Observatorio</span>
                    <span className="block text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">Estadísticas</span>
                  </div>
                </button>
              </div>

              {/* Curious Fact Badge */}
              {highlight && (
                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 1 }}
                  className="mt-8 md:mt-12 flex items-center gap-4 px-6 py-4 bg-slate-50 border border-slate-100 rounded-[24px] md:rounded-3xl max-w-lg mx-6"
                >
                  <div className="w-10 h-10 bg-amber-100 text-amber-600 rounded-xl flex items-center justify-center shrink-0">
                    <Compass size={20} />
                  </div>
                  <p className="text-xs md:text-sm font-bold text-slate-600 text-left">
                    <span className="text-indigo-600 uppercase text-[9px] md:text-[10px] tracking-widest block mb-0.5">Dato Curioso</span>
                    {highlight}
                  </p>
                </motion.div>
              )}
            </motion.div>
          </motion.section>
        ) : (
          <motion.div 
            key="main"
            initial={{ opacity: 0, scale: 1.05 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
            className="flex flex-col gap-8 animate-fade-in pb-20"
          >
      {/* --- HERO & SEARCH SECTION --- */}
      <section className="relative pt-12 pb-8">
        <div className="max-w-4xl mx-auto text-center mb-12">
            <motion.h1 
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-4xl md:text-7xl font-black tracking-tighter mb-4 md:mb-6 leading-none text-slate-900 px-4"
            >
                Encuentra tu <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 via-violet-600 to-emerald-500">Futuro Académico</span>
            </motion.h1>
            <motion.p 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.2 }}
                className="text-lg text-slate-500 font-medium"
            >
                Explora más de 4,000 instituciones y 14,000 programas de educación superior en México.
            </motion.p>
        </div>

        <div className="max-w-5xl mx-auto relative z-[1002]">
            {/* Unified Search Bar */}
            <div className="flex flex-col md:flex-row gap-3 p-3 bg-white border border-slate-100 rounded-[32px] shadow-2xl shadow-indigo-100/50 backdrop-blur-xl">
                <div className="relative flex-1 group">
                    <div className="absolute inset-y-0 left-5 flex items-center pointer-events-none text-slate-400 group-focus-within:text-indigo-600 transition-colors">
                        <Search size={22} />
                    </div>
                    <input
                        type="text"
                        placeholder="Busca una carrera o nombre de universidad..."
                        className="w-full pl-14 pr-6 py-5 bg-slate-50 border-transparent rounded-[24px] focus:bg-white focus:border-indigo-100 focus:ring-4 focus:ring-indigo-50 transition-all outline-none font-bold text-base text-slate-900 placeholder:text-slate-400"
                        value={searchTerm}
                        onChange={(e) => {
                            setSearchTerm(e.target.value);
                            if (selectedCarrera) setSelectedCarrera(null);
                        }}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                                executeSearch();
                            }
                        }}
                    />
                    
                    <AnimatePresence>
                    {searchTerm.length > 2 && (suggestions.length > 0) && (
                        <motion.div
                            initial={{ opacity: 0, y: 10, scale: 0.95 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: 10, scale: 0.95 }}
                            className="absolute top-full left-0 right-0 mt-3 bg-white rounded-[32px] shadow-2xl border border-slate-100 overflow-hidden z-[1003] p-2"
                        >
                        {/* Literal Search Option */}
                        <button
                            onClick={() => {
                                executeSearch();
                            }}
                            className="w-full flex items-center gap-4 px-6 py-4 hover:bg-slate-50 rounded-2xl transition-all text-left group border-b border-slate-50 mb-1"
                        >
                            <div className="p-3 bg-slate-100 text-slate-400 rounded-xl group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                                <Search size={20} />
                            </div>
                            <div className="flex-1">
                                <div className="font-black text-slate-900 text-sm">Buscar "{searchTerm}"</div>
                                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Búsqueda general</div>
                            </div>
                            <ArrowRight className="text-slate-200 group-hover:text-indigo-600 transition-colors" size={18} />
                        </button>

                        {/* Institutions Suggestions */}
                        {instSuggestions.map((inst, i) => (
                            <button
                                key={`inst-${i}`}
                                onClick={() => navigate(`/instituciones/${inst.id_institucion}`)}
                                className="w-full flex items-center gap-4 px-6 py-4 hover:bg-emerald-50/50 rounded-2xl transition-all text-left group"
                            >
                                <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl group-hover:bg-emerald-600 group-hover:text-white transition-colors">
                                    <Building2 size={20} />
                                </div>
                                <div className="flex-1">
                                    <div className="font-black text-slate-900 text-sm group-hover:text-emerald-600 transition-colors">
                                        {inst.nombre} {inst.siglas ? `(${inst.siglas})` : ''}
                                    </div>
                                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{inst.sostenimiento} • {inst.subsistema}</div>
                                </div>
                                <ChevronRight className="text-slate-200 group-hover:text-emerald-600 transition-colors" size={18} />
                            </button>
                        ))}

                        {/* Career Suggestions */}
                        {suggestions.map((s, i) => (
                            <button
                                key={`carrera-${i}`}
                                onClick={() => handleSelectCarrera(s)}
                                className="w-full flex items-center gap-4 px-6 py-4 hover:bg-indigo-50/50 rounded-2xl transition-all text-left group"
                            >
                                <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                                    <BookOpen size={20} />
                                </div>
                                <div className="flex-1">
                                    <div className="font-black text-slate-900 text-sm group-hover:text-indigo-600 transition-colors">{shortenCareerName(s.nombre)}</div>
                                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{s.area}</div>
                                </div>
                                <ChevronRight className="text-slate-200 group-hover:text-indigo-600 transition-colors" size={18} />
                            </button>
                        ))}
                        </motion.div>
                    )}
                    </AnimatePresence>
                </div>

                <div className="flex gap-2">
                    <button 
                        onClick={executeSearch}
                        className="flex items-center gap-3 px-10 py-5 bg-indigo-600 text-white rounded-[24px] font-black text-sm tracking-widest hover:bg-indigo-700 hover:shadow-xl hover:shadow-indigo-200 transition-all active:scale-95 shadow-lg shadow-indigo-100"
                    >
                        BUSCAR
                        <ArrowRight size={18} />
                    </button>
                </div>
            </div>

            {/* Expanded Filters */}
            <AnimatePresence>
            {showFilters && (
                <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="overflow-hidden"
                >
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-4 p-6 bg-white border border-slate-100 rounded-[32px] shadow-xl">
                        {/* Estado */}
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 flex items-center gap-2">
                                <MapPin size={12} className="text-indigo-500" /> Estado
                            </label>
                            <select 
                                value={filters.estado}
                                onChange={(e) => setFilters({ ...filters, estado: e.target.value, municipio: '' })}
                                className="w-full bg-slate-50 border-none rounded-2xl px-5 py-3.5 text-xs font-bold text-slate-700 outline-none focus:ring-2 focus:ring-indigo-100 transition-all appearance-none cursor-pointer"
                            >
                                <option value="">Todos los Estados</option>
                                {catalogs.estados.map(e => <option key={e.id_entidad} value={e.id_entidad}>{e.nombre}</option>)}
                            </select>
                        </div>

                        {/* Municipio */}
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 flex items-center gap-2">
                                <MapPin size={12} className="text-violet-500" /> Municipio
                            </label>
                            <select 
                                value={filters.municipio}
                                disabled={!filters.estado}
                                onChange={(e) => setFilters({ ...filters, municipio: e.target.value })}
                                className="w-full bg-slate-50 border-none rounded-2xl px-5 py-3.5 text-xs font-bold text-slate-700 outline-none focus:ring-2 focus:ring-indigo-100 transition-all appearance-none cursor-pointer disabled:opacity-50"
                            >
                                <option value="">Todos los Municipios</option>
                                {activeMunicipios.map(m => <option key={m.id_municipio} value={m.id_municipio}>{m.nombre}</option>)}
                            </select>
                        </div>

                        {/* Nivel */}
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 flex items-center gap-2">
                                <GraduationCap size={12} className="text-emerald-500" /> Nivel Educativo
                            </label>
                            <select 
                                value={filters.nivel}
                                onChange={(e) => setFilters({ ...filters, nivel: e.target.value })}
                                className="w-full bg-slate-50 border-none rounded-2xl px-5 py-3.5 text-xs font-bold text-slate-700 outline-none focus:ring-2 focus:ring-indigo-100 transition-all appearance-none cursor-pointer"
                            >
                                <option value="">Todos los Niveles</option>
                                {catalogs.niveles.map(n => <option key={n.id_nivel} value={n.id_nivel}>{n.nombre.includes('TÉCNICO') ? 'TSU' : (n.nombre.includes('NORMAL') ? 'NORMAL' : (n.nombre.includes('LICENCIATURA') ? 'LICENCIATURA' : n.nombre))}</option>)}
                            </select>
                        </div>

                        {/* Reset / Actions */}
                        <div className="flex items-end pb-1 px-1">
                            <button 
                                onClick={resetFilters}
                                className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-2xl text-[10px] font-black text-slate-400 hover:text-red-500 hover:bg-red-50 transition-all tracking-widest"
                            >
                                <X size={14} /> REINICIAR FILTROS
                            </button>
                        </div>
                    </div>
                </motion.div>
            )}
            </AnimatePresence>
        </div>
      </section>

      {/* --- FILTERS & MAP SECTION --- */}
      <div ref={mapSectionRef} className="flex flex-col gap-4">
        {/* Filter Bar - Responsive & Scrollable */}
        <div className="flex items-center gap-3 overflow-x-auto pb-4 mb-2 -mx-4 px-4 md:mx-0 md:px-0 md:pb-8 md:mb-0 no-scrollbar scroll-smooth">
            {/* Estado */}
            <div className="flex items-center gap-2 px-4 py-2 bg-white rounded-2xl border border-slate-100 shadow-sm focus-within:border-indigo-100 transition-all shrink-0">
                <MapPin size={14} className="text-indigo-500" />
                <select 
                    value={filters.estado}
                    onChange={(e) => setFilters({ ...filters, estado: e.target.value, municipio: '' })}
                    className="bg-transparent border-none text-[11px] font-bold text-slate-700 outline-none cursor-pointer pr-4"
                >
                    <option value="">Todos los Estados</option>
                    {catalogs.estados.map(e => <option key={e.id_entidad} value={e.id_entidad}>{e.nombre}</option>)}
                </select>
            </div>

            {/* Municipio */}
            <div className={`flex items-center gap-2 px-4 py-2 bg-white rounded-2xl border border-slate-100 shadow-sm focus-within:border-indigo-100 transition-all shrink-0 ${!filters.estado ? 'opacity-50' : ''}`}>
                <Search size={14} className="text-violet-500" />
                <select 
                    value={filters.municipio}
                    disabled={!filters.estado}
                    onChange={(e) => setFilters({ ...filters, municipio: e.target.value })}
                    className="bg-transparent border-none text-[11px] font-bold text-slate-700 outline-none cursor-pointer pr-4 disabled:cursor-not-allowed"
                >
                    <option value="">Todos los Municipios</option>
                    {activeMunicipios.map(m => <option key={m.id_municipio} value={m.id_municipio}>{m.nombre}</option>)}
                </select>
            </div>

            {/* Nivel */}
            <div className="flex items-center gap-2 px-4 py-2 bg-white rounded-2xl border border-slate-100 shadow-sm focus-within:border-indigo-100 transition-all shrink-0">
                <GraduationCap size={14} className="text-emerald-500" />
                <select 
                    value={filters.nivel}
                    onChange={(e) => setFilters({ ...filters, nivel: e.target.value })}
                    className="bg-transparent border-none text-[11px] font-bold text-slate-700 outline-none cursor-pointer pr-4"
                >
                    <option value="">Todos los Niveles</option>
                    {catalogs.niveles.map(n => <option key={n.id_nivel} value={n.id_nivel}>{n.nombre.includes('TÉCNICO') ? 'TSU' : (n.nombre.includes('NORMAL') ? 'NORMAL' : (n.nombre.includes('LICENCIATURA') ? 'LICENCIATURA' : n.nombre))}</option>)}
                </select>
            </div>

            {/* Sostenimiento */}
            <div className="flex items-center p-1 bg-white rounded-2xl border border-slate-100 shadow-sm gap-1 shrink-0">
                {[
                    { id: '', label: 'Todas' },
                    { id: '2', label: 'Públicas' },
                    { id: '1', label: 'Privadas' },
                ].map((s) => (
                    <button
                        key={s.id}
                        onClick={() => setFilters({ ...filters, sostenimiento: s.id })}
                        className={`px-4 py-1.5 rounded-xl text-[10px] font-black transition-all uppercase tracking-widest ${
                            filters.sostenimiento === s.id
                            ? 'bg-slate-100 text-indigo-600 shadow-sm'
                            : 'text-slate-400 hover:text-slate-600'
                        }`}
                    >
                        {s.label}
                    </button>
                ))}
            </div>

            <div className="hidden md:block flex-1" />

            <div className="flex items-center gap-3 px-4 shrink-0">
                <div className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none whitespace-nowrap">{filteredEscuelas.length} Instituciones</span>
                </div>
                <button 
                    onClick={resetFilters}
                    className="p-1 text-slate-400 hover:text-red-500 transition-colors"
                >
                    <X size={16} />
                </button>
            </div>
        </div>

        <div className="h-[500px] md:h-[700px] relative rounded-[32px] md:rounded-[48px] overflow-hidden border border-slate-100 shadow-2xl bg-white group">
            {filteredEscuelas.length > 0 ? (
                <MapComponent 
                    escuelas={filteredEscuelas} 
                    selectedId={selectedEscuelaId}
                    onEscuelaSelect={setSelectedEscuelaId}
                    subsistemas={subsistemas}
                    selectedSubsistema={selectedSubsistema}
                    onSubsistemaChange={setSelectedSubsistema}
                    selectedEstado={filters.estado}
                    selectedMunicipio={filters.municipio}
                />
            ) : !loading && (
                <div className="absolute inset-0 flex flex-col items-center justify-center p-12 bg-slate-50/50 backdrop-blur-sm">
                    <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center shadow-xl mb-6">
                        <Search size={40} className="text-slate-200" />
                    </div>
                    <h3 className="text-2xl font-black text-slate-900 mb-2">Sin coincidencias</h3>
                    <p className="text-slate-500 text-center max-w-sm mb-8 font-medium">
                        No hemos encontrado instituciones que coincidan con tus filtros actuales. Intenta ajustar tu búsqueda.
                    </p>
                    <button 
                        onClick={resetFilters}
                        className="px-8 py-4 bg-indigo-600 text-white rounded-2xl font-black text-xs tracking-widest hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100"
                    >
                        REINICIAR BÚSQUEDA
                    </button>
                </div>
            )}
            
            <AnimatePresence>
              {loading && (
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="absolute inset-0 z-[1001] bg-white/60 backdrop-blur-[2px] flex items-center justify-center"
                >
                  <div className="text-center">
                    <Compass className="w-12 h-12 text-indigo-600 animate-spin mx-auto mb-4" />
                    <p className="text-slate-900 font-bold">Actualizando mapa...</p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* --- SIDE DETAIL PANEL / BOTTOM SHEET --- */}
            <AnimatePresence>
              {selectedEscuela && (
                <motion.div
                  initial={{ y: '100%', opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  exit={{ y: '100%', opacity: 0 }}
                  transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                  className={`
                    absolute z-[1002] bg-white/95 backdrop-blur-xl border border-slate-100/50 flex flex-col overflow-hidden
                    md:top-6 md:right-6 md:bottom-6 md:w-[320px] md:rounded-[32px] md:shadow-2xl md:fixed
                    left-0 right-0 bottom-0 top-auto h-[75vh] md:h-auto rounded-t-[40px] shadow-[0_-12px_50px_rgba(0,0,0,0.15)]
                  `}
                >
                  {/* Handle for Bottom Sheet on mobile */}
                  <div className="md:hidden w-12 h-1.5 bg-slate-200 rounded-full mx-auto mt-4 shrink-0" />

                  {/* Header / Image */}
                  <div className={`relative shrink-0 ${window.innerWidth < 768 ? 'h-48' : 'h-40'}`}>
                    <img 
                      src={selectedEscuela.banner_url || selectedEscuela.logo_url || `https://picsum.photos/seed/${selectedEscuela.id_escuela}/800/600`}
                      className="w-full h-full object-cover"
                      alt={selectedEscuela.nombre}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-white via-white/10 to-transparent" />
                    <button 
                      onClick={() => setSelectedEscuelaId(null)}
                      className="absolute top-4 right-4 p-2.5 bg-white/90 backdrop-blur-md rounded-xl shadow-lg text-slate-400 hover:text-red-500 transition-all"
                    >
                      <X size={16} />
                    </button>
                    
                    <div className="absolute -bottom-6 left-6">
                      <div className="w-16 h-16 bg-white rounded-xl p-2 shadow-xl border border-slate-50">
                          <img 
                              src={selectedEscuela.logo_url || `https://picsum.photos/seed/${selectedEscuela.id_escuela}/200/200`}
                              className="w-full h-full object-contain"
                              alt="Logo"
                          />
                      </div>
                    </div>
                  </div>

                  {/* Content */}
                  <div className={`flex-1 overflow-y-auto custom-scrollbar px-6 pb-6 ${window.innerWidth < 768 ? 'mt-10' : 'mt-8'}`}>
                      <div className="mb-4">
                          <h2 className="text-lg font-black text-slate-900 leading-tight mb-1 uppercase tracking-tight">{selectedEscuela.nombre}</h2>
                          <div className="flex items-center gap-3">
                              <div className="flex items-center gap-1 text-amber-500">
                                  <Star size={14} fill="currentColor" />
                                  <span className="text-xs font-black tracking-tight">{Number(selectedEscuela.promedio_calificacion || 0).toFixed(1)}</span>
                              </div>
                              <div className="h-2 w-px bg-slate-200" />
                              <span className="text-[10px] font-black text-indigo-600 uppercase tracking-widest">{selectedEscuela.sostenimiento}</span>
                          </div>
                      </div>

                      <div className="space-y-4">
                          <div className="p-5 bg-slate-50/50 rounded-[28px] border border-slate-100/50">
                              <h4 className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] mb-3">UBICACIÓN</h4>
                              <div className="flex items-start gap-3">
                                  <MapPin className="text-indigo-600 shrink-0" size={16} />
                                  <div>
                                      <p className="text-sm font-bold text-slate-800 leading-tight">{selectedEscuela.municipio_nombre}</p>
                                      <p className="text-[10px] text-slate-400 font-medium">{catalogs.estados.find(e => e.id_entidad === Number(filters.estado))?.nombre || 'México'}</p>
                                  </div>
                              </div>
                          </div>

                          <div className="p-5 bg-indigo-50/30 rounded-[28px] border border-indigo-100/20">
                              <h3 className="text-[9px] font-black text-indigo-400 uppercase tracking-[0.2em] mb-3 flex justify-between items-center">
                                  OFERTA ACADÉMICA
                                  {selectedEscuelaOfertas.length > 0 && <span className="bg-indigo-600 text-white px-2 py-0.5 rounded-full text-[8px]">{selectedEscuelaOfertas.length}</span>}
                              </h3>
                              
                              <div className="space-y-3 max-h-[250px] overflow-y-auto custom-scrollbar pr-1">
                                  {loadingOfertas ? (
                                      <div className="py-4 text-center">
                                          <div className="w-5 h-5 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto" />
                                      </div>
                                  ) : selectedEscuelaOfertas.length > 0 ? (
                                      selectedEscuelaOfertas.slice(0, 15).map((o, i) => (
                                          <div key={i} className={`min-w-0 p-3 rounded-xl transition-all ${
                                              (searchTerm || selectedCarrera) && o.carrera_nombre.toLowerCase().includes((selectedCarrera?.nombre || searchTerm).toLowerCase())
                                              ? 'bg-indigo-50 border border-indigo-100/50'
                                              : 'bg-white/50'
                                          }`}>
                                              <p className="text-xs font-bold text-slate-700 truncate">{shortenCareerName(o.carrera_nombre)}</p>
                                              <p className="text-[9px] text-slate-400 font-black uppercase tracking-widest mt-0.5">{o.nivel_nombre?.includes('TÉCNICO') ? 'TSU' : (o.nivel_nombre?.includes('NORMAL') ? 'NORMAL' : (o.nivel_nombre?.includes('LICENCIATURA') ? 'LICENCIATURA' : o.nivel_nombre))}</p>
                                          </div>
                                      ))
                                  ) : (
                                      <p className="text-xs text-slate-400 font-medium italic py-2">Sin programas registrados</p>
                                  )}
                              </div>
                          </div>
                      </div>
                  </div>

                  {/* Footer */}
                  <div className="p-6 bg-white border-t border-slate-100">
                      <Link 
                          to={`/instituciones/${selectedEscuela.id_institucion}`}
                          className="w-full flex items-center justify-center gap-3 py-4 bg-indigo-600 text-white rounded-2xl font-black text-xs tracking-widest hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-100"
                      >
                          VER PERFIL COMPLETO
                          <ArrowRight size={18} />
                      </Link>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
        </div>
      </div>

      {/* Quick Access Grid (Below Map) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* How to explore */}
        <div className="bg-white rounded-[40px] p-8 border border-slate-100 shadow-sm h-full">
            <h3 className="text-sm font-black text-slate-900 mb-6 flex items-center gap-2 uppercase tracking-widest">
              <Compass size={18} className="text-indigo-600" />
              ¿Cómo explorar?
            </h3>
            <div className="grid grid-cols-1 gap-4">
              {[
                { step: 1, color: 'bg-indigo-50 text-indigo-600', text: 'Busca por carrera o nombre.' },
                { step: 2, color: 'bg-emerald-50 text-emerald-600', text: 'Filtra por región o nivel.' },
                { step: 3, color: 'bg-orange-50 text-orange-600', text: 'Haz clic para ver detalles.' },
              ].map((s) => (
                <div key={s.step} className="flex gap-4">
                  <div className={`w-10 h-10 rounded-2xl ${s.color} flex items-center justify-center text-sm font-black shrink-0 shadow-sm border border-white/50`}>{s.step}</div>
                  <p className="text-xs text-slate-500 font-medium leading-relaxed pt-1">{s.text}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Explore by Area */}
          <div className="bg-white rounded-[40px] p-8 border border-slate-100 shadow-sm h-full flex flex-col">
            <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-6">EXPLORAR POR ÁREA</h3>
            <div className="grid grid-cols-1 gap-2 flex-1 overflow-y-auto pr-2">
              {[
                { name: 'Ciencias de la Salud', count: '1.2K', color: 'bg-red-50 text-red-600', area: 'Ciencias de la salud' },
                { name: 'Ingeniería', count: '2.4K', color: 'bg-blue-50 text-blue-600', area: 'Ingeniería, manufactura y construcción' },
                { name: 'Artes y Ciencias', count: '1.8K', color: 'bg-purple-50 text-purple-600', area: 'Artes y humanidades' },
              ].map((area, i) => (
                <button 
                    key={i} 
                    onClick={() => handleAreaClick(area.area)}
                    className="w-full flex items-center justify-between p-4 bg-slate-50/50 hover:bg-indigo-50 rounded-2xl transition-all group border border-transparent hover:border-indigo-100"
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-2.5 h-2.5 rounded-full ${area.color.split(' ')[1].replace('text-', 'bg-')}`} />
                    <span className="text-[11px] font-black text-slate-700 group-hover:text-indigo-600 transition-colors uppercase tracking-tight">{area.name}</span>
                  </div>
                  <ArrowRight size={14} className="text-slate-200 group-hover:text-indigo-600 transition-colors" />
                </button>
              ))}
            </div>
          </div>

        {/* Test Card */}
        <div className="bg-gradient-to-br from-indigo-600 to-indigo-700 rounded-[40px] p-8 text-white shadow-2xl relative overflow-hidden group">
            <div className="absolute -right-4 -top-4 w-32 h-32 bg-white/10 rounded-full blur-3xl group-hover:scale-150 transition-transform duration-700" />
            <div className="relative z-10 flex flex-col h-full justify-between">
              <div>
                <h4 className="font-black text-xl mb-2 leading-none">¿Dudas?</h4>
                <p className="text-indigo-100 text-[11px] mb-6 leading-relaxed font-medium">
                  El test vocacional te ayudará a elegir el mejor camino para tu carrera.
                </p>
              </div>
              <Link 
                to="/test"
                className="flex items-center justify-center gap-2 w-full py-4 bg-white text-indigo-600 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:gap-4 transition-all"
              >
                Comenzar Test
                <ChevronRight size={16} />
              </Link>
            </div>
          </div>
      </div>

          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

// Simplified Star icon for the panel
const Star = ({ size, fill }: { size?: number, fill?: string }) => (
    <svg 
        width={size} 
        height={size} 
        viewBox="0 0 24 24" 
        fill={fill || "none"} 
        stroke="currentColor" 
        strokeWidth="2" 
        strokeLinecap="round" 
        strokeLinejoin="round" 
    >
        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
    </svg>
);

export default Home;
