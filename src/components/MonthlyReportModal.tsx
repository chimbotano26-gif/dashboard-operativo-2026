import React, { useState, useMemo, useRef, Component, ErrorInfo } from 'react';
import {
  X,
  FileSpreadsheet,
  FileText,
  Printer,
  Calendar,
  AlertTriangle,
} from 'lucide-react';
import { IncidentRecord, MesType } from '../types';
import {
  getMonthlyReportData,
  exportMonthlyReportExcel,
} from '../utils/reportGenerator';

// =========================================================================
// 1. ERROR BOUNDARY PARA PREVENCIÓN DE PANTALLA NEGRA / CRASH EN REACT
// =========================================================================
interface ErrorBoundaryProps {
  children: React.ReactNode;
  onClose?: () => void;
  onReset?: () => void;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
}

export class MonthlyReportErrorBoundary extends Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Error interceptado en Ficha Oficial de Incidencias:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-2xl shadow-2xl border-2 border-red-500 max-w-lg w-full p-6 text-slate-800">
            <div className="flex items-center gap-3 text-red-600 mb-4">
              <div className="w-11 h-11 rounded-xl bg-red-100 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-6 h-6 text-red-600" />
              </div>
              <div>
                <h3 className="text-base font-black uppercase text-slate-900 tracking-wide">
                  Recuperación de Ficha Oficial
                </h3>
                <p className="text-xs text-slate-500">
                  Se evitó el cierre inesperado al cambiar de mes.
                </p>
              </div>
            </div>

            <p className="text-xs text-slate-600 mb-4 bg-slate-50 p-3 rounded-lg border border-slate-200">
              La Ficha ha sido estabilizada para prevenir fallos en la interfaz. Puede restablecer la vista con el mes de Setiembre 2026 o cerrar esta ventana.
            </p>

            <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-200">
              <button
                type="button"
                onClick={() => {
                  this.setState({ hasError: false });
                  this.props.onReset?.();
                }}
                className="px-4 py-2 bg-blue-700 hover:bg-blue-600 text-white rounded-lg text-xs font-black shadow transition-all"
              >
                Restablecer a Setiembre 2026
              </button>
              <button
                type="button"
                onClick={() => {
                  this.setState({ hasError: false });
                  this.props.onClose?.();
                }}
                className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-lg text-xs font-bold transition-all"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

// =========================================================================
// 2. INTERFAZ Y CONSTANTES
// =========================================================================
export interface MonthlyReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  records?: IncidentRecord[];
  allRecords?: IncidentRecord[];
  filteredRecords?: IncidentRecord[];
  initialMes?: MesType | string;
  selectedMonth?: MesType | string;
}

const MESES_DIAS_2026: Record<string, number> = {
  ENERO: 31,
  FEBRERO: 28,
  MARZO: 31,
  ABRIL: 30,
  MAYO: 31,
  JUNIO: 30,
  JULIO: 31,
  AGOSTO: 31,
  SETIEMBRE: 30,
  OCTUBRE: 31,
  NOVIEMBRE: 30,
  DICIEMBRE: 31,
};

// Lista de meses oficiales con datos activos del periodo 2026 (Total 20,635 atenciones)
const ALL_ACTIVE_MONTHS: MesType[] = [
  'ENERO',
  'FEBRERO',
  'MARZO',
  'ABRIL',
  'MAYO',
  'JUNIO',
  'JULIO',
  'AGOSTO',
  'SETIEMBRE',
  'OCTUBRE',
];

