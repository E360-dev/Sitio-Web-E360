import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import Inicio from './pages/Inicio';
import Nosotros from './pages/Nosotros';
import Servicios from './pages/Servicios';
import Contacto from './pages/Contacto';

import Preloader from './components/Preloader';
import Registro from './pages/Registro';
import Pendiente from './pages/Pendiente';
import Login from './pages/Login';
import ClienteDashboard from './pages/ClienteDashboard';
import AdminDashboard from './pages/AdminDashboard';
import DocumentoPublico from './pages/DocumentoPublico'; // <-- NUEVA IMPORTACIÓN
import ProtectedRoute from './components/ProtectedRoute';

import ScrollToAnchor from './components/ScrollToAnchor';

// Componente que envuelve las rutas y decide si mostrar Navbar/Footer
const AppContent = () => {
  const location = useLocation();
  // Ahora comprobamos si la ruta COMIENZA con los prefijos del dashboard o es la página del documento
  const isDashboardRoute = location.pathname.startsWith('/cliente') || location.pathname.startsWith('/admin') || location.pathname.startsWith('/documento'); // <-- ACTUALIZADO
  const showNavAndFooter = !isDashboardRoute;

  return (
    <>
      <ScrollToAnchor />
      {showNavAndFooter && <Navbar />}
      <Preloader />
      <Routes>
        {/* Rutas Públicas */}
        <Route path="/" element={<Inicio />} />
        <Route path="/nosotros" element={<Nosotros />} />
        <Route path="/servicios" element={<Servicios />} />
        <Route path="/contacto" element={<Contacto />} />
        
        <Route path="/registro" element={<Registro />} />
        <Route path="/pendiente" element={<Pendiente />} />
        <Route path="/login" element={<Login />} />
        <Route path="/documento/:uuid" element={<DocumentoPublico />} /> {/* <-- NUEVA RUTA */}

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
        <Route path="*" element={<div>Página no encontrada</div>} />
      </Routes>
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