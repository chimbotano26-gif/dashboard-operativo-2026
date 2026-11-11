import React, { useState, useEffect, useMemo } from 'react';
import {
  ShieldAlert,
  Car,
  Clock,
  Radio,
  Search,
  Calendar,
  BarChart3,
  TrendingUp,
  FileText,
  Shield,
  Zap,
  Filter,
  Save,
  RotateCcw,
  Printer,
  Download,
  CheckCircle2,
  AlertTriangle,
  Users,
  Building,
  Flame,
  FileSpreadsheet,
  X,
  Layers,
} from 'lucide-react';
import {
  FLOTA_CONSOLIDADA,
  CAMIONETAS_FLOTA,
  MOTOS_FLOTA,
  CRONOGRAMA_OPERATIVO_SEMANAL,
  METRICAS_FLOTA,
  FleetVehicle,
} from '../data/fleetData';
import { EditableText } from './EditableText';
import { MatrizPlanesOperativos } from './MatrizPlanesOperativos';
import { PLANES_OPERATIVOS_CATALOGO } from '../data/planesOperativosData';

export interface VehicleRosterEntry {
  placa: string;
  modelo: string;
  efectivoCargo: string;
  conductor: string;
  operadorIntegradoPNP: string;
  subsectorActual: string;
  operativoActual: string;
  turnoAsignado: 'MAÑANA' | 'TARDE' | 'NOCHE';
  observaciones: string;
}

const STORAGE_KEY = 'serenazgo_rol_patrullaje_v2';

