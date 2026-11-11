import React, { useState } from 'react';
import {
  X,
  Upload,
  FileSpreadsheet,
  Download,
  CheckCircle,
  AlertCircle,
  ArrowRight,
  Database,
  Sparkles,
  ClipboardPaste,
  RotateCcw,
  Check,
} from 'lucide-react';
import {
  parseExcelFile,
  parsePastedText,
  transformRowsToIncidents,
  downloadSampleExcelTemplate,
  OFFICIAL_EXCEL_COLUMNS,
  ColumnMapping,
} from '../utils/excelHelper';
import { IncidentRecord } from '../types';

interface ExcelUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onDataImported: (newRecords: IncidentRecord[], append: boolean) => void;
  onResetToDefault: () => void;
  isCustomDataLoaded: boolean;
  currentCount: number;
  onUploadFileToSupabase?: (file: File) => Promise<void>;
}

export const ExcelUploadModal: React.FC<ExcelUploadModalProps> = ({
  isOpen,
  onClose,
  onDataImported,
  onResetToDefault,
  isCustomDataLoaded,
  currentCount,
  onUploadFileToSupabase,
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'file' | 'paste'>('file');
  const [dragOver, setDragOver] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [pastedText, setPastedText] = useState('');
  const [headers, setHeaders] = useState<string[]>([]);
  const [rawRows, setRawRows] = useState<Record<string, unknown>[]>([]);
  const [detectedMapping, setDetectedMapping] = useState<ColumnMapping | null>(null);
  const [importMode, setImportMode] = useState<'replace' | 'append'>('replace');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [step, setStep] = useState<'input' | 'preview'>('input');

  if (!isOpen) return null;

  const handleProcessFile = async (file: File) => {
    setErrorMsg(null);
    setSelectedFile(file);
    try {
      const parsed = await parseExcelFile(file);
      setHeaders(parsed.headers);
      setRawRows(parsed.rawRows);
      setDetectedMapping(parsed.detectedMapping);
      setStep('preview');
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Error desconocido al leer el archivo.';
      setErrorMsg(`No se pudo procesar el archivo: ${message}`);
    }
  };

  const handleProcessPasted = () => {
    setErrorMsg(null);
    try {
      const parsed = parsePastedText(pastedText);
      setHeaders(parsed.headers);
      setRawRows(parsed.rawRows);
      setDetectedMapping(parsed.detectedMapping);
      setStep('preview');
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Error al procesar el texto pegado.';
      setErrorMsg(message);
    }
  };

  const handleQuickImport = async () => {
    if (!detectedMapping) {
      setErrorMsg('No se detectó la estructura de columnas.');
      return;
    }
    try {
      if (onUploadFileToSupabase && selectedFile) {
        onClose();
        await onUploadFileToSupabase(selectedFile);
        return;
      }

      const incidents = transformRowsToIncidents(rawRows, detectedMapping);
      if (incidents.length === 0) {
        throw new Error('No se pudo convertir ninguna fila válida.');
      }
      // Sobrescribe y reemplaza por completo cualquier dato anterior
      onDataImported(incidents, false);
      setSuccessMsg(`¡Éxito! Se cargaron ${incidents.length} registros y se reemplazó por completo la base de datos anterior.`);
      setTimeout(() => {
        onClose();
        setSuccessMsg(null);
        setStep('input');
        setSelectedFile(null);
        setPastedText('');
      }, 1000);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Error al generar registros.';
      setErrorMsg(message);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleProcessFile(e.dataTransfer.files[0]);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-xl shadow-2xl border-2 border-blue-500 w-full max-w-4xl overflow-hidden flex flex-col text-slate-900 animate-fadeIn my-auto max-h-[94vh]">
        {/* Modal Header */}
        <div className="bg-gradient-to-r from-[#0b2447] via-[#124270] to-[#0b2447] text-white p-4 flex items-center justify-between border-b border-cyan-500/30">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-lg bg-emerald-500/20 border border-emerald-400/40 flex items-center justify-center text-emerald-300">
              <FileSpreadsheet className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black tracking-wide uppercase">
                CARGAR MI BASE DE DATOS EXCEL &bull; 25 COLUMNAS OFICIALES
              </h2>
              <p className="text-xs text-cyan-200">
                Compatible 100% con tu tabla de Excel de Serenazgo Nuevo Chimbote
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* State Banner */}
        <div className="bg-slate-100 px-4 py-2 text-xs border-b border-slate-200 flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2 font-medium text-slate-700">
            <Database className="w-4 h-4 text-blue-700" />
            <span>
              Registros activos en sistema:{' '}
              <strong className="text-blue-900 font-mono">{currentCount.toLocaleString()}</strong>
            </span>
            {isCustomDataLoaded ? (
              <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded-full border border-emerald-300 flex items-center gap-1">
                <Check className="w-3 h-3 text-emerald-600" />
                Base personalizada activa
              </span>
            ) : (
              <span className="bg-blue-100 text-blue-800 text-[10px] font-bold px-2 py-0.5 rounded-full border border-blue-300">
                Datos de demostración
              </span>
            )}
          </div>

          {isCustomDataLoaded && (
            <button
              onClick={() => {
                onResetToDefault();
                onClose();
              }}
              className="text-xs text-rose-700 hover:text-rose-900 font-bold flex items-center gap-1 hover:underline"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Restablecer datos de muestra</span>
            </button>
          )}
        </div>

        {/* Official 25 Column Headers Strip */}
        <div className="bg-[#1b3558] text-white px-3 py-2 border-b border-blue-900/60 overflow-x-auto whitespace-nowrap scrollbar-thin">
          <div className="flex items-center gap-1.5 text-[10px]">
            <span className="font-black bg-blue-500/30 text-cyan-200 px-2 py-0.5 rounded border border-blue-400/40 shrink-0">
              ESTRUCTURA EXACTA RECONOCIDA:
            </span>
            {OFFICIAL_EXCEL_COLUMNS.map((col, idx) => (
              <span
                key={col}
                className="bg-blue-950/70 border border-blue-400/30 text-cyan-100 px-1.5 py-0.5 rounded text-[9.5px] font-mono shrink-0"
              >
                {idx + 1}. {col}
              </span>
            ))}
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-4 sm:p-5 overflow-y-auto flex-1 flex flex-col gap-4">
          {errorMsg && (
            <div className="bg-rose-50 border-2 border-rose-300 text-rose-800 p-3 rounded-lg text-xs flex items-start gap-2 animate-shake">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <div className="flex-1 font-medium">{errorMsg}</div>
            </div>
          )}

          {successMsg && (
            <div className="bg-emerald-50 border-2 border-emerald-300 text-emerald-800 p-3 rounded-lg text-xs flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0" />
              <div className="font-bold text-sm">{successMsg}</div>
            </div>
          )}

          {step === 'input' && (
            <div className="flex flex-col gap-4">
              {/* Method Tabs */}
              <div className="grid grid-cols-2 gap-2 bg-slate-100 p-1 rounded-lg border border-slate-300">
                <button
                  type="button"
                  onClick={() => setActiveSubTab('file')}
                  className={`py-2 px-3 rounded-md text-xs font-bold uppercase transition-all flex items-center justify-center gap-2 ${
                    activeSubTab === 'file'
                      ? 'bg-[#124270] text-white shadow'
                      : 'text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  <Upload className="w-4 h-4" />
                  <span>Subir Archivo Excel (.xlsx, .xls, .csv)</span>
                </button>
                <button
                  type="button"
                  onClick={() => setActiveSubTab('paste')}
                  className={`py-2 px-3 rounded-md text-xs font-bold uppercase transition-all flex items-center justify-center gap-2 ${
                    activeSubTab === 'paste'
                      ? 'bg-[#124270] text-white shadow'
                      : 'text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  <ClipboardPaste className="w-4 h-4" />
                  <span>Pegar Celdas de Excel (Ctrl+V)</span>
                </button>
              </div>

              {/* Method 1: File Upload */}
              {activeSubTab === 'file' && (
                <div
                  onDragOver={(e) => {
                    e.preventDefault();
                    setDragOver(true);
                  }}
                  onDragLeave={() => setDragOver(false)}
                  onDrop={handleDrop}
                  className={`border-2 border-dashed rounded-xl p-8 flex flex-col items-center justify-center text-center cursor-pointer transition-all ${
                    dragOver
                      ? 'border-blue-600 bg-blue-50/70 scale-[0.99]'
                      : 'border-slate-300 bg-slate-50 hover:bg-blue-50/40 hover:border-blue-400'
                  }`}
                >
                  <input
                    type="file"
                    id="excel-file-upload-input"
                    accept=".xlsx, .xls, .csv"
                    className="hidden"
                    onChange={(e) => {
                      if (e.target.files && e.target.files.length > 0) {
                        handleProcessFile(e.target.files[0]);
                      }
                    }}
                  />
                  <label htmlFor="excel-file-upload-input" className="cursor-pointer flex flex-col items-center w-full">
                    <div className="w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 mb-3 shadow-sm group-hover:scale-110 transition-transform">
                      <Upload className="w-8 h-8" />
                    </div>
                    <span className="text-base font-black text-slate-800">
                      Haz clic aquí para seleccionar tu archivo Excel con tus 25 columnas
                    </span>
                    <span className="text-xs text-slate-500 mt-1">
                      El sistema leerá automáticamente FECHA, AÑO, UNIDAD, LUGAR, SECTOR, ZONA, HORA, INCIDENCIA, COMISAR, TURNO...
                    </span>
                    <span className="inline-block mt-3 px-4 py-2 bg-[#124270] hover:bg-[#18538c] text-white text-xs font-bold rounded-lg shadow transition-colors">
                      Elegir archivo desde mi PC
                    </span>
                  </label>
                </div>
              )}

              {/* Method 2: Paste from Excel */}
              {activeSubTab === 'paste' && (
                <div className="flex flex-col gap-2">
                  <div className="text-xs text-slate-600 flex items-center justify-between">
                    <span>Selecciona y copia tus celdas en Excel (incluyendo la fila de títulos) y pégalas aquí:</span>
                  </div>
                  <textarea
                    rows={8}
                    value={pastedText}
                    onChange={(e) => setPastedText(e.target.value)}
                    placeholder={`FECHA\tAÑO\tUNIDAD\tLUGAR\tColumna1\tINTEGRADO\tREFE\tOBSERVACION\tSECTOR\tZONA\tHORA\tRANGO\tINCIDENCIA\tAGENTE\tSERVICIO\tORIGEN\tCOMISAR\tTIPO DE PA\tMES\tDIA\tFECHA2\tHORA DE ALERTA FORMATO\tHORA DE LLEGADA FORMATO\tPROMEDIO DE HORA DE ATEN\tTURNO\n2026-09-20\t2026\tM-02\tAv. Pacífico cruce Jr. Huandoy\t\tSI\tFrente a BCP\tSospechosos en la vía pública\tS2BA\tZONA CENTRO\t15:30\t15:00 - 16:00\tPERSONAS SOSPECHOSAS\tCarlos Mendoza\tPATRULLAJE MOTORIZADO\tCENTRAL 107\tCIA BUENOS AIRES\tINTEGRADO\tSETIEMBRE\tDOMINGO\t2026-09-20\t15:25\t15:32\t00:07:00\tTARDE`}
                    className="w-full font-mono text-[11px] p-3 rounded-lg border-2 border-slate-300 focus:border-blue-600 focus:ring-1 focus:ring-blue-600 outline-none bg-slate-50"
                  />
                  <button
                    type="button"
                    onClick={handleProcessPasted}
                    disabled={!pastedText.trim()}
                    className="w-full py-2.5 bg-[#124270] hover:bg-[#18538c] disabled:opacity-50 text-white font-bold text-xs rounded-lg transition-colors flex items-center justify-center gap-2 shadow"
                  >
                    <ClipboardPaste className="w-4 h-4" />
                    <span>Procesar Celdas Pegadas</span>
                  </button>
                </div>
              )}

              {/* Sample Template Download */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 border-t border-slate-200 bg-slate-50 p-3 rounded-lg border">
                <div className="text-xs text-slate-700 flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-amber-500 shrink-0" />
                  <div>
                    <strong className="block font-black text-slate-900">
                      Descargar Plantilla Oficial con las 25 Columnas Exactas
                    </strong>
                    <span className="text-[11px] text-slate-500">
                      Descarga este archivo .xlsx para ver el formato idéntico a tu imagen y rellenarlo con tus datos.
                    </span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={downloadSampleExcelTemplate}
                  className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black uppercase tracking-wide flex items-center gap-2 transition-colors whitespace-nowrap shadow"
                >
                  <Download className="w-4 h-4" />
                  <span>Descargar Plantilla (.xlsx)</span>
                </button>
              </div>
            </div>
          )}

          {step === 'preview' && (
            <div className="flex flex-col gap-4">
              {/* Header Info */}
              <div className="bg-emerald-50 border-2 border-emerald-300 p-3 rounded-lg flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-emerald-600 text-white flex items-center justify-center">
                    <CheckCircle className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-xs font-black text-emerald-950 uppercase tracking-wide">
                      ¡ARCHIVO LEÍDO CON ÉXITO!
                    </div>
                    <div className="text-[11px] text-emerald-800">
                      Se detectaron <strong className="font-bold">{rawRows.length} filas</strong> y{' '}
                      <strong className="font-bold">{headers.length} columnas</strong> ({selectedFile ? selectedFile.name : 'Texto pegado'}).
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setStep('input')}
                  className="text-xs text-emerald-800 font-bold hover:underline bg-emerald-100 px-3 py-1.5 rounded-md border border-emerald-300"
                >
                  Cambiar archivo
                </button>
              </div>

              {/* Mode Selection */}
              {/* Modo de Carga Seguro: Reemplazo Total */}
              <div className="p-3 rounded-lg border-2 border-emerald-500 bg-emerald-50/90 shadow-sm flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-emerald-600 text-white flex items-center justify-center shrink-0 mt-0.5">
                  <Check className="w-5 h-5" />
                </div>
                <div className="text-left flex-1">
                  <div className="text-xs font-black text-emerald-950 uppercase tracking-wide">
                    MODO DE CARGA: REEMPLAZO TOTAL Y SOBRESCRITURA LIMPIA
                  </div>
                  <div className="text-[11px] text-emerald-800 mt-0.5">
                    Al confirmar, se sustituirán al 100% todos los datos anteriores en el sistema y en la memoria del navegador. No se mezclarán con bases antiguas y todo el dashboard responderá a tus <strong className="font-bold">{rawRows.length} registros nuevos</strong>.
                  </div>
                </div>
              </div>

              {/* Table Preview showing all columns */}
              <div className="flex flex-col gap-1.5">
                <div className="flex items-center justify-between text-xs font-bold text-slate-700">
                  <span className="uppercase">Vista Previa de Filas a Cargar:</span>
                  <span className="text-[11px] text-blue-700 font-normal">
                    Mostrando las primeras 4 filas de tu archivo Excel
                  </span>
                </div>
                <div className="border border-slate-300 rounded-lg overflow-x-auto max-h-52 bg-slate-50 shadow-inner">
                  <table className="w-full text-[11px] text-left border-collapse">
                    <thead className="bg-[#124270] text-white font-bold sticky top-0 uppercase text-[10px]">
                      <tr>
                        {headers.map((h, i) => (
                          <th key={i} className="p-2 border-r border-blue-800/40 whitespace-nowrap">
                            {h}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {rawRows.slice(0, 4).map((row, rowIdx) => (
                        <tr key={rowIdx} className="border-b border-slate-200 hover:bg-blue-50/60 font-mono text-[10px]">
                          {headers.map((h, colIdx) => (
                            <td key={colIdx} className="p-1.5 border-r border-slate-200 whitespace-nowrap text-slate-800">
                              {String(row[h] ?? '')}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-between gap-3 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setStep('input')}
                  className="px-4 py-2 rounded-lg border border-slate-300 hover:bg-slate-100 text-slate-700 text-xs font-bold"
                >
                  &larr; Volver
                </button>
                <button
                  type="button"
                  onClick={handleQuickImport}
                  className="px-6 py-2.5 rounded-lg bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-500 hover:to-teal-600 text-white text-xs font-black uppercase tracking-wider flex items-center gap-2 shadow-lg transition-all hover:scale-[1.02]"
                >
                  {selectedFile ? (
                    <Database className="w-4 h-4 text-emerald-200" />
                  ) : (
                    <Sparkles className="w-4 h-4 text-amber-300" />
                  )}
                  <span>
                    {selectedFile
                      ? `¡GUARDAR ${rawRows.length.toLocaleString()} FILAS PERMANENTES EN SUPABASE!`
                      : `¡CARGAR ${rawRows.length.toLocaleString()} REGISTROS!`}
                  </span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
