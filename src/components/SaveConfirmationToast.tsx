/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import {
  CheckCircle2,
  HardDrive,
  Download,
  FileSpreadsheet,
  X,
  ShieldCheck,
  Sparkles,
} from 'lucide-react';
import { IncidentRecord } from '../types';
import { exportBackupSnapshot } from '../utils/persistenceHelper';
import { exportIncidentsToExcel } from '../utils/excelHelper';

interface SaveConfirmationToastProps {
  isOpen: boolean;
  onClose: () => void;
  recordsCount: number;
  records: IncidentRecord[];
  lastSavedAt: string | null;
  titles?: Record<string, string> | any;
}

export const SaveConfirmationToast: React.FC<SaveConfirmationToastProps> = ({
  isOpen,
  onClose,
  recordsCount,
  records,
  lastSavedAt,
  titles,
}) => {
  if (!isOpen) return null;

  const handleDownloadBackup = () => {
    exportBackupSnapshot(records, titles);
  };

  const handleDownloadExcel = () => {
    exportIncidentsToExcel(records, `Atenciones_Serenazgo_Guardadas_${new Date().toISOString().slice(0, 10)}.xlsx`);
  };

  return (
    <div
      role="alert"
      className="fixed bottom-5 right-4 sm:right-6 z-50 max-w-md w-full bg-[#071a33]/95 backdrop-blur-md border-2 border-emerald-400 rounded-xl shadow-[0_10px_35px_rgba(0,0,0,0.6)] text-white p-4 animate-in fade-in slide-in-from-bottom-5 duration-300"
    >
      <div className="flex items-start gap-3">
        <div className="p-2.5 rounded-lg bg-emerald-500/20 text-emerald-400 border border-emerald-400/50 shrink-0">
          <CheckCircle2 className="w-6 h-6 animate-pulse" />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <h4 className="text-sm font-black uppercase text-emerald-300 tracking-wider flex items-center gap-1.5">
              <span>¡CAMBIOS GUARDADOS!</span>
              <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
            </h4>
            <button
              type="button"
              onClick={onClose}
              className="text-slate-400 hover:text-white p-1 rounded transition-colors"
              title="Cerrar notificación"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <p className="text-xs text-slate-200 mt-1 leading-relaxed">
            Se han guardado permanentemente <strong className="text-white font-mono">{recordsCount.toLocaleString()}</strong> registros y modificaciones en el sistema.
          </p>

          <div className="mt-2 p-2 bg-emerald-950/60 rounded border border-emerald-500/40 text-[11px] text-emerald-200 flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>
              <strong>No será necesario volver a meter datos</strong> al ingresar nuevamente al aplicativo; se cargarán de forma automática.
            </span>
          </div>

          {lastSavedAt && (
            <div className="mt-2 text-[10px] text-slate-400 flex items-center gap-1 font-mono">
              <HardDrive className="w-3 h-3 text-cyan-400" />
              <span>Guardado: {lastSavedAt}</span>
            </div>
          )}

          {/* Quick backup buttons */}
          <div className="mt-3 pt-2.5 border-t border-slate-700/60 flex items-center justify-between gap-2 flex-wrap">
            <button
              type="button"
              onClick={handleDownloadBackup}
              className="text-[11px] font-bold text-cyan-300 hover:text-white bg-[#0e274c] hover:bg-[#14376c] border border-cyan-500/40 rounded px-2.5 py-1 flex items-center gap-1.5 transition-colors shadow-xs"
              title="Descargar archivo JSON de respaldo portable"
            >
              <Download className="w-3 h-3 text-cyan-400" />
              <span>Respaldo JSON</span>
            </button>

            <button
              type="button"
              onClick={handleDownloadExcel}
              className="text-[11px] font-bold text-emerald-300 hover:text-white bg-emerald-950/80 hover:bg-emerald-900 border border-emerald-500/40 rounded px-2.5 py-1 flex items-center gap-1.5 transition-colors shadow-xs"
              title="Descargar libro Excel con datos guardados"
            >
              <FileSpreadsheet className="w-3 h-3 text-emerald-400" />
              <span>Excel</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="text-[11px] font-bold text-slate-300 hover:text-white px-2 py-1 transition-colors ml-auto"
            >
              Entendido
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
