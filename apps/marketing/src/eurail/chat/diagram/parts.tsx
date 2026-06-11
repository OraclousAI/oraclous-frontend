// Shared diagram atoms — the reusable node renderers + a confidence chip, used by every layout. These
// keep the on-brand aesthetic of the chat charts (MetricChart/BarChart): hairline borders, --bg-soft
// fill, mono micro-labels, --accent as the single emphasis. Everything is React elements (Gate 5 — no
// raw-HTML sink anywhere). Untrusted model text (labels, fact values) is rendered as text nodes.
//
// A node renders in one of three kinds:
//   • box       — a labelled card; if it carries a verified fact, the value + a confidence chip show.
//   • metric    — a big-number callout (reuses the MetricChart treatment) for a single grounded stat.
//   • milestone — a compact label used as a timeline point's caption.
// A node WITHOUT a verified fact still renders its (number-scrubbed) label — it can never show a number.

import type { CSSProperties, ReactNode } from 'react';
import type { DiagramNode, FactProof } from './spec.js';
import { chipText, chipColor } from './spec.js';

/** Confidence chip — DIRECT·H etc. Word carries meaning; colour rides only on the dot/border (≥3:1). */
export function ConfidenceChip({ proof }: { proof: FactProof }): ReactNode {
  const color = chipColor(proof.confidence);
  return (
    <span
      className="t-mono"
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 4,
        fontSize: 'var(--t-tiny-size)',
        lineHeight: 1.2,
        color: 'var(--fg-mute)',
        letterSpacing: '0.04em',
        padding: '1px 6px',
        borderRadius: 'var(--r-pill)',
        border: `1px solid ${color}`,
        whiteSpace: 'nowrap',
      }}
    >
      <span aria-hidden="true" style={{ width: 6, height: 6, borderRadius: '50%', background: color, flex: '0 0 auto' }} />
      {chipText(proof)}
    </span>
  );
}

/** The fact value, big and in --fg (the MetricChart numeral treatment), only ever shown when verified. */
function FactValue({ value, size }: { value: string; size: 'sm' | 'lg' }): ReactNode {
  return (
    <span
      style={{
        fontSize: size === 'lg' ? '1.9rem' : 'var(--t-dense-size)',
        lineHeight: 1,
        fontWeight: 700,
        letterSpacing: '-0.02em',
        color: 'var(--fg)',
      }}
    >
      {value}
    </span>
  );
}

const cardBase = (emphasis?: boolean): CSSProperties => ({
  border: emphasis ? '1.4px solid var(--accent)' : '1.3px solid var(--border-hair)',
  borderRadius: 'var(--r-3)',
  background: emphasis
    ? 'color-mix(in oklab, var(--accent) 7%, var(--bg-soft))'
    : 'color-mix(in oklab, var(--fg) 3%, var(--bg-soft))',
  padding: 'var(--sp-2) var(--sp-3)',
  display: 'flex',
  flexDirection: 'column',
  gap: 4,
});

/**
 * A box node — the workhorse card. Label on top (structural prose, number-scrubbed upstream), then the
 * verified fact value + confidence chip if present. `compact` trims padding for dense grids.
 */
export function BoxNode({ node, compact }: { node: DiagramNode; compact?: boolean }): ReactNode {
  const style = cardBase(node.emphasis);
  if (compact) {
    style.padding = '6px 8px';
  }
  return (
    <div style={style}>
      <span
        className="t-dense"
        style={{ fontWeight: 600, letterSpacing: '-0.01em', color: 'var(--fg)', lineHeight: 1.25 }}
      >
        {node.label}
      </span>
      {node.fact?.proof && (
        <span style={{ display: 'flex', alignItems: 'center', gap: 'var(--sp-2)', flexWrap: 'wrap' }}>
          <FactValue value={node.fact.value} size="sm" />
          <ConfidenceChip proof={node.fact.proof} />
        </span>
      )}
    </div>
  );
}

/**
 * A metric node — a single grounded statistic as a big-number callout (MetricChart aesthetic). When
 * the fact is unverified (no proof) it degrades to a plain labelled box, never showing a bare number.
 */
export function MetricNode({ node }: { node: DiagramNode }): ReactNode {
  const proof = node.fact?.proof;
  return (
    <div style={{ ...cardBase(node.emphasis), gap: 6, padding: 'var(--sp-3)' }}>
      {proof && node.fact ? (
        <>
          <span style={{ display: 'flex', alignItems: 'baseline', gap: 'var(--sp-2)', flexWrap: 'wrap' }}>
            <FactValue value={node.fact.value} size="lg" />
            <ConfidenceChip proof={proof} />
          </span>
          <span className="t-dense" style={{ color: 'var(--fg-mute)', lineHeight: 1.25 }}>
            {node.label}
          </span>
        </>
      ) : (
        <span className="t-dense" style={{ fontWeight: 600, color: 'var(--fg)', lineHeight: 1.25 }}>
          {node.label}
        </span>
      )}
    </div>
  );
}

/** Dispatch a node to its kind renderer. `compact` is honoured by box (dense grids/lanes). */
export function DiagramNodeCard({ node, compact }: { node: DiagramNode; compact?: boolean }): ReactNode {
  if (node.kind === 'metric') return <MetricNode node={node} />;
  // 'milestone' renders as a compact box here; the timeline layout positions it on the axis itself.
  return <BoxNode node={node} compact={compact} />;
}
