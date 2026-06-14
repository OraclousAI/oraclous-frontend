// Recipe run panel (Recipes — increment 5). For a SAVED recipe: pick a workspace, paste a source,
// and run the recipe over it — a structured ingest carrying the recipe_id. The job streams
// pending → running → completed/failed (mint pulse while live, mirroring GraphDetailPage), then
// links to the Explorer. Text paste only here (file upload / scheduling are out of scope).
import { useEffect, useId, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { ApiClientError } from '@oraclous/api-client';
import { useGraphJob, useGraphs, useRunRecipe } from '../lib/graphs.js';
import { RECIPE_SOURCE_TYPES } from '../lib/recipes.js';
import { IconArrowUpRight } from '../icons/index.js';

const caption = { color: 'var(--mute)', margin: 0 } as const;

// Mint (--accent, via data-state="active") is reserved for a LIVE signal — an active job qualifies;
// terminal states do not.
function jobPillState(status: string): string {
  if (status === 'failed') return 'error';
  if (status === 'pending' || status === 'running') return 'active';
  return 'paused';
}

function messageFor(cause: unknown): string {
  if (ApiClientError.is(cause)) return cause.message;
  return 'Couldn’t start the run. Please try again.';
}

export function RecipeRunPanel({
  recipeId,
  sourceType: recipeSourceType,
  autoFocus,
}: {
  recipeId: string;
  sourceType?: string | undefined;
  // Move focus here when the panel is revealed by a promote (the Promote section unmounts).
  autoFocus?: boolean | undefined;
}) {
  const { graphs, isLoading: graphsLoading } = useGraphs();
  const run = useRunRecipe();
  const queryClient = useQueryClient();
  const sectionRef = useRef<HTMLElement>(null);
  const graphSelId = useId();
  const contentId = useId();
  const typeId = useId();

  const [graphId, setGraphId] = useState('');
  const [content, setContent] = useState('');
  // Default to the recipe's declared source type; keep whatever it is selectable below.
  const [sourceType, setSourceType] = useState(() => recipeSourceType ?? 'text');
  const [jobId, setJobId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // The recipe's source type may be outside the canonical list — keep it selectable.
  const sourceOptions = RECIPE_SOURCE_TYPES.includes(
    sourceType as (typeof RECIPE_SOURCE_TYPES)[number]
  )
    ? RECIPE_SOURCE_TYPES
    : [sourceType, ...RECIPE_SOURCE_TYPES];

  // When revealed by a promote, take focus so the keyboard/SR journey continues here.
  useEffect(() => {
    if (autoFocus) sectionRef.current?.focus();
  }, [autoFocus]);

  const { job } = useGraphJob(graphId, jobId);
  const currentJob = job ?? run.data ?? null;

  // When the run completes, the workspace's counts changed — refresh the graph + list so the rest of
  // the app (and the Explorer link target) reflects the new nodes.
  useEffect(() => {
    if (currentJob?.status === 'completed' && graphId !== '') {
      void queryClient.invalidateQueries({ queryKey: ['graph', graphId] });
      void queryClient.invalidateQueries({ queryKey: ['graphs'] });
    }
  }, [currentJob?.status, graphId, queryClient]);

  async function onRun() {
    if (graphId === '' || content.trim() === '' || run.isPending) return;
    setError(null);
    try {
      const started = await run.mutateAsync({
        graphId,
        content: content.trim(),
        sourceType,
        recipeId,
      });
      setJobId(started.id);
    } catch (cause) {
      setError(messageFor(cause));
    }
  }

  const noWorkspaces = !graphsLoading && graphs.length === 0;

  return (
    <section
      ref={sectionRef}
      tabIndex={-1}
      style={{ outline: 'none' }}
      className="tool-drawer__section"
    >
      <h3>Run on a workspace</h3>
      <p className="t-caption" style={caption}>
        Project a source into a workspace using this recipe.
      </p>

      {noWorkspaces ? (
        <p className="t-caption" style={caption}>
          No workspaces yet — create one first, then run this recipe over a source.
        </p>
      ) : (
        <>
          <div className="field">
            <label htmlFor={graphSelId}>Workspace</label>
            <select
              id={graphSelId}
              value={graphId}
              onChange={(e) => {
                setGraphId(e.target.value);
                // Clear any prior run so the new workspace starts clean — otherwise the previous
                // job's status lingers and the Explorer link would point at a workspace it never ran on.
                setJobId(null);
                run.reset();
              }}
              disabled={graphsLoading}
            >
              <option value="">— select a workspace —</option>
              {graphs.map((g) => (
                <option key={g.id} value={g.id}>
                  {g.name}
                </option>
              ))}
            </select>
          </div>

          <div className="field">
            <label htmlFor={contentId}>Source</label>
            <textarea
              id={contentId}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Paste the source to run the recipe over…"
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
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              alignItems: 'flex-end',
              gap: 'var(--sp-3)',
            }}
          >
            <div className="field" style={{ minWidth: 150 }}>
              <label htmlFor={typeId}>Type</label>
              <select
                id={typeId}
                value={sourceType}
                onChange={(e) => setSourceType(e.target.value)}
              >
                {sourceOptions.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </div>
            <button
              type="button"
              className="btn"
              data-variant="primary"
              onClick={() => void onRun()}
              disabled={run.isPending || graphId === '' || content.trim() === ''}
            >
              {run.isPending ? 'Starting…' : 'Run on workspace'}
            </button>
          </div>

          <div aria-live="polite">
            {/* No role="alert" — this is inside the aria-live="polite" wrapper, which announces it;
                a nested assertive region would double-announce (matches RecipeDryRunPanel). */}
            {error !== null && (
              <p className="callout" data-tone="error" style={{ margin: 0 }}>
                {error}
              </p>
            )}
            {currentJob !== null && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-2)' }}>
                <span className="status-pill" data-state={jobPillState(currentJob.status)}>
                  <span
                    className={
                      jobPillState(currentJob.status) === 'active' ? 'dot is-pulse' : 'dot'
                    }
                    aria-hidden="true"
                  />
                  {currentJob.status}
                </span>
                <p className="t-caption" style={caption}>
                  {currentJob.extractedEntities ?? 0} entities ·{' '}
                  {currentJob.extractedRelationships ?? 0} relationships
                </p>
                {currentJob.status === 'failed' && currentJob.errorMessage !== null && (
                  <p className="callout" data-tone="error" style={{ margin: 0 }}>
                    {currentJob.errorMessage}
                  </p>
                )}
                {currentJob.status === 'completed' && (
                  <Link
                    to={`/app/workspaces/${graphId}/explorer`}
                    className="btn"
                    data-variant="secondary"
                    data-size="sm"
                  >
                    Open explorer <IconArrowUpRight size={13} />
                  </Link>
                )}
              </div>
            )}
          </div>
        </>
      )}
    </section>
  );
}
