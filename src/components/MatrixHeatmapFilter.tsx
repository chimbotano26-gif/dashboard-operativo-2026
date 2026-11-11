import React, { useState, useMemo } from 'react';
import { IncidentRecord, ZonaType } from '../types';
import { SUBSECTORES_CONFIG } from '../data/mockData';
import {
  Flame,
  Search,
  Maximize2,
  Minimize2,
  Table as TableIcon,
  Layers,
  Sparkles,
  MapPin,
  Filter,
  CheckCircle,
  AlertTriangle,
  Download,
} from 'lucide-react';
import { exportIncidentsToExcel } from '../utils/excelHelper';
import { EditableHeading } from './EditableHeading';

interface MatrixHeatmapFilterProps {
  records: IncidentRecord[];
  allRecords?: IncidentRecord[];
  onSelectSubsector?: (subsector: string) => void;
  onSelectZona?: (zona: ZonaType) => void;
  title?: string;
  onSaveTitle?: (val: string) => void;
  subtitle?: string;
  onSaveSubtitle?: (val: string) => void;
}

export const MatrixHeatmapFilter: React.FC<MatrixHeatmapFilterProps> = ({
  records,
  allRecords,
  onSelectSubsector,
  onSelectZona,
  title,
  onSaveTitle,
  subtitle,
  onSaveSubtitle,
}) => {
  const [textFilter, setTextFilter] = useState('');
  const [selectedSubsectorModal, setSelectedSubsectorModal] = useState<string | null>(null);
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [activeTab, setActiveTab] = useState<'MATRIZ' | 'TABLA_FILTER'>('MATRIZ');

  // Excel-like FILTER function:
  // Evaluates text match across observacion, columna1, lugar, and incidencia
  const filteredByFormula = useMemo(() => {
    if (!textFilter.trim()) return records;
    const q = textFilter.toLowerCase();
    return records.filter((r) => {
      const matchObs = (r.observacion || r.descripcion || '').toLowerCase().includes(q);
      const matchCol1 = (r.columna1 || '').toLowerCase().includes(q);
      const matchLugar = (r.lugar || r.ubicacion || '').toLowerCase().includes(q);
      const matchInc = (r.tipoIncidencia || r.incidencia || '').toLowerCase().includes(q);
      return matchObs || matchCol1 || matchLugar || matchInc;
    });
  }, [records, textFilter]);

  // Subsector incident count calculation for Heatmap Matrix
  const matrixStats = useMemo(() => {
    const counts: Record<string, number> = {};
    filteredByFormula.forEach((r) => {
      const key = r.subsector || r.sector;
      counts[key] = (counts[key] || 0) + 1;
    });

    const maxCount = Math.max(...Object.values(counts), 1);

    // Group subsectors by Zone
    const zonaNorteKeys = ['S1VM', 'S2VM', 'S3VM', 'S4VM', 'S5VM', 'S6VM', 'S7VM'];
    const zonaCentroKeys = ['S1BA', 'S2BA', 'S3BA', 'S4BA', 'S5BA'];
    const zonaSurKeys = ['S6BA', 'S7BA', 'S8BA', 'S9BA'];

    const buildGroup = (keys: string[]) =>
      keys.map((k) => {
        const conf = SUBSECTORES_CONFIG[k] || {
          nombre: k,
          zona: 'ZONA CENTRO',
          comisaria: 'CIA BUENOS AIRES',
        };
        const count = counts[k] || 0;
        const intensity = Math.min(100, Math.round((count / maxCount) * 100));
        return {
          code: k,
          name: conf.nombre,
          zona: conf.zona,
          comisaria: conf.comisaria,
          count,
          intensity,
        };
      });

    return {
      maxCount,
      norte: buildGroup(zonaNorteKeys),
      centro: buildGroup(zonaCentroKeys),
      sur: buildGroup(zonaSurKeys),
      totalFiltered: filteredByFormula.length,
    };
  }, [filteredByFormula]);

  // Color intensity helper (Heatmap chromatic scale: green/blue -> amber -> intense red)
  const getHeatStyle = (intensity: number, count: number) => {
    if (count === 0) {
      return {
        bg: 'bg-slate-50 hover:bg-slate-100',
        border: 'border-slate-200',
        text: 'text-slate-500',
        pill: 'bg-slate-200 text-slate-700',
        glow: '',
      };
    }
    if (intensity < 25) {
      return {
        bg: 'bg-sky-50 hover:bg-sky-100',
        border: 'border-sky-300',
        text: 'text-sky-950',
        pill: 'bg-sky-200 text-sky-900',
        glow: 'shadow-xs',
      };
    }
    if (intensity < 50) {
      return {
        bg: 'bg-teal-50 hover:bg-teal-100',
        border: 'border-teal-400',
        text: 'text-teal-950',
        pill: 'bg-teal-200 text-teal-900',
        glow: 'shadow-xs',
      };
    }
    if (intensity < 75) {
      return {
        bg: 'bg-amber-50 hover:bg-amber-100',
        border: 'border-amber-400',
        text: 'text-amber-950',
        pill: 'bg-amber-300 text-amber-950 font-black',
        glow: 'shadow-sm ring-1 ring-amber-300',
      };
    }
    // High heat (75 - 100%)
    return {
      bg: 'bg-rose-50 hover:bg-rose-100',
      border: 'border-rose-500',
      text: 'text-rose-950',
      pill: 'bg-rose-600 text-white font-black animate-pulse',
      glow: 'shadow-md ring-2 ring-rose-400',
    };
  };

  const handleExportFiltered = () => {
    exportIncidentsToExcel(
      filteredByFormula,
      `Reporte_Filtrado_Excel_Serenazgo_${new Date().toISOString().slice(0, 10)}.xlsx`
    );
  };

  const content = (
    <div className="flex flex-col gap-2.5 h-full">
      {/* Header bar */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-2 pb-2 border-b border-slate-200">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-rose-500 to-amber-600 flex items-center justify-center text-white shadow-sm">
            <Flame className="w-5 h-5 text-amber-200" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <EditableHeading
                value={title || 'MAPA DE CALOR MATRICIAL • ANÁLISIS POR SUBSECTOR'}
                onSave={(val) => onSaveTitle?.(val)}
                subtitle={subtitle || 'Matriz territorial condicional vinculada a Observación y Columna 1 sin necesidad de GPS'}
                onSaveSubtitle={onSaveSubtitle ? (val) => onSaveSubtitle(val) : undefined}
                badgeStyle={false}
                className="text-xs sm:text-sm font-black text-[#0f3460] uppercase tracking-wide hover:text-blue-600"
              />
              <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-blue-100 text-blue-900 border border-blue-300 shrink-0">
                FÓRMULA FILTER
              </span>
            </div>
          </div>
        </div>

        {/* Dynamic Text Filter (Excel FILTER bar) */}
        <div className="flex items-center gap-1.5 flex-wrap">
          <div className="relative flex-1 sm:w-64">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={textFilter}
              onChange={(e) => setTextFilter(e.target.value)}
              placeholder="=FILTRAR por observación, calle..."
              className="w-full pl-8 pr-6 py-1.5 text-xs bg-slate-50 border border-slate-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 font-medium"
            />
            {textFilter && (
              <button
                type="button"
                onClick={() => setTextFilter('')}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 text-xs"
              >
                &times;
              </button>
            )}
          </div>

          {/* Toggle between Matrix and Auxiliary Table */}
          <div className="flex items-center bg-slate-100 p-0.5 rounded-md border border-slate-300">
            <button
              type="button"
              onClick={() => setActiveTab('MATRIZ')}
              className={`px-2.5 py-1 text-[11px] font-bold rounded flex items-center gap-1 transition-all ${
                activeTab === 'MATRIZ'
                  ? 'bg-[#124270] text-white shadow-xs'
                  : 'text-slate-700 hover:bg-slate-200'
              }`}
            >
              <Layers className="w-3 h-3" />
              <span>Matriz Zonas</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('TABLA_FILTER')}
              className={`px-2.5 py-1 text-[11px] font-bold rounded flex items-center gap-1 transition-all ${
                activeTab === 'TABLA_FILTER'
                  ? 'bg-[#124270] text-white shadow-xs'
                  : 'text-slate-700 hover:bg-slate-200'
              }`}
            >
              <TableIcon className="w-3 h-3" />
              <span>Tabla FILTER ({filteredByFormula.length})</span>
            </button>
          </div>

          {/* Full-Screen Zoom Button */}
          <button
            type="button"
            onClick={() => setIsFullScreen((prev) => !prev)}
            className="p-1.5 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 shadow-xs transition-colors"
            title={isFullScreen ? 'Salir de pantalla completa' : 'Ampliar vista a pantalla completa'}
          >
            {isFullScreen ? <Minimize2 className="w-4 h-4 text-blue-700" /> : <Maximize2 className="w-4 h-4 text-blue-700" />}
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      {activeTab === 'MATRIZ' ? (
        <div className="flex-1 flex flex-col gap-3">
          {/* Chromatic Heat Scale Legend */}
          <div className="flex items-center justify-between text-[11px] bg-slate-50 p-2 rounded-md border border-slate-200 flex-wrap gap-2">
            <span className="font-bold text-slate-700 flex items-center gap-1">
              <Flame className="w-3.5 h-3.5 text-rose-500" />
              <span>Intensidad Térmica por Concentración de Hechos:</span>
            </span>
            <div className="flex items-center gap-2 text-[10px] font-bold">
              <span className="flex items-center gap-1">
                <span className="w-3 h-3 rounded bg-slate-200 border border-slate-300"></span>
                <span>0 hechos</span>
              </span>
              <span className="flex items-center gap-1">
                <span className="w-3 h-3 rounded bg-sky-200 border border-sky-400"></span>
                <span>Baja</span>
              </span>
              <span className="flex items-center gap-1">
                <span className="w-3 h-3 rounded bg-teal-200 border border-teal-400"></span>
                <span>Moderada</span>
              </span>
              <span className="flex items-center gap-1">
                <span className="w-3 h-3 rounded bg-amber-300 border border-amber-500"></span>
                <span>Media-Alta</span>
              </span>
              <span className="flex items-center gap-1">
                <span className="w-3 h-3 rounded bg-rose-600 border border-rose-700"></span>
                <span>Crítica (Pico)</span>
              </span>
            </div>
          </div>

          {/* 3 Zone Groups */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {/* 1. ZONA NORTE */}
            <div className="bg-slate-50/70 rounded-lg border border-slate-300 p-2 flex flex-col gap-1.5">
              <div
                onClick={() => onSelectZona?.('ZONA NORTE')}
                className="flex items-center justify-between text-xs font-black uppercase text-teal-900 pb-1 border-b border-teal-200 cursor-pointer hover:text-teal-700"
              >
                <span>ZONA NORTE (CIA Villa María)</span>
                <span className="text-[10px] font-mono bg-teal-100 text-teal-800 px-1.5 py-0.5 rounded">
                  {matrixStats.norte.reduce((a, b) => a + b.count, 0)} hechos
                </span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 pt-1">
                {matrixStats.norte.map((sub) => {
                  const style = getHeatStyle(sub.intensity, sub.count);
                  return (
                    <button
                      key={sub.code}
                      onClick={() => onSelectSubsector?.(sub.code)}
                      className={`text-left p-2 rounded-lg border transition-all flex flex-col justify-between ${style.bg} ${style.border} ${style.glow}`}
                      title={`${sub.code}: ${sub.name} - ${sub.count} atenciones`}
                    >
                      <div className="flex items-center justify-between gap-1 w-full">
                        <span className="font-black text-xs font-mono">{sub.code}</span>
                        <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono font-bold ${style.pill}`}>
                          {sub.count}
                        </span>
                      </div>
                      <span className="text-[10px] font-bold text-slate-700 truncate block mt-1" title={sub.name}>
                        {sub.name}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 2. ZONA CENTRO */}
            <div className="bg-slate-50/70 rounded-lg border border-slate-300 p-2 flex flex-col gap-1.5">
              <div
                onClick={() => onSelectZona?.('ZONA CENTRO')}
                className="flex items-center justify-between text-xs font-black uppercase text-blue-900 pb-1 border-b border-blue-200 cursor-pointer hover:text-blue-700"
              >
                <span>ZONA CENTRO (CIA Buenos Aires)</span>
                <span className="text-[10px] font-mono bg-blue-100 text-blue-800 px-1.5 py-0.5 rounded">
                  {matrixStats.centro.reduce((a, b) => a + b.count, 0)} hechos
                </span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 pt-1">
                {matrixStats.centro.map((sub) => {
                  const style = getHeatStyle(sub.intensity, sub.count);
                  return (
                    <button
                      key={sub.code}
                      onClick={() => onSelectSubsector?.(sub.code)}
                      className={`text-left p-2 rounded-lg border transition-all flex flex-col justify-between ${style.bg} ${style.border} ${style.glow}`}
                      title={`${sub.code}: ${sub.name} - ${sub.count} atenciones`}
                    >
                      <div className="flex items-center justify-between gap-1 w-full">
                        <span className="font-black text-xs font-mono">{sub.code}</span>
                        <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono font-bold ${style.pill}`}>
                          {sub.count}
                        </span>
                      </div>
                      <span className="text-[10px] font-bold text-slate-700 truncate block mt-1" title={sub.name}>
                        {sub.name}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 3. ZONA SUR */}
            <div className="bg-slate-50/70 rounded-lg border border-slate-300 p-2 flex flex-col gap-1.5">
              <div
                onClick={() => onSelectZona?.('ZONA SUR')}
                className="flex items-center justify-between text-xs font-black uppercase text-indigo-900 pb-1 border-b border-indigo-200 cursor-pointer hover:text-indigo-700"
              >
                <span>ZONA SUR (Expansión Urbana)</span>
                <span className="text-[10px] font-mono bg-indigo-100 text-indigo-800 px-1.5 py-0.5 rounded">
                  {matrixStats.sur.reduce((a, b) => a + b.count, 0)} hechos
                </span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 pt-1">
                {matrixStats.sur.map((sub) => {
                  const style = getHeatStyle(sub.intensity, sub.count);
                  return (
                    <button
                      key={sub.code}
                      onClick={() => onSelectSubsector?.(sub.code)}
                      className={`text-left p-2 rounded-lg border transition-all flex flex-col justify-between ${style.bg} ${style.border} ${style.glow}`}
                      title={`${sub.code}: ${sub.name} - ${sub.count} atenciones`}
                    >
                      <div className="flex items-center justify-between gap-1 w-full">
                        <span className="font-black text-xs font-mono">{sub.code}</span>
                        <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono font-bold ${style.pill}`}>
                          {sub.count}
                        </span>
                      </div>
                      <span className="text-[10px] font-bold text-slate-700 truncate block mt-1" title={sub.name}>
                        {sub.name}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* Auxiliary Summary Table (=FILTER in Excel) */
        <div className="flex-1 flex flex-col gap-2 overflow-hidden">
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-600 font-medium">
              Fórmula evaluada: <code className="bg-slate-100 px-1.5 py-0.5 rounded text-blue-700 font-mono font-bold">=FILTRAR(Base, Observación='{textFilter || 'Todo'}')</code>
            </span>
            <button
              onClick={handleExportFiltered}
              className="px-2.5 py-1 rounded bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold flex items-center gap-1 shadow-xs transition-colors"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Descargar Tabla Filtrada</span>
            </button>
          </div>

          <div className="flex-1 overflow-x-auto border border-slate-200 rounded-lg max-h-[360px]">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#0f2c4c] text-white uppercase text-[10px] tracking-wider sticky top-0 z-10">
                <tr>
                  <th className="p-2 border-r border-slate-700">Cód / Columna 1</th>
                  <th className="p-2 border-r border-slate-700">Observación / Detalle</th>
                  <th className="p-2 border-r border-slate-700">Tipo Incidencia</th>
                  <th className="p-2 border-r border-slate-700">Sector</th>
                  <th className="p-2 border-r border-slate-700">Zona</th>
                  <th className="p-2 border-r border-slate-700">Turno</th>
                  <th className="p-2">Fecha y Hora</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 font-medium">
                {filteredByFormula.slice(0, 50).map((r) => (
                  <tr key={r.id} className="hover:bg-blue-50/50 transition-colors">
                    <td className="p-2 font-mono font-bold text-blue-900 whitespace-nowrap border-r border-slate-100">
                      {r.columna1 || r.codigo || r.id}
                    </td>
                    <td className="p-2 border-r border-slate-100 text-slate-800 max-w-sm">
                      <span className="line-clamp-2" title={r.observacion || r.descripcion || r.ubicacion}>
                        {r.observacion || r.descripcion || r.ubicacion}
                      </span>
                    </td>
                    <td className="p-2 font-bold text-slate-800 border-r border-slate-100 whitespace-nowrap">
                      {r.tipoIncidencia}
                    </td>
                    <td className="p-2 font-mono font-bold text-blue-800 border-r border-slate-100 whitespace-nowrap">
                      {r.subsector}
                    </td>
                    <td className="p-2 border-r border-slate-100 whitespace-nowrap text-slate-600">
                      {r.zona}
                    </td>
                    <td className="p-2 border-r border-slate-100 whitespace-nowrap">
                      <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-700">
                        {r.turno}
                      </span>
                    </td>
                    <td className="p-2 whitespace-nowrap text-slate-600 text-[11px]">
                      {r.fecha} {r.hora}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );

  if (isFullScreen) {
    return (
      <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 sm:p-6 animate-fadeIn">
        <div className="bg-white rounded-xl shadow-2xl border-4 border-[#124270] w-full max-w-7xl h-[90vh] flex flex-col p-4 overflow-hidden">
          {content}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg border-2 border-slate-300 shadow-md p-3 overflow-hidden">
      {content}
    </div>
  );
};
