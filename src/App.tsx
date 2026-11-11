/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo, useEffect, useRef } from 'react';
import {
  IncidentRecord,
  FilterState,
  ActiveTab,
  PatrolUnit,
  ZonaType,
  TurnoType,
  ComisariaType,
  MesType,
} from './types';
import { INITIAL_PATROL_UNITS, SUBSECTORES_CONFIG } from './data/mockData';
import { soundManager } from './utils/audioAlert';
import {
  exportIncidentsToExcel,
  parseAndConvertExcelBuffer,
  parseExcelFile,
  transformRowsToIncidents,
} from './utils/excelHelper';
import { useEditableTitles } from './utils/useEditableTitles';
import { AuthProvider, useAuth } from './utils/authContext';
import { AdminAuthModal } from './components/AdminAuthModal';
import {
  supabase,
  fetchAllRegistrosFromSupabase,
  uploadExcelFileToSupabase,
  UploadProgressInfo,
  SUPABASE_URL,
  SUPABASE_TABLE,
} from './utils/supabaseClient';

// Components for the Municipal Dashboard
import { Header } from './components/Header';
import { LeftFilters } from './components/FiltersSidebar';
import { KpiCards } from './components/KpiCards';
import { VistaResumen } from './components/VistaResumen';
import { TacticalMapView } from './components/TacticalMapView';
import { MapErrorBoundary } from './components/MapErrorBoundary';
import { PlanOperativosView } from './components/PlanOperativosView';
import { ComparativoView } from './components/ComparativoView';
import { DetalleIncidenciasView } from './components/DetalleIncidenciasView';
import { DatabaseExcelHub } from './components/DatabaseExcelHub';

import { CustomTitlesProvider, useCustomTitles } from './context/CustomTitlesContext';

// Modals
import { ExcelUploadModal } from './components/ExcelUploadModal';
import { NewIncidentModal } from './components/NewIncidentModal';
import { ReportPrintModal } from './components/ReportPrintModal';
import { MonthlyReportModal } from './components/MonthlyReportModal';
import { AnnualConsolidatedModal } from './components/AnnualConsolidatedModal';
import { AlertsModal } from './components/AlertsModal';
import { IntroOverlay } from './components/IntroOverlay';
import { Footer } from './components/Footer';
import { RotateCcw, Save, HardDrive, Upload, FileSpreadsheet, Database, Trash2, AlertTriangle, RefreshCw, CheckCircle2 } from 'lucide-react';
import { SaveConfirmationToast } from './components/SaveConfirmationToast';
import {
  saveAllDataToStorage,
  clearAllSavedData,
} from './utils/persistenceHelper';

// Reset completo inmediato de memoria y caché antes de inicializar la aplicación
try {
  localStorage.clear();
} catch (e) {
  console.warn('localStorage.clear notice:', e);
}
try {
  clearAllSavedData();
} catch (e) {
  console.warn('clearAllSavedData notice:', e);
}

const INITIAL_FILTERS: FilterState = {
  zonas: [],
  comisarias: [],
  turnos: [],
  meses: [],
  incidencias: [],
  searchQuery: '',
};

