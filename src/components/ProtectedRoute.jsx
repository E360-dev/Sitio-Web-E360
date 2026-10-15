import { Navigate, useLocation } from 'react-router-dom';
import { useRol } from '../hooks/useRol';
import { esInterno } from '../lib/permisos';

export default function ProtectedRoute({ children, requiredRole }) {
  const { rol, loading, error, reintentar } = useRol();
  const location = useLocation();

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <p>Verificando acceso...</p>
      </div>
    );
  }

  if (!rol && error) {
    return <div className="min-h-screen flex flex-col items-center justify-center gap-4"><p role="alert">{error}</p><button onClick={reintentar} className="font-bold text-blue-700">Reintentar</button></div>;
  }

  if (!rol) {
    // Si no hay rol (no está logueado), redirige a login
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // requiredRole puede ser un rol o una lista de roles.
  const permitidos = Array.isArray(requiredRole) ? requiredRole : [requiredRole];
  if (requiredRole && !permitidos.includes(rol)) {
    // Si el rol no es el requerido, redirige a una página por defecto o de error
    // Por ejemplo, si un cliente intenta acceder a /admin-dashboard
    const redirectTo = esInterno(rol) ? '/admin/dashboard' : '/cliente/dashboard';
    return <Navigate to={redirectTo} replace />;
  }

  return children;
}
