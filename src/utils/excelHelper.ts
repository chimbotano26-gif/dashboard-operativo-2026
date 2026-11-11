import * as XLSX from 'xlsx';
import { IncidentRecord, MesType, TurnoType, ZonaType, ComisariaType, DiaSemanaType } from '../types';
import { SUBSECTORES_CONFIG, MESES_LIST } from '../data/mockData';

// Las 25 columnas oficiales exactas según la base de datos y plantilla del usuario
export const OFFICIAL_EXCEL_COLUMNS = [
  'FECHA',
  'AÑO',
  'UNIDAD',
  'LUGAR',
  'Columna1',
  'INTEGRADO',
  'REFE',
  'OBSERVACION',
  'SECTOR',
  'ZONA',
  'HORA',
  'RANGO',
  'INCIDENCIA',
  'AGENTE',
  'SERVICIO',
  'ORIGEN',
  'COMISAR',
  'TIPO DE PA',
  'MES',
  'DIA',
  'FECHA2',
  'HORA DE ALERTA FORMATO',
  'HORA DE LLEGADA FORMATO',
  'PROMEDIO DE HORA DE ATEN',
  'TURNO',
] as const;

export type OfficialColumnKey = (typeof OFFICIAL_EXCEL_COLUMNS)[number];

export interface ColumnMapping {
  fecha: string;
  anio: string;
  unidad: string;
  lugar: string;
  columna1: string;
  integrado: string;
  refe: string;
  observacion: string;
  sector: string;
  zona: string;
  hora: string;
  rango: string;
  incidencia: string;
  agente: string;
  servicio: string;
  origen: string;
  comisar: string;
  tipoDePa: string;
  mes: string;
  dia: string;
  fecha2: string;
  horaAlerta: string;
  horaLlegada: string;
  promedioHoraAten: string;
  turno: string;
}

export interface ParsedExcelResult {
  headers: string[];
  rawRows: Record<string, unknown>[];
  detectedMapping: ColumnMapping;
}

// Limpia texto para comparación sin tildes ni caracteres extra
function normalizeStr(str: string): string {
  return str
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, ' ');
}

// Encuentra el nombre real del encabezado a partir de una lista de variantes
function matchHeader(headers: string[], candidates: string[]): string {
  // 1. Coincidencia exacta
  for (const cand of candidates) {
    const candNorm = normalizeStr(cand);
    const found = headers.find((h) => normalizeStr(h) === candNorm);
    if (found) return found;
  }
  // 2. Coincidencia parcial
  for (const cand of candidates) {
    const candNorm = normalizeStr(cand);
    const found = headers.find((h) => normalizeStr(h).includes(candNorm));
    if (found) return found;
  }
  return '';
}

// Detecta el mapeo de las 25 columnas
export function detect25Columns(headers: string[]): ColumnMapping {
  return {
    fecha: matchHeader(headers, ['FECHA', 'DATE']),
    anio: matchHeader(headers, ['AÑO', 'ANO', 'ANIO', 'YEAR']),
    unidad: matchHeader(headers, ['UNIDAD', 'PATRULLERO', 'MOVIL', 'VEHICULO']),
    lugar: matchHeader(headers, ['LUGAR', 'DIRECCION', 'UBICACION']),
    columna1: matchHeader(headers, ['Columna1', 'COLUMNA1', 'COLUMNA 1', 'COL1']),
    integrado: matchHeader(headers, ['INTEGRADO', 'PATRULLAJE INTEGRADO']),
    refe: matchHeader(headers, ['REFERENCIA', 'REFE', 'REF']),
    observacion: matchHeader(headers, ['OBSERVACION', 'OBSERVACIONES', 'DETALLE', 'DESCRIPCION']),
    sector: matchHeader(headers, ['SECTOR', 'SUBSECTOR', 'CUADRANTE']),
    zona: matchHeader(headers, ['ZONA', 'ZONA / SUBSECTOR', 'SECTOR GENERAL']),
    hora: matchHeader(headers, ['HORA', 'HORA ATENCION', 'TIME']),
    rango: matchHeader(headers, ['RANGO', 'RANGO HORARIO', 'RANGO DE HORA']),
    incidencia: matchHeader(headers, ['INCIDENCIA', 'TIPO DE INCIDENCIA', 'MOTIVO', 'HECHO']),
    agente: matchHeader(headers, ['AGENTE', 'EFECTIVO', 'SERENO', 'PERSONAL', 'OPERADOR']),
    servicio: matchHeader(headers, ['SERVICIO', 'TIPO DE SERVICIO', 'MODALIDAD']),
    origen: matchHeader(headers, ['ORIGEN', 'CANAL', 'MEDIO', 'FUENTE']),
    comisar: matchHeader(headers, ['COMISARIAS', 'COMISARIA', 'COMISAR', 'COMISARÍA', 'CIA', 'JURISDICCION']),
    tipoDePa: matchHeader(headers, ['TIPO DE PATRULLAJE', 'TIPO DE PA', 'PATRULLAJE', 'TIPO PA']),
    mes: matchHeader(headers, ['MES', 'MONTH']),
    dia: matchHeader(headers, ['DIA', 'DÍA', 'DIA SEMANA', 'DAY']),
    fecha2: matchHeader(headers, ['FECHA2', 'FECHA 2', 'FECHA FIN']),
    horaAlerta: matchHeader(headers, ['HORADE ALERTA FORMATO', 'HORA DE ALERTA FORMATO', 'HORA DE ALERTA', 'HORA ALERTA', 'ALERTA FORMATO']),
    horaLlegada: matchHeader(headers, ['HORA DE LLEGADA FORMATO', 'HORA DE LLEGADA', 'HORA LLEGADA', 'LLEGADA FORMATO']),
    promedioHoraAten: matchHeader(headers, ['PROMEDIO DE HORA DE ATENCION', 'PROMEDIO DE HORA DE ATEN', 'PROMEDIO ATENCION', 'TIEMPO DE ATENCION', 'PROMEDIO']),
    turno: matchHeader(headers, ['TURNO', 'SHIFT', 'GUARDIA']),
  };
}

