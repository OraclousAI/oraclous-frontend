// EdgeCanvas — the shared placement+connector engine for the flow and network layouts. It takes nodes
// already assigned to a (col, row) grid cell and a list of edges, and renders two stacked layers:
//   • behind: an <svg> edge layer (percentage viewBox 0..100 × 0..100, preserveAspectRatio="none")
//     drawing straight or elbow connectors between cell centres, with an arrowhead and optional label.
//   • front: an absolutely-positioned HTML grid of the node cards (crisp, selectable, themable).
// Deterministic — NO physics. Positions come purely from (col,row). Responsive: the whole thing is a
// percentage-based aspect box, so it scales to the container and never overflows 320px. Edge labels are
// React text nodes (Gate 5). Colour is never the sole signal — emphasis also thickens the stroke.
import { useId, type ReactNode } from 'react';
import type { DiagramEdge, DiagramNode } from '../spec.js';
import { DiagramNodeCard } from '../parts.js';

export interface Placed {
  node: DiagramNode;
  /** 0-based grid cell. */
  col: number;
  row: number;
}

const CELL_H = 96; // px per row — drives the container's intrinsic height (and the % math).

/** Centre of a cell as percentages of the grid, given cols/rows counts. */
function centre(col: number, row: number, cols: number, rows: number): { x: number; y: number } {
  const x = ((col + 0.5) / cols) * 100;
  const y = ((row + 0.5) / rows) * 100;
  return { x, y };
}

export function EdgeCanvas({
  placed,
  edges,
  cols,
  rows,
  elbow,
}: {
  placed: Placed[];
  edges: DiagramEdge[];
  cols: number;
  rows: number;
  /** true → right-angle (elbow) connectors; false → straight lines. */
  elbow: boolean;
}): ReactNode {
  const byId = new Map(placed.map((p) => [p.node.id, p]));
  const height = rows * CELL_H;

  // Genuinely-unique marker id per component instance so multiple diagrams in one message can't
  // collide (two same-shaped flows would otherwise emit duplicate DOM ids).
  const mid = `dg-arrow-${useId().replace(/[:]/g, '')}`;

  return (
    <div aria-hidden="true" style={{ position: 'relative', width: '100%', height }}>
      {/* edge layer */}
      <svg
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
        style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', overflow: 'visible' }}
        focusable="false"
      >
        <defs>
          {/* markerUnits=userSpaceOnUse keeps the arrowhead a sane size despite the non-uniform scale */}
          <marker
            id={mid}
            markerWidth="9"
            markerHeight="9"
            refX="6"
            refY="4.5"
            orient="auto"
            markerUnits="userSpaceOnUse"
          >
            <path d="M0 0 L9 4.5 L0 9 Z" fill="var(--fg-mute)" />
          </marker>
        </defs>
        {edges.map((e, i) => {
          const a = byId.get(e.from);
          const b = byId.get(e.to);
          if (!a || !b) return null;
          const p = centre(a.col, a.row, cols, rows);
          const q = centre(b.col, b.row, cols, rows);
          const d = elbow
            ? `M ${p.x} ${p.y} L ${q.x} ${p.y} L ${q.x} ${q.y}`
            : `M ${p.x} ${p.y} L ${q.x} ${q.y}`;
          return (
            <path
              key={`e-${i}`}
              d={d}
              fill="none"
              stroke="var(--fg-mute)"
              strokeWidth={1.4}
              vectorEffect="non-scaling-stroke"
              markerEnd={`url(#${mid})`}
            />
          );
        })}
      </svg>

      {/* edge labels — positioned in HTML so the text is never distorted by the non-uniform SVG scale */}
      {edges.map((e, i) => {
        if (!e.label) return null;
        const a = byId.get(e.from);
        const b = byId.get(e.to);
        if (!a || !b) return null;
        const p = centre(a.col, a.row, cols, rows);
        const q = centre(b.col, b.row, cols, rows);
        return (
          <span
            key={`el-${i}`}
            className="t-mono"
            style={{
              position: 'absolute',
              left: `${(p.x + q.x) / 2}%`,
              top: `${(p.y + q.y) / 2}%`,
              transform: 'translate(-50%, -50%)',
              fontSize: 'var(--t-tiny-size)',
              color: 'var(--fg-mute)',
              background: 'var(--bg)',
              padding: '0 4px',
              borderRadius: 'var(--r-1)',
              letterSpacing: '0.02em',
              whiteSpace: 'nowrap',
              maxWidth: '40%',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}
          >
            {e.label}
          </span>
        );
      })}

      {/* node layer */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          display: 'grid',
          gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))`,
          gridTemplateRows: `repeat(${rows}, ${CELL_H}px)`,
          gap: 0,
        }}
      >
        {placed.map((p) => (
          <div
            key={p.node.id}
            style={{
              gridColumn: p.col + 1,
              gridRow: p.row + 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '0 6px',
              minWidth: 0,
            }}
          >
            <div style={{ width: '100%' }}>
              <DiagramNodeCard node={p.node} compact />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
