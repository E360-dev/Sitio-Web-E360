// Read-only production-document checks with disposable accounts. Only those
// accounts receive synthetic notifications; no real prospect is modified.
import assert from 'node:assert/strict';
import { execFileSync, spawn } from 'node:child_process';
import { mkdirSync } from 'node:fs';
import { randomBytes } from 'node:crypto';
import puppeteer from 'puppeteer';
import { createClient } from '@supabase/supabase-js';
const ref='crxtzmykprgbgkdbqccd', url=`https://${ref}.supabase.co`;
const keys=JSON.parse(execFileSync(process.platform==='win32'?'supabase.exe':'supabase',['projects','api-keys','--project-ref',ref,'--output','json'],{encoding:'utf8',stdio:['ignore','pipe','pipe']}));
const anon=keys.find((k)=>k.name==='anon').api_key;
const options={auth:{persistSession:false,autoRefreshToken:false,detectSessionInUrl:false}};
const service=createClient(url,keys.find((k)=>k.name==='service_role').api_key,options);
const people=[]; let vite,browser,page; let phase='inicio';
async function usuario(rol,pasos,registrar=true) {
 const email=`qa-radar-${Date.now()}-${randomBytes(5).toString('hex')}@example.test`,password=`${randomBytes(24).toString('base64url')}aA1!`;
 const {data,error}=await service.auth.admin.createUser({email,password,email_confirm:true});assert.ok(!error,'Crear usuario temporal');
 people.push(data.user.id);
 assert.ok(!(await service.from('roles_usuario').insert({user_id:data.user.id,rol})).error);
 if(registrar)assert.ok(!(await service.from('radar_accesos').insert({user_id:data.user.id,nombre:'QA Radar',pasos})).error);
 const client=createClient(url,anon,options); const login=await client.auth.signInWithPassword({email,password});assert.ok(!login.error,'Sesión temporal');
 return {...login.data,userId:data.user.id};
}
try {
 const autor=await usuario('admin',[1,3,5]); const revisor=await usuario('auditor',[4,10]);
 const aviso=await service.from('radar_notificaciones').insert({usuario_id:autor.userId,prospecto_id:7,paso:10,clave:'qa:documento',titulo:'Prueba personal del Radar',texto:'Abre la revisión de documentos de SONDA.'}).select('id').single();assert.ok(!aviso.error);
 vite=spawn(process.execPath,['node_modules/vite/bin/vite.js','--host','127.0.0.1','--port','5173','--strictPort'],{stdio:'ignore',windowsHide:true});
 let ready=false;for(let i=0;i<100;i++){try{if((await fetch('http://127.0.0.1:5173')).ok){ready=true;break;}}catch{}await new Promise((r)=>setTimeout(r,200));}assert.ok(ready,'Vite disponible');
 browser=await puppeteer.launch({headless:true,args:['--no-sandbox']});
 const context=await browser.createBrowserContext();page=await context.newPage();page.setDefaultTimeout(25000);await page.setViewport({width:1440,height:1000});
 const errors=[];page.on('pageerror',(e)=>errors.push(e.message));
 await page.evaluateOnNewDocument((key,session)=>{if(window.top!==window)return;if(!localStorage.getItem('qa-init')){localStorage.setItem(key,JSON.stringify(session));localStorage.setItem('qa-init','1');}},`sb-${ref}-auth-token`,autor.session);
 await page.goto('http://127.0.0.1:5173/admin/conocimiento/radar/prospecto/7',{waitUntil:'networkidle2'});
 await page.waitForSelector('#radar-paso-10');
 await page.waitForSelector('button[aria-label^="Notificaciones del Radar:"]');
 const live=await service.from('radar_notificaciones').insert({usuario_id:autor.userId,prospecto_id:7,paso:10,clave:'qa:realtime',titulo:'Aviso en tiempo real',texto:'Solo para esta cuenta de prueba.'});assert.ok(!live.error);
 await page.waitForFunction(()=>document.querySelector('button[aria-label^="Notificaciones del Radar:"]')?.getAttribute('aria-label').includes('2 sin leer'),{timeout:20000});
 assert.ok(await page.$eval('#radar-paso-10',(e)=>e.textContent.includes('Requiere corrección')),'SONDA espera v2');
 assert.ok(await page.$eval('#radar-paso-3',(e)=>e.textContent.includes('Nueva versión')),'El paso 3 cerrado admite correcciones');
 const click=async(text)=>{const handle=await page.evaluateHandle((s)=>{const scope=[...document.querySelectorAll('dialog[open]')].at(-1)||document;return [...scope.querySelectorAll('button')].find((b)=>b.textContent.trim()===s||b.getAttribute('aria-label')===s);},text);assert.ok(handle.asElement(),`Botón ${text}`);await handle.asElement().click();};
 phase='PDF privado';await click('Previsualizar y revisar');await page.waitForSelector('dialog[open] .react-pdf__Page__canvas',{timeout:40000});
 await page.waitForSelector('dialog[open] .react-pdf__Page__textContent span');
 assert.ok(await page.$eval('dialog[open]',(e)=>!e.textContent.includes('No se pudo leer')),'PDF abre sin descarga');
 await click('Página siguiente');await page.waitForFunction(()=>document.querySelector('dialog[open]')?.textContent.includes('Página 2 de'));
 await page.select('select[aria-label="Zoom del documento"]','1.25');
 const textarea='dialog[open] textarea';await page.type(textarea,'Borrador de prueba que no debe perderse');
 await page.evaluate(async()=>{const{ supabase }=await import('/src/lib/supabaseClient.js');await supabase.auth.refreshSession();document.dispatchEvent(new Event('visibilitychange'));});
 const other=await context.newPage();await other.goto('http://127.0.0.1:5173/admin/dashboard');await page.bringToFront();
 await new Promise((r)=>setTimeout(r,800));assert.equal(await page.$eval(textarea,(e)=>e.value),'Borrador de prueba que no debe perderse','El borrador sobrevive a renovación y cambio de pestaña');
 await page.setOfflineMode(true);
 const reconnect=await service.from('radar_notificaciones').insert({usuario_id:autor.userId,prospecto_id:7,paso:10,clave:'qa:reconexion',titulo:'Aviso durante desconexión',texto:'Se recupera al volver la conexión.'});assert.ok(!reconnect.error);
 await page.setOfflineMode(false);await page.evaluate(()=>window.dispatchEvent(new Event('online')));
 await page.waitForFunction(()=>document.querySelector('button[aria-label^="Notificaciones del Radar:"]')?.getAttribute('aria-label').includes('3 sin leer'),{timeout:20000});
 assert.equal(await page.$eval(textarea,(e)=>e.value),'Borrador de prueba que no debe perderse','Reconectar no desmonta el borrador');
 mkdirSync('supabase/.temp',{recursive:true});await page.screenshot({path:'supabase/.temp/radar-revision-desktop.png'});
 await click('Cerrar previsualización');
 phase='DOCX privado';await click('Ver respaldo de comentarios externos');
 await page.waitForSelector('iframe[title="Vista de lectura del documento Word"]',{timeout:40000});
 const frame=await (await page.$('iframe')).contentFrame();await frame.waitForSelector('p');
 assert.ok((await frame.evaluate(()=>document.body.textContent)).includes('SONDA'),'DOCX renderizado en el portal');
 assert.equal(await page.$eval('iframe',(e)=>e.getAttribute('sandbox')),'','Sandbox sin scripts');
 const seguro=await page.evaluate(async()=>{const {sanearDocx}=await import('/src/components/admin/conocimiento/radar/VisorRadar.jsx');return sanearDocx('<script>alert(1)</script><p onclick="alert(1)">Texto</p><a href="javascript:alert(1)">enlace</a><img src="https://example.test/exfil" />');});
 assert.ok(!/script|onclick|href|src=/.test(seguro),'HTML peligroso eliminado');
 await click('Cerrar previsualización');
 phase='notificaciones';
 const bell=await page.$('button[aria-label^="Notificaciones del Radar:"]');assert.ok(bell,'Campana disponible fuera del Radar');await bell.click();
 await page.waitForFunction(()=>document.querySelector('dialog[open]')?.textContent.includes('Prueba personal del Radar'));
 await page.evaluate(()=>[...document.querySelectorAll('dialog[open] button')].find((b)=>b.textContent.includes('Prueba personal del Radar')).click());
 await page.waitForFunction(()=>!document.querySelector('dialog[open]'));
 assert.ok((await service.from('radar_notificaciones').select('leida_en').eq('id',aviso.data.id).single()).data.leida_en,'Lectura persistida');
 phase='móvil';await page.setViewport({width:390,height:844});await click('Previsualizar y revisar');await page.waitForSelector('dialog[open] .react-pdf__Page__textContent span');
 assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),'Sin desbordamiento móvil');
 assert.ok(await page.$eval('dialog[open]',(e)=>e.scrollWidth<=e.clientWidth+2),'Visor móvil sin desbordamiento');
 await page.screenshot({path:'supabase/.temp/radar-revision-mobile.png'});await click('Cerrar previsualización');
 phase='revisor';const rc=await browser.createBrowserContext();const rp=await rc.newPage();
 await rp.evaluateOnNewDocument((key,session)=>{if(window.top===window)localStorage.setItem(key,JSON.stringify(session));},`sb-${ref}-auth-token`,revisor.session);
 await rp.goto('http://127.0.0.1:5173/admin/conocimiento/radar/prospecto/7',{waitUntil:'networkidle2'});await rp.waitForSelector('#radar-paso-10');
 await rp.$eval('#radar-paso-10 button',(b)=>b.click());await rp.waitForSelector('dialog[open] textarea');
 assert.ok(await rp.evaluate(()=>[...document.querySelectorAll('dialog[open] button')].find((b)=>b.textContent==='Aprobar esta versión')?.disabled),'Revisor no aprueba v1 con correcciones');
 assert.ok(await rp.evaluate(()=>!![...document.querySelectorAll('dialog[open] button')].find((b)=>b.textContent==='Solicitar corrección')),'Revisor puede pedir corrección');
 assert.ok(!await rp.evaluate(()=>document.body.textContent.includes('Subir nueva versión')),'Revisor no sustituye documentos de JD');
 phase='admin sin acceso al Radar';const gestor=await usuario('admin',[],false);const gc=await browser.createBrowserContext();const gp=await gc.newPage();
 await gp.evaluateOnNewDocument((key,session)=>{if(window.top===window)localStorage.setItem(key,JSON.stringify(session));},`sb-${ref}-auth-token`,gestor.session);
 await gp.goto('http://127.0.0.1:5173/admin/conocimiento/radar',{waitUntil:'networkidle2'});
 await gp.waitForSelector('button[title="Paso 3B: Revisión de documentos"]');
 assert.ok(gp.url().endsWith('/accesos'),'Admin sin membresía administra accesos, no prospectos');
 assert.equal(errors.length,0,`Sin errores JavaScript (${errors[0]||''})`);
 console.log('OK navegador: PDF privado con páginas/zoom/texto, DOCX aislado, permisos, notificaciones, lectura, móvil y borrador estable.');
}catch(e){console.error(`FALLO (${phase}): ${e.message}`);if(page){mkdirSync('supabase/.temp',{recursive:true});await page.screenshot({path:'supabase/.temp/radar-fallo.png',fullPage:true}).catch(()=>{});}process.exitCode=1;}
finally {
 if(browser)await browser.close();if(vite)vite.kill();
 for(const id of people){await service.from('radar_accesos').delete().eq('user_id',id);await service.from('roles_usuario').delete().eq('user_id',id);const {error}=await service.auth.admin.deleteUser(id);if(error){console.error('No se pudo limpiar un usuario temporal.');process.exitCode=1;}}
 console.log('Finalizada limpieza de usuarios y notificaciones temporales.');
}
