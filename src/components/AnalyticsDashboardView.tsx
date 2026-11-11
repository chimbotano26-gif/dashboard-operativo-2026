import React, { useState, useMemo } from 'react';
import {
  Shield,
  Radio,
  Activity,
  Car,
  UserCheck,
  Clock,
  Printer,
  Search,
  Crosshair,
  AlertTriangle,
  TrendingUp,
  MapPin,
  Flame,
  ChevronRight,
  BarChart2,
  Cpu,
  Layers
} from 'lucide-react';

export interface IncidentRecord {
  id?: string | number;
  fecha?: string;
  hora?: string;
  turno?: string;
  urbanizacion?: string;
  zona?: string;
  subsector?: string;
  modalidad?: string;
  submodalidad?: string;
  unidadMovil?: string;
  movil?: string;
  patrulla?: string;
  agente?: string;
  personal?: string;
  sereno?: string;
  descripcion?: string;
  estado?: string;
  [key: string]: any;
}

export interface AnalyticsDashboardViewProps {
  records: IncidentRecord[];
  onSelectSubsector?: (code: string) => void;
  onFilterZona?: (zona: string) => void;
  onFilterTurno?: (turno: string) => void;
}

// Helpers de extracción resiliente ante variaciones del modelo
const getUrbanizacion = (r: IncidentRecord): string =>
  (r.urbanizacion || r.zona || r.sector || 'SIN ASIGNAR').trim().toUpperCase();

const getModalidad = (r: IncidentRecord): string =>
  (r.modalidad || r.tipo || r.submodalidad || 'NO CLASIFICADO').trim().toUpperCase();

const getTurno = (r: IncidentRecord): string => {
  const t = (r.turno || 'NO REGISTRADO').trim().toUpperCase();
  if (t.includes('MAÑANA') || t.includes('MANANA')) return 'MAÑANA';
  if (t.includes('TARDE')) return 'TARDE';
  if (t.includes('NOCHE')) return 'NOCHE';
  return t;
};

const getUnidad = (r: IncidentRecord): string =>
  (r.unidadMovil || r.movil || r.patrulla || 'A PIE / SIN UNIDAD').trim().toUpperCase();

const getAgente = (r: IncidentRecord): string =>
  (r.agente || r.personal || r.sereno || 'NO ESPECIFICADO').trim().toUpperCase();

