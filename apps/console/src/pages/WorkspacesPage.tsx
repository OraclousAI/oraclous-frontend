// Workspaces — the organisation's knowledge graphs (GET/POST /api/v1/graphs).
// Lists existing graphs and creates new ones inline. Styled per the handoff page patterns.
import { useId, useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { ApiClientError } from '@oraclous/api-client';
import { useCreateGraph, useGraphs } from '../lib/graphs.js';
import { useToast } from '../lib/toast.jsx';
import { SkeletonList } from '../components/ui/Skeleton.js';
import { IconLayers } from '../icons/index.js';
import './workspace.css';

function messageFor(cause: unknown): string {
  if (ApiClientError.is(cause)) return cause.message;
  return 'Could not create the workspace. Please try again.';
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? '' : d.toLocaleDateString();
}

// Live mint is reserved for live states; terminal/idle states stay neutral.
function pillState(status: string): string {
  const s = status.toLowerCase();
  if (s.includes('error') || s.includes('fail')) return 'error';
  if (s === 'active' || s === 'ready' || s === 'processing' || s === 'running') return 'active';
  return 'paused';
}

const nf = new Intl.NumberFormat();

export default function WorkspacesPage() {
  const { graphs, isLoading, isError } = useGraphs();
  const createGraph = useCreateGraph();
  const toast = useToast();

  const errorId = useId();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    const trimmedName = name.trim();
    const trimmedDesc = description.trim();
    try {
      await createGraph.mutateAsync({
        name: trimmedName,
        ...(trimmedDesc !== '' ? { description: trimmedDesc } : {}),
      });
      setName('');
      setDescription('');
      toast.success(`Workspace “${trimmedName}” created.`);
    } catch (cause) {
      setError(messageFor(cause));
    }
  }

  const busy = createGraph.isPending;

  return (
    <div>
      <header className="page-head">
        <div>
          <span className="eyebrow">Knowledge graphs</span>
          <h1>Workspaces</h1>
          <p className="sub">
            Each workspace is a knowledge graph — ingest sources, search it, and point agents at it.
          </p>
        </div>
      </header>

      <form
        className="card"
        style={{ marginBottom: 'var(--sp-6)' }}
        onSubmit={onSubmit}
        aria-label="Create a workspace"
      >
        <div className="card-head">
          <div className="h">
            <h2>New workspace</h2>
            <span className="sub">Spin up a graph for a team, a project, or a corpus</span>
          </div>
        </div>
        <div
          className="card-body"
          style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-3)' }}
        >
          {error !== null && (
            <p
              id={errorId}
              role="alert"
              className="callout"
              data-tone="error"
              style={{ margin: 0 }}
            >
              {error}
            </p>
          )}
          <div className="control-row">
            <div className="field" style={{ flex: 2, minWidth: 180 }}>
              <label htmlFor="graph-name">Name</label>
              <input
                id="graph-name"
                name="name"
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                aria-invalid={error !== null}
                aria-describedby={error !== null ? errorId : undefined}
              />
            </div>
            <div className="field" style={{ flex: 3, minWidth: 220 }}>
              <label htmlFor="graph-desc">Description · optional</label>
              <input
                id="graph-desc"
                name="description"
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>
            <button
              type="submit"
              className="btn"
              data-variant="primary"
              disabled={busy || name.trim() === ''}
              aria-busy={busy}
            >
              {busy ? 'Creating…' : 'Create graph'}
            </button>
          </div>
        </div>
      </form>

      <section aria-label="Workspaces list">
        {isLoading ? (
          <SkeletonList rows={3} />
        ) : isError ? (
          <p className="callout" data-tone="error" role="alert" style={{ margin: 0 }}>
            Could not load your workspaces.
          </p>
        ) : graphs.length === 0 ? (
          <div className="card">
            <div className="empty">
              <span className="empty-icon">
                <IconLayers size={24} />
              </span>
              <span className="t">No workspaces yet</span>
              <span className="s">Create your first one above to start building a graph.</span>
            </div>
          </div>
        ) : (
          <ul className="ws-grid">
            {graphs.map((g) => (
              <li key={g.id}>
                <Link to={`/app/workspaces/${g.id}`} className="ws-card">
                  <div className="top">
                    <span className="nm">{g.name}</span>
                    <span
                      className="status-pill"
                      data-state={pillState(g.status)}
                      aria-label={`status: ${g.status}`}
                    >
                      <span
                        className={pillState(g.status) === 'active' ? 'dot is-pulse' : 'dot'}
                        aria-hidden="true"
                      />
                      {g.status}
                    </span>
                  </div>
                  {g.description !== null && g.description !== '' && (
                    <p className="desc">{g.description}</p>
                  )}
                  <p className="stats">
                    {nf.format(g.nodeCount)} nodes · {nf.format(g.relationshipCount)} edges
                    {formatDate(g.createdAt) !== '' ? ` · created ${formatDate(g.createdAt)}` : ''}
                  </p>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
