import { createClient } from '@supabase/supabase-js';
import * as XLSX from 'xlsx';
import {
  IncidentRecord,
  ZonaType,
  TurnoType,
  ComisariaType,
  MesType,
  DiaSemanaType,
} from '../types';
import { SUBSECTORES_CONFIG, MESES_LIST } from '../data/mockData';

// Credenciales oficiales de Supabase proporcionadas por el usuario
export const SUPABASE_URL = 'https://bikcuhmtdmzqgnzgpjzk.supabase.co';
export const SUPABASE_KEY = 'sb_publishable_hgLmv4U59KfB0mh_OJs01Q_jB4gzuqq';
export const SUPABASE_TABLE = 'registros';

// Cliente oficial de Supabase
export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// CACHÉ LOCAL INSTANTÁNEA PARA ELIMINAR LOS TIEMPOS DE ESPERA
const CACHE_KEY: string = 'sicep_c2_records_cache_v2';
const CACHE_TIMESTAMP_KEY: string = 'sicep_c2_cache_time_v2';
const CACHE_VALIDITY_MS: number = 10 * 60 * 1000; // 10 minutos

// Helper para normalizar strings sin tildes ni mayúsculas
function cleanStr(val: unknown): string {
  if (val === null || val === undefined) return '';
  return String(val)
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, ' ');
}

// Normaliza el mes a MesType oficial
function normalizeMes(rawMes: unknown, fallback: MesType = 'SETIEMBRE'): MesType {
  const norm = cleanStr(rawMes);
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

  const num = parseInt(String(rawMes), 10);
  if (num >= 1 && num <= 12) return MESES_LIST[num - 1];

  return fallback;
}

// Formateador y normalizador de tiempo
function parseTimeValue(val: unknown, fallback: string = '14:30'): string {
  if (val === null || val === undefined || val === '') return fallback;
  const str = String(val).trim();
  const num = Number(str);
  if (!isNaN(num) && num >= 0 && num < 1) {
    const totalMinutes = Math.round(num * 24 * 60);
    const h = Math.floor(totalMinutes / 60) % 24;
    const m = totalMinutes % 60;
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
  }
  if (!isNaN(num) && num >= 1000 && num <= 86400) {
    const h = Math.floor(num / 3600) % 24;
    const m = Math.floor((num % 3600) / 60);
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
  }
  const match = str.match(/(\d{1,2}):(\d{2})/);
  if (match) {
    return `${match[1].padStart(2, '0')}:${match[2]}`;
  }
  return str;
}

// Normaliza el turno
function normalizeTurno(rawTurno: unknown, horaStr: string): TurnoType {
  const norm = cleanStr(rawTurno);
  if (norm.includes('man') || norm === 'm') return 'MAÑANA';
  if (norm.includes('tar') || norm === 't') return 'TARDE';
  if (norm.includes('noc') || norm === 'n') return 'NOCHE';

  const hourNum = parseInt(horaStr.split(':')[0] || '12', 10);
  if (hourNum >= 7 && hourNum < 15) return 'MAÑANA';
  if (hourNum >= 15 && hourNum < 23) return 'TARDE';
  return 'NOCHE';
}

// Normaliza comisaría
function normalizeComisaria(rawComisar: unknown, sector: string): ComisariaType {
  const norm = cleanStr(rawComisar);
  if (norm.includes('villa') || norm.includes('maria') || norm === 'vm' || sector.includes('VM')) {
    return 'CIA VILLA MARIA';
  }
  return 'CIA BUENOS AIRES';
}

// Normaliza zona
function normalizeZona(rawZona: unknown, sector: string): ZonaType {
  const norm = cleanStr(rawZona);
  if (norm.includes('norte') || sector.includes('VM')) return 'ZONA NORTE';
  if (norm.includes('sur') || ['S4BA', 'S6BA', 'S7BA', 'S8BA', 'S9BA'].includes(sector)) return 'ZONA SUR';
  return 'ZONA CENTRO';
}

