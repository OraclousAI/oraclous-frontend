import { useEffect, useRef, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useDash } from '../../context/dash.js';
import {
  IconChevUpDown,
  IconChevRight,
  IconCheck,
  IconPlus,
  IconSparkle,
  IconBell,
  IconSearch,
} from '../../icons/index.js';

const CRUMB_LABELS: Record<string, string> = {
  '/app': 'dashboard',
  '/app/workspaces': 'workspaces',
  '/app/agents': 'agents',
  '/app/tools': 'tools',
  '/app/members': 'members',
  '/app/billing': 'billing',
  '/app/settings': 'settings',
  '/app/my-space': 'second mind',
};

function RouteCrumb({ pathname }: { pathname: string }) {
  if (pathname.startsWith('/app/workspaces/')) {
    return (
      <span className="shell-topbar__crumb" aria-label="workspaces — detail">
        workspaces{' '}
        <IconChevRight
          size={11}
          aria-hidden="true"
          style={{ color: 'var(--rule)', verticalAlign: 'middle' }}
        />{' '}
        <strong>detail</strong>
      </span>
    );
  }
  if (pathname.startsWith('/app/agents/')) {
    return (
      <span className="shell-topbar__crumb" aria-label="agents — detail">
        agents{' '}
        <IconChevRight
          size={11}
          aria-hidden="true"
          style={{ color: 'var(--rule)', verticalAlign: 'middle' }}
        />{' '}
        <strong>detail</strong>
      </span>
    );
  }
  const label = CRUMB_LABELS[pathname] ?? '';
  return (
    <span className="shell-topbar__crumb" aria-label={`Current page: ${label}`}>
      <strong>{label}</strong>
    </span>
  );
}

