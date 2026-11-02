// Se ejecuta en el navegador tanto al prerenderizar como al verificar el build.
export function validarSeoPublico({ ruta, sitio = 'https://e360.pro' }) {
  const errores = [];
  const unico = (selector) => {
    const etiquetas = [...document.head.querySelectorAll(selector)];
    if (etiquetas.length !== 1) errores.push(`${selector}: ${etiquetas.length} etiquetas`);
    return etiquetas[0];
  };
  const titulo = unico('title');
  const descripcion = unico('meta[name="description"]');
  const canonica = unico('link[rel="canonical"]');
  const esperada = new URL(ruta, sitio).href;
  if (!titulo?.textContent.trim()) errores.push('Título vacío');
  if (!descripcion?.content.trim()) errores.push('Descripción vacía');
  if (canonica?.href !== esperada) errores.push(`Canónica incorrecta: ${canonica?.href}`);
  if ([...document.querySelectorAll('meta[name="robots"]')].some((m) => /noindex/i.test(m.content))) {
    errores.push('Página pública con noindex');
  }
  const claves = new Set();
  for (const meta of document.head.querySelectorAll('meta[name], meta[property]')) {
    const clave = meta.getAttribute('name') || meta.getAttribute('property');
    if (claves.has(clave)) errores.push(`Meta duplicada: ${clave}`);
    claves.add(clave);
  }
  if (document.querySelectorAll('h1').length !== 1 || !document.querySelector('h1')?.textContent.trim()) {
    errores.push('Debe existir un único h1 con contenido');
  }
  if ((document.getElementById('root')?.textContent.trim().length || 0) < 150) errores.push('Contenido vacío o incompleto');
  if (document.getElementById('preloader')) errores.push('Preloader en HTML publicado');
  return { errores, titulo: titulo?.textContent.trim(), descripcion: descripcion?.content, canonica: canonica?.href };
}
