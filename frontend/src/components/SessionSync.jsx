import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { setSessionInvalidHandler } from '../auth/sessionEvents';
import { useAuth } from '../context/AuthContext';

/**
 * Bridges 401 responses to auth state + client-side navigation (no full page reload).
 */
export default function SessionSync() {
  const navigate = useNavigate();
  const { logout } = useAuth();

  useEffect(() => {
    setSessionInvalidHandler(() => {
      logout();
      navigate('/login', { replace: true });
    });
    return () => setSessionInvalidHandler(null);
  }, [logout, navigate]);

  return null;
}
