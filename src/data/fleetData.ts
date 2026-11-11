// Subgerencia de Serenazgo y Seguridad Ciudadana - Municipalidad Distrital de Nuevo Chimbote
// Flota Operativa Oficial: 24 Camionetas y 12 Motocicletas Rápidas
// Directiva Operativa de Flota:
// 1. Las Camionetas 4x4 operan en los 3 turnos (Mañana, Tarde y Noche - Servicio 24 horas continuas).
// 2. Las Motocicletas Rápidas operan estrictamente en 2 turnos (Mañana y Tarde) y NO realizan turno nocturno.
// 3. Los campos de personal (Serenos y Efectivos PNP), así como placas y marcas/modelos son editables por el operador.

import { PatrolUnit, ZonaType, TurnoType } from '../types';

export interface FleetVehicle extends PatrolUnit {
  modelo: string;             // Marca y Modelo (Editable, vacío por defecto)
  anio: number;
  kilometraje: number;
  operativoActual?: string;
  patrullajesSemanales: number;
  patrullajesMensuales: number;
  patrullajesAnuales: number;
  horasPatrullajeMes: number;
  intervencionesMes: number;
  conductor: string;          // Agente Sereno Conductor (Editable, vacío por defecto)
  operadorIntegradoPNP?: string; // Efectivo Policial PNP (Editable, vacío por defecto)
  turnoAsignado?: 'MAÑANA' | 'TARDE' | 'NOCHE';
  turnosPermitidos: ('MAÑANA' | 'TARDE' | 'NOCHE')[];
  restriccionNocturna?: boolean;
}

// Configuración de Subsectores y Zonas para las 24 Camionetas
const CAMIONETAS_CONFIG: Array<{ id: string; codigo: string; subsector: string; zona: ZonaType; lat: number; lng: number }> = [
  { id: 'CAM-01', codigo: 'MÓVIL-01', subsector: 'S1BA', zona: 'ZONA CENTRO', lat: -9.1245, lng: -78.5280 },
  { id: 'CAM-02', codigo: 'MÓVIL-02', subsector: 'S2BA', zona: 'ZONA CENTRO', lat: -9.1292, lng: -78.5225 },
  { id: 'CAM-03', codigo: 'MÓVIL-03', subsector: 'S3BA', zona: 'ZONA CENTRO', lat: -9.1210, lng: -78.5320 },
  { id: 'CAM-04', codigo: 'MÓVIL-04', subsector: 'S4BA', zona: 'ZONA SUR',    lat: -9.1350, lng: -78.5210 },
  { id: 'CAM-05', codigo: 'MÓVIL-05', subsector: 'S5BA', zona: 'ZONA CENTRO', lat: -9.1175, lng: -78.5260 },
  { id: 'CAM-06', codigo: 'MÓVIL-06', subsector: 'S6BA', zona: 'ZONA SUR',    lat: -9.1410, lng: -78.5175 },
  { id: 'CAM-07', codigo: 'MÓVIL-07', subsector: 'S7BA', zona: 'ZONA SUR',    lat: -9.1450, lng: -78.5320 },
  { id: 'CAM-08', codigo: 'MÓVIL-08', subsector: 'S8BA', zona: 'ZONA SUR',    lat: -9.1520, lng: -78.5250 },
  { id: 'CAM-09', codigo: 'MÓVIL-09', subsector: 'S1VM', zona: 'ZONA NORTE',  lat: -9.1110, lng: -78.5370 },
  { id: 'CAM-10', codigo: 'MÓVIL-10', subsector: 'S2VM', zona: 'ZONA NORTE',  lat: -9.1050, lng: -78.5420 },
  { id: 'CAM-11', codigo: 'MÓVIL-11', subsector: 'S3VM', zona: 'ZONA NORTE',  lat: -9.0990, lng: -78.5460 },
  { id: 'CAM-12', codigo: 'MÓVIL-12', subsector: 'S4VM', zona: 'ZONA NORTE',  lat: -9.0930, lng: -78.5510 },
  { id: 'CAM-13', codigo: 'MÓVIL-13', subsector: 'S5VM', zona: 'ZONA NORTE',  lat: -9.0880, lng: -78.5550 },
  { id: 'CAM-14', codigo: 'MÓVIL-14', subsector: 'S6VM', zona: 'ZONA NORTE',  lat: -9.0840, lng: -78.5600 },
  { id: 'CAM-15', codigo: 'MÓVIL-15', subsector: 'S7VM', zona: 'ZONA NORTE',  lat: -9.0790, lng: -78.5640 },
  { id: 'CAM-16', codigo: 'MÓVIL-16', subsector: 'S8VM', zona: 'ZONA NORTE',  lat: -9.0740, lng: -78.5680 },
  { id: 'CAM-17', codigo: 'MÓVIL-17', subsector: 'S1BA', zona: 'ZONA CENTRO', lat: -9.1230, lng: -78.5295 },
  { id: 'CAM-18', codigo: 'MÓVIL-18', subsector: 'S2BA', zona: 'ZONA CENTRO', lat: -9.1310, lng: -78.5190 },
  { id: 'CAM-19', codigo: 'MÓVIL-19', subsector: 'S3BA', zona: 'ZONA CENTRO', lat: -9.1190, lng: -78.5350 },
  { id: 'CAM-20', codigo: 'MÓVIL-20', subsector: 'S4BA', zona: 'ZONA SUR',    lat: -9.1380, lng: -78.5150 },
  { id: 'CAM-21', codigo: 'MÓVIL-21', subsector: 'S5BA', zona: 'ZONA CENTRO', lat: -9.1150, lng: -78.5230 },
  { id: 'CAM-22', codigo: 'MÓVIL-22', subsector: 'S6BA', zona: 'ZONA SUR',    lat: -9.1430, lng: -78.5120 },
  { id: 'CAM-23', codigo: 'MÓVIL-23', subsector: 'S7BA', zona: 'ZONA SUR',    lat: -9.1600, lng: -78.5010 },
  { id: 'CAM-24', codigo: 'MÓVIL-24', subsector: 'S8BA', zona: 'ZONA SUR',    lat: -9.1650, lng: -78.4970 },
];

