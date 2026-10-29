// Requires a disposable local Postgres with the Radar migrations applied.
import { spawn, execFileSync } from 'node:child_process';
import { randomUUID } from 'node:crypto';
import assert from 'node:assert/strict';
const url = process.env.RADAR_TEST_DATABASE_URL;
if (!url || !['127.0.0.1', 'localhost', '[::1]'].includes(new URL(url).hostname)) throw new Error('Define RADAR_TEST_DATABASE_URL para una base local desechable.');
const args = ['-X', '-w', '-qAt', '-v', 'ON_ERROR_STOP=1', '-d', url];
const sql = (s) => execFileSync('psql', args, { input: s, encoding: 'utf8', stdio: ['pipe', 'pipe', 'pipe'] }).trim();
const author = randomUUID(), reviewer = randomUUID();
const actor = (id) => `set local role authenticated; select set_config('request.jwt.claim.sub','${id}',true);`;
let ids = [];
function run(s) {
  const child = spawn('psql', args, { stdio: ['pipe', 'pipe', 'pipe'], windowsHide: true });
  let output = '', error = '';
  let locked;
  const ready = new Promise((resolve) => { locked = resolve; });
  child.stdout.on('data', (b) => { output += b; if (output.includes('FICHA_BLOQUEADA')) locked(); });
  child.stderr.on('data', (b) => { error += b; });
  const done = new Promise((resolve, reject) => { child.on('error', reject); child.on('close', (code) => { locked(); resolve({ code, output, error }); }); });
  child.stdin.end(s); return { ready, done };
}
try {
  sql(`insert into auth.users(id,email,role,aud) values('${author}','qa-${author}@example.test','authenticated','authenticated'),('${reviewer}','qa-${reviewer}@example.test','authenticated','authenticated'); insert into public.radar_accesos(user_id,nombre,pasos) values('${author}','QA autor',array[1]),('${reviewer}','QA revisor',array[2]);`);
  ids = sql(`insert into public.radar_prospectos(empresa,fecha_lista,que_hace) values('QA carrera elección','2098-01-03','Original'),('QA carrera edición','2098-01-10','Original') returning id;`).split('\n').map(Number);
  const choosing = run(`begin; ${actor(reviewer)} select public.radar_elegir(${ids[0]});\n\\echo FICHA_BLOQUEADA\nselect pg_sleep(1.5); commit;`);
  await choosing.ready;
  const editAfter = run(`begin; ${actor(author)} update public.radar_prospectos set que_hace='No debe guardarse' where id=${ids[0]}; commit;`);
  assert.equal((await choosing.done).code, 0);
  const blocked = await editAfter.done; assert.notEqual(blocked.code, 0); assert.match(blocked.error, /antes de elegir/);
  assert.equal(sql(`select que_hace from public.radar_prospectos where id=${ids[0]}`), 'Original');
  const editing = run(`begin; ${actor(author)} update public.radar_prospectos set que_hace='Edición anterior a elegir' where id=${ids[1]};\n\\echo FICHA_BLOQUEADA\nselect pg_sleep(1.5); commit;`);
  await editing.ready;
  const chooseAfter = run(`begin; ${actor(reviewer)} select public.radar_elegir(${ids[1]}); commit;`);
  assert.equal((await editing.done).code, 0); assert.equal((await chooseAfter.done).code, 0);
  assert.equal(sql(`select estado||'|'||que_hace from public.radar_prospectos where id=${ids[1]}`), 'en_curso|Edición anterior a elegir');
  console.log('OK concurrencia: elegir primero rechaza la edición pendiente; editar primero conserva la introducción al elegir.');
} finally {
  if (ids.length) sql(`delete from public.radar_prospectos where id in (${ids.join(',')});`);
  sql(`delete from auth.users where id in ('${author}','${reviewer}');`);
}
