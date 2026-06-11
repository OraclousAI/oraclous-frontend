// Flow layout — a directed sequence, left-to-right, with arrows between steps. Placement is
// deterministic: a node's column is its `col` if given, else its position in a topological-ish order
// derived from the edges (sources before targets), else source order. Rows are assigned to de-stack
// nodes that share a column (so branches sit side by side). Straight connectors with arrowheads via
// EdgeCanvas. Responsive: EdgeCanvas is a percentage box; a long flow wraps to extra rows rather than
// overflowing 320px (we cap columns and push overflow downward).
import type { ReactNode } from 'react';
import type { DiagramEdge, DiagramNode } from '../spec.js';
import { EdgeCanvas, type Placed } from './EdgeCanvas.js';

const MAX_COLS = 4; // keep it readable on narrow screens; longer flows wrap into more rows

/** Order nodes so edge sources precede targets (Kahn-ish); falls back to source order on cycles. */
function flowOrder(nodes: DiagramNode[], edges: DiagramEdge[]): DiagramNode[] {
  const indeg = new Map<string, number>();
  const out = new Map<string, string[]>();
  for (const n of nodes) {
    indeg.set(n.id, 0);
    out.set(n.id, []);
  }
  for (const e of edges) {
    if (!indeg.has(e.from) || !indeg.has(e.to)) continue;
    out.get(e.from)!.push(e.to);
    indeg.set(e.to, (indeg.get(e.to) ?? 0) + 1);
  }
  const order: DiagramNode[] = [];
  const byId = new Map(nodes.map((n) => [n.id, n]));
  // queue seeded in source order to keep determinism
  const queue = nodes.filter((n) => (indeg.get(n.id) ?? 0) === 0).map((n) => n.id);
  const seen = new Set<string>();
  while (queue.length) {
    const id = queue.shift()!;
    if (seen.has(id)) continue;
    seen.add(id);
    const n = byId.get(id);
    if (n) order.push(n);
    for (const t of out.get(id) ?? []) {
      indeg.set(t, (indeg.get(t) ?? 1) - 1);
      if ((indeg.get(t) ?? 0) <= 0 && !seen.has(t)) queue.push(t);
    }
  }
  // append any nodes left out by a cycle, in source order
  for (const n of nodes) if (!seen.has(n.id)) order.push(n);
  return order;
}

export function Flow({
  nodes,
  edges,
}: {
  nodes: DiagramNode[];
  edges: DiagramEdge[];
}): ReactNode {
  const ordered = flowOrder(nodes, edges);

  // Assign (col,row): honour explicit `col` when present; otherwise sequence into rows of MAX_COLS.
  const placed: Placed[] = [];
  let autoIdx = 0;
  for (const node of ordered) {
    if (node.col !== undefined) {
      const col = Math.min(node.col, MAX_COLS - 1);
      // find a row where this column is free
      let row = 0;
      while (placed.some((p) => p.col === col && p.row === row)) row++;
      placed.push({ node, col, row });
    } else {
      const col = autoIdx % MAX_COLS;
      const row = Math.floor(autoIdx / MAX_COLS);
      placed.push({ node, col, row });
      autoIdx++;
    }
  }

  const cols = Math.max(1, ...placed.map((p) => p.col + 1));
  const rows = Math.max(1, ...placed.map((p) => p.row + 1));

  return <EdgeCanvas placed={placed} edges={edges} cols={cols} rows={rows} elbow={false} />;
}
