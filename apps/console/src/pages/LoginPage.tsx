// Auth — sign in or create an account against the gateway (POST /v1/auth/login | /register), plus
// OAuth (GET /oauth/providers → /oauth/{provider}/login). On success the session token is held in
// the in-memory token store (never persisted) and the user lands in the app.
import { useId, useState, type CSSProperties, type FormEvent } from 'react';
import { useNavigate, useSearchParams, useLocation } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ApiClientError, ErrorCode } from '@oraclous/api-client';
import { useApi } from '../lib/api.jsx';
import { useTokenStore } from '../lib/token-store.jsx';
import { Logo } from '../icons/index.js';

type Mode = 'login' | 'signup';

const PROVIDER_LABEL: Record<string, string> = {
  google: 'Google',
  github: 'GitHub',
  notion: 'Notion',
};
const providerLabel = (p: string): string =>
  PROVIDER_LABEL[p] ?? p.charAt(0).toUpperCase() + p.slice(1);

// Only ever navigate to an in-app path (guards against open-redirect via ?redirect=).
function safeRedirect(target: string | null): string {
  if (
    target !== null &&
    target.startsWith('/') &&
    !target.startsWith('//') &&
    !target.includes('\\')
  )
    return target;
  return '/app';
}

function messageFor(cause: unknown, mode: Mode): string {
  if (ApiClientError.is(cause)) {
    if (cause.code === ErrorCode.UNAUTHENTICATED) return 'Invalid email or password.';
    if (cause.code === ErrorCode.VALIDATION_FAILED) {
      return mode === 'signup'
        ? 'Enter a valid email and a password of at least 8 characters.'
        : 'Enter a valid email and password.';
    }
    return cause.message;
  }
  return 'Something went wrong. Please try again.';
}

