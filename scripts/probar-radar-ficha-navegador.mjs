// Local UI integration with intercepted HTTP responses. No production writes.
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { mkdirSync } from 'node:fs';
import puppeteer from 'puppeteer';
const origin = 'http://127.0.0.1:5179';
const uid = '10000000-0000-4000-8000-000000000001';
const user = { id: uid, aud: 'authenticated', role: 'authenticated', email: 'qa@example.test' };
const token = `${Buffer.from('{"alg":"HS256","typ":"JWT"}').toString('base64url')}.${Buffer.from(JSON.stringify({ sub: uid, role: 'authenticated', exp: 4102444800 })).toString('base64url')}.test`;
const session = { access_token: token, refresh_token: 'local-test', token_type: 'bearer', expires_at: 4102444800, expires_in: 360000, user };
let registros = [{ id: 1, empresa: 'Empresa de ejemplo', sector: 'Energía renovable', ciudad: 'Medellín', pais: 'Colombia', fecha_lista: '2026-10-30', estado: 'candidato', que_hace: 'Ofrece servicios de generación solar a empresas.', como_opera: 'Opera por proyectos y coordina proveedores y socios.', tamano_estructura: 'Fuente A: 680; Fuente B: 201–500. Tamaño por validar.', senal: 'Anunció una nueva inversión para ampliar sus proyectos. '.repeat(9), por_que_ahora: 'La expansión podría requerir nuevos reportes. Hipótesis por validar.', servicio_principal: 'Consultoría contable', servicios: 'Reportes por proyecto e inversionistas.', sitio_web: 'https://example.test', tipo_sitio_web: 'web', contactos: [{ nombre: 'Contacto de ejemplo', cargo: 'CFO', estado: 'por_validar', linkedin: 'https://example.test/contacto' }], evidencias: [{ bloque: 'tamano', estado: 'estimacion', nombre: 'Dos directorios con estimaciones distintas', enlace: 'https://example.test/fuente', fecha_consulta: '2026-10-29' }], radar_hitos: [] }, { id: 2, empresa: 'Registro anterior', sector: 'Construcción · Colombia', fecha_lista: '2026-10-30', estado: 'candidato', sitio_web: 'https://example.test/anterior', senal: 'Señal histórica', por_que_ahora: 'Párrafo antiguo con contactos y fuentes que debe conservarse.', servicios: 'Texto anterior completo', radar_hitos: [] }];
let failNext = false, writes = [], browser, page, phase = 'inicio';
const vite = spawn(process.execPath, ['node_modules/vite/bin/vite.js', '--host', '127.0.0.1', '--port', '5179', '--strictPort'], { stdio: 'ignore', windowsHide: true });
try {
  let ready = false;
  for (let i = 0; i < 100; i++) { try { if ((await fetch(origin)).ok) { ready = true; break; } } catch {} await new Promise((r) => setTimeout(r, 200)); }
  assert.ok(ready, 'Vite disponible');
  phase = 'abrir navegador';
  browser = await puppeteer.launch({ headless: true, timeout: 60000, args: ['--no-sandbox', '--host-resolver-rules=MAP crxtzmykprgbgkdbqccd.supabase.co 127.0.0.1'] });
  page = await browser.newPage(); page.setDefaultTimeout(20000);
  const errors = []; page.on('pageerror', (e) => errors.push(e.message));
  await page.evaluateOnNewDocument((s) => localStorage.setItem('sb-crxtzmykprgbgkdbqccd-auth-token', JSON.stringify(s)), session);
  await page.setRequestInterception(true);
  page.on('request', async (req) => {
    const url = new URL(req.url());
    if (!url.hostname.endsWith('supabase.co')) { if (url.origin === origin || ['data:', 'blob:'].includes(url.protocol)) await req.continue(); else await req.abort(); return; }
    const headers = { 'access-control-allow-origin': '*', 'access-control-allow-headers': '*', 'access-control-allow-methods': 'GET,POST,PATCH,DELETE,HEAD,OPTIONS', 'content-type': 'application/json' };
    const reply = (body, status = 200) => req.respond({ status, headers, body: JSON.stringify(body) });
    if (req.method() === 'OPTIONS') return reply({});
    if (url.pathname === '/auth/v1/user') return reply(user);
    if (url.pathname.endsWith('/roles_usuario')) return reply({ rol: 'admin' });
    if (url.pathname.endsWith('/radar_accesos')) { const row = { user_id: uid, nombre: 'QA', pasos: [1, 2, 3, 5] }; return reply(url.searchParams.has('user_id') ? row : [row]); }
    if (url.pathname.endsWith('/radar_pasos')) return reply([]);
    if (url.pathname.endsWith('/radar_prospectos')) {
      if (['POST', 'PATCH'].includes(req.method())) {
        const body = JSON.parse(req.postData()); writes.push(body);
        if (failNext) { failNext = false; return reply({ message: 'Error de guardado simulado' }, 500); }
        if (req.method() === 'POST') registros.push({ ...body, id: registros.length + 1, radar_hitos: [] });
        else { const id = Number(url.searchParams.get('id').slice(3)); registros = registros.map((p) => p.id === id ? { ...p, ...body } : p); return reply({ id }); }
        return reply(null, 201);
      }
      const id = url.searchParams.get('id'); return reply(id ? registros.find((p) => p.id === Number(id.slice(3))) : registros);
    }
    return reply([]);
  });
  const click = async (text, scope = 'body') => {
    const h = await page.evaluateHandle((t, s) => [...document.querySelector(s).querySelectorAll('button,summary')].find((e) => e.textContent.trim() === t || e.textContent.trim().startsWith(t)), text, scope);
    assert.ok(h.asElement(), `Control ${text}`); await h.asElement().click();
  };
  const fill = async (label, value, scope = 'form') => {
    const h = await page.evaluateHandle((l, s) => [...document.querySelector(s).querySelectorAll('label')].find((e) => e.firstChild.textContent.trim() === l)?.querySelector('input,textarea'), label, scope);
    assert.ok(h.asElement(), `Campo ${label}`); await h.asElement().focus(); await page.keyboard.down('Control'); await page.keyboard.press('KeyA'); await page.keyboard.up('Control'); await page.keyboard.press('Backspace'); await h.asElement().type(value);
  };
  await page.setViewport({ width: 1440, height: 1000 });
  phase = 'lista corta';
  await page.goto(`${origin}/admin/conocimiento/radar/lista-corta`, { waitUntil: 'networkidle2' });
  await page.waitForFunction(() => document.body.textContent.includes('Empresa de ejemplo'));
  assert.ok(await page.evaluate(() => document.body.textContent.includes('Enlace registrado') && document.body.textContent.includes('Pendiente de completar')));
  await click('Preparar candidato');
  assert.equal(await page.$eval('form', (f) => f.checkValidity()), false, 'Alta exige introducción');
  await click('Preparar candidato');
  mkdirSync('supabase/.temp', { recursive: true });
  await page.screenshot({ path: 'supabase/.temp/ficha-desktop.png', fullPage: true });
  await click('Ver ficha');
  assert.ok(await page.evaluate(() => document.body.textContent.includes('Dos directorios con estimaciones distintas')));
  await page.screenshot({ path: 'supabase/.temp/ficha-desktop-abierta.png', fullPage: true });
  await click('Más opciones'); await click('Editar ficha');
  phase = 'editar ficha';
  const edit = 'form[aria-label="Editar ficha de Empresa de ejemplo"]';
  await fill('Qué hace', 'Descripción que se conserva tras error', edit);
  failNext = true; await click('Guardar ficha', edit);
  await page.waitForSelector(`${edit} [role="alert"]`);
  assert.equal(await page.$eval(`${edit} textarea`, (e) => e.value), 'Descripción que se conserva tras error');
  await click('Guardar ficha', edit);
  await page.waitForFunction(() => !document.querySelector('form[aria-label^="Editar ficha"]'));
  assert.equal(registros[0].que_hace, 'Descripción que se conserva tras error');
  await click('Más opciones'); // close the still-open actions menu
  await click('Más opciones'); await click('Editar ficha');
  await fill('Qué hace', 'Cambio cancelado', edit); await click('Cancelar', edit);
  assert.equal(registros[0].que_hace, 'Descripción que se conserva tras error');
  await page.setViewport({ width: 390, height: 844 });
  phase = 'móvil';
  assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), 'Lista móvil sin desbordamiento');
  await page.screenshot({ path: 'supabase/.temp/ficha-mobile.png', fullPage: true });
  await click('Preparar candidato');
  assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), 'Formulario móvil sin desbordamiento');
  await page.screenshot({ path: 'supabase/.temp/ficha-mobile-formulario.png', fullPage: true });
  await fill('Empresa *', 'Alta de prueba'); await fill('Qué hace *', 'Vende productos a empresas'); await fill('Qué pasó · Señal *', 'Nueva inversión'); await fill('Por qué investigarla · Hipótesis *', 'Posible necesidad de reportes'); await fill('Servicio principal *', 'Consultoría');
  await click('Agregar contacto', 'form'); await fill('Nombre *', 'Otra persona');
  await click('Agregar evidencia', 'form'); await fill('Fuente y dato que respalda *', 'Estimación inicial');
  await click('Agregar a la lista corta', 'form');
  await page.waitForFunction(() => document.body.textContent.includes('Alta de prueba'));
  assert.equal(registros.at(-1).contactos[0].nombre, 'Otra persona');
  assert.equal(registros.at(-1).evidencias[0].estado, 'por_validar');
  assert.equal(registros[1].por_que_ahora, 'Párrafo antiguo con contactos y fuentes que debe conservarse.');
  // Same introduction is available in the selected-prospect header, read-only.
  registros[0].estado = 'en_curso';
  phase = 'prospecto elegido';
  await page.goto(`${origin}/admin/conocimiento/radar/prospecto/1`, { waitUntil: 'networkidle2' });
  await page.waitForFunction(() => document.body.textContent.includes('Descripción que se conserva tras error'));
  assert.equal(await page.$('form[aria-label^="Editar ficha"]'), null);
  assert.equal(errors.length, 0, errors.join('\n'));
  assert.equal(writes.length, 3, 'Error, reintento y alta; cancelar no escribe');
  console.log('OK navegador: compatibilidad, validación, edición, cancelación, error con borrador conservado, alta con contactos/evidencias, ficha de elegido, escritorio y móvil. HTTP interceptado; sin escrituras en producción.');
} catch (e) {
  console.error(`Fallo (${phase}): ${e.message}`);
  if (page) { console.error((await page.evaluate(() => document.body.textContent)).slice(0, 1400)); await page.screenshot({ path: 'supabase/.temp/ficha-fallo.png', fullPage: true }); }
  process.exitCode = 1;
} finally { if (browser) await browser.close(); vite.kill(); }
