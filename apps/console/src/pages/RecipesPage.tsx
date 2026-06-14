// Recipes — the org's ingestion recipe library (GET /api/v1/recipes). A read-only browser: pick a
// recipe to inspect its full format-0.2 document in a focus-trapped detail drawer, or "Author a
// recipe" to start an unsaved draft from a built-in template. Recipes are the templates that turn a
// source (document, CSV, code, …) into graph nodes and edges. Styled per the handoff tile patterns.
import { useRef, useState } from 'react';
import type { RecipeDocument } from '@oraclous/api-client';
import { useRecipes } from '../lib/recipes.js';
import { SkeletonList } from '../components/ui/Skeleton.js';
import { RecipeDetailDrawer } from '../components/RecipeDetailDrawer.js';
import { RecipeTemplatePicker } from '../components/RecipeTemplatePicker.js';
import { IconPlus, IconSparkle } from '../icons/index.js';
import './catalog.css';

export default function RecipesPage() {
  const { recipes, isLoading, isError } = useRecipes();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  // The tile that opened the saved-recipe drawer — focus returns to it on close.
  const tileTriggerRef = useRef<HTMLButtonElement | null>(null);
  // "Author a recipe": the template picker, the seeded unsaved draft it produces, and the button
  // focus returns to when either closes.
  const [pickerOpen, setPickerOpen] = useState(false);
  const [draft, setDraft] = useState<RecipeDocument | null>(null);
  const authorTriggerRef = useRef<HTMLButtonElement | null>(null);

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
        <div className="page-head-actions">
          <button
            type="button"
            className="btn"
            data-variant="primary"
            ref={authorTriggerRef}
            aria-haspopup="dialog"
            onClick={() => setPickerOpen(true)}
          >
            <IconPlus size={16} />
            Author a recipe
          </button>
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
            <span className="s">
              Author one from a template, or wait for the library to populate.
            </span>
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

      {pickerOpen && (
        <RecipeTemplatePicker
          triggerRef={authorTriggerRef}
          onPick={(recipe) => {
            setPickerOpen(false);
            setDraft(recipe);
          }}
          onClose={() => setPickerOpen(false)}
        />
      )}

      {draft !== null && (
        <RecipeDetailDrawer
          draft={draft}
          triggerRef={authorTriggerRef}
          onClose={() => setDraft(null)}
        />
      )}
    </div>
  );
}