// 24 Camionetas de Serenazgo: Campos editables vacíos por defecto (sin nombres ni placas estáticas)
export const CAMIONETAS_FLOTA: FleetVehicle[] = CAMIONETAS_CONFIG.map((c, idx) => ({
  id: c.id,
  codigo: c.codigo,
  placa: '',                          // Campo editable habilitado (vacío por defecto)
  tipo: 'CAMIONETA',
  modelo: '',                         // Marca / Modelo editable (vacío por defecto)
  anio: 2024,
  estado: 'PATRULLANDO',
  subsectorActual: c.subsector,
  zona: c.zona,
  lat: c.lat,
  lng: c.lng,
  efectivoCargo: '',                  // Sereno a cargo (editable, vacío por defecto)
  conductor: '',                      // Sereno conductor (editable, vacío por defecto)
  operadorIntegradoPNP: '',           // Efectivo PNP (editable, vacío por defecto)
  ultimaActualizacion: 'En servicio activo',
  kilometraje: 28000 + idx * 850,
  operativoActual: 'PATRULLAJE PREVENTIVO 24H',
  patrullajesSemanales: 28,
  patrullajesMensuales: 118,
  patrullajesAnuales: 1410,
  horasPatrullajeMes: 196,
  intervencionesMes: 45,
  turnoAsignado: 'MAÑANA',
  turnosPermitidos: ['MAÑANA', 'TARDE', 'NOCHE'], // Camionetas operan los 3 turnos
  restriccionNocturna: false,
}));

