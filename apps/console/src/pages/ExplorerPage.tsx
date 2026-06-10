// Explorer — the workspace knowledge graph, visualised (GET /v1/graph/{id}/subgraph). The
// renderer is the legacy 3D explorer, ported (clone-and-refactor, §7): Canvas2D with a
// hand-rolled 3D projection, force-simulation layouts, orbit/pan/zoom, hover/select/lasso,
// an Earth geo mode, plus search, type filters, a floating view dock, a node inspector with
// expand-neighbours, and the console's temporal "as of" lens. The DOM node-list panel stays —
// it is the keyboard path to node selection (Gate 3).
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import type { GraphEdge, GraphNode } from '@oraclous/api-client';
import { useGraph } from '../lib/graphs.js';
import { useExpandNeighbors, useSubgraph } from '../lib/explorer.js';
import { ExplorerCanvas } from '../components/explorer/ExplorerCanvas.js';
import {
  ContextMenu,
  ExplorerTopBar,
  FloatingDock,
  RightInspector,
  type CtxItem,
} from '../components/explorer/ExplorerPanels.js';
import { adaptSubgraph, edgeKey } from '../components/explorer/explorerAdapter.js';
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
  for (const e of base?.edges ?? []) edges.set(edgeKey(e), e);
  for (const e of extra.edges) edges.set(edgeKey(e), e);
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

function ExplorerView({ graphId, base }: { graphId: string; base: RawGraph }) {
  const expand = useExpandNeighbors(graphId);

  // ── Data: base subgraph + expanded neighbours, deduped, adapted to OGData ──
  const [extra, setExtra] = useState<RawGraph>({ nodes: [], edges: [] });
  const [expandError, setExpandError] = useState<string | null>(null);
  const merged = useMemo(() => mergeGraph(base, extra), [base, extra]);
  const og: OGData = useMemo(() => adaptSubgraph(merged.nodes, merged.edges), [merged]);
  const rawProps = useMemo(
    () => new Map(merged.nodes.map((n) => [n.id, n.properties])),
    [merged.nodes]
  );

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
  const [showList, setShowList] = useState(false);
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
          };
          edges.set(edgeKey(e), e);
        }
        return { nodes: [...nodes.values()], edges: [...edges.values()] };
      });
    } catch {
      setExpandError('Couldn’t expand this node. Please try again.');
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
