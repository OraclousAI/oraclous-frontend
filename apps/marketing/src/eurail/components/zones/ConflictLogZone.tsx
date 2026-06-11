// Zone 8 — The conflict log. The 24 logged source-disagreements, all resolved. A credibility
// feature, surfaced as one.
import { useState } from 'react';
import { Zone } from '../primitives/index.js';
import { useCorpus } from '../../lib/useCorpus.js';

export function ConflictLogZone() {
  const { conflicts } = useCorpus();
  const [open, setOpen] = useState(false);
  const shown = open ? conflicts : conflicts.slice(0, 6);

  return (
    <Zone id="conflicts" kicker="WHERE SOURCES DISAGREED" title="Conflict log" topRule>
      <p className="t-body" style={{ maxWidth: '64ch', marginTop: 0, color: 'var(--fg-mute)' }}>
        Every place the sources disagreed — {conflicts.length} of them — logged with how it was
        resolved and the synthesis taken. Disagreement is recorded, not hidden.
      </p>
      <ol style={{ listStyle: 'none', margin: 'var(--sp-4) 0 0', padding: 0, display: 'grid', gap: 'var(--sp-2)' }}>
        {shown.map((c) => (
          <li
            key={c.id}
            style={{ border: '1px solid var(--rule)', borderRadius: 'var(--r-3, 8px)', overflow: 'hidden' }}
          >
            <details>
              <summary
                style={{
                  cursor: 'pointer',
                  padding: 'var(--sp-3) var(--sp-4)',
                  display: 'flex',
                  gap: 'var(--sp-2)',
                  alignItems: 'baseline',
                }}
              >
                <span className="t-mono t-caption" style={{ color: 'var(--fg-mute)' }}>{c.id}</span>
                <span className="t-body" style={{ fontWeight: 500 }}>{c.topic}</span>
              </summary>
              <div style={{ padding: '0 var(--sp-4) var(--sp-4)', display: 'grid', gap: 'var(--sp-2)' }}>
                <p className="t-dense" style={{ margin: 0 }}>{c.summary}</p>
                {c.explanation && (
                  <p className="t-dense" style={{ margin: 0, color: 'var(--fg-mute)' }}>{c.explanation}</p>
                )}
                <p className="t-dense" style={{ margin: 0 }}>
                  <span
                    className="t-eyebrow"
                    style={{ display: 'inline-flex', alignItems: 'center', gap: 6, color: 'var(--fg-mute)' }}
                  >
                    <span aria-hidden="true" style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--success)' }} />
                    {c.resolution} — SYNTHESIS
                  </span>
                  <br />
                  {c.synthesis_note}
                </p>
              </div>
            </details>
          </li>
        ))}
      </ol>
      {conflicts.length > 6 && (
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="cta cta-secondary"
          aria-expanded={open}
          style={{ marginTop: 'var(--sp-4)' }}
        >
          {open ? 'Show fewer' : `Show all ${conflicts.length} conflicts`}
        </button>
      )}
    </Zone>
  );
}
