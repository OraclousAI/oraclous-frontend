// Beat renderer. Each beat is drawn from the corpus and follows Hook → Evidence → So-what.
// Provenance is shown: factual claims drill to their evidence. Content is role-aware where the
// spec calls for it (B15's closing CTA, the depth of the so-what).
import type { ReactNode } from 'react';
import { Zone, DomainTag, ConfidenceBadge, EvidencePopover } from '../components/primitives/index.js';
import { useCorpus } from '../lib/useCorpus.js';
import type { DomainCode, Finding } from '../corpus/types.js';
import type { Profile } from './journey.js';

function Beat({ hook, children, soWhat }: { hook: string; children: ReactNode; soWhat?: string | undefined }) {
  return (
    <Zone title={hook}>
      <div style={{ display: 'grid', gap: 'var(--sp-3)' }}>{children}</div>
      {soWhat && (
        <p
          className="t-body"
          style={{
            margin: 'var(--sp-4) 0 0',
            paddingLeft: 'var(--sp-3)',
            borderLeft: '3px solid var(--info)',
          }}
        >
          <span className="t-eyebrow" style={{ color: 'var(--fg-mute)' }}>
            SO WHAT
          </span>
          <br />
          {soWhat}
        </p>
      )}
    </Zone>
  );
}

function FindingLine({ f }: { f: Finding }) {
  return (
    <div style={{ display: 'grid', gap: 4 }}>
      <div style={{ display: 'flex', gap: 'var(--sp-2)', alignItems: 'center' }}>
        <DomainTag code={f.domain} />
        <strong className="t-body">{f.headline}</strong>
      </div>
      <p className="t-dense" style={{ margin: 0, color: 'var(--fg-mute)' }}>
        <EvidencePopover claim={f.detail} evidenceIds={f.evidence_ids} />
      </p>
    </div>
  );
}

const DOMAIN_NAME: Record<DomainCode, string> = {
  INT: 'Inside the company',
  USR: 'The customer side',
  FED: 'The cooperative',
  MKT: 'The market',
};