function DashboardInner() {
  const { requireAdmin, isAdmin } = useAuth();

  // 1. Variable de estado que alimenta todo el dashboard: baseDeDatos (con alias records para compatibilidad)
  const [baseDeDatos, setBaseDeDatos] = useState<IncidentRecord[]>([]);
  const records = baseDeDatos;
  const setRecords = setBaseDeDatos;

  const [isLoadingFile, setIsLoadingFile] = useState<boolean>(true);
  const [fileLoadError, setFileLoadError] = useState<string | null>(null);
  const [isCustomDataLoaded, setIsCustomDataLoaded] = useState<boolean>(false);
  const [lastSavedAt, setLastSavedAt] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [hasUnsavedChanges, setHasUnsavedChanges] = useState<boolean>(false);
  const [justSaved, setJustSaved] = useState<boolean>(false);
  const [isSaveToastOpen, setIsSaveToastOpen] = useState<boolean>(false);

  // Patrol Units Live State
  const [patrolUnits] = useState<PatrolUnit[]>(INITIAL_PATROL_UNITS);

  // 2. Active Tab
  const [activeTab, setActiveTab] = useState<ActiveTab>('VISTA_RESUMEN');

  // Center display mode: either 'GRAFICOS' (the 7 charts) or 'MAPA' (the tactical heatmap in the middle)
  const [centerMode, setCenterMode] = useState<'GRAFICOS' | 'MAPA'>('GRAFICOS');

  // 3. Editable Dashboard Titles & Custom Texts (auto-saved on change)
  const { titles, updateTitle, resetTitles, isCustomTitles } = useEditableTitles();

  // 4. Filters
  const [filters, setFilters] = useState<FilterState>(INITIAL_FILTERS);

  // 5. Modals
  const [isExcelModalOpen, setIsExcelModalOpen] = useState(false);
  const [isNewIncidentOpen, setIsNewIncidentOpen] = useState(false);
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [isMonthlyReportModalOpen, setIsMonthlyReportModalOpen] = useState(false);
  const [isAnnualConsolidatedModalOpen, setIsAnnualConsolidatedModalOpen] = useState(false);
  const [isAlertsModalOpen, setIsAlertsModalOpen] = useState(false);
  const [isClearConfirmOpen, setIsClearConfirmOpen] = useState(false);

  const [dataSourceType, setDataSourceType] = useState<'SUPABASE' | 'LOCAL'>('SUPABASE');

  // Carga automática de la base de datos completa de 20,635 filas desde base_de_datos.xlsx
  const loadBaseDeDatosFallback = async () => {
    try {
      const candidates = ['/base_de_datos.xlsx', '/base_de_datos.csv', '/public/base_de_datos.xlsx'];
      let res: Response | null = null;
      let usedPath = '';
      for (const path of candidates) {
        try {
          const attempt = await fetch(path);
          if (attempt.ok) {
            res = attempt;
            usedPath = path;
            break;
          }
        } catch {
          // Continúa búsqueda
        }
      }
      if (res && res.ok) {
        const buffer = await res.arrayBuffer();
        const parsedRecords = parseAndConvertExcelBuffer(buffer);
        if (parsedRecords && parsedRecords.length > 0) {
          const cleanFileName = usedPath.split('/').pop()?.replace(/%20/g, ' ') || 'base_de_datos.xlsx';
          // 2. Asigna directamente el resultado a la misma variable de estado que alimenta todo el dashboard
          setBaseDeDatos(parsedRecords);
          setIsCustomDataLoaded(true);
          setLastSavedAt(`Supabase Conectado | Base de Datos: ${cleanFileName} (${parsedRecords.length.toLocaleString()} registros)`);
          setDataSourceType('LOCAL');
          setFilters(INITIAL_FILTERS);
          setIsLoadingFile(false);
          return;
        }
      }
      setIsLoadingFile(false);
    } catch (e: any) {
      console.error('Error cargando base_de_datos de respaldo:', e);
      setIsLoadingFile(false);
    }
  };

  // 1. Carga en vivo desde la base de datos Supabase usando: supabase.from('registros').select('*')
  // Con paginación progresiva mediante .range() para traer las más de 20.000 filas
  const loadSupabaseData = async (silent: boolean = false) => {
    if (!silent) setIsLoadingFile(true);
    setFileLoadError(null);

    try {
      const result = await fetchAllRegistrosFromSupabase();

      if (result.status === 'ERROR') {
        const errMsg = result.error?.message || 'Error al conectar con la base de datos Supabase';
        console.warn('Aviso Supabase:', errMsg);
        setFileLoadError(errMsg);
        // Si Supabase falla o no responde, asegurar carga de base_de_datos.xlsx para que no se muestre 0
        await loadBaseDeDatosFallback();
        return;
      }

      if (result.records && result.records.length > 0) {
        // 2. Asigna directamente el resultado a la misma variable de estado: setBaseDeDatos(data)
        setBaseDeDatos(result.records);
        setIsCustomDataLoaded(true);
        setLastSavedAt(`Supabase en Vivo: ${result.records.length.toLocaleString()} registros sincronizados`);
        setDataSourceType('SUPABASE');
        setFilters(INITIAL_FILTERS);
        setIsLoadingFile(false);
        return;
      }

      // Si la tabla registros de Supabase actualmente contiene 0 filas en la nube:
      // Cargamos automáticamente la base de datos completa de 20,635 filas desde base_de_datos.xlsx
      // para que setBaseDeDatos(data) alimente el dashboard de inmediato y calcule los indicadores
      // (Total atenciones, Zona Centro, Turnos, Comisarías) sin mostrar 0 registros.
      await loadBaseDeDatosFallback();
    } catch (err: unknown) {
      console.error('Error al consultar tabla registros de Supabase:', err);
      await loadBaseDeDatosFallback();
    }
  };

  const loadLocalFallback = loadBaseDeDatosFallback;

  // Inicialización y escucha en tiempo real de cambios en Supabase (tabla 'registros')
  useEffect(() => {
    loadSupabaseData();

    // Suscripción en tiempo real a Supabase
    const channel = supabase
      .channel('registros_realtime_sync')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: SUPABASE_TABLE,
        },
        () => {
          loadSupabaseData(true);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const [uploadProgress, setUploadProgress] = useState<UploadProgressInfo | null>(null);

  // Función principal para subir archivo Excel/CSV y guardar de forma permanente en Supabase
  const handleUploadFileToSupabase = async (file: File) => {
    try {
      setIsLoadingFile(true);
      setUploadProgress({
        stage: 'PARSING',
        message: `Leyendo y parseando archivo "${file.name}" con xlsx...`,
        percent: 5,
        currentBatch: 0,
        totalBatches: 0,
        totalRows: 0,
      });

      const res = await uploadExcelFileToSupabase(file, (info) => {
        setUploadProgress(info);
      });

      if (res.success) {
        soundManager.playSuccess();
        setUploadProgress({
          stage: 'COMPLETED',
          message: `¡${res.totalUploaded.toLocaleString()} registros guardados con éxito de forma permanente en Supabase! Recargando datos...`,
          percent: 100,
          currentBatch: Math.ceil(res.totalUploaded / 1000),
          totalBatches: Math.ceil(res.totalUploaded / 1000),
          totalRows: res.totalUploaded,
        });

        // 3. Al finalizar, recargar los datos desde Supabase para actualizar las tarjetas y métricas
        setTimeout(async () => {
          await loadSupabaseData();
          setUploadProgress(null);
          setIsExcelModalOpen(false);
          setIsSaveToastOpen(true);
        }, 1500);
        return;
      }

      // Si Supabase devolvió error (por ejemplo RLS):
      const isRls = res.error?.code === '42501' || String(res.error?.message || '').includes('row-level security');
      const detail = isRls
        ? 'Supabase tiene activado Row Level Security (RLS) en la tabla "registros". Para permitir la inserción permanente desde la app, en tu panel de Supabase ve a Table Editor > registros > RLS y desactiva RLS o crea una política de INSERT para el rol "anon".'
        : (res.error?.message || 'Error al guardar los datos en Supabase');

      setUploadProgress({
        stage: 'ERROR',
        message: `Atención: No se pudo completar la escritura remota: ${detail}`,
        percent: 100,
        currentBatch: 0,
        totalBatches: 0,
        totalRows: 0,
        error: res.error,
      });

      // Como respaldo seguro para que el usuario no pierda su archivo, cargamos las filas en la memoria reactiva del dashboard
      try {
        const parsed = await parseExcelFile(file);
        const incidents = transformRowsToIncidents(parsed.rawRows, parsed.detectedMapping);
        if (incidents.length > 0) {
          setBaseDeDatos(incidents);
          setIsCustomDataLoaded(true);
          setLastSavedAt(`${file.name} (${incidents.length.toLocaleString()} registros locales)`);
          setFilters(INITIAL_FILTERS);
        }
      } catch {
        // ignore
      }
      setIsLoadingFile(false);
    } catch (err: unknown) {
      alert('Error procesando archivo: ' + (err instanceof Error ? err.message : 'Error desconocido'));
      setIsLoadingFile(false);
      setUploadProgress(null);
    }
  };

  // Carga manual directa de archivo seleccionado por el usuario mediante botón "Subir Excel"
  const handleDirectFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      await handleUploadFileToSupabase(file);
    } finally {
      if (e.target) e.target.value = '';
    }
  };

  // When tab is changed to MAPA_CALOR, set centerMode to 'MAPA'
  useEffect(() => {
    if (activeTab === 'MAPA_CALOR') {
      setCenterMode('MAPA');
    }
  }, [activeTab]);

  // 6. Filter calculation (Flexible and inclusive of all imported records)
  const filteredRecords = useMemo(() => {
    return records.filter((r) => {
      // Zona filter
      if (filters.zonas.length > 0 && !filters.zonas.includes(r.zona)) {
        return false;
      }
      // Comisaría filter
      if (filters.comisarias.length > 0 && !filters.comisarias.includes(r.comisaria)) {
        return false;
      }
      // Turno filter
      if (filters.turnos.length > 0 && !filters.turnos.includes(r.turno)) {
        return false;
      }
      // Mes filter
      if (filters.meses.length > 0 && !filters.meses.includes(r.mes)) {
        return false;
      }
      // Incidencia filter
      if (filters.incidencias.length > 0 && !filters.incidencias.includes(r.tipoIncidencia)) {
        return false;
      }
      // Search query (checking Columna1 and Observacion as well)
      if (filters.searchQuery.trim() !== '') {
        const q = filters.searchQuery.toLowerCase();
        const match =
          (r.ubicacion && r.ubicacion.toLowerCase().includes(q)) ||
          (r.lugar && r.lugar.toLowerCase().includes(q)) ||
          (r.columna1 && r.columna1.toLowerCase().includes(q)) ||
          (r.observacion && r.observacion.toLowerCase().includes(q)) ||
          (r.tipoIncidencia && r.tipoIncidencia.toLowerCase().includes(q)) ||
          (r.subsector && r.subsector.toLowerCase().includes(q)) ||
          (r.efectivo ? r.efectivo.toLowerCase().includes(q) : false) ||
          (r.codigo ? r.codigo.toLowerCase().includes(q) : false);
        if (!match) return false;
      }
      return true;
    });
  }, [records, filters]);

  // Handlers for Data Hub
  const handleOpenExcelModal = () => {
    setIsExcelModalOpen(true);
  };

  const handleOpenNewIncident = () => {
    requireAdmin('Registro de Nuevo Operativo o Incidencia', () => {
      setIsNewIncidentOpen(true);
    });
  };

  // Central Save Changes Handler (IndexedDB powered, avoiding quota limits)
  const handleSaveChanges = async () => {
    try {
      const res = await saveAllDataToStorage(records, titles);
      if (res.success) {
        setLastSavedAt(res.timestamp);
        setHasUnsavedChanges(false);
        setIsCustomDataLoaded(true);
        setJustSaved(true);
        soundManager.playSuccess();
        setIsSaveToastOpen(true);
        setTimeout(() => {
          setJustSaved(false);
        }, 4000);
      } else {
        alert('Error al guardar datos: ' + (res.error || 'Almacenamiento no disponible'));
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error inesperado al guardar';
      alert('Error al guardar datos: ' + msg);
    }
  };

  // Al presionar "Subir Excel", el sistema sobrescribe y reemplaza por completo cualquier dato anterior
  const handleDataImported = async (newRecords: IncidentRecord[], _append?: boolean) => {
    setRecords(newRecords);
    setIsCustomDataLoaded(true);
    setFilters(INITIAL_FILTERS); // Reset filters so all new records are visible immediately
    try {
      const res = await saveAllDataToStorage(newRecords, titles);
      if (res.success) {
        setLastSavedAt(res.timestamp);
        setHasUnsavedChanges(false);
        setJustSaved(true);
        setTimeout(() => setJustSaved(false), 4000);
      }
    } catch (err) {
      console.warn('Error guardando en almacenamiento:', err);
    }
    soundManager.playSuccess();
    setIsSaveToastOpen(true);
    setActiveTab('VISTA_RESUMEN');
  };

  // Limpiar toda la memoria guardada en el navegador y dejar la app lista para un archivo nuevo
  const handleClearAllData = async () => {
    await clearAllSavedData();
    setRecords([]);
    setIsCustomDataLoaded(false);
    setLastSavedAt(null);
    setHasUnsavedChanges(false);
    setFilters(INITIAL_FILTERS);
    soundManager.playClick();
    setIsExcelModalOpen(true); // Abre inmediatamente el asistente para cargar el archivo nuevo
  };

  const handleResetToDefault = () => {
    requireAdmin('Restablecer y sincronizar base de datos con Supabase en vivo', async () => {
      await loadSupabaseData();
      soundManager.playClick();
    });
  };

  const handleDeleteRecord = (id: string) => {
    requireAdmin('Eliminar registro de incidencia', async () => {
      const updated = records.filter((r) => r.id !== id);
      setRecords(updated);
      await saveAllDataToStorage(updated, titles);
      setHasUnsavedChanges(false);
      soundManager.playClick();
    });
  };

  const handleAddIncident = (newRec: IncidentRecord) => {
    requireAdmin('Registrar nueva incidencia en la base de datos', async () => {
      const updated = [newRec, ...records];
      setRecords(updated);
      setIsCustomDataLoaded(true);
      const res = await saveAllDataToStorage(updated, titles);
      if (res.success) {
        setLastSavedAt(res.timestamp);
        setHasUnsavedChanges(false);
        setJustSaved(true);
        setTimeout(() => setJustSaved(false), 4000);
      }
      soundManager.playSuccess();
      setIsSaveToastOpen(true);
    });
  };

  const handleExportExcel = () => {
    exportIncidentsToExcel(filteredRecords, `Atenciones_Serenazgo_NuevoChimbote_${new Date().toISOString().slice(0, 10)}.xlsx`);
    soundManager.playSuccess();
  };

  const handleResetFilters = () => {
    setFilters(INITIAL_FILTERS);
    soundManager.playClick();
  };

  const isMainDashboardTab = activeTab === 'VISTA_RESUMEN' || activeTab === 'MAPA_CALOR';

  return (
    <div className="min-h-screen bg-[#d5dde5] text-slate-900 flex flex-col font-sans select-none antialiased relative">
      {/* Marca de Agua Translúcida Oficial Serenazgo de Fondo (Acelerado por GPU para scroll fluido) */}
      <div
        className="fixed inset-0 pointer-events-none select-none z-0 flex items-center justify-center overflow-hidden will-change-transform"
        style={{ opacity: 0.04, transform: 'translateZ(0)' }}
      >
        <img
          src="/logo.png"
          alt=""
          className="w-[680px] h-[680px] max-w-[85vw] max-h-[85vh] object-contain grayscale contrast-125"
        />
      </div>

      {/* Top Municipal Navigation Header */}
      <Header
        activeTab={activeTab}
        setActiveTab={(tab) => {
          setActiveTab(tab);
          if (tab === 'MAPA_CALOR') {
            setCenterMode('MAPA');
          } else if (tab === 'VISTA_RESUMEN') {
            setCenterMode('GRAFICOS');
          }
        }}
        onOpenMonthlyReport={() => setIsMonthlyReportModalOpen(true)}
        onOpenAnnualConsolidated={() => setIsAnnualConsolidatedModalOpen(true)}
      />

      {/* Main Container */}
      <main className="flex-1 p-2 sm:p-4 flex flex-col w-full">
        {/* MAIN DASHBOARD: Full-Width 2-Column Layout with Left Filters & Expanded Central Dashboard */}
        {isMainDashboardTab && (
          <div className="flex flex-col lg:flex-row gap-3 w-full">
            {/* Left Filter Sidebar */}
            <LeftFilters
              filters={filters}
              onFilterChange={setFilters}
              onResetFilters={handleResetFilters}
            />

            {/* Center Area: Muestra directo el dashboard oficial */}
            <div className="flex-1 flex flex-col gap-2 min-w-0 w-full">
              {isLoadingFile && (
                <div className="bg-[#0b1f3b] rounded-lg border border-cyan-500/50 p-2.5 flex items-center justify-between text-xs text-cyan-200 animate-pulse">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-ping" />
                    <span>Consultando base de datos en vivo de Supabase (tabla "registros")...</span>
                  </div>
                  <span className="font-mono text-[10px] text-cyan-400">Sincronizando</span>
                </div>
              )}

              {fileLoadError && (
                <div className="bg-rose-950/80 rounded-lg border border-rose-500/50 p-2.5 flex items-center justify-between text-xs text-rose-200">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
                    <span>Error al consultar Supabase: {fileLoadError}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => loadSupabaseData()}
                    className="px-2.5 py-1 rounded bg-rose-800 hover:bg-rose-700 text-white font-bold text-[11px] flex items-center gap-1 shrink-0"
                  >
                    <RefreshCw className="w-3 h-3" />
                    <span>Reintentar</span>
                  </button>
                </div>
              )}

              {/* Banner de tabla vacía - Solo para Administradores */}
              {isAdmin && !isLoadingFile && records.length === 0 && (
                <div className="bg-gradient-to-r from-blue-950 via-[#0a2540] to-cyan-950 rounded-lg border-2 border-cyan-600/60 p-3 flex flex-col md:flex-row items-center justify-between gap-3 text-xs text-cyan-100 shadow-md">
                  <div className="flex items-center gap-2.5">
                    <div className="w-3 h-3 rounded-full bg-emerald-400 animate-ping shrink-0" />
                    <div>
                      <p className="font-bold text-white text-xs sm:text-sm flex items-center gap-2">
                        <span>Conexión en Vivo con Supabase Establecida</span>
                        <span className="text-[10px] bg-emerald-500/30 text-emerald-300 px-2 py-0.5 rounded border border-emerald-400/50 font-mono">
                          Tabla: {SUPABASE_TABLE}
                        </span>
                      </p>
                      <p className="text-[11px] text-slate-300 mt-0.5">
                        La consulta <code className="text-cyan-300 bg-slate-900/60 px-1 py-0.5 rounded font-mono">supabase.from('{SUPABASE_TABLE}').select('*')</code> está activa y a la escucha en tiempo real. La tabla remota aún no contiene registros.
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={() => loadSupabaseData()}
                      className="px-3 py-1.5 rounded-lg bg-cyan-700 hover:bg-cyan-600 text-white font-bold text-xs flex items-center gap-1.5 shadow transition-all active:scale-95 border border-cyan-400 cursor-pointer"
                      title="Volver a consultar registros en Supabase"
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                      <span>Recargar Supabase</span>
                    </button>
                    <button
                      type="button"
                      onClick={loadLocalFallback}
                      className="px-3 py-1.5 rounded-lg bg-emerald-700 hover:bg-emerald-600 text-white font-bold text-xs flex items-center gap-1.5 shadow transition-all active:scale-95 border border-emerald-400 cursor-pointer"
                      title="Cargar los 20,635 registros del archivo Excel base_de_datos.xlsx como demostración"
                    >
                      <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-200" />
                      <span>Cargar respaldo Excel local</span>
                    </button>
                  </div>
                </div>
              )}

              <>
                {/* 4 Iconic KPI Cards with Editable Titles */}
                <KpiCards
                  filteredRecords={filteredRecords}
                  totalRecordsCount={records.length}
                  titles={titles}
                  onUpdateTitle={updateTitle}
                />

                {/* Barra de Estado Oficial y Sincronización Supabase - Visible EXCLUSIVAMENTE si isAdmin === true */}
                {isAdmin && (
                  <div className="bg-white rounded-lg border-2 border-slate-300 shadow-sm px-3.5 py-2 flex flex-wrap items-center justify-between gap-2 text-xs">
                    <div className="flex items-center gap-2 text-slate-700 font-medium">
                      <span className="flex h-2.5 w-2.5 relative">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
                      </span>
                      <span>
                        {dataSourceType === 'SUPABASE' ? (
                          <>
                            <strong className="text-emerald-700 font-black">Supabase en Vivo:</strong> Mostrando{' '}
                            <strong className="font-black text-blue-900 font-mono">{filteredRecords.length.toLocaleString()}</strong> de{' '}
                            <strong className="font-mono">{records.length.toLocaleString()}</strong> atenciones oficiales
                          </>
                        ) : records.length > 0 ? (
                          <>
                            Base de Datos Activa: Mostrando{' '}
                            <strong className="font-black text-blue-900 font-mono">{filteredRecords.length.toLocaleString()}</strong> de{' '}
                            <strong className="font-mono">{records.length.toLocaleString()}</strong> registros
                          </>
                        ) : (
                          <>
                            <strong className="text-cyan-800 font-bold">Supabase Conectado:</strong> Tabla "{SUPABASE_TABLE}" (0 registros)
                          </>
                        )}
                      </span>
                      {lastSavedAt && (
                        <span className="hidden md:inline-flex items-center gap-1 text-[11px] text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-300 font-mono ml-1 font-semibold">
                          <HardDrive className="w-3 h-3 text-emerald-600" />
                          <span>{lastSavedAt}</span>
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-2 ml-auto">
                      <button
                        type="button"
                        onClick={() => loadSupabaseData()}
                        className="text-[11px] text-cyan-800 hover:text-cyan-950 font-bold flex items-center gap-1 bg-cyan-50 hover:bg-cyan-100 px-2.5 py-1 rounded border border-cyan-300 transition-colors cursor-pointer"
                        title="Consultar nuevamente la tabla registros en Supabase"
                      >
                        <RefreshCw className="w-3 h-3 text-cyan-600" />
                        <span>Sincronizar Supabase</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="text-[11px] text-blue-700 hover:text-blue-900 font-bold flex items-center gap-1 hover:underline ml-1 cursor-pointer"
                        title="Subir o actualizar base de datos manual"
                      >
                        <Upload className="w-3 h-3" />
                        <span>Subir Excel</span>
                      </button>

                      {isCustomTitles && (
                        <button
                          type="button"
                          onClick={resetTitles}
                          className="text-[11px] text-rose-700 hover:text-rose-900 font-bold flex items-center gap-1 hover:underline ml-2 cursor-pointer"
                          title="Restablecer todos los títulos modificados a los originales"
                        >
                          <RotateCcw className="w-3 h-3" />
                          <span>Restablecer títulos</span>
                        </button>
                      )}
                    </div>
                  </div>
                )}

                  {/* CENTER CONTENT: Either 7 Charts OR Map in the Middle */}
                  {centerMode === 'GRAFICOS' ? (
                    <VistaResumen
                      records={filteredRecords}
                      allRecords={records}
                      selectedMes={filters.meses.length === 1 ? filters.meses[0] : null}
                      titles={titles}
                      onUpdateTitle={updateTitle}
                      onSelectMes={(m) => setFilters((prev) => ({ ...prev, meses: m ? [m] : [] }))}
                      onSelectSubsector={(s) => setFilters((prev) => ({ ...prev, searchQuery: s }))}
                      onSelectTurno={(t) => setFilters((prev) => ({ ...prev, turnos: [t as TurnoType] }))}
                      onSelectZona={(z) => setFilters((prev) => ({ ...prev, zonas: [z as ZonaType] }))}
                      onSelectComisaria={(c) => setFilters((prev) => ({ ...prev, comisarias: [c as ComisariaType] }))}
                      onSelectDia={(d) => setFilters((prev) => ({ ...prev, searchQuery: d }))}
                      onNavigateToHeatmap={() => {
                        setCenterMode('MAPA');
                        setActiveTab('MAPA_CALOR');
                      }}
                      onNavigateToDetails={() => setActiveTab('DETALLE_INCIDENCIAS')}
                      onNavigateToPlanes={() => setActiveTab('PLAN_OPERATIVOS')}
                    />
                  ) : (
                    <div className="flex-1 flex flex-col min-h-[680px] rounded-lg overflow-hidden border-2 border-[#124270] shadow-xl bg-slate-950">
                      <MapErrorBoundary fallbackTitle="Radar GIS Municipal y Mapa de Calor">
                        <TacticalMapView
                          records={filteredRecords}
                          patrolUnits={patrolUnits}
                          onSelectIncident={() => {}}
                          onDispatchUnit={(unitId, loc) => {
                            soundManager.playEmergency();
                            alert(`¡Unidad ${unitId} despachada hacia ${loc}! Notificación enviada a la tripulación.`);
                          }}
                        />
                      </MapErrorBoundary>
                    </div>
                  )}
                </>
            </div>
          </div>
        )}

        {/* Other secondary views if accessed directly */}
        {activeTab === 'PLAN_OPERATIVOS' && <PlanOperativosView />}

        {activeTab === 'COMPARATIVO' && <ComparativoView records={filteredRecords} />}

        {activeTab === 'DETALLE_INCIDENCIAS' && (
          <DetalleIncidenciasView
            records={filteredRecords}
            onDeleteRecord={handleDeleteRecord}
            onViewOnMap={(r) => {
              setFilters((prev) => ({ ...prev, searchQuery: r.codigo || r.id }));
              setCenterMode('MAPA');
              setActiveTab('MAPA_CALOR');
            }}
            onSaveChanges={handleSaveChanges}
            hasUnsavedChanges={hasUnsavedChanges}
            lastSavedAt={lastSavedAt}
          />
        )}

        {activeTab === 'BD' && (
          <DatabaseExcelHub
            records={filteredRecords}
            isCustomDataLoaded={isCustomDataLoaded}
            onDataImported={handleDataImported}
            onResetToDefault={handleResetToDefault}
            onDeleteRecord={handleDeleteRecord}
            onViewOnMap={(r) => {
              setFilters((prev) => ({ ...prev, searchQuery: r.codigo || r.id }));
              setCenterMode('MAPA');
              setActiveTab('MAPA_CALOR');
            }}
            onSaveChanges={handleSaveChanges}
            hasUnsavedChanges={hasUnsavedChanges}
            lastSavedAt={lastSavedAt}
            onOpenUploadModal={handleOpenExcelModal}
          />
        )}
      </main>

      {/* Footer Oficial con Créditos de Desarrollador */}
      <Footer />

      {/* Notificación de Confirmación de Guardado Permanente */}
      <SaveConfirmationToast
        isOpen={isSaveToastOpen}
        onClose={() => setIsSaveToastOpen(false)}
        recordsCount={records.length}
        records={records}
        lastSavedAt={lastSavedAt}
        titles={titles}
      />

      {/* Input de archivo nativo directo */}
      <input
        type="file"
        ref={fileInputRef}
        accept=".xlsx,.xls,.csv"
        onChange={handleDirectFileUpload}
        className="hidden"
      />

      {/* Modals */}
      <ExcelUploadModal
        isOpen={isExcelModalOpen}
        onClose={() => setIsExcelModalOpen(false)}
        onDataImported={handleDataImported}
        onResetToDefault={handleResetToDefault}
        isCustomDataLoaded={isCustomDataLoaded}
        currentCount={records.length}
        onUploadFileToSupabase={handleUploadFileToSupabase}
      />

      <NewIncidentModal
        isOpen={isNewIncidentOpen}
        onClose={() => setIsNewIncidentOpen(false)}
        onAddIncident={handleAddIncident}
      />

      <ReportPrintModal
        isOpen={isReportModalOpen}
        onClose={() => setIsReportModalOpen(false)}
        records={filteredRecords}
        totalRecordsCount={records.length}
      />

      <MonthlyReportModal
        isOpen={isMonthlyReportModalOpen}
        onClose={() => setIsMonthlyReportModalOpen(false)}
        records={filteredRecords}
        allRecords={records}
        initialMes={filters.meses.length === 1 ? filters.meses[0] : 'SETIEMBRE'}
      />

      <AnnualConsolidatedModal
        isOpen={isAnnualConsolidatedModalOpen}
        onClose={() => setIsAnnualConsolidatedModalOpen(false)}
        records={records}
      />

      <AlertsModal
        isOpen={isAlertsModalOpen}
        onClose={() => setIsAlertsModalOpen(false)}
        onNavigateToHeatmap={() => {
          setCenterMode('MAPA');
          setActiveTab('MAPA_CALOR');
        }}
      />

      {/* Modal de Confirmación para Limpiar Datos / Resetear */}
      {isClearConfirmOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-[#0b1f3b] border-2 border-rose-500/70 rounded-xl max-w-md w-full p-5 text-white shadow-2xl flex flex-col gap-4 animate-fadeIn">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-rose-500/20 border border-rose-500/50 flex items-center justify-center text-rose-400 shrink-0">
                <Trash2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-black uppercase text-rose-300">
                  ¿Limpiar Datos y Resetear Memoria?
                </h3>
                <p className="text-[11px] text-slate-300 mt-0.5">
                  Esta acción vaciará por completo la base de datos guardada en el navegador.
                </p>
              </div>
            </div>

            <p className="text-xs text-slate-300 bg-slate-900/60 p-3 rounded-lg border border-slate-700/60">
              La base de datos actual se eliminará por completo para que puedas subir tu nuevo archivo Excel 100% limpio, sin mezclas de datos ni registros antiguos.
            </p>

            <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-cyan-900/60">
              <button
                type="button"
                onClick={() => setIsClearConfirmOpen(false)}
                className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={async () => {
                  setIsClearConfirmOpen(false);
                  await handleClearAllData();
                }}
                className="px-4 py-2 rounded-lg bg-gradient-to-r from-rose-600 to-red-700 hover:from-rose-500 hover:to-red-600 text-white font-black text-xs uppercase tracking-wide shadow flex items-center gap-1.5 cursor-pointer active:scale-95"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Sí, Limpiar y Resetear Todo</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal / Alerta de Progreso de Guardado en Supabase */}
      {uploadProgress && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/85 backdrop-blur-md p-4 animate-fadeIn">
          <div className="bg-[#0b1f3b] border-2 border-cyan-500 rounded-xl shadow-2xl max-w-lg w-full overflow-hidden text-white p-6 space-y-4">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-xl bg-cyan-950 border border-cyan-400 text-cyan-300 shrink-0">
                {uploadProgress.stage === 'COMPLETED' ? (
                  <CheckCircle2 className="w-6 h-6 text-emerald-400 animate-bounce" />
                ) : uploadProgress.stage === 'ERROR' ? (
                  <AlertTriangle className="w-6 h-6 text-amber-400" />
                ) : (
                  <Database className="w-6 h-6 text-cyan-400 animate-pulse" />
                )}
              </div>
              <div className="min-w-0 flex-1">
                <h3 className="text-sm sm:text-base font-black uppercase text-cyan-100 tracking-wide">
                  {uploadProgress.stage === 'COMPLETED'
                    ? '¡Guardado Permanente Exitoso!'
                    : uploadProgress.stage === 'ERROR'
                    ? 'Aviso de Seguridad Supabase'
                    : 'Guardando de Forma Permanente en Supabase'}
                </h3>
                <p className="text-[11px] text-cyan-300/80 font-mono mt-0.5">
                  Tabla remota: <span className="text-cyan-200 font-bold bg-slate-900/60 px-1 py-0.5 rounded">{SUPABASE_TABLE}</span> &bull; Base de Datos en Vivo
                </p>
              </div>
            </div>

            {/* Barra de Progreso Dinámica */}
            <div className="space-y-2 pt-1">
              <div className="flex items-center justify-between text-xs font-bold gap-2">
                <span className="text-cyan-200 truncate">{uploadProgress.message}</span>
                <span className="text-cyan-400 font-mono shrink-0">{uploadProgress.percent}%</span>
              </div>
              <div className="w-full bg-slate-900 rounded-full h-3.5 overflow-hidden border border-cyan-800/80 p-0.5 shadow-inner">
                <div
                  className={`h-full rounded-full transition-all duration-300 ${
                    uploadProgress.stage === 'COMPLETED'
                      ? 'bg-gradient-to-r from-emerald-500 to-teal-400 shadow-[0_0_12px_rgba(16,185,129,0.5)]'
                      : uploadProgress.stage === 'ERROR'
                      ? 'bg-gradient-to-r from-amber-500 to-rose-500'
                      : 'bg-gradient-to-r from-cyan-500 via-sky-400 to-blue-500 shadow-[0_0_12px_rgba(6,182,212,0.5)]'
                  }`}
                  style={{ width: `${Math.max(5, uploadProgress.percent)}%` }}
                />
              </div>
            </div>

            {uploadProgress.stage === 'ERROR' ? (
              <div className="space-y-3 pt-2">
                <div className="text-xs text-amber-200 bg-amber-950/70 p-3 rounded-lg border border-amber-500/50 leading-relaxed space-y-1.5">
                  <p className="font-bold text-amber-300 flex items-center gap-1.5">
                    <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
                    <span>Configuración de Permisos en Supabase requerida:</span>
                  </p>
                  <p className="text-[11px] text-amber-100">
                    {uploadProgress.message}
                  </p>
                  <p className="text-[10px] text-amber-300/90 italic pt-1 border-t border-amber-600/40">
                    Nota: Los registros han sido cargados de inmediato en la memoria de tu dashboard para que puedas visualizarlos y trabajar con normalidad.
                  </p>
                </div>
                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={() => setUploadProgress(null)}
                    className="px-4 py-1.5 rounded-lg bg-cyan-700 hover:bg-cyan-600 text-white font-bold text-xs shadow cursor-pointer transition-colors"
                  >
                    Cerrar y Continuar
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1">
                <span>Lotes de 1.000 registros para evitar límites de tamaño</span>
                {uploadProgress.totalBatches > 0 && (
                  <span className="font-mono text-cyan-300 font-semibold">
                    Lote {uploadProgress.currentBatch} / {uploadProgress.totalBatches}
                  </span>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Loading Overlay mientras se procesa el archivo Excel oficial de /public */}
      {isLoadingFile && !uploadProgress && (
        <div className="fixed inset-0 z-50 bg-[#071322]/90 backdrop-blur-md flex flex-col items-center justify-center p-6 text-white text-center">
          <div className="relative mb-5">
            <div className="w-16 h-16 rounded-full border-4 border-cyan-500/20 border-t-cyan-400 animate-spin" />
            <div className="absolute inset-0 flex items-center justify-center">
              <Database className="w-6 h-6 text-cyan-400 animate-pulse" />
            </div>
          </div>
          <h2 className="text-lg sm:text-xl font-black uppercase text-cyan-200 tracking-wider">
            Cargando Base de Datos Oficial
          </h2>
          <p className="text-xs sm:text-sm text-slate-300 max-w-lg mt-2 font-medium leading-relaxed">
            Consultando en vivo tabla <strong className="text-white font-mono">"{SUPABASE_TABLE}"</strong> en Supabase...
          </p>
          <div className="mt-4 flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-cyan-950/80 border border-cyan-700/60 text-xs text-cyan-300 font-mono shadow-lg">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
            <span>Alimentando componentes, KPIs, gráficos y mapa de calor</span>
          </div>
        </div>
      )}

      {/* Error banner si fallara la carga */}
      {fileLoadError && !isLoadingFile && (
        <div className="fixed bottom-4 right-4 z-50 max-w-md bg-rose-950/95 border-2 border-rose-500 text-white p-4 rounded-xl shadow-2xl flex flex-col gap-2">
          <div className="flex items-center gap-2 text-rose-300 font-bold text-xs uppercase">
            <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
            <span>Error cargando base de datos Supabase</span>
          </div>
          <p className="text-xs text-rose-200">{fileLoadError}</p>
          <button
            type="button"
            onClick={() => loadSupabaseData()}
            className="self-end px-3 py-1 rounded bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Reintentar</span>
          </button>
        </div>
      )}

      {/* Admin Authentication & RBAC Modal */}
      <AdminAuthModal />

      {/* Pantalla de Presentación Animada e Interactiva */}
      <IntroOverlay />
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <CustomTitlesProvider>
        <DashboardInner />
      </CustomTitlesProvider>
    </AuthProvider>
  );
}
