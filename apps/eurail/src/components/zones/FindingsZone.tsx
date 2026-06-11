// Zone 4 — The diagnosis findings index. 12 domain-tagged findings, filterable by domain,
// each claim drilling to its evidence.
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

export function FindingsZone() {
  const { findings } = useCorpus();
  const [filter, setFilter] = useState<DomainCode | 'ALL'>('ALL');
  const shown = filter === 'ALL' ? findings : findings.filter((f) => f.domain === filter);

  return (
    <Zone id="findings" kicker="THE DIAGNOSIS" title="Twelve findings" topRule>
      <p className="t-body" style={{ maxWidth: '64ch', marginTop: 0, color: 'var(--fg-mute)' }}>
        The whole diagnosis on one page. Each finding is domain-tagged and traces to the page
        where its evidence sits. None is a recommendation — those live in the strategy frame.
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
        <ol style={{ listStyle: 'none', margin: 0, padding: 0, display: 'grid', gap: 'var(--sp-3)' }}>
          {shown.map((f) => (
            <li
              key={f.number}
              style={{
                display: 'grid',
                gridTemplateColumns: 'auto 1fr',
                gap: 'var(--sp-3)',
                padding: 'var(--sp-4)',
                border: '1px solid var(--rule)',
                borderRadius: 'var(--r-4)',
              }}
            >
              <span
                className="t-mono"
                aria-hidden="true"
                style={{ fontSize: 22, fontWeight: 700, color: 'var(--fg-mute)', lineHeight: 1 }}
              >
                {String(f.number).padStart(2, '0')}
              </span>
              <div style={{ display: 'grid', gap: 'var(--sp-1)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--sp-2)' }}>
                  <DomainTag code={f.domain} />
                  <span className="t-caption" style={{ color: 'var(--fg-mute)' }}>
                    {f.page_ref}
                  </span>
                </div>
                <h3 className="t-h4" style={{ margin: 0 }}>
                  {f.headline}
                </h3>
                <p className="t-dense" style={{ margin: 0, color: 'var(--fg-mute)' }}>
                  <EvidencePopover claim={f.detail} evidenceIds={f.evidence_ids} />
                </p>
              </div>
            </li>
          ))}
        </ol>
      )}
    </Zone>
  );
}
