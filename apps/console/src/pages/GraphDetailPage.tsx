// Workspace (knowledge-graph) detail: live node/relationship counts, an inline ingest form
// (text/structured content -> async job), and the job history with live status. When the last
// job finishes, the graph is refetched so the counts update.
import { useEffect, useId, useRef, useState, type CSSProperties, type FormEvent } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { ApiClientError, type IngestJob } from '@oraclous/api-client';
import { isJobActive, useDocuments, useGraph, useIngest } from '../lib/graphs.js';

const SOURCE_TYPES = ['text', 'csv', 'json', 'md', 'code'] as const;

function messageFor(cause: unknown): string {
  if (ApiClientError.is(cause)) return cause.message;
  return 'Ingestion could not be started. Please try again.';
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? '' : d.toLocaleString();
}

// Mint (--accent) is reserved for a LIVE signal — an active job qualifies; terminal states do not.
function badgeStyle(status: string): CSSProperties {
  if (status === 'failed') {
    return {
      color: 'var(--ink, #0b1220)',
      background: 'var(--error-bg, #fbeae8)',
      borderColor: 'var(--error, #c8412c)',
    };
  }
  if (status === 'pending' || status === 'running') {
    return {
      color: 'var(--ink, #0b1220)',
      background: 'rgba(16,216,138,0.12)',
      borderColor: 'var(--accent, #10d88a)',
    };
  }
  return {
    color: 'var(--ink, #0b1220)',
    background: 'var(--paper-soft, #eceae5)',
    borderColor: 'var(--rule, #d7d6d2)',
  };
}

