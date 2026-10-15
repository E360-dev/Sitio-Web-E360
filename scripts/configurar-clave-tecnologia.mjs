// Creates a versioned secret exactly once. No plaintext key is printed or
// written to the repository. Windows keeps a DPAPI-encrypted recovery artifact.
import { execFileSync } from 'node:child_process';
import { randomBytes } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

const project = 'crxtzmykprgbgkdbqccd';
const cli = process.platform === 'win32' ? 'supabase.exe' : 'supabase';
const name = 'TECH_ACCOUNTS_KEY_V1';
const run = (args) => execFileSync(cli, args, { encoding: 'utf8', stdio: ['ignore','pipe','pipe'] });
const powershell = (script, env) => {
  const childEnv = { ...process.env, ...env };
  // A parent PowerShell 7 module path prevents Windows PowerShell 5 from
  // discovering its built-in DPAPI cmdlets. Let that process use its defaults.
  for (const key of Object.keys(childEnv)) if (key.toLowerCase() === 'psmodulepath') delete childEnv[key];
  return execFileSync('powershell.exe', ['-NoProfile','-EncodedCommand',Buffer.from(`$ErrorActionPreference='Stop'; try { ${script} } catch { [Console]::Error.WriteLine($_.CategoryInfo.Reason); exit 1 }`,'utf16le').toString('base64')], {
    encoding:'utf8', env:childEnv, stdio:['ignore','pipe','pipe'],
  });
};
let stage = 'listado de secretos';
try {
  const listed = JSON.parse(run(['secrets','list','--project-ref',project,'--output','json']));
  const secrets = Array.isArray(listed) ? listed : listed.secrets;
  if (!Array.isArray(secrets)) throw new Error('INVALID_LIST');
  if (secrets.some((secret) => secret.name === name)) {
    console.log(`${name} ya existe; se conserva sin reemplazarla.`);
  } else {
    if (process.platform !== 'win32') throw new Error('RECOVERY_REQUIRES_WINDOWS');
    const directory = resolve('supabase/.temp'); mkdirSync(directory, { recursive: true });
    const recovery = resolve(directory, 'tech-accounts-key-v1.dpapi');
    let key;
    stage = 'copia de recuperación protegida';
    if (existsSync(recovery)) {
      key = powershell('$s = ConvertTo-SecureString $env:TECH_RECOVERY_BLOB; [System.Net.NetworkCredential]::new("", $s).Password', {
        TECH_RECOVERY_BLOB: readFileSync(recovery,'utf8').trim(),
      }).trim();
    } else {
      key = randomBytes(32).toString('base64');
      const protectedKey = powershell('ConvertTo-SecureString $env:TECH_SETUP_KEY -AsPlainText -Force | ConvertFrom-SecureString', { TECH_SETUP_KEY:key });
      writeFileSync(recovery, protectedKey.trim(), { flag:'wx', mode:0o600 });
    }
    stage = 'configuración remota';
    run(['secrets','set',`${name}=${key}`,'--project-ref',project]);
    key = undefined;
    console.log(`${name} configurada. Recuperación protegida por Windows en supabase/.temp/tech-accounts-key-v1.dpapi.`);
  }
} catch (error) {
  console.error(`No se pudo completar ${stage} (${error.code || error.status || error.name}). No se ha mostrado ningún secreto.`);
  if (stage === 'copia de recuperación protegida') console.error(String(error.stderr || '').replace(/[^A-Za-z\r\n]/g, '').slice(0,120));
  process.exitCode = 1;
}
