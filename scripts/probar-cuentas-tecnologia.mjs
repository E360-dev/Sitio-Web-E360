// Authorized integration checks use disposable Auth users and account records.
// Credentials/API keys remain in this process and are never printed.
import assert from 'node:assert/strict';
import { execFileSync, spawn } from 'node:child_process';
import { randomBytes } from 'node:crypto';
import { mkdirSync } from 'node:fs';
import { createClient } from '@supabase/supabase-js';

const ref = 'crxtzmykprgbgkdbqccd';
const url = `https://${ref}.supabase.co`;
const cli = process.platform === 'win32' ? 'supabase.exe' : 'supabase';
const keys = JSON.parse(execFileSync(cli, ['projects','api-keys','--project-ref',ref,'--output','json'], { encoding:'utf8', stdio:['ignore','pipe','pipe'] }));
const anon = keys.find((k) => k.name === 'anon').api_key;
const serviceKey = keys.find((k) => k.name === 'service_role').api_key;
const options = { auth: { persistSession:false, autoRefreshToken:false, detectSessionInUrl:false } };
const service = createClient(url,serviceKey,options);
if (process.argv.includes('--limpiar')) {
  const {data,error}=await service.auth.admin.listUsers({perPage:1000});
  assert.ok(!error,'Enumerar usuarios de prueba');
  const leftovers=data.users.filter((user)=>/^qa-(admin|auditor)-\d+-\d+-[0-9a-f]{8}@example\.test$/.test(user.email || ''));
  for(const user of leftovers) {
    assert.ok(!(await service.from('cuentas_tecnologia').delete().eq('creado_por',user.id)).error,'Limpiar cuentas de prueba');
    assert.ok(!(await service.from('roles_usuario').delete().eq('user_id',user.id)).error,'Limpiar rol de prueba');
    assert.ok(!(await service.auth.admin.deleteUser(user.id)).error,'Limpiar usuario de prueba');
  }
  console.log(`Eliminados ${leftovers.length} usuarios de prueba pendientes y sus cuentas temporales.`);
  process.exit(0);
}
const people = []; const accountIds = [];
const stamp = `${Date.now()}-${randomBytes(4).toString('hex')}`;
const toolPassword = randomBytes(24).toString('base64url');
const account = { herramienta:`QA cuenta ${stamp}`,plan:'Prueba',correo:'qa@example.test',uso:'Registro temporal de prueba automática.',fecha_renovacion:'2028-02-29',costo:20,moneda:'MXN' };

async function makeUser(role) {
  const email = `qa-${role}-${people.length}-${stamp}@example.test`;
  const password = `${randomBytes(24).toString('base64url')}!aA1`;
  const { data, error } = await service.auth.admin.createUser({ email,password,email_confirm:true });
  assert.ok(!error && data.user, 'Crear usuario temporal');
  people.push({ id:data.user.id });
  const roleResult = await service.from('roles_usuario').upsert({ user_id:data.user.id,rol:role },{ onConflict:'user_id' });
  assert.ok(!roleResult.error,'Asignar rol temporal');
  const client = createClient(url,anon,options);
  const login = await client.auth.signInWithPassword({ email,password });
  assert.ok(!login.error && login.data.session,'Iniciar sesión temporal');
  return { id:data.user.id,email,password,client,session:login.data.session };
}
async function post(person, body, expected = 200) {
  const response = await fetch(`${url}/functions/v1/cuentas-tecnologia`, {
    method:'POST', headers:{ apikey:anon,Authorization:`Bearer ${person?.session?.access_token || anon}`,'Content-Type':'application/json' },body:JSON.stringify(body),
  });
  const data = await response.json();
  assert.ok((Array.isArray(expected) ? expected : [expected]).includes(response.status), `${body.accion}: HTTP ${response.status}, esperado ${expected} (${data.codigo || 'sin código'})`);
  if (expected === 200) assert.match(response.headers.get('cache-control') || '',/no-store/);
  return data;
}
async function row(id, client=service) {
  const result = await client.from('cuentas_tecnologia').select('*').eq('id',id).maybeSingle();
  assert.ok(!result.error,'Consultar inventario'); return result.data;
}

