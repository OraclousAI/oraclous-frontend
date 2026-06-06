import { useNavigate, useLocation } from 'react-router-dom';
import { useDash } from '../../context/dash.js';
import { useGraphs } from '../../lib/graphs.js';
import { NAV_BY_PERSONA, activeNavId } from '../../nav/index.js';
import { Logo } from '../../icons/index.js';

export function Sidebar({ open = false, onNavigate }: { open?: boolean; onNavigate?: () => void }) {
  const { persona } = useDash();
  const { graphs } = useGraphs();
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const nav = NAV_BY_PERSONA[persona];
  const activeId = activeNavId(pathname);

  // Navigate then let the shell close the mobile drawer.
  const go = (route: string) => {
    navigate(route);
    onNavigate?.();
  };

  // Workspace shortcuts — up to 6 of the session's knowledge graphs. These are token-scoped: the
  // org switcher is cosmetic until token re-exchange lands (multi-org re-scoping follow-up), so for a
  // multi-org user they track the token's org, not a switched selection. Correct for the common
  // single-org case; a strict improvement over the prior (dead org-id) links.
  const workspaces = graphs.slice(0, 6);

  return (
    <aside
      className={open ? 'shell-sidebar shell-sidebar--open' : 'shell-sidebar'}
      aria-label="Main navigation"
    >
      {/* Brand lockup */}
      <div className="shell-sidebar__brand">
        <button
          type="button"
          className="shell-sidebar__brand-btn"
          onClick={() => go('/app')}
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
              onClick={() => {
                if (it.route != null) go(it.route);
              }}
              aria-current={isActive ? 'page' : undefined}
              aria-disabled={it.route == null || undefined}
            >
              {Icon != null && <Icon size={15} aria-hidden="true" />}
              <span style={{ flex: 1 }}>{it.label}</span>
            </button>
          );
        })}

        {/* Workspace shortcuts — the current org's knowledge graphs */}
        {workspaces.length > 0 && (
          <section aria-label="Workspaces">
            <h3 className="shell-sidebar__section-label">Workspaces</h3>
            {workspaces.map((graph) => {
              const wsPath = `/app/workspaces/${graph.id}`;
              const isActive = pathname === wsPath;
              return (
                <button
                  key={graph.id}
                  type="button"
                  className="shell-ws-item"
                  onClick={() => go(wsPath)}
                  aria-current={isActive ? 'page' : undefined}
                >
                  <span className="shell-ws-item__dot" aria-hidden="true" />
                  <span className="shell-ws-item__name">{graph.name}</span>
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
