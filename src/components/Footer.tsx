import React from 'react';
import { Shield, Code2 } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="bg-[#020813] border-t border-cyan-500/35 py-2.5 px-4 font-mono text-[10px] text-cyan-400/85 select-none">
      <div className="max-w-[1740px] mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Shield className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
          <span>SUB-GERENCIA DE SERENAZGO // MUNICIPALIDAD DISTRITAL DE NUEVO CHIMBOTE</span>
        </div>

        <div className="flex items-center gap-1.5 text-emerald-300/90 font-bold">
          <Code2 className="w-3.5 h-3.5 text-cyan-300 shrink-0" />
          <span>DESARROLLADO POR: ARTURO DAVID RIVERO ONOFRE (ADRO) © 2026</span>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
