import React, { useState, useMemo, useEffect, useRef } from 'react';
import {
  Shield, Search, Crosshair, Settings, Wifi, CheckSquare,
  Square, Layers, X, RotateCcw, Activity, FileDown,
  Edit3, Eye, CalendarRange, Maximize2, Minimize2, Sun, Moon, Navigation
} from 'lucide-react';
import { IncidentRecord } from '../types';

interface AnalyticsDashboardViewProps {
  records: IncidentRecord[];
  onSelectSubsector?: (code: string) => void;
  onFilterZona?: (zona: string) => void;
  onFilterTurno?: (turno: string) => void;
}

const MESES_CORTOS = ['ENE', 'FEB', 'MAR', 'ABR', 'MAY', 'JUN', 'JUL', 'AGO', 'SEP', 'OCT', 'NOV', 'DIC'];
const MESES_LARGOS = [
  'ENERO', 'FEBRERO', 'MARZO', 'ABRIL', 'MAYO', 'JUNIO',
  'JULIO', 'AGOSTO', 'SETIEMBRE', 'OCTUBRE', 'NOVIEMBRE', 'DICIEMBRE'
];

const cleanText = (val: any): string =>
  val === null || val === undefined ? '' : String(val).trim().replace(/\s+/g, ' ').toUpperCase();

const getUrbanizacion = (r: any): string => {
  if (!r || typeof r !== 'object') return '';
  const c = cleanText(r.urbanizacion || r.lugar || r.ubicacion || r.zona || r.sector);
  return c && c !== 'N/A' && c !== 'NULL' ? c : '';
};

const getModalidad = (r: any): string => {
  if (!r || typeof r !== 'object') return 'SIN CLASIFICAR';
  const c = cleanText(r.tipoIncidencia || r.tipo_incidencia || r.modalidad || r.subtipo || r.incidencia || r.tipo);
  return c && c !== 'N/A' && c !== 'NULL' ? c : 'SIN CLASIFICAR';
};

const getVehiculo = (r: any): string => {
  if (!r || typeof r !== 'object') return 'PATRULLAJE A PIE';
  const c = cleanText(r.unidadMovil || r.unidad_movil || r.vehiculo || r.movil || r.patrulla || r.unidad);
  return !c || ['N/A', 'NINGUNO', 'NULL', '-', 'SIN MOVIL', 'SIN UNIDAD'].includes(c) ? 'PATRULLAJE A PIE' : c;
};

const getAgente = (r: any): string => {
  if (!r || typeof r !== 'object') return 'SIN ASIGNAR';
  const c = cleanText(r.efectivo || r.agente_responsable || r.agente || r.personal || r.sereno);
  return !c || ['N/A', 'NULL', '-'].includes(c) ? 'SIN ASIGNAR' : c;
};

const getTurno = (r: any): string => {
  if (!r || typeof r !== 'object') return 'NO REGISTRADO';
  const t = cleanText(r.turno);
  if (t.includes('MAÑANA') || t.includes('MANANA')) return 'MAÑANA';
  if (t.includes('TARDE')) return 'TARDE';
  if (t.includes('NOCHE')) return 'NOCHE';
  return 'NO REGISTRADO';
};

const getMonthIndex = (r: any): number => {
  if (!r || typeof r !== 'object') return -1;
  const rawMes = cleanText(r.mes || r.month);
  if (rawMes) {
    const idx = MESES_CORTOS.findIndex((m) => rawMes.startsWith(m));
    if (idx !== -1) return idx;
    if (rawMes.startsWith('SET')) return 8;
    const num = parseInt(rawMes, 10);
    if (!isNaN(num) && num >= 1 && num <= 12) return num - 1;
  }

  const rawFecha = String(r.fecha || r.date || r.fecha_incidencia || r.fechaRegistro || '').trim();
  if (!rawFecha) return -1;

  const dmy = rawFecha.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2,4})/);
  if (dmy) {
    const m = parseInt(dmy[2], 10);
    if (m >= 1 && m <= 12) return m - 1;
  }

  const ymd = rawFecha.match(/^(\d{4})[\/\-](\d{1,2})[\/\-](\d{1,2})/);
  if (ymd) {
    const m = parseInt(ymd[2], 10);
    if (m >= 1 && m <= 12) return m - 1;
  }

  const parsed = new Date(rawFecha);
  if (!isNaN(parsed.getTime())) return parsed.getMonth();

  return -1;
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

type PinVariant = 'BLUE' | 'RED' | 'AMBER' | 'EMERALD';

interface CriticalMapPoint {
  id: string;
  index: number;
  lng: number;
  lat: number;
  modalidad: string;
  lugar: string;
  turno: string;
  vehiculo: string;
  variant: PinVariant;
}

