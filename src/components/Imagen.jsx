// src/components/Imagen.jsx
//
// Sirve la versión WebP de una imagen de public/img.
//
// Por qué NO usa <picture> con respaldo: envolver la <img> obligaba a poner
// display:contents en el <picture> para no romper las clases h-full y el
// posicionamiento absoluto que ya tenían las imágenes. WebP tiene soporte
// universal desde 2020 (Chrome, Firefox, Safari 14+, Edge), así que ese
// envoltorio añadía complejidad a cambio de un respaldo que nadie usa.
//
// Requisito: la imagen debe tener su .webp generado en public/img.

export const rutaWebp = (ruta) => ruta.replace(/\.(png|jpe?g)$/i, '.webp');

export default function Imagen({ src, alt, className, width, height, lazy = true, ...resto }) {
  return (
    <img
      src={rutaWebp(src)}
      alt={alt}
      className={className}
      width={width}
      height={height}
      loading={lazy ? 'lazy' : 'eager'}
      decoding="async"
      {...resto}
    />
  );
}

// Equivalente en CSS para los fondos declarados en estilo inline. Aquí sí se
// conserva el respaldo: image-set() no interfiere con nada.
export const fondoWebp = (ruta) =>
  `image-set(url("${rutaWebp(ruta)}") type("image/webp"), url("${ruta}") type("image/jpeg"))`;