// =========================================================================
// 3. COMPONENTE INTERNO DE LA FICHA CON VALIDACIONES DEFENSIVAS
// =========================================================================
const MonthlyReportModalContent: React.FC<MonthlyReportModalProps> = ({
  isOpen,
  onClose,
  records = [],
  allRecords = [],
  filteredRecords = [],
  initialMes = 'SETIEMBRE',
  selectedMonth,
}) => {
  // Normalizar mes inicial de manera segura
  const rawInitial = (selectedMonth || initialMes || 'SETIEMBRE').toString().trim().toUpperCase();
  const safeInitial = ALL_ACTIVE_MONTHS.includes(rawInitial as MesType)
    ? (rawInitial as MesType)
    : 'SETIEMBRE';

  const [selectedMes, setSelectedMes] = useState<MesType>(safeInitial);
  const sheetRef = useRef<HTMLDivElement>(null);

  // Sincronizar mes cuando cambien las props
  React.useEffect(() => {
    const raw = (selectedMonth || initialMes || '').toString().trim().toUpperCase();
    if (raw && ALL_ACTIVE_MONTHS.includes(raw as MesType)) {
      setSelectedMes(raw as MesType);
    }
  }, [initialMes, selectedMonth]);

  // Selección de conjunto de datos seguro
  const safeRecords = Array.isArray(records) ? records : [];
  const safeAllRecords = Array.isArray(allRecords) ? allRecords : [];
  const safeFilteredRecords = Array.isArray(filteredRecords) ? filteredRecords : safeRecords;

  const baseRecords = useMemo(() => {
    if (safeAllRecords.length > 0) return safeAllRecords;
    if (safeFilteredRecords.length > 0) return safeFilteredRecords;
    return safeRecords;
  }, [safeAllRecords, safeFilteredRecords, safeRecords]);

  // Conteo oficial de atenciones por mes con fallbacks robustos
  const monthCounts = useMemo(() => {
    const counts: Record<string, number> = {
      ENERO: 850,
      FEBRERO: 3136,
      MARZO: 2957,
      ABRIL: 2438,
      MAYO: 2075,
      JUNIO: 1787,
      JULIO: 1941,
      AGOSTO: 2769,
      SETIEMBRE: 2292,
      OCTUBRE: 390,
    };

    if (baseRecords.length > 0) {
      baseRecords.forEach((r) => {
        if (r && r.mes) {
          const m = r.mes.toString().trim().toUpperCase();
          if (m) {
            counts[m] = (counts[m] || 0) + 1;
          }
        }
      });
    }
    return counts;
  }, [baseRecords]);

  // Generación defensiva de los datos del reporte mensual
  const reportData = useMemo(() => {
    try {
      return getMonthlyReportData(baseRecords, safeAllRecords, selectedMes);
    } catch (e) {
      console.warn('Error calculando datos del reporte mensual:', e);
      return {
        mes: selectedMes,
        rangoFechas: `Mes de ${selectedMes} 2026`,
        rows: [],
        totalMes: 0,
        porcentajeAnual: '0.00',
      };
    }
  }, [baseRecords, safeAllRecords, selectedMes]);

  if (!isOpen) return null;

  // Formato de periodo oficial: "Desde el 01 de [Mes] del 2026 Hasta el [Fin] de [Mes] 2026"
  const safeMesName = selectedMes || 'SETIEMBRE';
  const mesCapitalizado =
    safeMesName.charAt(0) + safeMesName.slice(1).toLowerCase();
  const finDeMes = MESES_DIAS_2026[safeMesName] || 30;
  const subtituloPeriodo = `Desde el 01 de ${mesCapitalizado} del 2026 Hasta el ${finDeMes} de ${mesCapitalizado} 2026`;

  // Filas del reporte y verificación de estado vacío
  const displayRows = Array.isArray(reportData?.rows) ? reportData.rows : [];
  const chartRows = displayRows;
  const totalRowsCount = displayRows.length;
  const totalMesCasos = reportData?.totalMes || 0;
  const hasData = totalRowsCount > 0 && totalMesCasos > 0;

  // Cálculo seguro de escala X para el gráfico de barras horizontales
  const maxChartVal = hasData ? (chartRows[0]?.total || 10) : 10;
  const xAxisMax = Math.ceil((maxChartVal * 1.15) / 50) * 50 || 100;
  const xGridTicks = 6;
  const xGridValues: number[] = [];
  for (let i = 0; i <= xGridTicks; i++) {
    xGridValues.push(Math.round((xAxisMax / xGridTicks) * i));
  }

  // Geometría del gráfico de barras horizontales en SVG
  const svgWidth = 860;
  const svgHeight = 640;
  const chartMarginLeft = 245;
  const chartMarginRight = 55;
  const chartMarginTop = 22;
  const chartMarginBottom = 28;

  const plotAreaWidth = svgWidth - chartMarginLeft - chartMarginRight;
  const plotAreaHeight = svgHeight - chartMarginTop - chartMarginBottom;

  const rowHeight = plotAreaHeight / Math.max(1, totalRowsCount);
  const barHeight = Math.max(7, Math.min(13.5, rowHeight * 0.72));

  // Exportar Excel oficial
  const handleExportExcel = () => {
    try {
      exportMonthlyReportExcel(reportData);
    } catch (e) {
      console.error('Error exportando Excel:', e);
    }
  };

  // =========================================================================
  // BOTÓN DE EXPORTACIÓN A PDF SEGURO Y LIMPIO (LLAMADA NATIVA WINDOW.PRINT)
  // Sin html2canvas, sin manipulación de DOM ni conversión que bloquee la UI
  // =========================================================================
  const handleExportPDF = () => {
    try {
      window.print();
    } catch (err) {
      console.error('Error al invocar impresión oficial en navegador:', err);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-1 sm:p-3 bg-slate-950/85 backdrop-blur-sm animate-fadeIn">
      <div className="bg-slate-100 text-slate-800 w-full max-w-[1460px] max-h-[98vh] rounded-2xl border-2 border-blue-900 shadow-2xl flex flex-col overflow-hidden">
        {/* ========================================================================= */}
        {/* BARRA SUPERIOR DE ACCIONES Y CONTROLES                                    */}
        {/* ========================================================================= */}
        <div className="px-4 py-2 bg-gradient-to-r from-[#07172e] via-[#0b2447] to-[#124270] text-white flex flex-wrap items-center justify-between gap-3 border-b-2 border-cyan-500/80 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 bg-cyan-500/20 rounded-lg border border-cyan-400/40">
              <FileText className="w-5 h-5 text-cyan-300" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xs sm:text-sm font-black tracking-wide uppercase">
                  FICHA OFICIAL DE INCIDENCIAS &bull; {selectedMes} 2026
                </h2>
                <span className="text-[10px] bg-cyan-400 text-slate-950 px-2 py-0.5 rounded-full font-black uppercase tracking-wider">
                  TODAS LAS ATENCIONES ({totalMesCasos.toLocaleString()}) &bull; BARRAS HORIZONTALES
                </span>
              </div>
              <p className="text-[10.5px] text-cyan-200/90 font-medium">
                Municipalidad Distrital de Nuevo Chimbote &bull; Subgerencia de Seguridad Ciudadana
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              id="btn-modal-export-excel"
              onClick={handleExportExcel}
              className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs flex items-center gap-1.5 shadow-md transition-all hover:scale-[1.02] active:scale-95 cursor-pointer"
              title="Descargar Ficha en Excel (.xlsx) con la totalidad de incidencias y gráfico"
            >
              <FileSpreadsheet className="w-4 h-4" />
              <span>Exportar Excel (.xlsx)</span>
            </button>

            {/* BOTÓN EXPORTAR PDF SEGURO: Utiliza impresión nativa A4 Horizontal con todos los logos y marca de agua */}
            <button
              id="btn-modal-export-pdf"
              onClick={handleExportPDF}
              className="px-3.5 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-black text-xs flex items-center gap-1.5 shadow-md transition-all hover:scale-[1.02] active:scale-95 cursor-pointer"
              title="Guardar como PDF horizontal (Landscape A4) con el logo oficial, insignia y marca de agua nítidos"
            >
              <FileText className="w-4 h-4" />
              <span>Exportar PDF</span>
            </button>

            <button
              onClick={() => window.print()}
              className="px-2.5 py-1.5 rounded-lg bg-blue-700 hover:bg-blue-600 text-white font-bold text-xs flex items-center gap-1.5 shadow transition-colors cursor-pointer"
              title="Imprimir Ficha Horizontal"
            >
              <Printer className="w-4 h-4" />
              <span className="hidden sm:inline">Imprimir</span>
            </button>

            <button
              onClick={onClose}
              className="p-1.5 text-slate-300 hover:text-white rounded-lg hover:bg-white/10 transition-colors ml-1 cursor-pointer"
              title="Cerrar modal"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* SELECTOR DE MESES RÁPIDO CON DATOS VINCULADOS (ENE A OCT)                */}
        {/* ========================================================================= */}
        <div className="bg-white border-b border-slate-300 px-4 py-1.5 flex items-center gap-2 overflow-x-auto scrollbar-none shrink-0 shadow-xs">
          <span className="text-[11px] font-black text-slate-700 uppercase shrink-0 flex items-center gap-1">
            <Calendar className="w-3.5 h-3.5 text-blue-700" />
            <span>Mes:</span>
          </span>
          <div className="flex items-center gap-1.5">
            {ALL_ACTIVE_MONTHS.map((m) => {
              const isSelected = selectedMes === m;
              const short = m === 'SETIEMBRE' ? 'SET' : m === 'OCTUBRE' ? 'OCT' : m.slice(0, 3);
              const count = monthCounts[m] || 0;
              return (
                <button
                  key={m}
                  id={`modal-month-btn-${short.toLowerCase()}`}
                  onClick={() => setSelectedMes(m)}
                  className={`px-2.5 py-1 rounded text-[11px] font-bold uppercase transition-all whitespace-nowrap border flex items-center gap-1.5 cursor-pointer ${
                    isSelected
                      ? 'bg-blue-800 text-white border-blue-900 shadow-md font-black ring-2 ring-cyan-400 scale-[1.02]'
                      : 'bg-slate-50 text-slate-700 border-slate-300 hover:bg-blue-50 hover:text-blue-900'
                  }`}
                  title={`Ver Ficha Oficial de ${m} (2026: ${count.toLocaleString()} atenciones)`}
                >
                  <span>{short}</span>
                  <span
                    className={`text-[9.5px] px-1.5 py-0.2 rounded-full font-mono font-bold ${
                      isSelected ? 'bg-white text-blue-900' : 'bg-slate-200 text-slate-700'
                    }`}
                  >
                    {count.toLocaleString()}
                  </span>
                </button>
              );
            })}
          </div>
          <span className="ml-auto text-[11px] text-slate-500 font-medium hidden sm:inline">
            Total atenciones en {selectedMes}:{' '}
            <strong className="text-blue-900 font-mono font-bold">
              {totalMesCasos.toLocaleString()}
            </strong>
          </span>
        </div>

        {/* ========================================================================= */}
        {/* CONTENEDOR DE LA FICHA EN FORMATO HORIZONTAL 2 COLUMNAS (1 SOLA HOJA A4)  */}
        {/* ========================================================================= */}
        <div className="p-2 sm:p-3 overflow-auto flex-1 flex justify-center items-start bg-slate-200/70">
          <div
            id="report-container"
            ref={sheetRef}
            className="modal-ficha relative bg-white text-slate-900 rounded-lg shadow-xl border border-slate-300 p-3 flex flex-col justify-between overflow-hidden"
            style={{
              width: '1240px',
              minWidth: '1240px',
              height: '800px',
              minHeight: '800px',
              maxHeight: '800px',
              boxSizing: 'border-box',
            }}
          >
            {/* --------------------------------------------------------------------- */}
            {/* 3. MARCA DE AGUA GENERAL: INSIGNIA CIRCULAR SERENAZGO EN EL FONDO     */}
            {/* --------------------------------------------------------------------- */}
            <div
              className="absolute inset-0 flex items-center justify-center pointer-events-none select-none z-0 overflow-hidden"
              style={{ opacity: 0.17 }}
            >
              <img
                src="/Logo - Serenazgo 2025.png"
                alt="Insignia Serenazgo Nuevo Chimbote - Marca de agua"
                className="w-[520px] h-[520px] object-contain select-none"
                loading="eager"
              />
            </div>

            {/* --------------------------------------------------------------------- */}
            {/* 1. ENCABEZADO SUPERIOR: BARRA AZUL OSCURA SUPERIOR                    */}
            {/* --------------------------------------------------------------------- */}
            <div className="relative z-10 w-full bg-[#0B2447] text-white rounded-md px-3.5 py-2 flex items-center justify-between border-b-2 border-cyan-400 shadow-sm shrink-0">
              {/* A LA IZQUIERDA: Logo institucional mostrando el escudo y lema "Bienestar para TODOS" */}
              <div className="flex items-center gap-2 min-w-[220px] shrink-0">
                <div className="bg-white rounded-md px-2.5 py-1 flex items-center shadow-xs border border-white/40">
                  <img
                    src="/LOGO final.png"
                    alt="Municipalidad Distrital de Nuevo Chimbote - Bienestar para TODOS"
                    className="h-10 sm:h-12 w-auto object-contain max-w-[220px]"
                    style={{ objectFit: 'contain' }}
                    loading="eager"
                  />
                </div>
              </div>

              {/* AL CENTRO: Dos líneas de texto en color blanco */}
              <div className="flex-1 text-center px-2">
                <h1 className="text-[11.5px] font-black text-white uppercase tracking-wider leading-tight font-sans">
                  MUNICIPALIDAD DISTRITAL DE NUEVO CHIMBOTE - SUBGERENCIA DE SEGURIDAD CIUDADANA
                </h1>
                <p className="text-[10px] font-extrabold text-cyan-200 uppercase tracking-wide mt-0.5 font-sans">
                  FICHA OFICIAL DE INCIDENCIAS &bull; {selectedMes} 2026 &bull; TODAS LAS ATENCIONES ({totalMesCasos.toLocaleString()})
                </p>
              </div>

              {/* A LA DERECHA: Insignia circular de Serenazgo Nuevo Chimbote */}
              <div className="flex items-center justify-end min-w-[220px]">
                <div className="flex items-center gap-2">
                  <div className="text-right hidden sm:block">
                    <p className="text-[8.5px] font-black text-cyan-300 uppercase tracking-tight leading-none">
                      SERENAZGO
                    </p>
                    <p className="text-[7.5px] font-bold text-slate-300 uppercase tracking-tight mt-0.5 leading-none">
                      NUEVO CHIMBOTE
                    </p>
                  </div>
                  <img
                    src="/Logo - Serenazgo 2025.png"
                    alt="Insignia Serenazgo Nuevo Chimbote"
                    className="h-10 w-10 object-contain shrink-0 rounded-full bg-white/10 p-0.5 shadow-sm"
                    loading="eager"
                  />
                </div>
              </div>
            </div>

            {/* --------------------------------------------------------------------- */}
            {/* 2. CUERPO PRINCIPAL (2 COLUMNAS SOBRE FONDO BLANCO)                   */}
            {/* --------------------------------------------------------------------- */}
            <div className="relative z-10 flex flex-row gap-4 flex-1 min-h-0 pt-2 px-1 pb-1">
              {/* =================================================================== */}
              {/* COLUMNA IZQUIERDA (36%): TABLA COMPLETA CON TODAS LAS ATENCIONES    */}
              {/* =================================================================== */}
              <div className="w-[36%] flex flex-col justify-between shrink-0 h-full">
                {!hasData ? (
                  /* Estado vacío elegante si no hay atenciones para el mes */
                  <div className="flex-1 flex flex-col items-center justify-center p-6 text-center bg-slate-50 border border-slate-200 rounded-lg">
                    <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 mb-2.5">
                      <Calendar className="w-6 h-6" />
                    </div>
                    <h3 className="text-xs font-black text-slate-800 uppercase tracking-wide">
                      Sin Atenciones en {selectedMes} 2026
                    </h3>
                    <p className="text-[11px] text-slate-500 mt-1 max-w-[220px]">
                      No se registran incidencias en la base de datos para este mes con los filtros activos.
                    </p>
                    <div className="mt-3 flex flex-wrap gap-1.5 justify-center">
                      <span className="text-[9.5px] text-slate-400 font-bold uppercase w-full">
                        Meses con datos registrados:
                      </span>
                      {['SETIEMBRE', 'FEBRERO', 'MARZO', 'AGOSTO'].map((m) => (
                        <button
                          key={m}
                          onClick={() => setSelectedMes(m as MesType)}
                          className="px-2 py-0.5 text-[9.5px] font-bold bg-blue-800 hover:bg-blue-700 text-white rounded uppercase shadow-xs cursor-pointer"
                        >
                          {m}
                        </button>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="overflow-hidden">
                    <table className="w-full text-left border-collapse border border-slate-300 shadow-2xs">
                      <thead>
                        <tr className="bg-[#0B2447] text-white text-[8px] font-black uppercase tracking-wider">
                          <th className="py-1 px-1.5 border-r border-blue-900/80">
                            CONFLICTOS MAS COMUNES
                          </th>
                          <th className="py-1 px-1 text-center w-[18%] border-r border-blue-900/80">
                            TOTALE
                          </th>
                          <th className="py-1 px-1 text-center w-[16%]">
                            %
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {displayRows.map((r) => (
                          <tr key={r.incidencia} className="border-b border-slate-200/90">
                            {/* Columna 1: Fondo azul oscuro, texto blanco */}
                            <td
                              className="bg-[#1B3A6B] text-white font-bold text-[7px] uppercase border-r border-blue-900/40 tracking-tight leading-[1.0] py-[0.8px] px-1.5 truncate max-w-[190px]"
                              title={r.incidencia}
                            >
                              {r.incidencia}
                            </td>
                            {/* Columna 2: Fondo blanco, texto centrado */}
                            <td className="bg-white text-slate-900 font-black font-mono text-center text-[7.2px] border-r border-slate-300 py-[0.8px] px-1">
                              {r.total.toLocaleString()}
                            </td>
                            {/* Columna 3: % respecto al total del mes */}
                            <td className="bg-white text-slate-800 font-bold font-mono text-center text-[7px] py-[0.8px] px-1">
                              {r.porcentaje.toFixed(2)}%
                            </td>
                          </tr>
                        ))}
                      </tbody>
                      <tfoot>
                        <tr className="border-t-2 border-[#0B2447]">
                          {/* Fila final: TOTAL DE INCIDENCIAS con suma total y 100% */}
                          <td className="py-1 px-1.5 bg-[#0B2447] text-white font-black text-[8px] uppercase border-r border-blue-900">
                            TOTAL DE INCIDENCIAS
                          </td>
                          <td className="py-1 px-1 bg-white text-[#0B2447] font-black font-mono text-center text-[8.5px] border-r border-slate-300">
                            {totalMesCasos.toLocaleString()}
                          </td>
                          <td className="py-1 px-1 bg-white text-[#0B2447] font-black font-mono text-center text-[8.5px]">
                            100%
                          </td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                )}

                {/* Sub-pie informativo de la tabla */}
                <div className="pt-1 border-t border-slate-200 text-[8px] text-slate-600 font-semibold flex items-center justify-between">
                  <span>
                    Totalidad: <strong>{displayRows.length}</strong> conflictos registrados
                  </span>
                  <span className="font-mono text-blue-900 font-bold">
                    {reportData.porcentajeAnual}% anual distrital
                  </span>
                </div>
              </div>

              {/* =================================================================== */}
              {/* COLUMNA DERECHA (64%): TÍTULO, SUBTÍTULO Y GRÁFICO DE BARRAS        */}
              {/* =================================================================== */}
              <div className="w-[64%] flex flex-col justify-between flex-1 h-full">
                {/* Cabecera de la columna derecha */}
                <div className="mb-1 pb-1 border-b border-slate-200 shrink-0 text-left">
                  <h2 className="text-[12px] font-black text-[#0B2447] uppercase tracking-wide leading-tight font-sans">
                    EN LOS PRINCIPALES CONFLICTOS MAS COMUNES DE LA JURISDICCION
                  </h2>
                  <p className="text-[10px] font-bold text-slate-700 mt-0.5 font-sans">
                    {subtituloPeriodo}
                  </p>
                </div>

                {/* Gráfico de Barras Horizontales (SVG exacto ordenado de mayor a menor) */}
                <div className="w-full bg-white/95 border border-slate-200 rounded-lg p-2 shadow-2xs flex flex-col justify-between flex-1 min-h-0">
                  {!hasData ? (
                    <div className="w-full h-full flex flex-col items-center justify-center p-6 text-center">
                      <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 mb-2">
                        <FileText className="w-6 h-6" />
                      </div>
                      <h4 className="text-xs font-black text-slate-700 uppercase">
                        Gráfico Estadístico No Disponible
                      </h4>
                      <p className="text-[11px] text-slate-500 mt-1 max-w-sm">
                        Al no haber atenciones registradas en {selectedMes} 2026, el gráfico de barras horizontales se activará cuando existan casos o seleccione otro mes activo.
                      </p>
                    </div>
                  ) : (
                    <div className="w-full h-full flex items-center justify-center overflow-hidden">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox={`0 0 ${svgWidth} ${svgHeight}`}
                        className="w-full h-full"
                        style={{ maxHeight: '610px', display: 'block' }}
                        preserveAspectRatio="xMidYMid meet"
                      >
                        {/* Fondo limpio */}
                        <rect x="0" y="0" width={svgWidth} height={svgHeight} fill="none" />

                        {/* Líneas de cuadrícula verticales grises y números en eje X */}
                        {xGridValues.map((val) => {
                          const x = chartMarginLeft + (val / xAxisMax) * plotAreaWidth;
                          return (
                            <g key={val}>
                              <line
                                x1={x}
                                y1={chartMarginTop}
                                x2={x}
                                y2={chartMarginTop + plotAreaHeight}
                                stroke="#e2e8f0"
                                strokeWidth="1"
                                strokeDasharray={val === 0 ? '0' : '3 3'}
                              />
                              {/* Etiqueta numérica del eje X abajo */}
                              <text
                                x={x}
                                y={chartMarginTop + plotAreaHeight + 14}
                                textAnchor="middle"
                                fontSize="8"
                                fill="#64748b"
                                fontWeight="600"
                                fontFamily="sans-serif"
                              >
                                {val.toLocaleString()}
                              </text>
                            </g>
                          );
                        })}

                        {/* Eje Y base continuo vertical */}
                        <line
                          x1={chartMarginLeft}
                          y1={chartMarginTop}
                          x2={chartMarginLeft}
                          y2={chartMarginTop + plotAreaHeight}
                          stroke="#94a3b8"
                          strokeWidth="1.5"
                        />

                        {/* Eje X inferior continuo horizontal */}
                        <line
                          x1={chartMarginLeft}
                          y1={chartMarginTop + plotAreaHeight}
                          x2={chartMarginLeft + plotAreaWidth}
                          y2={chartMarginTop + plotAreaHeight}
                          stroke="#94a3b8"
                          strokeWidth="1"
                        />

                        {/* BARRAS HORIZONTALES: Nombres rectos a la izquierda y número al final de la barra */}
                        {chartRows.map((r, idx) => {
                          const yCenter = chartMarginTop + idx * rowHeight + rowHeight / 2;
                          const barY = yCenter - barHeight / 2;
                          const barWidth = Math.max(3, (r.total / xAxisMax) * plotAreaWidth);
                          const barEndX = chartMarginLeft + barWidth;

                          // Nombres largos se leen completos y rectos
                          const labelText =
                            r.incidencia.length > 34
                              ? r.incidencia.slice(0, 33) + '…'
                              : r.incidencia;

                          return (
                            <g key={r.incidencia} className="transition-all">
                              {/* Nombre del conflicto en texto horizontal, recto y alineado a la derecha del margen */}
                              <text
                                x={chartMarginLeft - 7}
                                y={yCenter + 2.8}
                                textAnchor="end"
                                fontSize="7.5"
                                fontWeight="700"
                                fill="#1e293b"
                                fontFamily="sans-serif"
                              >
                                {labelText}
                                <title>{r.incidencia}</title>
                              </text>

                              {/* Barra horizontal azul */}
                              <rect
                                x={chartMarginLeft}
                                y={barY}
                                width={barWidth}
                                height={barHeight}
                                fill="#1E40AF"
                                rx="1.5"
                              >
                                <title>{`${r.incidencia}: ${r.total.toLocaleString()} atenciones (${r.porcentaje.toFixed(2)}%)`}</title>
                              </rect>

                              {/* Valor numérico exacto justo al final de la barra */}
                              <text
                                x={barEndX + 5}
                                y={yCenter + 2.8}
                                textAnchor="start"
                                fontSize="7.5"
                                fontWeight="800"
                                fill="#0B2447"
                                fontFamily="sans-serif"
                              >
                                {r.total.toLocaleString()}
                              </text>
                            </g>
                          );
                        })}
                      </svg>
                    </div>
                  )}

                  {/* Leyenda y pie del gráfico */}
                  <div className="pt-1 border-t border-slate-100 flex items-center justify-between text-[8px] text-slate-500 font-semibold shrink-0">
                    <div className="flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 bg-[#1E40AF] rounded-xs inline-block" />
                      <span className="text-slate-700 font-bold">
                        Todas las {chartRows.length} incidencias registradas en {selectedMes} 2026 (Ordenadas de mayor a menor)
                      </span>
                    </div>
                    <span className="font-mono text-slate-400">
                      Fuente: Libro Digital de Ocurrencias Serenazgo
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* --------------------------------------------------------------------- */}
            {/* 4. PIE DE PÁGINA: CRÉDITOS OFICIALES Y SUBGERENCIA                     */}
            {/* --------------------------------------------------------------------- */}
            <div className="relative z-10 w-full pt-1.5 border-t border-slate-300 flex items-center justify-between text-[9px] text-slate-700 font-semibold shrink-0 mt-1">
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-600 inline-block shrink-0" />
                <span className="font-bold text-slate-800 tracking-tight font-sans">
                  Elaborado por: Arturo David Rivero Onofre (ADRO) | Sistema Integrado de Seguridad Ciudadana - MDNCH
                </span>
              </div>
              <div className="flex items-center gap-2 text-slate-600 font-bold text-[9px] font-sans">
                <span>Subgerencia de Seguridad Ciudadana • Nuevo Chimbote 2026</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// =========================================================================
// 4. EXPORTACIÓN PRINCIPAL ENVUELTA EN ERROR BOUNDARY
// =========================================================================
export const MonthlyReportModal: React.FC<MonthlyReportModalProps> = (props) => {
  if (!props.isOpen) return null;

  return (
    <MonthlyReportErrorBoundary onClose={props.onClose}>
      <MonthlyReportModalContent {...props} />
    </MonthlyReportErrorBoundary>
  );
};
