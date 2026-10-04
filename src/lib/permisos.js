// Qué puede hacer cada rol interno en el panel.
//
// Esto solo decide qué se muestra. La protección real está en las políticas
// RLS de Supabase y en las Edge Functions, que aplican la misma matriz
// (ver supabase/migrations/20261004_roles_internos.sql).

/** Roles que entran al panel interno (/admin). */
export const ROLES_INTERNOS = ['admin', 'comercial', 'comunicacion', 'auditor'];

export const PERMISOS = {
  documentos: ['admin', 'comercial', 'auditor'],       // ver dictámenes
  documentosEditar: ['admin', 'comercial'],            // crear, emitir, reemplazar, eliminar
  correo: ['admin', 'comercial'],
  comunica: ['admin', 'comercial', 'comunicacion'],
  servidor: ['admin', 'auditor'],                      // EC2 y App UNC
};

/**
 * @param {string|null} rol
 * @param {keyof PERMISOS} permiso
 * @returns {boolean}
 */
export const puede = (rol, permiso) => Boolean(rol) && PERMISOS[permiso].includes(rol);

export const esInterno = (rol) => ROLES_INTERNOS.includes(rol);
