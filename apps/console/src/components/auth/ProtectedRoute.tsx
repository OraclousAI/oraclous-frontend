import type { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useTokenStore } from '../../lib/token-store.jsx';

// Shown while the boot-time session restore (useSessionHydration) is in flight, instead of
// flashing the login redirect. The mint cursor is the live signal of the session coming back.
function RestoringSession() {
  return (
    <main
      role="status"
      aria-label="Restoring session"
      style={{
        minHeight: '100dvh',
        display: 'grid',
        placeItems: 'center',
        background: 'var(--paper)',
      }}
    >
      <span
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 6,
          fontFamily: 'var(--font-mono)',
          fontSize: 'var(--t-caption-size)',
          color: 'var(--mute)',
        }}
      >
        restoring session
        <span
          className="is-blink"
          aria-hidden="true"
          style={{
            display: 'inline-block',
            width: 6,
            height: 14,
            background: 'var(--accent)',
          }}
        />
      </span>
    </main>
  );
}

export function ProtectedRoute({ children }: { children: ReactNode }) {
  const { isAuthenticated, hydrated } = useTokenStore();
  const location = useLocation();

  // Hold the redirect until the vault-backed restore has had its one chance. An already-
  // authenticated store never needs the restore screen (e.g. right after a fresh login).
  if (!hydrated && !isAuthenticated) {
    return <RestoringSession />;
  }

  if (!isAuthenticated) {
    // Preserve the query string too (e.g. /app/accept-invite?token=…) so deep links survive login.
    const target = location.pathname + location.search;
    return <Navigate to={`/login?redirect=${encodeURIComponent(target)}`} replace />;
  }

  return <>{children}</>;
}