// Normaliza sector
function normalizeSector(rawSector: unknown, rawComisar: unknown): string {
  const clean = String(rawSector || '').toUpperCase().trim().replace(/\s+/g, '');
  if (SUBSECTORES_CONFIG[clean]) return clean;

  const match = clean.match(/(S\d)(BA|VM)?/);
  if (match) {
    const sNum = match[1];
    const sSuffix = match[2] || (normalizeComisaria(rawComisar, '').includes('VILLA') ? 'VM' : 'BA');
    const combined = `${sNum}${sSuffix}`;
    if (SUBSECTORES_CONFIG[combined]) return combined;
  }

  const numOnly = parseInt(clean, 10);
  if (!isNaN(numOnly)) {
    const sSuffix = normalizeComisaria(rawComisar, '').includes('VILLA') ? 'VM' : 'BA';
    const combined = `S${numOnly}${sSuffix}`;
    if (SUBSECTORES_CONFIG[combined]) return combined;
  }

  return clean || 'S2BA';
}

// Normaliza día de semana
function normalizeDia(rawDia: unknown, fallback: DiaSemanaType = 'LUNES'): DiaSemanaType {
  const norm = cleanStr(rawDia);
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

// Busca un valor en un objeto
function getFieldValue(row: Record<string, any>, candidates: string[], fallback: string = ''): string {
  for (const cand of candidates) {
    if (row[cand] !== undefined && row[cand] !== null && row[cand] !== '') {
      return String(row[cand]).trim();
    }
  }
  const rowKeys = Object.keys(row);
  for (const cand of candidates) {
    const candNorm = cleanStr(cand);
    const foundKey = rowKeys.find((k) => cleanStr(k) === candNorm);
    if (foundKey && row[foundKey] !== undefined && row[foundKey] !== null && row[foundKey] !== '') {
      return String(row[foundKey]).trim();
    }
  }
  return fallback;
}

export function transformSupabaseRowsToIncidents(rows: Record<string, any>[]): IncidentRecord[] {
  if (!Array.isArray(rows)) return [];

  return rows.map((row, idx) => {
    const id =
      row.id ? String(row.id) :
      row.codigo ? String(row.codigo) :
      `SUPA-${idx + 1}-${Date.now().toString().slice(-4)}`;

    const rawFecha = getFieldValue(row, ['FECHA', 'fecha', 'date', 'created_at'], '2026-09-01');
    const anio = getFieldValue(row, ['AÑO', 'ANO', 'ANIO', 'anio', 'year'], rawFecha.slice(0, 4) || '2026');
    const unidad = getFieldValue(row, ['UNIDAD', 'unidad', 'patrullero', 'movil'], 'Móvil Serenazgo 02');
    const lugar = getFieldValue(row, ['LUGAR', 'lugar', 'direccion', 'ubicacion'], 'Av. Pacífico, Nuevo Chimbote');
    const columna1 = getFieldValue(row, ['Columna1', 'columna1', 'col1'], '');
    const integrado = getFieldValue(row, ['INTEGRADO', 'integrado'], 'SI').toUpperCase();
    const refe = getFieldValue(row, ['REFERENCIA', 'REFE', 'refe', 'ref'], '');
    const observacion = getFieldValue(
      row,
      ['OBSERVACION', 'observacion', 'observaciones', 'detalle', 'descripcion'],
      'Intervención y patrullaje preventivo de Serenazgo Nuevo Chimbote.'
    );

    const rawComisar = getFieldValue(
      row,
      ['COMISARIAS', 'COMISARIA', 'COMISAR', 'comisarias', 'comisaria', 'comisar', 'cia', 'jurisdiccion'],
      ''
    );

    const rawSector = getFieldValue(row, ['SECTOR', 'sector', 'subsector', 'cuadrante'], 'S2BA');
    const sector = normalizeSector(rawSector, rawComisar);
    const comisaria = normalizeComisaria(rawComisar, sector);

    const rawZona = getFieldValue(row, ['ZONA', 'zona'], '');
    const zona = normalizeZona(rawZona, sector);

    const rawHora = getFieldValue(row, ['HORA', 'hora', 'time'], '14:30');
    const hora = parseTimeValue(rawHora, '14:30');
    const rango = getFieldValue(row, ['RANGO', 'rango'], `${hora.slice(0, 2)}:00 - ${hora.slice(0, 2)}:59`);

    const incidencia = getFieldValue(
      row,
      ['INCIDENCIA', 'incidencia', 'tipoIncidencia', 'tipo_incidencia', 'motivo', 'hecho'],
      'PATRULLAJE PREVENTIVO'
    ).toUpperCase();

    const agente = getFieldValue(row, ['AGENTE', 'agente', 'efectivo', 'sereno', 'personal'], 'Serenazgo de Guardia');
    const servicio = getFieldValue(row, ['SERVICIO', 'servicio', 'tipo_servicio'], 'PATRULLAJE MOTORIZADO');
    const origen = getFieldValue(row, ['ORIGEN', 'origen', 'canal', 'fuente'], 'CENTRAL DE MONITOREO 107');

    const tipoDePa = getFieldValue(
      row,
      ['TIPO DE PATRULLA', 'TIPO DE PATRULLAJE', 'tipo de patrulla', 'tipo de patrullaje', 'TIPO DE PA', 'tipoDePa', 'patrullaje'],
      'PATRULLAJE MUNICIPAL'
    );

    const rawMes = getFieldValue(row, ['MES', 'mes', 'month'], 'SETIEMBRE');
    const mes = normalizeMes(rawMes);

    const rawDia = getFieldValue(row, ['DIA', 'dia', 'DÍA', 'día', 'day'], 'LUNES');
    const diaSemana = normalizeDia(rawDia);
    const dia = rawDia || diaSemana;

    const fecha2 = getFieldValue(row, ['FECHA2', 'fecha2'], rawFecha);

    const rawHoraAlerta = getFieldValue(
      row,
      ['HORA DE ALERTA', 'HORADE ALERTA FORMATO', 'HORA DE ALERTA FORMATO', 'hora de alerta', 'horaAlerta'],
      hora
    );
    const horaAlerta = parseTimeValue(rawHoraAlerta, hora);

    const rawHoraLlegada = getFieldValue(
      row,
      ['HORA DE LLEGADA', 'HORA DE LLEGADA FORMATO', 'hora de llegada', 'horaLlegada'],
      hora
    );
    const horaLlegada = parseTimeValue(rawHoraLlegada, hora);

    const promedioHoraAten = getFieldValue(
      row,
      ['PROMEDIO DE HORA DE ATENCION', 'PROMEDIO DE HORA DE ATEN', 'promedioHoraAten', 'tiempo_atencion'],
      '00:07:00'
    );

    const rawTurno = getFieldValue(row, ['TURNO', 'turno', 'guardia', 'shift'], '');
    const turno = normalizeTurno(rawTurno, hora);

    let lat = typeof row.lat === 'number' ? row.lat : Number(row.lat);
    let lng = typeof row.lng === 'number' ? row.lng : Number(row.lng);

    if (isNaN(lat) || isNaN(lng) || lat === 0 || lng === 0) {
      const baseCoords = SUBSECTORES_CONFIG[sector] || { lat: -9.1265, lng: -78.5302 };
      const hashIdx = (idx * 9301 + 49297) % 233280;
      const latJitter = (hashIdx / 233280 - 0.5) * 0.007;
      const lngJitter = (((hashIdx * 7) % 233280) / 233280 - 0.5) * 0.007;
      lat = baseCoords.lat + latJitter;
      lng = baseCoords.lng + lngJitter;
    }

    let prioridad: 'ALTA' | 'MEDIA' | 'BAJA' = 'MEDIA';
    if (['ROBO', 'HURTO', 'AGRESION', 'VIOLENCIA FAMILIAR', 'ACCIDENTES DE TRÁNSITO'].some((k) => incidencia.includes(k))) {
      prioridad = 'ALTA';
    } else if (['ANIEGOS', 'ARROJO', 'BASURA', 'RUIDOS'].some((k) => incidencia.includes(k))) {
      prioridad = 'BAJA';
    }

    const ubicacion = refe ? `${lugar} (${refe})` : lugar;

    return {
      id,
      codigo: id,
      fecha: rawFecha,
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
      comisar: rawComisar || comisaria,
      tipoDePa,
      mes,
      dia,
      fecha2,
      horaAlerta,
      horaLlegada,
      promedioHoraAten,
      turno,
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
    };
  });
}

export interface SupabaseQueryResult {
  records: IncidentRecord[];
  rawCount: number;
  error: any;
  status: 'CONNECTED' | 'ERROR' | 'EMPTY';
}

export async function fetchAllRegistrosFromSupabase(
  onProgress?: (loaded: number, total: number | null) => void
): Promise<SupabaseQueryResult> {
  try {
    const cachedData = typeof window !== 'undefined' ? localStorage.getItem(CACHE_KEY) : null;
    const cachedTime = typeof window !== 'undefined' ? localStorage.getItem(CACHE_TIMESTAMP_KEY) : null;
    const now = Date.now();

    let localRawRows: Record<string, any>[] = [];
    if (cachedData) {
      try {
        localRawRows = JSON.parse(cachedData);
      } catch (e) {
        console.warn("Error leyendo caché local:", e);
      }
    }

    const isCacheFresh = cachedTime && (now - parseInt(cachedTime, 10) < CACHE_VALIDITY_MS);

    const fetchFromNetwork = async () => {
      const BATCH_SIZE = 1000;
      let from = 0;
      let allRows: Record<string, any>[] = [];
      let hasMore = true;

      const { data: firstBatch, error: firstErr, count } = await supabase
        .from(SUPABASE_TABLE)
        .select('*', { count: 'exact' })
        .range(0, BATCH_SIZE - 1);

      if (firstErr) throw firstErr;
      if (!firstBatch || firstBatch.length === 0) return [];

      allRows = allRows.concat(firstBatch);
      if (onProgress) onProgress(allRows.length, count ?? null);

      from = BATCH_SIZE;
      const totalTarget = count ?? Infinity;

      while (hasMore && from < totalTarget) {
        const to = from + BATCH_SIZE - 1;
        const { data: nextBatch, error: nextErr } = await supabase
          .from(SUPABASE_TABLE)
          .select('*')
          .range(from, to);

        if (nextErr || !nextBatch || nextBatch.length === 0) break;

        allRows = allRows.concat(nextBatch);
        if (onProgress) onProgress(allRows.length, count ?? null);

        if (nextBatch.length < BATCH_SIZE) {
          hasMore = false;
          break;
        }
        from += BATCH_SIZE;
      }

      if (typeof window !== 'undefined') {
        localStorage.setItem(CACHE_KEY, JSON.stringify(allRows));
        localStorage.setItem(CACHE_TIMESTAMP_KEY, Date.now().toString());
      }
      return allRows;
    };

    if (isCacheFresh && localRawRows.length > 0) {
      fetchFromNetwork().catch(err => console.warn("Sincronización en segundo plano fallida:", err));
      const records = transformSupabaseRowsToIncidents(localRawRows);
      return {
        records,
        rawCount: localRawRows.length,
        error: null,
        status: 'CONNECTED',
      };
    }

    const allRows = await fetchFromNetwork();
    if (allRows.length === 0 && localRawRows.length > 0) {
      const records = transformSupabaseRowsToIncidents(localRawRows);
      return {
        records,
        rawCount: localRawRows.length,
        error: null,
        status: 'CONNECTED',
      };
    }

    const records = transformSupabaseRowsToIncidents(allRows);
    return {
      records,
      rawCount: allRows.length,
      error: null,
      status: 'CONNECTED',
    };
  } catch (err) {
    console.error('Excepción al conectar con Supabase:', err);
    const fallback = typeof window !== 'undefined' ? localStorage.getItem(CACHE_KEY) : null;
    if (fallback) {
      try {
        const parsed = JSON.parse(fallback);
        const records = transformSupabaseRowsToIncidents(parsed);
        return {
          records,
          rawCount: parsed.length,
          error: null,
          status: 'CONNECTED',
        };
      } catch (e) {}
    }
    return {
      records: [],
      rawCount: 0,
      error: err,
      status: 'ERROR',
    };
  }
}

export interface UploadProgressInfo {
  stage: 'PARSING' | 'CLEANING' | 'UPLOADING' | 'COMPLETED' | 'ERROR';
  message: string;
  percent: number;
  currentBatch: number;
  totalBatches: number;
  totalRows: number;
  error?: any;
}

export async function uploadExcelFileToSupabase(
  file: File,
  onProgress?: (info: UploadProgressInfo) => void
): Promise<{ success: boolean; totalUploaded: number; records: IncidentRecord[]; error?: any }> {
  try {
    onProgress?.({
      stage: 'PARSING',
      message: `Leyendo y parseando archivo "${file.name}" con librería xlsx...`,
      percent: 5,
      currentBatch: 0,
      totalBatches: 0,
      totalRows: 0,
    });

    const buffer = await file.arrayBuffer();
    const workbook = XLSX.read(buffer, { type: 'array' });
    if (!workbook.SheetNames || workbook.SheetNames.length === 0) {
      throw new Error('El archivo Excel seleccionado no contiene hojas de datos.');
    }

    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    const rawData = XLSX.utils.sheet_to_json<Record<string, any>>(sheet, { defval: '' });

    if (!rawData || rawData.length === 0) {
      throw new Error('El archivo no contiene filas con datos válidos.');
    }

    const filas = rawData.map((row) => {
      const getVal = (candidates: string[], fallback: any = ''): any => {
        for (const cand of candidates) {
          if (row[cand] !== undefined && row[cand] !== null && row[cand] !== '') {
            return row[cand];
          }
        }
        return fallback;
      };

      const rawAnio = getVal(['AÑO', 'ANO', 'ANIO', 'anio', 'year'], 2026);
      const anioNum = typeof rawAnio === 'number' ? Math.round(rawAnio) : (parseInt(String(rawAnio), 10) || 2026);

      const tipoPatrullaVal = getVal(
        ['TIPO DE PATRULLAJE', 'TIPO DE PATRULLA', 'tipo_patrullaje', 'tipo_patrulla', 'TIPO DE PA'],
        'PATRULLAJE MUNICIPAL'
      );

      return {
        'FECHA': String(getVal(['FECHA', 'fecha', 'date'], '2026-09-01')),
        'AÑO': anioNum,
        'UNIDAD': String(getVal(['UNIDAD', 'unidad', 'patrullero', 'movil'], 'Móvil Serenazgo 02')),
        'LUGAR': String(getVal(['LUGAR', 'lugar', 'direccion', 'ubicacion'], 'Av. Pacífico')),
        'Columna1': String(getVal(['Columna1', 'columna1', 'col1'], '')),
        'INTEGRADO': String(getVal(['INTEGRADO', 'integrado'], 'SI')),
        'OBSERVACION': String(getVal(['OBSERVACION', 'observacion', 'descripcion'], 'Intervención y patrullaje de Serenazgo.')),
        'SECTOR': String(getVal(['SECTOR', 'sector', 'subsector'], 'S2BA')),
        'ZONA': String(getVal(['ZONA', 'zona'], 'ZONA CENTRO')),
        'HORA': String(getVal(['HORA', 'hora', 'time'], '14:30')),
        'RANGO': String(getVal(['RANGO', 'rango'], '14:00 - 14:59')),
        'INCIDENCIA': String(getVal(['INCIDENCIA', 'incidencia'], 'PATRULLAJE PREVENTIVO')),
        'AGENTE': String(getVal(['AGENTE', 'agente', 'sereno'], 'Serenazgo de Guardia')),
        'SERVICIO': String(getVal(['SERVICIO', 'servicio'], 'PATRULLAJE MOTORIZADO')),
        'ORIGEN': String(getVal(['ORIGEN', 'origen'], 'CENTRAL DE MONITOREO 107')),
        'COMISARIAS': String(getVal(['COMISARIAS', 'COMISARIA', 'COMISAR', 'comisarias'], 'CIA BUENOS AIRES')),
        'TIPO DE PATRULLAJE': String(tipoPatrullaVal),
        'MES': String(getVal(['MES', 'mes', 'month'], 'SETIEMBRE')),
        'DIA': String(getVal(['DIA', 'dia', 'day'], 'LUNES')),
        'HORA DE ALERTA': String(getVal(['HORA DE ALERTA', 'HORADE ALERTA FORMATO', 'HORA DE ALERTA FORMATO'], '14:30')),
        'HORADE ALERTA FORMATO': String(getVal(['HORADE ALERTA FORMATO', 'HORA DE ALERTA FORMATO', 'HORA DE ALERTA'], '14:30')),
        'HORA DE LLEGADA FORMATO': String(getVal(['HORA DE LLEGADA FORMATO', 'HORA DE LLEGADA'], '14:40')),
        'PROMEDIO DE HORA DE ATENCION': String(getVal(['PROMEDIO DE HORA DE ATENCION', 'PROMEDIO DE HORA DE ATEN'], '00:07:00')),
        'TURNO': String(getVal(['TURNO', 'turno'], 'MAÑANA')),
      };
    });

    const totalBatches = Math.ceil(filas.length / 1000);

    onProgress?.({
      stage: 'CLEANING',
      message: 'Limpiando tabla remota en Supabase...',
      percent: 10,
      currentBatch: 0,
      totalBatches,
      totalRows: filas.length,
    });

    const { error: delError } = await supabase
      .from(SUPABASE_TABLE)
      .delete()
      .neq('AÑO', -1);

    if (delError) {
      console.warn('Aviso limpiando tabla remota en Supabase:', delError);
    }

    for (let i = 0; i < filas.length; i += 1000) {
      const lote = filas.slice(i, i + 1000);
      const batchNum = Math.floor(i / 1000) + 1;
      const pct = Math.min(95, Math.round(10 + (batchNum / totalBatches) * 85));

      onProgress?.({
        stage: 'UPLOADING',
        message: `Guardando en Supabase lote ${batchNum} de ${totalBatches}...`,
        percent: pct,
        currentBatch: batchNum,
        totalBatches,
        totalRows: filas.length,
      });

      const { error: insertErr } = await supabase
        .from(SUPABASE_TABLE)
        .insert(lote);

      if (insertErr) throw insertErr;
    }

    if (typeof window !== 'undefined') {
      localStorage.setItem(CACHE_KEY, JSON.stringify(filas));
      localStorage.setItem(CACHE_TIMESTAMP_KEY, Date.now().toString());
    }

    const transformed = transformSupabaseRowsToIncidents(filas);

    onProgress?.({
      stage: 'COMPLETED',
      message: `¡${filas.length.toLocaleString()} filas guardadas con éxito!`,
      percent: 100,
      currentBatch: totalBatches,
      totalBatches,
      totalRows: filas.length,
    });

    return {
      experience: true,
      success: true,
      totalUploaded: filas.length,
      records: transformed,
    } as any;
  } catch (err: any) {
    console.error('Error durante la carga permanente a Supabase:', err);
    return {
      success: false,
      totalUploaded: 0,
      records: [],
      error: err,
    };
  }
}
