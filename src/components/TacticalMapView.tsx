import React, { useEffect, useRef, useState, useMemo } from 'react';
import L from 'leaflet';
import 'leaflet.heat';
import 'leaflet/dist/leaflet.css';
import { MapErrorBoundary } from './MapErrorBoundary';
import {
  Flame,
  Car,
  Layers,
  MapPin,
  Crosshair,
  Info,
  Shield,
  Clock,
  Eye,
  Activity,
  Maximize2,
  Minimize2,
  Navigation,
  Radio,
  Search,
  Filter,
} from 'lucide-react';
import { IncidentRecord, PatrolUnit } from '../types';
import { TACTICAL_LANDMARKS } from '../data/nuevoChimboteVectorMap';
import { processIncidentsToHeatPoints, geocodeIncident } from '../utils/geoCoderNuevoChimbote';
import { GoogleMapsTacticalView } from './GoogleMapsTacticalView';
import { EditableText } from './EditableText';

// Clasificación visual de incidencias para el mapa táctico
export function getIncidentCategoryMeta(tipo: string): { color: string; label: string; bg: string } {
  const upper = tipo.toUpperCase();
  if (upper.includes('ROBO') || upper.includes('HURTO') || upper.includes('EXTORSIÓN') || upper.includes('CAPTURAS')) {
    return { color: '#ef4444', label: 'Delitos / Robos', bg: 'bg-rose-500' };
  }
  if (upper.includes('DROGA') || upper.includes('ALCOHOL') || upper.includes('SOSPECHOSAS')) {
    return { color: '#f97316', label: 'Drogas / Conductas de Riesgo', bg: 'bg-orange-500' };
  }
  if (upper.includes('ACCIDENTE') || upper.includes('MANIOBRAS') || upper.includes('VIA PÚBLICA') || upper.includes('TRÁNSITO')) {
    return { color: '#eab308', label: 'Tránsito / Tráfico', bg: 'bg-amber-500' };
  }
  if (upper.includes('VIOLENCIA') || upper.includes('AGRESION') || upper.includes('PUDOR') || upper.includes('TOCAMIENTOS')) {
    return { color: '#ec4899', label: 'Violencia Familiar / Agresión', bg: 'bg-pink-500' };
  }
  if (upper.includes('MÉDICO') || upper.includes('AUXILIO') || upper.includes('SUICIDIO') || upper.includes('EXTRAVIADAS')) {
    return { color: '#10b981', label: 'Auxilio Médico / Rescate', bg: 'bg-emerald-500' };
  }
  return { color: '#06b6d4', label: 'Seguridad y Orden Público', bg: 'bg-cyan-500' };
}

interface TacticalMapViewProps {
  records: IncidentRecord[];
  patrolUnits: PatrolUnit[];
  onSelectIncident?: (incident: IncidentRecord) => void;
  onDispatchUnit?: (unitId: string, location: string) => void;
}

