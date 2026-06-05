// Create organisation — POST /v1/orgs. On success the org list is refreshed (the new
// org appears in the tenant switcher), it becomes the current org, and we return to /app.
import { useId, useState, type CSSProperties, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { ApiClientError, ErrorCode } from '@oraclous/api-client';
import { useDash } from '../context/dash.js';
import { useCreateOrg } from '../lib/session.js';

function messageFor(cause: unknown): string {
  if (ApiClientError.is(cause)) {
    if (cause.code === ErrorCode.CONFLICT) return 'An organisation with that name already exists.';
    if (cause.code === ErrorCode.VALIDATION_FAILED) return 'Enter a valid organisation name.';
    return cause.message;
  }
  return 'Something went wrong. Please try again.';
}

const styles = {
  card: {
    width: '100%',
    maxWidth: 480,
    display: 'grid',
    gap: 16,
    padding: 24,
    background: 'var(--paper, #f4f4f2)',
    border: '1px solid var(--rule, #d7d6d2)',
    borderRadius: 12,
    fontFamily: 'var(--font-sans, system-ui, sans-serif)',
  },
  heading: { margin: 0, fontSize: 20, fontWeight: 600, color: 'var(--ink, #0b1220)' },
  sub: { margin: 0, fontSize: 13.5, color: 'var(--ink, #0b1220)' },
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
  actions: { display: 'flex', gap: 8, justifyContent: 'flex-end' },
  primary: {
    padding: '10px 16px',
    fontSize: 14,
    fontWeight: 600,
    fontFamily: 'var(--font-sans, system-ui, sans-serif)',
    color: 'var(--paper, #f4f4f2)',
    background: 'var(--ink, #0b1220)',
    border: 'none',
    borderRadius: 8,
    cursor: 'pointer',
  },
  ghost: {
    padding: '10px 16px',
    fontSize: 14,
    fontWeight: 500,
    fontFamily: 'var(--font-sans, system-ui, sans-serif)',
    color: 'var(--ink, #0b1220)',
    background: 'transparent',
    border: '1px solid var(--rule, #d7d6d2)',
    borderRadius: 8,
    cursor: 'pointer',
  },
  busy: { opacity: 0.6, cursor: 'default' },
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
    <form style={styles.card} onSubmit={onSubmit} aria-labelledby={titleId} noValidate>
      <h1 id={titleId} style={styles.heading}>
        Create organisation
      </h1>
      <p style={styles.sub}>
        An organisation is a shared workspace. You&rsquo;ll be its owner and can invite members
        later.
      </p>

      {error !== null && (
        <p id={errorId} role="alert" style={styles.error}>
          {error}
        </p>
      )}

      <div style={styles.field}>
        <label htmlFor="org-name" style={styles.label}>
          Organisation name
        </label>
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
          style={styles.input}
        />
      </div>

      <div style={styles.actions}>
        <button type="button" onClick={() => navigate('/app')} style={styles.ghost}>
          Cancel
        </button>
        <button
          type="submit"
          disabled={busy || name.trim() === ''}
          aria-busy={busy}
          style={busy ? { ...styles.primary, ...styles.busy } : styles.primary}
        >
          {busy ? 'Creating…' : 'Create organisation'}
        </button>
      </div>
    </form>
  );
}
