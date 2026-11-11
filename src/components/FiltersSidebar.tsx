import React, { useState } from 'react';
import {
  Filter,
  FilterX,
  ListChecks,
  CheckSquare,
  Square,
} from 'lucide-react';

import {
  FilterState,
  ZonaType,
  ComisariaType,
  TurnoType,
  MesType,
} from '../types';
import {
  ZONAS_LIST,
  COMISARIAS_LIST,
  TURNOS_LIST,
  MESES_LIST,
  INCIDENCIAS_LIST,
} from '../data/mockData';

interface LeftFiltersProps {
  filters: FilterState;
  onFilterChange: (newFilters: FilterState) => void;
  onResetFilters: () => void;
}

export const LeftFilters: React.FC<LeftFiltersProps> = ({
  filters,
  onFilterChange,
  onResetFilters,
}) => {
  // Slicer multi-select toggle states (Excel Slicer feature: Multi-select toggle)
  const [multiSelect, setMultiSelect] = useState<{
    zona: boolean;
    comisaria: boolean;
    turno: boolean;
    mes: boolean;
    incidencia: boolean;
  }>({
    zona: true,
    comisaria: true,
    turno: true,
    mes: true,
    incidencia: true,
  });

  const [incFilterSearch, setIncFilterSearch] = useState('');

  const toggleMultiSelectMode = (key: 'zona' | 'comisaria' | 'turno' | 'mes' | 'incidencia') => {
    setMultiSelect((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  // ZONA Handlers
  const toggleZona = (zona: ZonaType) => {
    if (multiSelect.zona) {
      const exists = filters.zonas.includes(zona);
      const updated = exists ? filters.zonas.filter((z) => z !== zona) : [...filters.zonas, zona];
      onFilterChange({ ...filters, zonas: updated });
    } else {
      // Single select mode
      if (filters.zonas.length === 1 && filters.zonas[0] === zona) {
        onFilterChange({ ...filters, zonas: [] });
      } else {
        onFilterChange({ ...filters, zonas: [zona] });
      }
    }
  };

  const selectAllZonas = () => {
    onFilterChange({ ...filters, zonas: [...ZONAS_LIST] });
  };

  const clearZonas = () => {
    onFilterChange({ ...filters, zonas: [] });
  };

  // COMISARIAS Handlers
  const toggleComisaria = (cia: ComisariaType) => {
    if (multiSelect.comisaria) {
      const exists = filters.comisarias.includes(cia);
      const updated = exists ? filters.comisarias.filter((c) => c !== cia) : [...filters.comisarias, cia];
      onFilterChange({ ...filters, comisarias: updated });
    } else {
      if (filters.comisarias.length === 1 && filters.comisarias[0] === cia) {
        onFilterChange({ ...filters, comisarias: [] });
      } else {
        onFilterChange({ ...filters, comisarias: [cia] });
      }
    }
  };

  const selectAllComisarias = () => {
    onFilterChange({ ...filters, comisarias: [...COMISARIAS_LIST] });
  };

  const clearComisarias = () => {
    onFilterChange({ ...filters, comisarias: [] });
  };

  // TURNO Handlers
  const toggleTurno = (turno: TurnoType) => {
    if (multiSelect.turno) {
      const exists = filters.turnos.includes(turno);
      const updated = exists ? filters.turnos.filter((t) => t !== turno) : [...filters.turnos, turno];
      onFilterChange({ ...filters, turnos: updated });
    } else {
      if (filters.turnos.length === 1 && filters.turnos[0] === turno) {
        onFilterChange({ ...filters, turnos: [] });
      } else {
        onFilterChange({ ...filters, turnos: [turno] });
      }
    }
  };

  const selectAllTurnos = () => {
    onFilterChange({ ...filters, turnos: [...TURNOS_LIST] });
  };

  const clearTurnos = () => {
    onFilterChange({ ...filters, turnos: [] });
  };

  // MES Handlers
  const toggleMes = (mes: MesType) => {
    if (multiSelect.mes) {
      const exists = filters.meses.includes(mes);
      const updated = exists ? filters.meses.filter((m) => m !== mes) : [...filters.meses, mes];
      onFilterChange({ ...filters, meses: updated });
    } else {
      if (filters.meses.length === 1 && filters.meses[0] === mes) {
        onFilterChange({ ...filters, meses: [] });
      } else {
        onFilterChange({ ...filters, meses: [mes] });
      }
    }
  };

  const selectAllMeses = () => {
    onFilterChange({ ...filters, meses: [...MESES_LIST] });
  };

  const clearMeses = () => {
    onFilterChange({ ...filters, meses: [] });
  };

  // INCIDENCIA Handlers
  const toggleIncidencia = (inc: string) => {
    if (multiSelect.incidencia) {
      const exists = filters.incidencias.includes(inc);
      const updated = exists ? filters.incidencias.filter((i) => i !== inc) : [...filters.incidencias, inc];
      onFilterChange({ ...filters, incidencias: updated });
    } else {
      if (filters.incidencias.length === 1 && filters.incidencias[0] === inc) {
        onFilterChange({ ...filters, incidencias: [] });
      } else {
        onFilterChange({ ...filters, incidencias: [inc] });
      }
    }
  };

  const selectAllIncidencias = () => {
    onFilterChange({ ...filters, incidencias: [...INCIDENCIAS_LIST] });
  };

  const clearIncidencias = () => {
    onFilterChange({ ...filters, incidencias: [] });
  };

  const filteredIncidenciasList = INCIDENCIAS_LIST.filter((inc) =>
    inc.toLowerCase().includes(incFilterSearch.toLowerCase())
  );

  // Master Select All / Clear All
  const handleSelectAllFilters = () => {
    onFilterChange({
      zonas: [...ZONAS_LIST],
      comisarias: [...COMISARIAS_LIST],
      turnos: [...TURNOS_LIST],
      meses: [...MESES_LIST],
      incidencias: [...INCIDENCIAS_LIST],
      searchQuery: '',
    });
  };

  return (
    <aside className="w-full lg:w-52 xl:w-60 shrink-0 flex flex-col gap-2.5">
      {/* Master Slicer Header Controls (Excel BI Slicer Bar) */}
      <div className="bg-[#0b1f3a] text-white rounded-lg border-2 border-cyan-800 shadow-md p-2 flex flex-col gap-1.5">
        <div className="flex items-center justify-between text-[11px] font-black uppercase text-cyan-200 tracking-wider">
          <div className="flex items-center gap-1.5">
            <Filter className="w-3.5 h-3.5 text-cyan-400" />
            <span>SLICERS DE CONTROL</span>
          </div>
        </div>

        {/* Global Master Quick Buttons */}
        <div className="grid grid-cols-2 gap-1.5 pt-1">
          <button
            type="button"
            id="btn-slicer-select-all"
            onClick={handleSelectAllFilters}
            className="py-1 px-1.5 rounded bg-blue-800/80 hover:bg-blue-700 text-cyan-100 hover:text-white text-[10px] font-bold flex items-center justify-center gap-1 border border-blue-600 transition-colors shadow-xs"
            title="Marcar todos los filtros de la base de datos de un solo clic"
          >
            <CheckSquare className="w-3 h-3 text-cyan-300" />
            <span>Marcar Todos</span>
          </button>

          <button
            type="button"
            id="btn-slicer-clear-all"
            onClick={onResetFilters}
            className="py-1 px-1.5 rounded bg-rose-950/60 hover:bg-rose-900 text-rose-200 hover:text-white text-[10px] font-bold flex items-center justify-center gap-1 border border-rose-700/60 transition-colors shadow-xs"
            title="Limpiar todos los filtros (Restablecer vista completa)"
          >
            <FilterX className="w-3 h-3 text-rose-400" />
            <span>Limpiar Todo</span>
          </button>
        </div>
      </div>

      {/* ZONA Slicer Box */}
      <div className="bg-white rounded-lg border-2 border-slate-300 shadow-sm overflow-hidden text-slate-800">
        <div className="bg-[#0f2c4c] text-white px-2.5 py-1.5 flex items-center justify-between text-xs font-bold uppercase tracking-wider">
          <div className="flex items-center gap-1.5">
            <span>ZONA</span>
            <span className="text-[10px] font-mono text-cyan-300 font-bold">
              ({filters.zonas.length === 0 ? 'TODOS' : `${filters.zonas.length}/${ZONAS_LIST.length}`})
            </span>
          </div>
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={selectAllZonas}
              className="text-[9px] px-1 py-0.2 rounded bg-blue-800/80 hover:bg-blue-700 text-cyan-200 hover:text-white transition-colors"
              title="Marcar todas las zonas"
            >
              Todos
            </button>
            <button
              type="button"
              onClick={clearZonas}
              className="text-[9px] px-1 py-0.2 rounded bg-slate-800/80 hover:bg-rose-900 text-slate-300 hover:text-white transition-colors"
              title="Limpiar filtro de zonas"
            >
              Limpiar
            </button>
            <button
              type="button"
              onClick={() => toggleMultiSelectMode('zona')}
              title={multiSelect.zona ? 'Selección múltiple activada' : 'Selección simple'}
              className={`p-0.5 rounded transition-colors ml-0.5 ${
                multiSelect.zona ? 'text-cyan-300 bg-cyan-900/60' : 'text-slate-400 hover:text-white'
              }`}
            >
              <ListChecks className="w-3 h-3" />
            </button>
          </div>
        </div>

        <div className="p-1.5 flex flex-col gap-1">
          {ZONAS_LIST.map((zona) => {
            const isSelected = filters.zonas.includes(zona);
            return (
              <button
                key={zona}
                id={`filter-zona-${zona.toLowerCase().replace(/\s+/g, '-')}`}
                onClick={() => toggleZona(zona)}
                className={`w-full text-left px-2 py-1.5 rounded text-xs font-semibold transition-all border flex items-center justify-between ${
                  isSelected
                    ? 'bg-[#1b5e94] text-white border-[#1b5e94] shadow-sm font-bold'
                    : 'bg-[#bad3eb]/60 text-[#092949] border-[#9dbedc] hover:bg-[#a9c9e6]'
                }`}
              >
                <div className="flex items-center gap-1.5 truncate">
                  {isSelected ? (
                    <CheckSquare className="w-3.5 h-3.5 shrink-0 text-cyan-200" />
                  ) : (
                    <Square className="w-3.5 h-3.5 shrink-0 text-slate-500" />
                  )}
                  <span className="truncate">{zona}</span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* COMISARIAS Slicer Box */}
      <div className="bg-white rounded-lg border-2 border-slate-300 shadow-sm overflow-hidden text-slate-800">
        <div className="bg-[#0f2c4c] text-white px-2.5 py-1.5 flex items-center justify-between text-xs font-bold uppercase tracking-wider">
          <div className="flex items-center gap-1.5">
            <span>COMISARÍAS</span>
            <span className="text-[10px] font-mono text-cyan-300 font-bold">
              ({filters.comisarias.length === 0 ? 'TODOS' : `${filters.comisarias.length}/${COMISARIAS_LIST.length}`})
            </span>
          </div>
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={selectAllComisarias}
              className="text-[9px] px-1 py-0.2 rounded bg-blue-800/80 hover:bg-blue-700 text-cyan-200 hover:text-white transition-colors"
              title="Marcar todas las comisarías"
            >
              Todos
            </button>
            <button
              type="button"
              onClick={clearComisarias}
              className="text-[9px] px-1 py-0.2 rounded bg-slate-800/80 hover:bg-rose-900 text-slate-300 hover:text-white transition-colors"
              title="Limpiar comisarías"
            >
              Limpiar
            </button>
            <button
              type="button"
              onClick={() => toggleMultiSelectMode('comisaria')}
              title={multiSelect.comisaria ? 'Selección múltiple activada' : 'Selección simple'}
              className={`p-0.5 rounded transition-colors ml-0.5 ${
                multiSelect.comisaria ? 'text-cyan-300 bg-cyan-900/60' : 'text-slate-400 hover:text-white'
              }`}
            >
              <ListChecks className="w-3 h-3" />
            </button>
          </div>
        </div>

        <div className="p-1.5 flex flex-col gap-1">
          {COMISARIAS_LIST.map((cia) => {
            const isSelected = filters.comisarias.includes(cia);
            return (
              <button
                key={cia}
                id={`filter-cia-${cia.toLowerCase().replace(/\s+/g, '-')}`}
                onClick={() => toggleComisaria(cia)}
                className={`w-full text-left px-2 py-1.5 rounded text-xs font-semibold transition-all border flex items-center justify-between ${
                  isSelected
                    ? 'bg-[#1b5e94] text-white border-[#1b5e94] shadow-sm font-bold'
                    : 'bg-[#bad3eb]/60 text-[#092949] border-[#9dbedc] hover:bg-[#a9c9e6]'
                }`}
              >
                <div className="flex items-center gap-1.5 truncate">
                  {isSelected ? (
                    <CheckSquare className="w-3.5 h-3.5 shrink-0 text-cyan-200" />
                  ) : (
                    <Square className="w-3.5 h-3.5 shrink-0 text-slate-500" />
                  )}
                  <span className="truncate">{cia}</span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* TURNO Slicer Box */}
      <div className="bg-white rounded-lg border-2 border-slate-300 shadow-sm overflow-hidden text-slate-800">
        <div className="bg-[#0f2c4c] text-white px-2.5 py-1.5 flex items-center justify-between text-xs font-bold uppercase tracking-wider">
          <div className="flex items-center gap-1.5">
            <span>TURNO</span>
            <span className="text-[10px] font-mono text-cyan-300 font-bold">
              ({filters.turnos.length === 0 ? 'TODOS' : `${filters.turnos.length}/${TURNOS_LIST.length}`})
            </span>
          </div>
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={selectAllTurnos}
              className="text-[9px] px-1 py-0.2 rounded bg-blue-800/80 hover:bg-blue-700 text-cyan-200 hover:text-white transition-colors"
              title="Marcar todos los turnos"
            >
              Todos
            </button>
            <button
              type="button"
              onClick={clearTurnos}
              className="text-[9px] px-1 py-0.2 rounded bg-slate-800/80 hover:bg-rose-900 text-slate-300 hover:text-white transition-colors"
              title="Limpiar turnos"
            >
              Limpiar
            </button>
            <button
              type="button"
              onClick={() => toggleMultiSelectMode('turno')}
              title={multiSelect.turno ? 'Selección múltiple activada' : 'Selección simple'}
              className={`p-0.5 rounded transition-colors ml-0.5 ${
                multiSelect.turno ? 'text-cyan-300 bg-cyan-900/60' : 'text-slate-400 hover:text-white'
              }`}
            >
              <ListChecks className="w-3 h-3" />
            </button>
          </div>
        </div>

        <div className="p-1.5 flex flex-col gap-1">
          {TURNOS_LIST.map((turno) => {
            const isSelected = filters.turnos.includes(turno);
            return (
              <button
                key={turno}
                id={`filter-turno-${turno.toLowerCase()}`}
                onClick={() => toggleTurno(turno)}
                className={`w-full text-left px-2 py-1.5 rounded text-xs font-semibold transition-all border flex items-center justify-between ${
                  isSelected
                    ? 'bg-[#1b5e94] text-white border-[#1b5e94] shadow-sm font-bold'
                    : 'bg-[#bad3eb]/60 text-[#092949] border-[#9dbedc] hover:bg-[#a9c9e6]'
                }`}
              >
                <div className="flex items-center gap-1.5 truncate">
                  {isSelected ? (
                    <CheckSquare className="w-3.5 h-3.5 shrink-0 text-cyan-200" />
                  ) : (
                    <Square className="w-3.5 h-3.5 shrink-0 text-slate-500" />
                  )}
                  <span className="truncate">{turno}</span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* MES Slicer Box */}
      <div className="bg-white rounded-lg border-2 border-slate-300 shadow-sm overflow-hidden text-slate-800">
        <div className="bg-[#0f2c4c] text-white px-2.5 py-1.5 flex items-center justify-between text-xs font-bold uppercase tracking-wider">
          <div className="flex items-center gap-1.5">
            <span>MES</span>
            <span className="text-[10px] font-mono text-cyan-300 font-bold">
              ({filters.meses.length === 0 ? 'TODOS' : `${filters.meses.length}/${MESES_LIST.length}`})
            </span>
          </div>
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={selectAllMeses}
              className="text-[9px] px-1 py-0.2 rounded bg-blue-800/80 hover:bg-blue-700 text-cyan-200 hover:text-white transition-colors"
              title="Marcar todos los meses"
            >
              Todos
            </button>
            <button
              type="button"
              onClick={clearMeses}
              className="text-[9px] px-1 py-0.2 rounded bg-slate-800/80 hover:bg-rose-900 text-slate-300 hover:text-white transition-colors"
              title="Limpiar meses"
            >
              Limpiar
            </button>
            <button
              type="button"
              onClick={() => toggleMultiSelectMode('mes')}
              title={multiSelect.mes ? 'Selección múltiple activada' : 'Selección simple'}
              className={`p-0.5 rounded transition-colors ml-0.5 ${
                multiSelect.mes ? 'text-cyan-300 bg-cyan-900/60' : 'text-slate-400 hover:text-white'
              }`}
            >
              <ListChecks className="w-3 h-3" />
            </button>
          </div>
        </div>

        <div className="p-1.5 max-h-48 overflow-y-auto flex flex-col gap-1">
          {MESES_LIST.map((mes) => {
            const isSelected = filters.meses.includes(mes);
            return (
              <button
                key={mes}
                id={`filter-mes-${mes.toLowerCase()}`}
                onClick={() => toggleMes(mes)}
                className={`w-full text-left px-2 py-1 rounded text-xs font-medium transition-all border flex items-center justify-between ${
                  isSelected
                    ? 'bg-[#1b5e94] text-white border-[#1b5e94] font-bold shadow-sm'
                    : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                }`}
              >
                <div className="flex items-center gap-1.5 truncate">
                  {isSelected ? (
                    <CheckSquare className="w-3 h-3 shrink-0 text-cyan-200" />
                  ) : (
                    <Square className="w-3 h-3 shrink-0 text-slate-400" />
                  )}
                  <span className="truncate">{mes}</span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* INCIDENCIA Slicer Box */}
      <div className="bg-white rounded-lg border-2 border-slate-300 shadow-sm overflow-hidden text-slate-800 flex flex-col">
        <div className="bg-[#0f2c4c] text-white px-2.5 py-1.5 flex items-center justify-between text-xs font-bold uppercase tracking-wider">
          <div className="flex items-center gap-1.5">
            <span>INCIDENCIA</span>
            <span className="text-[10px] font-mono text-cyan-300 font-bold">
              ({filters.incidencias.length === 0 ? 'TODOS' : `${filters.incidencias.length}/${INCIDENCIAS_LIST.length}`})
            </span>
          </div>
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={selectAllIncidencias}
              className="text-[9px] px-1 py-0.2 rounded bg-blue-800/80 hover:bg-blue-700 text-cyan-200 hover:text-white transition-colors"
              title="Marcar todas las incidencias"
            >
              Todos
            </button>
            <button
              type="button"
              onClick={clearIncidencias}
              className="text-[9px] px-1 py-0.2 rounded bg-slate-800/80 hover:bg-rose-900 text-slate-300 hover:text-white transition-colors"
              title="Limpiar incidencias"
            >
              Limpiar
            </button>
            <button
              type="button"
              onClick={() => toggleMultiSelectMode('incidencia')}
              title={multiSelect.incidencia ? 'Selección múltiple activada' : 'Selección simple'}
              className={`p-0.5 rounded transition-colors ml-0.5 ${
                multiSelect.incidencia ? 'text-cyan-300 bg-cyan-900/60' : 'text-slate-400 hover:text-white'
              }`}
            >
              <ListChecks className="w-3 h-3" />
            </button>
          </div>
        </div>

        {/* Quick search inside Incidencias */}
        <div className="p-1 bg-slate-100 border-b border-slate-200">
          <input
            type="text"
            value={incFilterSearch}
            onChange={(e) => setIncFilterSearch(e.target.value)}
            placeholder="Filtrar tipo de incidencia..."
            className="w-full px-2 py-1 text-[11px] bg-white border border-slate-300 rounded focus:outline-none focus:border-blue-500 font-medium"
          />
        </div>

        <div className="p-1.5 flex flex-col gap-1 max-h-64 overflow-y-auto">
          {filteredIncidenciasList.map((inc) => {
            const isSelected = filters.incidencias.includes(inc);
            return (
              <button
                key={inc}
                id={`filter-incidencia-${inc.toLowerCase().replace(/[\s,/]+/g, '-')}`}
                onClick={() => toggleIncidencia(inc)}
                className={`w-full text-left px-2 py-1.5 rounded text-[11px] font-semibold transition-all border flex items-center justify-between leading-snug ${
                  isSelected
                    ? 'bg-[#1b5e94] text-white border-[#1b5e94] font-bold shadow-sm'
                    : 'bg-[#5b96cc]/90 hover:bg-[#4884bd] text-white border-[#3c75a8]'
                }`}
                title={inc}
              >
                <div className="flex items-center gap-1.5 truncate">
                  {isSelected ? (
                    <CheckSquare className="w-3 h-3 shrink-0 text-cyan-200" />
                  ) : (
                    <Square className="w-3 h-3 shrink-0 text-cyan-100/70" />
                  )}
                  <span className="truncate">{inc}</span>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </aside>
  );
};

