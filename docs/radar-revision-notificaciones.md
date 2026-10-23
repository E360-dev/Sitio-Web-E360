# Radar comercial revisión documental y avisos

## Flujo y compatibilidad

El paso interno 10 se presenta como **3B** y se ordena entre 3 y 4 mediante
`radar_pasos.orden`. No se renumeran archivos, permisos, rutas ni hitos anteriores.
Su desfase es cuatro días hábiles desde el viernes de la lista; vence el jueves.
Los demás compromisos se conservan. El admin puede editar sus fechas.
Un admin sin membresía puede leer el catálogo para administrar «Accesos», sin
obtener por ello permiso para consultar prospectos ni documentos del Radar.

Las migraciones añaden el hito a prospectos existentes. Si el enfoque ya estaba
cerrado, `exento_revision` indica una exención histórica, no un visto bueno.
La interfaz, las agendas y el cierre de pasos respetan el orden del catálogo.

## Revisión y permisos

Los cuatro tipos del paso 3 se revisan por archivo y versión. Basta un visto
bueno de alguien con el permiso 3B; inicialmente José Luis y Jhon. Una corrección
requiere texto, bloquea la versión afectada y obliga a subir otra. El autor puede
marcar la observación atendida; un revisor debe resolverla explícitamente al
aprobar. Los comentarios informativos no bloquean. El historial se conserva.

`radar_revisar_archivo` es un puente SECURITY INVOKER hacia una implementación
privada que comprueba `auth.uid()` y los permisos actuales. Las tablas de
observaciones, aprobaciones y actividad no aceptan escrituras de clientes.
Los hitos solo permiten al cliente editar la fecha compromiso según RLS admin;
no se pueden falsificar cierres ni exenciones con un UPDATE directo.

Cada revisión y registro de archivo bloquea la fila del prospecto. La asignación
de versiones es del servidor y tiene un índice único por prospecto/paso/tipo/
versión. Una aprobación vuelve a comprobar la versión vigente tras adquirir el
bloqueo. El cierre automático de 3B exige cuatro versiones aprobadas y ninguna
corrección pendiente. Tras cerrarlo no se sustituyen los documentos de contexto.
El RPC anterior del paso 4 también queda protegido por un trigger de orden.

Los blobs se suben primero y la metadata se registra después. Una subida fallida
se puede limpiar solo si pertenece al usuario y no está registrada. Las versiones
registradas son inmutables para clientes normales, incluido admin.
Se elimina la antigua política que permitía a admin borrar cualquier blob del
bucket. La eliminación de versiones registradas queda reservada a mantenimiento
privilegiado, no a la API normal del portal.

## Visor privado

PDF con páginas, zoom y selección de texto; worker servido por la aplicación.
DOCX convertido en memoria mediante Mammoth, limpiado con DOMPurify e insertado
en un iframe sin permisos de scripts ni mismo origen, con CSP que bloquea recursos
externos. Es una vista de lectura, no una reproducción exacta de Word. Se admiten
también PNG/JPEG; otros formatos siguen disponibles para descarga. El límite de
vista DOCX es 20 MiB para proteger la pestaña frente a archivos excesivos.

Los archivos se solicitan con el JWT del usuario al bucket privado. No se envían
a Google/Microsoft ni a otros visores externos. Las URL blob se revocan al cerrar.
Una copia que un miembro ya descargó no se puede revocar de su dispositivo.

La versión fijada de Mammoth es 1.13.0. `npm audit` registra un aviso moderado sin
corrección publicada para `sprintf-js` a través de `argparse`, usado por la CLI
incluida en el paquete. La aplicación carga `mammoth.browser`, que no incluye
`argparse` ni `sprintf-js`; el importador usa la API de biblioteca, no esa CLI.
No se aplican overrides mayores sin soporte ni actualizaciones masivas de
dependencias ajenas. Los avisos anteriores del proyecto se revisan por separado.

## Corrección del visor PDF · 23-10-2026

Se reprodujo en el sitio publicado que `pdf.worker.min-*.mjs` se entregaba sin
un Content-Type JavaScript válido. El navegador rechazaba iniciar el worker,
provocando el mismo error en todos los PDF, aunque la descarga privada funcionara.
No se modifican archivos, revisiones, etapas ni permisos para corregirlo.

Ambos visores usan ahora `?worker&url` y `worker.format: 'es'`: Vite compila un
worker ESM con extensión `.js` y hash, servido desde el propio sitio. Apache
declara además `application/javascript` para `.js` y `.mjs`; los `.mjs` también
entran en la política de caché de assets. No se usa un CDN ni un visor externo.
El Radar distingue un fallo del lector de un fallo de lectura y ofrece reintento.

