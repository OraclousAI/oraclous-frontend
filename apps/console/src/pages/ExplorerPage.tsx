// Explorer — an immersive sphere visualisation of a graph (GET /v1/graph/{id}/subgraph). Drag to
// rotate, click (or pick from the keyboard-navigable node list) to inspect a node, expand its
// neighbours, and scrub a temporal "as of" lens. The renderer (GraphSphere) is a Canvas2D 3D view.
import { useEffect, useMemo, useState, type CSSProperties } from 'react';
import { Link, useParams } from 'react-router-dom';
import type { GraphEdge, GraphNode, Subgraph } from '@oraclous/api-client';
import { useGraph } from '../lib/graphs.js';
import { useExpandNeighbors, useSubgraph } from '../lib/explorer.js';
import { GraphSphere, nodeLabel } from '../components/explorer/GraphSphere.js';

interface GraphData {
  readonly nodes: readonly GraphNode[];
  readonly edges: readonly GraphEdge[];
}

const edgeKey = (e: GraphEdge): string => `${e.source}|${e.target}|${e.type}`;

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
    <aside style={styles.panel} aria-label="Node detail">
      <div style={styles.panelHead}>
        <span style={styles.panelType}>{node.type}</span>
        <button type="button" onClick={onClose} style={styles.close} aria-label="Close detail">
          ×
        </button>
      </div>
      <h2 style={styles.panelTitle}>{nodeLabel(node)}</h2>
      <button
        type="button"
        onClick={() => onExpand(node)}
        disabled={expanding}
        style={expanding ? { ...styles.expand, ...styles.expandBusy } : styles.expand}
      >
        {expanding ? 'Expanding…' : 'Expand neighbours'}
      </button>
      {expandError !== null && (
        <p role="alert" style={styles.panelError}>
          {expandError}
        </p>
      )}
      {entries.length === 0 ? (
        <p style={styles.panelMuted}>No additional properties.</p>
      ) : (
        <dl style={styles.dl}>
          {entries.map(([k, v]) => {
            const text = String(v);
            return (
              <div key={k} style={styles.row}>
                <dt style={styles.dt}>{k}</dt>
                <dd style={styles.dd}>{text.length > 220 ? `${text.slice(0, 220)}…` : text}</dd>
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
    <aside style={styles.listPanel} aria-label="Node list">
      <div style={styles.panelHead}>
        <span style={styles.panelType}>Nodes ({nodes.length})</span>
        <button type="button" onClick={onClose} style={styles.close} aria-label="Close node list">
          ×
        </button>
      </div>
      <input
        type="search"
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="Filter nodes…"
        aria-label="Filter nodes"
        style={styles.listSearch}
      />
      <ul style={styles.list}>
        {filtered.map((n) => {
          const isSel = n.id === selectedId;
          return (
            <li key={n.id}>
              <button
                type="button"
                onClick={() => onSelect(n)}
                style={isSel ? { ...styles.listItem, ...styles.listItemSel } : styles.listItem}
                aria-current={isSel ? 'true' : undefined}
              >
                <span style={styles.listItemType}>{n.type}</span>
                <span style={styles.listItemLabel}>{nodeLabel(n)}</span>
              </button>
            </li>
          );
        })}
        {filtered.length === 0 && <li style={styles.listEmpty}>No matching nodes.</li>}
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

  return (
    <div style={styles.page}>
      <header style={styles.header}>
        <div style={styles.headerLeft}>
          <Link to={`/app/workspaces/${graphId}`} style={styles.back}>
            ← {meta?.name ?? 'Graph'}
          </Link>
          <h1 style={styles.h1}>Explorer</h1>
        </div>
        {ready && (
          <span style={styles.counts}>
            {nodes.length} nodes · {edges.length} edges · drag to rotate, click a node
          </span>
        )}
      </header>

      <div style={styles.stage}>
        {isError ? (
          <div style={styles.center}>
            <p style={styles.msg}>Couldn’t load the graph. Please try again.</p>
          </div>
        ) : isLoading ? (
          <div style={styles.center}>
            <p style={styles.msg}>Loading the graph…</p>
          </div>
        ) : nodes.length === 0 ? (
          <div style={styles.center}>
            <p style={styles.msg}>
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

            <div style={styles.toolbar}>
              <button
                type="button"
                onClick={() => setShowList((v) => !v)}
                aria-pressed={showList}
                style={showList ? { ...styles.chip, ...styles.chipOn } : styles.chip}
              >
                ☰ Nodes
              </button>
              <label style={temporalOn ? { ...styles.chip, ...styles.chipOn } : styles.chip}>
                <input
                  type="checkbox"
                  checked={temporalOn}
                  onChange={(e) => setTemporalOn(e.target.checked)}
                  style={styles.chkbox}
                />
                As of
              </label>
              {temporalOn && (
                <input
                  type="datetime-local"
                  value={asOf}
                  onChange={(e) => setAsOf(e.target.value)}
                  aria-label="As of date and time"
                  style={styles.dateInput}
                />
              )}
            </div>

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

const overlayPanel: CSSProperties = {
  position: 'absolute',
  width: 300,
  maxHeight: 'calc(100% - 28px)',
  overflowY: 'auto',
  display: 'grid',
  gap: 10,
  padding: 16,
  borderRadius: 10,
  border: '1px solid rgba(150, 170, 210, 0.22)',
  background: 'rgba(14, 20, 38, 0.92)',
  backdropFilter: 'blur(6px)',
  boxShadow: '0 8px 30px rgba(0, 0, 0, 0.4)',
};

const styles = {
  page: { display: 'grid', gap: 14 },
  header: {
    display: 'flex',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    gap: 12,
    flexWrap: 'wrap',
  },
  headerLeft: { display: 'flex', alignItems: 'baseline', gap: 12, flexWrap: 'wrap' },
  back: { fontSize: 13, color: 'var(--ink, #0b1220)', textDecoration: 'none' },
  h1: { margin: 0, fontSize: 22, fontWeight: 600, color: 'var(--ink, #0b1220)' },
  counts: { fontSize: 12.5, color: 'var(--mute, #65686f)' },
  stage: {
    position: 'relative',
    height: 'calc(100dvh - 150px)',
    minHeight: 440,
    borderRadius: 12,
    overflow: 'hidden',
    border: '1px solid var(--rule, #d7d6d2)',
    background: '#070a14',
  },
  center: { position: 'absolute', inset: 0, display: 'grid', placeItems: 'center', padding: 24 },
  msg: {
    margin: 0,
    maxWidth: 420,
    textAlign: 'center',
    fontSize: 14,
    lineHeight: 1.5,
    color: 'rgba(244, 244, 242, 0.82)',
  },
  toolbar: { position: 'absolute', top: 14, left: 14, display: 'flex', gap: 8, flexWrap: 'wrap' },
  chip: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 6,
    padding: '6px 10px',
    fontSize: 12.5,
    color: 'rgba(244, 244, 242, 0.9)',
    background: 'rgba(14, 20, 38, 0.85)',
    border: '1px solid rgba(150, 170, 210, 0.28)',
    borderRadius: 8,
    cursor: 'pointer',
    whiteSpace: 'nowrap',
  },
  chipOn: { borderColor: '#10d88a', color: '#f4f4f2' },
  chkbox: { accentColor: '#10d88a', cursor: 'pointer' },
  dateInput: {
    padding: '5px 8px',
    fontSize: 12.5,
    color: '#f4f4f2',
    background: 'rgba(14, 20, 38, 0.85)',
    border: '1px solid rgba(150, 170, 210, 0.28)',
    borderRadius: 8,
    colorScheme: 'dark',
  },
  panel: { ...overlayPanel, top: 14, right: 14 },
  listPanel: { ...overlayPanel, top: 56, left: 14, bottom: 14, maxHeight: 'calc(100% - 70px)' },
  panelHead: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  panelType: {
    fontSize: 11,
    fontWeight: 600,
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
    color: '#10d88a',
  },
  close: {
    appearance: 'none',
    border: 'none',
    background: 'transparent',
    color: 'rgba(244, 244, 242, 0.7)',
    fontSize: 20,
    lineHeight: 1,
    cursor: 'pointer',
    padding: 0,
    width: 24,
    height: 24,
  },
  panelTitle: {
    margin: 0,
    fontSize: 15,
    fontWeight: 600,
    color: '#f4f4f2',
    overflowWrap: 'break-word',
  },
  expand: {
    padding: '8px 12px',
    fontSize: 13,
    fontWeight: 600,
    color: '#0b1220',
    background: '#10d88a',
    border: 'none',
    borderRadius: 8,
    cursor: 'pointer',
    width: 'fit-content',
  },
  expandBusy: { opacity: 0.6, cursor: 'default' },
  panelError: { margin: 0, fontSize: 12.5, color: '#ffb4a8' },
  panelMuted: { margin: 0, fontSize: 13, color: 'rgba(244, 244, 242, 0.55)' },
  dl: { margin: 0, display: 'grid', gap: 8 },
  row: { display: 'grid', gap: 2 },
  dt: {
    fontSize: 11,
    textTransform: 'uppercase',
    letterSpacing: '0.04em',
    color: 'rgba(150, 170, 210, 0.75)',
  },
  dd: { margin: 0, fontSize: 13, color: 'rgba(244, 244, 242, 0.9)', overflowWrap: 'break-word' },
  listSearch: {
    width: '100%',
    boxSizing: 'border-box',
    padding: '8px 10px',
    fontSize: 13,
    color: '#f4f4f2',
    background: 'rgba(7, 10, 20, 0.6)',
    border: '1px solid rgba(150, 170, 210, 0.28)',
    borderRadius: 8,
  },
  list: { listStyle: 'none', margin: 0, padding: 0, display: 'grid', gap: 4 },
  listItem: {
    display: 'grid',
    gap: 1,
    width: '100%',
    textAlign: 'left',
    padding: '7px 9px',
    background: 'transparent',
    border: '1px solid transparent',
    borderRadius: 7,
    cursor: 'pointer',
  },
  listItemSel: { background: 'rgba(16, 216, 138, 0.12)', borderColor: 'rgba(16, 216, 138, 0.5)' },
  listItemType: {
    fontSize: 10,
    textTransform: 'uppercase',
    letterSpacing: '0.04em',
    color: 'rgba(150, 170, 210, 0.8)',
  },
  listItemLabel: { fontSize: 13, color: '#f4f4f2', overflowWrap: 'break-word' },
  listEmpty: { fontSize: 13, color: 'rgba(244, 244, 242, 0.55)', padding: '6px 2px' },
} satisfies Record<string, CSSProperties>;
