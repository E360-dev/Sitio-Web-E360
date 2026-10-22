import test from 'node:test';
import assert from 'node:assert/strict';
import { prioridadBps,destinosBps,cambiosBps,enlaceBps,fechaLocalBps,VACIA_BPS } from '../src/lib/bpsModelo.mjs';
test('matriz completa de prioridad y datos pendientes',()=>{
 for(const [fit,m,p] of [['A',2,4],['A',1.5,3],['A',1,2],['B',2,3],['B',1.5,2],['B',1,1],['C',2,1],['C',1.5,1],['C',1,1]])assert.equal(prioridadBps(fit,m),p);
 assert.equal(prioridadBps(null,2),0);assert.equal(prioridadBps('A',null),0);
});
test('estados sin saltarse validación y reapertura explícita',()=>{
 assert.deepEqual(destinosBps('nueva'),['validada','descartada']);
 assert.deepEqual(destinosBps('validada'),['en_contacto','descartada','nueva']);
 assert.deepEqual(destinosBps('en_contacto'),['descartada','nueva']);
 assert.deepEqual(destinosBps('descartada'),['nueva']);
});
test('payloads restringidos a capacidades; no se envían metadatos ni estado',()=>{
 const datos={...VACIA_BPS,nombre:'Cuenta',fit:'A',multiplicador:'2',estado:'validada',prioridad:4,revision:99,crm_url:'https://crm.test'};
 const jd=cambiosBps({},datos,{carga:true},true);assert.equal(jd.nombre,'Cuenta');assert.equal(jd.ingresos,null);assert.equal(jd.moneda,'MXN');assert.ok(!('estado'in jd));assert.ok(!('prioridad'in jd));assert.ok(!('crm_url'in jd));
 const diego=cambiosBps({},datos,{gestion:true});assert.ok(!('nombre'in diego));assert.equal(diego.crm_url,'https://crm.test');
 assert.deepEqual(cambiosBps({},datos,{}),{});
 assert.deepEqual(cambiosBps(datos,{...datos,nombre:'Cuenta'},{carga:true}),{});
});
test('enlaces seguros y fecha local de calendario',()=>{
 for(const url of ['javascript:alert(1)','data:text/html,a','//otro.test','no es url'])assert.equal(enlaceBps(url),null);
 assert.equal(enlaceBps('https://e360.pro'),'https://e360.pro/');assert.match(fechaLocalBps(),/^\d{4}-\d{2}-\d{2}$/);
});
