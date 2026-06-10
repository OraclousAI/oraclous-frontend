// Members — the org roster + invitations. Owner sees + manages members (change role, remove), invites
// by email, and revokes pending invitations. On invite the raw token is shown once as a share link.
// Styled per the handoff members.html (named rows + table treatment + card chrome).
import { useId, useState, type FormEvent } from 'react';
import { ApiClientError, type MemberRole } from '@oraclous/api-client';
import { useDash } from '../context/dash.js';
import { useChangeMemberRole, useMe, useMembers, useOrg, useRemoveMember } from '../lib/session.js';
import { useCreateInvitation, useInvitations, useRevokeInvitation } from '../lib/invitations.js';
import { useToast } from '../lib/toast.jsx';
import { SkeletonList } from '../components/ui/Skeleton.js';
import { IconUsers } from '../icons/index.js';
import './members.css';

function formatDate(iso: string): string {
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? '' : d.toLocaleDateString();
}

function messageFor(cause: unknown): string {
  if (ApiClientError.is(cause)) return cause.message;
  return 'Something went wrong. Please try again.';
}

function initialsOf(s: string): string {
  const at = s.indexOf('@');
  const base = at > 0 ? s.slice(0, at) : s;
  return base
    .split(/[._\s-]+/)
    .filter(Boolean)
    .map((w) => w.charAt(0))
    .join('')
    .slice(0, 2)
    .toUpperCase();
}

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
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-4)' }}>
      <header className="page-head" style={{ marginBottom: 0 }}>
        <div>
          <span className="eyebrow">Organisation</span>
          <h1>Members</h1>
          <p className="sub">The roster and its invitations — roles are owner, admin, member.</p>
        </div>
      </header>

      <section className="card" aria-label="Member roster">
        <div className="card-head">
          <div className="h">
            <h2>People</h2>
            <span className="sub">
              {members.length} member{members.length === 1 ? '' : 's'}
            </span>
          </div>
        </div>
        <div className="card-body no-pad">
          {orgId === '' ? (
            <div className="empty">
              <span className="t">No organisation selected</span>
            </div>
          ) : membersLoading ? (
            <div style={{ padding: 'var(--sp-4)' }}>
              <SkeletonList rows={3} />
            </div>
          ) : members.length === 0 ? (
            <div className="empty">
              <span className="empty-icon">
                <IconUsers size={24} />
              </span>
              <span className="t">No members yet</span>
            </div>
          ) : (
            <>
              {memberError !== null && (
                <p
                  role="alert"
                  className="callout"
                  data-tone="error"
                  style={{ margin: 'var(--sp-3)' }}
                >
                  {memberError}
                </p>
              )}
              <div className="table members-table" style={{ border: 'none', borderRadius: 0 }}>
                <div className="table-head" aria-hidden="true">
                  <span>Member</span>
                  <span>Role</span>
                  <span style={{ textAlign: 'right' }}>Manage</span>
                </div>
                {members.map((m) => {
                  const canManage = isOwner && m.role !== 'owner';
                  const label = m.email ?? m.userId;
                  return (
                    <div key={m.userId} className="table-row">
                      <span className="named">
                        <span className="avatar-sm" aria-hidden="true">
                          {initialsOf(label)}
                        </span>
                        <span style={{ display: 'grid', minWidth: 0 }}>
                          <span style={{ overflowWrap: 'break-word' }}>{label}</span>
                          <span className="em">
                            {formatDate(m.since) !== '' ? `since ${formatDate(m.since)}` : ''}
                          </span>
                        </span>
                      </span>
                      <span className="chip chip-sm" style={{ textTransform: 'capitalize' }}>
                        {m.role}
                      </span>
                      <span
                        style={{
                          display: 'flex',
                          gap: 'var(--sp-2)',
                          justifyContent: 'flex-end',
                          alignItems: 'center',
                        }}
                      >
                        {canManage ? (
                          <>
                            <select
                              aria-label={`Role for ${label}`}
                              value={m.role === 'admin' ? 'admin' : 'member'}
                              onChange={(e) => onChangeRole(m.userId, e.target.value as MemberRole)}
                              disabled={managing}
                              style={{
                                padding: '6px 9px',
                                fontSize: 13,
                                fontFamily: 'var(--font-sans)',
                                color: 'var(--ink)',
                                background: 'var(--paper)',
                                border: '1px solid var(--rule)',
                                borderRadius: 'var(--r-3)',
                              }}
                            >
                              <option value="member">Member</option>
                              <option value="admin">Admin</option>
                            </select>
                            <button
                              type="button"
                              className="btn"
                              data-variant="secondary"
                              data-size="sm"
                              onClick={() => onRemoveMember(m.userId)}
                              disabled={managing}
                            >
                              Remove
                            </button>
                          </>
                        ) : (
                          <span className="mute mono">{m.role}</span>
                        )}
                      </span>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </div>
      </section>

      <section className="card" aria-label="Invite a member">
        <div className="card-head">
          <div className="h">
            <h2>Invite a member</h2>
            <span className="sub">The invite link is shown once — share it with your teammate</span>
          </div>
        </div>
        <div
          className="card-body"
          style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-3)' }}
        >
          {orgId === '' ? (
            <p className="sub" style={{ margin: 0, color: 'var(--mute)', fontSize: 13.5 }}>
              No organisation selected.
            </p>
          ) : meLoading || orgLoading ? (
            <SkeletonList rows={1} />
          ) : !isOwner ? (
            <p className="sub" style={{ margin: 0, color: 'var(--mute)', fontSize: 13.5 }}>
              Only the organisation owner can invite members.
            </p>
          ) : (
            <>
              <form className="control-row" onSubmit={onInvite}>
                <div className="field grow">
                  <label htmlFor={emailId}>Email</label>
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
                  />
                </div>
                <div className="field">
                  <label htmlFor={roleId}>Role</label>
                  <select
                    id={roleId}
                    value={role}
                    onChange={(e) => {
                      setRole(e.target.value);
                      setCreatedToken(null);
                    }}
                  >
                    <option value="member">Member</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>
                <button
                  type="submit"
                  className="btn"
                  data-variant="primary"
                  disabled={createInvite.isPending || email.trim() === ''}
                  aria-busy={createInvite.isPending}
                >
                  {createInvite.isPending ? 'Inviting…' : 'Send invite'}
                </button>
              </form>
              {error !== null && (
                <p role="alert" className="callout" data-tone="error" style={{ margin: 0 }}>
                  {error}
                </p>
              )}
              {inviteLink !== null && (
                <div className="invite-link" role="status">
                  <p style={{ margin: 0, fontSize: 13.5 }}>
                    Invitation created. Share this link with your teammate — it is shown only once.
                  </p>
                  <div className="row">
                    <input readOnly value={inviteLink} aria-label="Invite link" />
                    <button
                      type="button"
                      className="btn"
                      data-variant="secondary"
                      data-size="sm"
                      onClick={onCopy}
                    >
                      {copied ? 'Copied' : 'Copy link'}
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </section>

      <section className="card" aria-label="Pending invitations">
        <div className="card-head">
          <div className="h">
            <h2>Pending invitations</h2>
            <span className="sub">Revocable until accepted</span>
          </div>
        </div>
        <div className="card-body no-pad">
          {orgId === '' ? (
            <div className="empty">
              <span className="t">No organisation selected</span>
            </div>
          ) : meLoading || orgLoading ? (
            <div style={{ padding: 'var(--sp-4)' }}>
              <SkeletonList rows={1} />
            </div>
          ) : !isOwner ? (
            <div className="empty">
              <span className="s">Only the organisation owner can manage invitations.</span>
            </div>
          ) : invLoading ? (
            <div style={{ padding: 'var(--sp-4)' }}>
              <SkeletonList rows={2} />
            </div>
          ) : (
            <>
              {listError !== null && (
                <p
                  role="alert"
                  className="callout"
                  data-tone="error"
                  style={{ margin: 'var(--sp-3)' }}
                >
                  {listError}
                </p>
              )}
              {pending.length === 0 ? (
                <div className="empty">
                  <span className="t">No pending invitations</span>
                </div>
              ) : (
                <ul className="row-list" aria-label="Pending invitations">
                  {pending.map((invite) => (
                    <li key={invite.id}>
                      <div className="top">
                        <span className="named">
                          <span className="avatar-sm" aria-hidden="true">
                            {initialsOf(invite.email)}
                          </span>
                          <span style={{ display: 'grid', minWidth: 0 }}>
                            <span className="nm" style={{ overflowWrap: 'break-word' }}>
                              {invite.email}
                            </span>
                            <span className="em" style={{ textTransform: 'capitalize' }}>
                              {invite.role} · {invite.status}
                            </span>
                          </span>
                        </span>
                        <button
                          type="button"
                          className="btn"
                          data-variant="secondary"
                          data-size="sm"
                          onClick={() => onRevoke(invite.id)}
                          disabled={revokeInvite.isPending}
                        >
                          Revoke
                        </button>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </>
          )}
        </div>
      </section>
    </div>
  );
}
