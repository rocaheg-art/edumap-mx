import React, { useState, useMemo, useEffect } from 'react';
import { 
  MapContainer, 
  TileLayer, 
  useMap, 
  CircleMarker, 
  Tooltip as LTooltip 
} from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet.heat'; 
import MarkerClusterGroup from 'react-leaflet-cluster';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, 
  Maximize2, 
  Info, 
  Users, 
  VenetianMask as Gender, 
  School, 
  AlertTriangle, 
  BookOpen, 
  Award,
  Share2,
  TrendingUp,
  MousePointer2,
  ArrowRight
} from 'lucide-react';
import { MEXICO_STATE_CENTERS } from '../../constants/mexicoStateCenters';

// --- TYPES ---
interface MapHeatmapPoint {
  entidad: string;
  matricula_total: number;
  instituciones: number;
}

interface MapGenderPoint {
  municipio: string;
  entidad: string;
  mujeres: number;
  hombres: number;
  total: number;
  lat: number;
  lng: number;
  ratio: number;
}

interface MapInstitutionPoint {
  id_escuela: number;
  nombre: string;
  lat: number;
  lng: number;
  institucion: string;
  sostenimiento: string;
  matricula: number;
}

interface MapAccessPoint {
  entidad: string;
  solicitudes: number;
  nuevo_ingreso: number;
  ratio: number;
}

interface MapInclusionPoint {
  entidad: string;
  indigenas: number;
  discapacidad: number;
  total: number;
  pct_indigena: number;
  pct_discapacidad: number;
}

interface MapEfficiencyPoint {
  entidad: string;
  admision: number;
  titulados: number;
  ratio: number;
}

interface MapData {
  map_heatmap: MapHeatmapPoint[];
  map_gender: MapGenderPoint[];
  map_institutions: MapInstitutionPoint[];
  map_access: MapAccessPoint[];
  map_inclusion: MapInclusionPoint[];
  map_efficiency: MapEfficiencyPoint[];
}

type MapType = 'enrollment' | 'gender_gap' | 'institutions' | 'access' | 'inclusion' | 'efficiency';

interface MapModuleProps {
  data: MapData;
}

// --- UTILS ---
const COLORS = {
  purple: ['#EEEDFE', '#C3B6F9', '#967EF4', '#6B46EF', '#26215C'],
  gender: { female: '#db2777', male: '#0891b2', parity: '#94a3b8' },
  access: ['#3b82f6', '#facc15', '#ef4444'], // Blue to Red
  inclusion: '#10b981',
  efficiency: ['#f59e0b', '#10b981'], // Orange to Green
};

// --- LEAFLET HEATMAP WRAPPER ---
const HeatmapLayer = ({ points }: { points: [number, number, number][] }) => {
  const map = useMap();

  useEffect(() => {
    if (!map || !points.length) return;
    const heat = (L as any).heatLayer(points, {
      radius: 25,
      blur: 15,
      maxZoom: 10,
      gradient: { 0.2: '#EEEDFE', 0.4: '#C3B6F9', 0.6: '#967EF4', 0.8: '#6B46EF', 1.0: '#26215C' }
    }).addTo(map);

    return () => {
      map.removeLayer(heat);
    };
  }, [map, points]);

  return null;
};

