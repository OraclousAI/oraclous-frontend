// Create organisation — POST /v1/orgs. On success the org list is refreshed (the new
// org appears in the tenant switcher), it becomes the current org, and we return to /app.
// In-shell card styled with the shared page patterns (handoff login.html state 03 register).
import { useId, useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { ApiClientError, ErrorCode } from '@oraclous/api-client';
import { useDash } from '../context/dash.js';
import { useCreateOrg } from '../lib/session.js';
import './auth.css';

function messageFor(cause: unknown): string {
  if (ApiClientError.is(cause)) {
    if (cause.code === ErrorCode.CONFLICT) return 'An organisation with that name already exists.';
    if (cause.code === ErrorCode.VALIDATION_FAILED) return 'Enter a valid organisation name.';
    return cause.message;
  }
  return 'Something went wrong. Please try again.';
}

export default function CreateOrgPage() {
  const navigate = useNavigate();
  const { setCurrentOrg } = useDash();
  const createOrg = useCreateOrg();

  const titleId = useId();
  const errorId = useId();
  const [name, setName] = useState('');
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    try {
      const org = await createOrg.mutateAsync({ name: name.trim() });
      setCurrentOrg(org.id);
      navigate('/app', { replace: true });
    } catch (cause) {
      setError(messageFor(cause));
    }
  }

  const busy = createOrg.isPending;

  return (
    <form
      className="card"
      style={{ width: '100%', maxWidth: 480 }}
      onSubmit={onSubmit}
      aria-labelledby={titleId}
      noValidate
    >
      <div
        className="card-body"
        style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-4)' }}
      >
        <div>
          <span className="auth-eyebrow">New tenant</span>
          <h1 id={titleId} className="auth-title" style={{ marginTop: 6 }}>
            Create organisation
          </h1>
          <p className="auth-sub" style={{ marginTop: 6 }}>
            An organisation is a shared workspace. You&rsquo;ll be its owner and can invite members
            later.
          </p>
        </div>

        {error !== null && (
          <p id={errorId} role="alert" className="callout" data-tone="error" style={{ margin: 0 }}>
            {error}
          </p>
        )}

        <div className="field">
          <label htmlFor="org-name">Organisation name</label>
          <input
            id="org-name"
            name="name"
            type="text"
            autoComplete="organization"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            aria-invalid={error !== null}
            aria-describedby={error !== null ? errorId : undefined}
          />
        </div>

        <div style={{ display: 'flex', gap: 'var(--sp-2)', justifyContent: 'flex-end' }}>
          <button
            type="button"
            className="btn"
            data-variant="ghost"
            onClick={() => navigate('/app')}
          >
            Cancel
          </button>
          <button
            type="submit"
            className="btn"
            data-variant="primary"
            disabled={busy || name.trim() === ''}
            aria-busy={busy}
          >
            {busy ? 'Creating…' : 'Create organisation'}
          </button>
        </div>
      </div>
    </form>
  );
}
