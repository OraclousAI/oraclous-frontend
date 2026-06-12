// Explorer — the workspace knowledge graph, visualised (GET /v1/graph/{id}/subgraph). The
// renderer is the legacy 3D explorer, ported (clone-and-refactor, §7): Canvas2D with a
// hand-rolled 3D projection, force-simulation layouts, orbit/pan/zoom, hover/select/lasso,
// an Earth geo mode, plus search, type filters, a floating view dock, a node inspector with
// expand-neighbours, and the console's temporal "as of" lens. The DOM node-list panel stays —
// it is the keyboard path to node selection (Gate 3).
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ApiClientError, type GraphEdge, type GraphNode } from '@oraclous/api-client';
import { useGraph } from '../lib/graphs.js';
import {
  useApproveCandidate,
  useExpandNeighbors,
  useRejectCandidate,
  useSubgraph,
} from '../lib/explorer.js';
import { ExplorerCanvas } from '../components/explorer/ExplorerCanvas.js';
import {
  ContextMenu,
  ExplorerTopBar,
  FloatingDock,
  RightInspector,
  type CtxItem,
} from '../components/explorer/ExplorerPanels.js';
import { adaptSubgraph, edgeKey } from '../components/explorer/explorerAdapter.js';
import { useToast } from '../lib/toast.jsx';
import { createSim, type LayoutName, type OGSim } from '../components/explorer/explorerForces.js';
import type { OGData, OGNode } from '../components/explorer/explorerTypes.js';
import './explorer.css';

const MAX_NODES = 800;

interface RawGraph {
  readonly nodes: readonly GraphNode[];
  readonly edges: readonly GraphEdge[];
}

function mergeGraph(base: RawGraph | null, extra: RawGraph): RawGraph {
  const nodes = new Map<string, GraphNode>();
  for (const n of base?.nodes ?? []) nodes.set(n.id, n);
  for (const n of extra.nodes) if (!nodes.has(n.id)) nodes.set(n.id, n);
  const edges = new Map<string, GraphEdge>();
  // First-seen wins: base edges are real and DIRECTED; expand edges are synthesized from the
  // undirected /neighbors payload (direction guessed) and must never overwrite them.
  for (const e of base?.edges ?? []) edges.set(edgeKey(e), e);
  for (const e of extra.edges) {
    const k = edgeKey(e);
    if (!edges.has(k)) edges.set(k, e);
  }
  return { nodes: [...nodes.values()], edges: [...edges.values()] };
}

function parseTime(v: unknown): number | null {
  if (typeof v !== 'string' || v.trim() === '') return null;
  const t = Date.parse(v);
  return Number.isNaN(t) ? null : t;
}

function validAt(node: GraphNode, asOfMs: number): boolean {
  const vf = parseTime(node.properties['valid_from']);
  const vt = parseTime(node.properties['valid_to']);
  if (vf === null && vt === null) return true; // untemporal nodes are always shown
  if (vf !== null && asOfMs < vf) return false;
  if (vt !== null && asOfMs > vt) return false;
  return true;
}

export default function ExplorerPage() {
  const { graphId = '' } = useParams<{ graphId: string }>();
  const { graph: meta } = useGraph(graphId);
  const { subgraph, isLoading, isError } = useSubgraph(graphId, 250);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-3)' }}>
      <header
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 'var(--sp-3)',
          flexWrap: 'wrap',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--sp-2)' }}>
          <Link
            to={`/app/workspaces/${graphId}`}
            className="btn"
            data-variant="ghost"
            data-size="sm"
            style={{ marginLeft: -11 }}
          >
            ← {meta?.name ?? 'Graph'}
          </Link>
          <h1 className="t-h3" style={{ margin: 0 }}>
            Explorer
          </h1>
        </div>
        <span className="t-eyebrow">working depth</span>
      </header>

      <div className="ge">
        {isError ? (
          <div className="ge-center">
            <p>Couldn’t load the graph. Please try again.</p>
          </div>
        ) : isLoading ? (
          <div className="ge-center">
            <p>Loading the graph…</p>
          </div>
        ) : subgraph === null || subgraph.nodes.length === 0 ? (
          <div className="ge-center">
            <p>
              This graph has no data yet. Ingest a document to populate it, then come back to
              explore.
            </p>
          </div>
        ) : (
          // key: the route doesn't remount per :graphId — reset all explorer state per graph.
          <ExplorerView key={graphId} graphId={graphId} base={subgraph} />
        )}
      </div>
    </div>
  );
}

