import { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import Inicio from './pages/Inicio';
import Nosotros from './pages/Nosotros';
import Servicios from './pages/Servicios';
import Contacto from './pages/Contacto';
import Comunica from './pages/Comunica';
import Articulo from './pages/Articulo';

import Preloader from './components/Preloader';
import Registro from './pages/Registro';
import Pendiente from './pages/Pendiente';
import Login from './pages/Login';
import NotFoundPage from './pages/NotFoundPage'; // <-- IMPORTACIÓN AÑADIDA
import ProtectedRoute from './components/ProtectedRoute';

// Carga diferida de las áreas privadas: arrastran react-pdf y pdfjs-dist, que
// pesan más que todo el sitio público junto y solo hacen falta tras iniciar sesión.
const ClienteDashboard = lazy(() => import('./pages/ClienteDashboard'));
const AdminDashboard = lazy(() => import('./pages/AdminDashboard'));
const DocumentoPublico = lazy(() => import('./pages/DocumentoPublico'));

// Ocupa la pantalla completa para que el cambio de ruta no provoque un salto de layout.
const CargandoPantalla = () => (
  <div className="min-h-screen flex items-center justify-center bg-gray-50">
    <div className="h-10 w-10 rounded-full border-4 border-gray-200 border-t-[#2e527f] animate-spin" />
  </div>
);

import ScrollToAnchor from './components/ScrollToAnchor';
import usePageTracking from './hooks/usePageTracking';

// Componente que envuelve las rutas y decide si mostrar Navbar/Footer
const AppContent = () => {
  const location = useLocation();
  usePageTracking();
  // Ahora comprobamos si la ruta COMIENZA con los prefijos del dashboard o es la página del documento
  const isDashboardRoute = location.pathname.startsWith('/cliente') || location.pathname.startsWith('/admin') || location.pathname.startsWith('/documento'); // <-- ACTUALIZADO
  const showNavAndFooter = !isDashboardRoute;

  // Rutas privadas o transaccionales que no deben indexarse. Se resuelve aquí y
  // no en cada página porque varias tienen múltiples returns (carga, error, ok).
  const noindexPrefixes = ['/cliente', '/admin', '/documento', '/login', '/registro', '/pendiente'];
  const isNoindexRoute = noindexPrefixes.some((prefix) => location.pathname.startsWith(prefix));

  // Título de pestaña para las rutas sin componente Seo, que si no heredarían
  // el de index.html. /documento se omite: lo define el nombre del documento.
  const privateTitles = {
    '/login': 'Iniciar sesión | E360',
    '/registro': 'Crear cuenta | E360',
    '/pendiente': 'Registro recibido | E360',
  };
  const privateTitle = privateTitles[location.pathname];

  return (
    <>
      {isNoindexRoute && <meta name="robots" content="noindex, nofollow" />}
      {privateTitle && <title>{privateTitle}</title>}
      <ScrollToAnchor />
      {showNavAndFooter && <Navbar />}
      <Preloader />
      <Suspense fallback={<CargandoPantalla />}>
      <Routes>
        {/* Rutas Públicas */}
        <Route path="/" element={<Inicio />} />
        <Route path="/nosotros" element={<Nosotros />} />
        <Route path="/servicios" element={<Servicios />} />
        <Route path="/contacto" element={<Contacto />} />
        <Route path="/comunica" element={<Comunica />} />
        <Route path="/comunica/:slug" element={<Articulo />} />
        
        <Route path="/registro" element={<Registro />} />
        <Route path="/pendiente" element={<Pendiente />} />
        <Route path="/login" element={<Login />} />
        <Route 
          path="/documento/:uuid" 
          element={
            <ProtectedRoute>
              <DocumentoPublico />
            </ProtectedRoute>
          } 
        />

        {/* Rutas Protegidas */}
        <Route 
          path="/cliente/*" // Ruta con comodín para el cliente
          element={
            <ProtectedRoute requiredRole="cliente">
              <ClienteDashboard />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/admin/*" // Ruta con comodín para el admin
          element={
            <ProtectedRoute requiredRole="admin">
              <AdminDashboard />
            </ProtectedRoute>
          } 
        />

        {/* Ruta para cualquier otra URL no encontrada */}
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
      </Suspense>
      {showNavAndFooter && <Footer />}
    </>
  );
};

function App() {
  return (
    <div className="bg-white text-gray-800 font-sans">
      <BrowserRouter>
        <AppContent />
      </BrowserRouter>
    </div>
  );
}

export default App;