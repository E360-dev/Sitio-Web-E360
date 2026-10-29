import test from 'node:test';
import assert from 'node:assert/strict';
import { datosFicha, prepararFicha, urlSegura } from '../src/lib/radarFicha.mjs';

test('historical prose is preserved, unclassified links keep their type, nested edits do not mutate the record', () => {
  const registro = { empresa: 'Anterior', fecha_lista: '2026-10-30', sitio_web: 'https://example.test', por_que_ahora: 'Texto completo con contacto e hipótesis', contactos: [{ nombre: 'Persona', estado: 'por_validar' }] };
  const d = datosFicha(registro);
  assert.equal(d.tipo_sitio_web, 'sin_definir');
  d.contactos[0].nombre = 'Cambio';
  assert.equal(registro.contactos[0].nombre, 'Persona');
  const p = prepararFicha(d);
  assert.equal(p.por_que_ahora, registro.por_que_ahora);
  assert.equal(p.que_hace, '');
  assert.equal(p.score, null);
  assert.equal(p.investigado_el, null);
});
test('a new candidate requires the introduction but an older one can be completed gradually', () => {
  const d = datosFicha({ empresa: 'Empresa', fecha_lista: '2026-10-30' });
  assert.throws(() => prepararFicha(d, true), /Completa/);
  assert.doesNotThrow(() => prepararFicha(d, false));
  Object.assign(d, { que_hace: 'Vende servicios', senal: 'Expansión', por_que_ahora: 'Hipótesis', servicio_principal: 'Consultoría', score: '12' });
  assert.equal(prepararFicha(d, true).score, 12);
  d.score = '1.5'; assert.throws(() => prepararFicha(d), /entero/);
});
test('unsafe sources and contacts cannot become clickable links or be submitted', () => {
  for (const href of ['javascript:alert(1)', 'data:text/html,a', '/ruta', '', 'ftp://example.test']) assert.equal(urlSegura(href), null);
  assert.ok(urlSegura('https://example.test/path'));
  const d = datosFicha({ empresa: 'Empresa', fecha_lista: '2026-10-30' });
  d.contactos = [{ nombre: 'Persona', estado: 'por_validar', linkedin: 'javascript:alert(1)' }];
  assert.throws(() => prepararFicha(d), /HTTP/);
});
test('estimates and sourced evidence have different requirements and preserve contradictory estimates', () => {
  const d = datosFicha({ empresa: 'Empresa', fecha_lista: '2026-10-30' });
  d.evidencias = [{ bloque: 'tamano', nombre: 'Fuente A: 680; Fuente B: 201–500', estado: 'estimacion' }];
  assert.doesNotThrow(() => prepararFicha(d));
  d.evidencias[0].estado = 'con_fuente';
  assert.throws(() => prepararFicha(d), /fecha de consulta/);
  Object.assign(d.evidencias[0], { enlace: 'https://example.test', fecha_consulta: '2026-10-29' });
  assert.equal(prepararFicha(d).evidencias[0].estado, 'con_fuente');
});
