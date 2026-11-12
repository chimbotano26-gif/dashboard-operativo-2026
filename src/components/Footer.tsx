import React from 'react';
import { Shield } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="bg-[#020813] border-t border-cyan-500/30 py-2.5 px-4 text-center font-mono text-[10px] text-cyan-400/80 select-none">
      <div className="max-w-[1720px] mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Shield className="w-3.5 h-3.5 text-cyan-400" />
          <span>SUB-GERENCIA DE SERENAZGO // MUNICIPALIDAD DISTRITAL DE NUEVO CHIMBOTE</span>
        </div>
        <span className="text-cyan-500/70">SISTEMA DE CIBER-MONITOREO TÁCTICO © 2026</span>
      </div>
    </footer>
  );
};
