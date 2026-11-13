import React, { useState, useMemo, useEffect, useRef } from 'react';
import {
  Shield, Search, Crosshair, Settings, Wifi, CheckSquare,
  Square, Layers, X, Compass, RotateCcw, Activity, FileDown, Edit3, Eye, CalendarRange
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
  const c = cleanText(r.urbanizacion || r.lugar || r.ubicacion || r.zona || r.sector);
  return c && c !== 'N/A' && c !== 'NULL' ? c : '';
};

const getModalidad = (r: any): string => {
  const c = cleanText(r.tipoIncidencia || r.tipo_incidencia || r.modalidad || r.subtipo || r.incidencia || r.tipo);
  return c && c !== 'N/A' && c !== 'NULL' ? c : 'SIN CLASIFICAR';
};

const getVehiculo = (r: any): string => {
  const c = cleanText(r.unidadMovil || r.unidad_movil || r.vehiculo || r.movil || r.patrulla || r.unidad);
  return !c || ['N/A', 'NINGUNO', 'NULL', '-', 'SIN MOVIL', 'SIN UNIDAD'].includes(c) ? 'PATRULLAJE A PIE' : c;
};

const getAgente = (r: any): string => {
  const c = cleanText(r.efectivo || r.agente_responsable || r.agente || r.personal || r.sereno);
  return !c || ['N/A', 'NULL', '-'].includes(c) ? 'SIN ASIGNAR' : c;
};

const getTurno = (r: any): string => {
  const t = cleanText(r.turno);
  if (t.includes('MAÑANA') || t.includes('MANANA')) return 'MAÑANA';
  if (t.includes('TARDE')) return 'TARDE';
  if (t.includes('NOCHE')) return 'NOCHE';
  return 'NO REGISTRADO';
};

const getMonthIndex = (r: any): number => {
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

const PatrolTruckHologram: React.FC<{ small?: boolean }> = ({ small = false }) => (
  <div className={`relative flex
