// Cargador oficial de Google Maps Platform API para Serenazgo Nuevo Chimbote
export const GOOGLE_MAPS_API_KEY =
  (import.meta.env.VITE_GOOGLE_MAPS_API_KEY as string) || 'AIzaSyAnCFMWnSmgS36tg813XMYgt6sXkBe-iJQ';

export const GMP_SOLUTION_ID = 'gmp_git_agentskills_v1';

let googleMapsPromise: Promise<typeof google> | null = null;

interface WindowWithGmaps extends Window {
  google?: typeof google;
  __gmapsReady?: boolean;
  __gmapsCallbacks?: Array<(g: typeof google) => void>;
  initGoogleMapsOfficial?: () => void;
  gm_authFailure?: () => void;
}

export function loadGoogleMaps(): Promise<typeof google> {
  if (typeof window === 'undefined') {
    return Promise.reject(new Error('Window is undefined'));
  }

  const win = window as unknown as WindowWithGmaps;

  // 1. Si ya está cargado con el constructor Map disponible
  if (win.google?.maps && typeof win.google.maps.Map === 'function') {
    return Promise.resolve(win.google);
  }

  // 2. Si no hay clave de API configurada, no intentar cargar script con clave vacía
  if (!GOOGLE_MAPS_API_KEY) {
    return Promise.reject(
      new Error(
        'Clave de Google Maps Platform no configurada. Utilice el Radar GIS Leaflet integrado o configure una clave válida.'
      )
    );
  }

  if (googleMapsPromise) {
    return googleMapsPromise;
  }

  googleMapsPromise = new Promise<typeof google>((resolve, reject) => {
    let isSettled = false;

    const finalize = async () => {
      if (isSettled) return;
      if (!win.google?.maps) return;

      // Si Google Maps tiene importLibrary, asegurar mapas y visualización
      if (typeof win.google.maps.importLibrary === 'function') {
        try {
          await win.google.maps.importLibrary('maps');
          await win.google.maps.importLibrary('visualization');
        } catch (e) {
          console.warn('Google Maps importLibrary aviso:', e);
        }
      }

      if (typeof win.google.maps.Map === 'function') {
        isSettled = true;
        win.__gmapsReady = true;
        resolve(win.google);
      }
    };

    // Interceptar fallos de autenticación de Google Maps de forma no bloqueante
    win.gm_authFailure = () => {
      console.warn('Google Maps Platform: Fallo de autenticación o cuota en clave API.');
      if (!isSettled) {
        isSettled = true;
        reject(new Error('Fallo de autenticación en Google Maps. Puede continuar con el Radar GIS Leaflet.'));
      }
    };

    // Callback global invocado por la API de Google Maps
    win.initGoogleMapsOfficial = () => {
      finalize().catch((err) => {
        if (!isSettled) {
          googleMapsPromise = null;
          isSettled = true;
          reject(err);
        }
      });
    };

    const existingScript = document.getElementById('google-maps-official-script') as HTMLScriptElement | null;
    if (existingScript) {
      if (win.google?.maps && typeof win.google.maps.Map === 'function') {
        resolve(win.google);
        return;
      }
      // If script is already attached, listen to its onload
      existingScript.addEventListener('load', () => {
        finalize().catch(() => {});
      });
      return;
    }

    const script = document.createElement('script');
    script.id = 'google-maps-official-script';
    script.type = 'text/javascript';
    script.src = `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(
      GOOGLE_MAPS_API_KEY
    )}&libraries=visualization,places,geometry&callback=initGoogleMapsOfficial&v=weekly`;
    script.async = true;
    script.defer = true;
    script.onerror = () => {
      googleMapsPromise = null;
      if (!isSettled) {
        isSettled = true;
        reject(new Error('Error de red al conectar con Google Maps Platform API.'));
      }
    };

    // Timeout de seguridad amplio
    const timeoutId = setTimeout(() => {
      if (!isSettled) {
        if (win.google?.maps && typeof win.google.maps.Map === 'function') {
          isSettled = true;
          resolve(win.google);
        } else {
          googleMapsPromise = null;
          isSettled = true;
          reject(new Error('Tiempo de espera agotado al conectar con Google Maps Platform.'));
        }
      }
    }, 12000);

    script.onload = () => {
      setTimeout(() => {
        finalize().then(() => {
          if (isSettled) {
            clearTimeout(timeoutId);
          }
        });
      }, 300);
    };

    document.head.appendChild(script);
  });

  return googleMapsPromise;
}

