# SEO técnico y publicación

La cabecera se gestiona en `Seo` mediante `actualizarCabecera`: se reutilizan las
etiquetas del HTML prerenderizado, se eliminan duplicados y se actualizan en cada
cambio de página. No renderizar títulos, descripciones ni canónicas adicionales
en JSX; React 19 los añadiría de nuevo a la cabecera.

## Compilar y verificar

- `npm run build`: descarga el contenido público, compila, prerenderiza todas las
  URLs públicas y ejecuta la verificación SEO. Es el único build de publicación.
- `npm run test:seo`: verifica un `dist` ya generado, con y sin JavaScript,
  recarga, enlaces, Atrás, entrada/salida del login, páginas inexistentes y
  detección de duplicados. No envía formularios ni requiere sesión privada.
- `npm run build:rapido` sirve únicamente para desarrollo: no produce una entrega
  válida. Las comprobaciones de publicación exigen también la shell privada.
- Las páginas estáticas omiten `lastmod` porque no hay una fecha editorial
  verificable. Los artículos usan su fecha real de actualización o publicación.

## Rutas privadas

Apache sirve `_private/index.html` para los prefijos privados/transaccionales.
Contiene el arranque de React y `noindex`, sin contenido comercial, descripción
ni canónica. La cabecera HTTP `X-Robots-Tag` utiliza la petición original para
mantener la exclusión tras las reescrituras. Las áreas autenticadas siguen
bloqueadas en robots.txt; las transaccionales permiten leer su `noindex`.
La exclusión SEO no reemplaza la autenticación ni los controles de acceso.
Las URLs inexistentes responden HTTP 404 con una página de error sin canónica
ni descripción de la portada, tanto antes como después de ejecutar React.

## Publicación y recuperación

El workflow de SiteGround ejecuta el build completo. Antes de sincronizar crea
una copia íntegra en `DEPLOY_PATH/../.e360-backups/antes-RUN_ID-ATTEMPT.tar.gz`,
fuera de `public_html` y con permisos privados. Si falla, no publica.

Para recuperar: detener otras publicaciones, comprobar dominio y ruta absoluta,
elegir el respaldo del workflow afectado y extraerlo sobre el directorio de
publicación por SSH. Revalidar portada, páginas públicas y login antes de dar
por terminada la recuperación. No eliminar archivos ajenos al sitio. El código
se puede recuperar revirtiendo el commit y publicando el build completo.

Tras publicar, comprobar con una visita real: metadatos únicos, canónicas,
favicon, ausencia de `noindex` público y cabecera `noindex` en rutas privadas,
subrutas y barras finales. El servidor HTTP de la prueba local no es Apache y
no sustituye esta verificación. Un CAPTCHA HTTP 202 desde un cliente automático
no permite concluir cómo accede Googlebot.

En Search Console inspeccionar las seis URLs públicas, consultar canónica y
último rastreo, y probar el acceso en directo antes de solicitar indexación.
Si la propia prueba falla, registrar el error y dejar esa solicitud pendiente.
No atribuir un error genérico de Search Console al hosting sin evidencia.

Comparar indexación y rendimiento a los 7 y 14 días de la publicación; esto es
un seguimiento manual, no una automatización. Google decide la indexación y
las posiciones, sin garantía de fecha o posición concreta.