export function BeatView({ id, profile }: { id: string; profile: Profile }) {
  const c = useCorpus();
  const find = (n: number) => c.findings.find((f) => f.number === n) as Finding;
  const domainFindings = (d: DomainCode) => c.findingsByDomain(d);

  switch (id) {
    case 'B01':
      return (
        <Beat
          hook="The situation in one page"
          soWhat="Eurail has the foundation and the market tailwind, but ships no consumer AI while competitors do. The gap is execution, not strategy."
        >
          <p className="t-body" style={{ margin: 0 }}>
            A modern stack and one internal AI win, a publicly disliked chatbot, a 35-operator
            moat that isn't AI-exposed, and a market moving to AI faster than Eurail is. Four
            domains, twelve findings, all traceable.
          </p>
          <div style={{ display: 'flex', gap: 'var(--sp-2)', flexWrap: 'wrap' }}>
            {c.domains.map((d) => (
              <DomainTag key={d.code} code={d.code as DomainCode} />
            ))}
          </div>
        </Beat>
      );

    case 'B02':
      return (
        <Beat
          hook="Why now — the recent events"
          soWhat="The window is defined by events that already happened, not ones you can wait for."
        >
          <FindingLine f={find(9)} />
          <FindingLine f={find(12)} />
        </Beat>
      );

    case 'B03':
    case 'B04':
    case 'B05':
    case 'B06': {
      const dmap: Record<string, DomainCode> = { B03: 'INT', B04: 'USR', B05: 'FED', B06: 'MKT' };
      const d = dmap[id] as DomainCode;
      const dom = c.domainOf(d);
      return (
        <Beat
          hook={DOMAIN_NAME[d]}
          soWhat={dom?.central_opportunity}
        >
          {dom && (
            <p className="t-body" style={{ margin: 0 }}>
              {dom.current_state}
            </p>
          )}
          {domainFindings(d).map((f) => (
            <FindingLine key={f.number} f={f} />
          ))}
        </Beat>
      );
    }

    case 'B07':
      return (
        <Beat
          hook="If nothing changes — the inaction trajectory"
          soWhat="Inaction doesn't bankrupt Eurail; it slowly cedes the customer relationship to AI-native surfaces by default."
        >
          <FindingLine f={find(11)} />
        </Beat>
      );

    case 'B08':
      return (
        <Beat
          hook="The strategic frame — the Adoption Ladder"
          soWhat={c.ladderOrderRationale}
        >
          <ol style={{ listStyle: 'none', margin: 0, padding: 0, display: 'grid', gap: 'var(--sp-1)' }}>
            {[...c.ladder].sort((a, b) => b.level - a.level).map((l) => (
              <li key={l.level} style={{ display: 'flex', gap: 'var(--sp-2)', alignItems: 'baseline' }}>
                <span className="t-mono" style={{ color: 'var(--info)', fontWeight: 700 }}>L{l.level}</span>
                <span className="t-body"><strong>{l.name}</strong> — {l.tagline}</span>
              </li>
            ))}
          </ol>
        </Beat>
      );

    case 'B09':
      return (
        <Beat hook="Eight opportunities, ranked by leverage" soWhat="Five of eight are entirely within Eurail's perimeter to ship — they unblock the rest.">
          <ol style={{ margin: 0, paddingLeft: 'var(--sp-4)', display: 'grid', gap: 'var(--sp-1)' }}>
            {c.opportunities.map((o) => (
              <li key={o.number} className="t-dense">
                <strong>{o.name}</strong> — {o.layers.join(' ')} · {o.time_to_value}
              </li>
            ))}
          </ol>
        </Beat>
      );

    case 'B10':
      return (
        <Beat hook="The 24-month phasing" soWhat="The first customer-facing AI ships in month 4; the federation moat converts to working AI by month 18.">
          <div style={{ display: 'grid', gap: 'var(--sp-2)' }}>
            {c.phases.map((p) => (
              <div key={p.number}>
                <span className="t-eyebrow" style={{ color: 'var(--fg-mute)' }}>PHASE {p.number} · {p.window}</span>
                <p className="t-dense" style={{ margin: 0 }}><strong>{p.name}.</strong> {p.success_state}</p>
              </div>
            ))}
          </div>
        </Beat>
      );

    case 'B11':
      return (
        <Beat hook="Knowing it's working — six signals" soWhat="Each has a green / amber / red threshold at month 3, 6, and 12 — so a stalling program is caught early, when correction is cheap.">
          <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'grid', gap: 'var(--sp-1)' }}>
            {c.signals.map((s) => (
              <li key={s.number} className="t-dense">
                <strong>{s.number}. {s.name}</strong> <span style={{ color: 'var(--fg-mute)' }}>· checks at {s.checkpoints}</span>
              </li>
            ))}
          </ul>
        </Beat>
      );

    case 'B12':
      return (
        <Beat hook="The urgency clock" soWhat="The real deadline is the competitor calendar, not the regulatory one — and the cheapest move (AI search visibility) can start in days.">
          <FindingLine f={find(12)} />
        </Beat>
      );

    case 'B13': {
      const sample = [find(3), find(9), find(12)].flatMap((f) => f.evidence_ids).slice(0, 4);
      const recs = c.resolveEvidence(sample);
      return (
        <Beat hook="How we know this — the evidence" soWhat={`Every claim in this walk traces to one of ${c.corpusStats.evidence} records, each labelled for confidence and linked to its source.`}>
          <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'grid', gap: 'var(--sp-2)' }}>
            {recs.map((r) => (
              <li key={r.id} style={{ display: 'grid', gap: 2 }}>
                <div style={{ display: 'flex', gap: 'var(--sp-2)', alignItems: 'center' }}>
                  <span className="t-mono" style={{ fontSize: 11, color: 'var(--fg-mute)' }}>{r.id}</span>
                  <ConfidenceBadge label={r.label} level={r.confidence} />
                </div>
                <span className="t-dense">{r.claim}</span>
              </li>
            ))}
          </ul>
        </Beat>
      );
    }

    case 'B14': {
      const sample = c.conflicts.slice(0, 3);
      return (
        <Beat hook="Where the sources disagreed" soWhat={`All ${c.corpusStats.conflicts} disagreements are logged and resolved — disagreement is recorded, not smoothed over.`}>
          <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'grid', gap: 'var(--sp-2)' }}>
            {sample.map((cf) => (
              <li key={cf.id} className="t-dense">
                <strong>{cf.topic}</strong>
                <br />
                <span style={{ color: 'var(--fg-mute)' }}>{cf.synthesis_note}</span>
              </li>
            ))}
          </ul>
        </Beat>
      );
    }

    case 'B15': {
      const closing: Record<string, ReactNode> = {
        board: (
          <ol style={{ margin: 0, paddingLeft: 'var(--sp-4)', display: 'grid', gap: 4 }}>
            {c.threeAsks.map((a) => (
              <li key={a.number} className="t-dense"><strong>{a.title}.</strong> {a.detail.split('.')[0]}.</li>
            ))}
          </ol>
        ),
        commercial: (
          <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'grid', gap: 4 }}>
            {c.engagementModes.map((m) => (
              <li key={m.name} className="t-dense"><strong>{m.name}.</strong> {m.what_it_is.split('.')[0]}.</li>
            ))}
          </ul>
        ),
        technical: (
          <p className="t-dense" style={{ margin: 0 }}>
            Start with the Phase 0 foundations (AI gateway, audit log, eval harness) — then the
            month-4 chatbot replacement. The eight opportunities and the six signals are your
            backlog and your dashboard.
          </p>
        ),
        assurance: (
          <p className="t-dense" style={{ margin: 0 }}>
            The methodology, the {c.corpusStats.evidence}-record ledger, and the
            {' '}{c.corpusStats.conflicts} resolved conflicts are all browsable from the dashboard —
            every projection states its confidence and its limits.
          </p>
        ),
      };
      return (
        <Beat hook="What's next">
          {closing[profile.role]}
        </Beat>
      );
    }

    default:
      return null;
  }
}
