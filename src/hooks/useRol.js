import { useAuth } from '../context/AuthProvider';

// Compatibility interface: all screens consume the same user and role state.
export const useRol = useAuth;
