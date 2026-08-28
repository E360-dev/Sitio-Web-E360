// Rutas estáticas del sitio público.
//
// Vive en su propio módulo para que generar-contenido.mjs y prerenderizar.mjs
// la compartan sin importarse entre sí: importar un script que ejecuta trabajo
// al cargarse lo dispararía como efecto secundario.

export const RUTAS_ESTATICAS = [
  { ruta: '/', prioridad: '1.0', frecuencia: 'monthly' },
  { ruta: '/servicios', prioridad: '0.9', frecuencia: 'monthly' },
  { ruta: '/nosotros', prioridad: '0.8', frecuencia: 'monthly' },
  { ruta: '/comunica', prioridad: '0.8', frecuencia: 'weekly' },
  { ruta: '/contacto', prioridad: '0.7', frecuencia: 'yearly' },
];
