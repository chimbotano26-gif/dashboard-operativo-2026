import React, { useState, useMemo } from 'react';
import { IncidentRecord } from '../types';
import { COMPARATIVO_MENSUAL } from '../data/mockData';
import { ArrowUpRight, ArrowDownRight, TrendingUp, BarChart2, Download, CheckCircle2, FileSpreadsheet, X } from 'lucide-react';
import { exportComparativeSeptemberToExcel } from '../utils/excelHelper';
import { EditableText } from './EditableText';

interface ComparativoViewProps {
  records: IncidentRecord[];
}

export const ComparativoView: React.FC<ComparativoViewProps> = ({ records }) => {
  const [excludeSetiembre, setExcludeSetiembre] = useState<boolean>(false);
  const [showFichaSetiembre, setShowFichaSetiembre] = useState<boolean>(false);

  // Aggregate stats
  const stats = useMemo(() => {
    let ba = 0;
    let vm = 0;
    let manana = 0;
    let tarde = 0;
    let noche = 0;
    let centro = 0;
    let norte = 0;
    let sur = 0;

    records.forEach((r) => {
      if (r.comisaria === 'CIA VILLA MARIA') vm++;
      else ba++;

      if (r.turno === 'MAÑANA') manana++;
      else if (r.turno === 'TARDE') tarde++;
      else noche++;

      if (r.zona === 'ZONA NORTE') norte++;
      else if (r.zona === 'ZONA SUR') sur++;
      else centro++;
    });

    return { ba, vm, manana, tarde, noche, centro, norte, sur, total: records.length || 1 };
  }, [records]);

  // Dynamic mapping across all months of the year
  const monthList = useMemo(() => {
    const counts2026: Record<string, number> = {};
    records.forEach((r) => {
      if (r.mes) {
        counts2026[r.mes] = (counts2026[r.mes] || 0) + 1;
      }
    });

    let list = COMPARATIVO_MENSUAL.map((item) => {
      const real2026 = counts2026[item.mes] !== undefined ? counts2026[item.mes] : item.anio2026;
      return {
        ...item,
        anio2026: real2026,
      };
    });

    if (excludeSetiembre) {
      list = list.filter((item) => item.mes !== 'SETIEMBRE');
    }

    return list;
  }, [records, excludeSetiembre]);

  // Interannual stats across active months
  const totalStats = useMemo(() => {
    const activeMonths = monthList.filter((m) => m.anio2026 > 0);
    const sum2025 = activeMonths.reduce((acc, m) => acc + m.anio2025, 0);
    const sum2026 = activeMonths.reduce((acc, m) => acc + m.anio2026, 0);
    const diff = sum2026 - sum2025;
    const pct = sum2025 > 0 ? ((diff / sum2025) * 100).toFixed(1) : '0';
    return { sum2025, sum2026, diff, pct, activeCount: activeMonths.length };
  }, [monthList]);

  // Setiembre stats
  const setiembreStats = useMemo(() => {
    const setRecords = records.filter((r) => r.mes === 'SETIEMBRE');
    const total2026 = setRecords.length > 0 ? setRecords.length : 2292;
    const total2025 = 4229;
    const diff = total2026 - total2025;
    const pct = Math.round((diff / total2025) * 100);

    let ba = 0;
    let vm = 0;
    let manana = 0;
    let tarde = 0;
    let noche = 0;

    setRecords.forEach((r) => {
      if (r.comisaria === 'CIA VILLA MARIA') vm++;
      else ba++;

      if (r.turno === 'MAÑANA') manana++;
      else if (r.turno === 'TARDE') tarde++;
      else noche++;
    });

    if (setRecords.length === 0) {
      ba = 203;
      vm = 39;
      manana = 78;
      tarde = 95;
      noche = 69;
    }

    return { total2026, total2025, diff, pct, ba, vm, manana, tarde, noche, count: setRecords.length };
  }, [records]);

  return (
    <div className="flex-1 flex flex-col gap-3 min-w-0 bg-white rounded-lg border-2 border-slate-300 shadow-sm p-4 text-slate-800">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between pb-3 border-b border-slate-200 gap-2">
        <div>
          <div className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-blue-700 shrink-0" />
            <EditableText
              idKey="comparativo_main_title"
              defaultText="ANÁLISIS COMPARATIVO INTERANUAL Y SECTORIAL"
              as="h2"
              className="text-base font-black text-[#0f3460] uppercase tracking-wide"
            />
          </div>
          <EditableText
            idKey="comparativo_main_subtitle"
            defaultText="Comparación estadística de productividad de operativos Serenazgo Nuevo Chimbote (Enero a Diciembre)"
            as="p"
            className="text-xs text-slate-500 mt-0.5"
          />
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            type="button"
            id="comparativo-toggle-setiembre"
            onClick={() => setExcludeSetiembre((prev) => !prev)}
            className={`text-xs font-bold px-3 py-1.5 rounded transition-all flex items-center gap-1.5 border shadow-xs ${
              excludeSetiembre
                ? 'bg-amber-100 text-amber-900 border-amber-300 hover:bg-amber-200'
                : 'bg-blue-100 text-blue-900 border-blue-300 hover:bg-blue-200'
            }`}
            title={excludeSetiembre ? 'Setiembre está excluido. Haz clic para incluir todos los meses' : 'Haz clic para aislar Setiembre'}
          >
            {excludeSetiembre ? (
              <>
                <CheckCircle2 className="w-3.5 h-3.5 text-amber-700" />
                <span>Setiembre Excluido</span>
              </>
            ) : (
              <span>Año Completo (Ene - Dic)</span>
            )}
          </button>

          <button
            type="button"
            id="comparativo-extraer-setiembre"
            onClick={() => setShowFichaSetiembre(true)}
            className="text-xs font-black uppercase px-3 py-1.5 rounded bg-gradient-to-r from-[#124270] to-[#1a5a94] hover:from-[#0d3459] text-white shadow-sm flex items-center gap-1.5 transition-all"
            title="Extraer ficha comparativa específica de Setiembre"
          >
            <BarChart2 className="w-3.5 h-3.5 text-cyan-300" />
            <span>Ficha Comparativa Setiembre</span>
          </button>

          <button
            type="button"
            onClick={() => exportComparativeSeptemberToExcel(records)}
            className="text-xs font-bold px-3 py-1.5 rounded bg-emerald-700 hover:bg-emerald-800 text-white shadow-sm flex items-center gap-1.5 transition-all"
            title="Descargar informe comparativo de Setiembre a Excel (.xlsx)"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Excel Setiembre</span>
          </button>
        </div>
      </div>

      {/* Interannual Growth KPI cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 flex items-center justify-between">
          <div>
            <div className="text-[11px] font-bold text-slate-500 uppercase">Variación Comparativa 2025 vs 2026</div>
            <div className={`text-2xl font-black flex items-center gap-1 ${Number(totalStats.pct) >= 0 ? 'text-emerald-600' : 'text-blue-900'}`}>
              <ArrowUpRight className="w-6 h-6 stroke-[3]" />
              <span>{Number(totalStats.pct) >= 0 ? `+${totalStats.pct}%` : `${totalStats.pct}%`}</span>
            </div>
            <div className="text-[10px] text-slate-500">
              {totalStats.sum2026.toLocaleString()} vs {totalStats.sum2025.toLocaleString()} atenciones ({totalStats.activeCount} meses registrados)
            </div>
          </div>
        </div>

        <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 flex items-center justify-between">
          <div>
            <div className="text-[11px] font-bold text-slate-500 uppercase">Sector con Mayor Carga</div>
            <div className="text-2xl font-black text-blue-900">ZONA CENTRO</div>
            <div className="text-[10px] text-slate-500">
              {stats.centro.toLocaleString()} atenciones ({Math.round((stats.centro / stats.total) * 100)}%)
            </div>
          </div>
        </div>

        <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 flex items-center justify-between">
          <div>
            <div className="text-[11px] font-bold text-slate-500 uppercase">Día Pico de Intervenciones</div>
            <div className="text-2xl font-black text-rose-600">DOMINGO</div>
            <div className="text-[10px] text-slate-500">Mayor densidad operativa por eventos y fin de semana</div>
          </div>
        </div>
      </div>

      {/* Monthly Comparative Table */}
      <div className="border border-slate-200 rounded-lg overflow-hidden">
        <div className="bg-[#0f2c4c] text-white p-2.5 text-xs font-bold uppercase tracking-wider flex items-center justify-between">
          <span>
            Tabla Comparativa Mensual (2025 vs 2026) &bull;{' '}
            {excludeSetiembre ? 'Año Evaluado (Setiembre Excluido)' : 'Año Completo (12 Meses: Enero a Diciembre)'}
          </span>
          <span className="text-[10px] text-cyan-300">
            {excludeSetiembre ? 'Setiembre retirado temporalmente' : 'Consolidado anual interanual'}
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-100 text-slate-700 uppercase text-[10px] font-black border-b border-slate-200">
              <tr>
                <th className="p-2 border-r border-slate-200">Mes</th>
                <th className="p-2 border-r border-slate-200 text-center">Año 2025</th>
                <th className="p-2 border-r border-slate-200 text-center">Año 2026</th>
                <th className="p-2 border-r border-slate-200 text-center">Diferencia</th>
                <th className="p-2 text-center">Tendencia</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 font-semibold">
              {monthList.map((m) => {
                const isPending = m.anio2026 === 0;
                const diff = m.anio2026 - m.anio2025;
                const pct = m.anio2025 > 0 ? Math.round((diff / m.anio2025) * 100) : 0;
                const isSetiembre = m.mes === 'SETIEMBRE';
                const isOctubre = m.mes === 'OCTUBRE';

                return (
                  <tr key={m.mes} className={isSetiembre || isOctubre ? 'bg-blue-50/70 hover:bg-blue-100/70' : 'hover:bg-slate-50'}>
                    <td className="p-2 border-r border-slate-200 font-bold text-slate-800 flex items-center gap-1.5">
                      <span>{m.mes}</span>
                      {isOctubre && (
                        <span className="text-[9px] px-1.5 py-0.2 rounded bg-amber-200 text-amber-900 font-black">
                          EN CURSO
                        </span>
                      )}
                      {isSetiembre && (
                        <span className="text-[9px] px-1.5 py-0.2 rounded bg-blue-200 text-blue-900 font-black">
                          ACTUAL
                        </span>
                      )}
                    </td>
                    <td className="p-2 border-r border-slate-200 text-center text-slate-600 font-mono">{m.anio2025.toLocaleString()}</td>
                    <td className="p-2 border-r border-slate-200 text-center font-bold text-blue-900 font-mono">
                      {isPending ? '-' : m.anio2026.toLocaleString()}
                    </td>
                    <td className="p-2 border-r border-slate-200 text-center font-mono">
                      {isPending ? (
                        <span className="text-slate-400">-</span>
                      ) : diff >= 0 ? (
                        <span className="text-emerald-600">+{diff.toLocaleString()}</span>
                      ) : (
                        <span className="text-rose-600">{diff.toLocaleString()}</span>
                      )}
                    </td>
                    <td className="p-2 text-center">
                      {isPending ? (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-500">
                          Pendiente
                        </span>
                      ) : (
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            pct >= 0 ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                          }`}
                        >
                          {pct >= 0 ? `+${pct}%` : `${pct}%`}
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Ficha Comparativa Específica de Setiembre (si se hace clic en extraer) */}
      {showFichaSetiembre && (
        <div className="bg-gradient-to-br from-blue-50 via-slate-50 to-indigo-50 border-2 border-[#124270] rounded-xl p-4 shadow-md flex flex-col gap-3 animate-fadeIn">
          <div className="flex items-center justify-between pb-2 border-b border-blue-200">
            <div className="flex items-center gap-2">
              <BarChart2 className="w-5 h-5 text-blue-800" />
              <div>
                <h3 className="text-sm font-black text-[#0f3460] uppercase">
                  FICHA COMPARATIVA EXTRAÍDA: SETIEMBRE (2025 vs 2026)
                </h3>
                <p className="text-xs text-slate-600">
                  Resumen consolidado de productividad de Setiembre para Serenazgo Nuevo Chimbote
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => exportComparativeSeptemberToExcel(records)}
                className="px-3 py-1 rounded bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold flex items-center gap-1 shadow-xs transition-colors"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Exportar Excel</span>
              </button>

              <button
                type="button"
                onClick={() => setShowFichaSetiembre(false)}
                className="p-1 rounded-full hover:bg-slate-200 text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-4 gap-2.5">
            <div className="bg-white p-2.5 rounded-lg border border-slate-200">
              <div className="text-[10px] text-slate-500 font-bold uppercase">Atenciones Setiembre 2025</div>
              <div className="text-xl font-black text-slate-700 font-mono">{setiembreStats.total2025}</div>
              <div className="text-[10px] text-slate-400">Línea base histórica</div>
            </div>

            <div className="bg-white p-2.5 rounded-lg border border-slate-200">
              <div className="text-[10px] text-blue-700 font-bold uppercase">Atenciones Setiembre 2026</div>
              <div className="text-xl font-black text-blue-900 font-mono">{setiembreStats.total2026}</div>
              <div className="text-[10px] text-blue-600 font-semibold">{setiembreStats.count} registros activos</div>
            </div>

            <div className="bg-white p-2.5 rounded-lg border border-slate-200">
              <div className="text-[10px] text-emerald-700 font-bold uppercase">Incremento Absoluto</div>
              <div className="text-xl font-black text-emerald-600 font-mono">+{setiembreStats.diff}</div>
              <div className="text-[10px] text-emerald-700 font-bold">+{setiembreStats.pct}% interanual</div>
            </div>

            <div className="bg-white p-2.5 rounded-lg border border-slate-200">
              <div className="text-[10px] text-indigo-700 font-bold uppercase">Turno con Mayor Impacto</div>
              <div className="text-base font-black text-indigo-900">TARDE ({setiembreStats.tarde})</div>
              <div className="text-[10px] text-slate-500">15:00 - 23:00 hrs</div>
            </div>
          </div>
        </div>
      )}

      {/* Sectorial and Shift Comparison Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {/* Comisaría breakdown */}
        <div className="border border-slate-200 rounded-lg p-3 bg-slate-50">
          <h4 className="text-xs font-black uppercase text-[#0f3460] mb-2">
            Comparativo por Comisaría PNP
          </h4>
          <div className="space-y-3">
            <div>
              <div className="flex justify-between text-xs font-bold text-slate-700 mb-1">
                <span>CIA BUENOS AIRES (Centro / Sur)</span>
                <span>{stats.ba.toLocaleString()} (84%)</span>
              </div>
              <div className="w-full h-3 bg-slate-200 rounded-full overflow-hidden">
                <div className="h-full bg-blue-700 rounded-full" style={{ width: '84%' }}></div>
              </div>
            </div>
            <div>
              <div className="flex justify-between text-xs font-bold text-slate-700 mb-1">
                <span>CIA VILLA MARIA (Norte)</span>
                <span>{stats.vm.toLocaleString()} (16%)</span>
              </div>
              <div className="w-full h-3 bg-slate-200 rounded-full overflow-hidden">
                <div className="h-full bg-cyan-600 rounded-full" style={{ width: '16%' }}></div>
              </div>
            </div>
          </div>
        </div>

        {/* Turnos breakdown */}
        <div className="border border-slate-200 rounded-lg p-3 bg-slate-50">
          <h4 className="text-xs font-black uppercase text-[#0f3460] mb-2">
            Comparativo por Turno de Servicio
          </h4>
          <div className="space-y-3">
            <div>
              <div className="flex justify-between text-xs font-bold text-slate-700 mb-1">
                <span>TARDE (15:00 - 23:00)</span>
                <span>{stats.tarde.toLocaleString()} (39%)</span>
              </div>
              <div className="w-full h-3 bg-slate-200 rounded-full overflow-hidden">
                <div className="h-full bg-blue-600 rounded-full" style={{ width: '39%' }}></div>
              </div>
            </div>
            <div>
              <div className="flex justify-between text-xs font-bold text-slate-700 mb-1">
                <span>MAÑANA (07:00 - 15:00)</span>
                <span>{stats.manana.toLocaleString()} (32%)</span>
              </div>
              <div className="w-full h-3 bg-slate-200 rounded-full overflow-hidden">
                <div className="h-full bg-amber-500 rounded-full" style={{ width: '32%' }}></div>
              </div>
            </div>
            <div>
              <div className="flex justify-between text-xs font-bold text-slate-700 mb-1">
                <span>NOCHE (23:00 - 07:00)</span>
                <span>{stats.noche.toLocaleString()} (29%)</span>
              </div>
              <div className="w-full h-3 bg-slate-200 rounded-full overflow-hidden">
                <div className="h-full bg-indigo-600 rounded-full" style={{ width: '29%' }}></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
