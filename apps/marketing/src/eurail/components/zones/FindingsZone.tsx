// Zone 4 — The diagnosis findings index, illustration-first (#5). 12 domain-tagged findings rendered
// as a scannable grid of STAT cards: the single load-bearing figure is the hero, the headline is the
// takeaway, and the full detail + evidence sit in a collapsible disclosure — so the default view reads
// at a glance, not as a wall of prose. Filterable by domain. Every figure traces to its evidence.
import { useState } from 'react';
import { Zone, DomainTag, EvidencePopover } from '../primitives/index.js';
import { useCorpus } from '../../lib/useCorpus.js';
import type { DomainCode } from '../../corpus/types.js';

const FILTERS: { code: DomainCode | 'ALL'; label: string }[] = [
  { code: 'ALL', label: 'All' },
  { code: 'INT', label: 'Internal' },
  { code: 'USR', label: 'Customer' },
  { code: 'FED', label: 'Federation' },
  { code: 'MKT', label: 'Market' },
];

// The same four domain identities as DomainTag (DEC-001) — used here as the card's accent edge.
const DOMAIN_ACCENT: Record<DomainCode, string> = {
  INT: 'var(--info)',
  USR: 'var(--success)',
  FED: 'var(--perm-inherited)',
  MKT: 'var(--warning)',
};

export function FindingsZone() {
  const { findings } = useCorpus();
  const [filter, setFilter] = useState<DomainCode | 'ALL'>('ALL');
  const shown = filter === 'ALL' ? findings : findings.filter((f) => f.domain === filter);

  return (
    <Zone id="findings" kicker="THE DIAGNOSIS" title="Twelve findings" topRule>
      <p className="t-body" style={{ maxWidth: '60ch', marginTop: 0, color: 'var(--fg-mute)' }}>
        The whole diagnosis at a glance — one figure per finding, tagged by domain. Open any card for the
        detail and its evidence.
      </p>

      <div role="group" aria-label="Filter findings by domain" style={{ display: 'flex', gap: 'var(--sp-2)', flexWrap: 'wrap', margin: 'var(--sp-3) 0 var(--sp-4)' }}>
        {FILTERS.map((f) => {
          const active = filter === f.code;
          return (
            <button
              key={f.code}
              type="button"
              aria-pressed={active}
              onClick={() => setFilter(f.code)}
              className="t-dense"
              style={{
                padding: '4px var(--sp-3)',
                borderRadius: 'var(--r-pill)',
                border: `1px solid ${active ? 'var(--fg)' : 'var(--rule)'}`,
                background: active ? 'var(--fg)' : 'var(--bg)',
                color: active ? 'var(--bg)' : 'var(--fg)',
                cursor: 'pointer',
              }}
            >
              {f.label}
            </button>
          );
        })}
      </div>

      {shown.length === 0 ? (
        <p className="t-body" style={{ color: 'var(--fg-mute)' }}>No findings in this domain.</p>
      ) : (
        <ol className="ef-grid" style={{ listStyle: 'none', margin: 0, padding: 0 }}>
          {shown.map((f) => (
            <li
              key={f.number}
              className="ef-card"
              style={{ ['--ef-accent']: DOMAIN_ACCENT[f.domain] } as React.CSSProperties}
            >
              <div className="ef-card__top">
                <span className="t-mono ef-card__num" aria-hidden="true">
                  {String(f.number).padStart(2, '0')}
                </span>
                <DomainTag code={f.domain} />
              </div>

              {f.stat && (
                <div className="ef-stat">
                  <span className="t-mono ef-stat__value">{f.stat.value}</span>
                  <span className="ef-stat__label">{f.stat.label}</span>
                </div>
              )}

              <h3 className="ef-headline">{f.headline}</h3>

              <details className="ef-details">
                <summary className="t-dense">Detail &amp; evidence</summary>
                <p className="t-dense" style={{ margin: 'var(--sp-2) 0 0', color: 'var(--fg-mute)' }}>
                  <EvidencePopover claim={f.detail} evidenceIds={f.evidence_ids} />
                </p>
                <p className="t-caption" style={{ margin: 'var(--sp-1) 0 0', color: 'var(--fg-mute)' }}>{f.page_ref}</p>
              </details>
            </li>
          ))}
        </ol>
      )}
    </Zone>
  );
}
