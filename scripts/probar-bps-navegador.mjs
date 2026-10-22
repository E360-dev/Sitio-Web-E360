// Browser UX tests use intercepted API fixtures, never production writes or accounts.
// Real authorization and atomicity are covered by tests/bps-backend.sql (ROLLBACK).
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { mkdirSync } from 'node:fs';
import puppeteer from 'puppeteer';
import { prioridadBps } from '../src/lib/bpsModelo.mjs';

const ref='crxtzmykprgbgkdbqccd',host='http://127.0.0.1:5183',base='/admin/conocimiento/radar-bps';
const ids={jd:'11111111-1111-4111-8111-111111111111',diego:'22222222-2222-4222-8222-222222222222',arturo:'33333333-3333-4333-8333-333333333333',admin:'44444444-4444-4444-8444-444444444444',otro:'55555555-5555-4555-8555-555555555555'};
const miembros=[{user_id:ids.jd,nombre:'JD QA',carga:true,gestion:false,activo:true},{user_id:ids.diego,nombre:'Diego QA',carga:false,gestion:true,activo:true},{user_id:ids.arturo,nombre:'Arturo QA',carga:false,gestion:false,activo:true}];
const tandas=[],opps=[],comentarios=[],actividad=[];const errors=[];let browser,vite,phase='inicio',bloquearRed=false;
function sesion(actor){const user={id:ids[actor],email:`${actor}@example.test`,aud:'authenticated',role:'authenticated',app_metadata:{},user_metadata:{}};return {access_token:`${Buffer.from('{"alg":"HS256","typ":"JWT"}').toString('base64url')}.${Buffer.from(JSON.stringify({sub:user.id,role:'authenticated',exp:Math.floor(Date.now()/1000)+3600,session_id:'66666666-6666-4666-8666-666666666666'})).toString('base64url')}.fixture`,refresh_token:'fixture-only',token_type:'bearer',expires_in:3600,expires_at:Math.floor(Date.now()/1000)+3600,user};}
function accion(actor,operacion,d){
 const a=miembros.find(m=>m.user_id===ids[actor]&&m.activo),campos=d.campos||{};
 if(!a)return {error:'Sin acceso',code:'42501'};
 if(operacion==='tanda_guardar'){
  if(!a.carga)return {error:'Sin permiso de carga',code:'42501'};
  const t={id:tandas.length+1,...campos,revision:1};tandas.push(t);return t;
 }
 let o=opps.find(o=>o.id===Number(d.id));
 if(operacion==='oportunidad_guardar'){
  if(d.id&&o.revision!==d.revision)return {error:'Otra persona modificó este registro. Recarga antes de guardar.',code:'40001'};
  if(o){const antes={...o};Object.assign(o,campos,{revision:o.revision+1});actividad.push({id:actividad.length+1,oportunidad_id:o.id,autor_nombre:a.nombre,evento:'oportunidad_editada',creado_en:new Date().toISOString(),detalle:{antes,despues:{...o}}});}
  else{o={...campos,id:opps.length+1,estado:'nueva',revision:1,responsable_id:ids.diego,creado_en:new Date().toISOString(),motivo_estado:'',crm_url:''};opps.push(o);actividad.push({id:actividad.length+1,oportunidad_id:o.id,autor_nombre:a.nombre,evento:'oportunidad_creada',creado_en:new Date().toISOString(),detalle:{}});}
  o.corrida_id=Number(o.corrida_id);o.prioridad=prioridadBps(o.fit,o.multiplicador);return o;
 }
 if(operacion==='estado'){const antes=o.estado;o.estado=d.estado;o.revision++;o.motivo_estado=d.motivo;actividad.push({id:actividad.length+1,oportunidad_id:o.id,autor_nombre:a.nombre,evento:'estado_cambiado',creado_en:new Date().toISOString(),detalle:{antes,despues:d.estado,motivo:d.motivo}});return o;}
 if(operacion==='comentar'){comentarios.push({id:comentarios.length+1,oportunidad_id:o.id,autor_nombre:a.nombre,texto:d.texto,creado_en:new Date().toISOString()});return {ok:true};}
 return {ok:true};
}
async function pagina(actor){
 const context=await browser.createBrowserContext(),p=await context.newPage();p.setDefaultTimeout(15000);await p.setViewport({width:1440,height:1000});p.on('pageerror',e=>errors.push(e.message));
 await p.evaluateOnNewDocument((key,s)=>{if(window.top===window&&!localStorage.getItem('bps-qa')){localStorage.setItem(key,JSON.stringify(s));localStorage.setItem('bps-qa','1');}},`sb-${ref}-auth-token`,sesion(actor));
 await p.setRequestInterception(true);p.on('request',async req=>{
  if(!req.url().startsWith(`https://${ref}.supabase.co`)){if(req.url().startsWith(host)||req.url().startsWith('data:'))return req.continue();return req.abort();}
  if(bloquearRed)return req.abort('internetdisconnected');
  const u=new URL(req.url()),path=u.pathname.split('/').at(-1),a=miembros.find(m=>m.user_id===ids[actor]&&m.activo);let data=[];let status=200;let total=0;
  if(req.method()==='OPTIONS')return req.respond({status:204,headers:{'access-control-allow-origin':'*','access-control-allow-headers':'*','access-control-allow-methods':'*'}});
  if(u.pathname.startsWith('/auth/'))data=path==='user'?sesion(actor).user:sesion(actor);
  else if(path==='roles_usuario')data=[{rol:['jd','admin','arturo'].includes(actor)?'admin':'comercial'}];
  else if(path==='bps_accesos'){data=(a||actor==='admin'?miembros:[]).filter(m=>(!u.searchParams.get('user_id')||u.searchParams.get('user_id')===`eq.${m.user_id}`)&&(!u.searchParams.get('activo')||m.activo));}
  else if(path==='bps_corridas')data=a?tandas.map(t=>({...t,bps_oportunidades:[{count:opps.filter(o=>Number(o.corrida_id)===t.id).length}]})):[];
  else if(path==='bps_oportunidades'){
   data=a?opps.filter(o=>[...u.searchParams].every(([k,v])=>!v.startsWith('eq.')||String(o[k])===v.slice(3))):[];
   if(u.searchParams.has('nombre'))data=data.filter(o=>o.nombre.toLowerCase().includes(u.searchParams.get('nombre').slice(7,-1).toLowerCase()));
   data=data.map(o=>({...o,bps_comentarios:comentarios.filter(c=>c.oportunidad_id===o.id),bps_actividad:actividad.filter(c=>c.oportunidad_id===o.id)}));total=data.length;
  }
  else if(path==='bps_ejecutar'){const body=JSON.parse(req.postData());data=accion(actor,body.p_accion,body.p_datos);if(data.error){status=409;data={message:data.error,code:data.code};}}
  else if(path==='radar_usuarios_internos')data=Object.entries(ids).map(([n,user_id])=>({user_id,email:`${n}@example.test`,rol:'comercial'}));
  if(Array.isArray(data)&&req.headers().accept?.includes('application/vnd.pgrst.object'))data=data[0]||null;
  return req.respond({status,contentType:'application/json',headers:{'access-control-allow-origin':'*','access-control-expose-headers':'content-range','content-range':`0-${Math.max(total-1,0)}/${total}`},body:JSON.stringify(data)});
 });return p;
}
async function click(p,text){await p.waitForFunction(s=>[...document.querySelectorAll('button,a')].some(b=>b.textContent.trim()===s),{},text);await p.evaluate(s=>[...document.querySelectorAll('button,a')].find(b=>b.textContent.trim()===s).click(),text);}
async function escribir(p,nombre,valor){const selector=`[name="${nombre}"]`;await p.waitForSelector(selector);await p.$eval(selector,(e,v)=>{const setter=Object.getOwnPropertyDescriptor(e.tagName==='TEXTAREA'?HTMLTextAreaElement.prototype:HTMLInputElement.prototype,'value').set;setter.call(e,v);e.dispatchEvent(new Event('input',{bubbles:true}));},valor);}
async function texto(p,text){await p.waitForFunction(s=>document.body.textContent.includes(s),{},text);}
try{
 vite=spawn(process.execPath,['node_modules/vite/bin/vite.js','--host','127.0.0.1','--port','5183','--strictPort'],{stdio:'ignore',windowsHide:true});
 let ready=false;for(let i=0;i<100;i++){try{if((await fetch(host)).ok){ready=true;break;}}catch{}await new Promise(r=>setTimeout(r,200));}assert.ok(ready,'Servidor local disponible');
 browser=await puppeteer.launch({headless:true,args:['--no-sandbox']});
 phase='alta de tanda';const jd=await pagina('jd');await jd.goto(host+base+'/tandas',{waitUntil:'networkidle2'});await click(jd,'Nueva tanda');await escribir(jd,'nombre','Tanda BPS QA');await escribir(jd,'criterios','Colombia, canales contables');await click(jd,'Guardar tanda');await texto(jd,'0 oportunidades');
 phase='alta de oportunidad';await click(jd,'Oportunidades');await click(jd,'Nueva oportunidad');await escribir(jd,'nombre','Cuenta BPS QA');await jd.select('[name="corrida_id"]','1');await jd.select('[name="fit"]','A');await jd.select('[name="multiplicador"]','2');await escribir(jd,'pais','Colombia');await escribir(jd,'sector','Tecnología');await escribir(jd,'fuentes','https://example.test/fuente');
 assert.equal(await jd.$eval('[name="moneda"]',e=>e.value),'MXN');await escribir(jd,'dolor','Borrador conservado');
 phase='cambio de pestaña y token';await jd.evaluate(async()=>{const {supabase}=await import('/src/lib/supabaseClient.js');await supabase.auth.refreshSession();document.dispatchEvent(new Event('visibilitychange'));window.dispatchEvent(new Event('focus'));});
 assert.equal(await jd.$eval('[name="dolor"]',e=>e.value),'Borrador conservado');await click(jd,'Guardar oportunidad');await texto(jd,'1 oportunidad');await jd.click(`a[href="${base}/oportunidad/1"]`);await texto(jd,'Investigación y seguimiento');assert.ok(!await jd.$('[name="estado"]'),'Carga no gestiona estado');
 phase='gestión Diego';const diego=await pagina('diego');await diego.goto(host+base+'/oportunidad/1',{waitUntil:'networkidle2'});await diego.select('[name="estado"]','validada');await click(diego,'Guardar estado');await texto(diego,'Nueva → Validada');await diego.select('[name="estado"]','en_contacto');await click(diego,'Guardar estado');await texto(diego,'Validada → En contacto');
 await diego.select('[name="estado"]','descartada');assert.equal(await diego.$eval('[name="motivo"]',e=>e.required),true);await escribir(diego,'motivo','No encaja por ahora');await click(diego,'Guardar estado');await texto(diego,'En contacto → Descartada');
 await click(diego,'Editar oportunidad');assert.equal(await diego.$eval('[name="nombre"]',e=>e.disabled),true);await escribir(diego,'siguiente_accion','Retomar con nueva señal');await click(diego,'Guardar oportunidad');await texto(diego,'Ver cambios');
 phase='conflicto de revisión';await click(jd,'Editar oportunidad');await escribir(jd,'dolor','Cambio desde revisión vieja');await click(jd,'Guardar oportunidad');await texto(jd,'Otra persona modificó');assert.equal(await jd.$eval('[name="dolor"]',e=>e.value),'Cambio desde revisión vieja');await click(jd,'Cancelar edición');
 phase='consulta Arturo';const arturo=await pagina('arturo');await arturo.goto(host+base+'/oportunidad/1',{waitUntil:'networkidle2'});await texto(arturo,'Investigación y seguimiento');assert.ok(!await arturo.$('[name="estado"]'));assert.ok(!await arturo.evaluate(()=>[...document.querySelectorAll('button')].some(b=>b.textContent==='Editar oportunidad')));await escribir(arturo,'texto','Revisado por consulta');await click(arturo,'Agregar comentario');await texto(arturo,'Arturo QA');
 phase='móvil';await arturo.setViewport({width:390,height:844});await texto(arturo,'Revisado por consulta');assert.ok(await arturo.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),'Sin desbordamiento móvil');mkdirSync('supabase/.temp',{recursive:true});await arturo.screenshot({path:'supabase/.temp/bps-mobile.png',fullPage:true});
 phase='filtros';await jd.goto(host+base+'?pais=Colombia&fit=A',{waitUntil:'networkidle2'});await texto(jd,'1 oportunidad');await jd.reload({waitUntil:'networkidle2'});assert.ok(jd.url().includes('pais=Colombia'));await texto(jd,'Cuenta BPS QA');
 phase='formulario móvil y red';await jd.setViewport({width:390,height:844});await click(jd,'Nueva oportunidad');await escribir(jd,'nombre','Borrador sin guardar');bloquearRed=true;await jd.evaluate(()=>window.dispatchEvent(new Event('online')));await texto(jd,'Failed to fetch');assert.equal(await jd.$eval('[name="nombre"]',e=>e.value),'Borrador sin guardar');bloquearRed=false;await jd.evaluate(()=>window.dispatchEvent(new Event('online')));await jd.waitForFunction(()=>!document.body.textContent.includes('Failed to fetch'));assert.ok(await jd.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),'Formulario móvil sin desbordamiento');await click(jd,'Cancelar edición');
 phase='admin sin membresía';const admin=await pagina('admin');await admin.goto(host+base,{waitUntil:'networkidle2'});await texto(admin,'Accesos exclusivos');assert.ok(admin.url().endsWith('/accesos'));assert.ok(!await admin.evaluate(()=>[...document.querySelectorAll('nav[aria-label="Radar BPS"] a')].some(a=>a.textContent==='Oportunidades')));
 phase='sin acceso';const otro=await pagina('otro');await otro.goto(host+base,{waitUntil:'networkidle2'});await texto(otro,'No tienes acceso al Radar BPS');
 phase='revocación';miembros.find(m=>m.user_id===ids.arturo).activo=false;await arturo.evaluate(()=>window.dispatchEvent(new Event('online')));await texto(arturo,'Accesos exclusivos');assert.ok(arturo.url().endsWith('/accesos'),'Admin revocado conserva solo administración, no contenido');
 assert.deepEqual(errors,[],'Sin errores JavaScript');console.log('OK BPS navegador: altas, tandas, MXN, estados, perfiles, comentarios, historial, conflicto, filtros, token, borradores, revocación y móvil. Sin escrituras en producción.');
}catch(e){console.error(`FALLO BPS (${phase}): ${e.message}`);if(browser){for(const p of await browser.pages()){console.error((await p.evaluate(()=>document.body.innerText).catch(()=>'' )).slice(-3500));}console.error(errors);}process.exitCode=1;}finally{if(browser)await browser.close();if(vite)vite.kill();}
