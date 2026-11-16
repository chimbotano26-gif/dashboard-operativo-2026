import React, { useState, useEffect, useRef } from 'react';
import { 
  IncidentRecord, FilterState, ActiveTab, PatrolUnit, 
  ZonaType, TurnoType, ComisariaType, MesType 
} from './types';
import { INITIAL_PATROL_UNITS, SUBSECTORES_CONFIG } from './data/mockData';
import { soundManager } from './utils/audioAlert';
import { 
  exportIncidentsToExcel, parseAndConvertExcelBuffer, 
  parseExcelFile, transformRowsToIncidents 
} from './utils/excelHelper';
import { useEditableTitles } from './utils/useEditableTitles';
import { AuthProvider, useAuth } from './utils/authContext';
import AdminAuthModal from './components/AdminAuthModal';
import { 
  supabase, fetchAllRegistrosFromSupabase, 
  uploadExcelFileToSupabase, UploadProgressInfo, 
  SUPABASE_URL, SUPABASE_TABLE 
} from './utils/supabaseClient';

// Componentes
import Header from './components/Header';
import AnalyticsDashboardView from './components/AnalyticsDashboardView';
import TacticalMapView from './components/TacticalMapView';
import MapErrorBoundary from './components/MapErrorBoundary';
import PlanOperativosView from './components/PlanOperativosView';
import ComparativoView from './components/ComparativoView';
import DetalleIncidenciasView from './components/DetalleIncidenciasView';
import DatabaseExcelHub from './components/DatabaseExcelHub';

