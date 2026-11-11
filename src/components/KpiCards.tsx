import React from 'react';
import { Users, Building2, AlertTriangle, ShieldCheck, Clock, Droplets } from 'lucide-react';
import { IncidentRecord } from '../types';
import { EditableHeading } from './EditableHeading';
import { DashboardTitles } from '../utils/useEditableTitles';

interface WaterTubeProps {
  percentage: number;
  colorScheme: 'blue' | 'emerald' | 'amber' | 'indigo';
  label?: string;
}

const WaterTube: React.FC<WaterTubeProps> = ({ percentage, colorScheme, label }) => {
  const clamped = Math.max(8, Math.min(100, Math.round(percentage)));

  const colorStyles = {
    blue: {
      gradient: 'from-cyan-400 via-sky-500 to-blue-600',
      waveColor: '#38bdf8',
      bubbleColor: 'bg-cyan-200',
      glow: 'shadow-[0_0_12px_rgba(14,165,233,0.35)]',
      border: 'border-sky-300',
      badge: 'bg-sky-50 text-sky-700 border-sky-200',
    },
    emerald: {
      gradient: 'from-teal-300 via-emerald-400 to-emerald-600',
      waveColor: '#34d399',
      bubbleColor: 'bg-emerald-100',
      glow: 'shadow-[0_0_12px_rgba(16,185,129,0.35)]',
      border: 'border-emerald-300',
      badge: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    },
    amber: {
      gradient: 'from-amber-300 via-amber-400 to-amber-600',
      waveColor: '#fbbf24',
      bubbleColor: 'bg-amber-100',
      glow: 'shadow-[0_0_12px_rgba(245,158,11,0.35)]',
      border: 'border-amber-300',
      badge: 'bg-amber-50 text-amber-700 border-amber-200',
    },
    indigo: {
      gradient: 'from-indigo-300 via-indigo-500 to-blue-700',
      waveColor: '#818cf8',
      bubbleColor: 'bg-indigo-100',
      glow: 'shadow-[0_0_12px_rgba(99,102,241,0.35)]',
      border: 'border-indigo-300',
      badge: 'bg-indigo-50 text-indigo-700 border-indigo-200',
    },
  }[colorScheme];

  return (
    <div className="flex items-center gap-1.5 shrink-0" title={`Nivel de llenado: ${clamped}%`}>
      {/* Cylindrical Glass Tube */}
      <div className="relative w-8 sm:w-9 h-16 sm:h-[72px] rounded-b-xl rounded-t-sm border-2 border-slate-300 bg-gradient-to-b from-slate-100/90 to-slate-200/90 shadow-inner flex flex-col justify-end overflow-hidden p-0.5">
        {/* Top Metallic Cap/Ring */}
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-slate-300 via-slate-100 to-slate-400 border-b border-slate-300 z-20" />

        {/* Measurement graduation markings (calibrated beaker ticks) */}
        <div className="absolute right-0.5 top-2 bottom-2 flex flex-col justify-between items-end pointer-events-none z-20 opacity-60">
          <div className="w-1.5 h-[1px] bg-slate-500" />
          <div className="w-2.5 h-[1px] bg-slate-600 font-mono text-[6px]" />
          <div className="w-1.5 h-[1px] bg-slate-500" />
          <div className="w-2 h-[1px] bg-slate-600" />
          <div className="w-1.5 h-[1px] bg-slate-500" />
        </div>

        {/* Dynamic Water Liquid Column */}
        <div
          className={`w-full bg-gradient-to-t ${colorStyles.gradient} ${colorStyles.glow} rounded-b-[10px] relative transition-all duration-700 ease-out`}
          style={{ height: `${clamped}%` }}
        >
          {/* Animated Water Surface Meniscus (Sine wave) */}
          <div className="absolute -top-1.5 left-0 right-0 h-2 overflow-hidden pointer-events-none">
            <svg
              className="w-[200%] h-full animate-water-wave"
              viewBox="0 0 100 20"
              preserveAspectRatio="none"
            >
              <path
                d="M 0,10 C 25,0 25,20 50,10 C 75,0 75,20 100,10 L 100,20 L 0,20 Z"
                fill={colorStyles.waveColor}
                opacity="0.9"
              />
            </svg>
          </div>

          {/* Effervescent Water Micro-bubbles */}
          <div className={`absolute bottom-1 left-2 w-1 h-1 rounded-full ${colorStyles.bubbleColor} animate-bubble-1 opacity-75`} />
          <div className={`absolute bottom-2 left-4 w-1.5 h-1.5 rounded-full ${colorStyles.bubbleColor} animate-bubble-2 opacity-60`} />
          <div className={`absolute bottom-1.5 left-3 w-1 h-1 rounded-full ${colorStyles.bubbleColor} animate-bubble-3 opacity-80`} />
        </div>

        {/* Specular Glass Wall Highlight (Reflexión vertical de vidrio transparente) */}
        <div className="absolute top-1 bottom-1 left-1 w-1 rounded-full bg-gradient-to-r from-white/70 to-transparent pointer-events-none z-20" />
        <div className="absolute top-1 bottom-1 right-1 w-0.5 rounded-full bg-gradient-to-l from-white/40 to-transparent pointer-events-none z-20" />
      </div>

      {/* Level Label Badge */}
      {label && (
        <div className="flex flex-col items-center">
          <span className={`text-[10px] font-black font-mono px-1 py-0.5 rounded border ${colorStyles.badge}`}>
            {clamped}%
          </span>
          <span className="text-[8px] text-slate-600 font-semibold uppercase tracking-tighter">NIVEL</span>
        </div>
      )}
    </div>
  );
};

