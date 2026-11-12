import React from 'react';
import { ActiveTab } from '../types';
import { Shield, Database, Lock, Unlock } from 'lucide-react';
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
}) => {
  const { isAdmin, requireAdmin, logoutAdmin } = useAuth();

  return (
    <header className="bg-[#020711]/95 border-b border-cyan-400/40 px-4 py-2 flex flex-wrap items-center justify-between gap-2 sticky top-0 z-40 backdrop-blur-xl shadow-[0_4px_30px_rgba(6,182,212,0.25)]">
      {/* Identidad Institucional */}
      <div className="flex items-center gap-2.5">
        <img src="/logo.png" alt="Serenazgo" className="w-8 h-8 object-contain drop-shadow-[0_0_8px_rgba(34,211,238,0.7)]" />
        <div className="font-mono">
          <div className="text-xs font-black tracking-widest text-white uppercase">
            SERENAZGO <span className="text-cyan-400">// NUEVO CHIMBOTE</span>
          </div>
          <div className="text-[9px] text-cyan-400/80 tracking-wider">CONSOLA TÁCTICA C2 DE SECTORIZACIÓN</div>
        </div>
      </div>

      {/* Selector Mínimo: Consola C2 o Base de Datos */}
      <div className="flex items-center gap-2">
        <button
          onClick={() => setActiveTab('VISTA_RESUMEN')}
          className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-[10px] font-mono uppercase tracking-wider transition-all cursor-pointer ${
            activeTab === 'VISTA_RESUMEN'
              ? 'bg-gradient-to-r from-cyan-500/35 to-emerald-500/35 border border-cyan-300 text-white font-black shadow-[0_0_15px_rgba(34,211,238,0.55)]'
              : 'text-cyan-300/75 hover:text-white bg-[#030b18] border border-cyan-500/30'
          }`}
        >
          <Shield className="w-3.5 h-3.5" />
          <span>COMANDO C2</span>
        </button>

        <button
          onClick={() => setActiveTab('BD')}
          className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-[10px] font-mono uppercase tracking-wider transition-all cursor-pointer ${
            activeTab === 'BD'
              ? 'bg-gradient-to-r from-cyan-500/35 to-emerald-500/35 border border-cyan-300 text-white font-black shadow-[0_0_15px_rgba(34,211,238,0.55)]'
              : 'text-cyan-300/75 hover:text-white bg-[#030b18] border border-cyan-500/30'
          }`}
        >
          <Database className="w-3.5 h-3.5" />
          <span>BASE DE DATOS</span>
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
