// BarChart — horizontal labelled bars with an optional per-bar target marker. On-brand to the
// inline-SVG diagram aesthetic (MeterBars/LayerStack): hairline tracks, mono labels, --accent mint
// as the single emphasis. Accessible: the figure is role="img" with an aria-label summarising every
// bar; a <figcaption> + visually-hidden summary give a text equivalent. No deps, no innerHTML.
import type { BarSpec } from './types.js';
import { fmt } from './types.js';

const TRACK_H = 12;
const ROW_GAP = 10;
const LABEL_W = 116;
const VALUE_W = 64;
const PAD = 2;

export function BarChart({ spec }: { spec: BarSpec }) {
  const { data, unit, title, caption } = spec;
  const values = data.flatMap((d) => [d.value, d.target ?? 0]);
  const dataMax = Math.max(1, ...values);
  const max = spec.max !== undefined && spec.max > 0 ? Math.max(spec.max, dataMax) : dataMax;

  const summary =
    (title ? `${title}. ` : '') +
    data.map((d) => `${d.label}: ${fmt(d.value, unit)}${d.target !== undefined ? ` (target ${fmt(d.target, unit)})` : ''}`).join('; ') +
    '.';

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
      <div aria-hidden="true" style={{ display: 'grid', gap: `${ROW_GAP}px` }}>
        {data.map((d, i) => {
          const fillPct = Math.max(0, Math.min(100, (d.value / max) * 100));
          const targetPct = d.target !== undefined ? Math.max(0, Math.min(100, (d.target / max) * 100)) : null;
          return (
            <div key={`${d.label}-${i}`} style={{ display: 'grid', gridTemplateColumns: `minmax(56px, ${LABEL_W}px) minmax(0, 1fr) minmax(40px, ${VALUE_W}px)`, alignItems: 'center', gap: 'var(--sp-2)' }}>
              <span className="t-mono" style={{ fontSize: 'var(--t-tiny-size)', color: 'var(--fg-mute)', textAlign: 'right', letterSpacing: '0.02em', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {d.label}
              </span>
              <span
                style={{
                  position: 'relative',
                  height: TRACK_H,
                  borderRadius: 'var(--r-pill)',
                  border: '1.3px solid var(--border-hair)',
                  background: 'color-mix(in oklab, var(--fg) 3%, transparent)',
                  overflow: 'hidden',
                }}
              >
                <span
                  style={{
                    position: 'absolute',
                    insetBlock: 0,
                    insetInlineStart: 0,
                    width: `${fillPct}%`,
                    borderRadius: 'var(--r-pill)',
                    background: d.highlight ? 'var(--accent)' : 'color-mix(in oklab, var(--fg) 26%, transparent)',
                  }}
                />
                {targetPct !== null && (
                  <span
                    style={{
                      position: 'absolute',
                      top: -PAD,
                      bottom: -PAD,
                      left: `${targetPct}%`,
                      width: 2,
                      transform: 'translateX(-1px)',
                      background: 'var(--info)',
                      borderRadius: 1,
                    }}
                  />
                )}
              </span>
              <span className="t-mono" style={{ fontSize: 'var(--t-tiny-size)', color: d.highlight ? 'var(--fg)' : 'var(--fg-mute)', fontWeight: d.highlight ? 600 : 400, whiteSpace: 'nowrap' }}>
                {fmt(d.value, unit)}
              </span>
            </div>
          );
        })}
      </div>
      {caption && (
        <p className="t-mono" style={{ margin: 'var(--sp-2) 0 0', fontSize: 'var(--t-tiny-size)', color: 'var(--fg-mute)', letterSpacing: '0.02em' }}>
          {caption}
        </p>
      )}
    </figure>
  );
}
