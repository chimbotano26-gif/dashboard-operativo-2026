import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import 'leaflet/dist/leaflet.css';
import './index.css';

// Guard against third-party cross-origin script errors (e.g., Google Maps CDN) from bubbling to unhandled errors
if (typeof window !== 'undefined') {
  window.addEventListener('error', (event) => {
    if (
      event.message === 'Script error.' ||
      (typeof event.message === 'string' && event.message.includes('Script error')) ||
      (event.filename && event.filename.includes('maps.googleapis.com'))
    ) {
      console.warn('[Handled External Script Warning]:', event.message, event.filename);
      event.preventDefault();
      event.stopImmediatePropagation?.();
      return true;
    }
  });

  window.addEventListener('unhandledrejection', (event) => {
    const reasonStr = String(event.reason || '');
    if (
      reasonStr.includes('Google Maps') ||
      reasonStr.includes('Script error') ||
      (event.reason?.message && String(event.reason.message).includes('Google Maps'))
    ) {
      console.warn('[Handled External Script Rejection]:', event.reason);
      event.preventDefault();
      return true;
    }
  });
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
