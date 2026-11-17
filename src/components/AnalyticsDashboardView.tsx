import React, { useState, useMemo, useEffect, useRef } from 'react';
import {
  Shield, Search, Crosshair, Settings, Wifi, CheckSquare,
  Square, Layers, X, RotateCcw, Activity, FileDown,
  Edit3, Eye, CalendarRange, Maximize2, Minimize2,
  Navigation, ChevronDown, ChevronUp, Radio, FilterX, Map as MapIcon, User, Truck, Clock, GripHorizontal
} from 'lucide-react';
import { IncidentRecord } from '../types';

interface AnalyticsDashboardViewProps {
  records: IncidentRecord[];
  onSelectSubsector?: (code: string) => void;
  onFilterZona?: (zone: string) => void;
  onFilterTurno?: (turno: string) => void;
}

const MESES_CORTOS = ['ENE', 'FEB', 'MAR', 'ABR', 'MAY', 'JUN', 'JUL', 'AGO', 'SEP', 'OCT', 'NOV', 'DIC'];
const MESES_LARGOS = [
  'ENERO', 'FEBRERO', 'MARZO', 'ABRIL', 'MAYO', 'JUNIO',
  'JULIO', 'AGOSTO', 'SETIEMBRE', 'OCTUBRE', 'NOVIEMBRE', 'DICIEMBRE'
];

interface BeveledBarItem {
  label: string;
  count: number;
  pct: number;
  color?: string;
}

interface BeveledBarChartProps {
  title: string;
  subtitle: string;
  items: BeveledBarItem[];
  colorTheme?: 'blue' | 'indigo' | 'emerald' | 'amber';
}

const BeveledBarChart: React.FC<BeveledBarChartProps> = ({ title, subtitle, items, colorTheme = 'blue' }) => {
  if (!items || items.length === 0) return null;

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
                  <span className="absolute right-0 text-[10px] sm:text-[11px] font-bold text-slate-700 w-28 sm:w-32 text-right pl-2">
                    {item.count.toLocaleString()} ({widthPct.toFixed(1)}%)
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export const AnalyticsDashboardView: React.FC<AnalyticsDashboardViewProps> = ({
  records,
  onSelectSubsector,
  onFilterZona,
  onFilterTurno,
}) => {
  const [selectedModalidad, setSelectedModalidad] = useState<string | null>(null);
  const [selectedMapColor, setSelectedMapColor] = useState<any | null>(null);

  // Estados para mover la tarjeta flotante libremente con el mouse
  const [cardPosition, setCardPosition] = useState<{ x: number; y: number } | null>(null);
  const [isDraggingCard, setIsDraggingCard] = useState<boolean>(false);
  const dragOffsetRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapInstanceRef = useRef<any>(null);

  const totalIncidencias = records.length;

  // Agrupación por turnos
  const turnosData = useMemo(() => {
    const map: Record<string, number> = { 'MAÑANA': 0, 'TARDE': 0, 'NOCHE': 0 };
    records.forEach((r) => {
      const t = (r.turno || 'MAÑANA').toUpperCase();
      if (map[t] !== undefined) map[t]++;
      else map['MAÑANA']++;
    });
    return Object.entries(map).map(([label, count]) => ({
      label,
      count,
      pct: totalIncidencias ? (count / totalIncidencias) * 100 : 0,
    }));
  }, [records, totalIncidencias]);

  // Agrupación por modalidades / tipos de incidencia
  const modalidadesData = useMemo(() => {
    const map: Record<string, number> = {};
    records.forEach((r) => {
      const inc = (r.incidencia || r.tipoIncidencia || 'PATRULLAJE PREVENTIVO').toUpperCase();
      map[inc] = (map[inc] || 0) + 1;
    });
    return Object.entries(map)
      .map(([label, count]) => ({
        label,
        count,
        pct: totalIncidencias ? (count / totalIncidencias) * 100 : 0,
      }))
      .sort((a, b) => b.count - a.count);
  }, [records, totalIncidencias]);

  return (
    <div className="p-4 sm:p-6 bg-slate-100 min-h-screen">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="bg-white border border-slate-300 rounded-xl p-4 shadow-sm flex flex-col sm:flex-row justify-between items-center gap-4">
          <div>
            <h1 className="text-xl font-black text-slate-900 uppercase">Dashboard Analítico SICEP C2</h1>
            <p className="text-xs text-slate-500">Monitoreo de {totalIncidencias.toLocaleString()} registros de serenazgo en Nuevo Chimbote</p>
          </div>
          <div className="flex items-center gap-2">
            <span className="px-3 py-1 bg-emerald-100 text-emerald-800 font-bold text-xs rounded-full border border-emerald-300">
              ● Sistema Conectado y Optimizado
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <BeveledBarChart
            title="Distribución por Turnos Operativos"
            subtitle="Consolidado de intervenciones según turno"
            items={turnosData}
          />
          <BeveledBarChart
            title="Tipos de Incidencias y Modalidades"
            subtitle="Ranking general de motivos y eventos reportados"
            items={modalidadesData.slice(0, 8)}
          />
        </div>
      </div>
    </div>
  );
};
