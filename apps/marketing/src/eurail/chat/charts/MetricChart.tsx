// MetricChart — one big number + label, with an optional target and a signed delta. The single
// "stat that lands" treatment for board-level numbers (e.g. 89% want AI; 82% support-AI
// satisfaction; rail +5.8%). On-brand: big numeral in --fg, muted mono label, the delta uses a
// glyph + word (never colour-only) so it's AA-safe. No deps, accessible.
import type { MetricSpec } from './types.js';
import { fmt } from './types.js';

export function MetricChart({ spec }: { spec: MetricSpec }) {
  const { label, value, unit, target, delta, title, caption } = spec;

  const deltaUp = delta !== undefined && delta > 0;
  const deltaDown = delta !== undefined && delta < 0;
  const deltaGlyph = deltaUp ? '▲' : deltaDown ? '▼' : '■';
  const deltaWord = deltaUp ? 'up' : deltaDown ? 'down' : 'flat';
  const deltaColor = deltaUp ? 'var(--success)' : deltaDown ? 'var(--warning)' : 'var(--fg-mute)';

  const summary =
    `${title ? `${title}. ` : ''}${label}: ${fmt(value, unit)}` +
    (target !== undefined ? `, target ${fmt(target, unit)}` : '') +
    (delta !== undefined ? `, ${deltaWord} ${fmt(Math.abs(delta), unit)}` : '') +
    '.';

  return (
    <figure
      role="img"
      aria-label={summary}
      style={{ margin: 'var(--sp-3) 0', padding: 'var(--sp-4)', border: '1px solid var(--rule)', borderRadius: 'var(--r-3)', background: 'var(--bg-soft)' }}
    >
      {title && (
        <figcaption className="t-mono" style={{ fontSize: 'var(--t-tiny-size)', color: 'var(--fg-mute)', letterSpacing: '0.04em', textTransform: 'uppercase', marginBottom: 'var(--sp-2)' }}>
          {title}
        </figcaption>
      )}
      <div aria-hidden="true" style={{ display: 'flex', alignItems: 'baseline', gap: 'var(--sp-3)', flexWrap: 'wrap' }}>
        <span style={{ fontSize: '2.4rem', lineHeight: 1, fontWeight: 700, letterSpacing: '-0.02em', color: 'var(--fg)' }}>
          {fmt(value, unit)}
        </span>
        {/* AA contrast: the number reads in --fg; colour rides only on the glyph (a graphical
            object needs 3:1, which --success/--warning clear on --bg-soft). Meaning is carried by
            glyph + sign, never colour alone. */}
        {delta !== undefined && (
          <span className="t-mono" style={{ fontSize: 'var(--t-dense-size)', color: 'var(--fg)', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
            <span aria-hidden="true" style={{ color: deltaColor }}>{deltaGlyph}</span>
            {fmt(Math.abs(delta), unit)}
          </span>
        )}
      </div>
      <p className="t-dense" style={{ margin: 'var(--sp-2) 0 0', color: 'var(--fg-mute)' }}>
        {label}
      </p>
      {target !== undefined && (
        <p className="t-mono" style={{ margin: 'var(--sp-1) 0 0', fontSize: 'var(--t-tiny-size)', color: 'var(--fg-mute)', letterSpacing: '0.02em' }}>
          target {fmt(target, unit)}
        </p>
      )}
      {caption && (
        <p className="t-mono" style={{ margin: 'var(--sp-2) 0 0', fontSize: 'var(--t-tiny-size)', color: 'var(--fg-mute)', letterSpacing: '0.02em' }}>
          {caption}
        </p>
      )}
    </figure>
  );
}
