// ComparisonChart — two labelled values, A vs B (e.g. iOS-US 2.7★ vs Android-EU 4.4★). Two
// proportional bars on a shared scale, the larger one carrying the mint accent; a centred "vs"
// reads the contrast. On-brand, no deps, accessible (role="img" + summary, mono labels).
import type { ComparisonSpec } from './types.js';
import { fmt } from './types.js';

function Side({ label, value, pct, lead, unit }: { label: string; value: number; pct: number; lead: boolean; unit?: string }) {
  return (
    <div style={{ display: 'grid', gap: 'var(--sp-1)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 'var(--sp-2)' }}>
        <span className="t-mono" style={{ fontSize: 'var(--t-tiny-size)', color: 'var(--fg-mute)', letterSpacing: '0.02em', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {label}
        </span>
        <span className="t-dense" style={{ fontWeight: lead ? 700 : 600, color: 'var(--fg)', whiteSpace: 'nowrap' }}>
          {fmt(value, unit)}
        </span>
      </div>
      <span style={{ height: 12, borderRadius: 'var(--r-pill)', border: '1.3px solid var(--border-hair)', background: 'color-mix(in oklab, var(--fg) 3%, transparent)', overflow: 'hidden', display: 'block' }}>
        <span style={{ display: 'block', height: '100%', width: `${pct}%`, borderRadius: 'var(--r-pill)', background: lead ? 'var(--accent)' : 'color-mix(in oklab, var(--fg) 26%, transparent)' }} />
      </span>
    </div>
  );
}

export function ComparisonChart({ spec }: { spec: ComparisonSpec }) {
  const { a, b, unit, title, caption } = spec;
  const max = Math.max(1, Math.abs(a.value), Math.abs(b.value));
  const aPct = Math.max(0, Math.min(100, (a.value / max) * 100));
  const bPct = Math.max(0, Math.min(100, (b.value / max) * 100));
  const aLead = a.value >= b.value;

  const summary = `${title ? `${title}. ` : ''}${a.label}: ${fmt(a.value, unit)} versus ${b.label}: ${fmt(b.value, unit)}.`;

  return (
    <figure
      role="img"
      aria-label={summary}
      style={{ margin: 'var(--sp-3) 0', padding: 'var(--sp-3) var(--sp-4)', border: '1px solid var(--rule)', borderRadius: 'var(--r-3)', background: 'var(--bg-soft)' }}
    >
      {title && (
        <figcaption className="t-dense" style={{ fontWeight: 600, marginBottom: 'var(--sp-3)', letterSpacing: '-0.01em' }}>
          {title}
        </figcaption>
      )}
      <div aria-hidden="true" style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', alignItems: 'center', gap: 'var(--sp-3)' }}>
        <Side label={a.label} value={a.value} pct={aPct} lead={aLead} {...(unit !== undefined ? { unit } : {})} />
        <span className="t-mono" style={{ fontSize: 'var(--t-tiny-size)', color: 'var(--fg-mute)', textTransform: 'lowercase', letterSpacing: '0.06em' }}>
          vs
        </span>
        <Side label={b.label} value={b.value} pct={bPct} lead={!aLead} {...(unit !== undefined ? { unit } : {})} />
      </div>
      {caption && (
        <p className="t-mono" style={{ margin: 'var(--sp-2) 0 0', fontSize: 'var(--t-tiny-size)', color: 'var(--fg-mute)', letterSpacing: '0.02em' }}>
          {caption}
        </p>
      )}
    </figure>
  );
}
