// Zone 7 — The evidence explorer. The full ledger, filterable by domain, confidence, and
// source type, with text search. The interactive appendix; the drill-down target for any claim.
import { useMemo, useState } from 'react';
import { Zone, ConfidenceBadge, DomainTag, Icon } from '../primitives/index.js';
import { useCorpus } from '../../lib/useCorpus.js';
import type { ConfidenceLevel, DomainCode } from '../../corpus/types.js';

const PAGE = 24;
type DomainFilter = DomainCode | 'ALL';
type ConfFilter = ConfidenceLevel | 'ALL';

const selectStyle: React.CSSProperties = {
  font: 'inherit',
  padding: '6px var(--sp-2)',
  borderRadius: 'var(--r-2)',
  border: '1px solid var(--rule)',
  background: 'var(--bg)',
  color: 'var(--fg)',
};

export function EvidenceExplorerZone() {
  const { evidence, evidenceSourceTypes, domainForEvidence } = useCorpus();
  const [domain, setDomain] = useState<DomainFilter>('ALL');
  const [conf, setConf] = useState<ConfFilter>('ALL');
  const [source, setSource] = useState<string>('ALL');
  const [q, setQ] = useState('');
  const [visible, setVisible] = useState(PAGE);

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return evidence.filter((e) => {
      if (domain !== 'ALL' && domainForEvidence(e) !== domain) return false;
      if (conf !== 'ALL' && e.confidence !== conf) return false;
      if (source !== 'ALL' && e.source.type !== source) return false;
      if (needle && !(e.claim + ' ' + e.raw + ' ' + e.source.name).toLowerCase().includes(needle))
        return false;
      return true;
    });
  }, [evidence, domain, conf, source, q, domainForEvidence]);

  // Any filter change resets the page window.
  const onFilter = <T,>(setter: (v: T) => void) => (v: T) => {
    setter(v);
    setVisible(PAGE);
  };

  return (
    <Zone id="evidence" kicker="THE LEDGER, INTERACTIVE" title="Evidence explorer" topRule>
      <p className="t-body" style={{ maxWidth: '64ch', marginTop: 0, color: 'var(--fg-mute)' }}>
        Every record behind the analysis — filter by domain, confidence, or source type, or
        search the claims. Each row shows its source and the verbatim text it rests on.
      </p>

      <div
        role="group"
        aria-label="Filter evidence"
        style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--sp-2)', alignItems: 'center', margin: 'var(--sp-3) 0 var(--sp-4)' }}
      >
        <label style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }} className="t-dense">
          <span className="t-caption" style={{ color: 'var(--fg-mute)' }}>Domain</span>
          <select style={selectStyle} value={domain} onChange={(e) => onFilter(setDomain)(e.target.value as DomainFilter)}>
            <option value="ALL">All</option>
            <option value="INT">Internal</option>
            <option value="USR">Customer</option>
            <option value="FED">Federation</option>
            <option value="MKT">Market</option>
          </select>
        </label>
        <label style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }} className="t-dense">
          <span className="t-caption" style={{ color: 'var(--fg-mute)' }}>Confidence</span>
          <select style={selectStyle} value={conf} onChange={(e) => onFilter(setConf)(e.target.value as ConfFilter)}>
            <option value="ALL">All</option>
            <option value="HIGH">High</option>
            <option value="MEDIUM">Medium</option>
            <option value="LOW">Low</option>
          </select>
        </label>
        <label style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }} className="t-dense">
          <span className="t-caption" style={{ color: 'var(--fg-mute)' }}>Source</span>
          <select style={selectStyle} value={source} onChange={(e) => onFilter(setSource)(e.target.value)}>
            <option value="ALL">All</option>
            {evidenceSourceTypes.map((t) => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
        </label>
        <label style={{ display: 'inline-flex', alignItems: 'center', gap: 6, flex: '1 1 200px' }}>
          <span className="t-caption" style={{ color: 'var(--fg-mute)', whiteSpace: 'nowrap' }}>Search</span>
          <input
            type="search"
            value={q}
            onChange={(e) => onFilter(setQ)(e.target.value)}
            placeholder="claim, source, or quote…"
            style={{ ...selectStyle, width: '100%' }}
          />
        </label>
      </div>

      <p className="t-dense" role="status" style={{ color: 'var(--fg-mute)', margin: '0 0 var(--sp-3)' }}>
        {filtered.length} of {evidence.length} records
      </p>

      {filtered.length === 0 ? (
        <p className="t-body" style={{ color: 'var(--fg-mute)' }}>
          No records match these filters. Broaden the domain, confidence, or source.
        </p>
      ) : (
        <>
          <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'grid', gap: 'var(--sp-2)' }}>
            {filtered.slice(0, visible).map((e) => {
              const dc = domainForEvidence(e);
              return (
                <li
                  key={e.id}
                  style={{
                    padding: 'var(--sp-3) var(--sp-4)',
                    border: '1px solid var(--rule)',
                    borderRadius: 'var(--r-3, 8px)',
                    display: 'grid',
                    gap: 'var(--sp-1)',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--sp-2)', flexWrap: 'wrap' }}>
                    <span className="t-mono" style={{ fontSize: 11, color: 'var(--fg-mute)' }}>{e.id}</span>
                    {dc && <DomainTag code={dc} />}
                    <ConfidenceBadge label={e.label} level={e.confidence} />
                  </div>
                  <p className="t-body" style={{ margin: 0 }}>{e.claim}</p>
                  <details>
                    <summary className="t-caption" style={{ color: 'var(--fg-mute)', cursor: 'pointer' }}>
                      Source &amp; verbatim
                    </summary>
                    <div style={{ display: 'grid', gap: 4, marginTop: 'var(--sp-1)' }}>
                      <a
                        href={e.source.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="t-caption"
                        style={{ color: 'var(--info)', display: 'inline-flex', alignItems: 'center', gap: 4 }}
                      >
                        {e.source.name} · {e.source.type}
                        <Icon name="external" size={12} />
                      </a>
                      <blockquote
                        className="t-dense"
                        style={{ margin: 0, paddingLeft: 'var(--sp-2)', borderLeft: '2px solid var(--border-hair)', color: 'var(--fg-mute)' }}
                      >
                        “{e.raw}”
                      </blockquote>
                    </div>
                  </details>
                </li>
              );
            })}
          </ul>
          {visible < filtered.length && (
            <button
              type="button"
              onClick={() => setVisible((v) => v + PAGE)}
              className="cta cta-secondary"
              style={{ marginTop: 'var(--sp-4)' }}
            >
              Show more ({filtered.length - visible} remaining)
            </button>
          )}
        </>
      )}
    </Zone>
  );
}
