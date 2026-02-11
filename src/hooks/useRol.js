import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient'; // Asegúrate que la ruta sea correcta

export function useRol() {
  const [rol, setRol] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchRol = async () => {
      try {
        setLoading(true);
        const { data: { user } } = await supabase.auth.getUser();

        if (user) {
          const { data, error } = await supabase
            .from('roles_usuario')
            .select('rol')
            .eq('user_id', user.id)
            .single();

          if (error) {
            throw new Error("No se pudo obtener el rol del usuario. Asegúrate de tener un rol asignado.");
          }

          if (data) {
            setRol(data.rol);
          }
        } else {
          setRol(null); // No hay usuario logueado
        }
      } catch (err) {
        setError(err.message);
        setRol(null);
      } finally {
        setLoading(false);
      }
    };

    fetchRol();

    // Escuchar cambios en la autenticación para actualizar el rol
    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN' || event === 'SIGNED_OUT') {
        fetchRol();
      }
    });

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  return { rol, loading, error };
}
