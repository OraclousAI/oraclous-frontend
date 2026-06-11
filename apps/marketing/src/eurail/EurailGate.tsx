// Access landing for the /eurail surface (dev-only @eurail.com email verification). A full-screen,
// on-brand landing that introduces the report + Oraclous and carries the verify-by-code box — not a
// bare modal. On success the dev middleware sets an HttpOnly session cookie and we reload so the
// (now-authed) app + per-user history render.
//
// HONEST SCOPE: this is a client-side landing over STATIC page content (demo-level; bypassable via
// devtools), but the chat + history API underneath is genuinely gated server-side in dev. Real
// deployment enforcement is edge-auth / the Application Gateway.
import { useEffect, useState } from 'react';
import {
  getOnboarderIdentity,
  requestOnboarderCode,
  verifyOnboarderCode,
} from '@oraclous/api-client';

type Phase = 'checking' | 'intro' | 'email' | 'code' | 'authed';

interface Stats {
  evidence?: number;
  conflicts?: number;
  findings?: number;
  domains?: number;
  documents?: number;
}

// Faithful static render of the Oraclous lockup — the SAME chevron path + wordmark mask + mint cursor
// as Logo.astro (the real brand mark), so the gate's logo is identical to the app bar's. React can't
// use the Astro <Logo>, so this mirrors its finished (no-animation) geometry.
const WORDMARK = '/brand/oraclous-wordmark.png';
const CHEV = 'M 0,0 L 56,23 Q 62,25 62,30 L 62,36 Q 62,41 56,43 L 0,66 L 0,52 L 47,34 Q 48,33 47,32 L 0,13 Z';
function OraclousLogo({ height = 22 }: { height?: number }) {
  const h = height;
  const cap = h * 0.8889;
  const base = h * 0.0694;
  const chevW = cap * 0.9254;
  const wordW = h * 7.0139;
  const curH = cap;
  const curW = curH * 0.42;
  const wordX = chevW + cap * 0.42;
  const curEnd = wordW * 0.994 + cap * 0.24;
  const rootW = wordX + wordW * 0.994 + cap * 0.24 + curW;
  return (
    <span role="img" aria-label="Oraclous" style={{ position: 'relative', display: 'inline-block', height: h, width: rootW, lineHeight: 0, color: 'var(--ink)', verticalAlign: 'bottom' }}>
      <svg viewBox="0 0 62 67" aria-hidden="true" style={{ position: 'absolute', left: 0, bottom: base, height: cap, width: chevW, display: 'block' }}>
        <path d={CHEV} fill="currentColor" />
      </svg>
      <span
        aria-hidden="true"
        style={{
          position: 'absolute',
          bottom: 0,
          left: wordX,
          height: h,
          width: wordW,
          backgroundColor: 'currentColor',
          WebkitMaskImage: `url('${WORDMARK}')`,
          WebkitMaskRepeat: 'no-repeat',
          WebkitMaskPosition: 'left bottom',
          WebkitMaskSize: 'contain',
          maskImage: `url('${WORDMARK}')`,
          maskRepeat: 'no-repeat',
          maskPosition: 'left bottom',
          maskSize: 'contain',
        }}
      />
      {/* the live signal — the mint cursor blinks, exactly like Logo.astro */}
      <span className="is-blink" aria-hidden="true" style={{ position: 'absolute', bottom: base, left: wordX, height: curH, width: curW, background: 'var(--accent)', borderRadius: 1, transform: `translateX(${curEnd}px)` }} />
    </span>
  );
}

const overlay: React.CSSProperties = {
  position: 'fixed',
  inset: 0,
  zIndex: 1000,
  background: 'var(--bg)',
  overflowY: 'auto',
};

