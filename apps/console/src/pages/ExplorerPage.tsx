// Explorer — an immersive sphere visualisation of a graph (GET /v1/graph/{id}/subgraph). Drag to
// rotate, click (or pick from the keyboard-navigable node list) to inspect a node, expand its
// neighbours, and scrub a temporal "as of" lens. The renderer (GraphSphere) is a Canvas2D 3D view.
// Chrome styled per the handoff explorer.html (dark working-depth surface, scoped .ge palette).
import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import type { GraphEdge, GraphNode, Subgraph } from '@oraclous/api-client';
import { useGraph } from '../lib/graphs.js';
import { useExpandNeighbors, useSubgraph } from '../lib/explorer.js';
import { GraphSphere, nodeLabel } from '../components/explorer/GraphSphere.js';
import { IconList } from '../icons/index.js';
import './explorer.css';

interface GraphData {
  readonly nodes: readonly GraphNode[];
  readonly edges: readonly GraphEdge[];
}

// Unordered key: the sphere draws undirected lines, and /neighbors is undirected — so a base edge
// B→A and an expand-synthesized A→B of the same type are the same edge (dedupe → no double-draw, no
// degree double-count).
const edgeKey = (e: GraphEdge): string => {
  const [a, b] = e.source <= e.target ? [e.source, e.target] : [e.target, e.source];
  return `${a}|${b}|${e.type}`;
};

const MAX_NODES = 800;

function mergeGraph(base: Subgraph | null, extra: GraphData): GraphData {
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

function NodePanel({
  node,
  onClose,
  onExpand,
  expanding,
  expandError,
}: {
  node: GraphNode;
  onClose: () => void;
  onExpand: (node: GraphNode) => void;
  expanding: boolean;
  expandError: string | null;
}) {
  const entries = Object.entries(node.properties)
    .filter(
      ([k, v]) =>
        k !== 'embedding' &&
        (typeof v === 'string' || typeof v === 'number' || typeof v === 'boolean')
    )
    .slice(0, 12);
  return (
    <aside className="ge-panel ge-panel--inspector" aria-label="Node detail">
      <div className="head">
        <span className="eyebrow">{node.type}</span>
        <button type="button" onClick={onClose} className="close" aria-label="Close detail">
          ×
        </button>
      </div>
      <h2>{nodeLabel(node)}</h2>
      <button type="button" className="ge-btn" onClick={() => onExpand(node)} disabled={expanding}>
        {expanding ? 'Expanding…' : 'Expand neighbours'}
      </button>
      {expandError !== null && (
        <p role="alert" className="err">
          {expandError}
        </p>
      )}
      {entries.length === 0 ? (
        <p className="muted">No additional properties.</p>
      ) : (
        <dl className="ge-dl">
          {entries.map(([k, v]) => {
            const text = String(v);
            return (
              <div key={k}>
                <dt>{k}</dt>
                <dd>{text.length > 220 ? `${text.slice(0, 220)}…` : text}</dd>
              </div>
            );
          })}
        </dl>
      )}
    </aside>
  );
}

function NodeListPanel({
  nodes,
  selectedId,
  onSelect,
  onClose,
}: {
  nodes: readonly GraphNode[];
  selectedId: string | null;
  onSelect: (node: GraphNode) => void;
  onClose: () => void;
}) {
  const [q, setQ] = useState('');
  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    const list =
      needle === ''
        ? nodes
        : nodes.filter(
            (n) =>
              nodeLabel(n).toLowerCase().includes(needle) || n.type.toLowerCase().includes(needle)
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
                onClick={() => onSelect(n)}
                aria-current={isSel ? 'true' : undefined}
              >
                <span className="type">{n.type}</span>
                <span className="label">{nodeLabel(n)}</span>
              </button>
            </li>
          );
        })}
        {filtered.length === 0 && <li className="ge-list-empty">No matching nodes.</li>}
      </ul>
    </aside>
  );
}

