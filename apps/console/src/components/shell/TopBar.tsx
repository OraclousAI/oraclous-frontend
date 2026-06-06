import { useEffect, useRef, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useDash } from '../../context/dash.js';
import { useLogout, useSwitchOrg } from '../../lib/session.js';
import { useToast } from '../../lib/toast.jsx';
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

function getFocusableMenuItems(menu: HTMLElement | null): HTMLElement[] {
  if (menu == null) return [];
  return Array.from(
    menu.querySelectorAll<HTMLElement>(
      '[role="menuitem"]:not([aria-disabled="true"]), [role="menuitemradio"]'
    )
  );
}

function handleMenuKeyDown(
  e: React.KeyboardEvent,
  menuEl: HTMLElement | null,
  triggerEl: HTMLElement | null,
  close: () => void
): void {
  if (e.key === 'Escape') {
    e.preventDefault();
    close();
    triggerEl?.focus();
    return;
  }
  if (e.key !== 'ArrowDown' && e.key !== 'ArrowUp') return;
  e.preventDefault();
  const items = getFocusableMenuItems(menuEl);
  if (items.length === 0) return;
  const idx = items.indexOf(document.activeElement as HTMLElement);
  const next =
    e.key === 'ArrowDown'
      ? idx === -1
        ? 0
        : (idx + 1) % items.length
      : idx === -1
        ? items.length - 1
        : (idx - 1 + items.length) % items.length;
  items[next]?.focus();
}

export function TopBar({ onMenuClick, menuOpen }: { onMenuClick: () => void; menuOpen: boolean }) {
  const { tenant, user, userId, orgs, currentOrg, setCurrentOrg, canCreateOrg } = useDash();
  const navigate = useNavigate();
  const logout = useLogout();
  const switchOrg = useSwitchOrg();
  const toast = useToast();
  const { pathname } = useLocation();
  const [tenantOpen, setTenantOpen] = useState(false);
  const [userOpen, setUserOpen] = useState(false);

  const tenantRef = useRef<HTMLDivElement>(null);
  const userRef = useRef<HTMLDivElement>(null);
  const tenantBtnRef = useRef<HTMLButtonElement>(null);
  const userBtnRef = useRef<HTMLButtonElement>(null);
  const tenantMenuRef = useRef<HTMLDivElement>(null);
  const userMenuRef = useRef<HTMLDivElement>(null);

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
        <button
          type="button"
          className="shell-menu-btn"
          onClick={() => {
            // Closing the topbar menus first avoids a dropdown lingering above the open drawer.
            setTenantOpen(false);
            setUserOpen(false);
            onMenuClick();
          }}
          aria-label={menuOpen ? 'Close navigation menu' : 'Open navigation menu'}
          aria-expanded={menuOpen}
        >
          <span aria-hidden="true">☰</span>
        </button>
        <div className="shell-topbar__tenant-wrap" ref={tenantRef}>
          <button
            ref={tenantBtnRef}
            type="button"
            className="shell-topbar__tenant-btn"
            onClick={() => {
              if (!tenantOpen) switchOrg.reset(); // clear a prior switch error when reopening
              setTenantOpen((v) => !v);
            }}
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
              ref={tenantMenuRef}
              className="shell-dropdown"
              role="menu"
              aria-label="Organizations"
              style={{ left: 0, minWidth: 300 }}
              onKeyDown={(e) =>
                handleMenuKeyDown(e, tenantMenuRef.current, tenantBtnRef.current, () =>
                  setTenantOpen(false)
                )
              }
            >
              <div className="shell-dropdown__eyebrow" aria-hidden="true">
                Organizations
              </div>
              {orgs.length === 0 && (
                <p style={{ fontSize: 12.5, color: 'var(--mute)', padding: '6px 8px 10px' }}>
                  No organizations yet.
                </p>
              )}
              {switchOrg.isError && (
                <p
                  role="alert"
                  style={{
                    fontSize: 12.5,
                    color: 'var(--ink, #0b1220)',
                    background: 'var(--error-bg, #fbeae8)',
                    border: '1px solid var(--error, #c8412c)',
                    borderRadius: 6,
                    padding: '6px 8px',
                    margin: '0 0 8px',
                  }}
                >
                  Couldn&rsquo;t switch organisation. Please try again.
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
                        if (isActive) {
                          setTenantOpen(false);
                          return;
                        }
                        // Re-scope the session to the selected org (token swap + cache refetch);
                        // close + reflect the selection only once the new token is in place. On
                        // failure the menu stays open and the error above is shown.
                        switchOrg.mutate(o.id, {
                          onSuccess: () => {
                            setCurrentOrg(o.id);
                            setTenantOpen(false);
                            toast.success(`Switched to ${o.name}.`);
                          },
                        });
                      }}
                      disabled={switchOrg.isPending}
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
                          {o.ownerUserId === userId ? 'owner' : 'member'}
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
            ref={userBtnRef}
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
              ref={userMenuRef}
              className="shell-dropdown"
              role="menu"
              aria-label="User menu"
              style={{ right: 0, minWidth: 220 }}
              onKeyDown={(e) =>
                handleMenuKeyDown(e, userMenuRef.current, userBtnRef.current, () =>
                  setUserOpen(false)
                )
              }
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
                  setUserOpen(false);
                  logout();
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
