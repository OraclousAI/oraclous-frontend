// Zone 5 — The strategic frame ("what to do"): the Adoption Ladder, the 8 opportunities, the
// 24-month phasing, and the 6 early-warning signals.
import { Zone, DomainTag } from '../primitives/index.js';
import { useCorpus } from '../../lib/useCorpus.js';
import type { DomainCode } from '../../corpus/types.js';

function SubHeading({ children }: { children: React.ReactNode }) {
  return (
    <h3 className="t-h3" style={{ margin: 'var(--sp-8) 0 var(--sp-3)' }}>
      {children}
    </h3>
  );
}

function Ladder() {
  const { ladder, ladderOrderRationale } = useCorpus();
  // Render top (L5) to bottom (L1) so the eye climbs.
  const top = [...ladder].sort((a, b) => b.level - a.level);
  return (
    <>
      <SubHeading>The Eurail AI Adoption Ladder</SubHeading>
      <p className="t-dense" style={{ maxWidth: '64ch', marginTop: 0, color: 'var(--fg-mute)' }}>
        {ladderOrderRationale}
      </p>
      <ol style={{ listStyle: 'none', margin: 'var(--sp-3) 0 0', padding: 0, display: 'grid', gap: 2 }}>
        {top.map((l) => (
          <li
            key={l.level}
            style={{
              display: 'grid',
              gridTemplateColumns: 'auto 1fr',
              gap: 'var(--sp-3)',
              padding: 'var(--sp-3) var(--sp-4)',
              // "Out of window" is shown by a dashed border + an explicit label, never by
              // opacity or a darker fill (both push text below AA contrast — see L-008).
              border: l.in_window ? '1px solid var(--rule)' : '1px dashed var(--border-hair)',
              borderRadius: 'var(--r-3, 8px)',
              background: 'var(--bg)',
            }}
          >
            <span
              className="t-mono"
              aria-hidden="true"
              style={{ fontSize: 18, fontWeight: 700, color: 'var(--info)' }}
            >
              L{l.level}
            </span>
            <div style={{ display: 'grid', gap: 2 }}>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 'var(--sp-2)', flexWrap: 'wrap' }}>
                <strong className="t-body">{l.name}</strong>
                {!l.in_window && (
                  <span className="t-caption" style={{ color: 'var(--fg-mute)' }}>
                    out of 24-month window
                  </span>
                )}
              </div>
              <span className="t-dense" style={{ color: 'var(--fg-mute)' }}>
                {l.tagline}
              </span>
            </div>
          </li>
        ))}
      </ol>
    </>
  );
}

function Opportunities() {
  const { opportunities } = useCorpus();
  return (
    <>
      <SubHeading>Eight opportunities, ranked by leverage</SubHeading>
      <ol style={{ listStyle: 'none', margin: 0, padding: 0, display: 'grid', gap: 'var(--sp-2)' }}>
        {opportunities.map((o) => (
          <li
            key={o.number}
            style={{
              display: 'grid',
              gridTemplateColumns: 'auto 1fr',
              gap: 'var(--sp-3)',
              padding: 'var(--sp-3) var(--sp-4)',
              border: '1px solid var(--rule)',
              borderRadius: 'var(--r-3, 8px)',
            }}
          >
            <span className="t-mono" aria-hidden="true" style={{ fontSize: 18, fontWeight: 700, color: 'var(--fg-mute)' }}>
              {o.number}
            </span>
            <div style={{ display: 'grid', gap: 'var(--sp-1)' }}>
              <strong className="t-body">{o.name}</strong>
              <div style={{ display: 'flex', gap: 'var(--sp-2)', flexWrap: 'wrap', alignItems: 'center' }}>
                <DomainTag code={o.domain as DomainCode} />
                {o.layers.map((L) => (
                  <span key={L} className="t-mono" style={{ fontSize: 11, color: 'var(--info)' }}>
                    {L}
                  </span>
                ))}
                <span className="t-caption" style={{ color: 'var(--fg-mute)' }}>
                  ⏱ {o.time_to_value} · {o.governance}
                </span>
              </div>
            </div>
          </li>
        ))}
      </ol>
    </>
  );
}

