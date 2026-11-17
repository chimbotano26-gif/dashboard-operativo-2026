import React, { useState, useMemo, useEffect, useRef } from 'react';
import {
  Shield, Search, Crosshair, Settings, Wifi, CheckSquare,
  Square, Layers, X, RotateCcw, Activity, FileDown,
  Edit3, Eye, CalendarRange, Maximize2, Minimize2,
  Navigation, ChevronDown, ChevronUp, Radio, FilterX, Map as MapIcon, User, Truck, Clock, GripHorizontal
} from 'lucide-react';
import { IncidentRecord } from '../types';

interface AnalyticsDashboardViewProps {
  records: IncidentRecord[];
  onSelectSubsector?: (code: string) => void;
  onFilterZona?: (zona: string) => void;
  onFilterTurno?: (turno: string) => void;
}

const MESES_CORTOS = ['ENE', 'FEB', 'MAR', 'ABR', 'MAY', 'JUN', 'JUL', 'AGO', 'SEP', 'OCT', 'NOV', 'DIC'];
const MESES_LARGOS = [
  'ENERO', 'FEBRERO', 'MARZO', 'ABRIL', 'MAYO', 'JUNIO',
  'JULIO', 'AGOSTO', 'SETIEMBRE', 'OCTUBRE', 'NOVIEMBRE', 'DICIEMBRE'
];

const cleanText = (val: any): string =>
  val === null || val === undefined ? '' : String(val).trim().replace(/\s+/g, ' ').toUpperCase();

const getUrbanizacion = (r: any): string => {
  if (!r || typeof r !== 'object') return '';
  const c = cleanText(r.urbanizacion || r.lugar || r.ubicacion || r.zona || r.sector);
  return c && c !== 'N/A' && c !== 'NULL' ? c : '';
};

const getModalidad = (r: any): string => {
  if (!r || typeof r !== 'object') return 'SIN CLASIFICAR';
  const c = cleanText(r.tipoIncidencia || r.tipo_incidencia || r.modalidad || r.subtipo || r.incidencia || r.tipo);
  return c && c !== 'N/A' && c !== 'NULL' ? c : 'SIN CLASIFICAR';
};

const getVehiculo = (r: any): string => {
  if (!r || typeof r !== 'object') return 'PATRULLAJE A PIE';
  const c = cleanText(r.unidadMovil || r.unidad_movil || r.vehiculo || r.movil || r.patrulla || r.unidad);
  return !c || ['N/A', 'NINGUNO', 'NULL', '-', 'SIN MOVIL', 'SIN UNIDAD'].includes(c) ? 'PATRULLAJE A PIE' : c;
};

const getAgente = (r: any): string => {
  if (!r || typeof r !== 'object') return 'SIN ASIGNAR';
  const c = cleanText(r.efectivo || r.agente_responsable || r.agente || r.personal || r.sereno);
  return !c || ['N/A', 'NULL', '-'].includes(c) ? 'SIN ASIGNAR' : c;
};

const getTurno = (r: any): string => {
  if (!r || typeof r !== 'object') return 'NO REGISTRADO';
  const t = cleanText(r.turno);
  if (t.includes('MAÑANA') || t.includes('MANANA')) return 'MAÑANA';
  if (t.includes('TARDE')) return 'TARDE';
  if (t.includes('NOCHE')) return 'NOCHE';
  return 'NO REGISTRADO';
};

const getSectorOficial = (r: any, fallbackTitle: string): string => {
  if (r && typeof r === 'object') {
    const rawSec = cleanText(r.sector || r.cuadrante || r.subsector || r.zona_operativa);
    if (rawSec && !['N/A', 'NULL', '-', 'SIN SECTOR'].includes(rawSec)) {
      return rawSec.startsWith('SECTOR') || rawSec.startsWith('CUADRANTE') ? rawSec : `SECTOR ${rawSec}`;
    }
  }
  const t = cleanText(fallbackTitle);
  if (t.includes('BUENOS AIRES') || t.includes('PACIFICO') || t.includes('BELLAMAR')) return 'SECTOR I - ZONA NORTE';
  if (t.includes('CASUARINAS') || t.includes('BRUCE') || t.includes('MARIATEGUI')) return 'SECTOR II - ZONA CENTRAL';
  if (t.includes('GARATEA') || t.includes('LOS HEROES') || t.includes('SAN LUIS')) return 'SECTOR III - ZONA ESTE';
  if (t.includes('3 DE OCTUBRE') || t.includes('PRADERA') || t.includes('BRISAS')) return 'SECTOR IV - ZONA SUR';
  if (t.includes('VILLA MARIA') || t.includes('1 DE MAYO')) return 'SECTOR V - ZONA OESTE';
  return 'JURISDICCIÓN NCH';
};

