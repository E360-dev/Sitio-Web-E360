// Descarga los artículos publicados de Supabase y los deja listos para que
// Vite los empaquete, y regenera el sitemap.
//
// Se ejecuta ANTES de `vite build`.
//
// Por qué se empaqueta el contenido en lugar de pedirlo desde el navegador:
// las páginas se prerenderizan a HTML, y si el cliente pidiera los datos al
// cargar, su primera renderización estaría vacía y React descartaría el HTML
// prerenderizado por discrepancia de hidratación. Empaquetándolo, servidor y
// cliente renderizan exactamente lo mismo. De paso, el sitio público deja de
// hacer peticiones a Supabase.

import { createClient } from '@supabase/supabase-js';
import { writeFile, mkdir } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const RAIZ = resolve(dirname(fileURLToPath(import.meta.url)), '..');
import { construirSitemap } from './sitemap.mjs';

const SUPABASE_URL =
  process.env.SUPABASE_URL || 'https://crxtzmykprgbgkdbqccd.supabase.co';
const SUPABASE_ANON_KEY =
  process.env.SUPABASE_ANON_KEY ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNyeHR6bXlrcHJnYmdrZGJxY2NkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI2ODI1ODQsImV4cCI6MjA2ODI1ODU4NH0.qfVccp-NdiDSLSWW_yCl1KL9M7Ttel_rzfG27ztuZNA';

import { RUTAS_ESTATICAS } from './rutas.mjs';


async function descargarArticulos() {
  const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

  const { data, error } = await supabase
    .from('articulos')
    .select('slug, titulo, resumen, contenido_html, portada_url, autor, fecha_publicacion, actualizado_en')
    .eq('publicado', true)
    .order('fecha_publicacion', { ascending: false });

  if (error) {
    // Fallar aquí es preferible a desplegar un sitio sin artículos: si la
    // consulta falla, el blog aparecería vacío sin que nadie se enterase.
    console.error('ERROR: no se pudieron descargar los artículos de Supabase.');
    console.error(error.message);
    process.exit(1);
  }

  return data ?? [];
}

async function main() {
  const articulos = await descargarArticulos();

  await mkdir(resolve(RAIZ, 'src/contenido'), { recursive: true });
  await writeFile(
    resolve(RAIZ, 'src/contenido/articulos.json'),
    JSON.stringify(articulos, null, 2),
    'utf8'
  );

  // Se escribe en public/ para que Vite lo copie al dist con el resto.
  await writeFile(resolve(RAIZ, 'public/sitemap.xml'), construirSitemap(articulos), 'utf8');

  console.log(`Artículos publicados: ${articulos.length}`);
  console.log(`Sitemap: ${RUTAS_ESTATICAS.length + articulos.length} URLs`);
  for (const a of articulos) console.log(`  · /comunica/${a.slug}`);
}

main();