const styles = {
  page: { display: 'grid', gap: 20, maxWidth: 920 },
  back: {
    fontSize: 13,
    color: 'var(--ink, #0b1220)',
    textDecoration: 'none',
    width: 'fit-content',
  },
  header: { display: 'grid', gap: 8 },
  titleRow: { display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' },
  h1: { margin: 0, fontSize: 22, fontWeight: 600, color: 'var(--ink, #0b1220)' },
  badge: {
    fontSize: 11,
    fontWeight: 600,
    textTransform: 'uppercase',
    letterSpacing: '0.04em',
    border: '1px solid var(--rule, #d7d6d2)',
    borderRadius: 999,
    padding: '2px 8px',
  },
  metrics: { display: 'flex', gap: 16, flexWrap: 'wrap', margin: 0 },
  metric: { fontSize: 13, color: 'var(--ink, #0b1220)' },
  metricNum: { fontSize: 20, fontWeight: 700, fontFamily: 'var(--font-mono, monospace)' },
  meta: {
    margin: 0,
    fontSize: 12,
    color: 'var(--mute, #73767d)',
    fontFamily: 'var(--font-mono, monospace)',
  },
  desc: { margin: 0, fontSize: 13.5, color: 'var(--ink, #0b1220)' },
  card: {
    display: 'grid',
    gap: 12,
    padding: 16,
    background: 'var(--paper, #f4f4f2)',
    border: '1px solid var(--rule, #d7d6d2)',
    borderRadius: 12,
    fontFamily: 'var(--font-sans, system-ui, sans-serif)',
  },
  cardTitle: { margin: 0, fontSize: 15, fontWeight: 600, color: 'var(--ink, #0b1220)' },
  field: { display: 'grid', gap: 6 },
  label: { fontSize: 13, fontWeight: 500, color: 'var(--ink, #0b1220)' },
  textarea: {
    width: '100%',
    boxSizing: 'border-box',
    minHeight: 96,
    padding: '10px 12px',
    fontSize: 14,
    fontFamily: 'var(--font-mono, monospace)',
    color: 'var(--ink, #0b1220)',
    background: '#ffffff',
    border: '1px solid var(--rule, #d7d6d2)',
    borderRadius: 8,
    resize: 'vertical',
  },
  controlRow: { display: 'flex', gap: 12, alignItems: 'flex-end', flexWrap: 'wrap' },
  select: {
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
  muted: { margin: 0, fontSize: 13.5, color: 'var(--mute, #73767d)' },
  jobs: { listStyle: 'none', margin: 0, padding: 0, display: 'grid', gap: 8 },
  job: {
    display: 'grid',
    gap: 4,
    padding: 12,
    background: 'var(--paper, #f4f4f2)',
    border: '1px solid var(--rule, #d7d6d2)',
    borderRadius: 10,
  },
  jobTop: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  jobName: { fontSize: 14, fontWeight: 600, color: 'var(--ink, #0b1220)' },
  jobMeta: {
    margin: 0,
    fontSize: 12,
    color: 'var(--mute, #73767d)',
    fontFamily: 'var(--font-mono, monospace)',
  },
  jobError: { margin: 0, fontSize: 12, color: 'var(--error, #c8412c)' },
} satisfies Record<string, CSSProperties>;

function JobRow({ job }: { job: IngestJob }) {
  const live = isJobActive(job);
  return (
    <li style={styles.job}>
      <div style={styles.jobTop}>
        <span style={styles.jobName}>{job.filename ?? job.sourceType}</span>
        <span
          style={{ ...styles.badge, ...badgeStyle(job.status) }}
          aria-live={live ? 'polite' : undefined}
        >
          {job.status}
        </span>
      </div>
      <p style={styles.jobMeta}>
        {job.extractedEntities ?? 0} entities · {job.extractedRelationships ?? 0} relationships
        {formatDate(job.createdAt) !== '' ? ` · ${formatDate(job.createdAt)}` : ''}
      </p>
      {job.status === 'failed' && job.errorMessage !== null && (
        <p style={styles.jobError}>{job.errorMessage}</p>
      )}
    </li>
  );
}

export default function GraphDetailPage() {
  const { graphId = '' } = useParams<{ graphId: string }>();
  const queryClient = useQueryClient();

  const { graph, isLoading, isError } = useGraph(graphId);
  const { documents } = useDocuments(graphId);
  const ingest = useIngest(graphId);

  const errorId = useId();
  const [content, setContent] = useState('');
  const [sourceType, setSourceType] = useState<string>('text');
  const [error, setError] = useState<string | null>(null);

  // When the last active job finishes, refetch the graph so node/relationship counts update.
  const anyActive = documents.some(isJobActive);
  const wasActive = useRef(false);
  useEffect(() => {
    if (wasActive.current && !anyActive) {
      void queryClient.invalidateQueries({ queryKey: ['graph', graphId] });
    }
    wasActive.current = anyActive;
  }, [anyActive, graphId, queryClient]);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    try {
      await ingest.mutateAsync({ content: content.trim(), sourceType });
      setContent('');
    } catch (cause) {
      setError(messageFor(cause));
    }
  }

  const busy = ingest.isPending;

  return (
    <div style={styles.page}>
      <Link to="/app/workspaces" style={styles.back}>
        ← Workspaces
      </Link>

      {isLoading ? (
        <p style={styles.muted} role="status">
          Loading…
        </p>
      ) : isError || graph === null ? (
        <p style={styles.error} role="alert">
          This workspace could not be found.
        </p>
      ) : (
        <>
          <header style={styles.header}>
            <div style={styles.titleRow}>
              <h1 style={styles.h1}>{graph.name}</h1>
              <span
                style={{ ...styles.badge, ...badgeStyle(graph.status) }}
                aria-label={`status: ${graph.status}`}
              >
                {graph.status}
              </span>
            </div>
            {graph.description !== null && graph.description !== '' && (
              <p style={styles.desc}>{graph.description}</p>
            )}
            <p style={styles.metrics}>
              <span style={styles.metric}>
                <span style={styles.metricNum}>{graph.nodeCount}</span> nodes
              </span>
              <span style={styles.metric}>
                <span style={styles.metricNum}>{graph.relationshipCount}</span> relationships
              </span>
            </p>
            <p style={styles.meta}>
              created {formatDate(graph.createdAt)} · updated {formatDate(graph.updatedAt)}
            </p>
          </header>

          <form style={styles.card} onSubmit={onSubmit} aria-label="Add knowledge">
            <h2 style={styles.cardTitle}>Add knowledge</h2>
            {error !== null && (
              <p id={errorId} role="alert" style={styles.error}>
                {error}
              </p>
            )}
            <div style={styles.field}>
              <label htmlFor="ingest-content" style={styles.label}>
                Content
              </label>
              <textarea
                id="ingest-content"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Paste text, CSV, JSON or code…"
                aria-invalid={error !== null}
                aria-describedby={error !== null ? errorId : undefined}
                style={styles.textarea}
              />
            </div>
            <div style={styles.controlRow}>
              <div style={styles.field}>
                <label htmlFor="ingest-type" style={styles.label}>
                  Type
                </label>
                <select
                  id="ingest-type"
                  value={sourceType}
                  onChange={(e) => setSourceType(e.target.value)}
                  style={styles.select}
                >
                  {SOURCE_TYPES.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
              </div>
              <button
                type="submit"
                disabled={busy || content.trim() === ''}
                aria-busy={busy}
                style={busy ? { ...styles.primary, ...styles.busy } : styles.primary}
              >
                {busy ? 'Starting…' : 'Ingest'}
              </button>
            </div>
          </form>

          <section aria-label="Ingestion history" style={{ display: 'grid', gap: 8 }}>
            <h2 style={styles.cardTitle}>Ingestion history</h2>
            {documents.length === 0 ? (
              <p style={styles.muted}>No ingestion yet. Add some knowledge above.</p>
            ) : (
              <ul style={styles.jobs}>
                {documents.map((job) => (
                  <JobRow key={job.id} job={job} />
                ))}
              </ul>
            )}
          </section>
        </>
      )}
    </div>
  );
}
