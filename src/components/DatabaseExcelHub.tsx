import React, { useState, useMemo } from 'react';
import {
  FileSpreadsheet,
  Upload,
  Download,
  CheckCircle2,
  AlertCircle,
  Search,
  Trash2,
  MapPin,
  RefreshCw,
  Database,
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
  records?: IncidentRecord[];
  isCustomDataLoaded?: boolean;
  onDataImported?: (newRecords: IncidentRecord[], append: boolean) => void;
  onResetToDefault?: () => void;
  onDeleteRecord?: (id: string) => void;
  onViewOnMap?: (record: IncidentRecord) => void;
  onSaveChanges?: () => void;
  lastSavedAt?: string | null;
  hasUnsavedChanges?: boolean;
  onOpenUploadModal?: () => void;
}

export function DatabaseExcelHub({
  records = [],
  isCustomDataLoaded = false,
  onDataImported,
  onResetToDefault,
  onDeleteRecord,
  onViewOnMap,
  onSaveChanges,
  lastSavedAt,
  hasUnsavedChanges = false,
  onOpenUploadModal,
}: DatabaseExcelHubProps) {
  const safeRecords = Array.isArray(records) ? records : [];
  const [dragActive, setDragActive] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const [hubTab, setHubTab] = useState<'REGISTROS' | 'CONSOLIDADO'>('REGISTROS');
  const [matrixSearchTerm, setMatrixSearchTerm] = useState('');
  const [isAnnualModalOpen, setIsAnnualModalOpen] = useState(false);

  const [searchTerm, setSearchTerm] = useState('');
  const [filterZona, setFilterZona] = useState('TODAS');
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 15;

  const annualData = useMemo(() => {
    try {
      return getAnnualConsolidatedData(safeRecords);
    } catch {
      return { rows: [], totalesPorMes: {}, porcentajesPorMes: {}, totalGeneral: 0, anio: '2026' };
    }
  }, [safeRecords]);

  const filteredMatrixRows = useMemo(() => {
    if (!annualData || !annualData.rows) return [];
    if (!matrixSearchTerm.trim()) return annualData.rows;
    const q = matrixSearchTerm.toLowerCase();
    return annualData.rows.filter((r) => (r.incidencia || '').toLowerCase().includes(q));
  }, [annualData, matrixSearchTerm]);

  const filtered = useMemo(() => {
    return safeRecords.filter((r) => {
      if (!r) return false;
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
  }, [safeRecords, searchTerm, filterZona]);

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
      const recordsParsed = await parseAndConvertExcel(file);
      if (!recordsParsed || recordsParsed.length === 0) {
        setErrorMsg('No se encontraron registros legibles en el archivo. Verifique el formato.');
        setLoading(false);
        return;
      }

      onDataImported?.(recordsParsed, false);
      setSuccessMsg(
        `¡Éxito! Se cargaron ${recordsParsed.length} atenciones desde "${file.name}".`
      );
      setLoading(false);
    } catch (err: any) {
      setErrorMsg(err.message || 'Error al procesar el archivo Excel.');
      setLoading(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col gap-3 min-w-0 text-white">
      <div className="bg-[#0a182d] rounded-xl border border-cyan-500/30 p-4 shadow-xl flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-xl bg-gradient-to-br from-emerald-600 to-teal-800 text-white shadow">
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
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-500/40">
                {safeRecords.length} REGISTROS ACTIVOS
              </span>
            </div>
            {lastSavedAt && (
              <span className="text-[10px] text-emerald-300/90 font-mono flex items-center gap-1 mt-1 font-bold">
                <HardDrive className="w-3 h-3 text-emerald-400" />
                <span>Último guardado: {lastSavedAt}</span>
              </span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => exportAnnualConsolidatedExcel(annualData)}
            className="px-3.5 py-1.5 rounded-lg bg-emerald-700 hover:bg-emerald-600 text-white font-black text-xs flex items-center gap-1.5 transition-all shadow border border-emerald-400"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-200" />
            <span>Exportar Consolidado Anual</span>
          </button>

          <button
            onClick={() => setIsAnnualModalOpen(true)}
            className="px-3 py-1.5 rounded-lg bg-[#07203a] hover:bg-[#0b2b4d] border border-cyan-500/40 text-cyan-200 font-bold text-xs flex items-center gap-1.5"
          >
            <Table className="w-3.5 h-3.5 text-cyan-400" />
            <span>Ver Matriz Anual</span>
          </button>

          <button
            onClick={onOpenUploadModal ? onOpenUploadModal : () => document.getElementById('excel-file-input')?.click()}
            className="px-3.5 py-1.5 rounded-lg bg-gradient-to-r from-blue-600 to-cyan-600 text-white font-black text-xs flex items-center gap-1.5 border border-cyan-400"
          >
            <Upload className="w-4 h-4 text-cyan-200" />
            <span>SUBIR EXCEL (BD)</span>
          </button>

          {onSaveChanges && (
            <button
              onClick={onSaveChanges}
              className="px-3.5 py-1.5 rounded-lg bg-gradient-to-r from-emerald-600 to-teal-700 text-white font-black text-xs flex items-center gap-1.5 border border-emerald-400"
            >
              <Save className="w-4 h-4 text-emerald-200" />
              <span>Guardar Cambios</span>
            </button>
          )}

          {onResetToDefault && (
            <button
              onClick={onResetToDefault}
              className="px-3.5 py-1.5 rounded-lg bg-cyan-900/90 hover:bg-cyan-800 border border-cyan-400 text-cyan-100 font-bold text-xs flex items-center gap-1.5"
            >
              <RefreshCw className="w-3.5 h-3.5 text-cyan-300" />
              <span>Sincronizar Supabase</span>
            </button>
          )}
        </div>
      </div>

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

      {/* Sub-navegación */}
      <div className="flex items-center gap-2 border-b border-cyan-900/60 pb-2 flex-wrap">
        <button
          onClick={() => setHubTab('REGISTROS')}
          className={`px-4 py-2 rounded-lg text-xs font-black uppercase transition-all flex items-center gap-2 border ${
            hubTab === 'REGISTROS'
              ? 'bg-blue-700 text-white border-cyan-400'
              : 'bg-[#08182b] text-slate-400 border-cyan-900/40'
          }`}
        >
          <Database className="w-4 h-4 text-cyan-300" />
          <span>REGISTROS DETALLADOS ({safeRecords.length.toLocaleString()})</span>
        </button>

        <button
          onClick={() => setHubTab('CONSOLIDADO')}
          className={`px-4 py-2 rounded-lg text-xs font-black uppercase transition-all flex items-center gap-2 border ${
            hubTab === 'CONSOLIDADO'
              ? 'bg-blue-700 text-white border-cyan-400'
              : 'bg-[#08182b] text-slate-400 border-cyan-900/40'
          }`}
        >
          <Table className="w-4 h-4 text-cyan-300" />
          <span>CONSOLIDADO GENERAL ANUAL 2026</span>
        </button>
      </div>

      {hubTab === 'CONSOLIDADO' ? (
        <div className="bg-[#0a182d] rounded-xl border-2 border-cyan-500/40 p-4 shadow-xl flex flex-col gap-4">
          <div className="overflow-x-auto border border-cyan-900/60 rounded-lg bg-[#050e1a]">
            <table className="w-full text-left text-[11px] border-collapse min-w-[980px]">
              <thead>
                <tr className="bg-[#07172e] text-cyan-200 uppercase text-[10px] font-black border-b border-cyan-800">
                  <th className="p-2 w-10 text-center border-r border-cyan-900">N°</th>
                  <th className="p-2 min-w-[260px] border-r border-cyan-900">PRINCIPALES CONFLICTOS</th>
                  {MESES_LIST.map((m) => (
                    <th key={m} className="p-2 text-center w-14 border-r border-cyan-900">
                      {m.slice(0, 3)}
                    </th>
                  ))}
                  <th className="p-2 text-center w-18 border-r border-cyan-900 bg-blue-950 font-black text-amber-300">TOTAL</th>
                  <th className="p-2 text-center w-14 bg-blue-950 font-black text-emerald-300">%</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-cyan-950 text-slate-300">
                {filteredMatrixRows.map((r, idx) => (
                  <tr key={r.incidencia} className="hover:bg-cyan-950/40">
                    <td className="p-1.5 text-center text-slate-500 font-mono border-r border-cyan-950">{idx + 1}</td>
                    <td className="p-1.5 font-bold text-white border-r border-cyan-950">{r.incidencia}</td>
                    {MESES_LIST.map((m) => {
                      const count = r.meses?.[m] || 0;
                      return (
                        <td key={m} className="p-1.5 text-center font-mono border-r border-cyan-950">
                          {count > 0 ? count.toLocaleString() : '-'}
                        </td>
                      );
                    })}
                    <td className="p-1.5 text-center font-mono font-black text-amber-300 bg-cyan-950/30 border-r border-cyan-950">
                      {r.total.toLocaleString()}
                    </td>
                    <td className="p-1.5 text-center font-mono text-slate-300 bg-cyan-950/20">
                      {r.porcentaje.toFixed(2)}%
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="bg-[#0a182d] rounded-xl border border-cyan-500/30 p-3.5 shadow-xl flex flex-col gap-3">
          <div className="overflow-x-auto border border-cyan-900/50 rounded-lg">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#050e1a] text-cyan-300 uppercase text-[10px] font-black border-b border-cyan-900/60">
                <tr>
                  <th className="p-2.5">Fecha & Hora</th>
                  <th className="p-2.5">Sector & Zona</th>
                  <th className="p-2.5">Incidencia</th>
                  <th className="p-2.5">Lugar</th>
                  <th className="p-2.5 text-center">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-cyan-950 text-slate-300">
                {paginated.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="p-8 text-center text-slate-500">
                      No hay registros cargados. Sincroniza Supabase o sube un Excel.
                    </td>
                  </tr>
                ) : (
                  paginated.map((r) => (
                    <tr key={r.id} className="hover:bg-[#071322]">
                      <td className="p-2.5 text-slate-400 font-mono">
                        <div className="text-white font-bold">{r.fecha}</div>
                        <div className="text-[10px] text-cyan-400">{r.hora}</div>
                      </td>
                      <td className="p-2.5">
                        <strong className="text-cyan-300">{r.sector || r.subsector}</strong>
                      </td>
                      <td className="p-2.5 font-bold text-white">{r.incidencia || r.tipoIncidencia}</td>
                      <td className="p-2.5 text-slate-300">{r.lugar || r.ubicacion}</td>
                      <td className="p-2.5 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <button onClick={() => onViewOnMap?.(r)} className="p-1 text-cyan-400" title="Ver en Mapa">
                            <MapPin className="w-3.5 h-3.5" />
                          </button>
                          {onDeleteRecord && (
                            <button onClick={() => onDeleteRecord(r.id)} className="p-1 text-rose-400" title="Eliminar">
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
        </div>
      )}

      <AnnualConsolidatedModal
        isOpen={isAnnualModalOpen}
        onClose={() => setIsAnnualModalOpen(false)}
        records={safeRecords}
      />
    </div>
  );
}
