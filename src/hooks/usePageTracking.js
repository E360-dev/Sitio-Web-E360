// src/hooks/usePageTracking.js
//
// El snippet de gtag en index.html corre con send_page_view: false, porque en
// una SPA solo registraría la primera carga. Este hook envía un page_view en
// cada cambio de ruta de React Router.

import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

export default function usePageTracking() {
  const location = useLocation();

  useEffect(() => {
    // gtag no existe si el script de GA fue bloqueado (adblockers, red caída).
    if (typeof window.gtag !== 'function') return;

    window.gtag('event', 'page_view', {
      page_path: location.pathname + location.search,
      page_location: window.location.href,
      page_title: document.title,
    });
  }, [location]);
}