export const TacticalMapView: React.FC<TacticalMapViewProps> = ({
  records,
  patrolUnits,
  onSelectIncident,
  onDispatchUnit,
}) => {
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const vectorBaseGroupRef = useRef<L.LayerGroup | null>(null);
  const layersGroupRef = useRef<L.LayerGroup | null>(null);
  const tileLayerRef = useRef<L.TileLayer | null>(null);
  const heatLayerRef = useRef<any>(null);

  const [mapEngine, setMapEngine] = useState<'LEAFLET' | 'GOOGLE_MAPS'>('LEAFLET');
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [mapMode, setMapMode] = useState<'HYBRID' | 'HEAT' | 'UNITS' | 'CLUSTER'>('HYBRID');
  const [mapStyle, setMapStyle] = useState<'DARK' | 'STREET' | 'SATELLITE'>('STREET');
  const [selectedItem, setSelectedItem] = useState<{
    type: 'INCIDENT' | 'UNIT';
    data: IncidentRecord | PatrolUnit;
  } | null>(null);

  const [radioStatus, setRadioStatus] = useState<string | null>(null);

  // Keyboard shortcut ESC to exit full screen
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isFullScreen) {
        setIsFullScreen(false);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isFullScreen]);

  // Leaflet resize when toggling full screen or layout changes
  useEffect(() => {
    const timer = setTimeout(() => {
      mapInstanceRef.current?.invalidateSize();
    }, 120);
    return () => clearTimeout(timer);
  }, [isFullScreen, mapMode, mapStyle]);

  // Center coordinate of Nuevo Chimbote (Plaza Mayor)
  const NCH_CENTER = { lat: -9.1258, lng: -78.5242 };

  // Initialize Map with Base and Layer Groups
  useEffect(() => {
    const container = mapContainerRef.current;
    if (!container) return;

    // Reset any previously assigned leaflet ID on the container DOM element
    if ((container as any)._leaflet_id) {
      delete (container as any)._leaflet_id;
    }

    // Clean up existing map if already present
    if (mapInstanceRef.current) {
      try {
        mapInstanceRef.current.remove();
      } catch (e) {
        console.warn('Map cleanup notice:', e);
      }
      mapInstanceRef.current = null;
    }

    try {
      const map = L.map(container, {
        center: [NCH_CENTER.lat, NCH_CENTER.lng],
        zoom: 14,
        minZoom: 11,
        maxZoom: 18,
        zoomControl: false,
        attributionControl: false,
      });

      L.control.zoom({ position: 'bottomright' }).addTo(map);

      // Layer 1: Puntos Estratégicos y Bases de Serenazgo (Sin polígonos de cuadrantes)
      const vectorGroup = L.layerGroup().addTo(map);
      vectorBaseGroupRef.current = vectorGroup;

      // Layer 2: Capas dinámicas de Incidencias, Focos de Calor y Patrulleros
      const dynamicGroup = L.layerGroup().addTo(map);
      layersGroupRef.current = dynamicGroup;

      mapInstanceRef.current = map;

      // Invalidate size immediately to prevent blank rendering
      setTimeout(() => {
        try {
          map.invalidateSize();
        } catch {
          // ignore
        }
      }, 100);
    } catch (err) {
      console.warn('Leaflet initialization safe catch:', err);
    }

    return () => {
      if (heatLayerRef.current && mapInstanceRef.current) {
        try {
          mapInstanceRef.current.removeLayer(heatLayerRef.current);
        } catch (e) {
          // ignore
        }
        heatLayerRef.current = null;
      }
      if (mapInstanceRef.current) {
        try {
          mapInstanceRef.current.remove();
        } catch (e) {
          console.warn('Leaflet unmount notice:', e);
        }
        mapInstanceRef.current = null;
      }
    };
  }, []);

  // Update Base Tile Layer (CartoDB Dark / OSM Streets / Satellite Esri)
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    if (tileLayerRef.current) {
      map.removeLayer(tileLayerRef.current);
      tileLayerRef.current = null;
    }

    let url = 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
    let attribution = '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors';
    let subdomains = 'abc';

    if (mapStyle === 'SATELLITE') {
      url = 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}';
      attribution = '&copy; Esri World Imagery';
      subdomains = '';
    } else {
      // OpenStreetMap estándar - 100% abierto, gratuito y sin necesidad de API Key
      url = 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
      attribution = '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors';
      subdomains = 'abc';
    }

    const tile = L.tileLayer(url, {
      maxZoom: 19,
      attribution,
      subdomains: subdomains ? subdomains : undefined,
    }).addTo(map);

    tileLayerRef.current = tile;
    tile.bringToBack();
  }, [mapStyle]);

  // Marcadores Estratégicos Oficiales: Bases de Serenazgo y Comisarías PNP (Sin polígonos ni cuadrantes)
  useEffect(() => {
    const map = mapInstanceRef.current;
    const vGroup = vectorBaseGroupRef.current;
    if (!map || !vGroup) return;

    vGroup.clearLayers();

    TACTICAL_LANDMARKS.forEach((lm) => {
      let iconEmoji = '📍';
      let badgeBg = 'bg-slate-900/90 border-cyan-500 text-cyan-200';
      if (lm.tipo === 'BASE') {
        iconEmoji = '🛡️';
        badgeBg = 'bg-cyan-950/90 border-cyan-400 text-cyan-200';
      } else if (lm.tipo === 'COMISARIA') {
        iconEmoji = '👮';
        badgeBg = 'bg-blue-950/90 border-blue-400 text-blue-200';
      } else if (lm.tipo === 'HOSPITAL') {
        iconEmoji = '🏥';
        badgeBg = 'bg-emerald-950/90 border-emerald-400 text-emerald-200';
      } else if (lm.tipo === 'CAMPUS') {
        iconEmoji = '🎓';
        badgeBg = 'bg-indigo-950/90 border-indigo-400 text-indigo-200';
      } else if (lm.tipo === 'PLAZA') {
        iconEmoji = '🏛️';
        badgeBg = 'bg-amber-950/90 border-amber-400 text-amber-200';
      }

      const landmarkHtml = `
        <div class="px-2 py-0.5 rounded-md text-[10px] font-bold border shadow-lg flex items-center gap-1.5 ${badgeBg} whitespace-nowrap cursor-pointer hover:scale-110 transition-transform">
          <span>${iconEmoji}</span>
          <span class="font-extrabold">${lm.nombre}</span>
        </div>
      `;

      const icon = L.divIcon({
        html: landmarkHtml,
        className: 'custom-landmark-icon',
        iconSize: [120, 24],
        iconAnchor: [60, 12],
      });

      const marker = L.marker([lm.lat, lm.lng], { icon });
      marker.bindTooltip(
        `<div class="text-xs font-bold text-white bg-slate-950 p-2 rounded-lg border border-cyan-400 shadow-xl">
          <strong>${lm.nombre}</strong><br/>
          <span class="text-[10px] text-cyan-300">Punto Estratégico Municipal Oficial</span>
        </div>`,
        { sticky: true }
      );
      marker.on('click', () => {
        map.flyTo([lm.lat, lm.lng], 16, { duration: 1 });
      });

      vGroup.addLayer(marker);
    });
  }, []);

  // Render Capa de Calor (Heatmap con leaflet-heat), Puntos Reales de Atenciones y Patrulleros
  useEffect(() => {
    const map = mapInstanceRef.current;
    const group = layersGroupRef.current;
    if (!map || !group) return;

    // 1. Limpiar capa de calor previa si existe
    if (heatLayerRef.current) {
      try {
        map.removeLayer(heatLayerRef.current);
      } catch (e) {
        // ignore
      }
      heatLayerRef.current = null;
    }

    // 2. Limpiar capas dinámicas previas
    group.clearLayers();

    // 3. CAPA DE CALOR TÁCTICA (leaflet-heat)
    if (mapMode === 'HEAT' || mapMode === 'HYBRID') {
      const heatPoints = processIncidentsToHeatPoints(records);
      if (heatPoints.length > 0) {
        const heatData: [number, number, number][] = heatPoints.map((p) => [
          p.lat,
          p.lng,
          p.intensity,
        ]);

        const heatGradient: Record<number, string> = {
          0.2: '#0284c7', // Azul táctico
          0.4: '#10b981', // Verde
          0.6: '#eab308', // Amarillo
          0.8: '#f97316', // Naranja
          1.0: '#ef4444', // Rojo crítico
        };

        try {
          const heat = (L as any).heatLayer(heatData, {
            minOpacity: 0.35,
            maxZoom: 18,
            max: 1.0,
            radius: 28,
            blur: 18,
            gradient: heatGradient,
          });

          heat.addTo(map);
          heatLayerRef.current = heat;
        } catch (err) {
          console.error('Error al inicializar mapa de calor Leaflet:', err);
        }
      }
    }

    // 4. PUNTOS REALES DE ATENCIONES CON POPUPS DE DETALLE
    if (mapMode === 'CLUSTER' || mapMode === 'HYBRID') {
      const sampled = records.slice(0, 350);
      sampled.forEach((rec, idx) => {
        const meta = getIncidentCategoryMeta(rec.tipoIncidencia);
        const pinColor = meta.color;
        const point = geocodeIncident(rec, idx);
        const lugarDisplay = rec.columna1 || rec.lugar || point.lugar || 'Nuevo Chimbote';
        const observacionDisplay = rec.observacion || rec.descripcion || 'Sin observación adicional';

        const iconHtml = `
          <div style="background-color: ${pinColor}; box-shadow: 0 0 8px ${pinColor};" 
               class="w-3.5 h-3.5 rounded-full border-2 border-white flex items-center justify-center cursor-pointer transform hover:scale-150 transition-transform">
          </div>
        `;

        const customIcon = L.divIcon({
          html: iconHtml,
          className: 'custom-incident-pin',
          iconSize: [14, 14],
          iconAnchor: [7, 7],
        });

        const marker = L.marker([point.lat, point.lng], { icon: customIcon });

        // Tooltip dinámico con detalle completo al pasar el mouse
        marker.bindTooltip(
          `<div class="p-2.5 bg-slate-950/95 text-white rounded-lg border border-cyan-500 shadow-xl max-w-[280px] text-xs">
            <div class="flex items-center justify-between pb-1.5 border-b border-slate-700">
              <strong style="color: ${pinColor}" class="text-[11px] uppercase">${rec.tipoIncidencia}</strong>
              <span class="text-[9px] bg-slate-800 px-1.5 py-0.5 rounded text-cyan-300 font-mono">${rec.codigo || rec.id}</span>
            </div>
            <div class="mt-1.5 text-[11px] text-slate-200">
              <strong>📍 Ubicación:</strong> ${lugarDisplay}
            </div>
            <div class="mt-1 text-[10px] text-slate-300 italic bg-slate-900/80 p-1.5 rounded border border-slate-800">
              📝 ${observacionDisplay}
            </div>
            <div class="mt-1.5 pt-1 border-t border-slate-800 flex items-center justify-between text-[10px] text-amber-300">
              <span>⏰ ${rec.turno} - ${rec.hora || ''}</span>
              <span class="text-cyan-400 font-bold">${rec.comisaria}</span>
            </div>
          </div>`,
          { sticky: true, opacity: 0.98 }
        );

        marker.on('click', () => {
          setSelectedItem({ type: 'INCIDENT', data: rec });
          onSelectIncident?.(rec);
        });

        group.addLayer(marker);
      });
    }

    // 5. UNIDADES DE PATRULLAJE
    if (mapMode === 'UNITS' || mapMode === 'HYBRID') {
      patrolUnits.forEach((unit) => {
        const isPatrolling = unit.estado === 'PATRULLANDO';
        const unitColor = isPatrolling ? '#10b981' : unit.estado === 'EN ATENCION' ? '#f59e0b' : '#3b82f6';

        const unitHtml = `
          <div class="relative flex items-center justify-center cursor-pointer">
            <span class="animate-ping absolute inline-flex h-8 w-8 rounded-full opacity-70" style="background-color: ${unitColor}"></span>
            <div class="relative w-7 h-7 rounded-full border-2 border-white shadow-xl flex items-center justify-center text-white text-[10px] font-black" style="background-color: ${unitColor}">
              🚓
            </div>
            <div class="absolute -bottom-4 px-1 py-0.2 rounded bg-black/80 text-[8px] font-mono font-bold text-white border border-slate-700 whitespace-nowrap">
              ${unit.codigo}
            </div>
          </div>
        `;

        const unitIcon = L.divIcon({
          html: unitHtml,
          className: 'custom-patrol-pin',
          iconSize: [28, 28],
          iconAnchor: [14, 14],
        });

        const marker = L.marker([unit.lat, unit.lng], { icon: unitIcon });
        marker.on('click', () => {
          setSelectedItem({ type: 'UNIT', data: unit });
        });

        group.addLayer(marker);
      });
    }
  }, [records, patrolUnits, mapMode, onSelectIncident]);

  const handleFlyTo = (lat: number, lng: number, zoom = 15) => {
    mapInstanceRef.current?.flyTo([lat, lng], zoom, { duration: 1 });
  };

  // If user explicitly requests Google Maps API view (with fallback to Leaflet)
  if (mapEngine === 'GOOGLE_MAPS') {
    return (
      <div className="flex flex-col gap-2 w-full">
        <div className="flex items-center justify-between px-3 py-1.5 bg-[#0a1a36] rounded-xl border border-cyan-800/80 shadow">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-cyan-200">Motor de Mapa:</span>
            <div className="flex items-center bg-[#051120] p-0.5 rounded-lg border border-cyan-800">
              <button
                onClick={() => setMapEngine('GOOGLE_MAPS')}
                className="px-2.5 py-1 rounded text-xs font-bold bg-cyan-600 text-white shadow flex items-center gap-1.5"
              >
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                <span>Google Maps API Oficial</span>
              </button>
              <button
                onClick={() => setMapEngine('LEAFLET')}
                className="px-2.5 py-1 rounded text-xs font-bold text-slate-300 hover:text-white transition-colors"
              >
                Radar GIS Leaflet (Libre)
              </button>
            </div>
          </div>
          <button
            onClick={() => setMapEngine('LEAFLET')}
            className="text-xs text-cyan-400 hover:underline flex items-center gap-1 font-bold"
          >
            &larr; Cambiar a Radar GIS Leaflet
          </button>
        </div>
        <MapErrorBoundary
          fallbackTitle="Google Maps Platform en Pausa"
          onReset={() => setMapEngine('LEAFLET')}
        >
          <GoogleMapsTacticalView
            records={records}
            patrolUnits={patrolUnits}
            onSelectIncident={onSelectIncident}
            onDispatchUnit={onDispatchUnit}
            onSwitchToLeaflet={() => setMapEngine('LEAFLET')}
          />
        </MapErrorBoundary>
      </div>
    );
  }

  return (
    <div
      className={
        isFullScreen
          ? 'fixed inset-0 z-50 bg-[#07111e] flex flex-col p-2 sm:p-3 animate-fadeIn'
          : 'flex-1 flex flex-col min-w-0 bg-[#07111e] rounded-xl border border-cyan-500/30 shadow-2xl overflow-hidden text-white relative'
      }
    >
      {/* Top Map Control Toolbar */}
      <div className="px-3 py-2 bg-[#09172a]/95 backdrop-blur-md border-b border-cyan-900/60 flex flex-wrap items-center justify-between gap-2 z-10">
        <div className="flex items-center gap-2">
          <div className="p-1 rounded bg-rose-500/20 text-rose-400 border border-rose-500/40">
            <Flame className="w-4 h-4 animate-pulse" />
          </div>
          <div>
            <div className="text-xs font-black uppercase tracking-wider text-cyan-200 flex items-center gap-1.5">
              <EditableText
                idKey="map_tactical_title"
                defaultText="RADAR GEOESPACIAL & MAPA DE CALOR EN VIVO"
                className="text-xs font-black uppercase tracking-wider text-cyan-200"
              />
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
              {isFullScreen && (
                <span className="px-2 py-0.5 rounded bg-cyan-950 border border-cyan-500 text-[10px] font-mono text-cyan-300">
                  MODO PANTALLA COMPLETA
                </span>
              )}
            </div>
            <div className="text-[10px] text-slate-400">
              <EditableText
                idKey="map_tactical_subtitle"
                defaultText={`Coordenadas Jurisdiccionales de Nuevo Chimbote • ${records.length.toLocaleString()} Ocurrencias filtradas`}
                className="text-[10px] text-slate-400"
              />
            </div>
          </div>
        </div>

        {/* View mode toggle pills */}
        <div className="flex items-center gap-1 bg-[#050d18] p-1 rounded-lg border border-cyan-900/60">
          {(
            [
              { id: 'HYBRID', label: 'Híbrido', icon: <Layers className="w-3 h-3" /> },
              { id: 'HEAT', label: 'Focos de Calor', icon: <Flame className="w-3 h-3" /> },
              { id: 'UNITS', label: 'Patrulleros (7)', icon: <Car className="w-3 h-3" /> },
              { id: 'CLUSTER', label: 'Ocurrencias', icon: <MapPin className="w-3 h-3" /> },
            ] as const
          ).map((m) => (
            <button
              key={m.id}
              onClick={() => setMapMode(m.id)}
              className={`px-2.5 py-1 rounded text-xs font-bold transition-all flex items-center gap-1.5 ${
                mapMode === m.id
                  ? 'bg-gradient-to-r from-cyan-600 to-blue-600 text-white shadow-[0_0_8px_rgba(6,182,212,0.4)]'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              {m.icon}
              <span className="hidden sm:inline">{m.label}</span>
            </button>
          ))}
        </div>

        {/* Tile, Focus and Fullscreen Controls */}
        <div className="flex items-center gap-2">
          {/* Quick Focus Landmarks */}
          <div className="hidden lg:flex items-center gap-1">
            <button
              onClick={() => handleFlyTo(NCH_CENTER.lat, NCH_CENTER.lng, 15)}
              className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-[10px] font-bold text-slate-300"
            >
              Plaza Mayor
            </button>
            <button
              onClick={() => handleFlyTo(-9.138, -78.52, 15)}
              className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-[10px] font-bold text-slate-300"
            >
              Bellamar
            </button>
            <button
              onClick={() => handleFlyTo(-9.116, -78.535, 15)}
              className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-[10px] font-bold text-slate-300"
            >
              Villa María
            </button>
            <button
              onClick={() => handleFlyTo(NCH_CENTER.lat, NCH_CENTER.lng, 13)}
              className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-cyan-400"
              title="Centrar Todo Nuevo Chimbote"
            >
              <Crosshair className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Motor Selector to Google Maps */}
          <button
            onClick={() => setMapEngine('GOOGLE_MAPS')}
            className="px-2.5 py-1 rounded bg-[#0f3460] hover:bg-[#164882] border border-cyan-500/70 text-cyan-200 text-xs font-bold flex items-center gap-1.5 shadow transition-colors"
            title="Activar Google Maps Platform Oficial con API Key"
          >
            <MapPin className="w-3.5 h-3.5 text-cyan-300" />
            <span>Google Maps Oficial</span>
          </button>

          {/* Style selector */}
          <select
            value={mapStyle}
            onChange={(e) => setMapStyle(e.target.value as any)}
            className="bg-[#050d18] border border-cyan-800 rounded px-2 py-0.5 text-xs text-cyan-300 font-bold focus:outline-none cursor-pointer"
          >
            <option value="STREET">Calles y Avenidas (OpenStreetMap - Sin Clave)</option>
            <option value="SATELLITE">Vista Satelital HD (Esri World)</option>
            <option value="DARK">Nocturno Táctico (OSM Alto Contraste)</option>
          </select>

          {/* Fullscreen Button */}
          <button
            type="button"
            id="btn-header-fullscreen-map"
            onClick={() => setIsFullScreen((prev) => !prev)}
            className="px-2.5 py-1 rounded bg-[#0b2447] hover:bg-[#123668] border border-cyan-500/60 text-cyan-200 text-xs font-bold flex items-center gap-1.5 transition-colors shadow-sm"
            title={isFullScreen ? 'Reducir tamaño (ESC)' : 'Ampliar mapa a pantalla completa'}
          >
            {isFullScreen ? (
              <>
                <Minimize2 className="w-3.5 h-3.5 text-amber-300" />
                <span className="hidden sm:inline">Salir Pantalla Completa</span>
              </>
            ) : (
              <>
                <Maximize2 className="w-3.5 h-3.5 text-cyan-300" />
                <span className="hidden sm:inline">Ampliar Mapa</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Map Canvas */}
      <div className="flex-1 w-full min-h-[500px] relative bg-[#071324] tactical-grid-bg">
        <div
          ref={mapContainerRef}
          className={`w-full h-full z-0 tactical-grid-bg ${
            mapStyle === 'DARK' ? 'dark-tactical-tiles' : mapStyle === 'SATELLITE' ? 'satellite-tiles' : ''
          }`}
        />

        {/* Floating Action Button (FAB) to Expand / Minimize Map View */}
        <button
          type="button"
          id="fab-fullscreen-map"
          onClick={() => setIsFullScreen((prev) => !prev)}
          className="absolute bottom-4 right-4 z-20 px-3.5 py-2 rounded-xl bg-gradient-to-r from-blue-700 via-cyan-600 to-teal-600 hover:from-blue-600 hover:to-cyan-500 text-white font-black text-xs uppercase tracking-wider flex items-center gap-2 shadow-[0_0_20px_rgba(6,182,212,0.5)] border-2 border-cyan-300/80 transition-all hover:scale-105 active:scale-95 group"
          title={isFullScreen ? 'Salir de pantalla completa (ESC)' : 'Ampliar vista del mapa de calor a pantalla completa'}
        >
          {isFullScreen ? (
            <>
              <Minimize2 className="w-4 h-4 text-amber-300 group-hover:rotate-90 transition-transform" />
              <span>Reducir Mapa</span>
            </>
          ) : (
            <>
              <Maximize2 className="w-4 h-4 text-cyan-200 group-hover:scale-125 transition-transform" />
              <span>Ampliar Mapa (Monitoreo)</span>
            </>
          )}
        </button>

        {/* Floating Interactive Legend */}
        <div className="absolute top-3 left-3 z-10 bg-[#061120]/90 backdrop-blur-md p-2.5 rounded-xl border border-cyan-800/60 shadow-2xl text-xs space-y-1.5 max-w-[210px]">
          <div className="text-[10px] font-black uppercase text-cyan-300 tracking-wider flex items-center gap-1.5">
            <Flame className="w-3.5 h-3.5 text-rose-400" />
            <span>REFERENCIAS TÁCTICAS</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-gradient-to-r from-cyan-500 via-amber-400 to-rose-500 shadow-sm"></span>
            <span className="text-[11px] text-slate-300">Mancha Térmica (Calor)</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500 border border-white"></span>
            <span className="text-[11px] text-slate-300">Punto de Atención Real</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs">🛡️</span>
            <span className="text-[11px] text-cyan-200">Bases Serenazgo</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs">👮</span>
            <span className="text-[11px] text-blue-200">Comisarías PNP</span>
          </div>
          <div className="flex items-center gap-2 pt-1 border-t border-slate-700">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping"></span>
            <span className="text-[11px] text-emerald-300 font-bold">Unidad Patrullero</span>
          </div>
        </div>

        {/* Selected Item Drawer Card */}
        {selectedItem && (
          <div className="absolute bottom-4 right-4 z-20 w-80 sm:w-96 bg-[#081528]/95 backdrop-blur-md border border-cyan-400/60 rounded-xl p-4 shadow-2xl animate-fade-in text-white">
            <div className="flex items-start justify-between border-b border-cyan-900/60 pb-2 mb-2">
              <div className="flex items-center gap-2">
                {selectedItem.type === 'INCIDENT' ? (
                  <div className="p-1.5 rounded-lg bg-rose-950 text-rose-400 border border-rose-600/40">
                    <Flame className="w-4 h-4" />
                  </div>
                ) : (
                  <div className="p-1.5 rounded-lg bg-emerald-950 text-emerald-400 border border-emerald-600/40">
                    <Car className="w-4 h-4" />
                  </div>
                )}
                <div>
                  <h4 className="text-xs font-black uppercase text-white">
                    {selectedItem.type === 'INCIDENT'
                      ? (selectedItem.data as IncidentRecord).tipoIncidencia
                      : (selectedItem.data as PatrolUnit).codigo}
                  </h4>
                  <p className="text-[10px] text-cyan-300">
                    {selectedItem.type === 'INCIDENT'
                      ? (selectedItem.data as IncidentRecord).codigo
                      : (selectedItem.data as PatrolUnit).placa}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedItem(null)}
                className="text-slate-400 hover:text-white p-1 text-xs font-bold"
              >
                ✕
              </button>
            </div>

            {selectedItem.type === 'INCIDENT' ? (
              <div className="space-y-2 text-xs">
                {(() => {
                  const inc = selectedItem.data as IncidentRecord;
                  return (
                    <>
                      <div className="flex items-center gap-1.5 text-slate-300">
                        <MapPin className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                        <span className="font-bold text-white">{inc.columna1 || inc.lugar || inc.ubicacion}</span>
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-[11px] bg-[#050e1a] p-2 rounded border border-cyan-900/40">
                        <div>
                          <span className="text-slate-400">Cuadrante:</span>{' '}
                          <strong className="text-cyan-300">{inc.subsector}</strong>
                        </div>
                        <div>
                          <span className="text-slate-400">Turno:</span>{' '}
                          <strong className="text-amber-300">{inc.turno}</strong>
                        </div>
                        <div>
                          <span className="text-slate-400">Comisaría:</span>{' '}
                          <strong className="text-blue-300">{inc.comisaria}</strong>
                        </div>
                        <div>
                          <span className="text-slate-400">Fecha/Hora:</span>{' '}
                          <strong className="text-white">{inc.fecha} {inc.hora}</strong>
                        </div>
                      </div>
                      <div className="bg-[#050e1a] p-2 rounded border border-cyan-950 space-y-1">
                        <div className="text-[10px] text-cyan-400 font-bold uppercase tracking-wider">
                          Observación Operativa:
                        </div>
                        <p className="text-[11px] text-slate-200 leading-relaxed italic">
                          {inc.observacion || inc.descripcion || 'Sin observaciones registradas'}
                        </p>
                      </div>
                      <div className="flex items-center justify-between pt-1">
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-950 text-emerald-300 border border-emerald-600/40">
                          {inc.estado}
                        </span>
                        <button
                          onClick={() => {
                            onDispatchUnit?.('U-01', inc.ubicacion);
                            setSelectedItem(null);
                          }}
                          className="px-3 py-1 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white rounded text-xs font-bold"
                        >
                          Despachar Móvil
                        </button>
                      </div>
                    </>
                  );
                })()}
              </div>
            ) : (
              <div className="space-y-2 text-xs">
                {(() => {
                  const unit = selectedItem.data as PatrolUnit;
                  return (
                    <>
                      <div className="grid grid-cols-2 gap-2 text-[11px] bg-[#050e1a] p-2 rounded border border-cyan-900/40">
                        <div>
                          <span className="text-slate-400">Estado:</span>{' '}
                          <strong className="text-emerald-300">{unit.estado}</strong>
                        </div>
                        <div>
                          <span className="text-slate-400">Cuadrante:</span>{' '}
                          <strong className="text-cyan-300">{unit.subsectorActual}</strong>
                        </div>
                        <div>
                          <span className="text-slate-400">Personal:</span>{' '}
                          <strong className="text-white">{unit.efectivoCargo}</strong>
                        </div>
                        <div>
                          <span className="text-slate-400">Última Señal:</span>{' '}
                          <strong className="text-slate-300">{unit.ultimaActualizacion}</strong>
                        </div>
                      </div>
                      {radioStatus ? (
                        <div className="p-2 rounded bg-emerald-950 text-emerald-300 border border-emerald-500 text-xs font-mono text-center">
                          {radioStatus}
                        </div>
                      ) : (
                        <button
                          onClick={() => {
                            setRadioStatus(`Canal radial abierto con ${unit.codigo} (${unit.efectivoCargo || 'Unidad'}) - 156.800 MHz`);
                            setTimeout(() => setRadioStatus(null), 4000);
                          }}
                          className="w-full py-1.5 rounded bg-blue-700 hover:bg-blue-600 text-white font-bold text-xs flex items-center justify-center gap-1.5"
                        >
                          <Radio className="w-3.5 h-3.5" />
                          <span>Abrir Canal Radial de Operaciones</span>
                        </button>
                      )}
                    </>
                  );
                })()}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
