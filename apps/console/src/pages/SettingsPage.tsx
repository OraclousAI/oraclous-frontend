// Settings — organisation settings (name/description/logo, owner-gated) + account (email +
// change password). Org edits PATCH /v1/orgs/{id}; password POSTs /v1/auth/change-password.
import { useEffect, useId, useState, type CSSProperties, type FormEvent } from 'react';
import { ApiClientError } from '@oraclous/api-client';
import { useDash } from '../context/dash.js';
import { useChangePassword, useMe, useOrg, useUpdateOrg } from '../lib/session.js';

function messageFor(cause: unknown): string {
  if (ApiClientError.is(cause)) return cause.message;
  return 'Something went wrong. Please try again.';
}

const styles = {
  page: { display: 'grid', gap: 20, maxWidth: 720 },
  h1: { margin: 0, fontSize: 24, fontWeight: 600, color: 'var(--ink, #0b1220)' },
  card: {
    display: 'grid',
    gap: 14,
    padding: 20,
    background: 'var(--paper, #f4f4f2)',
    border: '1px solid var(--rule, #d7d6d2)',
    borderRadius: 12,
    fontFamily: 'var(--font-sans, system-ui, sans-serif)',
  },
  h2: { margin: 0, fontSize: 16, fontWeight: 600, color: 'var(--ink, #0b1220)' },
  field: { display: 'grid', gap: 6 },
  label: { fontSize: 13, fontWeight: 500, color: 'var(--ink, #0b1220)' },
  optional: { fontWeight: 400, color: 'var(--ink, #0b1220)', opacity: 0.7 },
  input: {
    width: '100%',
    boxSizing: 'border-box',
    padding: '9px 12px',
    fontSize: 14,
    fontFamily: 'var(--font-sans, system-ui, sans-serif)',
    color: 'var(--ink, #0b1220)',
    background: '#ffffff',
    border: '1px solid var(--rule, #d7d6d2)',
    borderRadius: 8,
  },
  textarea: {
    width: '100%',
    boxSizing: 'border-box',
    minHeight: 64,
    padding: '9px 12px',
    fontSize: 14,
    fontFamily: 'var(--font-sans, system-ui, sans-serif)',
    color: 'var(--ink, #0b1220)',
    background: '#ffffff',
    border: '1px solid var(--rule, #d7d6d2)',
    borderRadius: 8,
    resize: 'vertical',
  },
  readonlyValue: { fontSize: 14, color: 'var(--ink, #0b1220)' },
  primary: {
    padding: '9px 16px',
    fontSize: 14,
    fontWeight: 600,
    color: 'var(--paper, #f4f4f2)',
    background: 'var(--ink, #0b1220)',
    border: 'none',
    borderRadius: 8,
    cursor: 'pointer',
    width: 'fit-content',
  },
  busy: { opacity: 0.6, cursor: 'default' },
  note: { margin: 0, fontSize: 13, color: 'var(--ink, #0b1220)', opacity: 0.75 },
  muted: { margin: 0, fontSize: 13.5, color: 'var(--ink, #0b1220)' },
  error: {
    margin: 0,
    padding: '10px 12px',
    fontSize: 13,
    color: 'var(--ink, #0b1220)',
    background: 'var(--error-bg, #fbeae8)',
    border: '1px solid var(--error, #c8412c)',
    borderRadius: 8,
  },
  success: {
    margin: 0,
    padding: '10px 12px',
    fontSize: 13,
    color: 'var(--ink, #0b1220)',
    background: 'rgba(16,216,138,0.12)',
    border: '1px solid var(--accent, #10d88a)',
    borderRadius: 8,
  },
} satisfies Record<string, CSSProperties>;

