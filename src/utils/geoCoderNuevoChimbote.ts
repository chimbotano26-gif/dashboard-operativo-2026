// Geocodificador Táctico Inteligente para Nuevo Chimbote
// Mapea lugares, referencias, observaciones y sectores a coordenadas geográficas (lat, lng, intensidad)
import { IncidentRecord } from '../types';

export interface HeatPoint {
  lat: number;
  lng: number;
  intensity: number;
  lugar: string;
  incidencia: string;
  sector: string;
  zona: string;
  id: string;
}

interface LandmarkRule {
  keywords: string[];
  lat: number;
  lng: number;
  nombreOficial: string;
  jitterMeters: number; // Dispersión para evitar superposición idéntica
}

// Catálogo geoespacial exhaustivo de Nuevo Chimbote
const NUEVO_CHIMBOTE_LANDMARKS: LandmarkRule[] = [
  // 1. PUNTOS CÍVICOS Y PLAZAS
  {
    keywords: ['PLAZA MAYOR', 'CATEDRAL', 'MUNICIPALIDAD', 'MUNI NUEVO', 'PALACIO MUNICIPAL'],
    lat: -9.1258,
    lng: -78.5242,
    nombreOficial: 'Plaza Mayor Nuevo Chimbote',
    jitterMeters: 45,
  },
  {
    keywords: ['POLIDEPORTIVO', 'PARQUE ECOLOGICO', 'POLIDEPORTIVO CASUARINAS'],
    lat: -9.1285,
    lng: -78.5205,
    nombreOficial: 'Polideportivo Casuarinas',
    jitterMeters: 55,
  },
  {
    keywords: ['OVALO LA FAMILIA', 'LA FAMILIA'],
    lat: -9.1175,
    lng: -78.5305,
    nombreOficial: 'Óvalo La Familia',
    jitterMeters: 40,
  },
  {
    keywords: ['COUNTRY CLUB', 'GOLF'],
    lat: -9.122,
    lng: -78.535,
    nombreOficial: 'Country Club Buenos Aires',
    jitterMeters: 60,
  },
  {
    keywords: ['VIVERO FORESTAL', 'VIVERO'],
    lat: -9.091,
    lng: -78.542,
    nombreOficial: 'Vivero Forestal (Límite Norte)',
    jitterMeters: 80,
  },

  // 2. MERCADOS Y CENTROS COMERCIALES
  {
    keywords: ['MERCADO BUENOS AIRES', 'MERC. BUENOS AIRES', 'MDO BUENOS AIRES'],
    lat: -9.1195,
    lng: -78.531,
    nombreOficial: 'Mercado Buenos Aires',
    jitterMeters: 50,
  },
  {
    keywords: ['MERCADO LOS CEDROS', 'LOS CEDROS'],
    lat: -9.115,
    lng: -78.528,
    nombreOficial: 'Mercado Los Cedros',
    jitterMeters: 45,
  },
  {
    keywords: ['MERCADO GARATEA', 'MERCADO NICOLAS GARATEA', 'MDO GARATEA'],
    lat: -9.114,
    lng: -78.519,
    nombreOficial: 'Mercado Nicolás Garatea',
    jitterMeters: 50,
  },
  {
    keywords: ['MERCADO BELLAMAR', 'MDO BELLAMAR'],
    lat: -9.1215,
    lng: -78.5085,
    nombreOficial: 'Mercado Bellamar',
    jitterMeters: 50,
  },
  {
    keywords: ['REAL PLAZA', 'MEGAPLAZA', 'METRO', 'PLAZA VEA', 'TOTTUS'],
    lat: -9.118,
    lng: -78.5325,
    nombreOficial: 'Centro Comercial / MegaPlaza',
    jitterMeters: 60,
  },
  {
    keywords: ['MERCADO 3 DE OCTUBRE', 'TRES DE OCTUBRE', '3 DE OCTUBRE'],
    lat: -9.108,
    lng: -78.538,
    nombreOficial: 'Mercado 3 de Octubre',
    jitterMeters: 50,
  },
  {
    keywords: ['MERCADO SANTA ROSA', 'SANTA ROSA'],
    lat: -9.1265,
    lng: -78.542,
    nombreOficial: 'Mercado Santa Rosa',
    jitterMeters: 50,
  },

  // 3. HOSPITALES Y CENTROS MÉDICOS
  {
    keywords: ['HOSPITAL REGIONAL', 'ELEAZAR GUZMAN', 'GUZMAN BARRON', 'REGIONAL'],
    lat: -9.121,
    lng: -78.524,
    nombreOficial: 'Hospital Regional Eleazar Guzmán Barrón',
    jitterMeters: 45,
  },
  {
    keywords: ['ESSALUD', 'HOSPITAL CONO SUR', 'CONO SUR ESSALUD'],
    lat: -9.132,
    lng: -78.528,
    nombreOficial: 'Hospital I Cono Sur EsSalud',
    jitterMeters: 40,
  },
  {
    keywords: ['YUGOSLAVIA', 'CENTRO DE SALUD YUGOSLAVIA', 'POSTA YUGOSLAVIA'],
    lat: -9.112,
    lng: -78.526,
    nombreOficial: 'Centro de Salud Yugoslavia',
    jitterMeters: 40,
  },
  {
    keywords: ['PANTA CARMONA', 'POLICLINICO PANTA'],
    lat: -9.104,
    lng: -78.539,
    nombreOficial: 'Policlínico Víctor Panta Carmona',
    jitterMeters: 40,
  },

  // 4. INSTITUCIONES EDUCATIVAS Y UNIVERSIDADES
  {
    keywords: ['UNS', 'UNIVERSIDAD NACIONAL DEL SANTA', 'CAMPUS UNS'],
    lat: -9.1225,
    lng: -78.5145,
    nombreOficial: 'Universidad Nacional del Santa (UNS)',
    jitterMeters: 75,
  },
  {
    keywords: ['SENATI', 'SENATI NUEVO CHIMBOTE'],
    lat: -9.1055,
    lng: -78.5335,
    nombreOficial: 'SENATI Nuevo Chimbote',
    jitterMeters: 40,
  },
  {
    keywords: ['UCV', 'UNIVERSIDAD CESAR VALLEJO', 'CESAR VALLEJO'],
    lat: -9.135,
    lng: -78.5245,
    nombreOficial: 'Universidad César Vallejo (UCV)',
    jitterMeters: 60,
  },
  {
    keywords: ['ULADECH', 'LOS ALAMOS ULADECH'],
    lat: -9.127,
    lng: -78.5315,
    nombreOficial: 'ULADECH Los Álamos',
    jitterMeters: 45,
  },
  {
    keywords: ['SALAZAR ROMERO', 'CARLOS SALAZAR'],
    lat: -9.111,
    lng: -78.529,
    nombreOficial: 'I.S.T. Carlos Salazar Romero',
    jitterMeters: 45,
  },
  {
    keywords: ['SALAZAR BONDY', 'COLEGIO BONDY'],
    lat: -9.1245,
    lng: -78.522,
    nombreOficial: 'I.E. Augusto Salazar Bondy',
    jitterMeters: 40,
  },

  // 5. AVENIDAS Y EJES VIALES PRINCIPALES
  {
    keywords: ['PACIFICO NORTE', 'AV. PACIFICO NORTE'],
    lat: -9.105,
    lng: -78.534,
    nombreOficial: 'Av. Pacífico Norte',
    jitterMeters: 80,
  },
  {
    keywords: ['PACIFICO SUR', 'AV. PACIFICO SUR'],
    lat: -9.138,
    lng: -78.5215,
    nombreOficial: 'Av. Pacífico Sur',
    jitterMeters: 80,
  },
  {
    keywords: ['AV. PACIFICO', 'PACIFICO', 'AV PACIFICO'],
    lat: -9.124,
    lng: -78.5255,
    nombreOficial: 'Av. Pacífico Central',
    jitterMeters: 90,
  },
  {
    keywords: ['ANCHOVETA', 'AV. ANCHOVETA', 'AV ANCHOVETA'],
    lat: -9.119,
    lng: -78.5295,
    nombreOficial: 'Av. Anchoveta',
    jitterMeters: 80,
  },
  {
    keywords: ['AV. COUNTRY', 'AV COUNTRY', 'COUNTRY'],
    lat: -9.121,
    lng: -78.533,
    nombreOficial: 'Av. Country',
    jitterMeters: 70,
  },
  {
    keywords: ['AV. ARGENTINA', 'AV ARGENTINA', 'ARGENTINA'],
    lat: -9.1235,
    lng: -78.529,
    nombreOficial: 'Av. Argentina',
    jitterMeters: 70,
  },
  {
    keywords: ['AV. BRASIL', 'AV BRASIL', 'BRASIL'],
    lat: -9.125,
    lng: -78.5225,
    nombreOficial: 'Av. Brasil',
    jitterMeters: 70,
  },
  {
    keywords: ['AV. UNIVERSITARIA', 'AV UNIVERSITARIA', 'UNIVERSITARIA'],
    lat: -9.123,
    lng: -78.516,
    nombreOficial: 'Av. Universitaria',
    jitterMeters: 75,
  },
  {
    keywords: ['AV. AGRARIA', 'AV AGRARIA', 'AGRARIA'],
    lat: -9.134,
    lng: -78.526,
    nombreOficial: 'Av. Agraria',
    jitterMeters: 85,
  },
  {
    keywords: ['COSTANERA', 'PESCADORES', 'AV. LOS PESCADORES'],
    lat: -9.115,
    lng: -78.552,
    nombreOficial: 'Av. Los Pescadores / Costanera',
    jitterMeters: 90,
  },
  {
    keywords: ['PANAMERICANA', 'PANAMERICANA NORTE', 'CARRETERA'],
    lat: -9.11,
    lng: -78.535,
    nombreOficial: 'Carretera Panamericana Norte',
    jitterMeters: 100,
  },

  // 6. URBANIZACIONES Y ASENTAMIENTOS HUMANOS
  {
    keywords: ['BELLAMAR', 'URB. BELLAMAR', 'BELLAMAR II', 'BELLAMAR I'],
    lat: -9.118,
    lng: -78.509,
    nombreOficial: 'Urb. Bellamar',
    jitterMeters: 80,
  },
  {
    keywords: ['GARATEA', 'NICOLAS GARATEA', 'URB. GARATEA'],
    lat: -9.116,
    lng: -78.52,
    nombreOficial: 'Urb. Nicolás Garatea',
    jitterMeters: 80,
  },
  {
    keywords: ['VILLA MARIA', 'VILLA MARÍA', 'P.J. VILLA MARIA'],
    lat: -9.104,
    lng: -78.537,
    nombreOficial: 'P.J. Villa María',
    jitterMeters: 85,
  },
  {
    keywords: ['BUENOS AIRES', 'URB. BUENOS AIRES', 'BUENOS AIRES I', 'BUENOS AIRES II'],
    lat: -9.12,
    lng: -78.532,
    nombreOficial: 'Urb. Buenos Aires',
    jitterMeters: 75,
  },
  {
    keywords: ['CASUARINAS', 'URB. CASUARINAS', 'CASUARINAS I', 'CASUARINAS II'],
    lat: -9.126,
    lng: -78.521,
    nombreOficial: 'Urb. Casuarinas',
    jitterMeters: 70,
  },
  {
    keywords: ['LOS ALAMOS', 'LOS ÁLAMOS', 'URB. LOS ALAMOS'],
    lat: -9.123,
    lng: -78.531,
    nombreOficial: 'Urb. Los Álamos',
    jitterMeters: 65,
  },
  {
    keywords: ['LOS HEROES', 'LOS HÉROES'],
    lat: -9.1215,
    lng: -78.527,
    nombreOficial: 'Urb. Los Héroes',
    jitterMeters: 50,
  },
  {
    keywords: ['SANTA CRISTINA'],
    lat: -9.124,
    lng: -78.535,
    nombreOficial: 'Urb. Santa Cristina',
    jitterMeters: 55,
  },
  {
    keywords: ['SAN RAFAEL'],
    lat: -9.129,
    lng: -78.531,
    nombreOficial: 'Urb. San Rafael',
    jitterMeters: 60,
  },
  {
    keywords: ['SAN LUIS'],
    lat: -9.119,
    lng: -78.518,
    nombreOficial: 'Urb. San Luis',
    jitterMeters: 60,
  },
  {
    keywords: ['BRUCE', 'LOS BRUCES'],
    lat: -9.117,
    lng: -78.526,
    nombreOficial: 'Urb. Bruces',
    jitterMeters: 55,
  },
  {
    keywords: ['BANCHERO ROSSI', 'BANCHERO'],
    lat: -9.127,
    lng: -78.537,
    nombreOficial: 'Urb. Banchero Rossi',
    jitterMeters: 55,
  },
  {
    keywords: ['LOS PORTALES'],
    lat: -9.1205,
    lng: -78.534,
    nombreOficial: 'Urb. Los Portales',
    jitterMeters: 55,
  },
  {
    keywords: ['PRIMERO DE MAYO', '1RO DE MAYO'],
    lat: -9.108,
    lng: -78.541,
    nombreOficial: 'A.H. Primero de Mayo',
    jitterMeters: 65,
  },
  {
    keywords: ['LAS DELICIAS', 'DELICIAS'],
    lat: -9.136,
    lng: -78.516,
    nombreOficial: 'A.H. Las Delicias',
    jitterMeters: 70,
  },
  {
    keywords: ['LAS BRISAS', 'BRISAS DEL SUR'],
    lat: -9.132,
    lng: -78.541,
    nombreOficial: 'A.H. Las Brisas',
    jitterMeters: 65,
  },
  {
    keywords: ['SAN FELIPE'],
    lat: -9.128,
    lng: -78.517,
    nombreOficial: 'Urb. San Felipe',
    jitterMeters: 55,
  },
  {
    keywords: ['DASSO', 'DAVID DASSO', 'SATELITE', 'EL SATELITE'],
    lat: -9.112,
    lng: -78.522,
    nombreOficial: 'Urb. David Dasso / El Satélite',
    jitterMeters: 60,
  },
  {
    keywords: ['TIERRA PROMETIDA', 'LOS FICUS', 'CONO SUR'],
    lat: -9.141,
    lng: -78.512,
    nombreOficial: 'A.H. Tierra Prometida / Cono Sur',
    jitterMeters: 90,
  },
  {
    keywords: ['DOMUS', 'EL PINAR'],
    lat: -9.134,
    lng: -78.542,
    nombreOficial: 'Urb. Domus / El Pinar',
    jitterMeters: 65,
  },

  // 7. BASES Y COMISARÍAS
  {
    keywords: ['BASE CENTRAL', 'SERENAZGO BASE CENTRAL', 'CENTRAL 107'],
    lat: -9.1242,
    lng: -78.5255,
    nombreOficial: 'Base Central Serenazgo (Av. Pacífico)',
    jitterMeters: 30,
  },
  {
    keywords: ['COMISARIA BUENOS AIRES', 'CIA BUENOS AIRES', 'PNP BUENOS AIRES'],
    lat: -9.1208,
    lng: -78.5322,
    nombreOficial: 'Comisaría PNP Buenos Aires',
    jitterMeters: 30,
  },
  {
    keywords: ['COMISARIA VILLA MARIA', 'CIA VILLA MARIA', 'PNP VILLA MARIA'],
    lat: -9.1032,
    lng: -78.5385,
    nombreOficial: 'Comisaría PNP Villa María',
    jitterMeters: 30,
  },
];

