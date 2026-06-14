// Recipes — the org's ingestion recipe library (GET /api/v1/recipes). A read-only browser: pick a
// recipe to inspect its full format-0.2 document in a focus-trapped detail drawer. Recipes are the
// templates that turn a source (document, CSV, code, …) into graph nodes and edges. Styled per the
// handoff tile patterns.
import { useRef, useState } from 'react';
import { useRecipes } from '../lib/recipes.js';
import { SkeletonList } from '../components/ui/Skeleton.js';
import { RecipeDetailDrawer } from '../components/RecipeDetailDrawer.js';
import { IconSparkle } from '../icons/index.js';
import './catalog.css';

export default function RecipesPage() {
  const { recipes, isLoading, isError } = useRecipes();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  // The tile that opened the drawer — focus returns to it when the drawer closes.
  const tileTriggerRef = useRef<HTMLButtonElement | null>(null);

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
          {recipes.map((r) => (
            <li key={r.id}>
              <button
                type="button"
                className="cat-tile"
                aria-haspopup="dialog"
                onClick={(e) => {
                  tileTriggerRef.current = e.currentTarget;
                  setSelectedId(r.id);
                }}
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
          ))}
        </ul>
      )}

      {selectedId !== null && (
        <RecipeDetailDrawer
          recipeId={selectedId}
          triggerRef={tileTriggerRef}
          onClose={() => setSelectedId(null)}
        />
      )}
    </div>
  );
}
