// Referencias Oficiales de Sectores - Serenazgo Nuevo Chimbote
// Fuente: Base Cartográfica y Cuadrantes Oficiales 2025-2026

export interface SectorDetail {
  id: string; // Ej. 'S1BA', 'S1VM'
  comisaria: 'CIA BUENOS AIRES' | 'CIA VILLA MARIA';
  zona: 'ZONA CENTRO' | 'ZONA NORTE' | 'ZONA SUR';
  nombre: string;
  lat: number;
  lng: number;
  urbanizaciones: string[];
  aahhUpis: string[];
  crucesVias: string[];
  colegios: string[];
  parques: string[];
  lozas: string[];
  referenciasBases: string;
}

export const SECTORES_OFICIALES: Record<string, SectorDetail> = {
  // ==========================================
  // JURISDICCIÓN COMISARÍA BUENOS AIRES (S1BA - S9BA)
  // ==========================================
  S1BA: {
    id: 'S1BA',
    comisaria: 'CIA BUENOS AIRES',
    zona: 'ZONA CENTRO',
    nombre: 'Sector 1 - Buenos Aires Centro / Oeste',
    lat: -9.1235,
    lng: -78.5305,
    urbanizaciones: ['Urb. Los Portales', 'Urb. Los Álamos', 'Urb. Las Palmeras'],
    aahhUpis: ['AA.HH. Los Portales', 'AA.HH. Los Álamos', 'UPIS Villa El Salvador'],
    crucesVias: [
      'Av. Pacífico con Av. Anchoveta',
      'Av. Argentina con Av. Anchoveta',
      'Av. Country con Av. Pacífico',
      'Av. Pardo con Av. Industrial',
    ],
    colegios: ['I.E. Los Portales', 'I.E. Particular Mi Pequeño Mundo', 'I.E.I. Los Álamos'],
    parques: ['Parque Principal Los Portales', 'Parque Los Álamos', 'Parque Las Palmeras'],
    lozas: ['Loza Deportiva Los Portales', 'Complejo Deportivo Los Álamos'],
    referenciasBases: 'Base Oeste Serenazgo (Sede Operativa), zona comercial Av. Anchoveta',
  },
  S2BA: {
    id: 'S2BA',
    comisaria: 'CIA BUENOS AIRES',
    zona: 'ZONA CENTRO',
    nombre: 'Sector 2 - Buenos Aires Centro Cívico',
    lat: -9.1258,
    lng: -78.5242,
    urbanizaciones: ['Urb. Carlos Mariátegui', 'Urb. Las Gardenias', 'Urb. Casuarinas'],
    aahhUpis: ['UPIS Belén', 'AA.HH. Belén'],
    crucesVias: [
      'Av. Universitaria con Av. Central',
      'Av. Los Chasquis con Av. Pacífico',
      'Av. Central con Av. Anchoveta',
      'Av. Brasil con Av. Universitaria',
    ],
    colegios: ['I.E. Carlos Mariátegui', 'I.E. Las Gardenias', 'Colegio Parroquial San José'],
    parques: ['Parque Central Las Gardenias', 'Parque Carlos Mariátegui', 'Plazuela Belén'],
    lozas: ['Loza Deportiva Las Gardenias', 'Loza UPIS Belén', 'Complejo Deportivo Central'],
    referenciasBases: 'Zona cívica, comercial, Plaza Mayor de Nuevo Chimbote y Catedral',
  },
  S3BA: {
    id: 'S3BA',
    comisaria: 'CIA BUENOS AIRES',
    zona: 'ZONA NORTE',
    nombre: 'Sector 3 - Buenos Aires Norte / Garatea',
    lat: -9.1172,
    lng: -78.5208,
    urbanizaciones: ['Urb. Nicolás Garatea (I Etapa)', 'Urb. San Luis', 'Urb. Satélite'],
    aahhUpis: ['AA.HH. Nicolás Garatea', 'UPIS San Luis'],
    crucesVias: [
      'Av. Nicolás Garatea con Av. Pacífico',
      'Av. Aviación con Av. Garatea',
      'Av. Pacífico con Av. Los Pescadores',
      'Av. Central con Av. Garatea',
    ],
    colegios: ['I.E. Nicolás Garatea', 'I.E. San Luis', 'I.E. República Peruana'],
    parques: ['Parque Mayor Nicolás Garatea', 'Parque Zonal San Luis', 'Parque Satélite'],
    lozas: ['Complejo Deportivo Nicolás Garatea', 'Loza Deportiva San Luis', 'Loza Satélite'],
    referenciasBases: 'Base Oeste vigilancia, nodo comercial Garatea y Av. Pacífico',
  },
  S4BA: {
    id: 'S4BA',
    comisaria: 'CIA BUENOS AIRES',
    zona: 'ZONA SUR',
    nombre: 'Sector 4 - Buenos Aires Sur / Las Flores',
    lat: -9.1325,
    lng: -78.5262,
    urbanizaciones: ['Urb. Los Rosales', 'Urb. Santa Rosa', 'Urb. Las Flores'],
    aahhUpis: ['AA.HH. Las Flores', 'UPIS San Francisco', 'AA.HH. Los Héroes'],
    crucesVias: [
      'Av. Brasil con Av. Anchoveta',
      'Av. Central con Av. Brasil',
      'Av. Los Pescadores con Av. Brasil',
      'Av. Anchoveta con Av. Las Américas',
    ],
    colegios: ['I.E. Santa Rosa', 'I.E. Las Flores', 'I.E. San Luis'],
    parques: ['Parque Cívico Sur', 'Plazuela San Luis', 'Parque Las Flores'],
    lozas: ['Loza Deportiva La Anchoveta', 'Complejo Deportivo Sur', 'Loza San Francisco'],
    referenciasBases: 'Alta afluencia vecinal, Mercado Santa Rosa y zona comercial Av. Brasil',
  },
  S5BA: {
    id: 'S5BA',
    comisaria: 'CIA BUENOS AIRES',
    zona: 'ZONA NORTE',
    nombre: 'Sector 5 - Buenos Aires Norte / Ciudad Universitaria UNS',
    lat: -9.1118,
    lng: -78.5175,
    urbanizaciones: ['Urb. Las Flores Norte', 'Urb. Los Pinos', 'Urb. Buenos Aires Norte'],
    aahhUpis: ['AA.HH. Los Pinos Norte', 'UPIS Las Flores', 'Sector Bellavista'],
    crucesVias: [
      'Av. Universitaria con Panamericana Norte',
      'Av. Agraria con Av. Universitaria',
      'Av. Pacífico con Av. Agraria',
      'Panamericana Norte con Av. Garatea',
    ],
    colegios: ['Colegio Adventista', 'I.E. Los Pinos', 'I.E. República de Yugoslavia'],
    parques: ['Parque Ecológico UNS', 'Parque Las Flores Norte', 'Parque Los Pinos'],
    lozas: ['Complejo Deportivo UNS', 'Loza Los Pinos', 'Polideportivo Bellavista'],
    referenciasBases: 'Universidad Nacional del Santa (UNS), Hospital Regional Eleazar Guzmán Barrón',
  },
  S6BA: {
    id: 'S6BA',
    comisaria: 'CIA BUENOS AIRES',
    zona: 'ZONA SUR',
    nombre: 'Sector 6 - Buenos Aires Sur / Los Ángeles',
    lat: -9.1392,
    lng: -78.5225,
    urbanizaciones: ['Urb. Cooperativa de Vivienda Sur', 'Urb. Los Ángeles'],
    aahhUpis: ['AA.HH. Los Ángeles', 'UPIS Los Pescadores', 'AA.HH. 19 de Julio'],
    crucesVias: [
      'Av. Los Pescadores con Av. Austral',
      'Av. Camino Real con Av. Los Pescadores',
      'Av. Austral con Av. Central',
      'Av. Sur con Av. Los Pescadores',
    ],
    colegios: ['I.E. Los Ángeles', 'I.E. Cono Sur', 'I.E. Inicial 19 de Julio'],
    parques: ['Parque Zonal Sur', 'Parque Los Pescadores', 'Plazuela Los Ángeles'],
    lozas: ['Loza Deportiva Base Sur', 'Complejo Deportivo Sector 6', 'Loza 19 de Julio'],
    referenciasBases: 'Base Sur Serenazgo (Punto táctico de despliegue rápido)',
  },
  S7BA: {
    id: 'S7BA',
    comisaria: 'CIA BUENOS AIRES',
    zona: 'ZONA SUR',
    nombre: 'Sector 7 - Buenos Aires Este / Las Delicias',
    lat: -9.1298,
    lng: -78.5135,
    urbanizaciones: ['Urb. Las Delicias', 'Urb. Villa Sol', 'Urb. El Triunfo'],
    aahhUpis: ['AA.HH. Villa Sol', 'AA.HH. Las Delicias', 'UPIS El Triunfo', 'AA.HH. Los Jardines'],
    crucesVias: [
      'Av. Agraria con Av. Prolongación Pacífico',
      'Av. Las Américas con Av. Agraria',
      'Av. Prolongación Pacífico con Av. Las Delicias',
      'Av. Este con Av. Agraria',
    ],
    colegios: ['I.E. Villa Sol', 'I.E. Las Delicias', 'Colegio Parroquial San Juan'],
    parques: ['Parque Las Delicias', 'Parque Villa Sol', 'Parque Ecológico Este'],
    lozas: ['Loza Las Delicias', 'Campo Deportivo Villa Sol', 'Loza El Triunfo'],
    referenciasBases: 'Zona expansiva residencial este, límites con zonas agrícolas',
  },
  S8BA: {
    id: 'S8BA',
    comisaria: 'CIA BUENOS AIRES',
    zona: 'ZONA SUR',
    nombre: 'Sector 8 - Buenos Aires Sur-Este / Nuevo Amanecer',
    lat: -9.1455,
    lng: -78.5152,
    urbanizaciones: ['H.U.P. Cono Sur-Este', 'Urb. Los Cipreses'],
    aahhUpis: [
      'AA.HH. Nuevo Amanecer',
      'AA.HH. Los Constructores',
      'AA.HH. Villa Hermosa del Sur',
      'UPIS Periféricas Sur',
    ],
    crucesVias: [
      'Av. Periférica con Carretera Panamericana',
      'Av. Sur con Av. Periférica',
      'Av. Prolongación Pacífico con Av. Periférica',
      'Vía de Evitamiento con Av. Sur',
    ],
    colegios: ['I.E. Nuevo Amanecer', 'PRONOEI Los Constructores'],
    parques: ['Parques Zonales en Habilitación', 'Plazas Comunales Periféricas'],
    lozas: ['Lozas Deportivas Expansión Sur', 'Campos Rústicos Deportivos'],
    referenciasBases: 'Control perimétrico, patrullaje preventivo de expansión urbana y Vía Evitamiento',
  },
  S9BA: {
    id: 'S9BA',
    comisaria: 'CIA BUENOS AIRES',
    zona: 'ZONA NORTE',
    nombre: 'Sector 9 - Buenos Aires Norte Periférico / Tangay',
    lat: -9.0985,
    lng: -78.5085,
    urbanizaciones: ['Campiñas de Tangay', 'Urb. Campestre Tangay', 'H.U.P. Tangay'],
    aahhUpis: [
      'AA.HH. Tangay Alto',
      'AA.HH. Tangay Bajo',
      'AA.HH. Mateo Grosso',
      'ONG Mateo Grosso',
      'Caseríos Rurales',
    ],
    crucesVias: [
      'Carretera Panamericana Norte con Vía Tangay',
      'Vía Tangay con Zona Agrícola',
      'Acceso Principal Tangay Alto',
      'Cruce Panamericana con Campiñas',
    ],
    colegios: ['I.E. Rural Tangay', 'I.E. Mateo Grosso'],
    parques: ['Plaza Cívica de Tangay', 'Áreas Verdes Rurales', 'Parque Campestre Tangay'],
    lozas: ['Loza Deportiva Tangay Alto', 'Loza Deportiva Tangay Bajo'],
    referenciasBases: 'Zona agropecuaria, caseríos rurales periféricos y control vehicular Panamericana',
  },

  // ==========================================
  // JURISDICCIÓN COMISARÍA VILLA MARÍA (S1VM - S7VM)
  // ==========================================
  S1VM: {
    id: 'S1VM',
    comisaria: 'CIA VILLA MARIA',
    zona: 'ZONA CENTRO',
    nombre: 'Sector 1 - Villa María Tradicional / Casco Urbano',
    lat: -9.1025,
    lng: -78.5342,
    urbanizaciones: ['Urb. Buenos Aires (Villa María)', 'Urb. El Trapecio', 'Urb. Popular Villa María'],
    aahhUpis: ['AA.HH. Villa María Tradicional', 'UPIS Villa María'],
    crucesVias: [
      'Av. Camino Real con Av. Pardo',
      'Av. Las Palmeras con Av. Pardo',
      'Av. Pardo con Av. Industrial',
      'Av. Camino Real con Av. Industrial',
    ],
    colegios: ['I.E. Villa María', 'I.E. El Trapecio', 'I.E. Fe y Alegría'],
    parques: ['Parque Principal Villa María', 'Plazuela Miguel Grau', 'Parque El Trapecio'],
    lozas: ['Complejo Deportivo Villa María', 'Loza Tradicional El Trapecio'],
    referenciasBases: 'Base Norte Serenazgo (Villa María), zona bancaria y comercial Av. Pardo',
  },
  S2VM: {
    id: 'S2VM',
    comisaria: 'CIA VILLA MARIA',
    zona: 'ZONA CENTRO',
    nombre: 'Sector 2 - Villa María / Las Praderas & Sol de Chimbote',
    lat: -9.1082,
    lng: -78.5385,
    urbanizaciones: ['Urb. Sol de Chimbote', 'Urb. Las Praderas (I, II, III y IV Etapa)'],
    aahhUpis: ['AA.HH. Sol de Chimbote', 'UPIS Las Praderas'],
    crucesVias: [
      'Av. Los Incas con Av. Las Palmeras',
      'Av. Central con Av. Los Incas',
      'Av. Las Praderas con Av. Sol de Chimbote',
      'Av. Pardo con Av. Los Incas',
    ],
    colegios: ['I.E. Las Praderas', 'I.E. Sol de Chimbote'],
    parques: ['Parque Las Praderas (I-IV)', 'Parque Sol de Chimbote', 'Parque Residencial Oeste'],
    lozas: ['Loza Las Praderas', 'Loza Sol de Chimbote', 'Complejo Deportivo Las Praderas'],
    referenciasBases: 'Zona residencial densa, alta circulación vecinal y comercio local',
  },
  S3VM: {
    id: 'S3VM',
    comisaria: 'CIA VILLA MARIA',
    zona: 'ZONA CENTRO',
    nombre: 'Sector 3 - Villa María / 2 de Octubre',
    lat: -9.1142,
    lng: -78.5412,
    urbanizaciones: ['Urb. Buenos Aires Sur VM', 'H.U.P. 2 de Octubre (Etapas I, II, III)'],
    aahhUpis: ['AA.HH. 2 de Octubre', 'UPIS 2 de Octubre'],
    crucesVias: [
      'Av. 2 de Octubre con Av. Principal Villa María',
      'Av. Las Palmeras con Av. 2 de Octubre',
      'Av. Central con Av. 2 de Octubre',
      'Av. Costanera con Av. 2 de Octubre',
    ],
    colegios: ['I.E. 2 de Octubre', 'I.E. San Pedro'],
    parques: ['Parque Central 2 de Octubre', 'Parque Zonal Villa María', 'Plazuela 2 de Octubre'],
    lozas: ['Loza 2 de Octubre', 'Complejo Deportivo 2 de Octubre', 'Loza San Pedro'],
    referenciasBases: 'Asentamientos populares consolidados, mercados de abastos y centros comunales',
  },
  S4VM: {
    id: 'S4VM',
    comisaria: 'CIA VILLA MARIA',
    zona: 'ZONA SUR',
    nombre: 'Sector 4 - Villa María Costera / Costa Verde & Miramar',
    lat: -9.1215,
    lng: -78.5458,
    urbanizaciones: ['H.U.P. Cono Sur Villa María', 'Urb. Costa Verde', 'Urb. Miramar Sur'],
    aahhUpis: ['AA.HH. Costa Verde', 'AA.HH. Cono Sur', 'UPIS Miramar'],
    crucesVias: [
      'Av. Las Palmeras con Av. Costanera / Marginal',
      'Av. Costanera con Av. Principal',
      'Av. Sur con Av. Costanera',
      'Av. Marginal con Av. Cono Sur',
    ],
    colegios: ['I.E. Costa Verde', 'I.E. Inicial Miramar Sur'],
    parques: ['Parque Costanera', 'Plazuela Cono Sur', 'Parque Ecológico Costa Verde'],
    lozas: ['Loza Deportiva Cono Sur Villa María', 'Loza Costanera'],
    referenciasBases: 'Zona costera y laderas, control de playas y áreas de recreación marina',
  },
  S5VM: {
    id: 'S5VM',
    comisaria: 'CIA VILLA MARIA',
    zona: 'ZONA SUR',
    nombre: 'Sector 5 - Villa María Sur / Nuevo Paraíso & Olivos',
    lat: -9.1285,
    lng: -78.5482,
    urbanizaciones: ['H.U.P. Ampliaciones del Sur Villa María', 'Cooperativas de Vivienda'],
    aahhUpis: ['AA.HH. Nuevo Paraíso', 'AA.HH. Los Olivos del Sur', 'UPIS Villa Sur'],
    crucesVias: [
      'Av. Sur con Av. Prolongación Pardo',
      'Av. Prolongación Pardo con Av. Principal Sur',
      'Av. Los Pescadores Sur con Av. Sur',
      'Vía Colectora con Av. Sur',
    ],
    colegios: ['I.E. Nuevo Paraíso', 'PRONOEI Los Olivos'],
    parques: ['Parque Zonal Sur Villa María', 'Áreas Recreativas del Sur', 'Parque Los Olivos'],
    lozas: ['Loza Deportiva Sector 5 Villa María', 'Complejo Deportivo Sur VM'],
    referenciasBases: 'Áreas de patrullaje intensivo preventivo y recuperación de espacios públicos',
  },
  S6VM: {
    id: 'S6VM',
    comisaria: 'CIA VILLA MARIA',
    zona: 'ZONA SUR',
    nombre: 'Sector 6 - Villa María Sur-Este / Domus & Las Brisas',
    lat: -9.1352,
    lng: -78.5425,
    urbanizaciones: ['Urb. Domus', 'H.U.P. Residenciales y Eriazos Este VM'],
    aahhUpis: ['AA.HH. Domus', 'AA.HH. Las Brisas del Sur', 'UPIS El Pinar'],
    crucesVias: [
      'Av. Circunvalación con Av. Principal',
      'Av. Principal con Vía Domus',
      'Av. Las Américas con Av. Circunvalación',
      'Vía de Evitamiento con Av. Circunvalación',
    ],
    colegios: ['I.E. Domus', 'I.E. Las Brisas'],
    parques: ['Parque Domus', 'Parque Ecológico Sur-Este', 'Parque de la Integración'],
    lozas: ['Loza Domus', 'Complejo Deportivo Sectorial Este VM'],
    referenciasBases: 'Zona de transición urbana con pampas eriazas y vías de conexión interdistrital',
  },
  S7VM: {
    id: 'S7VM',
    comisaria: 'CIA VILLA MARIA',
    zona: 'ZONA SUR',
    nombre: 'Sector 7 - Villa María Límite Sur Extremo',
    lat: -9.1435,
    lng: -78.5398,
    urbanizaciones: ['H.U.P. Límite Sur Jurisdicción VM', 'Asentamientos Periféricos Extremos'],
    aahhUpis: ['AA.HH. El Progreso del Sur', 'AA.HH. Límite Territorial', 'UPIS Extremo Sur'],
    crucesVias: [
      'Límite Sur Distrital con Vías de Acceso',
      'Vía Periférica Sur con Acceso Principal',
      'Cruce Vía de Evitamiento Sur',
    ],
    colegios: ['PRONOEI El Progreso del Sur'],
    parques: ['Parque Comunal Extremo Sur'],
    lozas: ['Loza Deportiva Límite Sur', 'Campo Deportivo Periférico'],
    referenciasBases: 'Sector perimétrico limítrofe sur, garita de vigilancia e intercepción',
  },
};

