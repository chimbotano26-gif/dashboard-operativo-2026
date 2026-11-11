import React from 'react';
import { X, BellRing, AlertTriangle, ShieldCheck, Flame, Radio } from 'lucide-react';

interface AlertsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigateToHeatmap: () => void;
}

export const AlertsModal: React.FC<AlertsModalProps> = ({
  isOpen,
  onClose,
  onNavigateToHeatmap,
}) => {
  if (!isOpen) return null;

  const alerts = [
    {
      id: 1,
      severity: 'CRITICAL',
      title: 'Umbral Crítico Superado en Sector S2BA (Plaza Mayor)',
      detail: 'Se registran más de 430 intervenciones en los alrededores de la Plaza Mayor y Av. Pacífico. Se sugiere reforzar patrullaje integrado con Comisaría Buenos Aires.',
      time: 'Hace 10 minutos',
      icon: <Flame className="w-5 h-5 text-rose-500" />,
      color: 'border-rose-500 bg-rose-950/20 text-rose-200',
    },
    {
      id: 2,
      severity: 'HIGH',
      title: 'Horario Crítico: Turno Tarde (15:00 - 23:00)',
      detail: 'El turno tarde concentra el 39% de todas las ocurrencias distritales (697 atenciones). Alerta preventiva activada para cuadrantes comerciales y bancarios.',
      time: 'Hace 45 minutos',
      icon: <AlertTriangle className="w-5 h-5 text-amber-500" />,
      color: 'border-amber-500 bg-amber-950/20 text-amber-200',
    },
    {
      id: 3,
      severity: 'MEDIUM',
      title: 'Incremento Operativo los Días Domingo (400 atenciones)',
      detail: 'Mayor índice de incidencias por consumo de bebidas alcohólicas y alteración del orden en Urb. Bellamar y PPAO los fines de semana.',
      time: 'Hoy 08:00',
      icon: <BellRing className="w-5 h-5 text-cyan-400" />,
      color: 'border-cyan-500 bg-cyan-950/20 text-cyan-200',
    },
    {
      id: 4,
      severity: 'INFO',
      title: 'Interconexión Radial de Operaciones Activa',
      detail: 'Todas las unidades vehiculares y motorizadas reportan enlace radial continuo en frecuencia 156.800 MHz.',
      time: 'Sistema Operativo',
      icon: <Radio className="w-5 h-5 text-emerald-400" />,
      color: 'border-emerald-500 bg-emerald-950/20 text-emerald-200',
    },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
      <div className="bg-[#0b1a33] text-white w-full max-w-xl rounded-xl border border-cyan-700/60 shadow-2xl flex flex-col overflow-hidden">
        {/* Header */}
        <div className="px-5 py-3.5 bg-gradient-to-r from-[#0d274c] to-[#0a1f3d] border-b border-cyan-800/40 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-cyan-950 text-amber-400 border border-amber-500/40">
              <BellRing className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <h3 className="text-base font-black uppercase tracking-wider text-white">
                CENTRAL DE ALERTAS Y NOTIFICACIONES
              </h3>
              <p className="text-xs text-cyan-300/80">
                Monitoreo automático de contingencias operativas en Nuevo Chimbote
              </p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white p-1">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* List of alerts */}
        <div className="p-5 overflow-y-auto space-y-3 max-h-[70vh]">
          {alerts.map((a) => (
            <div key={a.id} className={`p-3 rounded-lg border flex gap-3 ${a.color}`}>
              <div className="shrink-0 mt-0.5">{a.icon}</div>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold uppercase">{a.title}</h4>
                  <span className="text-[10px] opacity-75 font-mono">{a.time}</span>
                </div>
                <p className="text-xs mt-1 leading-relaxed opacity-90">{a.detail}</p>
              </div>
            </div>
          ))}

          <div className="pt-2 flex items-center justify-between">
            <button
              onClick={() => {
                onClose();
                onNavigateToHeatmap();
              }}
              className="text-xs font-bold text-cyan-300 hover:text-cyan-200 underline"
            >
              &rarr; Ver focos de calor en el Mapa Geoespacial
            </button>
            <button
              onClick={onClose}
              className="px-4 py-1.5 rounded bg-slate-800 hover:bg-slate-700 text-xs font-bold text-slate-300"
            >
              Cerrar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
