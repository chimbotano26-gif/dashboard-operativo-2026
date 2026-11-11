export type ZonaType = 'ZONA CENTRO' | 'ZONA NORTE' | 'ZONA SUR';

export type ComisariaType = 'CIA BUENOS AIRES' | 'CIA VILLA MARIA';

export type TurnoType = 'MAÑANA' | 'TARDE' | 'NOCHE';

export type MesType =
  | 'ENERO'
  | 'FEBRERO'
  | 'MARZO'
  | 'ABRIL'
  | 'MAYO'
  | 'JUNIO'
  | 'JULIO'
  | 'AGOSTO'
  | 'SETIEMBRE'
  | 'OCTUBRE'
  | 'NOVIEMBRE'
  | 'DICIEMBRE';

export type DiaSemanaType =
  | 'LUNES'
  | 'MARTES'
  | 'MIÉRCOLES'
  | 'JUEVES'
  | 'VIERNES'
  | 'SÁBADO'
  | 'DOMINGO';

export type IncidenciaTipo =
  | 'ACCIDENTES DE TRÁNSITO'
  | 'ACTOS CONTRA EL PUDOR'
  | 'AGRESION'
  | 'ALLANAMIENTO A DOMICILIOS'
  | 'ALTERACION AL ORDEN PUBLICO'
  | 'ANIEGOS, INUNDACIONES, FUGAS DE GAS, OTROS'
  | 'APOYO VARIOS'
  | 'ARROJO,QUEMA DE BASURA/DESMONTE'
  | 'AUXILIO, APOYO MÉDICO'
  | 'CAPTURAS'
  | 'CONSUMIDORES DE DROGA'
  | 'ESTAFA, TIMOS, CAMBIAZOS.EXTORSIÓN'
  | 'HURTO A ESTABLECIMIENTOS Y/O DOMICILIOS'
  | 'INCIDENCIAS A LOS BIENES PUBLICOS'
  | 'INCIDENCIAS CON BEBIDAS ALCOHOLICAS'
  | 'INCIDENCIAS SOBRE ANIMALES (ATROPELLOS, MALTRATOS, ETC)'
  | 'INTENTO DE SUICIDIO'
  | 'INTENTO DE VIOLENCIA SEXUAL/ VIOLACION'
  | 'INTERVENCIONES'
  | 'INVASIONES DE TERRENOS'
  | 'MANIFESTACONES Y/O MARCHAS'
  | 'MANIOBRAS TEMERARIAS'
  | 'MORDIDA DE PERRO'
  | 'OBSTACULIZAR LA VIA PÚBLICA'
  | 'PERSECUCIONES A VEHICULOS'
  | 'PERSONAS VEHICULOS SOSPECHOSAS-ESINPOL'
  | 'PERSONAS EXTRAVIADAS'
  | 'POSESIÓN DE ARMA BLANCA'
  | 'POSESIÓN Y/O ATENTADO CON ARMA DE FUEGO'
  | 'PREVENCION DE ACCIDENTES'
  | 'RECUPERACION DE VEHICULO Y/O PERTENECIAS ROBADAS'
  | 'ROBOS'
  | 'TOCAMIENTOS INDEBIDOS'
  | 'VEHICULO ABANDONADO / SIN PLACA'
  | 'VIOLENCIA FAMILIAR'
  | string;

export interface IncidentRecord {
  id: string;
  codigo?: string;

  // Las 25 columnas exactas de la base de datos Excel del usuario:
  fecha: string;               // 1. FECHA
  anio: number | string;       // 2. AÑO
  unidad: string;              // 3. UNIDAD
  lugar: string;               // 4. LUGAR
  columna1?: string;           // 5. Columna1
  integrado: string;           // 6. INTEGRADO
  refe: string;                // 7. REFE
  observacion: string;         // 8. OBSERVACION
  sector: string;              // 9. SECTOR
  zona: ZonaType;              // 10. ZONA
  hora: string;                // 11. HORA
  rango: string;               // 12. RANGO
  incidencia: string;          // 13. INCIDENCIA
  agente: string;              // 14. AGENTE
  servicio: string;            // 15. SERVICIO
  origen: string;              // 16. ORIGEN
  comisar: string;             // 17. COMISAR
  tipoDePa: string;            // 18. TIPO DE PA
  mes: MesType;                // 19. MES
  dia: string;                 // 20. DIA
  fecha2?: string;             // 21. FECHA2
  horaAlerta?: string;         // 22. HORA DE ALERTA FORMATO
  horaLlegada?: string;        // 23. HORA DE LLEGADA FORMATO
  promedioHoraAten?: string;   // 24. PROMEDIO DE HORA DE ATEN
  turno: TurnoType;            // 25. TURNO

  // Propiedades normalizadas para compatibilidad con gráficos y mapa:
  subsector: string;           // igual a sector
  comisaria: ComisariaType;    // CIA BUENOS AIRES o CIA VILLA MARIA
  tipoIncidencia: string;      // igual a incidencia
  ubicacion: string;           // igual a lugar (+ refe)
  diaSemana: DiaSemanaType;    // LUNES, MARTES, etc.
  patrullero?: string;         // igual a unidad
  efectivo?: string;           // igual a agente
  estado: 'ATENDIDO' | 'EN PROCESO' | 'DERIVADO PNP' | 'CANCELADO';
  lat: number;
  lng: number;
  prioridad?: 'ALTA' | 'MEDIA' | 'BAJA';
  descripcion?: string;        // igual a observacion
  esPersonalizado?: boolean;
}

export interface PatrolUnit {
  id: string;
  placa: string;
  codigo: string;
  tipo: 'CAMIONETA' | 'AUTO' | 'MOTO' | 'CUATRIMOTO';
  estado: 'PATRULLANDO' | 'EN ATENCION' | 'DISPONIBLE' | 'BASE';
  subsectorActual: string;
  zona: ZonaType;
  lat: number;
  lng: number;
  efectivoCargo: string;
  ultimaActualizacion: string;
}

export interface FilterState {
  zonas: ZonaType[];
  comisarias: ComisariaType[];
  turnos: TurnoType[];
  meses: MesType[];
  incidencias: string[];
  searchQuery: string;
  prioridad?: 'TODAS' | 'ALTA' | 'MEDIA' | 'BAJA';
}

export type AppViewMode =
  | 'VISTA_RESUMEN'       // Dashboard interactivo principal como la imagen oficial
  | 'MAPA_CALOR'          // Mapa Táctico & Calor GIS interactivo
  | 'PLAN_OPERATIVOS'     // Plan de Operativos y Cobertura
  | 'COMPARATIVO'         // Análisis Comparativo Interanual
  | 'DETALLE_INCIDENCIAS' // Detalle y registro de Incidencias
  | 'BD'                  // Base de Datos Excel Hub
  | 'MAPA_TACTICO'
  | 'ANALITICA'
  | 'DESPACHO_VIVO'
  | 'BASE_DATOS'
  | 'PLAN_OPERATIVO';

export type ActiveTab = AppViewMode;
