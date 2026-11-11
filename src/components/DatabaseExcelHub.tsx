import React, { useState, useMemo } from 'react';
import {
  FileSpreadsheet,
  Upload,
  Download,
  CheckCircle2,
  AlertCircle,
  Search,
  Filter,
  Trash2,
  MapPin,
  RefreshCw,
  Database,
  ArrowUpDown,
  Sparkles,
  FileCheck,
  Save,
  HardDrive,
  Table,
  FileText,
} from 'lucide-react';
import { IncidentRecord } from '../types';
import { MESES_LIST } from '../data/mockData';
import {
  parseAndConvertExcel,
  generateSampleTemplateExcel,
  exportIncidentsToExcel,
} from '../utils/excelHelper';
import {
  exportBackupSnapshot,
  importBackupSnapshot,
} from '../utils/persistenceHelper';
import { EditableText } from './EditableText';
import { AnnualConsolidatedModal } from './AnnualConsolidatedModal';
import {
  getAnnualConsolidatedData,
  exportAnnualConsolidatedExcel,
  exportAnnualConsolidatedPDF,
} from '../utils/reportGenerator';

interface DatabaseExcelHubProps {
  records: IncidentRecord[];
  isCustomDataLoaded: boolean;
  onDataImported: (newRecords: IncidentRecord[], append: boolean) => void;
  onResetToDefault: () => void;
  onDeleteRecord?: (id: string) => void;
  onViewOnMap?: (record: IncidentRecord) => void;
  onSaveChanges?: () => void;
  lastSavedAt?: string | null;
  hasUnsavedChanges?: boolean;
  onOpenUploadModal?: () => void;
}

