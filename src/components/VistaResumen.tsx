import React, { useState, useMemo } from 'react';
import {
  IncidentRecord,
  MesType,
  TurnoType,
  ZonaType,
  ComisariaType,
} from '../types';
import { SUBSECTORES_CONFIG, COMPARATIVO_MENSUAL } from '../data/mockData';
import {
  Calendar,
  X,
  MapPin,
  Clock,
  ShieldCheck,
  ChevronRight,
  Sparkles,
  Flame,
  TrendingUp,
  ArrowUpRight,
  FileSpreadsheet,
  Download,
  BarChart3,
  CheckCircle2,
  BarChart2,
  LineChart,
  List,
  Layers,
  Activity,
  Compass,
  ArrowUpDown,
  SlidersHorizontal,
  ShieldAlert,
  FileDown,
  FileText,
  Table,
} from 'lucide-react';
import { EditableHeading } from './EditableHeading';
import { DashboardTitles } from '../utils/useEditableTitles';
import { exportComparativeSeptemberToExcel } from '../utils/excelHelper';
import { MatrixHeatmapFilter } from './MatrixHeatmapFilter';
import { MonthlyReportModal } from './MonthlyReportModal';
import { AnnualConsolidatedModal } from './AnnualConsolidatedModal';
import {
  getMonthlyReportData,
  exportMonthlyReportExcel,
  exportMonthlyReportPDF,
} from '../utils/reportGenerator';

interface VistaResumenProps {
  records: IncidentRecord[];
  allRecords?: IncidentRecord[];
  selectedMes?: MesType | null;
  titles?: DashboardTitles;
  onUpdateTitle?: (key: keyof DashboardTitles, val: string) => void;
  onSelectMes?: (mes: MesType | null) => void;
  onSelectSubsector?: (subsector: string) => void;
  onSelectTurno?: (turno: TurnoType) => void;
  onSelectZona?: (zona: ZonaType) => void;
  onSelectComisaria?: (comisaria: ComisariaType) => void;
  onSelectDia?: (dia: string) => void;
  onNavigateToHeatmap?: () => void;
  onNavigateToDetails?: () => void;
  onNavigateToPlanes?: () => void;
}

interface ArtisticBeakerProps {
  label: string;
  count: number;
  share: string;
  fillPct: number;
  isSelected?: boolean;
  onClick?: () => void;
}

const ArtisticBeaker: React.FC<ArtisticBeakerProps> = ({
  label,
  count,
  share,
  fillPct,
  isSelected,
  onClick,
}) => {
  return (
    <div
      onClick={onClick}
      className={`flex-1 flex flex-col items-center cursor-pointer group transition-all duration-300 max-w-[130px] ${
        isSelected ? 'scale-105' : 'hover:-translate-y-1'
      }`}
      title={`Zona: ${label} - ${count.toLocaleString()} atenciones (${share}%)`}
    >
      {/* Outer Flask Assembly */}
      <div className="relative flex flex-col items-center">
        {/* 1. Realistic Wooden Cork Stopper */}
        <div className="relative z-20 flex flex-col items-center">
          {/* Cork Head */}
          <div
            className="w-10 sm:w-11 h-2.5 rounded-t-xs border-t border-x border-[#5c3413] shadow-md relative overflow-hidden"
            style={{
              background: 'linear-gradient(180deg, #d89858 0%, #ad6b33 50%, #7d441c 100%)',
            }}
          >
            <div className="absolute inset-0 opacity-25 bg-[radial-gradient(#422006_1px,transparent_1px)] [background-size:3px_3px]" />
            <div className="absolute top-0 inset-x-0 h-[1px] bg-white/40" />
          </div>
          {/* Cork Neck Insert */}
          <div
            className="w-7 sm:w-8 h-1.5 border-x border-[#4b270a] shadow-inner"
            style={{
              background: 'linear-gradient(180deg, #9b5a27 0%, #683612 100%)',
            }}
          />
        </div>

        {/* 2. Glass Cylinder Body */}
        <div
          className={`w-18 sm:w-20 md:w-22 h-40 sm:h-44 md:h-48 rounded-b-xl border-2 relative overflow-hidden flex flex-col justify-end transition-all duration-300 shadow-md ${
            isSelected
              ? 'border-cyan-400 ring-2 ring-cyan-400/50 shadow-cyan-200/50'
              : 'border-slate-300 group-hover:border-blue-500 group-hover:shadow-blue-200/50'
          }`}
          style={{
            background:
              'linear-gradient(135deg, rgba(240, 249, 255, 0.85) 0%, rgba(224, 242, 254, 0.6) 50%, rgba(203, 213, 225, 0.75) 100%)',
            boxShadow: 'inset 0 0 10px rgba(255,255,255,0.6)',
          }}
        >
          {/* Glass Top Lip collar */}
          <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-white/90 via-white/40 to-white/80 border-b border-slate-300/60 z-20" />

          {/* Left Glass Specular Reflection */}
          <div
            className="absolute top-0 bottom-0 left-1 w-1.5 pointer-events-none z-20"
            style={{
              background:
                'linear-gradient(90deg, rgba(255,255,255,0.8) 0%, rgba(255,255,255,0.15) 50%, transparent 100%)',
            }}
          />

          {/* Right Glass Refraction */}
          <div
            className="absolute top-0 bottom-0 right-1 w-1 pointer-events-none z-20"
            style={{
              background:
                'linear-gradient(270deg, rgba(255,255,255,0.45) 0%, transparent 100%)',
            }}
          />

          {/* Millimeter / Volumetric Measurement Scale */}
          <div className="absolute left-1.5 top-2 bottom-3 w-6 flex flex-col justify-between pointer-events-none z-20 select-none opacity-60">
            {[
              { val: '10K', w: 'w-3.5' },
              { val: '', w: 'w-2' },
              { val: '8K', w: 'w-3' },
              { val: '', w: 'w-2' },
              { val: '6K', w: 'w-3' },
              { val: '', w: 'w-2' },
              { val: '4K', w: 'w-3' },
              { val: '', w: 'w-2' },
              { val: '2K', w: 'w-3' },
            ].map((tick, i) => (
              <div key={i} className="flex items-center gap-0.5">
                <span className={`h-[1px] ${tick.w} bg-slate-700 shadow-xs`} />
                {tick.val && (
                  <span className="text-[7px] font-mono font-black text-slate-700 leading-none">
                    {tick.val}
                  </span>
                )}
              </div>
            ))}
          </div>

          {/* Luminous Ocean Fluid Column */}
          <div
            className="w-full relative transition-all duration-700 flex items-center justify-center rounded-b-lg overflow-hidden"
            style={{
              height: `${Math.min(84, Math.max(18, fillPct))}%`,
              background:
                'linear-gradient(180deg, #38bdf8 0%, #0284c7 30%, #034b7f 70%, #06213f 100%)',
              boxShadow:
                'inset 0 2px 4px rgba(255, 255, 255, 0.45), inset 0 -3px 6px rgba(0, 0, 0, 0.5)',
            }}
          >
            {/* Curved Meniscus Glowing Top Lip */}
            <div
              className="absolute top-0 inset-x-0 h-1.5 bg-gradient-to-r from-cyan-100 via-cyan-200 to-cyan-100 opacity-90 shadow-sm"
              style={{
                borderRadius: '50% 50% 0 0 / 100% 100% 0 0',
                filter: 'drop-shadow(0 0 3px #38bdf8)',
              }}
            />

            {/* Micro Effervescent Bubbles */}
            <div className="absolute w-1 h-1 rounded-full bg-white/70 bottom-2 left-3 animate-ping" />
            <div className="absolute w-0.5 h-0.5 rounded-full bg-cyan-200/80 bottom-5 right-3 animate-pulse" />

            {/* Glowing Monospace Count Figure */}
            <span className="text-white text-xs sm:text-sm md:text-base font-black tracking-tight font-mono z-10 drop-shadow-[0_2px_3px_rgba(0,0,0,0.9)] select-none">
              {count.toLocaleString()}
            </span>
          </div>

          {/* Thick Glass Bottom Base Rim */}
          <div className="absolute bottom-0 inset-x-0 h-2 bg-gradient-to-t from-slate-400/50 to-transparent border-t border-white/40 pointer-events-none rounded-b-xl" />
        </div>

        {/* Ambient Pedestal Shadow */}
        <div className="w-14 sm:w-16 h-1.5 bg-slate-300/80 rounded-full blur-[1.5px] mt-1" />
      </div>

      {/* Typographic Label & Badges */}
      <div className="flex flex-col items-center mt-1.5 gap-0.5 text-center">
        <span
          className={`text-[10px] sm:text-[11px] font-black uppercase tracking-wide transition-colors ${
            isSelected ? 'text-blue-700 underline font-black' : 'text-slate-800 group-hover:text-blue-700'
          }`}
        >
          {label}
        </span>
        <div className="flex items-center gap-1">
          <span className="text-[9px] font-bold px-1.5 py-0.2 rounded-full bg-blue-100 text-blue-900 border border-blue-200 font-mono">
            {share}%
          </span>
          <span className="text-[8px] text-slate-500 font-medium">
            ({count.toLocaleString()})
          </span>
        </div>
      </div>
    </div>
  );
};

