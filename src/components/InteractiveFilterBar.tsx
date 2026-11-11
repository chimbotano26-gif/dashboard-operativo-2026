import React from 'react';
import {
  Filter,
  X,
  MapPin,
  Clock,
  Shield,
  Calendar,
  AlertCircle,
  RotateCcw,
} from 'lucide-react';
import { FilterState, ZonaType, TurnoType, ComisariaType, MesType } from '../types';
import { ZONAS_LIST, TURNOS_LIST, COMISARIAS_LIST, MESES_LIST, INCIDENCIAS_LIST } from '../data/mockData';

interface InteractiveFilterBarProps {
  filters: FilterState;
  onFilterChange: (filters: FilterState) => void;
  onResetFilters: () => void;
  filteredCount: number;
  totalCount: number;
}

export const InteractiveFilterBar: React.FC<InteractiveFilterBarProps> = ({
  filters,
  onFilterChange,
  onResetFilters,
  filteredCount,
  totalCount,
}) => {
  const isAnyFilterActive =
    filters.zonas.length > 0 ||
    filters.turnos.length > 0 ||
    filters.comisarias.length > 0 ||
    filters.meses.length > 0 ||
    filters.incidencias.length > 0 ||
    Boolean(filters.searchQuery);

  const toggleZona = (z: ZonaType) => {
    const exists = filters.zonas.includes(z);
    onFilterChange({
      ...filters,
      zonas: exists ? filters.zonas.filter((item) => item !== z) : [...filters.zonas, z],
    });
  };

  const toggleTurno = (t: TurnoType) => {
    const exists = filters.turnos.includes(t);
    onFilterChange({
      ...filters,
      turnos: exists ? filters.turnos.filter((item) => item !== t) : [...filters.turnos, t],
    });
  };

  const toggleComisaria = (c: ComisariaType) => {
    const exists = filters.comisarias.includes(c);
    onFilterChange({
      ...filters,
      comisarias: exists ? filters.comisarias.filter((item) => item !== c) : [...filters.comisarias, c],
    });
  };

  const handleIncidenciaChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    if (!val) {
      onFilterChange({ ...filters, incidencias: [] });
    } else {
      onFilterChange({ ...filters, incidencias: [val] });
    }
  };

  const handleMesChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    if (!val) {
      onFilterChange({ ...filters, meses: [] });
    } else {
      onFilterChange({ ...filters, meses: [val as MesType] });
    }
  };

  // Top 5 popular incident tags for fast clicking
  const topIncidents = [
    'ROBO / HURTO',
    'AGRESION',
    'CONSUMIDORES DE DROGAS/ALCOHOL',
    'VIOLENCIA FAMILIAR',
    'AUXILIO, APOYO MEDICO',
  ];

  const toggleTopIncidence = (inc: string) => {
    const exists = filters.incidencias.includes(inc);
    onFilterChange({
      ...filters,
      incidencias: exists ? filters.incidencias.filter((i) => i !== inc) : [inc],
    });
  };

  return (
    <div className="bg-[#0b182b] border border-cyan-900/60 rounded-xl p-2.5 sm:p-3 shadow-lg flex flex-col gap-2.5">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-cyan-900/40 pb-2">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-cyan-950 text-cyan-400 border border-cyan-700/50">
            <Filter className="w-3.5 h-3.5" />
          </div>
          <div>
            <span className="text-xs font-black uppercase text-cyan-200 tracking-wider">
              FILTRADO INTELIGENTE MULTI-VARIABLE
            </span>
            <span className="text-[10px] text-slate-400 ml-2 hidden sm:inline">
              Filtre simultáneamente por zona territorial, horario, comisaría o delito
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="text-[11px] font-mono px-2 py-0.5 rounded bg-[#071322] border border-cyan-800 text-cyan-300 font-bold">
            {filteredCount.toLocaleString()} / {totalCount.toLocaleString()} atenciones
          </div>

          {isAnyFilterActive && (
            <button
              onClick={onResetFilters}
              className="px-2.5 py-1 rounded text-[11px] font-bold bg-rose-950/40 text-rose-300 border border-rose-600/50 hover:bg-rose-900/60 flex items-center gap-1 transition-colors"
              title="Limpiar todos los filtros activos"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Restablecer</span>
            </button>
          )}
        </div>
      </div>

      {/* Chips Rows */}
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs">
        {/* Zonas Chips */}
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
            <MapPin className="w-3 h-3 text-cyan-400" />
            Zona:
          </span>
          <button
            onClick={() => onFilterChange({ ...filters, zonas: [] })}
            className={`px-2 py-0.5 rounded-full text-[11px] font-bold transition-all ${
              filters.zonas.length === 0
                ? 'bg-cyan-500 text-[#071322] shadow-[0_0_8px_rgba(6,182,212,0.4)]'
                : 'bg-[#071322] text-slate-300 hover:text-white border border-slate-700'
            }`}
          >
            Todas
          </button>
          {ZONAS_LIST.map((z) => {
            const isSelected = filters.zonas.includes(z);
            return (
              <button
                key={z}
                onClick={() => toggleZona(z)}
                className={`px-2 py-0.5 rounded-full text-[11px] font-bold transition-all flex items-center gap-1 ${
                  isSelected
                    ? 'bg-cyan-500 text-[#071322] shadow-[0_0_8px_rgba(6,182,212,0.4)]'
                    : 'bg-[#071322] text-slate-300 hover:text-white border border-slate-700'
                }`}
              >
                <span>{z.replace('ZONA ', '')}</span>
                {isSelected && <X className="w-2.5 h-2.5" />}
              </button>
            );
          })}
        </div>

        <div className="h-4 w-[1px] bg-slate-700 hidden lg:block"></div>

        {/* Turnos Chips */}
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
            <Clock className="w-3 h-3 text-amber-400" />
            Turno:
          </span>
          <button
            onClick={() => onFilterChange({ ...filters, turnos: [] })}
            className={`px-2 py-0.5 rounded-full text-[11px] font-bold transition-all ${
              filters.turnos.length === 0
                ? 'bg-amber-500 text-[#071322] shadow-[0_0_8px_rgba(245,158,11,0.4)]'
                : 'bg-[#071322] text-slate-300 hover:text-white border border-slate-700'
            }`}
          >
            Todos
          </button>
          {TURNOS_LIST.map((t) => {
            const isSelected = filters.turnos.includes(t);
            return (
              <button
                key={t}
                onClick={() => toggleTurno(t)}
                className={`px-2 py-0.5 rounded-full text-[11px] font-bold transition-all flex items-center gap-1 ${
                  isSelected
                    ? 'bg-amber-500 text-[#071322] shadow-[0_0_8px_rgba(245,158,11,0.4)]'
                    : 'bg-[#071322] text-slate-300 hover:text-white border border-slate-700'
                }`}
              >
                <span>{t}</span>
                {isSelected && <X className="w-2.5 h-2.5" />}
              </button>
            );
          })}
        </div>

        <div className="h-4 w-[1px] bg-slate-700 hidden lg:block"></div>

        {/* Comisarías Chips */}
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
            <Shield className="w-3 h-3 text-blue-400" />
            PNP:
          </span>
          {COMISARIAS_LIST.map((c) => {
            const isSelected = filters.comisarias.includes(c);
            const shortName = c.replace('CIA ', '');
            return (
              <button
                key={c}
                onClick={() => toggleComisaria(c)}
                className={`px-2 py-0.5 rounded-full text-[11px] font-bold transition-all flex items-center gap-1 ${
                  isSelected
                    ? 'bg-blue-500 text-white shadow-[0_0_8px_rgba(59,130,246,0.4)]'
                    : 'bg-[#071322] text-slate-300 hover:text-white border border-slate-700'
                }`}
              >
                <span>{shortName}</span>
                {isSelected && <X className="w-2.5 h-2.5" />}
              </button>
            );
          })}
        </div>

        <div className="h-4 w-[1px] bg-slate-700 hidden xl:block"></div>

        {/* Month Selector */}
        <div className="flex items-center gap-1.5">
          <Calendar className="w-3 h-3 text-cyan-400" />
          <select
            value={filters.meses[0] || ''}
            onChange={handleMesChange}
            className="bg-[#071322] border border-cyan-800 rounded-lg px-2 py-0.5 text-xs text-cyan-200 font-bold focus:outline-none"
          >
            <option value="">Todos los Meses</option>
            {MESES_LIST.map((m) => (
              <option key={m} value={m}>
                {m}
              </option>
            ))}
          </select>
        </div>

        {/* Full Incidencia Selector */}
        <div className="flex items-center gap-1.5 flex-1 min-w-[180px]">
          <AlertCircle className="w-3 h-3 text-rose-400" />
          <select
            value={filters.incidencias[0] || ''}
            onChange={handleIncidenciaChange}
            className="w-full bg-[#071322] border border-cyan-800 rounded-lg px-2 py-0.5 text-xs text-cyan-200 font-bold focus:outline-none"
          >
            <option value="">Todas las Incidencias ({INCIDENCIAS_LIST.length})</option>
            {INCIDENCIAS_LIST.map((inc) => (
              <option key={inc} value={inc}>
                {inc}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Popular Incidents Quick Tags */}
      <div className="flex items-center gap-1.5 flex-wrap pt-1 border-t border-cyan-900/30">
        <span className="text-[10px] font-bold text-slate-500 uppercase">Filtros Rápidos:</span>
        {topIncidents.map((inc) => {
          const isSelected = filters.incidencias.includes(inc);
          return (
            <button
              key={inc}
              onClick={() => toggleTopIncidence(inc)}
              className={`px-2 py-0.5 rounded text-[10px] font-bold transition-all ${
                isSelected
                  ? 'bg-rose-600 text-white shadow-[0_0_8px_rgba(225,29,72,0.4)]'
                  : 'bg-[#061120] text-slate-400 hover:text-slate-200 border border-slate-800'
              }`}
            >
              {inc}
            </button>
          );
        })}
      </div>
    </div>
  );
};
