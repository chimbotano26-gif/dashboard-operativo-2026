import { useState, useEffect } from 'react';

export interface DashboardTitles {
  comisaria: string;
  comisariaSub?: string;
  turno: string;
  turnoSub?: string;
  zona: string;
  zonaSub?: string;
  dias: string;
  diasSub?: string;
  comparativoTurno: string;
  comparativoTurnoSub?: string;
  comparativoMes: string;
  comparativoMesSub?: string;
  sector: string;
  sectorSub?: string;
  kpiTotal: string;
  kpiSector: string;
  kpiSectorCritico: string;
  kpiTurnoCritico: string;
  mapaTitulo: string;
  cat1Title?: string;
  cat1Sub?: string;
  cat2Title?: string;
  cat2Sub?: string;
  cat3Title?: string;
  cat3Sub?: string;
  matrixTitle?: string;
  matrixSub?: string;
}

export const DEFAULT_TITLES: DashboardTitles = {
  comisaria: 'ATENCIONES POR COMISARÍA',
  comisariaSub: 'jurisdicción policial PNP',
  turno: 'ATENCIONES POR TURNO',
  turnoSub: 'repartición horaria 24 horas continuas',
  zona: 'MAYOR ATENCIONES POR ZONA / SUBSECTOR',
  zonaSub: '16 subsectores oficiales ordenados por frecuencia',
  dias: 'ATENCIONES POR DÍA DE SEMANA',
  diasSub: 'distribución semanal y pico operativo',
  comparativoTurno: 'COMPARATIVO POR TURNO / HORARIO',
  comparativoTurnoSub: 'repartición horaria 24 horas continuas',
  comparativoMes: 'COMPARATIVO MES POR MES (AÑOS 2025 - 2026)',
  comparativoMesSub: 'Lectura rápida compacta Enero - Setiembre',
  sector: 'ATENCIONES POR SECTOR',
  sectorSub: 'tubos volumétricos calibrados',
  kpiTotal: 'TOTAL ATENCIONES 2026',
  kpiSector: 'ATENCIONES POR SECTOR',
  kpiSectorCritico: 'SECTOR CRÍTICO',
  kpiTurnoCritico: 'TURNO CRÍTICO',
  mapaTitulo: 'MAPA TÁCTICO & CALOR GEOESPACIAL - NUEVO CHIMBOTE',
  cat1Title: '1. DIMENSIÓN OPERATIVA Y POLICIAL',
  cat1Sub: 'Jurisdicción de Comisarías y Repartición de Guardias en 24 Horas',
  cat2Title: '2. DIMENSIÓN GEOGRÁFICA Y TERRITORIAL',
  cat2Sub: 'Análisis Micro y Macro de Sectores y Cuadrantes',
  cat3Title: '3. DIMENSIÓN TEMPORAL Y EVOLUCIÓN ANUAL',
  cat3Sub: 'Comparativo Mensual, Tendencia Interanual y Frecuencia Diaria',
  matrixTitle: 'MAPA DE CALOR MATRICIAL • ANÁLISIS POR SUBSECTOR',
  matrixSub: 'Matriz territorial condicional vinculada a Observación y Columna 1 sin necesidad de GPS',
};

const STORAGE_KEY = 'serenazgo_dashboard_custom_titles';

export function useEditableTitles() {
  const [titles, setTitles] = useState<DashboardTitles>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        return { ...DEFAULT_TITLES, ...parsed };
      }
    } catch {
      // fallback
    }
    return DEFAULT_TITLES;
  });

  const isCustomTitles = Object.keys(DEFAULT_TITLES).some(
    (key) => titles[key as keyof DashboardTitles] !== DEFAULT_TITLES[key as keyof DashboardTitles]
  );

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(titles));
    } catch {
      // ignore
    }
  }, [titles]);

  const updateTitle = (key: keyof DashboardTitles, value: string) => {
    setTitles((prev) => ({ ...prev, [key]: value }));
  };

  const resetTitles = () => {
    setTitles(DEFAULT_TITLES);
    localStorage.removeItem(STORAGE_KEY);
  };

  const saveTitlesToDisk = () => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(titles));
      return true;
    } catch {
      return false;
    }
  };

  return { titles, updateTitle, resetTitles, saveTitlesToDisk, isCustomTitles };
}
