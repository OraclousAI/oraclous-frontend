// Zone 10 — Guided-journey entry. The persistent handoff to the onboarder.
import Link from 'next/link';

export function ChatEntryZone() {
  return (
    <section
      aria-labelledby="chatentry-h"
      style={{
        marginTop: 'var(--sp-10)',
        padding: 'var(--sp-8) var(--sp-6)',
        border: '1px solid var(--rule)',
        borderRadius: 'var(--r-4)',
        background: 'var(--bg-soft)',
        display: 'grid',
        gap: 'var(--sp-3)',
        justifyItems: 'start',
      }}
    >
      <p className="t-eyebrow" style={{ color: 'var(--fg-mute)', margin: 0 }}>
        RATHER BE GUIDED?
      </p>
      <h2 id="chatentry-h" className="t-h2" style={{ margin: 0, maxWidth: '20ch' }}>
        Get a path built for your role.
      </h2>
      <p className="t-body" style={{ margin: 0, maxWidth: '56ch', color: 'var(--fg)' }}>
        Answer four quick questions and the onboarder assembles a short, evidence-backed walk
        through exactly the parts of this analysis that matter to you.
      </p>
      <Link href="/chat" className="cta cta-primary" style={{ marginTop: 'var(--sp-1)' }}>
        Start the guided onboarder
        <span aria-hidden="true">→</span>
      </Link>
    </section>
  );
}