export default function SettingsPage() {
  const { currentOrg, user } = useDash();
  const { principal } = useMe();
  const orgId = currentOrg?.id ?? '';
  const { org, isLoading, isError } = useOrg(orgId);
  const updateOrg = useUpdateOrg(orgId);
  const changePassword = useChangePassword();

  const isOwner = principal !== null && org !== null && principal.id === org.ownerUserId;

  const nameId = useId();
  const descId = useId();
  const logoId = useId();
  const pwId = useId();
  const pwConfirmId = useId();

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [logoUrl, setLogoUrl] = useState('');
  const [orgError, setOrgError] = useState<string | null>(null);
  const [orgSaved, setOrgSaved] = useState(false);

  // Sync the form from the loaded org once per org (not on every refetch, to avoid clobbering edits).
  useEffect(() => {
    if (org !== null) {
      setName(org.name);
      setDescription(org.description ?? '');
      setLogoUrl(org.logoUrl ?? '');
    }
  }, [org?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [pwError, setPwError] = useState<string | null>(null);
  const [pwSaved, setPwSaved] = useState(false);

  async function onSaveOrg(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setOrgError(null);
    setOrgSaved(false);
    try {
      await updateOrg.mutateAsync({
        name: name.trim(),
        description: description.trim() === '' ? null : description.trim(),
        logoUrl: logoUrl.trim() === '' ? null : logoUrl.trim(),
      });
      setOrgSaved(true);
    } catch (cause) {
      setOrgError(messageFor(cause));
    }
  }

  async function onChangePassword(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPwError(null);
    setPwSaved(false);
    if (newPassword.length < 8) {
      setPwError('Password must be at least 8 characters.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setPwError('Passwords do not match.');
      return;
    }
    try {
      await changePassword.mutateAsync(newPassword);
      setPwSaved(true);
      setNewPassword('');
      setConfirmPassword('');
    } catch (cause) {
      setPwError(messageFor(cause));
    }
  }

  return (
    <div style={styles.page}>
      <h1 style={styles.h1}>Settings</h1>

      <section style={styles.card} aria-label="Organisation settings">
        <h2 style={styles.h2}>Organisation</h2>
        {orgId === '' ? (
          <p style={styles.muted}>No organisation selected.</p>
        ) : isLoading ? (
          <p style={styles.muted} role="status">
            Loading…
          </p>
        ) : isError || org === null ? (
          <p style={styles.error} role="alert">
            Could not load the organisation.
          </p>
        ) : (
          <form style={{ display: 'grid', gap: 14 }} onSubmit={onSaveOrg}>
            {orgError !== null && (
              <p role="alert" style={styles.error}>
                {orgError}
              </p>
            )}
            {orgSaved && (
              <p role="status" style={styles.success}>
                Saved.
              </p>
            )}
            <div style={styles.field}>
              <label htmlFor={nameId} style={styles.label}>
                Name
              </label>
              <input
                id={nameId}
                type="text"
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  setOrgSaved(false);
                }}
                disabled={!isOwner}
                required
                style={styles.input}
              />
            </div>
            <div style={styles.field}>
              <label htmlFor={descId} style={styles.label}>
                Description <span style={styles.optional}>(optional)</span>
              </label>
              <textarea
                id={descId}
                value={description}
                onChange={(e) => {
                  setDescription(e.target.value);
                  setOrgSaved(false);
                }}
                disabled={!isOwner}
                style={styles.textarea}
              />
            </div>
            <div style={styles.field}>
              <label htmlFor={logoId} style={styles.label}>
                Logo URL <span style={styles.optional}>(optional)</span>
              </label>
              <input
                id={logoId}
                type="url"
                value={logoUrl}
                onChange={(e) => {
                  setLogoUrl(e.target.value);
                  setOrgSaved(false);
                }}
                disabled={!isOwner}
                placeholder="https://…"
                style={styles.input}
              />
            </div>
            {isOwner ? (
              <button
                type="submit"
                disabled={updateOrg.isPending || name.trim() === ''}
                aria-busy={updateOrg.isPending}
                style={updateOrg.isPending ? { ...styles.primary, ...styles.busy } : styles.primary}
              >
                {updateOrg.isPending ? 'Saving…' : 'Save changes'}
              </button>
            ) : (
              <p style={styles.note}>Only the organisation owner can edit these settings.</p>
            )}
          </form>
        )}
      </section>

      <section style={styles.card} aria-label="Account">
        <h2 style={styles.h2}>Account</h2>
        <div style={styles.field}>
          <span style={styles.label}>Email</span>
          <span style={styles.readonlyValue}>{user.email !== '' ? user.email : '—'}</span>
        </div>
        <form style={{ display: 'grid', gap: 14 }} onSubmit={onChangePassword}>
          {pwError !== null && (
            <p role="alert" style={styles.error}>
              {pwError}
            </p>
          )}
          {pwSaved && (
            <p role="status" style={styles.success}>
              Password changed.
            </p>
          )}
          <div style={styles.field}>
            <label htmlFor={pwId} style={styles.label}>
              New password <span style={styles.optional}>(at least 8 characters)</span>
            </label>
            <input
              id={pwId}
              type="password"
              autoComplete="new-password"
              value={newPassword}
              onChange={(e) => {
                setNewPassword(e.target.value);
                setPwSaved(false);
              }}
              style={styles.input}
            />
          </div>
          <div style={styles.field}>
            <label htmlFor={pwConfirmId} style={styles.label}>
              Confirm new password
            </label>
            <input
              id={pwConfirmId}
              type="password"
              autoComplete="new-password"
              value={confirmPassword}
              onChange={(e) => {
                setConfirmPassword(e.target.value);
                setPwSaved(false);
              }}
              style={styles.input}
            />
          </div>
          <button
            type="submit"
            disabled={changePassword.isPending || newPassword === ''}
            aria-busy={changePassword.isPending}
            style={
              changePassword.isPending ? { ...styles.primary, ...styles.busy } : styles.primary
            }
          >
            {changePassword.isPending ? 'Changing…' : 'Change password'}
          </button>
        </form>
      </section>
    </div>
  );
}
