import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { resolve, extname, sep } from 'node:path';
import puppeteer from 'puppeteer';
import { validarSeoPublico } from './seo-validacion.mjs';
import { construirSitemap } from './sitemap.mjs';

const dist = resolve('dist');
const sitemap = await readFile(resolve(dist, 'sitemap.xml'), 'utf8');
const rutas = [...sitemap.matchAll(/<loc>https:\/\/e360\.pro([^<]*)<\/loc>/g)].map((m) => m[1]);
assert(rutas.length >= 5, 'Sitemap vacío o incompleto');
assert.equal(new Set(rutas).size, rutas.length, 'URLs repetidas en sitemap');
assert(!rutas.some((r) => /^\/(login|registro|pendiente|crear-contrasena|admin|cliente|documento)(\/|$)/.test(r)));
const estatico = construirSitemap([]);
assert(!estatico.includes('<lastmod>'), 'No inventar fechas de modificación');
assert(construirSitemap([{ slug: 'ejemplo', actualizado_en: '2026-10-01T12:00:00Z' }]).includes('<lastmod>2026-10-01</lastmod>'));

const tipos = { '.html': 'text/html', '.js': 'application/javascript', '.css': 'text/css', '.png': 'image/png', '.svg': 'image/svg+xml', '.webp': 'image/webp', '.json': 'application/json' };
// Sirve los archivos reales del build, incluida la shell privada. No sustituye
// la comprobación de cabeceras Apache que debe hacerse tras publicar.
const servidor = createServer(async (req, res) => {
  try {
    const ruta = decodeURIComponent(new URL(req.url, 'http://localhost').pathname);
    let archivo = resolve(dist, `.${ruta}`);
    let estadoHttp = 200;
    assert(archivo === dist || archivo.startsWith(dist + sep));
    if (/^\/(admin|cliente|documento|login|registro|pendiente|crear-contrasena)(\/|$)/.test(ruta)) {
      archivo = resolve(dist, '_private/index.html');
    } else {
      try { if ((await stat(archivo)).isDirectory()) archivo = resolve(archivo, 'index.html'); }
      catch { archivo = resolve(dist, '_notfound/index.html'); estadoHttp = 404; }
    }
    const contenido = await readFile(archivo);
    res.writeHead(estadoHttp, { 'Content-Type': tipos[extname(archivo)] || 'application/octet-stream' });
    res.end(contenido);
  } catch { res.writeHead(404); res.end(); }
});
await new Promise((ok) => servidor.listen(0, '127.0.0.1', ok));
const base = `http://127.0.0.1:${servidor.address().port}`;
let navegador;
try {
  navegador = await puppeteer.launch({ headless: true, args: ['--no-sandbox'] });
  const pagina = await navegador.newPage();
  await pagina.setRequestInterception(true);
  pagina.on('request', (r) => {
    // Las pruebas SEO no necesitan vídeo, analítica ni servicios de terceros.
    if (!r.url().startsWith(base) || ['media', 'font'].includes(r.resourceType())) r.abort();
    else r.continue();
  });
  const comprobar = async (ruta, js = true) => {
    if (js) {
      await pagina.waitForFunction((r) => document.head.dataset.seoPath === r && !document.getElementById('preloader'), {}, ruta);
    }
    const resultado = await pagina.evaluate(validarSeoPublico, { ruta });
    assert.deepEqual(resultado.errores, [], `${ruta}: ${resultado.errores.join('; ')}`);
    return resultado;
  };
  for (const ruta of rutas) {
    await pagina.setJavaScriptEnabled(false);
    assert.equal((await pagina.goto(base + ruta)).status(), 200);
    const sinJs = await comprobar(ruta, false);
    await pagina.setJavaScriptEnabled(true);
    await pagina.goto(base + ruta);
    assert.deepEqual(await comprobar(ruta), sinJs, `${ruta}: la SPA cambia los metadatos del HTML`);
    await pagina.reload();
    await comprobar(ruta);
    console.log(`OK HTML + React + recarga: ${ruta}`);
  }

  await pagina.goto(base + '/nosotros');
  await comprobar('/nosotros');
  await pagina.click('a[href="/contacto"]');
  await comprobar('/contacto');
  await pagina.goBack();
  await comprobar('/nosotros');
  console.log('OK navegación Nosotros → Contacto → Atrás');

  for (const ruta of ['/login', '/login/', '/registro', '/pendiente', '/crear-contrasena', '/admin/centro', '/cliente/', '/documento/ejemplo']) {
    await pagina.setJavaScriptEnabled(false);
    await pagina.goto(base + ruta);
    const estado = await pagina.evaluate(() => ({
      robots: document.querySelector('meta[name="robots"]')?.content,
      canonical: document.querySelector('link[rel="canonical"]')?.href,
      description: document.querySelector('meta[name="description"]')?.content,
      texto: document.getElementById('root').textContent,
    }));
    assert.match(estado.robots, /noindex/);
    assert.equal(estado.canonical, undefined);
    assert.equal(estado.description, undefined);
    assert.equal(estado.texto, '');
  }
  await pagina.setJavaScriptEnabled(true);
  await pagina.goto(base + '/nosotros');
  await comprobar('/nosotros');
  await pagina.click('a[href="/login"]');
  await pagina.waitForFunction(() => document.head.dataset.seoPath === 'noindex');
  assert.equal(await pagina.$('link[rel="canonical"]'), null);
  assert.equal(await pagina.$('meta[name="description"]'), null);
  assert.match(await pagina.title(), /Iniciar sesión/);
  assert(await pagina.$('input[type="password"]'), 'Login sin formulario');
  await pagina.goBack();
  await comprobar('/nosotros');
  console.log('OK shell privada sin JS, formulario de acceso y retorno público');

  await pagina.setJavaScriptEnabled(false);
  assert.equal((await pagina.goto(base + '/ruta-que-no-existe-seo')).status(), 404);
  assert.equal(await pagina.$('link[rel="canonical"]'), null);
  assert.match(await pagina.$eval('meta[name="robots"]', (e) => e.content), /noindex/);
  assert.equal(await pagina.$eval('h1', (e) => e.textContent), '404');
  await pagina.setJavaScriptEnabled(true);
  assert.equal((await pagina.goto(base + '/ruta-que-no-existe-seo')).status(), 404);
  await pagina.waitForFunction(() => document.title === 'Página no encontrada | E360');
  assert.equal(await pagina.$('link[rel="canonical"]'), null);
  assert.match(await pagina.$eval('meta[name="robots"]', (e) => e.content), /noindex/);
  // La validación debe detectar regresiones, no limpiarlas silenciosamente.
  await pagina.goto(base + '/');
  await comprobar('/');
  await pagina.evaluate(() => document.head.append(document.querySelector('title').cloneNode(true)));
  assert((await pagina.evaluate(validarSeoPublico, { ruta: '/' })).errores.some((e) => e.includes('title')));
  console.log(`SEO verificado: ${rutas.length} URLs públicas; exclusión privada; detección de duplicados.`);
} finally {
  if (navegador) await navegador.close();
  await new Promise((ok) => servidor.close(ok));
}
