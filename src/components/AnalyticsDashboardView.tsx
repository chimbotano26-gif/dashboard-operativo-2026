import React, { useMemo } from 'react';
import {
  BarChart3,
  TrendingUp,
  MapPin,
  Clock,
  Shield,
  Flame,
  AlertCircle,
  Activity,
  ArrowUpRight,
  PieChart as PieIcon,
  Layers,
} from 'lucide-react';
import { IncidentRecord } from '../types';
import { SUBSECTORES_CONFIG, COMPARATIVO_MENSUAL } from '../data/mockData';

interface AnalyticsDashboardViewProps {
  records: IncidentRecord[];
  onSelectSubsector?: (code: string) => void;
  onFilterZona?: (zona: string) => void;
  onFilterTurno?: (turno: string) => void;
}

export const AnalyticsDashboardView: React.FC<AnalyticsDashboardViewProps> = ({
  records,
  onSelectSubsector,
  onFilterZona,
  onFilterTurno,
}) => {
  // Aggregate stats dynamically from current filtered records
  const stats = useMemo(() => {
    let centro = 0;
    let norte = 0;
    let sur = 0;

    let manana = 0;
    let tarde = 0;
    let noche = 0;

    let ba = 0;
    let vm = 0;

    const subsectorCounts: Record<string, number> = {};
    const dayCounts: Record<string, number> = {
      LUNES: 0,
      MARTES: 0,
      'MIÉRCOLES': 0,
      JUEVES: 0,
      VIERNES: 0,
      SÁBADO: 0,
      DOMINGO: 0,
    };
    const incidenceCounts: Record<string, number> = {};

    records.forEach((r) => {
      if (r.zona === 'ZONA NORTE') norte++;
      else if (r.zona === 'ZONA SUR') sur++;
      else centro++;

      if (r.turno === 'TARDE') tarde++;
      else if (r.turno === 'MAÑANA') manana++;
      else noche++;

      if (r.comisaria === 'CIA VILLA MARIA') vm++;
      else ba++;

      subsectorCounts[r.subsector] = (subsectorCounts[r.subsector] || 0) + 1;
      if (dayCounts[r.diaSemana] !== undefined) {
        dayCounts[r.diaSemana]++;
      }
      incidenceCounts[r.tipoIncidencia] = (incidenceCounts[r.tipoIncidencia] || 0) + 1;
    });

    const total = records.length || 1;

    // Sort subsectors
    const sortedSubsectors = Object.entries(subsectorCounts)
      .map(([code, count]) => ({
        code,
        count,
        name: SUBSECTORES_CONFIG[code]?.nombre || code,
        zona: SUBSECTORES_CONFIG[code]?.zona || 'ZONA CENTRO',
      }))
      .sort((a, b) => b.count - a.count);

    // Sort incidences
    const sortedIncidences = Object.entries(incidenceCounts)
      .map(([tipo, count]) => ({ tipo, count, pct: Math.round((count / total) * 100) }))
      .sort((a, b) => b.count - a.count);

    return {
      total,
      centro,
      norte,
      sur,
      manana,
      tarde,
      noche,
      ba,
      vm,
      sortedSubsectors,
      dayCounts,
      sortedIncidences,
    };
  }, [records]);

  // Max value for subsector bars
  const maxSubsectorVal = stats.sortedSubsectors[0]?.count || 437;

  return (
    <div className="flex-1 flex flex-col gap-3 min-w-0 text-white">
      {/* Top Split Row: Sector Distribution & Cuadrantes Ranking */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-3">
        {/* 1. Sectores Distribución Territorial (4 cols) */}
        <div className="lg:col-span-4 bg-[#0a182d] rounded-xl border border-cyan-500/30 p-3.5 shadow-xl flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between border-b border-cyan-900/40 pb-2 mb-3">
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-cyan-400" />
                <h3 className="text-xs font-black uppercase tracking-wider text-cyan-200">
                  DISTRIBUCIÓN POR ZONAS
                </h3>
              </div>
              <span className="text-[10px] text-cyan-400/80 font-mono font-bold">
                {stats.total.toLocaleString()} Ops
              </span>
            </div>

            {/* 3 Zone Cards with animated progress */}
            <div className="space-y-3">
              {/* Zona Centro */}
              <div
                onClick={() => onFilterZona?.('ZONA CENTRO')}
                className="p-2.5 rounded-lg bg-[#071322] border border-cyan-700/50 hover:border-cyan-400 cursor-pointer transition-all group"
              >
                <div className="flex items-center justify-between text-xs font-bold mb-1">
                  <span className="text-cyan-200 group-hover:text-cyan-300">ZONA CENTRO (Buenos Aires, Bruce, Plaza)</span>
                  <span className="font-mono text-cyan-400">{stats.centro} ops ({Math.round((stats.centro / stats.total) * 100)}%)</span>
                </div>
                <div className="w-full h-2.5 bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-cyan-500 to-blue-500 rounded-full transition-all duration-700 shadow-[0_0_8px_#06b6d4]"
                    style={{ width: `${(stats.centro / stats.total) * 100}%` }}
                  ></div>
                </div>
              </div>

              {/* Zona Sur */}
              <div
                onClick={() => onFilterZona?.('ZONA SUR')}
                className="p-2.5 rounded-lg bg-[#071322] border border-cyan-700/50 hover:border-cyan-400 cursor-pointer transition-all group"
              >
                <div className="flex items-center justify-between text-xs font-bold mb-1">
                  <span className="text-cyan-200 group-hover:text-cyan-300">ZONA SUR (Bellamar, PPAO, Casuarinas)</span>
                  <span className="font-mono text-amber-400">{stats.sur} ops ({Math.round((stats.sur / stats.total) * 100)}%)</span>
                </div>
                <div className="w-full h-2.5 bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-amber-500 to-orange-500 rounded-full transition-all duration-700 shadow-[0_0_8px_#f59e0b]"
                    style={{ width: `${(stats.sur / stats.total) * 100}%` }}
                  ></div>
                </div>
              </div>

              {/* Zona Norte */}
              <div
                onClick={() => onFilterZona?.('ZONA NORTE')}
                className="p-2.5 rounded-lg bg-[#071322] border border-cyan-700/50 hover:border-cyan-400 cursor-pointer transition-all group"
              >
                <div className="flex items-center justify-between text-xs font-bold mb-1">
                  <span className="text-cyan-200 group-hover:text-cyan-300">ZONA NORTE (Villa María, 1° Mayo)</span>
                  <span className="font-mono text-blue-400">{stats.norte} ops ({Math.round((stats.norte / stats.total) * 100)}%)</span>
                </div>
                <div className="w-full h-2.5 bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full transition-all duration-700 shadow-[0_0_8px_#3b82f6]"
                    style={{ width: `${(stats.norte / stats.total) * 100}%` }}
                  ></div>
                </div>
              </div>
            </div>
          </div>

          <div className="text-[10px] text-slate-400 text-center pt-2 border-t border-cyan-900/40">
            Haga clic sobre cualquier zona para aislar y filtrar las estadísticas
          </div>
        </div>

        {/* 2. Cuadrantes Críticos & Focos de Mayor Actividad (8 cols) */}
        <div className="lg:col-span-8 bg-[#0a182d] rounded-xl border border-cyan-500/30 p-3.5 shadow-xl flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between border-b border-cyan-900/40 pb-2 mb-2">
              <div className="flex items-center gap-2">
                <Flame className="w-4 h-4 text-rose-400 animate-pulse" />
                <h3 className="text-xs font-black uppercase tracking-wider text-cyan-200">
                  RANKING DE MAYOR ATENCIÓN POR SUBSECTOR / CUADRANTE
                </h3>
              </div>
              <span className="text-[10px] text-slate-400">
                Pico en S2BA (Plaza Mayor): 437 atenciones
              </span>
            </div>

            {/* Subsector Bars List */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-2">
              {stats.sortedSubsectors.slice(0, 8).map((sec, idx) => {
                const pct = Math.round((sec.count / maxSubsectorVal) * 100);
                const isCrit = sec.count > 300;
                return (
                  <div
                    key={sec.code}
                    onClick={() => onSelectSubsector?.(sec.code)}
                    className={`p-2 rounded-lg bg-[#071322] border transition-all cursor-pointer group hover:scale-[1.01] ${
                      isCrit
                        ? 'border-rose-500/50 hover:border-rose-400 shadow-[0_0_8px_rgba(244,63,94,0.15)]'
                        : 'border-cyan-800/40 hover:border-cyan-400'
                    }`}
                  >
                    <div className="flex items-center justify-between text-xs mb-1">
                      <div className="flex items-center gap-1.5">
                        <span className="font-mono font-bold text-slate-500 text-[10px]">#{idx + 1}</span>
                        <strong className="font-black text-cyan-200 group-hover:text-cyan-100">{sec.code}</strong>
                        <span className="text-[10px] text-slate-400 truncate max-w-[130px] sm:max-w-[160px]">
                          {sec.name}
                        </span>
                      </div>
                      <span className={`font-mono font-black ${isCrit ? 'text-rose-400' : 'text-cyan-300'}`}>
                        {sec.count}
                      </span>
                    </div>

                    <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${
                          isCrit
                            ? 'bg-gradient-to-r from-rose-500 to-amber-500'
                            : 'bg-gradient-to-r from-cyan-500 to-blue-500'
                        }`}
                        style={{ width: `${pct}%` }}
                      ></div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="flex items-center justify-between text-[10px] text-slate-400 pt-2 border-t border-cyan-900/40 mt-2">
            <span>Fuente: Reportes de Intervención de Patrullaje Integrado Nuevo Chimbote</span>
            <span className="text-cyan-400 font-bold">Clic en cuadrante para ver en mapa</span>
          </div>
        </div>
      </div>

      {/* Middle Split Row: Day of Week Spikes, Comisarías & Turnos */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {/* 3. Atenciones por Día de la Semana (Pico Domingo) */}
        <div className="bg-[#0a182d] rounded-xl border border-cyan-500/30 p-3.5 shadow-xl flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between border-b border-cyan-900/40 pb-2 mb-2">
              <div className="flex items-center gap-2">
                <Activity className="w-4 h-4 text-emerald-400" />
                <h3 className="text-xs font-black uppercase tracking-wider text-cyan-200">
                  CURVA SEMANAL DE OPERATIVOS
                </h3>
              </div>
              <span className="text-[10px] text-rose-400 font-bold font-mono">DOMINGO: 400</span>
            </div>

            <div className="space-y-1.5 mt-2">
              {Object.entries(stats.dayCounts).map(([dia, count]) => {
                const pct = Math.round((count / 400) * 100);
                const isSun = dia === 'DOMINGO';
                return (
                  <div key={dia} className="flex items-center gap-2 text-xs">
                    <span className="w-16 text-[10px] font-bold text-slate-400 uppercase">
                      {dia.slice(0, 3)}
                    </span>
                    <div className="flex-1 h-3 bg-slate-800 rounded overflow-hidden">
                      <div
                        className={`h-full rounded transition-all duration-500 ${
                          isSun ? 'bg-gradient-to-r from-rose-500 to-amber-500' : 'bg-cyan-500'
                        }`}
                        style={{ width: `${pct}%` }}
                      ></div>
                    </div>
                    <span className={`w-10 text-right font-mono font-bold text-[11px] ${isSun ? 'text-rose-400' : 'text-slate-300'}`}>
                      {count}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="text-[10px] text-slate-400 pt-2 border-t border-cyan-900/40 mt-2">
            Mayor incidencia en fines de semana por eventos sociales y nocturnos
          </div>
        </div>

        {/* 4. Atenciones por Turno (Mañana, Tarde, Noche) */}
        <div className="bg-[#0a182d] rounded-xl border border-cyan-500/30 p-3.5 shadow-xl flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between border-b border-cyan-900/40 pb-2 mb-2">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-amber-400" />
                <h3 className="text-xs font-black uppercase tracking-wider text-cyan-200">
                  HORARIO Y TURNOS DE SERVICIO
                </h3>
              </div>
              <span className="text-[10px] text-amber-300 font-bold">Tarde: 39%</span>
            </div>

            <div className="space-y-3 mt-3">
              {/* Tarde */}
              <div
                onClick={() => onFilterTurno?.('TARDE')}
                className="p-2.5 rounded-lg bg-[#071322] border border-amber-600/50 hover:border-amber-400 cursor-pointer transition-all"
              >
                <div className="flex justify-between text-xs font-bold mb-1">
                  <span className="text-amber-300">TURNO TARDE (15:00 - 23:00)</span>
                  <span className="font-mono text-white">{stats.tarde} ops (39%)</span>
                </div>
                <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                  <div className="h-full bg-amber-500 rounded-full" style={{ width: '39%' }}></div>
                </div>
              </div>

              {/* Mañana */}
              <div
                onClick={() => onFilterTurno?.('MAÑANA')}
                className="p-2.5 rounded-lg bg-[#071322] border border-cyan-700/40 hover:border-cyan-400 cursor-pointer transition-all"
              >
                <div className="flex justify-between text-xs font-bold mb-1">
                  <span className="text-cyan-300">TURNO MAÑANA (07:00 - 15:00)</span>
                  <span className="font-mono text-white">{stats.manana} ops (32%)</span>
                </div>
                <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                  <div className="h-full bg-cyan-500 rounded-full" style={{ width: '32%' }}></div>
                </div>
              </div>

              {/* Noche */}
              <div
                onClick={() => onFilterTurno?.('NOCHE')}
                className="p-2.5 rounded-lg bg-[#071322] border border-indigo-700/40 hover:border-indigo-400 cursor-pointer transition-all"
              >
                <div className="flex justify-between text-xs font-bold mb-1">
                  <span className="text-indigo-300">TURNO NOCHE (23:00 - 07:00)</span>
                  <span className="font-mono text-white">{stats.noche} ops (29%)</span>
                </div>
                <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                  <div className="h-full bg-indigo-500 rounded-full" style={{ width: '29%' }}></div>
                </div>
              </div>
            </div>
          </div>

          <div className="text-[10px] text-slate-400 pt-2 border-t border-cyan-900/40 mt-2">
            El turno tarde concentra la mayor afluencia comercial en Av. Pacífico
          </div>
        </div>

        {/* 5. Comisaría Jurisdiccional & Tipos de Delito Top */}
        <div className="bg-[#0a182d] rounded-xl border border-cyan-500/30 p-3.5 shadow-xl flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between border-b border-cyan-900/40 pb-2 mb-2">
              <div className="flex items-center gap-2">
                <Shield className="w-4 h-4 text-blue-400" />
                <h3 className="text-xs font-black uppercase tracking-wider text-cyan-200">
                  APOYO POLICIAL PNP Y TIPOS
                </h3>
              </div>
              <span className="text-[10px] text-blue-300 font-bold">Buenos Aires: 84%</span>
            </div>

            {/* Comisarias comparison */}
            <div className="grid grid-cols-2 gap-2 text-center my-2">
              <div className="p-2 rounded bg-[#071322] border border-blue-500/40">
                <div className="text-xl font-black font-mono text-blue-400">84%</div>
                <div className="text-[10px] font-bold text-slate-300">CIA Buenos Aires</div>
                <div className="text-[9px] text-slate-400 font-mono">{stats.ba} ops</div>
              </div>
              <div className="p-2 rounded bg-[#071322] border border-cyan-500/40">
                <div className="text-xl font-black font-mono text-cyan-400">16%</div>
                <div className="text-[10px] font-bold text-slate-300">CIA Villa María</div>
                <div className="text-[9px] text-slate-400 font-mono">{stats.vm} ops</div>
              </div>
            </div>

            {/* Top 3 Incidencias */}
            <div className="space-y-1.5 mt-2">
              <div className="text-[10px] font-black uppercase text-slate-400 tracking-wider">
                Top Incidencias de Mayor Demanda:
              </div>
              {stats.sortedIncidences.slice(0, 3).map((inc) => (
                <div key={inc.tipo} className="flex justify-between items-center text-xs bg-[#071322] p-1.5 rounded">
                  <span className="text-slate-300 truncate max-w-[170px] text-[11px]">{inc.tipo}</span>
                  <span className="font-mono font-bold text-cyan-300">{inc.count}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="text-[10px] text-slate-400 pt-2 border-t border-cyan-900/40 mt-2">
            Patrullaje integrado permanente con la Policía Nacional del Perú
          </div>
        </div>
      </div>
    </div>
  );
};
