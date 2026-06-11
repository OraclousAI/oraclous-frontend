// Zone 2 — Executive snapshot. The ten-second verdict as cards, each sourced to a finding.
import { Zone, DomainTag, EvidencePopover } from '../primitives/index.js';
import { useCorpus } from '../../lib/useCorpus.js';
import type { DomainCode, Finding } from '../../corpus/types.js';

const cardStyle: React.CSSProperties = {
  border: '1px solid var(--rule)',
  borderRadius: 'var(--r-4)',
  background: 'var(--bg)',
  padding: 'var(--sp-4)',
  display: 'grid',
  gap: 'var(--sp-2)',
  alignContent: 'start',
};

function CardLabel({ children }: { children: React.ReactNode }) {
  return (
    <span className="t-eyebrow" style={{ color: 'var(--fg-mute)' }}>
      {children}
    </span>
  );
}

export function SnapshotZone() {
  const { findings, domains, findingsByDomain } = useCorpus();
  const byNum = (n: number) => findings.find((f) => f.number === n) as Finding;
  const contradiction = byNum(3);
  const visibility = byNum(6);
  const urgency = byNum(12);

  return (
    <Zone id="snapshot" kicker="THE VERDICT IN TEN SECONDS" title="Executive snapshot" topRule>
      {/* The bottom line — the one statement a time-poor reader needs first. */}
      <p
        className="t-body-lg"
        style={{
          margin: '0 0 var(--sp-4)',
          padding: 'var(--sp-4)',
          maxWidth: '64ch',
          background: 'var(--bg-soft)',
          borderLeft: '4px solid var(--ink)',
          borderRadius: 'var(--r-2)',
          fontWeight: 500,
        }}
      >
        <span className="t-eyebrow" style={{ display: 'block', color: 'var(--fg-mute)', marginBottom: 4 }}>
          THE BOTTOM LINE
        </span>
        Eurail has the foundation and a growing, AI-ready market — but ships no consumer AI while
        competitors do. The advantage is real and the window is open; the constraint is execution,
        and the competitor calendar, not regulation, is the clock.
      </p>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(248px, 1fr))',
          gap: 'var(--sp-3)',
        }}
      >
        {/* AI maturity — the central contradiction */}
        <div style={{ ...cardStyle, gridColumn: 'span 1' }}>
          <CardLabel>AI maturity</CardLabel>
          <p className="t-h4" style={{ margin: 0 }}>
            Internal AI works. Public AI doesn't.
          </p>
          <p className="t-dense" style={{ margin: 0, color: 'var(--fg-mute)' }}>
            <EvidencePopover
              claim="82% satisfaction inside Zendesk; “poor quality artificial intelligence” on the public chatbot — same company."
              evidenceIds={contradiction.evidence_ids}
            />
          </p>
        </div>

        {/* Adoption ladder position */}
        <div style={cardStyle}>
          <CardLabel>Adoption ladder position</CardLabel>
          <p className="t-h4" style={{ margin: 0 }}>
            Near-term work sits on L1–L3
          </p>
          <p className="t-dense" style={{ margin: 0, color: 'var(--fg-mute)' }}>
            Layer 4 (federation AI) is where the 35-operator moat converts to advantage. Layer 5
            is out of the 24-month window.
          </p>
        </div>

        {/* AI search visibility */}
        <div style={cardStyle}>
          <CardLabel>AI search visibility</CardLabel>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 'var(--sp-2)' }}>
            <span className="t-mono" style={{ fontSize: 30, fontWeight: 700, lineHeight: 1 }}>
              38
            </span>
            <span className="t-dense" style={{ color: 'var(--fg-mute)' }}>
              / 100 today → 80+ target
            </span>
          </div>
          <div
            aria-hidden="true"
            style={{ height: 6, borderRadius: 'var(--r-pill)', background: 'var(--bg-soft)', overflow: 'hidden' }}
          >
            <div style={{ width: '38%', height: '100%', background: 'var(--warning)' }} />
          </div>
          <p className="t-dense" style={{ margin: 0, color: 'var(--fg-mute)' }}>
            <EvidencePopover
              claim="Zero presence on all four new AI distribution channels, with self-blocking configuration."
              evidenceIds={visibility.evidence_ids}
            />
          </p>
        </div>

        {/* Per-domain readiness */}
        <div style={{ ...cardStyle, gridColumn: 'span 1' }}>
          <CardLabel>Per-domain readiness</CardLabel>
          <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'grid', gap: 'var(--sp-2)' }}>
            {domains.map((d) => (
              <li key={d.code} style={{ display: 'flex', gap: 'var(--sp-2)', alignItems: 'baseline' }}>
                <DomainTag code={d.code as DomainCode} />
                <span className="t-dense" style={{ color: 'var(--fg-mute)' }}>
                  {findingsByDomain(d.code as DomainCode).length} findings · {d.central_risk.split('.')[0]}.
                </span>
              </li>
            ))}
          </ul>
        </div>

        {/* Headline risk */}
        <div style={{ ...cardStyle, borderLeft: '3px solid var(--warning)' }}>
          <CardLabel>The single headline risk</CardLabel>
          <p className="t-h4" style={{ margin: 0 }}>
            The competitor calendar is the clock
          </p>
          <p className="t-dense" style={{ margin: 0, color: 'var(--fg-mute)' }}>
            <EvidencePopover
              claim="Trainline shipped a 1M-conversation rail agent; the real deadline is the competitor calendar, not the regulatory one."
              evidenceIds={urgency.evidence_ids}
            />
          </p>
        </div>
      </div>
    </Zone>
  );
}