export const AnalyticsDashboardView: React.FC<AnalyticsDashboardViewProps> = ({
  records = [],
  onSelectSubsector,
  onFilterZona,
  onFilterTurno
}) => {
  // --- 1. EXTRACCIÓN DINÁMICA DE URBANIZACIONES ---
  const urbanizacionesList = useMemo(() => {
    const counts = new Map<string, number>();
    records.forEach(r => {
      const urb = getUrbanizacion(r);
      counts.set(urb, (counts.get(urb) || 0) + 1);
    });
    return Array.from(counts.entries())
      .map(([nombre, count]) => ({ nombre, count }))
      .sort((a, b) => b.count - a.count);
  }, [records]);

  // Selección inicial inteligente: prioriza "CASUARINAS" si existe, o el primero disponible
  const [selectedUrb, setSelectedUrb] = useState<string>(() => {
    const foundCasuarinas = urbanizacionesList.find(u => u.nombre.includes('CASUARINAS'));
    if (foundCasuarinas) return foundCasuarinas.nombre;
    return urbanizacionesList.length > 0 ? urbanizacionesList[0].nombre : 'TODAS';
  });

  const [selectedTurno, setSelectedTurno] = useState<string>('TODOS');
  const [searchUrb, setSearchUrb] = useState<string>('');

  // Sincronizar selección si la lista inicial se carga después
  React.useEffect(() => {
    if (selectedUrb === 'TODAS' && urbanizacionesList.length > 0) {
      const foundCasuarinas = urbanizacionesList.find(u => u.nombre.includes('CASUARINAS'));
      setSelectedUrb(foundCasuarinas ? foundCasuarinas.nombre : urbanizacionesList[0].nombre);
    }
  }, [urbanizacionesList, selectedUrb]);

  // Filtrado de la lista para el slicer
  const filteredUrbList = useMemo(() => {
    if (!searchUrb.trim()) return urbanizacionesList;
    return urbanizacionesList.filter(u =>
      u.nombre.toLowerCase().includes(searchUrb.toLowerCase())
    );
  }, [urbanizacionesList, searchUrb]);

  // --- 2. REGISTROS FILTRADOS SEGÚN EL SLICER VECINAL ---
  const recordsInScope = useMemo(() => {
    return records.filter(r => {
      const matchUrb = selectedUrb === 'TODAS' || getUrbanizacion(r) === selectedUrb;
      const matchTurno = selectedTurno === 'TODOS' || getTurno(r) === selectedTurno;
      return matchUrb && matchTurno;
    });
  }, [records, selectedUrb, selectedTurno]);

  // --- 3. MÉTRICAS HUD TÁCTICAS (KPIS) ---
  const hudMetrics = useMemo(() => {
    const total = recordsInScope.length;

    // Patrullero líder
    const movilCounts: Record<string, number> = {};
    // Agente líder
    const agenteCounts: Record<string, number> = {};
    // Concentración de Turno
    const turnoCounts: Record<string, number> = { MAÑANA: 0, TARDE: 0, NOCHE: 0 };

    recordsInScope.forEach(r => {
      const m = getUnidad(r);
      if (m && m !== 'A PIE / SIN UNIDAD') {
        movilCounts[m] = (movilCounts[m] || 0) + 1;
      }

      const a = getAgente(r);
      if (a && a !== 'NO ESPECIFICADO') {
        agenteCounts[a] = (agenteCounts[a] || 0) + 1;
      }

      const t = getTurno(r);
      if (turnoCounts[t] !== undefined) {
        turnoCounts[t] = (turnoCounts[t] || 0) + 1;
      } else {
        turnoCounts[t] = 1;
      }
    });

    const topMovil = Object.entries(movilCounts).sort((a, b) => b[1] - a[1])[0] || [
      'PATRULLAJE A PIE',
      0
    ];
    const topAgente = Object.entries(agenteCounts).sort((a, b) => b[1] - a[1])[0] || [
      'SIN ASIGNACIÓN FIJA',
      0
    ];
    const topTurno = Object.entries(turnoCounts).sort((a, b) => b[1] - a[1])[0] || [
      'N/A',
      0
    ];

    const topTurnoPercent = total > 0 ? Math.round((topTurno[1] / total) * 100) : 0;

    return {
      total,
      topMovil: { nombre: topMovil[0], casos: topMovil[1] },
      topAgente: { nombre: topAgente[0], casos: topAgente[1] },
      topTurno: { nombre: topTurno[0], casos: topTurno[1], porcentaje: topTurnoPercent },
      turnoCounts
    };
  }, [recordsInScope]);

  // --- 4. TABLA DE FRECUENCIA VECINAL POR MODALIDAD ---
  const frecuenciaModalidades = useMemo(() => {
    const counts: Record<string, number> = {};
    recordsInScope.forEach(r => {
      const mod = getModalidad(r);
      counts[mod] = (counts[mod] || 0) + 1;
    });

    const total = recordsInScope.length || 1;
    return Object.entries(counts)
      .map(([modalidad, cantidad]) => ({
        modalidad,
        cantidad,
        porcentaje: Number(((cantidad / total) * 100).toFixed(1))
      }))
      .sort((a, b) => b.cantidad - a.cantidad);
  }, [recordsInScope]);

  // --- 5. TOP DESPLIEGUE DE PATRULLEROS EN LA ZONA ---
  const topPatrullerosDespliegue = useMemo(() => {
    const counts: Record<string, number> = {};
    recordsInScope.forEach(r => {
      const m = getUnidad(r);
      counts[m] = (counts[m] || 0) + 1;
    });

    const total = recordsInScope.length || 1;
    return Object.entries(counts)
      .map(([unidad, cantidad]) => ({
        unidad,
        cantidad,
        porcentaje: Math.round((cantidad / total) * 100)
      }))
      .sort((a, b) => b.cantidad - a.cantidad)
      .slice(0, 5);
  }, [recordsInScope]);

  const handlePrint = () => {
    window.print();
  };

  const handleTurnoClick = (turno: string) => {
    setSelectedTurno(turno);
    if (onFilterTurno) onFilterTurno(turno);
  };

  const handleUrbanizacionClick = (urb: string) => {
    setSelectedUrb(urb);
    if (onFilterZona) onFilterZona(urb);
  };

  return (
    <div className="min-h-screen bg-[#070b14] text-slate-100 font-sans p-3 sm:p-6 relative overflow-hidden select-none">
      {/* Fondo decorativo Sci-Fi / Grid táctico */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#0e172a_1px,transparent_1px),linear-gradient(to_bottom,#0e172a_1px,
