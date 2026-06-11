// ProgressChart — a current→target gauge on a 0..max scale (e.g. AI search visibility 38 → 80 out
// of 100). One track: a muted fill to `value`, a mint accent overlay showing the gap to `target`,
// and a target tick. Reads "where we are, where we're going". On-brand, no deps, accessible
// (role="img" + summary; values also shown as text, never colour-only).
import type { ProgressSpec } from './types.js';
import { fmt } from './types.js';

export function ProgressChart({ spec }: { spec: ProgressSpec }) {
  const { label, value, target, title, unit, caption } = spec;
  const max = spec.max !== undefined && spec.max > 0 ? spec.max : 100;
  const scale = Math.max(max, value, target, 1);

  const valuePct = Math.max(0, Math.min(100, (value / scale) * 100));
  const targetPct = Math.max(0, Math.min(100, (target / scale) * 100));
  const gapStart = Math.min(valuePct, targetPct);
  const gapWidth = Math.abs(targetPct - valuePct);
  const advancing = target >= value;

  const summary = `${title ? `${title}. ` : ''}${label}: now ${fmt(value, unit)}, target ${fmt(target, unit)}${max !== 100 || unit ? '' : ' out of 100'}.`;

  return (
    <figure
      role="img"
      aria-label={summary}
      style={{ margin: 'var(--sp-3) 0', padding: 'var(--sp-3) var(--sp-4)', border: '1px solid var(--rule)', borderRadius: 'var(--r-3)', background: 'var(--bg-soft)' }}
    >
      {title && (
        <figcaption className="t-dense" style={{ fontWeight: 600, marginBottom: 'var(--sp-2)', letterSpacing: '-0.01em' }}>
          {title}
        </figcaption>
      )}
      <div aria-hidden="true">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 'var(--sp-1)' }}>
          <span className="t-mono" style={{ fontSize: 'var(--t-tiny-size)', color: 'var(--fg-mute)', letterSpacing: '0.02em' }}>
            {label}
          </span>
          <span className="t-dense" style={{ fontWeight: 600, color: 'var(--fg)' }}>
            {fmt(value, unit)} <span style={{ color: 'var(--fg-mute)' }}>→</span> <span style={{ color: 'var(--accent-ink, var(--fg))' }}>{fmt(target, unit)}</span>
          </span>
        </div>
        <span
          style={{
            position: 'relative',
            display: 'block',
            height: 14,
            borderRadius: 'var(--r-pill)',
            border: '1.3px solid var(--border-hair)',
            background: 'color-mix(in oklab, var(--fg) 3%, transparent)',
            overflow: 'hidden',
          }}
        >
          {/* current value — muted fill */}
          <span style={{ position: 'absolute', insetBlock: 0, insetInlineStart: 0, width: `${valuePct}%`, borderRadius: 'var(--r-pill)', background: 'color-mix(in oklab, var(--fg) 26%, transparent)' }} />
          {/* the gap to target — mint, only when advancing */}
          {advancing && gapWidth > 0 && (
            <span style={{ position: 'absolute', insetBlock: 0, left: `${gapStart}%`, width: `${gapWidth}%`, background: 'color-mix(in oklab, var(--accent) 38%, transparent)' }} />
          )}
          {/* target tick */}
          <span style={{ position: 'absolute', top: -2, bottom: -2, left: `${targetPct}%`, width: 2.5, transform: 'translateX(-1px)', background: 'var(--accent)', borderRadius: 1 }} />
        </span>
      </div>
      {caption && (
        <p className="t-mono" style={{ margin: 'var(--sp-2) 0 0', fontSize: 'var(--t-tiny-size)', color: 'var(--fg-mute)', letterSpacing: '0.02em' }}>
          {caption}
        </p>
      )}
    </figure>
  );
}