export const VistaResumen: React.FC<VistaResumenProps> = ({
  records,
  allRecords = [],
  selectedMes,
  titles,
  onUpdateTitle,
  onSelectMes,
  onSelectSubsector,
  onSelectTurno,
  onSelectZona,
  onSelectComisaria,
  onSelectDia,
  onNavigateToHeatmap,
  onNavigateToDetails,
  onNavigateToPlanes,
}) => {
  const baseRecords = allRecords.length > 0 ? allRecords : records;

  // Estado para el gráfico comparativo anual (false = incluye todos los meses del año)
  const [excludeSetiembre, setExcludeSetiembre] = useState<boolean>(false);
  const [showSetiembreModal, setShowSetiembreModal] = useState<boolean>(false);

  // Estados para reportes ejecutivos del mes y consolidado anual
  const [isMonthlyReportModalOpen, setIsMonthlyReportModalOpen] = useState<boolean>(false);
  const [isAnnualConsolidatedModalOpen, setIsAnnualConsolidatedModalOpen] = useState<boolean>(false);
  const [reportTargetMes, setReportTargetMes] = useState<MesType>(selectedMes || 'SETIEMBRE');

  const handleOpenMonthlyReport = (mes?: MesType) => {
    const target = mes || selectedMes || 'SETIEMBRE';
    setReportTargetMes(target);
    setIsMonthlyReportModalOpen(true);
  };

  const handleDownloadMonthExcelDirect = (mes?: MesType) => {
    const target = mes || selectedMes || 'SETIEMBRE';
    const repData = getMonthlyReportData(baseRecords, baseRecords, target);
    exportMonthlyReportExcel(repData);
  };

  const handleDownloadMonthPDFDirect = (mes?: MesType) => {
    const target = mes || selectedMes || 'SETIEMBRE';
    const repData = getMonthlyReportData(baseRecords, baseRecords, target);
    exportMonthlyReportPDF(repData);
  };

  // Estados visuales solicitados para gráficos modernos y analíticos
  const [subsectorViewMode, setSubsectorViewMode] = useState<'BARS' | 'MOUNTAIN'>('BARS');
  const [subsectorSortBy, setSubsectorSortBy] = useState<'COUNT' | 'CODE'>('COUNT');
  const [comparativoChartType, setComparativoChartType] = useState<'ROWS' | 'COLUMNS' | 'LINES'>('ROWS');
  const [diasChartType, setDiasChartType] = useState<'COLUMNS' | 'SPLINE' | 'CARDS'>('COLUMNS');
  const [comisariaSubView, setComisariaSubView] = useState<'TURNO' | 'COMISARIA'>('TURNO');
  const [selectedDiaFilter, setSelectedDiaFilter] = useState<string | null>(null);

  const handleDayClick = (key: string) => {
    const next = selectedDiaFilter === key ? null : key;
    setSelectedDiaFilter(next);
    onSelectDia?.(next || '');
  };

  // Estadísticas comparativas exclusivas de Setiembre
  const setiembreStats = useMemo(() => {
    const setRecords = baseRecords.filter((r) => r.mes === 'SETIEMBRE');
    const total2026 = setRecords.length > 0 ? setRecords.length : 242;
    const total2025 = 210;
    const diff = total2026 - total2025;
    const pct = Math.round((diff / total2025) * 100);

    let ba = 0;
    let vm = 0;
    let manana = 0;
    let tarde = 0;
    let noche = 0;

    setRecords.forEach((r) => {
      if (r.comisaria === 'CIA VILLA MARIA') vm++;
      else ba++;

      if (r.turno === 'MAÑANA') manana++;
      else if (r.turno === 'TARDE') tarde++;
      else noche++;
    });

    if (setRecords.length === 0) {
      ba = 203;
      vm = 39;
      manana = 78;
      tarde = 95;
      noche = 69;
    }

    return {
      total2026,
      total2025,
      diff,
      pct,
      ba,
      vm,
      manana,
      tarde,
      noche,
      countRecords: setRecords.length,
    };
  }, [baseRecords]);

  // 1. Calculate Comisaría counts & cross-turno operational metrics
  const comisariaData = useMemo(() => {
    let ba = 0;
    let vm = 0;
    let baManana = 0;
    let baTarde = 0;
    let baNoche = 0;
    let vmManana = 0;
    let vmTarde = 0;
    let vmNoche = 0;

    records.forEach((r) => {
      const isVM = r.comisaria === 'CIA VILLA MARIA';
      if (isVM) {
        vm++;
        if (r.turno === 'MAÑANA') vmManana++;
        else if (r.turno === 'TARDE') vmTarde++;
        else if (r.turno === 'NOCHE') vmNoche++;
      } else {
        ba++;
        if (r.turno === 'MAÑANA') baManana++;
        else if (r.turno === 'TARDE') baTarde++;
        else if (r.turno === 'NOCHE') baNoche++;
      }
    });

    const total = records.length || 1;
    const baPct = Math.round((ba / total) * 100);
    const vmPct = Math.round((vm / total) * 100);

    const mananaTotal = baManana + vmManana;
    const tardeTotal = baTarde + vmTarde;
    const nocheTotal = baNoche + vmNoche;

    const turnos = {
      manana: {
        total: mananaTotal,
        ba: baManana,
        vm: vmManana,
        baPct: mananaTotal > 0 ? Math.round((baManana / mananaTotal) * 100) : 0,
        vmPct: mananaTotal > 0 ? Math.round((vmManana / mananaTotal) * 100) : 0,
      },
      tarde: {
        total: tardeTotal,
        ba: baTarde,
        vm: vmTarde,
        baPct: tardeTotal > 0 ? Math.round((baTarde / tardeTotal) * 100) : 0,
        vmPct: tardeTotal > 0 ? Math.round((vmTarde / tardeTotal) * 100) : 0,
      },
      noche: {
        total: nocheTotal,
        ba: baNoche,
        vm: vmNoche,
        baPct: nocheTotal > 0 ? Math.round((baNoche / nocheTotal) * 100) : 0,
        vmPct: nocheTotal > 0 ? Math.round((vmNoche / nocheTotal) * 100) : 0,
      },
    };

    const baTurnos = {
      manana: { count: baManana, pct: ba > 0 ? Math.round((baManana / ba) * 100) : 0 },
      tarde: { count: baTarde, pct: ba > 0 ? Math.round((baTarde / ba) * 100) : 0 },
      noche: { count: baNoche, pct: ba > 0 ? Math.round((baNoche / ba) * 100) : 0 },
    };

    const vmTurnos = {
      manana: { count: vmManana, pct: vm > 0 ? Math.round((vmManana / vm) * 100) : 0 },
      tarde: { count: vmTarde, pct: vm > 0 ? Math.round((vmTarde / vm) * 100) : 0 },
      noche: { count: vmNoche, pct: vm > 0 ? Math.round((vmNoche / vm) * 100) : 0 },
    };

    const ratio = vm > 0 ? (ba / vm).toFixed(1) : (ba > 0 ? '—' : '0');

    return {
      ba,
      vm,
      baPct,
      vmPct,
      total,
      turnos,
      baTurnos,
      vmTurnos,
      ratio,
    };
  }, [records]);

  // 2. Calculate Turno counts
  const turnoData = useMemo(() => {
    let manana = 0;
    let tarde = 0;
    let noche = 0;
    records.forEach((r) => {
      if (r.turno === 'MAÑANA') manana++;
      else if (r.turno === 'TARDE') tarde++;
      else if (r.turno === 'NOCHE') noche++;
    });
    const total = records.length || 1;
    const tardePct = Math.round((tarde / total) * 100);
    const maxTurno = Math.max(manana, tarde, noche, 1);
    return { manana, tarde, noche, tardePct, total, maxTurno };
  }, [records]);

  // 3. Calculate Subsector counts (16 subsectores oficiales según Imagen 2)
  const subsectorData = useMemo(() => {
    const counts: Record<string, number> = {};
    const order = [
      'S1BA', 'S1VM', 'S2BA', 'S2VM', 'S3BA', 'S3VM', 'S4BA', 'S4VM',
      'S5BA', 'S5VM', 'S6BA', 'S6VM', 'S7BA', 'S8BA', 'S9BA', 'S7VM',
    ];
    order.forEach((k) => (counts[k] = 0));
    records.forEach((r) => {
      const code = (r.subsector || '').toUpperCase();
      if (order.includes(code)) {
        counts[code] = (counts[code] || 0) + 1;
      } else {
        counts['S2BA'] = (counts['S2BA'] || 0) + 1;
      }
    });

    const items = order.map((code) => ({
      code,
      count: counts[code] || 0,
      name: SUBSECTORES_CONFIG[code]?.nombre || code,
      isVM: code.endsWith('VM'),
    }));
    const maxVal = Math.max(...items.map((i) => i.count), 1);
    return { items, maxVal };
  }, [records]);

  // Lista ordenada de subsectores para el gráfico analítico de barras horizontales
  const sortedSubsectorItems = useMemo(() => {
    const list = [...subsectorData.items];
    if (subsectorSortBy === 'COUNT') {
      list.sort((a, b) => b.count - a.count);
    } else {
      list.sort((a, b) => a.code.localeCompare(b.code));
    }
    return list;
  }, [subsectorData.items, subsectorSortBy]);

  // 4. Calculate Días de la Semana
  const diaData = useMemo(() => {
    const days = [
      { name: 'LUNES', short: 'LUN', key: 'LUNES', count: 0 },
      { name: 'MARTES', short: 'MAR', key: 'MARTES', count: 0 },
      { name: 'MIÉRCOLES', short: 'MIÉ', key: 'MIÉRCOLES', count: 0 },
      { name: 'JUEVES', short: 'JUE', key: 'JUEVES', count: 0 },
      { name: 'VIERNES', short: 'VIE', key: 'VIERNES', count: 0 },
      { name: 'SÁBADO', short: 'SÁB', key: 'SÁBADO', count: 0 },
      { name: 'DOMINGO', short: 'DOM', key: 'DOMINGO', count: 0 },
    ];
    records.forEach((r) => {
      const d = days.find((item) => item.key === r.diaSemana);
      if (d) d.count++;
      else days[0].count++;
    });
    const total = days.reduce((sum, d) => sum + d.count, 0) || 1;
    const max = Math.max(...days.map((d) => d.count), 1);
    const min = Math.min(...days.map((d) => d.count));
    const promedio = Math.round(total / 7);
    const rawPeakDay = [...days].sort((a, b) => b.count - a.count)[0];
    const finDeSemana =
      (days.find((d) => d.key === 'SÁBADO')?.count || 0) +
      (days.find((d) => d.key === 'DOMINGO')?.count || 0);
    const laborables = total - finDeSemana;
    const pctFinDeSemana = ((finDeSemana / total) * 100).toFixed(1);
    const pctLaborables = ((laborables / total) * 100).toFixed(1);

    const enrichedDays = days.map((d) => ({
      ...d,
      pctOfTotal: ((d.count / total) * 100).toFixed(1),
      isPeak: d.key === rawPeakDay?.key,
      diffVsAvg: d.count - promedio,
      pctVsAvg: promedio > 0 ? Math.round(((d.count - promedio) / promedio) * 100) : 0,
      barHeightPct: Math.max(16, Math.round((d.count / max) * 100)),
    }));

    const peakDay = [...enrichedDays].sort((a, b) => b.count - a.count)[0];

    return {
      days: enrichedDays,
      total,
      max,
      min,
      promedio,
      peakDay,
      finDeSemana,
      laborables,
      pctFinDeSemana,
      pctLaborables,
    };
  }, [records]);

  // 5. Calculate Comparativo Mes por Mes (Abarca todos los meses del año: Enero a Diciembre)
  const monthlyData = useMemo(() => {
    const counts2026: Record<string, number> = {};
    baseRecords.forEach((r) => {
      if (r.mes) {
        counts2026[r.mes] = (counts2026[r.mes] || 0) + 1;
      }
    });

    let list = [...COMPARATIVO_MENSUAL];
    if (excludeSetiembre) {
      list = list.filter((item) => item.mes !== 'SETIEMBRE');
    }

    return list.map((item) => {
      const dyn2026 = counts2026[item.mes] !== undefined ? counts2026[item.mes] : item.anio2026;
      return {
        mes: item.mes.slice(0, 3),
        mesFull: item.mes as MesType,
        val2025: item.anio2025,
        val2026: dyn2026,
      };
    });
  }, [baseRecords, excludeSetiembre]);

  // Lista completa de meses con registros para la barra "FILTRAR POR MES" (Enero a Octubre)
  const filterBarMonths = useMemo(() => {
    const counts2026: Record<string, number> = {};
    baseRecords.forEach((r) => {
      if (r.mes) {
        counts2026[r.mes] = (counts2026[r.mes] || 0) + 1;
      }
    });

    return COMPARATIVO_MENSUAL.map((item) => {
      const dyn2026 = counts2026[item.mes] !== undefined ? counts2026[item.mes] : item.anio2026;
      return {
        mes: item.mes === 'SETIEMBRE' ? 'SET' : item.mes === 'OCTUBRE' ? 'OCT' : item.mes.slice(0, 3),
        mesFull: item.mes as MesType,
        val2025: item.anio2025,
        val2026: dyn2026,
      };
    }).filter((m) => m.val2026 > 0);
  }, [baseRecords]);

  // 6. Calculate Sector counts for Glass Beakers
  const sectorData = useMemo(() => {
    let centro = 0;
    let norte = 0;
    let sur = 0;
    records.forEach((r) => {
      if (r.zona === 'ZONA NORTE') norte++;
      else if (r.zona === 'ZONA SUR') sur++;
      else centro++;
    });
    const total = records.length || 1;
    const max = Math.max(centro, norte, sur, 1);
    const centroPct = Math.round((centro / max) * 88);
    const nortePct = Math.round((norte / max) * 88);
    const surPct = Math.round((sur / max) * 88);
    const centroShare = ((centro / total) * 100).toFixed(1);
    const norteShare = ((norte / total) * 100).toFixed(1);
    const surShare = ((sur / total) * 100).toFixed(1);
    return {
      centro,
      norte,
      sur,
      total,
      max,
      centroPct: Math.max(16, centroPct),
      nortePct: Math.max(16, nortePct),
      surPct: Math.max(16, surPct),
      centroShare,
      norteShare,
      surShare,
    };
  }, [records]);

  // 7. Monthly Deep-Dive Stats
  const monthDetail = useMemo(() => {
    if (!selectedMes) return null;

    const safeRecs = Array.isArray(records) ? records : [];
    const incMap: Record<string, number> = {};
    safeRecs.forEach((r) => {
      if (!r) return;
      const t = r.tipoIncidencia || r.incidencia || 'OTROS';
      incMap[t] = (incMap[t] || 0) + 1;
    });
    const topIncidencias = Object.entries(incMap)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([tipo, count]) => ({
        tipo,
        count,
        pct: Math.round((count / (safeRecs.length || 1)) * 100),
      }));

    const daysList = Array.isArray(diaData?.days) ? diaData.days : [];
    const topDay = [...daysList].sort((a, b) => (b?.count || 0) - (a?.count || 0))[0] || { name: 'N/A', count: 0 };
    const itemsList = Array.isArray(subsectorData?.items) ? subsectorData.items : [];
    const topSub = [...itemsList].sort((a, b) => (b?.count || 0) - (a?.count || 0))[0] || { code: 'S/D', name: 'Sin datos', count: 0 };

    return {
      topIncidencias,
      topDay,
      topSub,
      totalMes: safeRecs.length,
    };
  }, [selectedMes, records, diaData, subsectorData]);

  return (
    <div className="flex-1 flex flex-col gap-3 min-w-0">
      {/* 0. INTERACTIVE MONTH SELECTOR BAR CON DESCARGA DIRECTA Y CONSOLIDADO */}
      <div className="bg-white rounded-lg border-2 border-slate-300 shadow-sm p-2 flex flex-col lg:flex-row items-center justify-between gap-2.5">
        <div className="flex items-center gap-1.5 text-xs font-black text-[#0f3460] uppercase shrink-0">
          <Calendar className="w-4 h-4 text-blue-700" />
          <span>FILTRAR POR MES:</span>
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto w-full pb-1 lg:pb-0 scrollbar-none flex-1">
          <button
            id="month-btn-all"
            onClick={() => onSelectMes?.(null)}
            className={`px-2.5 py-1 rounded text-[11px] font-black uppercase transition-all whitespace-nowrap border shrink-0 ${
              !selectedMes
                ? 'bg-gradient-to-r from-[#124270] to-[#18538c] text-white border-[#124270] shadow-md ring-2 ring-blue-300'
                : 'bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200'
            }`}
          >
            AÑO COMPLETO ({baseRecords.length.toLocaleString()})
          </button>

          {filterBarMonths.map((m) => {
            const isSelected = selectedMes === m.mesFull;
            return (
              <button
                key={m.mesFull}
                id={`month-btn-${m.mes.toLowerCase()}`}
                onClick={() => {
                  onSelectMes?.(m.mesFull);
                  handleOpenMonthlyReport(m.mesFull);
                }}
                className={`group relative px-2.5 py-1 rounded text-[10.5px] font-bold uppercase transition-all whitespace-nowrap border flex items-center gap-1.5 shrink-0 ${
                  isSelected
                    ? 'bg-blue-700 text-white border-blue-800 shadow-md font-black ring-2 ring-cyan-400'
                    : 'bg-blue-50/90 text-blue-950 border-blue-200 hover:bg-blue-100 hover:border-blue-300 shadow-xs'
                }`}
                title={`Ver y descargar Ficha Oficial de ${m.mesFull} (2026: ${m.val2026.toLocaleString()} atenciones)`}
              >
                <span>{m.mes}</span>
                <span
                  className={`text-[9.5px] px-1.5 py-0.2 rounded-full font-mono font-bold ${
                    isSelected ? 'bg-white text-blue-800' : 'bg-blue-200/80 text-blue-900'
                  }`}
                >
                  {m.val2026.toLocaleString()}
                </span>

                {/* Ícono de descarga / ficha directa */}
                <span
                  onClick={(e) => {
                    e.stopPropagation();
                    onSelectMes?.(m.mesFull);
                    handleOpenMonthlyReport(m.mesFull);
                  }}
                  className={`p-0.5 rounded hover:bg-black/20 text-slate-400 hover:text-white transition-opacity ${
                    isSelected ? 'opacity-100 text-white' : 'opacity-70 group-hover:opacity-100'
                  }`}
                  title={`Descargar Ficha de ${m.mesFull} (.xlsx / .pdf)`}
                >
                  <Download className="w-3 h-3" />
                </span>
              </button>
            );
          })}
        </div>

        {/* Acceso directo a reportes consolidados y descargas del mes */}
        <div className="flex items-center gap-1.5 shrink-0 w-full lg:w-auto justify-end border-t lg:border-t-0 pt-1 lg:pt-0 border-slate-200">
          <button
            id="btn-direct-download-month-report"
            onClick={() => handleOpenMonthlyReport(selectedMes || 'SETIEMBRE')}
            className="px-2.5 py-1 rounded text-[11px] font-black uppercase transition-all whitespace-nowrap border flex items-center gap-1.5 bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-500 hover:to-teal-600 text-white border-emerald-500 shadow-sm active:scale-95"
            title="Abrir y Descargar Ficha Oficial del Mes en formato horizontal (Excel y PDF)"
          >
            <FileDown className="w-3.5 h-3.5" />
            <span>Descargar Ficha del Mes</span>
          </button>

          <button
            id="btn-direct-open-annual-matrix"
            onClick={() => setIsAnnualConsolidatedModalOpen(true)}
            className="px-2.5 py-1 rounded text-[11px] font-black uppercase transition-all whitespace-nowrap border flex items-center gap-1.5 bg-gradient-to-r from-indigo-700 to-blue-800 hover:from-indigo-600 hover:to-blue-700 text-white border-indigo-600 shadow-sm active:scale-95"
            title="Ver y exportar Consolidado Anual (Matriz Cruzada Completa de 12 Meses)"
          >
            <Table className="w-3.5 h-3.5" />
            <span>Consolidado Anual</span>
          </button>
        </div>
      </div>

      {/* 0.1 ACTIVE MONTH NOTIFICATION BANNER CON DESCARGA RÁPIDA EXCEL / PDF */}
      {selectedMes && (
        <div className="bg-gradient-to-r from-blue-950 via-blue-900 to-indigo-950 text-white rounded-lg p-2.5 shadow-lg flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 border-2 border-cyan-400 animate-fadeIn">
          <div className="flex items-center gap-2.5">
            <span className="flex h-3 w-3 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-cyan-300"></span>
            </span>
            <div className="text-xs sm:text-sm font-bold">
              <span>VISTA MENSUAL ACTIVA: </span>
              <span className="text-amber-300 font-black tracking-wider uppercase">{selectedMes} 2026</span>
              <span className="text-cyan-200 ml-2 font-normal text-xs">
                ({records.length.toLocaleString()} atenciones registradas)
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={() => handleDownloadMonthExcelDirect(selectedMes)}
              className="px-2.5 py-1 rounded bg-emerald-700 hover:bg-emerald-600 text-white text-xs font-bold flex items-center gap-1 transition-colors border border-emerald-500 shadow-xs active:scale-95"
              title={`Descargar Reporte del Mes de ${selectedMes} en Excel (.xlsx)`}
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              <span>Excel (.xlsx)</span>
            </button>

            <button
              onClick={() => handleDownloadMonthPDFDirect(selectedMes)}
              className="px-2.5 py-1 rounded bg-rose-700 hover:bg-rose-600 text-white text-xs font-bold flex items-center gap-1 transition-colors border border-rose-500 shadow-xs active:scale-95"
              title={`Descargar Reporte del Mes de ${selectedMes} en PDF Oficial`}
            >
              <FileText className="w-3.5 h-3.5" />
              <span>PDF</span>
            </button>

            <button
              onClick={() => handleOpenMonthlyReport(selectedMes)}
              className="px-2.5 py-1 rounded bg-cyan-700 hover:bg-cyan-600 text-white text-xs font-bold flex items-center gap-1 transition-colors border border-cyan-500 shadow-xs active:scale-95"
              title="Abrir vista previa de la Ficha Ejecutiva del Mes"
            >
              <BarChart3 className="w-3.5 h-3.5" />
              <span>Ficha Ejecutiva</span>
            </button>

            <button
              onClick={() => onSelectMes?.(null)}
              className="px-2.5 py-1 rounded bg-white/20 hover:bg-white/30 text-white text-xs font-bold flex items-center gap-1 transition-colors border border-white/30 shadow-xs"
              title="Restablecer y ver todo el año"
            >
              <X className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Ver Todo el Año</span>
            </button>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* CATEGORÍA 1: DIMENSIÓN OPERATIVA Y POLICIAL                               */}
      {/* ========================================================================= */}
      <div className="flex flex-col gap-2.5">
        <div className="bg-gradient-to-r from-[#071f3a] via-[#0b2b52] to-[#0f3a6e] text-white px-3 py-1.5 rounded-lg border border-cyan-800 shadow-sm flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-1 rounded bg-cyan-900/60 text-cyan-300">
              <Activity className="w-3.5 h-3.5" />
            </div>
            <div>
              <EditableHeading
                value={titles?.cat1Title || '1. DIMENSIÓN OPERATIVA Y POLICIAL'}
                onSave={(val) => onUpdateTitle?.('cat1Title', val)}
                subtitle={titles?.cat1Sub || '• Jurisdicción de Comisarías y Repartición de Guardias en 24 Horas'}
                onSaveSubtitle={(val) => onUpdateTitle?.('cat1Sub', val)}
                badgeStyle={false}
                className="text-xs font-black tracking-wider uppercase text-white"
              />
            </div>
          </div>
          <span className="text-[10px] font-mono font-bold bg-cyan-950/80 px-2 py-0.5 rounded text-cyan-300 border border-cyan-700/50">
            2 Comisarías &bull; 3 Turnos
          </span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-3.5">
          {/* Chart 1: Atenciones por Comisaría */}
          <div className="lg:col-span-6 bg-white rounded-lg border-2 border-slate-300 shadow-md p-3 flex flex-col justify-between overflow-hidden">
            {/* Encabezado con título editable y controles compactos */}
            <div className="flex items-start justify-between gap-2 border-b border-slate-100 pb-2">
              <EditableHeading
                value={titles?.comisaria || 'ATENCIONES POR COMISARÍA'}
                onSave={(val) => onUpdateTitle?.('comisaria', val)}
                subtitle={titles?.comisariaSub || 'jurisdicción policial PNP'}
                onSaveSubtitle={(val) => onUpdateTitle?.('comisariaSub', val)}
              />
              <div className="flex items-center gap-1.5 shrink-0 pt-0.5">
                <span className="hidden sm:inline-flex items-center gap-1 text-[9px] font-bold text-slate-600 bg-slate-100 border border-slate-200 px-2 py-0.5 rounded">
                  Ratio BA:VM <span className="font-mono text-blue-950 font-black">{comisariaData.ratio}:1</span>
                </span>
                {/* Selector de subvista del gráfico complementario */}
                <div className="inline-flex rounded-md bg-slate-100 p-0.5 border border-slate-200 text-[10px] font-bold">
                  <button
                    onClick={() => setComisariaSubView('TURNO')}
                    className={`px-2 py-0.5 rounded transition-all ${
                      comisariaSubView === 'TURNO'
                        ? 'bg-[#173f6b] text-white shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                    title="Ver peso de cada comisaría frente a los 3 turnos"
                  >
                    Vs Turnos
                  </button>
                  <button
                    onClick={() => setComisariaSubView('COMISARIA')}
                    className={`px-2 py-0.5 rounded transition-all ${
                      comisariaSubView === 'COMISARIA'
                        ? 'bg-[#173f6b] text-white shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                    title="Ver desglose horario por comisaría"
                  >
                    Por Cía
                  </button>
                </div>
              </div>
            </div>

            {/* Cuerpo en dos columnas equilibradas: Dona (Izquierda) + Minigráfico Complementario (Derecha) */}
            <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-center py-2.5 flex-1">
              {/* Columna Izquierda: Gráfico de Dona y Botones de Comisaría */}
              <div className="sm:col-span-5 flex flex-col items-center justify-center gap-2">
                <div className="relative flex items-center justify-center">
                  <svg viewBox="0 0 100 100" className="w-28 h-28 drop-shadow-sm">
                    {/* Track de fondo Villa María */}
                    <circle
                      cx="50"
                      cy="50"
                      r="36"
                      fill="transparent"
                      stroke="#6893bd"
                      strokeWidth="18"
                      className="cursor-pointer transition-all hover:opacity-85 hover:stroke-[#5a83ab]"
                      onClick={() => onSelectComisaria?.('CIA VILLA MARIA')}
                    >
                      <title>{`Cía Villa María: ${comisariaData.vm.toLocaleString()} (${comisariaData.vmPct}%)`}</title>
                    </circle>
                    {/* Segmento Buenos Aires */}
                    <circle
                      cx="50"
                      cy="50"
                      r="36"
                      fill="transparent"
                      stroke="#173f6b"
                      strokeWidth="18"
                      strokeDasharray={`${Math.max(0, (comisariaData.baPct / 100) * 226.2)} 226.2`}
                      strokeDashoffset="56.5"
                      className="cursor-pointer transition-all hover:opacity-85 hover:stroke-[#113155]"
                      onClick={() => onSelectComisaria?.('CIA BUENOS AIRES')}
                    >
                      <title>{`Cía Buenos Aires: ${comisariaData.ba.toLocaleString()} (${comisariaData.baPct}%)`}</title>
                    </circle>
                  </svg>

                  {/* Lectura central del gráfico */}
                  <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                    <span className="text-sm font-black text-[#173f6b] tracking-tight">{comisariaData.baPct}%</span>
                    <span className="text-[8px] font-bold text-slate-500 uppercase tracking-tighter">BUENOS AIRES</span>
                    <span className="text-[8px] font-semibold text-slate-400 font-mono">VM {comisariaData.vmPct}%</span>
                  </div>
                </div>

                {/* Botones de comisarías con totales */}
                <div className="w-full flex flex-col gap-1 text-[10px] text-slate-800 font-bold">
                  <button
                    onClick={() => onSelectComisaria?.('CIA BUENOS AIRES')}
                    className="flex items-center justify-between hover:bg-blue-50/60 p-1.5 rounded transition-all text-left border border-slate-200 hover:border-blue-300"
                    title="Filtrar por Cía Buenos Aires"
                  >
                    <div className="flex items-center gap-1.5 min-w-0">
                      <span className="w-2.5 h-2.5 rounded-sm bg-[#173f6b] shadow-xs shrink-0"></span>
                      <span className="truncate">CÍA BUENOS AIRES</span>
                    </div>
                    <div className="flex items-center gap-1 shrink-0 font-mono">
                      <span className="text-xs text-blue-950 font-black">{comisariaData.ba.toLocaleString()}</span>
                      <span className="text-[9px] text-slate-500">({comisariaData.baPct}%)</span>
                    </div>
                  </button>
                  <button
                    onClick={() => onSelectComisaria?.('CIA VILLA MARIA')}
                    className="flex items-center justify-between hover:bg-slate-100 p-1.5 rounded transition-all text-left border border-slate-200 hover:border-slate-300"
                    title="Filtrar por Cía Villa María"
                  >
                    <div className="flex items-center gap-1.5 min-w-0">
                      <span className="w-2.5 h-2.5 rounded-sm bg-[#6893bd] shadow-xs shrink-0"></span>
                      <span className="truncate">CÍA VILLA MARIA</span>
                    </div>
                    <div className="flex items-center gap-1 shrink-0 font-mono">
                      <span className="text-xs text-blue-950 font-black">{comisariaData.vm.toLocaleString()}</span>
                      <span className="text-[9px] text-slate-500">({comisariaData.vmPct}%)</span>
                    </div>
                  </button>
                </div>
              </div>

              {/* Columna Derecha: Minigráfico Complementario y Proporciones Operativas */}
              <div className="sm:col-span-7 bg-slate-50/90 rounded-lg border border-slate-200 p-2 flex flex-col justify-between h-full">
                {/* Cabecera del minigráfico complementario */}
                <div className="flex items-center justify-between pb-1.5 border-b border-slate-200/80 text-[10px]">
                  <div className="flex items-center gap-1 text-[#173f6b] font-black uppercase tracking-wider">
                    <Activity className="w-3 h-3 text-[#173f6b]" />
                    <span>{comisariaSubView === 'TURNO' ? 'Proporción vs Turnos' : 'Desglose por Comisaría'}</span>
                  </div>
                  <div className="flex items-center gap-2 text-[9px] font-bold text-slate-600">
                    <span className="flex items-center gap-1">
                      <span className="w-2 h-2 rounded-xs bg-[#173f6b]"></span> BA
                    </span>
                    <span className="flex items-center gap-1">
                      <span className="w-2 h-2 rounded-xs bg-[#6893bd]"></span> VM
                    </span>
                  </div>
                </div>

                {comisariaSubView === 'TURNO' ? (
                  /* Modo 1: Minigráfico de barras horizontales compuestas por turno */
                  <div className="flex-1 flex flex-col justify-around py-1 gap-2">
                    {/* MAÑANA */}
                    <div
                      className="group cursor-pointer hover:bg-white/70 p-1 rounded transition-colors"
                      onClick={() => onSelectTurno?.('MAÑANA')}
                      title="Turno Mañana: Clic para filtrar"
                    >
                      <div className="flex items-center justify-between text-[10px] font-bold mb-0.5">
                        <span className="text-slate-700 uppercase group-hover:text-blue-700 transition-colors">
                          Mañana <span className="font-normal text-slate-400">({comisariaData.turnos.manana.total} atenc.)</span>
                        </span>
                        <span className="font-mono text-[9px] text-slate-600">
                          <strong className="text-[#173f6b]">{comisariaData.turnos.manana.baPct}%</strong> vs{' '}
                          <strong className="text-[#51769d]">{comisariaData.turnos.manana.vmPct}%</strong>
                        </span>
                      </div>
                      <div className="h-4 bg-slate-200 rounded-md overflow-hidden flex border border-slate-300 shadow-inner">
                        <div
                          className="h-full bg-gradient-to-r from-[#173f6b] to-[#1e538d] flex items-center justify-end px-1.5 transition-all duration-500 hover:brightness-110"
                          style={{ width: `${Math.max(12, comisariaData.turnos.manana.baPct)}%` }}
                          title={`Buenos Aires: ${comisariaData.turnos.manana.ba} (${comisariaData.turnos.manana.baPct}%)`}
                        >
                          <span className="text-white text-[9px] font-black font-mono drop-shadow-xs">
                            {comisariaData.turnos.manana.ba}
                          </span>
                        </div>
                        <div
                          className="h-full bg-gradient-to-r from-[#5a83ab] to-[#6893bd] flex items-center justify-center px-1 transition-all duration-500 hover:brightness-110"
                          style={{ width: `${Math.max(10, comisariaData.turnos.manana.vmPct)}%` }}
                          title={`Villa María: ${comisariaData.turnos.manana.vm} (${comisariaData.turnos.manana.vmPct}%)`}
                        >
                          <span className="text-white text-[9px] font-black font-mono drop-shadow-xs">
                            {comisariaData.turnos.manana.vm}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* TARDE (PICO) */}
                    <div
                      className="group cursor-pointer hover:bg-white/70 p-1 rounded transition-colors"
                      onClick={() => onSelectTurno?.('TARDE')}
                      title="Turno Tarde (Pico): Clic para filtrar"
                    >
                      <div className="flex items-center justify-between text-[10px] font-bold mb-0.5">
                        <span className="text-amber-800 uppercase flex items-center gap-1 group-hover:text-amber-600 transition-colors">
                          <span>Tarde (Pico)</span>
                          <span className="font-normal text-slate-400">({comisariaData.turnos.tarde.total} atenc.)</span>
                        </span>
                        <span className="font-mono text-[9px] text-slate-600">
                          <strong className="text-[#173f6b]">{comisariaData.turnos.tarde.baPct}%</strong> vs{' '}
                          <strong className="text-[#51769d]">{comisariaData.turnos.tarde.vmPct}%</strong>
                        </span>
                      </div>
                      <div className="h-4 bg-slate-200 rounded-md overflow-hidden flex border border-slate-300 shadow-inner">
                        <div
                          className="h-full bg-gradient-to-r from-[#173f6b] to-[#1e538d] flex items-center justify-end px-1.5 transition-all duration-500 hover:brightness-110"
                          style={{ width: `${Math.max(12, comisariaData.turnos.tarde.baPct)}%` }}
                          title={`Buenos Aires: ${comisariaData.turnos.tarde.ba} (${comisariaData.turnos.tarde.baPct}%)`}
                        >
                          <span className="text-white text-[9px] font-black font-mono drop-shadow-xs">
                            {comisariaData.turnos.tarde.ba}
                          </span>
                        </div>
                        <div
                          className="h-full bg-gradient-to-r from-[#5a83ab] to-[#6893bd] flex items-center justify-center px-1 transition-all duration-500 hover:brightness-110"
                          style={{ width: `${Math.max(10, comisariaData.turnos.tarde.vmPct)}%` }}
                          title={`Villa María: ${comisariaData.turnos.tarde.vm} (${comisariaData.turnos.tarde.vmPct}%)`}
                        >
                          <span className="text-white text-[9px] font-black font-mono drop-shadow-xs">
                            {comisariaData.turnos.tarde.vm}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* NOCHE */}
                    <div
                      className="group cursor-pointer hover:bg-white/70 p-1 rounded transition-colors"
                      onClick={() => onSelectTurno?.('NOCHE')}
                      title="Turno Noche: Clic para filtrar"
                    >
                      <div className="flex items-center justify-between text-[10px] font-bold mb-0.5">
                        <span className="text-slate-700 uppercase group-hover:text-blue-700 transition-colors">
                          Noche <span className="font-normal text-slate-400">({comisariaData.turnos.noche.total} atenc.)</span>
                        </span>
                        <span className="font-mono text-[9px] text-slate-600">
                          <strong className="text-[#173f6b]">{comisariaData.turnos.noche.baPct}%</strong> vs{' '}
                          <strong className="text-[#51769d]">{comisariaData.turnos.noche.vmPct}%</strong>
                        </span>
                      </div>
                      <div className="h-4 bg-slate-200 rounded-md overflow-hidden flex border border-slate-300 shadow-inner">
                        <div
                          className="h-full bg-gradient-to-r from-[#173f6b] to-[#1e538d] flex items-center justify-end px-1.5 transition-all duration-500 hover:brightness-110"
                          style={{ width: `${Math.max(12, comisariaData.turnos.noche.baPct)}%` }}
                          title={`Buenos Aires: ${comisariaData.turnos.noche.ba} (${comisariaData.turnos.noche.baPct}%)`}
                        >
                          <span className="text-white text-[9px] font-black font-mono drop-shadow-xs">
                            {comisariaData.turnos.noche.ba}
                          </span>
                        </div>
                        <div
                          className="h-full bg-gradient-to-r from-[#5a83ab] to-[#6893bd] flex items-center justify-center px-1 transition-all duration-500 hover:brightness-110"
                          style={{ width: `${Math.max(10, comisariaData.turnos.noche.vmPct)}%` }}
                          title={`Villa María: ${comisariaData.turnos.noche.vm} (${comisariaData.turnos.noche.vmPct}%)`}
                        >
                          <span className="text-white text-[9px] font-black font-mono drop-shadow-xs">
                            {comisariaData.turnos.noche.vm}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  /* Modo 2: Desglose por Comisaría (Distribución horaria interna) */
                  <div className="flex-1 flex flex-col justify-around py-1 gap-2 text-[10px]">
                    {/* CÍA BUENOS AIRES */}
                    <div className="bg-white p-1.5 rounded border border-slate-200">
                      <div className="flex justify-between items-center font-bold mb-1">
                        <span className="text-[#173f6b]">CIA BUENOS AIRES ({comisariaData.ba.toLocaleString()})</span>
                        <span className="text-[9px] font-mono text-slate-500">M / T / N</span>
                      </div>
                      <div className="h-3.5 bg-slate-100 rounded flex overflow-hidden border border-slate-200 font-mono text-[8px] text-white font-black">
                        <div
                          style={{ width: `${comisariaData.baTurnos.manana.pct}%` }}
                          className="bg-[#0369a1] flex items-center justify-center"
                          title={`Mañana: ${comisariaData.baTurnos.manana.count} (${comisariaData.baTurnos.manana.pct}%)`}
                        >
                          {comisariaData.baTurnos.manana.pct}%
                        </div>
                        <div
                          style={{ width: `${comisariaData.baTurnos.tarde.pct}%` }}
                          className="bg-[#173f6b] flex items-center justify-center"
                          title={`Tarde: ${comisariaData.baTurnos.tarde.count} (${comisariaData.baTurnos.tarde.pct}%)`}
                        >
                          {comisariaData.baTurnos.tarde.pct}%
                        </div>
                        <div
                          style={{ width: `${comisariaData.baTurnos.noche.pct}%` }}
                          className="bg-[#0f2e50] flex items-center justify-center"
                          title={`Noche: ${comisariaData.baTurnos.noche.count} (${comisariaData.baTurnos.noche.pct}%)`}
                        >
                          {comisariaData.baTurnos.noche.pct}%
                        </div>
                      </div>
                      <div className="flex justify-between text-[8px] text-slate-500 font-semibold mt-0.5">
                        <span>M: {comisariaData.baTurnos.manana.count}</span>
                        <span className="text-amber-700 font-bold">T (Pico): {comisariaData.baTurnos.tarde.count}</span>
                        <span>N: {comisariaData.baTurnos.noche.count}</span>
                      </div>
                    </div>

                    {/* CÍA VILLA MARIA */}
                    <div className="bg-white p-1.5 rounded border border-slate-200">
                      <div className="flex justify-between items-center font-bold mb-1">
                        <span className="text-[#40688f]">CIA VILLA MARIA ({comisariaData.vm.toLocaleString()})</span>
                        <span className="text-[9px] font-mono text-slate-500">M / T / N</span>
                      </div>
                      <div className="h-3.5 bg-slate-100 rounded flex overflow-hidden border border-slate-200 font-mono text-[8px] text-white font-black">
                        <div
                          style={{ width: `${comisariaData.vmTurnos.manana.pct}%` }}
                          className="bg-[#0284c7] flex items-center justify-center"
                          title={`Mañana: ${comisariaData.vmTurnos.manana.count} (${comisariaData.vmTurnos.manana.pct}%)`}
                        >
                          {comisariaData.vmTurnos.manana.pct}%
                        </div>
                        <div
                          style={{ width: `${comisariaData.vmTurnos.tarde.pct}%` }}
                          className="bg-[#6893bd] flex items-center justify-center"
                          title={`Tarde: ${comisariaData.vmTurnos.tarde.count} (${comisariaData.vmTurnos.tarde.pct}%)`}
                        >
                          {comisariaData.vmTurnos.tarde.pct}%
                        </div>
                        <div
                          style={{ width: `${comisariaData.vmTurnos.noche.pct}%` }}
                          className="bg-[#335677] flex items-center justify-center"
                          title={`Noche: ${comisariaData.vmTurnos.noche.count} (${comisariaData.vmTurnos.noche.pct}%)`}
                        >
                          {comisariaData.vmTurnos.noche.pct}%
                        </div>
                      </div>
                      <div className="flex justify-between text-[8px] text-slate-500 font-semibold mt-0.5">
                        <span>M: {comisariaData.vmTurnos.manana.count}</span>
                        <span className="text-amber-700 font-bold">T (Pico): {comisariaData.vmTurnos.tarde.count}</span>
                        <span>N: {comisariaData.vmTurnos.noche.count}</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Micro indicador inferior */}
                <div className="pt-1 border-t border-slate-200 text-[9px] text-slate-600 flex items-center justify-between font-medium">
                  <span className="truncate">Mayor presión: <strong>Turno Tarde ({comisariaData.turnos.tarde.total})</strong></span>
                  <span className="font-mono text-[#173f6b] font-bold shrink-0">Ratio: {comisariaData.ratio}:1</span>
                </div>
              </div>
            </div>

            {/* Pie inferior informativo del bloque */}
            <div className="text-[10px] text-slate-600 font-medium border-t border-slate-200 pt-1.5 flex items-center justify-between px-0.5">
              <span className="flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                <span>Jurisdicción predominante: <strong className="text-slate-800">Cía Buenos Aires ({comisariaData.baPct}%)</strong></span>
              </span>
              <span className="text-[9px] text-slate-500">Total: <strong className="text-slate-800 font-mono">{comisariaData.total.toLocaleString()}</strong> atenciones</span>
            </div>
          </div>

          {/* Chart 2: Atenciones por Turno (Guardias Horarias) */}
          <div className="lg:col-span-6 bg-white rounded-lg border-2 border-slate-300 shadow-md p-3 flex flex-col justify-between overflow-hidden">
            <EditableHeading
              value={titles?.comparativoTurno || 'COMPARATIVO POR TURNO / HORARIO'}
              onSave={(val) => onUpdateTitle?.('comparativoTurno', val)}
              subtitle={titles?.comparativoTurnoSub || 'repartición horaria 24 horas continuas'}
              onSaveSubtitle={(val) => onUpdateTitle?.('comparativoTurnoSub', val)}
            />

            <div className="flex-1 flex flex-col justify-around py-2 gap-2">
              {/* MAÑANA */}
              <div
                className="flex items-center gap-2 cursor-pointer group"
                onClick={() => onSelectTurno?.('MAÑANA')}
              >
                <div className="w-16 flex flex-col items-end shrink-0">
                  <span className="text-xs font-black text-[#1b4b7c] uppercase group-hover:text-blue-600 transition-colors">
                    MAÑANA
                  </span>
                  <span className="text-[9px] text-slate-500 font-bold">
                    {((turnoData.manana / (turnoData.total || 1)) * 100).toFixed(1)}%
                  </span>
                </div>
                <div className="flex-1 h-7 bg-slate-100 rounded-full overflow-hidden p-0.5 shadow-inner relative flex items-center border border-slate-300">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-[#0369a1] via-[#0284c7] to-[#38bdf8] shadow-sm flex items-center justify-end px-3 transition-all duration-500"
                    style={{ width: `${Math.max(16, Math.min(100, (turnoData.manana / turnoData.maxTurno) * 98))}%` }}
                  >
                    <span className="text-white text-xs font-black drop-shadow font-mono">{turnoData.manana.toLocaleString()}</span>
                  </div>
                </div>
              </div>

              {/* TARDE */}
              <div
                className="flex items-center gap-2 cursor-pointer group"
                onClick={() => onSelectTurno?.('TARDE')}
              >
                <div className="w-16 flex flex-col items-end shrink-0">
                  <span className="text-xs font-black text-[#1b4b7c] uppercase group-hover:text-blue-600 transition-colors">
                    TARDE
                  </span>
                  <span className="text-[9px] text-amber-700 font-black">
                    {((turnoData.tarde / (turnoData.total || 1)) * 100).toFixed(1)}% (Pico)
                  </span>
                </div>
                <div className="flex-1 h-7 bg-slate-100 rounded-full overflow-hidden p-0.5 shadow-inner relative flex items-center border border-slate-300">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-[#075985] via-[#0284c7] to-[#60a5fa] shadow-sm flex items-center justify-end px-3 transition-all duration-500"
                    style={{ width: `${Math.max(16, Math.min(100, (turnoData.tarde / turnoData.maxTurno) * 98))}%` }}
                  >
                    <span className="text-white text-xs font-black drop-shadow font-mono">{turnoData.tarde.toLocaleString()}</span>
                  </div>
                </div>
              </div>

              {/* NOCHE */}
              <div
                className="flex items-center gap-2 cursor-pointer group"
                onClick={() => onSelectTurno?.('NOCHE')}
              >
                <div className="w-16 flex flex-col items-end shrink-0">
                  <span className="text-xs font-black text-[#1b4b7c] uppercase group-hover:text-blue-600 transition-colors">
                    NOCHE
                  </span>
                  <span className="text-[9px] text-slate-500 font-bold">
                    {((turnoData.noche / (turnoData.total || 1)) * 100).toFixed(1)}%
                  </span>
                </div>
                <div className="flex-1 h-7 bg-slate-100 rounded-full overflow-hidden p-0.5 shadow-inner relative flex items-center border border-slate-300">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-[#0c4a6e] via-[#0369a1] to-[#38bdf8] shadow-sm flex items-center justify-end px-3 transition-all duration-500"
                    style={{ width: `${Math.max(16, Math.min(100, (turnoData.noche / turnoData.maxTurno) * 98))}%` }}
                  >
                    <span className="text-white text-xs font-black drop-shadow font-mono">{turnoData.noche.toLocaleString()}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="text-[10px] text-center text-slate-600 font-semibold border-t border-slate-200 pt-1 flex items-center justify-between">
              <span>Guardia 1: 06:00 - 14:00</span>
              <span className="font-bold text-amber-800">Guardia 2 (Pico): 14:00 - 22:00</span>
              <span>Guardia 3: 22:00 - 06:00</span>
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* CATEGORÍA 2: DIMENSIÓN GEOGRÁFICA Y TERRITORIAL                            */}
      {/* ========================================================================= */}
      <div className="flex flex-col gap-2.5">
        <div className="bg-gradient-to-r from-[#071f3a] via-[#0b2b52] to-[#0f3a6e] text-white px-3 py-1.5 rounded-lg border border-cyan-800 shadow-sm flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-1 rounded bg-cyan-900/60 text-cyan-300">
              <Compass className="w-3.5 h-3.5" />
            </div>
            <div>
              <EditableHeading
                value={titles?.cat2Title || '2. DIMENSIÓN GEOGRÁFICA Y TERRITORIAL'}
                onSave={(val) => onUpdateTitle?.('cat2Title', val)}
                subtitle={titles?.cat2Sub || '• 16 Subsectores Oficiales y 3 Zonas Distritales (Centro, Norte, Sur)'}
                onSaveSubtitle={(val) => onUpdateTitle?.('cat2Sub', val)}
                badgeStyle={false}
                className="text-xs font-black tracking-wider uppercase text-white"
              />
            </div>
          </div>
          <span className="text-[10px] font-mono font-bold bg-cyan-950/80 px-2 py-0.5 rounded text-cyan-300 border border-cyan-700/50">
            16 Cuadrantes PNP / Serenazgo
          </span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-3.5">
          {/* Chart 3: Mayor Atenciones por Zona / Subsector (Analytical Horizontal Bars or Mountain) */}
          <div className="lg:col-span-8 bg-white rounded-lg border-2 border-slate-300 shadow-md p-2.5 flex flex-col justify-between overflow-hidden">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 pb-1.5 border-b border-slate-200">
              <EditableHeading
                value={titles?.zona || 'MAYOR ATENCIONES POR ZONA / SUBSECTOR'}
                onSave={(val) => onUpdateTitle?.('zona', val)}
                subtitle={titles?.zonaSub || '16 subsectores oficiales ordenados por frecuencia'}
                onSaveSubtitle={(val) => onUpdateTitle?.('zonaSub', val)}
              />

              <div className="flex items-center gap-1.5 shrink-0">
                {/* Sort Toggle */}
                {subsectorViewMode === 'BARS' && (
                  <button
                    type="button"
                    onClick={() => setSubsectorSortBy((p) => (p === 'COUNT' ? 'CODE' : 'COUNT'))}
                    className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 flex items-center gap-1 transition-colors"
                    title={subsectorSortBy === 'COUNT' ? 'Ordenado de mayor a menor frecuencia' : 'Ordenado por código de cuadrante'}
                  >
                    <ArrowUpDown className="w-3 h-3 text-blue-700" />
                    <span>{subsectorSortBy === 'COUNT' ? 'Por Frecuencia' : 'Por Código'}</span>
                  </button>
                )}

                {/* View Mode Toggle: Analytical Bars vs Mountain Silhouette */}
                <div className="flex items-center bg-slate-100 p-0.5 rounded border border-slate-300">
                  <button
                    type="button"
                    onClick={() => setSubsectorViewMode('BARS')}
                    className={`px-2 py-0.5 text-[10px] font-bold rounded flex items-center gap-1 transition-all ${
                      subsectorViewMode === 'BARS'
                        ? 'bg-[#124270] text-white shadow-xs'
                        : 'text-slate-600 hover:bg-slate-200'
                    }`}
                    title="Ver gráfico de barras horizontales analíticas"
                  >
                    <BarChart2 className="w-3 h-3" />
                    <span className="hidden sm:inline">Barras Analíticas</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setSubsectorViewMode('MOUNTAIN')}
                    className={`px-2 py-0.5 text-[10px] font-bold rounded flex items-center gap-1 transition-all ${
                      subsectorViewMode === 'MOUNTAIN'
                        ? 'bg-[#124270] text-white shadow-xs'
                        : 'text-slate-600 hover:bg-slate-200'
                    }`}
                    title="Ver silueta de picos montañosos"
                  >
                    <TrendingUp className="w-3 h-3" />
                    <span className="hidden sm:inline">Silueta Picos</span>
                  </button>
                </div>
              </div>
            </div>

            {/* View 1: Analytical Horizontal Bars (Enlarged, Aesthetic, Clean and Proportional) */}
            {subsectorViewMode === 'BARS' ? (
              <div className="flex-1 w-full flex flex-col gap-1.5 py-2 min-h-[380px] max-h-[460px] overflow-y-auto pr-1">
                {sortedSubsectorItems.map((item, idx) => {
                  const pct = Math.max(5, Math.min(100, (item.count / subsectorData.maxVal) * 100));
                  const shareOfTotal = ((item.count / (records.length || 1)) * 100).toFixed(1);

                  // Institutional Serenazgo Chromatic Gradient (Intensity scale)
                  let barGradient = 'from-[#082f49] via-[#0369a1] to-[#0284c7]';
                  if (idx === 0) {
                    barGradient = 'from-[#03284d] via-[#0284c7] to-[#38bdf8]';
                  } else if (idx < 4) {
                    barGradient = 'from-[#0c4a6e] via-[#0284c7] to-[#38bdf8]';
                  } else if (idx < 10) {
                    barGradient = 'from-[#075985] via-[#0284c7] to-[#7dd3fc]';
                  } else {
                    barGradient = 'from-[#475569] via-[#64748b] to-[#94a3b8]';
                  }

                  return (
                    <div
                      key={item.code}
                      onClick={() => onSelectSubsector?.(item.code)}
                      className="group flex items-center gap-2 p-1.5 rounded-lg hover:bg-blue-50/90 transition-all cursor-pointer border border-transparent hover:border-blue-200 hover:shadow-xs"
                      title={`${item.code}: ${item.name} (${item.count.toLocaleString()} atenciones - ${shareOfTotal}%)`}
                    >
                      {/* Code Pill */}
                      <span
                        className={`w-14 text-center text-[10.5px] font-black font-mono py-0.5 rounded shrink-0 border shadow-xs ${
                          item.isVM
                            ? 'bg-teal-50 text-teal-800 border-teal-300'
                            : 'bg-blue-50 text-blue-900 border-blue-300'
                        }`}
                      >
                        {item.code}
                      </span>

                      {/* Name */}
                      <span className="w-44 sm:w-52 text-xs font-bold text-slate-800 truncate group-hover:text-blue-950 shrink-0">
                        {item.name}
                      </span>

                      {/* Horizontal Bar (Enlarged) */}
                      <div className="flex-1 h-6 bg-slate-100 rounded-md overflow-hidden p-0.5 border border-slate-200 relative flex items-center shadow-inner">
                        <div
                          className={`h-full rounded bg-gradient-to-r ${barGradient} transition-all duration-500 shadow-sm relative`}
                          style={{ width: `${pct}%` }}
                        >
                          <div className="absolute inset-x-0 top-0 h-[1px] bg-white/40 rounded-t" />
                        </div>
                      </div>

                      {/* Exact Count and Share */}
                      <div className="w-28 flex items-center justify-end gap-2 shrink-0 text-right">
                        <span className="text-xs sm:text-[13px] font-black font-mono text-slate-900">
                          {item.count.toLocaleString()}
                        </span>
                        <span className="text-[10px] font-bold text-slate-500 font-mono bg-slate-100 px-1.5 py-0.2 rounded border border-slate-200">
                          {shareOfTotal}%
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              /* View 2: Mountain Silhouette with Glowing Peaks (Enlarged) */
              <div className="flex-1 w-full h-56 sm:h-64 relative flex flex-col justify-end pt-2 overflow-hidden">
                <svg viewBox="0 0 760 210" className="w-full h-full" preserveAspectRatio="none">
                  <defs>
                    <linearGradient id="mountainGradVibrant" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#0284c7" stopOpacity="0.95" />
                      <stop offset="45%" stopColor="#0e3a68" stopOpacity="0.9" />
                      <stop offset="100%" stopColor="#071b34" stopOpacity="0.98" />
                    </linearGradient>
                    <filter id="glowPeak" x="-30%" y="-30%" width="160%" height="160%">
                      <feGaussianBlur stdDeviation="2" result="blur" />
                      <feComposite in="SourceGraphic" in2="blur" operator="over" />
                    </filter>
                  </defs>

                  {(() => {
                    const count = subsectorData.items.length;
                    const padX = 30;
                    const usableW = 760 - padX * 2;
                    const step = usableW / Math.max(1, count - 1);
                    let pathD = `M ${padX},170 `;
                    subsectorData.items.forEach((item, idx) => {
                      const x = padX + idx * step;
                      const y = 170 - (item.count / subsectorData.maxVal) * 125;
                      pathD += `L ${x},${y} `;
                    });
                    pathD += `L ${padX + usableW},170 Z`;

                    return <path d={pathD} fill="url(#mountainGradVibrant)" stroke="#38bdf8" strokeWidth="2.5" />;
                  })()}

                  {subsectorData.items.map((item, idx) => {
                    const count = subsectorData.items.length;
                    const padX = 30;
                    const usableW = 760 - padX * 2;
                    const step = usableW / Math.max(1, count - 1);
                    const x = padX + idx * step;
                    const y = 170 - (item.count / subsectorData.maxVal) * 125;
                    return (
                      <g
                        key={item.code}
                        className="cursor-pointer group"
                        onClick={() => onSelectSubsector?.(item.code)}
                      >
                        <circle
                          cx={x}
                          cy={y}
                          r="5"
                          fill="#38bdf8"
                          stroke="#ffffff"
                          strokeWidth="2"
                          className="group-hover:scale-150 transition-transform shadow-md"
                          filter="url(#glowPeak)"
                        />
                        <text
                          x={x}
                          y={y - 9}
                          textAnchor="middle"
                          className="fill-slate-900 text-[10px] sm:text-[11px] font-black group-hover:fill-blue-700 transition-colors drop-shadow-[0_1px_2px_rgba(255,255,255,0.9)]"
                        >
                          {item.count}
                        </text>
                      </g>
                    );
                  })}
                </svg>

                <div className="flex items-center justify-between text-[8.5px] sm:text-[9.5px] font-black text-slate-800 text-center uppercase tracking-tight border-t border-slate-300 pt-2 px-1 overflow-x-auto scrollbar-none gap-0.5">
                  {subsectorData.items.map((item) => (
                    <span
                      key={item.code}
                      onClick={() => onSelectSubsector?.(item.code)}
                      className={`cursor-pointer px-1.5 py-0.5 rounded transition-colors truncate ${
                        item.isVM
                          ? 'text-teal-800 hover:text-teal-950 hover:bg-teal-100 font-black'
                          : 'text-blue-900 hover:text-blue-950 hover:bg-blue-100'
                      }`}
                      title={`${item.code}: ${item.name} (${item.count.toLocaleString()} atenciones)`}
                    >
                      {item.code}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Chart 4: Atenciones por Sector (3 Iconic Calibrated Laboratory Glass Beakers) */}
          <div className="lg:col-span-4 bg-white rounded-lg border-2 border-slate-300 shadow-md p-3 flex flex-col justify-between overflow-hidden">
            <EditableHeading
              value={titles?.sector || 'ATENCIONES POR SECTOR'}
              onSave={(val) => onUpdateTitle?.('sector', val)}
              subtitle={titles?.sectorSub || 'tubos volumétricos calibrados'}
              onSaveSubtitle={(val) => onUpdateTitle?.('sectorSub', val)}
            />

            {/* Quick Distribution Summary Bar - fills top and gives immediate clarity */}
            <div className="mt-1.5 mb-2 bg-slate-50/90 rounded-lg p-2 border border-slate-200 flex flex-col gap-1.5 shadow-xs">
              <div className="flex items-center justify-between text-[10px]">
                <span className="text-slate-600 uppercase font-black text-[9px] tracking-wider flex items-center gap-1">
                  <Compass className="w-3 h-3 text-blue-700" />
                  Distribución Territorial
                </span>
                <span className="font-mono text-slate-700 font-bold text-[9.5px]">
                  Total: <strong className="font-black text-slate-900">{sectorData.total.toLocaleString()}</strong> atenciones
                </span>
              </div>

              {/* Segmented Proportional Distribution Bar */}
              <div className="w-full h-2 rounded-full overflow-hidden flex bg-slate-200 shadow-inner">
                <div
                  style={{ width: `${sectorData.centroShare}%` }}
                  className="bg-gradient-to-r from-blue-700 to-cyan-500 transition-all duration-500"
                  title={`Centro: ${sectorData.centroShare}%`}
                />
                <div
                  style={{ width: `${sectorData.norteShare}%` }}
                  className="bg-gradient-to-r from-teal-600 to-emerald-400 transition-all duration-500"
                  title={`Norte: ${sectorData.norteShare}%`}
                />
                <div
                  style={{ width: `${sectorData.surShare}%` }}
                  className="bg-gradient-to-r from-amber-600 to-yellow-400 transition-all duration-500"
                  title={`Sur: ${sectorData.surShare}%`}
                />
              </div>

              {/* Sector Quick Badges */}
              <div className="grid grid-cols-3 gap-1 pt-0.5 text-center">
                <button
                  type="button"
                  onClick={() => onSelectZona?.('ZONA CENTRO')}
                  className="py-0.5 px-1 rounded bg-blue-50/80 border border-blue-200 text-blue-950 hover:bg-blue-100 transition-colors shadow-2xs"
                  title="Filtrar por Zona Centro"
                >
                  <span className="block font-black text-[8px] uppercase tracking-tight text-blue-900">CENTRO</span>
                  <span className="font-mono font-black text-[10px] text-blue-800">{sectorData.centroShare}%</span>
                </button>
                <button
                  type="button"
                  onClick={() => onSelectZona?.('ZONA NORTE')}
                  className="py-0.5 px-1 rounded bg-teal-50/80 border border-teal-200 text-teal-950 hover:bg-teal-100 transition-colors shadow-2xs"
                  title="Filtrar por Zona Norte"
                >
                  <span className="block font-black text-[8px] uppercase tracking-tight text-teal-900">NORTE</span>
                  <span className="font-mono font-black text-[10px] text-teal-800">{sectorData.norteShare}%</span>
                </button>
                <button
                  type="button"
                  onClick={() => onSelectZona?.('ZONA SUR')}
                  className="py-0.5 px-1 rounded bg-amber-50/80 border border-amber-200 text-amber-950 hover:bg-amber-100 transition-colors shadow-2xs"
                  title="Filtrar por Zona Sur"
                >
                  <span className="block font-black text-[8px] uppercase tracking-tight text-amber-900">SUR</span>
                  <span className="font-mono font-black text-[10px] text-amber-800">{sectorData.surShare}%</span>
                </button>
              </div>
            </div>

            {/* Centered Calibrated Beakers with Balanced Vertical Fill */}
            <div className="flex-1 flex items-center justify-around px-1 sm:px-2 py-1 gap-1.5 sm:gap-2 overflow-hidden">
              <ArtisticBeaker
                label="ZONA CENTRO"
                count={sectorData.centro}
                share={sectorData.centroShare}
                fillPct={sectorData.centroPct}
                isSelected={false}
                onClick={() => onSelectZona?.('ZONA CENTRO')}
              />
              <ArtisticBeaker
                label="ZONA NORTE"
                count={sectorData.norte}
                share={sectorData.norteShare}
                fillPct={sectorData.nortePct}
                isSelected={false}
                onClick={() => onSelectZona?.('ZONA NORTE')}
              />
              <ArtisticBeaker
                label="ZONA SUR"
                count={sectorData.sur}
                share={sectorData.surShare}
                fillPct={sectorData.surPct}
                isSelected={false}
                onClick={() => onSelectZona?.('ZONA SUR')}
              />
            </div>

            <div className="text-[10px] text-center text-slate-500 font-semibold border-t border-slate-200 pt-1.5 flex items-center justify-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-blue-700 shrink-0" />
              <span>Zona Centro concentra el {sectorData.centroShare}% de las intervenciones</span>
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* CATEGORÍA 3: DIMENSIÓN TEMPORAL Y EVOLUCIÓN HISTÓRICA                     */}
      {/* ========================================================================= */}
      <div className="flex flex-col gap-2.5">
        <div className="bg-gradient-to-r from-[#071f3a] via-[#0b2b52] to-[#0f3a6e] text-white px-3 py-1.5 rounded-lg border border-cyan-800 shadow-sm flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-1 rounded bg-cyan-900/60 text-cyan-300">
              <Calendar className="w-3.5 h-3.5" />
            </div>
            <div>
              <EditableHeading
                value={titles?.cat3Title || '3. DIMENSIÓN TEMPORAL Y EVOLUCIÓN ANUAL'}
                onSave={(val) => onUpdateTitle?.('cat3Title', val)}
                subtitle={titles?.cat3Sub || '• Frecuencia Semanal y Comparativo Histórico Mes por Mes (2025 vs 2026)'}
                onSaveSubtitle={(val) => onUpdateTitle?.('cat3Sub', val)}
                badgeStyle={false}
                className="text-xs font-black tracking-wider uppercase text-white"
              />
            </div>
          </div>
          <span className="text-[10px] font-mono font-bold bg-cyan-950/80 px-2 py-0.5 rounded text-cyan-300 border border-cyan-700/50">
            Comparativo 2 Años
          </span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3.5 items-stretch">
          {/* Chart 6: Comparativo Mes por Mes (FORMATO VERTICAL, COMPACTO Y ESTILIZADO) */}
          <div className="bg-white rounded-lg border-2 border-slate-300 shadow-md p-3 sm:p-4 flex flex-col justify-between overflow-hidden">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-slate-200">
              <EditableHeading
                value={titles?.comparativoMes || 'COMPARATIVO MES POR MES (AÑOS 2025 - 2026)'}
                onSave={(val) => onUpdateTitle?.('comparativoMes', val)}
                subtitle={titles?.comparativoMesSub || (excludeSetiembre ? 'Meses evaluados (Setiembre excluido del comparativo)' : 'Lectura comparativa completa Enero - Diciembre')}
                onSaveSubtitle={(val) => onUpdateTitle?.('comparativoMesSub', val)}
              />

              <div className="flex items-center gap-1.5 flex-wrap shrink-0">
                {/* Selector de Orientación: Filas Verticales vs Columnas vs Líneas */}
                <div className="flex items-center bg-slate-100 p-0.5 rounded border border-slate-300 shadow-2xs">
                  <button
                    type="button"
                    onClick={() => setComparativoChartType('ROWS')}
                    className={`px-2 py-1 text-xs font-bold rounded flex items-center gap-1 transition-all ${
                      comparativoChartType === 'ROWS'
                        ? 'bg-[#124270] text-white shadow-xs'
                        : 'text-slate-600 hover:bg-slate-200'
                    }`}
                    title="Orientación vertical compacta para lectura rápida"
                  >
                    <List className="w-3.5 h-3.5" />
                    <span>Filas</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setComparativoChartType('COLUMNS')}
                    className={`px-2 py-1 text-xs font-bold rounded flex items-center gap-1 transition-all ${
                      comparativoChartType === 'COLUMNS'
                        ? 'bg-[#124270] text-white shadow-xs'
                        : 'text-slate-600 hover:bg-slate-200'
                    }`}
                    title="Columnas compactas"
                  >
                    <BarChart2 className="w-3.5 h-3.5" />
                    <span>Columnas</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setComparativoChartType('LINES')}
                    className={`px-2 py-1 text-xs font-bold rounded flex items-center gap-1 transition-all ${
                      comparativoChartType === 'LINES'
                        ? 'bg-[#124270] text-white shadow-xs'
                        : 'text-slate-600 hover:bg-slate-200'
                    }`}
                    title="Líneas analíticas"
                  >
                    <LineChart className="w-3.5 h-3.5" />
                    <span>Líneas</span>
                  </button>
                </div>

                <button
                  type="button"
                  id="btn-toggle-setiembre"
                  onClick={() => setExcludeSetiembre((prev) => !prev)}
                  className={`text-xs font-bold px-2 py-1 rounded transition-all flex items-center gap-1 border shadow-xs ${
                    excludeSetiembre
                      ? 'bg-amber-100 text-amber-900 border-amber-300 hover:bg-amber-200'
                      : 'bg-slate-100 text-slate-700 border-slate-300 hover:bg-slate-200'
                  }`}
                  title={excludeSetiembre ? 'Setiembre está fuera del gráfico comparativo. Haz clic para incluirlo.' : 'Haz clic para sacar Setiembre del gráfico'}
                >
                  {excludeSetiembre ? (
                    <>
                      <CheckCircle2 className="w-3.5 h-3.5 text-amber-700" />
                      <span>Set. Excluido</span>
                    </>
                  ) : (
                    <span>Sacar Set.</span>
                  )}
                </button>

                <button
                  type="button"
                  id="btn-extraer-comparativo-setiembre"
                  onClick={() => setShowSetiembreModal(true)}
                  className="text-xs font-black uppercase px-2.5 py-1 rounded bg-gradient-to-r from-[#124270] to-[#1a5a94] hover:from-[#0d3459] hover:to-[#124270] text-white shadow-xs flex items-center gap-1 transition-all"
                  title="Extraer ficha completa del comparativo de Setiembre"
                >
                  <BarChart3 className="w-3.5 h-3.5 text-cyan-300" />
                  <span>Ficha</span>
                </button>
              </div>
            </div>

            {/* Resumen Compacto de Cifras Mensuales (Banda Estilizada Dinámica para 12 Meses) */}
            <div className="w-full my-2 rounded-lg overflow-hidden border border-blue-900/40 shadow-2xs">
              <div
                className="bg-[#0b2b52] text-white text-center divide-x divide-blue-800/60 py-1 px-0.5"
                style={{
                  display: 'grid',
                  gridTemplateColumns: `repeat(${monthlyData.length}, minmax(0, 1fr))`,
                }}
              >
                {monthlyData.map((m) => (
                  <div
                    key={`num-${m.mesFull}`}
                    onClick={() => onSelectMes?.(selectedMes === m.mesFull ? null : m.mesFull)}
                    className="cursor-pointer hover:bg-blue-800/80 transition-colors py-0.5 px-0.5"
                    title={`Año 2026: ${m.val2026.toLocaleString()} incidencias en ${m.mesFull}`}
                  >
                    <span className="block text-[10px] sm:text-[11px] font-black font-mono tracking-tight text-cyan-100 truncate">
                      {m.val2026.toLocaleString()}
                    </span>
                  </div>
                ))}
              </div>
              <div
                className="bg-slate-50 text-slate-800 text-center divide-x divide-slate-200 py-0.5 px-0.5 border-t border-slate-300"
                style={{
                  display: 'grid',
                  gridTemplateColumns: `repeat(${monthlyData.length}, minmax(0, 1fr))`,
                }}
              >
                {monthlyData.map((m) => (
                  <div
                    key={`lbl-${m.mesFull}`}
                    onClick={() => onSelectMes?.(selectedMes === m.mesFull ? null : m.mesFull)}
                    className={`cursor-pointer hover:bg-blue-100 transition-colors py-0.5 px-0.5 ${
                      selectedMes === m.mesFull ? 'bg-blue-200/90 font-black' : ''
                    }`}
                  >
                    <span className="block text-[8.5px] sm:text-[9.5px] font-bold uppercase text-slate-700 tracking-tight truncate">
                      {m.mes}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Chart Body: Filas Verticales (Lectura Rápida) OR Columnas Compactas OR Líneas */}
            {(() => {
              const maxMonthlyVal = Math.max(...monthlyData.flatMap((m) => [m.val2025, m.val2026]), 4600);
              const yAxisMax = Math.ceil(maxMonthlyVal / 500) * 500; // e.g. 5000

              if (comparativoChartType === 'ROWS') {
                // Modo Vertical por Filas: Altamente estilizado, lectura rápida y sin ocupar todo el ancho
                return (
                  <div className="flex-1 w-full flex flex-col justify-between gap-1 sm:gap-1.5 py-1 min-h-[300px] max-h-[440px] overflow-y-auto pr-1">
                    {monthlyData.map((m) => {
                      const isSelected = selectedMes === m.mesFull;
                      const isPending = m.val2026 === 0;
                      const diff = m.val2026 - m.val2025;
                      const pctDiff = m.val2025 > 0 ? Math.round((diff / m.val2025) * 100) : 0;
                      const w2026 = isPending ? 3 : Math.max(8, Math.min(100, (m.val2026 / yAxisMax) * 100));
                      const w2025 = Math.max(8, Math.min(100, (m.val2025 / yAxisMax) * 100));

                      return (
                        <div
                          key={m.mesFull}
                          onClick={() => onSelectMes?.(isSelected ? null : m.mesFull)}
                          className={`flex items-center gap-1.5 sm:gap-2 px-2 py-0.5 sm:py-1 rounded-md border transition-all cursor-pointer ${
                            isSelected
                              ? 'bg-blue-50/90 border-blue-500 shadow-xs ring-1 ring-blue-500'
                              : 'bg-white hover:bg-slate-50 border-slate-200'
                          }`}
                          title={`${m.mesFull}: 2026 = ${isPending ? 'Pendiente' : m.val2026.toLocaleString()} | 2025 = ${m.val2025.toLocaleString()}${isPending ? '' : ` (Variación: ${pctDiff > 0 ? '+' : ''}${pctDiff}%)`}`}
                        >
                          {/* Badge de Mes */}
                          <span
                            className={`w-9 text-center font-black text-[10.5px] uppercase py-0.5 rounded shrink-0 select-none ${
                              isSelected ? 'bg-[#0f3460] text-white' : 'bg-slate-100 text-slate-800'
                            }`}
                          >
                            {m.mes}
                          </span>

                          {/* Barras Horizontales Dobles */}
                          <div className="flex-1 flex flex-col gap-0.5 min-w-0">
                            {/* 2026 (Serenazgo) */}
                            <div className="flex items-center gap-1.5">
                              <div className="flex-1 bg-slate-100 rounded-full h-2.5 overflow-hidden">
                                <div
                                  className={`${isPending ? 'bg-slate-300' : 'bg-gradient-to-r from-[#062446] via-[#03518a] to-[#0284c7]'} h-full rounded-full transition-all duration-300`}
                                  style={{ width: `${w2026}%` }}
                                />
                              </div>
                              <span className={`text-[10.5px] font-black font-mono ${isPending ? 'text-slate-400' : 'text-blue-900'} w-11 text-right shrink-0`}>
                                {isPending ? '-' : m.val2026.toLocaleString()}
                              </span>
                            </div>

                            {/* 2025 (Histórico) */}
                            <div className="flex items-center gap-1.5">
                              <div className="flex-1 bg-slate-100 rounded-full h-2 overflow-hidden">
                                <div
                                  className="bg-gradient-to-r from-[#475569] via-[#64748b] to-[#94a3b8] h-full rounded-full transition-all duration-300"
                                  style={{ width: `${w2025}%` }}
                                />
                              </div>
                              <span className="text-[10px] font-bold font-mono text-slate-600 w-11 text-right shrink-0">
                                {m.val2025.toLocaleString()}
                              </span>
                            </div>
                          </div>

                          {/* Badge de Variación (%) */}
                          {isPending ? (
                            <span className="text-[8.5px] font-bold text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded-full shrink-0 select-none border border-slate-200">
                              Pend.
                            </span>
                          ) : (
                            <span
                              className={`text-[9.5px] font-black font-mono px-1.5 py-0.5 rounded-full shrink-0 select-none ${
                                pctDiff >= 0
                                  ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                                  : 'bg-rose-100 text-rose-800 border border-rose-300'
                              }`}
                            >
                              {pctDiff >= 0 ? `+${pctDiff}%` : `${pctDiff}%`}
                            </span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                );
              }

              if (comparativoChartType === 'LINES') {
                // Gráfico de Líneas Limpio y Compacto
                const padX = 35;
                const padY = 25;
                const svgW = 600;
                const svgH = 240;
                const usableW = svgW - padX * 2;
                const usableH = svgH - padY * 2;
                const step = usableW / Math.max(1, monthlyData.length - 1);

                const pts2026 = monthlyData.map((m, idx) => ({
                  x: padX + idx * step,
                  y: padY + usableH - (m.val2026 / yAxisMax) * usableH,
                  val: m.val2026,
                  mes: m.mes,
                  mesFull: m.mesFull,
                }));

                const pts2025 = monthlyData.map((m, idx) => ({
                  x: padX + idx * step,
                  y: padY + usableH - (m.val2025 / yAxisMax) * usableH,
                  val: m.val2025,
                  mes: m.mes,
                  mesFull: m.mesFull,
                }));

                const path2026 = pts2026.reduce((acc, p, i) => `${acc} ${i === 0 ? 'M' : 'L'} ${p.x},${p.y}`, '');
                const path2025 = pts2025.reduce((acc, p, i) => `${acc} ${i === 0 ? 'M' : 'L'} ${p.x},${p.y}`, '');

                return (
                  <div className="flex-1 w-full h-56 sm:h-64 relative flex items-center justify-center p-2 bg-gradient-to-b from-slate-50/60 to-white rounded-lg border border-slate-200">
                    <svg viewBox={`0 0 ${svgW} ${svgH}`} className="w-full h-full" preserveAspectRatio="none">
                      <defs>
                        <linearGradient id="area2026Compact" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#0284c7" stopOpacity="0.3" />
                          <stop offset="100%" stopColor="#0284c7" stopOpacity="0.0" />
                        </linearGradient>
                      </defs>

                      {/* Guías de cuadrícula */}
                      {[0, 0.25, 0.5, 0.75, 1].map((ratio) => {
                        const y = padY + usableH * ratio;
                        const labelVal = Math.round(yAxisMax * (1 - ratio));
                        return (
                          <g key={ratio}>
                            <line x1={padX} y1={y} x2={svgW - padX} y2={y} stroke="#cbd5e1" strokeDasharray="3 3" />
                            <text x={padX - 6} y={y + 3.5} textAnchor="end" className="text-[9px] fill-slate-500 font-mono">
                              {labelVal}
                            </text>
                          </g>
                        );
                      })}

                      {/* Área y Línea 2026 */}
                      <path
                        d={`${path2026} L ${pts2026[pts2026.length - 1].x},${padY + usableH} L ${pts2026[0].x},${padY + usableH} Z`}
                        fill="url(#area2026Compact)"
                      />
                      <path d={path2025} fill="none" stroke="#64748b" strokeWidth="2.5" strokeDasharray="4 4" />
                      <path d={path2026} fill="none" stroke="#0284c7" strokeWidth="3" />

                      {/* Marcadores 2025 */}
                      {pts2025.map((p) => (
                        <circle key={`pt25-${p.mes}`} cx={p.x} cy={p.y} r="3" fill="#64748b" stroke="#ffffff" strokeWidth="1" />
                      ))}

                      {/* Marcadores 2026 */}
                      {pts2026.map((p) => {
                        const isSelected = selectedMes === p.mesFull;
                        return (
                          <g key={`pt26-${p.mes}`} onClick={() => onSelectMes?.(isSelected ? null : p.mesFull)} className="cursor-pointer">
                            <circle cx={p.x} cy={p.y} r={isSelected ? 6 : 4} fill="#024a87" stroke="#38bdf8" strokeWidth="2" />
                            <text x={p.x} y={p.y - 7} textAnchor="middle" className="text-[9.5px] font-black fill-[#0b2b52] font-mono">
                              {p.val}
                            </text>
                            <text x={p.x} y={padY + usableH + 14} textAnchor="middle" className="text-[9px] font-bold fill-slate-600 uppercase">
                              {p.mes}
                            </text>
                          </g>
                        );
                      })}
                    </svg>
                  </div>
                );
              }

              // Columnas Compactas (Orientación vertical y estilizada sin ensanchamiento)
              return (
                <div className="flex-1 h-56 sm:h-64 w-full relative flex items-end justify-between px-2 sm:px-4 pt-6 pb-2 overflow-hidden bg-gradient-to-b from-slate-50/70 to-white rounded-lg border border-slate-200">
                  {/* Líneas horizontales de cuadrícula */}
                  <div className="absolute inset-x-2 top-6 bottom-8 flex flex-col justify-between pointer-events-none opacity-25">
                    <div className="border-b border-dashed border-slate-500 w-full" />
                    <div className="border-b border-dashed border-slate-500 w-full" />
                    <div className="border-b border-dashed border-slate-500 w-full" />
                  </div>

                  {monthlyData.map((m) => {
                    const isPending = m.val2026 === 0;
                    const h2025 = Math.max(5, Math.min(88, (m.val2025 / yAxisMax) * 100));
                    const h2026 = isPending ? 3 : Math.max(5, Math.min(88, (m.val2026 / yAxisMax) * 100));
                    const isSelected = selectedMes === m.mesFull;
                    const diff = m.val2026 - m.val2025;
                    const pctDiff = m.val2025 > 0 ? Math.round((diff / m.val2025) * 100) : 0;

                    return (
                      <div
                        key={m.mesFull}
                        onClick={() => onSelectMes?.(isSelected ? null : m.mesFull)}
                        className={`flex-1 flex flex-col items-center justify-end h-full cursor-pointer group px-0.5 rounded-md transition-all ${
                          isSelected ? 'bg-blue-100/90 ring-1 ring-blue-600 shadow-2xs' : 'hover:bg-blue-50/60'
                        }`}
                        title={`${m.mesFull}: 2026 = ${isPending ? 'Pendiente' : m.val2026.toLocaleString()} | 2025 = ${m.val2025.toLocaleString()}${isPending ? '' : ` (Variación: ${pctDiff > 0 ? '+' : ''}${pctDiff}%)`}`}
                      >
                        {/* Delta Tag compacto */}
                        {isPending ? (
                          <div className="text-[7px] sm:text-[8px] font-bold font-mono text-slate-500 bg-slate-100 px-0.5 sm:px-1 py-0.2 rounded mb-0.5 shrink-0 select-none border border-slate-200">
                            Pend.
                          </div>
                        ) : (
                          <div className="text-[7.5px] sm:text-[8.5px] font-black font-mono text-emerald-800 bg-emerald-100/90 px-0.5 sm:px-1 py-0.2 rounded-full mb-0.5 border border-emerald-300 shadow-2xs shrink-0 select-none">
                            {pctDiff >= 0 ? `+${pctDiff}%` : `${pctDiff}%`}
                          </div>
                        )}

                        <div className="w-full flex items-end justify-center gap-0.5 sm:gap-1 h-full relative pb-1">
                          {/* 2026 Serenazgo Bar */}
                          <div className="flex flex-col items-center h-full justify-end">
                            <span className="text-[8px] sm:text-[9.5px] font-black font-mono text-blue-900 select-none mb-0.5 truncate max-w-[28px] sm:max-w-none">
                              {isPending ? '-' : m.val2026}
                            </span>
                            <div
                              className={`w-2.5 sm:w-3.5 md:w-4 rounded-t relative transition-all duration-300 shadow-sm ${
                                isPending
                                  ? 'bg-slate-300'
                                  : isSelected
                                  ? 'bg-gradient-to-t from-[#024a87] via-[#0284c7] to-[#38bdf8] ring-1 ring-cyan-400'
                                  : 'bg-gradient-to-t from-[#062446] via-[#03518a] to-[#0284c7] group-hover:brightness-125'
                              }`}
                              style={{ height: `${h2026}%` }}
                            >
                              <div className="absolute top-0 inset-x-0 h-0.5 bg-white/40 rounded-t" />
                            </div>
                          </div>

                          {/* 2025 Histórico Bar */}
                          <div className="flex flex-col items-center h-full justify-end">
                            <span className="text-[7.5px] sm:text-[9px] font-bold font-mono text-slate-600 select-none mb-0.5 truncate max-w-[28px] sm:max-w-none">
                              {m.val2025}
                            </span>
                            <div
                              className="w-2.5 sm:w-3.5 md:w-4 bg-gradient-to-t from-[#475569] via-[#64748b] to-[#94a3b8] rounded-t relative group-hover:brightness-115 transition-all duration-300 shadow-2xs"
                              style={{ height: `${h2025}%` }}
                            >
                              <div className="absolute top-0 inset-x-0 h-0.5 bg-white/30 rounded-t" />
                            </div>
                          </div>
                        </div>

                        <span
                          className={`text-[8.5px] sm:text-[10px] uppercase truncate font-black mt-1 select-none ${
                            isSelected ? 'text-blue-900 underline' : 'text-slate-700'
                          }`}
                        >
                          {m.mes}
                        </span>
                      </div>
                    );
                  })}
                </div>
              );
            })()}

            {/* Leyenda Compacta y Limpia */}
            <div className="flex items-center justify-center gap-4 sm:gap-6 text-[11px] font-bold text-slate-800 border-t border-slate-200 pt-2 mt-1">
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-2.5 bg-gradient-to-r from-[#062446] to-[#0284c7] rounded shadow-2xs"></span>
                <span className="font-extrabold text-[#062446]">Año 2026</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-2.5 bg-gradient-to-r from-[#475569] to-[#94a3b8] rounded shadow-2xs"></span>
                <span className="text-slate-600">Año 2025</span>
              </div>
            </div>
          </div>

          {/* Chart 5: Atenciones por Día de Semana (REDISEÑO TOTAL: ESTILIZADO, MODERNO Y SIN DISTORSIÓN) */}
          <div className="bg-white rounded-lg border-2 border-slate-300 shadow-md p-3 sm:p-4 flex flex-col justify-between overflow-hidden">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-slate-200">
              <EditableHeading
                value={titles?.dias || 'ATENCIONES POR DÍA DE SEMANA'}
                onSave={(val) => onUpdateTitle?.('dias', val)}
                subtitle={titles?.diasSub || 'distribución semanal y pico operativo'}
                onSaveSubtitle={(val) => onUpdateTitle?.('diasSub', val)}
              />

              <div className="flex items-center gap-1.5 flex-wrap shrink-0">
                {/* Selector de Vista: Columnas vs Curva vs Métricas */}
                <div className="flex items-center bg-slate-100 p-0.5 rounded border border-slate-300 shadow-2xs">
                  <button
                    type="button"
                    onClick={() => setDiasChartType('COLUMNS')}
                    className={`px-2 py-1 text-xs font-bold rounded flex items-center gap-1 transition-all ${
                      diasChartType === 'COLUMNS'
                        ? 'bg-[#124270] text-white shadow-xs'
                        : 'text-slate-600 hover:bg-slate-200'
                    }`}
                    title="Columnas verticales modernas con indicador de pico"
                  >
                    <BarChart2 className="w-3.5 h-3.5" />
                    <span>Columnas</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setDiasChartType('SPLINE')}
                    className={`px-2 py-1 text-xs font-bold rounded flex items-center gap-1 transition-all ${
                      diasChartType === 'SPLINE'
                        ? 'bg-[#124270] text-white shadow-xs'
                        : 'text-slate-600 hover:bg-slate-200'
                    }`}
                    title="Curva suave calibrada con nodos circulares exactos"
                  >
                    <LineChart className="w-3.5 h-3.5" />
                    <span>Curva</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setDiasChartType('CARDS')}
                    className={`px-2 py-1 text-xs font-bold rounded flex items-center gap-1 transition-all ${
                      diasChartType === 'CARDS'
                        ? 'bg-[#124270] text-white shadow-xs'
                        : 'text-slate-600 hover:bg-slate-200'
                    }`}
                    title="Métricas de ranking y variación"
                  >
                    <List className="w-3.5 h-3.5" />
                    <span>Métricas</span>
                  </button>
                </div>

                {selectedDiaFilter && (
                  <button
                    type="button"
                    onClick={() => handleDayClick(selectedDiaFilter)}
                    className="text-[11px] font-bold px-2 py-1 rounded bg-amber-100 text-amber-900 border border-amber-300 hover:bg-amber-200 flex items-center gap-1 transition-all shadow-2xs"
                    title="Quitar filtro de día"
                  >
                    <X className="w-3 h-3" />
                    <span>{selectedDiaFilter}</span>
                  </button>
                )}
              </div>
            </div>

            {/* Banda Resumen Superior: 3 Indicadores Clave de la Semana */}
            <div className="w-full my-2 grid grid-cols-3 gap-1.5 sm:gap-2 text-center">
              {/* Indicador 1: Pico Semanal */}
              <div className="bg-gradient-to-br from-[#062446] via-[#0f3460] to-[#124270] text-white p-1.5 rounded-lg border border-blue-900/60 shadow-2xs flex flex-col justify-center">
                <span className="text-[9.5px] uppercase font-black text-amber-300 flex items-center justify-center gap-1">
                  <Flame className="w-3 h-3 text-amber-400 animate-pulse" />
                  Día Pico Máximo
                </span>
                <span className="text-xs sm:text-sm font-black text-white tracking-wide">
                  {diaData.peakDay?.name || 'DOMINGO'}
                </span>
                <span className="text-[10px] text-cyan-200 font-mono font-bold">
                  {diaData.peakDay?.count.toLocaleString()} ops ({diaData.peakDay?.pctOfTotal}%)
                </span>
              </div>

              {/* Indicador 2: Promedio Diario */}
              <div className="bg-slate-50 border border-slate-200 p-1.5 rounded-lg shadow-2xs flex flex-col justify-center">
                <span className="text-[9.5px] uppercase font-bold text-slate-500 flex items-center justify-center gap-1">
                  <Activity className="w-3 h-3 text-blue-600" />
                  Promedio Diario
                </span>
                <span className="text-xs sm:text-sm font-black text-[#0f3460] font-mono">
                  {diaData.promedio.toLocaleString()}
                </span>
                <span className="text-[10px] text-slate-500 font-medium">
                  intervenciones / día
                </span>
              </div>

              {/* Indicador 3: Fin de Semana */}
              <div className="bg-slate-50 border border-slate-200 p-1.5 rounded-lg shadow-2xs flex flex-col justify-center">
                <span className="text-[9.5px] uppercase font-bold text-slate-500 flex items-center justify-center gap-1">
                  <Calendar className="w-3 h-3 text-indigo-600" />
                  Fin de Semana
                </span>
                <span className="text-xs sm:text-sm font-black text-indigo-900 font-mono">
                  {diaData.pctFinDeSemana}%
                </span>
                <span className="text-[10px] text-slate-500 font-medium">
                  {diaData.finDeSemana.toLocaleString()} ops (Sáb-Dom)
                </span>
              </div>
            </div>

            {/* CUERPO DEL GRÁFICO: SEGÚN MODO SELECCIONADO */}

            {/* MODO 1: COLUMNAS VERTICALES ESTILIZADAS (ROBUSTO Y SIN DISTORSIÓN) */}
            {diasChartType === 'COLUMNS' && (
              <div className="flex-1 w-full flex flex-col justify-between py-2 min-h-[260px]">
                <div className="flex-1 w-full flex items-end justify-between gap-1.5 sm:gap-2 px-1 relative">
                  {/* Línea Guía de Promedio Diario */}
                  <div
                    className="absolute inset-x-2 border-b-2 border-dashed border-slate-300 z-0 pointer-events-none flex items-center justify-end pr-2"
                    style={{
                      bottom: `${Math.min(88, Math.max(18, (diaData.promedio / diaData.max) * 88))}%`,
                    }}
                  >
                    <span className="bg-white/95 px-1 py-0.2 text-[9px] font-black text-slate-500 border border-slate-200 rounded shadow-2xs -mb-2">
                      Media: {diaData.promedio.toLocaleString()}
                    </span>
                  </div>

                  {diaData.days.map((d) => {
                    const isSelected = selectedDiaFilter === d.key;
                    return (
                      <div
                        key={d.key}
                        onClick={() => handleDayClick(d.key)}
                        className={`flex-1 flex flex-col items-center h-full justify-end cursor-pointer group transition-all duration-200 z-10 ${
                          isSelected ? 'scale-102' : 'hover:-translate-y-0.5'
                        }`}
                        title={`${d.name}: ${d.count.toLocaleString()} atenciones (${d.pctOfTotal}% del total) | ${
                          d.diffVsAvg >= 0 ? `+${d.diffVsAvg}` : d.diffVsAvg
                        } vs media diaria`}
                      >
                        {/* Cifra / Badge Superior */}
                        <div className="flex flex-col items-center mb-1.5">
                          {d.isPeak && (
                            <span className="bg-amber-500 text-amber-950 text-[8px] font-black px-1.5 py-0.2 rounded-full uppercase tracking-tighter mb-0.5 flex items-center gap-0.5 shadow-2xs">
                              <Flame className="w-2.5 h-2.5 text-amber-950 fill-amber-950" />
                              Pico
                            </span>
                          )}
                          <span
                            className={`text-[10px] sm:text-xs font-black font-mono px-1.5 py-0.5 rounded shadow-2xs transition-all ${
                              isSelected
                                ? 'bg-blue-600 text-white ring-2 ring-blue-400'
                                : d.isPeak
                                ? 'bg-[#062446] text-amber-300 font-extrabold ring-1 ring-amber-400/50'
                                : 'bg-slate-100 text-slate-800 group-hover:bg-blue-100 group-hover:text-blue-900'
                            }`}
                          >
                            {d.count.toLocaleString()}
                          </span>
                        </div>

                        {/* Columna Vertical Estilizada */}
                        <div className="w-full flex justify-center flex-1 items-end">
                          <div
                            className={`w-6 sm:w-8 md:w-10 rounded-t-lg relative transition-all duration-300 overflow-hidden shadow-sm flex flex-col justify-between items-center ${
                              isSelected
                                ? 'ring-2 ring-blue-500 ring-offset-1'
                                : d.isPeak
                                ? 'ring-2 ring-amber-400/80 shadow-blue-500/25 shadow-md'
                                : 'group-hover:brightness-110'
                            }`}
                            style={{
                              height: `${d.barHeightPct}%`,
                              background: d.isPeak
                                ? 'linear-gradient(180deg, #38bdf8 0%, #1d4ed8 45%, #062446 100%)'
                                : 'linear-gradient(180deg, #0284c7 0%, #1d4ed8 50%, #062446 100%)',
                            }}
                          >
                            {/* Brillo Superior Especular */}
                            <div className="w-full h-1 bg-white/40 rounded-t-lg" />

                            {/* Porcentaje impreso en la columna */}
                            <span className="text-[9px] sm:text-[10px] font-black font-mono text-white/95 drop-shadow-xs pb-1 select-none">
                              {d.pctOfTotal}%
                            </span>
                          </div>
                        </div>

                        {/* Etiqueta del Día */}
                        <div
                          className={`mt-2 w-full text-center py-1 px-0.5 rounded-md transition-all select-none ${
                            isSelected
                              ? 'bg-blue-900 text-white font-black shadow-xs'
                              : d.isPeak
                              ? 'bg-amber-100 text-amber-900 font-black'
                              : 'text-slate-700 font-bold group-hover:text-blue-700'
                          }`}
                        >
                          <span className="block text-[10px] sm:text-[11px] font-black uppercase tracking-tight">
                            {d.short}
                          </span>
                          <span
                            className={`block text-[8px] font-bold ${
                              d.pctVsAvg >= 0 ? 'text-emerald-700' : 'text-slate-500'
                            }`}
                          >
                            {d.pctVsAvg > 0 ? `+${d.pctVsAvg}%` : `${d.pctVsAvg}%`}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* MODO 2: CURVA SUAVE CALIBRADA (SVG CON ASPECT RATIO PRESERVADO Y NODOS PERFECTOS) */}
            {diasChartType === 'SPLINE' && (
              <div className="flex-1 w-full flex flex-col justify-between py-2 min-h-[260px]">
                <div className="flex-1 w-full relative flex items-center justify-center">
                  <svg viewBox="0 0 700 210" className="w-full h-full max-h-[230px]" preserveAspectRatio="xMidYMid meet">
                    <defs>
                      <linearGradient id="splineAreaGradOfficial" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#0284c7" stopOpacity="0.45" />
                        <stop offset="65%" stopColor="#1d4ed8" stopOpacity="0.15" />
                        <stop offset="100%" stopColor="#ffffff" stopOpacity="0.0" />
                      </linearGradient>
                      <filter id="shadowGlowSpline" x="-20%" y="-20%" width="140%" height="140%">
                        <feDropShadow dx="0" dy="2" stdDeviation="2.5" floodColor="#062446" floodOpacity="0.35" />
                      </filter>
                    </defs>

                    {/* Guías Horizontales Sutiles */}
                    <line x1="45" y1="35" x2="655" y2="35" stroke="#e2e8f0" strokeDasharray="3 3" />
                    <line x1="45" y1="85" x2="655" y2="85" stroke="#e2e8f0" strokeDasharray="3 3" />
                    <line x1="45" y1="145" x2="655" y2="145" stroke="#cbd5e1" strokeWidth="1" />

                    {/* Línea Promedio */}
                    {(() => {
                      const avgY = 145 - (diaData.promedio / diaData.max) * 110;
                      return (
                        <g>
                          <line x1="45" y1={avgY} x2="655" y2={avgY} stroke="#94a3b8" strokeDasharray="4 4" strokeWidth="1.5" />
                          <text x="650" y={avgY - 4} textAnchor="end" fill="#64748b" className="text-[9px] font-bold">
                            Media: {diaData.promedio.toLocaleString()}
                          </text>
                        </g>
                      );
                    })()}

                    {/* Curva de Área y Contorno */}
                    {(() => {
                      const padX = 55;
                      const usableW = 700 - padX * 2;
                      const step = usableW / 6;
                      const points = diaData.days.map((d, i) => {
                        const x = padX + i * step;
                        const y = 145 - (d.count / diaData.max) * 110;
                        return { x, y };
                      });
                      let dStr = `M ${points[0].x},${points[0].y} `;
                      for (let i = 1; i < points.length; i++) {
                        const prev = points[i - 1];
                        const curr = points[i];
                        const cp1x = prev.x + (curr.x - prev.x) / 2;
                        const cp1y = prev.y;
                        const cp2x = prev.x + (curr.x - prev.x) / 2;
                        const cp2y = curr.y;
                        dStr += `C ${cp1x},${cp1y} ${cp2x},${cp2y} ${curr.x},${curr.y} `;
                      }
                      const areaStr = dStr + `L ${points[points.length - 1].x},145 L ${points[0].x},145 Z`;
                      return (
                        <>
                          <path d={areaStr} fill="url(#splineAreaGradOfficial)" />
                          <path d={dStr} fill="none" stroke="#1d4ed8" strokeWidth="3.5" strokeLinecap="round" />
                        </>
                      );
                    })()}

                    {/* Nodos Circulares Interactivos Perfectamente Redondos */}
                    {diaData.days.map((d, i) => {
                      const padX = 55;
                      const usableW = 700 - padX * 2;
                      const step = usableW / 6;
                      const x = padX + i * step;
                      const y = 145 - (d.count / diaData.max) * 110;
                      const isSelected = selectedDiaFilter === d.key;

                      return (
                        <g
                          key={d.name}
                          className="cursor-pointer group"
                          onClick={() => handleDayClick(d.key)}
                        >
                          {/* Halo al hacer hover */}
                          <circle
                            cx={x}
                            cy={y}
                            r={d.isPeak ? '22' : '18'}
                            fill={isSelected ? '#3b82f6' : d.isPeak ? '#f59e0b' : '#0284c7'}
                            fillOpacity="0.22"
                            className="group-hover:scale-125 transition-transform"
                          />
                          {/* Círculo Principal */}
                          <circle
                            cx={x}
                            cy={y}
                            r={d.isPeak ? '17' : '15'}
                            fill={isSelected ? '#2563eb' : d.isPeak ? '#062446' : '#1d4ed8'}
                            stroke={d.isPeak ? '#f59e0b' : '#ffffff'}
                            strokeWidth={d.isPeak ? '3' : '2.5'}
                            filter="url(#shadowGlowSpline)"
                            className="group-hover:brightness-110 transition-all"
                          />
                          {/* Cifra dentro del círculo */}
                          <text
                            x={x}
                            y={y + 4}
                            textAnchor="middle"
                            fill="#ffffff"
                            className="text-[10px] font-black pointer-events-none select-none font-mono"
                          >
                            {d.count}
                          </text>

                          {/* Etiqueta de Día debajo del eje */}
                          <text
                            x={x}
                            y="172"
                            textAnchor="middle"
                            className={`text-[11px] font-black uppercase pointer-events-none select-none ${
                              isSelected ? 'fill-blue-900 font-extrabold' : d.isPeak ? 'fill-amber-800' : 'fill-slate-700'
                            }`}
                          >
                            {d.short}
                          </text>
                          {/* Porcentaje */}
                          <text
                            x={x}
                            y="188"
                            textAnchor="middle"
                            className="text-[9.5px] font-bold fill-slate-500 pointer-events-none select-none font-mono"
                          >
                            {d.pctOfTotal}%
                          </text>
                        </g>
                      );
                    })}
                  </svg>
                </div>
              </div>
            )}

            {/* MODO 3: MÉTRICAS Y RANKING DE DÍAS */}
            {diasChartType === 'CARDS' && (
              <div className="flex-1 w-full flex flex-col justify-between gap-1.5 py-1 min-h-[260px]">
                {diaData.days.map((d, idx) => {
                  const isSelected = selectedDiaFilter === d.key;
                  return (
                    <div
                      key={d.key}
                      onClick={() => handleDayClick(d.key)}
                      className={`flex items-center justify-between px-3 py-1.5 rounded-lg border transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-blue-50 border-blue-500 shadow-xs ring-1 ring-blue-500'
                          : 'bg-white hover:bg-slate-50 border-slate-200'
                      }`}
                      title="Clic para filtrar por este día"
                    >
                      <div className="flex items-center gap-2.5">
                        <span
                          className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-black ${
                            d.isPeak
                              ? 'bg-amber-400 text-amber-950 shadow-2xs ring-1 ring-amber-500'
                              : 'bg-slate-100 text-slate-700'
                          }`}
                        >
                          {idx + 1}º
                        </span>
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="text-xs font-black text-slate-800 uppercase">
                              {d.name}
                            </span>
                            {d.isPeak && (
                              <span className="text-[9px] font-black bg-amber-100 text-amber-800 px-1 rounded uppercase flex items-center gap-0.5">
                                <Flame className="w-2.5 h-2.5" /> Pico
                              </span>
                            )}
                          </div>
                          <span className="text-[10px] text-slate-500">
                            {d.pctVsAvg >= 0 ? `+${d.pctVsAvg}%` : `${d.pctVsAvg}%`} vs media diaria
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <div className="w-24 h-2 bg-slate-100 rounded-full overflow-hidden border border-slate-200 hidden sm:block">
                          <div
                            className="h-full bg-gradient-to-r from-blue-700 to-cyan-500 rounded-full"
                            style={{ width: `${d.barHeightPct}%` }}
                          />
                        </div>
                        <div className="text-right">
                          <span className="block text-xs font-black font-mono text-[#062446]">
                            {d.count.toLocaleString()}
                          </span>
                          <span className="block text-[10px] font-bold text-slate-500">
                            {d.pctOfTotal}%
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Pie de Gráfico: Resumen Operativo */}
            <div className="flex items-center justify-between text-[11px] font-bold text-slate-700 border-t border-slate-200 pt-2 mt-1">
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-blue-600"></span>
                <span>
                  Concentración Pico:{' '}
                  <strong className="text-blue-900">
                    {diaData.peakDay?.name} ({diaData.peakDay?.pctOfTotal}%)
                  </strong>
                </span>
              </div>
              <span className="text-[10.5px] text-slate-500 font-medium hidden sm:inline">
                {selectedDiaFilter ? `Filtrando por ${selectedDiaFilter}` : 'Clic en cualquier día para filtrar'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* CATEGORÍA 4: MAPA DE CALOR MATRICIAL Y TABLA FILTER (SLICER INTERACTIVO)  */}
      {/* ========================================================================= */}
      <div className="flex flex-col gap-2.5">
        <MatrixHeatmapFilter
          records={records}
          allRecords={allRecords}
          onSelectSubsector={onSelectSubsector}
          onSelectZona={onSelectZona}
          title={titles?.matrixTitle}
          onSaveTitle={(val) => onUpdateTitle?.('matrixTitle', val)}
          subtitle={titles?.matrixSub}
          onSaveSubtitle={(val) => onUpdateTitle?.('matrixSub', val)}
        />
      </div>

      {/* 8. PANEL DETALLADO DEL MES */}
      {selectedMes && monthDetail && (
        <div className="bg-white rounded-lg border-2 border-blue-500 shadow-xl p-3 sm:p-4 text-slate-800 flex flex-col gap-3 animate-fadeIn">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-2 border-b border-slate-200 gap-2">
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-amber-500" />
              <div>
                <h3 className="text-sm font-black text-[#0f3460] uppercase tracking-wide">
                  DESGLOSE DETALLADO DEL MES: {selectedMes} 2026
                </h3>
                <p className="text-[11px] text-slate-500">
                  Resumen analítico de las {monthDetail.totalMes} intervenciones registradas en Nuevo Chimbote
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {onNavigateToHeatmap && (
                <button
                  onClick={onNavigateToHeatmap}
                  className="px-3 py-1.5 rounded-md bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white text-xs font-bold flex items-center gap-1.5 transition-all shadow-sm"
                >
                  <Flame className="w-3.5 h-3.5 text-amber-300" />
                  <span>Ver en Mapa de Calor</span>
                </button>
              )}
              {onNavigateToDetails && (
                <button
                  onClick={onNavigateToDetails}
                  className="px-3 py-1.5 rounded-md bg-[#124270] hover:bg-[#18538c] text-white text-xs font-bold flex items-center gap-1.5 transition-colors shadow"
                >
                  <span>Ver Listado Completo</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="bg-slate-50 rounded-lg p-3 border border-slate-200 flex flex-col justify-between">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                Foco Territorial Crítico
              </span>
              <div className="my-1.5">
                <div className="text-base font-black text-[#0f3460]">
                  {monthDetail.topSub?.code}: {monthDetail.topSub?.name}
                </div>
                <div className="text-xs text-slate-600 mt-0.5">
                  Registró <span className="font-bold text-blue-800">{monthDetail.topSub?.count} atenciones</span> durante {selectedMes}.
                </div>
              </div>
              <div className="flex items-center gap-1.5 text-[10px] text-blue-700 font-semibold pt-1 border-t border-slate-200">
                <MapPin className="w-3 h-3" />
                <span>Patrullaje intensivo recomendado</span>
              </div>
            </div>

            <div className="bg-slate-50 rounded-lg p-3 border border-slate-200 flex flex-col justify-between">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                Día y Horario con Mayor Demanda
              </span>
              <div className="my-1.5">
                <div className="text-base font-black text-[#0f3460] flex items-center gap-2">
                  <span>DÍA {monthDetail.topDay?.name}</span>
                  <span className="text-xs px-2 py-0.5 bg-blue-100 text-blue-800 rounded font-bold">
                    {monthDetail.topDay?.count} casos
                  </span>
                </div>
                <div className="text-xs text-slate-600 mt-0.5">
                  Turno crítico: <span className="font-bold text-blue-800">TARDE (14:00 - 22:00 hrs)</span> con {turnoData.tarde} atenciones ({turnoData.tardePct}%).
                </div>
              </div>
              <div className="flex items-center gap-1.5 text-[10px] text-amber-700 font-semibold pt-1 border-t border-slate-200">
                <Clock className="w-3 h-3" />
                <span>Refuerzo de personal en horario vespertino</span>
              </div>
            </div>

            <div className="bg-slate-50 rounded-lg p-3 border border-slate-200 flex flex-col justify-between">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                Delitos / Incidencias Más Frecuentes
              </span>
              <div className="flex flex-col gap-1.5 my-1">
                {monthDetail.topIncidencias.slice(0, 3).map((item, idx) => (
                  <div key={item.tipo} className="flex items-center justify-between text-xs">
                    <span className="truncate text-slate-700 font-medium">
                      {idx + 1}. {item.tipo}
                    </span>
                    <span className="font-mono font-bold text-blue-900 shrink-0 ml-2">
                      {item.count} ({item.pct}%)
                    </span>
                  </div>
                ))}
              </div>
              <div className="flex items-center gap-1.5 text-[10px] text-emerald-700 font-semibold pt-1 border-t border-slate-200">
                <ShieldCheck className="w-3 h-3" />
                <span>Atendidas con éxito por Serenazgo Nuevo Chimbote</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL FICHA COMPARATIVA DE SETIEMBRE */}
      {showSetiembreModal && (
        <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center z-50 p-3 animate-fadeIn">
          <div className="bg-white rounded-xl shadow-2xl border-2 border-[#124270] max-w-2xl w-full overflow-hidden flex flex-col max-h-[90vh]">
            {/* Header */}
            <div className="bg-gradient-to-r from-[#0a1a36] via-[#0d274c] to-[#0a1f3d] text-white px-4 py-3 flex items-center justify-between border-b border-cyan-800">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-full bg-amber-500/20 border border-amber-400/40 flex items-center justify-center">
                  <TrendingUp className="w-4 h-4 text-amber-400" />
                </div>
                <div>
                  <h3 className="text-sm font-black tracking-wide uppercase">
                    INFORME COMPARATIVO &bull; SETIEMBRE 2025 vs 2026
                  </h3>
                  <p className="text-[10px] text-cyan-200">
                    Productividad operativa &bull; Sub-Gerencia de Serenazgo Nuevo Chimbote
                  </p>
                </div>
              </div>

              <button
                type="button"
                id="btn-close-setiembre-modal"
                onClick={() => setShowSetiembreModal(false)}
                className="w-7 h-7 rounded-full bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white flex items-center justify-center transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-4 overflow-y-auto space-y-4">
              {/* Highlight KPI Card */}
              <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border-2 border-blue-200 rounded-lg p-3.5 flex flex-col sm:flex-row items-center justify-between gap-3">
                <div>
                  <span className="text-[10px] font-black uppercase text-blue-900 tracking-wider">
                    VARIACIÓN INTERANUAL DE SETIEMBRE
                  </span>
                  <div className="flex items-baseline gap-2 mt-1">
                    <span className="text-3xl font-black text-[#0f3460] font-mono">
                      {setiembreStats.total2026}
                    </span>
                    <span className="text-xs text-slate-500 font-semibold">
                      atenciones en 2026
                    </span>
                    <span className="text-xs text-slate-400 font-normal">vs</span>
                    <span className="text-lg font-bold text-slate-600 font-mono">
                      {setiembreStats.total2025}
                    </span>
                    <span className="text-xs text-slate-500 font-semibold">
                      en 2025
                    </span>
                  </div>
                </div>

                <div className="flex flex-col items-center sm:items-end">
                  <div className="px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-black flex items-center gap-1 border border-emerald-300 shadow-xs">
                    <ArrowUpRight className="w-4 h-4 text-emerald-700 stroke-[3]" />
                    <span>+{setiembreStats.diff} atenciones (+{setiembreStats.pct}%)</span>
                  </div>
                  <span className="text-[10px] text-slate-500 font-medium mt-1">
                    Incremento en cobertura y patrullaje integrado
                  </span>
                </div>
              </div>

              {/* Comparativo Tabular */}
              <div className="border border-slate-200 rounded-lg overflow-hidden">
                <div className="bg-[#124270] text-white px-3 py-1.5 text-xs font-bold uppercase tracking-wider flex justify-between items-center">
                  <span>Desglose Comparativo Operativo de Setiembre</span>
                  <span className="text-[10px] text-cyan-200">2025 vs 2026</span>
                </div>

                <table className="w-full text-xs text-left">
                  <thead className="bg-slate-100 text-slate-700 uppercase text-[10px] font-black border-b border-slate-200">
                    <tr>
                      <th className="p-2 border-r border-slate-200">Indicador / Unidad</th>
                      <th className="p-2 border-r border-slate-200 text-center">Setiembre 2025</th>
                      <th className="p-2 border-r border-slate-200 text-center">Setiembre 2026</th>
                      <th className="p-2 border-r border-slate-200 text-center">Diferencial</th>
                      <th className="p-2 text-center">Tendencia</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 font-semibold">
                    <tr className="hover:bg-slate-50">
                      <td className="p-2 border-r border-slate-200 font-bold text-slate-800">TOTAL ATENCIONES</td>
                      <td className="p-2 border-r border-slate-200 text-center text-slate-600 font-mono">{setiembreStats.total2025}</td>
                      <td className="p-2 border-r border-slate-200 text-center font-black text-blue-900 font-mono">{setiembreStats.total2026}</td>
                      <td className="p-2 border-r border-slate-200 text-center text-emerald-600 font-mono">+{setiembreStats.diff}</td>
                      <td className="p-2 text-center">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                          +{setiembreStats.pct}%
                        </span>
                      </td>
                    </tr>
                    <tr className="hover:bg-slate-50">
                      <td className="p-2 border-r border-slate-200 text-slate-700">Turno Tarde (15:00 - 23:00)</td>
                      <td className="p-2 border-r border-slate-200 text-center text-slate-600 font-mono">82</td>
                      <td className="p-2 border-r border-slate-200 text-center font-bold text-blue-900 font-mono">{setiembreStats.tarde}</td>
                      <td className="p-2 border-r border-slate-200 text-center text-emerald-600 font-mono">+{setiembreStats.tarde - 82}</td>
                      <td className="p-2 text-center">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                          +{Math.round(((setiembreStats.tarde - 82) / 82) * 100)}%
                        </span>
                      </td>
                    </tr>
                    <tr className="hover:bg-slate-50">
                      <td className="p-2 border-r border-slate-200 text-slate-700">Turno Mañana (07:00 - 15:00)</td>
                      <td className="p-2 border-r border-slate-200 text-center text-slate-600 font-mono">68</td>
                      <td className="p-2 border-r border-slate-200 text-center font-bold text-blue-900 font-mono">{setiembreStats.manana}</td>
                      <td className="p-2 border-r border-slate-200 text-center text-emerald-600 font-mono">+{setiembreStats.manana - 68}</td>
                      <td className="p-2 text-center">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                          +{Math.round(((setiembreStats.manana - 68) / 68) * 100)}%
                        </span>
                      </td>
                    </tr>
                    <tr className="hover:bg-slate-50">
                      <td className="p-2 border-r border-slate-200 text-slate-700">Turno Noche (23:00 - 07:00)</td>
                      <td className="p-2 border-r border-slate-200 text-center text-slate-600 font-mono">60</td>
                      <td className="p-2 border-r border-slate-200 text-center font-bold text-blue-900 font-mono">{setiembreStats.noche}</td>
                      <td className="p-2 border-r border-slate-200 text-center text-emerald-600 font-mono">+{setiembreStats.noche - 60}</td>
                      <td className="p-2 text-center">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                          +{Math.round(((setiembreStats.noche - 60) / 60) * 100)}%
                        </span>
                      </td>
                    </tr>
                    <tr className="hover:bg-slate-50">
                      <td className="p-2 border-r border-slate-200 text-slate-700">CIA Buenos Aires (Centro / Sur)</td>
                      <td className="p-2 border-r border-slate-200 text-center text-slate-600 font-mono">175</td>
                      <td className="p-2 border-r border-slate-200 text-center font-bold text-blue-900 font-mono">{setiembreStats.ba}</td>
                      <td className="p-2 border-r border-slate-200 text-center text-emerald-600 font-mono">+{setiembreStats.ba - 175}</td>
                      <td className="p-2 text-center">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                          +{Math.round(((setiembreStats.ba - 175) / 175) * 100)}%
                        </span>
                      </td>
                    </tr>
                    <tr className="hover:bg-slate-50">
                      <td className="p-2 border-r border-slate-200 text-slate-700">CIA Villa María (Norte)</td>
                      <td className="p-2 border-r border-slate-200 text-center text-slate-600 font-mono">35</td>
                      <td className="p-2 border-r border-slate-200 text-center font-bold text-blue-900 font-mono">{setiembreStats.vm}</td>
                      <td className="p-2 border-r border-slate-200 text-center text-emerald-600 font-mono">+{setiembreStats.vm - 35}</td>
                      <td className="p-2 text-center">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                          +{Math.round(((setiembreStats.vm - 35) / 35) * 100)}%
                        </span>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Status Note */}
              <div className="bg-slate-50 p-2.5 rounded border border-slate-200 text-[11px] text-slate-600 flex flex-col sm:flex-row sm:items-center justify-between gap-1.5">
                <span>
                  Estado del gráfico comparativo anual: <strong>{excludeSetiembre ? 'Setiembre está excluido del gráfico anual' : 'Setiembre está incluido en el gráfico anual'}</strong>.
                </span>
                <button
                  type="button"
                  onClick={() => setExcludeSetiembre((prev) => !prev)}
                  className="text-blue-700 hover:underline font-bold text-xs"
                >
                  {excludeSetiembre ? 'Incluir en gráfico anual' : 'Sacar del gráfico anual'}
                </button>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="bg-slate-100 px-4 py-3 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-2">
              <button
                type="button"
                onClick={() => {
                  onSelectMes?.('SETIEMBRE');
                  setShowSetiembreModal(false);
                }}
                className="px-3 py-1.5 rounded bg-blue-100 text-blue-900 border border-blue-300 hover:bg-blue-200 text-xs font-bold transition-colors w-full sm:w-auto"
              >
                Filtrar Dashboard por Setiembre 2026
              </button>

              <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                <button
                  type="button"
                  onClick={() => exportComparativeSeptemberToExcel(baseRecords)}
                  className="px-3 py-1.5 rounded bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold flex items-center gap-1.5 shadow-sm transition-colors"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Descargar Comparativo (.xlsx)</span>
                </button>

                <button
                  type="button"
                  onClick={() => setShowSetiembreModal(false)}
                  className="px-3 py-1.5 rounded bg-slate-300 hover:bg-slate-400 text-slate-800 text-xs font-bold transition-colors"
                >
                  Cerrar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL FICHA EJECUTIVA OFICIAL DEL MES */}
      <MonthlyReportModal
        isOpen={isMonthlyReportModalOpen}
        onClose={() => setIsMonthlyReportModalOpen(false)}
        records={records}
        allRecords={baseRecords}
        initialMes={reportTargetMes}
      />

      {/* MODAL CONSOLIDADO GENERAL ANUAL (MATRIZ CRUZADA 12 MESES TIPO IMAGEN 2) */}
      <AnnualConsolidatedModal
        isOpen={isAnnualConsolidatedModalOpen}
        onClose={() => setIsAnnualConsolidatedModalOpen(false)}
        records={baseRecords}
      />
    </div>
  );
};