async function paymentChecks(admin, other, auditor, id) {
  const save = async (values) => post(admin, { accion:'guardar', cuenta:{...account,id,...values} });
  const command = (c, extra={}) => ({ accion:'registrar_pago',id,version:c.pago_version,operacion_id:crypto.randomUUID(),...extra });
  const undo = (c) => ({ accion:'deshacer_pago',id,version:c.pago_version,pago_id:c.ultimo_pago_id,operacion_id:crypto.randomUUID() });
  await save({fecha_renovacion:'2028-01-31',periodicidad:'mensual'});
  let c=await row(id);
  const first=command(c);
  await post(null,first,401); await post(auditor,first,403);
  await post(admin,{...first,version:-1},400);
  await post(admin,first);await post(admin,first);
  c=await row(id);
  assert.equal(c.fecha_renovacion,'2028-02-29');assert.equal(c.dia_renovacion,31);
  assert.equal(c.ultimo_pago_por,admin.id);assert.ok(c.pago_deshacer_hasta);
  const history=await admin.client.from('pagos_tecnologia').select('*').eq('cuenta_id',id);
  assert.equal(history.data.length,1,'Retry creates exactly one event');
  const hidden=await auditor.client.from('pagos_tecnologia').select('*').eq('cuenta_id',id);
  assert.ok(!hidden.error && hidden.data.length===0,'History only readable by admins');
  assert.ok((await admin.client.from('cuentas_tecnologia').update({ultimo_pago_id:crypto.randomUUID()}).eq('id',id)).error,'Cannot forge payment summary');
  assert.ok((await admin.client.from('pagos_tecnologia').insert({})).error,'Cannot insert payment events directly');
  await post(admin,{accion:'guardar',cuenta:{...account,id,fecha_renovacion:c.fecha_renovacion,uso:'Solo cambia el uso'}});
  c=await row(id);assert.equal(c.dia_renovacion,31);assert.equal(c.ultimo_pago_id,first.operacion_id,'Unrelated edit preserves payment');
  await post(admin,command(c));c=await row(id);assert.equal(c.fecha_renovacion,'2028-03-31');
  const revert=undo(c);await post(other,revert);await post(other,revert);
  c=await row(id);assert.equal(c.fecha_renovacion,'2028-02-29');assert.equal(c.ultimo_pago_id,first.operacion_id);assert.equal(c.pago_deshacer_hasta,null);
  await post(admin,undo(c),409);
  const requests=[command(c),command(c)];
  const results=await Promise.all([post(admin,requests[0],[200,409]),post(other,requests[1],[200,409])]);
  assert.equal(results.filter((r)=>r.ok).length,1,'Two admins advance one period only');
  c=await row(id);assert.equal(c.fecha_renovacion,'2028-03-31');
  const oldUndo=undo(c);
  await admin.client.from('cuentas_tecnologia').update({fecha_renovacion:'2028-04-30'}).eq('id',id);
  c=await row(id);assert.equal(c.ultimo_pago_id,null);await post(admin,oldUndo,409);
  await save({fecha_renovacion:'2028-02-29',periodicidad:'anual'});
  c=await row(id);await post(admin,command(c));c=await row(id);assert.equal(c.fecha_renovacion,'2029-02-28');
  await post(admin,command(c));c=await row(id);assert.equal(c.fecha_renovacion,'2030-02-28');
  await save({fecha_renovacion:'2026-01-15',periodicidad:'mensual'});
  c=await row(id);await post(admin,command(c),422);
  assert.equal((await row(id)).fecha_renovacion,'2026-01-15','Overdue payment requires explicit date');
  await post(admin,command(c,{fecha_renovacion:'2028-01-15'}));
  await save({fecha_renovacion:null});c=await row(id);await post(admin,command(c),422);
  await post(admin,command(c,{fecha_renovacion:'2028-01-15'}));c=await row(id);
  assert.equal((await service.from('pagos_tecnologia').update({creado_en:'2020-01-01T00:00:00Z'}).eq('operacion_id',c.ultimo_pago_id)).error,null);
  await post(admin,undo(c),409);
  const revoked=await makeUser('admin');await revoked.client.auth.signOut({scope:'local'});
  await post(revoked,command(c),401);
  await save({fecha_renovacion:account.fecha_renovacion,periodicidad:'mensual'});
  console.log('OK pagos: fechas, anclaje, periodicidad, registro, reintentos, concurrencia, reversión, permisos y sesiones revocadas.');
}

