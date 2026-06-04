import type { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useTokenStore } from '../../lib/token-store.jsx';

export function ProtectedRoute({ children }: { children: ReactNode }) {
  const { isAuthenticated } = useTokenStore();
  const location = useLocation();

  if (!isAuthenticated) {
    return <Navigate to={`/login?redirect=${encodeURIComponent(location.pathname)}`} replace />;
  }

  return <>{children}</>;
}