// --- LEGEND COMPONENT ---
const MapLegend = ({ type }: { type: MapType }) => {
  const configs: Record<MapType, { title: string; items: { color: string; label: string }[] }> = {
    enrollment: {
      title: 'Densidad de Matrícula',
      items: [
        { color: '#EEEDFE', label: 'Baja' },
        { color: '#967EF4', label: 'Media' },
        { color: '#26215C', label: 'Alta Concentración' },
      ]
    },
    gender_gap: {
      title: 'Brecha de Género (M/H)',
      items: [
        { color: COLORS.gender.female, label: 'Más Mujeres (>1.1)' },
        { color: COLORS.gender.parity, label: 'Paridad (0.9 - 1.1)' },
        { color: COLORS.gender.male, label: 'Más Hombres (<0.9)' },
      ]
    },
    institutions: {
      title: 'Tipo de Sostenimiento',
      items: [
        { color: '#4f46e5', label: 'Público' },
        { color: '#10b981', label: 'Particular' },
      ]
    },
    access: {
      title: 'Índice de Selectividad (Demanda)',
      items: [
        { color: '#3b82f6', label: 'Baja (<5)' },
        { color: '#facc15', label: 'Media (5-10)' },
        { color: '#ef4444', label: 'Saturación (>10)' },
      ]
    },
    inclusion: {
      title: 'Inclusión Social',
      items: [
        { color: '#10b981', label: '% Población Vulnerable' },
      ]
    },
    efficiency: {
      title: 'Eficiencia Terminal',
      items: [
        { color: '#f59e0b', label: 'Baja (<60%)' },
        { color: '#10b981', label: 'Alta (>60%)' },
      ]
    }
  };

  const config = configs[type];

  return (
    <div className="absolute bottom-24 left-8 z-[1000] p-6 bg-white/95 backdrop-blur-xl rounded-[32px] shadow-2xl border border-white/50 w-64">
      <div className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-4 flex items-center gap-2">
        <Info size={12} className="text-violet-500" /> Referencia Visual
      </div>
      <div className="text-xs font-bold text-gray-900 mb-4 tracking-tight">{config.title}</div>
      <div className="space-y-3">
        {config.items.map((item, i) => (
          <div key={i} className="flex items-center gap-3">
            <div className="w-3 h-3 rounded-full shadow-sm" style={{ backgroundColor: item.color }} />
            <div className="text-[11px] font-medium text-gray-600">{item.label}</div>
          </div>
        ))}
      </div>
    </div>
  );
};