export function EurailGate({ stats = {} }: { stats?: Stats }) {
  const [phase, setPhase] = useState<Phase>('checking');
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    let alive = true;
    void getOnboarderIdentity().then((id) => {
      if (alive) setPhase(id ? 'authed' : 'intro');
    });
    return () => {
      alive = false;
    };
  }, []);

  if (phase === 'authed') return null; // verified — reveal the app

  async function submitEmail(e: React.FormEvent) {
    e.preventDefault();
    const v = email.trim();
    // @eurail.com, plus the admin test address (dev-only — mirrors the server allow-list).
    const ADMIN_TEST = ['r.jahankohan@gmail.com'];
    if (!/^[^@\s]+@eurail\.com$/i.test(v) && !ADMIN_TEST.includes(v.toLowerCase())) {
      setError('Please use your @eurail.com email address.');
      return;
    }
    setBusy(true);
    setError('');
    const r = await requestOnboarderCode(v);
    setBusy(false);
    if (r.ok) setPhase('code');
    else setError(r.error ?? 'Could not send a code.');
  }

  async function submitCode(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError('');
    const r = await verifyOnboarderCode(email.trim(), code.trim());
    setBusy(false);
    if (r.email) window.location.reload();
    else setError(r.error ?? 'Invalid code.');
  }

  const facts: string[] = [];
  if (stats.evidence) facts.push(`${stats.evidence} evidence records`);
  if (stats.conflicts) facts.push(`${stats.conflicts} conflicts logged & resolved`);
  if (stats.findings) facts.push(`${stats.findings} findings across ${stats.domains ?? 4} domains`);

  const concepts: { h: string; p: string }[] = [
    { h: 'Evidence-first', p: 'Every claim in the analysis traces to a source record, each carrying its own confidence label — nothing asserted that the evidence doesn’t support.' },
    { h: 'Browse it, or be guided', p: 'Read the whole analysis yourself, or let the AI onboarder assemble a short, role-tailored walk through exactly the parts that matter to you.' },
    { h: 'Grounded illustrations', p: 'Charts and diagrams are generated from the corpus and verified — a figure that can’t be cited is never drawn.' },
  ];

  return (
    // A full-page interstitial, not a true modal — no role="dialog"/aria-modal, since we don't trap
    // focus (and a mandatory gate has nowhere to Escape to); the headings carry the structure.
    <div style={overlay}>
      {/* app bar — Oraclous lockup links to the marketing home */}
      <div style={{ borderBottom: '1px solid var(--border-hair)' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto', padding: 'var(--sp-4) var(--sp-6)' }}>
          <a href="/" aria-label="Oraclous — home" style={{ display: 'inline-flex', color: 'var(--ink)', textDecoration: 'none' }}>
            <OraclousLogo height={22} />
          </a>
        </div>
      </div>

      <div
        style={{
          maxWidth: 1100,
          margin: '0 auto',
          padding: 'var(--sp-12) var(--sp-6) var(--sp-16)',
          display: 'grid',
          gap: 'var(--sp-10)',
          gridTemplateColumns: 'minmax(0, 1.18fr) minmax(290px, 0.82fr)',
          alignItems: 'stretch',
        }}
        className="eurail-gate-grid"
      >
        {/* left — what this is */}
        <div>
          <p className="t-eyebrow" style={{ color: 'var(--fg-mute)', margin: '0 0 var(--sp-3)' }}>
            AI ADOPTION ANALYSIS · 2026
          </p>
          <h1 id="eurail-gate-h" className="t-display" style={{ margin: '0 0 var(--sp-4)', maxWidth: '16ch' }}>
            Where Eurail stands on AI — read the evidence.
          </h1>
          <p className="t-body-lg" style={{ margin: '0 0 var(--sp-6)', maxWidth: '52ch', color: 'var(--fg)' }}>
            An independent, evidence-backed read of Eurail’s AI adoption position — the diagnosis, the
            strategy, and the partnership path — prepared by Oraclous.
          </p>

          {facts.length > 0 && (
            <p className="t-mono t-dense" style={{ color: 'var(--fg-mute)', margin: '0 0 var(--sp-8)', letterSpacing: '0.02em' }}>
              {facts.join(' · ')}.
            </p>
          )}

          <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'grid', gap: 'var(--sp-4)', maxWidth: '56ch' }}>
            {concepts.map((c) => (
              <li key={c.h} style={{ display: 'grid', gridTemplateColumns: 'auto 1fr', gap: 'var(--sp-3)', alignItems: 'start' }}>
                <span aria-hidden="true" className="t-mono" style={{ color: 'var(--ink)', fontWeight: 700, lineHeight: 1.5 }}>
                  &gt;
                </span>
                <span>
                  <span className="t-body" style={{ fontWeight: 650 }}>{c.h}.</span>{' '}
                  <span className="t-body" style={{ color: 'var(--fg-mute)' }}>{c.p}</span>
                </span>
              </li>
            ))}
          </ul>
        </div>

        {/* right — verify, set apart by a single full-height hairline (an editorial sidebar, NOT a card) */}
        <aside
          className="eurail-gate-verify"
          style={{
            borderLeft: '1px solid var(--rule)',
            paddingLeft: 'var(--sp-12)',
            alignSelf: 'stretch',
            display: 'flex',
            flexDirection: 'column',
            gap: 'var(--sp-6)',
          }}
        >
          <div style={{ display: 'grid', gap: 'var(--sp-2)' }}>
            <p className="t-eyebrow" style={{ color: 'var(--fg-mute)', margin: 0 }}>Restricted access</p>
            <h2 className="t-h3" style={{ margin: 0 }}>Access the report</h2>
          </div>

          {phase === 'checking' && (
            <p className="t-dense" style={{ color: 'var(--fg-mute)', margin: 0 }}>Checking access…</p>
          )}

          {phase === 'intro' && (
            <div style={{ display: 'grid', gap: 'var(--sp-5)' }}>
              <p className="t-dense" style={{ margin: 0, color: 'var(--fg-mute)', maxWidth: '36ch' }}>
                This analysis is restricted to Eurail. Verify your{' '}
                <strong style={{ color: 'var(--fg)' }}>@eurail.com</strong> email to read the full report and chat with the onboarder.
              </p>
              <button
                type="button"
                className="cta cta-primary"
                onClick={() => {
                  setError('');
                  setPhase('email');
                }}
                style={{ justifyContent: 'space-between' }}
              >
                Verify with email
                <span aria-hidden="true" style={{ lineHeight: 1 }}>→</span>
              </button>
            </div>
          )}

          {phase === 'email' && (
            <form onSubmit={submitEmail} style={{ display: 'grid', gap: 'var(--sp-5)' }}>
              <p className="t-dense" style={{ margin: 0, color: 'var(--fg-mute)', maxWidth: '36ch' }}>
                Enter your work email — we’ll send a one-time code.
              </p>
              <div style={{ display: 'grid', gap: 'var(--sp-2)' }}>
                <label htmlFor="eurail-gate-email" className="t-caption" style={{ color: 'var(--fg-mute)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                  Work email
                </label>
                <div className="eurail-gate-line">
                  <span aria-hidden="true" className="t-mono eurail-gate-prompt">&gt;</span>
                  <input
                    id="eurail-gate-email"
                    type="email"
                    autoComplete="email"
                    autoCapitalize="none"
                    spellCheck={false}
                    autoFocus
                    required
                    value={email}
                    onChange={(ev) => setEmail(ev.target.value)}
                    placeholder="you@eurail.com"
                    className="eurail-gate-field"
                  />
                </div>
              </div>
              <button type="submit" className="cta cta-primary" disabled={busy} style={{ justifyContent: 'space-between', opacity: busy ? 0.6 : 1 }}>
                {busy ? 'Sending…' : 'Send code'}
                <span aria-hidden="true" style={{ lineHeight: 1 }}>→</span>
              </button>
            </form>
          )}

          {phase === 'code' && (
            <form onSubmit={submitCode} style={{ display: 'grid', gap: 'var(--sp-5)' }}>
              <p className="t-dense" style={{ margin: 0, color: 'var(--fg)' }}>
                Code sent to <strong>{email}</strong>.
              </p>
              <div style={{ display: 'grid', gap: 'var(--sp-2)' }}>
                <label htmlFor="eurail-gate-code" className="t-caption" style={{ color: 'var(--fg-mute)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                  6-digit code
                </label>
                <div className="eurail-gate-line">
                  <span aria-hidden="true" className="t-mono eurail-gate-prompt">&gt;</span>
                  <input
                    id="eurail-gate-code"
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    pattern="[0-9]*"
                    maxLength={6}
                    autoFocus
                    required
                    value={code}
                    onChange={(ev) => setCode(ev.target.value.replace(/\D/g, ''))}
                    placeholder="000000"
                    className="eurail-gate-field"
                    style={{ letterSpacing: '0.5em', fontFamily: 'var(--font-mono)' }}
                  />
                </div>
              </div>
              <button type="submit" className="cta cta-primary" disabled={busy || code.length < 6} style={{ justifyContent: 'space-between', opacity: busy || code.length < 6 ? 0.5 : 1 }}>
                {busy ? 'Verifying…' : 'Verify & enter'}
                <span aria-hidden="true" style={{ lineHeight: 1 }}>→</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setPhase('email');
                  setCode('');
                  setError('');
                }}
                className="t-dense"
                style={{ background: 'none', border: 'none', color: 'var(--info)', cursor: 'pointer', padding: 0, justifySelf: 'start' }}
              >
                Use a different email
              </button>
            </form>
          )}

          {error && (
            <p role="alert" className="t-dense" style={{ color: 'var(--error)', margin: 0 }}>
              {error}
            </p>
          )}

          <p className="t-caption" style={{ marginTop: 'auto', color: 'var(--fg-mute)', paddingTop: 'var(--sp-6)' }}>
            Access is restricted to Eurail and recorded. Codes expire in 10 minutes.
          </p>
        </aside>
      </div>

      <style>{`
        .eurail-gate-line {
          display: flex;
          align-items: baseline;
          gap: var(--sp-2);
          border-bottom: 1.5px solid var(--rule);
          padding-bottom: var(--sp-2);
          transition: border-color 160ms ease;
        }
        /* Focus indicator must read at 3:1 — mint (≈1.7:1 on paper) is too faint, so the focused
           underline goes to high-contrast --ink (the mint ">" prompt stays as the brand accent). */
        .eurail-gate-line:focus-within { border-bottom-color: var(--ink); border-bottom-width: 2px; }
        .eurail-gate-prompt { color: var(--ink); font-weight: 700; flex: none; }
        .eurail-gate-field {
          flex: 1;
          min-width: 0;
          width: 100%;
          border: none;
          background: transparent;
          outline: none;
          font: inherit;
          font-size: 1.0625rem;
          color: var(--fg);
          padding: 0;
        }
        .eurail-gate-field::placeholder { color: var(--fg-mute); }
        @media (max-width: 800px) {
          .eurail-gate-grid { grid-template-columns: 1fr !important; }
          .eurail-gate-verify {
            border-left: none !important;
            padding-left: 0 !important;
            border-top: 1px solid var(--rule);
            padding-top: var(--sp-8) !important;
          }
        }
      `}</style>
    </div>
  );
}
