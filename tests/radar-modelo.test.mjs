import test from 'node:test';
import assert from 'node:assert/strict';
import { pasoActual, etiquetaPaso, estadoDocumento, requiereCorreccion, destinoNotificacion } from '../src/lib/radarModelo.mjs';
test('3B is ordered between 3 and 4; historical exemptions are not approvals or tasks', () => {
 const hitos=[{paso:4},{paso:10},{paso:3,fecha_real:'2026-10-15'}];
 assert.equal(pasoActual(hitos).paso,10); assert.equal(etiquetaPaso(10),'3B');
 hitos[1].exento_revision=true; assert.equal(pasoActual(hitos).paso,4);
 assert.equal(pasoActual([{paso:1,fecha_real:'2026-10-15'}]),null);
 assert.equal(pasoActual([{paso:3,radar_pasos:{orden:50}},{paso:4,radar_pasos:{orden:40}}]).paso,4);
});
test('reviews belong to individual versions; a new version does not inherit approval', () => {
 const one={id:1,paso:3,tipo:'matriz_riesgos',version:1,radar_revisiones:[{aprobado_por:'reviewer'}]};
 const two={id:2,paso:3,tipo:'matriz_riesgos',version:2,radar_revisiones:[]};
 assert.equal(estadoDocumento(one,[one],[]),'aprobado');
 const obs=[{archivo_id:1,tipo:'correccion'}];
 assert.equal(estadoDocumento(one,[one],obs),'requiere_correccion');
 assert.equal(estadoDocumento(two,[one,two],obs),'pendiente');
 two.radar_revisiones=[{}]; obs[0].resuelta_en='2026-10-21';
 assert.equal(estadoDocumento(two,[one,two],obs),'aprobado');
 assert.equal(estadoDocumento(null,[],[]),'pendiente');
});
test('alerts deep-link to weekly list, document, stage or personal agenda', () => {
 assert.equal(destinoNotificacion({clave:'lista:2026-10-09',prospecto_id:7}),'/admin/conocimiento/radar/lista-corta');
 assert.equal(destinoNotificacion({prospecto_id:7,paso:10,archivo_id:17}),'/admin/conocimiento/radar/prospecto/7?archivo=17&paso=10');
 assert.equal(destinoNotificacion({clave:'agenda:2026-10-21'}),'/admin/conocimiento/radar');
});
test('author tasks distinguish a requested correction from a new version awaiting review', () => {
 const prospecto={radar_archivos:[{id:1,paso:3,tipo:'matriz_riesgos',version:1}],radar_observaciones:[{archivo_id:1,tipo:'correccion'}]};
 assert.equal(requiereCorreccion(prospecto),true);
 prospecto.radar_archivos.push({id:2,paso:3,tipo:'matriz_riesgos',version:2});
 assert.equal(requiereCorreccion(prospecto),false);
});