const getMonthIndex = (r: any): number => {
  if (!r || typeof r !== 'object') return -1;
  const rawMes = cleanText(r.mes || r.month);
  if (rawMes) {
    const idx = MESES_CORTOS.findIndex((m) => rawMes.startsWith(m));
    if (idx !== -1) return idx;
    if (rawMes.startsWith('SET')) return 8;
    const num = parseInt(rawMes, 10);
    if (!isNaN(num) && num >= 1 && num <= 12) return num - 1;
  }

  const rawFecha = String(r.fecha || r.date || r.fecha_incidencia || r.fechaRegistro || '').trim();
  if (!rawFecha) return -1;

  const dmy = rawFecha.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2,4})/);
  if (dmy) {
    const m = parseInt(dmy[2], 10);
    if (m >= 1 && m <= 12) return m - 1;
  }

  const ymd = rawFecha.match(/^(\d{4})[\/\-](\d{1,2})[\/\-](\d{1,2})/);
  if (ymd) {
    const m = parseInt(ymd[2], 10);
    if (m >= 1 && m <= 12) return m - 1;
  }

  const parsed = new Date(rawFecha);
  if (!isNaN(parsed.getTime())) return parsed.getMonth();

  return -1;
};

const SECTOR_COORDS: Record<string, [number, number]> = {
  CASUARINAS: [-78.5238, -9.1312],
  'BUENOS AIRES': [-78.5325, -9.1245],
  BELLAMAR: [-78.5278, -9.1195],
  GARATEA: [-78.5155, -9.1290],
  BRISAS: [-78.5360, -9.1335],
  PRADERA: [-78.5180, -9.1365],
  BRUCE: [-78.5290, -9.1280],
  PACIFICO: [-78.5340, -9.1210],
  'LOS HEROES': [-78.5195, -9.1235],
  '3 DE OCTUBRE': [-78.5130, -9.1340],
  '03 DE OCTUBRE': [-78.5130, -9.1340],
  '1 DE MAYO': [-78.5390, -9.1260],
  '1° DE MAYO': [-78.5390, -9.1260],
  'VILLA MARIA': [-78.5430, -9.1160],
  'SAN LUIS': [-78.5210, -9.1180],
  'JOSE CARLOS MARIATEGUI': [-78.5250, -9.1275]
};

const getSectorCenter = (title: string): [number, number] => {
  const upper = cleanText(title);
  for (const [key, coords] of Object.entries(SECTOR_COORDS)) {
    if (upper.includes(key)) return coords;
  }
  return [-78.5265, -9.1265];
};

type PinVariant = 'BLUE' | 'RED' | 'AMBER' | 'EMERALD';
type MapStyleKey = 'DARK_BLUE' | 'VOYAGER' | 'ESRI_STREET' | 'SATELLITE';

const getModalidadVariant = (mod: string): PinVariant => {
  const m = cleanText(mod);
  if (
    m.includes('ROBO') ||
    m.includes('HURTO') ||
    m.includes('DROGA') ||
    m.includes('CONSUMIDOR') ||
    m.includes('VIOLENCIA') ||
    m.includes('AGRESION') ||
    m.includes('ASALTO') ||
    m.includes('ARMA') ||
    m.includes('EXTORSION')
  ) {
    return 'RED';
  }
  if (
    m.includes('ALCOHOL') ||
    m.includes('BEBIDA') ||
    m.includes('ALTERACION') ||
    m.includes('RUIDO') ||
    m.includes('ARROJO') ||
    m.includes('BASURA') ||
    m.includes('ABANDONADO') ||
    m.includes('ESCANDALO') ||
    m.includes('DESORDEN')
  ) {
    return 'AMBER';
  }
  if (
    m.includes('AUXILIO') ||
    m.includes('APOYO') ||
    m.includes('MEDICO') ||
    m.includes('ACCIDENTE') ||
    m.includes('RESCATE') ||
    m.includes('HERIDO') ||
    m.includes('INCENDIO')
  ) {
    return 'EMERALD';
  }
  return 'BLUE';
};

interface CriticalMapPoint {
  id: string;
  index: number;
  lng: number;
  lat: number;
  modalidad: string;
  lugar: string;
  turno: string;
  vehiculo: string;
  agente: string;
  variant: PinVariant;
}

interface GroupedMapModalidad {
  modalidad: string;
  variant: PinVariant;
  count: number;
  points: CriticalMapPoint[];
}