export default function ExplorerPage() {
  const { graphId = '' } = useParams<{ graphId: string }>();
  const { graph: meta } = useGraph(graphId);
  const { subgraph, isLoading, isError } = useSubgraph(graphId, 250);
  const expand = useExpandNeighbors(graphId);

  const [selected, setSelected] = useState<GraphNode | null>(null);
  const [extra, setExtra] = useState<GraphData>({ nodes: [], edges: [] });
  const [showList, setShowList] = useState(false);
  const [temporalOn, setTemporalOn] = useState(false);
  const [asOf, setAsOf] = useState('');
  const [expandError, setExpandError] = useState<string | null>(null);

  // The page isn't remounted when :graphId changes — clear all per-graph state.
  useEffect(() => {
    setSelected(null);
    setExtra({ nodes: [], edges: [] });
    setShowList(false);
    setTemporalOn(false);
    setExpandError(null);
  }, [graphId]);

  const graph = useMemo(() => mergeGraph(subgraph, extra), [subgraph, extra]);

  const dimmedIds = useMemo(() => {
    if (!temporalOn) return null;
    const ms = Date.parse(asOf);
    if (Number.isNaN(ms)) return null;
    const dim = new Set<string>();
    for (const n of graph.nodes) if (!validAt(n, ms)) dim.add(n.id);
    return dim;
  }, [temporalOn, asOf, graph.nodes]);

  async function onExpand(node: GraphNode) {
    setExpandError(null);
    if (graph.nodes.length >= MAX_NODES) {
      setExpandError('This view is already large — open a more focused graph to keep expanding.');
      return;
    }
    try {
      const neighbours = await expand.mutateAsync(node.id);
      setExtra((prev) => {
        const nodes = new Map(prev.nodes.map((n) => [n.id, n]));
        const edges = new Map(prev.edges.map((e) => [edgeKey(e), e]));
        for (const m of neighbours) {
          if (!nodes.has(m.id)) nodes.set(m.id, m);
          const rel = m.properties['relationship'];
          const e: GraphEdge = {
            source: node.id,
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

  const nodes = graph.nodes;
  const edges = graph.edges;
  const ready = subgraph !== null && nodes.length > 0;
  const nf = new Intl.NumberFormat();

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
        ) : nodes.length === 0 ? (
          <div className="ge-center">
            <p>
              This graph has no data yet. Ingest a document to populate it, then come back to
              explore.
            </p>
          </div>
        ) : (
          <>
            <GraphSphere
              nodes={nodes}
              edges={edges}
              selectedId={selected?.id ?? null}
              onSelect={setSelected}
              dimmedIds={dimmedIds}
            />

            <div className="ge-fdock">
              <button
                type="button"
                className="ge-chip"
                onClick={() => setShowList((v) => !v)}
                aria-pressed={showList}
              >
                <IconList size={13} /> Nodes
              </button>
              <label className={temporalOn ? 'ge-chip on' : 'ge-chip'}>
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
                  className="ge-date"
                  value={asOf}
                  onChange={(e) => setAsOf(e.target.value)}
                  aria-label="As of date and time"
                />
              )}
            </div>

            {ready && (
              <div className="ge-meta">
                <span className="num">
                  {nf.format(nodes.length)} nodes · {nf.format(edges.length)} edges
                </span>
                <span>·</span>
                <span>drag to rotate · click a node</span>
              </div>
            )}

            {showList && (
              <NodeListPanel
                nodes={nodes}
                selectedId={selected?.id ?? null}
                onSelect={setSelected}
                onClose={() => setShowList(false)}
              />
            )}
            {selected !== null && (
              <NodePanel
                node={selected}
                onClose={() => setSelected(null)}
                onExpand={onExpand}
                expanding={expand.isPending}
                expandError={expandError}
              />
            )}
          </>
        )}
      </div>
    </div>
  );
}
