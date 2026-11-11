import React, { useState } from 'react';
import { Settings, Shield, Bell, Database, Phone, CheckCircle, RotateCcw } from 'lucide-react';

interface ConfiguracionViewProps {
  onResetDatabase: () => void;
  isCustomDataLoaded: boolean;
  totalRecordsCount: number;
}

export const ConfiguracionView: React.FC<ConfiguracionViewProps> = ({
  onResetDatabase,
  isCustomDataLoaded,
  totalRecordsCount,
}) => {
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [criticalThreshold, setCriticalThreshold] = useState(400);
  const [savedSuccess, setSavedSuccess] = useState(false);

  const handleSave = () => {
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2000);
  };

  return (
    <div className="flex-1 flex flex-col gap-4 min-w-0 bg-white rounded-lg border-2 border-slate-300 shadow-sm p-4 text-slate-800">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between pb-3 border-b border-slate-200 gap-2">
        <div>
          <h2 className="text-base font-black text-[#0f3460] uppercase tracking-wide flex items-center gap-2">
            <Settings className="w-5 h-5 text-blue-700" />
            <span>CONFIGURACIÓN DEL SISTEMA Y PARÁMETROS OPERATIVOS</span>
          </h2>
          <p className="text-xs text-slate-500">
            Ajustes de alertas, umbrales de seguridad y gestión de almacenamiento
          </p>
        </div>
      </div>

      {savedSuccess && (
        <div className="p-3 rounded-lg bg-emerald-100 border border-emerald-400 text-emerald-800 text-xs flex items-center gap-2">
          <CheckCircle className="w-4 h-4 text-emerald-600" />
          <span className="font-bold">¡Parámetros guardados y sincronizados correctamente!</span>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Parámetros de Alerta */}
        <div className="p-4 rounded-lg border border-slate-200 bg-slate-50 space-y-4">
          <h3 className="text-xs font-black uppercase text-[#0f3460] flex items-center gap-2">
            <Bell className="w-4 h-4 text-blue-700" />
            <span>Umbrales de Monitoreo y Alertas Preventivas</span>
          </h3>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Umbral Crítico por Cuadrante (Atenciones / Mes): {criticalThreshold}
            </label>
            <input
              type="range"
              min="100"
              max="600"
              step="25"
              value={criticalThreshold}
              onChange={(e) => setCriticalThreshold(Number(e.target.value))}
              className="w-full accent-blue-700"
            />
            <div className="flex justify-between text-[10px] text-slate-500 mt-0.5">
              <span>100 atenciones</span>
              <span>Predeterminado: 400</span>
              <span>600 atenciones</span>
            </div>
          </div>

          <div className="flex items-center justify-between pt-2 border-t border-slate-200">
            <div>
              <div className="text-xs font-bold text-slate-800">Alertas de Despacho Inmediato</div>
              <div className="text-[11px] text-slate-500">Notificar al ingresar un nuevo operativo en tiempo real</div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={soundEnabled}
                onChange={(e) => setSoundEnabled(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-9 h-5 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>
        </div>

        {/* Base de Datos y Almacenamiento */}
        <div className="p-4 rounded-lg border border-slate-200 bg-slate-50 space-y-4 flex flex-col justify-between">
          <div>
            <h3 className="text-xs font-black uppercase text-[#0f3460] flex items-center gap-2 mb-2">
              <Database className="w-4 h-4 text-blue-700" />
              <span>Estado del Repositorio de Datos</span>
            </h3>

            <div className="space-y-2 text-xs">
              <div className="flex justify-between p-2 bg-white rounded border border-slate-200">
                <span className="text-slate-600">Base activa:</span>
                <strong className="text-blue-900">
                  {isCustomDataLoaded ? 'Base Subida por Usuario (Excel)' : 'Oficial 2026 Nuevo Chimbote'}
                </strong>
              </div>
              <div className="flex justify-between p-2 bg-white rounded border border-slate-200">
                <span className="text-slate-600">Registros en memoria local:</span>
                <strong className="text-blue-900 font-mono">{totalRecordsCount.toLocaleString()} atenciones</strong>
              </div>
            </div>
          </div>

          <button
            onClick={onResetDatabase}
            className="w-full py-2 px-3 bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold text-xs rounded border border-slate-300 flex items-center justify-center gap-2 transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5 text-slate-500" />
            <span>Restablecer Datos de Demostración Iniciales (1,804)</span>
          </button>
        </div>
      </div>

      <div className="flex justify-end pt-3 border-t border-slate-200">
        <button
          onClick={handleSave}
          className="px-5 py-2 bg-blue-700 hover:bg-blue-800 text-white font-bold text-xs uppercase rounded shadow transition-all active:scale-95"
        >
          Guardar Configuración
        </button>
      </div>
    </div>
  );
};
