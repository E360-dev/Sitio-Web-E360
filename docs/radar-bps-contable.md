# Radar BPS Contable

Sección independiente en `/admin/conocimiento/radar-bps`, dentro del Centro de
conocimiento. No comparte prospectos, etapas, archivos, accesos ni notificaciones
con Radar Comercial. No se cambian los permisos de Cuentas de tecnología.

## Operación

1. JD crea una tanda con nombre, fecha de calendario, criterios y notas.
2. En Oportunidades registra cada cuenta directa o pecera/canal, eligiendo su tanda.
3. Diego califica y mantiene el seguimiento: Nueva → Validada → En contacto.
   Puede descartar desde cualquier estado; descartar o devolver a Nueva exige motivo.
4. Arturo consulta y comenta. Todos los miembros pueden comentar sin modificar
   comentarios históricos. No hay borrado definitivo por la API del portal.

No hay límite semanal, empresa única por tanda ni aprobaciones documentales.
Los campos desconocidos aparecen como «Por investigar». País y tamaño no excluyen
oportunidades. Los ingresos son opcionales, no negativos, con moneda MXN por
defecto; el rango 100–1,000 millones MXN es solo una referencia de negocio.

El formulario comprende los doce campos del MVP: nombre, tamaño, tipo, fit,
detonante, dolor, multiplicador, persona objetivo, relación/ruta, contacto,
siguiente acción y fuentes; además país, sector, sitio web/LinkedIn, ingresos,
moneda, responsable y enlace CRM. Las fuentes se guardan como texto, no como HTML.
Solo se permiten enlaces HTTP/HTTPS en sitio web y CRM.

Prioridad calculada por el servidor:

| Fit | 1x | 1.5x | 2x |
|---|---|---|---|
| A | Media | Alta | Máxima |
| B | Baja | Media | Alta |
| C | Baja | Baja | Baja |

Sin fit o multiplicador: «Por investigar», ordenado después de las prioridades
definidas. Se conservan los dos criterios separados, sin un score opaco.

El listado tiene búsqueda por nombre, filtros por tipo, país y sector exactos,
fit, multiplicador, prioridad, estado, responsable y tanda; paginación de 30.
Los filtros están en la URL. Los borradores se conservan en memoria del módulo
durante la navegación y al cambiar de pestaña/renovar token, nunca en localStorage.
Una recarga completa sí descarta los borradores. Cancelar cierra el formulario
pero conserva su borrador hasta guardar o terminar la sesión del módulo.

## Accesos y seguridad

`bps_accesos` guarda membresía activa y capacidades combinables:

- Sin capacidades: lectura y comentarios.
- Carga: crear/editar tandas y la investigación de oportunidades. No cambia estados.
- Gestión: fit, multiplicador, persona, relación/ruta, contacto, siguiente acción,
  responsable, CRM y cambios de estado. No crea tandas ni oportunidades por sí sola.
- Admin del portal: administra accesos, incluso sin membresía. Para consultar
  contenido también necesita membresía BPS. Puede asignar ambas capacidades.

Las identidades reales se verificaron y se asignó Carga a JD, Gestión a Diego y
consulta a Arturo. No se crearon cuentas personales ni se fijaron UUID/correos de
producción en la migración. En otro entorno, un admin debe asignar las cuentas
internas existentes desde Accesos. La asignación predeterminada de responsable
elige al miembro con Gestión activo más antiguo (Diego en la configuración inicial).

Todas las tablas expuestas tienen RLS y solo SELECT para authenticated. No se
aceptan INSERT/UPDATE/DELETE directos, ni siquiera desde un admin autenticado.
La autorización consulta la membresía y el rol interno actuales, no user_metadata.
Retirar acceso marca la membresía inactiva y preserva nombres e historial.

