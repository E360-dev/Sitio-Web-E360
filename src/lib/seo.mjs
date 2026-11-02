export const SITE_URL = 'https://e360.pro';

// Reutilizar la cabecera prerenderizada evita duplicados al arrancar React.
export function actualizarCabecera(documento, { title, description, path, image, noindex }) {
  function etiqueta(selector, tag, atributos, contenido) {
    const existentes = [...documento.head.querySelectorAll(selector)];
    if (contenido == null || contenido === '') {
      existentes.forEach((elemento) => elemento.remove());
      return;
    }
    const elemento = existentes.shift() || documento.createElement(tag);
    existentes.forEach((duplicado) => duplicado.remove());
    for (const [nombre, valor] of Object.entries(atributos)) elemento.setAttribute(nombre, valor);
    if (tag === 'title') elemento.textContent = contenido;
    else elemento.setAttribute(tag === 'link' ? 'href' : 'content', contenido);
    if (!elemento.isConnected) documento.head.append(elemento);
  }

  const url = path == null ? undefined : new URL(path || '/', SITE_URL).href;
  const imagen = image && !noindex ? new URL(image, SITE_URL).href : undefined;
  etiqueta('title', 'title', {}, title);
  etiqueta('meta[name="description"]', 'meta', { name: 'description' }, description);
  etiqueta('link[rel="canonical"]', 'link', { rel: 'canonical' }, url);
  etiqueta('meta[name="robots"]', 'meta', { name: 'robots' }, noindex ? 'noindex, nofollow' : undefined);
  const sociales = {
    'og:title': title, 'og:description': description, 'og:url': url,
    'og:image': imagen, 'og:type': 'website', 'og:locale': 'es_MX', 'og:site_name': 'E360',
  };
  for (const [property, contenido] of Object.entries(sociales)) {
    etiqueta(`meta[property="${property}"]`, 'meta', { property }, contenido);
  }
  for (const [name, contenido] of Object.entries({
    'twitter:card': imagen ? 'summary_large_image' : undefined,
    'twitter:title': title, 'twitter:description': description, 'twitter:image': imagen,
  })) etiqueta(`meta[name="${name}"]`, 'meta', { name }, contenido);
  documento.head.dataset.seoPath = path ?? 'noindex';
}
