// Accept-invite landing — reached via the shared link (/app/accept-invite?token=…), behind auth.
// Peeks the invitation (org + role) by its token, then lets the signed-in user accept and join.
import { useState, type CSSProperties } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { ApiClientError } from '@oraclous/api-client';
import { useAcceptInvitation, usePeekInvitation } from '../lib/invitations.js';

function messageFor(cause: unknown): string {
  if (ApiClientError.is(cause)) return cause.message;
  return 'Something went wrong. Please try again.';
}

const styles = {
  page: { display: 'grid', placeItems: 'start center', paddingTop: 24 },
  card: {
    display: 'grid',
    gap: 16,
    width: '100%',
    maxWidth: 460,
    padding: 24,
    background: 'var(--paper, #f4f4f2)',
    border: '1px solid var(--rule, #d7d6d2)',
    borderRadius: 12,
  },
  h1: { margin: 0, fontSize: 20, fontWeight: 600, color: 'var(--ink, #0b1220)' },
  lead: { margin: 0, fontSize: 15, lineHeight: 1.5, color: 'var(--ink, #0b1220)' },
  muted: { margin: 0, fontSize: 13.5, color: 'var(--ink, #0b1220)' },
  actions: { display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' },
  primary: {
    padding: '9px 16px',
    fontSize: 14,
    fontWeight: 600,
    color: 'var(--paper, #f4f4f2)',
    background: 'var(--ink, #0b1220)',
    border: 'none',
    borderRadius: 8,
    cursor: 'pointer',
  },
  busy: { opacity: 0.6, cursor: 'default' },
  secondary: {
    padding: '9px 16px',
    fontSize: 14,
    fontWeight: 500,
    color: 'var(--ink, #0b1220)',
    background: 'transparent',
    border: '1px solid var(--rule, #d7d6d2)',
    borderRadius: 8,
    textDecoration: 'none',
  },
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

export default function AcceptInvitePage() {
  const [params] = useSearchParams();
  const token = params.get('token') ?? '';
  const { peek, isLoading, isError } = usePeekInvitation(token);
  const accept = useAcceptInvitation();
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);

  async function onAccept() {
    setError(null);
    try {
      await accept.mutateAsync(token);
      navigate('/app', { replace: true });
    } catch (cause) {
      setError(messageFor(cause));
    }
  }

  return (
    <div style={styles.page}>
      <section style={styles.card} aria-label="Accept invitation">
        <h1 style={styles.h1}>Join organisation</h1>
        {token === '' ? (
          <p style={styles.error} role="alert">
            This invite link is missing its token.
          </p>
        ) : isLoading ? (
          <p style={styles.muted} role="status">
            Loading…
          </p>
        ) : isError || peek === null ? (
          <p style={styles.error} role="alert">
            This invitation is invalid or has expired.
          </p>
        ) : peek.status !== 'pending' ? (
          <>
            <p style={styles.muted}>This invitation is no longer available ({peek.status}).</p>
            <Link to="/app" style={styles.secondary}>
              Go to the app
            </Link>
          </>
        ) : (
          <>
            <p style={styles.lead}>
              You&rsquo;ve been invited to join{' '}
              <strong>{peek.organisationName ?? 'an organisation'}</strong> as{' '}
              <strong>{peek.role}</strong>.
            </p>
            {error !== null && (
              <p style={styles.error} role="alert">
                {error}
              </p>
            )}
            <div style={styles.actions}>
              <button
                type="button"
                onClick={onAccept}
                disabled={accept.isPending}
                aria-busy={accept.isPending}
                style={accept.isPending ? { ...styles.primary, ...styles.busy } : styles.primary}
              >
                {accept.isPending ? 'Joining…' : 'Accept invitation'}
              </button>
              <Link to="/app" style={styles.secondary}>
                Maybe later
              </Link>
            </div>
          </>
        )}
      </section>
    </div>
  );
}
