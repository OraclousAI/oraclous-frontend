// OAuth callback — the provider redirects here with ?code&state; we exchange them for a session
// (GET /oauth/{provider}/callback) and land in the app. Public route (no session yet). The exchange
// runs exactly once (state/code are single-use; a ref guards StrictMode's double-invoke).
import { useEffect, useRef, useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { useApi } from '../lib/api.jsx';
import { useTokenStore } from '../lib/token-store.jsx';
import './auth.css';

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
        // Await the vault commit so an immediate reload after sign-in still restores the session.
        await setToken({
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
    <main className="auth-main">
      {error === null ? (
        <span className="terminal-strip" role="status">
          <span>Completing sign-in</span>
          <span className="cursor is-blink" aria-hidden="true" />
        </span>
      ) : (
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 'var(--sp-3)',
            alignItems: 'center',
            maxWidth: 360,
            textAlign: 'center',
          }}
        >
          <p className="callout" data-tone="error" role="alert" style={{ margin: 0 }}>
            {error}
          </p>
          <a href="/login" className="btn" data-variant="secondary" data-size="sm">
            Back to sign in
          </a>
        </div>
      )}
    </main>
  );
}
