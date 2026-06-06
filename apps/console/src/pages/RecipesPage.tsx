// Recipes — the org's ingestion recipe library (GET /api/v1/recipes). A read-only browser: pick a
// recipe to inspect its full format-0.2 document. Recipes are the templates that turn a source
// (document, CSV, code, …) into graph nodes and edges.
import { useState, type CSSProperties } from 'react';
import { useRecipe, useRecipes } from '../lib/recipes.js';
import { SkeletonList } from '../components/ui/Skeleton.js';

export default function RecipesPage() {
  const { recipes, isLoading, isError } = useRecipes();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const { recipe, isLoading: detailLoading, isError: detailError } = useRecipe(selectedId ?? '');

  return (
    <div style={styles.page}>
      <header style={styles.header}>
        <h1 style={styles.h1}>Recipes</h1>
        <p style={styles.sub}>
          Ingestion recipes — the templates that turn a source into graph nodes and relationships.
        </p>
      </header>

      {isError ? (
        <p style={styles.error} role="alert">
          Could not load recipes.
        </p>
      ) : isLoading ? (
        <SkeletonList rows={4} />
      ) : recipes.length === 0 ? (
        <p style={styles.muted}>No recipes in this organisation yet.</p>
      ) : (
        <ul style={styles.grid}>
          {recipes.map((r) => {
            const isSel = r.id === selectedId;
            return (
              <li key={r.id}>
                <button
                  type="button"
                  onClick={() => setSelectedId(isSel ? null : r.id)}
                  aria-expanded={isSel}
                  style={isSel ? { ...styles.card, ...styles.cardSel } : styles.card}
                >
                  <div style={styles.cardTop}>
                    <span style={styles.cardName}>{r.concern}</span>
                    <span style={styles.badge}>{r.status}</span>
                  </div>
                  <p style={styles.cardMeta}>
                    {r.sourceType} · v{r.version}
                  </p>
                </button>
              </li>
            );
          })}
        </ul>
      )}

      {selectedId !== null && (
        <section style={styles.detail} aria-label="Recipe detail">
          <div style={styles.detailHead}>
            <h2 style={styles.h2}>Recipe document</h2>
            <button
              type="button"
              onClick={() => setSelectedId(null)}
              style={styles.secondary}
              aria-label="Close recipe detail"
            >
              Close
            </button>
          </div>
          {detailError ? (
            <p style={styles.error} role="alert">
              Could not load this recipe.
            </p>
          ) : detailLoading ? (
            <SkeletonList rows={2} />
          ) : (
            <pre style={styles.pre}>{JSON.stringify(recipe, null, 2)}</pre>
          )}
        </section>
      )}
    </div>
  );
}

const styles = {
  page: { display: 'grid', gap: 18, maxWidth: 920 },
  header: { display: 'grid', gap: 4 },
  h1: { margin: 0, fontSize: 22, fontWeight: 600, color: 'var(--ink, #0b1220)' },
  sub: { margin: 0, fontSize: 13.5, color: 'var(--mute, #65686f)' },
  h2: { margin: 0, fontSize: 15, fontWeight: 600, color: 'var(--ink, #0b1220)' },
  muted: { margin: 0, fontSize: 13.5, color: 'var(--mute, #65686f)' },
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
    gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))',
  },
  card: {
    display: 'grid',
    gap: 6,
    width: '100%',
    textAlign: 'left',
    padding: 16,
    background: 'var(--paper, #f4f4f2)',
    border: '1px solid var(--rule, #d7d6d2)',
    borderRadius: 10,
    cursor: 'pointer',
  },
  cardSel: { borderColor: 'var(--ink, #0b1220)', boxShadow: 'inset 0 0 0 1px var(--ink, #0b1220)' },
  cardTop: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  cardName: { fontSize: 14.5, fontWeight: 600, color: 'var(--ink, #0b1220)' },
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
  },
  cardMeta: {
    margin: 0,
    fontSize: 12,
    color: 'var(--mute, #65686f)',
    fontFamily: 'var(--font-mono, monospace)',
  },
  detail: {
    display: 'grid',
    gap: 12,
    padding: 16,
    background: 'var(--paper, #f4f4f2)',
    border: '1px solid var(--rule, #d7d6d2)',
    borderRadius: 12,
  },
  detailHead: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  secondary: {
    padding: '7px 12px',
    fontSize: 13,
    fontWeight: 500,
    color: 'var(--ink, #0b1220)',
    background: 'transparent',
    border: '1px solid var(--rule, #d7d6d2)',
    borderRadius: 8,
    cursor: 'pointer',
  },
  pre: {
    margin: 0,
    padding: '12px 14px',
    fontSize: 12.5,
    fontFamily: 'var(--font-mono, monospace)',
    color: 'var(--ink, #0b1220)',
    background: '#ffffff',
    border: '1px solid var(--rule, #d7d6d2)',
    borderRadius: 8,
    overflowX: 'auto',
    whiteSpace: 'pre-wrap',
    overflowWrap: 'break-word',
    maxHeight: 460,
    overflowY: 'auto',
  },
} satisfies Record<string, CSSProperties>;
