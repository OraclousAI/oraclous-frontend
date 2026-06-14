// Recipe template picker (Recipes — increment 2). A focus-trapped drawer opened by "Author a
// recipe" that lists the built-in templates as cards. Picking one hands its recipe document back to
// the page, which opens it as an unsaved draft in the detail drawer. Read-only here — editing,
// dry-run, save, and run are later increments. Focus trap / Escape / scroll-lock / focus-restore
// come from useDrawerA11y.
import { useId, useRef, type RefObject } from 'react';
import type { RecipeDocument } from '@oraclous/api-client';
import { useRecipeTemplates } from '../lib/recipes.js';
import { SkeletonList } from './ui/Skeleton.js';
import { useDrawerA11y } from './shell/useDrawerA11y.js';
import { IconX } from '../icons/index.js';

export function RecipeTemplatePicker({
  triggerRef,
  onPick,
  onClose,
}: {
  // The "Author a recipe" button — focus returns to it on close.
  triggerRef: RefObject<HTMLButtonElement>;
  onPick: (recipe: RecipeDocument) => void;
  onClose: () => void;
}) {
  const panelRef = useRef<HTMLDivElement>(null);
  const titleId = useId();
  useDrawerA11y({ open: true, drawerRef: panelRef, triggerRef, onClose });

  const { templates, isLoading, isError } = useRecipeTemplates();

  return (
    <>
      <button
        type="button"
        className="tool-drawer__backdrop"
        aria-label="Close template picker"
        onClick={onClose}
        tabIndex={-1}
      />
      <div
        ref={panelRef}
        className="tool-drawer"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
      >
        <div className="tool-drawer__head">
          <div className="tool-drawer__title">
            <h2 id={titleId}>Author a recipe</h2>
          </div>
          <button type="button" className="tool-drawer__close" aria-label="Close" onClick={onClose}>
            <IconX size={18} />
          </button>
        </div>

        <div className="tool-drawer__body">
          <p className="t-caption" style={{ color: 'var(--mute)', margin: 0 }}>
            Start from a built-in template — it opens as an unsaved draft you can review.
          </p>

          {isError ? (
            <p className="callout" data-tone="error" role="alert" style={{ margin: 0 }}>
              Could not load templates.
            </p>
          ) : isLoading ? (
            <SkeletonList rows={2} />
          ) : templates.length === 0 ? (
            <p className="t-caption" style={{ color: 'var(--mute)', margin: 0 }}>
              No templates available yet.
            </p>
          ) : (
            <ul className="cat-grid">
              {templates.map((t, i) => {
                const doc = t.recipe;
                const name = (doc.concern ?? t.concern ?? '').trim() || 'Recipe';
                const sourceType = doc.applies_to?.source_type;
                return (
                  <li key={doc.id ?? `${t.concern}-${i}`}>
                    <button
                      type="button"
                      className="cat-tile"
                      onClick={() => onPick(doc)}
                      aria-haspopup="dialog"
                    >
                      <div className="top">
                        <span className="nm">{name}</span>
                        {sourceType !== undefined && sourceType !== '' && (
                          <span className="chip chip-sm">{sourceType}</span>
                        )}
                      </div>
                      <p className="meta">{doc.id ?? 'template'}</p>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>
    </>
  );
}