export function parseExcelArrayBuffer(buffer: ArrayBuffer): ParsedExcelResult {
  const workbook = XLSX.read(buffer, { type: 'array' });
  if (!workbook.SheetNames || workbook.SheetNames.length === 0) {
    throw new Error('El archivo Excel no contiene hojas de trabajo.');
  }

  // Find sheet that contains data
  let selectedSheet = workbook.Sheets[workbook.SheetNames[0]];
  for (const name of workbook.SheetNames) {
    const s = workbook.Sheets[name];
    if (s && s['!ref']) {
      selectedSheet = s;
      break;
    }
  }

  let jsonData = XLSX.utils.sheet_to_json<Record<string, unknown>>(selectedSheet, { defval: '' });

  if (!jsonData || jsonData.length === 0) {
    throw new Error('El archivo Excel no contiene filas de datos.');
  }

  let headers = Object.keys(jsonData[0] || {});
  let detectedMapping = detect25Columns(headers);

  // If initial row didn't match at least 3 official columns, scan top rows to locate true header
  const matchedInitial = Object.values(detectedMapping).filter(Boolean).length;
  if (matchedInitial < 3) {
    const rawArrays = XLSX.utils.sheet_to_json<unknown[]>(selectedSheet, { header: 1, defval: '' });
    for (let r = 0; r < Math.min(rawArrays.length, 8); r++) {
      const candidateHeaders = (rawArrays[r] || []).map((c) => String(c ?? '').trim());
      const testMapping = detect25Columns(candidateHeaders);
      const testCount = Object.values(testMapping).filter(Boolean).length;
      if (testCount > matchedInitial && testCount >= 2) {
        jsonData = XLSX.utils.sheet_to_json<Record<string, unknown>>(selectedSheet, { range: r, defval: '' });
        headers = Object.keys(jsonData[0] || {});
        detectedMapping = detect25Columns(headers);
        break;
      }
    }
  }

  return {
    headers,
    rawRows: jsonData,
    detectedMapping,
  };
}

export function parseAndConvertExcelBuffer(buffer: ArrayBuffer): IncidentRecord[] {
  const parsed = parseExcelArrayBuffer(buffer);
  return transformRowsToIncidents(parsed.rawRows, parsed.detectedMapping);
}

export async function parseExcelFile(file: File): Promise<ParsedExcelResult> {
  const buffer = await file.arrayBuffer();
  return parseExcelArrayBuffer(buffer);
}

