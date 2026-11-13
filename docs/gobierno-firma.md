# Gobierno de la firma

## Presentación pública

Versión 1.0, fecha de edición 13 de noviembre de 2026. JD indicó expresamente
que sitio, documentos y video deben presentarse como materiales terminados y
que los estados editoriales se llevan únicamente de manera interna. Esta
instrucción sustituye el tratamiento público anterior de borrador.

La fecha identifica esta edición; no declara una fecha de vigencia legal. La
publicación de esta corrección no se ejecutó como parte de su preparación local.
El control editorial, autorización y pendientes están en
`docs/gobierno-control-editorial.json`; no se importan en React ni se copian a public.

## Contenido y mantenimiento

`src/datos/gobierno.json` contiene únicamente contenido público y metadatos de
consulta: versión y fecha de edición. Cada política conserva título, slug, icono,
resumen, introducción, apartados, consultas, capítulos fuente y PDF. El estado
editorial y las validaciones no son campos de esta colección.

Los textos de las siete políticas se conservan respecto de la primera entrega.
Las referencias a revisión profesional, revisión de calidad y borradores de
informes de auditoría describen procesos de E360 y mantienen su significado.

| Política | Capítulos del manual v1.2 | Criterio |
| --- | --- | --- |
| Ética e integridad | 3 y 9 | Independencia, conflictos, anticorrupción y reportes. |
| Gobierno y responsabilidad | 2 y 12 | Cinco integrantes y dos independientes (40%); administración estatutaria separada. |
| Calidad profesional | 4, 5 y 7 | Evidencia, revisión y responsabilidad humana. |
| Privacidad y seguridad | 6 y 7 | Protección e incidentes; no sustituye al aviso de privacidad. |
| Personas e inclusión | 8 y 9 | Trato digno, desarrollo y atención imparcial. |
| Sustentabilidad | 11 | Prácticas y resultados únicamente sustentados. |
| Proveedores y aliados | 10, 3 y 6 | Revisión proporcional, integridad y confidencialidad. |

Los capítulos 1, 12 y 13 orientan alcance, versiones y comunicación. Se utilizaron
los textos extraídos del manual v1.2. Se inspeccionó el inventario, LEEME, HTML y
contenido.json del ZIP de la maqueta v01; sus textos anteriores están sustituidos.
El paquete interno, la carta corporativa, identidades reservadas y expedientes
no forman parte del sitio ni de sus bundles.

## Documentos y compatibilidad

Los PDFs v1.0 se generan desde el mismo contenido de las páginas con
`python scripts/generar-pdf-gobierno.py` (requiere reportlab). El generador utiliza
versión y fecha de edición, y no incorpora advertencias editoriales. El build
no necesita Python: los PDFs quedan versionados como archivos binarios.

`docs/gobierno-versiones.json` registra las huellas del contenido y las siete
salidas. La verificación requiere regenerar los PDFs si cambia la colección.
Los archivos v0.1 y su manifiesto están archivados en
`docs/gobierno-historico/v0.1/`, fuera de los directorios publicados.

Las ocho URLs de páginas permanecen estables. Los enlaces PDF anteriores
redirigen con HTTP 301 a v1.0, mediante reglas específicas de Apache anteriores
al manejo de archivos existentes. Esto también cubre el servidor donde rsync
pueda conservar físicamente los archivos viejos. No se modifica la estrategia de
sincronización ni se elimina contenido ajeno del servidor.

## Validación

- `npm run test:gobierno`: contenido, versión, huellas y siete documentos públicos;
  también comprueba patrón y orden de las redirecciones, sin simular Apache.
- `npm run build`: Vite, prerenderizado de rutas públicas y comprobaciones SEO.
- `node scripts/probar-gobierno-navegador.mjs`: navegación, teclado, recarga,
  descargas v1.0 y escritorio/móvil en el servidor local de Vite.
- Extracción de PDFs: equivalencia de todos los párrafos y ausencia de advertencias
  editoriales en texto y propiedades. Renderizado e inspección de las páginas.

No se encontró Apache local en PATH ni en las ubicaciones habituales examinadas
(C:/Apache24, C:/xampp y D:/xampp); tampoco Docker en PATH. La prueba mediante Vite
no ejecuta .htaccess. El patrón y su orden están comprobados estáticamente, pero
las respuestas HTTP 301 de Apache quedan por verificar en un entorno Apache o
tras un despliegue autorizado. No se declara esa comprobación como realizada.

## Seguimiento interno

- Confirmar aviso de privacidad vigente y su URL.
- Confirmar receptores y canales de ética, personas e incidentes.
- Registrar la publicación real y comprobar las redirecciones en Apache.

No se inventan canales para resolver esos pendientes. El video se entrega como
archivo local en output/gobierno-video y no se incorpora al sitio ni al commit.
El seguimiento de producción conserva las versiones anteriores de forma interna.
La corrección web se entrega mediante un nuevo commit, sin push automático.
