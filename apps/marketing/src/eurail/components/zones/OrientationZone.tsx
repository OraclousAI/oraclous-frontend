// Zone 1 — Orientation band. What this is, the scope in numbers, and the two-path choice.
import { useCorpus } from '../../lib/useCorpus.js';
import { Icon } from '../primitives/index.js';

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <div style={{ display: 'grid', gap: 2 }}>
      <span className="t-mono" style={{ fontSize: 22, fontWeight: 600, lineHeight: 1 }}>
        {value}
      </span>
      <span className="t-caption" style={{ color: 'var(--fg-mute)' }}>
        {label}
      </span>
    </div>
  );
}

export function OrientationZone() {
  const { corpusStats } = useCorpus();
  return (
    <section aria-labelledby="orientation-h" style={{ scrollMarginTop: 72 }}>
      <p className="t-eyebrow" style={{ color: 'var(--fg-mute)', margin: '0 0 var(--sp-2)' }}>
        AI ADOPTION ANALYSIS · 2026
      </p>
      <h1 id="orientation-h" className="t-display" style={{ margin: '0 0 var(--sp-3)', maxWidth: '20ch' }}>
        The whole analysis, browsable by evidence.
      </h1>
      <p className="t-body-lg" style={{ margin: 0, maxWidth: '64ch', color: 'var(--fg)' }}>
        An evidence-backed read of where Eurail stands on AI — the diagnosis, the strategy, and
        the partnership path. Every claim traces to a record in the ledger, with its confidence
        label. Browse it yourself below, or let the onboarder build a path for your role.
      </p>

      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: 'var(--sp-8)',
          margin: 'var(--sp-6) 0',
          padding: 'var(--sp-4) 0',
          borderTop: '1px solid var(--border-hair)',
          borderBottom: '1px solid var(--border-hair)',
        }}
      >
        <Stat value={String(corpusStats.evidence)} label="evidence records" />
        <Stat value={String(corpusStats.conflicts)} label="conflicts resolved" />
        <Stat value={String(corpusStats.findings)} label="findings" />
        <Stat value={String(corpusStats.domains)} label="domains" />
        <Stat value={String(corpusStats.documents)} label="source documents" />
      </div>

      <div style={{ display: 'flex', gap: 'var(--sp-3)', flexWrap: 'wrap' }}>
        <a href="#/evidence" className="cta cta-primary">
          Browse the evidence
          <Icon name="hash" size={15} />
        </a>
        <button
          type="button"
          className="cta cta-secondary"
          onClick={() => window.dispatchEvent(new CustomEvent('eurail:open-onboarder'))}
        >
          Ask the onboarder
          <span aria-hidden="true">→</span>
        </button>
      </div>
    </section>
  );
}
