import { useNavigate, useLocation } from 'react-router-dom';
import { useDash } from '../../context/dash.js';
import { NAV_BY_PERSONA, activeNavId } from '../../nav/index.js';
import { Logo } from '../../icons/index.js';

export function Sidebar() {
  const { persona, currentOrg, orgs } = useDash();
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const nav = NAV_BY_PERSONA[persona];
  const activeId = activeNavId(pathname);

  // Workspace shortcuts — show up to 6 org-level graphs when available.
  // Will be populated via api-client once organizationsApi is wired.
  const workspaces = orgs.slice(0, 6);

  return (
    <aside className="shell-sidebar" aria-label="Main navigation">
      {/* Brand lockup */}
      <div className="shell-sidebar__brand">
        <button
          type="button"
          className="shell-sidebar__brand-btn"
          onClick={() => navigate('/app')}
          aria-label="Go to dashboard"
        >
          <Logo size={18} />
          <span
            style={{
              fontWeight: 700,
              fontSize: 13,
              letterSpacing: '-0.01em',
              color: 'var(--ink)',
              fontFamily: 'var(--font-sans)',
            }}
          >
            Oraclous
          </span>
        </button>
      </div>

      {/* Primary navigation */}
      <nav className="shell-sidebar__nav" aria-label="Primary">
        {nav.map((it) => {
          if (it.divider) {
            return (
              <h3 key={it.id} className="shell-sidebar__section-label">
                {it.label}
              </h3>
            );
          }
          const Icon = it.icon;
          const isActive = it.id === activeId;
          return (
            <button
              key={it.id}
              type="button"
              className="shell-nav-item"
              onClick={() => it.route != null && navigate(it.route)}
              aria-current={isActive ? 'page' : undefined}
              aria-disabled={it.route == null || undefined}
            >
              {Icon != null && <Icon size={15} aria-hidden="true" />}
              <span style={{ flex: 1 }}>{it.label}</span>
              {it.id === 'agents' && persona === 'owner' && workspaces.length > 0 && (
                <span
                  className="shell-nav-item__badge"
                  aria-label={`${workspaces.length} workspaces`}
                >
                  {workspaces.length}
                </span>
              )}
            </button>
          );
        })}

        {/* Workspace shortcuts */}
        {currentOrg != null && workspaces.length > 0 && (
          <section aria-label="Workspaces">
            <h3 className="shell-sidebar__section-label">
              {persona === 'member' ? 'My access' : 'Workspaces'}
            </h3>
            {workspaces.map((org) => {
              const wsPath = `/app/workspaces/${org.id}`;
              const isActive = pathname === wsPath;
              return (
                <button
                  key={org.id}
                  type="button"
                  className="shell-ws-item"
                  onClick={() => navigate(wsPath)}
                  aria-current={isActive ? 'page' : undefined}
                >
                  <span className="shell-ws-item__dot" aria-hidden="true" />
                  <span className="shell-ws-item__name">{org.name}</span>
                </button>
              );
            })}
          </section>
        )}
      </nav>

      {/* Spend mini — billing not wired yet */}
      {persona !== 'member' && (
        <div className="shell-sidebar__spend" aria-label="Monthly spend">
          <div className="shell-sidebar__spend-label" aria-hidden="true">
            This month
          </div>
          <div className="shell-sidebar__spend-amount" aria-label="Monthly spend: not available">
            $—
          </div>
          <div className="shell-sidebar__spend-note">Billing coming soon</div>
        </div>
      )}
    </aside>
  );
}
