import React, { useState, useMemo, useEffect, useRef } from 'react';
import {
  Shield, Printer, Search, Crosshair,
  Settings, Wifi, CheckSquare, Square, Layers, X, Compass, RotateCcw, Activity
} from 'lucide-react';
import { IncidentRecord } from '../types';

interface AnalyticsDashboardViewProps {
  records: IncidentRecord[];
  onSelectSubsector?: (code: string) => void;
  onFilterZona?: (zona: string) => void;
  onFilterTurno?: (turno: string) => void;
}

const cleanText = (val: any): string =>
  val === null || val === undefined ? '' : String(val).trim().replace(/\s+/g, ' ').toUpperCase();

const getUrbanizacion = (r: any): string => {
  const c = cleanText(r.urbanizacion || r.lugar || r.ubicacion || r.zona || r.sector);
  return c && c !== 'N/A' && c !== 'NULL' ? c : '';
};

const getModalidad = (r: any): string => {
  const c = cleanText(r.tipoIncidencia || r.tipo_incidencia || r.modalidad || r.subtipo || r.incidencia || r.tipo);
  return c && c !== 'N/A' && c !== 'NULL' ? c : 'SIN CLASIFICAR';
};

const getVehiculo = (r: any): string => {
  const c = cleanText(r.unidadMovil || r.unidad_movil || r.vehiculo || r.movil || r.patrulla || r.unidad);
  return !c || ['N/A', 'NINGUNO', 'NULL', '-', 'SIN MOVIL', 'SIN UNIDAD'].includes(c) ? 'PATRULLAJE A PIE' : c;
};

const getAgente = (r: any): string => {
  const c = cleanText(r.efectivo || r.agente_responsable || r.agente || r.personal || r.sereno);
  return !c || ['N/A', 'NULL', '-'].includes(c) ? 'SIN ASIGNAR' : c;
};

const getTurno = (r: any): string => {
  const t = cleanText(r.turno);
  if (t.includes('MAÑANA') || t.includes('MANANA')) return 'MAÑANA';
  if (t.includes('TARDE')) return 'TARDE';
  if (t.includes('NOCHE')) return 'NOCHE';
  return 'NO REGISTRADO';
};

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
  'SAN LUIS': [-78.5210, -9.1180],
  'JOSE CARLOS MARIATEGUI': [-78.5250, -9.1275]
};

const getSectorCenter = (title: string): [number, number] => {
  const upper = cleanText(title);
  for (const [key, coords] of Object.entries(SECTOR_COORDS)) {
    if (upper.includes(key)) return coords;
  }
  return [-78.5265, -9.1265];
};

