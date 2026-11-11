// Definiciones geográficas y cartográficas vectoriales nativas de Nuevo Chimbote
// Permite renderizar el mapa táctico de forma 100% autónoma sin depender de servidores de teselas externos.

export interface RoadFeature {
  nombre: string;
  tipo: 'TRUNK' | 'PRIMARY' | 'SECONDARY';
  coords: [number, number][];
}

export interface LandmarkFeature {
  nombre: string;
  tipo: 'BASE' | 'COMISARIA' | 'HOSPITAL' | 'CIVIC' | 'PLAZA' | 'CAMPUS';
  lat: number;
  lng: number;
  codigo?: string;
}

export interface SectorBoundary {
  id: string;
  nombre: string;
  zona: string;
  comisaria: string;
  color: string;
  coords: [number, number][];
}

// 1. Perímetro General del Distrito de Nuevo Chimbote
export const NUEVO_CHIMBOTE_DISTRICT_BOUNDARY: [number, number][] = [
  [-9.088, -78.532],
  [-9.095, -78.544],
  [-9.108, -78.553],
  [-9.124, -78.558],
  [-9.142, -78.556],
  [-9.158, -78.542],
  [-9.162, -78.520],
  [-9.155, -78.502],
  [-9.138, -78.495],
  [-9.112, -78.498],
  [-9.092, -78.512],
  [-9.088, -78.532],
];

// 2. Línea Costera y Océano Pacífico (Bahía de Chimbote a Samanco)
export const PACIFIC_COASTLINE: [number, number][] = [
  [-9.085, -78.548],
  [-9.098, -78.552],
  [-9.112, -78.557],
  [-9.126, -78.561],
  [-9.139, -78.559],
  [-9.152, -78.551],
  [-9.165, -78.538],
];

// 3. Red Vial Principal (Arterias Tácticas de Nuevo Chimbote)
export const TACTICAL_ROAD_NETWORK: RoadFeature[] = [
  // Eje Troncal: Av. Pacífico (Cruza de Norte a Sur)
  {
    nombre: 'Av. Pacífico',
    tipo: 'TRUNK',
    coords: [
      [-9.092, -78.5385],
      [-9.1015, -78.535],
      [-9.111, -78.5305],
      [-9.118, -78.5272],
      [-9.1258, -78.5242], // Plaza Mayor
      [-9.1325, -78.5218],
      [-9.1415, -78.5185],
      [-9.152, -78.515],
    ],
  },
  // Carretera Panamericana Norte (Corredor Rápido)
  {
    nombre: 'Panamericana Norte',
    tipo: 'TRUNK',
    coords: [
      [-9.088, -78.529],
      [-9.102, -78.526],
      [-9.115, -78.523],
      [-9.128, -78.52],
      [-9.14, -78.517],
      [-9.156, -78.513],
    ],
  },
  // Av. Anchoveta (Conecta Costa con Casuarinas / Garatea)
  {
    nombre: 'Av. Anchoveta',
    tipo: 'PRIMARY',
    coords: [
      [-9.116, -78.545],
      [-9.119, -78.535],
      [-9.1215, -78.5265],
      [-9.1245, -78.517],
      [-9.127, -78.508],
    ],
  },
  // Av. Brasil (Eje transversal Villa María - Bellamar)
  {
    nombre: 'Av. Brasil',
    tipo: 'PRIMARY',
    coords: [
      [-9.107, -78.547],
      [-9.11, -78.537],
      [-9.113, -78.527],
      [-9.116, -78.516],
    ],
  },
  // Av. Universitaria / Av. Central (Acceso UNS y Garatea)
  {
    nombre: 'Av. Universitaria',
    tipo: 'PRIMARY',
    coords: [
      [-9.106, -78.521],
      [-9.1125, -78.518],
      [-9.119, -78.516],
      [-9.126, -78.5145],
      [-9.135, -78.513],
    ],
  },
  // Av. Country (Buenos Aires - Casuarinas)
  {
    nombre: 'Av. Country',
    tipo: 'SECONDARY',
    coords: [
      [-9.122, -78.537],
      [-9.125, -78.529],
      [-9.128, -78.521],
      [-9.131, -78.512],
    ],
  },
  // Av. Agraria (Sur de Casuarinas - Los Ángeles)
  {
    nombre: 'Av. Agraria',
    tipo: 'SECONDARY',
    coords: [
      [-9.13, -78.54],
      [-9.133, -78.531],
      [-9.136, -78.522],
      [-9.139, -78.513],
    ],
  },
  // Av. Los Pescadores / Costanera
  {
    nombre: 'Av. Los Pescadores (Costanera)',
    tipo: 'SECONDARY',
    coords: [
      [-9.101, -78.547],
      [-9.114, -78.551],
      [-9.127, -78.554],
      [-9.141, -78.55],
    ],
  },
  // Av. Pelícano / Los Álamos
  {
    nombre: 'Av. Los Álamos',
    tipo: 'SECONDARY',
    coords: [
      [-9.118, -78.533],
      [-9.125, -78.531],
      [-9.133, -78.529],
    ],
  },
  // Av. Marginal Bellamar
  {
    nombre: 'Av. Bellamar',
    tipo: 'SECONDARY',
    coords: [
      [-9.114, -78.512],
      [-9.121, -78.509],
      [-9.129, -78.506],
    ],
  },
];

