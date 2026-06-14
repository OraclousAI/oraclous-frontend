// Recipe dry-run panel (Recipes — increment 3). Lives inside the recipe detail drawer: paste a small
// sample, pick its source type, and preview the projection (POST /api/v1/recipes/dry-run) — NO
// writes. Renders the projected node labels + counts + relationship types, plus ontology-violation
// and warning callouts. A 422 (malformed sample/recipe) shows a clear inline error, never a crash.
import { useId, useState } from 'react';
import { ApiClientError, type DryRunResult, type RecipeDocument } from '@oraclous/api-client';
import { useDryRun } from '../lib/recipes.js';

// The format-0.2 source kinds (recipe.schema.json applies_to.source_type enum).
const SOURCE_TYPES = [
  'json',
  'csv',
  'relational',
  'text',
  'code',
  'timeseries',
  'event_log',
  'geospatial',
  'graph',
] as const;

const chipRow = {
  listStyle: 'none',
  display: 'flex',
  flexWrap: 'wrap',
  gap: 'var(--sp-2)',
  margin: 0,
  padding: 0,
} as const;

const caption = { color: 'var(--mute)', margin: 0 } as const;

function messageFor(cause: unknown): string {
  if (ApiClientError.is(cause)) return cause.message;
  return 'Couldn’t run the preview. Please try again.';
}

function violationText(v: unknown): string {
  if (typeof v === 'string') return v;
  if (v !== null && typeof v === 'object' && 'message' in v) {
    const m = (v as { message?: unknown }).message;
    if (typeof m === 'string') return m;
  }
  return JSON.stringify(v);
}

function DryRunResultView({ result }: { result: DryRunResult }) {
  if (result.requires_llm === true) {
    return (
      <p className="t-caption" style={caption}>
        {result.note ??
          'This source type needs LLM extraction, so a structured preview isn’t available.'}
      </p>
    );
  }

  const nodeLabels = Object.entries(result.node_labels ?? {});
  const relationships = result.relationship_types ?? [];
  const violations = result.ontology_violations ?? [];
  const warnings = result.warnings ?? [];
  const counts = result.counts ?? {};
  const countSummary = [
    counts.nodes !== undefined ? `${counts.nodes} nodes` : null,
    counts.edges !== undefined ? `${counts.edges} edges` : null,
    counts.units_skipped !== undefined && counts.units_skipped > 0
      ? `${counts.units_skipped} skipped`
      : null,
  ]
    .filter(Boolean)
    .join(' · ');

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-3)' }}>
      {countSummary !== '' && (
        <p className="t-caption" style={caption}>
          {countSummary}
        </p>
      )}
      {nodeLabels.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-2)' }}>
          <span className="t-caption" style={{ color: 'var(--mute)' }}>
            Nodes
          </span>
          <ul style={chipRow}>
            {nodeLabels.map(([label, count]) => (
              <li key={label} className="chip chip-sm">
                {label} ×{count}
              </li>
            ))}
          </ul>
        </div>
      )}
      {relationships.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-2)' }}>
          <span className="t-caption" style={{ color: 'var(--mute)' }}>
            Relationships
          </span>
          <ul style={chipRow}>
            {relationships.map((rel) => (
              <li key={rel} className="chip chip-sm">
                {rel}
              </li>
            ))}
          </ul>
        </div>
      )}
      {nodeLabels.length === 0 && relationships.length === 0 && (
        <p className="t-caption" style={caption}>
          The sample projected no nodes or relationships.
        </p>
      )}
      {violations.length > 0 && (
        <div className="callout" data-tone="error" role="alert">
          <strong>Ontology violations</strong>
          <ul style={{ margin: 'var(--sp-2) 0 0', paddingLeft: 'var(--sp-4)' }}>
            {violations.map((v, i) => (
              <li key={i}>{violationText(v)}</li>
            ))}
          </ul>
        </div>
      )}
      {warnings.length > 0 && (
        <ul style={{ margin: 0, paddingLeft: 'var(--sp-4)' }}>
          {warnings.map((w, i) => (
            <li key={i} className="t-caption" style={{ color: 'var(--mute)' }}>
              {w}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export function RecipeDryRunPanel({ recipe }: { recipe: RecipeDocument }) {
  const dryRun = useDryRun();
  const sampleId = useId();
  const sourceId = useId();
  const [sample, setSample] = useState('');
  const [sourceType, setSourceType] = useState(recipe.applies_to?.source_type ?? 'json');

  const result = dryRun.data ?? null;
  const error = dryRun.isError ? messageFor(dryRun.error) : null;

  async function onRun() {
    if (sample.trim() === '' || dryRun.isPending) return;
    try {
      await dryRun.mutateAsync({ sample, sourceType, recipe });
    } catch {
      // The error is surfaced via dryRun.isError below — nothing else to do here.
    }
  }

  // The recipe's own source type may be outside the standard list — keep it selectable.
  const sourceOptions = SOURCE_TYPES.includes(sourceType as (typeof SOURCE_TYPES)[number])
    ? SOURCE_TYPES
    : [sourceType, ...SOURCE_TYPES];

  return (
    <section className="tool-drawer__section">
      <h3>Dry run</h3>
      <p className="t-caption" style={caption}>
        Preview the projection over a sample — nothing is written.
      </p>

      <div className="field">
        <label htmlFor={sampleId}>Sample</label>
        <textarea
          id={sampleId}
          value={sample}
          onChange={(e) => setSample(e.target.value)}
          placeholder={'{ "id": "…", "label": "…" }'}
          rows={5}
          style={{
            width: '100%',
            boxSizing: 'border-box',
            fontFamily: 'var(--font-mono)',
            resize: 'vertical',
          }}
        />
      </div>

      <div
        style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'flex-end', gap: 'var(--sp-3)' }}
      >
        <div className="field" style={{ minWidth: 150 }}>
          <label htmlFor={sourceId}>Source type</label>
          <select id={sourceId} value={sourceType} onChange={(e) => setSourceType(e.target.value)}>
            {sourceOptions.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>
        <button
          type="button"
          className="btn"
          data-variant="secondary"
          data-size="sm"
          onClick={() => void onRun()}
          disabled={dryRun.isPending || sample.trim() === ''}
        >
          {dryRun.isPending ? 'Running…' : 'Run a dry run'}
        </button>
      </div>

      <div aria-live="polite">
        {dryRun.isPending ? (
          <p className="t-caption" style={caption}>
            Running the preview…
          </p>
        ) : error !== null ? (
          <p className="callout" data-tone="error" role="alert" style={{ margin: 0 }}>
            {error}
          </p>
        ) : result !== null ? (
          <DryRunResultView result={result} />
        ) : null}
      </div>
    </section>
  );
}