const create3DPinHtml = (variant: PinVariant, index: number): string => {
  const palettes = {
    BLUE: { light: '#7dd3fc', mid: '#0ea5e9', dark: '#0369a1' },
    RED: { light: '#fda4af', mid: '#f43f5e', dark: '#9f1239' },
    AMBER: { light: '#fde047', mid: '#f59e0b', dark: '#b45309' },
    EMERALD: { light: '#6ee7b7', mid: '#10b981', dark: '#047857' }
  };
  const p = palettes[variant];
  const uid = `p3d_${variant}_${index}`;

  return `
    <div style="position:relative;width:38px;height:48px;display:flex;align-items:center;justify-content:center;cursor:pointer;transform:translateY(-20px);">
      <span style="position:absolute;bottom:1px;width:16px;height:6px;border-radius:9999px;background:${p.mid};opacity:0.65;animation:ping 1.8s cubic-bezier(0,0,0.2,1) infinite;"></span>
      <svg width="36" height="44" viewBox="0 0 64 80" fill="none" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <radialGradient id="${uid}" cx="35%" cy="25%" r="70%">
            <stop offset="0%" stop-color="${p.light}" />
            <stop offset="55%" stop-color="${p.mid}" />
            <stop offset="100%" stop-color="${p.dark}" />
          </radialGradient>
        </defs>
        <path d="M32 3C16.536 3 4 15.536 4 31C4 49.5 27.6 72.8 30.6 75.7C31.38 76.45 32.62 76.45 33.4 75.7C36.4 72.8 60 49.5 60 31C60 15.536 47.464 3 32 3ZM32 42C25.925 42 21 37.075 21 31C21 24.925 25.925 20 32 20C38.075 20 43 24.925 43 31C43 37.075 38.075 42 32 42Z" fill="url(#${uid})" stroke="#ffffff" stroke-width="2.2"/>
        <ellipse cx="22" cy="15" rx="7" ry="3.5" transform="rotate(-32 22 15)" fill="#ffffff" fill-opacity="0.5"/>
      </svg>
    </div>
  `;
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

interface BeveledBarItem {
  label: string;
  count: number;
  porcentaje: number;
}

const BeveledHorizontalBarChart: React.FC<{
  title: string;
  subtitle: string;
  items: BeveledBarItem[];
}> = ({ title, subtitle, items }) => {
  const maxVal = Math.max(...items.map((i) => i.count), 1);
  const rawStep = maxVal / 5;
  const magnitude = Math.pow(10, Math.floor(Math.log10(Math.max(rawStep, 1))));
  const niceStep = Math.ceil(rawStep / magnitude) * magnitude || 1;
  const scaleMax = niceStep * 5;
  const ticks = [0, niceStep, niceStep * 2, niceStep * 3, niceStep * 4, scaleMax];

  return (
    <div className="bg-[#f8fafc] border border-slate-300 rounded-lg p-4 mb-4">
      <div className="text-center mb-3">
        <h4 className="text-xs sm:text-sm font-black text-slate-900 uppercase tracking-wide">{title}</h4>
        <p className="text-[10px] text-slate-500">{subtitle} (Escala 0 a {scaleMax.toLocaleString()} casos)</p>
      </div>

      <div className="relative">
        <div className="space-y-2.5 relative z-10">
          {items.map((item) => {
            const widthPct = Math.min(100, Math.max((item.count / scaleMax) * 100, 1.5));
            return (
              <div key={item.label} className="grid grid-cols-12 items-center gap-2">
                <div
                  className="col-span-4 sm:col-span-3 text-right font-bold text-[10px] sm:text-[11px] text-slate-800 truncate pr-1"
                  title={item.label}
                >
                  {item.label}
                </div>
                <div className="col-span-8 sm:col-span-9 pr-32 sm:pr-36 relative h-5 flex items-center">
                  <div className="absolute inset-y-0 left-0 right-32 sm:right-36 flex justify-between pointer-events-none">
                    {ticks.map((t) => (
                      <div key={t} className="h-full border-r border-dashed border-slate-300/80" />
                    ))}
                  </div>

                  <div
                    className="relative h-4 rounded-r-md rounded-l-xs border border-[#1e3a8a] shadow-[0_2px_0_#0f172a] overflow-hidden shrink-0"
                    style={{ width: `${widthPct}%` }}
                  >
                    <div className="h-1/2 w-full bg-[#38bdf8]" />
                    <div className="h-1/2 w-full bg-[#1d4ed8]" />
                  </div>

                  <span className="ml-2 text-[10px] font-bold text-slate-800 whitespace-nowrap shrink-0">
                    {item.count.toLocaleString()} casos ({item.porcentaje.toFixed(2)}%)
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        <div className="grid grid-cols-12 gap-2 mt-2 pt-1 border-t border-slate-300">
          <div className="col-span-4 sm:col-span-3" />
          <div className="col-span-8 sm:col-span-9 pr-32 sm:pr-36 flex justify-between text-[9px] font-mono text-slate-500">
            {ticks.map((t) => (
              <span key={t}>{t.toLocaleString()}</span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export const AnalyticsDashboardView: React.FC<AnalyticsDashboardViewProps> = ({
  records = [],
  onFilterZona,
  onFilterTurno
}) => {
  const safeRecords = Array.isArray(records) ? records : [];

  const [searchTerm, setSearchTerm] = useState<string>('');
  const [selectedUrbs, setSelectedUrbs] = useState<string[]>([]);
  const [customGroupName, setCustomGroupName] = useState<string>('');
  const [selectedTurno, setSelectedTurno] = useState<string>('TODOS');
  const [minCasosFilter, setMinCasosFilter] = useState<number>(0);

  const [isPreviewOpen, setIsPreviewOpen] = useState<boolean>(false);
  const [previewTab, setPreviewTab] = useState<'FRECUENCIA' | 'ANUAL_MESES'>('FRECUENCIA');
  const [exportingPdf, setExportingPdf] = useState<boolean>(false);

  // En pantalla principal siempre es oscuro (para coordinar colores).
  // Al agrandar a pantalla completa, permite elegir entre Claro o Noche.
  const [isMapExpanded, setIsMapExpanded] = useState<boolean>(false);
  const [expandedMapTheme, setExpandedMapTheme] = useState<'LIGHT' | 'DARK'>('LIGHT');
  const [selectedPinId, setSelectedPinId] = useState<string | null>(null);

  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapInstanceRef = useRef<any>(null);
  const markersRef = useRef<any[]>([]);
  const [mapReady, setMapReady] = useState<boolean>(false);

  const urbanizaciones = useMemo(() => {
    const map = new Map<string, number>();
    safeRecords.forEach((r) => {
      const urb = getUrbanizacion(r);
      if (urb) map.set(urb, (map.get(urb) || 0) + 1);
    });
    return Array.from(map.entries())
      .map(([nombre, count]) => ({ nombre, count }))
      .sort((a, b) => b.count - a.count);
  }, [safeRecords]);

  const activeUrbsList = useMemo(() => {
    if (selectedUrbs.length > 0) return selectedUrbs;
    const def = urbanizaciones.find((u) => u.nombre.includes('CASUARINAS'));
    if (def) return [def.nombre];
    return urbanizaciones[0] ? [urbanizaciones[0].nombre] : [];
  }, [selectedUrbs, urbanizaciones]);

  const activeTitle = useMemo(() => {
    if (customGroupName.trim()) return cleanText(customGroupName);
    if (activeUrbsList.length === 0) return 'TODOS LOS SECTORES';
    if (activeUrbsList.length === 1) return activeUrbsList[0];
    return `GRUPO CONSOLIDADO (${activeUrbsList.length} DENOMINACIONES)`;
  }, [customGroupName, activeUrbsList]);

  const filteredUrbanizaciones = useMemo(() => {
    return urbanizaciones.filter((u) => {
      const matchSearch = !searchTerm.trim() || u.nombre.includes(cleanText(searchTerm));
      return matchSearch && u.count >= minCasosFilter;
    });
  }, [urbanizaciones, searchTerm, minCasosFilter]);

  const toggleUrbSelection = (urbName: string) => {
    setSelectedPinId(null);
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
    setSelectedPinId(null);
    setSelectedUrbs([urbName]);
    setCustomGroupName('');
    if (onFilterZona) onFilterZona(urbName);
  };

  const selectAllFiltered = () => {
    const allNames = filteredUrbanizaciones.map((u) => u.nombre);
    if (allNames.length > 0) {
      setSelectedPinId(null);
      setSelectedUrbs(allNames);
      if (!customGroupName.trim() && searchTerm.trim()) {
        setCustomGroupName(cleanText(searchTerm));
      }
    }
  };

  const handleResetAllFilters = () => {
    setSearchTerm('');
    setSelectedUrbs([]);
    setCustomGroupName('');
    setSelectedTurno('TODOS');
    setMinCasosFilter(0);
    setSelectedPinId(null);
    if (onFilterZona) onFilterZona('');
    if (onFilterTurno) onFilterTurno('TODOS');
  };

  const recordsInScope = useMemo(() => {
    return safeRecords.filter((r) => {
      const matchUrb = activeUrbsList.length === 0 || activeUrbsList.includes(getUrbanizacion(r));
      const matchTurno = selectedTurno === 'TODOS' || getTurno(r) === selectedTurno;
      return matchUrb && matchTurno;
    });
  }, [safeRecords, activeUrbsList, selectedTurno]);

  const criticalPoints = useMemo<CriticalMapPoint[]>(() => {
    const [lng, lat] = getSectorCenter(activeTitle);
    const maxPins = isMapExpanded ? 24 : 14;
    const count = Math.min(Math.max(recordsInScope.length, 4), maxPins);
    const radiusSpread = isMapExpanded ? 0.0042 : 0.0028;

    const list: CriticalMapPoint[] = [];
    for (let i = 0; i < count; i++) {
      const r: any = recordsInScope[i] || {};
      const parsedLat = parseFloat(r.lat || r.latitud);
      const parsedLng = parseFloat(r.lng || r.longitud);
      const offsetLng = !isNaN(parsedLng) ? parsedLng : lng + Math.sin(i * 1.7) * radiusSpread;
      const offsetLat = !isNaN(parsedLat) ? parsedLat : lat + Math.cos(i * 1.9) * (radiusSpread * 0.78);

      const mod = getModalidad(r);
      let variant: PinVariant = 'BLUE';
      if (mod.includes('ROBO') || mod.includes('HURTO') || mod.includes('DROGA') || mod.includes('VIOLENCIA') || i % 4 === 0) {
        variant = 'RED';
      } else if (mod.includes('ALCOHOL') || mod.includes('ALTERACION') || mod.includes('RUIDO') || i % 4 === 1) {
        variant = 'AMBER';
      } else if (mod.includes('AUXILIO') || mod.includes('APOYO') || mod.includes('ACCIDENTE') || i % 4 === 2) {
        variant = 'EMERALD';
      }

      list.push({
        id: `pt_${i}`,
        index: i + 1,
        lng: offsetLng,
        lat: offsetLat,
        modalidad: mod,
        lugar: getUrbanizacion(r) || activeTitle,
        turno: getTurno(r),
        vehiculo: getVehiculo(r),
        variant
      });
    }
    return list;
  }, [recordsInScope, activeTitle, isMapExpanded]);

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

  const todasFrecuenciasModalidades = useMemo(() => {
    const counts: Record<string, number> = {};
    recordsInScope.forEach((r) => {
      const mod = getModalidad(r);
      counts[mod] = (counts[mod] || 0) + 1;
    });
    const total = recordsInScope.length || 1;
    let acumulado = 0;
    return Object.entries(counts)
      .map(([modalidad, count]) => ({
        modalidad,
        count,
        porcentaje: Number(((count / total) * 100).toFixed(2))
      }))
      .sort((a, b) => b.count - a.count)
      .map((item) => {
        acumulado += item.porcentaje;
        return {
          ...item,
          acumulado: Math.min(100, Number(acumulado.toFixed(2)))
        };
      });
  }, [recordsInScope]);

  const matrizAnualPorMeses = useMemo(() => {
    const mapMod = new Map<string, number[]>();
    const totalesMes = Array(12).fill(0);

    recordsInScope.forEach((r) => {
      const mod = getModalidad(r);
      const mIdx = getMonthIndex(r);
      if (!mapMod.has(mod)) {
        mapMod.set(mod, Array(12).fill(0));
      }
      if (mIdx >= 0 && mIdx < 12) {
        mapMod.get(mod)![mIdx] += 1;
        totalesMes[mIdx] += 1;
      }
    });

    const totalGeneral = recordsInScope.length || 1;
    const filas = Array.from(mapMod.entries())
      .map(([modalidad, meses]) => {
        const totalFila = meses.reduce((acc, v) => acc + v, 0);
        return {
          modalidad,
          meses,
          total: totalFila,
          porcentaje: Number(((totalFila / totalGeneral) * 100).toFixed(2))
        };
      })
      .sort((a, b) => b.total - a.total);

    const rankingMensualDescendente: BeveledBarItem[] = MESES_LARGOS.map((nombreMes, idx) => ({
      label: nombreMes,
      count: totalesMes[idx],
      porcentaje: Number(((totalesMes[idx] / totalGeneral) * 100).toFixed(2))
    }))
      .filter((m) => m.count > 0)
      .sort((a, b) => b.count - a.count);

    return {
      filas,
      totalesMes,
      totalGeneral: recordsInScope.length,
      rankingMensualDescendente:
        rankingMensualDescendente.length > 0
          ? rankingMensualDescendente
          : MESES_LARGOS.map((label) => ({ label, count: 0, porcentaje: 0 }))
    };
  }, [recordsInScope]);

  const frecuenciaModalidadesTop = useMemo(
    () => todasFrecuenciasModalidades.slice(0, 8),
    [todasFrecuenciasModalidades]
  );

  // Vuelo cinematográfico suave en 3D que se detiene DEBAJO del pin crítico
  const flyToPinCinematic = (map: any, pt: CriticalMapPoint) => {
    if (!map) return;
    try {
      const nextBearing = ((pt.index * 28) % 90) - 45;
      map.flyTo({
        center: [pt.lng, pt.lat],
        offset: [0, 105], // Posiciona la cámara ligeramente debajo del pin para lucirlo en 3D
        zoom: 17.5,
        pitch: 72,
        bearing: nextBearing,
        duration: 2400, // Vuelo cinematográfico suave de 2.4 segundos (sin saltos toscos)
        curve: 1.45,
        easing: (t: number) => 1 - Math.pow(1 - t, 3),
        essential: true
      });
    } catch (e) {}
  };

  const handleFlyToPoint = (pt: CriticalMapPoint) => {
    setSelectedPinId(pt.id);
    flyToPinCinematic(mapInstanceRef.current, pt);
  };

  const handleResetMapCamera = () => {
    setSelectedPinId(null);
    const map = mapInstanceRef.current;
    if (!map) return;
    const [lng, lat] = getSectorCenter(activeTitle);
    try {
      map.flyTo({
        center: [lng, lat],
        offset: [0, 0],
        zoom: 16.0,
        pitch: 62,
        bearing: -25,
        duration: 1800,
        curve: 1.3
      });
    } catch (e) {}
  };

  const drawBeveledChartInPdf = (
    doc: any,
    startY: number,
    pageWidth: number,
    title: string,
    subtitle: string,
    items: BeveledBarItem[]
  ): number => {
    const marginX = 14;
    const boxWidth = pageWidth - marginX * 2;
    const displayItems = items.slice(0, 12);
    const rowHeight = 6.6;
    const headerHeight = 13;
    const footerHeight = 7;
    const boxHeight = headerHeight + displayItems.length * rowHeight + footerHeight;

    doc.setFillColor(248, 250, 252);
    doc.setDrawColor(203, 213, 225);
    doc.roundedRect(marginX, startY, boxWidth, boxHeight, 2, 2, 'FD');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9.5);
    doc.setTextColor(15, 23, 42);
    doc.text(title, pageWidth / 2, startY + 5.5, { align: 'center' });

    const maxVal = Math.max(...displayItems.map((i) => i.count), 1);
    const rawStep = maxVal / 5;
    const magnitude = Math.pow(10, Math.floor(Math.log10(Math.max(rawStep, 1))));
    const niceStep = Math.ceil(rawStep / magnitude) * magnitude || 1;
    const scaleMax = niceStep * 5;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.2);
    doc.setTextColor(100, 116, 139);
    doc.text(
      `${subtitle} (Escala 0 a ${scaleMax.toLocaleString()} casos)`,
      pageWidth / 2,
      startY + 9.8,
      { align: 'center' }
    );

    const labelColW = 50;
    const valueTextColW = 44;
    const plotX = marginX + labelColW + 2;
    const plotW = boxWidth - labelColW - valueTextColW - 6;
    const plotTopY = startY + headerHeight;
    const plotBottomY = plotTopY + displayItems.length * rowHeight;

    doc.setDrawColor(226, 232, 240);
    doc.setLineWidth(0.2);
    for (let s = 0; s <= 5; s++) {
      const gx = plotX + (s / 5) * plotW;
      doc.line(gx, plotTopY, gx, plotBottomY);
      doc.setFontSize(6.5);
      doc.setTextColor(100, 116, 139);
      doc.text((niceStep * s).toLocaleString(), gx, plotBottomY + 4, { align: 'center' });
    }

    displayItems.forEach((item, idx) => {
      const rowY = plotTopY + idx * rowHeight;
      const barY = rowY + 1.1;
      const barH = 4.2;
      const barW = Math.max(1.5, (item.count / scaleMax) * plotW);

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(7);
      doc.setTextColor(30, 41, 59);
      const truncatedLabel = item.label.length > 28 ? `${item.label.slice(0, 27)}…` : item.label;
      doc.text(truncatedLabel, plotX - 2.5, barY + 3.1, { align: 'right' });

      doc.setFillColor(15, 23, 42);
      doc.rect(plotX, barY + barH - 0.3, barW, 0.7, 'F');

      doc.setFillColor(56, 189, 248);
      doc.rect(plotX, barY, barW, barH / 2, 'F');

      doc.setFillColor(29, 78, 216);
      doc.rect(plotX, barY + barH / 2, barW, barH / 2, 'F');

      doc.setDrawColor(30, 58, 138);
      doc.setLineWidth(0.25);
      doc.rect(plotX, barY, barW, barH, 'S');

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(6.8);
      doc.setTextColor(15, 23, 42);
      doc.text(
        `${item.count.toLocaleString()} casos (${item.porcentaje.toFixed(2)}%)`,
        plotX + barW + 2,
        barY + 3.1
      );
    });

    return startY + boxHeight;
  };

  const handleDownloadPdfFromPreview = async () => {
    setExportingPdf(true);
    try {
      const loadScript = (src: string) =>
        new Promise<void>((resolve, reject) => {
          if (document.querySelector(`script[src="${src}"]`)) {
            resolve();
            return;
          }
          const s = document.createElement('script');
          s.src = src;
          s.async = true;
          s.onload = () => resolve();
          s.onerror = () => reject(new Error(`No se pudo cargar ${src}`));
          document.head.appendChild(s);
        });

      await loadScript('https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js');
      await loadScript('https://cdnjs.cloudflare.com/ajax/libs/jspdf-autotable/3.8.2/jspdf.plugin.autotable.min.js');

      const { jsPDF } = (window as any).jspdf;
      const isAnual = previewTab === 'ANUAL_MESES';
      const doc = new jsPDF({
        orientation: isAnual ? 'landscape' : 'portrait',
        unit: 'mm',
        format: 'a4'
      });

      const pageWidth = isAnual ? 297 : 210;
      const pageHeight = isAnual ? 210 : 297;
      const fechaEmision = new Date().toLocaleDateString('es-PE', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });

      doc.setFillColor(8, 32, 64);
      doc.rect(0, 0, pageWidth, 26, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(11);
      doc.text('MUNICIPALIDAD DISTRITAL DE NUEVO CHIMBOTE', 14, 9.5);
      doc.setFontSize(8.5);
      doc.setTextColor(103, 232, 249);
      doc.text('GERENCIA DE SEGURIDAD CIUDADANA Y GESTIÓN DEL RIESGO DE DESASTRES - SERENAZGO', 14, 15.2);
      doc.setFontSize(7.8);
      doc.setTextColor(220, 235, 245);
      doc.text(
        `${isAnual ? 'RESUMEN ANUAL COMPARATIVO POR MESES (ENE - DIC)' : 'FICHA DE FRECUENCIA DE INCIDENCIAS POR SECTOR'}  |  EMISIÓN: ${fechaEmision}`,
        14,
        21.2
      );

      doc.setDrawColor(6, 182, 212);
      doc.setFillColor(240, 249, 255);
      doc.roundedRect(14, 29, pageWidth - 28, 18, 2, 2, 'FD');

      doc.setTextColor(8, 47, 73);
      doc.setFontSize(7.5);
      doc.setFont('helvetica', 'bold');
      doc.text('SECTOR / JURISDICCIÓN CONSOLIDADA:', 18, 34);

      doc.setFontSize(10.5);
      doc.setTextColor(12, 74, 110);
      doc.text(activeTitle, 18, 39.5);

      doc.setFontSize(7);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(51, 65, 85);
      const variantesTexto = `Denominaciones unificadas (${activeUrbsList.length}): ${activeUrbsList.join(' | ')}`;
      const lineasVariantes = doc.splitTextToSize(variantesTexto, pageWidth - 36);
      doc.text(lineasVariantes.slice(0, 2), 18, 44);

      if (!isAnual) {
        const chartItems: BeveledBarItem[] = todasFrecuenciasModalidades.slice(0, 10).map((m) => ({
          label: m.modalidad,
          count: m.count,
          porcentaje: m.porcentaje
        }));

        const afterChartY = drawBeveledChartInPdf(
          doc,
          50,
          pageWidth,
          `DISTRIBUCIÓN DE MODALIDADES EN ${activeTitle}`,
          'Orden descendente de volumen operativo registrado en el sector',
          chartItems
        );

        const tableRows = todasFrecuenciasModalidades.map((item, index) => [
          index + 1,
          item.modalidad,
          item.count.toLocaleString(),
          `${item.porcentaje.toFixed(2)}%`,
          `${item.acumulado.toFixed(2)}%`
        ]);

        tableRows.push(['', 'TOTAL GENERAL CONSOLIDADO', hudData.total.toLocaleString(), '100.00%', '100.00%']);

        (doc as any).autoTable({
          startY: afterChartY + 5,
          head: [['N°', 'TIPO / MODALIDAD DE INCIDENCIA', 'FRECUENCIA (fi)', 'PORCENTAJE (hi%)', '% ACUMULADO']],
          body: tableRows,
          theme: 'striped',
          headStyles: { fillColor: [8, 32, 64], textColor: 255, fontSize: 7.5, halign: 'center' },
          columnStyles: {
            0: { halign: 'center', cellWidth: 12 },
            1: { halign: 'left' },
            2: { halign: 'right', cellWidth: 26 },
            3: { halign: 'right', cellWidth: 28 },
            4: { halign: 'right', cellWidth: 26 }
          },
          styles: { fontSize: 7.5, cellPadding: 1.8 },
          didParseCell: (data: any) => {
            if (data.row.index === tableRows.length - 1) {
              data.cell.styles.fontStyle = 'bold';
              data.cell.styles.fillColor = [224, 242, 254];
              data.cell.styles.textColor = [8, 47, 73];
            }
          },
          margin: { left: 14, right: 14, bottom: 14 }
        });
      } else {
        const headAnual = [['N°', 'MODALIDAD DE INCIDENCIA', ...MESES_CORTOS, 'TOTAL', '%']];
        const bodyAnual = matrizAnualPorMeses.filas.map((f, idx) => [
          idx + 1,
          f.modalidad,
          ...f.meses.map((v) => (v === 0 ? '-' : v)),
          f.total,
          `${f.porcentaje}%`
        ]);

        bodyAnual.push([
          '',
          'TOTAL MENSUAL CONSOLIDADO',
          ...matrizAnualPorMeses.totalesMes,
          matrizAnualPorMeses.totalGeneral,
          '100%'
        ]);

        (doc as any).autoTable({
          startY: 50,
          head: headAnual,
          body: bodyAnual,
          theme: 'grid',
          headStyles: { fillColor: [8, 32, 64], textColor: 255, fontSize: 6.8, halign: 'center' },
          columnStyles: {
            0: { halign: 'center', cellWidth: 9 },
            1: { halign: 'left', cellWidth: 68 },
            14: { halign: 'right', fontStyle: 'bold', cellWidth: 16 },
            15: { halign: 'right', cellWidth: 14 }
          },
          styles: { fontSize: 6.8, cellPadding: 1.6, halign: 'center' },
          didParseCell: (data: any) => {
            if (data.row.index === bodyAnual.length - 1) {
              data.cell.styles.fontStyle = 'bold';
              data.cell.styles.fillColor = [224, 242, 254];
              data.cell.styles.textColor = [8, 47, 73];
            }
          },
          margin: { left: 14, right: 14, bottom: 14 }
        });

        let chartStartY = (doc as any).lastAutoTable.finalY + 6;
        const neededH = 13 + matrizAnualPorMeses.rankingMensualDescendente.length * 6.6 + 12;
        if (chartStartY + neededH > pageHeight - 12) {
          doc.addPage();
          chartStartY = 14;
        }

        drawBeveledChartInPdf(
          doc,
          chartStartY,
          pageWidth,
          `EVOLUCIÓN MENSUAL DE INCIDENCIAS OPERATIVAS - ${activeTitle}`,
          'Distribución de atenciones registradas por mes en orden descendente de volumen operativo',
          matrizAnualPorMeses.rankingMensualDescendente
        );
      }

      const pageCount = doc.internal.getNumberOfPages();
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(7.5);
        doc.setTextColor(100, 116, 139);
        doc.text(
          `Sistema de Ciber-Monitoreo Serenazgo Nuevo Chimbote | Desarrollado por: Arturo David Rivero Onofre (ADRO) | Pág. ${i}/${pageCount}`,
          14,
          pageHeight - 6
        );
      }

      const fileNameSafe = activeTitle.replace(/[^A-Z0-9_-]/gi, '_').slice(0, 38);
      doc.save(`${isAnual ? 'Comparativo_Anual_Meses' : 'Tabla_Frecuencia'}_${fileNameSafe}.pdf`);
    } catch (error) {
      console.error('Error al generar PDF:', error);
      window.print();
    } finally {
      setExportingPdf(false);
    }
  };

  useEffect(() => {
    let isMounted = true;
    const loadMapLibre = async () => {
      try {
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
          center: [-78.5265, -9.1265],
          zoom: 16.0,
          pitch: 62,
          bearing: -25,
          antialias: true
        });

        map.addControl(new maplibregl.NavigationControl({ visualizePitch: true }), 'top-right');
        map.on('load', () => {
          if (isMounted) setMapReady(true);
        });
        mapInstanceRef.current = map;
      } catch (err) {
        console.warn('Aviso mapa 3D:', err);
      }
    };
    loadMapLibre();
    return () => {
      isMounted = false;
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  // Control automático de colores del mapa:
  // - Pantalla principal: siempre oscuro cian para coordinar con todo el panel.
  // - Pantalla completa: permite escoger entre Claro (calles nítidas) o Noche.
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;
    try {
      const canvas = map.getCanvas();
      if (!canvas) return;
      if (isMapExpanded && expandedMapTheme === 'LIGHT') {
        canvas.style.filter = 'brightness(104%) contrast(125%) saturate(135%)';
      } else {
        canvas.style.filter = 'invert(92%) hue-rotate(185deg) brightness(106%) contrast(148%) saturate(155%)';
      }
    } catch (e) {}
  }, [isMapExpanded, expandedMapTheme, mapReady]);

  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;
    const timer = setTimeout(() => {
      try {
        map.resize();
      } catch (e) {}
    }, 120);
    return () => clearTimeout(timer);
  }, [isMapExpanded]);

  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || !mapReady) return;
    const [lng, lat] = getSectorCenter(activeTitle);
    try {
      map.flyTo({
        center: [lng, lat],
        offset: [0, 0],
        zoom: 16.0,
        pitch: 62,
        bearing: -25,
        duration: 1800,
        curve: 1.3
      });
    } catch (e) {}
  }, [activeTitle, mapReady]);

  useEffect(() => {
    const map = mapInstanceRef.current;
    const maplibregl = (window as any).maplibregl;
    if (!map || !maplibregl || !mapReady) return;

    markersRef.current.forEach((m) => {
      try {
        m.remove();
      } catch (e) {}
    });
    markersRef.current = [];

    criticalPoints.forEach((pt) => {
      try {
        const el = document.createElement('div');
        el.innerHTML = create3DPinHtml(pt.variant, pt.index);

        el.addEventListener('click', (e) => {
          e.stopPropagation();
          setSelectedPinId(pt.id);
          flyToPinCinematic(map, pt);
        });

        const popupHtml = `
          <div style="font-family:monospace;font-size:11px;color:#0f172a;padding:3px 5px;max-width:225px;">
            <div style="font-weight:900;color:#0369a1;margin-bottom:2px;">#${pt.index} • ${pt.modalidad}</div>
            <div><strong>Sector:</strong> ${pt.lugar}</div>
            <div><strong>Turno:</strong> ${pt.turno} | <strong>Móvil:</strong> ${pt.vehiculo}</div>
          </div>
        `;

        const popup = new maplibregl.Popup({ offset: 28, closeButton: false }).setHTML(popupHtml);
        const marker = new maplibregl.Marker({ element: el })
          .setLngLat([pt.lng, pt.lat])
          .setPopup(popup)
          .addTo(map);

        markersRef.current.push(marker);
      } catch (e) {}
    });
  }, [criticalPoints, mapReady]);

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

  const selectedPointObj = useMemo(
    () => criticalPoints.find((p) => p.id === selectedPinId) || null,
    [criticalPoints, selectedPinId]
  );

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
                  <Wifi className="w-4 h-4 text-emerald-400" /> {safeRecords.length.toLocaleString()} REG
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
              className="flex items-center gap-1.5 px-3 py-3 bg-rose-500/25 hover:bg-rose-500/40 border border-rose-400 rounded-xl text-rose-100 text-xs font-mono font-black uppercase tracking-wider shadow-[0_0_15px_rgba(244,63,94,0.35)] cursor-pointer transition"
            >
              <RotateCcw className="w-4 h-4" />
              <span>BORRAR FILTROS</span>
            </button>

            <button
              onClick={() => setIsPreviewOpen(true)}
              className="flex items-center gap-1.5 px-4 py-3 bg-gradient-to-r from-emerald-500/40 to-cyan-500/40 hover:from-emerald-400/60 hover:to-cyan-400/60 border-2 border-emerald-300 rounded-xl text-white text-xs font-mono font-black uppercase tracking-wider shadow-[0_0_25px_rgba(16,185,129,0.5)] cursor-pointer transition"
            >
              <Eye className="w-4 h-4 text-emerald-200" />
              <span>VISTA PREVIA / PDF</span>
            </button>
          </div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
          {/* COLUMNA IZQUIERDA */}
          <aside className="lg:col-span-3 flex flex-col gap-3">
            <div className="border-2 border-cyan-400/60 bg-[#051428]/95 rounded-xl p-3 relative shadow-[inset_0_0_25px_rgba(6,182,212,0.15)]">
              <div className="absolute -top-[2px] -left-[2px] w-6 h-6 border-t-4 border-l-4 border-fuchsia-400 rounded-tl-xl pointer-events-none" />
              <div className="absolute -bottom-[2px] -right-[2px] w-6 h-6 border-b-4 border-r-4 border-emerald-400 rounded-br-xl pointer-events-none" />

              <div className="flex items-center justify-between mb-2">
                <h2 className="text-xs font-mono font-black tracking-wider text-cyan-200 uppercase flex items-center gap-1.5">
                  <Layers className="w-3.5 h-3.5 text-emerald-400" />
                  SECTORIZACIÓN / AGRUPAR
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
                  placeholder="Filtrar ej: CASUARINAS..."
                  className="w-full bg-[#020813] border border-cyan-400/60 focus:border-emerald-400 rounded-lg pl-8 pr-7 py-1.5 text-xs font-mono text-white placeholder-cyan-700 focus:outline-none"
                />
                {searchTerm && (
                  <button onClick={() => setSearchTerm('')} className="absolute right-2 top-2 text-cyan-400 hover:text-white cursor-pointer">
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              <div className="mb-2 p-2 rounded-lg bg-[#030c1a] border border-amber-400/50">
                <label className="text-[9px] font-mono font-bold text-amber-300 uppercase flex items-center gap-1 mb-1">
                  <Edit3 className="w-3 h-3" /> NOMBRE OFICIAL EN RESUMEN / PDF:
                </label>
                <input
                  type="text"
                  value={customGroupName}
                  onChange={(e) => setCustomGroupName(e.target.value)}
                  placeholder="Ej: URB. CASUARINAS (SIN A.H.)"
                  className="w-full bg-[#02060e] border border-amber-400/40 focus:border-amber-300 rounded px-2 py-1 text-xs font-mono font-bold text-amber-100 placeholder-cyan-800 focus:outline-none"
                />
              </div>

              {searchTerm.trim() !== '' && filteredUrbanizaciones.length > 1 && (
                <button
                  onClick={selectAllFiltered}
                  className="w-full mb-2 py-1.5 px-2.5 rounded-lg bg-gradient-to-r from-emerald-600/50 to-cyan-600/50 border border-emerald-300 text-[10px] font-mono font-black text-white uppercase flex items-center justify-center gap-1.5 cursor-pointer shadow-[0_0_15px_rgba(16,185,129,0.4)]"
                >
                  <CheckSquare className="w-3.5 h-3.5" />
                  MARCAR TODOS ({filteredUrbanizaciones.length}) Y LUEGO DESMARCA A.H.
                </button>
              )}

              {activeUrbsList.length > 1 && (
                <div className="mb-2 p-1.5 rounded-lg bg-cyan-950/70 border border-cyan-400/50">
                  <div className="flex items-center justify-between text-[9px] font-mono text-cyan-200 mb-1">
                    <span>INCLUIDOS ({activeUrbsList.length}):</span>
                    <button onClick={() => selectSingleUrb(activeUrbsList[0])} className="text-amber-300 underline cursor-pointer">
                      LIMPIAR
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-1 max-h-12 overflow-y-auto">
                    {activeUrbsList.map((name) => (
                      <span
                        key={name}
                        onClick={() => toggleUrbSelection(name)}
                        className="text-[9px] font-mono bg-emerald-500/25 border border-emerald-400 text-emerald-100 px-1.5 py-0.5 rounded cursor-pointer hover:bg-rose-500/30"
                      >
                        {name} ×
                      </span>
                    ))}
                  </div>
                </div>
              )}

              <div className="space-y-1 max-h-[180px] overflow-y-auto pr-1">
                {filteredUrbanizaciones.map((urb) => {
                  const isChecked = activeUrbsList.includes(urb.nombre);
                  return (
                    <div
                      key={urb.nombre}
                      className={`w-full px-2.5 py-1.5 rounded-lg text-xs font-mono flex items-center justify-between border transition-all ${
                        isChecked
                          ? 'bg-gradient-to-r from-emerald-500/40 via-cyan-500/35 to-blue-900/50 border-emerald-300 text-white font-black shadow-[0_0_15px_rgba(16,185,129,0.45)]'
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

            {/* RANGO DE TURNOS EXPANDIDO A ALTURA COMPLETA SIN ESPACIOS VACÍOS */}
            <div className="border-2 border-cyan-300/80 bg-gradient-to-b from-[#082242] via-[#051428] to-[#030b17] rounded-xl p-3.5 flex-1 flex flex-col justify-between shadow-[0_0_30px_rgba(6,182,212,0.25),inset_0_0_25px_rgba(6,182,212,0.15)]">
              <div className="flex items-center justify-between mb-2.5">
                <h3 className="text-sm font-mono font-black tracking-wider text-white uppercase drop-shadow-[0_0_8px_rgba(34,211,238,0.8)]">
                  RANGO DE TURNOS
                </h3>
                {selectedTurno !== 'TODOS' ? (
                  <button onClick={() => handleTurnoClick(selectedTurno)} className="text-[10px] font-mono text-amber-300 underline font-bold cursor-pointer">
                    VER TODOS
                  </button>
                ) : (
                  <span className="text-[9px] font-mono text-cyan-300 bg-cyan-950/90 border border-cyan-400/50 px-2 py-0.5 rounded font-bold">
                    FILTRO ACTIVO
                  </span>
                )}
              </div>

              <div className="grid grid-cols-3 gap-2.5 text-center flex-1 items-stretch">
                {[
                  { label: 'MAÑANA', horario: '06-14H', pct: hudData.pctManana, count: hudData.turnosCount.MAÑANA, color: '#10b981', glow: 'rgba(16,185,129,0.55)' },
                  { label: 'TARDE', horario: '14-22H', pct: hudData.pctTarde, count: hudData.turnosCount.TARDE, color: '#22d3ee', glow: 'rgba(34,211,238,0.55)' },
                  { label: 'NOCHE', horario: '22-06H', pct: hudData.pctNoche, count: hudData.turnosCount.NOCHE, color: '#ec4899', glow: 'rgba(236,72,153,0.55)' }
                ].map((t) => {
                  const active = selectedTurno === t.label;
                  const r = 42;
                  const circ = 2 * Math.PI * r;
                  const offset = circ - (t.pct / 100) * circ;
                  return (
                    <button
                      key={t.label}
                      onClick={() => handleTurnoClick(t.label)}
                      className={`h-full py-3 px-1.5 rounded-xl border-2 cursor-pointer flex flex-col items-center justify-between transition-all ${
                        active
                          ? 'bg-cyan-500/30 border-cyan-200 scale-[1.02]'
                          : 'bg-[#030b17]/95 border-cyan-500/45 hover:border-cyan-300 hover:bg-[#061830]'
                      }`}
                      style={{ boxShadow: active ? `0 0 26px ${t.glow}` : undefined }}
                    >
                      <span className="text-[9px] font-mono text-cyan-400/80 tracking-widest font-bold">
                        {t.horario}
                      </span>

                      <div className="relative w-24 h-24 xl:w-28 xl:h-28 flex items-center justify-center my-1">
                        <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                          <circle cx="50" cy="50" r={r} stroke="#0c2238" strokeWidth="7" fill="transparent" />
                          <circle cx="50" cy="50" r="31" stroke={t.color} strokeWidth="2.5" strokeOpacity="0.65" fill={t.color} fillOpacity="0.15" />
                          <circle cx="50" cy="50" r="21" stroke={t.color} strokeWidth="1.5" strokeOpacity="0.45" fill="transparent" />
                          <circle
                            cx="50"
                            cy="50"
                            r={r}
                            stroke={t.color}
                            strokeWidth="7"
                            strokeDasharray={circ}
                            strokeDashoffset={offset}
                            strokeLinecap="round"
                            fill="transparent"
                            style={{ filter: `drop-shadow(0 0 7px ${t.color})` }}
                          />
                        </svg>
                        <span className="absolute text-lg xl:text-xl font-mono font-black text-white drop-shadow-[0_0_8px_rgba(0,0,0,0.9)]">
                          {t.pct}%
                        </span>
                      </div>

                      <div className="w-full">
                        <span className="text-xs font-mono font-black text-cyan-100 block tracking-wider">
                          {t.label}
                        </span>
                        <span className="text-[10px] font-mono font-bold block mt-0.5" style={{ color: t.color }}>
                          {t.count} reg
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* BARRA COMPACTA DE DENSIDAD MÍNIMA Y AGENTE LÍDER */}
            <div className="border border-cyan-400/50 bg-[#041020]/95 rounded-lg px-3 py-2 space-y-1">
              <div className="flex items-center gap-2 text-[9px] font-mono text-cyan-200">
                <span className="shrink-0">MÍN. CASOS:</span>
                <input
                  type="range"
                  min={0}
                  max={100}
                  step={5}
                  value={minCasosFilter}
                  onChange={(e) => setMinCasosFilter(Number(e.target.value))}
                  className="flex-1 accent-emerald-400 cursor-pointer h-1 bg-cyan-950 rounded-lg"
                />
                <span className="text-emerald-300 font-bold shrink-0">{minCasosFilter}+</span>
              </div>
              <div className="flex items-center justify-between text-[9px] font-mono text-cyan-400/90 border-t border-cyan-500/20 pt-1">
                <span>AGENTE LÍDER:</span>
                <span className="text-cyan-100 font-semibold truncate max-w-[165px]">{hudData.topAgente}</span>
              </div>
            </div>
          </aside>

          {/* COLUMNA CENTRAL */}
          <main className="lg:col-span-6 flex flex-col gap-4">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {/* KPI 1 */}
              <div className="border-2 border-cyan-400/80 bg-gradient-to-b from-[#0b2950] via-[#061830] to-[#030b17] rounded-xl p-2.5 text-center flex flex-col justify-between min-h-[155px] relative overflow-hidden shadow-[0_0_25px_rgba(6,182,212,0.28)]">
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

              {/* KPI 2 */}
              <div className="border-2 border-cyan-400/80 bg-gradient-to-b from-[#0b2950] via-[#061830] to-[#030b17] rounded-xl p-2.5 text-center flex flex-col justify-between min-h-[155px] relative overflow-hidden shadow-[0_0_25px_rgba(6,182,212,0.28)]">
                <span className="text-[10px] font-mono font-black text-cyan-200 uppercase block tracking-widest">PATRULLAJE ACTIVO</span>

                <div className="flex items-center justify-center gap-2 my-auto">
                  <div className="w-20 h-20 rounded-full border-[3px] border-cyan-300 bg-cyan-950/60 flex flex-col items-center justify-center shadow-[0_0_20px_rgba(34,211,238,0.65)] relative">
                    <div className="absolute inset-1 rounded-full border border-dashed border-cyan-400/60" />
                    <span className="text-2xl font-black font-mono text-white leading-none">{hudData.unidadesActivasCount}</span>
                    <span className="text-[8px] font-mono font-bold text-cyan-300 mt-0.5">MÓVILES</span>
                  </div>
                  <div className="w-20 h-20 rounded-full border-2 border-dashed border-cyan-400/80 flex items-center justify-center bg-cyan-950/60">
                    <PatrolTruckHologram small />
                  </div>
                </div>

                <div className="border-t border-cyan-500/30 pt-1 flex items-center justify-between px-2 text-[9px] font-mono text-cyan-300/90">
                  <span>FLOTA ACTIVA</span>
                  <span className="text-emerald-300 font-bold">100% OPERATIVA</span>
                </div>
              </div>

              {/* KPI 3 */}
              <div className="border-2 border-cyan-400/80 bg-gradient-to-b from-[#0b2950] via-[#061830] to-[#030b17] rounded-xl p-2.5 text-center flex flex-col justify-between min-h-[155px] relative overflow-hidden shadow-[0_0_25px_rgba(6,182,212,0.28)]">
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

              {/* KPI 4 */}
              <div className="border-2 border-cyan-400/80 bg-gradient-to-b from-[#0b2950] via-[#061830] to-[#030b17] rounded-xl p-2.5 text-center flex flex-col justify-between min-h-[155px] relative overflow-hidden shadow-[0_0_25px_rgba(6,182,212,0.28)]">
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

            {/* ================================================================= */}
            {/* MAPA TÁCTICO 3D: OSCURO EN PRINCIPAL, CLARO/NOCHE AL AGRANDAR     */}
            {/* ================================================================= */}
            <div
              className={
                isMapExpanded
                  ? 'fixed inset-3 z-50 border-2 border-cyan-300 bg-[#020813] rounded-2xl p-3 flex flex-col shadow-[0_0_90px_rgba(6,182,212,0.75)]'
                  : 'border-2 border-cyan-400/80 bg-[#020813] rounded-xl p-2.5 relative overflow-hidden shadow-[0_0_35px_rgba(6,182,212,0.28)]'
              }
            >
              <div className="flex flex-wrap items-center justify-between gap-2 mb-1.5 px-1">
                <span className="text-xs font-mono font-black text-white uppercase flex items-center gap-2 truncate pr-2">
                  <Crosshair className="w-4 h-4 text-cyan-300 shrink-0" />
                  {activeTitle}
                </span>

                <div className="flex flex-wrap items-center gap-1.5">
                  {/* El selector de Claro / Noche aparece SOLO al agrandar el mapa */}
                  {isMapExpanded && (
                    <button
                      onClick={() => setExpandedMapTheme((prev) => (prev === 'LIGHT' ? 'DARK' : 'LIGHT'))}
                      className={`flex items-center gap-1 px-2.5 py-1 rounded-lg border text-[10px] font-mono font-black uppercase cursor-pointer transition ${
                        expandedMapTheme === 'LIGHT'
                          ? 'bg-amber-400/25 border-amber-300 text-amber-200'
                          : 'bg-cyan-950 border-cyan-400 text-cyan-200'
                      }`}
                    >
                      {expandedMapTheme === 'LIGHT' ? (
                        <>
                          <Moon className="w-3.5 h-3.5 text-cyan-300" />
                          <span>CAMBIAR A MODO NOCHE</span>
                        </>
                      ) : (
                        <>
                          <Sun className="w-3.5 h-3.5 text-amber-300" />
                          <span>CAMBIAR A MAPA CLARO</span>
                        </>
                      )}
                    </button>
                  )}

                  <button
                    onClick={() => setIsMapExpanded((prev) => !prev)}
                    className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-cyan-500/25 hover:bg-cyan-400/40 border border-cyan-300 text-cyan-100 text-[10px] font-mono font-black uppercase cursor-pointer transition shadow-[0_0_12px_rgba(34,211,238,0.45)]"
                  >
                    {isMapExpanded ? (
                      <>
                        <Minimize2 className="w-3.5 h-3.5 text-amber-300" />
                        <span>SALIR PANTALLA COMPLETA</span>
                      </>
                    ) : (
                      <>
                        <Maximize2 className="w-3.5 h-3.5 text-cyan-200" />
                        <span>PANTALLA COMPLETA</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              <div
                className={`w-full rounded-lg overflow-hidden border border-cyan-400/50 relative bg-[#020813] ${
                  isMapExpanded ? 'flex-1 h-full' : 'h-60 sm:h-64'
                }`}
              >
                <div ref={mapContainerRef} className="w-full h-full" />

                {/* PANEL FLOTANTE DE RECORRIDO 3D SUAVE A PUNTOS CRÍTICOS */}
                <div
                  className={`absolute top-2 left-2 z-10 border border-cyan-400/80 bg-[#030d1c]/92 backdrop-blur-md rounded-xl p-2 shadow-xl flex flex-col ${
                    isMapExpanded ? 'w-72 max-h-[75%]' : 'w-52 max-h-40'
                  }`}
                >
                  <div className="flex items-center justify-between border-b border-cyan-500/30 pb-1 mb-1">
                    <span className="text-[9px] font-mono font-black text-cyan-200 uppercase flex items-center gap-1">
                      <Navigation className="w-3 h-3 text-emerald-400" />
                      PUNTOS CRÍTICOS ({criticalPoints.length})
                    </span>
                    {selectedPinId && (
                      <button
                        onClick={handleResetMapCamera}
                        className="text-[8px] font-mono text-amber-300 underline cursor-pointer"
                      >
                        VISTA GENERAL
                      </button>
                    )}
                  </div>

                  <div className="overflow-y-auto space-y-1 pr-0.5">
                    {criticalPoints.map((pt) => {
                      const active = selectedPinId === pt.id;
                      const dotColor =
                        pt.variant === 'RED'
                          ? 'bg-rose-500'
                          : pt.variant === 'AMBER'
                          ? 'bg-amber-400'
                          : pt.variant === 'EMERALD'
                          ? 'bg-emerald-400'
                          : 'bg-sky-400';

                      return (
                        <button
                          key={pt.id}
                          onClick={() => handleFlyToPoint(pt)}
                          className={`w-full text-left px-2 py-1 rounded text-[9px] font-mono flex items-center gap-1.5 cursor-pointer transition ${
                            active
                              ? 'bg-cyan-500/35 border border-cyan-200 text-white font-black'
                              : 'bg-[#071930]/80 hover:bg-cyan-900/50 text-cyan-100 border border-transparent'
                          }`}
                        >
                          <span className={`w-2 h-2 rounded-full shrink-0 ${dotColor}`} />
                          <span className="truncate flex-1">#{pt.index} {pt.modalidad}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Tarjeta flotante ubicada justo debajo/al costado del encuadre del pin */}
                {selectedPointObj && (
                  <div className="absolute bottom-11 left-1/2 -translate-x-1/2 z-10 border-2 border-cyan-300 bg-[#030d1c]/95 backdrop-blur-md rounded-xl px-3.5 py-2.5 min-w-[240px] max-w-sm shadow-[0_0_25px_rgba(34,211,238,0.6)]">
                    <div className="flex items-center justify-between gap-3 mb-1">
                      <span className="text-[10px] font-mono font-black text-amber-300 uppercase">
                        PUNTO CRÍTICO #{selectedPointObj.index}
                      </span>
                      <button onClick={() => setSelectedPinId(null)} className="text-cyan-400 hover:text-white cursor-pointer">
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    <div className="text-xs font-mono font-black text-white leading-tight mb-1">
                      {selectedPointObj.modalidad}
                    </div>
                    <div className="text-[10px] font-mono text-cyan-200">
                      <div>SECTOR: {selectedPointObj.lugar}</div>
                      <div>TURNO: {selectedPointObj.turno} • MÓVIL: {selectedPointObj.vehiculo}</div>
                    </div>
                  </div>
                )}

                <div className="absolute bottom-2 left-2 z-10 border border-cyan-400/70 bg-[#030d1c]/92 backdrop-blur-md rounded-lg px-2.5 py-1.5 pointer-events-none">
                  <div className="flex flex-wrap items-center gap-2.5 text-[9px] font-mono text-cyan-100">
                    <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-rose-500 inline-block" />ALTA</span>
                    <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-amber-400 inline-block" />MEDIA</span>
                    <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-sky-400 inline-block" />PATRULLAJE</span>
                    <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-emerald-400 inline-block" />APOYO</span>
                  </div>
                </div>
              </div>
            </div>

            {/* MATRIZ DE FRECUENCIA DE INCIDENCIAS */}
            <div className="border-2 border-cyan-400/70 bg-[#051428]/95 rounded-xl p-3.5 shadow-[inset_0_0_25px_rgba(6,182,212,0.12)]">
              <div className="flex items-center justify-between mb-2.5">
                <h3 className="text-xs font-mono font-black text-white uppercase flex items-center gap-1.5">
                  <Activity className="w-4 h-4 text-cyan-400" />
                  MATRIZ DE FRECUENCIA ({activeTitle})
                </h3>
                <span className="text-[10px] font-mono text-emerald-300 font-bold">
                  {todasFrecuenciasModalidades.length} MODALIDADES // {hudData.total.toLocaleString()} CASOS
                </span>
              </div>
              <div className="space-y-2 max-h-[205px] overflow-y-auto pr-1">
                {frecuenciaModalidadesTop.length === 0 ? (
                  <div className="text-center py-6 text-xs font-mono text-cyan-500">SIN INCIDENCIAS EN ESTE FILTRO</div>
                ) : (
                  frecuenciaModalidadesTop.map((item, idx) => (
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

      {/* VENTANA MODAL DE VISTA PREVIA CON GRÁFICO 3D BISELADO ANTES DE DESCARGAR */}
      {isPreviewOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-2 sm:p-4">
          <div className="bg-[#051326] border-2 border-cyan-400 rounded-2xl max-w-6xl w-full max-h-[92vh] flex flex-col shadow-[0_0_60px_rgba(6,182,212,0.5)] overflow-hidden">
            <div className="bg-[#030b17] border-b border-cyan-500/40 px-4 py-3 flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <Eye className="w-5 h-5 text-emerald-400" />
                <div>
                  <h2 className="text-xs sm:text-sm font-mono font-black text-white uppercase">
                    VISTA PREVIA DEL PDF // {activeTitle}
                  </h2>
                  <p className="text-[10px] font-mono text-cyan-300">
                    Verifica los gráficos 3D y las tablas consolidadas antes de descargar
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-1.5 bg-[#071930] p-1 rounded-xl border border-cyan-500/40">
                <button
                  onClick={() => setPreviewTab('FRECUENCIA')}
                  className={`px-3 py-1.5 rounded-lg text-[10px] font-mono font-black uppercase cursor-pointer transition flex items-center gap-1.5 ${
                    previewTab === 'FRECUENCIA'
                      ? 'bg-cyan-500 text-slate-950 shadow-[0_0_12px_rgba(34,211,238,0.6)]'
                      : 'text-cyan-200 hover:bg-cyan-950'
                  }`}
                >
                  <Activity className="w-3.5 h-3.5" />
                  1. FRECUENCIA + GRÁFICO
                </button>
                <button
                  onClick={() => setPreviewTab('ANUAL_MESES')}
                  className={`px-3 py-1.5 rounded-lg text-[10px] font-mono font-black uppercase cursor-pointer transition flex items-center gap-1.5 ${
                    previewTab === 'ANUAL_MESES'
                      ? 'bg-emerald-400 text-slate-950 shadow-[0_0_12px_rgba(16,185,129,0.6)]'
                      : 'text-cyan-200 hover:bg-cyan-950'
                  }`}
                >
                  <CalendarRange className="w-3.5 h-3.5" />
                  2. COMPARATIVO ANUAL POR MESES
                </button>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={handleDownloadPdfFromPreview}
                  disabled={exportingPdf}
                  className="flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-400 hover:to-cyan-400 text-slate-950 rounded-xl text-xs font-mono font-black uppercase cursor-pointer shadow-[0_0_20px_rgba(16,185,129,0.5)]"
                >
                  <FileDown className="w-4 h-4" />
                  <span>{exportingPdf ? 'GENERANDO PDF...' : 'DESCARGAR ESTE PDF'}</span>
                </button>
                <button
                  onClick={() => setIsPreviewOpen(false)}
                  className="p-2 rounded-xl bg-rose-500/20 hover:bg-rose-500/40 border border-rose-400 text-rose-200 cursor-pointer"
                  title="Cerrar vista previa"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-slate-900/90">
              <div className="bg-white text-slate-900 rounded-lg shadow-2xl p-6 max-w-5xl mx-auto border border-slate-300">
                <div className="bg-[#082040] text-white p-4 rounded-t-md flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                  <div>
                    <div className="text-sm font-black tracking-wide">MUNICIPALIDAD DISTRITAL DE NUEVO CHIMBOTE</div>
                    <div className="text-[11px] text-cyan-300 font-semibold">
                      GERENCIA DE SEGURIDAD CIUDADANA Y GESTIÓN DEL RIESGO DE DESASTRES - SERENAZGO
                    </div>
                  </div>
                  <div className="text-[10px] font-mono bg-cyan-950/80 border border-cyan-400/50 px-2.5 py-1 rounded text-cyan-100">
                    {previewTab === 'FRECUENCIA' ? 'FORMATO A4 VERTICAL' : 'FORMATO A4 HORIZONTAL (12 MESES)'}
                  </div>
                </div>

                <div className="bg-sky-50 border border-sky-300 p-3.5 mt-3 mb-4 rounded">
                  <div className="text-[10px] font-bold text-sky-900 uppercase">SECTOR / JURISDICCIÓN CONSOLIDADA:</div>
                  <div className="text-base font-black text-sky-950">{activeTitle}</div>
                  <div className="text-[11px] text-slate-600 mt-1">
                    <strong>Lugares incluidos ({activeUrbsList.length}):</strong> {activeUrbsList.join(' • ')}
                  </div>
                </div>

                {previewTab === 'FRECUENCIA' ? (
                  <div>
                    <BeveledHorizontalBarChart
                      title={`DISTRIBUCIÓN DE MODALIDADES EN ${activeTitle}`}
                      subtitle="Distribución de incidencias registradas en orden descendente de volumen operativo"
                      items={todasFrecuenciasModalidades.slice(0, 10).map((m) => ({
                        label: m.modalidad,
                        count: m.count,
                        porcentaje: m.porcentaje
                      }))}
                    />

                    <h4 className="text-xs font-black text-slate-800 uppercase mb-2">
                      TABLA DE FRECUENCIA CONSOLIDADA POR MODALIDAD
                    </h4>
                    <div className="overflow-x-auto border border-slate-300 rounded">
                      <table className="w-full text-xs border-collapse">
                        <thead>
                          <tr className="bg-[#082040] text-white">
                            <th className="p-2 text-center w-12">N°</th>
                            <th className="p-2 text-left">TIPO / MODALIDAD DE INCIDENCIA</th>
                            <th className="p-2 text-right w-28">FRECUENCIA (fi)</th>
                            <th className="p-2 text-right w-28">PORCENTAJE (%)</th>
                            <th className="p-2 text-right w-28">% ACUMULADO</th>
                          </tr>
                        </thead>
                        <tbody>
                          {todasFrecuenciasModalidades.map((row, idx) => (
                            <tr key={row.modalidad} className={idx % 2 === 0 ? 'bg-white' : 'bg-slate-50'}>
                              <td className="p-2 text-center border-t border-slate-200">{idx + 1}</td>
                              <td className="p-2 font-semibold border-t border-slate-200">{row.modalidad}</td>
                              <td className="p-2 text-right font-mono border-t border-slate-200">{row.count.toLocaleString()}</td>
                              <td className="p-2 text-right font-mono border-t border-slate-200">{row.porcentaje.toFixed(2)}%</td>
                              <td className="p-2 text-right font-mono border-t border-slate-200">{row.acumulado.toFixed(2)}%</td>
                            </tr>
                          ))}
                          <tr className="bg-sky-100 font-black text-sky-950">
                            <td className="p-2 text-center border-t-2 border-sky-400"></td>
                            <td className="p-2 border-t-2 border-sky-400">TOTAL GENERAL CONSOLIDADO</td>
                            <td className="p-2 text-right font-mono border-t-2 border-sky-400">{hudData.total.toLocaleString()}</td>
                            <td className="p-2 text-right font-mono border-t-2 border-sky-400">100.00%</td>
                            <td className="p-2 text-right font-mono border-t-2 border-sky-400">100.00%</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>
                ) : (
                  <div>
                    <h4 className="text-xs font-black text-slate-800 uppercase mb-2">
                      CUADRO ANUAL COMPARATIVO DE FRECUENCIA POR MESES (ENE - DIC)
                    </h4>
                    <div className="overflow-x-auto border border-slate-300 rounded mb-4">
                      <table className="w-full text-[11px] border-collapse">
                        <thead>
                          <tr className="bg-[#082040] text-white">
                            <th className="p-1.5 text-center">N°</th>
                            <th className="p-1.5 text-left min-w-[180px]">MODALIDAD</th>
                            {MESES_CORTOS.map((m) => (
                              <th key={m} className="p-1.5 text-center">{m}</th>
                            ))}
                            <th className="p-1.5 text-right bg-cyan-900">TOTAL</th>
                            <th className="p-1.5 text-right bg-cyan-900">%</th>
                          </tr>
                        </thead>
                        <tbody>
                          {matrizAnualPorMeses.filas.map((fila, idx) => (
                            <tr key={fila.modalidad} className={idx % 2 === 0 ? 'bg-white' : 'bg-slate-50'}>
                              <td className="p-1.5 text-center border-t border-slate-200">{idx + 1}</td>
                              <td className="p-1.5 font-semibold border-t border-slate-200">{fila.modalidad}</td>
                              {fila.meses.map((val, mIdx) => (
                                <td
                                  key={mIdx}
                                  className={`p-1.5 text-center font-mono border-t border-slate-200 ${
                                    val > 0 ? 'font-bold text-slate-900' : 'text-slate-300'
                                  }`}
                                >
                                  {val === 0 ? '-' : val}
                                </td>
                              ))}
                              <td className="p-1.5 text-right font-mono font-black bg-sky-50 border-t border-slate-200">
                                {fila.total}
                              </td>
                              <td className="p-1.5 text-right font-mono bg-sky-50 border-t border-slate-200">
                                {fila.porcentaje}%
                              </td>
                            </tr>
                          ))}
                          <tr className="bg-sky-100 font-black text-sky-950">
                            <td className="p-1.5 text-center border-t-2 border-sky-400"></td>
                            <td className="p-1.5 border-t-2 border-sky-400">TOTAL MENSUAL</td>
                            {matrizAnualPorMeses.totalesMes.map((tot, idx) => (
                              <td key={idx} className="p-1.5 text-center font-mono border-t-2 border-sky-400">
                                {tot}
                              </td>
                            ))}
                            <td className="p-1.5 text-right font-mono border-t-2 border-sky-400">
                              {matrizAnualPorMeses.totalGeneral}
                            </td>
                            <td className="p-1.5 text-right font-mono border-t-2 border-sky-400">100%</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>

                    <BeveledHorizontalBarChart
                      title={`EVOLUCIÓN MENSUAL DE INCIDENCIAS OPERATIVAS - ${activeTitle}`}
                      subtitle="Distribución de atenciones registradas por mes en orden descendente de volumen operativo"
                      items={matrizAnualPorMeses.rankingMensualDescendente}
                    />
                  </div>
                )}

                <div className="mt-5 pt-2.5 border-t border-slate-300 flex flex-col sm:flex-row justify-between text-[10px] text-slate-500 font-mono">
                  <span>Sistema de Ciber-Monitoreo Serenazgo Nuevo Chimbote</span>
                  <span className="font-bold text-slate-700">Desarrollado por: Arturo David Rivero Onofre (ADRO)</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AnalyticsDashboardView;