// 4. Polígonos de los 16 Subsectores Oficiales de Nuevo Chimbote
export const TACTICAL_SECTORS_BOUNDARIES: SectorBoundary[] = [
  // COMISARÍA BUENOS AIRES
  {
    id: 'S1BA',
    nombre: 'Los Portales / Los Álamos / Base Oeste',
    zona: 'ZONA CENTRO',
    comisaria: 'CIA BUENOS AIRES',
    color: '#0284c7',
    coords: [
      [-9.119, -78.534],
      [-9.121, -78.528],
      [-9.127, -78.527],
      [-9.128, -78.533],
      [-9.124, -78.536],
      [-9.119, -78.534],
    ],
  },
  {
    id: 'S2BA',
    nombre: 'Casuarinas / Mariátegui / Plaza Mayor',
    zona: 'ZONA CENTRO',
    comisaria: 'CIA BUENOS AIRES',
    color: '#06b6d4',
    coords: [
      [-9.122, -78.527],
      [-9.123, -78.52],
      [-9.13, -78.519],
      [-9.131, -78.526],
      [-9.127, -78.527],
      [-9.122, -78.527],
    ],
  },
  {
    id: 'S3BA',
    nombre: 'Nicolás Garatea / San Luis / Satélite',
    zona: 'ZONA NORTE',
    comisaria: 'CIA BUENOS AIRES',
    color: '#0ea5e9',
    coords: [
      [-9.113, -78.524],
      [-9.114, -78.516],
      [-9.122, -78.515],
      [-9.122, -78.523],
      [-9.117, -78.525],
      [-9.113, -78.524],
    ],
  },
  {
    id: 'S4BA',
    nombre: 'Los Rosales / Santa Rosa / Las Flores',
    zona: 'ZONA SUR',
    comisaria: 'CIA BUENOS AIRES',
    color: '#38bdf8',
    coords: [
      [-9.128, -78.53],
      [-9.13, -78.523],
      [-9.137, -78.521],
      [-9.137, -78.529],
      [-9.132, -78.531],
      [-9.128, -78.53],
    ],
  },
  {
    id: 'S5BA',
    nombre: 'Las Flores Norte / Los Pinos / Univ. UNS',
    zona: 'ZONA NORTE',
    comisaria: 'CIA BUENOS AIRES',
    color: '#67e8f9',
    coords: [
      [-9.107, -78.522],
      [-9.108, -78.512],
      [-9.116, -78.512],
      [-9.115, -78.521],
      [-9.11, -78.523],
      [-9.107, -78.522],
    ],
  },
  {
    id: 'S6BA',
    nombre: 'Coop. Vivienda Sur / Los Ángeles / Base Sur',
    zona: 'ZONA SUR',
    comisaria: 'CIA BUENOS AIRES',
    color: '#0284c7',
    coords: [
      [-9.134, -78.526],
      [-9.136, -78.518],
      [-9.144, -78.517],
      [-9.144, -78.525],
      [-9.139, -78.527],
      [-9.134, -78.526],
    ],
  },
  {
    id: 'S7BA',
    nombre: 'Las Delicias / Villa Sol / El Triunfo',
    zona: 'ZONA SUR',
    comisaria: 'CIA BUENOS AIRES',
    color: '#0891b2',
    coords: [
      [-9.125, -78.517],
      [-9.126, -78.508],
      [-9.135, -78.507],
      [-9.134, -78.516],
      [-9.129, -78.518],
      [-9.125, -78.517],
    ],
  },
  {
    id: 'S8BA',
    nombre: 'Cono Sur-Este / Nuevo Amanecer',
    zona: 'ZONA SUR',
    comisaria: 'CIA BUENOS AIRES',
    color: '#22d3ee',
    coords: [
      [-9.14, -78.52],
      [-9.141, -78.51],
      [-9.15, -78.509],
      [-9.151, -78.519],
      [-9.145, -78.521],
      [-9.14, -78.52],
    ],
  },
  {
    id: 'S9BA',
    nombre: 'Campiñas de Tangay / Mateo Grosso',
    zona: 'ZONA NORTE',
    comisaria: 'CIA BUENOS AIRES',
    color: '#14b8a6',
    coords: [
      [-9.091, -78.516],
      [-9.092, -78.501],
      [-9.105, -78.501],
      [-9.105, -78.515],
      [-9.098, -78.517],
      [-9.091, -78.516],
    ],
  },

  // COMISARÍA VILLA MARÍA
  {
    id: 'S1VM',
    nombre: 'Villa María Tradicional / Trapecio / Base Norte',
    zona: 'ZONA CENTRO',
    comisaria: 'CIA VILLA MARIA',
    color: '#0369a1',
    coords: [
      [-9.097, -78.539],
      [-9.098, -78.529],
      [-9.107, -78.528],
      [-9.108, -78.538],
      [-9.103, -78.541],
      [-9.097, -78.539],
    ],
  },
  {
    id: 'S2VM',
    nombre: 'Sol de Chimbote / Las Praderas',
    zona: 'ZONA CENTRO',
    comisaria: 'CIA VILLA MARIA',
    color: '#0284c7',
    coords: [
      [-9.103, -78.544],
      [-9.104, -78.534],
      [-9.112, -78.533],
      [-9.113, -78.543],
      [-9.108, -78.545],
      [-9.103, -78.544],
    ],
  },
  {
    id: 'S3VM',
    nombre: '2 de Octubre / Buenos Aires Sur VM',
    zona: 'ZONA CENTRO',
    comisaria: 'CIA VILLA MARIA',
    color: '#0ea5e9',
    coords: [
      [-9.109, -78.546],
      [-9.11, -78.536],
      [-9.118, -78.536],
      [-9.119, -78.546],
      [-9.114, -78.548],
      [-9.109, -78.546],
    ],
  },
  {
    id: 'S4VM',
    nombre: 'Cono Sur Villa María / Costa Verde',
    zona: 'ZONA SUR',
    comisaria: 'CIA VILLA MARIA',
    color: '#06b6d4',
    coords: [
      [-9.116, -78.55],
      [-9.117, -78.541],
      [-9.126, -78.541],
      [-9.126, -78.551],
      [-9.121, -78.553],
      [-9.116, -78.55],
    ],
  },
  {
    id: 'S5VM',
    nombre: 'Ampliaciones Sur VM / Nuevo Paraíso',
    zona: 'ZONA SUR',
    comisaria: 'CIA VILLA MARIA',
    color: '#0891b2',
    coords: [
      [-9.123, -78.553],
      [-9.124, -78.543],
      [-9.133, -78.543],
      [-9.133, -78.553],
      [-9.128, -78.555],
      [-9.123, -78.553],
    ],
  },
  {
    id: 'S6VM',
    nombre: 'Domus / Las Brisas del Sur / El Pinar',
    zona: 'ZONA SUR',
    comisaria: 'CIA VILLA MARIA',
    color: '#38bdf8',
    coords: [
      [-9.13, -78.547],
      [-9.131, -78.538],
      [-9.139, -78.538],
      [-9.14, -78.547],
      [-9.135, -78.549],
      [-9.13, -78.547],
    ],
  },
  {
    id: 'S7VM',
    nombre: 'Límite Sur VM / El Progreso del Sur',
    zona: 'ZONA SUR',
    comisaria: 'CIA VILLA MARIA',
    color: '#22d3ee',
    coords: [
      [-9.138, -78.544],
      [-9.139, -78.535],
      [-9.148, -78.535],
      [-9.148, -78.544],
      [-9.143, -78.546],
      [-9.138, -78.544],
    ],
  },
];

