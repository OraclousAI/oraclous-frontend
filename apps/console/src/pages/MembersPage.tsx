// Members — the org roster + invitations. Owner sees + manages members (change role, remove), invites
// by email, and revokes pending invitations. On invite the raw token is shown once as a share link.
import { useId, useState, type CSSProperties, type FormEvent } from 'react';
import { ApiClientError, type MemberRole } from '@oraclous/api-client';
import { useDash } from '../context/dash.js';
import { useChangeMemberRole, useMe, useMembers, useOrg, useRemoveMember } from '../lib/session.js';
import { useCreateInvitation, useInvitations, useRevokeInvitation } from '../lib/invitations.js';
import { useToast } from '../lib/toast.jsx';

function formatDate(iso: string): string {
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? '' : d.toLocaleDateString();
}

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
  },
  h2: { margin: 0, fontSize: 16, fontWeight: 600, color: 'var(--ink, #0b1220)' },
  field: { display: 'grid', gap: 6 },
  label: { fontSize: 13, fontWeight: 500, color: 'var(--ink, #0b1220)' },
  row: { display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'flex-end' },
  input: {
    flex: 1,
    minWidth: 200,
    boxSizing: 'border-box',
    padding: '9px 12px',
    fontSize: 14,
    color: 'var(--ink, #0b1220)',
    background: '#ffffff',
    border: '1px solid var(--rule, #d7d6d2)',
    borderRadius: 8,
  },
  select: {
    padding: '9px 12px',
    fontSize: 14,
    color: 'var(--ink, #0b1220)',
    background: '#ffffff',
    border: '1px solid var(--rule, #d7d6d2)',
    borderRadius: 8,
  },
  primary: {
    padding: '9px 16px',
    fontSize: 14,
    fontWeight: 600,
    color: 'var(--paper, #f4f4f2)',
    background: 'var(--ink, #0b1220)',
    border: 'none',
    borderRadius: 8,
    cursor: 'pointer',
    whiteSpace: 'nowrap',
  },
  secondary: {
    padding: '7px 12px',
    fontSize: 13,
    fontWeight: 500,
    color: 'var(--ink, #0b1220)',
    background: 'transparent',
    border: '1px solid var(--rule, #d7d6d2)',
    borderRadius: 8,
    cursor: 'pointer',
    whiteSpace: 'nowrap',
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
  invitePanel: {
    display: 'grid',
    gap: 8,
    padding: '12px 14px',
    background: 'var(--success-bg, #e7f3ec)',
    border: '1px solid var(--success, #2e8b57)',
    borderRadius: 8,
  },
  linkRow: { display: 'flex', gap: 8, flexWrap: 'wrap' },
  linkInput: {
    flex: 1,
    minWidth: 220,
    boxSizing: 'border-box',
    padding: '8px 10px',
    fontSize: 12.5,
    fontFamily: 'var(--font-mono, monospace)',
    color: 'var(--ink, #0b1220)',
    background: '#ffffff',
    border: '1px solid var(--rule, #d7d6d2)',
    borderRadius: 6,
  },
  list: { listStyle: 'none', margin: 0, padding: 0, display: 'grid', gap: 8 },
  item: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
    padding: '10px 12px',
    background: '#ffffff',
    border: '1px solid var(--rule, #d7d6d2)',
    borderRadius: 8,
  },
  itemMain: { display: 'grid', gap: 2, minWidth: 0 },
  itemEmail: { fontSize: 14, color: 'var(--ink, #0b1220)', overflowWrap: 'break-word' },
  itemMeta: {
    fontSize: 12,
    color: 'var(--ink, #0b1220)',
    opacity: 0.75,
    textTransform: 'capitalize',
  },
  memberActions: { display: 'flex', gap: 8, alignItems: 'center', flexShrink: 0 },
  badge: {
    fontSize: 11,
    fontWeight: 600,
    textTransform: 'uppercase',
    letterSpacing: '0.04em',
    color: 'var(--ink, #0b1220)',
    background: 'var(--paper-soft, #eceae5)',
    border: '1px solid var(--rule, #d7d6d2)',
    borderRadius: 999,
    padding: '2px 8px',
    whiteSpace: 'nowrap',
  },
} satisfies Record<string, CSSProperties>;

