// Login page — live OAuth/credential auth is gateway-bound and deferred to R6.
// This page is a structural placeholder so ProtectedRoute has a redirect target.
import { useSearchParams } from 'react-router-dom';

export default function LoginPage() {
  const [params] = useSearchParams();
  const redirect = params.get('redirect') ?? '/app';

  return (
    <main
      style={{
        minHeight: '100dvh',
        display: 'grid',
        placeItems: 'center',
        background: 'var(--paper)',
        padding: 24,
      }}
    >
      <div style={{ textAlign: 'center', maxWidth: 380 }}>
        <h1
          style={{
            fontSize: 24,
            fontWeight: 600,
            letterSpacing: '-0.02em',
            marginBottom: 8,
            color: 'var(--ink)',
          }}
        >
          Sign in to Oraclous
        </h1>
        <p style={{ color: 'var(--mute)', fontSize: 14, marginBottom: 24 }}>
          Authentication is coming soon.{' '}
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12 }} aria-hidden="true">
            (redirect: {redirect})
          </span>
        </p>
      </div>
    </main>
  );
}
