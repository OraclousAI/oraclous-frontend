// Zone 9 — Methodology & how-to-read. The trust legend: what the confidence labels mean, and
// the live composition of the ledger (computed from the records themselves).
import { useMemo } from 'react';
import { Zone, ConfidenceBadge } from '../primitives/index.js';
import { useCorpus } from '../../lib/useCorpus.js';
import type { ConfidenceLabel } from '../../corpus/types.js';

const LABEL_MEANING: Record<ConfidenceLabel, string> = {
  DIRECT: 'Stated outright by a primary source — quoted, dated, linked.',
  INFERRED: 'Not stated directly; reasoned from one or more direct records.',
  ASSUMPTION: 'A working assumption where evidence is thin — flagged as such, never hidden.',
};

export function MethodologyZone() {
  const { evidence } = useCorpus();

  const byLabel = useMemo(() => {
    const m: Record<string, number> = {};
    for (const e of evidence) m[e.label] = (m[e.label] ?? 0) + 1;
    return m;
  }, [evidence]);

  const bySource = useMemo(() => {
    const m: Record<string, number> = {};
    for (const e of evidence) m[e.source.type] = (m[e.source.type] ?? 0) + 1;
    return Object.entries(m).sort((a, b) => b[1] - a[1]).slice(0, 8);
  }, [evidence]);

  return (
    <Zone id="methodology" kicker="HOW TO READ THIS" title="Methodology & trust legend" topRule>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 'var(--sp-4)' }}>
        {/* The label legend */}
        <div style={{ display: 'grid', gap: 'var(--sp-3)', alignContent: 'start' }}>
          <h3 className="t-h4" style={{ margin: 0 }}>What the labels mean</h3>
          <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'grid', gap: 'var(--sp-3)' }}>
            {(Object.keys(LABEL_MEANING) as ConfidenceLabel[]).map((label) => (
              <li key={label} style={{ display: 'grid', gap: 4 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--sp-2)' }}>
                  <ConfidenceBadge label={label} level="HIGH" />
                  <span className="t-caption" style={{ color: 'var(--fg-mute)' }}>
                    {byLabel[label] ?? 0} records
                  </span>
                </div>
                <p className="t-dense" style={{ margin: 0, color: 'var(--fg-mute)' }}>{LABEL_MEANING[label]}</p>
              </li>
            ))}
          </ul>
          <p className="t-dense" style={{ margin: 0, color: 'var(--fg-mute)' }}>
            Each record also carries a strength — <strong>HIGH / MEDIUM / LOW</strong> — shown as
            the weight of the badge's bar.
          </p>
        </div>

        {/* The source registry (computed) */}
        <div style={{ display: 'grid', gap: 'var(--sp-3)', alignContent: 'start' }}>
          <h3 className="t-h4" style={{ margin: 0 }}>Where the evidence comes from</h3>
          <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'grid', gap: 'var(--sp-2)' }}>
            {bySource.map(([type, n]) => {
              const pct = Math.round((n / evidence.length) * 100);
              return (
                <li key={type} style={{ display: 'grid', gap: 3 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span className="t-dense">{type}</span>
                    <span className="t-mono t-caption" style={{ color: 'var(--fg-mute)' }}>{n}</span>
                  </div>
                  <div aria-hidden="true" style={{ height: 5, borderRadius: 'var(--r-pill)', background: 'var(--bg-soft)', overflow: 'hidden' }}>
                    <div style={{ width: `${pct}%`, height: '100%', background: 'var(--info)' }} />
                  </div>
                </li>
              );
            })}
          </ul>
          <p className="t-dense" style={{ margin: 0, color: 'var(--fg-mute)' }}>
            Across {evidence.length} records and a four-pass method (gather → label → cross-check →
            synthesise), with every disagreement logged in the conflict log above.
          </p>
        </div>
      </div>
    </Zone>
  );
}