async function browserChecks(admin) {
  const { default:puppeteer } = await import('puppeteer');
  const vite = spawn(process.execPath,['node_modules/vite/bin/vite.js','--host','127.0.0.1','--port','5173','--strictPort'],{stdio:'ignore',windowsHide:true});
  let browser, page;
  let phase='inicio';
  try {
    let ready=false;
    for (let i=0;i<100;i++) { try { if ((await fetch('http://127.0.0.1:5173')).ok) { ready=true; break; } } catch {} await new Promise((r)=>setTimeout(r,200)); }
    assert.ok(ready,'Vite disponible');
    browser = await puppeteer.launch({headless:true,args:['--no-sandbox']});
    console.log('Navegador iniciado para pruebas de interfaz.');
    const context=browser.defaultBrowserContext();
    await context.overridePermissions('http://127.0.0.1:5173',['clipboard-read','clipboard-write','clipboard-sanitized-write']);
    page=await browser.newPage();
    page.setDefaultTimeout(15000);
    page.on('pageerror',(error)=>console.error('Error JavaScript de la prueba:',error.message));
    await page.setViewport({width:1440,height:1050});
    await page.evaluateOnNewDocument((key,auth) => {
      if (!localStorage.getItem('qa-session-initialized')) { localStorage.setItem(key,JSON.stringify(auth)); localStorage.setItem('qa-session-initialized','true'); }
    },`sb-${ref}-auth-token`,admin.session);
    const path='http://127.0.0.1:5173/admin/conocimiento/cuentas-tecnologia';
    await page.goto(path,{waitUntil:'networkidle2'});
    await page.waitForSelector('input[aria-label="Buscar cuentas"]');

    // Reproduce the old hook independently, using its real committed source.
    const legacy = execFileSync('git',['show','13c0172:src/hooks/useRol.js'],{encoding:'utf8'}).replace(/^import .*;.*\r?\n/gm,'').replace('export function useRol','function useRol');
    await page.addScriptTag({type:'module',content:`
      import React from '/node_modules/.vite/deps/react.js';
      const {useState,useEffect}=React;
      import ReactDOM from '/node_modules/.vite/deps/react-dom_client.js';
      const {createRoot}=ReactDOM;
      const supabase={auth:{getUser:async()=>{await new Promise(r=>setTimeout(r,60));return {data:{user:{id:'fixture'}}}},onAuthStateChange:fn=>{window.__legacyEvent=fn;return {data:{subscription:{unsubscribe(){}}}}}},from:()=>({select:()=>({eq:()=>({single:async()=>({data:{rol:'admin'}})})})})};
      ${legacy}
      const host=document.createElement('div');host.id='legacy-fixture';document.body.append(host);
      const root=createRoot(host);function Fixture(){const {loading}=useRol();return loading?React.createElement('p',null,'loading'):React.createElement('input',{id:'legacy-draft',defaultValue:''});}root.render(React.createElement(Fixture));window.__legacyCleanup=()=>{root.unmount();host.remove()};
    `});
    await page.waitForSelector('#legacy-draft'); await page.type('#legacy-draft','borrador que se pierde');
    await page.evaluate(()=>window.__legacyEvent('SIGNED_IN',{}));
    await new Promise((r)=>setTimeout(r,200));
    assert.equal(await page.$eval('#legacy-draft',(e)=>e.value),'','Reproducción: el hook anterior perdía el borrador');
    await page.evaluate(()=>window.__legacyCleanup());
    console.log('OK navegador: reproducida la pérdida del formulario con el hook anterior.');

    const click = async (text) => {
      const handle=await page.evaluateHandle((value)=>{
        const dialogs=[...document.querySelectorAll('dialog[open]')];const scope=dialogs.at(-1)||document;
        const button=[...scope.querySelectorAll('button')].find((b)=>b.textContent.trim()===value || b.getAttribute('aria-label')===value);
        if (!button) throw new Error('Botón no encontrado: '+value);return button;
      },text);
      await handle.asElement().click();
    };
    const fill = async (label,value) => {
      const handle=await page.evaluateHandle((text)=>{
        const dialogs=[...document.querySelectorAll('dialog[open]')];const scope=dialogs.at(-1)||document;
        return [...scope.querySelectorAll('label')].find((l)=>l.textContent.trim().startsWith(text))?.querySelector('input,textarea');
      },label);
      const element=handle.asElement();assert.ok(element,`Campo ${label}`);
      await element.click();
      const modifier=process.platform==='darwin'?'Meta':'Control';
      await page.keyboard.down(modifier);await page.keyboard.press('a');await page.keyboard.up(modifier);
      await element.press('Backspace');await element.type(value);
    };
    phase='desbloqueo';
    await click('Desbloquear credenciales'); await fill('Contraseña del portal',admin.password); await click('Desbloquear');
    await page.waitForFunction(()=>document.body.textContent.includes('Credenciales desbloqueadas en esta pestaña'));
    console.log('OK interfaz: desbloqueo con contraseña del portal.');
    phase='alta de cuenta';
    await click('Agregar cuenta');
    assert.equal(await page.$$eval('dialog[open] select', (selects) => selects.at(-1).value), 'MXN', 'Moneda inicial: peso mexicano');
    const browserTool=`QA interfaz ${stamp}`;
    await fill('Herramienta',browserTool);await fill('Plan','Pro');await fill('Correo de la cuenta','qa@example.test');await fill('¿Para qué se usa?','Uso de prueba editable');
    await page.$eval('input[type="date"]',(input)=>{Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value').set.call(input,'2027-06-15');input.dispatchEvent(new Event('input',{bubbles:true}));input.dispatchEvent(new Event('change',{bubbles:true}));});
    await page.type('input[aria-label="Nueva contraseña de la herramienta"]',toolPassword);
    await click('Guardar cuenta');
    await page.waitForFunction(()=>!document.querySelector('dialog[open]'));
    console.log('OK interfaz: cuenta guardada desde el formulario.');
    phase='detalle y revelación';
    const added=await service.from('cuentas_tecnologia').select('id,moneda').eq('herramienta',browserTool).single();assert.ok(added.data,'Cuenta creada en interfaz');accountIds.push(added.data.id);
    assert.equal(added.data.moneda, 'MXN', 'El formulario guarda pesos mexicanos');
    await page.type('input[aria-label="Buscar cuentas"]',browserTool);
    phase='pagos';
    await click('Marcar pago realizado');
    await page.waitForFunction(()=>document.querySelector('li')?.textContent.includes('Al día'));
    await page.reload({waitUntil:'networkidle2'});await page.waitForSelector('input[aria-label="Buscar cuentas"]');
    await page.type('input[aria-label="Buscar cuentas"]',browserTool);
    await page.waitForFunction(()=>document.querySelector('li')?.textContent.includes('Al día'));
    await click('Deshacer');
    await page.waitForFunction(()=>document.querySelector('li')?.textContent.includes('Sin confirmar'));
    // Commit the real request, then drop its response. Retry must reuse its UUID.
    let dropped=false;
    await page.setRequestInterception(true);
    const intercept=async(request)=>{
      if(!dropped && request.url().includes('/functions/v1/cuentas-tecnologia') && request.method()==='POST' && JSON.parse(request.postData()||'{}').accion==='registrar_pago') {
        dropped=true;
        await fetch(request.url(),{method:'POST',headers:request.headers(),body:request.postData()});
        await request.abort('failed');
      } else await request.continue();
    };
    page.on('request',intercept);
    await click('Marcar pago realizado');await page.waitForSelector('li [role="alert"]');
    await click('Marcar pago realizado');
    await page.waitForFunction(()=>document.querySelector('li')?.textContent.includes('Al día'));
    assert.equal((await row(added.data.id)).fecha_renovacion,'2027-07-15','Lost response retry advances exactly once');
    await page.setRequestInterception(false);page.off('request',intercept);
    mkdirSync('supabase/.temp',{recursive:true});
    await page.screenshot({path:'supabase/.temp/qa-pagos-desktop.png'});
    await page.setViewport({width:390,height:844});
    assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),'Payment row fits mobile');
    await page.screenshot({path:'supabase/.temp/qa-pagos-mobile.png',fullPage:true});
    await page.setViewport({width:1440,height:1050});
    await page.evaluate((name)=>[...document.querySelectorAll('li button')].find((b)=>b.textContent.includes(name)).click(),browserTool);
    await page.waitForSelector('dialog[open]');
    await click('Registrar pago anticipado');
    await page.waitForSelector('dialog[open] dialog[open]');
    await click('Cancelar');await click('Deshacer');
    await page.waitForFunction(()=>document.querySelector('dialog[open]')?.textContent.includes('Sin confirmar'));
    await click('Cerrar');
    // Reload deliberately locked the vault. Restore it for the credential checks.
    await click('Desbloquear credenciales');await fill('Contraseña del portal',admin.password);await click('Desbloquear');
    await page.waitForFunction(()=>document.body.textContent.includes('Credenciales desbloqueadas en esta pestaña'));
    console.log('OK interfaz pagos: registro, persistencia, deshacer, respuesta perdida, reintento, pago anticipado y móvil.');
    phase='detalle y revelación';
    await page.evaluate((name)=>[...document.querySelectorAll('li button')].find((b)=>b.textContent.includes(name)).click(),browserTool);
    await page.waitForSelector('dialog[open]');
    mkdirSync('supabase/.temp',{recursive:true});
    await page.screenshot({path:'supabase/.temp/qa-cuentas-desktop.png'});
    await click('Mostrar');
    await page.waitForFunction((expected)=>document.querySelector('input[aria-label="Contraseña guardada"]')?.value===expected,{},toolPassword);
    await page.waitForFunction(()=>document.querySelector('input[aria-label="Contraseña guardada"]')?.type==='password',{timeout:35000});
    await click('Copiar contraseña');
    await page.waitForFunction(()=>document.body.textContent.includes('Contraseña copiada.'));
    assert.ok(await page.evaluate(async(expected)=>(await navigator.clipboard.readText())===expected,toolPassword),'Copiar credencial');
    await page.evaluate(()=>navigator.clipboard.writeText(''));
    await click('Editar cuenta');await fill('¿Para qué se usa?','Borrador que debe mantenerse');
    assert.ok(await page.evaluate(()=>document.querySelector('textarea')?.value==='Borrador que debe mantenerse'),'Borrador escrito antes de cambiar de pestaña');
    phase='sesión y navegación';
    await page.evaluate(async()=>{const {supabase}=await import('/src/lib/supabaseClient.js');await supabase.auth.refreshSession();document.dispatchEvent(new Event('visibilitychange'));});
    const other=await browser.newPage();await other.goto('http://127.0.0.1:5173');await page.bringToFront();
    await new Promise((r)=>setTimeout(r,1000));
    assert.ok(await page.evaluate(()=>document.querySelector('textarea')?.value==='Borrador que debe mantenerse'),'El formulario sobrevive al cambio de pestaña y a la renovación JWT');
    assert.ok(page.url().endsWith('/cuentas-tecnologia'),'Ruta preservada');
    console.log('OK interfaz: borrador y ruta conservados al renovar el token y cambiar de pestaña.');
    assert.ok(await page.evaluate((secret)=>!JSON.stringify(localStorage).includes(secret) && !JSON.stringify(sessionStorage).includes(secret),toolPassword),'La contraseña de la herramienta no se persiste en el navegador');
    assert.ok(await page.evaluate((secret)=>!JSON.stringify(localStorage).includes(secret) && !JSON.stringify(sessionStorage).includes(secret),admin.password),'La contraseña del portal no se persiste en el navegador');
    await click('Cancelar');await click('Cerrar');
    await page.click('a[href="/admin/conocimiento"]');await page.waitForFunction(()=>document.body.textContent.includes('CUENTAS DE TECNOLOGÍA'));
    await page.click('a[href="/admin/conocimiento/cuentas-tecnologia"]');await page.waitForSelector('input[aria-label="Buscar cuentas"]');
    assert.ok(await page.evaluate(()=>document.body.textContent.includes('Credenciales desbloqueadas en esta pestaña')),'Desbloqueo sobrevive a la navegación');
    await other.goto(path,{waitUntil:'networkidle2'});await other.waitForSelector('input[aria-label="Buscar cuentas"]');
    assert.ok(await other.evaluate(()=>document.body.textContent.includes('Credenciales protegidas')),'Pestaña nueva bloqueada');
    await page.reload({waitUntil:'networkidle2'});await page.waitForSelector('input[aria-label="Buscar cuentas"]');
    assert.ok(await page.evaluate(()=>document.body.textContent.includes('Credenciales protegidas')),'Recarga bloquea la bóveda pero conserva el login');
    await page.type('input[aria-label="Buscar cuentas"]',browserTool);await page.setViewport({width:390,height:844});
    await page.screenshot({path:'supabase/.temp/qa-cuentas-mobile.png',fullPage:true});
    assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth),'Sin desbordamiento horizontal en móvil');
    await page.evaluate((name)=>[...document.querySelectorAll('li button')].find((b)=>b.textContent.includes(name)).click(),browserTool);
    await page.waitForSelector('dialog[open]');await click('Editar cuenta');
    assert.ok(await page.$eval('dialog[open]',(dialog)=>dialog.scrollWidth<=dialog.clientWidth),'Formulario adaptado a móvil');
    await page.screenshot({path:'supabase/.temp/qa-cuentas-mobile-form.png'});
    await page.evaluate(async()=>{const {supabase}=await import('/src/lib/supabaseClient.js');await supabase.auth.signOut({scope:'local'});});
    await page.waitForFunction(()=>location.pathname==='/login');await other.waitForFunction(()=>location.pathname==='/login');
    console.log('OK navegador: alta, revelación, ocultado, copia, borrador, cambio de pestaña, navegación, recarga, móvil y cierre entre pestañas.');
  } catch(error) {
    console.error(`Etapa de interfaz: ${phase}`);
    if(page && !page.isClosed()) {
      console.error('Avisos de la interfaz:',await page.$$eval('[role="alert"]',(els)=>els.map((e)=>e.textContent).join(' | ')));
      await page.evaluate(()=>{const input=document.querySelector('input[aria-label="Contraseña guardada"]');if(input)input.type='password';});
      mkdirSync('supabase/.temp',{recursive:true});await page.screenshot({path:'supabase/.temp/qa-cuentas-fallo.png'});
    }
    throw error;
  } finally { if(browser) await browser.close();vite.kill(); }
}

