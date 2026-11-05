# Autorización y envío interno a Arturo

Cambio solicitado por JD el 05/11/2026.

| Paso visible | Responsable del proceso | Acción |
| --- | --- | --- |
| 6 | José Luis y Luna | Revisión y visto bueno de la nota. |
| 7 | José Luis | Autorizar a JD a enviar la nota ejecutiva y el plan de acercamiento a Arturo. Sustituye «Presentación a Arturo». |
| 7B | JD | Enviar el correo a Arturo con copia a José Luis, Luna y Diego; registrar el envío. |
| 8 | Arturo | Aprobar y enviar el acercamiento al prospecto. JD tiene permiso operativo para registrar este paso y la fecha real del envío de Arturo. |
| 9 | Diego | CRM y seguimiento. |

La responsabilidad visible del paso 8 permanece en Arturo. La cuenta que registra el envío queda identificada en `completado_por` y el historial: el permiso operativo de JD no atribuye su registro a Arturo. Arturo conserva su permiso anterior del paso 8.

El 7B conserva los IDs existentes: usa ID 11, etiqueta `7B`, orden 75 y desfase 9 días hábiles (jueves de la segunda semana, después de autorizar). El paso 8 mantiene ID 8 y el viernes previsto. El ID 10 sigue siendo la revisión 3B. No se renumeran archivos, enlaces ni comentarios.

## Funcionamiento

- El paso 7 queda asignado a José Luis. Luna conserva los permisos de revisión y visto bueno del paso 6.
- El nuevo paso 7B muestra las versiones vigentes de los dos documentos y las personas que van en copia. JD envía el correo fuera del portal y marca la confirmación antes de registrar el paso. Esta modificación no conecta ni envía correo automáticamente.
- La RPC exige la autorización previa, la existencia de ambos documentos y la confirmación explícita del envío con las copias. Se registra un comentario con la confirmación y los IDs y versiones vigentes. No se altera `fecha_envio`, que corresponde al correo externo de Arturo.
- Se usa el orden del catálogo en lugar de la resta numérica de IDs. Arturo no puede cerrar el paso 8 antes del 7B. JD tampoco puede adelantar el registro del envío externo.
- Las notificaciones y la agenda usan los permisos y el orden del catálogo: al autorizar se habilita JD; al registrar el 7B se habilita el paso 8 para Arturo y para el registro operativo de JD.

## Expedientes existentes y publicación

La migración `20261105214248_radar_envio_interno_arturo.sql` agrega el hito 7B a los expedientes con calendario. En los procesos que ya alcanzaron el envío externo lo marca no exigible mediante `exento_revision`, sin inventar una fecha de correo ni reabrir el proceso. Los expedientes que todavía no llegan al envío externo requieren el paso nuevo. Los candidatos reciben los once hitos al ser elegidos.

Para un expediente existente se toma la fecha compromiso de su paso 7; para uno nuevo se calcula el jueves mediante el catálogo. Las fechas existentes de los demás pasos no se modifican.

Aplicar esta migración concreta antes de publicar el frontend. No ejecutar indiscriminadamente otras migraciones pendientes. Las verificaciones no envían correos ni completan pasos de prospectos reales.

La migración quedó aplicada y verificada en la base del portal el 05/11/2026. Se incorporó el 7B a los dos expedientes con calendario, se comprobaron los permisos de José Luis/JD y se ejecutó la suite transaccional del flujo. Se conservaron los seis prospectos, la firma de su contenido y los diez hitos previamente cerrados. El frontend se entrega en un commit local para que JD haga el push.

## Verificación

- `npm run test:radar`: orden y etiqueta 7B, exenciones y enlaces a notificaciones.
- `psql -v ON_ERROR_STOP=1 -f tests/radar-envio-interno.sql`: permisos, documentos, orden, confirmación obligatoria, registro de versiones, avisos a JD/Arturo y registro de JD del envío externo; todo se revierte.
- Suites SQL existentes `tests/radar-backend.sql` y `tests/radar-ficha-backend.sql`: regresión de revisión documental y fichas; once hitos al elegir.
- `node scripts/probar-radar-ficha-navegador.mjs --envio-interno`: pantalla del paso 7, copias y últimas versiones en 7B, confirmación, error/reintento, permiso operativo de JD en el paso 8 y vista móvil; HTTP interceptado sin escrituras reales. Capturas `supabase/.temp/radar-7b-*.png` y `radar-envio-arturo-mobile.png`.
- Migración local con expedientes sintéticos activo/enviado: el primero queda pendiente; el segundo exento, sin fecha de envío inventada. No se alteran hitos ya completados.
- `npm run build:rapido`: compilación.
