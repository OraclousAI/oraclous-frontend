// Accept-invite landing — reached via the shared link (/app/accept-invite?token=…), behind auth.
// Peeks the invitation (org + role) by its token, then lets the signed-in user accept and join.
// Styled per the handoff login.html (state 02 — accept invitation), with the in-shell card chrome.
import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { ApiClientError } from '@oraclous/api-client';
import { useAcceptInvitation, usePeekInvitation } from '../lib/invitations.js';
import { SkeletonList } from '../components/ui/Skeleton.js';
import './auth.css';

function messageFor(cause: unknown): string {
  if (ApiClientError.is(cause)) return cause.message;
  return 'Something went wrong. Please try again.';
}

function initials(name: string): string {
  return name
    .split(/\s+/)
    .map((w) => w.charAt(0))
    .join('')
    .slice(0, 2)
    .toUpperCase();
}

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

  const orgName = peek?.organisationName ?? 'an organisation';

  return (
    <div style={{ display: 'grid', placeItems: 'start center', paddingTop: 'var(--sp-6)' }}>
      <section
        className="card"
        style={{ width: '100%', maxWidth: 460 }}
        aria-label="Accept invitation"
      >
        <div
          className="card-body"
          style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-4)' }}
        >
          <div>
            <span className="auth-eyebrow">Invitation</span>
            <h1 className="auth-title" style={{ marginTop: 6 }}>
              {peek !== null && peek.status === 'pending'
                ? `You're invited to ${orgName}.`
                : 'Join organisation'}
            </h1>
          </div>

          {token === '' ? (
            <p className="callout" data-tone="error" role="alert" style={{ margin: 0 }}>
              This invite link is missing its token.
            </p>
          ) : isLoading ? (
            <SkeletonList rows={2} />
          ) : isError || peek === null ? (
            <p className="callout" data-tone="error" role="alert" style={{ margin: 0 }}>
              This invitation is invalid or has expired.
            </p>
          ) : peek.status !== 'pending' ? (
            <>
              <p className="auth-sub" style={{ maxWidth: 'none' }}>
                This invitation is no longer available ({peek.status}).
              </p>
              <div className="btn-row" style={{ flexDirection: 'row' }}>
                <Link to="/app" className="btn" data-variant="secondary">
                  Go to the app
                </Link>
              </div>
            </>
          ) : (
            <>
              <div className="invite-from">
                <div className="av" aria-hidden="true">
                  {initials(orgName)}
                </div>
                <div>
                  <div className="who">
                    Join <strong>{orgName}</strong>
                  </div>
                  <div className="email">role · {peek.role}</div>
                </div>
              </div>

              {error !== null && (
                <p className="callout" data-tone="error" role="alert" style={{ margin: 0 }}>
                  {error}
                </p>
              )}

              <div className="btn-row" style={{ flexDirection: 'row' }}>
                <button
                  type="button"
                  className="btn"
                  data-variant="primary"
                  onClick={onAccept}
                  disabled={accept.isPending}
                  aria-busy={accept.isPending}
                >
                  {accept.isPending ? 'Joining…' : 'Accept invitation'}
                </button>
                <Link to="/app" className="btn" data-variant="ghost">
                  Maybe later
                </Link>
              </div>
            </>
          )}
        </div>
      </section>
    </div>
  );
}
