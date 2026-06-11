// Zone 6 — The document library. The five v2 source artifacts at full depth.
import { Zone } from '../primitives/index.js';
import { useCorpus } from '../../lib/useCorpus.js';

export function DocumentLibraryZone() {
  const { documents } = useCorpus();
  return (
    <Zone id="documents" kicker="THE ORIGINAL ARTIFACTS" title="Document library" topRule>
      <p className="t-body" style={{ maxWidth: '64ch', marginTop: 0, color: 'var(--fg-mute)' }}>
        The five purpose-built documents behind this dashboard. Each shares the same evidence
        ledger; read whichever matches how deep you need to go.
      </p>
      <ol style={{ listStyle: 'none', margin: 'var(--sp-4) 0 0', padding: 0, display: 'grid', gap: 'var(--sp-2)' }}>
        {documents.map((d) => (
          <li
            key={d.id}
            style={{
              display: 'grid',
              gridTemplateColumns: 'auto 1fr auto',
              gap: 'var(--sp-3)',
              alignItems: 'baseline',
              padding: 'var(--sp-3) var(--sp-4)',
              border: '1px solid var(--rule)',
              borderRadius: 'var(--r-3, 8px)',
            }}
          >
            <span className="t-mono" aria-hidden="true" style={{ fontSize: 16, fontWeight: 700, color: 'var(--fg-mute)' }}>
              {d.id}
            </span>
            <div style={{ display: 'grid', gap: 2 }}>
              <strong className="t-body">{d.title}</strong>
              <span className="t-dense" style={{ color: 'var(--fg-mute)' }}>
                {d.purpose}
              </span>
              <span className="t-caption" style={{ color: 'var(--fg-mute)' }}>
                {d.audience}
              </span>
            </div>
            <span className="t-mono t-caption" style={{ color: 'var(--fg-mute)', whiteSpace: 'nowrap' }}>
              {d.pages} pp
            </span>
          </li>
        ))}
      </ol>
    </Zone>
  );
}
