import React from 'react';
import { IncidentRecord, FilterState } from '../types';
import {
  TrendingUp,
  AlertTriangle,
  Clock,
  ShieldCheck,
  Flame,
  Car,
  CheckCircle2,
  Users,
  MapPin,
} from 'lucide-react';

interface CommandKpiRibbonProps {
  filteredRecords: IncidentRecord[];
  totalRecordsCount: number;
  filters: FilterState;
  onQuickFilter: (partial: Partial<FilterState>) => void;
}

export const CommandKpiRibbon: React.FC<CommandKpiRibbonProps> = ({
  filteredRecords,
  totalRecordsCount,
  filters,
  onQuickFilter,
}) => {
  // Aggregate stats
  let countCentro = 0;
  let countNorte = 0;
  let countSur = 0;
  let countTarde = 0;
  let countManana = 0;
  let countNoche = 0;
  let countAtendido = 0;

  filteredRecords.forEach((r) => {
    if (r.zona === 'ZONA NORTE') countNorte++;
    else if (r.zona === 'ZONA SUR') countSur++;
    else countCentro++;

    if (r.turno === 'TARDE') countTarde++;
    else if (r.turno === 'MAÑANA') countManana++;
    else countNoche++;

    if (r.estado === 'ATENDIDO') countAtendido++;
  });

  const total = filteredRecords.length;
  const pctTarde = total > 0 ? Math.round((countTarde / total) * 100) : 39;
  const pctAtendido = total > 0 ? Math.round((countAtendido / total) * 100) : 88;

  // Dominant zone
  let sectorCritico = 'ZONA CENTRO';
  let sectorMaxCount = countCentro;
  if (countSur > sectorMaxCount) {
    sectorCritico = 'ZONA SUR';
    sectorMaxCount = countSur;
  }
  if (countNorte > sectorMaxCount) {
    sectorCritico = 'ZONA NORTE';
    sectorMaxCount = countNorte;
  }

  const isFiltered = total < totalRecordsCount;

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2 sm:gap-3">
      {/* 1. TOTAL ATENCIONES */}
      <button
        onClick={() => onQuickFilter({ zonas: [], turnos: [], comisarias: [], incidencias: [] })}
        className="group text-left p-3 rounded-xl bg-gradient-to-br from-[#0a182d] to-[#07111e] border border-cyan-500/30 hover:border-cyan-400/80 shadow-lg hover:shadow-[0_0_15px_rgba(6,182,212,0.25)] transition-all cursor-pointer relative overflow-hidden"
      >
        <div className="absolute top-0 right-0 w-16 h-16 bg-cyan-500/10 rounded-full blur-xl pointer-events-none"></div>
        <div className="flex items-center justify-between text-[10px] font-bold text-cyan-300/80 uppercase tracking-wider mb-1">
          <span>OPERATIVOS REGISTRADOS</span>
          <TrendingUp className="w-3.5 h-3.5 text-cyan-400 group-hover:scale-110 transition-transform" />
        </div>
        <div className="flex items-baseline gap-2">
          <div className="text-2xl sm:text-3xl font-black font-mono tracking-tight text-white group-hover:text-cyan-200 transition-colors">
            {total.toLocaleString()}
          </div>
          {isFiltered && (
            <span className="text-[10px] font-mono text-cyan-400/80">
              / {totalRecordsCount.toLocaleString()}
            </span>
          )}
        </div>
        <div className="flex items-center justify-between mt-1 pt-1 border-t border-cyan-900/40 text-[10px]">
          <span className="text-emerald-400 font-bold flex items-center gap-0.5">
            ▲ +14.8% <span className="text-slate-400 font-normal">vs 2025</span>
          </span>
          <span className="text-slate-400 group-hover:text-cyan-300 transition-colors text-[9px]">
            {isFiltered ? 'Restablecer' : 'Todos'}
          </span>
        </div>
      </button>

      {/* 2. SECTOR CRÍTICO */}
      <button
        onClick={() => onQuickFilter({ zonas: ['ZONA CENTRO'] })}
        className={`group text-left p-3 rounded-xl bg-gradient-to-br from-[#0a182d] to-[#07111e] border transition-all cursor-pointer relative overflow-hidden ${
          filters.zonas.includes('ZONA CENTRO')
            ? 'border-rose-500 shadow-[0_0_15px_rgba(244,63,94,0.3)] bg-rose-950/20'
            : 'border-rose-500/30 hover:border-rose-400/80 hover:shadow-[0_0_15px_rgba(244,63,94,0.2)]'
        }`}
      >
        <div className="absolute top-0 right-0 w-16 h-16 bg-rose-500/10 rounded-full blur-xl pointer-events-none"></div>
        <div className="flex items-center justify-between text-[10px] font-bold text-rose-300/80 uppercase tracking-wider mb-1">
          <span>SECTOR CRÍTICO</span>
          <Flame className="w-3.5 h-3.5 text-rose-400 animate-pulse" />
        </div>
        <div className="text-xl sm:text-2xl font-black tracking-tight text-white group-hover:text-rose-200 transition-colors truncate">
          {sectorCritico}
        </div>
        <div className="flex items-center justify-between mt-1 pt-1 border-t border-rose-900/40 text-[10px]">
          <span className="text-rose-300 font-bold font-mono">
            {sectorMaxCount} atenciones
          </span>
          <span className="text-slate-400 text-[9px] group-hover:text-rose-300">
            Cuadrante S2BA
          </span>
        </div>
      </button>

      {/* 3. TURNO CRÍTICO */}
      <button
        onClick={() => onQuickFilter({ turnos: ['TARDE'] })}
        className={`group text-left p-3 rounded-xl bg-gradient-to-br from-[#0a182d] to-[#07111e] border transition-all cursor-pointer relative overflow-hidden ${
          filters.turnos.includes('TARDE')
            ? 'border-amber-500 shadow-[0_0_15px_rgba(245,158,11,0.3)] bg-amber-950/20'
            : 'border-amber-500/30 hover:border-amber-400/80 hover:shadow-[0_0_15px_rgba(245,158,11,0.2)]'
        }`}
      >
        <div className="absolute top-0 right-0 w-16 h-16 bg-amber-500/10 rounded-full blur-xl pointer-events-none"></div>
        <div className="flex items-center justify-between text-[10px] font-bold text-amber-300/80 uppercase tracking-wider mb-1">
          <span>TURNO CRÍTICO</span>
          <Clock className="w-3.5 h-3.5 text-amber-400" />
        </div>
        <div className="text-xl sm:text-2xl font-black tracking-tight text-white group-hover:text-amber-200 transition-colors">
          TARDE <span className="text-xs font-mono font-bold text-amber-400">({pctTarde}%)</span>
        </div>
        <div className="flex items-center justify-between mt-1 pt-1 border-t border-amber-900/40 text-[10px]">
          <span className="text-slate-300 font-mono">{countTarde} incidentes</span>
          <span className="text-amber-300 text-[9px]">15:00 - 23:00 hrs</span>
        </div>
      </button>

      {/* 4. RESOLUCIÓN & EFECTIVIDAD */}
      <div className="p-3 rounded-xl bg-gradient-to-br from-[#0a182d] to-[#07111e] border border-emerald-500/30 shadow-lg relative overflow-hidden">
        <div className="absolute top-0 right-0 w-16 h-16 bg-emerald-500/10 rounded-full blur-xl pointer-events-none"></div>
        <div className="flex items-center justify-between text-[10px] font-bold text-emerald-300/80 uppercase tracking-wider mb-1">
          <span>TASA DE RESOLUCIÓN</span>
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
        </div>
        <div className="text-xl sm:text-2xl font-black font-mono tracking-tight text-white">
          {pctAtendido}%
        </div>
        <div className="flex items-center justify-between mt-1 pt-1 border-t border-emerald-900/40 text-[10px]">
          <span className="text-emerald-400 font-bold">{countAtendido} Atendidos</span>
          <span className="text-slate-400 text-[9px]">En sitio / PNP</span>
        </div>
      </div>

      {/* 5. TIEMPO DE RESPUESTA & FLOTA */}
      <div className="p-3 rounded-xl bg-gradient-to-br from-[#0a182d] to-[#07111e] border border-blue-500/30 shadow-lg relative overflow-hidden col-span-2 sm:col-span-1">
        <div className="absolute top-0 right-0 w-16 h-16 bg-blue-500/10 rounded-full blur-xl pointer-events-none"></div>
        <div className="flex items-center justify-between text-[10px] font-bold text-blue-300/80 uppercase tracking-wider mb-1">
          <span>DESPACHO PROMEDIO</span>
          <Car className="w-3.5 h-3.5 text-blue-400" />
        </div>
        <div className="text-xl sm:text-2xl font-black font-mono tracking-tight text-white flex items-baseline gap-1">
          <span>5.4</span>
          <span className="text-xs font-sans text-blue-300 font-bold">min</span>
        </div>
        <div className="flex items-center justify-between mt-1 pt-1 border-t border-blue-900/40 text-[10px]">
          <span className="text-cyan-300 font-bold">7 Móviles Activos</span>
          <span className="text-emerald-400 text-[9px] font-bold">● 100% Cobertura</span>
        </div>
      </div>
    </div>
  );
};