interface KpiCardsProps {
  filteredRecords: IncidentRecord[];
  totalRecordsCount: number;
  titles?: DashboardTitles;
  onUpdateTitle?: (key: keyof DashboardTitles, val: string) => void;
}

export const KpiCards: React.FC<KpiCardsProps> = ({
  filteredRecords,
  totalRecordsCount,
  titles,
  onUpdateTitle,
}) => {
  const total = filteredRecords.length;

  // Sector stats
  const sectorCounts: Record<string, number> = {};
  filteredRecords.forEach((r) => {
    sectorCounts[r.zona] = (sectorCounts[r.zona] || 0) + 1;
  });
  let maxSectorName = 'ZONA CENTRO';
  let maxSectorCount = 1022;
  if (Object.keys(sectorCounts).length > 0) {
    const sortedSectors = Object.entries(sectorCounts).sort((a, b) => b[1] - a[1]);
    maxSectorName = sortedSectors[0][0];
    maxSectorCount = sortedSectors[0][1];
  }

  // Turno stats
  const turnoCounts: Record<string, number> = {};
  filteredRecords.forEach((r) => {
    turnoCounts[r.turno] = (turnoCounts[r.turno] || 0) + 1;
  });
  let maxTurnoName = 'TARDE';
  let maxTurnoCount = 1195;
  if (Object.keys(turnoCounts).length > 0) {
    const sortedTurnos = Object.entries(turnoCounts).sort((a, b) => b[1] - a[1]);
    maxTurnoName = sortedTurnos[0][0];
    maxTurnoCount = sortedTurnos[0][1];
  }

  const isFiltered = total !== totalRecordsCount;

  // Tubo 1: Porcentaje de atenciones vs capacidad global o total
  const kpi1Percentage = totalRecordsCount > 0 ? (total / totalRecordsCount) * 100 : 100;

  // Tubo 2: Porcentaje del sector predominante respecto al total
  const kpi2Percentage = total > 0 ? (maxSectorCount / total) * 100 : 38;

  // Tubo 3: Intensidad del sector crítico (concentración relativa)
  const kpi3Percentage = Math.min(100, Math.max(25, (maxSectorCount / Math.max(total, 1)) * 100 * 2));

  // Tubo 4: Concentración del turno pico
  const kpi4Percentage = total > 0 ? (maxTurnoCount / total) * 100 : 45;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 my-1.5">
      {/* KPI 1: TOTAL ATENCIONES 2026 */}
      <div
        id="kpi-total-atenciones"
        className="rounded-lg border-2 border-[#1258a2] bg-white text-slate-800 shadow-md flex flex-col justify-between overflow-hidden hover:shadow-lg transition-shadow"
      >
        <div className="px-3.5 py-2.5 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-10 h-10 rounded-full bg-cyan-100 flex items-center justify-center text-[#1258a2] shrink-0 shadow-xs">
              <Users className="w-5 h-5 stroke-[2.5]" />
            </div>
            <div className="flex flex-col truncate">
              <span className="text-2xl sm:text-3xl font-black text-[#0f3c6c] tracking-tight leading-none">
                {total.toLocaleString()}
              </span>
              <span className="text-[10px] text-slate-500 font-semibold truncate mt-0.5 flex items-center gap-1">
                <Droplets className="w-3 h-3 text-cyan-600 shrink-0" />
                {isFiltered ? `${Math.round(kpi1Percentage)}% del total general` : 'Volumen global activo'}
              </span>
            </div>
          </div>

          {/* Water Tube Indicator */}
          <WaterTube percentage={kpi1Percentage} colorScheme="blue" label={`${Math.round(kpi1Percentage)}%`} />
        </div>

        <div className="bg-[#1258a2] text-white py-1.5 px-3 text-center text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-1.5">
          <ShieldCheck className="w-3.5 h-3.5 text-cyan-200" />
          <EditableHeading
            value={titles?.kpiTotal || 'TOTAL ATENCIONES 2026'}
            onSave={(val) => onUpdateTitle?.('kpiTotal', val)}
            badgeStyle={false}
            className="text-white hover:text-cyan-200 font-bold"
          />
          {isFiltered && <span className="text-[10px] text-cyan-200">({totalRecordsCount} BD)</span>}
        </div>
      </div>

      {/* KPI 2: ATENCIONES POR SECTOR */}
      <div
        id="kpi-atenciones-sector"
        className="rounded-lg border-2 border-[#1f7a4e] bg-white text-slate-800 shadow-md flex flex-col justify-between overflow-hidden hover:shadow-lg transition-shadow"
      >
        <div className="px-3.5 py-2.5 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center text-[#1f7a4e] shrink-0 shadow-xs">
              <Building2 className="w-5 h-5 stroke-[2.5]" />
            </div>
            <div className="flex flex-col truncate">
              <span className="text-2xl sm:text-3xl font-black text-[#135c39] tracking-tight leading-none">
                {maxSectorCount.toLocaleString()}
              </span>
              <span className="text-[10px] text-slate-500 font-semibold truncate mt-0.5 flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
                {maxSectorName}
              </span>
            </div>
          </div>

          {/* Water Tube Indicator */}
          <WaterTube percentage={kpi2Percentage} colorScheme="emerald" label={`${Math.round(kpi2Percentage)}%`} />
        </div>

        <div className="bg-[#1f7a4e] text-white py-1.5 px-3 text-center text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-1.5">
          <EditableHeading
            value={titles?.kpiSector || 'ATENCIONES POR SECTOR'}
            onSave={(val) => onUpdateTitle?.('kpiSector', val)}
            badgeStyle={false}
            className="text-white hover:text-emerald-200 font-bold"
          />
          <span className="text-[10px] text-emerald-200">({maxSectorName})</span>
        </div>
      </div>

      {/* KPI 3: SECTOR CRÍTICO */}
      <div
        id="kpi-sector-critico"
        className="rounded-lg border-2 border-[#b45309] bg-white text-slate-800 shadow-md flex flex-col justify-between overflow-hidden hover:shadow-lg transition-shadow"
      >
        <div className="px-3.5 py-2.5 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center text-amber-700 shrink-0 shadow-xs">
              <AlertTriangle className="w-5 h-5 stroke-[2.5]" />
            </div>
            <div className="flex flex-col truncate">
              <span className="text-lg sm:text-xl font-black text-amber-950 tracking-tight leading-none truncate uppercase">
                {maxSectorName}
              </span>
              <span className="text-[10px] text-slate-500 font-semibold truncate mt-0.5">
                Mayor concentración
              </span>
            </div>
          </div>

          {/* Water Tube Indicator */}
          <WaterTube percentage={kpi3Percentage} colorScheme="amber" label={`${Math.round(kpi3Percentage)}%`} />
        </div>

        <div className="bg-[#b45309] text-white py-1.5 px-3 text-center text-xs font-bold uppercase tracking-wider flex items-center justify-center">
          <EditableHeading
            value={titles?.kpiSectorCritico || 'SECTOR CRÍTICO'}
            onSave={(val) => onUpdateTitle?.('kpiSectorCritico', val)}
            badgeStyle={false}
            className="text-white hover:text-amber-200 font-bold"
          />
        </div>
      </div>

      {/* KPI 4: TURNO CRÍTICO */}
      <div
        id="kpi-turno-critico"
        className="rounded-lg border-2 border-[#1e3a8a] bg-white text-slate-800 shadow-md flex flex-col justify-between overflow-hidden hover:shadow-lg transition-shadow"
      >
        <div className="px-3.5 py-2.5 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 shrink-0 shadow-xs">
              <Clock className="w-5 h-5 stroke-[2.5]" />
            </div>
            <div className="flex flex-col truncate">
              <span className="text-xl sm:text-2xl font-black text-[#1e3a8a] tracking-tight leading-none uppercase">
                {maxTurnoName}
              </span>
              <span className="text-[10px] text-slate-500 font-semibold truncate mt-0.5">
                {maxTurnoCount.toLocaleString()} casos ({Math.round(kpi4Percentage)}%)
              </span>
            </div>
          </div>

          {/* Water Tube Indicator */}
          <WaterTube percentage={kpi4Percentage} colorScheme="indigo" label={`${Math.round(kpi4Percentage)}%`} />
        </div>

        <div className="bg-[#1e3a8a] text-white py-1.5 px-3 text-center text-xs font-bold uppercase tracking-wider flex items-center justify-center">
          <EditableHeading
            value={titles?.kpiTurnoCritico || 'TURNO CRÍTICO'}
            onSave={(val) => onUpdateTitle?.('kpiTurnoCritico', val)}
            badgeStyle={false}
            className="text-white hover:text-cyan-200 font-bold"
          />
        </div>
      </div>
    </div>
  );
};
