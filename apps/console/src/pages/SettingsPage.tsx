// Settings — organisation settings (name/description/logo, owner-gated) + account (email +
// change password). Org edits PATCH /v1/orgs/{id}; password POSTs /v1/auth/change-password.
// Styled with the shared page patterns (handoff card + field chrome).
import { useEffect, useId, useState, type FormEvent } from 'react';
import { ApiClientError } from '@oraclous/api-client';
import { useDash } from '../context/dash.js';
import { useChangePassword, useMe, useOrg, useUpdateOrg } from '../lib/session.js';
import { SkeletonList } from '../components/ui/Skeleton.js';

function messageFor(cause: unknown): string {
  if (ApiClientError.is(cause)) return cause.message;
  return 'Something went wrong. Please try again.';
}

// Terminal confirmation uses the dedicated --success token, NOT mint (mint = live signal only).
const successCallout = {
  margin: 0,
  background: 'var(--success-bg)',
  borderColor: 'var(--success)',
} as const;

export default function SettingsPage() {
  const { currentOrg, user } = useDash();
  const { principal, isLoading: meLoading } = useMe();
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

  // Sync the form from the loaded org once per org (not on every refetch, to avoid clobbering edits),
  // and clear any save banner so it isn't attributed to the newly-selected org.
  useEffect(() => {
    setOrgSaved(false);
    setOrgError(null);
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

  const formGap = { display: 'flex', flexDirection: 'column', gap: 'var(--sp-3)' } as const;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-4)', maxWidth: 720 }}>
      <header className="page-head" style={{ marginBottom: 0 }}>
        <div>
          <span className="eyebrow">Configuration</span>
          <h1>Settings</h1>
          <p className="sub">Organisation details and your account.</p>
        </div>
      </header>

      <section className="card" aria-label="Organisation settings">
        <div className="card-head">
          <div className="h">
            <h2>Organisation</h2>
            <span className="sub">Name, description, and logo — owner-editable</span>
          </div>
        </div>
        <div className="card-body">
          {orgId === '' ? (
            <p style={{ margin: 0, fontSize: 13.5, color: 'var(--mute)' }}>
              No organisation selected.
            </p>
          ) : isLoading || meLoading ? (
            <SkeletonList rows={3} />
          ) : isError || org === null ? (
            <p className="callout" data-tone="error" role="alert" style={{ margin: 0 }}>
              Could not load the organisation.
            </p>
          ) : (
            <form style={formGap} onSubmit={onSaveOrg}>
              {orgError !== null && (
                <p role="alert" className="callout" data-tone="error" style={{ margin: 0 }}>
                  {orgError}
                </p>
              )}
              {orgSaved && (
                <p role="status" className="callout" style={successCallout}>
                  Saved.
                </p>
              )}
              <div className="field">
                <label htmlFor={nameId}>Name</label>
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
                />
              </div>
              <div className="field">
                <label htmlFor={descId}>Description · optional</label>
                <textarea
                  id={descId}
                  value={description}
                  onChange={(e) => {
                    setDescription(e.target.value);
                    setOrgSaved(false);
                  }}
                  disabled={!isOwner}
                  style={{ minHeight: 64, resize: 'vertical' }}
                />
              </div>
              <div className="field">
                <label htmlFor={logoId}>Logo URL · optional</label>
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
                />
              </div>
              {isOwner ? (
                <button
                  type="submit"
                  className="btn"
                  data-variant="primary"
                  style={{ width: 'fit-content' }}
                  disabled={updateOrg.isPending || name.trim() === ''}
                  aria-busy={updateOrg.isPending}
                >
                  {updateOrg.isPending ? 'Saving…' : 'Save changes'}
                </button>
              ) : (
                <p style={{ margin: 0, fontSize: 13, color: 'var(--mute)' }}>
                  Only the organisation owner can edit these settings.
                </p>
              )}
            </form>
          )}
        </div>
      </section>

      <section className="card" aria-label="Account">
        <div className="card-head">
          <div className="h">
            <h2>Account</h2>
            <span className="sub">Identity and credentials</span>
          </div>
        </div>
        <div className="card-body" style={formGap}>
          <div className="field">
            <span style={{ ...labelLike }}>Email</span>
            <span style={{ fontSize: 14 }}>{user.email !== '' ? user.email : '—'}</span>
          </div>
          <form style={formGap} onSubmit={onChangePassword}>
            {pwError !== null && (
              <p role="alert" className="callout" data-tone="error" style={{ margin: 0 }}>
                {pwError}
              </p>
            )}
            {pwSaved && (
              <p role="status" className="callout" style={successCallout}>
                Password changed.
              </p>
            )}
            <div className="field">
              <label htmlFor={pwId}>New password · at least 8 characters</label>
              <input
                id={pwId}
                type="password"
                autoComplete="new-password"
                value={newPassword}
                onChange={(e) => {
                  setNewPassword(e.target.value);
                  setPwSaved(false);
                }}
              />
            </div>
            <div className="field">
              <label htmlFor={pwConfirmId}>Confirm new password</label>
              <input
                id={pwConfirmId}
                type="password"
                autoComplete="new-password"
                value={confirmPassword}
                onChange={(e) => {
                  setConfirmPassword(e.target.value);
                  setPwSaved(false);
                }}
              />
            </div>
            <button
              type="submit"
              className="btn"
              data-variant="primary"
              style={{ width: 'fit-content' }}
              disabled={changePassword.isPending || newPassword === ''}
              aria-busy={changePassword.isPending}
            >
              {changePassword.isPending ? 'Changing…' : 'Change password'}
            </button>
          </form>
        </div>
      </section>
    </div>
  );
}

// Matches the .field label treatment for the read-only email row.
const labelLike = {
  fontFamily: 'var(--font-mono)',
  fontSize: 10.5,
  letterSpacing: '0.06em',
  textTransform: 'uppercase',
  color: 'var(--mute)',
} as const;
