import React, { useState, useEffect } from 'react';
import {
  Shield,
  Radio,
  MapPin,
  BarChart3,
  Flame,
  PlusCircle,
  FileSpreadsheet,
  Printer,
  Bell,
  Volume2,
  VolumeX,
  Layers,
  Activity,
  Search,
  CheckCircle2,
  Play,
  Pause,
} from 'lucide-react';
import { AppViewMode } from '../types';
import { soundManager } from '../utils/audioAlert';

interface CommandHeaderProps {
  activeMode: AppViewMode;
  onSelectMode: (mode: AppViewMode) => void;
  onOpenNewIncident: () => void;
  onOpenExcelModal: () => void;
  onOpenReportModal: () => void;
  onOpenAlertsModal: () => void;
  isSimulationActive: boolean;
  onToggleSimulation: () => void;
  totalRecordsCount: number;
  filteredRecordsCount: number;
  isCustomDataLoaded: boolean;
  searchQuery: string;
  onSearchChange: (q: string) => void;
}

export const CommandHeader: React.FC<CommandHeaderProps> = ({
  activeMode,
  onSelectMode,
  onOpenNewIncident,
  onOpenExcelModal,
  onOpenReportModal,
  onOpenAlertsModal,
  isSimulationActive,
  onToggleSimulation,
  totalRecordsCount,
  filteredRecordsCount,
  isCustomDataLoaded,
  searchQuery,
  onSearchChange,
}) => {
  const [currentTime, setCurrentTime] = useState<string>('');
  const [currentDate, setCurrentDate] = useState<string>('');
  const [soundOn, setSoundOn] = useState<boolean>(true);

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(
        now.toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
      );
      setCurrentDate(
        now.toLocaleDateString('es-PE', { weekday: 'short', day: '2-digit', month: 'short' }).toUpperCase()
      );
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  const handleToggleSound = () => {
    const next = !soundOn;
    setSoundOn(next);
    soundManager.setEnabled(next);
    if (next) soundManager.playAlert();
  };

  const navItems: { mode: AppViewMode; label: string; icon: React.ReactNode; badge?: string }[] = [
    {
      mode: 'MAPA_TACTICO',
      label: 'MAPA TÁCTICO & CALOR',
      icon: <Flame className="w-4 h-4 text-rose-400" />,
      badge: 'GIS EN VIVO',
    },
    {
      mode: 'ANALITICA',
      label: 'CENTRO ANALÍTICO',
      icon: <BarChart3 className="w-4 h-4 text-cyan-400" />,
    },
    {
      mode: 'DESPACHO_VIVO',
      label: 'DESPACHO EN VIVO',
      icon: <Radio className="w-4 h-4 text-emerald-400" />,
      badge: 'RADIO',
    },
    {
      mode: 'BASE_DATOS',
      label: 'BASE DE DATOS EXCEL',
      icon: <FileSpreadsheet className="w-4 h-4 text-amber-400" />,
      badge: `${filteredRecordsCount}`,
    },
    {
      mode: 'PLAN_OPERATIVO',
      label: 'PLAN Y CUADRANTES',
      icon: <Layers className="w-4 h-4 text-blue-400" />,
    },
  ];

  return (
    <header className="bg-gradient-to-r from-[#07111e] via-[#0b1b30] to-[#07111e] text-white border-b border-cyan-500/30 shadow-2xl sticky top-0 z-40">
      {/* Top micro-bar: Live status, Ticker & Controls */}
      <div className="px-3 sm:px-4 py-1.5 bg-[#050b14] border-b border-slate-800/80 flex flex-wrap items-center justify-between text-[11px] gap-2">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span className="font-mono font-bold tracking-wider text-emerald-400 uppercase text-[10px]">
              SISTEMA OPERATIVO EN LÍNEA
            </span>
          </div>

          <span className="text-slate-600 hidden sm:inline">&bull;</span>

          <div className="hidden sm:flex items-center gap-1 text-slate-300">
            <Radio className="w-3 h-3 text-cyan-400" />
            <span className="font-semibold text-[10px]">Nuevo Chimbote &bull; Red Provincial del Santa</span>
          </div>

          <span className="text-slate-600 hidden md:inline">&bull;</span>

          <div className="hidden md:flex items-center gap-1.5 text-slate-400 text-[10px]">
            <span>Base de Datos:</span>
            <span
              className={`font-bold px-1.5 py-0.5 rounded text-[9px] ${
                isCustomDataLoaded
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                  : 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
              }`}
            >
              {isCustomDataLoaded ? 'EXCEL PERSONALIZADO' : 'OFICIAL 2026 (1,804 OPS)'}
            </span>
          </div>
        </div>

        {/* Right micro controls */}
        <div className="flex items-center gap-3">
          {/* Live Simulation Toggle */}
          <button
            onClick={onToggleSimulation}
            className={`px-2 py-0.5 rounded text-[10px] font-bold flex items-center gap-1 transition-all ${
              isSimulationActive
                ? 'bg-emerald-600/30 text-emerald-300 border border-emerald-500/60 shadow-[0_0_8px_rgba(16,185,129,0.3)]'
                : 'bg-slate-800 text-slate-400 hover:text-white border border-slate-700'
            }`}
            title="Simular patrullaje y despacho en tiempo real"
          >
            {isSimulationActive ? (
              <>
                <Pause className="w-2.5 h-2.5 text-emerald-400" />
                <span>SIMULADOR ACTIVO</span>
              </>
            ) : (
              <>
                <Play className="w-2.5 h-2.5" />
                <span>INICIAR SIMULACIÓN</span>
              </>
            )}
          </button>

          {/* Sound Toggle */}
          <button
            onClick={handleToggleSound}
            className="text-slate-400 hover:text-cyan-300 transition-colors p-1"
            title={soundOn ? 'Sonido Activado' : 'Sonido Silenciado'}
          >
            {soundOn ? <Volume2 className="w-3.5 h-3.5 text-cyan-400" /> : <VolumeX className="w-3.5 h-3.5" />}
          </button>

          {/* Alerts Bell */}
          <button
            onClick={onOpenAlertsModal}
            className="relative text-slate-300 hover:text-amber-300 transition-colors p-1"
            title="Ver Alertas Operativas"
          >
            <Bell className="w-3.5 h-3.5" />
            <span className="absolute top-0 right-0 w-2 h-2 rounded-full bg-rose-500 animate-ping"></span>
            <span className="absolute top-0 right-0 w-2 h-2 rounded-full bg-rose-500"></span>
          </button>

          {/* Digital Clock */}
          <div className="font-mono text-cyan-300 font-black tracking-wider text-[11px] bg-black/40 px-2 py-0.5 rounded border border-cyan-900/60">
            <span className="text-slate-400 mr-1 text-[10px]">{currentDate}</span>
            <span>{currentTime}</span>
          </div>
        </div>
      </div>

      {/* Main Bar */}
      <div className="px-3 sm:px-4 py-2 flex flex-col md:flex-row items-center justify-between gap-3">
        {/* Logo and Identity */}
        <div className="flex items-center gap-3 w-full md:w-auto justify-between md:justify-start">
          <div className="flex items-center gap-2.5">
            <div className="relative">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-600 via-blue-600 to-indigo-600 p-[2px] shadow-[0_0_15px_rgba(6,182,212,0.4)]">
                <div className="w-full h-full bg-[#071322] rounded-[10px] flex items-center justify-center">
                  <Shield className="w-5 h-5 text-cyan-400" />
                </div>
              </div>
              <span className="absolute -bottom-1 -right-1 w-3.5 h-3.5 bg-emerald-500 rounded-full border-2 border-[#071322] flex items-center justify-center text-[8px] font-black">
                ✓
              </span>
            </div>

            <div>
              <div className="flex items-center gap-1.5">
                <h1 className="text-base font-black tracking-wide bg-gradient-to-r from-white via-cyan-100 to-cyan-400 bg-clip-text text-transparent uppercase leading-tight">
                  SERENAZGO NUEVO CHIMBOTE
                </h1>
                <span className="px-1.5 py-0.2 rounded text-[9px] font-black uppercase bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 tracking-wider">
                  SIG 360°
                </span>
              </div>
              <p className="text-[11px] text-cyan-300/70 font-medium tracking-wide">
                Centro de Control, Monitoreo Táctico y Analítica en Tiempo Real
              </p>
            </div>
          </div>

          {/* Mobile Fast Action */}
          <div className="flex items-center gap-1 md:hidden">
            <button
              onClick={onOpenNewIncident}
              className="p-2 rounded-lg bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-bold"
              title="Registrar Ocurrencia"
            >
              <PlusCircle className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Global Live Search Input */}
        <div className="w-full md:w-72 relative">
          <Search className="w-3.5 h-3.5 text-cyan-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Buscar por código, calle, cuadrante, móvil..."
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-[#05101d] border border-cyan-700/50 rounded-lg text-cyan-100 placeholder-slate-500 focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400/50 transition-all font-medium"
          />
          {searchQuery && (
            <button
              onClick={() => onSearchChange('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] text-slate-400 hover:text-white"
            >
              ✕
            </button>
          )}
        </div>

        {/* Action Buttons */}
        <div className="hidden md:flex items-center gap-2">
          {/* Subir Excel */}
          <button
            onClick={onOpenExcelModal}
            className="px-3 py-1.5 rounded-lg bg-gradient-to-r from-emerald-600/80 to-teal-700/80 hover:from-emerald-500 hover:to-teal-600 text-white font-bold text-xs flex items-center gap-1.5 border border-emerald-400/40 shadow-[0_0_12px_rgba(16,185,129,0.25)] transition-all active:scale-95"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-200" />
            <span>SUBIR MI EXCEL</span>
          </button>

          {/* Registrar Operativo */}
          <button
            onClick={onOpenNewIncident}
            className="px-3.5 py-1.5 rounded-lg bg-gradient-to-r from-cyan-500 via-blue-600 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-white font-extrabold text-xs flex items-center gap-1.5 shadow-[0_0_15px_rgba(6,182,212,0.4)] transition-all active:scale-95 border border-cyan-300/40"
          >
            <PlusCircle className="w-3.5 h-3.5 text-cyan-100" />
            <span>+ REGISTRAR ATENCIÓN</span>
          </button>

          {/* Imprimir Reporte */}
          <button
            onClick={onOpenReportModal}
            className="p-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 transition-colors"
            title="Generar Informe Oficial PDF"
          >
            <Printer className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Modern Navigation Tabs Ribbon */}
      <div className="px-2 sm:px-4 bg-[#050e1a] border-t border-cyan-900/40 flex items-center gap-1 overflow-x-auto scrollbar-none py-1">
        {navItems.map((item) => {
          const isActive = activeMode === item.mode;
          return (
            <button
              key={item.mode}
              onClick={() => onSelectMode(item.mode)}
              className={`px-3.5 py-2 rounded-lg text-xs font-black tracking-wider uppercase transition-all whitespace-nowrap flex items-center gap-2 relative ${
                isActive
                  ? 'bg-gradient-to-r from-cyan-600/30 via-blue-600/30 to-cyan-500/20 text-cyan-300 border border-cyan-500/60 shadow-[0_0_12px_rgba(6,182,212,0.2)]'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50 border border-transparent'
              }`}
            >
              {item.icon}
              <span>{item.label}</span>
              {item.badge && (
                <span
                  className={`text-[9px] px-1.5 py-0.2 rounded font-mono font-bold ${
                    isActive
                      ? 'bg-cyan-400 text-[#071322]'
                      : 'bg-slate-800 text-slate-300 border border-slate-700'
                  }`}
                >
                  {item.badge}
                </span>
              )}
              {isActive && (
                <span className="absolute bottom-0 left-2 right-2 h-[2px] bg-cyan-400 shadow-[0_0_8px_#22d3ee] rounded-full"></span>
              )}
            </button>
          );
        })}
      </div>
    </header>
  );
};