export default function LoginPage() {
  const { auth } = useApi();
  const { setToken } = useTokenStore();
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const [params] = useSearchParams();
  const redirect = safeRedirect(params.get('redirect'));

  const titleId = useId();
  const errorId = useId();
  const [mode, setMode] = useState<Mode>(pathname === '/signup' ? 'signup' : 'login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const providers = useQuery({
    queryKey: ['oauth-providers'],
    queryFn: () => auth.oauthProviders(),
    staleTime: 5 * 60_000,
  });

  const isSignup = mode === 'signup';

  function persist(session: {
    accessToken: string;
    refreshToken: string;
    email: string;
    expiresIn: number;
  }) {
    setToken({
      token: session.accessToken,
      refreshToken: session.refreshToken,
      email: session.email,
      expiresAt: Date.now() + session.expiresIn * 1000,
    });
  }

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    if (isSignup && password.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }
    setSubmitting(true);
    try {
      const session = isSignup
        ? await auth.register({ email, password })
        : await auth.login({ email, password });
      persist(session);
      navigate(redirect, { replace: true });
    } catch (cause) {
      setError(messageFor(cause, mode));
      setSubmitting(false);
    }
  }

  async function onOAuth(provider: string) {
    setError(null);
    try {
      const redirectUri = `${window.location.origin}/oauth/${provider}/callback`;
      const url = await auth.oauthLoginUrl(provider, redirectUri);
      window.location.assign(url);
    } catch {
      setError(`Couldn’t start ${providerLabel(provider)} sign-in. Please try again.`);
    }
  }

  function toggleMode() {
    setMode((m) => (m === 'login' ? 'signup' : 'login'));
    setError(null);
  }

  const available = providers.data ?? [];

  return (
    <main style={styles.main}>
      <div style={styles.card}>
        <div style={styles.brand}>
          <Logo size={26} />
          <span style={styles.wordmark}>Oraclous</span>
        </div>

        <div style={styles.head}>
          <h1 id={titleId} style={styles.heading}>
            {isSignup ? 'Create your account' : 'Welcome back'}
          </h1>
          <p style={styles.sub}>
            {isSignup
              ? 'Start building your living knowledge graph.'
              : 'Sign in to your knowledge workspace.'}
          </p>
        </div>

        {error !== null && (
          <p id={errorId} role="alert" style={styles.error}>
            {error}
          </p>
        )}

        {available.length > 0 && (
          <>
            <div style={styles.oauthList}>
              {available.map((p) => (
                <button key={p} type="button" onClick={() => onOAuth(p)} style={styles.oauthBtn}>
                  Continue with {providerLabel(p)}
                </button>
              ))}
            </div>
            <div style={styles.divider} aria-hidden="true">
              <span style={styles.dividerText}>or</span>
            </div>
          </>
        )}

        <form style={styles.form} onSubmit={onSubmit} aria-labelledby={titleId} noValidate>
          <div style={styles.field}>
            <label htmlFor="auth-email" style={styles.label}>
              Email
            </label>
            <input
              id="auth-email"
              name="email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              aria-invalid={error !== null}
              aria-describedby={error !== null ? errorId : undefined}
              style={styles.input}
            />
          </div>

          <div style={styles.field}>
            <label htmlFor="auth-password" style={styles.label}>
              Password
            </label>
            <input
              id="auth-password"
              name="password"
              type="password"
              autoComplete={isSignup ? 'new-password' : 'current-password'}
              required
              minLength={isSignup ? 8 : undefined}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              aria-invalid={error !== null}
              aria-describedby={error !== null ? errorId : undefined}
              style={styles.input}
            />
            {isSignup && <span style={styles.hint}>At least 8 characters.</span>}
          </div>

          <button
            type="submit"
            disabled={submitting}
            aria-busy={submitting}
            style={submitting ? { ...styles.button, ...styles.buttonBusy } : styles.button}
          >
            {submitting
              ? isSignup
                ? 'Creating account…'
                : 'Signing in…'
              : isSignup
                ? 'Create account'
                : 'Sign in'}
          </button>
        </form>

        <p style={styles.toggle}>
          {isSignup ? 'Already have an account?' : 'New to Oraclous?'}{' '}
          <button type="button" onClick={toggleMode} style={styles.toggleBtn}>
            {isSignup ? 'Sign in' : 'Create an account'}
          </button>
        </p>
      </div>
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
  card: {
    width: '100%',
    maxWidth: 400,
    display: 'grid',
    gap: 18,
    padding: 32,
    background: 'var(--paper, #f4f4f2)',
    border: '1px solid var(--rule, #d7d6d2)',
    borderRadius: 14,
    boxShadow: 'var(--shadow-2, 0 2px 6px -2px rgba(11, 18, 32, 0.12))',
  },
  brand: { display: 'flex', alignItems: 'center', gap: 9 },
  wordmark: {
    fontSize: 17,
    fontWeight: 700,
    letterSpacing: '-0.01em',
    color: 'var(--ink, #0b1220)',
  },
  head: { display: 'grid', gap: 4 },
  heading: {
    margin: 0,
    fontSize: 22,
    fontWeight: 600,
    letterSpacing: '-0.02em',
    color: 'var(--ink, #0b1220)',
  },
  sub: { margin: 0, fontSize: 13.5, color: 'var(--mute, #65686f)' },
  oauthList: { display: 'grid', gap: 8 },
  oauthBtn: {
    width: '100%',
    padding: '10px 14px',
    fontSize: 14,
    fontWeight: 500,
    fontFamily: 'var(--font-sans, system-ui, sans-serif)',
    color: 'var(--ink, #0b1220)',
    background: '#ffffff',
    border: '1px solid var(--rule, #d7d6d2)',
    borderRadius: 8,
    cursor: 'pointer',
  },
  divider: {
    display: 'grid',
    placeItems: 'center',
    position: 'relative',
    borderTop: '1px solid var(--rule, #d7d6d2)',
    height: 0,
  },
  dividerText: {
    position: 'absolute',
    top: -9,
    padding: '0 8px',
    fontSize: 12,
    color: 'var(--mute, #65686f)',
    background: 'var(--paper, #f4f4f2)',
  },
  form: { display: 'grid', gap: 16 },
  field: { display: 'grid', gap: 6 },
  label: { fontSize: 13, fontWeight: 500, color: 'var(--ink, #0b1220)' },
  hint: { fontSize: 12, color: 'var(--mute, #65686f)' },
  input: {
    width: '100%',
    boxSizing: 'border-box',
    padding: '10px 12px',
    fontSize: 14,
    fontFamily: 'var(--font-sans, system-ui, sans-serif)',
    color: 'var(--ink, #0b1220)',
    background: '#ffffff',
    border: '1px solid var(--rule, #d7d6d2)',
    borderRadius: 8,
  },
  button: {
    width: '100%',
    padding: '11px 16px',
    fontSize: 14,
    fontWeight: 600,
    fontFamily: 'var(--font-sans, system-ui, sans-serif)',
    color: 'var(--paper, #f4f4f2)',
    background: 'var(--ink, #0b1220)',
    border: 'none',
    borderRadius: 8,
    cursor: 'pointer',
  },
  buttonBusy: { opacity: 0.6, cursor: 'default' },
  error: {
    margin: 0,
    padding: '10px 12px',
    fontSize: 13,
    color: 'var(--ink, #0b1220)',
    background: 'var(--error-bg, #fbeae8)',
    border: '1px solid var(--error, #c8412c)',
    borderRadius: 8,
  },
  toggle: { margin: 0, fontSize: 13, color: 'var(--mute, #65686f)', textAlign: 'center' },
  toggleBtn: {
    appearance: 'none',
    border: 'none',
    background: 'transparent',
    padding: 0,
    fontSize: 13,
    fontWeight: 600,
    color: 'var(--ink, #0b1220)',
    cursor: 'pointer',
    textDecoration: 'underline',
  },
} satisfies Record<string, CSSProperties>;