const create3DPinHtml = (variant: PinVariant, index: number, isActive: boolean): string => {
  const palettes = {
    BLUE: { light: '#7dd3fc', mid: '#0ea5e9', dark: '#0369a1', glow: 'rgba(14,165,233,0.95)' },
    RED: { light: '#fda4af', mid: '#f43f5e', dark: '#9f1239', glow: 'rgba(244,63,94,0.95)' },
    AMBER: { light: '#fde047', mid: '#f59e0b', dark: '#b45309', glow: 'rgba(245,158,11,0.95)' },
    EMERALD: { light: '#6ee7b7', mid: '#10b981', dark: '#047857', glow: 'rgba(16,185,129,0.95)' }
  };
  const p = palettes[variant];
  const uid = `p3d_${variant}_${index}_${isActive ? 'act' : 'std'}`;

  return `
    <div style="position:relative;width:44px;height:56px;display:flex;align-items:center;justify-content:center;cursor:pointer;transform:translateY(-22px) ${isActive ? 'scale(1.48)' : 'scale(1)'};transition:transform 0.3s cubic-bezier(0.34,1.56,0.64,1);z-index:${isActive ? 50 : 1};filter:drop-shadow(0 0 ${isActive ? '16px' : '6px'} ${p.glow});">
      ${
        isActive
          ? `<span style="position:absolute;bottom:-4px;width:42px;height:18px;border-radius:9999px;border:3px solid #ffffff;background:${p.mid};opacity:0.85;animation:ping 0.95s cubic-bezier(0,0,0.2,1) infinite;"></span>
             <span style="position:absolute;bottom:-1px;width:28px;height:12px;border-radius:9999px;background:#ffffff;opacity:0.95;box-shadow:0 0 18px ${p.light};"></span>`
          : `<span style="position:absolute;bottom:2px;width:14px;height:5px;border-radius:9999px;background:${p.mid};opacity:0.55;"></span>`
      }
      <svg width="38" height="46" viewBox="0 0 64 80" fill="none" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <radialGradient id="${uid}" cx="35%" cy="25%" r="70%">
            <stop offset="0%" stop-color="${isActive ? '#ffffff' : p.light}" />
            <stop offset="50%" stop-color="${p.mid}" />
            <stop offset="100%" stop-color="${p.dark}" />
          </radialGradient>
        </defs>
        <path d="M32 3C16.536 3 4 15.536 4 31C4 49.5 27.6 72.8 30.6 75.7C31.38 76.45 32.62 76.45 33.4 75.7C36.4 72.8 60 49.5 60 31C60 15.536 47.464 3 32 3ZM32 42C25.925 42 21 37.075 21 31C21 24.925 25.925 20 32 20C38.075 20 43 24.925 43 31C43 37.075 38.075 42 32 42Z" fill="url(#${uid})" stroke="#ffffff" stroke-width="${isActive ? '3.5' : '2.2'}"/>
        <ellipse cx="22" cy="15" rx="7" ry="3.5" transform="rotate(-32 22 15)" fill="#ffffff" fill-opacity="0.6"/>
      </svg>
    </div>
  `;
};

const PatrolTruckHologram: React.FC<{ small?: boolean }> = ({ small = false }) => (
  <div className={`relative flex items-center justify-center ${small ? 'w-16 h-11' : 'w-48 h-24 mx-auto'}`}>
    <img
      src="/camioneta.png"
      alt="Patrullero 4x4"
      className="w-full h-full object-contain mix-blend-screen brightness-125 contrast-125 drop-shadow-[0_0_16px_rgba(34,211,238,0.95)]"
    />
  </div>
);

interface BeveledBarItem {
  label: string;
  count: number;
  porcentaje: number;
}

const BeveledHorizontalBarChart: React.FC<{
  title: string;
  subtitle: string;
  items: BeveledBarItem[];
}> = ({ title, subtitle, items }) => {
  const maxVal = Math.max(...items.map((i) => i.count), 1);
  const rawStep = maxVal / 5;
  const magnitude = Math.pow(10, Math.floor(Math.log10(Math.max(rawStep, 1))));
  const niceStep = Math.ceil(rawStep / magnitude) * magnitude || 1;
  const scaleMax = niceStep * 5;
  const ticks = [0, niceStep, niceStep * 2, niceStep * 3, niceStep * 4, scaleMax];

  return (
    <div className="bg-[#f8fafc] border border-slate-300 rounded-lg p-4 mb-4">
      <div className="text-center mb-3">
        <h4 className="text-xs sm:text-sm font-black text-slate-900 uppercase tracking-wide">{title}</h4>
        <p className="text-[10px] text-slate-500">{subtitle} (Escala 0 a {scaleMax.toLocaleString()} casos)</p>
      </div>

      <div className="relative">
        <div className="space-y-2.5 relative z-10">
          {items.map((item) => {
            const widthPct = Math.min(100, Math.max((item.count / scaleMax) * 100, 1.5));
            return (
              <div key={item.label} className="grid grid-cols-12 items-center gap-2">
                <div
                  className="col-span-4 sm:col-span-3 text-right font-bold text-[10px] sm:text-[11px] text-slate-800 truncate pr-1"
                  title={item.label}
                >
                  {item.label}
                </div>
                <div className="col-span-8 sm:col-span-9 pr-32 sm:pr-36 relative h-5 flex items-center">
                  <div className="absolute inset-y-0 left-0 right-32 sm:right-36 flex justify-between pointer-events-none">
                    {ticks.map((t) => (
                      <div key={t} className="h-full border-r border-dashed border-slate-300/80" />
                    ))}
                  </div>

                  <div
                    className="relative h-4 rounded-r-md rounded-l-xs border border-[#1e3a8a] shadow-[0_2px_0_#0f172a] overflow-hidden shrink-0"
                    style={{ width: `${widthPct}%` }}
                  >
                    <div className="h-1/2 w-full bg-[#38bdf8]" />
                    <div className="h-1/2 w-full bg-[#1d4ed8]" />
                  </div>
