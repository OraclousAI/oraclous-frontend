// Workspaces — the organisation's knowledge graphs (GET/POST /api/v1/graphs).
// Lists existing graphs and creates new ones inline.
import { useId, useState, type CSSProperties, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { ApiClientError } from '@oraclous/api-client';
import { useCreateGraph, useGraphs } from '../lib/graphs.js';
import { useToast } from '../lib/toast.jsx';
import { SkeletonList } from '../components/ui/Skeleton.js';

function messageFor(cause: unknown): string {
  if (ApiClientError.is(cause)) return cause.message;
  return 'Could not create the workspace. Please try again.';
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? '' : d.toLocaleDateString();
}

const styles = {
  page: { display: 'grid', gap: 20, maxWidth: 920 },
  header: { display: 'grid', gap: 4 },
  h1: { margin: 0, fontSize: 22, fontWeight: 600, color: 'var(--ink, #0b1220)' },
  sub: { margin: 0, fontSize: 13.5, color: 'var(--mute, #65686f)' },
  createCard: {
    display: 'grid',
    gap: 12,
    padding: 16,
    background: 'var(--paper, #f4f4f2)',
    border: '1px solid var(--rule, #d7d6d2)',
    borderRadius: 12,
    fontFamily: 'var(--font-sans, system-ui, sans-serif)',
  },
  createRow: { display: 'flex', gap: 12, alignItems: 'flex-end', flexWrap: 'wrap' },
  field: { display: 'grid', gap: 6, minWidth: 160 },
  label: { fontSize: 13, fontWeight: 500, color: 'var(--ink, #0b1220)' },
  optional: { fontWeight: 400, color: 'var(--mute, #65686f)' },
  input: {
    width: '100%',
    boxSizing: 'border-box',
    padding: '9px 12px',
    fontSize: 14,
    fontFamily: 'var(--font-sans, system-ui, sans-serif)',
    color: 'var(--ink, #0b1220)',
    background: '#ffffff',
    border: '1px solid var(--rule, #d7d6d2)',
    borderRadius: 8,
  },
  primary: {
    padding: '9px 16px',
    fontSize: 14,
    fontWeight: 600,
    fontFamily: 'var(--font-sans, system-ui, sans-serif)',
    color: 'var(--paper, #f4f4f2)',
    background: 'var(--ink, #0b1220)',
    border: 'none',
    borderRadius: 8,
    cursor: 'pointer',
    whiteSpace: 'nowrap',
  },
  busy: { opacity: 0.6, cursor: 'default' },
  error: {
    margin: 0,
    padding: '10px 12px',
    fontSize: 13,
    color: 'var(--ink, #0b1220)',
    background: 'var(--error-bg, #fbeae8)',
    border: '1px solid var(--error, #c8412c)',
    borderRadius: 8,
  },
  listWrap: { display: 'grid', gap: 8 },
  muted: { margin: 0, fontSize: 13.5, color: 'var(--mute, #65686f)' },
  grid: {
    listStyle: 'none',
    margin: 0,
    padding: 0,
    display: 'grid',
    gap: 12,
    gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
  },
  card: {
    display: 'grid',
    gap: 6,
    padding: 16,
    background: 'var(--paper, #f4f4f2)',
    border: '1px solid var(--rule, #d7d6d2)',
    borderRadius: 10,
  },
  cardTop: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  cardName: { fontSize: 15, fontWeight: 600, color: 'var(--ink, #0b1220)' },
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
  cardDesc: { margin: 0, fontSize: 13, color: 'var(--ink, #0b1220)' },
  cardMeta: {
    margin: 0,
    fontSize: 12,
    color: 'var(--mute, #65686f)',
    fontFamily: 'var(--font-mono, monospace)',
  },
} satisfies Record<string, CSSProperties>;

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
    <div style={styles.page}>
      <header style={styles.header}>
        <h1 style={styles.h1}>Workspaces</h1>
        <p style={styles.sub}>Knowledge graphs in your organisation.</p>
      </header>

      <form style={styles.createCard} onSubmit={onSubmit} aria-label="Create a workspace">
        {error !== null && (
          <p id={errorId} role="alert" style={styles.error}>
            {error}
          </p>
        )}
        <div style={styles.createRow}>
          <div style={{ ...styles.field, flex: 2 }}>
            <label htmlFor="graph-name" style={styles.label}>
              Name
            </label>
            <input
              id="graph-name"
              name="name"
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              aria-invalid={error !== null}
              aria-describedby={error !== null ? errorId : undefined}
              style={styles.input}
            />
          </div>
          <div style={{ ...styles.field, flex: 3 }}>
            <label htmlFor="graph-desc" style={styles.label}>
              Description <span style={styles.optional}>(optional)</span>
            </label>
            <input
              id="graph-desc"
              name="description"
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              style={styles.input}
            />
          </div>
          <button
            type="submit"
            disabled={busy || name.trim() === ''}
            aria-busy={busy}
            style={busy ? { ...styles.primary, ...styles.busy } : styles.primary}
          >
            {busy ? 'Creating…' : 'Create graph'}
          </button>
        </div>
      </form>

      <section aria-label="Workspaces list" style={styles.listWrap}>
        {isLoading ? (
          <SkeletonList rows={3} />
        ) : isError ? (
          <p style={styles.error} role="alert">
            Could not load your workspaces.
          </p>
        ) : graphs.length === 0 ? (
          <p style={styles.muted}>No workspaces yet. Create your first one above.</p>
        ) : (
          <ul style={styles.grid}>
            {graphs.map((g) => (
              <li key={g.id}>
                <Link
                  to={`/app/workspaces/${g.id}`}
                  style={{ ...styles.card, textDecoration: 'none', color: 'inherit' }}
                >
                  <div style={styles.cardTop}>
                    <span style={styles.cardName}>{g.name}</span>
                    <span style={styles.badge} aria-label={`status: ${g.status}`}>
                      {g.status}
                    </span>
                  </div>
                  {g.description !== null && g.description !== '' && (
                    <p style={styles.cardDesc}>{g.description}</p>
                  )}
                  <p style={styles.cardMeta}>
                    {g.nodeCount} nodes · {g.relationshipCount} relationships
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
