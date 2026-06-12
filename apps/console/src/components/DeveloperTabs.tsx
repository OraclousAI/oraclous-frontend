// Sub-navigation for the Developer section (integration keys, published agents, and — in the next
// slice — webhooks). Buttons that navigate, matching the sidebar idiom; the active tab is derived
// from the current path and marked with aria-current for assistive tech. Styled by the `.tabs`
// rules in styles/page.css.
import { useLocation, useNavigate } from 'react-router-dom';

interface DeveloperTab {
  readonly id: string;
  readonly label: string;
  readonly route: string;
}

const TABS: readonly DeveloperTab[] = [
  { id: 'keys', label: 'Integration keys', route: '/app/developer/keys' },
  { id: 'agents', label: 'Published agents', route: '/app/developer/agents' },
];

export function DeveloperTabs({ active }: { active: string }) {
  const navigate = useNavigate();
  const location = useLocation();

  return (
    <nav className="tabs" aria-label="Developer sections">
      {TABS.map((t) => {
        const isActive = t.id === active || location.pathname.startsWith(t.route);
        return (
          <button
            key={t.id}
            type="button"
            onClick={() => navigate(t.route)}
            aria-current={isActive ? 'page' : undefined}
            {...(isActive ? { 'data-active': '' } : {})}
          >
            {t.label}
          </button>
        );
      })}
    </nav>
  );
}
