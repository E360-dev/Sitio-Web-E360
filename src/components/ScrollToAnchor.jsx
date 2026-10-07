import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

// Cuánto se sigue buscando el destino del ancla. Las páginas se cargan en
// diferido, así que en la carga directa de /servicios#bps el bloque aún no existe
// cuando cambia la ruta.
const ESPERA_MAXIMA_MS = 3000;

// Desplaza la vista al elemento del ancla de la URL. La compensación del
// encabezado fijo la da `scroll-margin-top` en style.css.
//
// Un cambio de ruta con `state.sinDesplazar` (p. ej. cambiar de pestaña en
// Servicios) actualiza el ancla sin mover la vista.
//
// En la carga directa (un enlace del one pager) el salto es inmediato: una
// animación larga sobre una página que aún termina de montarse es frágil. Dentro
// del sitio el desplazamiento es suave.
function ScrollToAnchor() {
  const location = useLocation();

  useEffect(() => {
    // React Router da la clave 'default' solo a la entrada con la que se abrió el sitio.
    const esPrimeraCarga = location.key === 'default';
    const id = decodeURIComponent(location.hash.slice(1));
    if (!id || location.state?.sinDesplazar) return;

    let cuadro;
    const limite = performance.now() + ESPERA_MAXIMA_MS;

    const buscar = () => {
      const elemento = document.getElementById(id);
      if (elemento) {
        elemento.scrollIntoView({ behavior: esPrimeraCarga ? 'auto' : 'smooth', block: 'start' });
      } else if (performance.now() < limite) {
        cuadro = requestAnimationFrame(buscar);
      }
    };
    cuadro = requestAnimationFrame(buscar);

    return () => cancelAnimationFrame(cuadro);
  }, [location]);

  return null;
}

export default ScrollToAnchor;
