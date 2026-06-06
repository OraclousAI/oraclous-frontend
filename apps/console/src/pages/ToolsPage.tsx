// Tools — the organisation's visible tool catalogue (platform built-in connectors unioned with any
// org-registered tools), from GET /api/v1/tools.
import type { CSSProperties } from 'react';
import { useTools } from '../lib/tools.js';
import { SkeletonList } from '../components/ui/Skeleton.js';

// Only render a documentation link if it is an http(s) URL (org-registered tools could supply
// arbitrary values; never emit a javascript:/data: href).
function safeDocUrl(url: string | null): string | null {
  return url !== null && /^https?:\/\//i.test(url) ? url : null;
}

const styles = {
  page: { display: 'grid', gap: 20, maxWidth: 920 },
  header: { display: 'grid', gap: 4 },
  h1: { margin: 0, fontSize: 22, fontWeight: 600, color: 'var(--ink, #0b1220)' },
  sub: { margin: 0, fontSize: 13.5, color: 'var(--ink, #0b1220)' },
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
  grid: {
    listStyle: 'none',
    margin: 0,
    padding: 0,
    display: 'grid',
    gap: 12,
    gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
  },
  card: {
    display: 'grid',
    gap: 8,
    padding: 16,
    minWidth: 0,
    background: 'var(--paper, #f4f4f2)',
    border: '1px solid var(--rule, #d7d6d2)',
    borderRadius: 12,
  },
  cardTop: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  name: {
    fontSize: 15,
    fontWeight: 600,
    color: 'var(--ink, #0b1220)',
    minWidth: 0,
    overflowWrap: 'break-word',
  },
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
  desc: {
    margin: 0,
    fontSize: 13,
    lineHeight: 1.5,
    color: 'var(--ink, #0b1220)',
    overflowWrap: 'break-word',
  },
  docLink: { fontSize: 13, color: 'var(--ink, #0b1220)', width: 'fit-content' },
} satisfies Record<string, CSSProperties>;

export default function ToolsPage() {
  const { tools, isLoading, isError } = useTools();

  return (
    <div style={styles.page}>
      <header style={styles.header}>
        <h1 style={styles.h1}>Tools</h1>
        <p style={styles.sub}>Connectors and tools available to your organisation.</p>
      </header>

      {isLoading ? (
        <SkeletonList rows={4} />
      ) : isError ? (
        <p style={styles.error} role="alert">
          Could not load the tools catalogue.
        </p>
      ) : tools.length === 0 ? (
        <p style={styles.muted}>No tools available yet.</p>
      ) : (
        <ul style={styles.grid} aria-label="Tools catalogue">
          {tools.map((t) => {
            const doc = safeDocUrl(t.documentationUrl);
            return (
              <li key={t.id} style={styles.card}>
                <div style={styles.cardTop}>
                  <span style={styles.name}>{t.name}</span>
                  {t.category !== null && <span style={styles.badge}>{t.category}</span>}
                </div>
                {t.description !== null && <p style={styles.desc}>{t.description}</p>}
                {doc !== null && (
                  <a href={doc} target="_blank" rel="noopener noreferrer" style={styles.docLink}>
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