La implementación elevada está en el esquema no expuesto `bps_privado`, con
search_path vacío, permisos explícitos y verificación de auth.uid(). La única
entrada pública es SECURITY INVOKER. Una operación y su actividad se guardan
en la misma transacción. Los comentarios y la actividad son inmutables para
clientes. Las ediciones bloquean la fila y exigen la revisión esperada; una
revisión antigua devuelve SQLSTATE 40001, sin sobrescribir. El borrador se conserva
para que el usuario cancele, recargue la ficha y compare antes de volver a guardar.

La membresía se comprueba al entrar, reconectar y cada minuto visible sin desmontar
formularios. Cada petición al servidor valida los permisos independientemente de
esa actualización de interfaz. No se añade otra suscripción de autenticación.

## Contrato de API para la futura skill

El acceso inicial será a través del navegador y formularios, previa confirmación
de JD. Esta entrega **no construye la skill ni automatiza cargas**.

Lectura: `bps_corridas`, `bps_oportunidades`, `bps_comentarios`, `bps_actividad` y
el catálogo de `bps_accesos`, sometidos a RLS. Las relaciones permiten consultar
el detalle y el número de oportunidades de cada tanda.

Escritura: RPC `bps_ejecutar(p_accion text, p_datos jsonb)`:

| Acción | Datos |
|---|---|
| `tanda_guardar` | `campos: {nombre, fecha, criterios, notas}`; al editar, `id` y `revision` |
| `oportunidad_guardar` | `campos` autorizados; al editar, `id` y `revision` |
| `estado` | `id`, `revision`, `estado`, `motivo` |
| `comentar` | `id` de oportunidad, `texto` |
| `acceso_guardar` | `user_id`, `nombre`, `carga`, `gestion`; solo admin |
| `acceso_quitar` | `user_id`; solo admin |

No enviar estado, prioridad, autor, marcas de tiempo o revisión dentro de campos.
Enviar solo campos cambiados al editar. Los campos de investigación vacíos son
cadenas vacías; fit, multiplicador, ingresos y responsable sin dato son null.
Cada oportunidad exige `corrida_id` y nombre; cada tanda exige nombre y fecha.
Los estados internos son `nueva`, `validada`, `en_contacto`, `descartada`.

## Verificación y despliegue

- `npm run test:bps`: matriz, estados, campos por capacidad y enlaces.
- `tests/bps-backend.sql`: integración real en una transacción ROLLBACK, incluyendo
  prioridad, perfiles, llamadas directas, autorías, revisión antigua, revocación y anon.
- `node scripts/probar-bps-api.mjs`: Auth, REST, relaciones, RPC y revocación reales.
  Crea y elimina una cuenta temporal; no crea tandas ni oportunidades.
- `node scripts/probar-bps-navegador.mjs`: formularios, flujos, comentarios, conflictos,
  filtros, perfiles, renovación del token, revocación y móvil. Intercepta la API
  con fixtures; nunca escribe datos sintéticos en producción. Captura en
  `supabase/.temp/bps-mobile.png`, ignorada por Git.
- Regresión: `npm run test:radar`, `npm run test:cuentas` y `tests/radar-backend.sql`.
- `npm run build`: contenido público, Vite y prerenderizado completo.

La migración `20261022202139_radar_bps_contable.sql` se aplicó antes del frontend.
El archivo y la versión remota coinciden. No ejecutar db push indiscriminadamente:
hay migraciones históricas y cambios ajenos a esta entrega.

Asesores: sin hallazgos nuevos de seguridad BPS ni claves foráneas sin índice.
Se conservan avisos de seguridad preexistentes del proyecto, fuera de este alcance;
los índices nuevos sin uso son informativos mientras las tablas están vacías.
La compilación conserva los avisos existentes de chunks grandes y Browserslist antiguo.

El push y el despliegue del frontend en SiteGround son manuales. No se publican
capturas, documentos privados ni secretos. Hasta desplegar ese frontend, la
sección nueva no aparecerá en producción aunque el backend esté preparado.
