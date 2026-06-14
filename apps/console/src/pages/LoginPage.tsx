// Auth — sign in or create an account against the gateway (POST /v1/auth/login | /register), plus
// OAuth (GET /oauth/providers → /oauth/{provider}/login). On success the session token is held in
// the in-memory token store (never persisted) and the user lands in the app.
// Styled per the handoff login.html (state 01 — sign in).
import { useId, useState, type FormEvent } from 'react';
import { useNavigate, useSearchParams, useLocation } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ApiClientError, ErrorCode } from '@oraclous/api-client';
import { useApi } from '../lib/api.jsx';
import { useTokenStore } from '../lib/token-store.jsx';
import { providerLabel } from '../lib/providers.js';
import { Logo, Wordmark } from '../icons/index.js';
import './auth.css';

type Mode = 'login' | 'signup';

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

// The brand prompt chevron (the ">" of the ">|" mark) — always paired with the live cursor.
function PromptChevron() {
  return (
    <svg viewBox="0 0 62 67" style={{ height: '0.8em', width: 'auto' }} aria-hidden="true">
      <path
        d="M 0,0 L 56,23 Q 62,25 62,30 L 62,36 Q 62,41 56,43 L 0,66 L 0,52 L 47,34 Q 48,33 47,32 L 0,13 Z"
        fill="currentColor"
      />
    </svg>
  );
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

  // Awaits the vault commit so an immediate reload after login still restores the session.
  function persist(session: {
    accessToken: string;
    refreshToken: string;
    email: string;
    expiresIn: number;
  }): Promise<void> {
    return setToken({
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
      await persist(session);
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
    <main className="auth-main">
      <div className="auth-card">
        <div className="auth-body">
          <div className="auth-brand">
            <Logo size={22} />
            <Wordmark height={20} />
          </div>

          <span className="auth-eyebrow">
            <span className="dot is-pulse" aria-hidden="true" /> oraclous console
          </span>

          <div>
            <h1 id={titleId} className="auth-title">
              {isSignup ? 'Create your account.' : 'Welcome back.'}
            </h1>
            <p className="auth-sub" style={{ marginTop: 6 }}>
              {isSignup
                ? 'Start building your living knowledge graph.'
                : 'Sign in to your tenant. Your session token is held in memory — never stored.'}
            </p>
          </div>

          {error !== null && (
            <p
              id={errorId}
              role="alert"
              className="callout"
              data-tone="error"
              style={{ margin: 0 }}
            >
              {error}
            </p>
          )}

          <form className="auth-form" onSubmit={onSubmit} aria-labelledby={titleId} noValidate>
            <div className="field">
              <label htmlFor="auth-email">Work email</label>
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
              />
            </div>

            <div className="field">
              <label htmlFor="auth-password">Password</label>
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
              />
              {isSignup && <span className="hint">At least 8 characters.</span>}
            </div>

            <div className="btn-row">
              <button
                type="submit"
                className="btn"
                data-variant="primary"
                disabled={submitting}
                aria-busy={submitting}
              >
                {submitting
                  ? isSignup
                    ? 'Creating account…'
                    : 'Signing in…'
                  : isSignup
                    ? 'Create account'
                    : 'Sign in'}
              </button>

              {available.length > 0 && (
                <>
                  <div className="div-or" aria-hidden="true">
                    or
                  </div>
                  {available.map((p) => (
                    <button
                      key={p}
                      type="button"
                      className="btn"
                      data-variant="secondary"
                      onClick={() => onOAuth(p)}
                    >
                      Continue with {providerLabel(p)}
                    </button>
                  ))}
                </>
              )}
            </div>
          </form>

          <span className="terminal-strip">
            <span className="prompt">
              <PromptChevron />
            </span>
            <span>oraclous auth · session held in memory</span>
            <span className="cursor is-blink" aria-hidden="true" />
          </span>
        </div>

        <div className="auth-foot">
          <span>
            {isSignup ? 'Already have an account?' : 'New to Oraclous?'}{' '}
            <button type="button" onClick={toggleMode}>
              {isSignup ? 'Sign in' : 'Create an account'}
            </button>
          </span>
        </div>
      </div>
    </main>
  );
}
