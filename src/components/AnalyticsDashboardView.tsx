import React, { useState, useMemo } from 'react';
import {
  Shield,
  Printer,
  Search,
  Radio,
  Lock,
  Crosshair,
  Settings,
  Wifi
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
  const [minCasosFilter, setMinCasosFilter] = useState<number>(0);

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

  const activeUrb = useMemo(() => {
    if (selectedUrb) return selectedUrb;
    const casuarinas = urbanizaciones.find((u) => u.nombre.includes('CASUARINAS'));
    if (casuarinas) return casuarinas.nombre;
    return urbanizaciones[0]?.nombre || 'CASUARINAS';
  }, [selectedUrb, urbanizaciones]);

  const filteredUrbanizaciones = useMemo(() => {
    return urbanizaciones.filter((u) => {
      const matchSearch = !searchTerm.trim() || u.nombre.includes(cleanText(searchTerm));
      const matchMin = u.count >= minCasosFilter;
      return matchSearch && matchMin;
    });
  }, [urbanizaciones, searchTerm, minCasosFilter]);

  // 2. Registros filtrados
  const recordsInScope = useMemo(() => {
    return records.filter((r) => {
      const urb = getUrbanizacion(r);
      const matchUrb = !activeUrb || urb === activeUrb;
      const turno = getTurno(r);
      const matchTurno = selectedTurno === 'TODOS' || turno === selectedTurno;
      return matchUrb && matchTurno;
    });
  }, [records, activeUrb, selectedTurno]);

  // 3. Telemetría y Métricas HUD
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

    // Puntos de calor dinámicos en el radar topográfico según los datos
    const hotspotCount = Math.min(Math.max(total, 3), 14);
    const hotspots = Array.from({ length: hotspotCount }).map((_, i) => {
      const seed = (activeUrb.charCodeAt(i % activeUrb.length) || 65) + i * 37;
      const x = 110 + (seed % 260);
      const y = 55 + ((seed * 19) % 105);
      const color = i % 3 === 0 ? '#f43f5e' : i % 3 === 1 ? '#f59e0b' : '#22d3ee';
      return { x, y, color, id: i };
    });

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
      flotaList,
      hotspots
    };
  }, [recordsInScope, activeUrb]);

  // 4. Matriz de Frecuencia de Incidencias
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

  const handleUrbClick = (urb: string) => {
    setSelectedUrb(urb);
    if (onFilterZona) onFilterZona(urb);
  };

  const handleTurnoClick = (turno: string) => {
    const next = selectedTurno === turno ? 'TODOS' : turno;
    setSelectedTurno(next);
    if (onFilterTurno) onFilterTurno(next);
  };

  // Arcos concéntricos para panel derecho
  const c1 = 2 * Math.PI * 44;
  const c2 = 2 * Math.PI * 33;
  const c3 = 2 * Math.PI * 22;

  return (
    <div className="min-h-screen bg-[#030914] text-cyan-50 font-sans p-2 sm:p-4 relative overflow-hidden select-none">
      {/* Fondo Atmosférico Holográfico */}
      <div className="fixed inset-0 bg-[radial-gradient(circle_at_50%_35%,rgba(6,182,212,0.16),transparent_65%)] pointer-events-none" />
      <div className="fixed inset-0 bg-[linear-gradient(to_right,rgba(14,165,233,0.07)_1px,transparent_1px),linear-gradient(to_bottom,rgba(14,165,233,0.07)_1px,transparent_1px)] bg-[size:2.5rem_2.5rem] pointer-events-none" />

      {/* MARCO PRINCIPAL DE PANTALLA HOLOGRÁFICA */}
      <div className="relative z-10 max-w-[1680px] mx-auto border-2 border-cyan-500/40 rounded-2xl bg-[#051022]/85 backdrop-blur-xl shadow-[0_0_50px_rgba(6,182,212,0.2),inset_0_0_40px_rgba(6,182,212,0.08)] p-3 sm:p-4">
        {/* Esquinas luminosas exteriores */}
        <div className="absolute -top-[2px] -left-[2px] w-8 h-8 border-t-4 border-l-4 border-cyan-300 rounded-tl-2xl pointer-events-none" />
        <div className="absolute -top-[2px] -right-[2px] w-8 h-8 border-t-4 border-r-4 border-cyan-300 rounded-tr-2xl pointer-events-none" />
        <div className="absolute -bottom-[2px] -left-[2px] w-8 h-8 border-b-4 border-l-4 border-cyan-300 rounded-bl-2xl pointer-events-none" />
        <div className="absolute -bottom-[2px] -right-[2px] w-8 h-8 border-b-4 border-r-4 border-cyan-300 rounded-br-2xl pointer-events-none" />

        {/* HEADER SUPERIOR TIPO VISOR DE MANDO */}
        <header className="flex flex-col lg:flex-row items-center justify-between gap-3 pb-3 mb-4 border-b border-cyan-500/30">
          {/* Izquierda: Escudo + Telemetría */}
          <div className="flex items-center gap-3 w-full lg:w-auto">
            <div className="w-12 h-12 rounded-xl bg-cyan-950/90 border border-cyan-400/70 flex items-center justify-center shadow-[0_0_20px_rgba(34,211,238,0.4)] shrink-0">
              <Shield className="w-7 h-7 text-cyan-300" />
            </div>
            <div className="border border-cyan-500/30 bg-[#071830]/90 rounded-lg px-3 py-1.5 flex items-center gap-4">
              <div>
                <span className="text-[9px] font-mono text-cyan-400 tracking-widest block">TELEMETRÍA</span>
                <span className="text-xs font-mono font-bold text-emerald-400 flex items-center gap-1">
                  <Wifi className="w-3 h-3 animate-pulse" /> {records.length.toLocaleString()} REG
                </span>
              </div>
              <Settings className="w-5 h-5 text-cyan-400/80 animate-spin" style={{ animationDuration: '14s' }} />
            </div>
          </div>

          {/* Centro: Banner Título Principal Brillante */}
          <div className="flex-1 max-w-3xl w-full bg-gradient-to-r from-cyan-950/90 via-cyan-800/40 to-cyan-950/90 border border-cyan-400/60 rounded-xl px-5 py-2.5 text-center shadow-[0_0_25px_rgba(6,182,212,0.3)] relative">
            <h1 className="text-sm sm:text-lg md:text-xl font-black tracking-[0.12em] text-white uppercase drop-shadow-[0_0_8px_rgba(34,211,238,0.8)]">
              SISTEMA DE SEGURIDAD CIUDADANA Y CIBER-MONITOREO - SERENAZGO
            </h1>
            <div className="flex items-center justify-center gap-4 text-[10px] font-mono text-cyan-300/80 mt-0.5">
              <span>SECTOR: {activeUrb}</span>
              <span>•</span>
              <span>TURNO: {selectedTurno}</span>
            </div>
          </div>

          {/* Derecha: Cyber-Encryption & Print */}
          <div className="flex items-center gap-2.5 w-full lg:w-auto justify-end">
            <div className="hidden sm:flex items-center gap-2 border border-cyan-500/30 bg-[#071830]/90 rounded-lg px-3 py-1.5">
              <Lock className="w-4 h-4 text-emerald-400" />
              <div className="text-[9px] font-mono leading-tight">
                <span className="text-cyan-400 block">CYBER-ENCRYPTION</span>
                <span className="text-emerald-300 font-bold">SUPABASE SSL</span>
              </div>
            </div>

            <button
              onClick={() => window.print()}
              className="flex items-center gap-2 px-3.5 py-2.5 bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-400 rounded-lg text-cyan-200 text-xs font-mono font-bold uppercase tracking-wider shadow-[0_0_15px_rgba(6,182,212,0.35)] cursor-pointer transition"
            >
              <Printer className="w-4 h-4" />
              <span>FICHA VECINAL</span>
            </button>
          </div>
        </header>

        {/* ESTRUCTURA DE 3 COLUMNAS EXACTA COMO LA SALA DE MANDO */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
          {/* ================= COLUMNA 1: SECTORIZACIÓN / OPERATIVO (3 COLS) ================= */}
          <aside className="lg:col-span-3 flex flex-col gap-4">
            {/* Panel Lista de Sectores */}
            <div className="border border-cyan-500/40 bg-[#061529]/90 rounded-xl p-3.5 shadow-[inset_0_0_20px_rgba(6,182,212,0.08)] relative">
              <div className="flex items-center justify-between mb-2.5">
                <h2 className="text-xs font-mono font-black tracking-wider text-cyan-300 uppercase">
                  SECTORIZACIÓN / OPERATIVO
                </h2>
                <span className="text-[10px] font-mono text-cyan-400 bg-cyan-950 px-2 py-0.5 rounded border border-cyan-500/30">
                  {filteredUrbanizaciones.length}
                </span>
              </div>

              {/* Buscador HUD */}
              <div className="relative mb-2.5">
                <Search className="w-3.5 h-3.5 text-cyan-400 absolute left-2.5 top-2.5" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Buscar urbanización..."
                  className="w-full bg-[#030b17] border border-cyan-500/40 focus:border-cyan-300 rounded-lg pl-8 pr-2.5 py-1.5 text-xs font-mono text-cyan-100 placeholder-cyan-700 focus:outline-none"
                />
              </div>

              {/* Botones iluminados de urbanizaciones */}
              <div className="space-y-1.5 max-h-[250px] overflow-y-auto pr-1">
                {filteredUrbanizaciones.map((urb) => {
                  const isActive = activeUrb === urb.nombre;
                  return (
                    <button
                      key={urb.nombre}
                      onClick={() => handleUrbClick(urb.nombre)}
                      className={`w-full text-left px-3 py-2 rounded-lg text-xs font-mono flex items-center justify-between transition-all cursor-pointer border ${
                        isActive
                          ? 'bg-gradient-to-r from-emerald-500/30 via-cyan-500/30 to-cyan-900/40 border-emerald-400 text-white font-black shadow-[0_0_18px_rgba(16,185,129,0.45)]'
                          : 'bg-[#081b33]/70 border-cyan-500/20 text-cyan-200/80 hover:border-cyan-400/60 hover:text-white'
                      }`}
                    >
                      <span className="truncate pr-2">{urb.nombre}</span>
                      <span className={`text-[10px] px-1.5 py-0.5 rounded ${isActive ? 'bg-emerald-400 text-slate-950 font-black' : 'bg-slate-950/80 text-cyan-400'}`}>
                        {urb.count}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Panel Rango de Turnos con 3 Diales Circulares */}
            <div className="border border-cyan-500/40 bg-[#061529]/90 rounded-xl p-3.5 shadow-[inset_0_0_20px_rgba(6,182,212,0.08)]">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-xs font-mono font-black tracking-wider text-cyan-300 uppercase">
                  RANGO DE TURNOS
                </h3>
                {selectedTurno !== 'TODOS' && (
                  <button
                    onClick={() => handleTurnoClick(selectedTurno)}
                    className="text-[10px] font-mono text-amber-400 underline cursor-pointer"
                  >
                    VER TODOS
                  </button>
                )}
              </div>

              <div className="grid grid-cols-3 gap-2 text-center">
                {[
                  { label: 'MAÑANA', pct: hudData.pctManana, color: '#10b981' },
                  { label: 'TARDE', pct: hudData.pctTarde, color: '#06b6d4' },
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
                          ? 'bg-cyan-500/20 border-cyan-300 shadow-[0_0_15px_rgba(6,182,212,0.4)]'
                          : 'bg-[#040e1c] border-cyan-500/20 hover:border-cyan-500/50'
                      }`}
                    >
                      <div className="relative w-12 h-12 flex items-center justify-center">
                        <svg className="w-12 h-12 -rotate-90" viewBox="0 0 48 48">
                          <circle cx="24" cy="24" r={r} stroke="#0f2942" strokeWidth="4" fill="transparent" />
                          <circle cx="24" cy="24" r="13" stroke={t.color} strokeWidth="1.5" strokeOpacity="0.4" fill="transparent" />
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
                        <span className="absolute text-[10px] font-mono font-bold text-white">
                          {t.pct}%
                        </span>
                      </div>
                      <span className="text-[10px] font-mono text-cyan-200 mt-1">{t.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Panel Sliders Tácticos de Filtro de Densidad */}
            <div className="border border-cyan-500/40 bg-[#061529]/90 rounded-xl p-3.5 shadow-[inset_0_0_20px_rgba(6,182,212,0.08)] space-y-3">
              <div>
                <div className="flex justify-between text-[10px] font-mono text-cyan-300 mb-1">
                  <span>UMBRAL MÍNIMO DE CASOS</span>
                  <span className="text-emerald-400 font-bold">{minCasosFilter}+ EVENTOS</span>
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
                <span>AGENTE LÍDER EN ZONA:</span>
                <span className="text-white font-bold truncate max-w-[150px]">{hudData.topAgente}</span>
              </div>
            </div>
          </aside>

          {/* ================= COLUMNA 2: NÚCLEO TÁCTICO CENTRAL (6 COLS) ================= */}
          <main className="lg:col-span-6 flex flex-col gap-4">
            {/* FILA SUPERIOR: 4 TARJETAS HUD CON GRÁFICOS INTERNOS */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {/* Tarjeta 1: Total Incidencias + Ondas de Pulso */}
              <div className="border border-cyan-400/50 bg-[#06162b]/90 rounded-xl p-3 text-center relative overflow-hidden shadow-[0_0_20px_rgba(6,182,212,0.12)]">
                <span className="text-[9px] font-mono text-cyan-300 tracking-wider uppercase block">
                  TOTAL INCIDENCIAS
                </span>
                <span className="text-[9px] font-mono text-cyan-400/80 block truncate">
                  ({activeUrb})
                </span>
                <div className="my-1 relative flex items-center justify-center">
                  {/* Onda de pulso SVG */}
                  <svg className="w-full h-11" viewBox="0 0 140 44">
                    <path
                      d="M0,22 L25,22 L32,12 L38,32 L44,6 L50,38 L56,14 L62,28 L68,22 L140,22"
                      fill="none"
                      stroke="#ec4899"
                      strokeWidth="1.5"
                      strokeOpacity="0.6"
                    />
                    <path
                      d="M0,22 L75,22 L82,10 L88,34 L94,8 L100,36 L106,16 L112,26 L118,22 L140,22"
                      fill="none"
                      stroke="#f59e0b"
                      strokeWidth="1.5"
                      strokeOpacity="0.7"
                    />
                  </svg>
                  <span className="absolute text-2xl sm:text-3xl font-black font-mono text-amber-300 drop-shadow-[0_0_10px_rgba(245,158,11,0.8)] bg-[#06162b]/80 px-2 rounded">
                    {hudData.total}
                  </span>
                </div>
              </div>

              {/* Tarjeta 2: Patrullaje Activo + Anillo */}
              <div className="border border-cyan-400/50 bg-[#06162b]/90 rounded-xl p-3 text-center relative overflow-hidden shadow-[0_0_20px_rgba(6,182,212,0.12)]">
                <span className="text-[9px] font-mono text-cyan-300 tracking-wider uppercase block mb-1">
                  PATRULLAJE ACTIVO
                </span>
                <div className="flex items-center justify-center gap-2 my-1">
                  <div className="w-11 h-11 rounded-full border-2 border-cyan-400 flex flex-col items-center justify-center shadow-[0_0_12px_rgba(34,211,238,0.5)]">
                    <span className="text-sm font-black font-mono text-white leading-none">
                      {hudData.unidadesActivasCount}
                    </span>
                    <span className="text-[7px] font-mono text-cyan-300">MÓVILES</span>
                  </div>
                  {/* Radar mini */}
                  <div className="w-11 h-11 rounded-full border border-dashed border-emerald-400/70 flex items-center justify-center bg-emerald-950/30">
                    <Radio className="w-5 h-5 text-emerald-400 animate-pulse" />
                  </div>
                </div>
              </div>

              {/* Tarjeta 3: Móvil en Operación + Camioneta Wireframe SVG */}
              <div className="border border-cyan-400/50 bg-[#06162b]/90 rounded-xl p-3 text-center relative overflow-hidden shadow-[0_0_20px_rgba(6,182,212,0.12)]">
                <span className="text-[9px] font-mono text-cyan-300 tracking-wider uppercase block">
                  MÓVIL EN OPERACIÓN
                </span>
                <div className="text-sm sm:text-base font-black font-mono text-cyan-300 truncate mt-0.5 drop-shadow-[0_0_8px_rgba(34,211,238,0.6)]">
                  {hudData.topVehiculo}
                </div>
                {/* Silueta Wireframe Patrullero 4x4 */}
                <svg className="w-24 h-8 mx-auto mt-1" viewBox="0 0 120 40">
                  <path
                    d="M15,26 L22,14 L52,12 L75,12 L95,18 L108,20 L108,28 L15,28 Z"
                    fill="rgba(6,182,212,0.18)"
                    stroke="#22d3ee"
                    strokeWidth="1.5"
                  />
                  <rect x="48" y="8" width="12" height="3" fill="#ec4899" />
                  <circle cx="33" cy="29" r="6" fill="#030914" stroke="#22d3ee" strokeWidth="2" />
                  <circle cx="90" cy="29" r="6" fill="#030914" stroke="#22d3ee" strokeWidth="2" />
                </svg>
              </div>

              {/* Tarjeta 4: Concentración Horaria */}
              <div className="border border-cyan-400/50 bg-[#06162b]/90 rounded-xl p-3 text-center relative overflow-hidden shadow-[0_0_20px_rgba(6,182,212,0.12)]">
                <span className="text-[9px] font-mono text-cyan-300 tracking-wider uppercase block mb-1">
                  TURNO CRÍTICO
                </span>
                <div className="w-12 h-12 mx-auto rounded-full border-2 border-cyan-400 bg-cyan-950/60 flex flex-col items-center justify-center shadow-[0_0_15px_rgba(6,182,212,0.4)]">
                  <span className="text-xs font-black font-mono text-white">
                    {hudData.topTurnoPct}%
                  </span>
                  <span className="text-[7px] font-mono text-cyan-300">{hudData.topTurno}</span>
                </div>
              </div>
            </div>

            {/* PANEL CENTRAL: MAPA TOPOGRÁFICO ISOMÉTRICO 3D INTERACTIVO */}
            <div className="border border-cyan-400/50 bg-[#040f1e] rounded-xl p-3.5 relative overflow-hidden shadow-[inset_0_0_35px_rgba(6,182,212,0.15)]">
              <div className="flex items-center justify-between mb-1 relative z-10">
                <span className="text-xs font-mono font-black tracking-widest text-cyan-200 uppercase flex items-center gap-2">
                  <Crosshair className="w-4 h-4 text-cyan-400" />
                  SECTOR {activeUrb}
                </span>
                <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950/70 border border-emerald-500/40 px-2 py-0.5 rounded">
                  RADAR TOPOGRÁFICO 3D // ACTIVO
                </span>
              </div>

              {/* SVG Topográfico Isométrico con Manzanas, Sonar y Puntos de Calor */}
              <div className="w-full h-52 sm:h-60 relative flex items-center justify-center">
                <svg className="w-full h-full" viewBox="0 0 480 220" preserveAspectRatio="xMidYMid slice">
                  <defs>
                    <linearGradient id="topoGrad" x1="0" y1="0" x2="1" y2="1">
                      <stop offset="0%" stopColor="#082f49" stopOpacity="0.8" />
                      <stop offset="50%" stopColor="#0e7490" stopOpacity="0.45" />
                      <stop offset="100%" stopColor="#040f1e" stopOpacity="0.9" />
                    </linearGradient>
                  </defs>

                  {/* Plano Isométrico Base */}
                  <polygon
                    points="240,18 455,105 240,198 25,105"
                    fill="url(#topoGrad)"
                    stroke="#22d3ee"
                    strokeWidth="1.5"
                    strokeOpacity="0.7"
                  />

                  {/* Líneas de cuadrícula urbana isométrica */}
                  {[0.2, 0.4, 0.6, 0.8].map((t, idx) => (
                    <g key={idx} stroke="#22d3ee" strokeOpacity="0.22" strokeWidth="1">
                      <line
                        x1={240 - 215 * t}
                        y1={18 + 87 * t}
                        x2={455 - 215 * t}
                        y2={105 + 93 * t}
                      />
                      <line
                        x1={240 + 215 * t}
                        y1={18 + 87 * t}
                        x2={25 + 215 * t}
                        y2={105 + 93 * t}
                      />
                    </g>
                  ))}

                  {/* Bloques 3D simulando manzanas urbanas */}
                  <polygon points="210,75 235,65 260,75 235,85" fill="#164e63" stroke="#38bdf8" strokeWidth="0.8" />
                  <polygon points="265,95 295,83 325,95 295,107" fill="#155e75" stroke="#38bdf8" strokeWidth="0.8" />
                  <polygon points="155,100 185,88 215,100 185,112" fill="#164e63" stroke="#38bdf8" strokeWidth="0.8" />
                  <polygon points="215,125 245,113 275,125 245,137" fill="#0e7490" stroke="#67e8f9" strokeWidth="0.9" />

                  {/* Ondas de Sonar Concéntricas */}
                  <ellipse cx="235" cy="112" rx="75" ry="32" fill="none" stroke="#22d3ee" strokeWidth="1" strokeDasharray="4 4" />
                  <ellipse cx="235" cy="112" rx="42" ry="18" fill="none" stroke="#f43f5e" strokeWidth="1.2" />

                  {/* Puntos de Calor Dinámicos según incidencias del sector */}
                  {hudData.hotspots.map((pt) => (
                    <g key={pt.id}>
                      <circle cx={pt.x} cy={pt.y} r="7" fill={pt.color} fillOpacity="0.25" />
                      <circle cx={pt.x} cy={pt.y} r="3" fill={pt.color} />
                    </g>
                  ))}

                  {/* Etiquetas Flotantes de Unidades Móviles */}
                  <g transform="translate(285, 58)">
                    <rect x="0" y="0" width="66" height="16" rx="3" fill="#051326" stroke="#22d3ee" strokeWidth="1" />
                    <text x="33" y="11" textAnchor="middle" fill="#67e8f9" fontSize="8" fontFamily="monospace" fontWeight="bold">
                      {hudData.topVehiculo.slice(0, 10)}
                    </text>
                  </g>

                  <g transform="translate(135, 132)">
                    <rect x="0" y="0" width="62" height="16" rx="3" fill="#051326" stroke="#ec4899" strokeWidth="1" />
                    <text x="31" y="11" textAnchor="middle" fill="#f472b6" fontSize="8" fontFamily="monospace" fontWeight="bold">
                      ALERTA C2
                    </text>
                  </g>
                </svg>

                {/* Mini Brújula / Coordenadas inferior izquierda */}
                <div className="absolute bottom-1 left-1 border border-cyan-500/40 bg-[#051224]/90 rounded p-1.5 text-[9px] font-mono text-cyan-400">
                  <div>LAT: -9.1245° S</div>
                  <div>LON: -78.5312° W</div>
                </div>
              </div>
            </div>

            {/* PANEL INFERIOR: MATRIZ DE FRECUENCIA DE INCIDENCIAS */}
            <div className="border border-cyan-400/50 bg-[#061529]/90 rounded-xl p-3.5 shadow-[inset_0_0_20px_rgba(6,182,212,0.08)]">
              <div className="flex items-center justify-between mb-2.5">
                <h3 className="text-xs font-mono font-black tracking-wider text-cyan-200 uppercase">
                  MATRIZ DE FRECUENCIA DE INCIDENCIAS
                </h3>
                <span className="text-[10px] font-mono text-cyan-400">
                  DESGLOSE MODALIDAD // {hudData.total} CASOS
                </span>
              </div>

              <div className="space-y-2 max-h-[195px] overflow-y-auto pr-1">
                {frecuenciaModalidades.length === 0 ? (
                  <div className="text-center py-6 text-xs font-mono text-cyan-500">
                    SIN INCIDENCIAS EN ESTE FILTRO
                  </div>
                ) : (
                  frecuenciaModalidades.map((item, idx) => (
                    <div key={item.modalidad} className="grid grid-cols-12 items-center gap-2 text-xs">
                      <span className="col-span-5 sm:col-span-4 font-mono text-[11px] text-cyan-100 truncate">
                        {item.modalidad}
                      </span>
                      <div className="col-span-5 sm:col-span-6 bg-[#030b17] h-3 rounded-sm border border-cyan-500/30 p-0.5 overflow-hidden">
                        <div
                          className={`h-full rounded-xs transition-all duration-700 ${
                            idx === 0
                              ? 'bg-gradient-to-r from-cyan-400 via-amber-300 to-rose-500 shadow-[0_0_10px_#f43f5e]'
                              : idx === 1
                              ? 'bg-gradient-to-r from-cyan-400 via-emerald-300 to-amber-400 shadow-[0_0_10px_#f59e0b]'
                              : 'bg-gradient-to-r from-blue-500 via-cyan-400 to-emerald-300 shadow-[0_0_8px_#22d3ee]'
                          }`}
                          style={{ width: `${Math.max(item.porcentaje, 5)}%` }}
                        />
                      </div>
                      <span className="col-span-2 text-right font-mono text-[11px] font-bold text-cyan-300">
                        {item.count} ({item.porcentaje}%)
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>
          </main>

          {/* ================= COLUMNA 3: INCIDENTES POR RECURSO Y ONDA (3 COLS) ================= */}
          <aside className="lg:col-span-3 flex flex-col gap-4">
            {/* Anillo Concéntrico Multi-Arco HUD */}
            <div className="border border-cyan-500/40 bg-[#061529]/90 rounded-xl p-3.5 shadow-[inset_0_0_20px_rgba(6,182,212,0.08)] flex flex-col items-center">
              <h3 className="text-xs font-mono font-black tracking-wider text-cyan-300 uppercase w-full text-left mb-2">
                INCIDENTES POR RECURSO
              </h3>

              <div className="relative w-44 h-44 flex items-center justify-center my-1">
                <svg className="w-44 h-44 -rotate-90" viewBox="0 0 110 110">
                  {/* Pistas de fondo */}
                  <circle cx="55" cy="55" r="44" stroke="#0c243e" strokeWidth="7" fill="transparent" />
                  <circle cx="55" cy="55" r="33" stroke="#0c243e" strokeWidth="6" fill="transparent" />
                  <circle cx="55" cy="55" r="22" stroke="#0c243e" strokeWidth="5" fill="transparent" />

                  {/* Arco Exterior Cian (Mañana) */}
                  <circle
                    cx="55"
                    cy="55"
                    r="44"
                    stroke="#22d3ee"
                    strokeWidth="7"
                    strokeDasharray={`${(hudData.pctManana / 100) * c1} ${c1}`}
                    strokeLinecap="round"
                    fill="transparent"
                    className="drop-shadow-[0_0_6px_#22d3ee]"
                  />
                  {/* Arco Medio Naranja (Tarde) */}
                  <circle
                    cx="55"
                    cy="55"
                    r="33"
                    stroke="#f97316"
                    strokeWidth="6"
                    strokeDasharray={`${(hudData.pctTarde / 100) * c2} ${c2}`}
                    strokeLinecap="round"
                    fill="transparent"
                    className="drop-shadow-[0_0_6px_#f97316]"
                  />
                  {/* Arco Interior Esmeralda (Noche) */}
                  <circle
                    cx="55"
                    cy="55"
                    r="22"
                    stroke="#10b981"
                    strokeWidth="5"
                    strokeDasharray={`${(hudData.pctNoche / 100) * c3} ${c3}`}
                    strokeLinecap="round"
                    fill="transparent"
                  />
                </svg>

                <div className="absolute text-center">
                  <span className="text-lg font-black font-mono text-white block leading-none">
                    {hudData.total}
                  </span>
                  <span className="text-[8px] font-mono text-cyan-400">EVENTOS</span>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-1 w-full text-center font-mono text-[10px] mt-1">
                <div className="bg-[#040e1c] p-1 rounded border border-cyan-500/20">
                  <span className="text-cyan-400 block">MAÑ</span>
                  <span className="font-bold text-white">{hudData.turnosCount.MAÑANA}</span>
                </div>
                <div className="bg-[#040e1c] p-1 rounded border border-orange-500/20">
                  <span className="text-orange-400 block">TAR</span>
                  <span className="font-bold text-white">{hudData.turnosCount.TARDE}</span>
                </div>
                <div className="bg-[#040e1c] p-1 rounded border border-emerald-500/20">
                  <span className="text-emerald-400 block">NOC</span>
                  <span className="font-bold text-white">{hudData.turnosCount.NOCHE}</span>
                </div>
              </div>
            </div>

            {/* Despliegue por Unidad: Onda Luminosa + Barras */}
            <div className="border border-cyan-500/40 bg-[#061529]/90 rounded-xl p-3.5 shadow-[inset_0_0_20px_rgba(6,182,212,0.08)] flex-1 flex flex-col justify-between">
              <div>
                <h3 className="text-xs font-mono font-black tracking-wider text-cyan-300 uppercase mb-2">
                  DESPLIEGUE POR UNIDAD
                </h3>

                {/* Gráfico de Onda Sinusoidal Luminosa */}
                <div className="bg-[#030b17] border border-cyan-500/30 rounded-lg p-2 mb-3">
                  <svg className="w-full h-16" viewBox="0 0 220 60">
                    <defs>
                      <linearGradient id="waveFill" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#10b981" stopOpacity="0.45" />
                        <stop offset="100%" stopColor="#06b6d4" stopOpacity="0.0" />
                      </linearGradient>
                    </defs>
                    <path
                      d="M0,45 Q25,10 50,35 T100,25 T150,38 T200,15 L220,25 L220,60 L0,60 Z"
                      fill="url(#waveFill)"
                    />
                    <path
                      d="M0,45 Q25,10 50,35 T100,25 T150,38 T200,15 L220,25"
                      fill="none"
                      stroke="#34d399"
                      strokeWidth="2"
                      className="drop-shadow-[0_0_6px_#34d399]"
                    />
                  </svg>
                </div>

                {/* Lista de Unidades Móviles */}
                <div className="space-y-2.5">
                  {hudData.flotaList.map((item, i) => (
                    <div key={item.unidad} className="space-y-1">
                      <div className="flex justify-between text-[11px] font-mono">
                        <span className="text-cyan-100 truncate pr-2">{item.unidad}</span>
                        <span className="text-emerald-300 font-bold shrink-0">{item.casos}</span>
                      </div>
                      <div className="w-full bg-[#030b17] h-2 rounded-full overflow-hidden border border-cyan-500/20">
                        <div
                          className={`h-full rounded-full ${
                            i === 0
                              ? 'bg-gradient-to-r from-cyan-400 to-emerald-400 shadow-[0_0_8px_#34d399]'
                              : i === 1
                              ? 'bg-gradient-to-r from-amber-400 to-orange-500'
                              : 'bg-cyan-500'
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