function resolveMessage(cause: unknown): string {
  if (ApiClientError.is(cause)) {
    // A concurrent reviewer already resolved this pair, or it no longer exists.
    if (cause.code === 'CONFLICT') return 'Another reviewer already resolved this pair.';
    if (cause.code === 'NOT_FOUND') return 'This candidate is no longer available.';
    return cause.message;
  }
  return 'Couldn’t resolve this candidate. Please try again.';
}

function ExplorerView({ graphId, base }: { graphId: string; base: RawGraph }) {
  const expand = useExpandNeighbors(graphId);
  const approveCandidate = useApproveCandidate(graphId);
  const rejectCandidate = useRejectCandidate(graphId);
  const toast = useToast();

  // ── Data: base subgraph + expanded neighbours, deduped, adapted to OGData ──
  const [extra, setExtra] = useState<RawGraph>({ nodes: [], edges: [] });
  const [expandError, setExpandError] = useState<string | null>(null);
  // Resolution review state: which row's merge chooser is open, which action is in flight (so the
  // pressed button — not its sibling — shows progress), and any error.
  const [confirmMergeId, setConfirmMergeId] = useState<string | null>(null);
  const [resolveBusy, setResolveBusy] = useState<{
    rowId: string;
    kind: 'a' | 'b' | 'reject';
  } | null>(null);
  const [resolveError, setResolveError] = useState<string | null>(null);
  const merged = useMemo(() => mergeGraph(base, extra), [base, extra]);
  const og: OGData = useMemo(() => adaptSubgraph(merged.nodes, merged.edges), [merged]);
  const rawProps = useMemo(
    () => new Map(merged.nodes.map((n) => [n.id, n.properties])),
    [merged.nodes]
  );

  // Entity-resolution candidates (KGS #269): SAME_AS_CANDIDATE edges flag pairs in the 0.85–0.92
  // similarity band — NOT auto-merged. The review queue: approve merges the pair (you pick the
  // survivor), reject records "not a duplicate" (#279). Both refetch the subgraph on success.
  const candidates = useMemo(() => {
    const byId = new Map(og.nodes.map((n) => [n.id, n]));
    return og.edges
      .filter((e) => e.rel === 'SAME_AS_CANDIDATE')
      .map((e) => ({ id: e.id, a: byId.get(e.source), b: byId.get(e.target), score: e.score }))
      .filter(
        (c): c is { id: string; a: OGNode; b: OGNode; score: number | null | undefined } =>
          c.a !== undefined && c.b !== undefined
      )
      .sort((x, y) => (y.score ?? 0) - (x.score ?? 0));
  }, [og]);

  // ── Simulation — rebuilt when the data set changes (expand), carrying positions AND pins;
  // static layouts use deterministic per-id placement, so re-applying the current layout to the
  // rebuilt sim leaves existing nodes where they were. ─
  const [layoutName, setLayoutName] = useState<LayoutName>('force');
  const layoutRef = useRef<LayoutName>('force');
  layoutRef.current = layoutName;
  const prevSimRef = useRef<OGSim | null>(null);
  const sim = useMemo(() => {
    const prev = prevSimRef.current;
    if (prev) {
      const pos = new Map(prev.nodes.map((n) => [n.id, n]));
      for (const n of og.nodes) {
        const p = pos.get(n.id);
        if (p) {
          n.x = p.x;
          n.y = p.y;
          n.vx = p.vx;
          n.vy = p.vy;
        }
      }
    }
    const s = createSim(layoutRef.current, og.nodes, og.edges);
    if (prev) {
      for (const [id, at] of prev.pins()) s.pin(id, at.x, at.y);
    }
    prevSimRef.current = s;
    return s;
  }, [og]);

  // ── View state ──────────────────────────────────────────────────────────────
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [hoverId, setHoverId] = useState<string | null>(null);
  const [panZoom, setPanZoom] = useState({ k: 0.85, x: 0, y: 0 });
  const [query, setQuery] = useState('');
  const [typeFilters, setTypeFilters] = useState<Set<string>>(
    () => new Set(og.types.map((t) => t.id))
  );
  const [ctx, setCtx] = useState<{ x: number; y: number } | null>(null);
  const [edgeOpacity, setEdgeOpacity] = useState(0.5);
  const [labelDensity, setLabelDensity] = useState<'none' | 'hover' | 'all'>('hover');
  const [view3d, setView3d] = useState(true);
  const [autoRotate, setAutoRotate] = useState(false);
  const [geoEnabled, setGeoEnabled] = useState(false);
  // Open by default: this panel is the keyboard/AT path to node selection (Gate 3).
  const [showList, setShowList] = useState(true);
  const [showCandidates, setShowCandidates] = useState(false);
  const [temporalOn, setTemporalOn] = useState(false);
  const [asOf, setAsOf] = useState('');
  const wrapRef = useRef<HTMLDivElement>(null);

  // Expanding the graph adds types — keep newly-arrived types visible by default.
  useEffect(() => {
    setTypeFilters((prev) => {
      const next = new Set(prev);
      for (const t of og.types) if (!prev.has(t.id)) next.add(t.id);
      return next;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [og.types.length]);

  // Apply layout CHANGES to the sim ('radial'/'hierarchy' focus on the first selected node).
  // Sim rebuilds are created in the current layout already — re-applying on [sim] would be
  // redundant (and before the jitter went deterministic, it re-scattered the graph).
  useEffect(() => {
    sim.setLayout(layoutName, [...selected][0] ?? null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [layoutName]);

  // Center pan/zoom on first mount.
  useEffect(() => {
    const r = wrapRef.current?.getBoundingClientRect();
    if (r) setPanZoom({ k: 0.65, x: r.width / 2 - 800 * 0.65, y: r.height / 2 - 500 * 0.65 });
  }, []);

  // ── Temporal "as of" lens ───────────────────────────────────────────────────
  const dimmedIds = useMemo(() => {
    if (!temporalOn) return null;
    const ms = Date.parse(asOf);
    if (Number.isNaN(ms)) return null;
    const dim = new Set<string>();
    for (const n of merged.nodes) if (!validAt(n, ms)) dim.add(n.id);
    return dim;
  }, [temporalOn, asOf, merged.nodes]);

  // ── Visible IDs by type filter + search ─────────────────────────────────────
  const visibleIds = useMemo(() => {
    const q = query.trim().toLowerCase();
    const set = new Set<string>();
    for (const n of og.nodes) {
      if (!typeFilters.has(n.type)) continue;
      if (q && !n.name.toLowerCase().includes(q)) continue;
      set.add(n.id);
    }
    return set;
  }, [typeFilters, query, og.nodes]);
  const visibleIdsArg = visibleIds.size === og.nodes.length ? null : visibleIds;

  const shownEdgeCount = useMemo(() => {
    let c = 0;
    for (const e of og.edges) {
      if (visibleIds.has(e.source) && visibleIds.has(e.target)) c++;
    }
    return c;
  }, [visibleIds, og.edges]);

  const suggestions = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    return og.nodes.filter((n) => n.name.toLowerCase().includes(q)).slice(0, 12);
  }, [query, og.nodes]);

  const selectedNode: OGNode | null =
    selected.size > 0 ? (og.nodes.find((n) => n.id === [...selected][0]) ?? null) : null;
  const rightCollapsed = !selectedNode;

  // ── Handlers ────────────────────────────────────────────────────────────────
  const onPick = useCallback((id: string | null, additive: boolean) => {
    if (!id) {
      setSelected(new Set());
      return;
    }
    setSelected((prev) => {
      if (additive) {
        const next = new Set(prev);
        if (next.has(id)) next.delete(id);
        else next.add(id);
        return next;
      }
      return new Set([id]);
    });
  }, []);

  const onLasso = useCallback((ids: string[], additive: boolean) => {
    if (!ids.length) return;
    setSelected((prev) => {
      const next = additive ? new Set(prev) : new Set<string>();
      ids.forEach((i) => next.add(i));
      return next;
    });
  }, []);

  const onResetView = useCallback(() => {
    const rr = wrapRef.current?.getBoundingClientRect();
    if (rr) setPanZoom({ k: 0.65, x: rr.width / 2 - 800 * 0.65, y: rr.height / 2 - 500 * 0.65 });
  }, []);

  async function onExpand(nodeId: string) {
    setExpandError(null);
    if (og.nodes.length >= MAX_NODES) {
      setExpandError('This view is already large — open a more focused graph to keep expanding.');
      return;
    }
    try {
      const neighbours = await expand.mutateAsync(nodeId);
      setExtra((prev) => {
        const nodes = new Map(prev.nodes.map((n) => [n.id, n]));
        const edges = new Map(prev.edges.map((e) => [edgeKey(e), e]));
        for (const m of neighbours) {
          if (!nodes.has(m.id)) nodes.set(m.id, m);
          const rel = m.properties['relationship'];
          const e: GraphEdge = {
            source: nodeId,
            target: m.id,
            type: typeof rel === 'string' && rel !== '' ? rel : 'RELATED',
            // /neighbors carries no edge-level data; the synthesized edge has no score/weight.
            properties: {},
          };
          // First-seen wins — a synthesized direction never replaces an earlier expand's edge.
          const k = edgeKey(e);
          if (!edges.has(k)) edges.set(k, e);
        }
        return { nodes: [...nodes.values()], edges: [...edges.values()] };
      });
    } catch {
      setExpandError('Couldn’t expand this node. Please try again.');
    }
  }

  // A resolved pair must leave the queue for good: the success path invalidates the base subgraph,
  // but a candidate endpoint pulled in by click-to-expand also lives in `extra` (and /neighbors can
  // synthesize a SAME_AS_CANDIDATE edge), which would otherwise re-add the row. Prune both: the
  // candidate edge always, and the merged-away node on an approve.
  function pruneResolved(idA: string, idB: string, mergedAwayId: string | null) {
    const key = edgeKey({ source: idA, target: idB, type: 'SAME_AS_CANDIDATE', properties: {} });
    setExtra((prev) => ({
      nodes: mergedAwayId === null ? prev.nodes : prev.nodes.filter((n) => n.id !== mergedAwayId),
      edges: prev.edges.filter((e) => edgeKey(e) !== key),
    }));
  }

  // Approve a candidate pair (merge): `keepId` survives, `dropId` folds into it. Refreshes the
  // queue, prunes any expand copy, drops a now-merged selection, and confirms via a toast.
  async function onApproveCandidate(
    keepId: string,
    dropId: string,
    candidateRowId: string,
    kind: 'a' | 'b'
  ) {
    if (resolveBusy !== null) return;
    setResolveError(null);
    setResolveBusy({ rowId: candidateRowId, kind });
    try {
      const res = await approveCandidate.mutateAsync({
        canonicalNodeId: keepId,
        otherNodeId: dropId,
      });
      pruneResolved(keepId, dropId, res.mergedId);
      setConfirmMergeId(null);
      setSelected((prev) => {
        if (!prev.has(res.mergedId)) return prev;
        const next = new Set(prev);
        next.delete(res.mergedId);
        return next;
      });
      toast.success(
        res.repointedEdges > 0
          ? `Merged — kept one entity, moved ${res.repointedEdges} relationship${
              res.repointedEdges === 1 ? '' : 's'
            }.`
          : 'Entities merged.'
      );
    } catch (cause) {
      setResolveError(resolveMessage(cause));
    } finally {
      setResolveBusy(null);
    }
  }

  // Reject a candidate pair (not a duplicate): drops the candidate edge so it stops resurfacing.
  async function onRejectCandidate(idA: string, idB: string, candidateRowId: string) {
    if (resolveBusy !== null) return;
    setResolveError(null);
    setResolveBusy({ rowId: candidateRowId, kind: 'reject' });
    try {
      await rejectCandidate.mutateAsync({ nodeIdA: idA, nodeIdB: idB });
      pruneResolved(idA, idB, null);
      toast.success('Marked as not a match.');
    } catch (cause) {
      setResolveError(resolveMessage(cause));
    } finally {
      setResolveBusy(null);
    }
  }

  const ctxItems = (): CtxItem[] => [
    { label: 'Reset view', onClick: onResetView },
    { divider: true },
    {
      label: 'Pin selected',
      onClick: () =>
        selected.forEach((id) => {
          const n = og.nodes.find((x) => x.id === id);
          if (n) sim.pin(id, n.x, n.y);
        }),
    },
    { label: 'Unpin selected', onClick: () => selected.forEach((id) => sim.unpin(id)) },
  ];

  return (
    <div className="og-app" style={{ gridTemplateColumns: `1fr ${rightCollapsed ? 28 : 330}px` }}>
      <ExplorerTopBar
        totals={{ ...og.totals, shown: visibleIds.size, shownEdges: shownEdgeCount }}
        query={query}
        setQuery={setQuery}
        typeFilters={typeFilters}
        setTypeFilters={setTypeFilters}
        types={og.types}
        suggestions={suggestions}
        onPickSuggestion={(id) => {
          setQuery('');
          setSelected(new Set([id]));
        }}
      >
        <button
          type="button"
          className={'og-chip ' + (showList ? 'on' : 'off')}
          aria-pressed={showList}
          onClick={() => setShowList((v) => !v)}
        >
          Nodes
        </button>
        {candidates.length > 0 && (
          <button
            type="button"
            className={'og-chip ' + (showCandidates ? 'on' : 'off')}
            aria-pressed={showCandidates}
            onClick={() => setShowCandidates((v) => !v)}
          >
            Candidates <span className="og-count num">{candidates.length}</span>
          </button>
        )}
        <label className={'og-chip ' + (temporalOn ? 'on' : 'off')}>
          <input
            type="checkbox"
            checked={temporalOn}
            onChange={(e) => setTemporalOn(e.target.checked)}
          />
          As of
        </label>
        {temporalOn && (
          <input
            type="datetime-local"
            className="og-date"
            value={asOf}
            onChange={(e) => setAsOf(e.target.value)}
            aria-label="As of date and time"
          />
        )}
      </ExplorerTopBar>

      <div className="og-canvas-wrap" ref={wrapRef}>
        <ExplorerCanvas
          sim={sim}
          algoRun={null}
          focusId={null}
          selected={selected}
          onPick={onPick}
          hoverId={hoverId}
          onHover={setHoverId}
          params={{ stepIndex: 0 }}
          panZoom={panZoom}
          setPanZoom={setPanZoom}
          onLasso={onLasso}
          onCanvasContext={(e) => setCtx({ x: e.clientX, y: e.clientY })}
          visibleIds={visibleIdsArg}
          edgeOpacity={edgeOpacity}
          labelDensity={labelDensity}
          view3d={view3d}
          autoRotate={autoRotate}
          geoEnabled={geoEnabled}
          geoAltitude={1.4}
          nodeScale={0.8}
          dimmedIds={dimmedIds}
          tick
        />
        {ctx && <ContextMenu x={ctx.x} y={ctx.y} onClose={() => setCtx(null)} items={ctxItems()} />}

        <FloatingDock
          panZoom={panZoom}
          setPanZoom={setPanZoom}
          layoutName={layoutName}
          setLayoutName={(v) => setLayoutName(v as LayoutName)}
          onReset={onResetView}
          edgeOpacity={edgeOpacity}
          setEdgeOpacity={setEdgeOpacity}
          labelDensity={labelDensity}
          setLabelDensity={setLabelDensity}
          view3d={view3d}
          setView3d={setView3d}
          geoEnabled={geoEnabled}
          setGeoEnabled={setGeoEnabled}
          autoRotate={autoRotate}
          setAutoRotate={setAutoRotate}
        />

        {/* Node list — the keyboard path to selection (every row a real button). */}
        {showList && (
          <NodeListPanel
            nodes={og.nodes}
            selectedId={selectedNode?.id ?? null}
            onSelect={(id) => setSelected(new Set([id]))}
            onClose={() => setShowList(false)}
          />
        )}

        {/* SAME_AS_CANDIDATE review queue — the entity-resolution HITL surface (#279). */}
        {showCandidates && candidates.length > 0 && (
          <CandidatesPanel
            candidates={candidates}
            busy={resolveBusy}
            error={resolveError}
            confirmMergeId={confirmMergeId}
            onSelect={(id) => setSelected(new Set([id]))}
            onStartMerge={(rowId) => {
              setResolveError(null);
              setConfirmMergeId(rowId);
            }}
            onCancelMerge={() => setConfirmMergeId(null)}
            onApprove={onApproveCandidate}
            onReject={onRejectCandidate}
            onClose={() => {
              setShowCandidates(false);
              setConfirmMergeId(null);
              setResolveError(null);
            }}
          />
        )}
      </div>

      <RightInspector
        node={selectedNode}
        rawProperties={selectedNode ? (rawProps.get(selectedNode.id) ?? null) : null}
        edges={og.edges}
        nodes={og.nodes}
        communities={og.communities}
        onPick={(id) => setSelected(new Set([id]))}
        onExpand={(id) => void onExpand(id)}
        onPin={(id) => {
          const n = og.nodes.find((x) => x.id === id);
          if (n) sim.pin(id, n.x, n.y);
        }}
        onUnpin={(id) => sim.unpin(id)}
        expanding={expand.isPending}
        expandError={expandError}
        collapsed={rightCollapsed}
        onToggleCollapse={() => setSelected(new Set())}
      />
    </div>
  );
}

function NodeListPanel({
  nodes,
  selectedId,
  onSelect,
  onClose,
}: {
  nodes: readonly OGNode[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  onClose: () => void;
}) {
  const [q, setQ] = useState('');
  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    const list =
      needle === ''
        ? nodes
        : nodes.filter(
            (n) => n.name.toLowerCase().includes(needle) || n.type.toLowerCase().includes(needle)
          );
    return list.slice(0, 200);
  }, [nodes, q]);
  return (
    <aside className="ge-panel ge-panel--list" aria-label="Node list">
      <div className="head">
        <span className="eyebrow">Nodes ({nodes.length})</span>
        <button type="button" onClick={onClose} className="close" aria-label="Close node list">
          ×
        </button>
      </div>
      <input
        type="search"
        className="ge-search"
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="Filter nodes…"
        aria-label="Filter nodes"
      />
      <ul className="ge-list">
        {filtered.map((n) => {
          const isSel = n.id === selectedId;
          return (
            <li key={n.id}>
              <button
                type="button"
                className="ge-list-item"
                onClick={() => onSelect(n.id)}
                aria-current={isSel ? 'true' : undefined}
              >
                <span className="type">{n.type}</span>
                <span className="label">{n.name}</span>
              </button>
            </li>
          );
        })}
        {filtered.length === 0 && <li className="ge-list-empty">No matching nodes.</li>}
      </ul>
    </aside>
  );
}

interface Candidate {
  id: string;
  a: OGNode;
  b: OGNode;
  score: number | null | undefined;
}

type ResolveBusy = { rowId: string; kind: 'a' | 'b' | 'reject' } | null;

// A short, stable disambiguator for a node id (the last 6 hex of the deterministic id) — duplicate
// display names are the COMMON case for a candidate pair, so the survivor choice must distinguish
// the two by more than their (identical) name.
const idTag = (id: string): string => id.slice(-6);

// Entity-resolution review queue: the SAME_AS_CANDIDATE pairs the resolver flagged but did not
// merge (0.85–0.92 band). Each name jumps to that node. "Merge" opens a survivor chooser (the
// merge is irreversible, so it's a deliberate two-step, like unpublish); "Not a match" rejects the
// pair (#279). Resolved pairs leave the queue.
function CandidatesPanel({
  candidates,
  busy,
  error,
  confirmMergeId,
  onSelect,
  onStartMerge,
  onCancelMerge,
  onApprove,
  onReject,
  onClose,
}: {
  candidates: readonly Candidate[];
  busy: ResolveBusy;
  error: string | null;
  confirmMergeId: string | null;
  onSelect: (id: string) => void;
  onStartMerge: (rowId: string) => void;
  onCancelMerge: () => void;
  onApprove: (keepId: string, dropId: string, candidateRowId: string, kind: 'a' | 'b') => void;
  onReject: (idA: string, idB: string, candidateRowId: string) => void;
  onClose: () => void;
}) {
  const anyBusy = busy !== null;
  const liveLabel =
    busy === null ? '' : busy.kind === 'reject' ? 'Removing candidate…' : 'Merging entities…';
  return (
    <aside
      className="ge-panel ge-panel--candidates"
      aria-label="Resolution candidates"
      aria-busy={anyBusy}
    >
      <div className="head">
        <span className="eyebrow">Candidates ({candidates.length})</span>
        <button type="button" onClick={onClose} className="close" aria-label="Close candidates">
          ×
        </button>
      </div>
      <p className="ge-candidates-note">
        Possible duplicate entities (similarity 0.85–0.92) — flagged, not merged. Merge them
        (keeping the entity you choose), or mark them as not a match.
      </p>
      {error !== null && (
        <p className="ge-candidates-error" role="alert">
          {error}
        </p>
      )}
      <span className="ge-sr-live" role="status" aria-live="polite">
        {liveLabel}
      </span>
      <ul className="ge-list">
        {candidates.map((c) => {
          const choosing = confirmMergeId === c.id;
          const rowBusy = busy?.rowId === c.id;
          return (
            <li key={c.id}>
              <div className="ge-candidate">
                <button
                  type="button"
                  className="ge-candidate-node"
                  onClick={() => onSelect(c.a.id)}
                  title={`${c.a.name} · ${c.a.type} · #${idTag(c.a.id)}`}
                >
                  {c.a.name}
                </button>
                <span className="ge-candidate-sep" aria-hidden="true">
                  ≈
                </span>
                <button
                  type="button"
                  className="ge-candidate-node"
                  onClick={() => onSelect(c.b.id)}
                  title={`${c.b.name} · ${c.b.type} · #${idTag(c.b.id)}`}
                >
                  {c.b.name}
                </button>
                {c.score != null && (
                  <span
                    className="ge-candidate-score num"
                    title={`similarity ${c.score.toFixed(2)}`}
                  >
                    {c.score.toFixed(2)}
                  </span>
                )}
              </div>

              {choosing ? (
                <div className="ge-candidate-actions" role="group" aria-label="Keep which entity?">
                  <span className="ge-cand-q">Keep which?</span>
                  <button
                    type="button"
                    className="ge-cand-btn"
                    disabled={anyBusy}
                    onClick={() => onApprove(c.a.id, c.b.id, c.id, 'a')}
                  >
                    {rowBusy && busy?.kind === 'a' ? '…' : `${c.a.name} `}
                    <span className="ge-cand-id">#{idTag(c.a.id)}</span>
                  </button>
                  <button
                    type="button"
                    className="ge-cand-btn"
                    disabled={anyBusy}
                    onClick={() => onApprove(c.b.id, c.a.id, c.id, 'b')}
                  >
                    {rowBusy && busy?.kind === 'b' ? '…' : `${c.b.name} `}
                    <span className="ge-cand-id">#{idTag(c.b.id)}</span>
                  </button>
                  <button
                    type="button"
                    className="ge-cand-btn ge-cand-btn--ghost"
                    disabled={anyBusy}
                    onClick={onCancelMerge}
                  >
                    Cancel
                  </button>
                </div>
              ) : (
                <div className="ge-candidate-actions">
                  <button
                    type="button"
                    className="ge-cand-btn"
                    disabled={anyBusy}
                    onClick={() => onStartMerge(c.id)}
                  >
                    Merge…
                  </button>
                  <button
                    type="button"
                    className="ge-cand-btn ge-cand-btn--reject"
                    disabled={anyBusy}
                    onClick={() => onReject(c.a.id, c.b.id, c.id)}
                  >
                    {rowBusy && busy?.kind === 'reject' ? '…' : 'Not a match'}
                  </button>
                </div>
              )}
            </li>
          );
        })}
      </ul>
    </aside>
  );
}
