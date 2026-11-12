import React, { useState, useMemo } from 'react';
import {
  Shield,
  Car,
  UserCheck,
  Printer,
  MapPin,
  Search,
  ChevronRight,
  BarChart3,
  Activity,
  Radio,
  Crosshair,
  Cpu,
  Flame
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

export const AnalyticsDashboardView: React.FC<AnalyticsDashboardViewProps> = ({
  records = [],
  onFilterZona,
  onFilterTurno
}) => {
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [selectedUrb, setSelectedUrb] = useState<string>('');
  const [selectedTurno, setSelectedTurno] = useState<string>('TODOS');

  // 1. Lista única sin duplicados de Urbanizaciones / A.H.
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

  const activeUrb = useMemo(() => {
    if (selectedUrb) return selectedUrb;
    const casuarinas = urbanizaciones.find((u) => u.nombre.includes('CASUARINAS'));
    if (casuarinas) return casuarinas.nombre;
    return urbanizaciones[0]?.nombre || 'TODOS LOS SECTORES';
  }, [selectedUrb, urbanizaciones]);

  const filteredUrbanizaciones = useMemo(() => {
    if (!searchTerm.trim()) return urbanizaciones;
    const q = cleanText(searchTerm);
    return urbanizaciones.filter((u) => u.nombre.includes(q));
  }, [urbanizaciones, searchTerm]);

  // 2. Registros filtrados
  const recordsInScope = useMemo(() => {
    return records.filter((r) => {
      const urb = getUrbanizacion(r);
      const matchUrb = activeUrb === 'TODOS LOS SECTORES' || urb === activeUrb;
      const turno = getTurno(r);
      const matchTurno = selectedTurno === 'TODOS' || turno === selectedTurno;
      return matchUrb && matchTurno;
    });
  }, [records, activeUrb, selectedTurno]);

  // 3. KPIs y datos para gráficos vectoriales SVG
  const kpiData = useMemo(() => {
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
    const topVehiculo = movilesReales[0] || vehiculosOrdenados[0] || ['PATRULLAJE A PIE', 0];

    const topAgente = Object.entries(agentes).sort((a, b) => b[1] - a[1])[0] || ['SIN REGISTRO', 0];
    const topTurno = Object.entries(turnosCount).sort((a, b) => b[1] - a[1])[0] || ['MAÑANA', 0];
    const topTurnoPct = total > 0 ? Math.round((topTurno[1] / total) * 100) : 0;

    // Datos para Dona SVG
    const totalTurnosValidos = turnosCount.MAÑANA + turnosCount.TARDE + turnosCount.NOCHE || 1;
    const pctManana = Math.round((turnosCount.MAÑANA / totalTurnosValidos) * 100);
    const pctTarde = Math.round((turnosCount.TARDE / totalTurnosValidos) * 100);
    const pctNoche = Math.max(0, 100 - pctManana - pctTarde);

    // Datos para Barras de Flota
    const maxFlota = vehiculosOrdenados[0]?.[1] || 1;
    const flotaBars = vehiculosOrdenados.slice(0, 5).map(([unidad, casos]) => ({
      unidad,
      casos,
      pct: Math.round((casos / maxFlota) * 100)
    }));

    return {
      total,
      topVehiculo: topVehiculo[0],
      topVehiculoCount: topVehiculo[1],
      topAgente: topAgente[0],
      topAgenteCount: topAgente[1],
      topTurno: topTurno[0],
      topTurnoPct,
      turnosCount,
      pctManana,
      pctTarde,
      pctNoche,
      flotaBars
    };
  }, [recordsInScope]);

  // 4. Matriz de Frecuencia Vecinal
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
      .sort((a, b) => b.count - a.count);
  }, [recordsInScope]);

  const handleUrbClick = (urb: string) => {
    setSelectedUrb(urb);
    if (onFilterZona) onFilterZona(urb);
  };

  const handleTurnoClick = (turno: string) => {
    setSelectedTurno(turno);
    if (onFilterTurno) onFilterTurno(turno);
  };

  // Cálculo Tacómetro Circular SVG
  const radius = 26;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (kpiData.topTurnoPct / 100) * circumference;

  // Cálculo Dona SVG de Turnos (Radio 40 -> Circunferencia ~251.3)
  const donutRadius = 40;
  const donutCirc = 2 * Math.PI * donutRadius;
  const dashManana = (kpiData.pctManana / 100) * donutCirc;
  const dashTarde = (kpiData.pctTarde / 100) * donutCirc;
  const dashNoche = (kpiData.pctNoche / 100) * donutCirc;

  return (
    <div className="min-h-screen bg-[#050811] text-slate-100 font-sans p-3 sm:p-6 relative overflow-hidden select-none">
      {/* Rejilla Cibernética Táctica de Fondo */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#0e1b33_1px,transparent_1px),linear-gradient(to_bottom,#0e1b33_1px,transparent_1px)] bg-[size:3rem_3rem] opacity-40 pointer-events-none" />
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[250px] bg-cyan-500/10 blur-[120px] pointer-events-none" />

      <div className="relative z-10 max-w-[1600px] mx-auto">
        {/* BARRA SUPERIOR DE TELEMETRÍA C2 */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between pb-5 mb-6 border-b border-cyan-500/30 gap-4 bg-[#09101f]/90 backdrop-blur-md p-4 rounded-xl border border-slate-800 shadow-[0_0_30px_rgba(6,182,212,0.1)]">
          <div className="flex items-start sm:items-center gap-4">
            <div className="w-12 h-12 rounded-lg bg-cyan-950/90 border border-cyan-400/60 flex items-center justify-center shadow-[0_0_20px_rgba(6,182,212,0.35)] shrink-0">
              <Crosshair className="w-6 h-6 text-cyan-400 animate-spin" style={{ animationDuration: '12s' }} />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-emerald-500/15 border border-emerald-500/40 text-[10px] font-mono text-emerald-400 uppercase font-bold">
                  <Radio className="w-3 h-3 animate-pulse" /> TELEMETRÍA ACTIVA // SUPABASE LIVE
                </span>
                <span className="text-[10px] font-mono text-slate-500">
                  SYS.ID: MDNCH-C2-2026
                </span>
              </div>
              <h1 className="text-xl sm:text-2xl font-black tracking-wider text-white uppercase mt-1 flex items-center gap-2">
                CENTRO DE MANDO TÁCTICO & FRECUENCIA VECINAL
              </h1>
              <p className="text-xs text-slate-400 font-mono mt-1">
                OBJETIVO FOCALIZADO:{' '}
                <span className="text-cyan-300 font-bold bg-cyan-950/90 px-2.5 py-0.5 rounded border border-cyan-500/40">
                  {activeUrb}
                </span>
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Selector de Turno HUD */}
            <div className="flex items-center bg-slate-950 p-1 rounded-lg border border-slate-800">
              {['TODOS', 'MAÑANA', 'TARDE', 'NOCHE'].map((turno) => (
                <button
                  key={turno}
                  onClick={() => handleTurnoClick(turno)}
                  className={`px-3 py-1.5 text-[11px] font-mono uppercase rounded-md transition-all cursor-pointer ${
                    selectedTurno === turno
                      ? 'bg-cyan-500 text-slate-950 font-black shadow-[0_0_15px_rgba(6,182,212,0.6)]'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {turno}
                </button>
              ))}
            </div>

            <button
              onClick={() => window.print()}
              className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-fuchsia-600/30 to-cyan-600/30 hover:from-fuchsia-500/40 hover:to-cyan-500/40 border border-cyan-400/60 rounded-lg text-white text-xs font-mono font-bold tracking-wider uppercase transition shadow-[0_0_20px_rgba(236,72,153,0.25)] cursor-pointer"
            >
              <Printer className="w-4 h-4 text-cyan-300" />
              Exportar Ficha Vecinal
            </button>
          </div>
        </div>

        {/* 4 MÓDULOS HUD SUPERIORES CON ESQUINAS TÁCTICAS Y TACÓMETRO SVG */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {/* KPI 1 */}
          <div className="relative bg-[#091122]/90 border border-cyan-500/40 rounded-xl p-4 backdrop-blur-md shadow-[inset_0_0_25px_rgba(6,182,212,0.08)]">
            <div className="absolute top-0 left-0 w-3 h-3 border-t-2 border-l-2 border-cyan-400 rounded-tl-xl" />
            <div className="absolute bottom-0 right-0 w-3 h-3 border-b-2 border-r-2 border-cyan-400 rounded-br-xl" />
            <div className="flex items-center justify-between mb-1">
              <span className="text-[10px] font-mono text-cyan-400 tracking-widest uppercase font-bold">
                INTERVENCIONES EN SECTOR
              </span>
              <Cpu className="w-4 h-4 text-cyan-500/80" />
            </div>
            <div className="text-4xl font-black text-white font-mono tracking-tight my-1 drop-shadow-[0_0_12px_rgba(6,182,212,0.35)]">
              {kpiData.total.toLocaleString()}
            </div>
            <div className="text-[11px] font-mono text-slate-400 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
              Registros validados en base
            </div>
          </div>

          {/* KPI 2 */}
          <div className="relative bg-[#091122]/90 border border-blue-500/40 rounded-xl p-4 backdrop-blur-md shadow-[inset_0_0_25px_rgba(59,130,246,0.08)]">
            <div className="absolute top-0 left-0 w-3 h-3 border-t-2 border-l-2 border-blue-400 rounded-tl-xl" />
            <div className="absolute bottom-0 right-0 w-3 h-3 border-b-2 border-r-2 border-blue-400 rounded-br-xl" />
            <div className="flex items-center justify-between mb-1">
              <span className="text-[10px] font-mono text-blue-400 tracking-widest uppercase font-bold">
                UNIDAD MÓVIL PREDOMINANTE
              </span>
              <Car className="w-4 h-4 text-blue-400" />
            </div>
            <div className="text-xl font-black text-cyan-300 font-mono truncate my-2">
              {kpiData.topVehiculo}
            </div>
            <div className="text-[11px] font-mono text-slate-400">
              Despliegue: <span className="text-white font-bold">{kpiData.topVehiculoCount}</span> intervenciones
            </div>
          </div>

          {/* KPI 3 */}
          <div className="relative bg-[#091122]/90 border border-fuchsia-500/40 rounded-xl p-4 backdrop-blur-md shadow-[inset_0_0_25px_rgba(236,72,153,0.08)]">
            <div className="absolute top-0 left-0 w-3 h-3 border-t-2 border-l-2 border-fuchsia-400 rounded-tl-xl" />
            <div className="absolute bottom-0 right-0 w-3 h-3 border-b-2 border-r-2 border-fuchsia-400 rounded-br-xl" />
            <div className="flex items-center justify-between mb-1">
              <span className="text-[10px] font-mono text-fuchsia-400 tracking-widest uppercase font-bold">
                EFECTIVO CON MAYOR PRESENCIA
              </span>
              <UserCheck className="w-4 h-4 text-fuchsia-400" />
            </div>
            <div className="text-lg font-black text-fuchsia-300 truncate my-2">
              {kpiData.topAgente}
            </div>
            <div className="text-[11px] font-mono text-slate-400">
              Partes atendidos: <span className="text-white font-bold">{kpiData.topAgenteCount}</span>
            </div>
          </div>

          {/* KPI 4: TACÓMETRO CIRCULAR SVG */}
          <div className="relative bg-[#091122]/90 border border-amber-500/40 rounded-xl p-4 backdrop-blur-md flex items-center justify-between shadow-[inset_0_0_25px_rgba(245,158,11,0.08)]">
            <div className="absolute top-0 left-0 w-3 h-3 border-t-2 border-l-2 border-amber-400 rounded-tl-xl" />
            <div className="absolute bottom-0 right-0 w-3 h-3 border-b-2 border-r-2 border-amber-400 rounded-br-xl" />
            <div>
              <span className="text-[10px] font-mono text-amber-400 tracking-widest uppercase font-bold block mb-1">
                PICO DE INCIDENCIA
              </span>
              <div className="text-2xl font-black text-amber-300 font-mono">
                {kpiData.topTurno}
              </div>
              <span className="text-[11px] font-mono text-slate-400 block mt-1">
                Concentración horaria
              </span>
            </div>

            <div className="relative w-16 h-16 flex items-center justify-center shrink-0">
              <svg className="w-16 h-16 -rotate-90" viewBox="0 0 64 64">
                <circle
                  cx="32"
                  cy="32"
                  r={radius}
                  stroke="#1e293b"
                  strokeWidth="5"
                  fill="transparent"
                />
                <circle
                  cx="32"
                  cy="32"
                  r={radius}
                  stroke="#f59e0b"
                  strokeWidth="5"
                  strokeDasharray={circumference}
                  strokeDashoffset={strokeDashoffset}
                  strokeLinecap="round"
                  fill="transparent"
                  className="transition-all duration-700 drop-shadow-[0_0_6px_#f59e0b]"
                />
              </svg>
              <span className="absolute text-xs font-mono font-black text-amber-300">
                {kpiData.topTurnoPct}%
              </span>
            </div>
          </div>
        </div>

        {/* ZONA DE OPERACIONES: SLICER VECINAL (IZQUIERDA) + ANALÍTICA Y GRÁFICOS (DERECHA) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* COLUMNA IZQUIERDA: SLICER VECINAL CON BUSCADOR */}
          <div className="lg:col-span-4 bg-[#091122]/90 border border-slate-800 rounded-xl p-4 flex flex-col max-h-[780px] backdrop-blur-md">
            <div className="pb-3 mb-3 border-b border-slate-800 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono uppercase tracking-wider text-cyan-400 flex items-center gap-1.5 font-bold">
                  <MapPin className="w-4 h-4" />
                  JURISDICCIONES ({filteredUrbanizaciones.length})
                </span>
                <span className="text-[10px] font-mono text-slate-500">SELECCIONE ZONA</span>
              </div>

              <div className="relative">
                <Search className="w-4 h-4 text-cyan-500/70 absolute left-3 top-2.5" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Filtrar urbanización, A.H. o sector..."
                  className="w-full bg-slate-950 border border-cyan-500/30 focus:border-cyan-400 rounded-lg pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none font-mono"
                />
              </div>
            </div>

            <div className="flex-1 overflow-y-auto space-y-1.5 pr-1">
              {filteredUrbanizaciones.map((urb) => {
                const isSelected = activeUrb === urb.nombre;
                return (
                  <button
                    key={urb.nombre}
                    onClick={() => handleUrbClick(urb.nombre)}
                    className={`w-full text-left px-3 py-2.5 rounded-lg text-xs flex items-center justify-between transition-all cursor-pointer border ${
                      isSelected
                        ? 'bg-gradient-to-r from-cyan-500/20 to-blue-600/10 border-cyan-400 text-white font-bold shadow-[0_0_15px_rgba(6,182,212,0.2)]'
                        : 'bg-slate-900/40 border-transparent text-slate-400 hover:bg-slate-800/70 hover:text-slate-200'
                    }`}
                  >
                    <span className="truncate uppercase pr-2 font-mono">{urb.nombre}</span>
                    <div className="flex items-center gap-2 shrink-0">
                      <span
                        className={`text-[10px] font-mono px-2 py-0.5 rounded font-bold ${
                          isSelected
                            ? 'bg-cyan-400 text-slate-950'
                            : 'bg-slate-950 text-slate-400 border border-slate-800'
                        }`}
                      >
                        {urb.count}
                      </span>
                      <ChevronRight
                        className={`w-3.5 h-3.5 ${
                          isSelected ? 'text-cyan-400' : 'text-slate-600'
                        }`}
                      />
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* COLUMNA DERECHA: MATRIZ DE FRECUENCIA + GRÁFICOS VECTORIALES SVG */}
          <div className="lg:col-span-8 flex flex-col gap-6">
            {/* MATRIZ DE FRECUENCIA VECINAL */}
            <div className="bg-[#091122]/90 border border-cyan-500/30 rounded-xl p-5 backdrop-blur-md shadow-[0_0_30px_rgba(6,182,212,0.06)]">
              <div className="flex flex-wrap items-center justify-between pb-3 mb-4 border-b border-slate-800 gap-2">
                <div>
                  <h2 className="text-sm font-black text-white tracking-wider uppercase flex items-center gap-2">
                    <Flame className="w-4 h-4 text-fuchsia-400" />
                    MATRIZ DE INCIDENCIAS POR MODALIDAD
                  </h2>
                  <p className="text-[11px] text-slate-400 font-mono mt-0.5">
                    DESGLOSE PARA DIRIGENTES VECINALES // <span className="text-cyan-300">{activeUrb}</span>
                  </p>
                </div>
                <span className="text-xs font-mono text-cyan-300 bg-cyan-950 border border-cyan-400/40 px-3 py-1 rounded-md font-bold">
                  {recordsInScope.length} EVENTOS
                </span>
              </div>

              <div className="space-y-3 overflow-y-auto max-h-[340px] pr-1">
                {frecuenciaModalidades.length === 0 ? (
                  <div className="text-center py-10 text-slate-500 text-xs font-mono">
                    SIN REGISTROS PARA EL FILTRO SELECCIONADO
                  </div>
                ) : (
                  frecuenciaModalidades.map((item, idx) => (
                    <div
                      key={item.modalidad}
                      className="bg-slate-950/70 border border-slate-800/90 rounded-lg p-3 hover:border-cyan-500/50 transition"
                    >
                      <div className="flex items-center justify-between text-xs mb-2 gap-2">
                        <span className="font-bold text-slate-100 flex items-center gap-2 uppercase">
                          <span className="px-1.5 py-0.5 rounded bg-slate-900 border border-slate-700 text-[10px] font-mono text-cyan-400">
                            0{idx + 1}
                          </span>
                          {item.modalidad}
                        </span>
                        <div className="flex items-center gap-3 shrink-0 font-mono">
                          <span className="text-cyan-300 font-bold">
                            {item.count} {item.count === 1 ? 'caso' : 'casos'}
                          </span>
                          <span className="text-fuchsia-400 font-bold w-12 text-right">
                            {item.porcentaje}%
                          </span>
                        </div>
                      </div>

                      <div className="w-full bg-slate-900 h-2.5 rounded-full overflow-hidden p-0.5 border border-slate-800">
                        <div
                          className={`h-full rounded-full transition-all duration-700 ${
                            idx === 0
                              ? 'bg-gradient-to-r from-fuchsia-500 via-pink-500 to-rose-400 shadow-[0_0_10px_#ec4899]'
                              : idx === 1
                              ? 'bg-gradient-to-r from-amber-500 to-yellow-400 shadow-[0_0_10px_#f59e0b]'
                              : 'bg-gradient-to-r from-cyan-500 to-blue-400 shadow-[0_0_10px_#06b6d4]'
                          }`}
                          style={{ width: `${Math.max(item.porcentaje, 3)}%` }}
                        />
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* PANEL DE GRÁFICOS TÁCTICOS SVG NATIVOS */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* GRÁFICO DE DONA SVG: DISTRIBUCIÓN HORARIA POR TURNO */}
              <div className="bg-[#091122]/90 border border-slate-800 rounded-xl p-4 backdrop-blur-md flex flex-col justify-between">
                <h3 className="text-xs font-mono uppercase text-cyan-400 font-bold mb-3 flex items-center gap-1.5">
                  <Activity className="w-4 h-4" /> RADAR HORARIO POR TURNO
                </h3>

                <div className="flex items-center justify-around gap-4 my-2">
                  {/* Anillo Dona SVG */}
                  <div className="relative w-32 h-32 flex items-center justify-center shrink-0">
                    <svg className="w-32 h-32 -rotate-90" viewBox="0 0 100 100">
                      <circle cx="50" cy="50" r={donutRadius} stroke="#0f172a" strokeWidth="12" fill="transparent" />
                      {/* Mañana (Cian) */}
                      <circle
                        cx="50"
                        cy="50"
                        r={donutRadius}
                        stroke="#06b6d4"
                        strokeWidth="12"
                        strokeDasharray={`${dashManana} ${donutCirc}`}
                        strokeDashoffset="0"
                        fill="transparent"
                        className="drop-shadow-[0_0_6px_#06b6d4]"
                      />
                      {/* Tarde (Ámbar) */}
                      <circle
                        cx="50"
                        cy="50"
                        r={donutRadius}
                        stroke="#f59e0b"
                        strokeWidth="12"
                        strokeDasharray={`${dashTarde} ${donutCirc}`}
                        strokeDashoffset={-dashManana}
                        fill="transparent"
                        className="drop-shadow-[0_0_6px_#f59e0b]"
                      />
                      {/* Noche (Magenta) */}
                      <circle
                        cx="50"
                        cy="50"
                        r={donutRadius}
                        stroke="#ec4899"
                        strokeWidth="12"
                        strokeDasharray={`${dashNoche} ${donutCirc}`}
                        strokeDashoffset={-(dashManana + dashTarde)}
                        fill="transparent"
                        className="drop-shadow-[0_0_6px_#ec4899]"
                      />
                    </svg>
                    <div className="absolute text-center">
                      <span className="text-[10px] font-mono text-slate-400 block">TOTAL</span>
                      <span className="text-sm font-black font-mono text-white">{kpiData.total}</span>
                    </div>
                  </div>

                  {/* Leyenda lateral */}
                  <div className="space-y-2.5 flex-1 font-mono text-xs">
                    <div className="flex items-center justify-between bg-slate-950/70 px-2.5 py-1.5 rounded border border-cyan-500/20">
                      <span className="flex items-center gap-2 text-cyan-300">
                        <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 shadow-[0_0_6px_#06b6d4]" />
                        MAÑANA
                      </span>
                      <span className="font-bold text-white">
                        {kpiData.turnosCount.MAÑANA} ({kpiData.pctManana}%)
                      </span>
                    </div>

                    <div className="flex items-center justify-between bg-slate-950/70 px-2.5 py-1.5 rounded border border-amber-500/20">
                      <span className="flex items-center gap-2 text-amber-300">
                        <span className="w-2.5 h-2.5 rounded-full bg-amber-400 shadow-[0_0_6px_#f59e0b]" />
                        TARDE
                      </span>
                      <span className="font-bold text-white">
                        {kpiData.turnosCount.TARDE} ({kpiData.pctTarde}%)
                      </span>
                    </div>

                    <div className="flex items-center justify-between bg-slate-950/70 px-2.5 py-1.5 rounded border border-fuchsia-500/20">
                      <span className="flex items-center gap-2 text-fuchsia-300">
                        <span className="w-2.5 h-2.5 rounded-full bg-fuchsia-400 shadow-[0_0_6px_#ec4899]" />
                        NOCHE
                      </span>
                      <span className="font-bold text-white">
                        {kpiData.turnosCount.NOCHE} ({kpiData.pctNoche}%)
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* GRÁFICO DE BARRAS NEÓN: DESPLIEGUE POR UNIDAD MÓVIL */}
              <div className="bg-[#091122]/90 border border-slate-800 rounded-xl p-4 backdrop-blur-md flex flex-col justify-between">
                <h3 className="text-xs font-mono uppercase text-fuchsia-400 font-bold mb-3 flex items-center gap-1.5">
                  <BarChart3 className="w-4 h-4" /> VOLUMEN POR UNIDAD MÓVIL
                </h3>

                <div className="space-y-3 my-auto">
                  {kpiData.flotaBars.map((item, idx) => (
                    <div key={item.unidad} className="space-y-1">
                      <div className="flex justify-between text-xs font-mono">
                        <span className="text-slate-200 truncate pr-2">{item.unidad}</span>
                        <span className="text-cyan-300 font-bold shrink-0">
                          {item.casos} interv.
                        </span>
                      </div>
                      <div className="w-full bg-slate-950 h-2 rounded-full overflow-hidden border border-slate-800">
                        <div
                          className={`h-full rounded-full transition-all duration-700 ${
                            idx === 0
                              ? 'bg-gradient-to-r from-cyan-400 to-blue-500 shadow-[0_0_8px_#06b6d4]'
                              : idx === 1
                              ? 'bg-gradient-to-r from-fuchsia-500 to-pink-500 shadow-[0_0_8px_#ec4899]'
                              : 'bg-gradient-to-r from-amber-400 to-orange-500'
                          }`}
                          style={{ width: `${Math.max(item.pct, 6)}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AnalyticsDashboardView;
