import { INITIAL_INCIDENTS } from './data/mockData'; // Asegúrate de tener este import o usa INITIAL_PATROL_UNITS

// DASHBOARD INTERNO
function DashboardInner() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('ANALITICA');
  const [records, setRecords] = useState<IncidentRecord[]>(() => {
    // Intentar recuperar de localStorage si existe previamente
    const saved = localStorage.getItem('sicep_records_backup');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      } catch (e) {
        // Ignorar error de parseo
      }
    }
    return [];
  });
  const [loading, setLoading] = useState<boolean>(true);
  const [isCustomDataLoaded, setIsCustomDataLoaded] = useState<boolean>(false);
  const [lastSavedAt, setLastSavedAt] = useState<string | null>(null);

  useEffect(() => {
    async function loadData() {
      try {
        const data = await fetchAllRegistrosFromSupabase();
        if (data && data.length > 0) {
          setRecords(data);
          localStorage.setItem('sicep_records_backup', JSON.stringify(data));
        }
      } catch (err) {
        console.error("Error cargando registros de Supabase", err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const handleDataImported = (newRecords: IncidentRecord[]) => {
    setRecords(newRecords);
    setIsCustomDataLoaded(true);
    setLastSavedAt(new Date().toLocaleTimeString());
    localStorage.setItem('sicep_records_backup', JSON.stringify(newRecords));
  };

  const handleResetToDefault = async () => {
    setLoading(true);
    const data = await fetchAllRegistrosFromSupabase();
    if (data && data.length > 0) {
      setRecords(data);
      localStorage.setItem('sicep_records_backup', JSON.stringify(data));
    }
    setIsCustomDataLoaded(false);
    setLoading(false);
  };

  const handleDeleteRecord = (id: string) => {
    const updated = records.filter((r) => r.id !== id);
    setRecords(updated);
    localStorage.setItem('sicep_records_backup', JSON.stringify(updated));
  };