// Configuración de Subsectores y Zonas para las 12 Motos
const MOTOS_CONFIG: Array<{ id: string; codigo: string; subsector: string; zona: ZonaType; lat: number; lng: number }> = [
  { id: 'MOT-01', codigo: 'MOTO-01', subsector: 'S1BA', zona: 'ZONA CENTRO', lat: -9.1235, lng: -78.5290 },
  { id: 'MOT-02', codigo: 'MOTO-02', subsector: 'S2BA', zona: 'ZONA CENTRO', lat: -9.1280, lng: -78.5240 },
  { id: 'MOT-03', codigo: 'MOTO-03', subsector: 'S3BA', zona: 'ZONA CENTRO', lat: -9.1220, lng: -78.5340 },
  { id: 'MOT-04', codigo: 'MOTO-04', subsector: 'S4BA', zona: 'ZONA SUR',    lat: -9.1360, lng: -78.5230 },
  { id: 'MOT-05', codigo: 'MOTO-05', subsector: 'S5BA', zona: 'ZONA CENTRO', lat: -9.1190, lng: -78.5270 },
  { id: 'MOT-06', codigo: 'MOTO-06', subsector: 'S6BA', zona: 'ZONA SUR',    lat: -9.1420, lng: -78.5190 },
  { id: 'MOT-07', codigo: 'MOTO-07', subsector: 'S1VM', zona: 'ZONA NORTE',  lat: -9.1090, lng: -78.5390 },
  { id: 'MOT-08', codigo: 'MOTO-08', subsector: 'S2VM', zona: 'ZONA NORTE',  lat: -9.1020, lng: -78.5440 },
  { id: 'MOT-09', codigo: 'MOTO-09', subsector: 'S3VM', zona: 'ZONA NORTE',  lat: -9.0970, lng: -78.5490 },
  { id: 'MOT-10', codigo: 'MOTO-10', subsector: 'S4VM', zona: 'ZONA NORTE',  lat: -9.0920, lng: -78.5520 },
  { id: 'MOT-11', codigo: 'MOTO-11', subsector: 'S7BA', zona: 'ZONA SUR',    lat: -9.1460, lng: -78.5300 },
  { id: 'MOT-12', codigo: 'MOTO-12', subsector: 'S8BA', zona: 'ZONA SUR',    lat: -9.1530, lng: -78.5230 },
];

// 12 Motocicletas Rápidas:
// REGLA OPERATIVA ESTRICTA: Las motos solo operan en Mañana y Tarde. NO operan en turno nocturno.
// Campos editables vacíos por defecto.
export const MOTOS_FLOTA: FleetVehicle[] = MOTOS_CONFIG.map((m, idx) => ({
  id: m.id,
  codigo: m.codigo,
  placa: '',                          // Campo editable habilitado (vacío por defecto)
  tipo: 'MOTO',
  modelo: '',                         // Marca / Modelo editable (vacío por defecto)
  anio: 2024,
  estado: 'PATRULLANDO',
  subsectorActual: m.subsector,
  zona: m.zona,
  lat: m.lat,
  lng: m.lng,
  efectivoCargo: '',                  // Sereno a cargo (editable, vacío por defecto)
  conductor: '',                      // Sereno motorizado (editable, vacío por defecto)
  operadorIntegradoPNP: '',           // Efectivo PNP (editable, vacío por defecto)
  ultimaActualizacion: 'En servicio diurno',
  kilometraje: 16000 + idx * 720,
  operativoActual: 'PATRULLAJE PREVENTIVO DIURNO',
  patrullajesSemanales: 34,
  patrullajesMensuales: 145,
  patrullajesAnuales: 1740,
  horasPatrullajeMes: 215,
  intervencionesMes: 65,
  turnoAsignado: idx % 2 === 0 ? 'MAÑANA' : 'TARDE',
  turnosPermitidos: ['MAÑANA', 'TARDE'], // REGLA: Motos NO operan en turno nocturno
  restriccionNocturna: true,
}));

