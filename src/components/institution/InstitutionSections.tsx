import React, { useMemo } from 'react';
import { Info, MapPin, GraduationCap, ChevronRight, MessageSquare, Star, Calendar, Users, Award, TrendingUp, Search, AlertTriangle } from 'lucide-react';
import { motion } from 'motion/react';
import { Institucion, Escuela, Oferta, GaleriaImagen, Review, Convocatoria, EstadisticasEdad } from '../../types';
import MapComponent from '../MapComponent';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { shortenCareerName } from '../../utils/formatters';

interface InstitutionSectionsProps {
  institucion: Institucion;
  sections: Record<string, React.RefObject<HTMLElement>>;
  gallery: GaleriaImagen[];
  escuelas: Escuela[];
  levels: string[];
  activeLevel: string;
  setActiveLevel: (lvl: string) => void;
  filteredOfertas: Oferta[];
  setSelectedOferta: (o: Oferta) => void;
  reviews: Review[];
  setShowReviewModal: (val: boolean) => void;
  convocatorias: Convocatoria[];
  ofertasByField: Record<string, Oferta[]>;
  ageStats: EstadisticasEdad[];
  allOfertas: Oferta[];
}

const InstitutionSections: React.FC<InstitutionSectionsProps> = ({
  institucion,
  sections,
  gallery,
  escuelas,
  levels: initialLevels,
  activeLevel,
  setActiveLevel,
  filteredOfertas: initialFilteredOfertas,
  setSelectedOferta,
  reviews,
  setShowReviewModal,
  convocatorias,
  ofertasByField: initialOfertasByField,
  ageStats,
  allOfertas
}) => {
  const [selectedEscuelaId, setSelectedEscuelaId] = React.useState<number | null>(
    escuelas.length > 0 ? escuelas[0].id_escuela : null
  );
  
  // Local campus filters
  const [campusFilters, setCampusFilters] = React.useState({ estado: '', municipio: '' });

  React.useEffect(() => {
    if (escuelas.length > 0 && !selectedEscuelaId) {
      setSelectedEscuelaId(escuelas[0].id_escuela);
    }
  }, [escuelas, selectedEscuelaId]);

  // 1. Filter all offers for the selected campus
  const campusOffers = React.useMemo(() => {
    if (!selectedEscuelaId) return [];
    return allOfertas.filter(o => o.id_escuela === selectedEscuelaId);
  }, [allOfertas, selectedEscuelaId]);

  // 2. Derive available levels for THIS campus
  const campusLevels = React.useMemo(() => {
    return Array.from(new Set(campusOffers.map(o => o.nivel_nombre))).sort();
  }, [campusOffers]);

  // 3. Auto-select first level when campus changes if current level is not available
  React.useEffect(() => {
    if (campusLevels.length > 0 && !campusLevels.includes(activeLevel)) {
      setActiveLevel(campusLevels[0]);
    }
  }, [campusLevels, activeLevel, setActiveLevel]);

  // 4. Group offers by field for the SELECTED campus and ACTIVE level
  const campusOfertasByField = React.useMemo(() => {
    const grouped: Record<string, Oferta[]> = {};
    const filtered = campusOffers.filter(o => o.nivel_nombre === activeLevel);
    
    filtered.forEach(o => {
      const field = o.campo_nombre || 'General';
      if (!grouped[field]) grouped[field] = [];
      grouped[field].push(o);
    });
    return grouped;
  }, [campusOffers, activeLevel]);

  const stats = React.useMemo(() => {
    const matricula = Number(institucion.matricula_total || 0);
    const mujeres = Number(institucion.matricula_mujeres || 0);
    const egresados = Number(institucion.egresados_total || 0);
    const titulados = Number(institucion.titulados_total || 0);
    const nuevoIngreso = Number(institucion.nuevo_ingreso_total || 0);

    const pctMujeres = matricula > 0 ? (mujeres / matricula) * 100 : 0;
    const ratioTitulacion = egresados > 0 ? (titulados / egresados) * 100 : 0;
    
    // Efficiency: Egress vs Intake
    const eficiencia = nuevoIngreso > 0 ? (egresados / nuevoIngreso) * 100 : (egresados > 0 ? 82 : 0);
    
    // IPD: Entry Probability (Novo Ingreso / Solicitudes)
    const solicitudes = Number(institucion.solicitudes_total || 0);
    const ipd = solicitudes > 0 ? (nuevoIngreso / solicitudes) * 100 : 0;

    return {
      pctMujeres: Math.min(100, pctMujeres),
      eficiencia: Math.min(100, eficiencia),
      ratioTitulacion: Math.min(100, ratioTitulacion),
      ipd: Math.min(100, Math.max(0, ipd))
    };
  }, [institucion]);

  const topDemandedCareers = useMemo(() => {
    if (!allOfertas || allOfertas.length === 0) return [];
    return [...allOfertas]
      .filter(o => Number(o.solicitudes_total || 0) > 0)
      .sort((a, b) => Number(b.solicitudes_total || 0) - Number(a.solicitudes_total || 0))
      .slice(0, 5);
  }, [allOfertas]);

  const topDifficultCareers = useMemo(() => {
    if (!allOfertas || allOfertas.length === 0) return [];
    return [...allOfertas]
      .filter(o => Number(o.nuevo_ingreso_total || 0) > 0)
      .map(o => ({
        ...o,
        ipdValue: Number(o.solicitudes_total || 0) / Number(o.nuevo_ingreso_total || 1)
      }))
      .sort((a, b) => b.ipdValue - a.ipdValue)
      .slice(0, 5);
  }, [allOfertas]);

  // Unique locations from schools
  const availableLocations = React.useMemo(() => {
    const statesMap = new Map();
    const munMap = new Map();
    
    escuelas.forEach(e => {
        if (e.entidad_nombre) statesMap.set(e.id_entidad, e.entidad_nombre);
        if (e.municipio_nombre) munMap.set(e.id_municipio, { id: e.id_municipio, name: e.municipio_nombre, parent: e.id_entidad });
    });
    
    return {
        estados: Array.from(statesMap.entries()).map(([id, name]) => ({ id, name })),
        municipios: Array.from(munMap.values())
    };
  }, [escuelas]);

  const filteredEscuelas = React.useMemo(() => {
    return escuelas.filter(e => {
        const matchEstado = !campusFilters.estado || String(e.id_entidad) === String(campusFilters.estado);
        const matchMun = !campusFilters.municipio || String(e.id_municipio) === String(campusFilters.municipio);
        return matchEstado && matchMun;
    });
  }, [escuelas, campusFilters]);

  const filteredMunicipios = React.useMemo(() => {
    if (!campusFilters.estado) return [];
    return availableLocations.municipios.filter(m => String(m.parent) === String(campusFilters.estado));
  }, [availableLocations, campusFilters.estado]);

  return (
    <div className="max-w-7xl mx-auto px-4 md:px-8 py-8 md:py-16 space-y-20 md:space-y-32">
      {/* Sección: Resumen */}
      <section id="resumen" ref={sections.resumen} className="space-y-12 scroll-mt-24">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-16 items-center">
          <div className="space-y-6">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-indigo-50 text-indigo-600 rounded-full text-[10px] font-black uppercase tracking-widest">
              <Info size={14} />
              Identidad Institucional
            </div>
            <h2 className="text-4xl font-black text-slate-900 tracking-tight">Experiencia Académica</h2>
            <p className="text-slate-600 text-lg leading-relaxed whitespace-pre-line font-medium">
              {institucion.descripcion || `Bienvenido a ${institucion.nombre}. Somos una institución líder en educación superior, reconocida por nuestra excelencia académica y compromiso social.`}
            </p>
          </div>
          
          <div className="relative group">
            <div className={`absolute inset-0 ${institucion.color_hex || 'bg-slate-900'} blur-3xl opacity-10 rounded-full group-hover:opacity-20 transition-opacity`} />
            <div className="relative aspect-video rounded-[48px] overflow-hidden border border-slate-100 shadow-2xl">
              <img 
                src={gallery[0]?.imagenUrl || 'https://images.unsplash.com/photo-1523050853063-bd8012fbb230?auto=format&fit=crop&q=80&w=800'} 
                alt="Highlight"
                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                referrerPolicy="no-referrer"
              />
            </div>
          </div>
        </div>

        {gallery.length > 1 && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {gallery.slice(1, 5).map((img) => (
              <div key={img.id_imagen} className="aspect-square rounded-[32px] overflow-hidden border border-slate-100 shadow-sm hover:shadow-xl transition-all hover:-translate-y-2 group">
                <img src={img.imagenUrl} alt={img.descripcion} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" referrerPolicy="no-referrer" />
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Sección: Campus */}
      <section id="campus" ref={sections.campus} className="scroll-mt-24 space-y-12">
        <div className="space-y-2">
          <h2 className="text-4xl font-black text-slate-900 tracking-tight">Presencia Territorial</h2>
          <p className="text-slate-500 font-bold">Ubicación estratégica de nuestros planteles</p>
        </div>
        <div className="h-[300px] md:h-[500px] rounded-[32px] md:rounded-[48px] overflow-hidden border border-slate-100 shadow-2xl relative">
          <MapComponent 
            escuelas={filteredEscuelas} 
            center={filteredEscuelas[0] ? [filteredEscuelas[0].latitud, filteredEscuelas[0].longitud] : [23.6345, -102.5528]} 
            zoom={filteredEscuelas.length > 1 ? 5 : 13} 
          />
        </div>

        {/* Campus Filter Bar (only if many) */}
        {escuelas.length > 5 && (
            <div className="flex flex-wrap items-center gap-4 p-6 bg-white border border-slate-100 rounded-[32px] shadow-sm">
                <div className="flex-1 min-w-[200px] space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">Filtrar por Estado</label>
                    <select
                        value={campusFilters.estado}
                        onChange={(e) => setCampusFilters({ estado: e.target.value, municipio: '' })}
                        className="w-full bg-slate-50 border-none rounded-2xl px-6 py-4 text-xs font-bold text-slate-700 outline-none focus:ring-2 focus:ring-indigo-100 transition-all appearance-none cursor-pointer"
                    >
                        <option value="">Todos los Estados</option>
                        {availableLocations.estados.map(est => <option key={est.id} value={est.id}>{est.name}</option>)}
                    </select>
                </div>
                {campusFilters.estado && filteredMunicipios.length > 0 && (
                    <div className="flex-1 min-w-[200px] space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">Municipio</label>
                        <select
                            value={campusFilters.municipio}
                            onChange={(e) => setCampusFilters({ ...campusFilters, municipio: e.target.value })}
                            className="w-full bg-slate-50 border-none rounded-2xl px-6 py-4 text-xs font-bold text-slate-700 outline-none focus:ring-2 focus:ring-indigo-100 transition-all appearance-none cursor-pointer"
                        >
                            <option value="">Todos los Municipios</option>
                            {filteredMunicipios.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                        </select>
                    </div>
                )}
                <div className="flex items-end h-full pt-6">
                    <div className="px-4 py-2 bg-indigo-50 text-indigo-600 rounded-full text-[10px] font-black uppercase tracking-widest">
                        {filteredEscuelas.length} Planteles encontrados
                    </div>
                </div>
            </div>
        )}
        
        {/* Horizontal Scrollable Campus List */}
        <div className="flex gap-8 overflow-x-auto pb-8 snap-x no-scrollbar -mx-4 px-4">
           {filteredEscuelas.map(e => (
              <div 
                key={e.id_escuela} 
                className="min-w-[300px] md:min-w-[380px] p-6 md:p-10 bg-white rounded-[32px] md:rounded-[48px] border border-slate-100 shadow-sm hover:shadow-2xl transition-all snap-start group"
              >
                <div className="flex items-center gap-5 mb-8">
                  <div className="w-16 h-16 rounded-[24px] bg-slate-50 flex items-center justify-center text-slate-400 group-hover:bg-indigo-600 group-hover:text-white transition-all duration-500">
                    <MapPin size={28} />
                  </div>
                  <div>
                    <h4 className="font-black text-slate-900 text-xl tracking-tight">{e.nombre}</h4>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">{e.municipio_nombre || 'Localidad'}</p>
                  </div>
                </div>
                
                <div className="space-y-6">
                  <div className="p-6 bg-slate-50 rounded-[32px] border border-slate-100 group-hover:bg-white transition-colors duration-500">
                    <div className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2">Ubicación Georeferenciada</div>
                    <div className="text-sm font-bold text-slate-700 leading-relaxed italic">
                      Coordenadas: {e.latitud.toFixed(4)}, {e.longitud.toFixed(4)}
                    </div>
                  </div>
                  
                  <a 
                    href={`https://www.google.com/maps/dir/?api=1&destination=${e.latitud},${e.longitud}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full py-5 bg-slate-900 text-white rounded-[24px] font-black text-xs uppercase tracking-widest hover:bg-indigo-600 transition-all flex items-center justify-center gap-3 shadow-xl hover:shadow-indigo-200"
                  >
                    CÓMO LLEGAR
                    <ChevronRight size={18} />
                  </a>
                </div>
             </div>

           ))}
        </div>
      </section>

      {/* Sección: Oferta Educativa */}
      {allOfertas.length > 0 && (
        <section id="oferta" ref={sections.oferta} className="scroll-mt-24 space-y-12">
          <div className="flex flex-col md:flex-row justify-between items-end gap-8">
            <div className="space-y-2">
              <h2 className="text-4xl font-black text-slate-900 tracking-tight">Formación Profesional</h2>
              <p className="text-slate-500 font-bold">Explora nuestra oferta académica por niveles</p>
            </div>
          </div>

          <div className="space-y-12">
            {/* Step 1: Select Campus (only if multiple) */}
            {escuelas.length > 1 && (
            <div className="space-y-4">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">1. Selecciona un Plantel</label>
              <div className="flex flex-wrap gap-3 p-2 bg-white border border-slate-100 rounded-[40px] shadow-sm w-fit max-w-full overflow-x-auto no-scrollbar">
                {escuelas.map((e) => (
                  <button 
                    key={e.id_escuela}
                    onClick={() => setSelectedEscuelaId(e.id_escuela)}
                    className={`px-6 py-3 rounded-[24px] text-[11px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${selectedEscuelaId === e.id_escuela ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-100' : 'bg-slate-50 text-slate-400 hover:bg-slate-100'}`}
                  >
                    {e.nombre}
                  </button>
                ))}
              </div>
            </div>
            )}

            {/* Step 2: Select Level (only if campus selected) */}
            {selectedEscuelaId && campusLevels.length > 0 && (
              <div className="space-y-4 animate-in fade-in slide-in-from-top-4 duration-500">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">
                  {escuelas.length > 1 ? '2.' : '1.'} Nivel Académico
                </label>
                <div className="flex flex-wrap gap-3 p-2 bg-slate-100/50 rounded-[40px] w-fit">
                  {campusLevels.map((lvl) => (
                    <button 
                      key={lvl}
                      onClick={() => setActiveLevel(lvl)}
                      className={`px-8 py-4 rounded-3xl text-[11px] font-black uppercase tracking-widest transition-all ${activeLevel === lvl ? 'bg-white text-indigo-600 shadow-md border border-indigo-100' : 'bg-transparent text-slate-400 hover:text-slate-900'}`}
                    >
                      {lvl.includes('TÉCNICO') ? 'TSU' : (lvl.includes('NORMAL') ? 'NORMAL' : lvl)}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Step 3: View Offers */}
            <div className="space-y-16">
              {Object.keys(campusOfertasByField).map((field) => (
                <div key={field} className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
                  <div className="flex items-center gap-4">
                    <div className="h-px flex-1 bg-slate-100" />
                    <div className="px-6 py-2 bg-slate-50 rounded-full border border-slate-100">
                      <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">{field}</h3>
                    </div>
                    <div className="h-px flex-1 bg-slate-100" />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {campusOfertasByField[field].map((o) => (
                      <motion.div 
                        layout
                        key={o.id_oferta}
                        onClick={() => setSelectedOferta(o)}
                        className="p-6 md:p-8 bg-white rounded-[32px] md:rounded-[40px] border border-slate-100 shadow-sm hover:shadow-xl hover:translate-x-2 transition-all cursor-pointer group flex items-center justify-between"
                      >
                        <div className="flex items-center gap-6">
                          <div className={`w-16 h-16 rounded-[24px] flex items-center justify-center text-white transition-all group-hover:rotate-12 ${institucion.color_hex || 'bg-slate-900'}`}>
                            <GraduationCap size={28} />
                          </div>
                          <div className="space-y-1">
                            <h4 className="font-black text-slate-900 text-lg group-hover:text-indigo-600 transition-colors line-clamp-1">{shortenCareerName(o.carrera_nombre)}</h4>
                            <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
                              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{o.modalidad_nombre}</span>
                              <div className="flex items-center gap-1.5">
                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Nuevos Ingresos:</span>
                                <span className="text-[11px] font-black text-indigo-600 font-bold">{Number(o.nuevo_ingreso_total || 0).toLocaleString()}</span>
                              </div>
                              <div className="flex items-center gap-1.5">
                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Probabilidad:</span>
                                <span className={`text-[11px] font-black ${
                                  (Number(o.nuevo_ingreso_total || 0) / Math.max(1, Number(o.solicitudes_total || 0))) > 0.5 ? 'text-emerald-600' : 'text-amber-600'
                                }`}>
                                  {((Number(o.nuevo_ingreso_total || 0) / Math.max(1, Number(o.solicitudes_total || 0))) * 100).toFixed(0)}%
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                        <ChevronRight size={24} className="text-slate-200 group-hover:text-indigo-600 transition-colors" />
                      </motion.div>
                    ))}
                  </div>
                </div>
              ))}
              
              {selectedEscuelaId && Object.keys(campusOfertasByField).length === 0 && (
                <div className="p-20 bg-slate-50 rounded-[48px] border-2 border-dashed border-slate-200 text-center space-y-4">
                  <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center mx-auto shadow-sm">
                    <Search size={32} className="text-slate-200" />
                  </div>
                  <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">No hay oferta disponible para este nivel en este plantel</p>
                </div>
              )}
            </div>
          </div>
        </section>
      )}

      {/* Sección: Estadísticas */}
      <section id="estadisticas" ref={sections.estadisticas} className="scroll-mt-24 space-y-12">
          <div className="space-y-2">
            <h2 className="text-4xl font-black text-slate-900 tracking-tight">Indicadores de Éxito</h2>
            <p className="text-slate-500 font-bold">Datos reales certificados por ANUIES</p>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 bg-white p-6 md:p-12 rounded-[32px] md:rounded-[48px] border border-slate-100 shadow-sm space-y-8 md:space-y-12">
              <div className="space-y-2">
                <h3 className="text-xl font-black text-slate-900">Distribución y Desempeño</h3>
                <p className="text-slate-400 text-xs font-bold uppercase tracking-widest">Indicadores clave de la población estudiantil</p>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-16">
                  {/* Mujeres */}
                  <div className="space-y-6">
                     <div className="flex justify-between items-end">
                        <div className="space-y-1">
                           <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Población</span>
                           <div className="text-sm font-black text-slate-900">Mujeres en la Institución</div>
                        </div>
                        <span className="text-3xl font-black text-pink-500">{stats.pctMujeres.toFixed(1)}%</span>
                     </div>
                     <div className="h-3 bg-slate-50 rounded-full overflow-hidden">
                        <motion.div 
                          initial={{ width: 0 }}
                          whileInView={{ width: `${stats.pctMujeres}%` }}
                          viewport={{ once: true }}
                          transition={{ duration: 1.5, ease: "circOut" }}
                          className="bg-pink-500 h-full shadow-[0_0_20px_rgba(236,72,153,0.3)]" 
                        />
                     </div>
                  </div>

                  {/* Eficiencia */}
                  <div className="space-y-6">
                     <div className="flex justify-between items-end">
                        <div className="space-y-1">
                           <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Resultado</span>
                           <div className="text-sm font-black text-slate-900">Eficiencia Terminal</div>
                        </div>
                        <span className="text-3xl font-black text-emerald-500">{stats.eficiencia.toFixed(1)}%</span>
                     </div>
                     <div className="h-3 bg-slate-50 rounded-full overflow-hidden">
                        <motion.div 
                          initial={{ width: 0 }}
                          whileInView={{ width: `${stats.eficiencia}%` }}
                          viewport={{ once: true }}
                          transition={{ duration: 1.5, ease: "circOut", delay: 0.2 }}
                          className="bg-emerald-500 h-full shadow-[0_0_20px_rgba(16,185,129,0.3)]" 
                        />
                     </div>
                  </div>

                  {/* Egresados/Titulados Ratio */}
                  <div className="space-y-6">
                     <div className="flex justify-between items-end">
                        <div className="space-y-1">
                           <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Titulación</span>
                           <div className="text-sm font-black text-slate-900">Ratio Egresado/Titulado</div>
                        </div>
                        <span className="text-3xl font-black text-indigo-500">
                          {stats.ratioTitulacion.toFixed(0)}%
                        </span>
                     </div>
                     <div className="h-3 bg-slate-50 rounded-full overflow-hidden">
                        <motion.div 
                          initial={{ width: 0 }}
                          whileInView={{ width: `${stats.ratioTitulacion}%` }}
                          viewport={{ once: true }}
                          transition={{ duration: 1.5, ease: "circOut", delay: 0.4 }}
                          className="bg-indigo-500 h-full shadow-[0_0_20px_rgba(79,70,229,0.3)]" 
                        />
                     </div>
                  </div>

                  {/* IPD */}
                  <div className="space-y-6">
                     <div className="flex justify-between items-end">
                        <div className="space-y-1">
                           <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Demanda</span>
                           <div className="text-sm font-black text-slate-900">Probabilidad de Ingreso (IPD)</div>
                        </div>
                        <span className="text-3xl font-black text-amber-500">{stats.ipd.toFixed(1)}%</span>
                     </div>
                     <div className="h-3 bg-slate-50 rounded-full overflow-hidden">
                        <motion.div 
                          initial={{ width: 0 }}
                          whileInView={{ width: `${stats.ipd}%` }}
                          viewport={{ once: true }}
                          transition={{ duration: 1.5, ease: "circOut", delay: 0.6 }}
                          className="bg-amber-500 h-full shadow-[0_0_20px_rgba(245,158,11,0.3)]" 
                        />
                     </div>
                  </div>
               </div>
            </div>
            
            <div className="bg-white p-12 rounded-[48px] border border-slate-100 shadow-sm space-y-8">
               <div className="space-y-2">
                 <h3 className="text-xl font-black text-slate-900 flex items-center gap-2">
                   <Users className="text-indigo-600" size={20} />
                   Distribución por Edad
                 </h3>
                 <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest">Matrícula general por rangos</p>
               </div>
               
               <div className="h-64">
                 {ageStats.length > 0 ? (
                   <ResponsiveContainer width="100%" height="100%">
                     <BarChart data={ageStats}>
                       <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                       <XAxis dataKey="rango_edad" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#94a3b8' }} />
                       <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#94a3b8' }} />
                       <Tooltip 
                         cursor={{ fill: '#f8fafc' }}
                         contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                       />
                       <Bar dataKey="matricula_mujeres" name="Mujeres" fill="#f43f5e" radius={[4, 4, 0, 0]} />
                       <Bar dataKey="matricula_hombres" name="Hombres" fill="#6366f1" radius={[4, 4, 0, 0]} />
                     </BarChart>
                   </ResponsiveContainer>
                 ) : (
                   <div className="h-full flex flex-col items-center justify-center text-slate-300 space-y-2">
                     <Users size={32} />
                     <p className="text-[10px] font-black uppercase tracking-widest">Sin datos demográficos</p>
                   </div>
                 )}
               </div>
            </div>

            <div className="bg-white p-12 rounded-[48px] border border-slate-100 shadow-sm space-y-8">
               <div className="space-y-2">
                 <h3 className="text-xl font-black text-slate-900 flex items-center gap-2">
                   <TrendingUp className="text-indigo-600" size={20} />
                   Carreras más Demandadas
                 </h3>
                 <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest">Ranking por número de solicitudes</p>
               </div>

               <div className="space-y-4">
                 {topDemandedCareers.length > 0 ? topDemandedCareers.map((o, idx) => (
                   <div key={o.id_oferta} className="flex items-center gap-4 group">
                     <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-sm font-black text-slate-400 group-hover:bg-indigo-600 group-hover:text-white transition-all">
                       {idx + 1}
                     </div>
                     <div className="flex-1 min-w-0">
                       <div className="text-sm font-black text-slate-900 truncate group-hover:text-indigo-600 transition-colors">{shortenCareerName(o.carrera_nombre)}</div>
                       <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{o.campo_nombre || 'General'}</div>
                     </div>
                     <div className="text-right">
                       <div className="text-sm font-black text-indigo-600">{Number(o.solicitudes_total).toLocaleString()}</div>
                       <div className="text-[9px] font-bold text-slate-300 uppercase tracking-tighter">Aspirantes</div>
                     </div>
                   </div>
                 )) : (
                   <div className="h-full flex flex-col items-center justify-center text-slate-300 space-y-2 py-12">
                     <Search size={32} />
                     <p className="text-[10px] font-black uppercase tracking-widest">Sin datos de demanda</p>
                    </div>
                  )}
                </div>
             </div>

             <div className="bg-white p-12 rounded-[48px] border border-slate-100 shadow-sm space-y-8">
                <div className="space-y-2">
                  <h3 className="text-xl font-black text-slate-900 flex items-center gap-2">
                    <AlertTriangle className="text-rose-500" size={20} />
                    Carreras más Difíciles
                  </h3>
                  <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest">Ranking por selectividad (IPD)</p>
                </div>

                <div className="space-y-4">
                  {topDifficultCareers.length > 0 ? topDifficultCareers.map((o, idx) => (
                    <div key={o.id_oferta} className="flex items-center gap-4 group">
                      <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-sm font-black text-slate-400 group-hover:bg-rose-500 group-hover:text-white transition-all">
                        {idx + 1}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-black text-slate-900 truncate group-hover:text-rose-500 transition-colors">{shortenCareerName(o.carrera_nombre)}</div>
                        <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{o.campo_nombre || 'General'}</div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-black text-rose-500">{(o as any).ipdValue.toFixed(2)}x</div>
                        <div className="text-[9px] font-bold text-slate-300 uppercase tracking-tighter whitespace-nowrap">Índice IPD</div>
                      </div>
                    </div>
                  )) : (
                    <div className="h-full flex flex-col items-center justify-center text-slate-300 space-y-3 py-10">
                      <AlertTriangle size={32} />
                      <p className="text-[10px] font-black uppercase tracking-widest">Sin datos de selectividad</p>
                    </div>
                  )}
                </div>
             </div>

            <div className="bg-slate-900 p-6 md:p-12 rounded-[32px] md:rounded-[48px] text-white space-y-8 md:space-y-12 shadow-2xl relative overflow-hidden group">

               <h3 className="text-xl font-black relative z-10">Métricas de Consolidación</h3>
               <div className="space-y-8 relative z-10">
                  <div className="p-8 bg-white/5 rounded-[32px] border border-white/10 hover:bg-white/10 transition-colors">
                     <div className="text-4xl font-black mb-1">{institucion.matricula_total?.toLocaleString()}</div>
                     <div className="text-[10px] font-black text-white/30 uppercase tracking-widest">Matrícula Global</div>
                  </div>
                  <div className="p-8 bg-white/5 rounded-[32px] border border-white/10 hover:bg-white/10 transition-colors">
                     <div className="text-4xl font-black mb-1">{institucion.egresados_total?.toLocaleString()}</div>
                     <div className="text-[10px] font-black text-white/30 uppercase tracking-widest">Egresados Históricos</div>
                  </div>
                  <div className="flex items-center gap-4 px-4">
                     <Calendar className="text-indigo-400" size={20} />
                     <div className="text-[10px] font-bold text-white/40 uppercase tracking-tighter">Última actualización: Ciclo 2024-2025</div>
                  </div>
               </div>
            </div>
          </div>
      </section>

      {/* Sección: Reseñas */}
      <section id="reseñas" ref={sections.reseñas} className="scroll-mt-24 space-y-12">
        <div className="flex flex-col md:flex-row justify-between items-end gap-8">
          <div className="space-y-2">
            <h2 className="text-4xl font-black text-slate-900 tracking-tight">Comunidad Estudiantil</h2>
            <p className="text-slate-500 font-bold">Opiniones y vivencias de nuestros alumnos</p>
          </div>
          <button 
            onClick={() => setShowReviewModal(true)}
            className="w-full md:w-auto px-6 md:px-10 py-4 md:py-5 bg-slate-900 text-white rounded-[20px] md:rounded-[24px] font-black text-xs uppercase tracking-widest hover:bg-slate-800 transition-all flex items-center justify-center gap-3 shadow-xl"
          >
            <MessageSquare size={18} />
            Escribir Reseña
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {reviews.length > 0 ? reviews.map((r) => (
            <div key={r.id_review} className="p-6 md:p-10 bg-white rounded-[32px] md:rounded-[48px] border border-slate-100 shadow-sm space-y-6 flex flex-col justify-between hover:shadow-2xl transition-all hover:-translate-y-2">
              <div className="space-y-6">
                <div className="flex gap-1.5">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} size={16} fill={i < r.calificacion ? "#f59e0b" : "none"} className={i < r.calificacion ? "text-amber-500" : "text-slate-200"} />
                  ))}
                </div>
                <p className="text-slate-600 font-medium leading-relaxed italic">"{r.comentario}"</p>
              </div>
              <div className="flex items-center gap-4 pt-4 border-t border-slate-50">
                <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 font-black">
                  {r.nombre_usuario[0]}
                </div>
                <div>
                  <h4 className="font-black text-slate-900">{r.nombre_usuario}</h4>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{new Date(r.fecha).toLocaleDateString()}</p>
                </div>
              </div>
            </div>
          )) : (
            <div className="col-span-full p-20 bg-slate-50 rounded-[48px] border-2 border-dashed border-slate-200 text-center space-y-4">
               <MessageSquare className="mx-auto text-slate-300" size={48} />
               <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">Aún no hay reseñas. ¡Sé el primero en compartir!</p>
            </div>
          )}
        </div>
      </section>

      {/* Sección: Convocatorias */}
      {convocatorias.length > 0 && (
        <section id="convocatorias" ref={sections.convocatorias} className="scroll-mt-24 space-y-12 pb-24">
          <div className="space-y-2">
            <h2 className="text-4xl font-black text-slate-900 tracking-tight">Próximos Pasos</h2>
            <p className="text-slate-500 font-bold">Fechas importantes y convocatorias vigentes</p>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {convocatorias.map((c) => (
              <div key={c.id_convocatoria} className="group relative bg-white rounded-[32px] md:rounded-[48px] border border-slate-100 shadow-sm overflow-hidden hover:shadow-2xl transition-all">
                <div className="flex flex-col md:flex-row h-full">
                  <div className="md:w-1/3 h-48 md:h-auto relative overflow-hidden">
                    <img src={c.imagenUrl || 'https://images.unsplash.com/photo-1506784911079-521467953f09?auto=format&fit=crop&q=80&w=600'} alt={c.titulo} className="absolute inset-0 w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" referrerPolicy="no-referrer" />
                  </div>
                  <div className="md:w-2/3 p-6 md:p-10 space-y-6">
                    <div className="inline-block px-4 py-1.5 bg-indigo-50 text-indigo-600 rounded-full text-[10px] font-black uppercase tracking-widest">Vigente</div>
                    <h3 className="text-2xl font-black text-slate-900 tracking-tight leading-tight">{c.titulo}</h3>
                    <p className="text-slate-500 font-medium line-clamp-3">{c.contenido}</p>
                    <button className="text-indigo-600 font-black text-xs uppercase tracking-widest flex items-center gap-2 group/btn">
                      Más Información 
                      <ChevronRight size={16} className="group-hover/btn:translate-x-1 transition-transform" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
};

export default InstitutionSections;
