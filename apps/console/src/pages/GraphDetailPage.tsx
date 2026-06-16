// Workspace (knowledge-graph) detail: live node/relationship counts, an inline ingest form
// (text/structured content -> async job) with live job status, and retrieval/search over the graph.
// Styled per the handoff workspace.html (ws-head + card patterns).
import { useEffect, useId, useRef, useState, type FormEvent } from 'react';
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
import { useHarnessAgents } from '../lib/runs.js';
import { useAgentsForGraph, useAttachAgent, useDetachAgent } from '../lib/bindings.js';
import { useToast } from '../lib/toast.jsx';
import { OntologyEditor } from '../components/graph/OntologyEditor.js';
import { SkeletonList } from '../components/ui/Skeleton.js';
import { IconArrowUpRight } from '../icons/index.js';
import './workspace.css';

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
function jobPillState(status: string): string {
  if (status === 'failed') return 'error';
  if (status === 'pending' || status === 'running') return 'active';
  return 'paused';
}

function graphPillState(status: string): string {
  const s = status.toLowerCase();
  if (s.includes('error') || s.includes('fail')) return 'error';
  if (s === 'active' || s === 'ready' || s === 'processing' || s === 'running') return 'active';
  return 'paused';
}

function initials(name: string): string {
  return name
    .split(/[\s_-]+/)
    .filter(Boolean)
    .map((w) => w.charAt(0))
    .join('')
    .slice(0, 2)
    .toUpperCase();
}

const nf = new Intl.NumberFormat();

function JobRow({ job }: { job: IngestJob }) {
  const state = jobPillState(job.status);
  return (
    <li>
      <div className="top">
        <span className="nm">{job.filename ?? job.sourceType}</span>
        {/* Always a live region so the terminal transition (running -> completed/failed) is announced. */}
        <span className="status-pill" data-state={state} aria-live="polite">
          <span className={state === 'active' ? 'dot is-pulse' : 'dot'} aria-hidden="true" />
          {job.status}
        </span>
      </div>
      <p className="meta">
        {job.extractedEntities ?? 0} entities · {job.extractedRelationships ?? 0} relationships
        {formatDate(job.createdAt) !== '' ? ` · ${formatDate(job.createdAt)}` : ''}
      </p>
      {job.status === 'failed' && job.errorMessage !== null && (
        <p className="err">{job.errorMessage}</p>
      )}
    </li>
  );
}

