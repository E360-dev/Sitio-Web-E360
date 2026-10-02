// Ids y nombres de los servicios, compartidos por el menú, los accesos de Inicio
// y la página de Servicios. El id es también el ancla pública
// (/servicios#auditoria) que enlaza el one pager comercial: cambiarlo rompe esos
// enlaces.
//
// Vive aparte de la página Servicios para que el menú no arrastre su código.

export const SERVICIOS_PRINCIPALES = [
  { id: 'auditoria', nombre: 'Auditoría' },
  { id: 'consultoria', nombre: 'Consultoría financiera, contable y fiscal' },
  { id: 'bps', nombre: 'BPS · Outsourcing contable' },
];

export const FINANCIAMIENTO = { id: 'financiamiento', nombre: 'Financiamiento y Estructuración' };
