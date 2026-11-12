import React, { useState, useMemo, useEffect, useRef } from 'react';
import {
  Shield,
  Printer,
  Search,
  Radio,
  Lock,
  Crosshair,
  Settings,
  Wifi,
  CheckSquare,
  Square,
  Layers,
  X,
  Compass
} from 'lucide-react';
import { IncidentRecord } from '../types';

interface AnalyticsDashboardViewProps {
  records: IncidentRecord[];
  onSelectSubsector?: (code: string) => void;
  onFilterZona?: (zona: string) => void;
  onFilterTurno?: (turno: string) => void;
}

const cleanText = (val: any): string => {
  if (val === null || val === undefined) return '';
  return String(val).trim().replace(/\s+/g, ' ').toUpperCase();
};

const getUrbanizacion = (r: any): string => {
  const raw = r.urbanizacion || r.lugar || r.ubicacion || r.zona || r.sector;
  const cleaned = cleanText(raw);
  return cleaned && cleaned !== 'N/A' && cleaned !== 'NULL' ? cleaned : '';
};

const getModalidad = (r: any): string => {
  const raw =
    r.tipoIncidencia ||
    r.tipo_incidencia ||
    r.modalidad ||
    r.subtipo ||
    r.incidencia ||
    r.tipo;
  const cleaned = cleanText(raw);
  return cleaned && cleaned !== 'N/A' && cleaned !== 'NULL' ? cleaned : 'SIN CLASIFICAR';
};

const getVehiculo = (r: any): string => {
  const raw =
    r.unidadMovil ||
    r.unidad_movil ||
    r.vehiculo ||
    r.movil ||
    r.patrulla ||
    r.unidad;
  const cleaned = cleanText(raw);
  if (!cleaned || ['N/A', 'NINGUNO', 'NULL', '-', 'SIN MOVIL', 'SIN UNIDAD'].includes(cleaned)) {
    return 'PATRULLAJE A PIE';
  }
  return cleaned;
};

const getAgente = (r: any): string => {
  const raw = r.efectivo || r.agente_responsable || r.agente || r.personal || r.sereno;
  const cleaned = cleanText(raw);
  if (!cleaned || ['N/A', 'NULL', '-'].includes(cleaned)) return 'SIN ASIGNAR';
  return cleaned;
};

const getTurno = (r: any): string => {
  const t = cleanText(r.turno);
  if (t.includes('MAÑANA') || t.includes('MANANA')) return 'MAÑANA';
  if (t.includes('TARDE')) return 'TARDE';
  if (t.includes('NOCHE')) return 'NOCHE';
  return 'NO REGISTRADO';
};

// Coordenadas base de sectores conocidos de Nuevo Chimbote para centrar el mapa 3D
const SECTOR_COORDS: Record<string, [number, number]> = {
  CASUARINAS: [-78.5238, -9.1312],
  'BUENOS AIRES': [-78.5325, -9.1245],
  BELLAMAR: [-78.5278, -9.1195],
  GARATEA: [-78.5155, -9.1290],
  BRISAS: [-78.5360, -9.1335],
  PRADERA: [-78.5180, -9.1365],
  BRUCE: [-78.5290, -9.1280],
  PACIFICO: [-78.5340, -9.1210],
  'LOS HEROES': [-78.5195, -9.1235],
  '3 DE OCTUBRE': [-78.5130, -9.1340],
  '03 DE OCTUBRE': [-78.5130, -9.1340],
  '1 DE MAYO': [-78.5390, -9.1260],
  '1° DE MAYO': [-78.5390, -9.1260],
  'VILLA MARIA': [-78.5430, -9.1160],
  'SAN LUIS': [-78.5210, -9.1180]
};

const getSectorCenter = (title: string): [number, number] => {
  const upper = cleanText(title);
  for (const [key, coords] of Object.entries(SECTOR_COORDS)) {
    if (upper.includes(key)) return coords;
  }
  // Centro táctico por defecto: Plaza Mayor / Casuarinas - Nuevo Chimbote
  return [-78.5265, -9.1265];
};

