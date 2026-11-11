import React, { useState, useMemo } from 'react';
import {
  X,
  FileSpreadsheet,
  FileText,
  Printer,
  Search,
  Calendar,
  Layers,
  ArrowUpDown,
  CheckCircle2,
} from 'lucide-react';
import { IncidentRecord } from '../types';
import { MESES_LIST } from '../data/mockData';
import {
  getAnnualConsolidatedData,
  exportAnnualConsolidatedExcel,
  exportAnnualConsolidatedPDF,
} from '../utils/reportGenerator';

interface AnnualConsolidatedModalProps {
  isOpen: boolean;
  onClose: () => void;
  records: IncidentRecord[];
}

export const AnnualConsolidatedModal: React.FC<AnnualConsolidatedModalProps> = ({
  isOpen,
  onClose,
  records,
}) => {
  const [searchTerm, setSearchTerm] = useState('');

  const annualData = useMemo(() => {
    return getAnnualConsolidatedData(records);
  }, [records]);

  const filteredRows = useMemo(() => {
    if (!searchTerm.trim()) return annualData.rows;
    const q = searchTerm.toLowerCase();
    return annualData.rows.filter((r) => r.incidencia.toLowerCase().includes(q));
  }, [annualData.rows, searchTerm]);

  if (!isOpen) return null;

  const handleExportExcel = () => {
    exportAnnualConsolidatedExcel(annualData);
  };

  const handleExportPDF = () => {
    exportAnnualConsolidatedPDF(annualData);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-950/85 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white text-slate-800 w-full max-w-[96vw] xl:max-w-7xl max-h-[94vh] rounded-xl border-2 border-blue-900 shadow-2xl flex flex-col overflow-hidden">
        {/* ========================================================================= */}
        {/* CABECERA PRINCIPAL Y ACCIONES DE EXPORTACIÓN                              */}
        {/* ========================================================================= */}
        <div className="px-4 py-3 bg-gradient-to-r from-[#07172e] via-[#0b2447] to-[#124270] text-white flex flex-wrap items-center justify-between gap-3 border-b border-cyan-700/60 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 bg-cyan-500/20 rounded border border-cyan-400/40">
              <Layers className="w-5 h-5 text-cyan-300" />
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-black tracking-wide uppercase">
                CONSOLIDADO GENERAL ANUAL 2026 &bull; MATRIZ COMPLETA DE INCIDENCIAS
              </h2>
              <p className="text-[11px] text-cyan-200/90 font-medium">
                Municipalidad Distrital de Nuevo Chimbote &bull; Subgerencia de Seguridad Ciudadana
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              id="btn-export-annual-excel"
              onClick={handleExportExcel}
              className="px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-md transition-all hover:scale-[1.02] active:scale-95 border border-emerald-400/50"
              title="Exportar Consolidado Anual completo a hoja de cálculo Excel (.xlsx)"
            >
              <FileSpreadsheet className="w-4 h-4" />
              <span>Exportar Consolidado Anual a Excel</span>
            </button>

            <button
              id="btn-export-annual-pdf"
              onClick={handleExportPDF}
              className="px-3.5 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-md transition-all hover:scale-[1.02] active:scale-95 border border-rose-400/50"
              title="Exportar Consolidado Anual apaisado en PDF para impresión oficial"
            >
              <FileText className="w-4 h-4" />
              <span>Exportar a PDF</span>
            </button>

            <button
              onClick={() => window.print()}
              className="px-2.5 py-1.5 rounded-lg bg-blue-700 hover:bg-blue-600 text-white font-bold text-xs flex items-center gap-1.5 shadow transition-colors"
              title="Imprimir documento"
            >
              <Printer className="w-4 h-4" />
              <span className="hidden sm:inline">Imprimir</span>
            </button>

            <button
              onClick={onClose}
              className="p-1.5 text-slate-300 hover:text-white rounded-lg hover:bg-white/10 transition-colors ml-1"
              title="Cerrar modal"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* BARRA DE BÚSQUEDA Y METADATOS RESUMEN                                      */}
        {/* ========================================================================= */}
        <div className="bg-slate-100 border-b border-slate-300 px-4 py-2.5 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-700">
            <span className="bg-blue-900 text-white px-2 py-0.5 rounded font-mono font-bold text-[11px]">
              {annualData.totalGeneral.toLocaleString()} Registros
            </span>
            <span className="hidden md:inline text-slate-600">
              Periodo Enero a Diciembre 2026 &bull; {annualData.rows.length} Tipos de Conflictos
            </span>
          </div>

          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar conflicto en la matriz..."
              className="w-full pl-8 pr-3 py-1.5 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 font-sans"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs"
              >
                &times;
              </button>
            )}
          </div>
        </div>

        {/* ========================================================================= */}
        {/* TABLA MATRIZ CRUZADA COMPLETA (TIPO IMAGEN 2)                             */}
        {/* ========================================================================= */}
        <div className="p-3 sm:p-4 overflow-auto flex-1 text-slate-800 font-sans">
          <div className="border-2 border-slate-300 rounded-lg overflow-hidden shadow-sm bg-white min-w-[1000px]">
            <table className="w-full text-left text-[11px] border-collapse">
              <thead>
                <tr className="bg-gradient-to-r from-[#0b2447] via-[#124270] to-[#0b2447] text-white font-black uppercase text-[10px] tracking-wider">
                  <th className="py-2.5 px-2 w-10 text-center border-r border-blue-800">N°</th>
                  <th className="py-2.5 px-3 min-w-[280px] border-r border-blue-800">
                    PRINCIPALES CONFLICTOS MÁS COMUNES
                  </th>
                  {MESES_LIST.map((m) => (
                    <th
                      key={m}
                      className="py-2.5 px-1.5 text-center w-16 border-r border-blue-800"
                    >
                      {m.slice(0, 3)}
                    </th>
                  ))}
                  <th className="py-2.5 px-2 text-center w-20 border-r border-blue-800 bg-blue-900/90 font-black">
                    TOTAL
                  </th>
                  <th className="py-2.5 px-2 text-center w-16 bg-blue-950 font-black">
                    %
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-200">
                {filteredRows.map((r, idx) => (
                  <tr
                    key={r.incidencia}
                    className={`hover:bg-blue-50/70 transition-colors ${
                      idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/60'
                    }`}
                  >
                    <td className="py-1.5 px-2 text-center text-slate-500 font-mono font-bold border-r border-slate-200">
                      {idx + 1}
                    </td>
                    <td className="py-1.5 px-3 font-bold text-slate-800 border-r border-slate-200 uppercase text-[10.5px]">
                      {r.incidencia}
                    </td>
                    {MESES_LIST.map((m) => {
                      const count = r.meses[m] || 0;
                      return (
                        <td
                          key={m}
                          className={`py-1.5 px-1.5 text-center font-mono border-r border-slate-200 ${
                            count > 0 ? 'font-bold text-blue-950' : 'text-slate-300'
                          }`}
                        >
                          {count > 0 ? count.toLocaleString() : '-'}
                        </td>
                      );
                    })}
                    <td className="py-1.5 px-2 text-center font-mono font-black text-blue-900 bg-blue-50/50 border-r border-slate-200">
                      {r.total.toLocaleString()}
                    </td>
                    <td className="py-1.5 px-2 text-center font-mono font-bold text-slate-700 bg-slate-50">
                      {r.porcentaje.toFixed(2)}%
                    </td>
                  </tr>
                ))}
              </tbody>

              {/* FILAS INFERIORES DE TOTALES Y PORCENTAJES (OFICIAL IMAGEN 2) */}
              <tfoot>
                {/* 1. TOTAL DE INCIDENCIAS POR MES DEL PERIODO 2026 */}
                <tr className="bg-gradient-to-r from-blue-900 via-blue-950 to-blue-900 text-white font-black border-t-2 border-slate-400 text-[11px]">
                  <td className="py-2 px-2 text-center border-r border-blue-800"></td>
                  <td className="py-2.5 px-3 uppercase tracking-wider border-r border-blue-800 text-[10.5px]">
                    TOTAL DE INCIDENCIAS POR MES DEL PERIODO {annualData.anio}
                  </td>
                  {MESES_LIST.map((m) => (
                    <td
                      key={`tot-${m}`}
                      className="py-2.5 px-1.5 text-center font-mono font-black text-cyan-200 border-r border-blue-800"
                    >
                      {annualData.totalesPorMes[m] > 0
                        ? annualData.totalesPorMes[m].toLocaleString()
                        : '-'}
                    </td>
                  ))}
                  <td className="py-2.5 px-2 text-center font-mono font-black text-amber-300 text-xs border-r border-blue-800 bg-blue-950">
                    {annualData.totalGeneral.toLocaleString()}
                  </td>
                  <td className="py-2.5 px-2 text-center font-mono font-black text-emerald-300 bg-blue-950">
                    100.00%
                  </td>
                </tr>

                {/* 2. PORCENTAJES POR MES */}
                <tr className="bg-slate-200 text-slate-900 font-black border-t border-slate-300 text-[10px]">
                  <td className="py-2 px-2 text-center border-r border-slate-300"></td>
                  <td className="py-2 px-3 uppercase tracking-wider border-r border-slate-300">
                    PORCENTAJES
                  </td>
                  {MESES_LIST.map((m) => (
                    <td
                      key={`pct-${m}`}
                      className="py-2 px-1.5 text-center font-mono text-slate-800 border-r border-slate-300"
                    >
                      {annualData.totalesPorMes[m] > 0
                        ? `${annualData.porcentajesPorMes[m].toFixed(2)}%`
                        : '-'}
                    </td>
                  ))}
                  <td className="py-2 px-2 text-center font-mono text-slate-500 border-r border-slate-300 bg-slate-300/50">
                    -
                  </td>
                  <td className="py-2 px-2 text-center font-mono font-black text-blue-950 bg-slate-300">
                    100.00%
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>

        {/* PIE DEL MODAL CON BOTONES VISIBLES ADICIONALES */}
        <div className="bg-slate-50 border-t border-slate-300 px-4 py-2.5 flex items-center justify-between shrink-0">
          <span className="text-[11px] text-slate-600 font-medium">
            Formato oficial con las incidencias organizadas por meses &bull; Listo para presentación ejecutiva y auditoría
          </span>

          <div className="flex items-center gap-2">
            <button
              onClick={handleExportExcel}
              className="px-3 py-1 rounded bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-xs"
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              <span>Exportar Consolidado Anual a Excel</span>
            </button>
            <button
              onClick={handleExportPDF}
              className="px-3 py-1 rounded bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-xs"
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Exportar a PDF</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
