import React, { useEffect, useState } from 'react';
import { ActiveTab } from '../types';
import {
  BarChart3,
  FileSpreadsheet,
  Layers,
  MapPin,
  FileText,
  Clock,
  Radio,
  ShieldCheck,
  Lock,
  Unlock,
  LogOut,
  FileDown,
  Table,
  PlusCircle,
  Upload,
} from 'lucide-react';
import { useAuth } from '../utils/authContext';
import { SerenazgoLogo } from './SerenazgoLogo';
import { EditableText } from './EditableText';

interface HeaderProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  onOpenMonthlyReport?: () => void;
  onOpenAnnualConsolidated?: () => void;
  onOpenNewIncident?: () => void;
  onOpenExcelModal?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  onOpenMonthlyReport,
  onOpenAnnualConsolidated,
  onOpenNewIncident,
  onOpenExcelModal,
}) => {
  const { isAdmin, adminEmail, openAuthModal, logoutToViewer } = useAuth();
  const [currentTime, setCurrentTime] = useState<string>('');
  const [currentDate, setCurrentDate] = useState<string>('');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(
        now.toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false })
      );
      setCurrentDate(
        now.toLocaleDateString('es-PE', { weekday: 'short', day: '2-digit', month: 'short', year: 'numeric' })
      );
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  const navItems: { id: ActiveTab; label: string; icon: React.ReactNode }[] = [
    { id: 'VISTA_RESUMEN', label: 'VISTA RESUMEN', icon: <BarChart3 className="w-4 h-4" /> },
    { id: 'MAPA_CALOR', label: 'MAPA DE CALOR', icon: <MapPin className="w-4 h-4" /> },
    { id: 'PLAN_OPERATIVOS', label: 'PLAN DE OPERATIVOS', icon: <Layers className="w-4 h-4" /> },
    { id: 'COMPARATIVO', label: 'COMPARATIVO', icon: <FileText className="w-4 h-4" /> },
    { id: 'DETALLE_INCIDENCIAS', label: 'DETALLE INCIDENCIAS', icon: <FileText className="w-4 h-4" /> },
    { id: 'BD', label: 'BD / EXCEL', icon: <FileSpreadsheet className="w-4 h-4" /> },
  ];

  return (
    <header className="bg-gradient-to-r from-[#07172e] via-[#0b2447] to-[#081c38] border-b border-cyan-800/50 shadow-xl sticky top-0 z-30">
      {/* ========================================================================= */}
      {/* TIER 1: CABECERA INSTITUCIONAL LIMPIA (SIN BOTONES REDUNDANTES)            */}
      {/* ========================================================================= */}
      <div className="px-3 sm:px-6 py-2 border-b border-cyan-900/40">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-2.5">
          {/* Lado Izquierdo: Identidad Oficial y Escudo */}
          <div className="flex items-center gap-3">
            <div className="relative flex items-center justify-center shrink-0">
              <SerenazgoLogo className="w-11 h-11 sm:w-12 sm:h-12 md:w-13 md:h-13 hover:scale-105 transition-transform drop-shadow-[0_0_12px_rgba(6,182,212,0.45)]" />
              <span className="absolute -bottom-0.5 -right-0.5 flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500 border border-slate-900 shadow"></span>
              </span>
            </div>

            <div className="min-w-0">
              <EditableText
                idKey="header_title"
                defaultText="SUB - GERENCIA DE SERENAZGO"
                as="h1"
                className="text-base sm:text-lg font-black tracking-wider text-white uppercase drop-shadow-sm font-sans truncate block"
              />
              <EditableText
                idKey="header_subtitle"
                defaultText="MUNICIPALIDAD DISTRITAL DE NUEVO CHIMBOTE • CENTRAL DE MONITOREO Y OPERATIVOS"
                as="p"
                className="text-[11px] text-slate-300/80 tracking-wide font-medium truncate block mt-0.5"
              />
            </div>
          </div>

          {/* Lado Derecho: Modo Lectura/Admin + Reloj Oficial */}
          <div className="flex items-center gap-2.5 flex-wrap justify-between lg:justify-end">
            {/* 1. MODO LECTURA / ADMIN: Contenedor con espacio garantizado y botones de gestión */}
            <div className="shrink-0 flex items-center gap-1.5 flex-wrap">
              {isAdmin ? (
                <>
                  <div className="flex items-center gap-1.5 bg-emerald-950/90 border border-emerald-500/70 rounded-lg px-2.5 py-1 text-xs shadow-sm">
                    <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                    <div className="flex flex-col text-left leading-none">
                      <span className="text-[10px] font-black text-emerald-300 uppercase tracking-tight">
                        ADMINISTRADOR
                      </span>
                      <span className="text-[8px] text-emerald-400/80 font-mono truncate max-w-[110px]">
                        {adminEmail}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={logoutToViewer}
                      title="Cerrar sesión de Administrador (cambiar a Modo Lectura)"
                      className="ml-1 p-1 text-emerald-400 hover:text-white rounded hover:bg-emerald-900/60 transition-colors"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* Botones de Gestión visibles al estar en Modo Administrador */}
                  {onOpenNewIncident && (
                    <button
                      type="button"
                      id="btn-admin-nuevo-operativo"
                      onClick={onOpenNewIncident}
                      className="px-2.5 py-1 rounded-lg bg-gradient-to-r from-cyan-700 to-blue-700 hover:from-cyan-600 hover:to-blue-600 text-white font-bold text-xs flex items-center gap-1.5 shadow transition-all active:scale-95 border border-cyan-400 shrink-0"
                      title="Registrar nuevo operativo o incidencia oficial"
                    >
                      <PlusCircle className="w-3.5 h-3.5 text-cyan-200" />
                      <span>+ Nuevo Operativo</span>
                    </button>
                  )}

                  {onOpenExcelModal && (
                    <button
                      type="button"
                      id="btn-admin-subir-excel"
                      onClick={onOpenExcelModal}
                      className="px-2.5 py-1 rounded-lg bg-blue-900/90 hover:bg-blue-800 text-white font-bold text-xs flex items-center gap-1.5 shadow transition-all active:scale-95 border border-blue-400 shrink-0"
                      title="Subir o actualizar base de datos Excel"
                    >
                      <Upload className="w-3.5 h-3.5 text-blue-200" />
                      <span>Subir Excel</span>
                    </button>
                  )}
                </>
              ) : (
                <button
                  type="button"
                  id="btn-header-login-admin"
                  onClick={() => openAuthModal('Gestión y edición del sistema')}
                  className="flex items-center gap-1.5 bg-amber-950/80 hover:bg-amber-900 border border-amber-500/70 rounded-lg px-2.5 py-1 text-xs text-amber-300 font-bold transition-all shadow-sm hover:scale-[1.02] active:scale-95 group shrink-0"
                  title="El sistema se encuentra en Modo Lectura. Clic aquí para autenticarte como Administrador."
                >
                  <Lock className="w-3.5 h-3.5 text-amber-400 group-hover:hidden shrink-0" />
                  <Unlock className="w-3.5 h-3.5 text-amber-300 hidden group-hover:inline shrink-0" />
                  <span className="text-[11px] font-bold">Modo Lectura</span>
                  <span className="text-[9px] bg-amber-900/90 group-hover:bg-amber-800 px-1.5 py-0.5 rounded text-amber-200 uppercase font-mono font-black border border-amber-600/40">
                    Ingresar Admin
                  </span>
                </button>
              )}
            </div>

            {/* 2. Botones de Reportes Oficiales en Cabecera */}
            {onOpenMonthlyReport && (
              <button
                onClick={onOpenMonthlyReport}
                className="px-2.5 py-1 rounded-lg bg-emerald-700/80 hover:bg-emerald-600 text-white font-bold text-xs flex items-center gap-1.5 shadow transition-all active:scale-95 border border-emerald-500/60 shrink-0"
                title="Descargar Ficha Ejecutiva del Mes (Excel / PDF)"
              >
                <FileDown className="w-3.5 h-3.5 text-emerald-200" />
                <span className="hidden sm:inline">Reporte del Mes</span>
              </button>
            )}

            {onOpenAnnualConsolidated && (
              <button
                onClick={onOpenAnnualConsolidated}
                className="px-2.5 py-1 rounded-lg bg-indigo-700/80 hover:bg-indigo-600 text-white font-bold text-xs flex items-center gap-1.5 shadow transition-all active:scale-95 border border-indigo-500/60 shrink-0"
                title="Ver y Exportar Consolidado General Anual (Matriz Completa de 12 Meses)"
              >
                <Table className="w-3.5 h-3.5 text-indigo-200" />
                <span className="hidden sm:inline">Consolidado Anual</span>
              </button>
            )}

            {/* 3. Reloj Oficial Central */}
            <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 bg-[#0b1d38]/90 rounded-lg border border-cyan-900/60 text-xs shrink-0">
              <Clock className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
              <div className="flex flex-col text-right leading-none">
                <span className="font-mono font-bold text-cyan-300">{currentTime}</span>
                <span className="text-[9px] text-slate-400 uppercase font-medium">{currentDate}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* TIER 2: BARRA DEDICADA DE PESTAÑAS DE NAVEGACIÓN (LIMPIA Y PROFESIONAL)    */}
      {/* ========================================================================= */}
      <div className="px-3 sm:px-6 py-1.5 bg-[#051122]/70 flex items-center justify-start overflow-x-auto scrollbar-none">
        <nav className="flex items-center gap-1.5 min-w-max">
          {navItems.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                id={`tab-${tab.id.toLowerCase()}`}
                onClick={() => setActiveTab(tab.id)}
                className={`whitespace-nowrap px-3.5 py-1.5 rounded-md text-xs font-black uppercase transition-all duration-150 flex items-center gap-1.5 border shadow-sm ${
                  isActive
                    ? 'bg-gradient-to-b from-[#1b6b55] to-[#124d3d] text-white border-emerald-400/70 shadow-emerald-950/40 ring-1 ring-emerald-400/50'
                    : 'bg-[#0e2444]/90 text-slate-300 hover:text-white hover:bg-[#163a6c] border-[#1b3d68]'
                }`}
              >
                {tab.icon}
                <span>{tab.label}</span>
                {tab.id === 'BD' && (
                  <span className="ml-1 px-1.5 py-0.5 rounded text-[9px] font-black uppercase bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                    Base de Datos
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>
    </header>
  );
};
