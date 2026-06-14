// Recipe run panel (Recipes — increment 5). For a SAVED recipe: pick a workspace, paste a source,
// and run the recipe over it — a structured ingest carrying the recipe_id. The job streams
// pending → running → completed/failed (mint pulse while live, mirroring GraphDetailPage), then
// links to the Explorer. Text paste only here (file upload / scheduling are out of scope).
import { useEffect, useId, useState } from 'react';
import { Link } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { ApiClientError } from '@oraclous/api-client';
import { useGraphJob, useGraphs, useRunRecipe } from '../lib/graphs.js';
import { IconArrowUpRight } from '../icons/index.js';

const SOURCE_TYPES = ['text', 'csv', 'json', 'md', 'code'] as const;

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

function defaultSourceType(recipeSourceType: string | undefined): string {
  return recipeSourceType !== undefined &&
    (SOURCE_TYPES as readonly string[]).includes(recipeSourceType)
    ? recipeSourceType
    : 'text';
}

export function RecipeRunPanel({
  recipeId,
  sourceType: recipeSourceType,
}: {
  recipeId: string;
  sourceType?: string | undefined;
}) {
  const { graphs, isLoading: graphsLoading } = useGraphs();
  const run = useRunRecipe();
  const queryClient = useQueryClient();
  const graphSelId = useId();
  const contentId = useId();
  const typeId = useId();

  const [graphId, setGraphId] = useState('');
  const [content, setContent] = useState('');
  const [sourceType, setSourceType] = useState(() => defaultSourceType(recipeSourceType));
  const [jobId, setJobId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

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
    <section className="tool-drawer__section">
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
                {SOURCE_TYPES.map((t) => (
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
