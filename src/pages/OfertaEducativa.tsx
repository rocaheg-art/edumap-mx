import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { Search, Filter, BookOpen, ChevronDown, ChevronUp, Settings2, Sliders, X } from 'lucide-react';
import { shortenCareerName } from '../utils/formatters';
import { Oferta, Nivel, Modalidad, Municipio, CampoFormacion } from '../types';
import { searchOfertas, getFilters } from '../api';
import OfferDetailModal from '../components/OfferDetailModal';
import { motion, AnimatePresence } from 'framer-motion';
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

        const filterData = await getFilters();
        
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
      const apiFilters = {
        q: searchTerm,
        nivel: filters.nivel || undefined,
        modalidad: filters.modalidad ? Number(filters.modalidad) : undefined,
        estado: filters.estado ? Number(filters.estado) : undefined,
        municipio: filters.municipio ? Number(filters.municipio) : undefined,
        sostenimiento: filters.sostenimiento ? Number(filters.sostenimiento) : undefined,
        id_campo_detallado: filters.id_campo_detallado ? Number(filters.id_campo_detallado) : undefined,
        sort: sortBy !== 'none' ? sortBy : undefined,
        page: currentPage,
        limit: 12
      };

      const response = await searchOfertas(apiFilters as any);
      const data = response.data || response;
      const total = response.total || (Array.isArray(response) ? response.length : data.length);
      
      setTotalRecords(total);
      if (response.globalEficiencia !== undefined) setGlobalEficiencia(response.globalEficiencia);
      
      if (isLoadMore) {
        setOfertas(prev => {
          const newIds = new Set(data.map((d: Oferta) => d.id_oferta));
          return [...prev.filter(p => !newIds.has(p.id_oferta)), ...data];
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

  useEffect(() => {
    fetchOfertas(false);
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchOfertas(false);
    }, 400);
    return () => clearTimeout(timer);
  }, [searchTerm, filters, sortBy]);

  const hasFiltersActive = searchTerm !== '' || Object.values(filters).some(v => v !== '' && v !== '1,5');

  return (
    <div className="min-h-screen pb-40 relative px-4 md:px-0">
      {/* Mobile Sticky Search Bar */}
      <div className="lg:hidden sticky top-0 z-[50] bg-white/90 backdrop-blur-2xl border-b border-slate-100 -mx-4 px-4 py-4 space-y-3 shadow-sm">
        <div className="relative group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input
            type="text"
            placeholder="Buscar carrera o universidad..."
            className="w-full pl-11 pr-4 py-3.5 bg-slate-50 border border-slate-100 rounded-2xl outline-none font-bold text-slate-700 text-xs shadow-inner focus:ring-2 focus:ring-indigo-500/20"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{totalRecords} Resultados</span>
          </div>
          {hasFiltersActive && (
            <button 
              onClick={() => {
                setSearchTerm('');
                setFilters({
                  nivel: '1,5', modalidad: '', estado: '', municipio: '', sostenimiento: '',
                  min_eficiencia: '', min_tasa_egreso: '', min_mujeres: '', min_inclusion: '',
                  id_campo_detallado: '', min_solicitudes: '', min_lugares: '', min_matricula: ''
                });
              }}
              className="text-[10px] font-black text-indigo-600 uppercase tracking-widest"
            >
              Limpiar
            </button>
          )}
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-8">
        <aside className="hidden lg:block w-72 shrink-0">
          <div className="bg-white rounded-[32px] p-6 border border-slate-100 shadow-sm sticky top-24 max-h-[calc(100vh-120px)] overflow-y-auto custom-scrollbar">
            <div className="flex items-center gap-2 mb-6">
              <div className="p-1.5 bg-indigo-600 text-white rounded-lg"><Filter size={16} /></div>
              <h2 className="text-lg font-black text-slate-900 tracking-tight">Filtros</h2>
            </div>
            <div className="space-y-6">
              <div className="space-y-4">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Carrera / Institución</label>
                <div className="relative group">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                  <input
                    type="text"
                    placeholder="Ej. Medicina..."
                    className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none font-bold text-slate-700 text-xs"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
              </div>
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Estado</label>
                  <select 
                    value={filters.estado}
                    onChange={e => setFilters({...filters, estado: e.target.value, municipio: ''})}
                    className="w-full p-2.5 bg-slate-50 border border-slate-100 rounded-xl outline-none font-bold text-xs text-slate-700"
                  >
                    <option value="">Todos los estados</option>
                    {catalogos.estados.map(e => <option key={e.id_entidad} value={e.id_entidad}>{e.nombre}</option>)}
                  </select>
                </div>
              </div>
            </div>
          </div>
        </aside>

        <main className="flex-1 space-y-12">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-2">
              <h1 className="text-4xl md:text-5xl font-black text-slate-900 tracking-tighter">
                Oferta <span className="text-indigo-600">Educativa</span>
              </h1>
              <p className="text-slate-500 font-bold">
                {hasSearched ? `Se encontraron ${totalRecords} programas` : 'Descubre tu camino profesional'}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest whitespace-nowrap">Ordenar por</span>
              <select
                value={sortBy}
                onChange={e => setSortBy(e.target.value as any)}
                className="py-3 px-4 bg-white border border-slate-200 rounded-2xl outline-none font-bold text-xs shadow-sm"
              >
                <option value="none">Relevancia</option>
                <option value="ipd_asc">Probabilidad: Más Difícil</option>
                <option value="ipd_desc">Probabilidad: Más Fácil</option>
                <option value="ingreso_desc">Nuevos Ingresos: Mayor → Menor</option>
                <option value="ingreso_asc">Nuevos Ingresos: Menor → Mayor</option>
              </select>
            </div>
          </div>

          <div className="flex overflow-x-auto lg:grid lg:grid-cols-4 gap-4 mb-8 pb-4 lg:pb-0 scroll-smooth snap-x no-scrollbar">
            {[
              { label: 'Total Ofertas', val: totalRecords, bg: 'bg-indigo-50', color: 'text-indigo-600' },
              { label: 'Nivel Global', val: filters.nivel ? catalogos.niveles.find(n => filters.nivel.split(',').includes(n.id_nivel.toString()))?.nombre.split(' ')[0] : 'Todos', bg: 'bg-emerald-50', color: 'text-emerald-600' },
              { label: 'Eficiencia Media', val: `${globalEficiencia > 0 ? Math.round(globalEficiencia) : '0'}%`, bg: 'bg-purple-50', color: 'text-purple-600' },
              { label: 'Mujeres %', val: `${ofertas.length > 0 ? (ofertas.reduce((acc, o) => acc + (o.matricula_mujeres / (o.matricula_total || 1) * 100), 0) / ofertas.length).toFixed(0) : '0'}%`, bg: 'bg-orange-50', color: 'text-orange-600' }
            ].map((stat, i) => (
              <div key={i} className="min-w-[280px] lg:min-w-0 p-6 bg-white rounded-3xl border border-slate-100 shadow-sm relative overflow-hidden snap-center">
                <div className={`absolute top-0 right-0 w-24 h-24 ${stat.bg} rounded-full -mr-12 -mt-12`} />
                <div className="relative">
                  <div className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1">{stat.label}</div>
                  <div className="text-3xl font-black text-slate-900">{loading ? '...' : stat.val}</div>
                </div>
              </div>
            ))}
          </div>

          <AnimatePresence mode="wait">
            {loading && page === 1 ? (
              <motion.div key="loading" className="h-[400px] flex items-center justify-center bg-white rounded-[48px] border border-slate-100">
                <p className="text-slate-900 font-black text-lg">Cargando Oferta...</p>
              </motion.div>
            ) : (
              <motion.div key="results" className="space-y-12">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pb-32">
                  {ofertas.map((oferta, index) => (
                    <div 
                      key={oferta.id_oferta} 
                      ref={ofertas.length === index + 1 ? lastElementRef : null}
                      onClick={() => setSelectedOferta(oferta)}
                      className="cursor-pointer"
                    >
                      <CareerCard oferta={oferta} />
                    </div>
                  ))}
                </div>
                {hasMore && (
                  <div className="flex justify-center pt-8">
                    {loadingMore && <div className="text-indigo-600 font-bold">Cargando más...</div>}
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </main>
      </div>

      <AnimatePresence>
        {selectedOferta && (
          <OfferDetailModal oferta={selectedOferta} onClose={() => setSelectedOferta(null)} />
        )}
      </AnimatePresence>

      {/* Mobile Bottom Filter Bar */}
      <div className="lg:hidden fixed bottom-28 left-0 right-0 z-[1000] px-4 pointer-events-none">
        <div className="max-w-[500px] mx-auto pointer-events-auto">
          <div className="bg-white/90 backdrop-blur-2xl border border-slate-100 rounded-2xl p-2 shadow-2xl flex items-center gap-2 overflow-x-auto no-scrollbar">
             <div className="flex bg-slate-50 rounded-xl p-1 shrink-0">
                {[{id:'',label:'TODAS'},{id:'1',label:'PUB'},{id:'2',label:'PRI'}].map(s=>(
                  <button key={s.id} onClick={()=>setFilters({...filters,sostenimiento:s.id})} className={`px-3 py-1.5 rounded-lg text-[9px] font-black tracking-widest ${filters.sostenimiento===s.id?'bg-white text-indigo-600 shadow-sm' : 'text-slate-400'}`}>
                    {s.label}
                  </button>
                ))}
              </div>
              <div className="flex gap-2 shrink-0">
                  <select value={filters.estado} onChange={e=>setFilters({...filters,estado:e.target.value,municipio:''})} className="px-3 py-2 bg-slate-50 border border-transparent rounded-xl text-[9px] font-black text-slate-600 uppercase tracking-widest outline-none">
                    <option value="">ESTADO</option>
                    {catalogos.estados.map(e=><option key={e.id_entidad} value={e.id_entidad}>{e.nombre}</option>)}
                  </select>
                  <select value={filters.modalidad} onChange={e=>setFilters({...filters,modalidad:e.target.value})} className="px-3 py-2 bg-slate-50 border border-transparent rounded-xl text-[9px] font-black text-slate-600 uppercase tracking-widest outline-none">
                    <option value="">MODALIDAD</option>
                    {catalogos.modalidades.map(m=><option key={m.id_modalidad} value={m.id_modalidad}>{m.nombre}</option>)}
                  </select>
              </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OfertaEducativa;
