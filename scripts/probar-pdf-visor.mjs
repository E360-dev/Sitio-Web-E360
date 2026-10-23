// Build and test the real components with Apache-like MIME handling (no .mjs type).
// --legacy-worker reproduces the former failure without editing source files.
// --real reads SONDA's four current PDFs in memory; never creates users or writes Storage.
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { mkdtempSync,readFileSync,existsSync,mkdirSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { extname,join,resolve,sep } from 'node:path';
import { createServer } from 'node:http';
import { build } from 'vite';
import puppeteer from 'puppeteer';

const legacy=process.argv.includes('--legacy-worker');
const real=process.argv.includes('--real');
const carpeta=mkdtempSync(join(tmpdir(),'e360-pdf-qa-'));
function pdfPrueba(){
 const stream=n=>`BT /F1 18 Tf 30 140 Td (PDF QA pagina ${n}) Tj ET`;
 const objetos=['<< /Type /Catalog /Pages 2 0 R >>','<< /Type /Pages /Kids [3 0 R 5 0 R] /Count 2 >>',
  '<< /Type /Page /Parent 2 0 R /MediaBox [0 0 300 200] /Resources << /Font << /F1 7 0 R >> >> /Contents 4 0 R >>',`<< /Length ${stream(1).length} >>\nstream\n${stream(1)}\nendstream`,
  '<< /Type /Page /Parent 2 0 R /MediaBox [0 0 300 200] /Resources << /Font << /F1 7 0 R >> >> /Contents 6 0 R >>',`<< /Length ${stream(2).length} >>\nstream\n${stream(2)}\nendstream`,'<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>'];
 let body='%PDF-1.4\n';const offsets=[0];for(const [i,o]of objetos.entries()){offsets.push(Buffer.byteLength(body));body+=`${i+1} 0 obj\n${o}\nendobj\n`;}
 const xref=Buffer.byteLength(body);body+=`xref\n0 8\n0000000000 65535 f \n${offsets.slice(1).map(n=>`${String(n).padStart(10,'0')} 00000 n \n`).join('')}trailer\n<< /Size 8 /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF\n`;return Buffer.from(body);
}
const bytes=pdfPrueba();let browser,server;let fase='compilar harness';const workersServidos=[];const avisos=[];
await build({logLevel:'warn',base:'/',plugins:legacy?[{name:'qa-worker-anterior',enforce:'pre',transform(code,id){if(/(?:VisorRadar|PdfViewer)\.jsx$/.test(id))return code.replace('pdf.worker.min.mjs?worker&url','pdf.worker.min.mjs?url');}}]:[],build:{outDir:carpeta,emptyOutDir:false,copyPublicDir:false,rollupOptions:{input:resolve('tests/pdf-visor.html')}}});
server=createServer((req,res)=>{
 const ruta=decodeURIComponent(new URL(req.url,'http://localhost').pathname);const file=resolve(carpeta,'.'+ruta);
 if(!file.startsWith(carpeta+sep)||!existsSync(file)){res.writeHead(404);res.end();return;}
 const tipo={'.html':'text/html','.js':'application/javascript','.css':'text/css','.svg':'image/svg+xml'}[extname(file)]||'application/octet-stream';
 if(/pdf\.worker/.test(file))workersServidos.push({url:ruta,mime:tipo});
 res.writeHead(200,{'Content-Type':tipo,'X-Content-Type-Options':'nosniff'});res.end(readFileSync(file));
});
await new Promise(r=>server.listen(0,'127.0.0.1',r));const host=`http://127.0.0.1:${server.address().port}`;
async function abrir(data=bytes,visor='radar',denied=false){
 const p=await browser.newPage();p.setDefaultTimeout(20000);await p.setViewport({width:1440,height:1000});
 p.on('console',m=>{if(m.type()==='error'||m.type()==='warn')avisos.push(m.text());});
 await p.evaluateOnNewDocument((data,denied)=>{window.__pdfBytes=data;window.__pdfDenied=denied;},Array.from(data),denied);
 await p.setRequestInterception(true);p.on('request',req=>req.url().startsWith(host)||/^(blob:|data:)/.test(req.url())?req.continue():req.abort());
 await p.goto(`${host}/tests/pdf-visor.html?visor=${visor}`,{waitUntil:'networkidle2'});return {p,workers:workersServidos};
}
try{
 browser=await puppeteer.launch({headless:true,args:['--no-sandbox']});
 fase='worker y PDF Radar';const {p,workers}=await abrir();
 if(legacy){await p.waitForSelector('[role="alert"]');assert.ok(workers.some(w=>w.url.endsWith('.mjs')&&w.mime==='application/octet-stream'));console.log('REPRODUCIDO: el worker anterior .mjs sin MIME JavaScript impide abrir un PDF válido.');}
 else{
  await p.waitForSelector('.react-pdf__Page__canvas');await p.waitForSelector('.react-pdf__Page__textContent span');
  assert.ok(workers.some(w=>new URL(w.url,host).pathname.endsWith('.js')&&w.mime==='application/javascript'),'Worker ESM servido como JavaScript');
  await p.click('[aria-label="Página siguiente"]');await p.waitForFunction(()=>document.body.textContent.includes('Página 2 de 2'));
  await p.select('[aria-label="Zoom del documento"]','1.25');
  fase='móvil';await p.setViewport({width:390,height:844});assert.ok(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));mkdirSync('supabase/.temp',{recursive:true});await p.screenshot({path:'supabase/.temp/pdf-visor-mobile.png'});await p.close();
  fase='visor general';const general=await abrir(bytes,'general');await general.p.waitForSelector('.react-pdf__Page__canvas');await general.p.close();
  fase='archivo ilegible y reintento';const corrupto=await abrir(Buffer.from('%PDF-1.4\ninvalid'));await corrupto.p.waitForSelector('[role="alert"]');await corrupto.p.evaluate(data=>{window.__pdfBytes=data;},Array.from(bytes));await corrupto.p.evaluate(()=>[...document.querySelectorAll('button')].find(b=>b.textContent==='Reintentar previsualización').click());await corrupto.p.waitForSelector('.react-pdf__Page__canvas');await corrupto.p.close();
  fase='acceso denegado';const denegado=await abrir(bytes,'radar',true);await denegado.p.waitForSelector('[role="alert"]');assert.ok(await denegado.p.evaluate(()=>document.body.textContent.includes('Comprueba tu acceso')));assert.equal(await denegado.p.$('.react-pdf__Page__canvas'),null);await denegado.p.close();
  if(real){
   fase='PDF privados reales';const {createClient}=await import('@supabase/supabase-js');
   const ref='crxtzmykprgbgkdbqccd';const keys=JSON.parse(execFileSync(process.platform==='win32'?'supabase.exe':'supabase',['projects','api-keys','--project-ref',ref,'--output','json'],{encoding:'utf8',stdio:['ignore','pipe','pipe']}));
   const client=createClient(`https://${ref}.supabase.co`,keys.find(k=>k.name==='service_role').api_key,{auth:{persistSession:false,autoRefreshToken:false}});
   const archivos=await client.from('radar_archivos').select('id,tipo,version,ruta,nombre').eq('prospecto_id',7).eq('paso',3).order('version',{ascending:false});assert.ok(!archivos.error,'Leer metadata autorizada');
   const actuales=[...new Map(archivos.data.filter(a=>a.nombre.toLowerCase().endsWith('.pdf')).map(a=>[a.tipo,a]).reverse()).values()];
   assert.equal(actuales.length,4,'Cuatro tipos de documentos vigentes');
   for(const a of actuales){const d=await client.storage.from('radar').download(a.ruta);assert.ok(!d.error,'Descarga privada autorizada');const doc=await abrir(new Uint8Array(await d.data.arrayBuffer()));await doc.p.waitForSelector('.react-pdf__Page__canvas');await doc.p.close();}
   console.log('OK: cuatro PDF actuales de SONDA renderizados; archivos solo en memoria, sin cambios ni capturas de contenido privado.');
  }
  console.log('OK PDF: build de producción, MIME Apache, ambos visores, páginas, texto, zoom, móvil, reintento y acceso denegado.');
 }
}catch(e){console.error(`FALLO PDF (${fase}): ${e.message}`);if(!real)console.error({workers:workersServidos,avisos});process.exitCode=1;}finally{if(browser)await browser.close();if(server)await new Promise(r=>server.close(r));}