const PatrolTruckHologram: React.FC<{ small?: boolean }> = ({ small = false }) => (
  <div className={`relative flex items-center justify-center ${small ? 'w-16 h-11' : 'w-48 h-24 mx-auto'}`}>
    <img
      src="/camioneta.png"
      alt="Patrullero 4x4"
      className="w-full h-full object-contain mix-blend-screen brightness-125 contrast-125 drop-shadow-[0_0_16px_rgba(34,211,238,0.95)]"
    />
  </div>
);

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

  const urbanizaciones = useMemo(() => {
    const map = new Map<string, number>();
    records.forEach((r) => {
      const urb = getUrbanizacion(r);
      if (urb) map.set(urb, (map.get(urb) || 0) + 1);
    });
    return Array.from(map.entries())
      .map(([nombre, count]) => ({ nombre, count }))
      .sort((a, b) => b.count - a.count);
  }, [records]);

  const activeUrbsList = useMemo(() => {
    if (selectedUrbs.length > 0) return selectedUrbs;
    const def = urbanizaciones.find((u) => u.nombre.includes('CASUARINAS'));
    if (def) return [def.nombre];
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
      return matchSearch && u.count >= minCasosFilter;
    });
  }, [urbanizaciones, searchTerm, minCasosFilter]);

  const toggleUrbSelection = (urbName: string) => {
    setSelectedUrbs((prev) => {
      const current = prev.length > 0 ? prev : activeUrbsList;
      const next = current.includes(urbName)
        ? current.filter((item) => item !== urbName)
        : [...current, urbName];
      const finalList = next.length > 0 ? next : [urbName];
      if (onFilterZona) onFilterZona(finalList.join(', '));
      return finalList;
    });
  };

  const selectSingleUrb = (urbName: string) => {
    setSelectedUrbs([urbName]);
    if (onFilterZona) onFilterZona(urbName);
  };

  const selectAllFiltered = () => {
    const allNames = filteredUrbanizaciones.map((u) => u.nombre);
    if (allNames.length > 0) setSelectedUrbs(allNames);
  };

  const handleResetAllFilters = () => {
    setSearchTerm('');
    setSelectedUrbs([]);
    setSelectedTurno('TODOS');
    setMinCasosFilter(0);
    if (onFilterZona) onFilterZona('');
    if (onFilterTurno) onFilterTurno('TODOS');
  };

  const recordsInScope = useMemo(() => {
    return records.filter((r) => {
      const matchUrb = activeUrbsList.length === 0 || activeUrbsList.includes(getUrbanizacion(r));
      const matchTurno = selectedTurno === 'TODOS' || getTurno(r) === selectedTurno;
      return matchUrb && matchTurno;
    });
  }, [records, activeUrbsList, selectedTurno]);

  const hudData = useMemo(() => {
    const total = recordsInScope.length;
    const vehiculos: Record<string, number> = {};
    const agentes: Record<string, number> = {};
    const turnosCount: Record<string, number> = { MAÑANA: 0, TARDE: 0, NOCHE: 0 };

    recordsInScope.forEach((r) => {
      const v = getVehiculo(r);
      vehiculos[v] = (vehiculos[v] || 0) + 1;
      const a = getAgente(r);
      if (a !== 'SIN ASIGNAR') agentes[a] = (agentes[a] || 0) + 1;
      const t = getTurno(r);
      if (turnosCount[t] !== undefined) turnosCount[t]++;
    });

    const vehiculosOrdenados = Object.entries(vehiculos).sort((a, b) => b[1] - a[1]);
    const movilesReales = vehiculosOrdenados.filter(([n]) => n !== 'PATRULLAJE A PIE');
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
      .slice(0, 7);
  }, [recordsInScope]);

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
          script.onerror = () => reject(new Error('Error MapLibre GL'));
          document.head.appendChild(script);
        });
      }
      if (!isMounted || !mapContainerRef.current || mapInstanceRef.current) return;
      const maplibregl = (window as any).maplibregl;

      const map = new maplibregl.Map({
        container: mapContainerRef.current,
        style: {
          version: 8,
          sources: {
            'osm-tiles': {
              type: 'raster',
              tiles: ['https://tile.openstreetmap.org/{z}/{x}/{y}.png'],
              tileSize: 256
            }
          },
          layers: [
            {
              id: 'osm-cyber-layer',
              type: 'raster',
              source: 'osm-tiles'
            }
          ]
        },
        center: getSectorCenter(activeTitle),
        zoom: 16.0,
        pitch: 65,
        bearing: -28,
        antialias: true
      });

      map.addControl(new maplibregl.NavigationControl({ visualizePitch: true }), 'top-right');
      map.on('load', () => {
        const canvas = map.getCanvas();
        if (canvas) {
          canvas.style.filter = 'invert(94%) hue-rotate(185deg) brightness(92%) contrast(140%) saturate(150%)';
        }
        if (isMounted) setMapReady(true);
      });
      mapInstanceRef.current = map;
    };
    loadMapLibre().catch((err) => console.warn('Aviso mapa 3D:', err));
    return () => {
      isMounted = false;
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    const map = mapInstanceRef.current;
    const maplibregl = (window as any).maplibregl;
    if (!map || !maplibregl) return;

    const [lng, lat] = getSectorCenter(activeTitle);
    map.flyTo({ center: [lng, lat], zoom: 16.2, pitch: 65, bearing: -28, speed: 1.4 });

    markersRef.current.forEach((m) => m.remove());
    markersRef.current = [];

    const count = Math.min(Math.max(recordsInScope.length, 4), 14);
    for (let i = 0; i < count; i++) {
      const r: any = recordsInScope[i] || {};
      const parsedLat = parseFloat(r.lat || r.latitud);
      const parsedLng = parseFloat(r.lng || r.longitud);
      const offsetLng = !isNaN(parsedLng) ? parsedLng : lng + Math.sin(i * 1.7) * 0.0026;
      const offsetLat = !isNaN(parsedLat) ? parsedLat : lat + Math.cos(i * 1.9) * 0.0020;

      const el = document.createElement('div');
      const color = i % 3 === 0 ? '#f43f5e' : i % 3 === 1 ? '#f59e0b' : '#22d3ee';
      el.innerHTML = `<div style="position:relative;display:flex;align-items:center;justify-content:center;width:28px;height:28px;"><span style="position:absolute;width:28px;height:28px;border-radius:9999px;background:${color};opacity:0.45;animation:ping 1.6s cubic-bezier(0,0,0.2,1) infinite;"></span><span style="width:12px;height:12px;border-radius:9999px;background:${color};box-shadow:0 0 16px ${color};border:2px solid #fff;"></span></div>`;

      const marker = new maplibregl.Marker({ element: el }).setLngLat([offsetLng, offsetLat]).addTo(map);
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

  const waveBarsLeft = [16, 30, 46, 26, 52, 34, 22, 42, 28, 16];
  const waveBarsRight = [16, 28, 42, 22, 52, 34, 26, 46, 30, 16];

  return (
    <div className="min-h-screen bg-[#02060f] text-cyan-50 font-sans p-2 sm:p-4 relative overflow-hidden select-none">
      <div className="fixed inset-0 bg-[radial-gradient(ellipse_at_50%_20%,rgba(6,182,212,0.3),transparent_65%)] pointer-events-none" />
      <div className="fixed inset-0 bg-[linear-gradient(to_right,rgba(34,211,238,0.08)_1px,transparent_1px),linear-gradient(to_bottom,rgba(34,211,238,0.08)_1px,transparent_1px)] bg-[size:2rem_2rem] pointer-events-none" />

      <div className="relative z-10 max-w-[1740px] mx-auto border-2 border-cyan-400/70 rounded-2xl bg-[#040d1d]/90 backdrop-blur-2xl shadow-[0_0_80px_rgba(6,182,212,0.35),inset_0_0_50px_rgba(6,182,212,0.12)] p-3 sm:p-4">
        <div className="absolute -top-[2px] -left-[2px] w-12 h-12 border-t-4 border-l-4 border-cyan-300 rounded-tl-2xl pointer-events-none shadow-[-4px_-4px_20px_rgba(34,211,238,0.8)]" />
        <div className="absolute -top-[2px] -right-[2px] w-12 h-12 border-t-4 border-r-4 border-cyan-300 rounded-tr-2xl pointer-events-none shadow-[4px_-4px_20px_rgba(34,211,238,0.8)]" />
        <div className="absolute -bottom-[2px] -left-[2px] w-12 h-12 border-b-4 border-l-4 border-cyan-300 rounded-bl-2xl pointer-events-none" />
        <div className="absolute -bottom-[2px] -right-[2px] w-12 h-12 border-b-4 border-r-4 border-cyan-300 rounded-br-2xl pointer-events-none" />

        {/* HEADER */}
        <header className="flex flex-col lg:flex-row items-center justify-between gap-3 pb-3 mb-4 border-b border-cyan-500/40">
          <div className="flex items-center gap-3 w-full lg:w-auto">
            <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-cyan-500/35 to-blue-950 border-2 border-cyan-300 flex items-center justify-center shadow-[0_0_25px_rgba(34,211,238,0.6)] shrink-0">
              <Shield className="w-8 h-8 text-cyan-200" />
            </div>

            <div className="border border-cyan-400/60 bg-gradient-to-r from-[#061830] to-[#0a2547] rounded-xl px-4 py-2 flex items-center gap-4 shadow-[inset_0_0_20px_rgba(6,182,212,0.2)]">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-mono text-cyan-300 tracking-widest font-bold">TELEMETRÍA C2</span>
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                </div>
                <span className="text-base font-mono font-black text-emerald-300 flex items-center gap-1.5">
                  <Wifi className="w-4 h-4 text-emerald-400" /> {records.length.toLocaleString()} REG
                </span>
                <div className="flex gap-1 mt-1">
                  {[100, 85, 92, 70, 95, 80].map((w, i) => (
                    <div key={i} className="w-4 h-1 bg-cyan-950 rounded-full overflow-hidden">
                      <div className="h-full bg-cyan-400" style={{ width: `${w}%` }} />
                    </div>
                  ))}
                </div>
              </div>
              <div className="flex items-center">
                <Settings className="w-7 h-7 text-cyan-300 animate-spin" style={{ animationDuration: '10s' }} />
                <Settings className="w-5 h-5 text-emerald-400 -ml-1.5 mt-3 animate-spin" style={{ animationDuration: '7s', animationDirection: 'reverse' }} />
              </div>
            </div>
          </div>

          <div className="flex-1 max-w-3xl w-full bg-gradient-to-r from-cyan-950 via-cyan-600/35 to-cyan-950 border-y-2 border-x border-cyan-300/90 rounded-xl px-5 py-2.5 text-center shadow-[0_0_35px_rgba(6,182,212,0.45)]">
            <h1 className="text-sm sm:text-lg md:text-xl font-black tracking-[0.14em] text-white uppercase drop-shadow-[0_0_12px_rgba(34,211,238,0.95)]">
              SISTEMA DE SEGURIDAD CIUDADANA Y CIBER-MONITOREO - SERENAZGO
            </h1>
            <div className="flex flex-wrap items-center justify-center gap-3 text-[10px] font-mono text-cyan-200 mt-0.5">
              <span className="bg-cyan-500/25 px-2.5 py-0.5 rounded border border-cyan-300/50 font-bold">
                OBJETIVO: {activeTitle}
              </span>
              <span>•</span>
              <span>TURNO: {selectedTurno}</span>
            </div>
          </div>

          <div className="flex items-center gap-2 w-full lg:w-auto justify-end">
            <button
              onClick={handleResetAllFilters}
              className="flex items-center gap-1.5 px-3.5 py-3 bg-rose-500/25 hover:bg-rose-500/40 border border-rose-400 rounded-xl text-rose-100 text-xs font-mono font-black uppercase tracking-wider shadow-[0_0_15px_rgba(244,63,94,0.35)] cursor-pointer transition"
            >
              <RotateCcw className="w-4 h-4" />
              <span>BORRAR FILTROS</span>
            </button>

            <button
              onClick={() => window.print()}
              className="flex items-center gap-1.5 px-4 py-3 bg-gradient-to-r from-cyan-500/35 to-emerald-500/35 hover:from-cyan-400/50 hover:to-emerald-400/50 border border-cyan-300 rounded-xl text-white text-xs font-mono font-black uppercase tracking-wider shadow-[0_0_20px_rgba(34,211,238,0.45)] cursor-pointer transition"
            >
              <Printer className="w-4 h-4 text-cyan-200" />
              <span>FICHA</span>
            </button>
          </div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
          {/* COLUMNA IZQUIERDA */}
          <aside className="lg:col-span-3 flex flex-col gap-4">
            <div className="border-2 border-cyan-400/60 bg-[#051428]/95 rounded-xl p-3.5 relative shadow-[inset_0_0_25px_rgba(6,182,212,0.15)]">
              <div className="absolute -top-[2px] -left-[2px] w-6 h-6 border-t-4 border-l-4 border-fuchsia-400 rounded-tl-xl pointer-events-none" />
              <div className="absolute -bottom-[2px] -right-[2px] w-6 h-6 border-b-4 border-r-4 border-emerald-400 rounded-br-xl pointer-events-none" />

              <div className="flex items-center justify-between mb-2">
                <h2 className="text-xs font-mono font-black tracking-wider text-cyan-200 uppercase flex items-center gap-1.5">
                  <Layers className="w-3.5 h-3.5 text-emerald-400" />
                  SECTORIZACIÓN / OPERATIVO
                </h2>
                <span className="text-[10px] font-mono text-emerald-300 bg-emerald-950 px-2 py-0.5 rounded border border-emerald-400/50 font-bold">
                  {activeUrbsList.length} MARCADO{activeUrbsList.length > 1 ? 'S' : ''}
                </span>
              </div>

              <div className="relative mb-2">
                <Search className="w-3.5 h-3.5 text-cyan-300 absolute left-2.5 top-2.5" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Buscar y agrupar lugar..."
                  className="w-full bg-[#020813] border border-cyan-400/60 focus:border-emerald-400 rounded-lg pl-8 pr-7 py-1.5 text-xs font-mono text-white placeholder-cyan-700 focus:outline-none"
                />
                {searchTerm && (
                  <button onClick={() => setSearchTerm('')} className="absolute right-2 top-2 text-cyan-400 hover:text-white cursor-pointer">
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {searchTerm.trim() !== '' && filteredUrbanizaciones.length > 1 && (
                <button
                  onClick={selectAllFiltered}
                  className="w-full mb-2 py-1.5 px-2.5 rounded-lg bg-gradient-to-r from-emerald-600/50 to-cyan-600/50 border border-emerald-300 text-[10px] font-mono font-black text-white uppercase flex items-center justify-center gap-1.5 cursor-pointer shadow-[0_0_15px_rgba(16,185,129,0.4)]"
                >
                  <CheckSquare className="w-3.5 h-3.5" />
                  AGRUPAR TODOS ({filteredUrbanizaciones.length})
                </button>
              )}

              {activeUrbsList.length > 1 && (
                <div className="mb-2 p-2 rounded-lg bg-cyan-950/70 border border-cyan-400/50">
                  <div className="flex items-center justify-between text-[9px] font-mono text-cyan-200 mb-1">
                    <span>SECTORES AGRUPADOS:</span>
                    <button onClick={() => selectSingleUrb(activeUrbsList[0])} className="text-amber-300 underline cursor-pointer">
                      LIMPIAR
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-1 max-h-14 overflow-y-auto">
                    {activeUrbsList.map((name) => (
                      <span
                        key={name}
                        onClick={() => toggleUrbSelection(name)}
                        className="text-[9px] font-mono bg-emerald-500/25 border border-emerald-400 text-emerald-100 px-1.5 py-0.5 rounded cursor-pointer"
                      >
                        {name} ×
                      </span>
                    ))}
                  </div>
                </div>
              )}

              <div className="space-y-1.5 max-h-[235px] overflow-y-auto pr-1">
                {filteredUrbanizaciones.map((urb) => {
                  const isChecked = activeUrbsList.includes(urb.nombre);
                  return (
                    <div
                      key={urb.nombre}
                      className={`w-full px-2.5 py-2 rounded-lg text-xs font-mono flex items-center justify-between border transition-all ${
                        isChecked
                          ? 'bg-gradient-to-r from-emerald-500/40 via-cyan-500/35 to-blue-900/50 border-emerald-300 text-white font-black shadow-[0_0_20px_rgba(16,185,129,0.5)]'
                          : 'bg-[#071930]/85 border-cyan-500/30 text-cyan-200/85 hover:border-cyan-400'
                      }`}
                    >
                      <button onClick={() => toggleUrbSelection(urb.nombre)} className="flex items-center gap-2 min-w-0 flex-1 text-left cursor-pointer">
                        {isChecked ? <CheckSquare className="w-4 h-4 text-emerald-300 shrink-0" /> : <Square className="w-4 h-4 text-cyan-500 shrink-0" />}
                        <span className="truncate pr-1">{urb.nombre}</span>
                      </button>
                      <button
                        onClick={() => selectSingleUrb(urb.nombre)}
                        className={`text-[10px] px-2 py-0.5 rounded cursor-pointer shrink-0 ${
                          isChecked ? 'bg-emerald-400 text-slate-950 font-black' : 'bg-slate-950 text-cyan-300 border border-cyan-500/40'
                        }`}
                      >
                        {urb.count}
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* RANGO DE TURNOS */}
            <div className="border-2 border-cyan-400/60 bg-[#051428]/95 rounded-xl p-3.5 shadow-[inset_0_0_20px_rgba(6,182,212,0.12)]">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-xs font-mono font-black tracking-wider text-cyan-200 uppercase">RANGO DE TURNOS</h3>
                {selectedTurno !== 'TODOS' && (
                  <button onClick={() => handleTurnoClick(selectedTurno)} className="text-[10px] font-mono text-amber-300 underline cursor-pointer">
                    TODOS
                  </button>
                )}
              </div>
              <div className="grid grid-cols-3 gap-2.5 text-center">
                {[
                  { label: 'MAÑANA', pct: hudData.pctManana, color: '#10b981', glow: 'rgba(16,185,129,0.45)' },
                  { label: 'TARDE', pct: hudData.pctTarde, color: '#22d3ee', glow: 'rgba(34,211,238,0.45)' },
                  { label: 'NOCHE', pct: hudData.pctNoche, color: '#ec4899', glow: 'rgba(236,72,153,0.45)' }
                ].map((t) => {
                  const active = selectedTurno === t.label;
                  const r = 30;
                  const circ = 2 * Math.PI * r;
                  const offset = circ - (t.pct / 100) * circ;
                  return (
                    <button
                      key={t.label}
                      onClick={() => handleTurnoClick(t.label)}
                      className={`p-2.5 rounded-xl border-2 cursor-pointer flex flex-col items-center justify-center transition ${
                        active ? 'bg-cyan-500/30 border-cyan-300' : 'bg-[#030b17] border-cyan-500/35 hover:border-cyan-400'
                      }`}
                      style={{ boxShadow: active ? `0 0 22px ${t.glow}` : undefined }}
                    >
                      <div className="relative w-20 h-20 flex items-center justify-center">
                        <svg className="w-20 h-20 -rotate-90" viewBox="0 0 72 72">
                          <circle cx="36" cy="36" r={r} stroke="#0c2238" strokeWidth="5" fill="transparent" />
                          <circle cx="36" cy="36" r="22" stroke={t.color} strokeWidth="2" strokeOpacity="0.6" fill={t.color} fillOpacity="0.12" />
                          <circle cx="36" cy="36" r="14" stroke={t.color} strokeWidth="1.5" strokeOpacity="0.4" fill="transparent" />
                          <circle cx="36" cy="36" r={r} stroke={t.color} strokeWidth="5" strokeDasharray={circ} strokeDashoffset={offset} strokeLinecap="round" fill="transparent" />
                        </svg>
                        <span className="absolute text-sm font-mono font-black text-white drop-shadow-[0_0_6px_rgba(0,0,0,0.9)]">{t.pct}%</span>
                      </div>
                      <span className="text-[11px] font-mono font-bold text-cyan-100 mt-1.5 tracking-wider">{t.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="border border-cyan-400/60 bg-[#051428]/95 rounded-xl p-3.5 space-y-2.5">
              <div>
                <div className="flex justify-between text-[10px] font-mono text-cyan-200 mb-1">
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
              <div className="pt-2 border-t border-cyan-500/30 flex items-center justify-between text-[10px] font-mono text-cyan-300">
                <span>AGENTE LÍDER:</span>
                <span className="text-white font-bold truncate max-w-[155px]">{hudData.topAgente}</span>
              </div>
            </div>
          </aside>

          {/* COLUMNA CENTRAL */}
          <main className="lg:col-span-6 flex flex-col gap-4">
            {/* 4 TARJETAS KPI DE ALTA DENSIDAD SIN ESPACIOS VACÍOS */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {/* KPI 1: TOTAL INCIDENCIAS */}
              <div className="border-2 border-cyan-400/80 bg-gradient-to-b from-[#0b2950] via-[#061830] to-[#030b17] rounded-xl p-2.5 text-center flex flex-col justify-between min-h-[155px] relative overflow-hidden shadow-[0_0_25px_rgba(6,182,212,0.28)]">
                <div className="absolute top-1.5 left-1.5 w-2.5 h-2.5 border-t-2 border-l-2 border-cyan-300/80" />
                <div className="absolute top-1.5 right-1.5 w-2.5 h-2.5 border-t-2 border-r-2 border-cyan-300/80" />
                <div>
                  <span className="text-[10px] font-mono font-black text-cyan-200 uppercase block tracking-widest">TOTAL INCIDENCIAS</span>
                  <span className="text-[9px] font-mono text-emerald-300 block truncate">{activeTitle}</span>
                </div>

                <div className="flex items-center justify-center gap-1 my-auto">
                  <div className="flex items-center gap-[2px] h-14">
                    {waveBarsLeft.map((h, i) => (
                      <span
                        key={i}
                        className="w-[2.5px] rounded-full bg-gradient-to-t from-fuchsia-500 via-amber-400 to-cyan-300"
                        style={{ height: `${h}px` }}
                      />
                    ))}
                  </div>
                  <span className="text-3xl sm:text-4xl xl:text-5xl font-black font-mono text-amber-300 drop-shadow-[0_0_18px_rgba(245,158,11,0.95)] px-1">
                    {hudData.total.toLocaleString()}
                  </span>
                  <div className="flex items-center gap-[2px] h-14">
                    {waveBarsRight.map((h, i) => (
                      <span
                        key={i}
                        className="w-[2.5px] rounded-full bg-gradient-to-t from-fuchsia-500 via-amber-400 to-cyan-300"
                        style={{ height: `${h}px` }}
                      />
                    ))}
                  </div>
                </div>

                <div className="border-t border-cyan-500/30 pt-1 flex items-center justify-between px-2 text-[9px] font-mono text-cyan-300/90">
                  <span>ESTADO</span>
                  <span className="text-amber-300 font-bold">MONITOREO LIVE</span>
                </div>
              </div>

              {/* KPI 2: PATRULLAJE ACTIVO */}
              <div className="border-2 border-cyan-400/80 bg-gradient-to-b from-[#0b2950] via-[#061830] to-[#030b17] rounded-xl p-2.5 text-center flex flex-col justify-between min-h-[155px] relative overflow-hidden shadow-[0_0_25px_rgba(6,182,212,0.28)]">
                <div className="absolute top-1.5 left-1.5 w-2.5 h-2.5 border-t-2 border-l-2 border-cyan-300/80" />
                <div className="absolute top-1.5 right-1.5 w-2.5 h-2.5 border-t-2 border-r-2 border-cyan-300/80" />
                <span className="text-[10px] font-mono font-black text-cyan-200 uppercase block tracking-widest">PATRULLAJE ACTIVO</span>

                <div className="flex items-center justify-center gap-2 my-auto">
                  <div className="w-20 h-20 rounded-full border-[3px] border-cyan-300 bg-cyan-950/60 flex flex-col items-center justify-center shadow-[0_0_20px_rgba(34,211,238,0.65)] relative">
                    <div className="absolute inset-1 rounded-full border border-dashed border-cyan-400/60" />
                    <span className="text-2xl font-black font-mono text-white leading-none">{hudData.unidadesActivasCount}</span>
                    <span className="text-[8px] font-mono font-bold text-cyan-300 mt-0.5">MÓVILES</span>
                  </div>
                  <div className="w-20 h-20 rounded-full border-2 border-dashed border-cyan-400/80 flex items-center justify-center bg-cyan-950/60 shadow-[inset_0_0_15px_rgba(34,211,238,0.3)]">
                    <PatrolTruckHologram small />
                  </div>
                </div>

                <div className="border-t border-cyan-500/30 pt-1 flex items-center justify-between px-2 text-[9px] font-mono text-cyan-300/90">
                  <span>FLOTA ACTIVA</span>
                  <span className="text-emerald-300 font-bold">100% OPERATIVA</span>
                </div>
              </div>

              {/* KPI 3: MÓVIL EN OPERACIÓN */}
              <div className="border-2 border-cyan-400/80 bg-gradient-to-b from-[#0b2950] via-[#061830] to-[#030b17] rounded-xl p-2.5 text-center flex flex-col justify-between min-h-[155px] relative overflow-hidden shadow-[0_0_25px_rgba(6,182,212,0.28)]">
                <div className="absolute top-1.5 left-1.5 w-2.5 h-2.5 border-t-2 border-l-2 border-cyan-300/80" />
                <div className="absolute top-1.5 right-1.5 w-2.5 h-2.5 border-t-2 border-r-2 border-cyan-300/80" />
                <div>
                  <span className="text-[10px] font-mono font-black text-cyan-200 uppercase block tracking-widest">MÓVIL EN OPERACIÓN</span>
                  <div className="text-xs sm:text-sm font-black font-mono text-cyan-300 truncate drop-shadow-[0_0_10px_rgba(34,211,238,0.9)]">
                    {hudData.topVehiculo}
                  </div>
                </div>

                <PatrolTruckHologram />

                <div className="border-t border-cyan-500/30 pt-1 flex items-center justify-between px-2 text-[9px] font-mono text-cyan-300/90">
                  <span>INTERVENCIONES</span>
                  <span className="text-cyan-200 font-bold">{hudData.topVehiculoCount} REG</span>
                </div>
              </div>

              {/* KPI 4: TURNO CRÍTICO (TACÓMETRO RADAR MULTI-ANILLO) */}
              <div className="border-2 border-cyan-400/80 bg-gradient-to-b from-[#0b2950] via-[#061830] to-[#030b17] rounded-xl p-2.5 text-center flex flex-col justify-between min-h-[155px] relative overflow-hidden shadow-[0_0_25px_rgba(6,182,212,0.28)]">
                <div className="absolute top-1.5 left-1.5 w-2.5 h-2.5 border-t-2 border-l-2 border-cyan-300/80" />
                <div className="absolute top-1.5 right-1.5 w-2.5 h-2.5 border-t-2 border-r-2 border-cyan-300/80" />
                <span className="text-[10px] font-mono font-black text-cyan-200 uppercase tracking-widest block">
                  TURNO CRÍTICO
                </span>

                <div className="relative w-24 h-24 mx-auto my-auto flex items-center justify-center">
                  <svg className="w-24 h-24 -rotate-90 drop-shadow-[0_0_12px_rgba(34,211,238,0.65)]" viewBox="0 0 110 110">
                    <circle cx="55" cy="55" r="50" stroke="#0e7490" strokeWidth="1.5" strokeDasharray="3 5" fill="transparent" />
                    <circle cx="55" cy="55" r="43" stroke="#082038" strokeWidth="7" fill="transparent" />
                    <circle
                      cx="55"
                      cy="55"
                      r="43"
                      stroke="#22d3ee"
                      strokeWidth="7"
                      strokeDasharray={`${(hudData.topTurnoPct / 100) * (2 * Math.PI * 43)} ${2 * Math.PI * 43}`}
                      strokeLinecap="round"
                      fill="transparent"
                    />
                    <circle
                      cx="55"
                      cy="55"
                      r="33"
                      stroke="#38bdf8"
                      strokeWidth="2.5"
                      strokeDasharray="10 6"
                      fill="rgba(6,182,212,0.12)"
                    />
                    <circle cx="55" cy="55" r="25" stroke="#67e8f9" strokeWidth="1" strokeOpacity="0.5" fill="#041122" />
                  </svg>

                  <div className="absolute flex flex-col items-center justify-center">
                    <span className="text-xl font-black font-mono text-white leading-none drop-shadow-[0_0_8px_rgba(34,211,238,0.9)]">
                      {hudData.topTurnoPct}%
                    </span>
                    <span className="text-[8px] font-mono font-black text-cyan-300 mt-0.5 tracking-wider">
                      {hudData.topTurno}
                    </span>
                  </div>
                </div>

                <div className="border-t border-cyan-500/30 pt-1 flex items-center justify-between px-2 text-[9px] font-mono text-cyan-300/90">
                  <span>ALERTA ALTA</span>
                  <span className="text-emerald-300 font-bold">
                    {hudData.turnosCount[hudData.topTurno as keyof typeof hudData.turnosCount] || 0} CASOS
                  </span>
                </div>
              </div>
            </div>

            {/* MAPA OSCURO CIAN DE ALTO CONTRASTE */}
            <div className="border-2 border-cyan-400/80 bg-[#020813] rounded-xl p-2.5 relative overflow-hidden shadow-[0_0_35px_rgba(6,182,212,0.28)]">
              <div className="flex items-center justify-between mb-1.5 px-1">
                <span className="text-xs font-mono font-black text-white uppercase flex items-center gap-2 truncate pr-2">
                  <Crosshair className="w-4 h-4 text-cyan-300 shrink-0" />
                  {activeTitle}
                </span>
                <span className="text-[10px] font-mono text-emerald-300 bg-emerald-950 border border-emerald-400 px-2 py-0.5 rounded flex items-center gap-1 shrink-0 font-bold">
                  <Compass className="w-3 h-3 text-emerald-300" />
                  RADAR TÁCTICO 3D // NUEVO CHIMBOTE
                </span>
              </div>

              <div className="w-full h-60 sm:h-64 rounded-lg overflow-hidden border border-cyan-400/50 relative bg-[#020813]">
                <div ref={mapContainerRef} className="w-full h-full" />

                <div className="absolute bottom-2 left-2 z-10 border border-cyan-400/70 bg-[#030d1c]/90 backdrop-blur-md rounded-lg p-2 pointer-events-none flex items-center gap-2.5">
                  <svg className="w-12 h-12" viewBox="0 0 60 60">
                    <rect x="2" y="2" width="56" height="56" stroke="#22d3ee" strokeWidth="1" fill="rgba(6,182,212,0.08)" />
                    <line x1="20" y1="2" x2="20" y2="58" stroke="#22d3ee" strokeOpacity="0.35" strokeWidth="0.8" />
                    <line x1="40" y1="2" x2="40" y2="58" stroke="#22d3ee" strokeOpacity="0.35" strokeWidth="0.8" />
                    <line x1="2" y1="20" x2="58" y2="20" stroke="#22d3ee" strokeOpacity="0.35" strokeWidth="0.8" />
                    <line x1="2" y1="40" x2="58" y2="40" stroke="#22d3ee" strokeOpacity="0.35" strokeWidth="0.8" />
                    <circle cx="32" cy="28" r="10" stroke="#f43f5e" strokeWidth="1.2" fill="rgba(244,63,94,0.2)" />
                    <circle cx="32" cy="28" r="3" fill="#f59e0b" />
                  </svg>
                  <div className="text-[9px] font-mono text-cyan-100 leading-relaxed">
                    <div>UNIDAD: <strong className="text-emerald-300">{hudData.topVehiculo}</strong></div>
                    <div>EVENTOS: <strong className="text-amber-300">{hudData.total}</strong></div>
                    <div className="text-cyan-400">Clic derecho: rotar 3D</div>
                  </div>
                </div>
              </div>
            </div>

            {/* MATRIZ DE FRECUENCIA DE INCIDENCIAS */}
            <div className="border-2 border-cyan-400/70 bg-[#051428]/95 rounded-xl p-3.5 shadow-[inset_0_0_25px_rgba(6,182,212,0.12)]">
              <div className="flex items-center justify-between mb-2.5">
                <h3 className="text-xs font-mono font-black text-white uppercase flex items-center gap-1.5">
                  <Activity className="w-4 h-4 text-cyan-400" />
                  MATRIZ DE FRECUENCIA DE INCIDENCIAS
                </h3>
                <span className="text-[10px] font-mono text-emerald-300 font-bold">{hudData.total.toLocaleString()} CASOS</span>
              </div>
              <div className="space-y-2 max-h-[205px] overflow-y-auto pr-1">
                {frecuenciaModalidades.length === 0 ? (
                  <div className="text-center py-6 text-xs font-mono text-cyan-500">SIN INCIDENCIAS EN ESTE FILTRO</div>
                ) : (
                  frecuenciaModalidades.map((item, idx) => (
                    <div key={item.modalidad} className="grid grid-cols-12 items-center gap-2 text-xs">
                      <span className="col-span-5 sm:col-span-4 font-mono text-[11px] text-white truncate">{item.modalidad}</span>
                      <div className="col-span-5 sm:col-span-6 bg-[#020813] h-4 rounded-sm border border-cyan-400/60 p-0.5 overflow-hidden">
                        <div
                          className={`h-full rounded-xs ${
                            idx === 0
                              ? 'bg-gradient-to-r from-cyan-400 via-amber-300 to-rose-500 shadow-[0_0_12px_#f43f5e]'
                              : idx === 1
                              ? 'bg-gradient-to-r from-cyan-400 via-emerald-300 to-amber-400 shadow-[0_0_12px_#f59e0b]'
                              : 'bg-gradient-to-r from-blue-500 via-cyan-400 to-emerald-300 shadow-[0_0_10px_#22d3ee]'
                          }`}
                          style={{ width: `${Math.max(item.porcentaje, 5)}%` }}
                        />
                      </div>
                      <span className="col-span-2 text-right font-mono text-[11px] font-black text-cyan-200">
                        {item.count} ({item.porcentaje}%)
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>
          </main>

          {/* COLUMNA DERECHA */}
          <aside className="lg:col-span-3 flex flex-col gap-4">
            <div className="border-2 border-cyan-400/60 bg-[#051428]/95 rounded-xl p-3.5 flex flex-col items-center">
              <h3 className="text-xs font-mono font-black text-cyan-200 uppercase w-full text-left mb-2">INCIDENTES POR RECURSO</h3>
              <div className="relative w-48 h-48 flex items-center justify-center my-1">
                <svg className="w-48 h-48 -rotate-90" viewBox="0 0 110 110">
                  <circle cx="55" cy="55" r="44" stroke="#0c243e" strokeWidth="7" fill="transparent" />
                  <circle cx="55" cy="55" r="33" stroke="#0c243e" strokeWidth="6" fill="transparent" />
                  <circle cx="55" cy="55" r="22" stroke="#0c243e" strokeWidth="5" fill="transparent" />
                  <circle cx="55" cy="55" r="44" stroke="#22d3ee" strokeWidth="7" strokeDasharray={`${(hudData.pctManana / 100) * c1} ${c1}`} strokeLinecap="round" fill="transparent" className="drop-shadow-[0_0_8px_#22d3ee]" />
                  <circle cx="55" cy="55" r="33" stroke="#f97316" strokeWidth="6" strokeDasharray={`${(hudData.pctTarde / 100) * c2} ${c2}`} strokeLinecap="round" fill="transparent" className="drop-shadow-[0_0_8px_#f97316]" />
                  <circle cx="55" cy="55" r="22" stroke="#10b981" strokeWidth="5" strokeDasharray={`${(hudData.pctNoche / 100) * c3} ${c3}`} strokeLinecap="round" fill="transparent" />
                </svg>
                <div className="absolute text-center">
                  <span className="text-xl font-black font-mono text-white block leading-none">{hudData.total.toLocaleString()}</span>
                  <span className="text-[9px] font-mono text-cyan-300">EVENTOS</span>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-1.5 w-full text-center font-mono text-[10px] mt-1">
                <div className="bg-[#030b17] p-1.5 rounded border border-cyan-400/40">
                  <span className="text-cyan-300 block">MAÑ</span>
                  <span className="font-bold text-white">{hudData.turnosCount.MAÑANA}</span>
                </div>
                <div className="bg-[#030b17] p-1.5 rounded border border-orange-400/40">
                  <span className="text-orange-300 block">TAR</span>
                  <span className="font-bold text-white">{hudData.turnosCount.TARDE}</span>
                </div>
                <div className="bg-[#030b17] p-1.5 rounded border border-emerald-400/40">
                  <span className="text-emerald-300 block">NOC</span>
                  <span className="font-bold text-white">{hudData.turnosCount.NOCHE}</span>
                </div>
              </div>
            </div>

            <div className="border-2 border-cyan-400/60 bg-[#051428]/95 rounded-xl p-3.5 flex-1 flex flex-col justify-between">
              <div>
                <h3 className="text-xs font-mono font-black text-cyan-200 uppercase mb-2">DESPLIEGUE POR UNIDAD</h3>
                <div className="bg-[#020813] border border-cyan-400/40 rounded-lg p-2 mb-3">
                  <svg className="w-full h-16" viewBox="0 0 220 60">
                    <path d="M0,45 Q25,10 50,35 T100,25 T150,38 T200,15 L220,25 L220,60 L0,60 Z" fill="rgba(16,185,129,0.35)" />
                    <path d="M0,45 Q25,10 50,35 T100,25 T150,38 T200,15 L220,25" fill="none" stroke="#34d399" strokeWidth="2.4" />
                  </svg>
                </div>
                <div className="space-y-2.5">
                  {hudData.flotaList.map((item, i) => (
                    <div key={item.unidad} className="space-y-1">
                      <div className="flex justify-between text-[11px] font-mono">
                        <span className="text-white truncate pr-2">{item.unidad}</span>
                        <span className="text-emerald-300 font-black shrink-0">{item.casos}</span>
                      </div>
                      <div className="w-full bg-[#020813] h-2 rounded-full overflow-hidden border border-cyan-400/40">
                        <div
                          className={`h-full rounded-full ${
                            i === 0 ? 'bg-gradient-to-r from-cyan-400 to-emerald-400' : i === 1 ? 'bg-gradient-to-r from-amber-400 to-orange-500' : 'bg-cyan-400'
                          }`}
                          style={{ width: `${Math.max(item.pct, 8)}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
};

export default AnalyticsDashboardView;