// "Agents for this workspace" — the binding curation surface (ADR-029 / G2). Lists the agents bound
// to this workspace, attaches an existing agent (or links out to build one), and detaches. Binding is
// curation only — it does not change what an agent can read or where it runs.
function WorkspaceAgents({ graphId }: { graphId: string }) {
  const pickId = useId();
  const { agents: bound, isLoading } = useAgentsForGraph(graphId);
  const { agents: allAgents } = useHarnessAgents();
  const attach = useAttachAgent();
  const detach = useDetachAgent();
  const [pick, setPick] = useState('');

  const boundIds = new Set(bound.map((a) => a.harnessId));
  const attachable = allAgents.filter((a) => !boundIds.has(a.id));

  return (
    <section className="card" aria-label="Agents for this workspace">
      <div className="card-head">
        <div className="h">
          <h2>Agents for this workspace</h2>
          <span className="sub">Attach an existing agent or build one for this workspace</span>
        </div>
      </div>
      <div
        className="card-body"
        style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-3)' }}
      >
        <div className="control-row">
          <div className="field grow">
            <label htmlFor={pickId}>Attach an agent</label>
            <select id={pickId} value={pick} onChange={(e) => setPick(e.target.value)}>
              <option value="">
                {attachable.length === 0 ? 'No more agents to attach' : 'Select an agent…'}
              </option>
              {attachable.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.manifest?.metadata.name ?? a.name ?? a.id.slice(0, 8)}
                </option>
              ))}
            </select>
          </div>
          <button
            type="button"
            className="btn"
            data-variant="primary"
            disabled={pick === '' || attach.isPending}
            onClick={() =>
              attach.mutate({ harnessId: pick, graphId }, { onSuccess: () => setPick('') })
            }
          >
            {attach.isPending ? 'Attaching…' : 'Attach'}
          </button>
          <Link to="/app/agents/new" className="btn" data-variant="secondary">
            Build an agent
          </Link>
        </div>

        {isLoading ? (
          <SkeletonList rows={2} />
        ) : bound.length === 0 ? (
          <div className="empty">
            <span className="t">No agents yet</span>
            <span className="s">
              Attach an existing agent above, or build one for this workspace.
            </span>
          </div>
        ) : (
          <ul className="row-list">
            {bound.map((a) => (
              <li
                key={a.harnessId}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 'var(--sp-3)',
                  padding: '10px 0',
                }}
              >
                <span style={{ flex: 1, minWidth: 0 }}>
                  <Link to={`/app/agents/harness/${a.harnessId}`}>
                    {a.name ?? a.harnessId.slice(0, 8)}
                  </Link>
                  {a.summary != null && a.summary !== '' && (
                    <span className="sub" style={{ display: 'block' }}>
                      {a.summary}
                    </span>
                  )}
                </span>
                <button
                  type="button"
                  className="btn"
                  data-variant="ghost"
                  data-size="sm"
                  disabled={detach.isPending}
                  onClick={() => detach.mutate({ harnessId: a.harnessId, graphId })}
                  aria-label={`Detach ${a.name ?? 'agent'} from this workspace`}
                >
                  Detach
                </button>
              </li>
            ))}
          </ul>
        )}

        {(attach.isError || detach.isError) && (
          <p role="alert" className="callout" data-tone="error" style={{ margin: 0 }}>
            Couldn’t update this workspace’s agents. Please try again.
          </p>
        )}
      </div>
    </section>
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
  const cardGap = { display: 'flex', flexDirection: 'column', gap: 'var(--sp-3)' } as const;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-4)' }}>
      <Link
        to="/app/workspaces"
        className="btn"
        data-variant="ghost"
        data-size="sm"
        style={{ width: 'fit-content', marginLeft: -11 }}
      >
        ← Workspaces
      </Link>

      {isLoading ? (
        <SkeletonList rows={3} />
      ) : isError || graph === null ? (
        <p className="callout" data-tone="error" role="alert" style={{ margin: 0 }}>
          This workspace could not be found.
        </p>
      ) : (
        <>
          <header className="ws-head" style={{ marginBottom: 0 }}>
            <span className="ws-badge" aria-hidden="true">
              {initials(graph.name)}
            </span>
            <div>
              {renaming ? (
                <form className="control-row" onSubmit={onRename} aria-label="Rename workspace">
                  <div className="field grow">
                    <label htmlFor="ws-rename">Workspace name</label>
                    <input
                      id="ws-rename"
                      value={nameInput}
                      onChange={(e) => setNameInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Escape') {
                          e.preventDefault();
                          setRenaming(false);
                          setMgmtError(null);
                        }
                      }}
                    />
                  </div>
                  <button
                    type="submit"
                    className="btn"
                    data-variant="primary"
                    data-size="sm"
                    disabled={updateGraph.isPending || nameInput.trim() === ''}
                  >
                    {updateGraph.isPending ? 'Saving…' : 'Save'}
                  </button>
                  <button
                    type="button"
                    className="btn"
                    data-variant="secondary"
                    data-size="sm"
                    onClick={() => {
                      setRenaming(false);
                      setMgmtError(null);
                    }}
                  >
                    Cancel
                  </button>
                </form>
              ) : (
                <h1>{graph.name}</h1>
              )}
              <div className="meta">
                <span
                  className="status-pill"
                  data-state={graphPillState(graph.status)}
                  aria-label={`status: ${graph.status}`}
                >
                  <span
                    className={graphPillState(graph.status) === 'active' ? 'dot is-pulse' : 'dot'}
                    aria-hidden="true"
                  />
                  {graph.status}
                </span>
                <span>
                  {nf.format(graph.nodeCount)} nodes · {nf.format(graph.relationshipCount)} edges
                </span>
                <span className="sep" aria-hidden="true" />
                <span>created {formatDate(graph.createdAt)}</span>
                <span className="sep" aria-hidden="true" />
                <span>updated {formatDate(graph.updatedAt)}</span>
              </div>
              {graph.description !== null && graph.description !== '' && (
                <p
                  className="sub"
                  style={{
                    margin: '6px 0 0',
                    fontSize: 'var(--t-dense-size)',
                    color: 'var(--mute)',
                  }}
                >
                  {graph.description}
                </p>
              )}
            </div>
            {!renaming && (
              <div className="page-head-actions">
                <Link
                  to={`/app/workspaces/${graphId}/explorer`}
                  className="btn"
                  data-variant="secondary"
                  data-size="sm"
                >
                  Open explorer <IconArrowUpRight size={13} />
                </Link>
                <button
                  type="button"
                  className="btn"
                  data-variant="secondary"
                  data-size="sm"
                  onClick={() => {
                    setNameInput(graph.name);
                    setRenaming(true);
                    setMgmtError(null);
                  }}
                >
                  Rename
                </button>
                {confirmingDelete ? (
                  <>
                    <span style={{ fontSize: 'var(--t-mono-size)' }}>
                      Delete this workspace and its data?
                    </span>
                    <button
                      type="button"
                      className="btn"
                      data-variant="danger"
                      data-size="sm"
                      onClick={onDelete}
                      disabled={deleteGraph.isPending}
                    >
                      {deleteGraph.isPending ? 'Deleting…' : 'Delete'}
                    </button>
                    <button
                      type="button"
                      className="btn"
                      data-variant="secondary"
                      data-size="sm"
                      onClick={() => {
                        setConfirmingDelete(false);
                        setMgmtError(null);
                      }}
                    >
                      Cancel
                    </button>
                  </>
                ) : (
                  <button
                    type="button"
                    className="btn"
                    data-variant="danger"
                    data-size="sm"
                    onClick={() => {
                      setConfirmingDelete(true);
                      setMgmtError(null);
                    }}
                  >
                    Delete
                  </button>
                )}
              </div>
            )}
          </header>
          {mgmtError !== null && (
            <p role="alert" className="callout" data-tone="error" style={{ margin: 0 }}>
              {mgmtError}
            </p>
          )}

          <form className="card" onSubmit={onSearch} aria-label="Search this workspace">
            <div className="card-head">
              <div className="h">
                <h2>Search this workspace</h2>
                <span className="sub">Semantic, fulltext, or hybrid retrieval over the graph</span>
              </div>
            </div>
            <div className="card-body" style={cardGap}>
              <div className="control-row">
                <div className="field grow">
                  <label htmlFor="search-query">Query</label>
                  <input
                    id="search-query"
                    type="text"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Ask your knowledge…"
                  />
                </div>
                <div className="field">
                  <label htmlFor="search-mode">Mode</label>
                  <select
                    id="search-mode"
                    value={mode}
                    onChange={(e) => setMode(e.target.value as SearchMode)}
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
                  className="btn"
                  data-variant="primary"
                  disabled={search.isPending || query.trim() === ''}
                  aria-busy={search.isPending}
                >
                  {search.isPending ? 'Searching…' : 'Search'}
                </button>
              </div>
              {search.isError && (
                <p role="alert" className="callout" data-tone="error" style={{ margin: 0 }}>
                  Search failed. Please try again.
                </p>
              )}
              {/* Results are gated on isSuccess so a failed re-search never shows stale rows; the
                  region is a polite live region so arriving results (or none) are announced. */}
              <div role="status" aria-live="polite">
                {search.isSuccess && searchResults.length === 0 && (
                  <p style={{ margin: 0, fontSize: 'var(--t-dense-size)', color: 'var(--mute)' }}>
                    No results for that query.
                  </p>
                )}
                {search.isSuccess && searchResults.length > 0 && (
                  <ul
                    className="row-list"
                    aria-label="Search results"
                    style={{ border: '1px solid var(--rule)', borderRadius: 'var(--r-4)' }}
                  >
                    {searchResults.map((r) => {
                      const score = resultScore(r);
                      return (
                        <li key={r.id}>
                          <div className="top">
                            <span className="chip chip-sm">{r.type}</span>
                            {score !== null && <span className="meta">{score.toFixed(3)}</span>}
                          </div>
                          <p className="body">{resultText(r)}</p>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </div>
            </div>
          </form>

          <form className="card" onSubmit={onSubmit} aria-label="Add knowledge">
            <div className="card-head">
              <div className="h">
                <h2>Add knowledge</h2>
                <span className="sub">Paste content or upload a file — ingestion runs async</span>
              </div>
            </div>
            <div className="card-body" style={cardGap}>
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
              <div className="field">
                <label htmlFor="ingest-content">Content</label>
                <textarea
                  id="ingest-content"
                  className="mono"
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="Paste text, CSV, JSON or code…"
                  aria-invalid={error !== null}
                  aria-describedby={error !== null ? errorId : undefined}
                />
              </div>
              <div className="control-row">
                <div className="field">
                  <label htmlFor="ingest-type">Type</label>
                  <select
                    id="ingest-type"
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
                  type="submit"
                  className="btn"
                  data-variant="primary"
                  disabled={busy || content.trim() === ''}
                  aria-busy={busy}
                >
                  {busy ? 'Starting…' : 'Ingest'}
                </button>
              </div>
              <div
                style={{
                  borderTop: '1px solid var(--rule)',
                  paddingTop: 'var(--sp-3)',
                }}
              >
                <div className="control-row">
                  <div className="field grow">
                    <label htmlFor="ingest-file">Or upload a file</label>
                    <input
                      ref={fileRef}
                      id="ingest-file"
                      type="file"
                      onChange={(e) => setFileName(e.target.files?.[0]?.name ?? null)}
                    />
                  </div>
                  <button
                    type="button"
                    className="btn"
                    data-variant="secondary"
                    onClick={onUploadFile}
                    disabled={fileName === null || ingestFile.isPending}
                    aria-busy={ingestFile.isPending}
                  >
                    {ingestFile.isPending ? 'Uploading…' : 'Upload'}
                  </button>
                </div>
              </div>
            </div>
          </form>

          <WorkspaceAgents graphId={graphId} />

          <section className="card" aria-label="Ingestion history">
            <div className="card-head">
              <div className="h">
                <h2>Ingestion history</h2>
                <span className="sub">Jobs for this workspace · live while running</span>
              </div>
            </div>
            <div className="card-body no-pad">
              {documents.length === 0 ? (
                <div className="empty">
                  <span className="t">No ingestion yet</span>
                  <span className="s">Add some knowledge above to start the graph.</span>
                </div>
              ) : (
                <ul className="row-list">
                  {documents.map((job) => (
                    <JobRow key={job.id} job={job} />
                  ))}
                </ul>
              )}
            </div>
          </section>

          {/* key by graphId so the editor remounts (and re-hydrates) per graph — never carries one
              graph's labels/mode into another's Save. */}
          <OntologyEditor key={graphId} graphId={graphId} />
        </>
      )}
    </div>
  );
}