// Flota Consolidada Oficial: 24 Camionetas + 12 Motos = 36 Unidades
export const FLOTA_CONSOLIDADA: FleetVehicle[] = [...CAMIONETAS_FLOTA, ...MOTOS_FLOTA];

// Cuadro Oficial Diario de Operativos de Serenazgo
export interface OperativoCuadroFila {
  turno: 'DIA' | 'TARDE' | 'NOCHE';
  horario: string;
  lunes: string;
  martes: string;
  miercoles: string;
  jueves: string;
  viernes: string;
  sabado: string;
  domingo: string;
  categoria: string;
  unidadesAutorizadas: string;
}

export const CRONOGRAMA_OPERATIVO_SEMANAL: OperativoCuadroFila[] = [
  {
    turno: 'DIA',
    horario: '04:30 a 05:30',
    categoria: 'PARADERO SEGURO',
    unidadesAutorizadas: 'Camionetas 4x4 y Motos Rápidas',
    lunes: 'Presencia Serenazgo PARADERO SEGURO\nÓvalo Familia\nHora: 04:30 a 05:30',
    martes: 'Presencia Serenazgo PARADERO SEGURO\nPlaza Mayor\nHora: 04:30 a 05:30',
    miercoles: 'Presencia Serenazgo PARADERO SEGURO\nÓvalo Familia\nHora: 04:30 a 05:30',
    jueves: 'Presencia Serenazgo PARADERO SEGURO\nPlaza Mayor\nHora: 04:30 a 05:30',
    viernes: 'Presencia Serenazgo PARADERO SEGURO\nÓvalo Familia\nHora: 04:30 a 05:30',
    sabado: 'Presencia Serenazgo PARADERO SEGURO\nLa Perlita\nHora: 04:30 a 05:30',
    domingo: 'Operativo IMPACTO\nOperativo Preventivo SERENAZGO\nHora: 04:30 a 05:30',
  },
  {
    turno: 'DIA',
    horario: '07:00 a 08:00',
    categoria: 'COLEGIO SEGURO',
    unidadesAutorizadas: 'Camionetas 4x4 y Motos Rápidas',
    lunes: 'Presencia SERENAZGO\n"COLEGIO SEGURO"\nSector Colegios\nHora: 07:00 a 08:00',
    martes: 'Presencia SERENAZGO\n"COLEGIO SEGURO"\nSector Colegios\nHora: 07:00 a 08:00',
    miercoles: 'Presencia SERENAZGO\n"COLEGIO SEGURO"\nSector Colegios\nHora: 07:00 a 08:00',
    jueves: 'Presencia SERENAZGO\n"COLEGIO SEGURO"\nSector Colegios\nHora: 07:00 a 08:00',
    viernes: 'Presencia SERENAZGO\n"COLEGIO SEGURO"\nSector Colegios\nHora: 07:00 a 08:00',
    sabado: 'Operativo IMPACTO\nOperativo Preventivo SERENAZGO\nHora: 07:00 a 08:00',
    domingo: 'Presencia Serenazgo IGLESIAS\nPlaza Mayor e Iglesias\nHora: 07:00 a 08:00',
  },
  {
    turno: 'DIA',
    horario: '09:00 a 11:00',
    categoria: 'ESPACIOS PÚBLICOS',
    unidadesAutorizadas: 'Camionetas 4x4 y Motos Rápidas',
    lunes: 'Recuperación de Espacios Públicos\n(Paradero informal y Fiscalización)\nTrans.-Fiscaliz.-Serenazgo\nHora: 09:00 a 11:00',
    martes: 'Recuperación de Espacios Públicos\n(Paradero informal y Fiscalización)\nTrans.-Fiscaliz.-Serenazgo\nHora: 09:00 a 11:00',
    miercoles: 'Recuperación de Espacios Públicos\n(Paradero informal y Fiscalización)\nTrans.-Fiscaliz.-Serenazgo\nHora: 09:00 a 11:00',
    jueves: 'Recuperación de Espacios Públicos\n(Paradero informal y Fiscalización)\nTrans.-Fiscaliz.-Serenazgo\nHora: 09:00 a 11:00',
    viernes: 'Recuperación de Espacios Públicos\n(Paradero informal y Fiscalización)\nTrans.-Fiscaliz.-Serenazgo\nHora: 09:00 a 11:00',
    sabado: 'Recuperación de Espacios Públicos\n(Paradero informal y Fiscalización)\nTrans.-Fiscaliz.-Serenazgo\nHora: 09:00 a 11:00',
    domingo: 'Operativo IMPACTO\nOperativo Preventivo SERENAZGO\nHora: 09:00 a 11:00',
  },
  {
    turno: 'TARDE',
    horario: '14:00 a 17:00',
    categoria: 'RASTRILLAJE / DESTELLO',
    unidadesAutorizadas: 'Camionetas 4x4 y Motos Rápidas',
    lunes: 'Operativo RASTRILLAJE\n(prev. Delitos y faltas) SERENAZGO\n14:00 a 17:00',
    martes: 'Operativo DESTELLO\nOperativo Preventivo SERENAZGO\n14:00 a 17:00',
    miercoles: 'Operativo RASTRILLAJE\n(prev. Delitos y faltas) SERENAZGO\n14:00 a 17:00',
    jueves: 'Operativo DESTELLO\nOperativo Preventivo SERENAZGO\n14:00 a 17:00',
    viernes: 'Operativo RASTRILLAJE\n(prev. Delitos y faltas) SERENAZGO\n14:00 a 17:00',
    sabado: 'Operativo DESTELLO\nOperativo Preventivo SERENAZGO\n14:00 a 17:00',
    domingo: 'Operativo RASTRILLAJE\n(prev. Delitos y faltas) SERENAZGO\n14:00 a 17:00',
  },
  {
    turno: 'TARDE',
    horario: '18:00',
    categoria: 'COLEGIO SEGURO SALIDA',
    unidadesAutorizadas: 'Camionetas 4x4 y Motos Rápidas',
    lunes: 'Presencia SERENAZGO\n"COLEGIO SEGURO"\nSalida escolar por sector\n18:00',
    martes: 'Presencia SERENAZGO\n"COLEGIO SEGURO"\nSalida escolar por sector\n18:00',
    miercoles: 'Presencia SERENAZGO\n"COLEGIO SEGURO"\nSalida escolar por sector\n18:00',
    jueves: 'Presencia SERENAZGO\n"COLEGIO SEGURO"\nSalida escolar por sector\n18:00',
    viernes: 'Presencia SERENAZGO\n"COLEGIO SEGURO"\nSalida escolar por sector\n18:00',
    sabado: 'Operativo IMPACTO\nOperativo Preventivo SERENAZGO\n18:00',
    domingo: 'Operativo DESTELLO\nOperativo Preventivo SERENAZGO\n18:00',
  },
  {
    turno: 'TARDE',
    horario: '18:00 a 19:30',
    categoria: 'PARADERO SEGURO / DESTELLO',
    unidadesAutorizadas: 'Camionetas 4x4 y Motos Rápidas (Cierre de servicio de motos a las 19:30)',
    lunes: 'Presencia Serenazgo PARADERO SEGURO\nÓvalo Las Américas\n18:30 a 19:30',
    martes: 'Operativo DESTELLO\nOperativo Preventivo SERENAZGO\nPlaza Mayor - 18:00 a 19:30',
    miercoles: 'Presencia Serenazgo PARADERO SEGURO\nPlaza Mayor\n18:30 a 19:30',
    jueves: 'Operativo DESTELLO\nOperativo Preventivo SERENAZGO\n18:00 a 19:30',
    viernes: 'Presencia Serenazgo PARADERO SEGURO\nÓvalo Familia\n18:30 a 19:30',
    sabado: 'Operativo DESTELLO\nOperativo Preventivo SERENAZGO\n18:00 a 19:30',
    domingo: 'Presencia Serenazgo PARADERO SEGURO\nPlaza Mayor\n18:30 a 19:30',
  },
  {
    turno: 'NOCHE',
    horario: '20:00 a 22:00',
    categoria: 'OPERATIVO IMPACTO NOCTURNO',
    unidadesAutorizadas: 'Exclusivamente Camionetas 4x4 (Motos fuera de servicio nocturno)',
    lunes: 'Operativo IMPACTO\nOperativo Preventivo SERENAZGO\n20:00 a 22:00',
    martes: 'Operativo IMPACTO\nOperativo Preventivo SERENAZGO\n20:00 a 22:00',
    miercoles: 'Operativo IMPACTO\nOperativo Preventivo SERENAZGO\n20:00 a 22:00',
    jueves: 'Operativo IMPACTO\nOperativo Preventivo SERENAZGO\n20:00 a 22:00',
    viernes: 'Operativo IMPACTO\nOperativo Preventivo SERENAZGO\n20:00 a 22:00',
    sabado: 'Operativo IMPACTO\nOperativo Preventivo SERENAZGO\n20:00 a 22:00',
    domingo: 'Operativo IMPACTO\nOperativo Preventivo SERENAZGO\n20:00 a 22:00',
  },
  {
    turno: 'NOCHE',
    horario: '02:00',
    categoria: 'IMPACTO MADRUGADA',
    unidadesAutorizadas: 'Exclusivamente Camionetas 4x4 (Motos fuera de servicio nocturno)',
    lunes: 'Operativo IMPACTO\nOperativo Preventivo SERENAZGO\n02:00 hrs',
    martes: 'Operativo IMPACTO\nOperativo Preventivo SERENAZGO\n02:00 hrs',
    miercoles: 'Operativo IMPACTO\nOperativo Preventivo SERENAZGO\n02:00 hrs',
    jueves: 'Operativo IMPACTO\nOperativo Preventivo SERENAZGO\n02:00 hrs',
    viernes: 'Operativo IMPACTO\nOperativo Preventivo SERENAZGO\n02:00 hrs',
    sabado: 'Operativo IMPACTO\nOperativo Preventivo SERENAZGO\n02:00 hrs',
    domingo: 'Operativo IMPACTO\nOperativo Preventivo SERENAZGO\n02:00 hrs',
  },
  {
    turno: 'NOCHE',
    horario: '04:00 a 05:30',
    categoria: 'DESTELLO MADRUGADA',
    unidadesAutorizadas: 'Exclusivamente Camionetas 4x4 (Motos fuera de servicio nocturno)',
    lunes: 'Operativo DESTELLO\nOperativo Preventivo SERENAZGO\n04:00 a 05:30',
    martes: 'Operativo DESTELLO\nOperativo Preventivo SERENAZGO\n04:00 a 05:30',
    miercoles: 'Operativo DESTELLO\nOperativo Preventivo SERENAZGO\n04:00 a 05:30',
    jueves: 'Operativo DESTELLO\nOperativo Preventivo SERENAZGO\n04:00 a 05:30',
    viernes: 'Operativo DESTELLO\nOperativo Preventivo SERENAZGO\n04:00 a 05:30',
    sabado: 'Operativo DESTELLO\nOperativo Preventivo SERENAZGO\n04:00 a 05:30',
    domingo: 'Operativo DESTELLO\nOperativo Preventivo SERENAZGO\n04:00 a 05:30',
  },
];

// Métricas Globales de Flota
export const METRICAS_FLOTA = {
  totalCamionetas: 24,
  totalMotos: 12,
  totalUnidades: 36,
  camionetasOperativas: 24,
  motosOperativas: 12,
  enMantenimiento: 0,
  horasPatrullajeSemanalTotal: 7320,
  horasPatrullajeMensualTotal: 31200,
  kilometrajeMensualTotal: 104500,
  intervencionesMensualesTotal: 1840,
  coberturaTerritorialPct: 100.0,
};
