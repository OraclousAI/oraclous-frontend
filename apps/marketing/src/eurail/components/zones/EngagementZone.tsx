// Zone 5b — Partnership & the three asks. The engagement half (serves the commercial /
// procurement reader): how Oraclous can help, the trust primitives, and the decisions that
// unlock a proof of concept.
import { Zone } from '../primitives/index.js';
import { useCorpus } from '../../lib/useCorpus.js';

export function EngagementZone() {
  const { engagementModes, trustPrimitives, threeAsks } = useCorpus();
  return (
    <Zone id="partnership" kicker="HOW ORACLOUS CAN HELP" title="Partnership & the three asks" topRule>
      <p className="t-body" style={{ maxWidth: '64ch', marginTop: 0, color: 'var(--fg-mute)' }}>
        Three engagement modes, four trust primitives that make AI shippable after the breach,
        and three single-decision asks that unlock a contained proof of concept.
      </p>

      {/* Engagement modes */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
          gap: 'var(--sp-3)',
          marginTop: 'var(--sp-4)',
        }}
      >
        {engagementModes.map((m) => (
          <article
            key={m.name}
            style={{
              border: '1px solid var(--rule)',
              borderRadius: 'var(--r-4)',
              padding: 'var(--sp-4)',
              display: 'grid',
              gap: 'var(--sp-2)',
              alignContent: 'start',
            }}
          >
            <h3 className="t-h4" style={{ margin: 0 }}>{m.name}</h3>
            <p className="t-dense" style={{ margin: 0 }}>{m.what_it_is}</p>
            <p className="t-dense" style={{ margin: 0 }}>
              <span className="t-eyebrow" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, color: 'var(--fg-mute)' }}>
                <span aria-hidden="true" style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--success)' }} />
                BEST WHEN
              </span>
              <br />
              {m.best_when}
            </p>
          </article>
        ))}
      </div>

      {/* Trust primitives */}
      <h3 className="t-h4" style={{ margin: 'var(--sp-8) 0 var(--sp-3)' }}>The four trust primitives</h3>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 'var(--sp-3)' }}>
        {trustPrimitives.map((t) => (
          <div key={t.name} style={{ display: 'grid', gap: 4 }}>
            <strong className="t-dense">{t.name}</strong>
            <span className="t-dense" style={{ color: 'var(--fg-mute)' }}>{t.what}</span>
          </div>
        ))}
      </div>

      {/* Three asks */}
      <h3 className="t-h4" style={{ margin: 'var(--sp-8) 0 var(--sp-3)' }}>The three asks</h3>
      <ol style={{ listStyle: 'none', margin: 0, padding: 0, display: 'grid', gap: 'var(--sp-2)' }}>
        {threeAsks.map((a) => (
          <li
            key={a.number}
            style={{
              display: 'grid',
              gridTemplateColumns: 'auto 1fr',
              gap: 'var(--sp-3)',
              padding: 'var(--sp-3) var(--sp-4)',
              border: '1px solid var(--rule)',
              borderLeft: '3px solid var(--info)',
              borderRadius: 'var(--r-3, 8px)',
            }}
          >
            <span className="t-mono" aria-hidden="true" style={{ fontSize: 18, fontWeight: 700, color: 'var(--info)' }}>
              {a.number}
            </span>
            <div style={{ display: 'grid', gap: 2 }}>
              <strong className="t-body">{a.title}</strong>
              <span className="t-dense" style={{ color: 'var(--fg-mute)' }}>{a.detail}</span>
            </div>
          </li>
        ))}
      </ol>
    </Zone>
  );
}
