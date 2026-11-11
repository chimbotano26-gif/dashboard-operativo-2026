import React, { useState, useMemo } from 'react';
import { 
  Shield, 
  Car, 
  UserCheck, 
  Clock, 
  Printer, 
  MapPin, 
  Activity, 
  AlertTriangle, 
  ChevronRight, 
  BarChart3, 
  Layers 
} from 'lucide-react';
import { IncidentRecord } from '../types';

interface AnalyticsDashboardViewProps {
  records: IncidentRecord[];
  onSelectSubsector?: (code: string) => void;
  onFilterZona?: (zona: string) => void;
  onFilterTurno?: (turno: string) => void;
}

export const AnalyticsDashboardView: React.FC<AnalyticsDashboardViewProps> = ({
  records = [],
  onFilterZona,
  onFilterTurno
}) => {
  // Lista única de Urbanizaciones / A.H.
  const urbanizaciones = useMemo(() => {
    const list = Array.from(
      new Set(
        records
          .map((r: any) => r.urbanizacion || r.lugar || r.zona || r.sector)
          .filter(Boolean)
      )
    ).sort();
    return list;
  }, [records]);

  // Selección activa (Casuarinas por defecto si existe)
  const defaultUrb = useMemo(() => {
    if (urbanizaciones.some(u => u.toLowerCase().includes('casuarinas'))) {
      return urbanizaciones.find(u => u.toLowerCase().includes('casuarinas')) || '';
    }
    return urbanizaciones[0] || 'GENERAL';
  }, [urbanizaciones]);

  const [selectedUrb, setSelectedUrb] = useState<string>('');
  const [selectedTurno, setSelectedTurno] = useState<string>('TODOS');

  const activeUrb = selectedUrb || defaultUrb;

  // Filtrado reactivo en el cliente
  const recordsInScope = useMemo(() => {
    return records.filter((r: any) => {
      const urb = r.urbanizacion || r.lugar || r.zona || r.sector || '';
      const matchUrb = activeUrb === 'GENERAL' || urb.toLowerCase() === activeUrb.toLowerCase();
      
      const rTurno = (r.turno || '').toUpperCase();
      const matchTurno = selectedTurno === 'TODOS' || rTurno.includes(selectedTurno);

      return matchUrb && matchTurno;
    });
  }, [records, activeUrb, selectedTurno]);

  // --- KPIs HUD ---
  const kpiData = useMemo(() => {
    const total = recordsInScope.length;

    // Móvil líder
    const vehiculos: Record<string, number> = {};
    const agentes: Record<string, number> = {};
    const turnosCount: Record<string, number> = { 'MAÑANA': 0, 'TARDE': 0, 'NOCHE': 0 };

    recordsInScope.forEach((r: any) => {
      const v = r.vehiculo || r.movil || r.unidad || 'A PIE';
      vehiculos[v] = (vehiculos[v] || 0) + 1;

      const a = r.agente_responsable || r.agente || r.responsable || 'PATRULLA';
      agentes[a] = (agentes[a] || 0) + 1;

      const t = (r.turno || '').toUpperCase();
      if (t.includes('MAÑANA') || t.includes('MANANA')) turnosCount['MAÑANA']++;
      else if (t.includes('TARDE')) turnosCount['TARDE']++;
      else if (t.includes('NOCHE')) turnosCount['NOCHE']++;
    });

    const topVehiculo = Object.entries(vehiculos).sort((a, b) => b[1] - a[1])[0] || ['SIN ASIGNAR', 0];
    const topAgente = Object.entries(agentes).sort((a, b) => b[1] - a[1])[0] || ['CENTRAL', 0];
    const topTurno = Object.entries(turnosCount).sort((a, b) => b[1] - a[1])[0] || ['MAÑANA', 0];

    return {
      total,
      topVehiculo: topVehiculo[0],
      topVehiculoCount: topVehiculo[1],
      topAgente: topAgente[0],
      topTurno: topTurno[0],
      turnosCount
    };
  }, [recordsInScope]);

  // --- TABLA DE FRECUENCIA VECINAL (MODALIDADES) ---
  const frecuenciaModalidades = useMemo(() => {
    const counts: Record<string, number> = {};
    recordsInScope.forEach((r: any) => {
      const mod = r.modalidad || r.tipo_incidencia || r.tipo || 'OTRAS INCIDENCIAS';
      counts[mod] = (counts[mod] || 0) + 1;
    });

    const total = recordsInScope.length || 1;
    return Object.entries(counts)
      .map(([modalidad, count]) => ({
        modalidad,
        count,
        porcentaje: Math.round((count / total) * 100)
      }))
      .sort((a, b) => b.count - a.count);
  }, [recordsInScope]);

  const handlePrint = () => {
    window.print();
  };

  const handleUrbClick = (urb: string) => {
    setSelectedUrb(urb);
    if (onFilterZona) onFilterZona(urb);
  };

  const handleTurnoClick = (turno: string) => {
    setSelectedTurno(turno);
    if (onFilterTurno) onFilterTurno(turno);
  };

  return (
    <div className="min-h-screen bg-[#070b14] text-slate-100 font-sans p-3 sm:p-6 select-none">
      
      {/* CABECERA TÁCTICA */}
      <div className="flex flex-col md:flex-row md:items-center justify-between pb-4 mb-6 border-b border-cyan-500/30 gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-pulse shadow-[0_0_8px_#22d3ee]"></span>
            <span className="text-xs uppercase tracking-widest text-cyan-400 font-mono">MDNCH // C2 OPERATIVO</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black tracking-tight text-white flex items-center gap-2 mt-1">
            <Shield className="w-6 h-6 text-cyan-400" />
            FRECUENCIA VECINAL & DESPLIEGUE TÁCTICO
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Sector Operativo: <span className="text-cyan-300 font-bold uppercase">{activeUrb}</span>
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handlePrint}
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-cyan-500/20 to-blue-600/20 hover:from-cyan-500/30 hover:to-blue-600/30 border border-cyan-500/50 rounded text-cyan-300 text-xs font-bold tracking-wider uppercase transition shadow-[0_0_15px_rgba(6,182,212,0.2)]"
          >
            <Printer className="w-4 h-4" />
            Exportar Ficha Vecinal
          </button>
        </div>
      </div>

      {/* FILTROS DE TURNO (HUD) */}
      <div className="flex items-center gap-2 mb-6 overflow-x-auto pb-1">
        <span className="text-xs text-slate-500 font-mono uppercase mr-2 flex items-center gap-1">
          <Clock className="w-3.5 h-3.5 text-cyan-400" /> Turno:
        </span>
        {['TODOS', 'MAÑANA', 'TARDE', 'NOCHE'].map((turno) => (
          <button
            key={turno}
            onClick={() => handleTurnoClick(turno)}
            className={`px-3 py-1 text-xs font-mono uppercase rounded border transition-all ${
              selectedTurno === turno
                ? 'bg-cyan-500/20 border-cyan-400 text-cyan-300 shadow-[0_0_10px_rgba(6,182,212,0.3)]'
                : 'bg-slate-900/50 border-slate-800 text-slate-400 hover:border-slate-700'
            }`}
          >
            {turno}
          </button>
        ))}
      </div>

      {/* TARJETAS KPI SUPERIORES */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-[#0b1220]/80 border border-cyan-500/30 rounded-lg p-4 relative overflow-hidden backdrop-blur">
          <div className="absolute top-0 right-0 w-16 h-16 bg-cyan-500/5 rounded-bl-full pointer-events-none"></div>
          <span className="text-[10px] font-mono text-cyan-400 tracking-wider uppercase block mb-1">INCIDENCIAS EN SECTOR</span>
          <div className="text-3xl font-black text-white tracking-tight">{kpiData.total}</div>
          <span className="text-[11px] text-slate-400 mt-1 block">Casos registrados</span>
        </div>

        <div className="bg-[#0b1220]/80 border border-cyan-500/30 rounded-lg p-4 relative overflow-hidden backdrop-blur">
          <div className="absolute top-0 right-0 w-16 h-16 bg-blue-500/5 rounded-bl-full pointer-events-none"></div>
          <span className="text-[10px] font-mono text-cyan-400 tracking-wider uppercase block mb-1">MÓVIL PREDOMINANTE</span>
          <div className="text-xl font-black text-cyan-300 truncate tracking-tight">{kpiData.topVehiculo}</div>
          <span className="text-[11px] text-slate-400 mt-1 block">{kpiData.topVehiculoCount} patrullajes/respuestas</span>
        </div>

        <div className="bg-[#0b1220]/80 border border-cyan-500/30 rounded-lg p-4 relative overflow-hidden backdrop-blur">
          <div className="absolute top-0 right-0 w-16 h-16 bg-fuchsia-500/5 rounded-bl-full pointer-events-none"></div>
          <span className="text-[10px] font-mono text-fuchsia-400 tracking-wider uppercase block mb-1">AGENTE RESPONSABLE</span>
          <div className="text-xl font-black text-fuchsia-300 truncate tracking-tight">{kpiData.topAgente}</div>
          <span className="text-[11px] text-slate-400 mt-1 block">Mayor presencia en zona</span>
        </div>

        <div className="bg-[#0b1220]/80 border border-cyan-500/30 rounded-lg p-4 relative overflow-hidden backdrop-blur">
          <div className="absolute top-0 right-0 w-16 h-16 bg-amber-500/5 rounded-bl-full pointer-events-none"></div>
          <span className="text-[10px] font-mono text-amber-400 tracking-wider uppercase block mb-1">TURNO MÁS CRÍTICO</span>
          <div className="text-xl font-black text-amber-300 tracking-tight">{kpiData.topTurno}</div>
          <span className="text-[11px] text-slate-400 mt-1 block">Mayor concentración horaria</span>
        </div>
      </div>

      {/* CONTENEDOR PRINCIPAL: SLICER VECINAL + FRECUENCIA */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* SLICER LATERAL DE URBANIZACIONES */}
        <div className="lg:col-span-4 bg-[#0b1220]/80 border border-slate-800 rounded-lg p-4 flex flex-col max-h-[650px] backdrop-blur">
          <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-800">
            <span className="text-xs font-mono uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-cyan-400" />
              Sectores & Urbanizaciones ({urbanizaciones.length})
            </span>
          </div>

          <div className="flex-1 overflow-y-auto space-y-1.5 pr-1 custom-scroll">
            {urbanizaciones.map((urb) => {
              const isSelected = activeUrb.toLowerCase() === urb.toLowerCase();
              return (
                <button
                  key={urb}
                  onClick={() => handleUrbClick(urb)}
                  className={`w-full text-left px-3 py-2 rounded text-xs flex items-center justify-between transition-all ${
                    isSelected
                      ? 'bg-cyan-500/10 border-l-2 border-cyan-400 text-cyan-200 font-bold shadow-[inset_0_0_12px_rgba(6,182,212,0.15)]'
                      : 'bg-slate-900/40 text-slate-400 hover:bg-slate-800/50 hover:text-slate-200'
                  }`}
                >
                  <span className="truncate uppercase">{urb}</span>
                  <ChevronRight className={`w-3.5 h-3.5 transition-transform ${isSelected ? 'text-cyan-400 translate-x-0.5' : 'text-slate-600'}`} />
                </button>
              );
            })}
          </div>
        </div>

        {/* TABLA DE FRECUENCIA VECINAL */}
        <div className="lg:col-span-8 bg-[#0b1220]/80 border border-cyan-500/30 rounded-lg p-5 flex flex-col backdrop-blur shadow-[0_0_20px_rgba(6,182,212,0.05)]">
          <div className="flex items-center justify-between pb-3 mb-4 border-b border-cyan-500/20">
            <div>
              <h2 className="text-sm font-bold text-white tracking-wide uppercase flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-cyan-400" />
                Matriz de Frecuencia Delictiva / Incidencias
              </h2>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Datos clasificados para informes a dirigentes vecinales de <span className="text-cyan-300 font-bold uppercase">{activeUrb}</span>
              </p>
            </div>
            <span className="text-xs font-mono text-cyan-400 bg-cyan-950/60 border border-cyan-500/30 px-2.5 py-1 rounded">
              TOTAL: {recordsInScope.length}
            </span>
          </div>

          {/* LISTADO DE FRECUENCIAS */}
          <div className="space-y-3 overflow-y-auto max-h-[520px] pr-2">
            {frecuenciaModalidades.length === 0 ? (
              <div className="text-center py-12 text-slate-500 text-xs">
                No hay incidencias registradas en este sector para el turno seleccionado.
              </div>
            ) : (
              frecuenciaModalidades.map((item, idx) => (
                <div key={item.modalidad} className="bg-slate-900/60 border border-slate-800 rounded p-3 hover:border-cyan-500/40 transition">
                  <div className="flex items-center justify-between text-xs mb-1.5">
                    <span className="font-semibold text-slate-200 flex items-center gap-2 uppercase">
                      <span className="text-[10px] font-mono text-slate-500">#{idx + 1}</span>
                      {item.modalidad}
                    </span>
                    <div className="flex items-center gap-3">
                      <span className="font-mono text-cyan-300 font-bold">{item.count} casos</span>
                      <span className="font-mono text-slate-400 text-[11px] w-10 text-right">{item.porcentaje}%</span>
                    </div>
                  </div>
                  
                  {/* BARRA DE ENERGÍA NEÓN */}
                  <div className="w-full bg-slate-950 h-2 rounded-full overflow-hidden p-0.5 border border-slate-800">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        idx === 0 
                          ? 'bg-gradient-to-r from-fuchsia-500 to-pink-500 shadow-[0_0_8px_#ec4899]' 
                          : 'bg-gradient-to-r from-cyan-500 to-blue-500 shadow-[0_0_8px_#06b6d4]'
                      }`}
                      style={{ width: `${Math.max(item.porcentaje, 4)}%` }}
                    ></div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

      </div>
    </div>
  );
};

export default AnalyticsDashboardView;