// COMPONENTE INTRO: HUD 3D Y TELEMETRÍA SEGURA
function IntroSplashView({ onEnterDashboard }: { onEnterDashboard: () => void }) {
  const [ready, setReady] = useState<boolean>(false);
  const [lastUpdateText, setLastUpdateText] = useState<string>("SINCRONIZANDO TELEMETRÍA C2...");
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      const now = new Date();
      const fechaStr = now.toLocaleDateString('es-PE', { day: '2-digit', month: '2-digit', year: 'numeric' });
      const horaStr = now.toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' });
      setLastUpdateText(`SISTEMA ACTUALIZADO: ${fechaStr} // ${horaStr}`);
      setReady(true);
    }, 1200);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
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

    const particles = Array.from({ length: 180 }, () => {
      const u = Math.random();
      const v = Math.random();
      const theta = u * 2.0 * Math.PI;
      const phi = Math.acos(2.0 * v - 1.0);
      const r = 150 + Math.random() * 45;
      return {
        x: r * Math.sin(phi) * Math.cos(theta),
        y: r * Math.sin(phi) * Math.sin(theta),
        z: r * Math.cos(phi),
        size: Math.random() * 3 + 1,
        color: Math.random() > 0.4 ? '#38bdf8' : '#34d399'
      };
    });

    const render = () => {
      ctx.fillStyle = 'rgba(1, 4, 9, 0.35)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      const cx = canvas.width / 2;
      const cy = canvas.height / 2;

      angleX += 0.007;
      angleY += 0.01;

      const cosX = Math.cos(angleX);
      const sinX = Math.sin(angleX);
      const cosY = Math.cos(angleY);
      const sinY = Math.sin(angleY);

      particles.forEach((p1, i) => {
        const x1 = p1.x * cosY + p1.z * sinY;
        const z1 = -p1.x * sinY + p1.z * cosY;
        const y1 = p1.y * cosX - z1 * sinX;
        const finalZ1 = p1.y * sinX + z1 * cosX;

        const scale1 = 400 / (400 + finalZ1);
        const px1 = cx + x1 * scale1;
        const py1 = cy + y1 * scale1;

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
              ctx.strokeStyle = `rgba(56, 189, 248, ${0.28 * (1 - dist / 55)})`;
              ctx.lineWidth = 0.8;
              ctx.beginPath();
              ctx.moveTo(px1, py1);
              ctx.lineTo(px2, py2);
              ctx.stroke();
            }
          }
        });

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
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full pointer-events-none" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(14,165,233,0.15)_0%,rgba(1,4,9,0.97)_80%)] pointer-events-none" />

      <div className="relative z-10 flex flex-col items-center text-center px-4">
        <div className="mb-6 space-y-1">
          <div className="text-[11px] sm:text-xs tracking-[0.35em] text-cyan-400 font-bold uppercase drop-shadow-[0_0_12px_rgba(34,211,238,0.9)]">
            MUNICIPALIDAD DISTRITAL DE NUEVO CHIMBOTE
          </div>
          <div className="text-sm sm:text-xl tracking-[0.25em] text-emerald-400 font-black uppercase drop-shadow-[0_0_18px_rgba(16,185,129,1)]">
            SUB GERENCIA DE SERENAZGO // SICEP C2
          </div>
        </div>

        <div className="relative my-4">
          <div className="absolute -inset-14 sm:-inset-22 rounded-full border border-cyan-400/40 animate-spin pointer-events-none" style={{ animationDuration: '20s' }} />
          <div className="absolute -inset-8 sm:-inset-14 rounded-full border-2 border-dashed border-emerald-400/60 animate-spin pointer-events-none" style={{ animationDuration: '25s', animationDirection: 'reverse' }} />
          <div className="absolute inset-0 rounded-full bg-cyan-400/30 blur-2xl animate-pulse" style={{ animationDuration: '2s' }} />

          <button
            onClick={() => {
              if (ready) onEnterDashboard();
            }}
            title={ready ? "Hacer clic para ingresar" : "Sincronizando..."}
            className={`relative w-60 h-60 sm:w-72 sm:h-72 rounded-full p-3.5 bg-gradient-to-br from-slate-950 via-cyan-950 to-slate-900 border-4 ${
              ready ? 'border-emerald-400 shadow-[0_0_100px_rgba(16,185,129,0.9)] cursor-pointer hover:scale-105' : 'border-cyan-400 shadow-[0_0_90px_rgba(34,211,238,0.9)] cursor-wait'
            } transition-all duration-500 flex items-center justify-center overflow-hidden`}
          >
            <img
              src="/logo-serenazgo.png"
              alt="Escudo Oficial Sub Gerencia de Serenazgo"
              className="w-full h-full object-cover rounded-full filter contrast-125 drop-shadow-[0_0_30px_rgba(34,211,238,1)]"
            />

            {!ready && (
              <div className="absolute inset-0 bg-slate-950/90 backdrop-blur-md flex flex-col items-center justify-center text-cyan-300">
                <div className="w-10 h-10 border-4 border-cyan-400 border-t-transparent rounded-full animate-spin mb-2" />
                <span className="text-[11px] font-bold tracking-widest animate-pulse">CARGANDO DB...</span>
              </div>
            )}
          </button>
        </div>

        <div className="mt-6 text-xs sm:text-sm font-bold tracking-[0.2em] uppercase">
          {ready ? (
            <div className="space-y-1.5">
              <div className="text-emerald-400 animate-pulse drop-shadow-[0_0_10px_rgba(16,185,129,0.8)]">
                [ HAGA CLIC EN EL ESCUDO PARA INGRESAR ]
              </div>
              <div className="text-[11px] text-cyan-300 tracking-widest bg-slate-950/80 px-4 py-1.5 rounded-lg border border-cyan-500/40 shadow-[inset_0_0_10px_rgba(6,182,212,0.2)]">
                📶 {lastUpdateText}
              </div>
            </div>
          ) : (
            <span className="text-cyan-400/80 animate-pulse">
              CONECTANDO CON SUPABASE & TELEMETRÍA...
            </span>
          )}
        </div>

        <div className="mt-3 text-[10px] text-cyan-400/60 tracking-widest uppercase">
          SICEP C2 COMMAND SYSTEM // NUEVO CHIMBOTE 2026
        </div>
      </div>
    </div>
  );
}

// DASHBOARD INTERNO
function DashboardInner() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('ANALITICA');
  const [records, setRecords] = useState<IncidentRecord[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [filters, setFilters] = useState<FilterState>({
    meses: [],
    turnos: [],
    zonas: [],
    subsectores: [],
    comisarias: [],
    searchQuery: '',
    dateRange: { start: '', end: '' }
  });

  useEffect(() => {
    async function loadData() {
      try {
        const data = await fetchAllRegistrosFromSupabase();
        if (data && data.length > 0) {
          setRecords(data);
        }
      } catch (err) {
        console.error("Error cargando registros", err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans">
      <Header 
        activeTab={activeTab} 
        setActiveTab={setActiveTab} 
        recordCount={records.length} 
      />
      <main className="p-4">
        {activeTab === 'ANALITICA' && <AnalyticsDashboardView records={records} />}
        {activeTab === 'MAPA_CALOR' && <TacticalMapView records={records} />}
        {activeTab === 'PLAN_OPERATIVO' && <PlanOperativosView />}
        {activeTab === 'COMPARATIVO' && <ComparativoView records={records} />}
        {activeTab === 'DETALLE' && <DetalleIncidenciasView records={records} />}
        {activeTab === 'EXCEL_HUB' && <DatabaseExcelHub />}
      </main>
    </div>
  );
}

// APP PRINCIPAL
export default function App() {
  const [showIntro, setShowIntro] = useState<boolean>(true);

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
