import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { Search, Filter, Building2, ChevronDown, ChevronUp, Settings2, LayoutGrid, LayoutList, Map as MapIcon, Hash } from 'lucide-react';
import { Institucion, Municipio } from '../types';
import { getInstituciones, getFilters } from '../api';
import { motion, AnimatePresence } from 'motion/react';
import InstitutionCard from '../components/InstitutionCard';
import MapComponent from '../components/MapComponent';
import { Link, useSearchParams } from 'react-router-dom';

const InstitutionsList: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();

  const [instituciones, setInstituciones] = useState<Institucion[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [searchTerm, setSearchTerm] = useState(searchParams.get('q') || '');
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [variant, setVariant] = useState<'A' | 'B' | 'C'>('A');
  const [searchPerformed, setSearchPerformed] = useState(true);
  const [page, setPage] = useState(Number(searchParams.get('page')) || 1);
  const [hasMore, setHasMore] = useState(true);
  const [totalRecords, setTotalRecords] = useState(0);
  const [globalIci, setGlobalIci] = useState(0);

  const observer = useRef<IntersectionObserver | null>(null);
  const lastElementRef = useCallback((node: HTMLAnchorElement | null) => {
    if (loading || loadingMore) return;
    if (observer.current) observer.current.disconnect();
    observer.current = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && hasMore) {
        fetchData(true);
      }
    });
    if (node) observer.current.observe(node);
  }, [loading, loadingMore, hasMore]);

  const [filters, setFilters] = useState<Record<string, string>>({
    estado: searchParams.get('estado') || '',
    municipio: searchParams.get('municipio') || '',
    sostenimiento: searchParams.get('sostenimiento') || '',
    subsistema: searchParams.get('subsistema') || '',
    min_matricula: searchParams.get('min_matricula') || '',
    min_carreras: searchParams.get('min_carreras') || '',
    min_campus: searchParams.get('min_campus') || '',
    min_ici: searchParams.get('min_ici') || '',
    min_eficiencia: searchParams.get('min_eficiencia') || '',
    min_mujeres: searchParams.get('min_mujeres') || '',
    competitividad: searchParams.get('competitividad') || ''
  });

  const [catalogos, setCatalogos] = useState<{
    estados: {id_entidad: number, nombre: string}[],
    municipios: Municipio[],
    sostenimientos: {id_sostenimiento: number, nombre: string}[],
    subsistemas: {id_subsistema: number, nombre: string}[]
  }>({ 
    estados: [], 
    municipios: [], 
    sostenimientos: [], 
    subsistemas: [] 
  });

  // Cache catalogos in localStorage
  useEffect(() => {
    const loadFilters = async () => {
      try {
        const cached = localStorage.getItem('catalogos_instituciones');
        const cacheTime = localStorage.getItem('catalogos_instituciones_time');
        const isCacheValid = cached && cacheTime && (Date.now() - Number(cacheTime) < 5 * 60 * 1000);

        if (isCacheValid) {
          setCatalogos(JSON.parse(cached));
          return;
        }

        const data = await getFilters();
        const newCatalogos = {
          estados: data.estados || [],
          municipios: data.municipios || [],
          sostenimientos: data.sostenimientos || [],
          subsistemas: data.subsistemas || []
        };
        setCatalogos(newCatalogos);
        localStorage.setItem('catalogos_instituciones', JSON.stringify(newCatalogos));
        localStorage.setItem('catalogos_instituciones_time', Date.now().toString());
      } catch (e) {
        console.error(e);
      }
    };
    loadFilters();
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

  const fetchData = useCallback(async (isLoadMore = false) => {
    if (isLoadMore) setLoadingMore(true);
    else setLoading(true);
    
    setSearchPerformed(true);
    
    const currentPage = isLoadMore ? page + 1 : 1;
    if (!isLoadMore) setPage(1);
    else setPage(currentPage);

    try {
      const apiFilters: Record<string, string | number | undefined> = {
        q: searchTerm,
        estado: filters.estado ? Number(filters.estado) : undefined,
        municipio: filters.municipio ? Number(filters.municipio) : undefined,
        sostenimiento: filters.sostenimiento ? Number(filters.sostenimiento) : undefined,
        subsistema: filters.subsistema ? Number(filters.subsistema) : undefined,
        min_matricula: filters.min_matricula ? Number(filters.min_matricula) : undefined,
        min_carreras: filters.min_carreras ? Number(filters.min_carreras) : undefined,
        min_campus: filters.min_campus ? Number(filters.min_campus) : undefined,
        min_ici: filters.min_ici ? Number(filters.min_ici) : undefined,
        min_eficiencia: filters.min_eficiencia ? Number(filters.min_eficiencia) : undefined,
        min_mujeres: filters.min_mujeres ? Number(filters.min_mujeres) : undefined,
        competitividad: filters.competitividad || undefined,
        page: currentPage,
        limit: variant === 'C' ? 1000 : 12
      };
      
      const response = await getInstituciones(apiFilters);
      const data = response.data || response; // Handle both old and new API format
      const total = response.total || (Array.isArray(response) ? response.length : data.length);
      
      setTotalRecords(total);
      if (response.globalIci !== undefined) setGlobalIci(response.globalIci);

      if (isLoadMore && variant !== 'C') {
        setInstituciones(prev => {
          // Prevent duplicates
          const newIds = new Set(data.map((d: Institucion) => d.id_institucion));
          const filteredPrev = prev.filter(p => !newIds.has(p.id_institucion));
          return [...filteredPrev, ...data];
        });
      } else {
        setInstituciones(data);
      }
      
      setHasMore(variant === 'C' ? false : data.length === 12 && (isLoadMore ? page + 1 : 1) * 12 < total);
    } catch (error) {
      console.error('Error fetching instituciones:', error);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, [searchTerm, filters, page, variant]);

  // Initial fetch on mount
  useEffect(() => {
    fetchData(false);
  }, []);

  // Debounced search for real-time filtering
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchData(false);
    }, 400);
    return () => clearTimeout(timer);
  }, [searchTerm, filters]);

  // Refetch when switching to/from Map View
  useEffect(() => {
    if (searchPerformed) {
      fetchData(false);
    }
  }, [variant]);

  const hasFilters = searchTerm !== '' || Object.values(filters).some(v => v !== '');

  const filteredMunicipios = useMemo(() => {
    if (!filters.estado) return [];
    return catalogos.municipios.filter(m => m.id_entidad === Number(filters.estado));
  }, [catalogos.municipios, filters.estado]);

  const mapData = useMemo(() => {
    return instituciones.map(inst => ({
      id_escuela: inst.id_institucion,
      id_institucion: inst.id_institucion,
      nombre: inst.nombre,
      latitud: inst.latitud || 0,
      longitud: inst.longitud || 0,
      logo_url: inst.logo_url || inst.logoUrl,
      sostenimiento: inst.sostenimiento || catalogos.sostenimientos.find(s => s.id_sostenimiento === inst.id_sostenimiento)?.nombre || 'PÚBLICO',
      sostenimiento_nombre: inst.sostenimiento || catalogos.sostenimientos.find(s => s.id_sostenimiento === inst.id_sostenimiento)?.nombre || 'PÚBLICO',
      promedio_calificacion: inst.promedio_calificacion || 0,
      municipio_nombre: catalogos.municipios.find(m => m.id_municipio === inst.id_municipio)?.nombre || ''
    } as any));
  }, [instituciones, catalogos.municipios, catalogos.sostenimientos]);

  return (
    <div className="min-h-screen pb-20">
      <div className="flex flex-col lg:flex-row gap-8">
        {/* Sidebar Filters */}
        <aside className="w-full lg:w-72 shrink-0">
          <div className="bg-white rounded-[32px] p-6 border border-slate-100 shadow-sm sticky top-24 max-h-[calc(100vh-120px)] overflow-y-auto custom-scrollbar">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-indigo-600 text-white rounded-lg">
                  <Filter size={16} />
                </div>
                <h2 className="text-lg font-black text-slate-900 tracking-tight">Filtros</h2>
              </div>
              {hasFilters && (
                <button 
                  onClick={() => { setSearchTerm(''); setFilters({
                    estado: '', municipio: '', sostenimiento: '', subsistema: '',
                    min_matricula: '', min_carreras: '', min_campus: '', min_ici: '', min_eficiencia: '',
                    min_mujeres: '', competitividad: ''
                  }); }}
                  className="text-[10px] font-black text-indigo-600 uppercase tracking-widest hover:text-indigo-700 transition-colors"
                >
                  Limpiar
                </button>
              )}
            </div>

            <div className="space-y-6">
              {/* Search */}
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1 flex items-center gap-2">
                  <Hash size={12} className="text-indigo-500" /> Nombre o Siglas
                </label>
                <div className="relative group">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-600 transition-colors" size={16} />
                  <input
                    type="text"
                    placeholder="Ej. UNAM, UAQ, IPN..."
                    className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-100 rounded-xl focus:ring-4 focus:ring-indigo-50 focus:border-indigo-500 transition-all outline-none font-bold text-sm text-slate-900"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
              </div>

              {/* Normal Filters */}
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

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Tipo</label>
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

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Subsistema</label>
                  <select 
                    value={filters.subsistema}
                    onChange={e => setFilters({...filters, subsistema: e.target.value})}
                    className="w-full p-2.5 bg-slate-50 border border-slate-100 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 transition-all font-bold text-xs text-slate-700"
                  >
                    <option value="">Todos los subsistemas</option>
                    {catalogos.subsistemas.map(s => (
                      <option key={s.id_subsistema} value={s.id_subsistema}>{s.nombre}</option>
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
                    <span className="text-xs font-black uppercase tracking-widest">Filtros Avanzados</span>
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
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Número de Campus</label>
                        <input 
                          type="number" placeholder="Ej. 2"
                          value={filters.min_campus}
                          onChange={e => setFilters({...filters, min_campus: e.target.value})}
                          className="w-full p-2.5 bg-slate-50 border border-slate-100 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 transition-all font-bold text-xs text-slate-700"
                        />
                      </div>

                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">% Mujeres Mínimo ({filters.min_mujeres || 0}%)</label>
                        <input 
                          type="range" min="0" max="100" step="5"
                          value={filters.min_mujeres || 0}
                          onChange={e => setFilters({...filters, min_mujeres: e.target.value})}
                          className="w-full h-1.5 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-pink-600"
                        />
                      </div>

                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Competitividad</label>
                        <select 
                          value={filters.competitividad}
                          onChange={e => setFilters({...filters, competitividad: e.target.value})}
                          className="w-full p-2.5 bg-slate-50 border border-slate-100 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 transition-all font-bold text-xs text-slate-700"
                        >
                          <option value="">Cualquier nivel</option>
                          <option value="Muy selectiva">Muy selectiva</option>
                          <option value="Alta demanda">Alta demanda</option>
                          <option value="Competencia media">Competencia media</option>
                          <option value="Acceso abierto">Acceso abierto</option>
                        </select>
                      </div>

                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Matrícula Mínima</label>
                        <input 
                          type="number" placeholder="Ej. 1000"
                          value={filters.min_matricula}
                          onChange={e => setFilters({...filters, min_matricula: e.target.value})}
                          className="w-full p-2.5 bg-slate-50 border border-slate-100 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 transition-all font-bold text-xs text-slate-700"
                        />
                      </div>

                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Número de Carreras</label>
                        <input 
                          type="number" placeholder="Ej. 5"
                          value={filters.min_carreras}
                          onChange={e => setFilters({...filters, min_carreras: e.target.value})}
                          className="w-full p-2.5 bg-slate-50 border border-slate-100 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 transition-all font-bold text-xs text-slate-700"
                        />
                      </div>

                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">IPD Promedio ({filters.min_ici || 0})</label>
                        <input 
                          type="range" min="0" max="100" step="5"
                          value={filters.min_ici || 0}
                          onChange={e => setFilters({...filters, min_ici: e.target.value})}
                          className="w-full h-1.5 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                        />
                      </div>

                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Eficiencia Promedio ({filters.min_eficiencia || 0}%)</label>
                        <input 
                          type="range" min="0" max="100" step="5"
                          value={filters.min_eficiencia || 0}
                          onChange={e => setFilters({...filters, min_eficiencia: e.target.value})}
                          className="w-full h-1.5 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-emerald-600"
                        />
                      </div>

                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

            </div>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 space-y-12">
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-2">
              <h1 className="text-4xl md:text-5xl font-black text-slate-900 tracking-tighter">
                Instituciones <span className="text-indigo-600">Superiores</span>
              </h1>
              <p className="text-slate-500 font-bold">
                {hasFilters ? `Se encontraron ${instituciones.length} instituciones` : 'Explora las universidades y centros de estudio en todo el país'}
              </p>
            </div>

            <div className="flex bg-white p-1 rounded-2xl border border-slate-100 shadow-sm self-start">
              <button 
                onClick={() => setVariant('A')}
                className={`p-2 rounded-xl transition-all ${variant === 'A' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-400 hover:bg-slate-50'}`}
              >
                <LayoutGrid size={20} />
              </button>
              <button 
                onClick={() => setVariant('B')}
                className={`p-2 rounded-xl transition-all ${variant === 'B' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-400 hover:bg-slate-50'}`}
              >
                <LayoutList size={20} />
              </button>
              <button 
                onClick={() => setVariant('C')}
                className={`p-2 rounded-xl transition-all ${variant === 'C' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-400 hover:bg-slate-50'}`}
              >
                <MapIcon size={20} />
              </button>
            </div>
          </div>

          {/* Quick View Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-6 bg-white rounded-3xl border border-slate-100 shadow-sm hover:shadow-md transition-all group overflow-hidden relative">
              <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-50 rounded-full -mr-12 -mt-12 group-hover:scale-110 transition-transform" />
              <div className="relative">
                <div className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1">Total Instituciones</div>
                <div className="text-3xl font-black text-slate-900">{loading ? '...' : totalRecords}</div>
                <div className="text-xs text-indigo-600 font-bold mt-1">Registros encontrados</div>
              </div>
            </div>
            <div className="p-6 bg-white rounded-3xl border border-slate-100 shadow-sm hover:shadow-md transition-all group overflow-hidden relative">
              <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-50 rounded-full -mr-12 -mt-12 group-hover:scale-110 transition-transform" />
              <div className="relative">
                <div className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1">Sostenimiento</div>
                <div className="text-3xl font-black text-slate-900">
                  {loading ? '...' : (filters.sostenimiento ? catalogos.sostenimientos.find(s => s.id_sostenimiento === Number(filters.sostenimiento))?.nombre : 'Todos')}
                </div>
                <div className="text-xs text-emerald-600 font-bold mt-1">Tipo de gestión</div>
              </div>
            </div>
            <div className="p-6 bg-white rounded-3xl border border-slate-100 shadow-sm hover:shadow-md transition-all group overflow-hidden relative">
              <div className="absolute top-0 right-0 w-24 h-24 bg-purple-50 rounded-full -mr-12 -mt-12 group-hover:scale-110 transition-transform" />
              <div className="relative">
                <div className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1">IPD Promedio</div>
                <div className="text-3xl font-black text-slate-900">
                  {loading ? '...' : (globalIci > 0 ? Math.round(globalIci) : '0')}
                </div>
                <div className="text-xs text-purple-600 font-bold mt-1">Índice de calidad</div>
              </div>
            </div>
            <div className="p-6 bg-white rounded-3xl border border-slate-100 shadow-sm hover:shadow-md transition-all group overflow-hidden relative">
              <div className="absolute top-0 right-0 w-24 h-24 bg-orange-50 rounded-full -mr-12 -mt-12 group-hover:scale-110 transition-transform" />
              <div className="relative">
                <div className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1">Total Campus</div>
                <div className="text-3xl font-black text-slate-900">
                  {loading ? '...' : (instituciones.reduce((acc, inst) => acc + (inst.total_campus || 0), 0))}
                </div>
                <div className="text-xs text-orange-600 font-bold mt-1">Planteles físicos</div>
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
                  <div className="w-16 h-16 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-6" />
                  <p className="text-slate-400 font-black uppercase tracking-widest text-sm">Cargando...</p>
                </div>
              </motion.div>
            ) : variant === 'C' ? (
              <motion.div
                key="map"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="h-[800px] rounded-[48px] overflow-hidden border border-slate-100 shadow-sm relative"
              >
                <MapComponent
                  escuelas={mapData}
                  subsistemas={catalogos.subsistemas.map(s => s.nombre)}
                  selectedSubsistema={filters.subsistema ? catalogos.subsistemas.find(s => String(s.id_subsistema) === String(filters.subsistema))?.nombre || 'Todos los Subsistemas' : 'Todos los Subsistemas'}
                  onSubsistemaChange={(val) => {
                    const sub = catalogos.subsistemas.find(s => s.nombre === val);
                    setFilters(prev => ({ ...prev, subsistema: sub ? String(sub.id_subsistema) : '' }));
                  }}
                />
              </motion.div>
            ) : (
              <motion.div
                key="results"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="grid grid-cols-1 md:grid-cols-2 gap-8"
              >
                {instituciones.map((inst, index) => {
                  if (instituciones.length === index + 1) {
                    return (
                      <Link ref={lastElementRef} key={inst.id_institucion} to={`/instituciones/${inst.id_institucion}`}>
                        <InstitutionCard institucion={inst} variant={variant} />
                      </Link>
                    );
                  } else {
                    return (
                      <Link key={inst.id_institucion} to={`/instituciones/${inst.id_institucion}`}>
                        <InstitutionCard institucion={inst} variant={variant} />
                      </Link>
                    );
                  }
                })}
                {instituciones.length === 0 && (
                  <div className="col-span-full py-32 text-center bg-slate-50 rounded-[48px] border-2 border-dashed border-slate-200">
                    <Building2 size={64} className="mx-auto text-slate-300 mb-6" />
                    <h3 className="text-2xl font-black text-slate-900 mb-2">Sin resultados</h3>
                    <p className="text-slate-500 font-bold">No encontramos instituciones con esos criterios. Intenta con otros filtros.</p>
                  </div>
                )}
                {hasMore && instituciones.length > 0 && (
                  <div className="col-span-full flex justify-center pt-8">
                    {loadingMore && (
                      <div className="flex items-center gap-2 text-indigo-600 font-bold">
                        <div className="w-5 h-5 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
                        Cargando más instituciones...
                      </div>
                    )}
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </main>
      </div>

    </div>
  );
};

export default InstitutionsList;
