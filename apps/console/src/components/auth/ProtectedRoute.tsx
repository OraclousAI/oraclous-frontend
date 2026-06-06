import type { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useTokenStore } from '../../lib/token-store.jsx';

export function ProtectedRoute({ children }: { children: ReactNode }) {
  const { isAuthenticated } = useTokenStore();
  const location = useLocation();

  if (!isAuthenticated) {
    // Preserve the query string too (e.g. /app/accept-invite?token=…) so deep links survive login.
    const target = location.pathname + location.search;
    return <Navigate to={`/login?redirect=${encodeURIComponent(target)}`} replace />;
  }

  return <>{children}</>;
}
