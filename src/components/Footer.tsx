import React from 'react';
import { SerenazgoLogo } from './SerenazgoLogo';
import { Code2, MapPin, Phone, PhoneCall, Radio, MessageCircle } from 'lucide-react';

const EMERGENCY_NUMBERS = [
  { display: '927 420 002', raw: '927420002' },
  { display: '927 640 006', raw: '927640006' },
  { display: '935 912 001', raw: '935912001' },
  { display: '916 140 004', raw: '916140004' },
];

export const Footer: React.FC = () => {
  return (
    <footer className="w-full bg-gradient-to-r from-[#061528] via-[#09203d] to-[#061528] border-t-2 border-cyan-800/60 text-slate-300 py-6 px-4 sm:px-8 mt-8 shadow-2xl">
      <div className="max-w-[1920px] mx-auto flex flex-col gap-5">
        {/* Fila Superior: Identidad Institucional + Créditos de Desarrollador */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          {/* Identidad Institucional */}
          <div className="flex items-center gap-3.5">
            <div className="p-1 rounded-xl bg-cyan-950/80 border border-cyan-500/40 shadow-sm shrink-0">
              <SerenazgoLogo className="w-10 h-10 drop-shadow-[0_0_8px_rgba(6,182,212,0.4)]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-black text-white text-xs sm:text-sm tracking-wider uppercase">
                  MUNICIPALIDAD DISTRITAL DE NUEVO CHIMBOTE
                </span>
                <span className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-cyan-950 text-cyan-300 border border-cyan-500/40">
                  <Radio className="w-2.5 h-2.5 text-cyan-400 animate-pulse" />
                  Servicio Activo 24 Horas
                </span>
              </div>
              <p className="text-[11px] text-slate-400 font-medium">
                Subgerencia de Serenazgo y Seguridad Ciudadana &bull; Sistema Integrado de Gestión y Análisis de Patrullaje (SIG-SERENAZGO)
              </p>
              <p className="text-[10px] text-cyan-400/80 font-mono mt-0.5">
                Periodo Operativo Oficial: Enero 2023 – Agosto 2026 &bull; Central de Despacho y Monitoreo Táctico
              </p>
            </div>
          </div>

          {/* Créditos Obligatorios de Desarrollador */}
          <div className="flex items-center gap-2.5 bg-[#0b264a] px-4 py-2 rounded-xl border border-cyan-400/50 shadow-md">
            <div className="p-1.5 rounded-lg bg-cyan-900/60 text-cyan-300">
              <Code2 className="w-4 h-4" />
            </div>
            <div className="text-left">
              <span className="text-[10px] font-bold uppercase tracking-wider text-cyan-300/90 block font-mono">
                Créditos de Desarrollador
              </span>
              <span className="text-xs sm:text-sm font-black text-white tracking-wide">
                Desarrollado por <strong className="text-cyan-300 underline decoration-cyan-400 underline-offset-2">Arturo David Rivero Onofre</strong>
              </span>
            </div>
          </div>
        </div>

        {/* Sección Central de Emergencia y Contactos Oficiales */}
        <div className="bg-[#051120]/90 rounded-xl border border-cyan-700/60 p-4 shadow-inner flex flex-col items-center gap-3">
          <div className="flex items-center gap-2 text-center">
            <PhoneCall className="w-4 h-4 text-emerald-400 animate-pulse" />
            <h3 className="text-xs sm:text-sm font-black text-white uppercase tracking-wider font-sans">
              CENTRAL DE SERENAZGO - NÚMEROS DE EMERGENCIA (24 HORAS)
            </h3>
          </div>

          {/* Cuadrícula responsiva de los 4 números con botones tel y WhatsApp */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 w-full max-w-5xl">
            {EMERGENCY_NUMBERS.map((item, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between gap-2 bg-[#091e36] hover:bg-[#0d2a4d] border border-cyan-600/50 hover:border-cyan-400 rounded-lg p-2 px-3 shadow transition-all group"
              >
                <a
                  href={`tel:${item.raw}`}
                  className="flex items-center gap-2 text-white hover:text-cyan-200 transition-colors font-mono font-black text-xs sm:text-sm"
                  title={`Llamar al ${item.display}`}
                >
                  <div className="w-7 h-7 rounded-full bg-cyan-950 border border-cyan-500/60 flex items-center justify-center text-cyan-300 group-hover:scale-110 transition-transform">
                    <Phone className="w-3.5 h-3.5 text-cyan-300" />
                  </div>
                  <span>{item.display}</span>
                </a>

                <div className="flex items-center gap-1">
                  <a
                    href={`https://wa.me/51${item.raw}?text=Emergencia%20Serenazgo%20Nuevo%20Chimbote`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-1.5 rounded-md bg-emerald-950/90 hover:bg-emerald-800 text-emerald-300 hover:text-white border border-emerald-500/60 transition-colors text-[10px] font-bold flex items-center gap-1 shadow"
                    title={`Enviar WhatsApp a ${item.display}`}
                  >
                    <MessageCircle className="w-3.5 h-3.5 text-emerald-400" />
                    <span className="text-[10px] font-bold uppercase">WhatsApp</span>
                  </a>

                  <a
                    href={`tel:${item.raw}`}
                    className="p-1.5 rounded-md bg-cyan-950/90 hover:bg-cyan-800 text-cyan-300 hover:text-white border border-cyan-500/60 transition-colors text-[10px] font-bold flex items-center gap-1 shadow"
                    title={`Llamada directa al ${item.display}`}
                  >
                    <PhoneCall className="w-3.5 h-3.5 text-cyan-400" />
                  </a>
                </div>
              </div>
            ))}
          </div>

          {/* Textos Institucionales Oficiales */}
          <div className="flex flex-col items-center text-center gap-1 text-slate-400 text-xs pt-1">
            <p className="text-[11px] sm:text-xs text-slate-300 flex items-center justify-center gap-1.5 font-medium">
              <MapPin className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
              <span>Av. Central s/n, Plaza Mayor de Nuevo Chimbote &bull; Servicio 24 Horas</span>
            </p>
            <p className="text-[10px] sm:text-[11px] text-slate-500 font-mono">
              &copy; 2026 Municipalidad Distrital de Nuevo Chimbote. Todos los derechos reservados.
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
};