export const DatabaseExcelHub: React.FC<DatabaseExcelHubProps> = ({
  records,
  isCustomDataLoaded,
  onDataImported,
  onResetToDefault,
  onDeleteRecord,
  onViewOnMap,
  onSaveChanges,
  lastSavedAt,
  hasUnsavedChanges = false,
  onOpenUploadModal,
}) => {
  const [dragActive, setDragActive] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Sub-vista: Registros detallados o Consolidado Anual
  const [hubTab, setHubTab] = useState<'REGISTROS' | 'CONSOLIDADO'>('REGISTROS');
  const [matrixSearchTerm, setMatrixSearchTerm] = useState('');
  const [isAnnualModalOpen, setIsAnnualModalOpen] = useState(false);

  // Table search & pagination
  const [searchTerm, setSearchTerm] = useState('');
  const [filterZona, setFilterZona] = useState('TODAS');
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 15;

  // Matriz de datos consolidada anual 2026 (tipo Imagen 2)
  const annualData = useMemo(() => {
    return getAnnualConsolidatedData(records);
  }, [records]);

  const filteredMatrixRows = useMemo(() => {
    if (!matrixSearchTerm.trim()) return annualData.rows;
    const q = matrixSearchTerm.toLowerCase();
    return annualData.rows.filter((r) => r.incidencia.toLowerCase().includes(q));
  }, [annualData.rows, matrixSearchTerm]);

  const filtered = useMemo(() => {
    return records.filter((r) => {
      if (filterZona !== 'TODAS' && r.zona !== filterZona) return false;
      if (!searchTerm) return true;
      const q = searchTerm.toLowerCase();
      return (
        (r.codigo || '').toLowerCase().includes(q) ||
        (r.incidencia || r.tipoIncidencia || '').toLowerCase().includes(q) ||
        (r.lugar || r.ubicacion || '').toLowerCase().includes(q) ||
        (r.refe || '').toLowerCase().includes(q) ||
        (r.sector || r.subsector || '').toLowerCase().includes(q) ||
        (r.unidad || r.patrullero || '').toLowerCase().includes(q) ||
        (r.agente || r.efectivo || '').toLowerCase().includes(q) ||
        (r.comisar || r.comisaria || '').toLowerCase().includes(q) ||
        (r.observacion || '').toLowerCase().includes(q)
      );
    });
  }, [records, searchTerm, filterZona]);

  const totalPages = Math.ceil(filtered.length / pageSize) || 1;
  const paginated = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filtered.slice(start, start + pageSize);
  }, [filtered, currentPage]);

  const handleFileProcess = async (file: File) => {
    setLoading(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      const records = await parseAndConvertExcel(file);
      if (!records || records.length === 0) {
        setErrorMsg('No se encontraron registros legibles en el archivo. Verifique el formato.');
        setLoading(false);
        return;
      }

      onDataImported(records, false);
      setSuccessMsg(
        `¡Éxito! Se cargaron ${records.length} atenciones desde "${file.name}". Todo el sistema y mapa de calor se han sincronizado con su base de datos.`
      );
      setLoading(false);
    } catch (err: any) {
      setErrorMsg(err.message || 'Error al procesar el archivo Excel.');
      setLoading(false);
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileProcess(e.dataTransfer.files[0]);
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFileProcess(e.target.files[0]);
    }
  };

  const handleBackupJsonFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      try {
        setLoading(true);
        setErrorMsg(null);
        const result = await importBackupSnapshot(e.target.files[0]);
        onDataImported(result.records, false);
        setSuccessMsg(`¡Éxito! Se cargó el respaldo con ${result.recordsCount} registros y se guardaron en el sistema.`);
        setLoading(false);
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'Error al cargar el archivo de respaldo.';
        setErrorMsg(msg);
        setLoading(false);
      }
    }
  };

  return (
    <div className="flex-1 flex flex-col gap-3 min-w-0 text-white">
      {/* Top Banner: Excel Database Hub */}
      <div className="bg-[#0a182d] rounded-xl border border-cyan-500/30 p-4 shadow-xl flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-xl bg-gradient-to-br from-emerald-600 to-teal-800 text-white shadow-[0_0_15px_rgba(16,185,129,0.3)]">
            <Database className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <EditableText
                idKey="database_excel_title"
                defaultText="ADMINISTRADOR DE BASE DE DATOS EXCEL"
                as="h2"
                className="text-sm sm:text-base font-black uppercase tracking-wider text-cyan-200"
              />
              <span
                className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                  isCustomDataLoaded
                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                    : 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                }`}
              >
                {isCustomDataLoaded ? 'BASE PERSONALIZADA' : 'OFICIAL 2026 (1,804 OPS)'}
              </span>
            </div>
            <EditableText
              idKey="database_excel_subtitle"
              defaultText="Suba su archivo Excel (.xlsx / .xls) para que el mapa de calor, turnos y estadísticas operen 100% sobre sus propios datos."
              as="p"
              className="text-xs text-slate-400 mt-0.5 block"
            />
            {lastSavedAt && (
              <span className="text-[10px] text-emerald-300/90 font-mono flex items-center gap-1 mt-1 font-bold">
                <HardDrive className="w-3 h-3 text-emerald-400" />
                <span>Último guardado permanente: {lastSavedAt}</span>
              </span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* BOTONES OFICIALES: CONSOLIDADO GENERAL ANUAL */}
          <button
            onClick={() => exportAnnualConsolidatedExcel(annualData)}
            className="px-3.5 py-1.5 rounded-lg bg-emerald-700 hover:bg-emerald-600 text-white font-black text-xs flex items-center gap-1.5 transition-all shadow-[0_0_12px_rgba(16,185,129,0.3)] active:scale-95 border border-emerald-400"
            title="Exportar Consolidado Anual completo a Excel (.xlsx)"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-200" />
            <span>Exportar Consolidado Anual a Excel</span>
          </button>

          <button
            onClick={() => exportAnnualConsolidatedPDF(annualData)}
            className="px-3.5 py-1.5 rounded-lg bg-rose-700 hover:bg-rose-600 text-white font-black text-xs flex items-center gap-1.5 transition-all shadow-[0_0_12px_rgba(244,63,94,0.3)] active:scale-95 border border-rose-400"
            title="Exportar Consolidado Anual en formato PDF apaisado"
          >
            <FileText className="w-4 h-4 text-rose-200" />
            <span>Exportar a PDF</span>
          </button>

          <button
            onClick={() => setIsAnnualModalOpen(true)}
            className="px-3 py-1.5 rounded-lg bg-[#07203a] hover:bg-[#0b2b4d] border border-cyan-500/40 text-cyan-200 font-bold text-xs flex items-center gap-1.5 transition-colors shadow"
            title="Abrir vista emergente del Consolidado Anual"
          >
            <Table className="w-3.5 h-3.5 text-cyan-400" />
            <span>Ver Matriz Anual</span>
          </button>

          {/* BOTÓN OFICIAL: SUBIR ARCHIVO EXCEL */}
          <button
            onClick={onOpenUploadModal ? onOpenUploadModal : () => document.getElementById('excel-file-input')?.click()}
            className="px-3.5 py-1.5 rounded-lg bg-gradient-to-r from-blue-600 via-indigo-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white font-black text-xs flex items-center gap-1.5 transition-all shadow-[0_0_15px_rgba(6,182,212,0.4)] active:scale-95 border border-cyan-400"
            title="Subir archivo Excel oficial (.xlsx / .xls) para alimentar el sistema"
          >
            <Upload className="w-4 h-4 text-cyan-200" />
            <span>SUBIR EXCEL (BD)</span>
          </button>

          {/* BOTÓN OFICIAL: GUARDAR CAMBIOS */}
          {onSaveChanges && (
            <button
              onClick={onSaveChanges}
              className={`px-3.5 py-1.5 rounded-lg text-white font-black text-xs flex items-center gap-1.5 transition-all shadow-md active:scale-95 border ${
                hasUnsavedChanges
                  ? 'bg-gradient-to-r from-amber-500 to-orange-600 border-amber-300 ring-2 ring-amber-400/50 animate-pulse'
                  : 'bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-500 hover:to-teal-600 border-emerald-400/70 shadow-emerald-950/40'
              }`}
              title="Guardar de forma permanente en el navegador para que no sea necesario volver a meter datos al entrar al aplicativo"
            >
              <Save className="w-4 h-4 text-emerald-200" />
              <span>Guardar Cambios en Sistema</span>
            </button>
          )}

          <button
            onClick={generateSampleTemplateExcel}
            className="px-3 py-1.5 rounded-lg bg-[#061324] hover:bg-[#091b33] border border-cyan-700/60 text-cyan-300 font-bold text-xs flex items-center gap-1.5 transition-colors shadow"
            title="Descargar plantilla de Excel con formato de Nuevo Chimbote"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Descargar Plantilla</span>
          </button>

          <button
            onClick={() => exportBackupSnapshot(records)}
            className="px-3 py-1.5 rounded-lg bg-[#07203a] hover:bg-[#0b2b4d] border border-cyan-500/40 text-cyan-200 font-bold text-xs flex items-center gap-1.5 transition-colors shadow"
            title="Descargar copia de seguridad JSON portable"
          >
            <Download className="w-3.5 h-3.5 text-cyan-400" />
            <span>Respaldo JSON</span>
          </button>

          <label
            htmlFor="json-backup-input"
            className="px-3 py-1.5 rounded-lg bg-[#07203a] hover:bg-[#0b2b4d] border border-cyan-500/40 text-cyan-200 font-bold text-xs flex items-center gap-1.5 transition-colors shadow cursor-pointer"
            title="Restaurar copia de seguridad JSON"
          >
            <Upload className="w-3.5 h-3.5 text-cyan-400" />
            <span>Cargar Respaldo</span>
            <input
              type="file"
              id="json-backup-input"
              accept=".json"
              onChange={handleBackupJsonFile}
              className="hidden"
            />
          </label>

          <button
            onClick={() => exportIncidentsToExcel(records, 'Base_Datos_Serenazgo_Nuevo_Chimbote.xlsx')}
            className="px-3 py-1.5 rounded-lg bg-emerald-700/80 hover:bg-emerald-600 text-white font-bold text-xs flex items-center gap-1.5 transition-colors shadow"
          >
            <Download className="w-3.5 h-3.5 text-emerald-200" />
            <span>Exportar Todo</span>
          </button>

          <button
            onClick={onResetToDefault}
            className="px-3.5 py-1.5 rounded-lg bg-cyan-900/90 hover:bg-cyan-800 border border-cyan-400 text-cyan-100 font-bold text-xs flex items-center gap-1.5 transition-all shadow-md active:scale-95"
            title="Consultar y sincronizar con la base de datos Supabase en vivo (tabla registros)"
          >
            <RefreshCw className="w-3.5 h-3.5 text-cyan-300 animate-spin-hover" />
            <span>Sincronizar Supabase</span>
          </button>

          {isCustomDataLoaded && (
            <button
              onClick={onResetToDefault}
              className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 font-bold text-xs flex items-center gap-1.5 transition-colors"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Restablecer Datos Oficiales</span>
            </button>
          )}
        </div>
      </div>

      {/* Messages */}
      {errorMsg && (
        <div className="p-3 rounded-xl bg-rose-950/80 border border-rose-500 text-rose-200 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {successMsg && (
        <div className="p-3 rounded-xl bg-emerald-950/80 border border-emerald-500 text-emerald-200 text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span className="font-bold">{successMsg}</span>
        </div>
      )}

      {/* Visual Upload Dropzone */}
      <div
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        className={`rounded-xl border-2 border-dashed p-6 text-center transition-all bg-[#0a182d] flex flex-col items-center justify-center gap-3 relative ${
          dragActive
            ? 'border-cyan-400 bg-cyan-950/40 scale-[1.01] shadow-[0_0_20px_rgba(6,182,212,0.3)]'
            : 'border-cyan-700/40 hover:border-cyan-500/60'
        }`}
      >
        <input
          type="file"
          id="excel-file-input"
          accept=".xlsx, .xls, .csv"
          onChange={handleFileInput}
          className="hidden"
        />

        <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-cyan-600 to-blue-600 flex items-center justify-center text-white shadow-lg">
          <Upload className={`w-6 h-6 ${loading ? 'animate-bounce' : ''}`} />
        </div>

        <div>
          <div className="text-sm font-black uppercase text-white tracking-wide">
            {loading ? 'Procesando archivo Excel...' : 'Arrastre aquí su archivo Excel o haga clic para seleccionarlo'}
          </div>
          <p className="text-xs text-slate-400 mt-1 max-w-2xl mx-auto">
            El sistema detecta automáticamente tus <strong>25 columnas oficiales</strong>: FECHA, AÑO, UNIDAD, LUGAR, Columna1, INTEGRADO, REFE, OBSERVACION, SECTOR, ZONA, HORA, RANGO, INCIDENCIA, AGENTE, SERVICIO, ORIGEN, COMISAR, TIPO DE PA, MES, DIA, FECHA2, HORA DE ALERTA, HORA DE LLEGADA, PROMEDIO DE ATENCIÓN y TURNO.
          </p>
        </div>

        <label
          htmlFor="excel-file-input"
          className="px-5 py-2 rounded-lg bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-extrabold text-xs uppercase cursor-pointer shadow-[0_0_12px_rgba(6,182,212,0.3)] transition-transform active:scale-95"
        >
          Seleccionar Archivo de mi Computadora
        </label>
      </div>

      {/* Sub-navegación entre Registros Detallados y Consolidado General Anual */}
      <div className="flex items-center gap-2 border-b border-cyan-900/60 pb-2 flex-wrap">
        <button
          onClick={() => setHubTab('REGISTROS')}
          className={`px-4 py-2 rounded-lg text-xs font-black uppercase transition-all flex items-center gap-2 border ${
            hubTab === 'REGISTROS'
              ? 'bg-gradient-to-r from-blue-700 to-indigo-700 text-white border-cyan-400 shadow-[0_0_15px_rgba(6,182,212,0.3)]'
              : 'bg-[#08182b] text-slate-400 border-cyan-900/40 hover:bg-[#0c2440] hover:text-cyan-200'
          }`}
        >
          <Database className="w-4 h-4 text-cyan-300" />
          <span>REGISTROS DETALLADOS ({records.length.toLocaleString()})</span>
        </button>

        <button
          onClick={() => setHubTab('CONSOLIDADO')}
          className={`px-4 py-2 rounded-lg text-xs font-black uppercase transition-all flex items-center gap-2 border ${
            hubTab === 'CONSOLIDADO'
              ? 'bg-gradient-to-r from-blue-700 to-indigo-700 text-white border-cyan-400 shadow-[0_0_15px_rgba(6,182,212,0.3)]'
              : 'bg-[#08182b] text-slate-400 border-cyan-900/40 hover:bg-[#0c2440] hover:text-cyan-200'
          }`}
        >
          <Table className="w-4 h-4 text-cyan-300" />
          <span>CONSOLIDADO GENERAL ANUAL 2026 (MATRIZ CRUZADA)</span>
        </button>
      </div>

      {hubTab === 'CONSOLIDADO' ? (
        /* VISTA DE LA MATRIZ CONSOLIDADA ANUAL (TIPO IMAGEN 2) */
        <div className="bg-[#0a182d] rounded-xl border-2 border-cyan-500/40 p-4 shadow-xl flex flex-col gap-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-cyan-900/60">
            <div>
              <h3 className="text-sm font-black uppercase tracking-wider text-cyan-200 flex items-center gap-2">
                <Table className="w-4 h-4 text-cyan-400" />
                <span>CONSOLIDADO GENERAL DE INCIDENCIAS &bull; PERIODO ANUAL 2026</span>
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Matriz comparativa de 12 meses por tipo de conflicto. Total: {annualData.totalGeneral.toLocaleString()} atenciones.
              </p>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <div className="relative w-full sm:w-64">
                <Search className="w-3.5 h-3.5 text-cyan-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={matrixSearchTerm}
                  onChange={(e) => setMatrixSearchTerm(e.target.value)}
                  placeholder="Buscar en la matriz..."
                  className="w-full pl-8 pr-3 py-1.5 text-xs bg-[#05101d] border border-cyan-800 rounded-lg text-cyan-100 placeholder-slate-500 focus:outline-none focus:border-cyan-400"
                />
              </div>

              <button
                onClick={() => exportAnnualConsolidatedExcel(annualData)}
                className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-1.5 shadow"
                title="Exportar Consolidado Anual a Excel (.xlsx)"
              >
                <FileSpreadsheet className="w-3.5 h-3.5" />
                <span>Exportar Consolidado Anual a Excel</span>
              </button>

              <button
                onClick={() => exportAnnualConsolidatedPDF(annualData)}
                className="px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs flex items-center gap-1.5 shadow"
                title="Exportar a PDF oficial"
              >
                <FileText className="w-3.5 h-3.5" />
                <span>Exportar a PDF</span>
              </button>
            </div>
          </div>

          {/* TABLA DE LA MATRIZ CRUZADA */}
          <div className="overflow-x-auto border border-cyan-900/60 rounded-lg bg-[#050e1a]">
            <table className="w-full text-left text-[11px] border-collapse min-w-[980px]">
              <thead>
                <tr className="bg-gradient-to-r from-[#07172e] via-[#0b2447] to-[#07172e] text-cyan-200 uppercase text-[10px] font-black tracking-wider border-b border-cyan-800">
                  <th className="p-2 w-10 text-center border-r border-cyan-900">N°</th>
                  <th className="p-2 min-w-[260px] border-r border-cyan-900">PRINCIPALES CONFLICTOS MÁS COMUNES</th>
                  {MESES_LIST.map((m) => (
                    <th key={m} className="p-2 text-center w-14 border-r border-cyan-900">
                      {m.slice(0, 3)}
                    </th>
                  ))}
                  <th className="p-2 text-center w-18 border-r border-cyan-900 bg-blue-950 font-black text-amber-300">
                    TOTAL
                  </th>
                  <th className="p-2 text-center w-14 bg-blue-950 font-black text-emerald-300">
                    %
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-cyan-950 text-slate-300">
                {filteredMatrixRows.map((r, idx) => (
                  <tr key={r.incidencia} className="hover:bg-cyan-950/40 transition-colors">
                    <td className="p-1.5 text-center text-slate-500 font-mono font-bold border-r border-cyan-950">
                      {idx + 1}
                    </td>
                    <td className="p-1.5 font-bold text-white border-r border-cyan-950 text-[10.5px]">
                      {r.incidencia}
                    </td>
                    {MESES_LIST.map((m) => {
                      const count = r.meses[m] || 0;
                      return (
                        <td
                          key={m}
                          className={`p-1.5 text-center font-mono border-r border-cyan-950 ${
                            count > 0 ? 'font-bold text-cyan-200' : 'text-slate-600'
                          }`}
                        >
                          {count > 0 ? count.toLocaleString() : '-'}
                        </td>
                      );
                    })}
                    <td className="p-1.5 text-center font-mono font-black text-amber-300 bg-cyan-950/30 border-r border-cyan-950">
                      {r.total.toLocaleString()}
                    </td>
                    <td className="p-1.5 text-center font-mono font-bold text-slate-300 bg-cyan-950/20">
                      {r.porcentaje.toFixed(2)}%
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                {/* 1. TOTAL DE INCIDENCIAS POR MES */}
                <tr className="bg-gradient-to-r from-blue-950 via-indigo-950 to-blue-950 text-white font-black border-t-2 border-cyan-600 text-[11px]">
                  <td className="p-2 border-r border-cyan-800"></td>
                  <td className="p-2 uppercase tracking-wider border-r border-cyan-800 text-cyan-200">
                    TOTAL DE INCIDENCIAS POR MES DEL PERIODO {annualData.anio}
                  </td>
                  {MESES_LIST.map((m) => (
                    <td key={`tot-${m}`} className="p-2 text-center font-mono font-black text-cyan-200 border-r border-cyan-800">
                      {annualData.totalesPorMes[m] > 0 ? annualData.totalesPorMes[m].toLocaleString() : '-'}
                    </td>
                  ))}
                  <td className="p-2 text-center font-mono font-black text-amber-300 text-xs border-r border-cyan-800 bg-black/40">
                    {annualData.totalGeneral.toLocaleString()}
                  </td>
                  <td className="p-2 text-center font-mono font-black text-emerald-300 bg-black/40">
                    100.00%
                  </td>
                </tr>
                {/* 2. FILA DE PORCENTAJES */}
                <tr className="bg-[#050e1a] text-slate-300 font-black border-t border-cyan-900 text-[10px]">
                  <td className="p-1.5 border-r border-cyan-900"></td>
                  <td className="p-1.5 uppercase tracking-wider border-r border-cyan-900 text-slate-400">
                    PORCENTAJES
                  </td>
                  {MESES_LIST.map((m) => (
                    <td key={`pct-${m}`} className="p-1.5 text-center font-mono text-cyan-300/80 border-r border-cyan-900">
                      {annualData.totalesPorMes[m] > 0 ? `${annualData.porcentajesPorMes[m].toFixed(2)}%` : '-'}
                    </td>
                  ))}
                  <td className="p-1.5 text-center font-mono text-slate-500 border-r border-cyan-900">
                    -
                  </td>
                  <td className="p-1.5 text-center font-mono font-black text-emerald-400">
                    100.00%
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      ) : (
        /* Interactive Data Table Explorer */
        <div className="bg-[#0a182d] rounded-xl border border-cyan-500/30 p-3.5 shadow-xl flex flex-col gap-3">
          {/* Table Toolbar */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pb-2 border-b border-cyan-900/50">
            <div className="flex items-center gap-2">
              <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
              <h3 className="text-xs font-black uppercase tracking-wider text-cyan-200">
                EXPLORADOR DE REGISTROS ({filtered.length} de {records.length})
              </h3>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <div className="relative flex-1 sm:w-64">
                <Search className="w-3.5 h-3.5 text-cyan-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value);
                    setCurrentPage(1);
                  }}
                  placeholder="Filtrar por palabra clave..."
                  className="w-full pl-8 pr-3 py-1.5 text-xs bg-[#05101d] border border-cyan-800 rounded-lg text-cyan-100 placeholder-slate-500 focus:outline-none focus:border-cyan-400"
                />
              </div>

              <select
                value={filterZona}
                onChange={(e) => {
                  setFilterZona(e.target.value);
                  setCurrentPage(1);
                }}
                className="bg-[#05101d] border border-cyan-800 rounded-lg px-2.5 py-1.5 text-xs text-cyan-200 font-bold focus:outline-none"
              >
                <option value="TODAS">Todas las Zonas</option>
                <option value="ZONA CENTRO">Zona Centro</option>
                <option value="ZONA NORTE">Zona Norte</option>
                <option value="ZONA SUR">Zona Sur</option>
              </select>
            </div>
          </div>

        {/* Table Content */}
        <div className="overflow-x-auto border border-cyan-900/50 rounded-lg">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#050e1a] text-cyan-300 uppercase text-[10px] font-black tracking-wider border-b border-cyan-900/60">
              <tr>
                <th className="p-2.5">Fecha & Hora</th>
                <th className="p-2.5">Sector & Zona</th>
                <th className="p-2.5">Incidencia</th>
                <th className="p-2.5">Lugar & Referencia</th>
                <th className="p-2.5">Unidad</th>
                <th className="p-2.5">Agente</th>
                <th className="p-2.5">Comisaría</th>
                <th className="p-2.5">Turno</th>
                <th className="p-2.5 text-center">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-cyan-950 text-slate-300">
              {paginated.length === 0 ? (
                <tr>
                  <td colSpan={9} className="p-8 text-center text-slate-500">
                    No se encontraron registros con los términos indicados.
                  </td>
                </tr>
              ) : (
                paginated.map((r) => (
                  <tr key={r.id} className="hover:bg-[#071322] transition-colors">
                    <td className="p-2.5 whitespace-nowrap text-slate-400 font-mono">
                      <div className="text-white font-bold">{r.fecha}</div>
                      <div className="text-[10px] text-cyan-400">{r.hora}</div>
                    </td>
                    <td className="p-2.5 whitespace-nowrap">
                      <strong className="text-cyan-300 font-bold">{r.sector || r.subsector}</strong>
                      <span className="text-[10px] text-slate-400 block">{r.zona}</span>
                    </td>
                    <td className="p-2.5 font-bold text-white whitespace-nowrap">
                      {r.incidencia || r.tipoIncidencia}
                    </td>
                    <td className="p-2.5 max-w-xs text-slate-300">
                      <div className="truncate font-semibold">{r.lugar || r.ubicacion}</div>
                      {r.refe && <div className="text-[10px] text-slate-500 truncate">Ref: {r.refe}</div>}
                    </td>
                    <td className="p-2.5 text-cyan-200 whitespace-nowrap font-mono text-[11px]">
                      {r.unidad || r.patrullero || '—'}
                    </td>
                    <td className="p-2.5 text-slate-300 whitespace-nowrap text-[11px]">
                      {r.agente || r.efectivo || '—'}
                    </td>
                    <td className="p-2.5 text-slate-400 whitespace-nowrap text-[11px]">
                      {r.comisar || r.comisaria}
                    </td>
                    <td className="p-2.5 whitespace-nowrap">
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                          r.turno === 'TARDE'
                            ? 'bg-amber-950 text-amber-300 border border-amber-600/40'
                            : r.turno === 'MAÑANA'
                            ? 'bg-cyan-950 text-cyan-300 border border-cyan-600/40'
                            : 'bg-indigo-950 text-indigo-300 border border-indigo-600/40'
                        }`}
                      >
                        {r.turno}
                      </span>
                    </td>
                    <td className="p-2.5 text-center whitespace-nowrap">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          onClick={() => onViewOnMap?.(r)}
                          className="p-1 rounded text-cyan-400 hover:bg-cyan-950/60"
                          title="Ver en Mapa Táctico"
                        >
                          <MapPin className="w-3.5 h-3.5" />
                        </button>
                        {onDeleteRecord && (
                          <button
                            onClick={() => onDeleteRecord(r.id)}
                            className="p-1 rounded text-rose-400 hover:bg-rose-950/60"
                            title="Eliminar Registro"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-2 pt-2 border-t border-cyan-900/50 text-xs text-slate-400">
          <div>
            Página <strong className="text-white">{currentPage}</strong> de{' '}
            <strong className="text-white">{totalPages}</strong> &bull; Mostrando{' '}
            {Math.min(filtered.length, (currentPage - 1) * pageSize + 1)} -{' '}
            {Math.min(filtered.length, currentPage * pageSize)} de {filtered.length} atenciones
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={() => setCurrentPage(1)}
              disabled={currentPage === 1}
              className="px-2.5 py-1 rounded bg-[#050e1a] border border-cyan-900 disabled:opacity-40 hover:bg-cyan-950 text-cyan-300 font-bold"
            >
              &laquo;
            </button>
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="px-2.5 py-1 rounded bg-[#050e1a] border border-cyan-900 disabled:opacity-40 hover:bg-cyan-950 text-cyan-300 font-bold"
            >
              Anterior
            </button>
            <span className="px-2 py-1 font-bold text-white font-mono">{currentPage}</span>
            <button
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="px-2.5 py-1 rounded bg-[#050e1a] border border-cyan-900 disabled:opacity-40 hover:bg-cyan-950 text-cyan-300 font-bold"
            >
              Siguiente
            </button>
            <button
              onClick={() => setCurrentPage(totalPages)}
              disabled={currentPage === totalPages}
              className="px-2.5 py-1 rounded bg-[#050e1a] border border-cyan-900 disabled:opacity-40 hover:bg-cyan-950 text-cyan-300 font-bold"
            >
              &raquo;
            </button>
          </div>
        </div>
      </div>
      )}

      {/* Modal Emergente para Consolidado Anual */}
      <AnnualConsolidatedModal
        isOpen={isAnnualModalOpen}
        onClose={() => setIsAnnualModalOpen(false)}
        records={records}
      />
    </div>
  );
};
