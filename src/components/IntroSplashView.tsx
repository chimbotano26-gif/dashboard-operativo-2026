import React, { useState, useEffect } from 'react';
import { IntroSplashView } from './components/IntroSplashView';
import AnalyticsDashboardView from './components/AnalyticsDashboardView';
import { IncidentRecord } from '../types'; // o la ruta donde tengas tus tipos

function App() {
  const [showIntro, setShowIntro] = useState<boolean>(true);
  const [records, setRecords] = useState<IncidentRecord[]>([]);
  const [isDataLoaded, setIsDataLoaded] = useState<boolean>(false);

  // Aquí simulas o ejecutas tu carga de datos real desde Supabase en background
  useEffect(() => {
    const fetchRecords = async () => {
      try {
        // AQUí VA TU LLAMADA REAL A SUPABASE QUE YA USAS:
        // const { data } = await supabase.from('tu_tabla').select('*');
        // setRecords(data || []);
        
        // Simulación de carga (reemplaza esto con tu llamada real)
        setTimeout(() => {
          // setRecords(tusDatosReales);
          setIsDataLoaded(true); // Se marca como cargado sin laguear la web
        }, 1200);
      } catch (error) {
        console.error("Error al cargar datos", error);
        setIsDataLoaded(true);
      }
    };

    fetchRecords();
  }, []);

  return (
    <>
      {/* Si showIntro es true, muestra la animación y precarga en background */}
      {showIntro ? (
        <IntroSplashView
          onEnterDashboard={() => setShowIntro(false)} // Al hacer clic en el escudo, entra al panel
          isDataLoaded={isDataLoaded}
          totalRecords={records.length}
        />
      ) : (
        /* Tu vista principal intacta, con el mapa 3D, tablas y estadísticas */
        <AnalyticsDashboardView records={records} />
      )}
    </>
  );
}

export default App;
