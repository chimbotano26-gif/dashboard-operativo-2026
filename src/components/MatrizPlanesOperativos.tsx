import React, { useState, useMemo } from 'react';
import {
  ShieldAlert,
  Car,
  Zap,
  Search,
  Download,
  Printer,
  FileSpreadsheet,
  CheckCircle2,
  AlertTriangle,
  MapPin,
  Clock,
  Filter,
  BarChart3,
  Building,
  TreePine,
  GraduationCap,
  Bus,
  Church,
  ChevronDown,
  ChevronUp,
  Sparkles,
  Info,
  Layers,
  ArrowUpDown,
  RotateCcw,
} from 'lucide-react';
import {
  PLANES_OPERATIVOS_CATALOGO,
  TOTAL_PATRULLAJES_OFICIAL,
  PERIODO_OFICIAL,
  PlanOperativoConfig,
  ZonaIntervencionCritica,
} from '../data/planesOperativosData';
import { exportPlanesOperativosToExcel } from '../utils/excelHelper';

export const MatrizPlanesOperativos: React.FC = () => {
  // Plan seleccionado ('TODOS' o el ID de uno de los 10 planes)
  const [selectedPlanId, setSelectedPlanId] = useState<string>('LIBADORES');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [filterTipoEspacio, setFilterTipoEspacio] = useState<string>('TODOS');
  const [filterComisaria, setFilterComisaria] = useState<string>('TODAS');
  const [filterCriticidad, setFilterCriticidad] = useState<string>('TODOS');
  const [isPrintModalOpen, setIsPrintModalOpen] = useState<boolean>(false);
  const [expandedZoneId, setExpandedZoneId] = useState<string | null>(null);

  // Plan activo o null si se ven todos
  const currentPlan = useMemo(() => {
    if (selectedPlanId === 'TODOS') return null;
    return PLANES_OPERATIVOS_CATALOGO.find((p) => p.id === selectedPlanId) || null;
  }, [selectedPlanId]);

  // Lista consolidada de puntos según el plan seleccionado
  const rawPuntos = useMemo(() => {
    if (currentPlan) {
      return currentPlan.puntosCriticos;
    }
    // Todos los puntos consolidados de los 10 planes
    return PLANES_OPERATIVOS_CATALOGO.flatMap((p) => p.puntosCriticos);
  }, [currentPlan]);

  // Filtros aplicados a los puntos
  const filteredPuntos = useMemo(() => {
    return rawPuntos.filter((pto) => {
      // Búsqueda en Lugar, Columna 1 y Observación
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesLugar = pto.lugar.toLowerCase().includes(q);
        const matchesCol1 = pto.columna1.toLowerCase().includes(q);
        const matchesObs = pto.observacion.toLowerCase().includes(q);
        const matchesSector = pto.sector.toLowerCase().includes(q);
        if (!matchesLugar && !matchesCol1 && !matchesObs && !matchesSector) {
          return false;
        }
      }

      // Tipo de Espacio
      if (filterTipoEspacio !== 'TODOS' && pto.tipoEspacio !== filterTipoEspacio) {
        return false;
      }

      // Comisaría
      if (filterComisaria !== 'TODAS' && pto.comisaria !== filterComisaria) {
        return false;
      }

      // Nivel de Criticidad
      if (filterCriticidad !== 'TODOS' && pto.nivelCriticidad !== filterCriticidad) {
        return false;
      }

      return true;
    });
  }, [rawPuntos, searchQuery, filterTipoEspacio, filterComisaria, filterCriticidad]);

  // Totales de patrullajes en el filtro actual
  const totalPatrullajesEnVista = useMemo(() => {
    return filteredPuntos.reduce((acc, p) => acc + p.frecuenciaPatrullajes, 0);
  }, [filteredPuntos]);

  // Total de intervenciones efectivas
  const totalIntervencionesEnVista = useMemo(() => {
    return filteredPuntos.reduce((acc, p) => acc + p.intervencionesEfectivas, 0);
  }, [filteredPuntos]);

  // Exportar a Excel
  const handleExportExcel = () => {
    exportPlanesOperativosToExcel(
      PLANES_OPERATIVOS_CATALOGO,
      filteredPuntos,
      currentPlan ? currentPlan.nombreCorto : 'CONSOLIDADO'
    );
  };

  // Exportar a CSV simple
  const handleExportCSV = () => {
    const headers = [
      'PLAN OPERATIVO',
      'LUGAR',
      'COLUMNA 1 (URBANIZACION)',
      'SECTOR',
      'ZONA',
      'COMISARIA',
      'TIPO ESPACIO',
      'PATRULLAJES',
      'PORCENTAJE',
      'CRITICIDAD',
      'UNIDADES ASIGNADAS',
      'OBSERVACION',
    ];
    const rows = filteredPuntos.map((p) => [
      `"${currentPlan ? currentPlan.nombre : 'CONSOLIDADO'}"`,
      `"${p.lugar}"`,
      `"${p.columna1}"`,
      `"${p.sector}"`,
      `"${p.zona}"`,
      `"${p.comisaria}"`,
      `"${p.tipoEspacio}"`,
      p.frecuenciaPatrullajes,
      `"${p.porcentajePlan}%"`,
      `"${p.nivelCriticidad}"`,
      `"${p.unidadesHabituales}"`,
      `"${p.observacion.replace(/"/g, '""')}"`,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Rendicion_Planes_Operativos_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getEspacioIcon = (tipo: string) => {
    switch (tipo) {
      case 'PARQUE':
        return <TreePine className="w-3.5 h-3.5 text-emerald-600" />;
      case 'PLAZA':
        return <Building className="w-3.5 h-3.5 text-cyan-600" />;
      case 'COLEGIO':
        return <GraduationCap className="w-3.5 h-3.5 text-indigo-600" />;
      case 'PARADERO':
        return <Bus className="w-3.5 h-3.5 text-blue-600" />;
      case 'IGLESIA':
        return <Church className="w-3.5 h-3.5 text-purple-600" />;
      default:
        return <MapPin className="w-3.5 h-3.5 text-slate-600" />;
    }
  };

  return (
    <div className="flex flex-col gap-4 text-slate-800">
      {/* ========================================================================= */}
      {/* 1. TOP BANNER OFICIAL (RÉPLICA EXACTA DE LA IMAGEN PROPORCIONADA)          */}
      {/* ========================================================================= */}
      <div className="bg-gradient-to-b from-[#117a38] via-[#0d6e31] to-[#0a5c28] rounded-xl p-3 sm:p-4 text-white shadow-lg border-2 border-emerald-500/50">
        <div className="text-center mb-3">
          <h2 className="text-lg sm:text-2xl font-black uppercase tracking-wider text-white drop-shadow-md">
            PLANES OPERATIVOS EN EJECUCIÓN
          </h2>
          <p className="text-xs sm:text-sm font-black tracking-wide text-emerald-100 uppercase drop-shadow-sm mt-0.5">
            PATRULLAJES Y PREVENCIÓN DE INCIDENCIAS
          </p>
        </div>

        {/* Las 10 Tarjetas de Planes Operativos (Distribución en 2 filas idénticas a la imagen) */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2 sm:gap-2.5">
          {PLANES_OPERATIVOS_CATALOGO.map((plan) => {
            const isSelected = selectedPlanId === plan.id;
            return (
              <button
                key={plan.id}
                type="button"
                onClick={() => setSelectedPlanId(plan.id)}
                className={`flex flex-col rounded-lg overflow-hidden transition-all duration-200 text-left border-2 shadow-md ${
                  isSelected
                    ? 'ring-4 ring-amber-400 scale-[1.03] border-amber-300 z-10'
                    : 'border-blue-900/60 hover:scale-[1.01] hover:border-white/70 opacity-95 hover:opacity-100'
                }`}
              >
                {/* Cabecera Azul de la Tarjeta */}
                <div className="bg-[#0b4884] px-2 py-1.5 text-center min-h-[44px] flex items-center justify-center border-b border-blue-600/40">
                  <span className="text-[10px] sm:text-[11px] font-black uppercase tracking-tight text-white leading-tight">
                    {plan.nombre}
                  </span>
                </div>
                {/* Cuerpo Blanco con la Cifra Exacta */}
                <div className="bg-white/95 px-2 py-2 flex flex-col items-center justify-center min-h-[58px]">
                  <span className="text-xl sm:text-2xl font-black font-mono text-[#0b4884] tracking-tight">
                    {plan.patrullajesTotal.toLocaleString()}
                  </span>
                  <span className="text-[9px] font-bold text-slate-500">
                    {plan.pctDelTotal.toFixed(1)}% del total
                  </span>
                </div>
              </button>
            );
          })}
        </div>

        {/* Fila Inferior con el Gran Total */}
        <div className="mt-3 pt-2.5 border-t border-emerald-400/40 flex flex-col sm:flex-row items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setSelectedPlanId('TODOS')}
              className={`px-3 py-1 rounded-md text-xs font-black transition-all ${
                selectedPlanId === 'TODOS'
                  ? 'bg-amber-400 text-slate-950 shadow-md ring-2 ring-white'
                  : 'bg-emerald-900/80 hover:bg-emerald-800 text-white border border-emerald-400/40'
              }`}
            >
              VER TODOS LOS PLANES (CONSOLIDADO)
            </button>
            <span className="text-xs font-bold text-emerald-100 uppercase tracking-wide">
              PATRULLAJES PREVENTIVOS {PERIODO_OFICIAL}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-emerald-200 font-bold uppercase hidden md:inline">
              TOTAL OFICIAL EJECUTADO:
            </span>
            <span className="text-2xl sm:text-3xl font-black font-mono text-emerald-200 tracking-tight drop-shadow-md">
              {TOTAL_PATRULLAJES_OFICIAL.toLocaleString()}
            </span>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 2. BARRA DE FILTROS Y ACCIONES DE EXPORTACIÓN                              */}
      {/* ========================================================================= */}
      <div className="bg-white rounded-xl border-2 border-slate-300 shadow-sm p-3 flex flex-col gap-2.5">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-2.5">
          {/* Identificación del Plan Activo */}
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-blue-100 text-blue-900 font-black">
              <Layers className="w-4 h-4 text-blue-800" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-sm font-black text-[#0f3460] uppercase">
                  {currentPlan ? currentPlan.nombre : 'MATRIZ INTEGRAL DE LOS 10 PLANES OPERATIVOS'}
                </span>
                <span className="text-xs font-mono font-black px-2 py-0.5 rounded-full bg-blue-50 text-blue-800 border border-blue-200">
                  {currentPlan
                    ? `${currentPlan.patrullajesTotal.toLocaleString()} patrullajes (${currentPlan.pctDelTotal.toFixed(1)}%)`
                    : `${TOTAL_PATRULLAJES_OFICIAL.toLocaleString()} patrullajes totales`}
                </span>
              </div>
              <p className="text-[11px] text-slate-500 font-medium">
                {currentPlan
                  ? currentPlan.objetivoPrincipal
                  : 'Rendición de cuentas consolidada de los 9,571 patrullajes preventivos ejecutados en Nuevo Chimbote'}
              </p>
            </div>
          </div>

          {/* Botones de Exportación e Impresión para Informes */}
          <div className="flex items-center gap-2 flex-wrap w-full lg:w-auto justify-end">
            <button
              onClick={handleExportExcel}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold shadow-xs transition-colors"
              title="Descargar libro Excel estructurado con 2 hojas: Resumen de Planes y Zonas Críticas"
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              <span>Exportar Excel (XLSX)</span>
            </button>
            <button
              onClick={handleExportCSV}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 text-xs font-bold transition-colors"
              title="Descargar datos en formato CSV delimitado por comas"
            >
              <Download className="w-3.5 h-3.5" />
              <span>CSV</span>
            </button>
            <button
              onClick={() => setIsPrintModalOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#0f3460] hover:bg-blue-900 text-white text-xs font-bold shadow-xs transition-colors"
              title="Abrir vista de impresión formal para informe oficial de gestión"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Ficha Ejecutiva / Imprimir</span>
            </button>
          </div>
        </div>

        {/* Filtros Secundarios */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2 pt-2 border-t border-slate-200 text-xs">
          {/* Búsqueda en Lugar / Observación / Columna 1 */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Buscar en Lugar, Observación o Columna 1..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-50 border border-slate-300 rounded-md pl-8 pr-3 py-1.5 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-blue-600 focus:bg-white"
            />
          </div>

          {/* Filtro por Tipo de Espacio */}
          <div className="flex items-center gap-1.5">
            <span className="text-[11px] font-bold text-slate-500 shrink-0">Espacio:</span>
            <select
              value={filterTipoEspacio}
              onChange={(e) => setFilterTipoEspacio(e.target.value)}
              className="w-full bg-slate-50 border border-slate-300 rounded-md px-2 py-1.5 text-xs text-slate-700 font-medium focus:outline-none focus:border-blue-600"
            >
              <option value="TODOS">Todos los Espacios</option>
              <option value="PARQUE">Parques y Jardines</option>
              <option value="PLAZA">Plazas Cívicas</option>
              <option value="PARADERO">Paraderos Masivos</option>
              <option value="COLEGIO">Colegios e Institutos</option>
              <option value="IGLESIA">Iglesias y Parroquias</option>
              <option value="AVENIDA">Avenidas Troncales</option>
              <option value="DESCAMAPADO">Descampados y Canales</option>
              <option value="URBANIZACION">Urbanizaciones y Pasajes</option>
            </select>
          </div>

          {/* Filtro por Comisaría */}
          <div className="flex items-center gap-1.5">
            <span className="text-[11px] font-bold text-slate-500 shrink-0">Comisaría:</span>
            <select
              value={filterComisaria}
              onChange={(e) => setFilterComisaria(e.target.value)}
              className="w-full bg-slate-50 border border-slate-300 rounded-md px-2 py-1.5 text-xs text-slate-700 font-medium focus:outline-none focus:border-blue-600"
            >
              <option value="TODAS">Ambas Comisarías (PNP)</option>
              <option value="CIA BUENOS AIRES">Cía Buenos Aires (Centro / Sur)</option>
              <option value="CIA VILLA MARIA">Cía Villa María (Norte)</option>
            </select>
          </div>

          {/* Filtro por Criticidad */}
          <div className="flex items-center gap-1.5">
            <span className="text-[11px] font-bold text-slate-500 shrink-0">Criticidad:</span>
            <select
              value={filterCriticidad}
              onChange={(e) => setFilterCriticidad(e.target.value)}
              className="w-full bg-slate-50 border border-slate-300 rounded-md px-2 py-1.5 text-xs text-slate-700 font-medium focus:outline-none focus:border-blue-600"
            >
              <option value="TODOS">Todas las Prioridades</option>
              <option value="CRÍTICO / ALTO">Crítico / Alto Impacto</option>
              <option value="MEDIO / FRECUENTE">Medio / Frecuente</option>
              <option value="PREVENTIVO">Preventivo</option>
            </select>
          </div>
        </div>

        {/* Resumen de Resultados del Filtro */}
        <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1">
          <div>
            Mostrando <strong>{filteredPuntos.length}</strong> puntos críticos filtrados &bull; Concentran{' '}
            <strong className="text-blue-900 font-mono font-black">{totalPatrullajesEnVista.toLocaleString()}</strong> patrullajes
          </div>
          {(searchQuery || filterTipoEspacio !== 'TODOS' || filterComisaria !== 'TODAS' || filterCriticidad !== 'TODOS') && (
            <button
              onClick={() => {
                setSearchQuery('');
                setFilterTipoEspacio('TODOS');
                setFilterComisaria('TODAS');
                setFilterCriticidad('TODOS');
              }}
              className="text-rose-600 hover:text-rose-800 font-bold flex items-center gap-1 hover:underline"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Limpiar filtros</span>
            </button>
          )}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 3. JUSTIFICACIÓN DE RECURSOS ASIGNADOS (CAMIONETAS 4X4 Y MOTOS)             */}
      {/* ========================================================================= */}
      {currentPlan && (
        <div className="bg-gradient-to-r from-blue-50 via-slate-50 to-indigo-50 rounded-xl border border-blue-200 p-3.5 shadow-xs">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
            <div className="flex-1">
              <span className="text-[10px] font-black uppercase tracking-wider text-blue-900 bg-blue-100 px-2 py-0.5 rounded">
                Justificación Técnica de Recursos de Flota &bull; {currentPlan.nombreCorto}
              </span>
              <p className="text-xs text-slate-700 mt-1.5 leading-relaxed font-medium">
                {currentPlan.recursosAsignados.justificacionRecursos}
              </p>
            </div>

            <div className="flex items-center gap-2.5 shrink-0">
              <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-lg border border-slate-200 shadow-xs">
                <Car className="w-4 h-4 text-blue-700" />
                <div>
                  <div className="text-xs font-black text-slate-900 font-mono">
                    {currentPlan.recursosAsignados.camionetas} Camionetas
                  </div>
                  <div className="text-[9px] text-slate-500">Hilux / Navara 4x4</div>
                </div>
              </div>

              <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-lg border border-slate-200 shadow-xs">
                <Zap className="w-4 h-4 text-emerald-700" />
                <div>
                  <div className="text-xs font-black text-slate-900 font-mono">
                    {currentPlan.recursosAsignados.motos} Motos
                  </div>
                  <div className="text-[9px] text-slate-500">Motos Rápidas</div>
                </div>
              </div>

              <div className="bg-blue-900 text-white px-3 py-1.5 rounded-lg shadow-xs text-center min-w-[70px]">
                <div className="text-xs font-black font-mono">{currentPlan.recursosAsignados.personalTotal}</div>
                <div className="text-[9px] text-blue-200 font-bold uppercase">Serenos</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 4. TABLA RESUMEN / REPORTE OFICIAL "ZONAS DE INTERVENCIÓN POR PLAN"        */}
      {/* ========================================================================= */}
      <div className="bg-white rounded-xl border-2 border-slate-300 shadow-sm overflow-hidden">
        {/* Cabecera de la Tabla */}
        <div className="bg-gradient-to-r from-[#0f3460] via-[#124270] to-[#174e82] text-white px-4 py-3 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
          <div>
            <div className="flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-amber-400" />
              <h3 className="text-sm font-black uppercase tracking-wider">
                Zonas de Intervención por Plan — Reporte de Gestión y Puntos Críticos
              </h3>
            </div>
            <p className="text-[11px] text-slate-200 mt-0.5">
              Conexión directa con los campos oficiales de base de datos: <strong>Lugar</strong>, <strong>Columna 1</strong> y <strong>Observación</strong>
            </p>
          </div>

          <div className="text-right">
            <span className="text-[10px] font-mono font-bold bg-blue-950/80 text-cyan-300 px-2.5 py-1 rounded border border-cyan-500/40">
              {filteredPuntos.length} Zonas Listadas &bull; {totalPatrullajesEnVista.toLocaleString()} Patrullajes
            </span>
          </div>
        </div>

        {/* Tabla Detallada con Ranking de Parques, Calles y Urbanizaciones */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-100 border-b border-slate-200 text-slate-700">
                <th className="p-2.5 font-black uppercase w-12 text-center">N°</th>
                <th className="p-2.5 font-black uppercase">Lugar / Espacio (Campo LUGAR)</th>
                <th className="p-2.5 font-black uppercase">Urbanización (Campo Columna 1)</th>
                <th className="p-2.5 font-black uppercase text-center w-24">Sector / PNP</th>
                <th className="p-2.5 font-black uppercase text-right w-28">Patrullajes</th>
                <th className="p-2.5 font-black uppercase text-center w-28">Criticidad</th>
                <th className="p-2.5 font-black uppercase w-48">Recursos Asignados</th>
                <th className="p-2.5 font-black uppercase w-20 text-center">Detalle</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {filteredPuntos.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-slate-400">
                    <Info className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                    No se encontraron zonas que coincidan con los criterios de búsqueda o filtros seleccionados.
                  </td>
                </tr>
              ) : (
                filteredPuntos.map((pto, idx) => {
                  const isExpanded = expandedZoneId === pto.id;

                  const criticidadColor =
                    pto.nivelCriticidad === 'CRÍTICO / ALTO'
                      ? 'bg-rose-100 text-rose-800 border-rose-300'
                      : pto.nivelCriticidad === 'MEDIO / FRECUENTE'
                      ? 'bg-amber-100 text-amber-800 border-amber-300'
                      : 'bg-emerald-100 text-emerald-800 border-emerald-300';

                  return (
                    <React.Fragment key={pto.id}>
                      <tr
                        onClick={() => setExpandedZoneId(isExpanded ? null : pto.id)}
                        className={`hover:bg-blue-50/60 cursor-pointer transition-colors ${
                          isExpanded ? 'bg-blue-50/80 font-medium' : ''
                        }`}
                      >
                        <td className="p-2.5 text-center font-mono font-bold text-slate-500">
                          {idx + 1}
                        </td>

                        {/* Campo LUGAR */}
                        <td className="p-2.5">
                          <div className="flex items-center gap-2">
                            {getEspacioIcon(pto.tipoEspacio)}
                            <div>
                              <div className="font-bold text-slate-900">{pto.lugar}</div>
                              <span className="text-[10px] text-slate-400 font-semibold">
                                {pto.tipoEspacio}
                              </span>
                            </div>
                          </div>
                        </td>

                        {/* Campo Columna 1 */}
                        <td className="p-2.5 text-slate-700 font-medium">
                          {pto.columna1}
                        </td>

                        {/* Sector y Comisaría */}
                        <td className="p-2.5 text-center">
                          <span className="font-mono font-bold text-blue-950 bg-slate-200/80 px-1.5 py-0.5 rounded text-[10px]">
                            {pto.sector}
                          </span>
                          <div className="text-[9px] text-slate-500 font-semibold mt-0.5">
                            {pto.comisaria.replace('CIA ', '')}
                          </div>
                        </td>

                        {/* Frecuencia y Porcentaje */}
                        <td className="p-2.5 text-right font-mono">
                          <div className="font-black text-blue-900 text-sm">
                            {pto.frecuenciaPatrullajes.toLocaleString()}
                          </div>
                          <div className="text-[9px] text-slate-500 font-bold">
                            {pto.porcentajePlan.toFixed(1)}% del plan
                          </div>
                          {/* Barra de Progreso */}
                          <div className="w-full bg-slate-200 rounded-full h-1 mt-1 overflow-hidden">
                            <div
                              className="bg-blue-600 h-1 rounded-full"
                              style={{ width: `${Math.min(100, pto.porcentajePlan * 3.5)}%` }}
                            ></div>
                          </div>
                        </td>

                        {/* Nivel de Criticidad */}
                        <td className="p-2.5 text-center">
                          <span className={`inline-block px-2 py-0.5 rounded text-[9px] font-black border ${criticidadColor}`}>
                            {pto.nivelCriticidad}
                          </span>
                        </td>

                        {/* Recursos Asignados */}
                        <td className="p-2.5 text-[11px] text-slate-600">
                          <div className="font-semibold text-slate-800">{pto.unidadesHabituales}</div>
                          <div className="text-[10px] text-slate-500 font-medium">
                            Turno {pto.turnoPredominante} &bull; {pto.intervencionesEfectivas} interv.
                          </div>
                        </td>

                        {/* Botón Desplegable */}
                        <td className="p-2.5 text-center">
                          <button
                            type="button"
                            className="p-1 rounded hover:bg-slate-200 text-slate-600 transition-colors"
                          >
                            {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                          </button>
                        </td>
                      </tr>

                      {/* Fila Desplegable con Campo OBSERVACIÓN de Rendición de Cuentas */}
                      {isExpanded && (
                        <tr className="bg-slate-50/90 border-b-2 border-blue-200">
                          <td colSpan={8} className="p-3.5">
                            <div className="bg-white rounded-lg border border-blue-200 p-3 shadow-xs flex flex-col gap-2">
                              <div className="flex items-center justify-between border-b border-slate-100 pb-1.5">
                                <span className="text-[10px] font-black text-blue-900 uppercase tracking-wide flex items-center gap-1.5">
                                  <Info className="w-3.5 h-3.5 text-blue-700" />
                                  <span>Campo OBSERVACIÓN (Bitácora Oficial de Patrullaje)</span>
                                </span>
                                <span className="text-[10px] font-mono text-slate-500 font-bold">
                                  Registro ID: {pto.id} &bull; {pto.comisaria}
                                </span>
                              </div>

                              <p className="text-xs text-slate-700 leading-relaxed font-medium bg-slate-50 p-2.5 rounded border border-slate-200">
                                «{pto.observacion}»
                              </p>

                              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1 text-[11px]">
                                <div className="bg-blue-50/60 p-2 rounded border border-blue-100">
                                  <span className="font-bold text-blue-900 block">Efectividad Operativa:</span>
                                  <span className="text-slate-600 font-medium">
                                    {pto.intervencionesEfectivas} intervenciones disuasivas y retiros directos en este punto.
                                  </span>
                                </div>
                                <div className="bg-emerald-50/60 p-2 rounded border border-emerald-100">
                                  <span className="font-bold text-emerald-900 block">Flota Empleada:</span>
                                  <span className="text-slate-600 font-medium">
                                    {pto.unidadesHabituales} bajo supervisión de la Central de Monitoreo.
                                  </span>
                                </div>
                                <div className="bg-amber-50/60 p-2 rounded border border-amber-100">
                                  <span className="font-bold text-amber-900 block">Horario Predominante:</span>
                                  <span className="text-slate-600 font-medium">
                                    Guardia de {pto.turnoPredominante} con mayor frecuencia de fin de semana.
                                  </span>
                                </div>
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pie de la Tabla con Resumen Consolidado */}
        <div className="bg-slate-50 px-4 py-2.5 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-600 gap-2">
          <span>
            Periodo de Auditoría: <strong>Enero 2023 a Agosto 2026</strong> &bull; Total general:{' '}
            <strong className="text-blue-900 font-mono">9,571 patrullajes</strong>
          </span>
          <span className="font-bold text-emerald-800">
            {totalIntervencionesEnVista.toLocaleString()} intervenciones efectivas reportadas en esta selección
          </span>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 5. MODAL / VISTA DE FICHA EJECUTIVA PARA IMPRIMIR / PDF                    */}
      {/* ========================================================================= */}
      {isPrintModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
          <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] flex flex-col overflow-hidden border-2 border-slate-300">
            {/* Header del Modal */}
            <div className="bg-[#0f3460] text-white p-3.5 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Printer className="w-5 h-5 text-amber-400" />
                <span className="text-sm font-black uppercase">
                  Ficha Oficial de Rendición de Cuentas — Planes Operativos
                </span>
              </div>
              <button
                onClick={() => setIsPrintModalOpen(false)}
                className="text-white/80 hover:text-white font-black text-lg p-1"
              >
                &times;
              </button>
            </div>

            {/* Contenido Imprimible */}
            <div id="ficha-rendicion-print" className="p-6 overflow-y-auto flex flex-col gap-4 text-slate-900 text-xs">
              {/* Membrete Oficial */}
              <div className="border-b-2 border-slate-900 pb-3 flex items-center justify-between">
                <div>
                  <h1 className="text-base font-black uppercase tracking-wide">
                    MUNICIPALIDAD DISTRITAL DE NUEVO CHIMBOTE
                  </h1>
                  <h2 className="text-xs font-bold text-slate-700 uppercase">
                    SUBGERENCIA DE SEGURIDAD CIUDADANA Y SERENAZGO
                  </h2>
                  <p className="text-[10px] text-slate-500">
                    INFORME TÉCNICO DE GESTIÓN Y RENDICIÓN DE CUENTAS &bull; PERIODO: {PERIODO_OFICIAL}
                  </p>
                </div>
                <div className="text-right font-mono text-[10px]">
                  <div>FECHA DE EMISIÓN: {new Date().toLocaleDateString('es-PE')}</div>
                  <div className="font-bold text-blue-900">9,571 PATRULLAJES OFICIALES</div>
                </div>
              </div>

              {/* Resumen Ejecutivo de los 10 Planes */}
              <div>
                <h3 className="font-black text-xs uppercase text-[#0f3460] mb-1.5">
                  1. Resumen Consolidado de Planes Operativos (Total: 9,571 Patrullajes)
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 border border-slate-300 p-2 rounded bg-slate-50 text-[11px]">
                  {PLANES_OPERATIVOS_CATALOGO.map((p) => (
                    <div key={p.id} className="p-1.5 bg-white rounded border border-slate-200">
                      <div className="font-black text-slate-800 truncate">{p.nombreCorto}</div>
                      <div className="font-mono font-black text-blue-900 text-sm">{p.patrullajesTotal}</div>
                      <div className="text-[9px] text-slate-500">{p.pctDelTotal.toFixed(1)}% del total</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Justificación de la Flota */}
              <div className="p-3 bg-blue-50 rounded border border-blue-200 text-[11px] leading-relaxed">
                <strong className="text-blue-950 uppercase block mb-1">
                  2. Justificación Técnica de la Flota Municipal (24 Camionetas 4x4 y 12 Motocicletas Rápidas):
                </strong>
                La asignación simultánea de las 24 camionetas y 12 motocicletas en turnos continuos de 24 horas permitió una cobertura del 100% en los 16 subsectores de las Comisarías Buenos Aires y Villa María, garantizando tiempos de respuesta de 4 a 6 minutos y la ejecución sistemática de los 10 planes de patrullaje preventivo.
              </div>

              {/* Relación de Zonas Críticas */}
              <div>
                <h3 className="font-black text-xs uppercase text-[#0f3460] mb-1.5">
                  3. Relación de Puntos Críticos y Zonas de Mayor Frecuencia de Intervención:
                </h3>
                <table className="w-full border-collapse border border-slate-300 text-[10px]">
                  <thead>
                    <tr className="bg-slate-200">
                      <th className="border border-slate-300 p-1 text-center w-8">N°</th>
                      <th className="border border-slate-300 p-1 text-left">Lugar / Espacio</th>
                      <th className="border border-slate-300 p-1 text-left">Urbanización (Columna 1)</th>
                      <th className="border border-slate-300 p-1 text-center">Sector</th>
                      <th className="border border-slate-300 p-1 text-right">Patrullajes</th>
                      <th className="border border-slate-300 p-1 text-center">Criticidad</th>
                      <th className="border border-slate-300 p-1 text-left">Observación de Campo</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredPuntos.slice(0, 15).map((pto, idx) => (
                      <tr key={pto.id}>
                        <td className="border border-slate-300 p-1 text-center font-bold">{idx + 1}</td>
                        <td className="border border-slate-300 p-1 font-bold">{pto.lugar}</td>
                        <td className="border border-slate-300 p-1">{pto.columna1}</td>
                        <td className="border border-slate-300 p-1 text-center font-mono">{pto.sector}</td>
                        <td className="border border-slate-300 p-1 text-right font-mono font-bold">
                          {pto.frecuenciaPatrullajes}
                        </td>
                        <td className="border border-slate-300 p-1 text-center">{pto.nivelCriticidad}</td>
                        <td className="border border-slate-300 p-1 text-[9px] leading-tight">{pto.observacion}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {filteredPuntos.length > 15 && (
                  <div className="text-[10px] text-slate-500 text-center mt-1">
                    ... y {filteredPuntos.length - 15} zonas adicionales detalladas en el anexo digital.
                  </div>
                )}
              </div>

              {/* Firmas de Responsabilidad */}
              <div className="mt-8 pt-6 border-t border-slate-300 grid grid-cols-2 gap-8 text-center text-[10px]">
                <div>
                  <div className="border-t border-slate-400 w-48 mx-auto mb-1"></div>
                  <strong className="block">SUBGERENTE DE SERENAZGO</strong>
                  <span>Municipalidad Distrital de Nuevo Chimbote</span>
                </div>
                <div>
                  <div className="border-t border-slate-400 w-48 mx-auto mb-1"></div>
                  <strong className="block">CENTRAL DE OPERACIONES Y MONITOREO</strong>
                  <span>Control y Despacho de Patrullaje</span>
                </div>
              </div>
            </div>

            {/* Footer con Acciones */}
            <div className="bg-slate-100 p-3 border-t border-slate-300 flex items-center justify-between">
              <span className="text-[11px] text-slate-500">
                Formato oficial listo para presentación ante el Concejo Municipal y CODISEC
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => window.print()}
                  className="px-4 py-1.5 bg-[#0f3460] hover:bg-blue-900 text-white text-xs font-bold rounded-lg shadow-sm flex items-center gap-1.5"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Imprimir Documento</span>
                </button>
                <button
                  onClick={() => setIsPrintModalOpen(false)}
                  className="px-3 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-700 text-xs font-bold rounded-lg"
                >
                  Cerrar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
