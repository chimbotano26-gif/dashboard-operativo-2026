import React from 'react';
import { ActiveTab } from '../types';
import { Shield, Flame, Layers, BarChart2, FileText, Database, FileSpreadsheet, Calendar, Lock, Unlock } from 'lucide-react';
import { useAuth } from '../utils/authContext';

interface HeaderProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  onOpenMonthlyReport: () => void;
  onOpenAnnualConsolidated: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  onOpenMonthlyReport,
  onOpenAnnualConsolidated,
}) => {
  const { isAdmin, requireAdmin, logoutAdmin } = useAuth();

  const navItems: { id: ActiveTab; label: string; icon: React.ReactNode }[] = [
    { id: 'VISTA_RESUMEN', label: 'COMANDO C2', icon: <Shield className="w-3.5 h-3.5" /> },
    { id: 'MAPA_CALOR', label: 'RADAR GIS', icon: <Flame className="w-3.5 h-3.5" /> },
    { id: 'PLAN_OPERATIVOS', label: 'OPERATIVOS', icon: <Layers className="w-3.5 h-3.5" /> },
    { id: 'COMPARATIVO', label: 'COMPARATIVO', icon: <BarChart2 className="w-3.5 h-3.5" /> },
    { id: 'DETALLE_INCIDENCIAS', label: 'BITÁCORA', icon: <FileText className="w-3.5 h-3.5" /> },
    { id: 'BD', label: 'BASE DATOS', icon: <Database className="w-3.5 h-3.5" /> },
  ];

  return (
    <header className="bg-[#020711]/95 border-b border-cyan-400/40 px-4 py-2 flex flex-wrap items-center justify-between gap-2 sticky top-0 z-40 backdrop-blur-xl shadow-[0_4px_30px_rgba(6,182,212,0.25)]">
      <div className="flex items-center gap-2.5">
        <img src="/logo.png" alt="Serenazgo" className="w-8 h-8 object-contain drop-shadow-[0_0_8px_rgba(34,211,238,0.7)]" />
        <div className="font-mono">
          <div className="text-xs font-black tracking-widest text-white uppercase">
            SERENAZGO <span className="text-cyan-400">// NUEVO CHIMBOTE</span>
          </div>
          <div className="text-[9px] text-cyan-400/80 tracking-wider">CIBER-MONITOREO TÁCTICO C2</div>
        </div>
      </div>

      <nav className="flex flex-wrap items-center gap-1.5 bg-[#030b18] p-1 rounded-xl border border-cyan-500/40 shadow-[inset_0_0_15px_rgba(6,182,212,0.12)]">
        {navItems.map((item) => {
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-mono uppercase tracking-wider transition-all cursor-pointer ${
                isActive
                  ? 'bg-gradient-to-r from-cyan-500/35 to-emerald-500/35 border border-cyan-300 text-white font-black shadow-[0_0_15px_rgba(34,211,238,0.55)]'
                  : 'text-cyan-300/75 hover:text-white hover:bg-cyan-950/70 border border-transparent'
              }`}
            >
              {item.icon}
              <span>{item.label}</span>
            </button>
          );
        })}
      </nav>

      <div className="flex items-center gap-2">
        <button
          onClick={onOpenMonthlyReport}
          className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-emerald-500/15 hover:bg-emerald-500/30 border border-emerald-400/60 text-emerald-300 text-[10px] font-mono font-bold uppercase cursor-pointer"
        >
          <Calendar className="w-3 h-3" /> MES
        </button>
        <button
          onClick={onOpenAnnualConsolidated}
          className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-fuchsia-500/15 hover:bg-fuchsia-500/30 border border-fuchsia-400/60 text-fuchsia-300 text-[10px] font-mono font-bold uppercase cursor-pointer"
        >
          <FileSpreadsheet className="w-3 h-3" /> ANUAL
        </button>
        {isAdmin ? (
          <button
            onClick={logoutAdmin}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-amber-500/20 border border-amber-400 text-amber-300 text-[10px] font-mono font-bold uppercase cursor-pointer"
          >
            <Unlock className="w-3 h-3" /> ADMIN
          </button>
        ) : (
          <button
            onClick={() => requireAdmin('Acceso Administrativo', () => {})}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-slate-950 border border-cyan-500/40 text-cyan-300 text-[10px] font-mono uppercase cursor-pointer hover:border-cyan-300"
          >
            <Lock className="w-3 h-3" /> ACCESO
          </button>
        )}
      </div>
    </header>
  );
};