export default function MembersPage() {
  const { currentOrg } = useDash();
  const { principal, isLoading: meLoading } = useMe();
  const orgId = currentOrg?.id ?? '';
  const { org, isLoading: orgLoading } = useOrg(orgId);
  const { members, isLoading: membersLoading } = useMembers(orgId);
  const { invitations, isLoading: invLoading } = useInvitations(orgId);
  const createInvite = useCreateInvitation(orgId);
  const revokeInvite = useRevokeInvitation(orgId);
  const changeRole = useChangeMemberRole(orgId);
  const removeMember = useRemoveMember(orgId);
  const toast = useToast();

  const isOwner = principal !== null && org !== null && principal.id === org.ownerUserId;

  const emailId = useId();
  const roleId = useId();
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('member');
  const [error, setError] = useState<string | null>(null);
  const [listError, setListError] = useState<string | null>(null);
  const [memberError, setMemberError] = useState<string | null>(null);
  const [createdToken, setCreatedToken] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const inviteLink =
    createdToken !== null
      ? `${window.location.origin}/app/accept-invite?token=${encodeURIComponent(createdToken)}`
      : null;

  async function onInvite(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setCreatedToken(null);
    setCopied(false);
    try {
      const invitation = await createInvite.mutateAsync({ email: email.trim(), role });
      setCreatedToken(invitation.token);
      setEmail('');
      toast.success('Invitation created.');
    } catch (cause) {
      setError(messageFor(cause));
    }
  }

  async function onCopy() {
    if (inviteLink === null) return;
    try {
      await navigator.clipboard.writeText(inviteLink);
      setCopied(true);
    } catch {
      // Clipboard may be unavailable; the link stays selectable in the field.
    }
  }

  async function onRevoke(invitationId: string) {
    setListError(null);
    try {
      await revokeInvite.mutateAsync(invitationId);
      toast.success('Invitation revoked.');
    } catch (cause) {
      setListError(messageFor(cause));
    }
  }

  async function onChangeRole(userId: string, nextRole: MemberRole) {
    setMemberError(null);
    try {
      await changeRole.mutateAsync({ userId, role: nextRole });
      toast.success('Role updated.');
    } catch (cause) {
      setMemberError(messageFor(cause));
    }
  }

  async function onRemoveMember(userId: string) {
    setMemberError(null);
    try {
      await removeMember.mutateAsync(userId);
      toast.success('Member removed.');
    } catch (cause) {
      setMemberError(messageFor(cause));
    }
  }

  const pending = invitations.filter((i) => i.status === 'pending');
  const managing = changeRole.isPending || removeMember.isPending;

  return (
    <div style={styles.page}>
      <h1 style={styles.h1}>Members</h1>

      <section style={styles.card} aria-label="Member roster">
        <h2 style={styles.h2}>People</h2>
        {orgId === '' ? (
          <p style={styles.muted}>No organisation selected.</p>
        ) : membersLoading ? (
          <p style={styles.muted} role="status">
            Loading…
          </p>
        ) : members.length === 0 ? (
          <p style={styles.muted}>No members yet.</p>
        ) : (
          <>
            {memberError !== null && (
              <p role="alert" style={styles.error}>
                {memberError}
              </p>
            )}
            <ul style={styles.list} aria-label="Members">
              {members.map((m) => {
                const canManage = isOwner && m.role !== 'owner';
                return (
                  <li key={m.userId} style={styles.item}>
                    <div style={styles.itemMain}>
                      <span style={styles.itemEmail}>{m.email ?? m.userId}</span>
                      <span style={styles.itemMeta}>
                        {m.role}
                        {formatDate(m.since) !== '' ? ` · since ${formatDate(m.since)}` : ''}
                      </span>
                    </div>
                    {canManage ? (
                      <div style={styles.memberActions}>
                        <select
                          aria-label={`Role for ${m.email ?? m.userId}`}
                          value={m.role === 'admin' ? 'admin' : 'member'}
                          onChange={(e) => onChangeRole(m.userId, e.target.value as MemberRole)}
                          disabled={managing}
                          style={styles.select}
                        >
                          <option value="member">Member</option>
                          <option value="admin">Admin</option>
                        </select>
                        <button
                          type="button"
                          onClick={() => onRemoveMember(m.userId)}
                          disabled={managing}
                          style={styles.secondary}
                        >
                          Remove
                        </button>
                      </div>
                    ) : (
                      <span style={styles.badge}>{m.role}</span>
                    )}
                  </li>
                );
              })}
            </ul>
          </>
        )}
      </section>

      <section style={styles.card} aria-label="Invite a member">
        <h2 style={styles.h2}>Invite a member</h2>
        {orgId === '' ? (
          <p style={styles.muted}>No organisation selected.</p>
        ) : meLoading || orgLoading ? (
          <p style={styles.muted} role="status">
            Loading…
          </p>
        ) : !isOwner ? (
          <p style={styles.note}>Only the organisation owner can invite members.</p>
        ) : (
          <>
            <form style={styles.row} onSubmit={onInvite}>
              <div style={{ ...styles.field, flex: 1, minWidth: 200 }}>
                <label htmlFor={emailId} style={styles.label}>
                  Email
                </label>
                <input
                  id={emailId}
                  type="email"
                  required
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    setCreatedToken(null);
                  }}
                  placeholder="teammate@example.com"
                  style={styles.input}
                />
              </div>
              <div style={styles.field}>
                <label htmlFor={roleId} style={styles.label}>
                  Role
                </label>
                <select
                  id={roleId}
                  value={role}
                  onChange={(e) => {
                    setRole(e.target.value);
                    setCreatedToken(null);
                  }}
                  style={styles.select}
                >
                  <option value="member">Member</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
              <button
                type="submit"
                disabled={createInvite.isPending || email.trim() === ''}
                aria-busy={createInvite.isPending}
                style={
                  createInvite.isPending ? { ...styles.primary, ...styles.busy } : styles.primary
                }
              >
                {createInvite.isPending ? 'Inviting…' : 'Send invite'}
              </button>
            </form>
            {error !== null && (
              <p role="alert" style={styles.error}>
                {error}
              </p>
            )}
            {inviteLink !== null && (
              <div style={styles.invitePanel} role="status">
                <p style={styles.muted}>
                  Invitation created. Share this link with your teammate — it is shown only once.
                </p>
                <div style={styles.linkRow}>
                  <input
                    readOnly
                    value={inviteLink}
                    aria-label="Invite link"
                    style={styles.linkInput}
                  />
                  <button type="button" onClick={onCopy} style={styles.secondary}>
                    {copied ? 'Copied' : 'Copy link'}
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </section>

      <section style={styles.card} aria-label="Pending invitations">
        <h2 style={styles.h2}>Pending invitations</h2>
        {orgId === '' ? (
          <p style={styles.muted}>No organisation selected.</p>
        ) : meLoading || orgLoading ? (
          <p style={styles.muted} role="status">
            Loading…
          </p>
        ) : !isOwner ? (
          <p style={styles.note}>Only the organisation owner can manage invitations.</p>
        ) : invLoading ? (
          <p style={styles.muted} role="status">
            Loading…
          </p>
        ) : (
          <>
            {listError !== null && (
              <p role="alert" style={styles.error}>
                {listError}
              </p>
            )}
            {pending.length === 0 ? (
              <p style={styles.muted}>No pending invitations.</p>
            ) : (
              <ul style={styles.list} aria-label="Pending invitations">
                {pending.map((invite) => (
                  <li key={invite.id} style={styles.item}>
                    <div style={styles.itemMain}>
                      <span style={styles.itemEmail}>{invite.email}</span>
                      <span style={styles.itemMeta}>
                        {invite.role} · {invite.status}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => onRevoke(invite.id)}
                      disabled={revokeInvite.isPending}
                      style={styles.secondary}
                    >
                      Revoke
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </>
        )}
      </section>
    </div>
  );
}
