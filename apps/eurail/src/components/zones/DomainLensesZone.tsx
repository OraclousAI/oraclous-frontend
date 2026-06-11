// Zone 3 — The four domain lenses (the primary navigational spine). One panel per domain.
import { Zone, DomainTag } from '../primitives/index.js';
import { useCorpus } from '../../lib/useCorpus.js';
import type { DomainCode } from '../../corpus/types.js';

export function DomainLensesZone() {
  const { domains, findingsByDomain } = useCorpus();

  return (
    <Zone
      id="domains"
      kicker="THE PRIMARY SPINE"
      title="Four lenses on one body of evidence"
      topRule
    >
      <p className="t-body" style={{ maxWidth: '64ch', marginTop: 0, color: 'var(--fg-mute)' }}>
        The analysis is organized along four domains. Enter at whichever matches your concern —
        each panel drills into its findings and their evidence.
      </p>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: 'var(--sp-3)',
          marginTop: 'var(--sp-4)',
        }}
      >
        {domains.map((d) => {
          const n = findingsByDomain(d.code as DomainCode).length;
          return (
            <article
              key={d.code}
              style={{
                border: '1px solid var(--rule)',
                borderRadius: 'var(--r-4)',
                padding: 'var(--sp-4)',
                display: 'grid',
                gap: 'var(--sp-2)',
                alignContent: 'start',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--sp-2)' }}>
                <DomainTag code={d.code as DomainCode} />
                <h3 className="t-h4" style={{ margin: 0 }}>
                  {d.name}
                </h3>
              </div>
              <p className="t-dense" style={{ margin: 0, color: 'var(--fg-mute)' }}>
                {d.covers}
              </p>
              <p className="t-body" style={{ margin: '0' }}>
                {d.current_state}
              </p>
              <dl style={{ margin: 'var(--sp-1) 0 0', display: 'grid', gap: 'var(--sp-2)' }}>
                <div>
                  <dt
                    className="t-eyebrow"
                    style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--fg-mute)' }}
                  >
                    <span aria-hidden="true" style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--warning)' }} />
                    CENTRAL RISK
                  </dt>
                  <dd className="t-dense" style={{ margin: 0 }}>
                    {d.central_risk}
                  </dd>
                </div>
                <div>
                  <dt
                    className="t-eyebrow"
                    style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--fg-mute)' }}
                  >
                    <span aria-hidden="true" style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--success)' }} />
                    CENTRAL OPPORTUNITY
                  </dt>
                  <dd className="t-dense" style={{ margin: 0 }}>
                    {d.central_opportunity}
                  </dd>
                </div>
              </dl>
              <a
                href={`#findings`}
                className="t-dense"
                style={{ color: 'var(--info)', marginTop: 'var(--sp-1)', textDecoration: 'none' }}
              >
                {n} finding{n === 1 ? '' : 's'} in this domain →
              </a>
            </article>
          );
        })}
      </div>
    </Zone>
  );
}