// Centroides de los 16 subsectores oficiales para respaldo preciso cuando solo se especifica el sector
const SUBSECTORES_COORDS: Record<string, { lat: number; lng: number }> = {
  // Comisaría Buenos Aires
  S1BA: { lat: -9.123, lng: -78.532 },
  S2BA: { lat: -9.125, lng: -78.523 },
  S3BA: { lat: -9.116, lng: -78.521 },
  S4BA: { lat: -9.114, lng: -78.514 },
  S5BA: { lat: -9.122, lng: -78.515 },
  S6BA: { lat: -9.129, lng: -78.518 },
  S7BA: { lat: -9.135, lng: -78.523 },
  S8BA: { lat: -9.141, lng: -78.515 },

  // Comisaría Villa María
  S1VM: { lat: -9.098, lng: -78.541 },
  S2VM: { lat: -9.105, lng: -78.538 },
  S3VM: { lat: -9.113, lng: -78.541 },
  S4VM: { lat: -9.121, lng: -78.546 },
  S5VM: { lat: -9.128, lng: -78.548 },
  S6VM: { lat: -9.135, lng: -78.543 },
  S7VM: { lat: -9.142, lng: -78.539 },
  S8VM: { lat: -9.149, lng: -78.534 },
};

// Coordenadas base por Zonas
const ZONAS_COORDS: Record<string, { lat: number; lng: number }> = {
  'ZONA CENTRO': { lat: -9.1245, lng: -78.5255 },
  'ZONA NORTE': { lat: -9.106, lng: -78.535 },
  'ZONA SUR': { lat: -9.138, lng: -78.523 },
};

