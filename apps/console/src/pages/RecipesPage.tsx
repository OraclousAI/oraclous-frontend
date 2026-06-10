// Recipes — the org's ingestion recipe library (GET /api/v1/recipes). A read-only browser: pick a
// recipe to inspect its full format-0.2 document. Recipes are the templates that turn a source
// (document, CSV, code, …) into graph nodes and edges. Styled per the handoff tile patterns.
import { useState } from 'react';
import { useRecipe, useRecipes } from '../lib/recipes.js';
import { SkeletonList } from '../components/ui/Skeleton.js';
import { IconSparkle } from '../icons/index.js';
import './catalog.css';

export default function RecipesPage() {
  const { recipes, isLoading, isError } = useRecipes();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const { recipe, isLoading: detailLoading, isError: detailError } = useRecipe(selectedId ?? '');

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-4)' }}>
      <header className="page-head" style={{ marginBottom: 0 }}>
        <div>
          <span className="eyebrow">Ingestion library</span>
          <h1>Recipes</h1>
          <p className="sub">
            Ingestion recipes — the templates that turn a source into graph nodes and relationships.
          </p>
        </div>
      </header>

      {isError ? (
        <p className="callout" data-tone="error" role="alert" style={{ margin: 0 }}>
          Could not load recipes.
        </p>
      ) : isLoading ? (
        <SkeletonList rows={4} />
      ) : recipes.length === 0 ? (
        <div className="card">
          <div className="empty">
            <span className="empty-icon">
              <IconSparkle size={24} />
            </span>
            <span className="t">No recipes in this organisation yet</span>
            <span className="s">Recipes appear here as the library is populated.</span>
          </div>
        </div>
      ) : (
        <ul className="cat-grid">
          {recipes.map((r) => {
            const isSel = r.id === selectedId;
            return (
              <li key={r.id}>
                <button
                  type="button"
                  className="cat-tile"
                  onClick={() => setSelectedId(isSel ? null : r.id)}
                  aria-expanded={isSel}
                >
                  <div className="top">
                    <span className="nm">{r.concern}</span>
                    <span className="chip chip-sm">{r.status}</span>
                  </div>
                  <p className="meta">
                    {r.sourceType} · v{r.version}
                  </p>
                </button>
              </li>
            );
          })}
        </ul>
      )}

      {selectedId !== null && (
        <section className="card" aria-label="Recipe detail">
          <div className="card-head">
            <div className="h">
              <h2>Recipe document</h2>
              <span className="sub">format 0.2 · read-only</span>
            </div>
            <button
              type="button"
              className="btn"
              data-variant="secondary"
              data-size="sm"
              onClick={() => setSelectedId(null)}
              aria-label="Close recipe detail"
            >
              Close
            </button>
          </div>
          <div className="card-body">
            {detailError ? (
              <p className="callout" data-tone="error" role="alert" style={{ margin: 0 }}>
                Could not load this recipe.
              </p>
            ) : detailLoading ? (
              <SkeletonList rows={2} />
            ) : (
              <pre className="cat-pre">{JSON.stringify(recipe, null, 2)}</pre>
            )}
          </div>
        </section>
      )}
    </div>
  );
}
