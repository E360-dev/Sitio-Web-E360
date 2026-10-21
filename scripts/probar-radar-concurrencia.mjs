// Optional live mutex probe. The coordinating SQL transaction only locks a
// prospect temporarily and rolls back. Both HTTP requests below always fail
// validation, so neither can change a document or approve a real version.
// Start: node scripts/probar-radar-concurrencia.mjs <absolute CLI JS entrypoint>
// Requires CLI 2.79+, with db query. Uses a separate CLI connection, not the
// connector's serialized queue. The lock transaction rolls back after 12 sec.
import assert from 'node:assert/strict';
import { execFileSync, spawn } from 'node:child_process';
import { existsSync } from 'node:fs';
import { randomBytes } from 'node:crypto';
import { createClient } from '@supabase/supabase-js';
const cliModule=process.argv[2];if(!cliModule?.endsWith('supabase.js')||!existsSync(cliModule))throw new Error('Indica el entrypoint JS de la CLI Supabase 2.79+');
const ref='crxtzmykprgbgkdbqccd',url=`https://${ref}.supabase.co`;
const keys=JSON.parse(execFileSync(process.platform==='win32'?'supabase.exe':'supabase',['projects','api-keys','--project-ref',ref,'--output','json'],{encoding:'utf8',stdio:['ignore','pipe','pipe']}));
const anon=keys.find(k=>k.name==='anon').api_key,options={auth:{persistSession:false,autoRefreshToken:false}};
const service=createClient(url,keys.find(k=>k.name==='service_role').api_key,options);
let uid,lockProcess;
try{
 const password=`${randomBytes(24).toString('base64url')}aA1!`;
 const user=await service.auth.admin.createUser({email:`qa-radar-${Date.now()}-${randomBytes(5).toString('hex')}@example.test`,password,email_confirm:true});assert.ok(!user.error);uid=user.data.user.id;
 assert.ok(!(await service.from('roles_usuario').insert({user_id:uid,rol:'auditor'})).error);
 assert.ok(!(await service.from('radar_accesos').insert({user_id:uid,nombre:'QA Mutex',pasos:[3,10]})).error);
 const client=createClient(url,anon,options),login=await client.auth.signInWithPassword({email:user.data.user.email,password});assert.ok(!login.error);
 const {data:archivo,error}=await service.from('radar_archivos').select('id,prospecto_id').eq('prospecto_id',7).eq('tipo','matriz_riesgos').eq('version',1).single();assert.ok(!error);
 const pending=await service.from('radar_observaciones').select('id').eq('archivo_id',archivo.id).eq('tipo','correccion').is('resuelta_en',null);assert.ok(!pending.error&&pending.data.length,'La v1 debe tener correcciones que impidan aprobarla');
 const headers={apikey:anon,Authorization:`Bearer ${login.data.session.access_token}`,'Content-Type':'application/json'};
 const request=async(kind)=>{
  const start=Date.now();
  const path=kind==='revision'?'/rest/v1/rpc/radar_revisar_archivo':'/rest/v1/radar_archivos';
  const body=kind==='revision'?{p_archivo:archivo.id,p_accion:'aprobar'}:{prospecto_id:7,paso:3,tipo:'matriz_riesgos',nombre:'QA-no-publicar.pdf',ruta:'7/3/QA-no-existe.pdf',subido_por:uid};
  const r=await fetch(url+path,{method:'POST',headers,body:JSON.stringify(body),signal:AbortSignal.timeout(45000)}),data=await r.json();
  assert.ok(!r.ok,`${kind} debe fallar sin modificar SONDA`);
  return {kind,elapsed:Date.now()-start,code:data.code};
 };
 await request('revision');await request('subida');
 console.log('Solicitudes sin escritura verificadas. Iniciando conexión SQL independiente.');
 lockProcess=spawn(process.execPath,[cliModule,'db','query','--linked','--file','tests/radar-lock.sql'],{stdio:'ignore',windowsHide:true});
 const lockDone=new Promise((resolve)=>{lockProcess.on('error',()=>resolve(false));lockProcess.on('exit',(code)=>resolve(code===0));});
 await new Promise(r=>setTimeout(r,3500));
 const results=await Promise.all([request('revision'),request('subida')]);
 for(const r of results)assert.ok(r.elapsed>=2500||['55P03','57014'].includes(r.code),`${r.kind} no coincidió con la ventana de bloqueo`);
 assert.ok(await lockDone,'La transacción de bloqueo terminó correctamente');
 console.log('OK concurrencia HTTP: revisiones y subidas serializadas por el mismo prospecto; cero cambios de documentos.',JSON.stringify(results));
}catch(e){console.error('FALLO concurrencia:',e.message);process.exitCode=1;}
finally{if(uid){await service.from('radar_accesos').delete().eq('user_id',uid);await service.from('roles_usuario').delete().eq('user_id',uid);const r=await service.auth.admin.deleteUser(uid);if(r.error)process.exitCode=1;}console.log('Limpieza mutex finalizada.');}