// Normalizador y clasificador exacto para verificar y corregir asignaciones
export function correctSectorAssignment(
  currentSector: string,
  lugar = '',
  refe = '',
  observacion = ''
): { sector: string; comisaria: 'CIA BUENOS AIRES' | 'CIA VILLA MARIA'; zona: 'ZONA CENTRO' | 'ZONA NORTE' | 'ZONA SUR'; corregido: boolean } {
  const text = `${lugar} ${refe} ${observacion}`.toUpperCase();

  // Reglas específicas basadas en la tabla oficial:

  // Villa María S1VM a S7VM
  if (text.includes('PROGRESO DEL SUR') || text.includes('LIMITE TERRITORIAL') || text.includes('EXTREMO SUR')) {
    return { sector: 'S7VM', comisaria: 'CIA VILLA MARIA', zona: 'ZONA SUR', corregido: currentSector !== 'S7VM' };
  }
  if (text.includes('DOMUS') || text.includes('BRISAS DEL SUR') || text.includes('EL PINAR') || text.includes('CIRCUNVALACION')) {
    return { sector: 'S6VM', comisaria: 'CIA VILLA MARIA', zona: 'ZONA SUR', corregido: currentSector !== 'S6VM' };
  }
  if (text.includes('NUEVO PARAISO') || text.includes('OLIVOS DEL SUR') || text.includes('VILLA SUR')) {
    return { sector: 'S5VM', comisaria: 'CIA VILLA MARIA', zona: 'ZONA SUR', corregido: currentSector !== 'S5VM' };
  }
  if (text.includes('COSTA VERDE') || text.includes('MIRAMAR SUR') || text.includes('CONO SUR VILLA MARIA')) {
    return { sector: 'S4VM', comisaria: 'CIA VILLA MARIA', zona: 'ZONA SUR', corregido: currentSector !== 'S4VM' };
  }
  if (text.includes('2 DE OCTUBRE') || text.includes('DOS DE OCTUBRE') || text.includes('SAN PEDRO')) {
    return { sector: 'S3VM', comisaria: 'CIA VILLA MARIA', zona: 'ZONA CENTRO', corregido: currentSector !== 'S3VM' };
  }
  if (text.includes('PRADERAS') || text.includes('SOL DE CHIMBOTE') || text.includes('LOS INCAS')) {
    return { sector: 'S2VM', comisaria: 'CIA VILLA MARIA', zona: 'ZONA CENTRO', corregido: currentSector !== 'S2VM' };
  }
  if (text.includes('TRAPECIO') || text.includes('VILLA MARIA') || text.includes('BASE NORTE') || text.includes('CAMINO REAL CON PARDO')) {
    return { sector: 'S1VM', comisaria: 'CIA VILLA MARIA', zona: 'ZONA CENTRO', corregido: currentSector !== 'S1VM' };
  }

  // Buenos Aires S1BA a S9BA
  if (text.includes('TANGAY') || text.includes('MATEO GROSSO') || text.includes('CAMPIÑA')) {
    return { sector: 'S9BA', comisaria: 'CIA BUENOS AIRES', zona: 'ZONA NORTE', corregido: currentSector !== 'S9BA' };
  }
  if (text.includes('NUEVO AMANECER') || text.includes('CONSTRUCTORES') || text.includes('HERMOSA DEL SUR')) {
    return { sector: 'S8BA', comisaria: 'CIA BUENOS AIRES', zona: 'ZONA SUR', corregido: currentSector !== 'S8BA' };
  }
  if (text.includes('DELICIAS') || text.includes('VILLA SOL') || text.includes('EL TRIUNFO') || text.includes('LOS JARDINES')) {
    return { sector: 'S7BA', comisaria: 'CIA BUENOS AIRES', zona: 'ZONA SUR', corregido: currentSector !== 'S7BA' };
  }
  if (text.includes('LOS ANGELES') || text.includes('19 DE JULIO') || text.includes('AUSTRAL') || text.includes('BASE SUR')) {
    return { sector: 'S6BA', comisaria: 'CIA BUENOS AIRES', zona: 'ZONA SUR', corregido: currentSector !== 'S6BA' };
  }
  if (text.includes('UNIVERSIDAD NACIONAL DEL SANTA') || text.includes('UNS') || text.includes('LOS PINOS') || text.includes('BELLAVISTA') || text.includes('AGRARIA')) {
    return { sector: 'S5BA', comisaria: 'CIA BUENOS AIRES', zona: 'ZONA NORTE', corregido: currentSector !== 'S5BA' };
  }
  if (text.includes('SANTA ROSA') || text.includes('SAN FRANCISCO') || text.includes('LOS HEROES') || text.includes('AV. BRASIL')) {
    return { sector: 'S4BA', comisaria: 'CIA BUENOS AIRES', zona: 'ZONA SUR', corregido: currentSector !== 'S4BA' };
  }
  if (text.includes('GARATEA') || text.includes('SAN LUIS') || text.includes('SATELITE') || text.includes('AVIACION')) {
    return { sector: 'S3BA', comisaria: 'CIA BUENOS AIRES', zona: 'ZONA NORTE', corregido: currentSector !== 'S3BA' };
  }
  if (text.includes('MARIATEGUI') || text.includes('GARDENIAS') || text.includes('CASUARINAS') || text.includes('BELEN') || text.includes('CHASQUIS') || text.includes('PLAZA MAYOR')) {
    return { sector: 'S2BA', comisaria: 'CIA BUENOS AIRES', zona: 'ZONA CENTRO', corregido: currentSector !== 'S2BA' };
  }
  if (text.includes('PORTALES') || text.includes('ALAMOS') || text.includes('PALMERAS') || text.includes('ANCHOVETA') || text.includes('BASE OESTE')) {
    return { sector: 'S1BA', comisaria: 'CIA BUENOS AIRES', zona: 'ZONA CENTRO', corregido: currentSector !== 'S1BA' };
  }

  // Si ya tiene un sector oficial válido, conservarlo asegurando consistencia de comisaría y zona:
  const normalizedSector = currentSector.toUpperCase().trim();
  if (SECTORES_OFICIALES[normalizedSector]) {
    const s = SECTORES_OFICIALES[normalizedSector];
    return { sector: s.id, comisaria: s.comisaria, zona: s.zona, corregido: false };
  }

  // Default a S1BA
  return { sector: 'S1BA', comisaria: 'CIA BUENOS AIRES', zona: 'ZONA CENTRO', corregido: true };
}
