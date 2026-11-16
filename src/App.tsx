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

// INTRO CYBERPUNK 3D AVANZADO (Efecto Red de Nodos Esférica + Logo de Serenazgo)
function IntroSplashView({ onEnterDashboard }: { onEnterDashboard: () => void }) {
  const [ready, setReady] = React.useState<boolean>(false);
  const canvasRef = React.useRef<HTMLCanvasElement | null>(null);

  React.useEffect(() => {
    const timer = setTimeout(() => setReady(true), 1500);
    return () => clearTimeout(timer);
  }, []);

  // Animación 3D idéntica a la referencia: Esfera de nodos y cubos interconectados
  React.useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    let angleX = 0;
    let angleY = 0;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener('resize', resize);

    // Generar estructura esférica de nodos (cubos/puntos 3D)
    const particleCount = 180;
    const particles = Array.from({ length: particleCount }, () => {
      const u = Math.random();
      const v = Math.random();
      const theta = u * 2.0 * Math.PI;
      const phi = Math.acos(2.0 * v - 1.0);
      const r = 140 + Math.random() * 40; // Radio de la esfera
      return {
        x: r * Math.sin(phi) * Math.cos(theta),
        y: r * Math.sin(phi) * Math.sin(theta),
        z: r * Math.cos(phi),
        size: Math.random() * 3 + 1,
        color: Math.random() > 0.4 ? '#38bdf8' : '#34d399'
      };
    });

    const render = () => {
      ctx.fillStyle = 'rgba(2, 6, 23, 0.35)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      const cx = canvas.width / 2;
      const cy = canvas.height / 2;

      angleX += 0.008;
      angleY += 0.012;

      const cosX = Math.cos(angleX);
      const sinX = Math.sin(angleX);
      const cosY = Math.cos(angleY);
      const sinY = Math.sin(angleY);

      // Renderizar conexiones y nodos 3D
      particles.forEach((p1, i) => {
        // Rotación 3D
        const x1 = p1.x * cosY + p1.z * sinY;
        const z1 = -p1.x * sinY + p1.z * cosY;
        const y1 = p1.y * cosX - z1 * sinX;
        const finalZ1 = p1.y * sinX + z1 * cosX;

        const scale1 = 400 / (400 + finalZ1);
        const px1 = cx + x1 * scale1;
        const py1 = cy + y1 * scale1;

        // Conectar nodos cercanos para formar la red cibernética
        particles.forEach((p2, j) => {
          if (i < j) {
            const x2 = p2.x * cosY + p2.z * sinY;
            const z2 = -p2.x * sinY + p2.z * cosY;
            const y2 = p2.y * cosX - z2 * sinX;
            const finalZ2 = p2.y * sinX + z2 * cosX;

            const scale2 = 400 / (400 + finalZ2);
            const px2 = cx + x2 * scale2;
            const py2 = cy + y2 * scale2;

            const dist = Math.hypot(px1 - px2, py1 - py2);
            if (dist < 55) {
              ctx.strokeStyle = `rgba(56, 189, 248, ${0.25 * (1 - dist / 55)})`;
              ctx.lineWidth = 0.8;
              ctx.beginPath();
              ctx.moveTo(px1, py1);
              ctx.lineTo(px2, py2);
              ctx.stroke();
            }
          }
        });

        // Dibujar nodo/cubo brillante
        ctx.fillStyle = p1.color;
        ctx.shadowColor = p1.color;
        ctx.shadowBlur = 10;
        ctx.fillRect(px1 - (p1.size * scale1) / 2, py1 - (p1.size * scale1) / 2, p1.size * scale1, p1.size * scale1);
        ctx.shadowBlur = 0;
      });

      animId = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener('resize', resize);
      cancelAnimationFrame(animId);
    };
  }, []);

  return (
    <div className="fixed inset-0 z-[99999] bg-[#010409] flex flex-col items-center justify-center select-none font-mono overflow-hidden">
      {/* Canvas 3D de fondo */}
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full pointer-events-none" />
      
      {/* Viñeta futurista */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(14,165,233,0.12)_0%,rgba(1,4,9,0.96)_85%)] pointer-events-none" />

      {/* Contenido Central Holográfico */}
      <div className="relative z-10 flex flex-col items-center text-center px-4">
        
        {/* Textos Institucionales */}
        <div className="mb-6 space-y-1">
          <div className="text-[11px] sm:text-xs tracking-[0.35em] text-cyan-400 font-bold uppercase drop-shadow-[0_0_12px_rgba(34,211,238,0.9)]">
            MUNICIPALIDAD DISTRITAL DE NUEVO CHIMBOTE
          </div>
          <div className="text-sm sm:text-xl tracking-[0.25em] text-emerald-400 font-black uppercase drop-shadow-[0_0_18px_rgba(16,185,129,1)]">
            SUB GERENCIA DE SERENAZGO // SICEP C2
          </div>
        </div>

        {/* NÚCLEO CENTRAL CON LA ESFERA DE NODOS Y EL LOGO DE SERENAZGO AL CENTRO */}
        <div className="relative my-6">
          {/* Anillos holográficos exteriores rotando */}
          <div className="absolute -inset-14 sm:-inset-20 rounded-full border border-cyan-400/40 animate-spin pointer-events-none" style={{ animationDuration: '22s' }} />
          <div className="absolute -inset-8 sm:-inset-12 rounded-full border-2 border-dashed border-emerald-400/50 animate-spin pointer-events-none" style={{ animationDuration: '30s', animationDirection: 'reverse' }} />
          <div className="absolute inset-0 rounded-full bg-cyan-500/30 blur-3xl animate-pulse" />

          {/* BOTÓN CON EL LOGO OFICIAL DE SERENAZGO */}
          <button
            onClick={() => {
              if (ready) onEnterDashboard();
            }}
            className="relative w-56 h-56 sm:w-72 sm:h-72 rounded-full p-3 bg-gradient-to-br from-slate-950 via-cyan-950 to-slate-900 border-4 border-cyan-400 shadow-[0_0_100px_rgba(34,211,238,0.8)] group cursor-pointer hover:scale-105 transition-all duration-500 flex items-center justify-center overflow-hidden"
          >
            <div className="absolute inset-0 bg-cyan-500/15 opacity-0 group-hover:opacity-100 transition-opacity" />
            
            <img
              src="/logo-serenazgo.png"
              alt="Escudo Oficial Sub Gerencia de Serenazgo"
              className="w-full h-full object-cover rounded-full filter contrast-125 drop-shadow-[0_0_25px_rgba(34,211,238,1)]"
            />

            {!ready && (
              <div className="absolute inset-0 bg-slate-950/92 backdrop-blur-md flex flex-col items-center justify-center text-cyan-300">
                <div className="w-12 h-12 border-4 border-cyan-400 border-t-transparent rounded-full animate-spin mb-2" />
                <span className="text-xs font-bold tracking-widest animate-pulse">SINCRONIZANDO RED 3D...</span>
              </div>
            )}
          </button>
        </div>

        {/* BOTÓN DE ACCESO PRINCIPAL */}
        <div className="mt-6">
          <button
            onClick={onEnterDashboard}
            className="px-10 py-4 bg-gradient-to-r from-cyan-400 via-emerald-400 to-cyan-500 hover:from-cyan-300 hover:to-emerald-300 text-slate-950 rounded-xl text-sm sm:text-base font-black uppercase tracking-[0.2em] shadow-[0_0_50px_rgba(34,211,238,0.9)] cursor-pointer transition-all hover:scale-105 active:scale-95 animate-pulse"
          >
            INGRESAR AL SISTEMA &rarr;
          </button>
        </div>

        <div className="mt-3 text-[10px] text-cyan-400/70 tracking-widest uppercase">
          SICEP C2 COMMAND SYSTEM // NUEVO CHIMBOTE 2026
        </div>

      </div>
    </div>
  );
}

// CONTROLADOR DE ESTADO APP
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
