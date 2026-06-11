// Network layout — a small graph with explicit edges. Deterministic placement, NO physics:
//   • if any node has a `rank`, place by rank bands (rank = row), spreading same-rank nodes across
//     columns in source order — a clean layered graph with elbow connectors.
//   • otherwise, ring placement: nodes spread evenly around a centred grid so edges read as a small
//     network with straight connectors.
// EdgeCanvas draws the connectors + labels and the cards. Responsive (percentage box, ≤320px safe).
import type { ReactNode } from 'react';
import type { DiagramEdge, DiagramNode } from '../spec.js';
import { EdgeCanvas, type Placed } from './EdgeCanvas.js';

const MAX_COLS = 4;

/** Layered-by-rank placement: row = rank, columns spread same-rank nodes evenly. Elbow edges. */
function layeredPlacement(nodes: DiagramNode[]): { placed: Placed[]; cols: number; rows: number } {
  const byRank = new Map<number, DiagramNode[]>();
  for (const n of nodes) {
    const r = n.rank ?? 0;
    const b = byRank.get(r);
    if (b) b.push(n);
    else byRank.set(r, [n]);
  }
  const rankKeys = [...byRank.keys()].sort((a, b) => a - b);
  const widest = Math.max(1, ...rankKeys.map((k) => byRank.get(k)!.length));
  const gridCols = Math.max(1, Math.min(MAX_COLS, widest));

  const placed: Placed[] = [];
  rankKeys.forEach((k, row) => {
    const group = byRank.get(k)!;
    group.forEach((node, i) => {
      // centre each row's nodes across the available columns
      const span = Math.min(group.length, gridCols);
      const offset = Math.floor((gridCols - span) / 2);
      const col = offset + (i % span);
      const extraRow = Math.floor(i / span); // overflow wraps downward within the band
      placed.push({ node, col, row: row + extraRow });
    });
  });
  const rows = Math.max(1, ...placed.map((p) => p.row + 1));
  return { placed, cols: gridCols, rows };
}

/** Ring placement: nodes around the perimeter of a square grid, in source order. Straight edges. */
function ringPlacement(nodes: DiagramNode[]): { placed: Placed[]; cols: number; rows: number } {
  const n = nodes.length;
  if (n <= 1) return { placed: nodes.map((node) => ({ node, col: 0, row: 0 })), cols: 1, rows: 1 };
  // grid side big enough for a ring: perimeter cells = 4*(side-1) ≥ n
  let side = 2;
  while (4 * (side - 1) < n) side++;
  side = Math.min(side, 4); // cap so cards stay legible; extras stack into inner rows
  const perimeter: { col: number; row: number }[] = [];
  for (let c = 0; c < side; c++) perimeter.push({ col: c, row: 0 });
  for (let r = 1; r < side; r++) perimeter.push({ col: side - 1, row: r });
  for (let c = side - 2; c >= 0; c--) perimeter.push({ col: c, row: side - 1 });
  for (let r = side - 2; r >= 1; r--) perimeter.push({ col: 0, row: r });

  const placed: Placed[] = [];
  nodes.forEach((node, i) => {
    if (i < perimeter.length) {
      placed.push({ node, col: perimeter[i]!.col, row: perimeter[i]!.row });
    } else {
      // overflow into the interior, row by row
      const extra = i - perimeter.length;
      placed.push({ node, col: 1 + (extra % Math.max(1, side - 2)), row: 1 + Math.floor(extra / Math.max(1, side - 2)) });
    }
  });
  const cols = Math.max(1, ...placed.map((p) => p.col + 1));
  const rows = Math.max(1, ...placed.map((p) => p.row + 1));
  return { placed, cols, rows };
}

export function Network({
  nodes,
  edges,
}: {
  nodes: DiagramNode[];
  edges: DiagramEdge[];
}): ReactNode {
  const hasRank = nodes.some((n) => n.rank !== undefined);
  const { placed, cols, rows } = hasRank ? layeredPlacement(nodes) : ringPlacement(nodes);
  return <EdgeCanvas placed={placed} edges={edges} cols={cols} rows={rows} elbow={hasRank} />;
}
