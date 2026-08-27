import { Navigate, useLocation } from 'react-router-dom';
import { useRol } from '../hooks/useRol';

export default function ProtectedRoute({ children, requiredRole }) {
  const { rol, loading } = useRol();
  const location = useLocation();

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <p>Verificando acceso...</p>
      </div>
    );
  }

  if (!rol) {
    // Si no hay rol (no está logueado), redirige a login
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (requiredRole && rol !== requiredRole) {
    // Si el rol no es el requerido, redirige a una página por defecto o de error
    // Por ejemplo, si un cliente intenta acceder a /admin-dashboard
    const redirectTo = rol === 'admin' ? '/admin/dashboard' : '/cliente/dashboard';
    return <Navigate to={redirectTo} replace />;
  }

  return children;
}
