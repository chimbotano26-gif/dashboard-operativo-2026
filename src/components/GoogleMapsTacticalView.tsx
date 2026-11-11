import React, { useEffect, useRef, useState, useMemo } from 'react';
import {
  loadGoogleMaps,
  GOOGLE_MAPS_DARK_TACTICAL_STYLE,
  THERMOGRAPHIC_GRADIENT,
  GMP_SOLUTION_ID,
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
  METRICAS_FLOTA,
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
  Search,
  Maximize2,
  Minimize2,
  Crosshair,
  Filter,
  CheckCircle2,
  AlertTriangle,
  RotateCw,
  Activity,
  Zap,
  Compass,
} from 'lucide-react';
import { getIncidentCategoryMeta } from './TacticalMapView';

interface GoogleHeatmapLayer {
  setMap(map: google.maps.Map | null): void;
  setData(data: unknown): void;
  set(key: string, value: unknown): void;
}

interface GoogleMapsTacticalViewProps {
  records: IncidentRecord[];
  patrolUnits?: PatrolUnit[];
  onSelectIncident?: (incident: IncidentRecord) => void;
  onDispatchUnit?: (unitId: string, location: string) => void;
  onSwitchToLeaflet?: () => void;
}

export const GoogleMapsTacticalView: React.FC<GoogleMapsTacticalViewProps> = ({
  records,
  onSelectIncident,
  onDispatchUnit,
  onSwitchToLeaflet,
}) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<google.maps.Map | null>(null);
  const heatmapRef = useRef<GoogleHeatmapLayer | null>(null);
  const markersRef = useRef<google.maps.Marker[]>([]);
  const circlesRef = useRef<google.maps.Circle[]>([]);
  const fleetMarkersRef = useRef<google.maps.Marker[]>([]);
  const infoWindowRef = useRef<google.maps.InfoWindow | null>(null);

  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [retryCounter, setRetryCounter] = useState(0);

  // Map Controls
  const [mapType, setMapType] = useState<'DARK' | 'HYBRID' | 'ROADMAP'>('DARK');
  const [displayMode, setDisplayMode] = useState<'HEATMAP' | 'POINTS' | 'COMBINED'>('HEATMAP');
  const [isThermalAnimated, setIsThermalAnimated] = useState(true);
  const [thermalRadius, setThermalRadius] = useState<number>(28);
  const [showOperativos, setShowOperativos] = useState(true);
  const [showFleet, setShowFleet] = useState(true);
  const [fleetFilter, setFleetFilter] = useState<'ALL' | 'CAMIONETAS' | 'MOTOS'>('ALL');
  const [precisionMode, setPrecisionMode] = useState<'PINPOINT' | 'FOCUS_45M'>('FOCUS_45M');
  const [selectedOperativo, setSelectedOperativo] = useState<OperativoProgramado | null>(null);
  const [selectedVehicle, setSelectedVehicle] = useState<FleetVehicle | null>(null);
  const [selectedIncident, setSelectedIncident] = useState<IncidentRecord | null>(null);
  const [searchFilter, setSearchFilter] = useState('');
  const [isFullScreen, setIsFullScreen] = useState(false);

  // 1. Inicializar Google Maps con atribución oficial obligatoria
  useEffect(() => {
    let isMounted = true;
    setIsLoading(true);
    setLoadError(null);

    loadGoogleMaps()
      .then(async (googleInstance) => {
        if (!isMounted || !containerRef.current) return;

        // Asegurar que el constructor Map está listo
        let MapCtor = googleInstance.maps?.Map;
        if (typeof MapCtor !== 'function' && typeof googleInstance.maps?.importLibrary === 'function') {
          const mapsLib = (await googleInstance.maps.importLibrary('maps')) as { Map: typeof google.maps.Map };
          MapCtor = mapsLib?.Map;
        }

        if (typeof MapCtor !== 'function') {
          throw new Error('El constructor google.maps.Map no se encuentra disponible.');
        }

        // Coordenadas céntricas de Nuevo Chimbote (Plaza Mayor / Av. Pacífico)
        const centerNuevoChimbote = { lat: -9.1258, lng: -78.5242 };

        const mapOptions = {
          center: centerNuevoChimbote,
          zoom: 14,
          minZoom: 12,
          maxZoom: 19,
          mapTypeId: mapType === 'HYBRID' ? 'hybrid' : 'roadmap',
          styles: mapType === 'DARK' ? GOOGLE_MAPS_DARK_TACTICAL_STYLE : undefined,
          disableDefaultUI: false,
          zoomControl: true,
          streetViewControl: true,
          mapTypeControl: false,
          fullscreenControl: false,
          // Mandatory tracking attribution setting for Google Maps Skills
          internalUsageAttributionIds: [GMP_SOLUTION_ID],
        } as unknown as google.maps.MapOptions;

        const map = new MapCtor(containerRef.current, mapOptions);

        if (googleInstance.maps.InfoWindow) {
          infoWindowRef.current = new googleInstance.maps.InfoWindow();
        }
        mapRef.current = map;
        setIsLoading(false);
      })
      .catch((err) => {
        if (!isMounted) return;
        console.warn('Aviso al conectar con Google Maps Platform:', err);
        setLoadError(
          err?.message || 'No se pudo conectar directamente con la API de Google Maps. Presione reintentar o use el Radar GIS Leaflet.'
        );
        setIsLoading(false);
      });

    return () => {
      isMounted = false;
      if (heatmapRef.current) {
        heatmapRef.current.setMap(null);
      }
    };
  }, [retryCounter]);

  // 2. Actualizar tema oscuro / satélite en caliente
  useEffect(() => {
    if (!mapRef.current) return;
    if (mapType === 'DARK') {
      mapRef.current.setMapTypeId('roadmap');
      mapRef.current.setOptions({ styles: GOOGLE_MAPS_DARK_TACTICAL_STYLE });
    } else if (mapType === 'HYBRID') {
      mapRef.current.setMapTypeId('hybrid');
      mapRef.current.setOptions({ styles: [] });
    } else {
      mapRef.current.setMapTypeId('roadmap');
      mapRef.current.setOptions({ styles: [] });
    }
  }, [mapType]);

  // 3. Filtrar registros de incidencias según término de búsqueda
  const filteredRecords = useMemo(() => {
    if (!searchFilter.trim()) return records.slice(0, 400);
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
      .slice(0, 400);
  }, [records, searchFilter]);

  // 4. Filtrar unidades de la flota activa (24 Camionetas y 12 Motos)
  const activeFleet = useMemo(() => {
    if (fleetFilter === 'CAMIONETAS') return CAMIONETAS_FLOTA;
    if (fleetFilter === 'MOTOS') return MOTOS_FLOTA;
    return FLOTA_CONSOLIDADA;
  }, [fleetFilter]);

  // 5. Configurar HeatmapLayer con gradiente termográfico
  useEffect(() => {
    if (!mapRef.current || isLoading) return;
    const map = mapRef.current;

    // Si está en modo HEATMAP o COMBINED, crear o actualizar HeatmapLayer
    try {
      if (displayMode === 'HEATMAP' || displayMode === 'COMBINED') {
        if (!window.google?.maps?.LatLng) return;

        const points = filteredRecords.map((rec) => {
          // Peso termográfico basado en la criticidad de la incidencia
          const meta = getIncidentCategoryMeta(rec.tipoIncidencia || rec.incidencia);
          let weight = 1.2;
          if (meta.label.includes('Delitos')) weight = 3.2;
          else if (meta.label.includes('Drogas')) weight = 2.4;
          else if (meta.label.includes('Violencia')) weight = 2.0;

          return {
            location: new google.maps.LatLng(rec.lat, rec.lng),
            weight: weight,
          };
        });

        if (!heatmapRef.current) {
          const HeatmapCtor = google.maps.visualization?.HeatmapLayer as unknown as (new (
            opts: Record<string, unknown>
          ) => GoogleHeatmapLayer) | undefined;

          if (typeof HeatmapCtor === 'function') {
            heatmapRef.current = new HeatmapCtor({
              data: points,
              map: map,
              radius: thermalRadius,
              opacity: 0.88,
              gradient: THERMOGRAPHIC_GRADIENT,
              dissipating: true,
              maxIntensity: 6,
            });
          }
        } else {
          heatmapRef.current.setData(points);
          heatmapRef.current.set('radius', thermalRadius);
          heatmapRef.current.setMap(map);
        }
      } else {
        if (heatmapRef.current) {
          heatmapRef.current.setMap(null);
        }
      }
    } catch (e) {
      console.warn('Google Maps heatmap layer notice:', e);
    }
  }, [filteredRecords, displayMode, isLoading, thermalRadius]);

  // 6. Renderizar Marcadores de Incidencias, Operativos y Flota Activa
  useEffect(() => {
    if (!mapRef.current || isLoading) return;

    // Limpiar marcadores y círculos anteriores
    markersRef.current.forEach((m) => m.setMap(null));
    markersRef.current = [];
    circlesRef.current.forEach((c) => c.setMap(null));
    circlesRef.current = [];
    fleetMarkersRef.current.forEach((m) => m.setMap(null));
    fleetMarkersRef.current = [];

    const map = mapRef.current;
    const infoWindow = infoWindowRef.current;

    // A. MARCADORES DE INCIDENCIAS (Sólo en modo POINTS o COMBINED)
    if (displayMode === 'POINTS' || displayMode === 'COMBINED') {
      filteredRecords.forEach((rec) => {
        const meta = getIncidentCategoryMeta(rec.tipoIncidencia || rec.incidencia);

        const marker = new google.maps.Marker({
          position: { lat: rec.lat, lng: rec.lng },
          map: map,
          title: `${rec.tipoIncidencia} - ${rec.columna1 || rec.lugar}`,
          icon: {
            path: google.maps.SymbolPath.CIRCLE,
            fillColor: meta.color,
            fillOpacity: 0.95,
            strokeColor: '#ffffff',
            strokeWeight: 1.5,
            scale: 5.5,
          },
        });

        // Radio focal estricto y preciso (45m alrededor del punto)
        if (precisionMode === 'FOCUS_45M') {
          const circle = new google.maps.Circle({
            map: map,
            center: { lat: rec.lat, lng: rec.lng },
            radius: 45,
            fillColor: meta.color,
            fillOpacity: 0.18,
            strokeColor: meta.color,
            strokeWeight: 1,
            strokeOpacity: 0.6,
          });
          circlesRef.current.push(circle);
        }

        marker.addListener('click', () => {
          setSelectedIncident(rec);
          if (onSelectIncident) onSelectIncident(rec);

          if (infoWindow) {
            const contentString = `
              <div style="color: #0f172a; font-family: system-ui, sans-serif; max-width: 280px; padding: 4px;">
                <div style="border-bottom: 2px solid ${meta.color}; padding-bottom: 4px; margin-bottom: 6px;">
                  <span style="font-size: 9px; font-weight: bold; background: #0f172a; color: #38bdf8; padding: 2px 6px; border-radius: 4px;">${rec.sector || rec.subsector}</span>
                  <span style="font-size: 8px; color: #64748b; margin-left: 6px;">${rec.comisaria}</span>
                  <h4 style="margin: 4px 0 0 0; font-size: 12px; font-weight: 800; color: #0a1a36;">${rec.tipoIncidencia}</h4>
                </div>
                <p style="margin: 0 0 4px 0; font-size: 11px; line-height: 1.3;"><strong>📍 Ubicación:</strong> ${rec.columna1 || rec.lugar || rec.ubicacion}</p>
                <p style="margin: 0 0 6px 0; font-size: 10px; color: #475569; background: #f8fafc; padding: 4px; border-radius: 4px; border-left: 3px solid #38bdf8;">📝 ${rec.observacion || 'Atención de rutina Serenazgo'}</p>
                <div style="display: flex; justify-content: space-between; font-size: 9px; color: #64748b; border-top: 1px solid #e2e8f0; padding-top: 4px;">
                  <span>⏰ ${rec.turno} (${rec.hora})</span>
                  <span>🚓 ${rec.unidad || rec.patrullero || 'Móvil'}</span>
                </div>
              </div>
            `;
            infoWindow.setContent(contentString);
            infoWindow.open(map, marker);
          }
        });

        markersRef.current.push(marker);
      });
    }

    // B. OPERATIVOS PROGRAMADOS (Paradero Seguro, Colegio Seguro, Rastrillaje, Destello, Impacto)
    if (showOperativos) {
      OPERATIVOS_SEMANALES_PROGRAMADOS.forEach((op) => {
        op.sectoresObjetivo.forEach((secId) => {
          const sec = SECTORES_OFICIALES[secId];
          if (!sec) return;

          const opMarker = new google.maps.Marker({
            position: { lat: sec.lat, lng: sec.lng },
            map: map,
            title: `${op.nombre} - ${op.turno}`,
            icon: {
              path: 'M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z',
              fillColor: '#f59e0b',
              fillOpacity: 0.95,
              strokeColor: '#0a1a36',
              strokeWeight: 1.5,
              scale: 1.1,
              anchor: new google.maps.Point(12, 22),
            },
          });

          // Rango focal de operativo (65 metros)
          const opCircle = new google.maps.Circle({
            map: map,
            center: { lat: sec.lat, lng: sec.lng },
            radius: 65,
            fillColor: '#f59e0b',
            fillOpacity: 0.12,
            strokeColor: '#f59e0b',
            strokeWeight: 1,
          });
          circlesRef.current.push(opCircle);

          opMarker.addListener('click', () => {
            setSelectedOperativo(op);
            if (infoWindow) {
              const contentString = `
                <div style="color: #0f172a; font-family: system-ui, sans-serif; max-width: 290px; padding: 4px;">
                  <div style="border-bottom: 2px solid #f59e0b; padding-bottom: 4px; margin-bottom: 6px;">
                    <span style="font-size: 9px; font-weight: bold; background: #78350f; color: #fef08a; padding: 2px 6px; border-radius: 4px;">OPERATIVO PROGRAMADO</span>
                    <h4 style="margin: 4px 0 0 0; font-size: 13px; font-weight: 800; color: #0a1a36;">${op.nombre}</h4>
                  </div>
                  <p style="margin: 0 0 4px 0; font-size: 10.5px; color: #1e293b;"><strong>🎯 Objetivo:</strong> ${op.objetivoPrincipal}</p>
                  <p style="margin: 0 0 4px 0; font-size: 10px; color: #475569;"><strong>🗓️ Frecuencia:</strong> ${op.frecuencia} (${op.horario})</p>
                  <p style="margin: 0 0 4px 0; font-size: 10px; color: #475569;"><strong>📍 Cuadrante:</strong> ${sec.nombre}</p>
                  <div style="border-top: 1px solid #e2e8f0; padding-top: 4px; font-size: 9.5px; color: #0369a1; font-weight: bold;">
                    🚓 ${op.unidadesAsignadas.join(' • ')} (${op.efectivosEstimados} efectivos)
                  </div>
                </div>
              `;
              infoWindow.setContent(contentString);
              infoWindow.open(map, opMarker);
            }
          });

          markersRef.current.push(opMarker);
        });
      });
    }

    // C. FLOTA ACTIVA DE SERENAZGO (24 Camionetas y 12 Motos)
    if (showFleet) {
      activeFleet.forEach((veh) => {
        const isCamioneta = veh.tipo === 'CAMIONETA';

        const fleetMarker = new google.maps.Marker({
          position: { lat: veh.lat, lng: veh.lng },
          map: map,
          title: `${veh.codigo} (${veh.placa}) - ${veh.operativoActual || 'Patrullaje'}`,
          icon: {
            path: isCamioneta
              ? google.maps.SymbolPath.FORWARD_CLOSED_ARROW
              : google.maps.SymbolPath.CIRCLE,
            fillColor: isCamioneta ? '#06b6d4' : '#10b981',
            fillOpacity: 1,
            strokeColor: '#ffffff',
            strokeWeight: 2,
            scale: isCamioneta ? 6 : 5.5,
          },
        });

        fleetMarker.addListener('click', () => {
          setSelectedVehicle(veh);
          if (infoWindow) {
            const content = `
              <div style="color: #0f172a; font-family: system-ui, sans-serif; max-width: 290px; padding: 4px;">
                <div style="border-bottom: 2px solid ${isCamioneta ? '#06b6d4' : '#10b981'}; padding-bottom: 4px; margin-bottom: 6px;">
                  <span style="font-size: 9px; font-weight: 800; background: ${isCamioneta ? '#083344' : '#064e3b'}; color: #ffffff; padding: 2px 6px; border-radius: 4px;">
                    ${isCamioneta ? 'CAMIONETA 4X4' : 'MOTO RÁPIDA'} • ${veh.codigo}
                  </span>
                  <span style="font-size: 8.5px; color: #64748b; margin-left: 6px;">Placa: ${veh.placa}</span>
                  <h4 style="margin: 4px 0 0 0; font-size: 12px; font-weight: 800; color: #0a1a36;">${veh.modelo}</h4>
                </div>
                <p style="margin: 0 0 3px 0; font-size: 10px; color: #0284c7; font-weight: bold;"><strong>🚨 Operativo:</strong> ${veh.operativoActual || 'Patrullaje Preventivo'}</p>
                <p style="margin: 0 0 2px 0; font-size: 10px;"><strong>👮‍♂️ A cargo:</strong> ${veh.efectivoCargo}</p>
                <p style="margin: 0 0 2px 0; font-size: 10px;"><strong>📍 Cuadrante:</strong> ${veh.subsectorActual} (${veh.zona})</p>
                ${
                  veh.operadorIntegradoPNP
                    ? `<p style="margin: 0 0 3px 0; font-size: 9.5px; color: #047857; font-weight: bold;"><strong>🛡️ Integrado PNP:</strong> ${veh.operadorIntegradoPNP}</p>`
                    : ''
                }
                <div style="margin-top: 4px; padding-top: 4px; border-top: 1px solid #e2e8f0; font-size: 9px; color: #475569; display: flex; justify-content: space-between;">
                  <span>Patrullajes mes: <strong>${veh.patrullajesMensuales}</strong></span>
                  <span>Horas: <strong>${veh.horasPatrullajeMes}h</strong></span>
                  <span>Interv.: <strong>${veh.intervencionesMes}</strong></span>
                </div>
              </div>
            `;
            infoWindow.setContent(content);
            infoWindow.open(map, fleetMarker);
          }
        });

        fleetMarkersRef.current.push(fleetMarker);
      });
    }
  }, [
    filteredRecords,
    activeFleet,
    displayMode,
    precisionMode,
    showOperativos,
    showFleet,
    isLoading,
    onSelectIncident,
  ]);

  const toggleFullScreen = () => {
    setIsFullScreen(!isFullScreen);
  };

  const handleRetry = () => {
    setRetryCounter((c) => c + 1);
  };

  return (
    <div
      className={`relative flex flex-col bg-[#050e1a] border-2 border-cyan-800/80 rounded-xl shadow-2xl overflow-hidden ${
        isFullScreen ? 'fixed inset-0 z-50 rounded-none border-none' : 'h-[640px] w-full'
      }`}
    >
      {/* Top Tactical Command Ribbon */}
      <div className="bg-gradient-to-r from-[#040e1b] via-[#08203d] to-[#040e1b] border-b border-cyan-800/80 px-4 py-2.5 flex flex-wrap items-center justify-between gap-2.5 z-10 text-white">
        {/* Title and Active Status */}
        <div className="flex items-center gap-2.5">
          <div className="p-1.5 rounded-lg bg-cyan-950 border border-cyan-500/50 text-cyan-300">
            <Compass className="w-4 h-4 text-cyan-400 animate-spin-slow" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-xs sm:text-sm font-black uppercase tracking-wider text-cyan-100 font-sans">
                MAPA TÁCTICO GOOGLE MAPS PLATFORM
              </h3>
              <span className="text-[9px] font-bold bg-emerald-950 text-emerald-300 border border-emerald-500/50 px-2 py-0.5 rounded-full flex items-center gap-1 shadow-sm">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                API OFICIAL JS ACTIVA
              </span>
            </div>
            <p className="text-[10px] text-cyan-300/80 hidden sm:block">
              Georreferenciación estricta de incidencias &bull; Flota activa (24 Camionetas y 12 Motos) &bull; Operativos en vivo
            </p>
          </div>
        </div>

        {/* Visual Map Styles (Dark Theme, Hybrid, Streets) */}
        <div className="flex items-center gap-1.5 bg-[#031326]/90 p-1 rounded-lg border border-cyan-700/60 text-xs">
          <button
            onClick={() => setMapType('DARK')}
            className={`px-2.5 py-1 rounded font-bold transition-all text-[11px] ${
              mapType === 'DARK'
                ? 'bg-gradient-to-r from-cyan-600 to-blue-600 text-white shadow-md'
                : 'text-cyan-300 hover:text-white'
            }`}
          >
            Táctico Oscuro
          </button>
          <button
            onClick={() => setMapType('HYBRID')}
            className={`px-2.5 py-1 rounded font-bold transition-all text-[11px] ${
              mapType === 'HYBRID'
                ? 'bg-gradient-to-r from-cyan-600 to-blue-600 text-white shadow-md'
                : 'text-cyan-300 hover:text-white'
            }`}
          >
            Satélite HD
          </button>
          <button
            onClick={() => setMapType('ROADMAP')}
            className={`px-2.5 py-1 rounded font-bold transition-all text-[11px] ${
              mapType === 'ROADMAP'
                ? 'bg-gradient-to-r from-cyan-600 to-blue-600 text-white shadow-md'
                : 'text-cyan-300 hover:text-white'
            }`}
          >
            Calles
          </button>
        </div>

        {/* Heatmap & Display Mode Switcher */}
        <div className="flex items-center gap-1.5 bg-[#031326]/90 p-1 rounded-lg border border-cyan-700/60 text-xs">
          <button
            onClick={() => setDisplayMode('HEATMAP')}
            className={`px-2.5 py-1 rounded font-bold transition-all text-[11px] flex items-center gap-1.5 ${
              displayMode === 'HEATMAP'
                ? 'bg-gradient-to-r from-rose-600 to-amber-600 text-white shadow-md'
                : 'text-cyan-300 hover:text-white'
            }`}
            title="Efecto de calor termográfico según densidad de incidencias"
          >
            <Flame className="w-3.5 h-3.5" />
            <span>Calor Térmico</span>
          </button>
          <button
            onClick={() => setDisplayMode('POINTS')}
            className={`px-2.5 py-1 rounded font-bold transition-all text-[11px] flex items-center gap-1.5 ${
              displayMode === 'POINTS'
                ? 'bg-gradient-to-r from-cyan-600 to-blue-600 text-white shadow-md'
                : 'text-cyan-300 hover:text-white'
            }`}
          >
            <Crosshair className="w-3.5 h-3.5" />
            <span>Puntos (45m)</span>
          </button>
          <button
            onClick={() => setDisplayMode('COMBINED')}
            className={`px-2.5 py-1 rounded font-bold transition-all text-[11px] flex items-center gap-1.5 ${
              displayMode === 'COMBINED'
                ? 'bg-gradient-to-r from-indigo-600 to-cyan-600 text-white shadow-md'
                : 'text-cyan-300 hover:text-white'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Combinado</span>
          </button>
        </div>

        {/* Full Screen Toggle */}
        <button
          onClick={toggleFullScreen}
          className="p-1.5 rounded-lg bg-cyan-950/80 hover:bg-cyan-900 border border-cyan-700/60 text-cyan-300 transition-colors"
          title={isFullScreen ? 'Salir de pantalla completa' : 'Ver a pantalla completa'}
        >
          {isFullScreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
        </button>
      </div>

      {/* Sub-bar: Search, Fleet Toggles & Thermal Controls */}
      <div className="bg-[#031020] border-b border-cyan-900/80 px-4 py-2 flex flex-wrap items-center justify-between gap-2.5 z-10 text-xs">
        {/* Search input */}
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="w-3.5 h-3.5 text-cyan-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Buscar por lugar, AA.HH., urbanización o sector..."
            value={searchFilter}
            onChange={(e) => setSearchFilter(e.target.value)}
            className="w-full bg-[#06182e] border border-cyan-700/70 rounded-md pl-8 pr-3 py-1 text-xs text-white placeholder-cyan-400/50 focus:outline-none focus:border-cyan-400"
          />
        </div>

        {/* Fleet Selector (24 Camionetas & 12 Motos) */}
        <div className="flex items-center gap-1 bg-[#05182d] p-1 rounded-lg border border-cyan-800 text-[11px]">
          <span className="text-cyan-400 font-bold px-1.5 flex items-center gap-1">
            <Car className="w-3 h-3 text-cyan-300" />
            <span>Flota:</span>
          </span>
          <button
            onClick={() => setFleetFilter('ALL')}
            className={`px-2 py-0.5 rounded font-bold transition-colors ${
              fleetFilter === 'ALL'
                ? 'bg-cyan-600 text-white'
                : 'text-cyan-300 hover:text-white'
            }`}
          >
            Todas (36)
          </button>
          <button
            onClick={() => setFleetFilter('CAMIONETAS')}
            className={`px-2 py-0.5 rounded font-bold transition-colors ${
              fleetFilter === 'CAMIONETAS'
                ? 'bg-cyan-600 text-white'
                : 'text-cyan-300 hover:text-white'
            }`}
          >
            24 Camionetas
          </button>
          <button
            onClick={() => setFleetFilter('MOTOS')}
            className={`px-2 py-0.5 rounded font-bold transition-colors ${
              fleetFilter === 'MOTOS'
                ? 'bg-emerald-600 text-white'
                : 'text-emerald-300 hover:text-white'
            }`}
          >
            12 Motos
          </button>
        </div>

        {/* Dynamic Thermal Pulsation Toggle */}
        {(displayMode === 'HEATMAP' || displayMode === 'COMBINED') && (
          <div className="flex items-center gap-2 bg-[#05182d] px-2.5 py-1 rounded-lg border border-cyan-800">
            <button
              onClick={() => setIsThermalAnimated(!isThermalAnimated)}
              className={`flex items-center gap-1.5 font-bold text-[11px] ${
                isThermalAnimated ? 'text-amber-400' : 'text-slate-400'
              }`}
              title="Pulsación fluida de radiación termográfica"
            >
              <Zap className={`w-3.5 h-3.5 ${isThermalAnimated ? 'animate-pulse text-amber-400' : ''}`} />
              <span>Pulsación Térmica {isThermalAnimated ? 'ON' : 'OFF'}</span>
            </button>
            <input
              type="range"
              min="18"
              max="45"
              value={thermalRadius}
              onChange={(e) => setThermalRadius(Number(e.target.value))}
              className="w-16 accent-amber-500 h-1 cursor-pointer"
              title={`Radio térmico: ${thermalRadius}px`}
            />
          </div>
        )}

        {/* Operativos Toggle */}
        <button
          onClick={() => setShowOperativos(!showOperativos)}
          className={`flex items-center gap-1 text-[11px] font-bold px-2 py-1 rounded border transition-colors ${
            showOperativos
              ? 'bg-amber-950/80 border-amber-600/80 text-amber-300'
              : 'bg-[#06182e] border-slate-700 text-slate-400'
          }`}
        >
          <Shield className="w-3 h-3" />
          <span>Operativos ({OPERATIVOS_SEMANALES_PROGRAMADOS.length})</span>
        </button>

        {/* Stats Summary */}
        <div className="text-[11px] text-cyan-300/80 font-mono hidden md:block">
          Mostrando: <strong className="text-white">{filteredRecords.length}</strong> atenciones &bull;{' '}
          <strong className="text-emerald-400">{activeFleet.length}</strong> móviles en patrullaje
        </div>
      </div>

      {/* Map Canvas Container */}
      <div className="relative flex-1 w-full h-full min-h-[560px] bg-[#061324]">
        <div ref={containerRef} className="w-full h-full min-h-[560px]" />

        {/* Loading Spinner */}
        {isLoading && (
          <div className="absolute inset-0 bg-[#050e1a]/90 backdrop-blur-sm flex flex-col items-center justify-center gap-3 z-30 text-white">
            <div className="w-12 h-12 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin"></div>
            <div className="text-center">
              <p className="text-sm font-bold text-cyan-200">
                Conectando con Google Maps Platform API...
              </p>
              <p className="text-xs text-cyan-400/70">
                Cargando capa táctica oscura, HeatmapLayer y flota en tiempo real
              </p>
            </div>
          </div>
        )}

        {/* Error Fallback with Retry */}
        {loadError && !isLoading && (
          <div className="absolute inset-0 bg-[#050e1a]/95 flex flex-col items-center justify-center gap-4 p-6 z-30 text-white text-center">
            <div className="p-3 rounded-full bg-rose-950/80 border border-rose-500 text-rose-400">
              <AlertTriangle className="w-8 h-8" />
            </div>
            <div className="max-w-md">
              <h4 className="text-base font-bold text-rose-200 mb-1">
                Conexión con la API de Google Maps
              </h4>
              <p className="text-xs text-slate-300 leading-relaxed mb-4">{loadError}</p>
              <div className="flex flex-wrap items-center justify-center gap-2">
                <button
                  onClick={handleRetry}
                  className="px-3.5 py-1.5 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white text-xs font-bold rounded-lg shadow-lg flex items-center gap-1.5 transition-all"
                >
                  <RotateCw className="w-3.5 h-3.5" />
                  <span>Reintentar Conexión</span>
                </button>
                {onSwitchToLeaflet && (
                  <button
                    onClick={onSwitchToLeaflet}
                    className="px-3.5 py-1.5 bg-slate-800 hover:bg-slate-700 border border-cyan-700/60 text-cyan-200 text-xs font-bold rounded-lg shadow transition-all flex items-center gap-1.5"
                  >
                    <MapPin className="w-3.5 h-3.5 text-cyan-400" />
                    <span>Usar Radar GIS Leaflet</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Thermographic Reference Legend (Based on visual reference image) */}
        <div className="absolute bottom-4 left-4 z-20 bg-[#031020]/90 border border-cyan-700/60 backdrop-blur-md p-3 rounded-lg shadow-2xl text-white max-w-[260px]">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[10px] font-black uppercase text-cyan-300 flex items-center gap-1">
              <Activity className="w-3 h-3 text-rose-400" />
              Densidad Termográfica
            </span>
            <span className="text-[9px] font-mono text-cyan-400">DYNAMICS</span>
          </div>

          {/* Color Bar Gradient */}
          <div className="h-2.5 w-full rounded-full bg-gradient-to-r from-blue-600 via-cyan-400 via-emerald-400 via-yellow-400 via-orange-500 via-red-600 to-white shadow-inner mb-1.5" />

          <div className="flex justify-between text-[9px] font-mono text-slate-300 mb-2">
            <span>Baja / 0</span>
            <span>Media / 150</span>
            <span className="text-amber-300 font-bold">&gt; 500 Incidencias</span>
          </div>

          <div className="grid grid-cols-2 gap-1.5 pt-1.5 border-t border-cyan-900/60 text-[10px]">
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-sm bg-cyan-400"></span>
              <span className="text-slate-300">Camionetas (24)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-sm bg-emerald-400"></span>
              <span className="text-slate-300">Motos (12)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-sm bg-amber-400"></span>
              <span className="text-slate-300">Operativos (65m)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-white border border-rose-500"></span>
              <span className="text-slate-300">Foco Crítico</span>
            </div>
          </div>
        </div>

        {/* Selected Vehicle or Operativo Card */}
        {selectedVehicle && (
          <div className="absolute top-4 right-4 z-20 bg-[#031224]/95 border-2 border-cyan-500 p-3 rounded-xl shadow-2xl text-white max-w-xs animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-2 border-b border-cyan-800/80 mb-2">
              <div className="flex items-center gap-2">
                <div className="p-1 rounded bg-cyan-950 border border-cyan-500">
                  <Car className="w-4 h-4 text-cyan-400" />
                </div>
                <div>
                  <h4 className="text-xs font-black text-cyan-200 uppercase">
                    {selectedVehicle.codigo} &bull; {selectedVehicle.placa}
                  </h4>
                  <p className="text-[10px] text-cyan-400 font-semibold">{selectedVehicle.modelo}</p>
                </div>
              </div>
              <button
                onClick={() => setSelectedVehicle(null)}
                className="text-slate-400 hover:text-white text-xs font-bold px-1"
              >
                ✕
              </button>
            </div>

            <div className="space-y-1.5 text-[11px] text-slate-300">
              <div>
                <span className="text-slate-400">Operativo en curso:</span>
                <p className="font-bold text-amber-300">{selectedVehicle.operativoActual}</p>
              </div>
              <div>
                <span className="text-slate-400">Efectivo a cargo:</span>
                <p className="font-semibold text-white">{selectedVehicle.efectivoCargo}</p>
              </div>
              {selectedVehicle.operadorIntegradoPNP && (
                <div>
                  <span className="text-slate-400">Patrullaje Integrado PNP:</span>
                  <p className="font-bold text-emerald-400">{selectedVehicle.operadorIntegradoPNP}</p>
                </div>
              )}
              <div className="grid grid-cols-3 gap-1 pt-2 border-t border-cyan-900/80 text-[10px] font-mono text-center">
                <div className="bg-[#051b33] p-1 rounded">
                  <div className="text-cyan-400 font-bold">{selectedVehicle.patrullajesSemanales}</div>
                  <div className="text-[8px] text-slate-400">Semanal</div>
                </div>
                <div className="bg-[#051b33] p-1 rounded">
                  <div className="text-emerald-400 font-bold">{selectedVehicle.patrullajesMensuales}</div>
                  <div className="text-[8px] text-slate-400">Mensual</div>
                </div>
                <div className="bg-[#051b33] p-1 rounded">
                  <div className="text-amber-400 font-bold">{selectedVehicle.patrullajesAnuales}</div>
                  <div className="text-[8px] text-slate-400">Anual</div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