// Ponderación de intensidad según tipo de incidencia
function getIncidentIntensity(incidencia: string): number {
  const upper = String(incidencia || '').toUpperCase();
  if (
    upper.includes('ROBO') ||
    upper.includes('HURTO') ||
    upper.includes('CAPTURAS') ||
    upper.includes('EXTORSIÓN') ||
    upper.includes('ARMA')
  ) {
    return 1.0; // Máxima criticidad (rojo)
  }
  if (
    upper.includes('DROGA') ||
    upper.includes('BEBIDAS') ||
    upper.includes('ALCOHOL') ||
    upper.includes('VIOLENCIA') ||
    upper.includes('AGRESION')
  ) {
    return 0.85; // Alta intensidad (naranja)
  }
  if (
    upper.includes('ACCIDENTE') ||
    upper.includes('TRÁNSITO') ||
    upper.includes('MANIOBRAS') ||
    upper.includes('ORDEN PUBLICO')
  ) {
    return 0.7; // Media-alta intensidad (amarillo)
  }
  if (
    upper.includes('MÉDICO') ||
    upper.includes('AUXILIO') ||
    upper.includes('ANIMALES') ||
    upper.includes('ANIEGOS')
  ) {
    return 0.55; // Media intensidad (verde)
  }
  return 0.45; // Patrullaje preventivo ordinario (azul)
}