// Estilo táctico oscuro militar / comando para Google Maps
export const GOOGLE_MAPS_DARK_TACTICAL_STYLE: google.maps.MapTypeStyle[] = [
  { elementType: 'geometry', stylers: [{ color: '#061324' }] },
  { elementType: 'labels.text.stroke', stylers: [{ color: '#061324' }, { weight: 3 }] },
  { elementType: 'labels.text.fill', stylers: [{ color: '#7ec0ee' }] },
  {
    featureType: 'administrative.locality',
    elementType: 'labels.text.fill',
    stylers: [{ color: '#38bdf8' }, { weight: 1.5 }],
  },
  {
    featureType: 'administrative.neighborhood',
    elementType: 'labels.text.fill',
    stylers: [{ color: '#67e8f9' }],
  },
  {
    featureType: 'poi',
    elementType: 'labels.text.fill',
    stylers: [{ color: '#38bdf8' }],
  },
  {
    featureType: 'poi.park',
    elementType: 'geometry',
    stylers: [{ color: '#082636' }],
  },
  {
    featureType: 'poi.park',
    elementType: 'labels.text.fill',
    stylers: [{ color: '#34d399' }],
  },
  {
    featureType: 'road',
    elementType: 'geometry',
    stylers: [{ color: '#132d4b' }],
  },
  {
    featureType: 'road',
    elementType: 'geometry.stroke',
    stylers: [{ color: '#091c33' }],
  },
  {
    featureType: 'road',
    elementType: 'labels.text.fill',
    stylers: [{ color: '#93c5fd' }],
  },
  {
    featureType: 'road.highway',
    elementType: 'geometry',
    stylers: [{ color: '#1d4872' }],
  },
  {
    featureType: 'road.highway',
    elementType: 'geometry.stroke',
    stylers: [{ color: '#0d2843' }],
  },
  {
    featureType: 'road.highway',
    elementType: 'labels.text.fill',
    stylers: [{ color: '#facc15' }],
  },
  {
    featureType: 'transit',
    elementType: 'geometry',
    stylers: [{ color: '#0e2644' }],
  },
  {
    featureType: 'transit.station',
    elementType: 'labels.text.fill',
    stylers: [{ color: '#38bdf8' }],
  },
  {
    featureType: 'water',
    elementType: 'geometry',
    stylers: [{ color: '#030d1a' }],
  },
  {
    featureType: 'water',
    elementType: 'labels.text.fill',
    stylers: [{ color: '#0284c7' }],
  },
  {
    featureType: 'water',
    elementType: 'labels.text.stroke',
    stylers: [{ color: '#030d1a' }],
  },
];

// Gradiente Termográfico Fluid Dynamics (según referencia visual exacta: centro blanco incandescente, bordes amarillo, naranja, rojo, cian)
export const THERMOGRAPHIC_GRADIENT = [
  'rgba(0, 0, 0, 0)',
  'rgba(0, 80, 255, 0.4)', // Azul profundo exterior
  'rgba(0, 210, 255, 0.75)', // Cian eléctrico
  'rgba(0, 255, 170, 0.85)', // Verde-cian térmico
  'rgba(70, 255, 0, 0.9)', // Verde flúor
  'rgba(215, 255, 0, 0.95)', // Lima-amarillo
  'rgba(255, 235, 0, 1)', // Amarillo brillante
  'rgba(255, 145, 0, 1)', // Naranja vivo
  'rgba(255, 55, 0, 1)', // Rojo caliente
  'rgba(255, 0, 75, 1)', // Carmesí intenso
  'rgba(255, 255, 255, 1)', // Núcleo blanco incandescente (>500 incidents)
];
