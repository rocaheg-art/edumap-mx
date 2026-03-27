import React, { useEffect, useState, useMemo } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap, ZoomControl, GeoJSON as LeafletGeoJSON } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet.markercluster/dist/MarkerCluster.css';
import 'leaflet.markercluster/dist/MarkerCluster.Default.css';
import MarkerClusterGroup from 'react-leaflet-cluster';
import { Escuela } from '../types';
import { 
  Star, 
  MapPin, 
  ChevronRight, 
  Info,
  Search,
  Compass,
  Locate
} from 'lucide-react';
import { Link } from 'react-router-dom';

// @ts-ignore
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
// @ts-ignore
import markerIcon from 'leaflet/dist/images/marker-icon.png';
// @ts-ignore
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
});

interface MapComponentProps {
  escuelas: Escuela[];
  center?: [number, number];
  zoom?: number;
  selectedId?: string;
  onEscuelaSelect?: (id: string | null) => void;
  simpleMode?: boolean;
  subsistemas?: string[];
  selectedSubsistema?: string;
  onSubsistemaChange?: (val: string) => void;
  selectedEstado?: string | number;
  selectedMunicipio?: string | number;
}

const MapComponent: React.FC<MapComponentProps> = ({ 
  escuelas, 
  center = [19.4326, -99.1332], 
  zoom = 6,
  selectedId,
  onEscuelaSelect,
  simpleMode = false,
  subsistemas = [],
  selectedSubsistema = 'Todos los Subsistemas',
  onSubsistemaChange,
  selectedEstado,
  selectedMunicipio
}) => {
  const [geoData, setGeoData] = useState<any>(null);
  const [loadingGeo, setLoadingGeo] = useState(false);

  const activeEscuela = useMemo(() => {
    if (selectedId) {
      return escuelas.find(e => String(e.id_escuela) === String(selectedId)) || null;
    }
    return null;
  }, [selectedId, escuelas]);

  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [currentZoom, setCurrentZoom] = useState(zoom);
  const [mapInstance, setMapInstance] = useState<L.Map | null>(null);

  // Load GeoJSON for the selected state
  useEffect(() => {
    const loadGeoJSON = async () => {
      if (!selectedEstado) {
        setGeoData(null);
        return;
      }

      setLoadingGeo(true);
      try {
        const response = await fetch('https://raw.githubusercontent.com/angelnmara/geojson-mexico/master/mexico.json');
        const data = await response.json();
        
        // Find state name from ID if possible, or use ID directly
        // The angelnmara GeoJSON has state names in 'name'
        const filteredFeatures = {
          ...data,
          features: data.features.filter((f: any) => {
             const stateId = String(selectedEstado).padStart(2, '0');
             // Map some common IDs or names if needed
             return f.properties.id === stateId || f.id === stateId;
          })
        };

        if (filteredFeatures.features.length > 0) {
          setGeoData(filteredFeatures);
          if (mapInstance) {
            const geoJsonLayer = L.geoJSON(filteredFeatures);
            mapInstance.fitBounds(geoJsonLayer.getBounds(), { padding: [50, 50], maxZoom: 12 });
          }
        } else {
            // If no match found by ID, we could try name, but we need the catalog
            setGeoData(null);
        }
      } catch (e) {
        console.error('Error loading GeoJSON:', e);
      } finally {
        setLoadingGeo(false);
      }
    };
    loadGeoJSON();
  }, [selectedEstado, mapInstance]);

  const geojsonStyle = {
    fillColor: "#6366f1",
    weight: 2,
    opacity: 1,
    color: 'white',
    dashArray: '3',
    fillOpacity: 0.1
  };

  const highlightStyle = {
    fillColor: "#6366f1",
    weight: 3,
    opacity: 1,
    color: '#6366f1',
    dashArray: '',
    fillOpacity: 0.3
  };

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Handle programmatic view changes (e.g. when selectedId changes)
  useEffect(() => {
    if (activeEscuela && mapInstance) {
      mapInstance.flyTo([activeEscuela.latitud, activeEscuela.longitud], 15);
    }
  }, [activeEscuela, mapInstance]);

  // Handle initial center/zoom or fitBounds for multiple schools
  useEffect(() => {
    if (mapInstance && escuelas.length > 0) {
      if (escuelas.length === 1) {
        // Single campus: center on it
        mapInstance.setView([escuelas[0].latitud, escuelas[0].longitud], 13);
      } else if (!selectedId && !selectedEstado) {
        // Multiple campuses and no specific selection/filter: fit all
        // Filter out erratic coordinates (e.g., 0,0) by checking if they are roughly within Mexico
        const validEscuelas = escuelas.filter(e => 
          e.latitud >= 14 && e.latitud <= 33 && 
          e.longitud >= -119 && e.longitud <= -86
        );
        
        if (validEscuelas.length > 0) {
          const bounds = L.latLngBounds(validEscuelas.map(e => [e.latitud, e.longitud]));
          mapInstance.fitBounds(bounds, { padding: [50, 50], maxZoom: 12 });
        }
      }
    }
  }, [mapInstance, escuelas, selectedId, selectedEstado]);

  const visibleEscuelas = useMemo(() => {
    if (simpleMode) return escuelas;
    if (currentZoom < 7) return escuelas.slice(0, 200);
    if (currentZoom < 9) return escuelas.slice(0, 1000);
    return escuelas;
  }, [escuelas, currentZoom, simpleMode]);

  const customIcon = (sostenimiento: string, isHighlighted: boolean) => new L.DivIcon({
    className: 'custom-div-icon',
    html: `
      <div class="flex items-center justify-center w-8 h-8 rounded-full shadow-md border-2 border-white transition-all duration-300 ${
        isHighlighted ? 'scale-125 ring-4 ring-indigo-400 z-[1000]' : 'hover:scale-110'
      } ${
        sostenimiento?.toUpperCase() === 'PÚBLICO' ? 'bg-indigo-600' : 'bg-emerald-600'
      }">
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M22 10v6M2 10l10-5 10 5-10 5z"/><path d="M6 12v5c3 3 9 3 12 0v-5"/>
        </svg>
      </div>
    `,
    iconSize: [32, 32],
    iconAnchor: [16, 32],
    popupAnchor: [0, -32]
  });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const createClusterCustomIcon = (cluster: any) => {
    return new L.DivIcon({
      html: `<div class="flex items-center justify-center w-10 h-10 rounded-full bg-indigo-600 text-white border-2 border-white shadow-lg font-bold text-xs">
        ${cluster.getChildCount()}
      </div>`,
      className: 'custom-marker-cluster',
      iconSize: L.point(40, 40, true),
    });
  };

  const handleResetView = () => {
    if (mapInstance) {
      mapInstance.flyTo(center, zoom);
    }
  };

  const handleGeolocation = () => {
    if (!navigator.geolocation) {
      alert('La geolocalización no está soportada por tu navegador');
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        if (mapInstance) {
          mapInstance.flyTo([position.coords.latitude, position.coords.longitude], 14);
        }
      },
      (error) => {
        console.error('Error getting location:', error);
        alert('No pudimos obtener tu ubicación');
      }
    );
  };

  return (
    <div className={`relative w-full h-full rounded-[32px] overflow-hidden shadow-sm border border-slate-100 ${simpleMode ? 'h-[400px]' : 'h-full'}`}>
      <MapContainer 
        center={center} 
        zoom={zoom} 
        scrollWheelZoom={true}
        doubleClickZoom={true}
        zoomControl={false}
        className="w-full h-full"
        ref={setMapInstance}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
          url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
        />
        <ZoomControl position="bottomleft" />
        
        <MapEvents onZoom={(z) => setCurrentZoom(z)} />

        {geoData && (
          <LeafletGeoJSON 
            key={JSON.stringify(selectedEstado)}
            data={geoData} 
            style={() => highlightStyle}
          />
        )}

        <MarkerClusterGroup
          chunkedLoading
          iconCreateFunction={createClusterCustomIcon}
          maxClusterRadius={50}
          spiderfyOnMaxZoom={true}
          showCoverageOnHover={false}
        >
          {visibleEscuelas.map((escuela) => (
            <Marker 
              key={escuela.id_escuela} 
              position={[escuela.latitud, escuela.longitud]}
              icon={customIcon(escuela.sostenimiento_nombre || 'PÚBLICO', !!selectedId && String(escuela.id_escuela) === String(selectedId))}
              eventHandlers={{
                click: () => onEscuelaSelect?.(String(escuela.id_escuela)),
              }}
            />
          ))}
        </MarkerClusterGroup>
      </MapContainer>

      {/* Map Controls/Overlay */}
      {!simpleMode && (
        <>
          <div className="absolute top-4 left-4 md:top-6 md:left-6 z-[1000] flex flex-col gap-2 md:gap-3">
            <div className="bg-white/90 backdrop-blur-md p-1.5 md:p-2 rounded-xl md:rounded-2xl shadow-xl border border-white/50 flex items-center gap-2">
              <div className="p-1.5 md:p-2 bg-indigo-600 text-white rounded-lg">
                <Search size={isMobile ? 14 : 18} />
              </div>
              <div className="pr-2 md:pr-4">
                <div className="text-[8px] md:text-[10px] font-bold text-slate-400 uppercase tracking-wider">Mostrando</div>
                <div className="text-xs md:text-sm font-bold text-slate-900">{visibleEscuelas.length} inst.</div>
              </div>
              {loadingGeo && (
                <div className="pr-2 md:pr-4 border-l border-slate-100 pl-2 md:pl-4">
                  <Compass className="w-4 h-4 md:w-5 md:h-5 text-indigo-600 animate-spin" />
                </div>
              )}
            </div>

            <button 
              onClick={handleResetView}
              className="bg-white/90 backdrop-blur-md p-2.5 md:p-3 rounded-xl md:rounded-2xl shadow-xl border border-white/50 text-indigo-600 hover:bg-white transition-all flex items-center gap-2 text-[10px] md:text-xs font-bold"
            >
              <Compass size={isMobile ? 14 : 16} />
              Reiniciar
            </button>

            <button 
              onClick={handleGeolocation}
              className="bg-white/90 backdrop-blur-md p-2.5 md:p-3 rounded-xl md:rounded-2xl shadow-xl border border-white/50 text-emerald-600 hover:bg-white transition-all flex items-center gap-2 text-[10px] md:text-xs font-bold"
            >
              <Locate size={isMobile ? 14 : 16} />
              Ubicación
            </button>
          </div>


          {/* Legend */}
          <div className="absolute bottom-4 left-4 md:bottom-6 md:left-6 z-[1000] bg-white/90 backdrop-blur-md px-3 py-2 md:px-4 md:py-3 rounded-xl md:rounded-2xl shadow-xl border border-white/50 space-y-1.5 md:space-y-2">
            <div className="flex items-center gap-2 md:gap-3">
              <div className="w-2 h-2 md:w-3 md:h-3 rounded-full bg-indigo-600 border border-white shadow-sm" />
              <span className="text-[8px] md:text-[10px] font-bold text-slate-600 uppercase tracking-wider">PUBS</span>
            </div>
            <div className="flex items-center gap-2 md:gap-3">
              <div className="w-2 h-2 md:w-3 md:h-3 rounded-full bg-emerald-600 border border-white shadow-sm" />
              <span className="text-[8px] md:text-[10px] font-bold text-slate-600 uppercase tracking-wider">PRIS</span>
            </div>
          </div>
        </>
      )}

      {/* Mobile Info Overlay */}
      {isMobile && activeEscuela && (
        <div className="absolute bottom-6 left-6 right-6 z-[1000] animate-slide-up">
          <div className="bg-white rounded-3xl shadow-2xl overflow-hidden border border-slate-100 p-4">
            <div className="flex gap-4">
              <img 
                src={activeEscuela.logo_url || `https://picsum.photos/seed/${activeEscuela.id_escuela}/800/600`} 
                alt={activeEscuela.nombre}
                className="w-20 h-20 object-cover rounded-2xl shadow-sm"
                referrerPolicy="no-referrer"
              />
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between mb-1">
                  <h3 className="font-bold text-slate-900 truncate pr-2 text-sm">{activeEscuela.nombre}</h3>
                  <button 
                    onClick={() => onEscuelaSelect?.(null)}
                    className="p-1 text-slate-400 hover:text-slate-600"
                  >
                    <Info size={18} />
                  </button>
                </div>
                <div className="flex items-center gap-3 mb-3">
                  <div className="flex items-center gap-1 text-amber-500">
                    <Star size={12} fill="currentColor" />
                    <span className="text-xs font-bold">{Number(activeEscuela.promedio_calificacion || 0).toFixed(1)}</span>
                  </div>
                  <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{activeEscuela.sostenimiento}</div>
                </div>
                <Link 
                  to={`/instituciones/${activeEscuela.id_institucion}`}
                  className="inline-flex items-center gap-2 text-indigo-600 text-xs font-bold hover:gap-3 transition-all"
                >
                  Ver Perfil Completo
                  <ChevronRight size={14} />
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const MapEvents = ({ onZoom }: { onZoom: (z: number) => void }) => {
  const map = useMap();
  useEffect(() => {
    const handleZoom = () => onZoom(map.getZoom());
    map.on('zoomend', handleZoom);
    return () => map.off('zoomend', handleZoom);
  }, [map, onZoom]);
  return null;
};

export default MapComponent;
