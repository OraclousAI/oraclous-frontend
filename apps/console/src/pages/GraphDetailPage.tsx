// Workspace (knowledge-graph) detail: live node/relationship counts, an inline ingest form
// (text/structured content -> async job) with live job status, and retrieval/search over the graph.
import { useEffect, useId, useRef, useState, type CSSProperties, type FormEvent } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { ApiClientError, type IngestJob, type SearchMode } from '@oraclous/api-client';
import {
  isJobActive,
  useDeleteGraph,
  useDocuments,
  useGraph,
  useIngest,
  useIngestFile,
  useUpdateGraph,
} from '../lib/graphs.js';
import { resultScore, resultText, useSearch } from '../lib/search.js';
import { useToast } from '../lib/toast.jsx';
import { OntologyEditor } from '../components/graph/OntologyEditor.js';

const SOURCE_TYPES = ['text', 'csv', 'json', 'md', 'code'] as const;
const SEARCH_MODES = ['semantic', 'fulltext', 'hybrid'] as const;

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
    color: 'var(--ink, #0b1220)',
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
  muted: { margin: 0, fontSize: 13.5, color: 'var(--ink, #0b1220)' },
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
    color: 'var(--ink, #0b1220)',
    fontFamily: 'var(--font-mono, monospace)',
  },
  jobError: { margin: 0, fontSize: 12, color: 'var(--error, #c8412c)' },
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
  typeBadge: {
    color: 'var(--ink, #0b1220)',
    background: 'var(--paper-soft, #eceae5)',
    borderColor: 'var(--rule, #d7d6d2)',
  },
  results: { listStyle: 'none', margin: 0, padding: 0, display: 'grid', gap: 8 },
  result: {
    display: 'grid',
    gap: 6,
    padding: 12,
    minWidth: 0,
    background: '#ffffff',
    border: '1px solid var(--rule, #d7d6d2)',
    borderRadius: 10,
  },
  score: { fontSize: 12, color: 'var(--ink, #0b1220)', fontFamily: 'var(--font-mono, monospace)' },
  resultText: {
    margin: 0,
    fontSize: 13.5,
    lineHeight: 1.5,
    color: 'var(--ink, #0b1220)',
    // arbitrary ingested content — wrap long unbreakable tokens (URLs/base64) instead of overflowing
    overflowWrap: 'break-word',
    wordBreak: 'break-word',
  },
  renameRow: { display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' },
  headerActions: { display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' },
  confirmText: { fontSize: 13, color: 'var(--ink, #0b1220)' },
  secondary: {
    padding: '7px 12px',
    fontSize: 13,
    fontWeight: 500,
    color: 'var(--ink, #0b1220)',
    background: 'transparent',
    border: '1px solid var(--rule, #d7d6d2)',
    borderRadius: 8,
    cursor: 'pointer',
    whiteSpace: 'nowrap',
  },
  danger: {
    padding: '7px 12px',
    fontSize: 13,
    fontWeight: 600,
    color: 'var(--paper, #f4f4f2)',
    background: 'var(--error, #c8412c)',
    border: 'none',
    borderRadius: 8,
    cursor: 'pointer',
    whiteSpace: 'nowrap',
  },
  dangerGhost: {
    padding: '7px 12px',
    fontSize: 13,
    fontWeight: 500,
    color: 'var(--error, #c8412c)',
    background: 'transparent',
    border: '1px solid var(--error, #c8412c)',
    borderRadius: 8,
    cursor: 'pointer',
    whiteSpace: 'nowrap',
  },
  fileRow: {
    display: 'grid',
    gap: 6,
    borderTop: '1px solid var(--rule, #d7d6d2)',
    paddingTop: 12,
  },
} satisfies Record<string, CSSProperties>;

function JobRow({ job }: { job: IngestJob }) {
  return (
    <li style={styles.job}>
      <div style={styles.jobTop}>
        <span style={styles.jobName}>{job.filename ?? job.sourceType}</span>
        {/* Always a live region so the terminal transition (running -> completed/failed) is announced. */}
        <span style={{ ...styles.badge, ...badgeStyle(job.status) }} aria-live="polite">
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

  const toast = useToast();
  const { graph, isLoading, isError } = useGraph(graphId);
  const { documents } = useDocuments(graphId);
  const ingest = useIngest(graphId);

  const errorId = useId();
  const [content, setContent] = useState('');
  const [sourceType, setSourceType] = useState<string>('text');
  const [error, setError] = useState<string | null>(null);

  const [query, setQuery] = useState('');
  const [mode, setMode] = useState<SearchMode>('semantic');
  const search = useSearch(graphId);

  const navigate = useNavigate();
  const ingestFile = useIngestFile(graphId);
  const updateGraph = useUpdateGraph(graphId);
  const deleteGraph = useDeleteGraph();
  const fileRef = useRef<HTMLInputElement>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [renaming, setRenaming] = useState(false);
  const [nameInput, setNameInput] = useState('');
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [mgmtError, setMgmtError] = useState<string | null>(null);

  // When the last active job finishes, refetch the graph so node/relationship counts update.
  // The latch is scoped to graphId (the route doesn't remount per :graphId), so navigating between
  // graphs resets it cleanly rather than firing a spurious cross-graph invalidation.
  const anyActive = documents.some(isJobActive);
  const wasActive = useRef(false);
  const trackedGraphId = useRef(graphId);
  useEffect(() => {
    if (trackedGraphId.current !== graphId) {
      trackedGraphId.current = graphId;
      wasActive.current = anyActive;
      return;
    }
    if (wasActive.current && !anyActive) {
      void queryClient.invalidateQueries({ queryKey: ['graph', graphId] });
    }
    wasActive.current = anyActive;
  }, [anyActive, graphId, queryClient]);

  // Clear stale search results + transient management UI when navigating to a different graph —
  // the route reuses this component instance, so they would otherwise leak across graphs.
  const { reset: resetSearch } = search;
  useEffect(() => {
    resetSearch();
    setRenaming(false);
    setConfirmingDelete(false);
    setFileName(null);
    setMgmtError(null);
  }, [graphId, resetSearch]);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    try {
      await ingest.mutateAsync({ content: content.trim(), sourceType });
      setContent('');
      toast.info('Ingestion started — this runs in the background.');
    } catch (cause) {
      setError(messageFor(cause));
    }
  }

  function onSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    search.mutate({ query: query.trim(), mode });
  }

  async function onUploadFile() {
    const f = fileRef.current?.files?.[0];
    if (f === undefined) return;
    setError(null);
    try {
      await ingestFile.mutateAsync({ file: f });
      if (fileRef.current !== null) fileRef.current.value = '';
      setFileName(null);
      toast.info('Upload received — ingestion is running.');
    } catch (cause) {
      setError(messageFor(cause));
    }
  }

  async function onRename(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmed = nameInput.trim();
    if (trimmed === '') return;
    setMgmtError(null);
    try {
      await updateGraph.mutateAsync({ name: trimmed });
      setRenaming(false);
      toast.success('Workspace renamed.');
    } catch (cause) {
      setMgmtError(messageFor(cause));
    }
  }

  async function onDelete() {
    setMgmtError(null);
    try {
      await deleteGraph.mutateAsync(graphId);
      toast.success('Workspace deleted.');
      navigate('/app/workspaces', { replace: true });
    } catch (cause) {
      // keep the confirm row open so the error + retry stay co-located with the action
      setMgmtError(messageFor(cause));
    }
  }

  const busy = ingest.isPending;
  const searchResults = search.data ?? [];

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
            {renaming ? (
              <form style={styles.renameRow} onSubmit={onRename} aria-label="Rename workspace">
                <input
                  value={nameInput}
                  onChange={(e) => setNameInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Escape') {
                      e.preventDefault();
                      setRenaming(false);
                      setMgmtError(null);
                    }
                  }}
                  aria-label="Workspace name"
                  style={styles.input}
                />
                <button
                  type="submit"
                  disabled={updateGraph.isPending || nameInput.trim() === ''}
                  style={styles.primary}
                >
                  {updateGraph.isPending ? 'Saving…' : 'Save'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setRenaming(false);
                    setMgmtError(null);
                  }}
                  style={styles.secondary}
                >
                  Cancel
                </button>
              </form>
            ) : (
              <div style={styles.titleRow}>
                <h1 style={styles.h1}>{graph.name}</h1>
                <span
                  style={{ ...styles.badge, ...badgeStyle(graph.status) }}
                  aria-label={`status: ${graph.status}`}
                >
                  {graph.status}
                </span>
              </div>
            )}
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
            {!renaming && (
              <div style={styles.headerActions}>
                <Link
                  to={`/app/workspaces/${graphId}/explorer`}
                  style={{ ...styles.secondary, textDecoration: 'none' }}
                >
                  Explore
                </Link>
                <button
                  type="button"
                  onClick={() => {
                    setNameInput(graph.name);
                    setRenaming(true);
                    setMgmtError(null);
                  }}
                  style={styles.secondary}
                >
                  Rename
                </button>
                {confirmingDelete ? (
                  <>
                    <span style={styles.confirmText}>Delete this workspace and its data?</span>
                    <button
                      type="button"
                      onClick={onDelete}
                      disabled={deleteGraph.isPending}
                      style={styles.danger}
                    >
                      {deleteGraph.isPending ? 'Deleting…' : 'Delete'}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setConfirmingDelete(false);
                        setMgmtError(null);
                      }}
                      style={styles.secondary}
                    >
                      Cancel
                    </button>
                  </>
                ) : (
                  <button
                    type="button"
                    onClick={() => {
                      setConfirmingDelete(true);
                      setMgmtError(null);
                    }}
                    style={styles.dangerGhost}
                  >
                    Delete
                  </button>
                )}
              </div>
            )}
            {mgmtError !== null && (
              <p role="alert" style={styles.error}>
                {mgmtError}
              </p>
            )}
          </header>

          <form style={styles.card} onSubmit={onSearch} aria-label="Search this workspace">
            <h2 style={styles.cardTitle}>Search this workspace</h2>
            <div style={styles.controlRow}>
              <div style={{ ...styles.field, flex: 1, minWidth: 200 }}>
                <label htmlFor="search-query" style={styles.label}>
                  Query
                </label>
                <input
                  id="search-query"
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Ask your knowledge…"
                  style={styles.input}
                />
              </div>
              <div style={styles.field}>
                <label htmlFor="search-mode" style={styles.label}>
                  Mode
                </label>
                <select
                  id="search-mode"
                  value={mode}
                  onChange={(e) => setMode(e.target.value as SearchMode)}
                  style={styles.select}
                >
                  {SEARCH_MODES.map((m) => (
                    <option key={m} value={m}>
                      {m}
                    </option>
                  ))}
                </select>
              </div>
              <button
                type="submit"
                disabled={search.isPending || query.trim() === ''}
                aria-busy={search.isPending}
                style={search.isPending ? { ...styles.primary, ...styles.busy } : styles.primary}
              >
                {search.isPending ? 'Searching…' : 'Search'}
              </button>
            </div>
            {search.isError && (
              <p role="alert" style={styles.error}>
                Search failed. Please try again.
              </p>
            )}
            {/* Results are gated on isSuccess so a failed re-search never shows stale rows; the
                region is a polite live region so arriving results (or none) are announced. */}
            <div role="status" aria-live="polite">
              {search.isSuccess && searchResults.length === 0 && (
                <p style={styles.muted}>No results for that query.</p>
              )}
              {search.isSuccess && searchResults.length > 0 && (
                <ul style={styles.results} aria-label="Search results">
                  {searchResults.map((r) => {
                    const score = resultScore(r);
                    return (
                      <li key={r.id} style={styles.result}>
                        <div style={styles.jobTop}>
                          <span style={{ ...styles.badge, ...styles.typeBadge }}>{r.type}</span>
                          {score !== null && <span style={styles.score}>{score.toFixed(3)}</span>}
                        </div>
                        <p style={styles.resultText}>{resultText(r)}</p>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          </form>

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
            <div style={styles.fileRow}>
              <label htmlFor="ingest-file" style={styles.label}>
                Or upload a file
              </label>
              <div style={styles.controlRow}>
                <input
                  ref={fileRef}
                  id="ingest-file"
                  type="file"
                  onChange={(e) => setFileName(e.target.files?.[0]?.name ?? null)}
                  style={{ ...styles.input, flex: 1, minWidth: 200 }}
                />
                <button
                  type="button"
                  onClick={onUploadFile}
                  disabled={fileName === null || ingestFile.isPending}
                  aria-busy={ingestFile.isPending}
                  style={
                    ingestFile.isPending ? { ...styles.primary, ...styles.busy } : styles.primary
                  }
                >
                  {ingestFile.isPending ? 'Uploading…' : 'Upload'}
                </button>
              </div>
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

          {/* key by graphId so the editor remounts (and re-hydrates) per graph — never carries one
              graph's labels/mode into another's Save. */}
          <OntologyEditor key={graphId} graphId={graphId} />
        </>
      )}
    </div>
  );
}
