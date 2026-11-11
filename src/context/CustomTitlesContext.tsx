import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

interface CustomTitlesContextType {
  titles: Record<string, string>;
  getTitle: (key: string, defaultValue: string) => string;
  setTitle: (key: string, value: string) => void;
  resetAllTitles: () => void;
  saveTitlesExplicitly: () => boolean;
  isEditingGlobal: boolean;
  setIsEditingGlobal: (val: boolean) => void;
  hasCustomChanges: boolean;
}

const STORAGE_KEY = 'serenazgo_custom_ui_titles_v2';

const defaultPresetTitles: Record<string, string> = {
  header_title: 'SUB - GERENCIA DE SERENAZGO',
  header_subtitle: 'MUNICIPALIDAD DISTRITAL DE NUEVO CHIMBOTE • CENTRAL DE MONITOREO Y OPERATIVOS',
  kpi_total_label: 'TOTAL ATENCIONES REGISTRADAS',
  kpi_turno_label: 'TURNO CON MAYOR ACTIVIDAD',
  kpi_sector_label: 'SECTOR CON MAYOR INCIDENCIA',
  kpi_tiempo_label: 'PROMEDIO TIEMPO DE RESPUESTA',
  chart_sectores_title: 'ATENCIONES POR SUBSECTORES DE NUEVO CHIMBOTE',
  chart_sectores_subtitle: 'Jurisdicción oficial Comisaría Buenos Aires & Comisaría Villa María',
  chart_comparativo_title: 'COMPARATIVO HISTÓRICO MES A MES (2025 vs 2026)',
  chart_comparativo_subtitle: 'Consolidado oficial de intervenciones registradas en el distrito',
  chart_turnos_title: 'DISTRIBUCIÓN DE INTERVENCIONES POR TURNOS',
  chart_turnos_subtitle: 'Mañana (07:00 - 15:00) | Tarde (15:00 - 23:00) | Noche (23:00 - 07:00)',
  chart_dias_title: 'DISTRIBUCIÓN SEMANAL DE ATENCIONES',
  chart_dias_subtitle: 'Lunes a Domingo • Densidad operativa por día de la semana',
  chart_comisarias_title: 'ATENCIONES POR JURISDICCIÓN POLICIAL',
  chart_comisarias_subtitle: 'Comisaría Buenos Aires vs Comisaría Villa María',
  operativos_section_title: 'OPERATIVOS SEMANALES PROGRAMADOS DE SERENAZGO',
  operativos_section_subtitle: 'Despliegue táctico preventivo, disuasivo y conjunto con la PNP',
  map_tactical_title: 'RADAR GEOESPACIAL & MAPA TÁCTICO EN VIVO',
};

const CustomTitlesContext = createContext<CustomTitlesContextType>({
  titles: defaultPresetTitles,
  getTitle: (key, def) => def,
  setTitle: () => {},
  resetAllTitles: () => {},
  saveTitlesExplicitly: () => true,
  isEditingGlobal: false,
  setIsEditingGlobal: () => {},
  hasCustomChanges: false,
});

export const CustomTitlesProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [titles, setTitles] = useState<Record<string, string>>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        return { ...defaultPresetTitles, ...JSON.parse(saved) };
      }
    } catch {
      // fallback
    }
    return defaultPresetTitles;
  });

  const [isEditingGlobal, setIsEditingGlobal] = useState(false);

  // Auto-sync
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(titles));
    } catch (e) {
      console.error('Error saving custom titles to localStorage', e);
    }
  }, [titles]);

  const hasCustomChanges = Object.keys(titles).some(
    (key) => titles[key] !== defaultPresetTitles[key]
  );

  const getTitle = useCallback((key: string, defaultValue: string): string => {
    return titles[key] || defaultValue;
  }, [titles]);

  const setTitle = useCallback((key: string, value: string) => {
    setTitles((prev) => ({
      ...prev,
      [key]: value,
    }));
  }, []);

  const saveTitlesExplicitly = useCallback((): boolean => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(titles));
      return true;
    } catch (e) {
      console.error('Failed to save titles', e);
      return false;
    }
  }, [titles]);

  const resetAllTitles = useCallback(() => {
    setTitles(defaultPresetTitles);
    localStorage.removeItem(STORAGE_KEY);
  }, []);

  return (
    <CustomTitlesContext.Provider
      value={{
        titles,
        getTitle,
        setTitle,
        resetAllTitles,
        saveTitlesExplicitly,
        isEditingGlobal,
        setIsEditingGlobal,
        hasCustomChanges,
      }}
    >
      {children}
    </CustomTitlesContext.Provider>
  );
};

export const useCustomTitles = () => useContext(CustomTitlesContext);