const MapModule: React.FC<MapModuleProps> = ({ data }) => {
  const [activeMap, setActiveMap] = useState<MapType>('enrollment');
  const [selectedEntity, setSelectedEntity] = useState<any | null>(null);

  const mapOptions = [
    { id: 'enrollment', label: 'Matrícula', icon: Users, color: '#7c3aed', desc: 'Concentración de alumnos por municipio' },
    { id: 'gender_gap', label: 'Género', icon: Gender, color: '#db2777', desc: 'Ratio mujeres vs hombres por región' },
    { id: 'institutions', label: 'Densidad', icon: School, color: '#0891b2', desc: 'Ubicación y tamaño de campus' },
    { id: 'access', label: 'Acceso', icon: AlertTriangle, color: '#ef4444', desc: 'Dificultad de ingreso por estado' },
    { id: 'inclusion', label: 'Inclusión', icon: BookOpen, color: '#10b981', desc: 'Matrícula indígena y discapacidad' },
    { id: 'efficiency', label: 'Eficiencia', icon: Award, color: '#f59e0b', desc: 'Tasa de titulación vs ingreso' },
  ];

  // Map 1 points (Municipal density)
  const enrollmentHeatPoints = useMemo<[number, number, number][]>(() => {
    return data.map_gender.map(m => [m.lat, m.lng, Math.sqrt(m.total) / 100] as [number, number, number]);
  }, [data.map_gender]);

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
  };

  return (
    <div className="relative w-full h-[850px] bg-gray-50 rounded-[64px] overflow-hidden border border-gray-100 shadow-[0_32px_128px_-32px_rgba(0,0,0,0.1)]">
      
      {/* Top Toolbar */}
      <div className="absolute top-8 left-8 right-8 z-[1000] flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="flex p-2 bg-white/90 backdrop-blur-2xl rounded-[32px] shadow-2xl border border-white/50 overflow-x-auto max-w-full no-scrollbar">
          {mapOptions.map(opt => (
            <button
              key={opt.id}
              onClick={() => {
                  setActiveMap(opt.id as MapType);
                  setSelectedEntity(null);
              }}
              className={`flex items-center gap-3 px-6 py-4 rounded-[24px] text-[11px] font-black tracking-widest transition-all whitespace-nowrap ${
                activeMap === opt.id 
                ? 'bg-gray-900 text-white shadow-[0_10px_30px_rgba(0,0,0,0.2)]' 
                : 'text-gray-500 hover:bg-gray-100 hover:text-gray-900'
              }`}
            >
              <opt.icon size={16} style={{ color: activeMap === opt.id ? '#fff' : opt.color }} />
              {opt.label.toUpperCase()}
            </button>
          ))}
        </div>

        <div className="flex gap-4">
            <button 
              onClick={handleShare}
              className="p-5 bg-white/90 backdrop-blur-2xl rounded-3xl shadow-2xl border border-white/50 text-gray-600 hover:scale-105 transition-all active:scale-95 group"
            >
              <Share2 size={20} className="group-hover:rotate-12 transition-transform" />
            </button>
        </div>
      </div>

      {/* Layer Description Overlay */}
      <div className="absolute top-36 left-8 z-[1000] max-w-xs">
          <motion.div 
            key={activeMap}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="p-6 bg-white/80 backdrop-blur-xl rounded-[32px] border border-white/50 shadow-xl"
          >
              <div className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Capa Activa</div>
              <div className="text-lg font-black text-gray-900 leading-tight">
                  {mapOptions.find(o => o.id === activeMap)?.label}
              </div>
              <p className="text-[11px] text-gray-500 mt-2 font-medium leading-relaxed">
                  {mapOptions.find(o => o.id === activeMap)?.desc}
              </p>
          </motion.div>
      </div>

      <MapLegend type={activeMap} />

      <MapContainer 
        center={[23.6345, -102.5528]} 
        zoom={5} 
        style={{ height: '100%', width: '100%', background: '#f8fafc' }}
        zoomControl={false}
        attributionControl={false}
      >
        <TileLayer url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png" />

        <AnimatePresence mode="wait">
            {activeMap === 'enrollment' && <HeatmapLayer points={enrollmentHeatPoints} />}

            {activeMap === 'gender_gap' && (
                data.map_gender.map((m, i) => {
                    const ratio = Number(m.ratio);
                    const color = ratio > 1.1 ? COLORS.gender.female : (ratio < 0.9 ? COLORS.gender.male : COLORS.gender.parity);
                    return (
                        <CircleMarker
                            key={i}
                            center={[m.lat, m.lng]}
                            radius={4 + Math.sqrt(m.total) / 40}
                            pathOptions={{ fillColor: color, color: '#fff', weight: 1.5, fillOpacity: 0.8 }}
                            eventHandlers={{ click: () => setSelectedEntity({ ...m, type: 'municipio' }) }}
                        >
                            <LTooltip direction="top" offset={[0, -10]} opacity={1}>
                                <div className="p-3 bg-white rounded-2xl border border-gray-100 shadow-xl min-w-[120px]">
                                    <div className="text-[9px] font-black text-violet-500 uppercase mb-1">{m.entidad}</div>
                                    <div className="text-sm font-black text-gray-900 leading-tight">{m.municipio}</div>
                                    <div className="mt-2 text-[10px] font-bold py-1 px-2 rounded-lg inline-block" style={{ backgroundColor: color + '15', color }}>
                                        Ratio M/H: {ratio.toFixed(2)}
                                    </div>
                                </div>
                            </LTooltip>
                        </CircleMarker>
                    );
                })
            )}

            {activeMap === 'institutions' && (
                <MarkerClusterGroup 
                    chunkedLoading 
                    maxClusterRadius={50}
                    iconCreateFunction={(cluster: any) => {
                        return L.divIcon({
                            html: `<div class="bg-violet-600 text-white rounded-full w-10 h-10 flex items-center justify-center font-black text-xs border-4 border-white shadow-xl">${cluster.getChildCount()}</div>`,
                            className: 'custom-cluster-icon',
                            iconSize: L.point(40, 40)
                        });
                    }}
                >
                   {data.map_institutions.map((inst, i) => (
                       <CircleMarker
                            key={i}
                            center={[inst.lat, inst.lng]}
                            radius={6 + Math.log10(inst.matricula) * 2.5}
                            pathOptions={{ 
                                fillColor: inst.sostenimiento === 'PÚBLICO' ? '#4f46e5' : '#10b981', 
                                color: '#fff', 
                                weight: 2, 
                                fillOpacity: 0.9 
                            }}
                            eventHandlers={{ click: () => setSelectedEntity({ ...inst, type: 'institucion' }) }}
                       >
                           <LTooltip direction="top">
                               <div className="p-2">
                                   <div className="text-[10px] font-black text-gray-400">{inst.sostenimiento}</div>
                                   <div className="text-xs font-bold leading-tight">{inst.nombre}</div>
                                   <div className="text-[10px] text-gray-400 mt-1">{inst.institucion}</div>
                               </div>
                           </LTooltip>
                       </CircleMarker>
                   ))}
                </MarkerClusterGroup>
            )}

            {activeMap === 'access' && (
                data.map_access.map((a, i) => {
                    const coords = MEXICO_STATE_CENTERS[a.entidad] || [23, -102];
                    const ratio = Number(a.ratio);
                    const color = ratio > 10 ? '#ef4444' : (ratio > 5 ? '#facc15' : '#3b82f6');
                    return (
                        <CircleMarker
                            key={i}
                            center={coords}
                            radius={20 + ratio * 3}
                            pathOptions={{ 
                                fillColor: color, 
                                color: '#fff', 
                                weight: 3, 
                                fillOpacity: 0.85 
                            }}
                            eventHandlers={{ click: () => setSelectedEntity({ ...a, type: 'entidad' }) }}
                        >
                           <LTooltip direction="top" permanent opacity={1}>
                               <div className="flex flex-col items-center">
                                   <div className="text-[10px] font-black uppercase text-gray-900 drop-shadow-sm">{a.entidad}</div>
                                   <div className="text-[12px] font-black" style={{ color }}>{ratio.toFixed(1)}x</div>
                               </div>
                           </LTooltip>
                        </CircleMarker>
                    );
                })
            )}

            {activeMap === 'inclusion' && (
                data.map_inclusion.map((inc, i) => {
                    const coords = MEXICO_STATE_CENTERS[inc.entidad] || [23, -102];
                    const val = Number(inc.pct_indigena) + Number(inc.pct_discapacidad);
                    return (
                        <CircleMarker
                            key={i}
                            center={coords}
                            radius={15 + val * 4}
                            pathOptions={{ fillColor: COLORS.inclusion, color: '#fff', weight: 2, fillOpacity: 0.8 }}
                            eventHandlers={{ click: () => setSelectedEntity({ ...inc, type: 'inclusion' }) }}
                        >
                             <LTooltip direction="top">
                               <div className="font-bold text-xs">{inc.entidad}</div>
                               <div className="text-[10px] text-emerald-600 font-bold">Inclusión: {val.toFixed(2)}%</div>
                           </LTooltip>
                        </CircleMarker>
                    );
                })
            )}

            {activeMap === 'efficiency' && (
                data.map_efficiency.map((ef, i) => {
                    const coords = MEXICO_STATE_CENTERS[ef.entidad] || [23, -102];
                    const ratio = Number(ef.ratio);
                    const color = ratio > 60 ? COLORS.efficiency[1] : COLORS.efficiency[0];
                    return (
                        <CircleMarker
                            key={i}
                            center={coords}
                            radius={15 + (ratio - 40) / 2}
                            pathOptions={{ fillColor: color, color: '#fff', weight: 2, fillOpacity: 0.8 }}
                            eventHandlers={{ click: () => setSelectedEntity({ ...ef, type: 'eficiencia' }) }}
                        >
                             <LTooltip direction="top">
                               <div className="font-bold text-xs">{ef.entidad}</div>
                               <div className="text-[10px] font-bold" style={{ color }}>Eficiencia: {ratio.toFixed(1)}%</div>
                           </LTooltip>
                        </CircleMarker>
                    );
                })
            )}
        </AnimatePresence>
      </MapContainer>

      {/* Side Panel */}
      <AnimatePresence>
        {selectedEntity && (
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              className="absolute top-0 right-0 h-full w-[450px] bg-white/95 backdrop-blur-3xl z-[1500] shadow-[-40px_0_80px_-20px_rgba(0,0,0,0.1)] p-12 flex flex-col border-l border-white/50"
            >
                <div className="flex justify-between items-center mb-12">
                    <div className="p-4 bg-gray-900 text-white rounded-[24px] shadow-lg"><Maximize2 size={24} /></div>
                    <button 
                        onClick={() => setSelectedEntity(null)} 
                        className="p-4 bg-gray-50 hover:bg-gray-100 rounded-[24px] transition-colors"
                    >
                        <X size={24} className="text-gray-400" />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto no-scrollbar">
                    <div className="flex items-center gap-3 text-[11px] font-black text-violet-600 uppercase tracking-widest mb-4">
                        <TrendingUp size={14} /> Análisis de Territorio
                    </div>
                    <h2 className="text-4xl font-black tracking-tighter text-gray-900 leading-[0.9] mb-8">
                        {selectedEntity.municipio || selectedEntity.nombre || selectedEntity.entidad}
                    </h2>
                    
                    <div className="space-y-6">
                        {/* Core Metric */}
                        <div className="bg-gray-950 p-8 rounded-[40px] text-white overflow-hidden relative group">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-violet-600/20 blur-[60px] group-hover:bg-violet-600/30 transition-colors" />
                            <div className="text-[10px] font-black text-gray-400 uppercase tracking-tighter mb-2">Matrícula Estimada</div>
                            <div className="text-4xl font-black tracking-tighter">{(selectedEntity.total || selectedEntity.matricula || 0).toLocaleString()}</div>
                            <div className="text-[10px] text-violet-400 font-bold mt-2 flex items-center gap-1">
                                <Users size={12} /> Alumnos Activos 100%
                            </div>
                        </div>

                        {/* Comparative Stats */}
                        <div className="grid grid-cols-2 gap-4">
                            <div className="bg-gray-50 p-6 rounded-[32px] border border-gray-100">
                                <div className="text-[10px] font-black text-gray-400 uppercase mb-2">Estado</div>
                                <div className="text-lg font-black text-gray-900 truncate">{(selectedEntity.entidad || 'Nacional').toUpperCase()}</div>
                            </div>
                            <div className="bg-gray-50 p-6 rounded-[32px] border border-gray-100">
                                <div className="text-[10px] font-black text-gray-400 uppercase mb-2">Indicador</div>
                                <div className="text-lg font-black text-violet-600">
                                    {selectedEntity.ratio ? Number(selectedEntity.ratio).toFixed(1) : (selectedEntity.pct_inclusion ? selectedEntity.pct_inclusion.toFixed(1) : 'S/D')}
                                    <span className="text-[10px] opacity-70 ml-1">pts</span>
                                </div>
                            </div>
                        </div>

                        {/* Extra info based on activeMap */}
                        {activeMap === 'gender_gap' && (
                            <div className="bg-pink-50/50 p-8 rounded-[40px] border border-pink-100/50">
                                <div className="flex justify-between items-end mb-6">
                                    <div>
                                        <div className="text-[10px] font-black text-pink-400 uppercase mb-1">Distribución</div>
                                        <div className="text-2xl font-black text-pink-600">Composición H/M</div>
                                    </div>
                                    <Gender className="text-pink-300" size={40} />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <div className="text-2xl font-black text-gray-900">{selectedEntity.mujeres?.toLocaleString()}</div>
                                        <div className="text-[10px] font-black text-gray-400 uppercase">Mujeres</div>
                                    </div>
                                    <div>
                                        <div className="text-2xl font-black text-gray-900">{selectedEntity.hombres?.toLocaleString()}</div>
                                        <div className="text-[10px] font-black text-gray-400 uppercase">Hombres</div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {activeMap === 'institutions' && (
                            <div className="bg-blue-50/50 p-8 rounded-[40px] border border-blue-100/50">
                                <div className="text-[10px] font-black text-blue-400 uppercase mb-4">Institución Sede</div>
                                <div className="text-xl font-black text-blue-900 leading-tight mb-2">{selectedEntity.institucion}</div>
                                <div className="text-sm font-bold text-blue-700/70">{selectedEntity.sostenimiento}</div>
                            </div>
                        )}

                        <div className="p-8 bg-violet-600 rounded-[40px] text-white">
                            <div className="text-[11px] font-black uppercase mb-4 opacity-70">Impacto Regional</div>
                            <p className="text-sm font-bold leading-snug">
                                Esta zona concentra el {((selectedEntity.total || selectedEntity.matricula || 0) / 50000).toFixed(1)}% de la matrícula estatal,
                                destacando por su nivel de {activeMap === 'efficiency' ? 'titulación' : 'cobertura'}.
                            </p>
                            <button className="mt-8 w-full py-4 bg-white text-violet-600 rounded-2xl font-black text-[11px] uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-gray-900 hover:text-white transition-all">
                                Ver Reporte Completo <ArrowRight size={14} />
                            </button>
                        </div>
                    </div>
                </div>
            </motion.div>
        )}
      </AnimatePresence>

      {/* Interaction Help */}
      <div className="absolute bottom-8 right-8 z-[1000] flex gap-4">
          <div className="p-4 bg-white/90 backdrop-blur-xl rounded-2xl shadow-xl border border-white/50 flex items-center gap-3">
              <MousePointer2 size={16} className="text-violet-500 animate-pulse" />
              <div className="text-[10px] font-black text-gray-900 tracking-widest uppercase">Interactúa con los puntos</div>
          </div>
      </div>
    </div>
  );
};

export default MapModule;
