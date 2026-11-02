// Genera HTML estático de cada ruta pública a partir del `dist` ya compilado.
//
// Se ejecuta DESPUÉS de `vite build`.
//
// Sin esto, el contenido solo existe tras ejecutar JavaScript: Google lo indexa
// tarde y mal, y LinkedIn —que no ejecuta JavaScript— muestra una tarjeta vacía
// al compartir un artículo.
//
// La salida es `dist/<ruta>/index.html`. Esa forma encaja con el .htaccess sin
// tocarlo: su regla `RewriteCond %{REQUEST_FILENAME} -d` detecta el directorio
// y Apache sirve el index.html de dentro; lo que no existe sigue cayendo a la SPA.

import { createServer } from 'node:http';
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { dirname, resolve, join, extname } from 'node:path';
import { fileURLToPath } from 'node:url';
import puppeteer from 'puppeteer';
import { RUTAS_ESTATICAS } from './rutas.mjs';
import { validarSeoPublico } from './seo-validacion.mjs';

const RAIZ = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const DIST = resolve(RAIZ, 'dist');
const PUERTO = 4179;

const TIPOS = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'application/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.webp': 'image/webp',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.mp4': 'video/mp4',
  '.xml': 'application/xml',
  '.txt': 'text/plain',
  '.woff2': 'font/woff2',
};

// Servidor estático mínimo que imita el .htaccess: si el archivo existe lo
// sirve, y si no devuelve index.html para que React Router resuelva la ruta.
function levantarServidor(esqueletoOriginal) {
  const servidor = createServer(async (req, res) => {
    const ruta = decodeURIComponent(new URL(req.url, 'http://localhost').pathname);
    const archivo = join(DIST, ruta);

    // El esqueleto se sirve DESDE MEMORIA, no desde dist/index.html: ese archivo
    // se sobrescribe al prerenderizar la home, y si se sirviera desde disco, las
    // rutas siguientes heredarían los metadatos de la portada.
    if (!existsSync(archivo) || !extname(archivo)) {
      res.writeHead(200, { 'Content-Type': TIPOS['.html'] });
      res.end(esqueletoOriginal);
      return;
    }

    try {
      const contenido = await readFile(archivo);
      res.writeHead(200, { 'Content-Type': TIPOS[extname(archivo)] || 'application/octet-stream' });
      res.end(contenido);
    } catch {
      res.writeHead(404);
      res.end('no encontrado');
    }
  });

  return new Promise((ok) => servidor.listen(PUERTO, () => ok(servidor)));
}

async function main() {
  const articulos = JSON.parse(
    await readFile(resolve(RAIZ, 'src/contenido/articulos.json'), 'utf8')
  );

  const rutas = [
    ...RUTAS_ESTATICAS.map((r) => r.ruta),
    ...articulos.map((a) => `/comunica/${a.slug}`),
  ];

  // Se guarda el esqueleto ANTES de prerenderizar nada.
  const esqueletoOriginal = await readFile(join(DIST, 'index.html'), 'utf8');
  const servidor = await levantarServidor(esqueletoOriginal);
  const navegador = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-dev-shm-usage'],
  });

  let generadas = 0;

  try {
    for (const ruta of rutas) {
      const pagina = await navegador.newPage();

      // Los videos del hero pesan megabytes y no aportan nada al HTML.
      await pagina.setRequestInterception(true);
      pagina.on('request', (peticion) => {
        const tipo = peticion.resourceType();
        if (tipo === 'media' || tipo === 'font') peticion.abort();
        else peticion.continue();
      });

      await pagina.goto(`http://localhost:${PUERTO}${ruta}`, {
        waitUntil: 'networkidle0',
        timeout: 30000,
      });

      // El preloader tapa la página durante sus primeros 600 ms: si se captura
      // antes, el HTML publicado sería una pantalla negra con el logo.
      await pagina.waitForFunction(() => !document.getElementById('preloader'), {
        timeout: 10000,
      });

      await pagina.waitForFunction((rutaActual) => document.head.dataset.seoPath === rutaActual, {}, ruta);
      const { errores } = await pagina.evaluate(validarSeoPublico, { ruta });
      if (errores.length) throw new Error(`${ruta}: ${errores.join('; ')}`);

      const html = await pagina.content();

      // Comprobación de humo: si no hay <h1>, algo falló al renderizar y
      // publicaríamos una página vacía sin enterarnos.
      if (!/<h1[\s>]/i.test(html)) {
        throw new Error(`La ruta ${ruta} se renderizó sin <h1>; se aborta el prerenderizado.`);
      }

      const destino =
        ruta === '/' ? join(DIST, 'index.html') : join(DIST, ruta, 'index.html');
      await mkdir(dirname(destino), { recursive: true });
      await writeFile(destino, html, 'utf8');

      console.log(`  ${ruta.padEnd(40)} ${(html.length / 1024).toFixed(0)} KB`);
      generadas += 1;
      await pagina.close();
    }

    // Las rutas privadas nunca deben recibir la portada estática como fallback.
    const shellPrivada = esqueletoOriginal
      .replace(/<title\b[^>]*>[\s\S]*?<\/title>/gi, '')
      .replace(/<meta\b[^>]*(?:name="(?:description|robots|twitter:[^"]*)"|property="og:[^"]*")[^>]*>/gi, '')
      .replace(/<link\b[^>]*rel="canonical"[^>]*>/gi, '')
      .replace('</head>', '<title>Acceso privado | E360</title><meta name="robots" content="noindex, nofollow"></head>');
    await mkdir(join(DIST, '_private'), { recursive: true });
    await writeFile(join(DIST, '_private/index.html'), shellPrivada, 'utf8');
  } finally {
    await navegador.close();
    servidor.close();
  }

  console.log(`\nPáginas prerenderizadas: ${generadas}`);
}

main().catch((error) => {
  console.error('ERROR en el prerenderizado:', error.message);
  process.exit(1);
});
