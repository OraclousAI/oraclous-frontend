// Sign-in — real email/password auth against the gateway (POST /v1/auth/login).
// On success the session token is held in the in-memory token store (never persisted)
// and the user is returned to their original destination.
import { useId, useState, type CSSProperties, type FormEvent } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ApiClientError, ErrorCode } from '@oraclous/api-client';
import { useApi } from '../lib/api.jsx';
import { useTokenStore } from '../lib/token-store.jsx';

// Only ever navigate to an in-app path (guards against open-redirect via ?redirect=).
// Reject protocol-relative (//) and backslash forms so the guard holds even if a future caller
// feeds the value into window.location rather than react-router's same-origin navigate().
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

function messageFor(cause: unknown): string {
  if (ApiClientError.is(cause)) {
    if (cause.code === ErrorCode.UNAUTHENTICATED) return 'Invalid email or password.';
    if (cause.code === ErrorCode.VALIDATION_FAILED) return 'Enter a valid email and password.';
    return cause.message;
  }
  return 'Something went wrong. Please try again.';
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
  form: {
    width: '100%',
    maxWidth: 380,
    display: 'grid',
    gap: 16,
    padding: 28,
    background: 'var(--paper, #f4f4f2)',
    border: '1px solid var(--rule, #d7d6d2)',
    borderRadius: 12,
    boxShadow: 'var(--shadow-2, 0 2px 6px -2px rgba(11, 18, 32, 0.12))',
  },
  heading: {
    margin: 0,
    fontSize: 22,
    fontWeight: 600,
    letterSpacing: '-0.02em',
    color: 'var(--ink, #0b1220)',
  },
  field: { display: 'grid', gap: 6 },
  label: { fontSize: 13, fontWeight: 500, color: 'var(--ink, #0b1220)' },
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
} satisfies Record<string, CSSProperties>;

export default function LoginPage() {
  const { auth } = useApi();
  const { setToken } = useTokenStore();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const redirect = safeRedirect(params.get('redirect'));

  const titleId = useId();
  const errorId = useId();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const session = await auth.login({ email, password });
      setToken({
        token: session.accessToken,
        email: session.email,
        expiresAt: Date.now() + session.expiresIn * 1000,
      });
      navigate(redirect, { replace: true });
    } catch (cause) {
      setError(messageFor(cause));
      setSubmitting(false);
    }
  }

  return (
    <main style={styles.main}>
      <form style={styles.form} onSubmit={onSubmit} aria-labelledby={titleId} noValidate>
        <h1 id={titleId} style={styles.heading}>
          Sign in to Oraclous
        </h1>

        {error !== null && (
          <p id={errorId} role="alert" style={styles.error}>
            {error}
          </p>
        )}

        <div style={styles.field}>
          <label htmlFor="login-email" style={styles.label}>
            Email
          </label>
          <input
            id="login-email"
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
          <label htmlFor="login-password" style={styles.label}>
            Password
          </label>
          <input
            id="login-password"
            name="password"
            type="password"
            autoComplete="current-password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            aria-invalid={error !== null}
            aria-describedby={error !== null ? errorId : undefined}
            style={styles.input}
          />
        </div>

        <button
          type="submit"
          disabled={submitting}
          aria-busy={submitting}
          style={submitting ? { ...styles.button, ...styles.buttonBusy } : styles.button}
        >
          {submitting ? 'Signing in…' : 'Sign in'}
        </button>
      </form>
    </main>
  );
}
