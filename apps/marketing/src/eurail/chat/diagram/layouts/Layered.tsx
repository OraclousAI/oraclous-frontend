// Layered layout — nodes stacked in rows by `rank` (low rank at the top), each row a horizontal band
// of its nodes. The LayerStack aesthetic: hairline cards, mono micro-labels, --accent emphasis. Pure
// CSS grid — no SVG, no edges drawn (a layered diagram reads top-to-bottom; edges would clutter it).
// Deterministic: rank groups the rows; within a row, source order is preserved. Responsive — rows
// wrap their cards at 320px without horizontal overflow.
import type { ReactNode } from 'react';
import type { DiagramNode } from '../spec.js';
import { DiagramNodeCard } from '../parts.js';

/** Bucket nodes by rank (undefined rank → appended as a final row, in order). */
function rows(nodes: DiagramNode[]): DiagramNode[][] {
  const byRank = new Map<number, DiagramNode[]>();
  const noRank: DiagramNode[] = [];
  for (const n of nodes) {
    if (n.rank === undefined) {
      noRank.push(n);
      continue;
    }
    const bucket = byRank.get(n.rank);
    if (bucket) bucket.push(n);
    else byRank.set(n.rank, [n]);
  }
  const ordered = [...byRank.keys()].sort((a, b) => a - b).map((k) => byRank.get(k)!);
  if (noRank.length) ordered.push(noRank);
  return ordered;
}

export function Layered({ nodes }: { nodes: DiagramNode[] }): ReactNode {
  return (
    <div aria-hidden="true" style={{ display: 'grid', gap: 'var(--sp-2)', width: '100%' }}>
      {rows(nodes).map((row, ri) => (
        <div
          key={`row-${ri}`}
          style={{
            display: 'grid',
            gridTemplateColumns: `repeat(auto-fit, minmax(min(100%, 160px), 1fr))`,
            gap: 'var(--sp-2)',
          }}
        >
          {row.map((n) => (
            <DiagramNodeCard key={n.id} node={n} />
          ))}
        </div>
      ))}
    </div>
  );
}
