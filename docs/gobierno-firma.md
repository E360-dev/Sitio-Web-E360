# Gobierno de la firma

## Estado

Implementación local para revisión de JD, preparada el 13 de noviembre de 2026.
No se ha publicado, hecho push ni declarado una vigencia pública. Las siete
descargas son borradores v0.1; no equivalen a documentos aprobados o emitidos.

## Contenido y mantenimiento

`src/datos/gobierno.json` contiene exclusivamente textos destinados a consulta
pública. No incorporar el paquete de encargo, anexos internos, documentos
societarios, datos de terceros ni configuraciones de seguridad. Todo lo importado
por React puede llegar al bundle público.

Cada política tiene título, slug, icono, resumen, introducción, cinco apartados,
consultas, capítulos fuente y documento. `consultas` está vacío mientras no se
confirmen canales adecuados. La fecha de preparación no es una fecha de vigencia.
La versión 0.1 corresponde al borrador público; la fuente es el manual v1.2.

La colección alimenta el índice, la plantilla interior y el catálogo de rutas
usado por sitemap y prerenderizado. Una ruta desconocida usa NotFoundPage.
Las canónicas conservan la convención existente sin barra final.

## Trazabilidad editorial

| Política | Capítulos del manual v1.2 | Criterio |
| --- | --- | --- |
| Ética e integridad | 3 y 9 | Independencia, conflictos, anticorrupción y reportes. |
| Gobierno y responsabilidad | 2 y 12 | Consejo interno de cinco integrantes, dos independientes (40%); administración estatutaria separada. |
| Calidad profesional | 4, 5 y 7 | Aceptación, evidencia, revisión, responsabilidad humana y distinción de EQCR C1. |
| Privacidad y seguridad | 6 y 7 | Principios, acceso, conservación e incidentes; no sustituye el aviso. |
| Personas e inclusión | 8 y 9 | Trato digno, condiciones, desarrollo y atención imparcial de reportes. |
| Sustentabilidad | 11 | Prácticas y límites: no se afirman mediciones o metas inexistentes. |
| Proveedores y aliados | 10, 3 y 6 | Revisión proporcional, contratos, integridad y confidencialidad. |

Los capítulos 1, 12 y 13 orientan alcance, versiones y comunicación. Se utilizaron
los textos extraídos incluidos en el encargo, no los originales maquetados. La
guía v1.1 es contexto de consistencia; la carta v05 es contexto interno y no se
publica. Los textos históricos v1.0 y la composición 50/50 están sustituidos.

Se descargó e inspeccionó el ZIP de la maqueta v01 mediante el conector SharePoint:
inventario, LEEME, HTML autónomo y contenido.json. Confirma el acceso por footer,
índice de tarjetas, páginas por tema, anclas y documentos versionados. Sus textos
preliminares y notas de revisión están sustituidos por el manual v1.2. Se adapta
la composición a la identidad del sitio: cabecera existente, tarjetas, índice
lateral a la izquierda en escritorio y contenido apilado en móvil. No se copia
el HTML autónomo ni sus imágenes embebidas o notas internas al código público.

## PDFs y versiones

Generar con `python scripts/generar-pdf-gobierno.py` usando Python con reportlab.
Los PDFs se guardan en `public/documentos/gobierno/` y derivan del mismo texto de
las páginas. El generador solo admite estado borrador y vigencia sin aprobar.
No se ejecuta automáticamente en CI ni exige Python al build del sitio.

`docs/gobierno-versiones.json` registra hash del contenido fuente, hashes de los
PDFs y estado de revisión. No es evidencia de publicación. La verificación falla
si el texto cambia sin regenerar los PDFs. En una emisión futura, conservar las
copias difundidas con nombre de versión inmutable y registrar aprobación, fecha
efectiva y publicación real; no sobrescribir la evidencia anterior.

## Validación y vista previa

- `npm run test:gobierno`: integridad del contenido, privacidad del texto y PDFs.
- `npm run build`: contenido público existente, Vite, prerenderizado y pruebas SEO.
- `npm run dev -- --host 127.0.0.1 --port 5173 --strictPort`: revisión local.
- `node scripts/probar-gobierno-navegador.mjs`: navegación local, anclas, teclado,
  descargas, recarga, móvil y capturas. Requiere el servidor local anterior.

Las ocho rutas entran en los controles SEO existentes, con y sin JavaScript.
La vista previa no verifica reglas Apache de producción. No hace falta cambiar
el workflow ni la configuración del hosting para esta sección.

## Pendientes de revisión antes de una publicación autorizada

- Validar textos públicos y responsables por materia con dirección.
- Confirmar el aviso de privacidad vigente, su URL y medios para ejercer derechos.
- Confirmar canales de ética, personas e incidentes, su receptor y vía alterna.
  El formulario comercial no se ofrece como canal confidencial de reportes.
- Aprobar documentos públicos, versión definitiva y fecha efectiva.

Al cerrar esos puntos, actualizar estado editorial y representación de fechas;
no retirar avisos de borrador sin la validación correspondiente. La publicación
requiere una instrucción posterior de JD. Un push a main activa el workflow
existente de producción, por lo que no debe usarse para compartir esta revisión.
