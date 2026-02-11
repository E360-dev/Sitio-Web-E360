import { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';

function ScrollToAnchor() {
  const location = useLocation();
  const lastHash = useRef('');

  useEffect(() => {
    if (location.hash) {
      lastHash.current = location.hash.slice(1);
    }

    if (lastHash.current && document.getElementById(lastHash.current)) {
      const element = document.getElementById(lastHash.current);
      if (element) {
        // Espera un breve momento para asegurar que todo el contenido de la página se haya renderizado.
        setTimeout(() => {
          element.scrollIntoView({ behavior: 'smooth', block: 'start' });
          lastHash.current = ''; // Limpia el hash después de usarlo.
        }, 100);
      }
    }
  }, [location]);

  return null;
}

export default ScrollToAnchor;