try {
  const admin=await makeUser('admin');
  if(process.argv.includes('--browser-only')) {
    await browserChecks(admin);
    await post(admin,{accion:'desbloquear',contrasena:admin.password},401);
    console.log('OK backend: sesión revocada rechazada aunque el JWT no ha expirado.');
  }
  else {
  const other=await makeUser('admin');const auditor=await makeUser('auditor');
  await post(null,{accion:'guardar',cuenta:account},401);
  await post(auditor,{accion:'guardar',cuenta:account},403);
  const legacy=await admin.client.from('cuentas_tecnologia').insert({herramienta:`QA legado ${stamp}`,plan:'Prueba',dia_renovacion:15}).select('id,fecha_renovacion').single();
  assert.ok(!legacy.error && legacy.data.fecha_renovacion===null,'Compatibilidad con cuentas antiguas sin fecha completa');
  accountIds.push(legacy.data.id);
  const created=await post(admin,{accion:'guardar',cuenta:account});const id=created.id;accountIds.push(id);
  await paymentChecks(admin,other,auditor,id);
  await post(admin,{accion:'guardar',cuenta:{...account,id,herramienta:'No debe persistir'},contrasena:toolPassword},423);
  assert.ok((await row(id)).herramienta===account.herramienta,'Guardar sin desbloqueo no cambia metadata');
  await post(admin,{accion:'desbloquear',contrasena:'incorrecta-de-prueba'},401);
  const unlock=await post(admin,{accion:'desbloquear',contrasena:admin.password});
  const token=unlock.desbloqueo;
  await post(admin,{accion:'revelar',id,desbloqueo:token},404);
  await post(admin,{accion:'guardar',cuenta:{...account,id},contrasena:toolPassword,desbloqueo:token});
  const metadata=await row(id,admin.client);
  assert.ok(metadata.tiene_contrasena && metadata.fecha_renovacion==='2028-02-29','Metadata y fecha completas');
  assert.ok(!JSON.stringify(metadata).includes(toolPassword) && !('ciphertext' in metadata),'Listado sin secretos');
  const directFlag=await admin.client.from('cuentas_tecnologia').update({tiene_contrasena:false}).eq('id',id);
  assert.ok(directFlag.error,'No se puede falsificar el indicador de credencial');
  await admin.client.from('cuentas_tecnologia').delete().eq('id',id);
  assert.ok(await row(id),'RLS evita borrar una cuenta con secreto directamente');
  const directRpc=await admin.client.rpc('tecnologia_operar',{p_accion:'validar',p_usuario:admin.id,p_sesion:crypto.randomUUID()});
  assert.ok(directRpc.error,'Gateway privado no ejecutable por authenticated');
  const privateRead=await admin.client.schema('tecnologia_privada').from('credenciales').select('*');
  assert.ok(privateRead.error,'Esquema privado no expuesto');
  await post(admin,{accion:'revelar',id},423);
  await post(other,{accion:'revelar',id,desbloqueo:token},423);
  const secondClient=createClient(url,anon,options);const secondLogin=await secondClient.auth.signInWithPassword({email:admin.email,password:admin.password});
  await post({...admin,session:secondLogin.data.session},{accion:'revelar',id,desbloqueo:token},423);
  const revealed=await post(admin,{accion:'revelar',id,desbloqueo:token});assert.ok(revealed.contrasena===toolPassword,'Descifrado exacto');
  await post(admin,{accion:'guardar',cuenta:{...account,id,uso:'Editado sin cambiar contraseña'}});
  assert.ok((await post(admin,{accion:'revelar',id,desbloqueo:token})).contrasena===toolPassword,'Editar conserva secreto');
  await post(admin,{accion:'guardar',cuenta:{...account,id},eliminar_contrasena:true},423);
  await post(admin,{accion:'guardar',cuenta:{...account,id},eliminar_contrasena:true,desbloqueo:token});
  assert.ok(!(await row(id)).tiene_contrasena,'Eliminación explícita de contraseña');
  await post(admin,{accion:'guardar',cuenta:{...account,id},contrasena:toolPassword,desbloqueo:token});
  await service.from('roles_usuario').update({rol:'auditor'}).eq('user_id',admin.id);
  await post(admin,{accion:'revelar',id,desbloqueo:token},403);
  assert.ok((await row(id,admin.client))===null,'Rol retirado pierde lectura');
  await service.from('roles_usuario').update({rol:'admin'}).eq('user_id',admin.id);
  await post(admin,{accion:'revelar',id,desbloqueo:token},423);
  await post(admin,{accion:'bloquear',desbloqueo:token});
  await post(admin,{accion:'revelar',id,desbloqueo:token},423);
  for(let i=0;i<5;i++) await post(other,{accion:'desbloquear',contrasena:'incorrecta-de-prueba'},401);
  await post(other,{accion:'desbloquear',contrasena:other.password},429);
  console.log('OK backend: permisos, operaciones atómicas, RLS, aislamiento entre usuarios y sesiones, credenciales y límite de intentos.');
  if(process.argv.includes('--browser')) await browserChecks(admin);
  else await admin.client.auth.signOut({scope:'local'});
  await post(admin,{accion:'revelar',id,desbloqueo:token},401);
  console.log('OK backend: sesión revocada rechazada aunque el JWT no ha expirado.');
  }
} catch(error) {
  console.error(`FALLO: ${error.message}`);
  process.exitCode=1;
} finally {
  if(accountIds.length) {
    const result=await service.from('cuentas_tecnologia').delete().in('id',accountIds);
    if(result.error) { console.error('No se pudieron limpiar las cuentas temporales.');process.exitCode=1; }
  }
  for(const person of people) {
    await service.from('roles_usuario').delete().eq('user_id',person.id);
    const result=await service.auth.admin.deleteUser(person.id);
    if(result.error) { console.error(`No se pudo limpiar el usuario temporal ${person.id}.`);process.exitCode=1; }
  }
  console.log('Finalizada la limpieza de datos temporales.');
}
