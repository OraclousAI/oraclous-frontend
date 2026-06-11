// Timeline layout — milestones along a horizontal axis, ordered by `rank` (ties keep source order).
// The RunTimeline aesthetic: a hairline axis, a tick + dot per point, the active/emphasised point in
// --accent. Each point carries its label below the axis and (only when grounded) its verified value +
// confidence chip. Deterministic placement: equal columns across the axis, so it shrinks to fit and
// never overflows at 320px (the axis is a flex row of equal cells; cards wrap their own text).
//
// Built as HTML (not <svg>) so the axis line + dots scale with the cards and the labels stay crisp and
// selectable. The single horizontal rule is a 1px border; dots are small rounded spans on it.
import type { ReactNode } from 'react';
import type { DiagramNode } from '../spec.js';
import { ConfidenceChip } from '../parts.js';

function ordered(nodes: DiagramNode[]): DiagramNode[] {
  return [...nodes]
    .map((n, i) => ({ n, i }))
    .sort((a, b) => {
      const ra = a.n.rank ?? Number.MAX_SAFE_INTEGER;
      const rb = b.n.rank ?? Number.MAX_SAFE_INTEGER;
      return ra === rb ? a.i - b.i : ra - rb;
    })
    .map((x) => x.n);
}

export function Timeline({ nodes }: { nodes: DiagramNode[] }): ReactNode {
  const points = ordered(nodes);

  return (
    <div aria-hidden="true" style={{ width: '100%', overflowX: 'auto' }}>
      <div
        style={{
          display: 'grid',
          // Keep each point legible (≥88px); if there are too many to fit, the track scrolls
          // horizontally rather than smearing columns to unreadable slivers at narrow widths.
          gridTemplateColumns: `repeat(${points.length}, minmax(88px, 1fr))`,
          alignItems: 'start',
          gap: 'var(--sp-1)',
        }}
      >
        {points.map((n, i) => {
          const accent = !!n.emphasis;
          return (
            <div
              key={n.id}
              style={{ display: 'grid', gap: 6, justifyItems: 'center', textAlign: 'center', minWidth: 0 }}
            >
              {/* axis segment + dot: a full-width hairline with a centred dot; ends are capped */}
              <div style={{ position: 'relative', width: '100%', height: 14 }}>
                <span
                  style={{
                    position: 'absolute',
                    top: 6,
                    left: i === 0 ? '50%' : 0,
                    right: i === points.length - 1 ? '50%' : 0,
                    height: 1.5,
                    background: 'var(--border-hair)',
                  }}
                />
                <span
                  style={{
                    position: 'absolute',
                    top: 2,
                    left: '50%',
                    transform: 'translateX(-50%)',
                    width: accent ? 11 : 9,
                    height: accent ? 11 : 9,
                    borderRadius: '50%',
                    background: accent ? 'var(--accent)' : 'var(--bg)',
                    border: `1.6px solid ${accent ? 'var(--accent)' : 'var(--fg-mute)'}`,
                  }}
                />
              </div>
              <span
                className="t-dense"
                style={{ fontWeight: 600, color: 'var(--fg)', lineHeight: 1.2, letterSpacing: '-0.01em' }}
              >
                {n.label}
              </span>
              {n.fact?.proof && (
                <span style={{ display: 'grid', gap: 4, justifyItems: 'center' }}>
                  <span style={{ fontWeight: 700, color: 'var(--fg)', letterSpacing: '-0.02em' }}>
                    {n.fact.value}
                  </span>
                  <ConfidenceChip proof={n.fact.proof} />
                </span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