Pruebas adicionales:

```powershell
node scripts/probar-pdf-visor.mjs --legacy-worker
npm run test:pdf
node scripts/probar-pdf-visor.mjs --real
```

El primer comando reproduce el fallo anterior con un PDF válido; el segundo
verifica el build de producción bajo un servidor que deliberadamente no reconoce
el MIME `.mjs`, ambos visores, páginas, texto, zoom, móvil, reintento tras un PDF
ilegible y acceso denegado. El modo `--real` lee los cuatro PDF actuales de SONDA
solo en memoria, sin escrituras ni capturas de documentos privados. Las claves
permanecen en el proceso Node y nunca se entregan al navegador. El HTML de pruebas
no se incluye en la compilación normal del sitio.

Para publicar este arreglo hay que desplegar juntos los nuevos assets del frontend
y `dist/.htaccess`. Después se recarga el portal. No requiere migración ni volver
a subir documentos; no queda arreglado en producción solo por hacer el commit local.

## Avisos e historial

Los eventos se escriben en la misma transacción que la acción. Cada aviso tiene
destinatario y clave de deduplicación. Solo su usuario con acceso vigente al
Radar puede leerlo o modificar `leida_en`. Ni los destinatarios ni el contenido
pueden falsificarse desde el cliente. La campana usa Realtime, consulta cada
minuto visible y recupera datos al reconectar o volver a la pestaña.

Los avisos se dirigen al siguiente responsable, al autor ante correcciones y a
los revisores ante nuevas versiones. Se excluye al actor. Los candidatos se
agrupan por lista semanal. El historial del prospecto muestra la actividad al
equipo, sin avisar a todos por cada comentario. No hay correo ni push.

El trabajo `radar-agenda-bogota` ejecuta `radar_privado.agenda()` a las 14:00 UTC
de lunes a viernes, equivalentes a 09:00 America/Bogota. No requiere sesión del
navegador. Resume tareas actuales vencidas o próximas hasta el siguiente día
hábil, excluye etapas bloqueadas y deduplica por usuario/día. Durante 3B distingue
documentos que necesitan nueva versión (autor) de los que esperan revisión.
Consultar `cron.job_run_details` para revisar fallos del trabajo. No se utiliza
`pg_net` ni se almacenan claves adicionales para ejecutarlo.

## SONDA e importación

Se conservan los cuatro PDF v1 y el paso 3 cerrado. La importación autorizada
del Word queda vinculada a esas versiones con procedencia «Comentarios externos
importados por JD». No atribuye identidades de revisores ni crea aprobaciones.
Los cuatro documentos esperan corrección y el contexto general queda en 3B.
El contenido del original y del respaldo no se añade a Git.

El script siguiente adjunta el original al bucket y usa un RPC exclusivo de
service_role. Obtiene la clave en memoria desde la CLI autenticada, sin imprimirla.
El SHA-256 impide duplicados; el mismo original se puede volver a ejecutar:

```powershell
node scripts/importar-comentarios-radar.mjs 'D:/Comentarios SONDA.docx' 7
```

## Verificación y publicación

```powershell
npm run test:radar
npm run test:cuentas
npm exec --yes --package supabase@2.120.0 -- supabase db query --linked --file tests/radar-backend.sql
node scripts/probar-radar-navegador.mjs
npm run build
```

La prueba SQL se revierte completamente, incluidos sus usuarios y avisos. No
genera notificaciones visibles para miembros reales. La prueba de navegador crea
usuarios y avisos temporales, consulta los documentos de SONDA sin modificarlos y
limpia las cuentas al terminar. Capturas de QA y respaldo previo se mantienen en
`supabase/.temp/`, ignorado por Git. No publicar esos archivos ni `capturas/`.

La prueba adicional `scripts/probar-radar-concurrencia.mjs` recibe el entrypoint
JS de una CLI Supabase 2.79+. Usa la transacción de solo bloqueo de
`tests/radar-lock.sql` y peticiones HTTP independientes. No ejecuta aprobaciones
válidas ni sube versiones: las dos solicitudes siempre se rechazan. Se verificó
que ambas esperan el mismo bloqueo y finalizan por timeout sin cambiar SONDA.

Aplicar cada migración nueva antes del frontend y registrar solo esas versiones
en el historial. No ejecutar `db push` indiscriminado: existen divergencias
históricas de numeración ajenas a esta entrega. El frontend se publica mediante
el proceso habitual de SiteGround después del push autorizado por el usuario.