export function TopBar() {
  const { tenant, user, orgs, currentOrg, setCurrentOrg, canCreateOrg } = useDash();
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const [tenantOpen, setTenantOpen] = useState(false);
  const [userOpen, setUserOpen] = useState(false);

  const tenantRef = useRef<HTMLDivElement>(null);
  const userRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (tenantRef.current != null && !tenantRef.current.contains(e.target as Node)) {
        setTenantOpen(false);
      }
      if (userRef.current != null && !userRef.current.contains(e.target as Node)) {
        setUserOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const isCompany = tenant.type === 'company';
  const tenantInitials = tenant.name.slice(0, 2).toUpperCase();
  const userInitials = user.name
    .split(' ')
    .map((w) => w[0] ?? '')
    .slice(0, 2)
    .join('')
    .toUpperCase();

  return (
    <header className="shell-topbar">
      {/* Tenant switcher + breadcrumb */}
      <div className="shell-topbar__left">
        <div className="shell-topbar__tenant-wrap" ref={tenantRef}>
          <button
            type="button"
            className="shell-topbar__tenant-btn"
            onClick={() => setTenantOpen((v) => !v)}
            aria-expanded={tenantOpen}
            aria-haspopup="menu"
            aria-label={`${tenant.name} — switch organization`}
          >
            {isCompany ? (
              <span className="shell-topbar__org-avatar" aria-hidden="true">
                {tenantInitials}
              </span>
            ) : (
              <span
                className="shell-user-avatar"
                aria-hidden="true"
                style={{ width: 18, height: 18, fontSize: 9 }}
              >
                {userInitials}
              </span>
            )}
            <span className="shell-topbar__tenant-name">{tenant.name}</span>
            <span className="shell-topbar__plan-badge" aria-label={`Plan: ${tenant.plan}`}>
              {tenant.plan}
            </span>
            <IconChevUpDown size={12} aria-hidden="true" style={{ color: 'var(--mute)' }} />
          </button>

          {tenantOpen && (
            <div
              className="shell-dropdown"
              role="menu"
              aria-label="Organizations"
              style={{ left: 0, minWidth: 300 }}
            >
              <div className="shell-dropdown__eyebrow" aria-hidden="true">
                Organizations
              </div>
              {orgs.length === 0 && (
                <p style={{ fontSize: 12.5, color: 'var(--mute)', padding: '6px 8px 10px' }}>
                  No organizations yet.
                </p>
              )}
              <div role="group" aria-label="Organizations">
              {orgs.map((o) => {
                const isActive = o.id === currentOrg?.id;
                return (
                  <button
                    key={o.id}
                    type="button"
                    role="menuitemradio"
                    className="shell-dropdown__item"
                    onClick={() => {
                      setCurrentOrg(o.id);
                      setTenantOpen(false);
                    }}
                    aria-checked={isActive}
                  >
                    <span className="shell-org-item" aria-hidden="true">
                      {o.name.slice(0, 2).toUpperCase()}
                    </span>
                    <span style={{ flex: 1, minWidth: 0 }}>
                      <span
                        style={{
                          display: 'block',
                          fontSize: 13,
                          fontWeight: 500,
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {o.name}
                      </span>
                      <span
                        style={{
                          display: 'block',
                          fontSize: 11.5,
                          color: 'var(--mute)',
                          textTransform: 'capitalize',
                          fontFamily: 'var(--font-mono)',
                        }}
                      >
                        {o.org_role ?? 'member'}
                      </span>
                    </span>
                    {isActive && (
                      <IconCheck
                        size={14}
                        aria-hidden="true"
                        style={{ color: 'var(--ink)', flexShrink: 0 }}
                      />
                    )}
                  </button>
                );
              })}
              </div>
              {canCreateOrg && (
                <>
                  <div className="shell-dropdown__divider" role="separator" />
                  <button
                    type="button"
                    role="menuitem"
                    className="shell-dropdown__item"
                    onClick={() => {
                      setTenantOpen(false);
                      navigate('/app/orgs/new');
                    }}
                  >
                    <IconPlus size={14} aria-hidden="true" />
                    Create organization
                  </button>
                </>
              )}
            </div>
          )}
        </div>

        <span className="shell-topbar__sep" aria-hidden="true">
          /
        </span>
        <RouteCrumb pathname={pathname} />
      </div>

      {/* Global search */}
      <div className="shell-topbar__search" role="search">
        <label htmlFor="shell-global-search" className="shell-visually-hidden">
          Search workspaces, agents, members
        </label>
        <div className="shell-search">
          <IconSearch size={13} aria-hidden="true" />
          <input
            id="shell-global-search"
            type="search"
            placeholder="Search workspaces, agents, members…"
            autoComplete="off"
          />
          <kbd className="shell-search__kbd" aria-label="Keyboard shortcut: Command K">
            ⌘K
          </kbd>
        </div>
      </div>

      {/* Right cluster */}
      <div className="shell-topbar__right">
        <button
          type="button"
          className="shell-icon-btn"
          style={{ width: 'auto', padding: '0 8px', gap: 6, fontSize: 13 }}
          aria-label="Ask AI assistant"
        >
          <IconSparkle size={14} aria-hidden="true" />
          <span>Ask</span>
        </button>

        <button type="button" className="shell-icon-btn" aria-label="Notifications">
          <IconBell size={15} aria-hidden="true" />
        </button>

        <div className="shell-topbar__vr" aria-hidden="true" />

        <div className="shell-topbar__tenant-wrap" ref={userRef}>
          <button
            type="button"
            className="shell-icon-btn"
            onClick={() => setUserOpen((v) => !v)}
            aria-expanded={userOpen}
            aria-haspopup="menu"
            aria-label={`User menu — ${user.name}`}
            style={{ padding: 2 }}
          >
            <span
              className="shell-user-avatar"
              aria-hidden="true"
              style={{ width: 24, height: 24, fontSize: 10 }}
            >
              {userInitials}
            </span>
          </button>

          {userOpen && (
            <div
              className="shell-dropdown"
              role="menu"
              aria-label="User menu"
              style={{ right: 0, minWidth: 220 }}
            >
              <div
                style={{
                  padding: '8px 8px 12px',
                  borderBottom: '1px solid var(--rule)',
                  marginBottom: 4,
                }}
              >
                <div style={{ fontSize: 13, fontWeight: 500 }}>{user.name}</div>
                {user.email !== '' && (
                  <div
                    style={{
                      fontSize: 12,
                      color: 'var(--mute)',
                      fontFamily: 'var(--font-mono)',
                    }}
                  >
                    {user.email}
                  </div>
                )}
                <div
                  style={{
                    marginTop: 4,
                    display: 'inline-block',
                    fontSize: 10,
                    fontFamily: 'var(--font-mono)',
                    fontWeight: 600,
                    letterSpacing: '0.06em',
                    textTransform: 'uppercase',
                    color: 'var(--mute)',
                  }}
                >
                  {user.role}
                </div>
              </div>

              {(
                [
                  { label: 'Account settings', route: '/app/settings' },
                  { label: 'Preferences', route: null },
                  { label: 'Keyboard shortcuts', route: null },
                  { label: 'Help & docs', route: null },
                ] as { label: string; route: string | null }[]
              ).map((it) => (
                <button
                  key={it.label}
                  type="button"
                  role="menuitem"
                  className={`shell-dropdown__item${it.route == null ? ' shell-dropdown__item--disabled' : ''}`}
                  onClick={() => {
                    if (it.route != null) {
                      navigate(it.route);
                      setUserOpen(false);
                    }
                  }}
                  aria-disabled={it.route == null || undefined}
                >
                  {it.label}
                </button>
              ))}
              <div className="shell-dropdown__divider" role="separator" />
              <button
                type="button"
                role="menuitem"
                className="shell-dropdown__item"
                onClick={() => {
                  window.location.href = '/login';
                }}
              >
                Sign out
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
