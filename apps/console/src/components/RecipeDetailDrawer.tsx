// Recipe detail drawer (Recipes — increment 1). A focus-trapped panel opened from a recipe tile
// that renders the format-0.2 document as readable sections — concern + status, what the recipe
// does, what it produces (entity + relationship labels), and the expected source shape — instead of
// a raw JSON blob. A "View raw document" toggle keeps the full JSON one click away. Focus trap,
// Escape-to-close, scroll-lock, and focus-restore to the originating tile come from useDrawerA11y.
import { useId, useMemo, useRef, useState, type RefObject } from 'react';
import { ApiClientError, type RecipeDocument } from '@oraclous/api-client';
import { useRecipe, useStoreRecipe } from '../lib/recipes.js';
import { SkeletonList } from './ui/Skeleton.js';
import { RecipeDryRunPanel } from './RecipeDryRunPanel.js';
import { useToast } from '../lib/toast.jsx';
import { useDrawerA11y } from './shell/useDrawerA11y.js';
import { IconX } from '../icons/index.js';

function messageFor(cause: unknown): string {
  if (ApiClientError.is(cause)) return cause.message;
  return 'Couldn’t save the recipe. Please try again.';
}

// Derive the graph shape a recipe produces from its mappings + extractions: node labels and
// extracted entity types are "entities"; edge types, extraction link types, and extraction
// relationship types are "relationships". De-duplicated, first-seen order preserved.
function producedLabels(doc: RecipeDocument): {
  readonly entities: readonly string[];
  readonly relationships: readonly string[];
} {
  const entities = new Set<string>();
  const relationships = new Set<string>();
  const add = (set: Set<string>, value: unknown) => {
    if (typeof value === 'string' && value.trim() !== '') set.add(value);
  };
  for (const m of doc.mappings ?? []) {
    if (m.project_to === 'node') add(entities, m.label);
    if (m.project_to === 'edge') add(relationships, m.type);
  }
  for (const ex of doc.extractions ?? []) {
    for (const et of ex.ontology?.entity_types ?? []) add(entities, et.name);
    for (const rt of ex.ontology?.relationship_types ?? []) add(relationships, rt.name);
    add(relationships, ex.link?.type);
  }
  return { entities: [...entities], relationships: [...relationships] };
}

const chipRow = {
  listStyle: 'none',
  display: 'flex',
  flexWrap: 'wrap',
  gap: 'var(--sp-2)',
  margin: 0,
  padding: 0,
} as const;

const caption = { color: 'var(--mute)', margin: 0 } as const;

