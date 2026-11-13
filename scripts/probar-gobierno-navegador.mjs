import assert from 'node:assert/strict';
import { readFile, mkdir } from 'node:fs/promises';
import puppeteer from 'puppeteer';

const base = 'http://127.0.0.1:5173';
const datos = JSON.parse(await readFile('src/datos/gobierno.json', 'utf8'));
const salida = 'output/gobierno-revision';
await mkdir(salida, { recursive: true });
const browser = await puppeteer.launch({ headless: true });
try {
  const page = await browser.newPage();
  await page.setCacheEnabled(false);
  const errores = [];
  page.on('pageerror', (e) => errores.push(e.message));
  await page.setRequestInterception(true);
  page.on('request', (r) => {
    if (!r.url().startsWith(base) || ['media', 'font'].includes(r.resourceType())) r.abort();
    else r.continue();
  });
  const lista = ['/gobierno', ...datos.politicas.map((p) => `/gobierno/${p.slug}`)];
  const visitar = async (ruta) => {
    assert.equal((await page.goto(base + ruta)).status(), 200);
    await page.waitForFunction((r) => document.head.dataset.seoPath === r && !document.getElementById('preloader'), {}, ruta);
    assert.equal(await page.$$eval('h1', (elements) => elements.length), 1);
    assert.equal(await page.$eval('h1', (e) => document.activeElement === e), true, 'Foco en título al cambiar página');
  };
  for (const ancho of [1440, 900, 390, 320]) {
    await page.setViewport({ width: ancho, height: 1000 });
    for (const ruta of lista) {
      await visitar(ruta);
      assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), `${ruta}: desplazamiento horizontal a ${ancho}px`);
      if (ruta === '/gobierno') {
        assert.equal(await page.$$eval('.gobierno-card', (e) => e.length), 7);
        const columnas = await page.$eval('.gobierno-card', (e) => getComputedStyle(e.parentElement).gridTemplateColumns.split(' ').length);
        assert.equal(columnas, ancho >= 1280 ? 3 : ancho >= 768 ? 2 : 1);
      } else {
        assert.equal(await page.$$eval('.gobierno-prose > section', (e) => e.length), 5);
        const href = await page.$eval('.gobierno-download a', (e) => e.getAttribute('href'));
        const response = await fetch(base + href);
        assert.equal(response.status, 200);
        assert.match(response.headers.get('content-type'), /application\/pdf/);
        assert.equal(Buffer.from(await response.arrayBuffer()).subarray(0, 5).toString(), '%PDF-');
      }
      if ([1440, 390].includes(ancho) && ['/gobierno', '/gobierno/gobierno-y-responsabilidad'].includes(ruta)) {
        await page.screenshot({ path: `${salida}/${ruta.split('/').filter(Boolean).join('-')}-${ancho}.png`, fullPage: true });
      }
    }
  }
  await page.setViewport({ width: 1440, height: 1000 });
  await visitar('/gobierno');
  await page.click('.gobierno-card a');
  await page.waitForFunction(() => document.head.dataset.seoPath === '/gobierno/etica-e-integridad');
  await page.waitForSelector('.gobierno-toc a[href="#aplicacion"]');
  await page.click('.gobierno-toc a[href="#aplicacion"]');
  await page.waitForFunction(() => location.hash === '#aplicacion');
  await page.waitForFunction(() => { const y = document.getElementById('aplicacion').getBoundingClientRect().top; return y >= 80 && y <= 130; });
  const distancia = await page.$eval('#aplicacion', (e) => Math.round(e.getBoundingClientRect().top));
  assert(distancia >= 80 && distancia <= 130, `Ancla oculta por encabezado: ${distancia}`);
  await page.reload();
  await page.waitForFunction(() => document.getElementById('aplicacion') && !document.getElementById('preloader'));
  await page.click('nav[aria-label="Otras políticas"] a:last-child');
  await page.waitForFunction(() => document.head.dataset.seoPath === '/gobierno/gobierno-y-responsabilidad');
  await page.goBack();
  await page.waitForFunction(() => document.head.dataset.seoPath === '/gobierno/etica-e-integridad');
  await page.goto(base + '/gobierno/no-existe');
  await page.waitForFunction(() => /Página no encontrada/.test(document.title));
  await page.goto(base + '/nosotros');
  await page.waitForFunction(() => !document.getElementById('preloader'));
  await page.click('footer a[href="/gobierno"]');
  await page.waitForFunction(() => document.head.dataset.seoPath === '/gobierno' && document.activeElement.tagName === 'H1');
  await page.keyboard.press('Tab');
  assert.equal(await page.evaluate(() => document.activeElement.getAttribute('href')), '#politicas');
  assert.equal(await page.$eval('.gobierno-page a:focus', (e) => getComputedStyle(e).outlineStyle), 'solid');
  assert.deepEqual(errores, []);
  console.log('Gobierno: 8 páginas a 320/390/900/1440px; PDF, foco, teclado, anclas, recarga, Atrás, siguiente, footer y error verificados.');
} finally { await browser.close(); }