// 5. Puntos Estratégicos y Bases Operativas de Serenazgo
export const TACTICAL_LANDMARKS: LandmarkFeature[] = [
  {
    nombre: 'Plaza Mayor Nuevo Chimbote',
    tipo: 'PLAZA',
    lat: -9.1258,
    lng: -78.5242,
    codigo: 'PLAZA-MAYOR',
  },
  {
    nombre: 'Base Central Serenazgo (Av. Pacífico)',
    tipo: 'BASE',
    lat: -9.1242,
    lng: -78.5255,
    codigo: 'BASE-CENTRAL',
  },
  {
    nombre: 'Base Norte Serenazgo (Villa María)',
    tipo: 'BASE',
    lat: -9.1025,
    lng: -78.5342,
    codigo: 'BASE-NORTE',
  },
  {
    nombre: 'Base Sur Serenazgo (Cono Sur)',
    tipo: 'BASE',
    lat: -9.1395,
    lng: -78.5228,
    codigo: 'BASE-SUR',
  },
  {
    nombre: 'Comisaría PNP Buenos Aires',
    tipo: 'COMISARIA',
    lat: -9.1278,
    lng: -78.5292,
    codigo: 'PNP-BUENOSAIRES',
  },
  {
    nombre: 'Comisaría PNP Villa María',
    tipo: 'COMISARIA',
    lat: -9.1032,
    lng: -78.5358,
    codigo: 'PNP-VILLAMARIA',
  },
  {
    nombre: 'Hospital Regional Eleazar Guzmán Barrón',
    tipo: 'HOSPITAL',
    lat: -9.1192,
    lng: -78.5298,
    codigo: 'HOSP-REGIONAL',
  },
  {
    nombre: 'Universidad Nacional del Santa (UNS)',
    tipo: 'CAMPUS',
    lat: -9.1132,
    lng: -78.5172,
    codigo: 'UNS-CAMPUS',
  },
  {
    nombre: 'Mercado Mayorista La Perla',
    tipo: 'CIVIC',
    lat: -9.1062,
    lng: -78.5312,
    codigo: 'MERCADO-PERLA',
  },
  {
    nombre: 'Polideportivo Casuarinas',
    tipo: 'CIVIC',
    lat: -9.1225,
    lng: -78.5215,
    codigo: 'POLIDEP-CASUARINAS',
  },
];
