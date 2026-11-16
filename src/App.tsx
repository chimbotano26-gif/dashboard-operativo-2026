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
import { INITIAL_PATROL_UNITS } from './data/mockData';
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

// Componentes
import { Header } from './components/Header';
import { AnalyticsDashboardView } from './components/AnalyticsDashboardView';
import { TacticalMapView } from './components/TacticalMapView';
import { MapErrorBoundary } from './components/MapErrorBoundary';
import { PlanOperativosView } from './components/PlanOperativosView';
import { ComparativoView } from './components/ComparativoView';
import { DetalleIncidenciasView } from './components/DetalleIncidenciasView';
import { DatabaseExcelHub } from './components/DatabaseExcelHub';

import { CustomTitlesProvider } from './context/CustomTitlesContext';

// Modals
import { ExcelUploadModal } from './components/ExcelUploadModal';
import { NewIncidentModal } from './components/NewIncidentModal';
import { ReportPrintModal } from './components/ReportPrintModal';
import { MonthlyReportModal } from './components/MonthlyReportModal';
import { AnnualConsolidatedModal } from './components/AnnualConsolidatedModal';
import { AlertsModal } from './components/AlertsModal';
import { Footer } from './components/Footer';
import { Trash2, AlertTriangle, RefreshCw, CheckCircle2, Database } from 'lucide-react';
import { SaveConfirmationToast } from './components/SaveConfirmationToast';
import {
  saveAllDataToStorage,
  clearAllSavedData,
} from './utils/persistenceHelper';

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

  const [patrolUnits] = useState<PatrolUnit[]>(INITIAL_PATROL_UNITS);
  const [activeTab, setActiveTab] = useState<ActiveTab>('VISTA_RESUMEN');
  const [centerMode, setCenterMode] = useState<'GRAFICOS' | 'MAPA'>('GRAFICOS');

  const { titles, updateTitle, resetTitles, isCustomTitles } = useEditableTitles();
  const [filters, setFilters] = useState<FilterState>(INITIAL_FILTERS);

  // Modales
  const [isExcelModalOpen, setIsExcelModalOpen] = useState(false);
  const [isNewIncidentOpen, setIsNewIncidentOpen] = useState(false);
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [isMonthlyReportModalOpen, setIsMonthlyReportModalOpen] = useState(false);
  const [isAnnualConsolidatedModalOpen, setIsAnnualConsolidatedModalOpen] = useState(false);
  const [isAlertsModalOpen, setIsAlertsModalOpen] = useState(false);
  const [isClearConfirmOpen, setIsClearConfirmOpen] = useState(false);

  const [dataSourceType, setDataSourceType] = useState<'SUPABASE' | 'LOCAL'>('SUPABASE');

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
          // Continúa
        }
      }
      if (res && res.ok) {
        const buffer = await res.arrayBuffer();
        const parsedRecords = parseAndConvertExcelBuffer(buffer);
        if (parsedRecords && parsedRecords.length > 0) {
          const cleanFileName = usedPath.split('/').pop()?.replace(/%20/g, ' ') || 'base_de_datos.xlsx';
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
      console.error('Error cargando respaldo:', e);
      setIsLoadingFile(false);
    }
  };

  const loadSupabaseData = async (silent: boolean = false) => {
    if (!silent) setIsLoadingFile(true);
    setFileLoadError(null);

    try {
      const result = await fetchAllRegistrosFromSupabase();

      if (result.status === 'ERROR') {
        const errMsg = result.error?.message || 'Error al conectar con la base de datos Supabase';
        console.warn('Aviso Supabase:', errMsg);
        setFileLoadError(errMsg);
        await loadBaseDeDatosFallback();
        return;
      }

      if (result.records && result.records.length > 0) {
        setBaseDeDatos(result.records);
        setIsCustomDataLoaded(true);
        setLastSavedAt(`Supabase en Vivo: ${result.records.length.toLocaleString()} registros sincronizados`);
        setDataSourceType('SUPABASE');
        setFilters(INITIAL_FILTERS);
        setIsLoadingFile(false);
        return;
      }

      await loadBaseDeDatosFallback();
    } catch (err: unknown) {
      console.error('Error consultando Supabase:', err);
      await loadBaseDeDatosFallback();
    }
  };

  useEffect(() => {
    loadSupabaseData();

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

  const handleUploadFileToSupabase = async (file: File) => {
    try {
      setIsLoadingFile(true);
      setUploadProgress({
        stage: 'PARSING',
        message: `Leyendo "${file.name}"...`,
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
          message: `¡${res.totalUploaded.toLocaleString()} registros guardados con éxito en Supabase!`,
          percent: 100,
          currentBatch: Math.ceil(res.totalUploaded / 1000),
          totalBatches: Math.ceil(res.totalUploaded / 1000),
          totalRows: res.totalUploaded,
        });

        setTimeout(async () => {
          await loadSupabaseData();
          setUploadProgress(null);
          setIsExcelModalOpen(false);
          setIsSaveToastOpen(true);
        }, 1500);
        return;
      }

      const isRls = res.error?.code === '42501' || String(res.error?.message || '').includes('row-level security');
      const detail = isRls
        ? 'Desactiva RLS o crea política de INSERT para anon en la tabla "registros".'
        : (res.error?.message || 'Error al guardar datos');

      setUploadProgress({
        stage: 'ERROR',
        message: detail,
        percent: 100,
        currentBatch: 0,
        totalBatches: 0,
        totalRows: 0,
        error: res.error,
      });

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
      alert('Error procesando archivo: ' + (err instanceof Error ? err.message : 'Error'));
      setIsLoadingFile(false);
      setUploadProgress(null);
    }
  };

  const handleDirectFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      await handleUploadFileToSupabase(file);
    } finally {
      if (e.target) e.target.value = '';
    }
  };

  useEffect(() => {
    if (activeTab === 'MAPA_CALOR') {
      setCenterMode('MAPA');
    }
  }, [activeTab]);

  const filteredRecords = useMemo(() => {
    return records.filter((r) => {
      if (filters.zonas.length > 0 && !filters.zonas.includes(r.zona)) return false;
      if (filters.comisarias.length > 0 && !filters.comisarias.includes(r.comisaria)) return false;
      if (filters.turnos.length > 0 && !filters.turnos.includes(r.turno)) return false;
      if (filters.meses.length > 0 && !filters.meses.includes(r.mes)) return false;
      if (filters.incidencias.length > 0 && !filters.incidencias.includes(r.tipoIncidencia)) return false;
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

  const handleOpenExcelModal = () => setIsExcelModalOpen(true);

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
        setTimeout(() => setJustSaved(false), 4000);
      } else {
        alert('Error al guardar datos: ' + (res.error || 'Almacenamiento no disponible'));
      }
    } catch (err: unknown) {
      alert('Error al guardar datos: ' + (err instanceof Error ? err.message : 'Error inesperado'));
    }
  };

  const handleDataImported = async (newRecords: IncidentRecord[], _append?: boolean) => {
    setRecords(newRecords);
    setIsCustomDataLoaded(true);
    setFilters(INITIAL_FILTERS);
    try {
      const res = await saveAllDataToStorage(newRecords, titles);
      if (res.success) {
        setLastSavedAt(res.timestamp);
        setHasUnsavedChanges(false);
        setJustSaved(true);
        setTimeout(() => setJustSaved(false), 4000);
      }
    } catch (err) {
      console.warn('Error guardando:', err);
    }
    soundManager.playSuccess();
    setIsSaveToastOpen(true);
    setActiveTab('VISTA_RESUMEN');
  };

  const handleClearAllData = async () => {
    await clearAllSavedData();
    setRecords([]);
    setIsCustomDataLoaded(false);
    setLastSavedAt(null);
    setHasUnsavedChanges(false);
    setFilters(INITIAL_FILTERS);
    soundManager.playClick();
    setIsExcelModalOpen(true);
  };

  const handleResetToDefault = () => {
    requireAdmin('Restablecer sincronización con Supabase', async () => {
      await loadSupabaseData();
      soundManager.playClick();
    });
  };

  const handleDeleteRecord = (id: string) => {
    requireAdmin('Eliminar registro', async () => {
      const updated = records.filter((r) => r.id !== id);
      setRecords(updated);
      await saveAllDataToStorage(updated, titles);
      setHasUnsavedChanges(false);
      soundManager.playClick();
    });
  };

  const handleAddIncident = (newRec: IncidentRecord) => {
    requireAdmin('Registrar nueva incidencia', async () => {
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

  const isMainDashboardTab = activeTab === 'VISTA_RESUMEN' || activeTab === 'MAPA_CALOR';

  return (
    <div className="min-h-screen bg-[#070b14] text-slate-100 flex flex-col font-sans select-none antialiased relative">
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
        {isMainDashboardTab && (
          <div className="w-full">
            {centerMode === 'GRAFICOS' ? (
              /* AHORA CARGA DIRECTO EL CENTRO DE MANDO TÁCTICO CON SLICER */
              <AnalyticsDashboardView
                records={records}
                onFilterZona={(z) => setFilters((prev) => ({ ...prev, zonas: [z as ZonaType] }))}
                onFilterTurno={(t) => setFilters((prev) => ({ ...prev, turnos: [t as TurnoType] }))}
              />
            ) : (
              <div className="flex-1 flex flex-col min-h-[680px] rounded-lg overflow-hidden border-2 border-cyan-500/30 shadow-xl bg-slate-950">
                <MapErrorBoundary fallbackTitle="Radar GIS Municipal y Mapa de Calor">
                  <TacticalMapView
                    records={filteredRecords}
                    patrolUnits={patrolUnits}
                    onSelectIncident={() => {}}
                    onDispatchUnit={(unitId, loc) => {
                      soundManager.playEmergency();
                      alert(`¡Unidad ${unitId} despachada hacia ${loc}!`);
                    }}
                  />
                </MapErrorBoundary>
              </div>
            )}
          </div>
        )}

        {/* Secondary Views */}
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

      <Footer />

      <SaveConfirmationToast
        isOpen={isSaveToastOpen}
        onClose={() => setIsSaveToastOpen(false)}
        recordsCount={records.length}
        records={records}
        lastSavedAt={lastSavedAt}
        titles={titles}
      />

      <input
        type="file"
        ref={fileInputRef}
        accept=".xlsx,.xls,.csv"
        onChange={handleDirectFileUpload}
        className="hidden"
      />

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

      <AdminAuthModal />
    </div>
  );
}

// Componente Intro integrado directamente en App.tsx para evitar errores de rutas
function IntroSplashView({ onEnterDashboard }: { onEnterDashboard: () => void }) {
  const [animationProgress, setAnimationProgress] = React.useState<number>(0);
  const [canEnter, setCanEnter] = React.useState<boolean>(false);
  const canvasRef = React.useRef<HTMLCanvasElement | null>(null);

  React.useEffect(() => {
    const interval = setInterval(() => {
      setAnimationProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          return 100;
        }
        return prev + 3;
      });
    }, 30);
    return () => clearInterval(interval);
  }, []);

  React.useEffect(() => {
    if (animationProgress >= 100) {
      setCanEnter(true);
    }
  }, [animationProgress]);

  // Animación Canvas de nodos cibernéticos
  React.useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let angle = 0;

    const resize = () => {
      canvas.width = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
    };
    resize();
    window.addEventListener('resize', resize);

    const particles = Array.from({ length: 60 }, () => ({
      x: (Math.random() - 0.5) * 250,
      y: (Math.random() - 0.5) * 250,
      z: (Math.random() - 0.5) * 250,
      size: Math.random() * 3 + 1.5
    }));

    const render = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const cx = canvas.width / 2;
      const cy = canvas.height / 2;

      angle += 0.008;
      const cos = Math.cos(angle);
      const sin = Math.sin(angle);

      ctx.strokeStyle = 'rgba(34, 211, 238, 0.2)';
      ctx.lineWidth = 0.8;

      particles.forEach((p1, i) => {
        const x1 = p1.x * cos - p1.z * sin;
        const z1 = p1.z * cos + p1.x * sin;
        const scale1 = 300 / (300 + z1);
        const px1 = cx + x1 * scale1;
        const py1 = cy + p1.y * scale1;

        particles.forEach((p2, j) => {
          if (i < j) {
            const x2 = p2.x * cos - p2.z * sin;
            const z2 = p2.z * cos + p2.x * sin;
            const scale2 = 300 / (300 + z2);
            const px2 = cx + x2 * scale1;
            const py2 = cy + p2.y * scale1;

            const dist = Math.hypot(px1 - px2, py1 - py2);
            if (dist < 65) {
              ctx.beginPath();
              ctx.moveTo(px1, py1);
              ctx.lineTo(px2, py2);
              ctx.stroke();
            }
          }
        });

        ctx.fillStyle = i % 2 === 0 ? '#38bdf8' : '#34d399';
        ctx.shadowColor = '#22d3ee';
        ctx.shadowBlur = 10;
        ctx.fillRect(px1 - p1.size / 2, py1 - p1.size / 2, p1.size * scale1, p1.size * scale1);
        ctx.shadowBlur = 0;
      });

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener('resize', resize);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <div className="fixed inset-0 z-[99999] bg-[#02060f] flex flex-col items-center justify-center p-4 select-none font-mono overflow-hidden">
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full pointer-events-none opacity-85" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_50%,rgba(2,6,15,0.4),rgba(2,6,15,0.92))] pointer-events-none" />

      <div className="relative z-10 flex flex-col items-center max-w-lg w-full text-center">
        <div className="text-[10px] sm:text-xs tracking-[0.25em] text-cyan-300 font-bold uppercase mb-1 drop-shadow-[0_0_10px_rgba(34,211,238,0.8)]">
          MUNICIPALIDAD DISTRITAL DE NUEVO CHIMBOTE
        </div>
        <div className="text-[11px] sm:text-sm tracking-[0.18em] text-emerald-300 font-black uppercase mb-6 border-b border-cyan-500/40 pb-2.5 w-full">
          SUB GERENCIA DE SERENAZGO // SICEP C2
        </div>

        {/* LOGO OFICIAL DE SERENAZGO COMO BOTÓN INTERACTIVO */}
        <div className="relative my-4 group">
          <div className="absolute -inset-4 rounded-full border-2 border-dashed border-cyan-400/60 animate-spin" style={{ animationDuration: '22s' }} />
          <div className="absolute -inset-8 rounded-full border border-emerald-400/40 animate-spin" style={{ animationDuration: '32s', animationDirection: 'reverse' }} />
          
          {canEnter && (
            <div className="absolute -inset-3 rounded-full bg-emerald-500/30 blur-xl animate-pulse" />
          )}

          <button
            onClick={() => {
              if (canEnter) onEnterDashboard();
            }}
            disabled={!canEnter}
            className={`relative w-48 h-48 sm:w-56 sm:h-56 rounded-full p-2 bg-gradient-to-br from-cyan-950 via-[#061830] to-slate-950 border-4 ${
              canEnter 
                ? 'border-emerald-400 shadow-[0_0_65px_rgba(16,185,129,0.9)] cursor-pointer hover:scale-105' 
                : 'border-cyan-500/60 shadow-[0_0_35px_rgba(6,182,212,0.5)] cursor-wait'
            } transition-all duration-500 flex items-center justify-center overflow-hidden`}
          >
            <img
              src="/logo-serenazgo.png"
              alt="Escudo Oficial Sub Gerencia de Serenazgo Nuevo Chimbote"
              className="w-full h-full object-cover rounded-full filter contrast-115 drop-shadow-[0_0_15px_rgba(34,211,238,0.9)]"
            />

            {!canEnter && (
              <div className="absolute inset-0 bg-slate-950/85 backdrop-blur-[2px] flex flex-col items-center justify-center text-cyan-200">
                <span className="text-[10px] font-bold tracking-wider animate-pulse">CARGANDO...</span>
              </div>
            )}
          </button>
        </div>

        {/* BARRA DE PROGRESO */}
        <div className="w-full bg-[#051326]/90 border border-cyan-500/50 rounded-xl p-3.5 mt-4 shadow-[inset_0_0_20px_rgba(6,182,212,0.2)] backdrop-blur-md">
          <div className="flex justify-between items-center text-[10px] text-cyan-200 mb-2 font-bold">
            <span>ESTADO DE SISTEMA:</span>
            <span className={canEnter ? 'text-emerald-300 font-black' : 'text-amber-300'}>
              {canEnter ? 'LISTO PARA ACCESO' : `SINCRONIZANDO (${Math.round(animationProgress)}%)`}
            </span>
          </div>
          <div className="w-full bg-cyan-950 h-2 rounded-full overflow-hidden border border-cyan-400/40">
            <div
              className="h-full bg-gradient-to-r from-cyan-400 via-emerald-400 to-cyan-300 transition-all duration-200 shadow-[0_0_10px_#10b981]"
              style={{ width: `${animationProgress}%` }}
            />
          </div>
        </div>

        {/* BOTÓN DE INGRESO */}
        <div className="mt-5">
          {canEnter ? (
            <button
              onClick={onEnterDashboard}
              className="px-8 py-3.5 bg-gradient-to-r from-emerald-500 via-cyan-400 to-emerald-500 hover:from-emerald-400 hover:to-cyan-300 text-slate-950 rounded-xl text-xs font-black uppercase tracking-widest shadow-[0_0_35px_rgba(16,185,129,0.8)] cursor-pointer transition animate-pulse"
            >
              INGRESAR A SICEP // SERENAZGO
            </button>
          ) : (
            <div className="text-[10px] text-cyan-400/80 animate-pulse tracking-wider">
              [ EL ESCUDO SE ACTIVARÁ AL COMPLETAR LA CARGA ]
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// Función principal App controlando el estado del Intro
export default function App() {
  const [showIntro, setShowIntro] = React.useState<boolean>(true);

  return (
    <>
      {showIntro ? (
        <IntroSplashView onEnterDashboard={() => setShowIntro(false)} />
      ) : (
        <AuthProvider>
          <CustomTitlesProvider>
            <DashboardInner />
          </CustomTitlesProvider>
        </AuthProvider>
      )}
    </>
  );
}
