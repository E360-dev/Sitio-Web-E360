import { createContext, useContext, useEffect, useSyncExternalStore } from 'react';
import { supabase } from '../lib/supabaseClient';
import { crearEstadoAuth } from '../lib/authStore.mjs';

const store = crearEstadoAuth(supabase);
const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const state = useSyncExternalStore(store.subscribe, store.getSnapshot);
  useEffect(() => store.start(), []);
  return <AuthContext.Provider value={{ ...state, reintentar: store.retry }}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const value = useContext(AuthContext);
  if (!value) throw new Error('AuthProvider no está montado.');
  return value;
}
