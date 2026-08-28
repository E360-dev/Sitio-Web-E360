import { useState } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient.js';
import Imagen, { fondoWebp } from '../components/Imagen';

export default function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const { email, password } = formData;

    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (authError) {
      setError(authError.message);
      setLoading(false);
      return;
    }

    if (authData.user) {
      const { data: roleData, error: roleError } = await supabase
        .from('roles_usuario')
        .select('rol')
        .eq('user_id', authData.user.id)
        .maybeSingle();

      if (roleError) {
        setError("Error al verificar tu rol. Contacta a soporte.");
        await supabase.auth.signOut();
        setLoading(false);
        return;
      }

      const userRole = roleData ? roleData.rol : null;
      const from = location.state?.from?.pathname || (userRole === 'admin' ? '/admin/dashboard' : '/cliente/dashboard');

      if (userRole === 'admin' || userRole === 'cliente') {
        navigate(from, { replace: true });
      } else {
        setError("No se pudo determinar tu rol. Contacta a soporte.");
        await supabase.auth.signOut();
      }
    }
    setLoading(false);
  };

  return (
    <div 
      className="relative min-h-screen flex items-center justify-center bg-cover bg-center bg-no-repeat overflow-hidden"
      style={{ backgroundImage: fondoWebp('/img/fondologin.jpg') }}
    >
      {/* Overlay azul corporativo al 70% */}
      <div className="absolute inset-0 bg-[#143c64]/70"></div>

      {/* Contenido principal */}
      <div className="relative z-10 w-full max-w-md px-6 flex flex-col items-center">
        
        {/* Título superior */}
        <h2 className="text-4xl font-extrabold text-white mb-8 text-center tracking-tight">
          Iniciar sesión
        </h2>

        {/* Card del Formulario */}
        <div className="bg-white w-full py-12 px-10 rounded-2xl shadow-sm border border-gray-100">
          <form className="space-y-6" onSubmit={handleSubmit}>
            {/* Username Field */}
            <div>
              <input
                id="email"
                name="email"
                type="email"
                required
                placeholder="Username"
                value={formData.email}
                onChange={handleChange}
                className="w-full px-6 py-4 bg-white border-2 border-gray-600 rounded-full text-gray-800 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#25c6e3] focus:border-[#25c6e3] transition-all text-lg"
              />
            </div>

            {/* Password Field */}
            <div className="space-y-2">
              <input
                id="password"
                name="password"
                type="password"
                required
                placeholder="Password"
                value={formData.password}
                onChange={handleChange}
                className="w-full px-6 py-4 bg-white border-2 border-gray-600 rounded-full text-gray-800 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#25c6e3] focus:border-[#25c6e3] transition-all text-lg"
              />
              <div className="flex justify-start px-2">
                <Link to="#" className="text-sm text-gray-400 hover:text-gray-600 transition-colors">
                  Forgot Password?
                </Link>
              </div>
            </div>

            {error && (
              <div className="rounded-lg bg-red-50 p-4 border border-red-200">
                <p className="text-sm font-medium text-red-600 text-center">{error}</p>
              </div>
            )}

            {/* Login Button */}
            <div className="pt-2">
              <button
                type="submit"
                disabled={loading}
                className="w-full py-4 bg-[#25c6e3] hover:bg-[#1eb0ca] text-white font-black text-xl rounded-full shadow-lg transition-all transform hover:scale-[1.02] disabled:bg-gray-400 disabled:cursor-not-allowed uppercase tracking-widest"
              >
                {loading ? 'CARGANDO...' : 'LOGIN'}
              </button>
            </div>
          </form>

          {/* Link discreto a registro (Opcional, pero mantenido por funcionalidad) */}
          <div className="mt-8 text-center">
            <p className="text-gray-500 text-sm">
              ¿No tienes cuenta?{' '}
              <Link to="/registro" className="text-[#25c6e3] font-bold hover:underline">
                Regístrate
              </Link>
            </p>
          </div>
        </div>

        {/* Logo inferior separado */}
        <div className="mt-16">
          <Imagen
            className="h-16 w-auto opacity-90 brightness-0 invert"
            src="/img/logo.png"
            alt="Logo E360"
          />
        </div>
      </div>
    </div>
  );
}
