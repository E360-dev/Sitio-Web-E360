import { RUTAS_ESTATICAS } from './rutas.mjs';

const escapar = (texto) => String(texto).replace(/[<>&"']/g, (c) => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;', '"': '&quot;', "'": '&apos;' })[c]);

export function construirSitemap(articulos) {
  const entradas = [
    // Sin una fecha editorial verificable es mejor omitir lastmod que inventarla.
    ...RUTAS_ESTATICAS.map(({ ruta, prioridad, frecuencia }) => ({ ruta, prioridad, frecuencia })),
    ...articulos.map((a) => ({
      ruta: `/comunica/${a.slug}`,
      fecha: a.actualizado_en || a.fecha_publicacion,
      frecuencia: 'yearly', prioridad: '0.7',
    })),
  ];
  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${entradas.map((e) => `  <url>
    <loc>${escapar(`https://e360.pro${e.ruta}`)}</loc>${e.fecha ? `
    <lastmod>${escapar(e.fecha.slice(0, 10))}</lastmod>` : ''}
    <changefreq>${e.frecuencia}</changefreq>
    <priority>${e.prioridad}</priority>
  </url>`).join('\n')}
</urlset>
`;
}