export function RecipeDetailDrawer({
  recipeId,
  draft,
  triggerRef,
  onClose,
}: {
  // A saved recipe to fetch by id, OR an in-memory draft document to render (template authoring).
  recipeId?: string;
  draft?: RecipeDocument;
  // The control that opened the drawer — focus returns to it on close.
  triggerRef: RefObject<HTMLButtonElement>;
  onClose: () => void;
}) {
  const panelRef = useRef<HTMLDivElement>(null);
  const titleId = useId();
  useDrawerA11y({ open: true, drawerRef: panelRef, triggerRef, onClose });

  // In draft mode the document is in memory; otherwise fetch it (the query is disabled when no id).
  const { recipe: fetched, isError } = useRecipe(recipeId ?? '');
  const isDraft = draft !== undefined;
  const recipe = draft ?? fetched;
  const [showRaw, setShowRaw] = useState(false);

  const store = useStoreRecipe();
  const toast = useToast();
  const [saveError, setSaveError] = useState<string | null>(null);

  async function onSave() {
    if (recipe === null || store.isPending) return;
    setSaveError(null);
    try {
      await store.mutateAsync(recipe);
      // The store endpoint promotes on save, so the new tile reflects its real (promoted) status.
      toast.success('Recipe saved.');
      onClose();
    } catch (cause) {
      // 422 (invalid document) keeps the drawer open with the validation detail shown inline.
      setSaveError(messageFor(cause));
    }
  }

  const produced = useMemo(
    () => (recipe !== null ? producedLabels(recipe) : { entities: [], relationships: [] }),
    [recipe]
  );

  const concern = (recipe?.concern ?? '').trim();
  const title = concern !== '' ? concern : (recipe?.id ?? 'Recipe');
  const status = recipe?.status;
  const sourceType = recipe?.applies_to?.source_type;
  const shapeSignature = recipe?.applies_to?.shape_signature?.trim();
  const sampleBasis = recipe?.authoring?.sample_basis?.trim();
  const authoredBy = recipe?.authoring?.authored_by?.trim();
  const provenance = recipe?.defaults?.provenance;

  const meta =
    recipe === null
      ? ''
      : [
          sourceType,
          recipe.version !== undefined ? `v${recipe.version}` : null,
          recipe.recipe_format_version ? `format ${recipe.recipe_format_version}` : null,
        ]
          .filter(Boolean)
          .join(' · ');

  const subtext = [
    authoredBy ? `Authored by ${authoredBy}` : null,
    provenance ? `Provenance: ${provenance}` : null,
  ]
    .filter(Boolean)
    .join(' · ');

  return (
    <>
      <button
        type="button"
        className="tool-drawer__backdrop"
        aria-label="Close recipe details"
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
            <h2 id={titleId}>{title}</h2>
            {isDraft ? (
              <span className="chip chip-sm">draft (unsaved)</span>
            ) : (
              status !== undefined &&
              status !== '' && <span className="chip chip-sm">{status}</span>
            )}
          </div>
          <button type="button" className="tool-drawer__close" aria-label="Close" onClick={onClose}>
            <IconX size={18} />
          </button>
        </div>

        <div className="tool-drawer__body">
          {/* A cached document wins even if a background refetch errored — only show the error when
              there is nothing to render; the skeleton covers the initial load. */}
          {isError && recipe === null ? (
            <p className="callout" data-tone="error" role="alert" style={{ margin: 0 }}>
              Could not load this recipe.
            </p>
          ) : recipe === null ? (
            <SkeletonList rows={3} />
          ) : (
            <>
              {meta !== '' && (
                <p className="t-caption" style={caption}>
                  {meta}
                </p>
              )}

              <section className="tool-drawer__section">
                <h3>What this recipe does</h3>
                <p style={{ margin: 0 }}>
                  {sampleBasis !== undefined && sampleBasis !== ''
                    ? sampleBasis
                    : `Projects ${sourceType ?? 'source'} data into the knowledge graph for the “${title}” concern.`}
                </p>
                {subtext !== '' && (
                  <p className="t-caption" style={caption}>
                    {subtext}
                  </p>
                )}
              </section>

              <section className="tool-drawer__section">
                <h3>What it produces</h3>
                {produced.entities.length === 0 && produced.relationships.length === 0 ? (
                  <p className="t-caption" style={caption}>
                    No entity or relationship projections declared.
                  </p>
                ) : (
                  <>
                    {produced.entities.length > 0 && (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-2)' }}>
                        <span className="t-caption" style={{ color: 'var(--mute)' }}>
                          Entities
                        </span>
                        <ul style={chipRow}>
                          {produced.entities.map((e) => (
                            <li key={e} className="chip chip-sm">
                              {e}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                    {produced.relationships.length > 0 && (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-2)' }}>
                        <span className="t-caption" style={{ color: 'var(--mute)' }}>
                          Relationships
                        </span>
                        <ul style={chipRow}>
                          {produced.relationships.map((rel) => (
                            <li key={rel} className="chip chip-sm">
                              {rel}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </>
                )}
              </section>

              <section className="tool-drawer__section">
                <h3>Expected source</h3>
                <p style={{ margin: 0 }}>{sourceType ?? 'Unspecified source type.'}</p>
                {shapeSignature !== undefined && shapeSignature !== '' && (
                  <pre className="cat-pre" style={{ margin: 0 }}>
                    {shapeSignature}
                  </pre>
                )}
              </section>

              <RecipeDryRunPanel recipe={recipe} />

              {isDraft && (
                <section className="tool-drawer__section">
                  <h3>Save</h3>
                  <p className="t-caption" style={caption}>
                    Saves this recipe to your library.
                  </p>
                  <button
                    type="button"
                    className="btn"
                    data-variant="primary"
                    onClick={() => void onSave()}
                    disabled={store.isPending}
                  >
                    {store.isPending ? 'Saving…' : 'Save draft'}
                  </button>
                  {saveError !== null && (
                    <p className="callout" data-tone="error" role="alert" style={{ margin: 0 }}>
                      {saveError}
                    </p>
                  )}
                </section>
              )}

              <section className="tool-drawer__section">
                <h3>Raw document</h3>
                <button
                  type="button"
                  className="btn"
                  data-variant="secondary"
                  data-size="sm"
                  onClick={() => setShowRaw((v) => !v)}
                  aria-expanded={showRaw}
                >
                  {showRaw ? 'Hide raw document' : 'View raw document'}
                </button>
                {showRaw && <pre className="cat-pre">{JSON.stringify(recipe, null, 2)}</pre>}
              </section>
            </>
          )}
        </div>
      </div>
    </>
  );
}