export const PlanOperativosView: React.FC = () => {
  const [activeTab, setActiveTab] = useState<
    'MATRIZ_OPERATIVOS' | 'ROL_PATRULLAJE' | 'CRONOGRAMA' | 'FLOTA' | 'REPORTES'
  >('MATRIZ_OPERATIVOS');

  const [fleetTypeFilter, setFleetTypeFilter] = useState<'ALL' | 'CAMIONETAS' | 'MOTOS'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTurnoRol, setSelectedTurnoRol] = useState<'TODOS' | 'MAÑANA' | 'TARDE' | 'NOCHE'>('MAÑANA');
  const [selectedTurnoCronograma, setSelectedTurnoCronograma] = useState<'TODOS' | 'DIA' | 'TARDE' | 'NOCHE'>('TODOS');
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);
  const [saveSuccessNotice, setSaveSuccessNotice] = useState(false);

  // Inicializar estado editable de vehículos (completamente vacíos por defecto)
  const [rosterData, setRosterData] = useState<Record<string, VehicleRosterEntry>>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        return JSON.parse(saved);
      }
    } catch {
      // Fallback a vacíos
    }
    const initialMap: Record<string, VehicleRosterEntry> = {};
    FLOTA_CONSOLIDADA.forEach((veh) => {
      initialMap[veh.id] = {
        placa: '',                          // Campo editable completamente vacío
        modelo: '',                         // Marca/Modelo editable completamente vacío
        efectivoCargo: '',                  // Nombre de sereno a cargo completamente vacío
        conductor: '',                      // Conductor completamente vacío
        operadorIntegradoPNP: '',           // Efectivo PNP completamente vacío
        subsectorActual: veh.subsectorActual,
        operativoActual: 'Patrullaje Integrado Preventivo',
        turnoAsignado: veh.tipo === 'MOTO' ? 'MAÑANA' : 'MAÑANA',
        observaciones: '',
      };
    });
    return initialMap;
  });

  // Guardar en localStorage ante cambios
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(rosterData));
    } catch {
      // ignore
    }
  }, [rosterData]);

  // Actualizador de campos editables
  const handleUpdateVehicleField = (vehicleId: string, field: keyof VehicleRosterEntry, value: string) => {
    setRosterData((prev) => ({
      ...prev,
      [vehicleId]: {
        ...(prev[vehicleId] || {
          placa: '',
          modelo: '',
          efectivoCargo: '',
          conductor: '',
          operadorIntegradoPNP: '',
          subsectorActual: 'S1BA',
          operativoActual: 'Patrullaje Preventivo',
          turnoAsignado: 'MAÑANA',
          observaciones: '',
        }),
        [field]: value,
      },
    }));
  };

  // Guardar explícito con feedback visual
  const handleExplicitSave = () => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(rosterData));
      setSaveSuccessNotice(true);
      setTimeout(() => setSaveSuccessNotice(false), 3500);
    } catch {
      // ignore
    }
  };

  // Limpiar todos los campos a vacíos
  const handleClearAllFields = () => {
    if (window.confirm('¿Deseas vaciar todos los nombres de serenos, policías, placas y modelos ingresados?')) {
      const cleared: Record<string, VehicleRosterEntry> = {};
      FLOTA_CONSOLIDADA.forEach((veh) => {
        cleared[veh.id] = {
          placa: '',
          modelo: '',
          efectivoCargo: '',
          conductor: '',
          operadorIntegradoPNP: '',
          subsectorActual: veh.subsectorActual,
          operativoActual: 'Patrullaje Preventivo',
          turnoAsignado: 'MAÑANA',
          observaciones: '',
        };
      });
      setRosterData(cleared);
      setSaveSuccessNotice(true);
      setTimeout(() => setSaveSuccessNotice(false), 3500);
    }
  };

  // Exportar Rol de Patrullaje a CSV
  const handleExportCSV = () => {
    const headers = [
      'ID UNIDAD',
      'CÓDIGO MÓVIL',
      'TIPO VEHÍCULO',
      'PLACA',
      'MARCA / MODELO',
      'TURNO ASIGNADO',
      'SERENO A CARGO',
      'CONDUCTOR',
      'EFECTIVO POLICIAL PNP',
      'SUBSECTOR',
      'OPERATIVO ASIGNADO',
      'RESTRICCIÓN OPERATIVA',
    ];

    const rows = FLOTA_CONSOLIDADA.map((veh) => {
      const data = rosterData[veh.id] || {
        placa: '',
        modelo: '',
        efectivoCargo: '',
        conductor: '',
        operadorIntegradoPNP: '',
        subsectorActual: veh.subsectorActual,
        operativoActual: 'Patrullaje Preventivo',
        turnoAsignado: 'MAÑANA',
      };

      const restriccion =
        veh.tipo === 'MOTO'
          ? 'OPERATIVO SOLO EN MAÑANA Y TARDE (NOCHE NO OPERA)'
          : 'OPERATIVO LAS 24 HORAS (MAÑANA, TARDE Y NOCHE)';

      return [
        `"${veh.id}"`,
        `"${veh.codigo}"`,
        `"${veh.tipo}"`,
        `"${data.placa}"`,
        `"${data.modelo}"`,
        `"${data.turnoAsignado}"`,
        `"${data.efectivoCargo}"`,
        `"${data.conductor}"`,
        `"${data.operadorIntegradoPNP}"`,
        `"${data.subsectorActual}"`,
        `"${data.operativoActual}"`,
        `"${restriccion}"`,
      ].join(',');
    });

    const csvContent = '\uFEFF' + [headers.join(','), ...rows].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `ROL_PATRULLAJE_SERENAZGO_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Filtrado de flota y rol según búsqueda y turno
  const filteredFleet = useMemo(() => {
    return FLOTA_CONSOLIDADA.filter((veh) => {
      // Filtro de tipo
      if (fleetTypeFilter === 'CAMIONETAS' && veh.tipo !== 'CAMIONETA') return false;
      if (fleetTypeFilter === 'MOTOS' && veh.tipo !== 'MOTO') return false;

      // Filtro por Turno del Rol
      if (selectedTurnoRol !== 'TODOS') {
        // REGLA OPERATIVA ESTRICTA: Las motos NO realizan turno nocturno
        if (selectedTurnoRol === 'NOCHE' && veh.tipo === 'MOTO') {
          // Si estamos en filtro NOCHE, excluir motos a menos que el usuario esté buscando específicamente
          if (!searchQuery.trim()) return false;
        }
      }

      // Filtro de búsqueda
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const data = rosterData[veh.id];
        const matches =
          veh.codigo.toLowerCase().includes(q) ||
          veh.subsectorActual.toLowerCase().includes(q) ||
          (data?.placa || '').toLowerCase().includes(q) ||
          (data?.modelo || '').toLowerCase().includes(q) ||
          (data?.efectivoCargo || '').toLowerCase().includes(q) ||
          (data?.conductor || '').toLowerCase().includes(q) ||
          (data?.operadorIntegradoPNP || '').toLowerCase().includes(q) ||
          (data?.operativoActual || '').toLowerCase().includes(q);

        if (!matches) return false;
      }

      return true;
    });
  }, [fleetTypeFilter, selectedTurnoRol, searchQuery, rosterData]);

  // Filtrado de cronograma semanal
  const filteredCronograma = useMemo(() => {
    return CRONOGRAMA_OPERATIVO_SEMANAL.filter((fila) => {
      if (selectedTurnoCronograma === 'TODOS') return true;
      return fila.turno === selectedTurnoCronograma;
    });
  }, [selectedTurnoCronograma]);

  return (
    <div className="flex-1 flex flex-col gap-3.5 min-w-0 bg-white rounded-xl border-2 border-slate-300 shadow-sm p-3.5 sm:p-4 text-slate-800">
      {/* Cabecera Principal */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between pb-3 border-b border-slate-200 gap-2.5">
        <div>
          <div className="flex items-center gap-2">
            <ShieldAlert className="w-5 h-5 text-blue-700 shrink-0" />
            <EditableText
              idKey="plan_operativos_header_title"
              defaultText="PLAN OPERATIVO INSTITUCIONAL Y ROL DE PATRULLAJE"
              as="h2"
              className="text-base font-black text-[#0f3460] uppercase tracking-wide"
            />
          </div>
          <EditableText
            idKey="plan_operativos_header_subtitle"
            defaultText="Municipalidad Distrital de Nuevo Chimbote • Directiva de Flota: 24 Camionetas (24 Horas) y 12 Motos (Solo Diurno)"
            as="p"
            className="text-xs text-slate-500 mt-0.5 block"
          />
        </div>

        {/* Global Summary Badges */}
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center gap-1.5 text-xs font-bold bg-blue-50 text-blue-800 px-3 py-1 rounded-full border border-blue-200 shadow-2xs">
            <Car className="w-3.5 h-3.5 text-blue-700" />
            <span>24 Camionetas 4x4 (3 Turnos)</span>
          </div>
          <div className="flex items-center gap-1.5 text-xs font-bold bg-emerald-50 text-emerald-800 px-3 py-1 rounded-full border border-emerald-200 shadow-2xs">
            <Zap className="w-3.5 h-3.5 text-emerald-700" />
            <span>12 Motos (Solo Mañana/Tarde)</span>
          </div>
          <div className="flex items-center gap-1.5 text-xs font-bold bg-amber-50 text-amber-900 px-3 py-1 rounded-full border border-amber-300 shadow-2xs">
            <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse"></span>
            <span>Campos Editables en Vivo</span>
          </div>
        </div>
      </div>

      {/* Alerta de guardado exitoso */}
      {saveSuccessNotice && (
        <div className="bg-emerald-50 border border-emerald-300 text-emerald-800 px-3 py-2 rounded-lg text-xs font-bold flex items-center justify-between shadow-xs transition-all">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>Los cambios del Rol de Patrullaje han sido guardados correctamente en la base local del puesto de mando.</span>
          </div>
          <button
            onClick={() => setSaveSuccessNotice(false)}
            className="text-emerald-700 hover:text-emerald-900 text-xs font-bold"
          >
            Cerrar
          </button>
        </div>
      )}

      {/* Navigation Sub-Tabs */}
      <div className="flex items-center justify-between border-b border-slate-200 pb-2 gap-2 flex-wrap">
        <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
          <button
            onClick={() => setActiveTab('MATRIZ_OPERATIVOS')}
            className={`flex items-center gap-2 px-3 py-1.5 text-xs font-black rounded-lg transition-all ${
              activeTab === 'MATRIZ_OPERATIVOS'
                ? 'bg-gradient-to-r from-[#117a38] to-[#0a5c28] text-white shadow-sm ring-2 ring-emerald-400'
                : 'bg-emerald-50 text-emerald-900 border border-emerald-300 hover:bg-emerald-100'
            }`}
          >
            <ShieldAlert className="w-3.5 h-3.5 text-amber-300" />
            <span>RENDICIÓN DE CUENTAS (9,571 PATRULLAJES)</span>
          </button>

          <button
            onClick={() => setActiveTab('ROL_PATRULLAJE')}
            className={`flex items-center gap-2 px-3 py-1.5 text-xs font-black rounded-lg transition-all ${
              activeTab === 'ROL_PATRULLAJE'
                ? 'bg-[#0f3460] text-white shadow-sm ring-2 ring-blue-400'
                : 'bg-blue-50 text-blue-900 border border-blue-200 hover:bg-blue-100'
            }`}
          >
            <Users className="w-3.5 h-3.5 text-cyan-300" />
            <span>ROL DE PATRULLAJE (CAMPOS EDITABLES)</span>
          </button>

          <button
            onClick={() => setActiveTab('CRONOGRAMA')}
            className={`flex items-center gap-2 px-3 py-1.5 text-xs font-black rounded-lg transition-all ${
              activeTab === 'CRONOGRAMA'
                ? 'bg-[#0f3460] text-white shadow-sm'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-300'
            }`}
          >
            <Calendar className="w-3.5 h-3.5" />
            <span>CRONOGRAMA SEMANAL (OFICIAL)</span>
          </button>

          <button
            onClick={() => setActiveTab('FLOTA')}
            className={`flex items-center gap-2 px-3 py-1.5 text-xs font-black rounded-lg transition-all ${
              activeTab === 'FLOTA'
                ? 'bg-[#0f3460] text-white shadow-sm'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-300'
            }`}
          >
            <Car className="w-3.5 h-3.5" />
            <span>FLOTA ACTIVA (24 CAMIONETAS / 12 MOTOS)</span>
          </button>

          <button
            onClick={() => setActiveTab('REPORTES')}
            className={`flex items-center gap-2 px-3 py-1.5 text-xs font-black rounded-lg transition-all ${
              activeTab === 'REPORTES'
                ? 'bg-[#0f3460] text-white shadow-sm'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-300'
            }`}
          >
            <BarChart3 className="w-3.5 h-3.5" />
            <span>REPORTES SEMANALES Y MENSUALES</span>
          </button>
        </div>

        {/* Action quick info */}
        <div className="text-[11px] font-bold text-slate-500 flex items-center gap-1.5">
          <Clock className="w-3.5 h-3.5 text-blue-700" />
          <span>Servicio Continuo 24 Horas &bull; 100% Cuadrantes Cubiertos</span>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* TAB 0: MATRIZ DE LOCALIZACIÓN POR PLAN OPERATIVO (9,571 PATRULLAJES)       */}
      {/* ========================================================================= */}
      {activeTab === 'MATRIZ_OPERATIVOS' && <MatrizPlanesOperativos />}

      {/* ========================================================================= */}
      {/* TAB 1: ROL DE PATRULLAJE POR TURNO (CAMPOS EDITABLES EN VIVO)             */}
      {/* ========================================================================= */}
      {activeTab === 'ROL_PATRULLAJE' && (
        <div className="flex flex-col gap-3.5">
          {/* Directiva y Regla de Flota Oficial */}
          <div className="bg-gradient-to-r from-blue-900 via-[#103b6d] to-[#0d2e53] text-white p-3.5 rounded-xl border border-cyan-700 shadow-md">
            <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <Shield className="w-5 h-5 text-amber-400 shrink-0" />
                  <h3 className="text-sm font-black uppercase tracking-wider text-cyan-200">
                    Directiva Operativa de Despacho y Asignación de Turnos
                  </h3>
                </div>
                <p className="text-xs text-slate-200 mt-1 leading-relaxed">
                  <strong>1. Camionetas 4x4 (24 unidades):</strong> Operan de forma continua las 24 horas en los tres turnos (<strong>Mañana, Tarde y Noche</strong>).
                  <br />
                  <strong>2. Motocicletas Rápidas (12 unidades):</strong> Operan estrictamente en <strong>Turno Mañana y Turno Tarde</strong>. Por protocolo de seguridad distrital, <strong>NO realizan turno nocturno</strong>.
                </p>
              </div>

              {/* Botones de Acción Rápida del Rol */}
              <div className="flex items-center gap-2 shrink-0 flex-wrap">
                <button
                  onClick={handleExplicitSave}
                  className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs uppercase tracking-wide border border-emerald-400/80 shadow flex items-center gap-1.5 active:scale-95 transition-all"
                  title="Guardar todas las asignaciones ingresadas manualmente"
                >
                  <Save className="w-4 h-4 text-emerald-200" />
                  <span>Guardar Asignaciones</span>
                </button>

                <button
                  onClick={handleClearAllFields}
                  className="px-2.5 py-1.5 rounded-lg bg-rose-950/80 hover:bg-rose-900 text-rose-200 font-bold text-xs uppercase tracking-wide border border-rose-600/50 shadow flex items-center gap-1.5 active:scale-95 transition-all"
                  title="Vaciar todos los campos de nombres, placas y marcas"
                >
                  <RotateCcw className="w-3.5 h-3.5 text-rose-400" />
                  <span>Limpiar Campos</span>
                </button>

                <button
                  onClick={handleExportCSV}
                  className="px-2.5 py-1.5 rounded-lg bg-cyan-900 hover:bg-cyan-800 text-cyan-200 font-bold text-xs uppercase tracking-wide border border-cyan-500/60 shadow flex items-center gap-1.5 active:scale-95 transition-all"
                  title="Descargar planilla del Rol de Patrullaje en CSV"
                >
                  <Download className="w-3.5 h-3.5 text-cyan-300" />
                  <span>Descargar Rol</span>
                </button>

                <button
                  onClick={() => setIsPrintModalOpen(true)}
                  className="px-2.5 py-1.5 rounded-lg bg-white text-slate-900 font-black text-xs uppercase tracking-wide hover:bg-slate-100 shadow flex items-center gap-1.5 active:scale-95 transition-all"
                  title="Vista oficial lista para imprimir o guardar como PDF"
                >
                  <Printer className="w-3.5 h-3.5 text-blue-700" />
                  <span>Imprimir Rol</span>
                </button>
              </div>
            </div>
          </div>

          {/* Filtros de Turno y Búsqueda */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between bg-slate-50 p-2.5 rounded-lg border border-slate-200 gap-2">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-bold text-slate-700">Seleccionar Turno de Operación:</span>
              {(['TODOS', 'MAÑANA', 'TARDE', 'NOCHE'] as const).map((t) => {
                const isActive = selectedTurnoRol === t;
                const isNoche = t === 'NOCHE';

                return (
                  <button
                    key={t}
                    onClick={() => setSelectedTurnoRol(t)}
                    className={`px-3 py-1 rounded-md text-xs font-black uppercase transition-all flex items-center gap-1.5 ${
                      isActive
                        ? isNoche
                          ? 'bg-indigo-900 text-white shadow-sm ring-2 ring-indigo-400'
                          : 'bg-blue-700 text-white shadow-sm ring-2 ring-blue-400'
                        : 'bg-white border border-slate-300 text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    <span>{t}</span>
                    {isNoche && (
                      <span className="text-[9px] font-mono px-1 py-0.2 rounded bg-amber-400 text-slate-900 font-bold">
                        Solo Camionetas
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            <div className="relative w-full sm:w-72">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Buscar por placa, sereno, policía o sector..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-white border border-slate-300 rounded-md pl-8 pr-3 py-1 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-blue-600"
              />
            </div>
          </div>

          {/* Advertencia dinámica si se selecciona Turno Noche */}
          {selectedTurnoRol === 'NOCHE' && (
            <div className="bg-amber-50 border-2 border-amber-300 rounded-lg p-2.5 flex items-center justify-between text-xs text-amber-950">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                <span>
                  <strong>Aviso Operativo de Turno Nocturno (23:00 - 07:00):</strong> Se muestran exclusivamente las <strong>24 Camionetas 4x4</strong> autorizadas. Las 12 motocicletas se encuentran fuera de servicio nocturno y en base de operaciones.
                </span>
              </div>
              <span className="text-[10px] font-black uppercase bg-amber-200 text-amber-900 px-2 py-0.5 rounded font-mono shrink-0 ml-2">
                24 Camionetas Activas &bull; 0 Motos
              </span>
            </div>
          )}

          {/* Tabla de Asignación Diaria con Campos Editables (Vacíos por defecto) */}
          <div className="overflow-x-auto border-2 border-slate-300 rounded-xl shadow-sm bg-white">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-[#0f3460] text-white text-[11px]">
                  <th className="p-2.5 font-black uppercase text-center w-12 border-r border-blue-800">N°</th>
                  <th className="p-2.5 font-black uppercase w-28 border-r border-blue-800">Unidad Móvil</th>
                  <th className="p-2.5 font-black uppercase w-28 border-r border-blue-800 bg-blue-950/60">
                    Placa (Editable)
                  </th>
                  <th className="p-2.5 font-black uppercase w-36 border-r border-blue-800">Marca / Modelo</th>
                  <th className="p-2.5 font-black uppercase w-48 border-r border-blue-800 bg-blue-950/60">
                    Sereno a Cargo (Titular)
                  </th>
                  <th className="p-2.5 font-black uppercase w-44 border-r border-blue-800">Sereno Conductor</th>
                  <th className="p-2.5 font-black uppercase w-44 border-r border-blue-800 bg-emerald-950/80">
                    Efectivo PNP (Integrado)
                  </th>
                  <th className="p-2.5 font-black uppercase w-24 border-r border-blue-800 text-center">Sector</th>
                  <th className="p-2.5 font-black uppercase w-48">Plan Operativo Asignado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {filteredFleet.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="p-8 text-center text-slate-400">
                      No se encontraron unidades para los filtros seleccionados.
                    </td>
                  </tr>
                ) : (
                  filteredFleet.map((veh, idx) => {
                    const isCamioneta = veh.tipo === 'CAMIONETA';
                    const currentValues = rosterData[veh.id] || {
                      placa: '',
                      modelo: '',
                      efectivoCargo: '',
                      conductor: '',
                      operadorIntegradoPNP: '',
                      subsectorActual: veh.subsectorActual,
                      operativoActual: 'Patrullaje Preventivo',
                      turnoAsignado: 'MAÑANA',
                      observaciones: '',
                    };

                    const isMotoInNight = !isCamioneta && selectedTurnoRol === 'NOCHE';

                    return (
                      <tr
                        key={veh.id}
                        className={`transition-colors ${
                          isMotoInNight ? 'bg-slate-100 opacity-60' : 'hover:bg-blue-50/40'
                        }`}
                      >
                        {/* 1. N° */}
                        <td className="p-2 border-r border-slate-200 text-center font-mono font-bold text-slate-500">
                          {idx + 1}
                        </td>

                        {/* 2. Código de Unidad */}
                        <td className="p-2 border-r border-slate-200 font-bold whitespace-nowrap">
                          <div className="flex items-center gap-1.5">
                            <span
                              className={`p-1 rounded ${
                                isCamioneta ? 'bg-blue-100 text-blue-800' : 'bg-emerald-100 text-emerald-800'
                              }`}
                            >
                              {isCamioneta ? <Car className="w-3.5 h-3.5" /> : <Zap className="w-3.5 h-3.5" />}
                            </span>
                            <div>
                              <div className="text-slate-900 font-black">{veh.codigo}</div>
                              <div className="text-[9px] text-slate-500 font-mono">
                                {isCamioneta ? 'Camioneta 24h' : 'Moto (Diurno)'}
                              </div>
                            </div>
                          </div>
                        </td>

                        {/* 3. Placa (Input Editable, vacío por defecto) */}
                        <td className="p-1.5 border-r border-slate-200 bg-slate-50/50">
                          <input
                            type="text"
                            value={currentValues.placa}
                            onChange={(e) => handleUpdateVehicleField(veh.id, 'placa', e.target.value.toUpperCase())}
                            placeholder="Ej. EUA-124"
                            disabled={isMotoInNight}
                            className="w-full px-2 py-1 bg-white border border-slate-300 rounded text-xs font-mono font-bold text-slate-900 uppercase focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-500 shadow-2xs"
                          />
                        </td>

                        {/* 4. Marca / Modelo (Input Editable, vacío por defecto) */}
                        <td className="p-1.5 border-r border-slate-200">
                          <input
                            type="text"
                            value={currentValues.modelo}
                            onChange={(e) => handleUpdateVehicleField(veh.id, 'modelo', e.target.value)}
                            placeholder={isCamioneta ? 'Ej. Toyota Hilux 4x4' : 'Ej. Honda XR 250'}
                            disabled={isMotoInNight}
                            className="w-full px-2 py-1 bg-white border border-slate-300 rounded text-xs font-medium text-slate-800 focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-500 shadow-2xs"
                          />
                        </td>

                        {/* 5. Sereno a Cargo / Titular (Input Editable, vacío por defecto) */}
                        <td className="p-1.5 border-r border-slate-200 bg-blue-50/20">
                          <input
                            type="text"
                            value={currentValues.efectivoCargo}
                            onChange={(e) => handleUpdateVehicleField(veh.id, 'efectivoCargo', e.target.value)}
                            placeholder="Nombre del agente sereno titular..."
                            disabled={isMotoInNight}
                            className="w-full px-2 py-1 bg-white border border-slate-300 rounded text-xs font-medium text-slate-900 focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-500 shadow-2xs"
                          />
                        </td>

                        {/* 6. Sereno Conductor (Input Editable, vacío por defecto) */}
                        <td className="p-1.5 border-r border-slate-200">
                          <input
                            type="text"
                            value={currentValues.conductor}
                            onChange={(e) => handleUpdateVehicleField(veh.id, 'conductor', e.target.value)}
                            placeholder="Nombre del conductor..."
                            disabled={isMotoInNight}
                            className="w-full px-2 py-1 bg-white border border-slate-300 rounded text-xs font-medium text-slate-800 focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-500 shadow-2xs"
                          />
                        </td>

                        {/* 7. Efectivo Policial PNP Integrado (Input Editable, vacío por defecto) */}
                        <td className="p-1.5 border-r border-slate-200 bg-emerald-50/20">
                          <input
                            type="text"
                            value={currentValues.operadorIntegradoPNP}
                            onChange={(e) => handleUpdateVehicleField(veh.id, 'operadorIntegradoPNP', e.target.value)}
                            placeholder="Ej. S3 PNP Gómez..."
                            disabled={isMotoInNight}
                            className="w-full px-2 py-1 bg-white border border-emerald-300 rounded text-xs font-medium text-emerald-950 focus:outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-500 shadow-2xs"
                          />
                        </td>

                        {/* 8. Sector */}
                        <td className="p-2 border-r border-slate-200 text-center font-mono font-bold text-cyan-800">
                          <span className="bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                            {currentValues.subsectorActual}
                          </span>
                        </td>

                        {/* 9. Plan Operativo Asignado */}
                        <td className="p-1.5">
                          <select
                            value={currentValues.operativoActual}
                            onChange={(e) => handleUpdateVehicleField(veh.id, 'operativoActual', e.target.value)}
                            disabled={isMotoInNight}
                            className="w-full px-2 py-1 bg-white border border-slate-300 rounded text-xs font-semibold text-blue-900 focus:outline-none focus:border-blue-600 shadow-2xs"
                          >
                            <option value="Patrullaje Integrado Preventivo">Patrullaje Integrado Preventivo</option>
                            <option value="Plan Operativo Libadores">Plan Operativo Libadores</option>
                            <option value="Plan Operativo Destello">Plan Operativo Destello (Circulinas)</option>
                            <option value="Plan Operativo Impacto">Plan Operativo Impacto</option>
                            <option value="Plan Operativo Rastrillaje">Plan Operativo Rastrillaje</option>
                            <option value="Plan Paradero Seguro">Plan Paradero Seguro</option>
                            <option value="Plan Escuela Segura">Plan Escuela Segura</option>
                            <option value="Plan Despertar">Plan Despertar</option>
                            <option value="Plan Humo">Plan Humo</option>
                            <option value="Plan Iglesia Segura">Plan Iglesia Segura</option>
                            <option value="Plan Semana Santa">Plan Semana Santa</option>
                          </select>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          <div className="flex items-center justify-between text-xs text-slate-500 pt-1">
            <span>
              Mostrando <strong>{filteredFleet.length}</strong> de <strong>{FLOTA_CONSOLIDADA.length}</strong> unidades operativas oficiales.
            </span>
            <span className="text-[11px] font-medium italic">
              Los cambios ingresados en los campos de texto se sincronizan automáticamente.
            </span>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: CRONOGRAMA SEMANAL OFICIAL (IMAGE 3 RECONSTRUCTION)                */}
      {/* ========================================================================= */}
      {activeTab === 'CRONOGRAMA' && (
        <div className="flex flex-col gap-3">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between bg-slate-50 p-2.5 rounded-lg border border-slate-200 gap-2">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-700">Filtrar por Turno:</span>
              {(['TODOS', 'DIA', 'TARDE', 'NOCHE'] as const).map((t) => (
                <button
                  key={t}
                  onClick={() => setSelectedTurnoCronograma(t)}
                  className={`px-2.5 py-1 rounded text-xs font-bold transition-all ${
                    selectedTurnoCronograma === t
                      ? 'bg-blue-700 text-white shadow-sm'
                      : 'bg-white border border-slate-300 text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>

            <div className="text-xs text-slate-600">
              Operativos Programados: <strong>Paradero Seguro, Colegio Seguro, Rastrillaje, Destello, Impacto</strong>
            </div>
          </div>

          {/* Official Schedule Table */}
          <div className="overflow-x-auto border-2 border-slate-300 rounded-lg shadow-sm">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-[#0f3460] text-white">
                  <th className="p-2.5 border-r border-blue-800 text-center font-black uppercase w-20">
                    TURNO
                  </th>
                  <th className="p-2.5 border-r border-blue-800 font-bold text-center w-28">
                    HORARIO
                  </th>
                  <th className="p-2.5 border-r border-blue-800 font-bold text-center bg-blue-900/60">
                    LUNES
                  </th>
                  <th className="p-2.5 border-r border-blue-800 font-bold text-center">MARTES</th>
                  <th className="p-2.5 border-r border-blue-800 font-bold text-center bg-blue-900/60">
                    MIÉRCOLES
                  </th>
                  <th className="p-2.5 border-r border-blue-800 font-bold text-center">JUEVES</th>
                  <th className="p-2.5 border-r border-blue-800 font-bold text-center bg-blue-900/60">
                    VIERNES
                  </th>
                  <th className="p-2.5 border-r border-blue-800 font-bold text-center bg-amber-800/80">
                    SÁBADO
                  </th>
                  <th className="p-2.5 font-bold text-center bg-rose-900/80">DOMINGO</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {filteredCronograma.map((fila, idx) => {
                  const isDia = fila.turno === 'DIA';
                  const isTarde = fila.turno === 'TARDE';
                  const turnoColor = isDia
                    ? 'bg-amber-50 text-amber-900 border-amber-300'
                    : isTarde
                    ? 'bg-blue-50 text-blue-900 border-blue-300'
                    : 'bg-indigo-50 text-indigo-900 border-indigo-300';

                  return (
                    <tr key={idx} className="hover:bg-slate-50/80 transition-colors">
                      <td className="p-2.5 border-r border-slate-200 text-center font-black align-middle">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-black border ${turnoColor}`}>
                          {fila.turno}
                        </span>
                      </td>
                      <td className="p-2.5 border-r border-slate-200 font-mono font-bold text-slate-700 text-center align-middle whitespace-nowrap bg-slate-50">
                        {fila.horario}
                        <div className="text-[9px] font-sans font-semibold text-blue-700 uppercase">
                          {fila.categoria}
                        </div>
                      </td>
                      <td className="p-2.5 border-r border-slate-200 text-[11px] align-top whitespace-pre-line text-slate-800 bg-white font-medium leading-tight">
                        {fila.lunes}
                      </td>
                      <td className="p-2.5 border-r border-slate-200 text-[11px] align-top whitespace-pre-line text-slate-800 bg-slate-50/50 font-medium leading-tight">
                        {fila.martes}
                      </td>
                      <td className="p-2.5 border-r border-slate-200 text-[11px] align-top whitespace-pre-line text-slate-800 bg-white font-medium leading-tight">
                        {fila.miercoles}
                      </td>
                      <td className="p-2.5 border-r border-slate-200 text-[11px] align-top whitespace-pre-line text-slate-800 bg-slate-50/50 font-medium leading-tight">
                        {fila.jueves}
                      </td>
                      <td className="p-2.5 border-r border-slate-200 text-[11px] align-top whitespace-pre-line text-slate-800 bg-white font-medium leading-tight">
                        {fila.viernes}
                      </td>
                      <td className="p-2.5 border-r border-slate-200 text-[11px] align-top whitespace-pre-line text-slate-800 bg-amber-50/30 font-medium leading-tight">
                        {fila.sabado}
                      </td>
                      <td className="p-2.5 text-[11px] align-top whitespace-pre-line text-slate-800 bg-rose-50/30 font-medium leading-tight">
                        {fila.domingo}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-xs text-blue-950 leading-relaxed flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Shield className="w-4 h-4 text-blue-700 shrink-0" />
              <span>
                <strong>Disposición Operativa de Flota:</strong> Las motos solo operan en turnos <strong>Mañana y Tarde</strong>. En turno <strong>Nocturno</strong> el patrullaje integrado se ejecuta de forma exclusiva con camionetas 4x4.
              </span>
            </div>
            <span className="text-[10px] font-bold bg-blue-200 text-blue-900 px-2 py-0.5 rounded">
              Actualizado 2026
            </span>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 3: FLOTA ACTIVA (24 CAMIONETAS Y 12 MOTOS - CAMPOS EDITABLES EN TARJETAS) */}
      {/* ========================================================================= */}
      {activeTab === 'FLOTA' && (
        <div className="flex flex-col gap-3">
          {/* Controls and Search */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between bg-slate-50 p-2.5 rounded-lg border border-slate-200 gap-2">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-xs font-bold text-slate-700 mr-1">Filtrar Flota:</span>
              <button
                onClick={() => setFleetTypeFilter('ALL')}
                className={`px-3 py-1 rounded text-xs font-bold transition-all ${
                  fleetTypeFilter === 'ALL'
                    ? 'bg-blue-700 text-white'
                    : 'bg-white border border-slate-300 text-slate-700 hover:bg-slate-100'
                }`}
              >
                Todas ({FLOTA_CONSOLIDADA.length})
              </button>
              <button
                onClick={() => setFleetTypeFilter('CAMIONETAS')}
                className={`px-3 py-1 rounded text-xs font-bold transition-all ${
                  fleetTypeFilter === 'CAMIONETAS'
                    ? 'bg-blue-700 text-white'
                    : 'bg-white border border-slate-300 text-slate-700 hover:bg-slate-100'
                }`}
              >
                24 Camionetas (24 Horas)
              </button>
              <button
                onClick={() => setFleetTypeFilter('MOTOS')}
                className={`px-3 py-1 rounded text-xs font-bold transition-all ${
                  fleetTypeFilter === 'MOTOS'
                    ? 'bg-emerald-700 text-white'
                    : 'bg-white border border-slate-300 text-slate-700 hover:bg-slate-100'
                }`}
              >
                12 Motos (Solo Diurno)
              </button>
            </div>

            <div className="relative w-full sm:w-64">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Buscar código, placa, sereno..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-white border border-slate-300 rounded-md pl-8 pr-3 py-1 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-blue-600"
              />
            </div>
          </div>

          {/* Grid of Vehicles with Direct Editable Fields */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {filteredFleet.map((veh) => {
              const isCamioneta = veh.tipo === 'CAMIONETA';
              const currentValues = rosterData[veh.id] || {
                placa: '',
                modelo: '',
                efectivoCargo: '',
                conductor: '',
                operadorIntegradoPNP: '',
                subsectorActual: veh.subsectorActual,
                operativoActual: 'Patrullaje Preventivo',
                turnoAsignado: 'MAÑANA',
              };

              return (
                <div
                  key={veh.id}
                  className="rounded-xl border-2 border-slate-300 bg-white p-3.5 shadow-xs hover:border-blue-500 hover:shadow-md transition-all flex flex-col justify-between"
                >
                  <div>
                    {/* Header Card */}
                    <div className="flex items-center justify-between pb-2.5 border-b border-slate-100 mb-2.5">
                      <div className="flex items-center gap-2">
                        <div
                          className={`p-2 rounded-lg ${
                            isCamioneta ? 'bg-blue-100 text-blue-800' : 'bg-emerald-100 text-emerald-800'
                          }`}
                        >
                          {isCamioneta ? <Car className="w-4 h-4" /> : <Zap className="w-4 h-4" />}
                        </div>
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="text-xs font-black text-slate-900">{veh.codigo}</span>
                            <span className="text-[10px] font-mono bg-blue-50 text-blue-900 border border-blue-200 px-1.5 py-0.2 rounded font-bold">
                              {currentValues.subsectorActual}
                            </span>
                          </div>
                          <span className="text-[10px] text-slate-500 font-semibold">
                            {isCamioneta ? 'Camioneta 4x4 (3 Turnos)' : 'Moto Rápida (Solo Mañana/Tarde)'}
                          </span>
                        </div>
                      </div>

                      <span
                        className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${
                          isCamioneta ? 'bg-blue-100 text-blue-800' : 'bg-emerald-100 text-emerald-800'
                        }`}
                      >
                        {isCamioneta ? 'Servicio 24h' : 'Solo Diurno'}
                      </span>
                    </div>

                    {/* Operational Details (Editable Inputs) */}
                    <div className="space-y-2 text-xs text-slate-700 mb-3">
                      <div>
                        <label className="text-[10px] font-bold text-slate-500 block mb-0.5">
                          Placa de Unidad:
                        </label>
                        <input
                          type="text"
                          value={currentValues.placa}
                          onChange={(e) => handleUpdateVehicleField(veh.id, 'placa', e.target.value.toUpperCase())}
                          placeholder="Ingresar placa..."
                          className="w-full px-2 py-1 bg-slate-50 border border-slate-300 rounded text-xs font-mono font-bold text-slate-900 focus:bg-white focus:outline-none focus:border-blue-600"
                        />
                      </div>

                      <div>
                        <label className="text-[10px] font-bold text-slate-500 block mb-0.5">
                          Marca / Modelo:
                        </label>
                        <input
                          type="text"
                          value={currentValues.modelo}
                          onChange={(e) => handleUpdateVehicleField(veh.id, 'modelo', e.target.value)}
                          placeholder={isCamioneta ? 'Ej. Toyota Hilux 4x4' : 'Ej. Honda XR 250'}
                          className="w-full px-2 py-1 bg-slate-50 border border-slate-300 rounded text-xs font-medium text-slate-800 focus:bg-white focus:outline-none focus:border-blue-600"
                        />
                      </div>

                      <div>
                        <label className="text-[10px] font-bold text-slate-500 block mb-0.5">
                          Sereno a Cargo (Titular):
                        </label>
                        <input
                          type="text"
                          value={currentValues.efectivoCargo}
                          onChange={(e) => handleUpdateVehicleField(veh.id, 'efectivoCargo', e.target.value)}
                          placeholder="Nombre del sereno..."
                          className="w-full px-2 py-1 bg-slate-50 border border-slate-300 rounded text-xs font-medium text-slate-900 focus:bg-white focus:outline-none focus:border-blue-600"
                        />
                      </div>

                      <div>
                        <label className="text-[10px] font-bold text-emerald-800 block mb-0.5">
                          Policía PNP (Patrullaje Integrado):
                        </label>
                        <input
                          type="text"
                          value={currentValues.operadorIntegradoPNP}
                          onChange={(e) => handleUpdateVehicleField(veh.id, 'operadorIntegradoPNP', e.target.value)}
                          placeholder="SO PNP Apellidos..."
                          className="w-full px-2 py-1 bg-emerald-50/50 border border-emerald-300 rounded text-xs font-medium text-emerald-950 focus:bg-white focus:outline-none focus:border-emerald-600"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Metrics Footer */}
                  <div className="grid grid-cols-3 gap-1 pt-2 border-t border-slate-100 text-center font-mono text-[10px] bg-slate-50/80 rounded p-1">
                    <div>
                      <div className="font-bold text-blue-700">{veh.patrullajesSemanales}</div>
                      <div className="text-[8px] text-slate-500">Semanal</div>
                    </div>
                    <div>
                      <div className="font-bold text-emerald-700">{veh.patrullajesMensuales}</div>
                      <div className="text-[8px] text-slate-500">Mensual</div>
                    </div>
                    <div>
                      <div className="font-bold text-slate-800">{veh.patrullajesAnuales}</div>
                      <div className="text-[8px] text-slate-500">Anual</div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 4: REPORTES DE PATRULLAJE (SEMANAL, MENSUAL, ANUAL)                   */}
      {/* ========================================================================= */}
      {activeTab === 'REPORTES' && (
        <div className="flex flex-col gap-4">
          {/* Top Metric Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <div className="bg-gradient-to-br from-blue-50 to-blue-100/60 border-2 border-blue-300 rounded-xl p-3.5 flex flex-col justify-between">
              <div>
                <span className="text-xs font-black uppercase text-blue-900 tracking-wider">
                  Patrullaje Semanal
                </span>
                <div className="text-2xl font-black text-blue-900 mt-1 font-mono">
                  {METRICAS_FLOTA.horasPatrullajeSemanalTotal.toLocaleString()} hrs
                </div>
              </div>
              <div className="text-[11px] text-blue-800 mt-2 font-medium">
                100% de cumplimiento del rol oficial en 16 subsectores.
              </div>
            </div>

            <div className="bg-gradient-to-br from-emerald-50 to-emerald-100/60 border-2 border-emerald-300 rounded-xl p-3.5 flex flex-col justify-between">
              <div>
                <span className="text-xs font-black uppercase text-emerald-900 tracking-wider">
                  Patrullaje Mensual
                </span>
                <div className="text-2xl font-black text-emerald-900 mt-1 font-mono">
                  {METRICAS_FLOTA.horasPatrullajeMensualTotal.toLocaleString()} hrs
                </div>
              </div>
              <div className="text-[11px] text-emerald-800 mt-2 font-medium">
                104,500 km recorridos acumulados por camionetas y motos.
              </div>
            </div>

            <div className="bg-gradient-to-br from-amber-50 to-amber-100/60 border-2 border-amber-300 rounded-xl p-3.5 flex flex-col justify-between">
              <div>
                <span className="text-xs font-black uppercase text-amber-900 tracking-wider">
                  Intervenciones / Mes
                </span>
                <div className="text-2xl font-black text-amber-900 mt-1 font-mono">
                  {METRICAS_FLOTA.intervencionesMensualesTotal.toLocaleString()}
                </div>
              </div>
              <div className="text-[11px] text-amber-800 mt-2 font-medium">
                Accidentes, prevención, orden público y auxilio médico.
              </div>
            </div>

            <div className="bg-gradient-to-br from-cyan-50 to-cyan-100/60 border-2 border-cyan-300 rounded-xl p-3.5 flex flex-col justify-between">
              <div>
                <span className="text-xs font-black uppercase text-cyan-900 tracking-wider">
                  Cobertura Distrital
                </span>
                <div className="text-2xl font-black text-cyan-900 mt-1 font-mono">
                  {METRICAS_FLOTA.coberturaTerritorialPct}%
                </div>
              </div>
              <div className="text-[11px] text-cyan-800 mt-2 font-medium">
                Buenos Aires, Bellamar, Garatea y Asentamientos Humanos.
              </div>
            </div>
          </div>

          {/* Consolidated Report Details */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3.5">
            {/* Rendimiento por Operativo */}
            <div className="border border-slate-200 rounded-xl p-4 bg-slate-50">
              <h3 className="text-xs font-black uppercase text-[#0f3460] mb-3 flex items-center gap-2">
                <FileText className="w-4 h-4 text-blue-700" />
                <span>Rendimiento por Operativo Programado</span>
              </h3>

              <div className="space-y-2.5">
                {[
                  {
                    nombre: 'PARADERO SEGURO',
                    frecuencia: 'Diario (Madrugada y Tarde)',
                    intervenciones: 420,
                    unidades: '8 Camionetas / 6 Motos',
                    pct: 95,
                  },
                  {
                    nombre: 'COLEGIO SEGURO',
                    frecuencia: 'Lunes a Viernes (07:00 y 18:00)',
                    intervenciones: 380,
                    unidades: '12 Móviles por sectores',
                    pct: 98,
                  },
                  {
                    nombre: 'OPERATIVO RASTRILLAJE',
                    frecuencia: 'Lunes a Domingo (14:00 - 17:00)',
                    intervenciones: 510,
                    unidades: '10 Camionetas / 8 Motos',
                    pct: 92,
                  },
                  {
                    nombre: 'OPERATIVO IMPACTO',
                    frecuencia: 'Nocturno (20:00 a 22:00 & 02:00)',
                    intervenciones: 640,
                    unidades: 'Exclusivamente Camionetas 4x4',
                    pct: 96,
                  },
                  {
                    nombre: 'OPERATIVO DESTELLO',
                    frecuencia: 'Madrugada (04:00 - 05:30)',
                    intervenciones: 290,
                    unidades: 'Camionetas con circulinas LED',
                    pct: 94,
                  },
                ].map((op) => (
                  <div key={op.nombre} className="bg-white p-3 rounded-lg border border-slate-200">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-black text-slate-800">{op.nombre}</span>
                      <span className="text-xs font-mono font-bold text-blue-700">
                        {op.intervenciones} intervenciones
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-[11px] text-slate-500 mb-1.5">
                      <span>{op.frecuencia}</span>
                      <span className="font-semibold text-slate-700">{op.unidades}</span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                      <div className="bg-blue-600 h-1.5 rounded-full" style={{ width: `${op.pct}%` }}></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Consolidado Interanual de Patrullaje */}
            <div className="border border-slate-200 rounded-xl p-4 bg-slate-50 flex flex-col justify-between">
              <div>
                <h3 className="text-xs font-black uppercase text-[#0f3460] mb-3 flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-emerald-700" />
                  <span>Consolidado Interanual de Patrullaje (2025 vs 2026)</span>
                </h3>

                <div className="space-y-3 text-xs text-slate-700">
                  <div className="p-3 bg-white rounded-lg border border-slate-200">
                    <div className="flex justify-between items-center mb-1">
                      <span className="font-bold text-slate-800">Horas Anuales de Patrullaje Integrado:</span>
                      <span className="text-emerald-700 font-black font-mono">+18.5% incremento</span>
                    </div>
                    <p className="text-[11px] text-slate-500 leading-relaxed">
                      Con la incorporación de las 24 camionetas 4x4 y 12 motos rápidas en 2026, se amplió la presencia constante en asentamientos humanos periféricos y zonas de expansión urbana.
                    </p>
                  </div>

                  <div className="p-3 bg-white rounded-lg border border-slate-200">
                    <div className="flex justify-between items-center mb-1">
                      <span className="font-bold text-slate-800">Tiempo Promedio de Respuesta:</span>
                      <span className="text-blue-700 font-black font-mono">4 a 6 minutos</span>
                    </div>
                    <p className="text-[11px] text-slate-500 leading-relaxed">
                      Reducción de 3.2 minutos respecto al promedio de 2025 gracias a la sectorización estricta de las unidades en los 16 cuadrantes distritales.
                    </p>
                  </div>

                  <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-emerald-900">
                    <span className="font-bold">Eficacia Preventiva:</span>
                    <p className="text-[11px] mt-0.5 leading-relaxed">
                      Los operativos <strong>Paradero Seguro</strong> y <strong>Colegio Seguro</strong> registran 0 incidencias delictivas graves en las inmediaciones de los centros educativos resguardados.
                    </p>
                  </div>
                </div>
              </div>

              {/* Central Base info */}
              <div className="mt-4 pt-3 border-t border-slate-200 text-[11px] text-slate-500 text-center">
                Subgerencia de Serenazgo y Seguridad Ciudadana &bull; Central de Emergencias (24 Horas): 927 420 002 &bull; 927 640 006 &bull; 935 912 001 &bull; 916 140 004
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL OFICIAL PARA IMPRESIÓN DEL ROL DE PATRULLAJE                         */}
      {/* ========================================================================= */}
      {isPrintModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] flex flex-col shadow-2xl border-2 border-slate-300">
            {/* Header del Modal */}
            <div className="bg-[#0f3460] text-white px-5 py-3.5 flex items-center justify-between rounded-t-2xl">
              <div className="flex items-center gap-2">
                <Printer className="w-5 h-5 text-cyan-300" />
                <h3 className="font-black text-sm uppercase tracking-wide">
                  Ficha Oficial de Rol de Patrullaje Diario — Serenazgo Nuevo Chimbote
                </h3>
              </div>
              <button
                onClick={() => setIsPrintModalOpen(false)}
                className="text-slate-300 hover:text-white p-1 rounded-lg hover:bg-white/10"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Contenido Imprimible */}
            <div className="p-6 overflow-y-auto space-y-4 text-slate-900 text-xs font-sans">
              <div className="border-b-2 border-slate-800 pb-3 flex items-center justify-between">
                <div>
                  <h2 className="text-base font-black uppercase text-slate-900">
                    MUNICIPALIDAD DISTRITAL DE NUEVO CHIMBOTE
                  </h2>
                  <p className="text-xs font-bold text-slate-700 uppercase">
                    Subgerencia de Serenazgo y Seguridad Ciudadana &bull; Puesto de Mando y Despacho Operativo
                  </p>
                  <p className="text-[11px] text-slate-500 font-mono mt-0.5">
                    Rol Operativo de Patrullaje Diario &bull; Turno: {selectedTurnoRol} &bull; Fecha:{' '}
                    {new Date().toLocaleDateString('es-PE')}
                  </p>
                </div>
                <div className="text-right">
                  <div className="text-xs font-black bg-blue-100 text-blue-900 px-3 py-1 rounded border border-blue-300 inline-block font-mono">
                    24 Camionetas &bull; 12 Motos
                  </div>
                  <div className="text-[10px] text-slate-500 mt-1">
                    *Motos operan solo en Mañana y Tarde
                  </div>
                </div>
              </div>

              {/* Resumen de Asignaciones */}
              <table className="w-full border-collapse border border-slate-300 text-[11px]">
                <thead>
                  <tr className="bg-slate-100 text-slate-800 font-bold">
                    <th className="border border-slate-300 p-1.5 text-center w-10">N°</th>
                    <th className="border border-slate-300 p-1.5 w-24">Unidad</th>
                    <th className="border border-slate-300 p-1.5 w-20">Placa</th>
                    <th className="border border-slate-300 p-1.5 w-28">Marca / Modelo</th>
                    <th className="border border-slate-300 p-1.5 w-36">Sereno a Cargo</th>
                    <th className="border border-slate-300 p-1.5 w-32">Policía PNP</th>
                    <th className="border border-slate-300 p-1.5 w-16 text-center">Sector</th>
                    <th className="border border-slate-300 p-1.5">Operativo Asignado</th>
                  </tr>
                </thead>
                <tbody>
                  {FLOTA_CONSOLIDADA.map((veh, idx) => {
                    const data = rosterData[veh.id] || {
                      placa: '',
                      modelo: '',
                      efectivoCargo: '',
                      operadorIntegradoPNP: '',
                      subsectorActual: veh.subsectorActual,
                      operativoActual: 'Patrullaje Preventivo',
                    };

                    return (
                      <tr key={veh.id} className="odd:bg-white even:bg-slate-50">
                        <td className="border border-slate-300 p-1 text-center font-mono">{idx + 1}</td>
                        <td className="border border-slate-300 p-1 font-bold">{veh.codigo}</td>
                        <td className="border border-slate-300 p-1 font-mono">{data.placa || '—'}</td>
                        <td className="border border-slate-300 p-1">{data.modelo || '—'}</td>
                        <td className="border border-slate-300 p-1">{data.efectivoCargo || '—'}</td>
                        <td className="border border-slate-300 p-1">{data.operadorIntegradoPNP || '—'}</td>
                        <td className="border border-slate-300 p-1 text-center font-bold text-blue-900">
                          {data.subsectorActual}
                        </td>
                        <td className="border border-slate-300 p-1">{data.operativoActual}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>

              {/* Firmas de Responsabilidad */}
              <div className="grid grid-cols-2 gap-12 pt-10 text-center text-xs">
                <div className="border-t border-slate-400 pt-1">
                  <div className="font-bold text-slate-800">SUPERVISOR DE TURNO SERENAZGO</div>
                  <div className="text-[10px] text-slate-500">Subgerencia de Seguridad Ciudadana</div>
                </div>
                <div className="border-t border-slate-400 pt-1">
                  <div className="font-bold text-slate-800">OFICIAL PNP COORDINADOR</div>
                  <div className="text-[10px] text-slate-500">Patrullaje Integrado Comisarías</div>
                </div>
              </div>
            </div>

            {/* Footer Modal */}
            <div className="p-4 bg-slate-100 border-t border-slate-200 flex items-center justify-between rounded-b-2xl">
              <span className="text-xs text-slate-600 font-medium">
                Listo para impresión directa en papel A4 horizontal.
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setIsPrintModalOpen(false)}
                  className="px-4 py-2 rounded-lg bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold text-xs"
                >
                  Cerrar
                </button>
                <button
                  onClick={() => window.print()}
                  className="px-4 py-2 rounded-lg bg-blue-700 hover:bg-blue-600 text-white font-bold text-xs flex items-center gap-1.5 shadow"
                >
                  <Printer className="w-4 h-4" />
                  <span>Imprimir Ahora</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
