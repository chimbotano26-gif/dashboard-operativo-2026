import React, { useEffect, useRef, useState, useMemo } from 'react';
import { 
  loadGoogleMaps, 
  GOOGLE_MAPS_DARK_TACTICAL_STYLE, 
  THERMOGRAPHIC_GRADIENT, 
  GMP_SOLUTION_ID 
} from '../utils/googleMapsLoader';
import { IncidentRecord, PatrolUnit } from '../types';
import { SECTORES_OFICIALES } from '../data/sectorReferences';
import { 
  OPERATIVOS_SEMANALES_PROGRAMADOS, 
  OperativoProgramado,
} from '../data/operativosProgramados';
import { 
  FLOTA_CONSOLIDADA, 
  CAMIONETAS_FLOTA, 
  MOTOS_FLOTA, 
  FleetVehicle, 
  METRICAS_FLOTA 
} from '../data/fleetData';
import { 
  MapPin, 
  Layers, 
  Flame, 
  Radio, 
  Eye, 
  Shield, 
  Clock, 
  Car, 
  Maximize2, 
  Minimize2, 
  Search, 
  Filter, 
  AlertTriangle, 
  CheckCircle2, 
  Info, 
  Navigation, 
  Compass, 
  Activity, 
  Crosshair, 
  PhoneCall, 
  Users, 
  Calendar, 
  Map as MapIcon, 
  FileText, 
  RefreshCw 
} from 'lucide-react';

interface GoogleMapsTacticalViewProps {
  records: IncidentRecord[];
}

export const GoogleMapsTacticalView: React.FC<GoogleMapsTacticalViewProps> = ({ records }) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<google.maps.Map | null>(null);
  const markersRef = useRef<google.maps.marker.AdvancedMarkerElement[]>([]);
  
  const [mapType, setMapType] = useState<'ROADMAP' | 'DARK' | 'HYBRID'>('DARK');
  const [selectedSector, setSelectedSector] = useState<string>('TODOS');
  const [searchFilter, setSearchFilter] = useState<string>('');
  const [isMapExpanded, setIsMapExpanded] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<'INCIDENTES' | 'UNIDADES' | 'OPERATIVOS'>('INCIDENTES');
  const [fleetFilter, setFleetFilter] = useState<'TODAS' | 'CAMIONETAS' | 'MOTOS'>('TODAS');

  // 1. Filtrar registros de incidencias según término de búsqueda ampliado a 2000 pines
  const filteredRecords = useMemo(() => {
    if (!searchFilter.trim()) return records.slice(0, 2000);
    const q = searchFilter.toLowerCase();
    return records
      .filter((r) => {
        return (
          (r.lugar || '').toLowerCase().includes(q) ||
          (r.columna1 || '').toLowerCase().includes(q) ||
          (r.sector || '').toLowerCase().includes(q) ||
          (r.incidencia || '').toLowerCase().includes(q) ||
          (r.observacion || '').toLowerCase().includes(q)
        );
      })
      .slice(0, 2000);
  }, [records, searchFilter]);

  // 2. Filtrar unidades de la flota activa
  const activeFleet = useMemo(() => {
    if (fleetFilter === 'CAMIONETAS') return CAMIONETAS_FLOTA;
    if (fleetFilter === 'MOTOS') return MOTOS_FLOTA;
    return FLOTA_CONSOLIDADA;
  }, [fleetFilter]);

  // Inicializar mapa de Google Maps
  useEffect(() => {
    let isMounted = true;

    loadGoogleMaps()
      .then((google) => {
        if (!isMounted || !mapRef.current) return;

        if (!mapInstanceRef.current) {
          const nuevoMapa = new google.maps.Map(mapRef.current, {
            center: { lat: -9.0853, lng: -78.5783 }, // Nuevo Chimbote
            let: 14,
            zoom: 14,
            mapId: GMP_SOLUTION_ID || 'DEMO_MAP_ID',
            streetViewControl: false,
            mapTypeControl: false,
            fullscreenControl: false,
            styles: GOOGLE_MAPS_DARK_TACTICAL_STYLE,
          });
          mapInstanceRef.current = nuevoMapa;
        }
      })
      .catch((err) => {
        console.error('Error cargando Google Maps:', err);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <div className="p-4 sm:p-6 bg-slate-900 min-h-screen text-slate-100">
      <div className="max-w-[1600px] mx-auto space-y-4">
        
        {/* Cabecera del Módulo Táctico */}
        <div className="bg-slate-800 border border-slate-700 rounded-xl p-4 shadow-lg flex flex-col md:flex-row justify-between items-center gap-4">
          <div>
            <h1 className="text-lg sm:text-xl font-black text-cyan-400 uppercase tracking-wider flex items-center gap-2">
              <Compass className="w-6 h-6 text-cyan-400 animate-spin-slow" />
              Consola Táctica C2 - Sectorización y Patrullaje
            </h1>
            <p className="text-xs text-slate-400">
              Visualización en tiempo real de hasta 2,000 registros operativos en Nuevo Chimbote
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setActiveTab('INCIDENTES')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                activeTab === 'INCIDENTES' 
                  ? 'bg-cyan-600 text-white shadow-md' 
                  : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
              }`}
            >
              Incidencias ({filteredRecords.length})
            </button>
            <button
              onClick={() => setActiveTab('UNIDADES')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                activeTab === 'UNIDADES' 
                  ? 'bg-cyan-600 text-white shadow-md' 
                  : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
              }`}
            >
              Flota Activa ({activeFleet.length})
            </button>
          </div>
        </div>

        {/* Contenedor del Mapa y Panel Lateral */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
          
          {/* Panel Lateral de Control */}
          <div className="bg-slate-800 border border-slate-700 rounded-xl p-4 flex flex-col gap-4 lg:col-span-1 shadow-lg">
            <div className="relative">
              <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Buscar lugar, sector o tipo..."
                value={searchFilter}
                onChange={(e) => setSearchFilter(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg pl-9 pr-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
              />
            </div>

            <div className="bg-slate-900/60 border border-slate-700/60 rounded-lg p-3 space-y-2">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wide">Filtro de Mapa</span>
              <div className="flex gap-2">
                <button
                  onClick={() => setMapType('DARK')}
                  className={`flex-1 py-1 text-[10px] font-bold rounded ${mapType === 'DARK' ? 'bg-cyan-600 text-white' : 'bg-slate-800 text-slate-400'}`}
                >
                  Táctico Dark
                </button>
                <button
                  onClick={() => setMapType('ROADMAP')}
                  className={`flex-1 py-1 text-[10px] font-bold rounded ${mapType === 'ROADMAP' ? 'bg-cyan-600 text-white' : 'bg-slate-800 text-slate-400'}`}
                >
                  Estándar
                </button>
              </div>
            </div>

            <div className="flex-1 bg-slate-900/40 border border-slate-700/60 rounded-lg p-3 overflow-y-auto max-h-[450px]">
              <h3 className="text-xs font-bold text-cyan-400 mb-2 uppercase">Resumen de Registros Activos</h3>
              <p className="text-[11px] text-slate-300">
                Mostrando <strong className="text-white">{filteredRecords.length}</strong> puntos cargados correctamente en la cuadrícula táctica de Nuevo Chimbote.
              </p>
            </div>
          </div>

          {/* Lienzo del Mapa */}
          <div className="lg:col-span-3 bg-slate-800 border border-slate-700 rounded-xl overflow-hidden shadow-lg relative min-h-[550px]">
            <div ref={mapRef} className="absolute inset-0 w-full h-full" />
          </div>

        </div>
      </div>
    </div>
  );
};
