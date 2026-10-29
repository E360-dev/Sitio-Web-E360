# Ficha de empresa del Radar Comercial

Implementación del 29/10/2026. Solo Radar Comercial; Radar BPS no cambia.

## Comportamiento

- La lista muestra qué hace, señal, hipótesis y servicio principal. «Ver ficha» despliega operación, tamaño, países, contactos, pendientes y evidencias. El formulario de alta empieza plegado en «Preparar candidato».
- Alta y edición usan el mismo formulario. El alta exige empresa, fecha de lista, qué hace, señal, hipótesis y servicio principal. La edición de registros anteriores admite completar los campos gradualmente.
- El permiso del paso 1 habilita «Más opciones → Editar ficha». Solo se edita mientras el registro es candidato o no elegido. Una vez elegido, la introducción queda en lectura, incluso mediante la API. No se puede revertir el estado para sortear el bloqueo.
- Los permisos del paso 2 conservan elección, no elegido y recuperación. Recuperar puede cambiar la fecha de lista. El enfoque, fechas de hitos, revisiones y seguimiento siguen su flujo existente.
- Los errores conservan el borrador. Cancelar no escribe. Los enlaces HTTP/HTTPS se muestran con etiquetas; otros protocolos no se convierten en enlaces.
- Evidencias por bloque: nombre y dato respaldado, enlace, fecha de consulta, estado (dato con fuente, estimación, por validar). «Dato con fuente» exige enlace y fecha. Las fuentes no constituyen aprobación del equipo ni intención de compra.

## Almacenamiento y compatibilidad

La migración `20261029215751_radar_ficha_empresa.sql` añade columnas a `radar_prospectos`, contactos y evidencias JSONB y un trigger privado de validación. Mantiene RLS y comprueba permisos usando la identidad autenticada.

No reescribe ninguna empresa existente. `senal`, `por_que_ahora` y `servicios` se conservan completos. `sitio_web` mantiene su valor y recibe el tipo `sin_definir`; la interfaz muestra «Enlace registrado» hasta que el autor clasifique el enlace. Los demás campos nuevos quedan vacíos o con colecciones vacías.

Los campos descriptivos nuevos permanecen opcionales en almacenamiento para admitir registros anteriores y una reversión del frontend. El formulario nuevo exige la introducción en el alta. Las restricciones de edición sí se validan en el servidor. Las firmas de `crearCandidato` y `actualizarProspecto` se conservan; actualizar exige recuperar la fila modificada para detectar operaciones sin filas afectadas.

El bloqueo de fila de Postgres serializa edición y elección: si la elección confirma primero, la edición se rechaza; si la edición confirma primero, la elección conserva esa información. El trigger no modifica los campos del flujo.

## Validación

- `npm run test:radar`: pruebas del modelo existente y de compatibilidad, requisitos, enlaces y evidencias de la ficha.
- `psql -v ON_ERROR_STOP=1 -f tests/radar-ficha-backend.sql`: permisos reales de roles, datos históricos, fuentes inválidas, recuperación, cierre de lista, diez hitos, bloqueo posterior a elegir y aislamiento. Todos los registros de prueba se revierten.
- `psql -v ON_ERROR_STOP=1 -f tests/radar-backend.sql`: regresión de documentos, revisiones, aprobaciones, agenda y permisos existentes; transacción revertida.
- `RADAR_TEST_DATABASE_URL` apuntando a una base **local desechable** con las migraciones del Radar; `node scripts/probar-radar-ficha-concurrencia.mjs`: ambas carreras entre editar y elegir, en sesiones independientes. El script rechaza servidores remotos.
- `node scripts/probar-radar-ficha-navegador.mjs`: aplicación real con respuestas HTTP interceptadas y datos sintéticos; prueba alta, edición, cancelación, error y reintento, compatibilidad, contactos/evidencias, ficha de elegido y desbordamiento móvil. Capturas en `supabase/.temp/ficha-*.png`. No realiza escrituras en producción.
- `npm run build:rapido`: compilación del frontend sin regenerar contenido editorial.

La validación SQL local usa PostgreSQL 17 y las migraciones del Radar, con fixtures de Auth/Storage; no comprueba el servicio alojado de Auth, el programador Cron ni la entrega Realtime.

## Publicación

Aplicar primero la migración aditiva, y después publicar el frontend compilado. La migración de un elegido por lista ya existente debe precederla; no se debe reemplazar ni ignorar. No ejecutar un envío indiscriminado de todas las migraciones pendientes.

Después de publicar, comprobar acceso, lectura de una ficha antigua, alta/edición de un candidato de prueba y bloqueo al elegir. Revisar que no existan errores de campos desconocidos, permisos o guardado. Si se revierte el frontend, conservar la migración y los datos nuevos. No investigar ni completar ERCO, OIKOS o Arquitectura y Concreto como parte de esta entrega.
