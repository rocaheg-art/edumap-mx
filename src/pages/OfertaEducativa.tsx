import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { Search, Filter, BookOpen, ChevronDown, ChevronUp, Settings2, Sliders, X } from 'lucide-react';
import { shortenCareerName } from '../utils/formatters';
import { Oferta, Nivel, Modalidad, Municipio, CampoFormacion } from '../types';
import { searchOfertas, getFilters } from '../api';
import OfferDetailModal from '../components/OfferDetailModal';
import { motion, AnimatePresence } from 'motion/react';
import CareerCard from '../components/CareerCard';
import { useSearchParams } from 'react-router-dom';

const OfertaEducativa: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  
  const [searchTerm, setSearchTerm] = useState(searchParams.get('q') || '');
  const [isFilterDrawerOpen, setIsFilterDrawerOpen] = useState(false);
  const [ofertas, setOfertas] = useState<Oferta[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [selectedOferta, setSelectedOferta] = useState<Oferta | null>(null);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [page, setPage] = useState(Number(searchParams.get('page')) || 1);
  const [hasMore, setHasMore] = useState(true);
  const [hasSearched, setHasSearched] = useState(true);
  const [totalRecords, setTotalRecords] = useState(0);
  const [globalEficiencia, setGlobalEficiencia] = useState(0);
  const [sortBy, setSortBy] = useState<'none' | 'ipd_asc' | 'ipd_desc' | 'ingreso_asc' | 'ingreso_desc'>('none');

  const observer = useRef<IntersectionObserver | null>(null);
  const lastElementRef = useCallback((node: HTMLDivElement | null) => {
    if (loading || loadingMore) return;
    if (observer.current) observer.current.disconnect();
    observer.current = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && hasMore) {
        fetchOfertas(true);
      }
    });
    if (node) observer.current.observe(node);
  }, [loading, loadingMore, hasMore]);

  const [filters, setFilters] = useState<Record<string, string>>({
    nivel: searchParams.get('nivel') || '1,5',
    modalidad: searchParams.get('modalidad') || '',
    estado: searchParams.get('estado') || '',
    municipio: searchParams.get('municipio') || '',
    sostenimiento: searchParams.get('sostenimiento') || '',
    min_eficiencia: searchParams.get('min_eficiencia') || '',
    min_tasa_egreso: searchParams.get('min_tasa_egreso') || '',
    min_mujeres: searchParams.get('min_mujeres') || '',
    min_inclusion: searchParams.get('min_inclusion') || '',
    id_campo_detallado: searchParams.get('id_campo_detallado') || '',
    min_solicitudes: searchParams.get('min_solicitudes') || '',
    min_lugares: searchParams.get('min_lugares') || '',
    min_matricula: searchParams.get('min_matricula') || ''
  });

  const [catalogos, setCatalogos] = useState<{
    niveles: Nivel[],
    modalidades: Modalidad[],
    estados: {id_entidad: number, nombre: string}[],
    municipios: Municipio[],
    campos: CampoFormacion[],
    sostenimientos: {id_sostenimiento: number, nombre: string}[],
    subsistemas: {id_subsistema: number, nombre: string}[]
  }>({ 
    niveles: [], 
    modalidades: [], 
    estados: [], 
    municipios: [], 
    campos: [], 
    sostenimientos: [],
    subsistemas: [] 
  });

  // Cache catalogos in localStorage
  useEffect(() => {
    const loadInitialData = async () => {
      try {
        const cached = localStorage.getItem('catalogos_oferta');
        const cacheTime = localStorage.getItem('catalogos_oferta_time');
        const isCacheValid = cached && cacheTime && (Date.now() - Number(cacheTime) < 5 * 60 * 1000);

        if (isCacheValid) {
          setCatalogos(JSON.parse(cached));
          return;
        }

        const [filterData] = await Promise.all([
          getFilters()
        ]);
        
        const newCatalogos = {
          niveles: filterData.niveles || [],
          modalidades: filterData.modalidades || [],
          estados: filterData.estados || [],
          municipios: filterData.municipios || [],
          campos: filterData.campos || [],
          sostenimientos: filterData.sostenimientos || [],
          subsistemas: filterData.subsistemas || []
        };
        
        setCatalogos(newCatalogos);
        localStorage.setItem('catalogos_oferta', JSON.stringify(newCatalogos));
        localStorage.setItem('catalogos_oferta_time', Date.now().toString());
      } catch (e) {
        console.error(e);
      }
    };
    loadInitialData();
  }, []);

  // Sync state to URL
  useEffect(() => {
    const params = new URLSearchParams();
    if (searchTerm) params.set('q', searchTerm);
    Object.entries(filters).forEach(([key, value]) => {
      if (value) params.set(key, value as string);
    });
    if (page > 1) params.set('page', page.toString());
    
    setSearchParams(params, { replace: true });
  }, [searchTerm, filters, page, setSearchParams]);

  const fetchOfertas = useCallback(async (isLoadMore = false) => {
    if (isLoadMore) setLoadingMore(true);
    else setLoading(true);
    
    setHasSearched(true);
    
    const currentPage = isLoadMore ? page + 1 : 1;
    if (!isLoadMore) setPage(1);
    else setPage(currentPage);

    try {
      const apiFilters: Record<string, string | number | undefined> = {
        q: searchTerm,
        nivel: filters.nivel || undefined,
        modalidad: filters.modalidad ? Number(filters.modalidad) : undefined,
        estado: filters.estado ? Number(filters.estado) : undefined,
        municipio: filters.municipio ? Number(filters.municipio) : undefined,
        sostenimiento: filters.sostenimiento ? Number(filters.sostenimiento) : undefined,
        id_campo_detallado: filters.id_campo_detallado ? Number(filters.id_campo_detallado) : undefined,
        min_eficiencia: filters.min_eficiencia ? Number(filters.min_eficiencia) : undefined,
        min_tasa_egreso: filters.min_tasa_egreso ? Number(filters.min_tasa_egreso) : undefined,
        min_mujeres: filters.min_mujeres ? Number(filters.min_mujeres) : undefined,
        min_inclusion: filters.min_inclusion ? Number(filters.min_inclusion) : undefined,
        min_solicitudes: filters.min_solicitudes ? Number(filters.min_solicitudes) : undefined,
        min_lugares: filters.min_lugares ? Number(filters.min_lugares) : undefined,
        min_matricula: filters.min_matricula ? Number(filters.min_matricula) : undefined,
        sort: sortBy !== 'none' ? sortBy : undefined,
        page: currentPage,
        limit: 12
      };

      const response = await searchOfertas(apiFilters);
      const data = response.data || response; // Handle both old and new API format
      const total = response.total || (Array.isArray(response) ? response.length : data.length);
      
      setTotalRecords(total);
      if (response.globalEficiencia !== undefined) setGlobalEficiencia(response.globalEficiencia);
      
      if (isLoadMore) {
        setOfertas(prev => {
          // Prevent duplicates
          const newIds = new Set(data.map((d: Oferta) => d.id_oferta));
          const filteredPrev = prev.filter(p => !newIds.has(p.id_oferta));
          return [...filteredPrev, ...data];
        });
      } else {
        setOfertas(data);
      }
      
      setHasMore(data.length === 12 && (isLoadMore ? page + 1 : 1) * 12 < total);
    } catch (error) {
      console.error('Error fetching ofertas:', error);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, [searchTerm, filters, page, sortBy]);

  // Initial fetch on mount
  useEffect(() => {
    fetchOfertas(false);
  }, []);

  // Debounced search for real-time filtering
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchOfertas(false);
    }, 400);
    return () => clearTimeout(timer);
  }, [searchTerm, filters, sortBy]);

  const handleSearchTermChange = (val: string) => {
    setSearchTerm(val);
    // Note: Removed auto-clearing filters on search to allow combined filtering
  };

  const hasFilters = searchTerm !== '' || Object.values(filters).some(v => v !== '');

  const filteredMunicipios = useMemo(() => {
    if (!filters.estado) return [];
    return catalogos.municipios.filter(m => m.id_entidad === Number(filters.estado));
  }, [catalogos.municipios, filters.estado]);

  return (
    <div className="min-h-screen pb-20 relative">
      {/* Mobile Floating Filter Button */}
      <div className="lg:hidden fixed bottom-24 right-6 z-[1001]">
        <motion.button
          whileTap={{ scale: 0.9 }}
          onClick={() => setIsFilterDrawerOpen(true)}
          className="flex items-center gap-2 px-6 py-4 bg-indigo-600 text-white rounded-full font-black text-xs shadow-2xl shadow-indigo-200 border border-white/20 tracking-widest overflow-hidden group"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-indigo-600 to-indigo-500 opacity-0 group-hover:opacity-100 transition-opacity" />
          <Sliders className="relative z-10" size={18} strokeWidth={2.5} />
          <span className="relative z-10">FILTROS</span>
          {Object.values(filters).filter(v => v !== '' && v !== '1,5').length > 0 && (
            <span className="relative z-10 bg-white text-indigo-600 w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-black">
              {Object.values(filters).filter(v => v !== '' && v !== '1,5').length}
            </span>
          )}
        </motion.button>
      </div>
      <div className="flex flex-col lg:flex-row gap-8">
        {/* Sidebar Filters (Responsive Drawer on mobile/tablet) */}
        <AnimatePresence>
          {(window.innerWidth >= 1024 || isFilterDrawerOpen) && (
            <motion.aside 
              initial={window.innerWidth < 1024 ? { x: '100%' } : { opacity: 1 }}
              animate={window.innerWidth < 1024 ? { x: 0 } : { opacity: 1 }}
              exit={window.innerWidth < 1024 ? { x: '100%' } : { opacity: 0 }}
              transition={{ type: 'spring', damping: 30, stiffness: 300 }}
              className={`
                shrink-0
                ${window.innerWidth < 1024 
                  ? 'fixed inset-y-0 right-0 z-[2001] w-[300px] bg-white shadow-2xl p-6 overflow-y-auto' 
                  : 'w-72'
                }
              `}
            >
              {window.innerWidth < 1024 && (
                <div className="flex items-center justify-between mb-8">
                  <h2 className="text-xl font-black text-slate-900 uppercase tracking-tight">Filtros</h2>
                  <button 
                    onClick={() => setIsFilterDrawerOpen(false)}
                    className="p-2.5 bg-slate-50 rounded-xl text-slate-400 hover:text-red-500 transition-all active:scale-95"
                  >
                    <X size={20} />
                  </button>
                </div>
              )}

              <div className="bg-white rounded-[32px] p-6 border border-slate-100 shadow-sm sticky top-24 max-h-[calc(100vh-120px)] overflow-y-auto custom-scrollbar">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 bg-indigo-600 text-white rounded-lg">
                      <Filter size={16} />
                    </div>
                    <h2 className="text-lg font-black text-slate-900 tracking-tight text-nowrap">Filtros</h2>
                  </div>
                  {hasFilters && (
                    <button 
                      onClick={() => { setSearchTerm(''); setFilters({
                        nivel: '1,5', modalidad: '', estado: '', municipio: '', sostenimiento: '',
                        min_eficiencia: '', min_tasa_egreso: '', min_mujeres: '', min_inclusion: '',
                        id_campo_detallado: '', min_solicitudes: '', min_lugares: '', min_matricula: ''
                      }); }}
                      className="text-[10px] font-black text-indigo-600 uppercase tracking-widest hover:text-indigo-700 transition-colors"
                    >
                      Limpiar
                    </button>
                  )}
                </div>

                <div className="space-y-6">
                  {/* Search */}
                  <div className="space-y-4">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">CARRERA / INSTITUCIÓN</label>
                    <div className="relative group">
                      <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-600 transition-colors" size={20} />
                      <input
                        type="text"
                        placeholder="Ej. Medicina..."
                        className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all outline-none font-bold text-slate-700 text-xs"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                      />
                    </div>
                  </div>

                  {/* Normal Filters Section */}
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Estado</label>
                      <select 
                        value={filters.estado}
                        onChange={e => setFilters({...filters, estado: e.target.value, municipio: ''})}
                        className="w-full p-2.5 bg-slate-50 border border-slate-100 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 transition-all font-bold text-xs text-slate-700"
                      >
                        <option value="">Todos los estados</option>
                        {catalogos.estados.map(e => (
                          <option key={e.id_entidad} value={e.id_entidad}>{e.nombre}</option>
                        ))}
                      </select>
                    </div>

                    {filters.estado && (
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Municipio</label>
                        <select 
                          value={filters.municipio}
                          onChange={e => setFilters({...filters, municipio: e.target.value})}
                          className="w-full p-2.5 bg-slate-50 border border-slate-100 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 transition-all font-bold text-xs text-slate-700"
                        >
                          <option value="">Todos los municipios</option>
                          {filteredMunicipios.map(m => (
                            <option key={m.id_municipio} value={m.id_municipio}>{m.nombre}</option>
                          ))}
                        </select>
                      </div>
                    )}

                    <div className="space-y-3">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Niveles</label>
                      <div className="flex flex-wrap gap-2">
                        {catalogos.niveles.map(n => {
                          const isActive = filters.nivel.split(',').includes(n.id_nivel.toString());
                          return (
                            <button
                              key={n.id_nivel}
                              onClick={() => {
                                const current = filters.nivel ? filters.nivel.split(',') : [];
                                const next = isActive 
                                  ? current.filter(id => id !== n.id_nivel.toString())
                                  : [...current, n.id_nivel.toString()];
                                setFilters({...filters, nivel: next.filter(Boolean).join(',')});
                              }}
                              className={`px-3 py-2 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all border ${
                                isActive 
                                  ? 'bg-indigo-600 border-indigo-600 text-white shadow-lg shadow-indigo-100' 
                                  : 'bg-slate-50 border-slate-100 text-slate-400 hover:border-slate-200 hover:text-slate-600'
                              }`}
                            >
                              {shortenCareerName(n.nombre)}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Modalidad</label>
                      <select 
                        value={filters.modalidad}
                        onChange={e => setFilters({...filters, modalidad: e.target.value})}
                        className="w-full p-2.5 bg-slate-50 border border-slate-100 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 transition-all font-bold text-xs text-slate-700"
                      >
                        <option value="">Todas las modalidades</option>
                        {catalogos.modalidades.map(m => (
                          <option key={m.id_modalidad} value={m.id_modalidad}>{m.nombre}</option>
                        ))}
                      </select>
                    </div>

                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Sostenimiento</label>
                      <select 
                        value={filters.sostenimiento}
                        onChange={e => setFilters({...filters, sostenimiento: e.target.value})}
                        className="w-full p-2.5 bg-slate-50 border border-slate-100 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 transition-all font-bold text-xs text-slate-700"
                      >
                        <option value="">Todos los tipos</option>
                        {catalogos.sostenimientos.map(s => (
                          <option key={s.id_sostenimiento} value={s.id_sostenimiento}>{s.nombre}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Advanced Filters Toggle */}
                  <div className="pt-4 border-t border-slate-100">
                    <button 
                      onClick={() => setShowAdvanced(!showAdvanced)}
                      className="w-full flex items-center justify-between py-2 text-slate-600 hover:text-indigo-600 transition-colors"
                    >
                      <div className="flex items-center gap-2">
                        <Settings2 size={16} />
                        <span className="text-xs font-black uppercase tracking-widest">Avanzados</span>
                      </div>
                      {showAdvanced ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                    </button>

                    <AnimatePresence>
                      {showAdvanced && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          className="overflow-hidden space-y-4 pt-4"
                        >
                          <div className="space-y-2">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Campo</label>
                            <select 
                              value={filters.id_campo_detallado}
                              onChange={e => setFilters({...filters, id_campo_detallado: e.target.value})}
                              className="w-full p-2.5 bg-slate-50 border border-slate-100 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 transition-all font-bold text-xs text-slate-700"
                            >
                              <option value="">Todos los campos</option>
                              {catalogos.campos.map(c => (
                                <option key={c.id_campo_detallado} value={c.id_campo_detallado}>{c.nombre}</option>
                              ))}
                            </select>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </div>

                {window.innerWidth < 1024 && (
                  <div className="mt-8 pt-8 border-t border-slate-100">
                    <button 
                      onClick={() => setIsFilterDrawerOpen(false)}
                      className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-black text-xs tracking-widest shadow-xl shadow-indigo-100 active:scale-[0.98] transition-all"
                    >
                      VER RESULTADOS
                    </button>
                  </div>
                )}
              </div>
            </motion.aside>
          )}
        </AnimatePresence>

        {/* Sidebar Backdrop (Mobile only) */}
        <AnimatePresence>
          {isFilterDrawerOpen && window.innerWidth < 1024 && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsFilterDrawerOpen(false)}
              className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[2000] lg:hidden"
            />
          )}
        </AnimatePresence>

        {/* Main Content */}
        <main className="flex-1 space-y-12">
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-2">
              <h1 className="text-4xl md:text-5xl font-black text-slate-900 tracking-tighter">
                Oferta <span className="text-indigo-600">Educativa</span>
              </h1>
              <p className="text-slate-500 font-bold">
                {hasSearched ? `Se encontraron ${ofertas.length} programas` : 'Descubre tu camino profesional entre miles de opciones'}
              </p>
            </div>
            {/* Sort By */}
            <div className="flex items-center gap-3">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest whitespace-nowrap">Ordenar por</span>
              <select
                value={sortBy}
                onChange={e => setSortBy(e.target.value as typeof sortBy)}
                className="py-3 px-4 bg-white border border-slate-200 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-500 transition-all font-bold text-xs text-slate-700 shadow-sm"
              >
                <option value="none">Relevancia</option>
                <option value="ipd_asc">Probabilidad: Más Difícil de Entrar</option>
                <option value="ipd_desc">Probabilidad: Más Fácil de Entrar</option>
                <option value="ingreso_desc">Nuevos Ingresos: Mayor → Menor</option>
                <option value="ingreso_asc">Nuevos Ingresos: Menor → Mayor</option>
              </select>
            </div>
          </div>

          {/* Quick View Stats */}
          {/* Quick View Stats - Carousel on mobile */}
          <div className="flex overflow-x-auto lg:grid lg:grid-cols-4 gap-4 mb-8 pb-4 lg:pb-0 custom-scrollbar-hide snap-x">
            <div className="min-w-[280px] lg:min-w-0 p-6 bg-white rounded-3xl border border-slate-100 shadow-sm hover:shadow-md transition-all group overflow-hidden relative snap-center">
              <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-50 rounded-full -mr-12 -mt-12 group-hover:scale-110 transition-transform" />
              <div className="relative">
                <div className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1">Total Ofertas</div>
                <div className="text-3xl font-black text-slate-900">{loading ? '...' : totalRecords}</div>
                <div className="text-xs text-indigo-600 font-bold mt-1 uppercase tracking-tighter">Programas activos</div>
              </div>
            </div>
            <div className="min-w-[280px] lg:min-w-0 p-6 bg-white rounded-3xl border border-slate-100 shadow-sm hover:shadow-md transition-all group overflow-hidden relative snap-center">
              <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-50 rounded-full -mr-12 -mt-12 group-hover:scale-110 transition-transform" />
              <div className="relative">
                <div className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1">Nivel Global</div>
                <div className="text-3xl font-black text-slate-900 truncate pr-4">
                  {loading ? '...' : (filters.nivel ? catalogos.niveles.find(n => filters.nivel.split(',').includes(n.id_nivel.toString()))?.nombre.split(' ')[0] : 'Todos')}
                </div>
                <div className="text-xs text-emerald-600 font-bold mt-1 uppercase tracking-tighter">Niveles educativos</div>
              </div>
            </div>
            <div className="min-w-[280px] lg:min-w-0 p-6 bg-white rounded-3xl border border-slate-100 shadow-sm hover:shadow-md transition-all group overflow-hidden relative snap-center">
              <div className="absolute top-0 right-0 w-24 h-24 bg-purple-50 rounded-full -mr-12 -mt-12 group-hover:scale-110 transition-transform" />
              <div className="relative">
                <div className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1">Eficiencia Media</div>
                <div className="text-3xl font-black text-slate-900">
                  {loading ? '...' : (globalEficiencia > 0 ? Math.round(globalEficiencia) : '0')}%
                </div>
                <div className="text-xs text-purple-600 font-bold mt-1 uppercase tracking-tighter">Terminal promedio</div>
              </div>
            </div>
            <div className="min-w-[280px] lg:min-w-0 p-6 bg-white rounded-3xl border border-slate-100 shadow-sm hover:shadow-md transition-all group overflow-hidden relative snap-center">
              <div className="absolute top-0 right-0 w-24 h-24 bg-orange-50 rounded-full -mr-12 -mt-12 group-hover:scale-110 transition-transform" />
              <div className="relative">
                <div className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1">Mujeres %</div>
                <div className="text-3xl font-black text-slate-900">
                  {loading ? '...' : (ofertas.length > 0 ? (ofertas.reduce((acc, o) => acc + (o.matricula_mujeres / (o.matricula_total || 1) * 100), 0) / ofertas.length).toFixed(0) : '0')}%
                </div>
                <div className="text-xs text-orange-600 font-bold mt-1 uppercase tracking-tighter">Participación femenina</div>
              </div>
            </div>
          </div>

          <AnimatePresence mode="wait">
            {loading && page === 1 ? (
              <motion.div 
                key="loading"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="h-[400px] flex items-center justify-center bg-white rounded-[48px] border border-slate-100 shadow-xl shadow-indigo-500/5"
              >
                <div className="text-center">
                  <div className="relative">
                    <div className="w-16 h-16 border-4 border-indigo-100 rounded-full mx-auto" />
                    <div className="w-16 h-16 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin absolute top-0 left-1/2 -translate-x-1/2" />
                  </div>
                  <p className="mt-8 text-slate-900 font-black text-lg tracking-tight">Cargando Oferta...</p>
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="results"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="space-y-12"
              >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  {ofertas.map((oferta, index) => {
                    if (ofertas.length === index + 1) {
                      return (
                        <div
                          key={oferta.id_oferta}
                          ref={lastElementRef}
                          onClick={() => setSelectedOferta(oferta)}
                          className="cursor-pointer"
                        >
                          <CareerCard 
                            oferta={oferta} 
                          />
                        </div>
                      );
                    } else {
                      return (
                        <div 
                          key={oferta.id_oferta} 
                          onClick={() => setSelectedOferta(oferta)}
                          className="cursor-pointer"
                        >
                          <CareerCard 
                            oferta={oferta} 
                          />
                        </div>
                      );
                    }
                  })}
                </div>

                {hasMore && ofertas.length > 0 && (
                  <div className="flex justify-center pt-8">
                    {loadingMore && (
                      <div className="flex items-center gap-2 text-indigo-600 font-bold">
                        <div className="w-5 h-5 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
                        Cargando más resultados...
                      </div>
                    )}
                  </div>
                )}

                {ofertas.length === 0 && (
                  <div className="py-32 text-center bg-slate-50 rounded-[48px] border-2 border-dashed border-slate-200">
                    <BookOpen size={64} className="mx-auto text-slate-300 mb-6" />
                    <h3 className="text-2xl font-black text-slate-900 mb-2">Sin resultados</h3>
                    <p className="text-slate-500 font-bold">No encontramos programas con esos filtros. Intenta con otros criterios.</p>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </main>
      </div>

      <AnimatePresence>
        {selectedOferta && (
          <OfferDetailModal 
            oferta={selectedOferta} 
            onClose={() => setSelectedOferta(null)} 
          />
        )}
      </AnimatePresence>

    </div>
  );
};

export default OfertaEducativa;
