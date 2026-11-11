import React from 'react';
import { X, Printer, Download, Shield, FileText } from 'lucide-react';
import { IncidentRecord } from '../types';
import { SerenazgoLogo } from './SerenazgoLogo';

interface ReportPrintModalProps {
  isOpen: boolean;
  onClose: () => void;
  records: IncidentRecord[];
  totalRecordsCount: number;
}

export const ReportPrintModal: React.FC<ReportPrintModalProps> = ({
  isOpen,
  onClose,
  records,
  totalRecordsCount,
}) => {
  if (!isOpen) return null;

  const now = new Date();
  const dateFormatted = now.toLocaleDateString('es-PE', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });

  // Calculate quick metrics
  let centro = 0;
  let norte = 0;
  let sur = 0;
  let tarde = 0;
  let manana = 0;
  let noche = 0;
  let ba = 0;
  let vm = 0;

  const incidenciasCount: Record<string, number> = {};

  records.forEach((r) => {
    if (r.zona === 'ZONA NORTE') norte++;
    else if (r.zona === 'ZONA SUR') sur++;
    else centro++;

    if (r.turno === 'MAÑANA') manana++;
    else if (r.turno === 'TARDE') tarde++;
    else noche++;

    if (r.comisaria === 'CIA VILLA MARIA') vm++;
    else ba++;

    incidenciasCount[r.tipoIncidencia] = (incidenciasCount[r.tipoIncidencia] || 0) + 1;
  });

  const sortedIncidencias = Object.entries(incidenciasCount)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in print:p-0 print:bg-white">
      <div className="bg-white text-slate-800 w-full max-w-3xl max-h-[92vh] rounded-xl border border-slate-300 shadow-2xl flex flex-col overflow-hidden print:max-h-none print:shadow-none print:border-none print:w-full">
        {/* Modal Controls Bar (hidden during print) */}
        <div className="px-5 py-3 bg-[#0a1a36] text-white flex items-center justify-between print:hidden">
          <div className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-cyan-400" />
            <span className="font-bold text-sm uppercase">
              Vista Previa de Informe Oficial &bull; PDF / Impresión
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="px-3.5 py-1.5 rounded bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs flex items-center gap-1.5 shadow"
            >
              <Printer className="w-4 h-4" />
              <span>Imprimir / Guardar como PDF</span>
            </button>
            <button onClick={onClose} className="p-1 hover:text-slate-300">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Document Body */}
        <div className="p-8 overflow-y-auto space-y-6 flex-1 text-slate-800 font-sans print:p-4 relative">
          {/* Marca de Agua Translúcida Oficial Serenazgo de Fondo para Impresiones y Descargas */}
          <div
            className="absolute inset-0 pointer-events-none select-none flex items-center justify-center overflow-hidden z-0"
            style={{ opacity: 0.04 }}
          >
            <img
              src="/logo.png"
              alt=""
              className="w-[450px] h-[450px] object-contain grayscale contrast-125"
            />
          </div>

          {/* Official Letterhead */}
          <div className="text-center border-b-2 border-slate-800 pb-4 relative z-10 flex items-center justify-between gap-4">
            <SerenazgoLogo className="w-16 h-16 shrink-0" />
            <div className="flex-1">
              <div className="text-[11px] font-black tracking-widest uppercase text-slate-600">
                MUNICIPALIDAD DISTRITAL DE NUEVO CHIMBOTE
              </div>
              <div className="text-lg font-black tracking-wider uppercase text-blue-950 mt-1">
                SUBGERENCIA DE SERENAZGO Y SEGURIDAD CIUDADANA
              </div>
              <div className="text-xs font-bold uppercase text-slate-500 tracking-wide mt-0.5">
                REPORTE ESTADÍSTICO CONSOLIDADO DE ATENCIONES Y OPERATIVOS
              </div>
              <div className="text-[11px] text-slate-500 mt-2">
                Fecha de Emisión: <strong>{dateFormatted}</strong> &bull; Central de Monitoreo Nuevo Chimbote
              </div>
            </div>
            <div className="w-16 shrink-0" />
          </div>

          {/* Executive Summary Grid */}
          <div className="grid grid-cols-4 gap-3 text-center">
            <div className="p-3 bg-slate-50 border border-slate-300 rounded">
              <div className="text-2xl font-black text-blue-900">{records.length.toLocaleString()}</div>
              <div className="text-[10px] font-black uppercase text-slate-500 mt-1">Total Atenciones</div>
            </div>
            <div className="p-3 bg-slate-50 border border-slate-300 rounded">
              <div className="text-2xl font-black text-emerald-800">{centro.toLocaleString()}</div>
              <div className="text-[10px] font-black uppercase text-slate-500 mt-1">Zona Centro</div>
            </div>
            <div className="p-3 bg-slate-50 border border-slate-300 rounded">
              <div className="text-2xl font-black text-blue-900">TARDE ({tarde})</div>
              <div className="text-[10px] font-black uppercase text-slate-500 mt-1">Turno Crítico</div>
            </div>
            <div className="p-3 bg-slate-50 border border-slate-300 rounded">
              <div className="text-2xl font-black text-blue-900">84%</div>
              <div className="text-[10px] font-black uppercase text-slate-500 mt-1">CIA Buenos Aires</div>
            </div>
          </div>

          {/* Top Incidents Table */}
          <div>
            <h4 className="text-xs font-black uppercase tracking-wider text-slate-800 mb-2 border-b border-slate-200 pb-1">
              Top Incidentes e Intervenciones con Mayor Frecuencia
            </h4>
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-100 text-slate-700 uppercase text-[10px] font-bold border-b border-slate-300">
                <tr>
                  <th className="p-2">#</th>
                  <th className="p-2">Tipo de Incidencia</th>
                  <th className="p-2 text-right">Cant. Atenciones</th>
                  <th className="p-2 text-right">% del Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {sortedIncidencias.map(([tipo, count], i) => (
                  <tr key={tipo}>
                    <td className="p-2 font-mono text-slate-500">{i + 1}</td>
                    <td className="p-2 font-bold text-slate-800">{tipo}</td>
                    <td className="p-2 text-right font-mono font-bold text-blue-900">{count}</td>
                    <td className="p-2 text-right text-slate-600">
                      {Math.round((count / (records.length || 1)) * 100)}%
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Territorial Distribution */}
          <div>
            <h4 className="text-xs font-black uppercase tracking-wider text-slate-800 mb-2 border-b border-slate-200 pb-1">
              Desglose Jurisdiccional y Turnos
            </h4>
            <div className="grid grid-cols-2 gap-4 text-xs">
              <div className="p-3 bg-slate-50 rounded border border-slate-200">
                <div className="font-bold text-slate-700 mb-2">Por Zona Distrital:</div>
                <div className="space-y-1">
                  <div className="flex justify-between">
                    <span>Zona Centro (Buenos Aires, Bruce, Plaza):</span>
                    <strong className="font-mono">{centro}</strong>
                  </div>
                  <div className="flex justify-between">
                    <span>Zona Sur (Bellamar, PPAO, Casuarinas):</span>
                    <strong className="font-mono">{sur}</strong>
                  </div>
                  <div className="flex justify-between">
                    <span>Zona Norte (Villa María, 1ro de Mayo):</span>
                    <strong className="font-mono">{norte}</strong>
                  </div>
                </div>
              </div>

              <div className="p-3 bg-slate-50 rounded border border-slate-200">
                <div className="font-bold text-slate-700 mb-2">Por Turno Operativo:</div>
                <div className="space-y-1">
                  <div className="flex justify-between">
                    <span>Turno Tarde (15:00 - 23:00):</span>
                    <strong className="font-mono">{tarde}</strong>
                  </div>
                  <div className="flex justify-between">
                    <span>Turno Mañana (07:00 - 15:00):</span>
                    <strong className="font-mono">{manana}</strong>
                  </div>
                  <div className="flex justify-between">
                    <span>Turno Noche (23:00 - 07:00):</span>
                    <strong className="font-mono">{noche}</strong>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Signatures Footer */}
          <div className="grid grid-cols-2 gap-8 pt-12 text-center text-xs">
            <div className="border-t border-slate-400 pt-2">
              <div className="font-bold uppercase text-slate-800">
                Subgerente de Serenazgo
              </div>
              <div className="text-[11px] text-slate-500">
                Municipalidad Distrital de Nuevo Chimbote
              </div>
            </div>
            <div className="border-t border-slate-400 pt-2">
              <div className="font-bold uppercase text-slate-800">
                Jefe de Operaciones de Serenazgo
              </div>
              <div className="text-[11px] text-slate-500">
                Central de Emergencias y Video Vigilancia
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