function Phasing() {
  const { phases } = useCorpus();
  return (
    <>
      <SubHeading>The 24-month phasing</SubHeading>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: 'var(--sp-3)',
        }}
      >
        {phases.map((p) => (
          <article
            key={p.number}
            style={{
              border: '1px solid var(--rule)',
              borderTop: '3px solid var(--info)',
              borderRadius: 'var(--r-3, 8px)',
              padding: 'var(--sp-4)',
              display: 'grid',
              gap: 'var(--sp-2)',
              alignContent: 'start',
            }}
          >
            <span className="t-eyebrow" style={{ color: 'var(--fg-mute)' }}>
              PHASE {p.number} · {p.window}
            </span>
            <strong className="t-body">{p.name}</strong>
            <p className="t-dense" style={{ margin: 0, color: 'var(--fg-mute)' }}>
              {p.what_happens}
            </p>
            <p className="t-dense" style={{ margin: 0 }}>
              <span
                className="t-eyebrow"
                style={{ display: 'inline-flex', alignItems: 'center', gap: 6, color: 'var(--fg-mute)' }}
              >
                <span aria-hidden="true" style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--success)' }} />
                END STATE
              </span>
              <br />
              {p.success_state}
            </p>
          </article>
        ))}
      </div>
    </>
  );
}

function Signals() {
  const { signals, signalsEscalationRule } = useCorpus();
  // Tone is carried by a swatch (a UI element, ≥3:1), never by the text colour (which would
  // fail AA for --warning/--success). The label word is kept for colour-blind readers.
  const Threshold = ({ tone, label, value }: { tone: string; label: string; value: string }) => (
    <div style={{ display: 'flex', gap: 'var(--sp-2)', alignItems: 'baseline' }}>
      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, minWidth: 62 }}>
        <span aria-hidden="true" style={{ width: 8, height: 8, borderRadius: 2, background: tone, flex: 'none' }} />
        <span className="t-mono" style={{ fontSize: 10, fontWeight: 600, color: 'var(--fg)' }}>
          {label}
        </span>
      </span>
      <span className="t-dense">{value}</span>
    </div>
  );
  return (
    <>
      <SubHeading>Knowing it's working — six signals</SubHeading>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(248px, 1fr))',
          gap: 'var(--sp-3)',
        }}
      >
        {signals.map((s) => (
          <article
            key={s.number}
            style={{
              border: '1px solid var(--rule)',
              borderRadius: 'var(--r-3, 8px)',
              padding: 'var(--sp-4)',
              display: 'grid',
              gap: 'var(--sp-2)',
              alignContent: 'start',
            }}
          >
            <strong className="t-dense">
              {s.number}. {s.name}
            </strong>
            <span className="t-caption" style={{ color: 'var(--fg-mute)' }}>
              Checks at {s.checkpoints}
            </span>
            <div style={{ display: 'grid', gap: 4, marginTop: 2 }}>
              <Threshold tone="var(--success)" label="GREEN" value={s.green} />
              <Threshold tone="var(--warning)" label="AMBER" value={s.amber} />
              <Threshold tone="var(--error)" label="RED" value={s.red} />
            </div>
          </article>
        ))}
      </div>
      <p
        className="t-dense"
        style={{
          marginTop: 'var(--sp-3)',
          padding: 'var(--sp-3) var(--sp-4)',
          borderLeft: '3px solid var(--error)',
          background: 'var(--bg-soft)',
          borderRadius: 'var(--r-2)',
        }}
      >
        <strong>If signals trip red.</strong> {signalsEscalationRule}
      </p>
    </>
  );
}

export function StrategicFrameZone() {
  return (
    <Zone id="strategy" kicker="WHAT TO DO" title="The strategic frame" topRule>
      <p className="t-body" style={{ maxWidth: '64ch', marginTop: 0, color: 'var(--fg-mute)' }}>
        The action half: the ladder whose order is mandatory, the opportunities ranked by
        leverage, the four-phase plan, and the signals that tell you it's working.
      </p>
      <Ladder />
      <Opportunities />
      <Phasing />
      <Signals />
    </Zone>
  );
}
