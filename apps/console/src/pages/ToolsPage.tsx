// Tools — the organisation's visible tool catalogue (platform built-in connectors unioned with any
// org-registered tools), from GET /api/v1/tools. Styled per the handoff tile patterns.
import { useTools } from '../lib/tools.js';
import { SkeletonList } from '../components/ui/Skeleton.js';
import { IconPlug } from '../icons/index.js';
import './catalog.css';

// Only render a documentation link if it is an http(s) URL (org-registered tools could supply
// arbitrary values; never emit a javascript:/data: href).
function safeDocUrl(url: string | null): string | null {
  return url !== null && /^https?:\/\//i.test(url) ? url : null;
}

export default function ToolsPage() {
  const { tools, isLoading, isError } = useTools();

  return (
    <div>
      <header className="page-head">
        <div>
          <span className="eyebrow">Catalogue</span>
          <h1>Tools</h1>
          <p className="sub">Connectors and tools available to your organisation.</p>
        </div>
      </header>

      {isLoading ? (
        <SkeletonList rows={4} />
      ) : isError ? (
        <p className="callout" data-tone="error" role="alert" style={{ margin: 0 }}>
          Could not load the tools catalogue.
        </p>
      ) : tools.length === 0 ? (
        <div className="card">
          <div className="empty">
            <span className="empty-icon">
              <IconPlug size={24} />
            </span>
            <span className="t">No tools available yet</span>
            <span className="s">Platform connectors appear here as they come online.</span>
          </div>
        </div>
      ) : (
        <ul className="cat-grid" aria-label="Tools catalogue">
          {tools.map((t) => {
            const doc = safeDocUrl(t.documentationUrl);
            return (
              <li key={t.id} className="cat-tile" style={{ cursor: 'default' }}>
                <div className="top">
                  <span className="nm">{t.name}</span>
                  {t.category !== null && <span className="chip chip-sm">{t.category}</span>}
                </div>
                {t.description !== null && <p className="desc">{t.description}</p>}
                {doc !== null && (
                  <a href={doc} target="_blank" rel="noopener noreferrer" className="doc">
                    Documentation ↗
                  </a>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
