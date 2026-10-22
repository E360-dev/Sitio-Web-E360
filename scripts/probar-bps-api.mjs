// Real REST/RPC smoke test. Creates one disposable Auth account, never opportunities.
// API keys/passwords stay in memory. Membership and user are removed in finally.
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { randomBytes } from 'node:crypto';
import { createClient } from '@supabase/supabase-js';
const ref='crxtzmykprgbgkdbqccd',url=`https://${ref}.supabase.co`;
const keys=JSON.parse(execFileSync(process.platform==='win32'?'supabase.exe':'supabase',['projects','api-keys','--project-ref',ref,'--output','json'],{encoding:'utf8',stdio:['ignore','pipe','pipe']}));
const opciones={auth:{persistSession:false,autoRefreshToken:false,detectSessionInUrl:false}};
const anon=keys.find(k=>k.name==='anon').api_key;
const service=createClient(url,keys.find(k=>k.name==='service_role').api_key,opciones);
const cliente=createClient(url,anon,opciones);let uid;
try{
 const email=`qa-bps-api-${Date.now()}-${randomBytes(5).toString('hex')}@example.test`,password=randomBytes(28).toString('base64url')+'aA1!';
 const creado=await service.auth.admin.createUser({email,password,email_confirm:true});assert.ok(!creado.error,'Crear cuenta temporal');uid=creado.data.user.id;
 assert.ok(!(await service.from('roles_usuario').upsert({user_id:uid,rol:'admin'},{onConflict:'user_id'})).error,'Rol temporal');
 assert.ok(!(await cliente.auth.signInWithPassword({email,password})).error,'Autenticación real');
 let r=await cliente.from('bps_oportunidades').select('id');assert.ok(!r.error&&r.data.length===0,'Admin sin membresía sin datos');
 r=await cliente.rpc('bps_ejecutar',{p_accion:'comentar',p_datos:{id:-1,texto:'No escribir'}});assert.equal(r.error?.code,'42501','RPC no permite admin sin membresía');
 assert.ok(!(await service.from('bps_accesos').insert({user_id:uid,nombre:'QA API temporal',carga:true,gestion:false})).error,'Membresía temporal');
 r=await cliente.from('bps_corridas').select('*,bps_oportunidades(count)');assert.ok(!r.error,'REST, RLS y relación de tandas accesibles');
 r=await cliente.rpc('bps_ejecutar',{p_accion:'__qa_invalida',p_datos:{}});assert.ok(r.error?.message.includes('no reconocida'),'Puente RPC llega a implementación privada con autorización');
 r=await cliente.rpc('bps_ejecutar',{p_accion:'tanda_guardar',p_datos:{campos:{nombre:''}}});assert.ok(r.error,'Alta inválida rechazada sin escribir');
 r=await cliente.from('bps_oportunidades').update({estado:'validada'}).eq('id',-1);assert.equal(r.error?.code,'42501','UPDATE directo denegado');
 assert.ok(!(await service.from('bps_accesos').update({activo:false}).eq('user_id',uid)).error);
 r=await cliente.rpc('bps_ejecutar',{p_accion:'__qa_invalida',p_datos:{}});assert.equal(r.error?.code,'42501','Revocación con JWT todavía vigente');
 const sinSesion=createClient(url,anon,opciones);r=await sinSesion.rpc('bps_ejecutar',{p_accion:'__qa_invalida',p_datos:{}});assert.ok(r.error,'Anon sin RPC');
 console.log('OK BPS API real: Auth, REST, RLS, RPC privado, admin sin membresía, validación atómica y revocación. Sin altas de tandas u oportunidades.');
}catch(e){console.error(`FALLO BPS API: ${e.message}`);process.exitCode=1;}finally{
 if(uid){for(const tabla of ['bps_accesos','roles_usuario'])assert.ok(!(await service.from(tabla).delete().eq('user_id',uid)).error,'Limpiar membresía temporal');assert.ok(!(await service.auth.admin.deleteUser(uid)).error,'Limpiar cuenta temporal');}
}