// Generador de número pseudo-aleatorio determinista para una dispersión orgánica estable
function pseudoRandom(seed: string): number {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = (hash << 5) - hash + seed.charCodeAt(i);
    hash |= 0;
  }
  return (Math.abs(hash) % 10000) / 10000;
}

/**
 * Función principal que lee 'lugar', 'referencia', 'observacion', 'sector' y 'zona'
 * para calcular las coordenadas GPS exactas en Nuevo Chimbote con intensidad táctica.
 */
export function geocodeIncident(record: IncidentRecord, index: number = 0): HeatPoint {
  // 1. Si el registro ya trae latitud y longitud numéricas válidas en rango de Nuevo Chimbote:
  if (
    typeof record.lat === 'number' &&
    typeof record.lng === 'number' &&
    record.lat >= -9.2 &&
    record.lat <= -9.05 &&
    record.lng >= -78.6 &&
    record.lng <= -78.45
  ) {
    return {
      lat: record.lat,
      lng: record.lng,
      intensity: getIncidentIntensity(record.incidencia),
      lugar: record.lugar || 'Nuevo Chimbote',
      incidencia: record.incidencia || 'Atención de Serenazgo',
      sector: record.sector || record.subsector || 'S/S',
      zona: record.zona || 'ZONA CENTRO',
      id: record.id || `inc-${index}`,
    };
  }

  // 2. Concatenar y normalizar el texto de búsqueda (lugar + refe + observacion + sector)
  const fullText = [
    record.lugar || '',
    record.refe || '',
    record.observacion || '',
    record.sector || '',
    record.subsector || '',
  ]
    .join(' ')
    .toUpperCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, ''); // Quitar tildes

  let baseLat: number | null = null;
  let baseLng: number | null = null;
  let maxJitterMeters = 50;
  let matchedLugar = record.lugar || 'Nuevo Chimbote';

  // 3. Buscar coincidencias en el catálogo de Landmarks de Nuevo Chimbote
  for (const landmark of NUEVO_CHIMBOTE_LANDMARKS) {
    for (const kw of landmark.keywords) {
      const normKw = kw
        .toUpperCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '');

      if (fullText.includes(normKw)) {
        baseLat = landmark.lat;
        baseLng = landmark.lng;
        maxJitterMeters = landmark.jitterMeters;
        matchedLugar = landmark.nombreOficial;
        break;
      }
    }
    if (baseLat !== null) break;
  }

  // 4. Si no coincidió con landmark específico, buscar por Sector (S1BA - S8VM)
  if (baseLat === null || baseLng === null) {
    const rawSector = (record.sector || record.subsector || '').toUpperCase().trim();
    if (SUBSECTORES_COORDS[rawSector]) {
      baseLat = SUBSECTORES_COORDS[rawSector].lat;
      baseLng = SUBSECTORES_COORDS[rawSector].lng;
      maxJitterMeters = 110;
      matchedLugar = `Sector ${rawSector}`;
    }
  }

  // 5. Si aún no tiene coordenadas, usar la Zona (Centro / Norte / Sur)
  if (baseLat === null || baseLng === null) {
    const rawZona = (record.zona || '').toUpperCase().trim();
    if (ZONAS_COORDS[rawZona]) {
      baseLat = ZONAS_COORDS[rawZona].lat;
      baseLng = ZONAS_COORDS[rawZona].lng;
      maxJitterMeters = 250;
      matchedLugar = `Zona ${rawZona}`;
    } else {
      // Default: Plaza Mayor de Nuevo Chimbote
      baseLat = -9.1258;
      baseLng = -78.5242;
      maxJitterMeters = 300;
      matchedLugar = 'Nuevo Chimbote';
    }
  }

  // 6. Aplicar dispersión orgánica determinista (jitter)
  // Convierte metros a grados (~1 grado lat = 111,000m; ~1 grado lng = 109,700m en esta latitud)
  const seedString = `${record.id || ''}_${record.codigo || ''}_${index}_${record.fecha || ''}_${record.hora || ''}`;
  const angle = pseudoRandom(seedString) * Math.PI * 2;
  const distanceFactor = Math.sqrt(pseudoRandom(seedString + '_dist'));
  const distanceMeters = distanceFactor * maxJitterMeters;

  const latOffset = (distanceMeters * Math.cos(angle)) / 111000;
  const lngOffset = (distanceMeters * Math.sin(angle)) / 109700;

  return {
    lat: Number((baseLat + latOffset).toFixed(6)),
    lng: Number((baseLng + lngOffset).toFixed(6)),
    intensity: getIncidentIntensity(record.incidencia),
    lugar: matchedLugar,
    incidencia: record.incidencia || 'Atención de Serenazgo',
    sector: record.sector || record.subsector || 'S/S',
    zona: record.zona || 'ZONA CENTRO',
    id: record.id || `inc-${index}`,
  };
}

/**
 * Convierte un conjunto de atenciones en puntos de calor listos para Leaflet Heat
 */
export function processIncidentsToHeatPoints(records: IncidentRecord[]): HeatPoint[] {
  return records.map((r, i) => geocodeIncident(r, i));
}
