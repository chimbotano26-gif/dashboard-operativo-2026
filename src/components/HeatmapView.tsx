import React, { useEffect, useRef, useState, useMemo } from 'react';
import L from 'leaflet';
import 'leaflet.heat';
import 'leaflet/dist/leaflet.css';
import {
  Flame,
  Layers,
  MapPin,
  Crosshair,
  Shield,
  Filter,
  Eye,
  Radio,
  Building,
  Hospital,
  AlertTriangle,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Minimize2,
  RefreshCw,
  Search,
  Sparkles,
} from 'lucide-react';
import { IncidentRecord } from '../types';
import { processIncidentsToHeatPoints, HeatPoint } from '../utils/geoCoderNuevoChimbote';
import { TACTICAL_LANDMARKS } from '../data/nuevoChimboteVectorMap';

interface HeatmapViewProps {
  records: IncidentRecord[];
  allRecords?: IncidentRecord[];
  onSelectIncident?: (incident: IncidentRecord) => void;
}

type MapTileStyle = 'DARK' | 'STREETS' | 'SATELLITE';

export const HeatmapView: React.FC<HeatmapViewProps> = ({
  records,
  allRecords,
}) => {
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const heatLayerRef = useRef<any>(null);
  const tileLayerRef = useRef<L.TileLayer | null>(null);
  const landmarkMarkersLayerRef = useRef<L.LayerGroup | null>(null);

  // Estados de configuración de mapa de calor
  const [tileStyle, setTileStyle] = useState<MapTileStyle>('STREETS');
  const [heatRadius, setHeatRadius] = useState<number>(28);
  const [heatBlur, setHeatBlur] = useState<number>(18);
  const [minOpacity, setMinOpacity] = useState<number>(0.35);
  const [showLandmarks, setShowLandmarks] = useState<boolean>(true);
  const [selectedCategory, setSelectedCategory] = useState<string>('TODAS');
  const [searchFilter, setSearchFilter] = useState<string>('');
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [selectedHotspot, setSelectedHotspot] = useState<string | null>(null);

  // Centro de Nuevo Chimbote (Plaza Mayor)
  const NUEVO_CHIMBOTE_CENTER: [number, number] = [-9.1258, -78.5242];

  // 1. Procesar registros y geocodificarlos con memoización para alto rendimiento
  const geocodedPoints = useMemo(() => {
    return processIncidentsToHeatPoints(records);
  }, [records]);

  // 2. Filtrar puntos según búsqueda y categoría
  const filteredHeatPoints = useMemo(() => {
    return geocodedPoints.filter((p) => {
      // Filtro de categoría
      if (selectedCategory !== 'TODAS') {
        const inc = p.incidencia.toUpperCase();
        if (selectedCategory === 'DELITOS' && !inc.includes('ROBO') && !inc.includes('HURTO') && !inc.includes('CAPTURAS')) return false;
        if (selectedCategory === 'DROGAS' && !inc.includes('DROGA') && !inc.includes('ALCOHOL') && !inc.includes('BEBIDAS')) return false;
        if (selectedCategory === 'TRANSITO' && !inc.includes('ACCIDENTE') && !inc.includes('TRÁNSITO') && !inc.includes('MANIOBRAS')) return false;
        if (selectedCategory === 'VIOLENCIA' && !inc.includes('VIOLENCIA') && !inc.includes('AGRESION')) return false;
        if (selectedCategory === 'AUXILIO' && !inc.includes('MÉDICO') && !inc.includes('AUXILIO') && !inc.includes('ANIEGOS')) return false;
      }
      // Filtro de búsqueda
      if (searchFilter.trim() !== '') {
        const query = searchFilter.toLowerCase();
        const match =
          p.lugar.toLowerCase().includes(query) ||
          p.incidencia.toLowerCase().includes(query) ||
          p.sector.toLowerCase().includes(query);
        if (!match) return false;
      }
      return true;
    });
  }, [geocodedPoints, selectedCategory, searchFilter]);

  // 3. Top Hotspots (Focos de Calor principales)
  const topHotspots = useMemo(() => {
    const counts: Record<string, { count: number; lat: number; lng: number; sector: string }> = {};
    for (const p of filteredHeatPoints) {
      const key = p.lugar;
      if (!counts[key]) {
        counts[key] = { count: 0, lat: p.lat, lng: p.lng, sector: p.sector };
      }
      counts[key].count++;
    }
    return Object.entries(counts)
      .map(([name, data]) => ({ name, ...data }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);
  }, [filteredHeatPoints]);

  // 4. Inicializar mapa Leaflet
  useEffect(() => {
    if (!mapContainerRef.current) return;
    if (mapInstanceRef.current) return;

    // Crear mapa
    const map = L.map(mapContainerRef.current, {
      center: NUEVO_CHIMBOTE_CENTER,
      zoom: 14,
      minZoom: 11,
      maxZoom: 18,
      zoomControl: false,
    });

    mapInstanceRef.current = map;

    // LayerGroup para marcadores de landmarks
    const landmarksGroup = L.layerGroup().addTo(map);
    landmarkMarkersLayerRef.current = landmarksGroup;

    // Limpiar al desmontar
    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // 5. Actualizar capa base de teselas (Tiles)
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    if (tileLayerRef.current) {
      map.removeLayer(tileLayerRef.current);
    }

    let url = 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
    let attribution = '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors';
    let maxZoom = 19;
    let subdomains = 'abc';

    if (tileStyle === 'SATELLITE') {
      // Esri World Imagery (Satélite)
      url = 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}';
      attribution = '&copy; Esri &copy; Earthstar Geographics';
      maxZoom = 18;
      subdomains = '';
    } else {
      // OpenStreetMap Estándar (100% abierto y gratuito sin API key)
      url = 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
      attribution = '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors';
      maxZoom = 19;
      subdomains = 'abc';
    }

    const newTileLayer = L.tileLayer(url, {
      attribution,
      maxZoom,
      subdomains: subdomains ? subdomains : undefined,
    }).addTo(map);

    tileLayerRef.current = newTileLayer;
  }, [tileStyle]);

  // 6. Actualizar o recrear Capa de Calor (HeatLayer) con leaflet-heat
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    // Remover capa previa si existe
    if (heatLayerRef.current) {
      map.removeLayer(heatLayerRef.current);
      heatLayerRef.current = null;
    }

    if (filteredHeatPoints.length === 0) return;

    // Transformar datos a formato [lat, lng, intensidad] para leaflet-heat
    const heatData: [number, number, number][] = filteredHeatPoints.map((p) => [
      p.lat,
      p.lng,
      p.intensity,
    ]);

    // Gradiente cromático táctico solicitado:
    // azul -> verde -> amarillo -> naranja -> rojo
    const heatGradient: Record<number, string> = {
      0.2: '#0284c7', // Azul táctico
      0.4: '#10b981', // Verde
      0.6: '#eab308', // Amarillo
      0.8: '#f97316', // Naranja
      1.0: '#ef4444', // Rojo crítico
    };

    try {
      // Instanciar HeatLayer usando Leaflet.heat
      const heat = (L as any).heatLayer(heatData, {
        minOpacity,
        maxZoom: 18,
        max: 1.0,
        radius: heatRadius,
        blur: heatBlur,
        gradient: heatGradient,
      });

      heat.addTo(map);
      heatLayerRef.current = heat;
    } catch (err) {
      console.error('Error inicializando capa de calor Leaflet:', err);
    }
  }, [filteredHeatPoints, heatRadius, heatBlur, minOpacity]);

  // 7. Marcadores de Bases Operativas y Comisarías
  useEffect(() => {
    const map = mapInstanceRef.current;
    const group = landmarkMarkersLayerRef.current;
    if (!map || !group) return;

    group.clearLayers();

    if (!showLandmarks) return;

    TACTICAL_LANDMARKS.forEach((lm) => {
      // Ícono personalizado según tipo
      const isBase = lm.tipo === 'BASE';
      const isCia = lm.tipo === 'COMISARIA';
      const isHosp = lm.tipo === 'HOSPITAL';

      const iconHtml = `
        <div class="flex items-center justify-center w-7 h-7 rounded-full shadow-lg border-2 ${
          isBase
            ? 'bg-cyan-600 border-white text-white'
            : isCia
            ? 'bg-blue-800 border-cyan-300 text-white'
            : isHosp
            ? 'bg-emerald-600 border-white text-white'
            : 'bg-amber-600 border-white text-white'
        }">
          <span style="font-size: 13px;">${isBase ? '🛡️' : isCia ? '👮' : isHosp ? '🏥' : '📍'}</span>
        </div>
      `;

      const customIcon = L.divIcon({
        html: iconHtml,
        className: 'custom-landmark-marker',
        iconSize: [28, 28],
        iconAnchor: [14, 14],
      });

      const marker = L.marker([lm.lat, lm.lng], { icon: customIcon });

      const popupContent = `
        <div style="font-family: sans-serif; font-size: 11px; padding: 2px;">
          <strong style="color: #0f172a; font-size: 12px; display: block; margin-bottom: 2px;">${lm.nombre}</strong>
          <span style="display: inline-block; padding: 2px 6px; border-radius: 4px; font-weight: bold; background: ${
            isBase ? '#e0f2fe; color: #0369a1;' : isCia ? '#dbeafe; color: #1e40af;' : '#ecfdf5; color: #047857;'
          }">
            ${lm.tipo} &bull; Nuevo Chimbote
          </span>
          <div style="color: #64748b; margin-top: 4px; font-family: monospace;">
            Coord: ${lm.lat.toFixed(4)}, ${lm.lng.toFixed(4)}
          </div>
        </div>
      `;

      marker.bindPopup(popupContent);
      group.addLayer(marker);
    });
  }, [showLandmarks]);

  // Enfoque en un punto específico
  const focusOnLocation = (lat: number, lng: number, zoom: number = 16) => {
    const map = mapInstanceRef.current;
    if (map) {
      map.flyTo([lat, lng], zoom, { duration: 1.2 });
    }
  };

  return (
    <div
      className={`relative flex flex-col w-full rounded-xl overflow-hidden border-2 border-cyan-800/60 shadow-2xl bg-slate-950 transition-all ${
        isFullscreen ? 'fixed inset-0 z-50 rounded-none border-none' : 'min-h-[720px] h-[780px]'
      }`}
    >
      {/* ========================================================================= */}
      {/* 1. BARRA SUPERIOR: PANEL DE CONTROL TÁCTICO DEL MAPA DE CALOR              */}
      {/* ========================================================================= */}
      <div className="bg-gradient-to-r from-[#061528] via-[#092242] to-[#061528] px-4 py-2.5 border-b border-cyan-800/60 flex flex-wrap items-center justify-between gap-3 text-xs text-white z-20 shadow-md">
        {/* Identidad y Conteo */}
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-gradient-to-br from-rose-500 via-amber-500 to-cyan-500 text-white shadow-md">
            <Flame className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm sm:text-base font-black tracking-wider uppercase text-white font-sans flex items-center gap-1.5">
                <span>MAPA DE CALOR TÁCTICO</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-rose-950 border border-rose-500 text-rose-300 font-mono">
                  HEATMAP GIS
                </span>
              </h2>
            </div>
            <p className="text-[11px] text-cyan-300 font-mono flex items-center gap-1.5">
              <span className="inline-block w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
              <span>{filteredHeatPoints.length.toLocaleString()} atenciones georreferenciadas en Nuevo Chimbote</span>
              {records.length !== filteredHeatPoints.length && (
                <span className="text-slate-400"> (de {records.length.toLocaleString()} totales)</span>
              )}
            </p>
          </div>
        </div>

        {/* Leyenda Cromática Táctica (azul -> verde -> amarillo -> naranja -> rojo) */}
        <div className="hidden lg:flex items-center gap-2 bg-[#051120] px-3 py-1.5 rounded-lg border border-cyan-900/60">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Densidad:</span>
          <div className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-full bg-[#0284c7]" title="Baja Frecuencia" />
            <span className="text-[10px] text-slate-300 font-mono">Baja</span>
            <span className="text-slate-600">&rarr;</span>
            <span className="w-2.5 h-2.5 rounded-full bg-[#10b981]" title="Media-Baja" />
            <span className="w-2.5 h-2.5 rounded-full bg-[#eab308]" title="Media" />
            <span className="w-2.5 h-2.5 rounded-full bg-[#f97316]" title="Alta" />
            <span className="text-slate-600">&rarr;</span>
            <span className="w-2.5 h-2.5 rounded-full bg-[#ef4444]" title="Punto Crítico / Hotspot" />
            <strong className="text-[10px] text-rose-400 font-mono uppercase">Crítica</strong>
          </div>
        </div>

        {/* Controles de Capa y Filtro Rápido */}
        <div className="flex items-center gap-2 ml-auto flex-wrap">
          {/* Selector de Estilo de Mapa */}
          <div className="flex items-center bg-[#051120] rounded-lg border border-cyan-800/80 p-0.5">
            <button
              type="button"
              onClick={() => setTileStyle('DARK')}
              className={`px-2.5 py-1 rounded text-[11px] font-bold transition-colors cursor-pointer ${
                tileStyle === 'DARK' ? 'bg-cyan-700 text-white shadow' : 'text-slate-400 hover:text-white'
              }`}
              title="Estilo Táctico Nocturno (Recomendado para mapa de calor)"
            >
              Nocturno
            </button>
            <button
              type="button"
              onClick={() => setTileStyle('STREETS')}
              className={`px-2.5 py-1 rounded text-[11px] font-bold transition-colors cursor-pointer ${
                tileStyle === 'STREETS' ? 'bg-cyan-700 text-white shadow' : 'text-slate-400 hover:text-white'
              }`}
              title="Mapa Vial Estándar OpenStreetMap"
            >
              Calles
            </button>
            <button
              type="button"
              onClick={() => setTileStyle('SATELLITE')}
              className={`px-2.5 py-1 rounded text-[11px] font-bold transition-colors cursor-pointer ${
                tileStyle === 'SATELLITE' ? 'bg-cyan-700 text-white shadow' : 'text-slate-400 hover:text-white'
              }`}
              title="Fotografía Satelital Esri"
            >
              Satélite
            </button>
          </div>

          {/* Toggle de Bases y Comisarías */}
          <button
            type="button"
            onClick={() => setShowLandmarks(!showLandmarks)}
            className={`px-2.5 py-1.5 rounded-lg border text-[11px] font-bold flex items-center gap-1.5 transition-colors cursor-pointer ${
              showLandmarks
                ? 'bg-cyan-950 text-cyan-300 border-cyan-500'
                : 'bg-slate-900 text-slate-400 border-slate-700 hover:text-white'
            }`}
            title="Mostrar u ocultar Bases de Serenazgo y Comisarías"
          >
            <Shield className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Bases PNP/Serenazgo</span>
          </button>

          {/* Centrar en Nuevo Chimbote */}
          <button
            type="button"
            onClick={() => focusOnLocation(NUEVO_CHIMBOTE_CENTER[0], NUEVO_CHIMBOTE_CENTER[1], 14)}
            className="p-1.5 rounded-lg bg-cyan-900/60 hover:bg-cyan-800 text-cyan-200 border border-cyan-700/60 transition-colors cursor-pointer"
            title="Centrar en Plaza Mayor de Nuevo Chimbote"
          >
            <Crosshair className="w-4 h-4" />
          </button>

          {/* Pantalla completa */}
          <button
            type="button"
            onClick={() => setIsFullscreen(!isFullscreen)}
            className="p-1.5 rounded-lg bg-cyan-900/60 hover:bg-cyan-800 text-cyan-200 border border-cyan-700/60 transition-colors cursor-pointer"
            title={isFullscreen ? 'Salir de pantalla completa' : 'Ver mapa en pantalla completa'}
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 2. SUB-BARRA DE PARÁMETROS TÁCTICOS (Radio, Desenfoque, Filtros)           */}
      {/* ========================================================================= */}
      <div className="bg-[#05101e] px-4 py-2 border-b border-cyan-900/60 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-300 z-10">
        {/* Filtro Rápido de Incidencias */}
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-[10px] uppercase font-bold text-slate-400 flex items-center gap-1">
            <Filter className="w-3 h-3 text-cyan-400" />
            <span>Filtro Tipo:</span>
          </span>
          {[
            { id: 'TODAS', label: 'Todas' },
            { id: 'DELITOS', label: 'Robos / Delitos' },
            { id: 'DROGAS', label: 'Drogas / Alcohol' },
            { id: 'TRANSITO', label: 'Tránsito' },
            { id: 'VIOLENCIA', label: 'Violencia' },
            { id: 'AUXILIO', label: 'Auxilio / Rescate' },
          ].map((cat) => (
            <button
              key={cat.id}
              type="button"
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase transition-colors cursor-pointer ${
                selectedCategory === cat.id
                  ? 'bg-rose-600 text-white shadow'
                  : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* Buscador de Lugar en Mapa */}
        <div className="relative flex items-center w-48 sm:w-60">
          <Search className="w-3.5 h-3.5 text-cyan-400 absolute left-2.5 pointer-events-none" />
          <input
            type="text"
            value={searchFilter}
            onChange={(e) => setSearchFilter(e.target.value)}
            placeholder="Buscar lugar (Garatea, Bellamar...)"
            className="w-full bg-slate-900/90 text-white text-[11px] pl-8 pr-3 py-1 rounded-lg border border-cyan-800/60 focus:border-cyan-400 focus:outline-none placeholder:text-slate-500 font-sans"
          />
          {searchFilter && (
            <button
              type="button"
              onClick={() => setSearchFilter('')}
              className="absolute right-2 text-slate-400 hover:text-white text-xs"
            >
              &times;
            </button>
          )}
        </div>

        {/* Ajustes de Radio y Desenfoque del Heatmap */}
        <div className="flex items-center gap-4 text-[11px] font-mono">
          <div className="flex items-center gap-1.5">
            <span className="text-slate-400 text-[10px]">Radio:</span>
            {[20, 28, 38, 48].map((r) => (
              <button
                key={r}
                type="button"
                onClick={() => setHeatRadius(r)}
                className={`px-1.5 py-0.5 rounded text-[10px] font-bold cursor-pointer ${
                  heatRadius === r ? 'bg-cyan-600 text-white' : 'bg-slate-900 text-slate-400 hover:text-white'
                }`}
              >
                {r}px
              </button>
            ))}
          </div>

          <div className="flex items-center gap-1.5">
            <span className="text-slate-400 text-[10px]">Desenfoque:</span>
            {[12, 18, 26].map((b) => (
              <button
                key={b}
                type="button"
                onClick={() => setHeatBlur(b)}
                className={`px-1.5 py-0.5 rounded text-[10px] font-bold cursor-pointer ${
                  heatBlur === b ? 'bg-cyan-600 text-white' : 'bg-slate-900 text-slate-400 hover:text-white'
                }`}
              >
                {b}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 3. CONTENEDOR PRINCIPAL DEL MAPA LEAFLET                                  */}
      {/* ========================================================================= */}
      <div className="relative flex-1 w-full h-full bg-[#030712] overflow-hidden">
        {/* Contenedor del mapa Leaflet */}
        <div
          ref={mapContainerRef}
          className={`w-full h-full z-0 ${
            tileStyle === 'DARK' ? 'dark-tactical-tiles' : tileStyle === 'SATELLITE' ? 'satellite-tiles' : ''
          }`}
        />

        {/* 4. TARJETA FLOTANTE: TOP 5 FOCOS DE CALOR TÁCTICOS (HOTSPOTS) */}
        <div className="absolute top-3 left-3 z-10 max-w-xs w-64 bg-slate-950/90 backdrop-blur-md rounded-xl border border-cyan-800/80 p-3 shadow-2xl text-white">
          <div className="flex items-center justify-between pb-2 mb-2 border-b border-cyan-900/60">
            <div className="flex items-center gap-1.5 text-xs font-black uppercase tracking-wider text-rose-300">
              <Flame className="w-4 h-4 text-rose-400 animate-pulse" />
              <span>Top Focos Críticos</span>
            </div>
            <span className="text-[10px] bg-rose-950 text-rose-300 border border-rose-500/50 px-1.5 py-0.5 rounded font-mono font-bold">
              {topHotspots.length}
            </span>
          </div>

          <div className="space-y-1.5">
            {topHotspots.map((hs, i) => (
              <button
                key={i}
                type="button"
                onClick={() => {
                  setSelectedHotspot(hs.name);
                  focusOnLocation(hs.lat, hs.lng, 16);
                }}
                className={`w-full text-left p-2 rounded-lg transition-all flex items-center justify-between text-xs cursor-pointer ${
                  selectedHotspot === hs.name
                    ? 'bg-rose-900/60 border border-rose-400 text-white'
                    : 'bg-slate-900/70 hover:bg-cyan-950/80 border border-slate-800 text-slate-300 hover:text-white'
                }`}
              >
                <div className="flex items-center gap-2 truncate">
                  <span
                    className={`w-5 h-5 rounded-full flex items-center justify-center font-bold text-[10px] shrink-0 ${
                      i === 0
                        ? 'bg-rose-600 text-white'
                        : i === 1
                        ? 'bg-orange-600 text-white'
                        : 'bg-amber-600 text-slate-900'
                    }`}
                  >
                    #{i + 1}
                  </span>
                  <div className="truncate">
                    <span className="font-bold block truncate leading-tight">{hs.name}</span>
                    <span className="text-[10px] text-cyan-400 font-mono block">{hs.sector}</span>
                  </div>
                </div>

                <div className="text-right shrink-0 font-mono">
                  <strong className="text-rose-400 font-bold block">{hs.count}</strong>
                  <span className="text-[9px] text-slate-400">interv.</span>
                </div>
              </button>
            ))}
          </div>

          {/* Accesos rápidos de enfoque en zonas */}
          <div className="mt-3 pt-2 border-t border-cyan-900/40">
            <span className="text-[10px] text-slate-400 uppercase font-bold block mb-1">
              Enfoque Táctico Rápido:
            </span>
            <div className="grid grid-cols-2 gap-1 text-[10px]">
              <button
                type="button"
                onClick={() => focusOnLocation(-9.1258, -78.5242, 16)}
                className="px-2 py-1 bg-slate-900 hover:bg-cyan-900 rounded text-cyan-300 text-left truncate cursor-pointer"
              >
                &bull; Plaza Mayor
              </button>
              <button
                type="button"
                onClick={() => focusOnLocation(-9.1195, -78.531, 16)}
                className="px-2 py-1 bg-slate-900 hover:bg-cyan-900 rounded text-cyan-300 text-left truncate cursor-pointer"
              >
                &bull; Mdo. Buenos Aires
              </button>
              <button
                type="button"
                onClick={() => focusOnLocation(-9.116, -78.52, 16)}
                className="px-2 py-1 bg-slate-900 hover:bg-cyan-900 rounded text-cyan-300 text-left truncate cursor-pointer"
              >
                &bull; Urb. Garatea
              </button>
              <button
                type="button"
                onClick={() => focusOnLocation(-9.118, -78.509, 16)}
                className="px-2 py-1 bg-slate-900 hover:bg-cyan-900 rounded text-cyan-300 text-left truncate cursor-pointer"
              >
                &bull; Urb. Bellamar
              </button>
              <button
                type="button"
                onClick={() => focusOnLocation(-9.104, -78.537, 16)}
                className="px-2 py-1 bg-slate-900 hover:bg-cyan-900 rounded text-cyan-300 text-left truncate cursor-pointer"
              >
                &bull; Villa María
              </button>
              <button
                type="button"
                onClick={() => focusOnLocation(-9.1225, -78.5145, 16)}
                className="px-2 py-1 bg-slate-900 hover:bg-cyan-900 rounded text-cyan-300 text-left truncate cursor-pointer"
              >
                &bull; Campus UNS
              </button>
            </div>
          </div>
        </div>

        {/* 5. TARJETA INFORMATIVA INFERIOR DERECHA */}
        <div className="absolute bottom-4 left-4 z-10 bg-slate-950/85 backdrop-blur-md px-3 py-1.5 rounded-lg border border-cyan-800/60 text-[10px] font-mono text-cyan-300 pointer-events-none hidden sm:flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span>Nuevo Chimbote &bull; Lat: -9.1258, Lng: -78.5242 &bull; Sistema Leaflet Heatmap</span>
        </div>
      </div>
    </div>
  );
};
