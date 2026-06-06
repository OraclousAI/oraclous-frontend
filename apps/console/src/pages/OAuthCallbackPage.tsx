// OAuth callback — the provider redirects here with ?code&state; we exchange them for a session
// (GET /oauth/{provider}/callback) and land in the app. Public route (no session yet). The exchange
// runs exactly once (state/code are single-use; a ref guards StrictMode's double-invoke).
import { useEffect, useRef, useState, type CSSProperties } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { useApi } from '../lib/api.jsx';
import { useTokenStore } from '../lib/token-store.jsx';

export default function OAuthCallbackPage() {
  const { provider = '' } = useParams<{ provider: string }>();
  const [params] = useSearchParams();
  const { auth } = useApi();
  const { setToken } = useTokenStore();
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);
  const ran = useRef(false);

  useEffect(() => {
    if (ran.current) return;
    ran.current = true;

    const code = params.get('code');
    const state = params.get('state');
    if (params.get('error') !== null) {
      setError('Sign-in was cancelled or denied.');
      return;
    }
    if (code === null || state === null) {
      setError('This sign-in link is missing its authorization response.');
      return;
    }

    void (async () => {
      try {
        const session = await auth.oauthCallback(provider, code, state);
        setToken({
          token: session.accessToken,
          refreshToken: session.refreshToken,
          email: session.email,
          expiresAt: Date.now() + session.expiresIn * 1000,
        });
        navigate('/app', { replace: true });
      } catch {
        setError('Couldn’t complete sign-in. Please try again.');
      }
    })();
  }, [auth, navigate, params, provider, setToken]);

  return (
    <main style={styles.main}>
      {error === null ? (
        <p style={styles.msg} role="status">
          Completing sign-in…
        </p>
      ) : (
        <div style={styles.box}>
          <p style={styles.err} role="alert">
            {error}
          </p>
          <a href="/login" style={styles.link}>
            Back to sign in
          </a>
        </div>
      )}
    </main>
  );
}

const styles = {
  main: {
    minHeight: '100dvh',
    display: 'grid',
    placeItems: 'center',
    background: 'var(--paper, #f4f4f2)',
    padding: 24,
    fontFamily: 'var(--font-sans, system-ui, sans-serif)',
  },
  msg: { margin: 0, fontSize: 14, color: 'var(--mute, #65686f)' },
  box: { display: 'grid', gap: 12, justifyItems: 'center', maxWidth: 360, textAlign: 'center' },
  err: {
    margin: 0,
    padding: '10px 12px',
    fontSize: 13,
    color: 'var(--ink, #0b1220)',
    background: 'var(--error-bg, #fbeae8)',
    border: '1px solid var(--error, #c8412c)',
    borderRadius: 8,
  },
  link: { fontSize: 13, fontWeight: 600, color: 'var(--ink, #0b1220)' },
} satisfies Record<string, CSSProperties>;