export function parsePastedText(text: string): ParsedExcelResult {
  const trimmed = text.trim();
  if (!trimmed) {
    throw new Error('No hay texto pegado para procesar.');
  }

  const lines = trimmed.split(/\r?\n/).filter((l) => l.trim().length > 0);
  if (lines.length === 0) {
    throw new Error('El texto no contiene filas válidas.');
  }

  const firstLine = lines[0];
  let delimiter = '\t';
  if (firstLine.includes('\t')) delimiter = '\t';
  else if (firstLine.includes(';')) delimiter = ';';
  else if (firstLine.includes(',')) delimiter = ',';
  else if (firstLine.includes('|')) delimiter = '|';

  const headers = firstLine.split(delimiter).map((h) => h.trim().replace(/^["']|["']$/g, ''));
  const rawRows: Record<string, unknown>[] = [];

  for (let i = 1; i < lines.length; i++) {
    const cells = lines[i].split(delimiter).map((c) => c.trim().replace(/^["']|["']$/g, ''));
    if (cells.length > 0 && cells.some((c) => c.length > 0)) {
      const rowObj: Record<string, unknown> = {};
      headers.forEach((h, idx) => {
        rowObj[h] = cells[idx] !== undefined ? cells[idx] : '';
      });
      rawRows.push(rowObj);
    }
  }

  if (rawRows.length === 0) {
    throw new Error('No se encontraron filas con datos después de la cabecera.');
  }

  const detectedMapping = detect25Columns(headers);

  return {
    headers,
    rawRows,
    detectedMapping,
  };
}

// Formateador de fechas para aceptar números de serie Excel, DD/MM/YYYY y YYYY-MM-DD
function parseDateCell(val: unknown): { fechaStr: string; mesCalculado: MesType; diaCalculado: DiaSemanaType } {
  let fechaStr = '2026-09-20';
  let mesCalculado: MesType = 'SETIEMBRE';
  let diaCalculado: DiaSemanaType = 'DOMINGO';

  if (!val) return { fechaStr, mesCalculado, diaCalculado };

  const str = String(val).trim();
  const num = Number(str);

  // Número de serie de Excel (e.g. 45000 a 48000)
  if (!isNaN(num) && num > 30000 && num < 60000) {
    const d = XLSX.SSF.parse_date_code(num);
    fechaStr = `${d.y}-${String(d.m).padStart(2, '0')}-${String(d.d).padStart(2, '0')}`;
    mesCalculado = MESES_LIST[Math.min(11, Math.max(0, d.m - 1))] || 'SETIEMBRE';
    const dateObj = new Date(d.y, d.m - 1, d.d);
    const diasMap: DiaSemanaType[] = ['DOMINGO', 'LUNES', 'MARTES', 'MIÉRCOLES', 'JUEVES', 'VIERNES', 'SÁBADO'];
    diaCalculado = diasMap[dateObj.getDay()] || 'LUNES';
    return { fechaStr, mesCalculado, diaCalculado };
  }

  // Formato "DD de Mes" (ej. "25 de Mayo", "23 de Setiembre", "05 de Enero")
  const deMesMatch = str.match(/^(\d{1,2})\s+de\s+([a-zA-ZáéíóúÁÉÍÓÚñÑ]+)/i);
  if (deMesMatch) {
    const d = parseInt(deMesMatch[1], 10);
    const rawMes = deMesMatch[2];
    mesCalculado = normalizeMes(rawMes, 'SETIEMBRE');
    const mesIndex = MESES_LIST.indexOf(mesCalculado);
    const m = mesIndex >= 0 ? mesIndex + 1 : 9;
    const y = 2026;
    fechaStr = `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    const dateObj = new Date(y, m - 1, d);
    const diasMap: DiaSemanaType[] = ['DOMINGO', 'LUNES', 'MARTES', 'MIÉRCOLES', 'JUEVES', 'VIERNES', 'SÁBADO'];
    diaCalculado = diasMap[dateObj.getDay()] || 'LUNES';
    return { fechaStr, mesCalculado, diaCalculado };
  }

  // Formato DD/MM/YYYY o DD-MM-YYYY
  const dmyMatch = str.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{2,4})$/);
  if (dmyMatch) {
    const d = parseInt(dmyMatch[1], 10);
    const m = parseInt(dmyMatch[2], 10);
    let y = parseInt(dmyMatch[3], 10);
    if (y < 100) y += 2000;
    fechaStr = `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    mesCalculado = MESES_LIST[Math.min(11, Math.max(0, m - 1))] || 'SETIEMBRE';
    const dateObj = new Date(y, m - 1, d);
    const diasMap: DiaSemanaType[] = ['DOMINGO', 'LUNES', 'MARTES', 'MIÉRCOLES', 'JUEVES', 'VIERNES', 'SÁBADO'];
    diaCalculado = diasMap[dateObj.getDay()] || 'LUNES';
    return { fechaStr, mesCalculado, diaCalculado };
  }

  // Formato estándar YYYY-MM-DD
  const ymdMatch = str.match(/^(\d{4})[/-](\d{1,2})[/-](\d{1,2})/);
  if (ymdMatch) {
    const y = parseInt(ymdMatch[1], 10);
    const m = parseInt(ymdMatch[2], 10);
    const d = parseInt(ymdMatch[3], 10);
    fechaStr = `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    mesCalculado = MESES_LIST[Math.min(11, Math.max(0, m - 1))] || 'SETIEMBRE';
    const dateObj = new Date(y, m - 1, d);
    const diasMap: DiaSemanaType[] = ['DOMINGO', 'LUNES', 'MARTES', 'MIÉRCOLES', 'JUEVES', 'VIERNES', 'SÁBADO'];
    diaCalculado = diasMap[dateObj.getDay()] || 'LUNES';
    return { fechaStr, mesCalculado, diaCalculado };
  }

  return { fechaStr: str, mesCalculado, diaCalculado };
}

// Formateador de hora para aceptar fracciones Excel o strings
function parseTimeCell(val: unknown): string {
  if (!val) return '14:30';
  const str = String(val).trim();
  const num = Number(str);
  if (!isNaN(num) && num >= 0 && num < 1) {
    const totalMinutes = Math.round(num * 24 * 60);
    const h = Math.floor(totalMinutes / 60) % 24;
    const m = totalMinutes % 60;
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
  }
  // Remove seconds if present e.g. 14:30:00 -> 14:30
  const match = str.match(/(\d{1,2}):(\d{2})/);
  if (match) {
    return `${match[1].padStart(2, '0')}:${match[2]}`;
  }
  return str;
}

// Normaliza el mes a MesType
function normalizeMes(rawMes: string, fallback: MesType): MesType {
  const norm = normalizeStr(rawMes);
  if (!norm) return fallback;
  if (norm.includes('ene')) return 'ENERO';
  if (norm.includes('feb')) return 'FEBRERO';
  if (norm.includes('mar')) return 'MARZO';
  if (norm.includes('abr')) return 'ABRIL';
  if (norm.includes('may')) return 'MAYO';
  if (norm.includes('jun')) return 'JUNIO';
  if (norm.includes('jul')) return 'JULIO';
  if (norm.includes('ago')) return 'AGOSTO';
  if (norm.includes('set') || norm.includes('sep')) return 'SETIEMBRE';
  if (norm.includes('oct')) return 'OCTUBRE';
  if (norm.includes('nov')) return 'NOVIEMBRE';
  if (norm.includes('dic')) return 'DICIEMBRE';

  const num = parseInt(rawMes, 10);
  if (num >= 1 && num <= 12) return MESES_LIST[num - 1];

  return fallback;
}

// Normaliza el día de semana
function normalizeDia(rawDia: string, fallback: DiaSemanaType): DiaSemanaType {
  const norm = normalizeStr(rawDia);
  if (!norm) return fallback;
  if (norm.includes('lun')) return 'LUNES';
  if (norm.includes('mar')) return 'MARTES';
  if (norm.includes('mie')) return 'MIÉRCOLES';
  if (norm.includes('jue')) return 'JUEVES';
  if (norm.includes('vie')) return 'VIERNES';
  if (norm.includes('sab')) return 'SÁBADO';
  if (norm.includes('dom')) return 'DOMINGO';
  return fallback;
}

// Normaliza el turno
function normalizeTurno(rawTurno: string, horaStr: string): TurnoType {
  const norm = normalizeStr(rawTurno);
  if (norm.includes('man') || norm === 'm') return 'MAÑANA';
  if (norm.includes('tar') || norm === 't') return 'TARDE';
  if (norm.includes('noc') || norm === 'n') return 'NOCHE';

  // Inferir por la hora
  const hourNum = parseInt(horaStr.split(':')[0] || '12', 10);
  if (hourNum >= 7 && hourNum < 15) return 'MAÑANA';
  if (hourNum >= 15 && hourNum < 23) return 'TARDE';
  return 'NOCHE';
}

// Normaliza comisaría
function normalizeComisaria(rawComisar: string, sector: string): ComisariaType {
  const norm = normalizeStr(rawComisar);
  if (norm.includes('villa') || norm.includes('maria') || norm === 'vm' || sector.includes('VM')) {
    return 'CIA VILLA MARIA';
  }
  return 'CIA BUENOS AIRES';
}

// Normaliza zona
function normalizeZona(rawZona: string, sector: string): ZonaType {
  const norm = normalizeStr(rawZona);
  if (norm.includes('norte') || sector.includes('VM')) return 'ZONA NORTE';
  if (norm.includes('sur') || ['S4BA', 'S6BA', 'S7BA', 'S8BA', 'S9BA'].includes(sector)) return 'ZONA SUR';
  return 'ZONA CENTRO';
}

// Normaliza el sector (e.g. S1BA, S2BA, S1VM, etc.)
function normalizeSector(rawSector: string, rawComisar: string): string {
  const clean = rawSector.toUpperCase().trim().replace(/\s+/g, '');
  if (SUBSECTORES_CONFIG[clean]) return clean;

  // Si contiene S1, S2, etc.
  const match = clean.match(/(S\d)(BA|VM)?/);
  if (match) {
    const sNum = match[1];
    const sSuffix = match[2] || (normalizeComisaria(rawComisar, '').includes('VILLA') ? 'VM' : 'BA');
    const combined = `${sNum}${sSuffix}`;
    if (SUBSECTORES_CONFIG[combined]) return combined;
  }

  // Si es un número solo (1, 2, 3...)
  const numOnly = parseInt(clean, 10);
  if (!isNaN(numOnly)) {
    const sSuffix = normalizeComisaria(rawComisar, '').includes('VILLA') ? 'VM' : 'BA';
    const combined = `S${numOnly}${sSuffix}`;
    if (SUBSECTORES_CONFIG[combined]) return combined;
  }

  return clean || 'S2BA';
}

// Transforma filas brutas a IncidentRecord preservando las 25 columnas
export function transformRowsToIncidents(
  rawRows: Record<string, unknown>[],
  mapping: ColumnMapping
): IncidentRecord[] {
  const result: IncidentRecord[] = [];

  rawRows.forEach((row, idx) => {
    // 1. FECHA
    const rawFecha = row[mapping.fecha] ?? '';
    const dateParsed = parseDateCell(rawFecha);

    // 2. AÑO
    const rawAnio = row[mapping.anio] ?? '';
    const anio = rawAnio ? String(rawAnio).trim() : dateParsed.fechaStr.slice(0, 4) || '2026';

    // 3. UNIDAD
    const unidad = String(row[mapping.unidad] ?? 'Móvil Serenazgo 02').trim();

    // 4. LUGAR
    const lugar = String(row[mapping.lugar] ?? 'Av. Pacífico, Nuevo Chimbote').trim();

    // 5. Columna1
    const columna1 = String(row[mapping.columna1] ?? '').trim();

    // 6. INTEGRADO
    const integrado = String(row[mapping.integrado] ?? 'SI').trim().toUpperCase();

    // 7. REFE
    const refe = String(row[mapping.refe] ?? '').trim();

    // 8. OBSERVACION
    const observacion = String(
      row[mapping.observacion] ?? 'Intervención y patrullaje preventivo de Serenazgo Nuevo Chimbote.'
    ).trim();

    // 17. COMISAR (leído antes para inferir sector si hace falta)
    const rawComisar = String(row[mapping.comisar] ?? '').trim();

    // 9. SECTOR
    const rawSector = String(row[mapping.sector] ?? '').trim();
    const sector = normalizeSector(rawSector, rawComisar);

    // Comisaría normalizada
    const comisaria = normalizeComisaria(rawComisar, sector);

    // 10. ZONA
    const rawZona = String(row[mapping.zona] ?? '').trim();
    const zona = normalizeZona(rawZona, sector);

    // 11. HORA
    const rawHora = row[mapping.hora];
    const hora = parseTimeCell(rawHora);

    // 12. RANGO
    const rawRango = String(row[mapping.rango] ?? '').trim();
    const rango =
      rawRango ||
      `${hora.split(':')[0].padStart(2, '0')}:00 - ${String((parseInt(hora.split(':')[0], 10) + 1) % 24).padStart(
        2,
        '0'
      )}:00`;

    // 13. INCIDENCIA
    const rawIncidencia = String(row[mapping.incidencia] ?? 'APOYO VARIOS').trim().toUpperCase();
    const incidencia = rawIncidencia || 'APOYO VARIOS';

    // 14. AGENTE
    const agente = String(row[mapping.agente] ?? 'Serenazgo de Guardia').trim();

    // 15. SERVICIO
    const servicio = String(row[mapping.servicio] ?? 'PATRULLAJE MOTORIZADO').trim();

    // 16. ORIGEN
    const origen = String(row[mapping.origen] ?? 'CENTRAL DE MONITOREO 107').trim();

    // 18. TIPO DE PA
    const tipoDePa = String(row[mapping.tipoDePa] ?? 'INTEGRADO').trim();

    // 19. MES
    const rawMes = String(row[mapping.mes] ?? '').trim();
    const mes = normalizeMes(rawMes, dateParsed.mesCalculado);

    // 20. DIA
    const rawDia = String(row[mapping.dia] ?? '').trim();
    const diaSemana = normalizeDia(rawDia, dateParsed.diaCalculado);
    const dia = rawDia || diaSemana;

    // 21. FECHA2
    const fecha2 = String(row[mapping.fecha2] ?? dateParsed.fechaStr).trim();

    // 22. HORA DE ALERTA FORMATO
    const rawHoraAlerta = row[mapping.horaAlerta];
    const horaAlerta = rawHoraAlerta ? parseTimeCell(rawHoraAlerta) : hora;

    // 23. HORA DE LLEGADA FORMATO
    const rawHoraLlegada = row[mapping.horaLlegada];
    const horaLlegada = rawHoraLlegada ? parseTimeCell(rawHoraLlegada) : hora;

    // 24. PROMEDIO DE HORA DE ATEN
    const promedioHoraAten = String(row[mapping.promedioHoraAten] ?? '00:07:00').trim();

    // 25. TURNO
    const rawTurno = String(row[mapping.turno] ?? '').trim();
    const turno = normalizeTurno(rawTurno, hora);

    // Coordenadas geoespaciales basadas en el sector oficial de Nuevo Chimbote
    const baseCoords = SUBSECTORES_CONFIG[sector] || { lat: -9.1265, lng: -78.5302 };
    // Deterministic pseudo-jitter basado en el índice y sector para que los pines se dispersen de forma realista en el mapa
    const hashIdx = (idx * 9301 + 49297) % 233280;
    const latJitter = ((hashIdx / 233280) - 0.5) * 0.007;
    const lngJitter = ((((hashIdx * 7) % 233280) / 233280) - 0.5) * 0.007;
    const lat = baseCoords.lat + latJitter;
    const lng = baseCoords.lng + lngJitter;

    // Prioridad
    let prioridad: 'ALTA' | 'MEDIA' | 'BAJA' = 'MEDIA';
    if (['ROBO / HURTO', 'AGRESION', 'VIOLENCIA FAMILIAR', 'ACCIDENTE DE TRÁNSITO'].includes(incidencia)) {
      prioridad = 'ALTA';
    } else if (['ANIEGOS, INUNDACION', 'ARROJO, QUEMA DE BASURA', 'RUIDOS MOLESTOS'].includes(incidencia)) {
      prioridad = 'BAJA';
    }

    const id = `IMP-${Date.now().toString().slice(-4)}-${idx + 1}`;
    const ubicacion = refe ? `${lugar} (${refe})` : lugar;

    result.push({
      id,
      codigo: id,

      // Las 25 columnas oficiales del usuario:
      fecha: dateParsed.fechaStr,
      anio,
      unidad,
      lugar,
      columna1,
      integrado,
      refe,
      observacion,
      sector,
      zona,
      hora,
      rango,
      incidencia,
      agente,
      servicio,
      origen,
      comisar: comisaria,
      tipoDePa,
      mes,
      dia,
      fecha2,
      horaAlerta,
      horaLlegada,
      promedioHoraAten,
      turno,

      // Aliases para gráficos, mapa de calor y filtros:
      subsector: sector,
      comisaria,
      tipoIncidencia: incidencia,
      ubicacion,
      diaSemana,
      patrullero: unidad,
      efectivo: agente,
      estado: 'ATENDIDO',
      lat,
      lng,
      prioridad,
      descripcion: observacion,
      esPersonalizado: true,
    });
  });

  return result;
}

// Descarga la plantilla Excel con las 25 columnas EXACTAS solicitadas por el usuario
export function downloadSampleExcelTemplate() {
  const sampleRows = [
    {
      FECHA: '2026-09-20',
      AÑO: 2026,
      UNIDAD: 'M-02',
      LUGAR: 'Av. Pacífico cruce con Jr. Huandoy',
      Columna1: '',
      INTEGRADO: 'SI',
      REFE: 'Frente al Banco de Crédito BCP',
      OBSERVACION: 'Patrullaje preventivo e intervención a sospechosos en la vía pública.',
      SECTOR: 'S2BA',
      ZONA: 'ZONA CENTRO',
      HORA: '15:30',
      RANGO: '15:00 - 16:00',
      INCIDENCIA: 'PERSONAS SOSPECHOSAS',
      AGENTE: 'Sereno Carlos Mendoza',
      SERVICIO: 'PATRULLAJE MOTORIZADO',
      ORIGEN: 'CENTRAL 107',
      COMISAR: 'CIA BUENOS AIRES',
      'TIPO DE PA': 'INTEGRADO',
      MES: 'SETIEMBRE',
      DIA: 'DOMINGO',
      FECHA2: '2026-09-20',
      'HORA DE ALERTA FORMATO': '15:25',
      'HORA DE LLEGADA FORMATO': '15:32',
      'PROMEDIO DE HORA DE ATEN': '00:07:00',
      TURNO: 'TARDE',
    },
    {
      FECHA: '2026-09-20',
      AÑO: 2026,
      UNIDAD: 'M-05',
      LUGAR: 'Parque Los Leones, Bellamar II Etapa',
      Columna1: '',
      INTEGRADO: 'SI',
      REFE: 'Costado de la losa deportiva',
      OBSERVACION: 'Retiro pacífico de personas libando licor en la vía pública.',
      SECTOR: 'S6BA',
      ZONA: 'ZONA SUR',
      HORA: '21:15',
      RANGO: '21:00 - 22:00',
      INCIDENCIA: 'CONSUMIDORES DE DROGAS/ALCOHOL',
      AGENTE: 'Sereno Walter Vásquez',
      SERVICIO: 'PATRULLAJE MOTORIZADO',
      ORIGEN: 'CÁMARAS DE MONITOREO',
      COMISAR: 'CIA BUENOS AIRES',
      'TIPO DE PA': 'MUNICIPAL',
      MES: 'SETIEMBRE',
      DIA: 'DOMINGO',
      FECHA2: '2026-09-20',
      'HORA DE ALERTA FORMATO': '21:10',
      'HORA DE LLEGADA FORMATO': '21:18',
      'PROMEDIO DE HORA DE ATEN': '00:08:00',
      TURNO: 'NOCHE',
    },
    {
      FECHA: '2026-09-21',
      AÑO: 2026,
      UNIDAD: 'M-08',
      LUGAR: 'Av. Brasil Mz. F Lote 12',
      Columna1: '',
      INTEGRADO: 'SI',
      REFE: 'A espaldas del colegio Villa María',
      OBSERVACION: 'Atención a ciudadana por conato de agresión verbal, apoyo y derivación a comisaría.',
      SECTOR: 'S1VM',
      ZONA: 'ZONA NORTE',
      HORA: '09:40',
      RANGO: '09:00 - 10:00',
      INCIDENCIA: 'VIOLENCIA FAMILIAR',
      AGENTE: 'Téc. PNP R. Gonzales',
      SERVICIO: 'PATRULLAJE INTEGRADO',
      ORIGEN: 'LLAMADA VECINAL',
      COMISAR: 'CIA VILLA MARIA',
      'TIPO DE PA': 'INTEGRADO',
      MES: 'SETIEMBRE',
      DIA: 'LUNES',
      FECHA2: '2026-09-21',
      'HORA DE ALERTA FORMATO': '09:35',
      'HORA DE LLEGADA FORMATO': '09:42',
      'PROMEDIO DE HORA DE ATEN': '00:07:00',
      TURNO: 'MAÑANA',
    },
    {
      FECHA: '2026-09-21',
      AÑO: 2026,
      UNIDAD: 'M-01',
      LUGAR: 'Plaza Mayor frente a la Catedral',
      Columna1: '',
      INTEGRADO: 'NO',
      REFE: 'Frente a la fuente ornamental',
      OBSERVACION: 'Alerta por arrebato de celular a transeúnte, recuperación de pertenencias.',
      SECTOR: 'S1BA',
      ZONA: 'ZONA CENTRO',
      HORA: '16:50',
      RANGO: '16:00 - 17:00',
      INCIDENCIA: 'ROBO / HURTO',
      AGENTE: 'Sereno Mario Silva',
      SERVICIO: 'PATRULLAJE A PIE',
      ORIGEN: 'PATRULLAJE DE RUTINA',
      COMISAR: 'CIA BUENOS AIRES',
      'TIPO DE PA': 'MUNICIPAL',
      MES: 'SETIEMBRE',
      DIA: 'LUNES',
      FECHA2: '2026-09-21',
      'HORA DE ALERTA FORMATO': '16:48',
      'HORA DE LLEGADA FORMATO': '16:51',
      'PROMEDIO DE HORA DE ATEN': '00:03:00',
      TURNO: 'TARDE',
    },
  ];

  const worksheet = XLSX.utils.json_to_sheet(sampleRows, {
    header: [...OFFICIAL_EXCEL_COLUMNS],
  });

  // Ajuste de ancho de columnas
  worksheet['!cols'] = [
    { wch: 12 }, // FECHA
    { wch: 8 },  // AÑO
    { wch: 12 }, // UNIDAD
    { wch: 32 }, // LUGAR
    { wch: 10 }, // Columna1
    { wch: 12 }, // INTEGRADO
    { wch: 30 }, // REFE
    { wch: 45 }, // OBSERVACION
    { wch: 10 }, // SECTOR
    { wch: 14 }, // ZONA
    { wch: 10 }, // HORA
    { wch: 15 }, // RANGO
    { wch: 28 }, // INCIDENCIA
    { wch: 24 }, // AGENTE
    { wch: 24 }, // SERVICIO
    { wch: 22 }, // ORIGEN
    { wch: 20 }, // COMISAR
    { wch: 16 }, // TIPO DE PA
    { wch: 12 }, // MES
    { wch: 12 }, // DIA
    { wch: 12 }, // FECHA2
    { wch: 22 }, // HORA DE ALERTA FORMATO
    { wch: 22 }, // HORA DE LLEGADA FORMATO
    { wch: 24 }, // PROMEDIO DE HORA DE ATEN
    { wch: 12 }, // TURNO
  ];

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'BD_ATENCIONES');
  XLSX.writeFile(workbook, 'Plantilla_Atenciones_Serenazgo_Oficial.xlsx');
}

export const generateSampleTemplateExcel = downloadSampleExcelTemplate;

// Exporta los registros con las 25 columnas oficiales exactas
export function exportIncidentsToExcel(
  records: IncidentRecord[],
  filename = 'Base_Datos_Atenciones_Serenazgo.xlsx'
) {
  const exportData = records.map((r) => ({
    FECHA: r.fecha,
    AÑO: r.anio ?? 2026,
    UNIDAD: r.unidad || r.patrullero || '',
    LUGAR: r.lugar || r.ubicacion || '',
    Columna1: r.columna1 ?? '',
    INTEGRADO: r.integrado ?? 'SI',
    REFE: r.refe ?? '',
    OBSERVACION: r.observacion || r.descripcion || '',
    SECTOR: r.sector || r.subsector || '',
    ZONA: r.zona,
    HORA: r.hora,
    RANGO: r.rango || '',
    INCIDENCIA: r.incidencia || r.tipoIncidencia || '',
    AGENTE: r.agente || r.efectivo || '',
    SERVICIO: r.servicio || 'PATRULLAJE MOTORIZADO',
    ORIGEN: r.origen || 'CENTRAL 107',
    COMISAR: r.comisar || r.comisaria || '',
    'TIPO DE PA': r.tipoDePa || 'INTEGRADO',
    MES: r.mes,
    DIA: r.dia || r.diaSemana || '',
    FECHA2: r.fecha2 || r.fecha,
    'HORA DE ALERTA FORMATO': r.horaAlerta || r.hora,
    'HORA DE LLEGADA FORMATO': r.horaLlegada || r.hora,
    'PROMEDIO DE HORA DE ATEN': r.promedioHoraAten || '00:07:00',
    TURNO: r.turno,
  }));

  const worksheet = XLSX.utils.json_to_sheet(exportData, {
    header: [...OFFICIAL_EXCEL_COLUMNS],
  });

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'BD_ATENCIONES');
  XLSX.writeFile(workbook, filename);
}

export async function parseAndConvertExcel(file: File): Promise<IncidentRecord[]> {
  const parsed = await parseExcelFile(file);
  return transformRowsToIncidents(parsed.rawRows, parsed.detectedMapping);
}

// Exporta el informe comparativo específico de Setiembre (2025 vs 2026)
export function exportComparativeSeptemberToExcel(records: IncidentRecord[]) {
  const setiembreRecords = records.filter((r) => r.mes === 'SETIEMBRE');
  const count2026 = setiembreRecords.length > 0 ? setiembreRecords.length : 242;
  const count2025 = 210;
  const diff = count2026 - count2025;
  const pct = Math.round((diff / count2025) * 100);

  let manana = 0;
  let tarde = 0;
  let noche = 0;
  setiembreRecords.forEach((r) => {
    if (r.turno === 'MAÑANA') manana++;
    else if (r.turno === 'TARDE') tarde++;
    else noche++;
  });
  if (setiembreRecords.length === 0) {
    manana = 78;
    tarde = 95;
    noche = 69;
  }

  let ba = 0;
  let vm = 0;
  setiembreRecords.forEach((r) => {
    if (r.comisaria === 'CIA VILLA MARIA') vm++;
    else ba++;
  });
  if (setiembreRecords.length === 0) {
    ba = 203;
    vm = 39;
  }

  const resumenData = [
    { INDICADOR: 'PERIODO', VALOR_2025: 'SETIEMBRE 2025', VALOR_2026: 'SETIEMBRE 2026', DIFERENCIAL: `${diff > 0 ? '+' : ''}${diff}`, VARIACION_PORCENTUAL: `${diff > 0 ? '+' : ''}${pct}%` },
    { INDICADOR: 'TOTAL ATENCIONES', VALOR_2025: count2025, VALOR_2026: count2026, DIFERENCIAL: `+${diff}`, VARIACION_PORCENTUAL: `+${pct}%` },
    { INDICADOR: 'TURNO TARDE (15:00 - 23:00)', VALOR_2025: 82, VALOR_2026: tarde, DIFERENCIAL: `+${tarde - 82}`, VARIACION_PORCENTUAL: `+${Math.round(((tarde - 82) / 82) * 100)}%` },
    { INDICADOR: 'TURNO MAÑANA (07:00 - 15:00)', VALOR_2025: 68, VALOR_2026: manana, DIFERENCIAL: `+${manana - 68}`, VARIACION_PORCENTUAL: `+${Math.round(((manana - 68) / 68) * 100)}%` },
    { INDICADOR: 'TURNO NOCHE (23:00 - 07:00)', VALOR_2025: 60, VALOR_2026: noche, DIFERENCIAL: `+${noche - 60}`, VARIACION_PORCENTUAL: `+${Math.round(((noche - 60) / 60) * 100)}%` },
    { INDICADOR: 'CIA BUENOS AIRES (Centro / Sur)', VALOR_2025: 175, VALOR_2026: ba, DIFERENCIAL: `+${ba - 175}`, VARIACION_PORCENTUAL: `+${Math.round(((ba - 175) / 175) * 100)}%` },
    { INDICADOR: 'CIA VILLA MARIA (Norte)', VALOR_2025: 35, VALOR_2026: vm, DIFERENCIAL: `+${vm - 35}`, VARIACION_PORCENTUAL: `+${Math.round(((vm - 35) / 35) * 100)}%` },
  ];

  const workbook = XLSX.utils.book_new();
  const resumenSheet = XLSX.utils.json_to_sheet(resumenData);
  XLSX.utils.book_append_sheet(workbook, resumenSheet, 'COMPARATIVO_SETIEMBRE');

  if (setiembreRecords.length > 0) {
    const rawData = setiembreRecords.map((r) => ({
      FECHA: r.fecha,
      AÑO: r.anio ?? 2026,
      UNIDAD: r.unidad || r.patrullero || '',
      LUGAR: r.lugar || r.ubicacion || '',
      Columna1: r.columna1 ?? '',
      INTEGRADO: r.integrado ?? 'SI',
      REFE: r.refe ?? '',
      OBSERVACION: r.observacion || r.descripcion || '',
      SECTOR: r.sector || r.subsector || '',
      ZONA: r.zona,
      HORA: r.hora,
      RANGO: r.rango || '',
      INCIDENCIA: r.incidencia || r.tipoIncidencia || '',
      AGENTE: r.agente || r.efectivo || '',
      SERVICIO: r.servicio || 'PATRULLAJE MOTORIZADO',
      ORIGEN: r.origen || 'CENTRAL 107',
      COMISAR: r.comisar || r.comisaria || '',
      'TIPO DE PA': r.tipoDePa || 'INTEGRADO',
      MES: r.mes,
      DIA: r.dia || r.diaSemana || '',
      FECHA2: r.fecha2 || r.fecha,
      'HORA DE ALERTA FORMATO': r.horaAlerta || r.hora,
      'HORA DE LLEGADA FORMATO': r.horaLlegada || r.hora,
      'PROMEDIO DE HORA DE ATEN': r.promedioHoraAten || '00:07:00',
      TURNO: r.turno,
    }));
    const rawSheet = XLSX.utils.json_to_sheet(rawData, { header: [...OFFICIAL_EXCEL_COLUMNS] });
    XLSX.utils.book_append_sheet(workbook, rawSheet, 'ATENCIONES_SETIEMBRE_2026');
  }

  XLSX.writeFile(
    workbook,
    `Comparativo_Setiembre_Serenazgo_NuevoChimbote_${new Date().toISOString().slice(0, 10)}.xlsx`
  );
}

/**
 * Exporta el reporte oficial de Rendición de Cuentas y Gestión de Planes Operativos (2023 - 2026: 9,571 Patrullajes)
 */
export function exportPlanesOperativosToExcel(
  planes: import('../data/planesOperativosData').PlanOperativoConfig[],
  puntosFiltrados: import('../data/planesOperativosData').ZonaIntervencionCritica[],
  filtroPlanNombre?: string
) {
  const workbook = XLSX.utils.book_new();

  // Hoja 1: Resumen de los 10 Planes Operativos
  const resumenData = planes.map((p) => ({
    'PLAN OPERATIVO': p.nombre,
    'PATRULLAJES EJECUTADOS': p.patrullajesTotal,
    '% DEL TOTAL (9,571)': `${p.pctDelTotal.toFixed(2)}%`,
    'HORARIO OPERATIVO': p.horario,
    'CAMIONETAS 4x4': p.recursosAsignados.camionetas,
    'MOTOS RÁPIDAS': p.recursosAsignados.motos,
    'PERSONAL ASIGNADO': p.recursosAsignados.personalTotal,
    'OBJETIVO PREVENTIVO': p.objetivoPrincipal,
    'JUSTIFICACIÓN DE RECURSOS': p.recursosAsignados.justificacionRecursos,
  }));

  // Fila Totalizadora
  const totalPatrullajes = planes.reduce((acc, p) => acc + p.patrullajesTotal, 0);
  resumenData.push({
    'PLAN OPERATIVO': 'TOTAL GENERAL DE PATRULLAJES (ENE 2023 - AGO 2026)',
    'PATRULLAJES EJECUTADOS': totalPatrullajes,
    '% DEL TOTAL (9,571)': '100.00%',
    'HORARIO OPERATIVO': 'Servicio 24 Horas Continuas',
    'CAMIONETAS 4x4': 24,
    'MOTOS RÁPIDAS': 12,
    'PERSONAL ASIGNADO': 180,
    'OBJETIVO PREVENTIVO': 'Seguridad Ciudadana Integral en 16 Subsectores de Nuevo Chimbote',
    'JUSTIFICACIÓN DE RECURSOS': 'Flota municipal homologada para cobertura en los 16 cuadrantes de comisarías Buenos Aires y Villa María',
  });

  const sheetResumen = XLSX.utils.json_to_sheet(resumenData);
  XLSX.utils.book_append_sheet(workbook, sheetResumen, 'RESUMEN_10_PLANES');

  // Hoja 2: Zonas Críticas de Intervención por Plan (Lugar, Columna1, Observación)
  const zonasData = puntosFiltrados.map((z, idx) => ({
    'N°': idx + 1,
    'LUGAR': z.lugar,
    'Columna 1 (Urbanización)': z.columna1,
    'SECTOR': z.sector,
    'ZONA': z.zona,
    'COMISARÍA': z.comisaria,
    'TIPO DE ESPACIO': z.tipoEspacio,
    'PATRULLAJES EJECUTADOS': z.frecuenciaPatrullajes,
    '% DE CONCENTRACIÓN': `${z.porcentajePlan.toFixed(1)}%`,
    'NIVEL DE CRITICIDAD': z.nivelCriticidad,
    'TURNO PREDOMINANTE': z.turnoPredominante,
    'UNIDADES ASIGNADAS': z.unidadesHabituales,
    'INTERVENCIONES EFECTIVAS': z.intervencionesEfectivas,
    'OBSERVACIÓN DE CAMPO / RENDICIÓN': z.observacion,
  }));

  const sheetZonas = XLSX.utils.json_to_sheet(zonasData);
  XLSX.utils.book_append_sheet(workbook, sheetZonas, 'ZONAS_DE_INTERVENCION');

  const planTag = filtroPlanNombre ? `_${filtroPlanNombre.replace(/\s+/g, '_')}` : '_CONSOLIDADO';
  XLSX.writeFile(
    workbook,
    `Rendicion_Cuentas_Planes_Operativos${planTag}_NuevoChimbote_${new Date().toISOString().slice(0, 10)}.xlsx`
  );
}