export const AnalyticsDashboardView: React.FC<AnalyticsDashboardViewProps> = ({
  records = [],
  onFilterZona,
  onFilterTurno
}) => {
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [selectedUrbs, setSelectedUrbs] = useState<string[]>([]);
  const [selectedTurno, setSelectedTurno] = useState<string>('TODOS');
  const [minCasosFilter, setMinCasosFilter] = useState<number>(0);

  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapInstanceRef = useRef<any>(null);
  const markersRef = useRef<any[]>([]);
  const [mapReady, setMapReady] = useState<boolean>(false);

  // 1. Urbanizaciones únicas y limpias
  const urbanizaciones = useMemo(() => {
    const map = new Map<string, number>();
    records.forEach((r) => {
      const urb = getUrbanizacion(r);
      if (urb) {
        map.set(urb, (map.get(urb) || 0) + 1);
      }
    });
    return Array.from(map.entries())
      .map(([nombre, count]) => ({ nombre, count }))
      .sort((a, b) => b.count - a.count);
  }, [records]);

  const activeUrbsList = useMemo(() => {
    if (selectedUrbs.length > 0) return selectedUrbs;
    const defaultCasuarinas = urbanizaciones.find((u) => u.nombre.includes('CASUARINAS'));
    if (defaultCasuarinas) return [defaultCasuarinas.nombre];
    return urbanizaciones[0] ? [urbanizaciones[0].nombre] : [];
  }, [selectedUrbs, urbanizaciones]);

  const activeTitle = useMemo(() => {
    if (activeUrbsList.length === 0) return 'TODOS LOS SECTORES';
    if (activeUrbsList.length === 1) return activeUrbsList[0];
    return `GRUPO CONSOLIDADO (${activeUrbsList.length} SECTORES)`;
  }, [activeUrbsList]);

  const filteredUrbanizaciones = useMemo(() => {
    return urbanizaciones.filter((u) => {
      const matchSearch = !searchTerm.trim() || u.nombre.includes(cleanText(searchTerm));
      const matchMin = u.count >= minCasosFilter;
      return matchSearch && matchMin;
    });
  }, [urbanizaciones, searchTerm, minCasosFilter]);

  const toggleUrbSelection = (urbName: string) => {
    setSelectedUrbs((prev) => {
      const current = prev.length > 0 ? prev : activeUrbsList;
      if (current.includes(urbName)) {
        const next = current.filter((item) => item !== urbName);
        return next.length > 0 ? next : [urbName];
      } else {
        const next = [...current, urbName];
        if (onFilterZona) onFilterZona(next.join(', '));
        return next;
      }
    });
  };

  const selectSingleUrb = (urbName: string) => {
    setSelectedUrbs([urbName]);
    if (onFilterZona) onFilterZona(urbName);
  };

  const selectAllFiltered = () => {
    const allNames = filteredUrbanizaciones.map((u) => u.nombre);
    if (allNames.length > 0) {
      setSelectedUrbs(allNames);
    }
  };

  // 2. Registros filtrados sumando los lugares agrupados
  const recordsInScope = useMemo(() => {
    return records.filter((r) => {
      const urb = getUrbanizacion(r);
      const matchUrb = activeUrbsList.length === 0 || activeUrbsList.includes(urb);
      const turno = getTurno(r);
      const matchTurno = selectedTurno === 'TODOS' || turno === selectedTurno;
      return matchUrb && matchTurno;
    });
  }, [records, activeUrbsList, selectedTurno]);

  // 3. Telemetría HUD
  const hudData = useMemo(() => {
    const total = recordsInScope.length;
    const vehiculos: Record<string, number> = {};
    const agentes: Record<string, number> = {};
    const turnosCount: Record<string, number> = { MAÑANA: 0, TARDE: 0, NOCHE: 0 };

    recordsInScope.forEach((r) => {
      const v = getVehiculo(r);
      vehiculos[v] = (vehiculos[v] || 0) + 1;

      const a = getAgente(r);
      if (a !== 'SIN ASIGNAR') {
        agentes[a] = (agentes[a] || 0) + 1;
      }

      const t = getTurno(r);
      if (turnosCount[t] !== undefined) {
        turnosCount[t]++;
      }
    });

    const vehiculosOrdenados = Object.entries(vehiculos).sort((a, b) => b[1] - a[1]);
    const movilesReales = vehiculosOrdenados.filter(([nombre]) => nombre !== 'PATRULLAJE A PIE');
    const topVehiculo = movilesReales[0] || vehiculosOrdenados[0] || ['CAM-04', 0];
    const unidadesActivasCount = movilesReales.length || vehiculosOrdenados.length;

    const topAgente = Object.entries(agentes).sort((a, b) => b[1] - a[1])[0] || ['CENTRAL C2', 0];
    const topTurno = Object.entries(turnosCount).sort((a, b) => b[1] - a[1])[0] || ['MAÑANA', 0];
    const topTurnoPct = total > 0 ? Math.round((topTurno[1] / total) * 100) : 0;

    const totalTurnos = turnosCount.MAÑANA + turnosCount.TARDE + turnosCount.NOCHE || 1;
    const pctManana = Math.round((turnosCount.MAÑANA / totalTurnos) * 100);
    const pctTarde = Math.round((turnosCount.TARDE / totalTurnos) * 100);
    const pctNoche = Math.max(0, 100 - pctManana - pctTarde);

    const maxFlota = vehiculosOrdenados[0]?.[1] || 1;
    const flotaList = vehiculosOrdenados.slice(0, 5).map(([unidad, casos]) => ({
      unidad,
      casos,
      pct: Math.round((casos / maxFlota) * 100)
    }));

    return {
      total,
      unidadesActivasCount,
      topVehiculo: topVehiculo[0],
      topVehiculoCount: topVehiculo[1],
      topAgente: topAgente[0],
      topTurno: topTurno[0],
      topTurnoPct,
      turnosCount,
      pctManana,
      pctTarde,
      pctNoche,
      flotaList
    };
  }, [recordsInScope]);

  // 4. Matriz de Frecuencia
  const frecuenciaModalidades = useMemo(() => {
    const counts: Record<string, number> = {};
    recordsInScope.forEach((r) => {
      const mod = getModalidad(r);
      counts[mod] = (counts[mod] || 0) + 1;
    });

    const total = recordsInScope.length || 1;
    return Object.entries(counts)
      .map(([modalidad, count]) => ({
        modalidad,
        count,
        porcentaje: Number(((count / total) * 100).toFixed(1))
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 8);
  }, [recordsInScope]);

  // 5. Inicialización de API MapLibre GL JS 3D (Edificios Extruidos + Modo Oscuro Táctico)
  useEffect(() => {
    let isMounted = true;

    const loadMapLibre = async () => {
      if (!document.getElementById('maplibre-gl-css')) {
        const link = document.createElement('link');
        link.id = 'maplibre-gl-css';
        link.rel = 'stylesheet';
        link.href = 'https://unpkg.com/maplibre-gl@4.7.1/dist/maplibre-gl.css';
        document.head.appendChild(link);
      }

      if (!(window as any).maplibregl) {
        await new Promise<void>((resolve, reject) => {
          const script = document.createElement('script');
          script.src = 'https://unpkg.com/maplibre-gl@4.7.1/dist/maplibre-gl.js';
          script.async = true;
          script.onload = () => resolve();
          script.onerror = () => reject(new Error('No se pudo cargar MapLibre GL'));
          document.head.appendChild(script);
        });
      }

      if (!isMounted || !mapContainerRef.current || mapInstanceRef.current) return;
      const maplibregl = (window as any).maplibregl;
      const center = getSectorCenter(activeTitle);

      const map = new maplibregl.Map({
        container: mapContainerRef.current,
        style: 'https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json',
        center,
        zoom: 15.4,
        pitch: 62,
        bearing: -24,
        antialias: true
      });

      map.addControl(new maplibregl.NavigationControl({ visualizePitch: true }), 'top-right');

      map.on('load', () => {
        if (!isMounted) return;
        // Agregar fuente vectorial de OpenFreeMap para edificios 3D reales
        if (!map.getSource('openmaptiles-3d')) {
          map.addSource('openmaptiles-3d', {
            type: 'vector',
            url: 'https://tiles.openfreemap.org/planet'
          });

          map.addLayer({
            id: '3d-buildings-hud',
            source: 'openmaptiles-3d',
            'source-layer': 'building',
            type: 'fill-extrusion',
            minzoom: 14,
            paint: {
              'fill-extrusion-color': [
                'interpolate',
                ['linear'],
                ['get', 'render_height'],
                0,
                '#082f49',
                20,
                '#0e7490',
                50,
                '#22d3ee'
              ],
              'fill-extrusion-height': ['coalesce', ['get', 'render_height'], 8],
              'fill-extrusion-base': ['coalesce', ['get', 'render_min_height'], 0],
              'fill-extrusion-opacity': 0.72
            }
          });
        }
        setMapReady(true);
      });

      mapInstanceRef.current = map;
    };

    loadMapLibre().catch((err) => console.warn('Aviso cargando mapa 3D:', err));

    return () => {
      isMounted = false;
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  // 6. Actualizar vuelo 3D y puntos de calor pulsantes cuando cambia el sector o los datos
  useEffect(() => {
    const map = mapInstanceRef.current;
    const maplibregl = (window as any).maplibregl;
    if (!map || !maplibregl) return;

    const [lng, lat] = getSectorCenter(activeTitle);
    map.flyTo({
      center: [lng, lat],
      zoom: 15.6,
      pitch: 62,
      bearing: -24,
      speed: 1.4
    });

    // Limpiar marcadores previos
    markersRef.current.forEach((m) => m.remove());
    markersRef.current = [];

    // Crear puntos de calor y etiquetas tácticas sobre las manzanas del sector
    const count = Math.min(Math.max(recordsInScope.length, 3), 12);
    for (let i = 0; i < count; i++) {
      const r: any = recordsInScope[i] || {};
      const parsedLat = parseFloat(r.lat || r.latitud);
      const parsedLng = parseFloat(r.lng || r.longitud);

      const offsetLng = !isNaN(parsedLng) ? parsedLng : lng + Math.sin(i * 1.7) * 0.0028;
      const offsetLat = !isNaN(parsedLat) ? parsedLat : lat + Math.cos(i * 1.9) * 0.0022;

      const el = document.createElement('div');
      const color = i % 3 === 0 ? '#f43f5e' : i % 3 === 1 ? '#f59e0b' : '#22d3ee';
      el.innerHTML = `
        <div style="position:relative;display:flex;align-items:center;justify-content:center;width:22px;height:22px;">
          <span style="position:absolute;width:22px;height:22px;border-radius:9999px;background:${color};opacity:0.35;animation:ping 1.8s cubic-bezier(0,0,0.2,1) infinite;"></span>
          <span style="width:9px;height:9px;border-radius:9999px;background:${color};box-shadow:0 0 10px ${color};border:1.5px solid #fff;"></span>
        </div>
      `;

      const marker = new maplibregl.Marker({ element: el })
        .setLngLat([offsetLng, offsetLat])
        .addTo(map);
      markersRef.current.push(marker);
    }
  }, [activeTitle, recordsInScope, mapReady]);

  const handleTurnoClick = (turno: string) => {
    const next = selectedTurno === turno ? 'TODOS' : turno;
    setSelectedTurno(next);
    if (onFilterTurno) onFilterTurno(next);
  };

  const c1 = 2 * Math.PI * 44;
  const c2 = 2 * Math.PI * 33;
  const c3 = 2 * Math.PI * 22;

  return (
    <div className="min-h-screen bg-[#020710] text-cyan-50 font-sans p-2 sm:p-4 relative overflow-hidden select-none">
      {/* Iluminación Volumétrica Holográfica */}
      <div className="fixed inset-0 bg-[radial-gradient(ellipse_at_top,rgba(6,182,212,0.22),transparent_60%)] pointer-events-none" />
      <div className="fixed inset-0 bg-[linear-gradient(to_right,rgba(34,211,238,0.06)_1px,transparent_1px),linear-gradient(to_bottom,rgba(34,211,238,0.06)_1px,transparent_1px)] bg-[size:2.2rem_2.2rem] pointer-events-none" />

      {/* CHASIS PRINCIPAL HOLOGRÁFICO */}
      <div className="relative z-10 max-w-[1720px] mx-auto border border-cyan-400/50 rounded-2xl bg-[#040d1c]/90 backdrop-blur-2xl shadow-[0_0_60px_rgba(6,182,212,0.25),inset_0_0_50px_rgba(6,182,212,0.08)] p-3 sm:p-4">
        <div className="absolute -top-[2px] -left-[2px] w-10 h-10 border-t-4 border-l-4 border-cyan-300 rounded-tl-2xl pointer-events-none shadow-[-4px_-4px_15px_rgba(34,211,238,0.6)]" />
        <div className="absolute -top-[2px] -right-[2px] w-10 h-10 border-t-4 border-r-4 border-cyan-300 rounded-tr-2xl pointer-events-none shadow-[4px_-4px_15px_rgba(34,211,238,0.6)]" />
        <div className="absolute -bottom-[2px] -left-[2px] w-10 h-10 border-b-4 border-l-4 border-cyan-300 rounded-bl-2xl pointer-events-none" />
        <div className="absolute -bottom-[2px] -right-[2px] w-10 h-10 border-b-4 border-r-4 border-cyan-300 rounded-br-2xl pointer-events-none" />

        {/* HEADER SUPERIOR TÁCTICO */}
        <header className="flex flex-col lg:flex-row items-center justify-between gap-3 pb-3 mb-4 border-b border-cyan-500/30">
          <div className="flex items-center gap-3 w-full lg:w-auto">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-cyan-500/30 to-blue-900/50 border border-cyan-300 flex items-center justify-center shadow-[0_0_25px_rgba(34,211,238,0.5)] shrink-0">
              <Shield className="w-7 h-7 text-cyan-200" />
            </div>
            <div className="border border-cyan-400/40 bg-[#06162d]/90 rounded-lg px-3 py-1.5 flex items-center gap-4 shadow-[inset_0_0_15px_rgba(6,182,212,0.15)]">
              <div>
                <span className="text-[9px] font-mono text-cyan-400 tracking-widest block">TELEMETRÍA</span>
                <span className="text-xs font-mono font-bold text-emerald-400 flex items-center gap-1">
                  <Wifi className="w-3 h-3 animate-pulse" /> {records.length.toLocaleString()} REG
                </span>
              </div>
              <Settings className="w-5 h-5 text-cyan-300 animate-spin" style={{ animationDuration: '12s' }} />
            </div>
          </div>

          <div className="flex-1 max-w-3xl w-full bg-gradient-to-r from-cyan-950 via-cyan-700/30 to-cyan-950 border-y-2 border-x border-cyan-400/80 rounded-xl px-5 py-2.5 text-center shadow-[0_0_30px_rgba(6,182,212,0.35)]">
            <h1 className="text-sm sm:text-lg md:text-xl font-black tracking-[0.14em] text-white uppercase drop-shadow-[0_0_10px_rgba(34,211,238,0.9)]">
              SISTEMA DE SEGURIDAD CIUDADANA Y CIBER-MONITOREO - SERENAZGO
            </h1>
            <div className="flex flex-wrap items-center justify-center gap-3 text-[10px] font-mono text-cyan-200 mt-0.5">
              <span className="bg-cyan-500/20 px-2 py-0.5 rounded border border-cyan-400/40">
                OBJETIVO: {activeTitle}
              </span>
              <span>•</span>
              <span>TURNO: {selectedTurno}</span>
            </div>
          </div>

          <div className="flex items-center gap-2.5 w-full lg:w-auto justify-end">
            <div className="hidden sm:flex items-center gap-2 border border-cyan-400/40 bg-[#06162d]/90 rounded-lg px-3 py-1.5">
              <Lock className="w-4 h-4 text-emerald-400" />
              <div className="text-[9px] font-mono leading-tight">
                <span className="text-cyan-400 block">ENLACE SEGURO</span>
                <span className="text-emerald-300 font-bold">SUPABASE LIVE</span>
              </div>
            </div>

            <button
              onClick={() => window.print()}
              className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-cyan-500/30 to-emerald-500/30 hover:from-cyan-400/40 hover:to-emerald-400/40 border border-cyan-300 rounded-lg text-white text-xs font-mono font-black uppercase tracking-wider shadow-[0_0_20px_rgba(34,211,238,0.45)] cursor-pointer transition"
            >
              <Printer className="w-4 h-4 text-cyan-200" />
              <span>EXPORTAR FICHA</span>
            </button>
          </div>
        </header>

        {/* GRID PRINCIPAL DE 3 COLUMNAS */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
          {/* ================= COLUMNA 1: SECTORIZACIÓN MULTI-SELECCIÓN (3 COLS) ================= */}
          <aside className="lg:col-span-3 flex flex-col gap-4">
            <div className="border border-cyan-400/50 bg-[#051326]/95 rounded-xl p-3.5 shadow-[inset_0_0_25px_rgba(6,182,212,0.12)] relative">
              <div className="flex items-center justify-between mb-2">
                <h2 className="text-xs font-mono font-black tracking-wider text-cyan-300 uppercase flex items-center gap-1.5">
                  <Layers className="w-3.5 h-3.5 text-emerald-400" />
                  SECTORIZACIÓN / AGRUPAR
                </h2>
                <span className="text-[10px] font-mono text-emerald-300 bg-emerald-950 px-2 py-0.5 rounded border border-emerald-500/40 font-bold">
                  {activeUrbsList.length} MARCADO{activeUrbsList.length > 1 ? 'S' : ''}
                </span>
              </div>

              {/* Buscador HUD */}
              <div className="relative mb-2">
                <Search className="w-3.5 h-3.5 text-cyan-300 absolute left-2.5 top-2.5" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Ej: CASUARINAS, BRISAS..."
                  className="w-full bg-[#020813] border border-cyan-400/50 focus:border-emerald-400 rounded-lg pl-8 pr-7 py-1.5 text-xs font-mono text-white placeholder-cyan-700 focus:outline-none shadow-[inset_0_0_10px_rgba(6,182,212,0.15)]"
                />
                {searchTerm && (
                  <button
                    onClick={() => setSearchTerm('')}
                    className="absolute right-2 top-2 text-cyan-400 hover:text-white cursor-pointer"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {searchTerm.trim() !== '' && filteredUrbanizaciones.length > 1 && (
                <button
                  onClick={selectAllFiltered}
                  className="w-full mb-2 py-1.5 px-2.5 rounded-lg bg-gradient-to-r from-emerald-600/40 to-cyan-600/40 hover:from-emerald-500/50 hover:to-cyan-500/50 border border-emerald-400 text-[10px] font-mono font-black text-emerald-200 uppercase tracking-wider flex items-center justify-center gap-1.5 shadow-[0_0_15px_rgba(16,185,129,0.3)] cursor-pointer transition"
                >
                  <CheckSquare className="w-3.5 h-3.5" />
                  AGRUPAR TODOS LOS "{searchTerm.toUpperCase()}" ({filteredUrbanizaciones.length})
                </button>
              )}

              {activeUrbsList.length > 1 && (
                <div className="mb-2 p-2 rounded-lg bg-cyan-950/60 border border-cyan-500/40">
                  <div className="flex items-center justify-between text-[9px] font-mono text-cyan-300 mb-1">
                    <span>SECTORES UNIFICADOS EN REPORTE:</span>
                    <button
                      onClick={() => selectSingleUrb(activeUrbsList[0])}
                      className="text-amber-300 underline cursor-pointer"
                    >
                      LIMPIAR
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-1 max-h-14 overflow-y-auto">
                    {activeUrbsList.map((name) => (
                      <span
                        key={name}
                        onClick={() => toggleUrbSelection(name)}
                        className="text-[9px] font-mono bg-emerald-500/20 border border-emerald-400/50 text-emerald-200 px-1.5 py-0.5 rounded cursor-pointer hover:bg-rose-500/30 hover:border-rose-400"
                        title="Clic para quitar del grupo"
                      >
                        {name} ×
                      </span>
                    ))}
                  </div>
                </div>
              )}

              <div className="space-y-1.5 max-h-[240px] overflow-y-auto pr-1">
                {filteredUrbanizaciones.map((urb) => {
                  const isChecked = activeUrbsList.includes(urb.nombre);
                  return (
                    <div
                      key={urb.nombre}
                      className={`w-full px-2.5 py-2 rounded-lg text-xs font-mono flex items-center justify-between transition-all border ${
                        isChecked
                          ? 'bg-gradient-to-r from-emerald-500/30 via-cyan-500/25 to-blue-900/40 border-emerald-400 text-white font-black shadow-[0_0_18px_rgba(16,185,129,0.4)]'
                          : 'bg-[#071930]/80 border-cyan-500/25 text-cyan-200/80 hover:border-cyan-400/70 hover:text-white'
                      }`}
                    >
                      <button
                        onClick={() => toggleUrbSelection(urb.nombre)}
                        className="flex items-center gap-2 min-w-0 flex-1 text-left cursor-pointer"
                        title="Marcar / Desmarcar para agrupar"
                      >
                        {isChecked ? (
                          <CheckSquare className="w-4 h-4 text-emerald-300 shrink-0" />
                        ) : (
                          <Square className="w-4 h-4 text-cyan-500/70 shrink-0" />
                        )}
                        <span className="truncate pr-1">{urb.nombre}</span>
                      </button>

                      <button
                        onClick={() => selectSingleUrb(urb.nombre)}
                        title="Ver solo este sector"
                        className={`text-[10px] px-2 py-0.5 rounded cursor-pointer shrink-0 ${
                          isChecked
                            ? 'bg-emerald-400 text-slate-950 font-black'
                            : 'bg-slate-950 text-cyan-300 border border-cyan-500/30 hover:bg-cyan-500 hover:text-slate-950'
                        }`}
                      >
                        {urb.count}
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Rango de Turnos con 3 Diales Holográficos */}
            <div className="border border-cyan-400/50 bg-[#051326]/95 rounded-xl p-3.5 shadow-[inset_0_0_20px_rgba(6,182,212,0.1)]">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-xs font-mono font-black tracking-wider text-cyan-300 uppercase">
                  RANGO DE TURNOS
                </h3>
                {selectedTurno !== 'TODOS' && (
                  <button
                    onClick={() => handleTurnoClick(selectedTurno)}
                    className="text-[10px] font-mono text-amber-300 underline cursor-pointer"
                  >
                    TODOS
                  </button>
                )}
              </div>

              <div className="grid grid-cols-3 gap-2 text-center">
                {[
                  { label: 'MAÑANA', pct: hudData.pctManana, color: '#10b981' },
                  { label: 'TARDE', pct: hudData.pctTarde, color: '#22d3ee' },
                  { label: 'NOCHE', pct: hudData.pctNoche, color: '#ec4899' }
                ].map((t) => {
                  const active = selectedTurno === t.label;
                  const r = 20;
                  const circ = 2 * Math.PI * r;
                  const offset = circ - (t.pct / 100) * circ;
                  return (
                    <button
                      key={t.label}
                      onClick={() => handleTurnoClick(t.label)}
                      className={`p-2 rounded-xl border transition-all cursor-pointer flex flex-col items-center ${
                        active
                          ? 'bg-cyan-500/25 border-cyan-300 shadow-[0_0_18px_rgba(34,211,238,0.5)]'
                          : 'bg-[#030b17] border-cyan-500/25 hover:border-cyan-400/60'
                      }`}
                    >
                      <div className="relative w-12 h-12 flex items-center justify-center">
                        <svg className="w-12 h-12 -rotate-90" viewBox="0 0 48 48">
                          <circle cx="24" cy="24" r={r} stroke="#0c2238" strokeWidth="4" fill="transparent" />
                          <circle cx="24" cy="24" r="13" stroke={t.color} strokeWidth="1.5" strokeOpacity="0.5" fill="transparent" />
                          <circle
                            cx="24"
                            cy="24"
                            r={r}
                            stroke={t.color}
                            strokeWidth="4"
                            strokeDasharray={circ}
                            strokeDashoffset={offset}
                            strokeLinecap="round"
                            fill="transparent"
                          />
                        </svg>
                        <span className="absolute text-[10px] font-mono font-black text-white">
                          {t.pct}%
                        </span>
                      </div>
                      <span className="text-[10px] font-mono text-cyan-100 mt-1">{t.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Sliders Tácticos */}
            <div className="border border-cyan-400/50 bg-[#051326]/95 rounded-xl p-3.5 shadow-[inset_0_0_20px_rgba(6,182,212,0.1)] space-y-2.5">
              <div>
                <div className="flex justify-between text-[10px] font-mono text-cyan-300 mb-1">
                  <span>FILTRO DENSIDAD MÍNIMA</span>
                  <span className="text-emerald-300 font-bold">{minCasosFilter}+ CASOS</span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={100}
                  step={5}
                  value={minCasosFilter}
                  onChange={(e) => setMinCasosFilter(Number(e.target.value))}
                  className="w-full accent-emerald-400 cursor-pointer h-1.5 bg-cyan-950 rounded-lg"
                />
              </div>

              <div className="pt-2 border-t border-cyan-500/20 flex items-center justify-between text-[10px] font-mono text-cyan-400">
                <span>AGENTE LÍDER:</span>
                <span className="text-white font-bold truncate max-w-[155px]">{hudData.topAgente}</span>
              </div>
            </div>
          </aside>

          {/* ================= COLUMNA 2: NÚCLEO TÁCTICO CENTRAL (6 COLS) ================= */}
          <main className="lg:col-span-6 flex flex-col gap-4">
            {/* 4 TARJETAS HUD SUPERIORES */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {/* Total Incidencias */}
              <div className="border border-cyan-400/60 bg-gradient-to-b from-[#081d38] to-[#040f1e] rounded-xl p-3 text-center relative overflow-hidden shadow-[0_0_25px_rgba(6,182,212,0.18)]">
                <span className="text-[9px] font-mono text-cyan-300 tracking-wider uppercase block">
                  TOTAL INCIDENCIAS
                </span>
                <span className="text-[9px] font-mono text-emerald-300 block truncate">
                  {activeUrbsList.length > 1 ? `${activeUrbsList.length} SECTORES AGRUPADOS` : activeTitle}
                </span>
                <div className="my-1 relative flex items-center justify-center">
                  <svg className="w-full h-11" viewBox="0 0 140 44">
                    <path
                      d="M0,22 L25,22 L32,10 L38,34 L44,4 L50,40 L56,12 L62,30 L68,22 L140,22"
                      fill="none"
                      stroke="#ec4899"
                      strokeWidth="1.8"
                    />
                    <path
                      d="M0,22 L75,22 L82,8 L88,36 L94,6 L100,38 L106,14 L112,28 L118,22 L140,22"
                      fill="none"
                      stroke="#f59e0b"
                      strokeWidth="1.8"
                    />
                  </svg>
                  <span className="absolute text-2xl sm:text-3xl font-black font-mono text-amber-300 drop-shadow-[0_0_12px_rgba(245,158,11,0.9)] bg-[#06162b]/90 px-2 rounded">
                    {hudData.total.toLocaleString()}
                  </span>
                </div>
              </div>

              {/* Patrullaje Activo */}
              <div className="border border-cyan-400/60 bg-gradient-to-b from-[#081d38] to-[#040f1e] rounded-xl p-3 text-center relative overflow-hidden shadow-[0_0_25px_rgba(6,182,212,0.18)]">
                <span className="text-[9px] font-mono text-cyan-300 tracking-wider uppercase block mb-1">
                  PATRULLAJE ACTIVO
                </span>
                <div className="flex items-center justify-center gap-2 my-1">
                  <div className="w-11 h-11 rounded-full border-2 border-cyan-300 flex flex-col items-center justify-center shadow-[0_0_15px_rgba(34,211,238,0.6)]">
                    <span className="text-sm font-black font-mono text-white leading-none">
                      {hudData.unidadesActivasCount}
                    </span>
                    <span className="text-[7px] font-mono text-cyan-300">MÓVILES</span>
                  </div>
                  <div className="w-11 h-11 rounded-full border border-dashed border-emerald-400 flex items-center justify-center bg-emerald-950/40">
                    <Radio className="w-5 h-5 text-emerald-400 animate-pulse" />
                  </div>
                </div>
              </div>

              {/* Móvil en Operación */}
              <div className="border border-cyan-400/60 bg-gradient-to-b from-[#081d38] to-[#040f1e] rounded-xl p-3 text-center relative overflow-hidden shadow-[0_0_25px_rgba(6,182,212,0.18)]">
                <span className="text-[9px] font-mono text-cyan-300 tracking-wider uppercase block">
                  MÓVIL EN OPERACIÓN
                </span>
                <div className="text-sm sm:text-base font-black font-mono text-cyan-200 truncate mt-0.5 drop-shadow-[0_0_10px_rgba(34,211,238,0.8)]">
                  {hudData.topVehiculo}
                </div>
                <svg className="w-24 h-8 mx-auto mt-1" viewBox="0 0 120 40">
                  <path
                    d="M15,26 L22,14 L52,12 L75,12 L95,18 L108,20 L108,28 L15,28 Z"
                    fill="rgba(34,211,238,0.25)"
                    stroke="#67e8f9"
                    strokeWidth="1.6"
                  />
                  <rect x="48" y="8" width="12" height="3" fill="#ec4899" />
                  <circle cx="33" cy="29" r="6" fill="#030914" stroke="#67e8f9" strokeWidth="2" />
                  <circle cx="90" cy="29" r="6" fill="#030914" stroke="#67e8f9" strokeWidth="2" />
                </svg>
              </div>

              {/* Turno Crítico */}
              <div className="border border-cyan-400/60 bg-gradient-to-b from-[#081d38] to-[#040f1e] rounded-xl p-3 text-center relative overflow-hidden shadow-[0_0_25px_rgba(6,182,212,0.18)]">
                <span className="text-[9px] font-mono text-cyan-300 tracking-wider uppercase block mb-1">
                  TURNO CRÍTICO
                </span>
                <div className="w-12 h-12 mx-auto rounded-full border-2 border-cyan-300 bg-cyan-950/80 flex flex-col items-center justify-center shadow-[0_0_18px_rgba(34,211,238,0.5)]">
                  <span className="text-xs font-black font-mono text-white">
                    {hudData.topTurnoPct}%
                  </span>
                  <span className="text-[7px] font-mono text-cyan-300">{hudData.topTurno}</span>
                </div>
              </div>
            </div>

            {/* MAPA REAL 3D INTERACTIVO (API MAPLIBRE GL JS + OPENFREEMAP EDIFICIOS 3D) */}
            <div className="border border-cyan-400/70 bg-[#030d1a] rounded-xl p-2.5 relative overflow-hidden shadow-[0_0_30px_rgba(6,182,212,0.2)]">
              <div className="flex items-center justify-between mb-1.5 px-1 relative z-10">
                <span className="text-xs font-mono font-black tracking-widest text-cyan-100 uppercase flex items-center gap-2 truncate pr-2">
                  <Crosshair className="w-4 h-4 text-cyan-300 shrink-0" />
                  {activeTitle}
                </span>
                <span className="text-[10px] font-mono text-emerald-300 bg-emerald-950/90 border border-emerald-400/50 px-2 py-0.5 rounded flex items-center gap-1 shrink-0">
                  <Compass className="w-3 h-3 text-emerald-400" />
                  MAPA 3D SATELITAL // NUEVO CHIMBOTE
                </span>
              </div>

              {/* Contenedor del Mapa 3D Real */}
              <div className="w-full h-56 sm:h-64 rounded-lg overflow-hidden border border-cyan-500/40 relative">
                <div ref={mapContainerRef} className="w-full h-full" />

                {/* Etiqueta HUD flotante sobre el mapa 3D */}
                <div className="absolute bottom-2 left-2 z-10 border border-cyan-400/
