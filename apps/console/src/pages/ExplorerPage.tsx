// Explorer — an immersive sphere visualisation of a graph (GET /v1/graph/{id}/subgraph). Drag to
// rotate, click a node to inspect it. The renderer (GraphSphere) is a Canvas2D 3D projection.
import { useEffect, useState, type CSSProperties } from 'react';
import { Link, useParams } from 'react-router-dom';
import type { GraphNode } from '@oraclous/api-client';
import { useGraph } from '../lib/graphs.js';
import { useSubgraph } from '../lib/explorer.js';
import { GraphSphere, nodeLabel } from '../components/explorer/GraphSphere.js';

function NodePanel({ node, onClose }: { node: GraphNode; onClose: () => void }) {
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

export default function ExplorerPage() {
  const { graphId = '' } = useParams<{ graphId: string }>();
  const { graph } = useGraph(graphId);
  const { subgraph, isLoading, isError } = useSubgraph(graphId, 250);
  const [selected, setSelected] = useState<GraphNode | null>(null);

  // The page isn't remounted when :graphId changes (no route key), so clear any selection from the
  // previous graph — otherwise the detail panel keeps showing a node that isn't in this graph.
  useEffect(() => setSelected(null), [graphId]);

  const nodes = subgraph?.nodes ?? [];
  const edges = subgraph?.edges ?? [];

  return (
    <div style={styles.page}>
      <header style={styles.header}>
        <div style={styles.headerLeft}>
          <Link to={`/app/workspaces/${graphId}`} style={styles.back}>
            ← {graph?.name ?? 'Graph'}
          </Link>
          <h1 style={styles.h1}>Explorer</h1>
        </div>
        {subgraph !== null && nodes.length > 0 && (
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
            />
            {selected !== null && <NodePanel node={selected} onClose={() => setSelected(null)} />}
          </>
        )}
      </div>
    </div>
  );
}

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
  center: {
    position: 'absolute',
    inset: 0,
    display: 'grid',
    placeItems: 'center',
    padding: 24,
  },
  msg: {
    margin: 0,
    maxWidth: 420,
    textAlign: 'center',
    fontSize: 14,
    lineHeight: 1.5,
    color: 'rgba(244, 244, 242, 0.82)',
  },
  panel: {
    position: 'absolute',
    top: 14,
    right: 14,
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
  },
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
  panelMuted: { margin: 0, fontSize: 13, color: 'rgba(244, 244, 242, 0.55)' },
  dl: { margin: 0, display: 'grid', gap: 8 },
  row: { display: 'grid', gap: 2 },
  dt: {
    fontSize: 11,
    textTransform: 'uppercase',
    letterSpacing: '0.04em',
    color: 'rgba(150, 170, 210, 0.75)',
  },
  dd: {
    margin: 0,
    fontSize: 13,
    color: 'rgba(244, 244, 242, 0.9)',
    overflowWrap: 'break-word',
  },
} satisfies Record<string, CSSProperties>;
