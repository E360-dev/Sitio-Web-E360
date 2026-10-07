// Captura cada bloque público afectado por la actualización editorial v03
// (documento DICE / DEBE DECIR) para armar el comparativo antes/después.
//
// Uso:  node scripts/capturar-secciones.mjs <etiqueta> [urlBase]
//   node scripts/capturar-secciones.mjs antes
//   node scripts/capturar-secciones.mjs despues http://localhost:5173
//
// Salida: capturas/<etiqueta>/{escritorio,movil}/*.png y capturas/<etiqueta>/manifiesto.json
// con el bloque del documento al que corresponde cada imagen y los metadatos SEO.
//
// Las capturas se buscan por texto o por id, no por posición, para que la misma
// lista sirva antes y después aunque cambien el orden y los componentes. Si una
// sección no existe en una de las dos versiones, se registra como ausente.

import { mkdir, writeFile } from 'node:fs/promises';
import { dirname, resolve, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import puppeteer from 'puppeteer';

const RAIZ = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const etiqueta = process.argv[2];
const BASE = (process.argv[3] || 'http://localhost:5173').replace(/\/$/, '');

if (!etiqueta) {
  console.error('Falta la etiqueta: node scripts/capturar-secciones.mjs <antes|despues> [urlBase]');
  process.exit(1);
}

const VISTAS = {
  escritorio: { width: 1440, height: 900, deviceScaleFactor: 1 },
  movil: { width: 390, height: 844, deviceScaleFactor: 2, isMobile: true, hasTouch: true },
};

// Cada captura: qué bloques del documento cubre, ruta, y cómo localizarla.
//   selector: CSS directo.
//   texto:    texto visible; se captura el ancestro más cercano que sea <section>
//             o un bloque con id (o, si no hay, el contenedor de nivel superior).
//   antes():  acción previa (clic en pestaña, abrir menú).
const CAPTURAS = [
  { id: '01-inicio-pagina-completa', bloques: '03 Orden de lectura', ruta: '/', paginaCompleta: true },
  { id: '01-inicio-hero', bloques: '01C (H1 accesible, ver manifiesto)', ruta: '/', selector: '#video-hero' },
  { id: '02-inicio-adn-big-four', bloques: '01A, 01B', ruta: '/', selector: '#cercania-humana' },
  { id: '03-inicio-inteligencia-diferencia', bloques: '02A, 02B, 02C, 03A', ruta: '/', selector: '#nuestra-ventaja' },
  { id: '04-inicio-en-que-podemos-ayudarte', bloques: '03B', ruta: '/', texto: '¿En qué podemos ayudarte?' },
  { id: '05-inicio-tecnologia-criterio', bloques: '03C', ruta: '/', texto: 'Tecnología con criterio profesional' },

  { id: '06-menu-servicios-escritorio', bloques: '04A', ruta: '/servicios', soloVista: 'escritorio', menu: 'escritorio' },
  { id: '06-menu-servicios-movil', bloques: '04A', ruta: '/servicios', soloVista: 'movil', menu: 'movil' },

  { id: '07-servicios-intro', bloques: '05A', ruta: '/servicios', antesDe: '#servicios' },
  { id: '08-servicios-auditoria', bloques: '05B, 05C, 06A–06C', ruta: '/servicios', pestana: 'Auditoría' },
  { id: '09-servicios-consultoria', bloques: '07A, 07B, 07C, 08A–08C', ruta: '/servicios', pestana: 'Consultoría' },
  { id: '10-servicios-bps', bloques: '09A, 09B', ruta: '/servicios', pestana: 'BPS' },
  { id: '11-servicios-financiamiento', bloques: '10A, 10C–10E', ruta: '/servicios', pestana: 'Financiamiento', selectorAlterno: 'section#financiamiento' },

  { id: '12-nosotros-filosofia', bloques: '11A', ruta: '/nosotros', antesDe: '#proposito' },
  { id: '13-nosotros-principios', bloques: '12C, 12D', ruta: '/nosotros', selector: '#purpose-values' },
  { id: '14-nosotros-equipo', bloques: '11B, 11C, 12A, 12B', ruta: '/nosotros', selector: 'section#equipo, #equipo', incluirHasta: 'contenedorEquipo' },
];

const RUTAS_SEO = ['/', '/servicios', '/nosotros'];

const espera = (ms) => new Promise((r) => setTimeout(r, ms));

async function cargar(pagina, ruta) {
  await pagina.goto(BASE + ruta, { waitUntil: 'networkidle2', timeout: 60000 });
  // Preloader de marca (600 ms) y montaje perezoso de rutas.
  await pagina.waitForFunction(() => !document.getElementById('preloader'), { timeout: 15000 });
  // Recorre la página para disparar los IntersectionObserver de las animaciones de entrada.
  await pagina.evaluate(async () => {
    const paso = window.innerHeight / 2;
    for (let y = 0; y < document.body.scrollHeight; y += paso) {
      window.scrollTo(0, y);
      await new Promise((r) => setTimeout(r, 120));
    }
    window.scrollTo(0, 0);
  });
  await espera(1200);
}

// Oculta el encabezado y los elementos flotantes (botón de correo) para que no
// tapen el texto de cada bloque.
const ocultarEncabezado = (pagina, ocultar) =>
  pagina.evaluate((o) => {
    for (const el of document.querySelectorAll('body *')) {
      const fijo = el.tagName === 'HEADER' || getComputedStyle(el).position === 'fixed';
      if (fijo) el.style.visibility = o ? 'hidden' : '';
    }
  }, ocultar);

// Marca con data-captura el elemento a fotografiar y devuelve si lo encontró.
async function marcar(pagina, c) {
  return pagina.evaluate((c) => {
    document.querySelectorAll('[data-captura]').forEach((e) => e.removeAttribute('data-captura'));
    let el = null;
    if (c.antesDe) {
      // Encabezados sin id propio: el bloque inmediatamente anterior a uno que sí lo tiene.
      el = document.querySelector(c.antesDe)?.previousElementSibling ?? null;
    } else if (c.selector) {
      el = document.querySelector(c.selector);
      // Si hay ids repetidos (div#equipo > section#equipo), usa el más externo.
      while (el && c.incluirHasta && el.parentElement?.closest('#equipo')) el = el.parentElement.closest('#equipo');
    } else if (c.texto) {
      const nodos = [...document.querySelectorAll('main *, #root *')].filter(
        (n) => n.children.length === 0 && n.textContent.trim() === c.texto && n.offsetParent !== null,
      );
      const hoja = nodos[0];
      if (hoja) {
        el = hoja.closest('section, [id]:not(#root)');
        if (!el || el.id === 'root') {
          el = hoja;
          while (el.parentElement && el.parentElement.id !== 'root' && el.parentElement.tagName !== 'MAIN') el = el.parentElement;
        }
      }
    }
    if (!el) return false;
    el.setAttribute('data-captura', '1');
    return true;
  }, c);
}

// Selecciona una pestaña de Servicios por coincidencia parcial del nombre.
async function abrirPestana(pagina, nombre) {
  return pagina.evaluate((nombre) => {
    const btn = [...document.querySelectorAll('#services-tabs-section button')].find((b) =>
      b.textContent.trim().toLowerCase().startsWith(nombre.toLowerCase()),
    );
    if (!btn) return false;
    btn.click();
    return true;
  }, nombre);
}

async function capturarMenu(pagina, tipo, archivo) {
  await pagina.evaluate(() => window.scrollTo(0, 0));
  if (tipo === 'escritorio') {
    const enlace = await pagina.$('header nav a[href="/servicios"]');
    await enlace.hover();
    await espera(700);
    await pagina.screenshot({ path: archivo, clip: { x: 0, y: 0, width: 1440, height: 560 } });
  } else {
    await pagina.evaluate(() => document.querySelector('header nav .md\\:hidden button').click());
    await espera(600);
    await pagina.evaluate(() => {
      const fila = [...document.querySelectorAll('header a')].find((a) => a.textContent.trim() === 'Servicios' && a.closest('.md\\:hidden'));
      fila?.parentElement.querySelector('button')?.click();
    });
    await espera(600);
    await pagina.screenshot({ path: archivo });
  }
}

async function main() {
  const salida = join(RAIZ, 'capturas', etiqueta);
  const navegador = await puppeteer.launch({ headless: true });
  const manifiesto = { etiqueta, urlBase: BASE, fecha: new Date().toISOString(), seo: {}, capturas: [] };

  try {
    for (const [vista, viewport] of Object.entries(VISTAS)) {
      await mkdir(join(salida, vista), { recursive: true });
      const pagina = await navegador.newPage();
      await pagina.setViewport(viewport);
      if (viewport.isMobile) {
        await pagina.setUserAgent('Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1');
      }

      let rutaActual = null;
      for (const c of CAPTURAS) {
        if (c.soloVista && c.soloVista !== vista) continue;
        const archivo = join(salida, vista, `${c.id}.png`);
        const registro = { id: c.id, vista, bloques: c.bloques, ruta: c.ruta, archivo: `${vista}/${c.id}.png` };

        // Las pestañas y el menú cambian el estado: recarga para partir siempre del mismo punto.
        if (rutaActual !== c.ruta || c.pestana || c.menu) {
          await cargar(pagina, c.ruta);
          rutaActual = c.ruta;
        }

        try {
          if (c.menu) {
            await ocultarEncabezado(pagina, false);
            await capturarMenu(pagina, c.menu, archivo);
            rutaActual = null;
          } else if (c.paginaCompleta) {
            await ocultarEncabezado(pagina, false);
            await pagina.screenshot({ path: archivo, fullPage: true });
          } else {
            await ocultarEncabezado(pagina, true);
            let encontrado;
            if (c.pestana) {
              const hayPestana = await abrirPestana(pagina, c.pestana);
              await espera(800);
              // Sin pestaña (BPS antes; Financiamiento después) se busca como bloque aparte.
              encontrado = hayPestana
                ? await marcar(pagina, { selector: '#services-tabs-section' })
                : c.selectorAlterno && (await marcar(pagina, { selector: c.selectorAlterno }));
            } else {
              encontrado = await marcar(pagina, c);
            }

            if (!encontrado) {
              registro.ausente = true;
              console.log(`  [${vista}] ${c.id}: no existe en esta versión`);
              manifiesto.capturas.push(registro);
              continue;
            }
            // Recorte por coordenadas del documento: el.screenshot() se desplaza
            // mal en emulación móvil cuando el bloque es más alto que la pantalla.
            await pagina.evaluate(() => document.querySelector('[data-captura]').scrollIntoView());
            await espera(500);
            const clip = await pagina.evaluate(() => {
              const r = document.querySelector('[data-captura]').getBoundingClientRect();
              return { x: 0, y: r.top + window.scrollY, width: document.documentElement.clientWidth, height: r.height };
            });
            await pagina.screenshot({ path: archivo, clip, captureBeyondViewport: true });
          }
          console.log(`  [${vista}] ${c.id}`);
        } catch (err) {
          registro.error = err.message;
          console.log(`  [${vista}] ${c.id}: ERROR ${err.message}`);
        }
        manifiesto.capturas.push(registro);
      }
      await pagina.close();
    }

    // Metadatos (bloques 01C y 13): no son visibles, se guardan como texto.
    const pagina = await navegador.newPage();
    for (const ruta of RUTAS_SEO) {
      await cargar(pagina, ruta);
      manifiesto.seo[ruta] = await pagina.evaluate(() => ({
        title: document.title,
        // Todas: index.html trae una fija y Seo.jsx añade la de la página.
        descriptions: [...document.querySelectorAll('meta[name="description"]')].map((m) => m.content),
        ogTitle: document.querySelector('meta[property="og:title"]')?.content ?? null,
        ogDescription: document.querySelector('meta[property="og:description"]')?.content ?? null,
        h1: [...document.querySelectorAll('h1')].map((h) => h.textContent.trim()),
      }));
    }
  } finally {
    await navegador.close();
  }

  await writeFile(join(salida, 'manifiesto.json'), JSON.stringify(manifiesto, null, 2));
  console.log(`\nListo: ${manifiesto.capturas.filter((c) => !c.ausente && !c.error).length} capturas en capturas/${etiqueta}/`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
