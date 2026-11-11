import React, { useState, useMemo } from 'react';
import { IncidentRecord } from '../types';
import {
  Search,
  Filter,
  Download,
  Eye,
  Trash2,
  MapPin,
  Calendar,
  Clock,
  Car,
  UserCheck,
  Save,
} from 'lucide-react';
import { exportIncidentsToExcel } from '../utils/excelHelper';
import { EditableText } from './EditableText';

interface DetalleIncidenciasViewProps {
  records: IncidentRecord[];
  onDeleteRecord?: (id: string) => void;
  onViewOnMap?: (record: IncidentRecord) => void;
  onSaveChanges?: () => void;
  hasUnsavedChanges?: boolean;
  lastSavedAt?: string | null;
}

export const DetalleIncidenciasView: React.FC<DetalleIncidenciasViewProps> = ({
  records,
  onDeleteRecord,
  onViewOnMap,
  onSaveChanges,
  hasUnsavedChanges = false,
  lastSavedAt,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedEstado, setSelectedEstado] = useState<string>('TODOS');
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 20;

  const filtered = useMemo(() => {
    return records.filter((r) => {
      if (selectedEstado !== 'TODOS' && r.estado !== selectedEstado) return false;
      if (!searchTerm) return true;
      const q = searchTerm.toLowerCase();
      return (
        (r.codigo || '').toLowerCase().includes(q) ||
        r.tipoIncidencia.toLowerCase().includes(q) ||
        r.ubicacion.toLowerCase().includes(q) ||
        r.subsector.toLowerCase().includes(q) ||
        (r.patrullero || '').toLowerCase().includes(q) ||
        (r.efectivo || '').toLowerCase().includes(q)
      );
    });
  }, [records, searchTerm, selectedEstado]);

  const totalPages = Math.ceil(filtered.length / pageSize) || 1;
  const paginated = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filtered.slice(start, start + pageSize);
  }, [filtered, currentPage]);

  const handleExport = () => {
    exportIncidentsToExcel(filtered, 'Detalle_Incidencias_Serenazgo_Nuevo_Chimbote.xlsx');
  };

  return (
    <div className="flex-1 flex flex-col gap-3 min-w-0 bg-white rounded-lg border-2 border-slate-300 shadow-sm p-3.5 text-slate-800">
      {/* Top Controls */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pb-3 border-b border-slate-200">
        <div>
          <EditableText
            idKey="detalle_incidencias_title"
            defaultText="DETALLE Y REGISTRO DE INCIDENCIAS • SERENAZGO"
            as="h2"
            className="text-base font-black text-[#0f3460] uppercase tracking-wide block"
          />
          <p className="text-xs text-slate-500">
            Total de registros filtrados: <strong className="text-blue-700">{filtered.length}</strong> de {records.length}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Search bar */}
          <div className="relative flex-1 sm:w-64">
            <Search className="w-4 h-4 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              placeholder="Buscar por código, calle, hecho..."
              className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>

          {/* Status filter */}
          <select
            value={selectedEstado}
            onChange={(e) => {
              setSelectedEstado(e.target.value);
              setCurrentPage(1);
            }}
            className="py-1.5 px-2.5 text-xs bg-slate-50 border border-slate-300 rounded-md font-bold text-slate-700 focus:outline-none"
          >
            <option value="TODOS">Todos los Estados</option>
            <option value="ATENDIDO">Atendido</option>
            <option value="EN PROCESO">En Proceso</option>
            <option value="DERIVADO PNP">Derivado PNP</option>
          </select>

          {/* Export table */}
          <button
            onClick={handleExport}
            className="px-3 py-1.5 rounded bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold flex items-center gap-1.5 shadow"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Excel</span>
          </button>

          {/* Botón Guardar Cambios */}
          {onSaveChanges && (
            <button
              onClick={onSaveChanges}
              className={`px-3 py-1.5 rounded text-white text-xs font-black flex items-center gap-1.5 shadow transition-all active:scale-95 ${
                hasUnsavedChanges
                  ? 'bg-gradient-to-r from-amber-600 to-orange-600 animate-pulse ring-2 ring-amber-400'
                  : 'bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-500 hover:to-teal-600'
              }`}
              title="Guardar todos los registros de forma permanente en el sistema para que no sea necesario volver a meter datos"
            >
              <Save className="w-3.5 h-3.5 text-emerald-200" />
              <span>Guardar Cambios</span>
            </button>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="flex-1 overflow-x-auto border border-slate-200 rounded-lg min-h-[420px]">
        <table className="w-full text-left text-xs">
          <thead className="bg-[#0f2c4c] text-white uppercase text-[10px] tracking-wider sticky top-0 z-10">
            <tr>
              <th className="p-2.5 border-r border-slate-700">Cód / ID</th>
              <th className="p-2.5 border-r border-slate-700">Fecha y Hora</th>
              <th className="p-2.5 border-r border-slate-700">Tipo de Incidencia</th>
              <th className="p-2.5 border-r border-slate-700">Sector / Cuadrante</th>
              <th className="p-2.5 border-r border-slate-700">Comisaría</th>
              <th className="p-2.5 border-r border-slate-700">Turno</th>
              <th className="p-2.5 border-r border-slate-700">Ubicación</th>
              <th className="p-2.5 border-r border-slate-700">Estado</th>
              <th className="p-2.5 text-center">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 font-medium">
            {paginated.length === 0 ? (
              <tr>
                <td colSpan={9} className="p-8 text-center text-slate-400 font-semibold">
                  No se encontraron atenciones con los criterios especificados.
                </td>
              </tr>
            ) : (
              paginated.map((r) => {
                return (
                  <tr key={r.id} className="hover:bg-slate-50 transition-colors">
                    <td className="p-2.5 font-bold font-mono text-blue-900 border-r border-slate-100 whitespace-nowrap">
                      {r.codigo || r.id}
                      {r.esPersonalizado && (
                        <span className="ml-1 text-[9px] px-1 rounded bg-amber-100 text-amber-800 border border-amber-300">
                          Nuevo
                        </span>
                      )}
                    </td>
                    <td className="p-2.5 border-r border-slate-100 whitespace-nowrap text-slate-600">
                      <div>{r.fecha}</div>
                      <div className="text-[10px] text-slate-400 font-mono">{r.hora}</div>
                    </td>
                    <td className="p-2.5 font-bold text-slate-800 border-r border-slate-100">
                      {r.tipoIncidencia}
                    </td>
                    <td className="p-2.5 border-r border-slate-100 whitespace-nowrap">
                      <span className="font-bold text-blue-800">{r.subsector}</span>
                      <span className="text-[10px] text-slate-400 block">{r.zona}</span>
                    </td>
                    <td className="p-2.5 border-r border-slate-100 text-slate-600 whitespace-nowrap">
                      {r.comisaria}
                    </td>
                    <td className="p-2.5 border-r border-slate-100 whitespace-nowrap">
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                          r.turno === 'TARDE'
                            ? 'bg-blue-100 text-blue-800'
                            : r.turno === 'MAÑANA'
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-indigo-100 text-indigo-800'
                        }`}
                      >
                        {r.turno}
                      </span>
                    </td>
                    <td className="p-2.5 border-r border-slate-100 text-slate-700 max-w-xs truncate" title={r.ubicacion}>
                      {r.ubicacion}
                    </td>
                    <td className="p-2.5 border-r border-slate-100 whitespace-nowrap">
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          r.estado === 'ATENDIDO'
                            ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                            : r.estado === 'EN PROCESO'
                            ? 'bg-amber-100 text-amber-800 border border-amber-300'
                            : 'bg-purple-100 text-purple-800 border border-purple-300'
                        }`}
                      >
                        {r.estado}
                      </span>
                    </td>
                    <td className="p-2.5 text-center whitespace-nowrap">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          onClick={() => onViewOnMap?.(r)}
                          className="p-1 rounded text-cyan-700 hover:bg-cyan-50"
                          title="Ver en Mapa de Calor"
                        >
                          <MapPin className="w-4 h-4" />
                        </button>
                        {onDeleteRecord && (
                          <button
                            onClick={() => onDeleteRecord(r.id)}
                            className="p-1 rounded text-rose-600 hover:bg-rose-50"
                            title="Eliminar Registro"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Footer */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-2 pt-2 border-t border-slate-200 text-xs text-slate-600">
        <div>
          Página <strong>{currentPage}</strong> de <strong>{totalPages}</strong> &bull; Mostrando{' '}
          {Math.min(filtered.length, (currentPage - 1) * pageSize + 1)} -{' '}
          {Math.min(filtered.length, currentPage * pageSize)} de {filtered.length} atenciones
        </div>

        <div className="flex items-center gap-1">
          <button
            onClick={() => setCurrentPage(1)}
            disabled={currentPage === 1}
            className="px-2.5 py-1 rounded border border-slate-300 disabled:opacity-40 hover:bg-slate-100 font-bold"
          >
            &laquo;
          </button>
          <button
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            disabled={currentPage === 1}
            className="px-2.5 py-1 rounded border border-slate-300 disabled:opacity-40 hover:bg-slate-100 font-bold"
          >
            Anterior
          </button>
          <span className="px-2 py-1 font-bold text-blue-900">{currentPage}</span>
          <button
            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
            className="px-2.5 py-1 rounded border border-slate-300 disabled:opacity-40 hover:bg-slate-100 font-bold"
          >
            Siguiente
          </button>
          <button
            onClick={() => setCurrentPage(totalPages)}
            disabled={currentPage === totalPages}
            className="px-2.5 py-1 rounded border border-slate-300 disabled:opacity-40 hover:bg-slate-100 font-bold"
          >
            &raquo;
          </button>
        </div>
      </div>
    </div>
  );
};
